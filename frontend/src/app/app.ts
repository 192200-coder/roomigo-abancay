import { AuthModalComponent } from './components/ui/modals/auth-modal/auth-modal.component';
import { LandingPageComponent } from './components/views/landingpage/landingpage.component';
import { TenantDashboardComponent } from './components/views/tenantdashboard/tenantdashboard.component';
import { OwnerDashboardComponent } from './components/views/ownerdashboard/ownerdashboard.component';
import { AdminDashboardComponent } from './components/views/admindashboard/admindashboard.component';
import { RoomCatalogComponent } from './components/views/roomcatalog/roomcatalog.component';
import { PropertyDetailComponent } from './components/views/property-detail/property-detail.component';
import { SignInComponent } from './components/views/signin/signin.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { NavbarComponent } from './components/layout/navbar/navbar.component';
import { MobileNavDrawerComponent } from './components/layout/mobile-nav-drawer/mobile-nav-drawer.component';
import { FooterComponent } from './components/layout/footer/footer.component';
import { RoomDetailModalComponent } from './components/ui/modals/room-detail-modal/room-detail-modal.component';
import { BookingModalComponent } from './components/ui/modals/booking-modal/booking-modal.component';
import { PublishRoomModalComponent } from './components/ui/modals/publish-room-modal/publish-room-modal.component';
import { ReviewModalComponent } from './components/ui/modals/review-modal/review-modal.component';
import { EditLocationModalComponent } from './components/ui/modals/edit-location-modal/edit-location-modal.component';
import { AdminEditRoomModalComponent } from './components/ui/modals/admin-edit-room-modal/admin-edit-room-modal.component';
import { AdminDeleteRoomModalComponent } from './components/ui/modals/admin-delete-room-modal/admin-delete-room-modal.component';
import { OwnerEditRoomModalComponent } from './components/ui/modals/owner-edit-room-modal/owner-edit-room-modal.component';
import { OwnerDeleteRoomModalComponent } from './components/ui/modals/owner-delete-room-modal/owner-delete-room-modal.component';
import { MpReceiptModalComponent } from './components/ui/modals/mp-receipt-modal/mp-receipt-modal.component';
import { EditProfileModalComponent } from './components/ui/modals/edit-profile-modal/edit-profile-modal.component';
import { SettingsModalComponent } from './components/ui/modals/settings-modal/settings-modal.component';
import { FavoritesComponent } from './components/views/favorites/favorites.component';
import { VisitModalComponent } from './components/ui/modals/visit-modal/visit-modal.component';
import { Component, OnInit, signal, computed, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RoomixApiService } from './core/roomix-api.service';
import { BOOKING_MAX_MONTHS, BOOKING_MIN_MONTHS, addMonthsIso, clampBookingMonths, tomorrowIsoDate } from './core/booking-dates';
import { AuthService } from './core/auth.service';
import { MercadoPagoService } from './core/mercado-pago.service';
import { FavoritesService } from './core/favorites.service';
import { MapSectionComponent } from './components/ui/map-section/map-section.component';
import {
  MAX_PHOTOS,
  PHOTO_CATEGORY_OPTIONS,
  REQUIRED_PHOTO_CATEGORIES,
  ROOM_TYPE_OPTIONS,
  audienceLabel,
  compressImage,
  formatPen,
  isForSale,
  mainPrice,
  normalizeRoomType,
  operationLabel,
  photoCategoryLabel,
  roomTypeLabel,
  roomTypeOption
} from './core/listings';
import {
  Room,
  RoomFilter,
  RoomType,
  ListingOperation,
  PhotoCategory,
  RoomPhoto,
  VisitRequest,
  VisitRequestStatus,
  Property,
  Booking,
  Review,
  UserRole,
  AdminStats,
  PaymentStatusResult
} from './core/models';

import { ViewEncapsulation } from '@angular/core';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ToastComponent,
    NavbarComponent,
    MobileNavDrawerComponent,
    LandingPageComponent,
    RoomCatalogComponent,
    PropertyDetailComponent,
    SignInComponent,
    TenantDashboardComponent,
    OwnerDashboardComponent,
    AdminDashboardComponent,
    RoomDetailModalComponent,
    BookingModalComponent,
    VisitModalComponent,
    PublishRoomModalComponent,
    ReviewModalComponent,
    EditLocationModalComponent,
    AdminEditRoomModalComponent,
    AdminDeleteRoomModalComponent,
    OwnerEditRoomModalComponent,
    OwnerDeleteRoomModalComponent,
    MpReceiptModalComponent,
    EditProfileModalComponent,
    SettingsModalComponent,
    FavoritesComponent,
    AuthModalComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css', encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  // Navigation & View
  readonly activeTab = signal<'explore' | 'catalog' | 'favorites' | 'room-detail' | 'sign-in' | 'my-bookings' | 'owner-panel' | 'admin-panel'>('explore');

  // Rooms State
  readonly rooms = signal<Room[]>([]);
  readonly loadingRooms = signal<boolean>(false);
  readonly selectedRoom = signal<Room | null>(null);
  readonly roomReviews = signal<Review[]>([]);

  // Search & Filter State (Orientado a la Provincia de Abancay, Región Apurímac)
  searchKeyword = '';
  selectedCity = '';
  selectedDistrict = '';
  selectedRoomType: RoomType | '' = '';
  /** Alquiler, venta o ambas (''). */
  selectedOperation: ListingOperation | '' = '';
  /** Máximo mensual (solo alquiler). */
  maxPrice: number = 1200;
  /** Precio máximo de venta (null = sin límite). */
  maxSalePrice: number | null = null;
  /** Mínimo de dormitorios (0 = cualquiera). */
  minBedrooms = 0;
  filterBathroom = false;
  filterWifi = false;
  filterPets = false;
  activeChip = 'all';

  // Modals Visibility
  readonly showAuthModal = signal<boolean>(false);
  readonly authMode = signal<'login' | 'register' | 'forgot'>('login');
  readonly showDetailModal = signal<boolean>(false);
  readonly showBookingModal = signal<boolean>(false);
  readonly showNewRoomModal = signal<boolean>(false);
  readonly showReviewModal = signal<boolean>(false);

  // Auth Form State
  authEmail = '';
  authPassword = '';
  authConfirmPassword = '';
  readonly showAuthPassword = signal<boolean>(false);
  readonly showAuthConfirmPassword = signal<boolean>(false);
  authFirstName = '';
  authLastName = '';
  authPhone = '';
  authRole: UserRole = 'ROLE_TENANT';
  authError = '';
  authSuccessMessage = '';
  authLoading = false;
  authRememberMe = false;
  authSocialLoading = false;

  // Real Social Authentication State (Google & Facebook con Verificación de Correo OTP)
  readonly showSocialModal = signal<boolean>(false);
  readonly socialProvider = signal<'GOOGLE' | 'FACEBOOK'>('GOOGLE');
  readonly socialStep = signal<'FORM' | 'OTP'>('FORM');
  socialEmail = '';
  socialFirstName = '';
  socialLastName = '';
  socialRole: UserRole = 'ROLE_TENANT';
  socialCode = '';
  socialLoading = false;
  socialError = '';
  socialSuccessMsg = '';
  socialExpiresIn = 600;
  socialDevCode = '';
  private socialTimerInterval: any = null;

  get formattedSocialTime(): string {
    const mins = Math.floor(this.socialExpiresIn / 60);
    const secs = this.socialExpiresIn % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Password Recovery State
  authResetEmail = '';
  authResetCode = '';
  authNewPassword = '';
  authResetStep: 'REQUEST_CODE' | 'ENTER_NEW_PASSWORD' = 'REQUEST_CODE';
  authResetLoading = false;
  authResetSuccessMessage = '';

  // Booking Form State con Pasarela Integral de Mercado Pago (Perú)
  // Reserva por meses: el inquilino elige fecha de inicio + duración; la fecha de fin se calcula.
  bookingStartDate = '';
  bookingMonths = 1;
  readonly bookingMonthPresets = [1, 3, 6, 12];
  readonly bookingMinMonths = BOOKING_MIN_MONTHS;
  readonly bookingMaxMonths = BOOKING_MAX_MONTHS;
  bookingNotes = '';
  bookingSubmitting = false;

  // Billeteras Digitales Oficiales (Yape & Plin) configurables por Administrador
  readonly yapeQrImage = signal<string>(
    localStorage.getItem('roomix_yape_qr') || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=YAPE_BCP_983456789_ROOMIX_ABANCAY'
  );
  readonly plinQrImage = signal<string>(
    localStorage.getItem('roomix_plin_qr') || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PLIN_INTERBANK_983456789_ROOMIX_ABANCAY'
  );
  readonly walletPhone = signal<string>(
    localStorage.getItem('roomix_wallet_phone') || '983 456 789'
  );
  readonly walletBeneficiary = signal<string>(
    localStorage.getItem('roomix_wallet_beneficiary') || 'Roomix Abancay Oficial'
  );

  // Pagos con Mercado Pago Checkout Pro: comprobante al volver de la pasarela
  readonly showMpSuccessReceipt = signal<boolean>(false);
  mpReceiptData: PaymentStatusResult | null = null;
  /** Checkout que se está creando ('booking-12' / 'room-5'); evita dobles clics. */
  payingTargetId: string | null = null;
  confirmingPayment = false;

  // Review Form State
  reviewRating = 5;
  reviewComment = '';
  reviewBookingId: number | null = null;
  reviewSubmitting = false;

  // Owner Panel State
  readonly myProperties = signal<Property[]>([]);
  readonly ownerRooms = signal<Room[]>([]);
  readonly ownerBookings = signal<Booking[]>([]);
  readonly tenantBookings = signal<Booking[]>([]);
  /** Pedidos de visita recibidos (propietario) y enviados (inquilino). */
  readonly ownerVisits = signal<VisitRequest[]>([]);
  readonly tenantVisits = signal<VisitRequest[]>([]);
  private updatingVisitId: number | null = null;

  // Visit Modal State (publicaciones en venta)
  readonly showVisitModal = signal<boolean>(false);
  visitRoom: Room | null = null;
  visitDate = '';
  visitTime = '';
  visitPhone = '';
  visitMessage = '';
  visitSubmitting = false;

  // Mobile Hamburger Menu State
  readonly mobileMenuOpen = signal<boolean>(false);

  // Tenant Panel Filter
  readonly tenantFilter = signal<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPLORE' | 'VISITS'>('ALL');

  // Owner Panel Functional Tabs & Filters
  readonly ownerTab = signal<'requests' | 'properties' | 'stats' | 'explore' | 'visits'>('properties');
  readonly ownerBookingFilter = signal<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');

  get filteredTenantBookings(): Booking[] {
    const filter = this.tenantFilter();
    const list = this.tenantBookings();
    if (filter === 'ALL') return list;
    return list.filter(b => b.status === filter);
  }

  getTenantConfirmedBookingTotal(): number {
    return this.tenantBookings()
      .filter(booking => booking.status === 'CONFIRMED')
      .reduce((total, booking) => total + booking.totalPrice, 0);
  }

  get filteredOwnerBookings(): Booking[] {
    const filter = this.ownerBookingFilter();
    const list = this.ownerBookings();
    if (filter === 'ALL') return list;
    return list.filter(b => b.status === filter);
  }

  getOwnerConfirmedBookingTotal(): number {
    return this.ownerBookings()
      .filter(booking => booking.status === 'CONFIRMED')
      .reduce((total, booking) => total + booking.totalPrice, 0);
  }

  getOwnerStatusCount(status: 'CONFIRMED' | 'PENDING' | 'REJECTED'): number {
    return this.ownerBookings().filter(b => b.status === status).length;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // Dashboard Offcanvas Drawer State (Menú de Hamburguesa para Paneles)
  readonly dashboardDrawerOpen = signal<boolean>(false);

  toggleDashboardDrawer(): void {
    this.dashboardDrawerOpen.update(v => !v);
  }

  closeDashboardDrawer(): void {
    this.dashboardDrawerOpen.set(false);
  }

  contactOwnerWhatsApp(phone?: string, roomTitle?: string): void {
    const raw = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (!raw) {
      this.showToast('El propietario no ha registrado un teléfono de contacto.', 'error');
      return;
    }
    const num = raw.startsWith('51') ? raw : '51' + raw;
    const msg = encodeURIComponent(`Hola, te contacto desde Roomix Abancay respecto a mi reserva confirmada de la habitación: ${roomTitle || 'en Abancay'}.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }

  contactTenantWhatsApp(phone?: string, tenantName?: string, roomTitle?: string): void {
    const raw = phone ? phone.replace(/[^0-9]/g, '') : '';
    if (!raw) {
      this.showToast('El inquilino no ha registrado un teléfono de contacto.', 'error');
      return;
    }
    const num = raw.startsWith('51') ? raw : '51' + raw;
    const msg = encodeURIComponent(`Hola ${tenantName || ''}, te escribo desde Roomix Abancay respecto a tu solicitud de alquiler para ${roomTitle || 'la habitación'}.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }

  // ==========================================
  // GESTIÓN DE CÓDIGOS QR Y BILLETERAS DIGITALES
  // ==========================================
  uploadYapeQr(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.yapeQrImage.set(base64);
        localStorage.setItem('roomix_yape_qr', base64);
        this.showToast('¡Código QR de Yape cargado con éxito!', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPlinQr(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.plinQrImage.set(base64);
        localStorage.setItem('roomix_plin_qr', base64);
        this.showToast('¡Código QR de Plin cargado con éxito!', 'success');
      };
      reader.readAsDataURL(file);
    }
  }

  updateWalletInfo(phone: string, beneficiary: string): void {
    if (phone.trim()) {
      this.walletPhone.set(phone.trim());
      localStorage.setItem('roomix_wallet_phone', phone.trim());
    }
    if (beneficiary.trim()) {
      this.walletBeneficiary.set(beneficiary.trim());
      localStorage.setItem('roomix_wallet_beneficiary', beneficiary.trim());
    }
    this.showToast('Datos de Billeteras actualizados correctamente', 'success');
  }

  getRoomsForProperty(propertyId: number): Room[] {
    return this.ownerRooms().filter(r => r.propertyId === propertyId);
  }

  // New Room Form State con Pasarela de Pago Obligatoria (Yape / Plin)
  newRoomPropertyId: number | null = null;
  newRoomPropertyMode: 'select' | 'manual' = 'select';
  manualPropertyTitle = '';
  manualPropertyAddress = '';
  manualPropertyDistrict = 'Tamburco';

  // Fotos de la publicación: 3 obligatorias (fachada, habitación, baño) + adicionales.
  newRoomRequiredPhotos: Record<'FACADE' | 'ROOM' | 'BATHROOM', string | null> = { FACADE: null, ROOM: null, BATHROOM: null };
  newRoomExtraPhotos: RoomPhoto[] = [];
  /** Fotos que se están comprimiendo: bloquea el envío hasta que terminen. */
  newRoomPhotosProcessing = 0;
  readonly requiredPhotoCategories = REQUIRED_PHOTO_CATEGORIES as ('FACADE' | 'ROOM' | 'BATHROOM')[];

  newRoomOperation: ListingOperation = 'RENT';
  newRoomTitle = '';
  newRoomDescription = '';
  newRoomPrice = 320;
  newRoomDeposit = 150;
  newRoomSalePrice: number | null = null;
  newRoomBedrooms: number | null = null;
  newRoomBathrooms: number | null = null;
  newRoomLandArea: number | null = null;
  newRoomType: RoomType = 'ROOM';
  newRoomBathroom = true;
  newRoomCapacity = 1;
  newRoomSize: number | null = 18;
  newRoomWifi = true;
  newRoomPets = false;
  /** Tarifa de publicación por defecto; el backend la cobra por Mercado Pago (Room.publicationFeeAmount). */
  readonly publicationFee: number = 15.00;
  newRoomSubmitting = false;

  // Billeteras Digitales Publicación Fields (Yape / Plin / Tarjetas)

  // General Administrator Mode State (Abancay)
  readonly pendingRooms = signal<Room[]>([]);
  readonly adminStats = signal<AdminStats | null>(null);
  readonly adminAllRooms = signal<Room[]>([]);
  readonly loadingAdmin = signal<boolean>(false);
  readonly adminTab = signal<'crud' | 'pending' | 'reports' | 'explore' | 'wallets'>('crud');
  adminSearchKeyword = '';
  adminFilterStatus = 'ALL';

  // Admin Edit Room Modal State
  readonly showAdminEditModal = signal<boolean>(false);
  adminEditingRoom: Room | null = null;
  adminEditTitle = '';
  adminEditPrice = 0;
  adminEditDeposit = 0;
  adminEditType: RoomType = 'ROOM';
  adminEditSalePrice: number | null = null;
  adminEditStatus = 'AVAILABLE';
  adminEditBathroom = false;
  adminEditWifi = false;
  adminEditPets = false;
  adminEditSaving = false;

  // Admin Delete Room Modal State
  readonly showAdminDeleteModal = signal<boolean>(false);
  adminDeletingRoom: Room | null = null;
  adminDeletingLoading = false;

  // Owner Edit Room Modal State
  readonly showOwnerEditModal = signal<boolean>(false);
  ownerEditingRoom: Room | null = null;
  ownerEditTitle = '';
  ownerEditDescription = '';
  ownerEditPrice = 0;
  ownerEditDeposit = 0;
  ownerEditType: RoomType = 'ROOM';
  ownerEditSalePrice: number | null = null;
  ownerEditBathroom = false;
  ownerEditWifi = false;
  ownerEditPets = false;
  ownerEditMainImageUrl = '';
  ownerEditSaving = false;

  // Owner Delete Room Modal State
  readonly showOwnerDeleteModal = signal<boolean>(false);
  ownerDeletingRoom: Room | null = null;
  ownerDeletingLoading = false;

  // Google Maps State (Abancay, Apurímac)
  readonly activeMapZone = signal<string>('all');
  readonly currentMapUrl = signal<string>(
    'https://maps.google.com/maps?q=Abancay,+Apurimac,+Peru&t=&z=14&ie=UTF8&iwloc=&output=embed'
  );

  get safeMapUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.currentMapUrl());
  }

  // Star Rating Interactive State
  readonly hoverRating = signal<number>(0);

  // Admin Manual Location State
  readonly showEditLocationModal = signal<boolean>(false);
  editLocationRoom: Room | null = null;
  editAddress = '';
  editDistrict = 'Abancay Centro';
  editReference = '';
  editLatitude = '-13.6339';
  editLongitude = '-72.8814';
  editLocationSaving = false;

  // Toast Notification State
  readonly toast = signal<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  private toastTimeout: any;

  constructor(
    public auth: AuthService,
    private api: RoomixApiService,
    public mpService: MercadoPagoService,
    public favorites: FavoritesService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Reserva por defecto: desde mañana, por 1 mes
    this.bookingStartDate = tomorrowIsoDate();
    this.bookingMonths = BOOKING_MIN_MONTHS;

    // Load initial rooms for Abancay
    this.loadRooms();

    // ¿Volvemos de Mercado Pago? Confirmar el pago con el backend
    this.handlePaymentReturn();
  }

  // ==========================================
  // ROOM SEARCH & FILTERS (ABANCAY, APURÍMAC)
  // ==========================================
  loadRooms(): void {
    this.loadingRooms.set(true);

    const filter: RoomFilter = { city: this.selectedCity.trim() || 'Abancay' };
    if (this.selectedRoomType) filter.roomType = this.selectedRoomType as RoomType;
    if (this.selectedOperation) filter.operation = this.selectedOperation;
    // El precio máximo depende de la operación: mensual en alquiler, de venta en venta.
    // Con «Todo» no se filtra por precio (mezclaría rentas con precios de venta).
    if (this.selectedOperation === 'RENT' && this.maxPrice < 1500) filter.maxPrice = this.maxPrice;
    if (this.selectedOperation === 'SALE' && this.maxSalePrice) filter.maxPrice = this.maxSalePrice;
    if (this.minBedrooms > 0) filter.minBedrooms = this.minBedrooms;
    if (this.filterBathroom) filter.privateBathroom = true;
    if (this.filterWifi) filter.offersWifi = true;
    if (this.filterPets) filter.acceptsPets = true;

    this.api.searchRooms(filter).subscribe({
      next: res => {
        if (res.success && res.data) {
          let list = (res.data.content || []).filter(r => r.status === 'AVAILABLE');
          if (this.searchKeyword.trim()) {
            const terms = this.normalizeSearchText(this.searchKeyword).split(' ').filter(Boolean);
            list = list.filter(room => {
              const searchableText = this.normalizeSearchText([
                room.title,
                room.description,
                room.propertyAddress,
                room.propertyCity,
                room.propertyDistrict,
                'Abancay Apurimac'
              ].filter(Boolean).join(' '));
              return terms.every(term => searchableText.includes(term));
            });
          }
          if (this.selectedDistrict) {
            const dist = this.normalizeSearchText(this.selectedDistrict);
            list = list.filter(r => 
              this.normalizeSearchText([
                r.title,
                r.description,
                r.propertyAddress,
                r.propertyCity,
                r.propertyDistrict
              ].filter(Boolean).join(' ')).includes(dist)
            );
          }
          this.rooms.set(list);
        }
        this.loadingRooms.set(false);
      },
      error: () => {
        this.loadingRooms.set(false);
        this.showToast('Error al cargar habitaciones del servidor', 'error');
      }
    });
  }

  private normalizeSearchText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  applyChipFilter(chip: string): void {
    this.activeChip = chip;
    this.searchKeyword = '';
    this.selectedCity = '';
    this.selectedDistrict = '';
    this.selectedRoomType = '';
    this.filterBathroom = false;
    this.filterWifi = false;
    this.filterPets = false;
    this.maxPrice = 1200;
    this.selectedOperation = '';
    this.maxSalePrice = null;
    this.minBedrooms = 0;

    if (chip === 'unamba') {
      this.searchKeyword = 'UNAMBA';
      this.selectedDistrict = 'Tamburco';
    } else if (chip === 'centro') {
      this.searchKeyword = 'Centro';
      this.selectedDistrict = 'Centro';
    } else if (chip === 'utea') {
      this.searchKeyword = 'UTEA';
    } else if (chip === 'tamburco') {
      this.selectedDistrict = 'Tamburco';
    } else if (chip === 'patibamba') {
      this.searchKeyword = 'Patibamba';
      this.selectedDistrict = 'Patibamba';
    } else if (chip === 'americas' || chip === 'fonavi') {
      this.searchKeyword = 'Américas';
      this.selectedDistrict = 'Americas/Fonavi';
    } else if (chip === 'bathroom') {
      this.filterBathroom = true;
    } else if (chip === 'wifi') {
      this.filterWifi = true;
    } else if (chip === 'cheap') {
      this.selectedOperation = 'RENT';
      this.maxPrice = 300;
    } else if (chip === 'sale') {
      this.selectedOperation = 'SALE';
    } else if (chip === 'all') {
      this.searchKeyword = '';
      this.selectedDistrict = '';
    }

    this.loadRooms();
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedCity = '';
    this.selectedDistrict = '';
    this.selectedRoomType = '';
    this.selectedOperation = '';
    this.maxPrice = 1200;
    this.maxSalePrice = null;
    this.minBedrooms = 0;
    this.filterBathroom = false;
    this.filterWifi = false;
    this.filterPets = false;
    this.activeChip = 'all';
    this.loadRooms();
  }

  // Etiquetas y precios de publicaciones (core/listings.ts) expuestos a las plantillas.
  readonly roomTypeOptions = ROOM_TYPE_OPTIONS;
  readonly photoCategoryOptions = PHOTO_CATEGORY_OPTIONS;
  readonly maxPhotos = MAX_PHOTOS;

  getRoomTypeName(type?: string): string {
    return roomTypeLabel(type);
  }

  roomTypeIcon(type?: string): string {
    return roomTypeOption(type).icon;
  }

  audienceLabel(type?: string): string {
    return audienceLabel(type);
  }

  operationLabel(operation?: ListingOperation | null): string {
    return operationLabel(operation);
  }

  isForSale(room?: Room | null): boolean {
    return isForSale(room);
  }

  photoCategoryLabel(category?: PhotoCategory | null): string {
    return photoCategoryLabel(category);
  }

  /** Precio principal formateado: renta mensual o precio de venta. */
  priceText(room: Room): string {
    return formatPen(mainPrice(room));
  }

  /** «/ mes» en alquiler; vacío en venta. */
  priceSuffix(room: Room): string {
    return isForSale(room) ? '' : ' / mes';
  }

  formatPen(amount?: number | null): string {
    return formatPen(amount);
  }

  isFavorite(roomId: number): boolean {
    return this.favorites.isFavorite(roomId);
  }

  toggleFavorite(room: Room): void {
    const wasFavorite = this.favorites.isFavorite(room.id);
    if (!this.favorites.toggle(room)) {
      this.showToast('No se pudo guardar el favorito en este dispositivo', 'error');
      return;
    }
    this.showToast(wasFavorite ? 'Habitación eliminada de favoritos' : 'Habitación guardada en favoritos', 'success');
  }

  getRoomStatusName(status?: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'OCCUPIED': return 'Ocupado';
      case 'RENTED': return 'Alquilado';
      case 'PENDING_APPROVAL': return 'Pendiente de Aprobación';
      case 'MAINTENANCE': return 'En Mantenimiento';
      case 'REJECTED': return 'Rechazado';
      case 'SOLD': return 'Vendido';
      default: return status || 'Disponible';
    }
  }

  getRoomStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'AVAILABLE': return 'hero-badge-available';
      case 'OCCUPIED': return 'hero-badge-occupied';
      case 'RENTED': return 'hero-badge-rented';
      case 'PENDING_APPROVAL': return 'hero-badge-pending';
      case 'MAINTENANCE': return 'hero-badge-maintenance';
      case 'REJECTED': return 'hero-badge-rejected';
      case 'SOLD': return 'hero-badge-rented';
      default: return 'hero-badge-available';
    }
  }

  // ==========================================
  // ROOM DETAILS & REVIEWS
  // ==========================================
  openRoomDetails(room: Room): void {
    this.selectedRoom.set(room);
    this.showDetailModal.set(true);
    this.loadRoomReviews(room);
    this.loadRoomGallery(room);
  }

  openRoomPage(room: Room): void {
    this.selectedRoom.set(room);
    this.showDetailModal.set(false);
    this.activeTab.set('room-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadRoomReviews(room);
    this.loadRoomGallery(room);
  }

  /**
   * Los listados no traen las fotos (pesan demasiado); el detalle sí. Se muestra la
   * publicación de inmediato y se completa con la galería cuando llega.
   */
  private loadRoomGallery(room: Room): void {
    if (room.photos?.length) return;
    this.api.getRoomById(room.id).subscribe({
      next: res => {
        const current = this.selectedRoom();
        // getRoomById tiene datos simulados de respaldo: solo se acepta la misma publicación.
        if (res.success && res.data?.id === room.id && current?.id === room.id) {
          this.selectedRoom.set({ ...current, ...res.data });
        }
      }
    });
  }

  private loadRoomReviews(room: Room): void {
    this.api.getReviewsByRoom(room.id).subscribe({
      next: res => {
        if (res.success) {
          this.roomReviews.set(res.data || []);
        }
      }
    });
  }

  closeRoomDetails(): void {
    this.showDetailModal.set(false);
  }

  // ==========================================
  // BOOKING MODAL & ACTIONS CON BILLETERA DIGITAL (YAPE / PLIN)
  // ==========================================
  openBookingModal(room: Room): void {
    if (isForSale(room)) {
      this.openVisitModal(room);
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.showToast('Inicia sesión para reservar esta habitación en Abancay', 'info');
      this.authMode.set('login');
      this.showAuthModal.set(true);
      return;
    }
    if (this.auth.isAdmin()) {
      this.showToast('Los administradores no pueden realizar reservas', 'info');
      return;
    }
    if (this.auth.isOwner()) {
      this.showToast('Las reservas son exclusivas para cuentas de inquilinos', 'info');
      return;
    }
    this.selectedRoom.set(room);
    this.showDetailModal.set(false);
    this.showBookingModal.set(true);
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
    this.resetBookingForm();
  }

  resetBookingForm(): void {
    this.bookingStartDate = tomorrowIsoDate();
    this.bookingMonths = BOOKING_MIN_MONTHS;
    this.bookingNotes = '';
    this.selectedRoom.set(null);
  }

  /** Fecha mínima seleccionable como inicio (el backend exige una fecha futura). */
  get bookingMinStartDate(): string {
    return tomorrowIsoDate();
  }

  /** Fecha de fin calculada: inicio + N meses (mismo criterio que el backend). */
  get bookingEndDate(): string {
    return addMonthsIso(this.bookingStartDate, this.bookingMonths);
  }

  setBookingMonths(months: number): void {
    this.bookingMonths = clampBookingMonths(months);
  }

  calculateBookingRent(): number {
    const room = this.selectedRoom();
    return room ? room.pricePerMonth * this.bookingMonths : 0;
  }

  calculateBookingTotal(): number {
    const room = this.selectedRoom();
    if (!room) return 0;
    return Math.round((this.calculateBookingRent() + room.depositPrice) * 100) / 100;
  }

  /** Lo que se cobra por Mercado Pago cuando el propietario aprueba: primer mes + depósito. */
  calculateBookingInitialPayment(): number {
    const room = this.selectedRoom();
    if (!room) return 0;
    return Math.round((room.pricePerMonth + room.depositPrice) * 100) / 100;
  }

  private validateBookingSelection(): boolean {
    if (!this.bookingStartDate || this.bookingStartDate < this.bookingMinStartDate) {
      this.showToast('Elige una fecha de inicio a partir de mañana.', 'error');
      return false;
    }
    if (this.bookingMonths < BOOKING_MIN_MONTHS || this.bookingMonths > BOOKING_MAX_MONTHS) {
      this.showToast(`El alquiler debe ser de ${BOOKING_MIN_MONTHS} a ${BOOKING_MAX_MONTHS} meses.`, 'error');
      return false;
    }
    return true;
  }

  submitBookingRequest(): void {
    const room = this.selectedRoom();
    if (!room || this.bookingSubmitting) return;
    if (!this.validateBookingSelection()) return;
    this.bookingSubmitting = true;
    this.api.createBooking({ roomId: room.id, startDate: this.bookingStartDate,
      months: this.bookingMonths, notes: this.bookingNotes }).subscribe({
      next: res => {
        this.bookingSubmitting = false;
        if (!res.success) {
          this.showToast(res.message || 'No se pudo enviar la solicitud.', 'error');
          return;
        }
        this.closeBookingModal();
        this.showToast('Solicitud enviada. Espera la respuesta del propietario.', 'success');
        this.activeTab.set('my-bookings');
        this.loadTenantBookings();
      },
      error: err => {
        this.bookingSubmitting = false;
        this.showToast(err.error?.message || 'No se pudo enviar la solicitud. Verifica la conexión.', 'error');
      }
    });
  }

  // ==========================================
  // TENANT DASHBOARD
  // ==========================================
  loadTenantBookings(): void {
    if (!this.auth.isLoggedIn()) return;
    this.api.getTenantBookings().subscribe({
      next: res => {
        if (res.success) {
          this.tenantBookings.set(res.data || []);
        }
      }
    });
    this.loadVisits();
  }

  // ==========================================
  // VISITAS A PUBLICACIONES EN VENTA
  // ==========================================
  /** Carga los pedidos de visita según el rol: recibidos (propietario) o enviados (inquilino). */
  loadVisits(): void {
    if (!this.auth.isLoggedIn()) return;
    if (this.auth.isOwner()) {
      this.api.getOwnerVisitRequests().subscribe({
        next: res => { if (res.success) this.ownerVisits.set(res.data || []); },
        error: () => this.showToast('No se pudieron cargar los pedidos de visita.', 'error')
      });
    } else if (!this.auth.isAdmin()) {
      this.api.getMyVisitRequests().subscribe({
        next: res => { if (res.success) this.tenantVisits.set(res.data || []); },
        error: () => this.showToast('No se pudieron cargar tus visitas.', 'error')
      });
    }
  }

  pendingVisitCount(): number {
    return this.ownerVisits().filter(v => v.status === 'PENDING').length;
  }

  openVisitModal(room: Room): void {
    if (!this.auth.isLoggedIn()) {
      this.showToast('Inicia sesión para agendar una visita', 'info');
      this.authMode.set('login');
      this.showAuthModal.set(true);
      return;
    }
    if (this.auth.isAdmin()) {
      this.showToast('Los administradores no agendan visitas', 'info');
      return;
    }
    if (this.auth.isOwner()) {
      this.showToast('Las visitas se agendan desde una cuenta de inquilino', 'info');
      return;
    }
    this.visitRoom = room;
    this.visitDate = tomorrowIsoDate();
    this.visitTime = '';
    this.visitPhone = this.auth.currentUser()?.phone || '';
    this.visitMessage = '';
    this.showDetailModal.set(false);
    this.showVisitModal.set(true);
  }

  closeVisitModal(): void {
    this.showVisitModal.set(false);
    this.visitRoom = null;
  }

  /** Hoy en formato yyyy-MM-dd (hora local): la visita puede ser desde hoy. */
  get visitMinDate(): string {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  submitVisitRequest(): void {
    const room = this.visitRoom;
    if (!room || this.visitSubmitting) return;
    if (!this.visitDate || this.visitDate < this.visitMinDate) {
      this.showToast('Elige una fecha desde hoy en adelante.', 'error');
      return;
    }
    const phone = this.visitPhone.trim();
    if (phone && !/^\+?[0-9 ]{6,20}$/.test(phone)) {
      this.showToast('El teléfono solo puede tener números y espacios.', 'error');
      return;
    }
    this.visitSubmitting = true;
    this.api.createVisitRequest({
      roomId: room.id,
      preferredDate: this.visitDate,
      preferredTime: this.visitTime || null,
      contactPhone: phone,
      message: this.visitMessage.trim()
    }).subscribe({
      next: res => {
        this.visitSubmitting = false;
        if (!res.success) {
          this.showToast(res.message || 'No se pudo enviar el pedido.', 'error');
          return;
        }
        this.closeVisitModal();
        this.showToast('Pedido enviado. El propietario confirmará la visita.', 'success');
        this.activeTab.set('my-bookings');
        this.tenantFilter.set('VISITS');
        this.loadVisits();
      },
      error: err => {
        this.visitSubmitting = false;
        this.showToast(err.error?.message || 'No se pudo enviar el pedido de visita.', 'error');
      }
    });
  }

  isUpdatingVisit(id: number): boolean {
    return this.updatingVisitId === id;
  }

  updateVisitStatus(visit: VisitRequest, status: VisitRequestStatus, note?: string): void {
    if (this.updatingVisitId) return;
    this.updatingVisitId = visit.id;
    this.api.updateVisitRequestStatus(visit.id, status, note).subscribe({
      next: res => {
        this.updatingVisitId = null;
        if (res.success) {
          const text = { CONFIRMED: 'Visita confirmada. Avisamos a la persona interesada.',
            DECLINED: 'Avisamos que no puedes en esa fecha.', CANCELLED: 'Visita cancelada.', PENDING: '' }[status];
          this.showToast(text, 'success');
          this.loadVisits();
        }
      },
      error: err => {
        this.updatingVisitId = null;
        this.showToast(err.error?.message || 'No se pudo actualizar la visita.', 'error');
      }
    });
  }

  /** Lleva al catálogo filtrado por publicaciones en venta. */
  browseSales(): void {
    this.applyChipFilter('sale');
    this.switchTab('catalog');
  }

  getTenantStatusCount(status: 'CONFIRMED' | 'PENDING' | 'REJECTED'): number {
    return this.tenantBookings().filter(b => b.status === status).length;
  }

  openReviewModal(bookingId: number): void {
    this.reviewBookingId = bookingId;
    this.reviewRating = 5;
    this.reviewComment = '';
    this.showReviewModal.set(true);
  }

  closeReviewModal(): void {
    this.showReviewModal.set(false);
    this.resetReviewForm();
  }

  resetReviewForm(): void {
    this.reviewRating = 5;
    this.reviewComment = '';
    this.reviewBookingId = null;
  }

  submitReview(): void {
    if (!this.reviewBookingId) return;
    if (!this.reviewComment.trim()) {
      this.showToast('Escribe una opinión sobre tu estadía en el cuarto', 'error');
      return;
    }

    this.reviewSubmitting = true;
    this.api.createReview({
      bookingId: this.reviewBookingId,
      rating: this.reviewRating,
      comment: this.reviewComment.trim()
    }).subscribe({
      next: res => {
        this.reviewSubmitting = false;
        if (res.success) {
          this.closeReviewModal();
          this.showToast('¡Reseña publicada exitosamente!', 'success');
          this.loadRooms();
        }
      },
      error: err => {
        this.reviewSubmitting = false;
        const msg = err.error?.message || 'Error al publicar la reseña';
        this.showToast(msg, 'error');
      }
    });
  }

  // ==========================================
  // OWNER DASHBOARD & PUBLICACIÓN CON PAGO POR BILLETERAS DIGITALES
  // ==========================================
  loadOwnerData(): void {
    if (!this.auth.isOwner()) return;

    this.api.getMyRooms().subscribe({
      next: res => { if (res.success) this.ownerRooms.set(res.data || []); },
      error: () => {
        this.ownerRooms.set([]);
        this.showToast('No se pudieron cargar tus habitaciones. Intenta actualizar el panel.', 'error');
      }
    });

    this.api.getMyProperties().subscribe({
      next: res => {
        if (res.success) {
          const props = res.data || [];
          this.myProperties.set(props);
          if (props.length > 0 && !this.newRoomPropertyId) {
            this.newRoomPropertyId = props[0].id;
          }
        }
      }
    });

    this.api.getOwnerBookings().subscribe({
      next: res => {
        if (res.success) {
          this.ownerBookings.set(res.data || []);
        }
      }
    });

    this.loadVisits();
  }

  updateBookingStatus(bookingId: number, status: 'CONFIRMED' | 'REJECTED'): void {
    this.api.updateBookingStatus(bookingId, status).subscribe({
      next: res => {
        if (res.success) {
          const actionText = status === 'CONFIRMED' ? 'confirmada' : 'rechazada';
          this.showToast(`Reserva ${actionText} exitosamente`, 'success');
          this.loadOwnerData();
          this.loadRooms();
        }
      },
      error: err => {
        const msg = err.error?.message || 'Error al actualizar reserva';
        this.showToast(msg, 'error');
      }
    });
  }

  openNewRoomModal(): void {
    if (!this.auth.isOwner()) {
      this.showToast('Debes ser propietario para publicar habitaciones', 'error');
      return;
    }
    this.resetNewRoomPhotos();
    this.manualPropertyTitle = '';
    this.manualPropertyAddress = '';
    this.manualPropertyDistrict = 'Tamburco';

    if (this.myProperties().length === 0) {
      this.newRoomPropertyMode = 'manual';
    } else {
      this.newRoomPropertyMode = 'select';
      this.newRoomPropertyId = this.myProperties()[0].id;
    }
    this.showNewRoomModal.set(true);
  }

  closeNewRoomModal(): void {
    this.showNewRoomModal.set(false);
    this.resetNewRoomForm();
  }

  resetNewRoomForm(): void {
    this.newRoomOperation = 'RENT';
    this.newRoomTitle = '';
    this.newRoomDescription = '';
    this.newRoomPrice = 320;
    this.newRoomDeposit = 150;
    this.newRoomSalePrice = null;
    this.newRoomBedrooms = null;
    this.newRoomBathrooms = null;
    this.newRoomLandArea = null;
    this.newRoomType = 'ROOM';
    this.newRoomBathroom = true;
    this.newRoomCapacity = 1;
    this.newRoomSize = 18;
    this.newRoomWifi = true;
    this.newRoomPets = false;
    this.resetNewRoomPhotos();
    this.manualPropertyTitle = '';
    this.manualPropertyAddress = '';
    this.manualPropertyDistrict = 'Tamburco';
    this.newRoomPropertyMode = 'select';
  }

  private resetNewRoomPhotos(): void {
    this.newRoomRequiredPhotos = { FACADE: null, ROOM: null, BATHROOM: null };
    this.newRoomExtraPhotos = [];
    this.newRoomPhotosProcessing = 0;
  }

  /** Alquiler o venta. Un cuarto solo se alquila: al pasar a venta se sugiere una casa. */
  setNewRoomOperation(operation: ListingOperation): void {
    this.newRoomOperation = operation;
    if (operation === 'SALE' && this.newRoomType === 'ROOM') this.setNewRoomType('HOUSE');
  }

  setNewRoomType(type: RoomType): void {
    if (this.newRoomOperation === 'SALE' && !roomTypeOption(type).allowsSale) return;
    this.newRoomType = type;
    // 18 m² es el valor por defecto de un cuarto: en otros tipos se deja vacío para que lo escriban.
    if (type !== 'ROOM' && this.newRoomSize === 18) this.newRoomSize = null;
    if (type === 'ROOM') {
      this.newRoomBedrooms = null;
      this.newRoomLandArea = null;
    }
  }

  get newRoomPhotoCount(): number {
    return this.requiredPhotoCategories.filter(c => this.newRoomRequiredPhotos[c]).length + this.newRoomExtraPhotos.length;
  }

  get newRoomMissingRequired(): string[] {
    return this.requiredPhotoCategories.filter(c => !this.newRoomRequiredPhotos[c]).map(c => photoCategoryLabel(c).toLowerCase());
  }

  /** Foto de un espacio obligatorio (fachada, habitación o baño). */
  onSelectRequiredPhoto(category: 'FACADE' | 'ROOM' | 'BATHROOM', event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.processPhoto(file, url => { this.newRoomRequiredPhotos = { ...this.newRoomRequiredPhotos, [category]: url }; });
  }

  removeRequiredPhoto(category: 'FACADE' | 'ROOM' | 'BATHROOM'): void {
    this.newRoomRequiredPhotos = { ...this.newRoomRequiredPhotos, [category]: null };
  }

  /** Fotos adicionales: hasta completar el máximo; por defecto «Sala o cocina». */
  onSelectExtraPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    const slots = MAX_PHOTOS - REQUIRED_PHOTO_CATEGORIES.length - this.newRoomExtraPhotos.length - this.newRoomPhotosProcessing;
    if (slots <= 0) {
      this.showToast(`Ya tienes el máximo de ${MAX_PHOTOS} fotos`, 'info');
      return;
    }
    if (files.length > slots) {
      this.showToast(`Solo se agregarán ${slots} ${slots === 1 ? 'foto' : 'fotos'} más (máximo ${MAX_PHOTOS})`, 'info');
    }
    for (const file of files.slice(0, slots)) {
      this.processPhoto(file, url => {
        this.newRoomExtraPhotos = [...this.newRoomExtraPhotos, { url, category: 'LIVING_KITCHEN' }];
      });
    }
  }

  removeExtraPhoto(index: number): void {
    this.newRoomExtraPhotos = this.newRoomExtraPhotos.filter((_, i) => i !== index);
  }

  /** Comprime la foto en segundo plano (core/listings.compressImage) antes de guardarla en el formulario. */
  private processPhoto(file: File, done: (url: string) => void): void {
    this.newRoomPhotosProcessing++;
    compressImage(file)
      .then(url => this.ngZone.run(() => done(url)))
      .catch(() => this.ngZone.run(() => this.showToast(`No se pudo leer «${file.name}». Prueba con otra foto (JPG o PNG).`, 'error')))
      .finally(() => this.ngZone.run(() => {
        this.newRoomPhotosProcessing--;
        this.cdr.detectChanges();
      }));
  }

  /**
   * Fotos en el orden en que se mostrarán. La primera es la portada del catálogo:
   * el cuarto para quien busca un cuarto; la fachada para casas y departamentos.
   */
  private buildNewRoomPhotos(): RoomPhoto[] {
    const order: ('FACADE' | 'ROOM' | 'BATHROOM')[] = this.newRoomType === 'ROOM'
      ? ['ROOM', 'BATHROOM', 'FACADE']
      : ['FACADE', 'ROOM', 'BATHROOM'];
    const required = order
      .filter(c => this.newRoomRequiredPhotos[c])
      .map(c => ({ url: this.newRoomRequiredPhotos[c] as string, category: c as PhotoCategory }));
    return [...required, ...this.newRoomExtraPhotos];
  }

  submitRoomWithoutPayment(): void {
    if (this.newRoomSubmitting) return;
    if (!this.newRoomTitle.trim()) {
      this.showToast('El título de la publicación es obligatorio', 'error');
      return;
    }
    if (this.newRoomPhotosProcessing > 0) {
      this.showToast('Espera a que terminen de cargar las fotografías.', 'info');
      return;
    }
    if (this.newRoomMissingRequired.length) {
      this.showToast(`Faltan fotos obligatorias: ${this.newRoomMissingRequired.join(', ')}.`, 'error');
      return;
    }
    const forSale = this.newRoomOperation === 'SALE';
    if (forSale && !(this.newRoomSalePrice && this.newRoomSalePrice > 0)) {
      this.showToast('Indica el precio de venta.', 'error');
      return;
    }
    if (!forSale && !(this.newRoomPrice > 0)) {
      this.showToast('Indica la renta mensual.', 'error');
      return;
    }
    if (this.newRoomPropertyMode === 'manual') {
      if (!this.manualPropertyTitle.trim() || !this.manualPropertyAddress.trim()) {
        this.showToast('Ingresa el nombre del inmueble y la dirección.', 'error');
        return;
      }
      this.newRoomSubmitting = true;
      this.api.createProperty({
        title: this.manualPropertyTitle.trim(),
        description: `Inmueble ubicado en ${this.manualPropertyDistrict}, Abancay`,
        address: `${this.manualPropertyAddress.trim()} (${this.manualPropertyDistrict})`,
        city: 'Abancay', country: 'Perú'
      }).subscribe({
        next: res => {
          if (!res.success || !res.data) {
            this.newRoomSubmitting = false;
            this.showToast(res.message || 'No se pudo crear el inmueble.', 'error');
            return;
          }
          this.newRoomPropertyId = res.data.id;
          this.newRoomPropertyMode = 'select';
          this.loadOwnerData();
          this.executeCreateRoom(res.data.id);
        },
        error: err => {
          this.newRoomSubmitting = false;
          this.showToast(err.error?.message || 'No se pudo crear el inmueble.', 'error');
        }
      });
      return;
    }
    if (!this.newRoomPropertyId) {
      this.showToast('Selecciona un inmueble o crea uno nuevo.', 'error');
      return;
    }
    this.newRoomSubmitting = true;
    this.executeCreateRoom(this.newRoomPropertyId);
  }

  private executeCreateRoom(propertyId: number): void {
    const forSale = this.newRoomOperation === 'SALE';
    const hasRooms = this.newRoomType !== 'ROOM';
    this.api.createRoom({
      propertyId: propertyId,
      title: this.newRoomTitle.trim(),
      description: this.newRoomDescription.trim(),
      operation: this.newRoomOperation,
      pricePerMonth: forSale ? null : this.newRoomPrice,
      depositPrice: forSale ? null : this.newRoomDeposit,
      salePrice: forSale ? this.newRoomSalePrice : null,
      roomType: this.newRoomType,
      privateBathroom: this.newRoomBathroom,
      capacity: this.newRoomCapacity,
      sizeSqm: this.newRoomSize || null,
      bedrooms: hasRooms ? this.newRoomBedrooms : null,
      bathrooms: hasRooms ? this.newRoomBathrooms : null,
      landAreaSqm: forSale && this.newRoomType === 'HOUSE' ? this.newRoomLandArea : null,
      offersWifi: !forSale && this.newRoomWifi,
      acceptsPets: !forSale && this.newRoomPets,
      photos: this.buildNewRoomPhotos()
    }).subscribe({
      next: res => {
        this.newRoomSubmitting = false;
        if (res.success) {
          this.closeNewRoomModal();
          this.showToast('Publicación enviada para revisión del administrador. Aún no aparece en el catálogo.', 'success');
          this.loadRooms();
          this.loadOwnerData();
        } else {
          this.showToast(res.message || 'No se pudo registrar la publicación.', 'error');
        }
      },
      error: err => {
        this.newRoomSubmitting = false;
        const msg = err.error?.message || 'Error al publicar';
        this.showToast(msg, 'error');
      }
    });
  }

  closeMpReceipt(): void {
    this.showMpSuccessReceipt.set(false);
    this.mpReceiptData = null;
  }

  // ==========================================
  // PAGOS CON MERCADO PAGO (CHECKOUT PRO)
  // El frontend solo redirige a Mercado Pago y pide al backend confirmar el pago;
  // nunca decide por sí mismo si un pago fue aprobado.
  // ==========================================

  /** Una reserva se paga cuando el propietario ya la aprobó y aún no está pagada. */
  canPayBooking(booking: Booking): boolean {
    return booking.status === 'CONFIRMED' && booking.paymentStatus !== 'COMPLETED';
  }

  isPaying(kind: 'booking' | 'room', id: number): boolean {
    return this.payingTargetId === `${kind}-${id}`;
  }

  payBooking(booking: Booking): void {
    if (this.payingTargetId || !this.canPayBooking(booking)) return;
    this.payingTargetId = `booking-${booking.id}`;
    this.mpService.startBookingCheckout(booking.id).subscribe({
      next: session => this.mpService.redirectToCheckout(session),
      error: err => {
        this.payingTargetId = null;
        this.showToast(this.paymentErrorMessage(err), 'error');
      }
    });
  }

  payPublication(room: Room): void {
    if (this.payingTargetId || room.publicationFeePaid) return;
    this.payingTargetId = `room-${room.id}`;
    this.mpService.startPublicationCheckout(room.id).subscribe({
      next: session => this.mpService.redirectToCheckout(session),
      error: err => {
        this.payingTargetId = null;
        this.showToast(this.paymentErrorMessage(err), 'error');
      }
    });
  }

  /** Vuelta desde Checkout Pro (?pago=resultado&payment_id=...): confirma con el backend y muestra el comprobante. */
  private handlePaymentReturn(): void {
    const result = this.mpService.readReturnParams();
    if (!result) return;
    this.mpService.clearReturnParams();

    if (!result.paymentId) {
      this.showToast('No se completó el pago. Puedes intentarlo de nuevo cuando quieras.', 'info');
      return;
    }
    if (!this.auth.isLoggedIn()) {
      this.showToast('Inicia sesión para ver el resultado de tu pago.', 'info');
      return;
    }

    this.confirmingPayment = true;
    this.mpService.confirmPayment(result.paymentId).subscribe({
      next: payment => {
        this.confirmingPayment = false;
        this.mpReceiptData = payment;
        this.showMpSuccessReceipt.set(true);
        if (payment.purpose === 'BOOKING') {
          this.activeTab.set('my-bookings');
          this.loadTenantBookings();
        } else {
          this.activeTab.set('owner-panel');
          this.ownerTab.set('properties');
          this.loadOwnerData();
        }
        this.loadRooms();
        const messages: Record<string, [string, 'success' | 'error' | 'info']> = {
          COMPLETED: ['¡Pago acreditado por Mercado Pago!', 'success'],
          PENDING: ['Tu pago está pendiente. Te avisaremos cuando Mercado Pago lo acredite.', 'info'],
          FAILED: ['El pago no fue aprobado. Puedes intentarlo con otro medio de pago.', 'error'],
          REFUNDED: ['Este pago fue reembolsado.', 'info']
        };
        const [text, type] = messages[payment.status] || messages['PENDING'];
        this.showToast(text, type);
      },
      error: err => {
        this.confirmingPayment = false;
        this.showToast(this.paymentErrorMessage(err), 'error');
      }
    });
  }

  private paymentErrorMessage(err: any): string {
    if (err?.status === 503) return 'Los pagos en línea aún no están disponibles. Intenta más tarde.';
    if (err?.status === 502) return 'Mercado Pago no respondió. Intenta nuevamente en unos minutos.';
    return err?.error?.message || 'No se pudo procesar el pago. Verifica tu conexión.';
  }

  // ==========================================
  // GESTIÓN DE PUBLICACIONES DEL PROPIETARIO (VER, EDITAR Y QUITAR)
  // ==========================================
  openOwnerEditRoomModal(room: Room): void {
    this.ownerEditingRoom = room;
    this.ownerEditTitle = room.title;
    this.ownerEditDescription = room.description || '';
    this.ownerEditPrice = room.pricePerMonth ?? 0;
    this.ownerEditDeposit = room.depositPrice ?? 0;
    this.ownerEditSalePrice = room.salePrice ?? null;
    this.ownerEditType = normalizeRoomType(room.roomType);
    this.ownerEditBathroom = room.privateBathroom;
    this.ownerEditWifi = room.offersWifi;
    this.ownerEditPets = room.acceptsPets;
    this.ownerEditMainImageUrl = room.mainImageUrl || '';
    this.showOwnerEditModal.set(true);
  }

  closeOwnerEditRoomModal(): void {
    this.showOwnerEditModal.set(false);
    this.ownerEditingRoom = null;
    this.ownerEditTitle = '';
    this.ownerEditDescription = '';
    this.ownerEditPrice = 0;
    this.ownerEditDeposit = 0;
    this.ownerEditMainImageUrl = '';
  }

  saveOwnerEditRoom(): void {
    if (!this.ownerEditingRoom) return;
    if (!this.ownerEditTitle.trim()) {
      this.showToast('El título del cuarto es obligatorio', 'error');
      return;
    }
    const forSale = isForSale(this.ownerEditingRoom);
    if (forSale && !(this.ownerEditSalePrice && this.ownerEditSalePrice > 0)) {
      this.showToast('El precio de venta debe ser mayor a 0', 'error');
      return;
    }
    if (!forSale && this.ownerEditPrice <= 0) {
      this.showToast('El precio mensual debe ser mayor a 0', 'error');
      return;
    }
    this.ownerEditSaving = true;
    const roomId = this.ownerEditingRoom.id;
    this.api.updateRoom(roomId, {
      title: this.ownerEditTitle.trim(),
      description: this.ownerEditDescription.trim(),
      pricePerMonth: forSale ? null : this.ownerEditPrice,
      depositPrice: forSale ? null : this.ownerEditDeposit,
      salePrice: forSale ? this.ownerEditSalePrice : null,
      roomType: this.ownerEditType,
      privateBathroom: this.ownerEditBathroom,
      offersWifi: this.ownerEditWifi,
      acceptsPets: this.ownerEditPets,
      mainImageUrl: this.ownerEditMainImageUrl.trim() || undefined
    }).subscribe({
      next: res => {
        this.ownerEditSaving = false;
        if (res.success) {
          this.closeOwnerEditRoomModal();
          this.showToast(`¡Publicación "${this.ownerEditTitle}" actualizada exitosamente!`, 'success');
          this.loadOwnerData();
          this.loadRooms();
        }
      },
      error: err => {
        this.ownerEditSaving = false;
        this.showToast(err.error?.message || 'Error al actualizar la publicación', 'error');
      }
    });
  }

  openOwnerDeleteRoomModal(room: Room): void {
    this.ownerDeletingRoom = room;
    this.showOwnerDeleteModal.set(true);
  }

  closeOwnerDeleteRoomModal(): void {
    this.showOwnerDeleteModal.set(false);
    this.ownerDeletingRoom = null;
  }

  executeOwnerDeleteRoom(): void {
    if (!this.ownerDeletingRoom) return;
    this.ownerDeletingLoading = true;
    const roomId = this.ownerDeletingRoom.id;
    const roomTitle = this.ownerDeletingRoom.title;
    this.api.deleteRoom(roomId).subscribe({
      next: res => {
        this.ownerDeletingLoading = false;
        if (res.success) {
          this.closeOwnerDeleteRoomModal();
          this.showToast(`Publicación "${roomTitle}" quitada exitosamente del sistema`, 'info');
          this.loadOwnerData();
          this.loadRooms();
        }
      },
      error: err => {
        this.ownerDeletingLoading = false;
        this.showToast(err.error?.message || 'Error al quitar la publicación', 'error');
      }
    });
  }

  // ==========================================
  // MODO ADMINISTRADOR GENERAL (ABANCAY, APURÍMAC)
  // ==========================================
  loadAdminData(): void {
    if (!this.auth.isAdmin()) return;
    this.loadingAdmin.set(true);

    this.api.getAdminStats().subscribe({
      next: res => {
        if (res.success) {
          this.adminStats.set(res.data);
        }
      }
    });

    this.api.getPendingRooms().subscribe({
      next: res => {
        if (res.success) {
          this.pendingRooms.set(res.data || []);
        }
        this.loadingAdmin.set(false);
      },
      error: () => this.loadingAdmin.set(false)
    });

    this.api.getAllRoomsAdmin().subscribe({
      next: res => {
        if (res.success) {
          this.adminAllRooms.set(res.data || []);
        }
      }
    });
  }

  approveRoom(room: Room): void {
    this.api.approveRoom(room.id).subscribe({
      next: res => {
        if (res.success) {
          this.showToast(`¡Anuncio "${room.title}" aprobado y publicado en Abancay!`, 'success');
          this.loadAdminData();
          this.loadRooms();
        }
      },
      error: err => {
        const msg = err.error?.message || 'Error al aprobar el anuncio';
        this.showToast(msg, 'error');
      }
    });
  }

  rejectRoom(room: Room): void {
    const reason = prompt('Motivo del rechazo de publicación:', 'Comprobante Yape/Plin no verificado o datos incompletos');
    if (reason === null) return;

    this.api.rejectRoom(room.id, reason).subscribe({
      next: res => {
        if (res.success) {
          this.showToast(`Anuncio "${room.title}" rechazado`, 'info');
          this.loadAdminData();
          this.loadRooms();
        }
      },
      error: err => {
        const msg = err.error?.message || 'Error al rechazar el anuncio';
        this.showToast(msg, 'error');
      }
    });
  }

  // ==========================================
  // GESTIÓN CRUD DE ANUNCIOS Y REPORTES (ADMIN GENERAL)
  // ==========================================
  get filteredAdminRooms(): Room[] {
    const kw = (this.adminSearchKeyword || '').trim().toLowerCase();
    const st = this.adminFilterStatus;
    return this.adminAllRooms().filter(r => {
      const matchKw = !kw ||
        (r.title && r.title.toLowerCase().includes(kw)) ||
        (r.propertyAddress && r.propertyAddress.toLowerCase().includes(kw)) ||
        (r.propertyCity && r.propertyCity.toLowerCase().includes(kw)) ||
        (r.ownerName && r.ownerName.toLowerCase().includes(kw)) ||
        (r.description && r.description.toLowerCase().includes(kw));
      const matchSt = st === 'ALL' || r.status === st;
      return matchKw && matchSt;
    });
  }

  adminRoomStatusCount(status: Room['status']): number {
    return this.adminAllRooms().filter(room => room.status === status).length;
  }

  get adminReportStats() {
    const rooms = this.adminAllRooms();
    const total = rooms.length;
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupied = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RENTED').length;
    const pending = this.pendingRooms().length;
    // Solo cuentan las tarifas efectivamente pagadas por Mercado Pago (antes se multiplicaba el total de cuartos)
    const feePaidRooms = rooms.filter(r => r.publicationFeePaid);
    const feesCollected = feePaidRooms.reduce((s, r) => s + (r.publicationFeeAmount ?? this.publicationFee), 0);
    const avgPrice = total > 0 ? Math.round(rooms.reduce((s, r) => s + (r.pricePerMonth || 0), 0) / total) : 0;
    const feePaidCount = feePaidRooms.length;
    const feePendingCount = total - feePaidCount;

    const tamburco = rooms.filter(r => {
      const txt = `${r.propertyAddress || ''} ${r.propertyCity || ''} ${r.title || ''}`.toLowerCase();
      return txt.includes('tamburco');
    }).length;

    const centro = rooms.filter(r => {
      const txt = `${r.propertyAddress || ''} ${r.propertyCity || ''} ${r.title || ''}`.toLowerCase();
      return txt.includes('centro') || txt.includes('plaza') || txt.includes('lima') || txt.includes('mercado');
    }).length;

    const utea = rooms.filter(r => {
      const txt = `${r.propertyAddress || ''} ${r.propertyCity || ''} ${r.title || ''}`.toLowerCase();
      return txt.includes('utea') || txt.includes('américa') || txt.includes('americas');
    }).length;

    const unamba = rooms.filter(r => {
      const txt = `${r.propertyAddress || ''} ${r.propertyCity || ''} ${r.title || ''}`.toLowerCase();
      return txt.includes('unamba') || txt.includes('arenas');
    }).length;

    return {
      total,
      available,
      occupied,
      pending,
      feesCollected,
      avgPrice,
      feePaidCount,
      feePendingCount,
      tamburco,
      centro,
      utea,
      unamba
    };
  }

  openAdminEditModal(room: Room): void {
    this.adminEditingRoom = room;
    this.adminEditTitle = room.title;
    this.adminEditPrice = room.pricePerMonth ?? 0;
    this.adminEditDeposit = room.depositPrice ?? 0;
    this.adminEditSalePrice = room.salePrice ?? null;
    this.adminEditType = normalizeRoomType(room.roomType);
    this.adminEditStatus = room.status;
    this.adminEditBathroom = room.privateBathroom;
    this.adminEditWifi = room.offersWifi;
    this.adminEditPets = room.acceptsPets;
    this.showAdminEditModal.set(true);
  }

  closeAdminEditModal(): void {
    this.showAdminEditModal.set(false);
    this.adminEditingRoom = null;
    this.adminEditTitle = '';
    this.adminEditPrice = 0;
    this.adminEditDeposit = 0;
    this.adminEditStatus = 'AVAILABLE';
  }

  saveAdminEditRoom(): void {
    if (!this.adminEditingRoom) return;
    if (!this.adminEditTitle.trim()) {
      this.showToast('El título del anuncio es obligatorio', 'error');
      return;
    }
    this.adminEditSaving = true;
    const roomId = this.adminEditingRoom.id;
    const forSale = isForSale(this.adminEditingRoom);
    this.api.updateRoomAdmin(roomId, {
      title: this.adminEditTitle.trim(),
      pricePerMonth: forSale ? null : this.adminEditPrice,
      depositPrice: forSale ? null : this.adminEditDeposit,
      salePrice: forSale ? this.adminEditSalePrice : null,
      roomType: this.adminEditType,
      status: this.adminEditStatus,
      privateBathroom: this.adminEditBathroom,
      offersWifi: this.adminEditWifi,
      acceptsPets: this.adminEditPets
    }).subscribe({
      next: res => {
        this.adminEditSaving = false;
        if (res.success) {
          this.closeAdminEditModal();
          this.showToast(`¡Anuncio #${roomId} actualizado correctamente por el Administrador!`, 'success');
          this.loadAdminData();
          this.loadRooms();
        }
      },
      error: err => {
        this.adminEditSaving = false;
        this.showToast(err.error?.message || 'Error al actualizar el anuncio', 'error');
      }
    });
  }

  openAdminDeleteModal(room: Room): void {
    this.adminDeletingRoom = room;
    this.showAdminDeleteModal.set(true);
  }

  closeAdminDeleteModal(): void {
    this.showAdminDeleteModal.set(false);
    this.adminDeletingRoom = null;
  }

  executeAdminDeleteRoom(): void {
    if (!this.adminDeletingRoom) return;
    this.adminDeletingLoading = true;
    const roomId = this.adminDeletingRoom.id;
    this.api.deleteRoomAdmin(roomId).subscribe({
      next: res => {
        this.adminDeletingLoading = false;
        if (res.success) {
          this.closeAdminDeleteModal();
          this.showToast(`Anuncio #${roomId} eliminado definitivamente del sistema`, 'info');
          this.loadAdminData();
          this.loadRooms();
        }
      },
      error: err => {
        this.adminDeletingLoading = false;
        this.showToast(err.error?.message || 'Error al eliminar el anuncio', 'error');
      }
    });
  }

  printAdminReport(): void {
    this.exportInventoryToPdf();
  }

  // ==========================================
  // EXPORTACIÓN DE AUDITORÍA DETALLADA (PDF & EXCEL)
  // ==========================================
  exportInventoryToExcel(): void {
    const rooms = this.adminAllRooms();
    if (!rooms || rooms.length === 0) {
      this.showToast('No hay datos en el inventario para exportar', 'info');
      return;
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString('es-PE', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

    let html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Auditoria Inventario General</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          th { background-color: #0052ff; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 11pt; text-align: left; }
          td { border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 10pt; font-family: Calibri, sans-serif; }
          .title { font-size: 16pt; font-weight: bold; color: #0052ff; }
          .subtitle { font-size: 10pt; color: #475569; }
          .price { font-weight: bold; color: #059669; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="8" class="title">ROOMIX ABANCAY - AUDITORÍA DETALLADA DEL INVENTARIO GENERAL</td></tr>
          <tr><td colspan="8" class="subtitle">Provincia de Abancay, Región Apurímac • Fecha de emisión: ${dateStr} ${timeStr} • Total registros: ${rooms.length} cuartos</td></tr>
          <tr><td colspan="8"></td></tr>
          <thead>
            <tr>
              <th style="width: 70px; text-align: center;">ID</th>
              <th style="width: 260px;">Habitación / Inmueble</th>
              <th style="width: 190px;">Propietario</th>
              <th style="width: 240px;">Dirección en Abancay</th>
              <th style="width: 130px; text-align: right;">Precio / Mes (PEN)</th>
              <th style="width: 110px; text-align: center;">Billetera</th>
              <th style="width: 140px; text-align: center;">Código Op.</th>
              <th style="width: 130px; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
    `;

    rooms.forEach(r => {
      const price = Number(r.pricePerMonth || 0).toFixed(2);
      const owner = r.ownerName || 'Propietario';
      const address = r.propertyAddress || 'Abancay';
      const wallet = r.paymentMethod || 'YAPE';
      const opCode = r.paymentReference || 'N/A';
      const statusText = r.status === 'AVAILABLE' ? 'DISPONIBLE' : (r.status === 'RENTED' ? 'ALQUILADO' : r.status);

      html += `
        <tr>
          <td style="text-align: center;">#${r.id}</td>
          <td><b>${r.title}</b></td>
          <td>${owner}</td>
          <td>${address}</td>
          <td class="price" style="text-align: right;">S/. ${price}</td>
          <td style="text-align: center;">${wallet}</td>
          <td style="text-align: center;">${opCode}</td>
          <td style="text-align: center;">${statusText}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Auditoria_Inventario_General_Abancay_${dateStr}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast('Auditoría del Inventario exportada a Excel exitosamente', 'success');
  }

  exportInventoryToPdf(): void {
    const rooms = this.adminAllRooms();
    if (!rooms || rooms.length === 0) {
      this.showToast('No hay datos en el inventario para imprimir', 'info');
      return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    const timeFormatted = now.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    const adminUser = this.auth.currentUser();
    const adminName = adminUser ? `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() : 'Administrador General';

    const printWindow = window.open('', '_blank', 'width=1050,height=800');
    if (!printWindow) {
      this.showToast('Por favor permite ventanas emergentes para imprimir el reporte PDF', 'info');
      return;
    }

    let rowsHtml = '';
    rooms.forEach(r => {
      const price = Number(r.pricePerMonth || 0).toFixed(2);
      const owner = r.ownerName || 'Propietario';
      const address = r.propertyAddress || 'Abancay';
      const wallet = r.paymentMethod || 'YAPE';
      const opCode = r.paymentReference || 'N/A';
      const statusLabel = r.status === 'AVAILABLE' ? 'Disponible' : (r.status === 'RENTED' ? 'Alquilado' : r.status);
      const statusClass = r.status === 'AVAILABLE' ? 'status-available' : 'status-rented';

      rowsHtml += `
        <tr>
          <td class="center font-mono">#${r.id}</td>
          <td><strong>${r.title}</strong></td>
          <td>${owner}</td>
          <td>${address}</td>
          <td class="right text-emerald"><strong>S/. ${price}</strong></td>
          <td class="center"><span class="wallet-pill">${wallet}</span></td>
          <td class="center font-mono">${opCode}</td>
          <td class="center"><span class="badge ${statusClass}">${statusLabel}</span></td>
        </tr>
      `;
    });

    const docContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Auditoría del Inventario General - Roomix Abancay</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 1.2cm 1.5cm;
          }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            padding: 24px;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5px solid #0052ff;
            padding-bottom: 14px;
            margin-bottom: 16px;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 800;
            color: #0052ff;
            letter-spacing: -0.5px;
          }
          .brand-subtitle {
            font-size: 11px;
            color: #475569;
            margin-top: 3px;
          }
          .meta-info {
            text-align: right;
            font-size: 10px;
            color: #64748b;
          }
          .meta-info strong { color: #0f172a; }
          .summary-strip {
            display: flex;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 9px 14px;
            margin-bottom: 16px;
          }
          .summary-item {
            font-size: 10.5px;
            color: #475569;
          }
          .summary-item strong {
            color: #0052ff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 20px;
          }
          th {
            background-color: #0052ff;
            color: #ffffff;
            font-weight: 700;
            text-align: left;
            padding: 8px 10px;
            border: 1px solid #0044d4;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.03em;
          }
          td {
            padding: 7px 10px;
            border: 1px solid #e2e8f0;
            color: #334155;
            vertical-align: middle;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .font-mono { font-family: monospace; font-size: 10px; }
          .text-emerald { color: #059669; }
          .badge {
            display: inline-block;
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 9.5px;
            font-weight: 700;
          }
          .status-available {
            background: #d1fae5;
            color: #047857;
            border: 1px solid #a7f3d0;
          }
          .status-rented {
            background: #fee2e2;
            color: #b91c1c;
            border: 1px solid #fecaca;
          }
          .wallet-pill {
            background: #eff6ff;
            color: #0052ff;
            border: 1px solid #bfdbfe;
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 9.5px;
          }
          .footer-sign {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 15px;
            border-top: 1px dashed #cbd5e1;
            font-size: 9.5px;
            color: #64748b;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <div>
            <div class="brand-title">ROOMIX ABANCAY • APURÍMAC</div>
            <div class="brand-subtitle">Auditoría Detallada del Inventario General de Cuartos y Alojamiento</div>
          </div>
          <div class="meta-info">
            <div>Fecha: <strong>${dateFormatted} - ${timeFormatted}</strong></div>
            <div>Emitido por: <strong>${adminName}</strong></div>
            <div>Jurisdicción: <strong>Provincia de Abancay, Región Apurímac</strong></div>
          </div>
        </div>

        <div class="summary-strip">
          <div class="summary-item">Total Registros: <strong>${rooms.length} habitaciones</strong></div>
          <div class="summary-item">Disponibles: <strong>${this.adminReportStats.available}</strong></div>
          <div class="summary-item">Ocupados: <strong>${this.adminReportStats.occupied}</strong></div>
          <div class="summary-item">Recaudación Tarifas (S/. 15): <strong>S/. ${this.adminReportStats.feesCollected}.00</strong></div>
          <div class="summary-item">Base de Datos: <strong>PostgreSQL</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">ID</th>
              <th style="width: 25%;">Habitación / Inmueble</th>
              <th style="width: 18%;">Propietario</th>
              <th style="width: 20%;">Dirección (Abancay)</th>
              <th style="width: 10%; text-align: right;">Precio / Mes</th>
              <th style="width: 7%; text-align: center;">Billetera</th>
              <th style="width: 8%; text-align: center;">Código Op.</th>
              <th style="width: 7%; text-align: center;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer-sign">
          <div>Documento emitido electrónicamente desde la plataforma oficial Roomix Abancay. Válido para control y auditoría general.</div>
          <div>Página 1 de 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(docContent);
    printWindow.document.close();
  }

  // ==========================================
  // CONFIGURACIÓN MANUAL DE UBICACIÓN (ADMIN GENERAL)
  // ==========================================
  openEditLocationModal(room: Room): void {
    this.editLocationRoom = room;
    this.editAddress = room.propertyAddress || '';
    this.editDistrict = room.propertyCity || 'Abancay';
    this.editReference = '';
    this.editLatitude = '-13.6339';
    this.editLongitude = '-72.8814';
    this.showEditLocationModal.set(true);
  }

  closeEditLocationModal(): void {
    this.showEditLocationModal.set(false);
    this.resetEditLocationForm();
  }

  resetEditLocationForm(): void {
    this.editLocationRoom = null;
    this.editAddress = '';
    this.editDistrict = 'Abancay Centro';
    this.editReference = '';
    this.editLatitude = '-13.6339';
    this.editLongitude = '-72.8814';
    this.editLocationSaving = false;
  }

  setQuickCoordinates(zone: 'centro' | 'unamba' | 'utea' | 'tamburco' | 'patibamba'): void {
    if (zone === 'centro') {
      this.editLatitude = '-13.6339';
      this.editLongitude = '-72.8814';
      this.editDistrict = 'Abancay Centro';
      if (!this.editAddress) this.editAddress = 'Jr. Lima / Plaza de Armas';
    } else if (zone === 'unamba') {
      this.editLatitude = '-13.6190';
      this.editLongitude = '-72.8715';
      this.editDistrict = 'Tamburco (UNAMBA)';
      if (!this.editAddress) this.editAddress = 'Av. Arenas s/n frente a UNAMBA';
    } else if (zone === 'utea') {
      this.editLatitude = '-13.6385';
      this.editLongitude = '-72.8860';
      this.editDistrict = 'Las Américas (UTEA)';
      if (!this.editAddress) this.editAddress = 'Av. Perú cuadra 3 cerca a UTEA';
    } else if (zone === 'tamburco') {
      this.editLatitude = '-13.6150';
      this.editLongitude = '-72.8700';
      this.editDistrict = 'Tamburco';
      if (!this.editAddress) this.editAddress = 'Plaza Principal de Tamburco';
    } else if (zone === 'patibamba') {
      this.editLatitude = '-13.6280';
      this.editLongitude = '-72.8750';
      this.editDistrict = 'Patibamba Baja';
      if (!this.editAddress) this.editAddress = 'Sector Patibamba Baja';
    }
  }

  saveRoomLocation(): void {
    if (!this.editLocationRoom) return;
    if (!this.editAddress.trim()) {
      this.showToast('Ingresa la dirección o calle del cuarto en Abancay', 'error');
      return;
    }

    this.editLocationSaving = true;
    const roomId = this.editLocationRoom.id;
    const fullAddress = this.editReference.trim()
      ? `${this.editAddress.trim()} (Ref: ${this.editReference.trim()})`
      : this.editAddress.trim();

    this.api.updateRoomLocation(roomId, {
      address: fullAddress,
      district: this.editDistrict.trim() || 'Abancay',
      city: 'Abancay',
      latitude: this.editLatitude,
      longitude: this.editLongitude
    }).subscribe({
      next: res => {
        this.editLocationSaving = false;
        if (res.success) {
          this.closeEditLocationModal();
          this.showToast(`¡Ubicación del cuarto #${roomId} fijada manualmente con éxito!`, 'success');
          this.loadAdminData();
          this.loadRooms();
        }
      },
      error: err => {
        this.editLocationSaving = false;
        const msg = err.error?.message || 'Error al actualizar la ubicación manual';
        this.showToast(msg, 'error');
      }
    });
  }

  // ==========================================
  // GOOGLE MAPS ZONE SELECTOR (ABANCAY)
  // ==========================================
  selectMapZone(zone: string): void {
    this.activeMapZone.set(zone);
    let mapQuery = 'Abancay, Apurimac, Peru';
    let zoom = 14;

    switch (zone) {
      case 'unamba':
        mapQuery = 'Universidad Nacional Micaela Bastidas de Apurimac, Abancay';
        zoom = 16;
        break;
      case 'utea':
        mapQuery = 'Universidad Tecnologica de los Andes, Abancay';
        zoom = 16;
        break;
      case 'centro':
        mapQuery = 'Plaza de Armas de Abancay, Apurimac';
        zoom = 16;
        break;
      case 'tamburco':
        mapQuery = 'Tamburco, Abancay, Peru';
        zoom = 15;
        break;
      case 'patibamba':
        mapQuery = 'Patibamba Baja, Abancay, Peru';
        zoom = 15;
        break;
      default:
        mapQuery = 'Abancay, Apurimac, Peru';
        zoom = 14;
    }

    const encoded = encodeURIComponent(mapQuery);
    this.currentMapUrl.set(`https://maps.google.com/maps?q=${encoded}&t=&z=${zoom}&ie=UTF8&iwloc=&output=embed`);
  }

  exploreMapZone(zone: string): void {
    this.selectMapZone(zone);
    this.applyChipFilter(zone);
    this.scrollToSection('cuartos-section');
  }

  // ==========================================
  // STAR RATING METHODS
  // ==========================================
  setRating(star: number): void {
    this.reviewRating = star;
  }

  setHoverRating(star: number): void {
    this.hoverRating.set(star);
  }

  // ==========================================
  // AUTHENTICATION MODAL & DEMO LOGINS
  // ==========================================
  openAuth(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authError = '';
    this.authSuccessMessage = '';
    this.showAuthModal.set(true);
  }

  switchAuthMode(mode: 'login' | 'register' | 'forgot'): void {
    this.authMode.set(mode);
    this.authError = '';
    this.authSuccessMessage = '';
  }

  closeAuth(): void {
    this.showAuthModal.set(false);
    this.resetAuthForm();
  }

  resetAuthForm(): void {
    this.authEmail = '';
    this.authPassword = '';
    this.authConfirmPassword = '';
    this.showAuthPassword.set(false);
    this.showAuthConfirmPassword.set(false);
    this.authFirstName = '';
    this.authLastName = '';
    this.authPhone = '';
    this.authRole = 'ROLE_TENANT';
    this.authError = '';
    this.authSuccessMessage = '';
    this.authResetEmail = '';
    this.authResetCode = '';
    this.authNewPassword = '';
    this.authResetStep = 'REQUEST_CODE';
    this.authResetSuccessMessage = '';
    this.socialEmail = '';
    this.socialFirstName = '';
    this.socialLastName = '';
    this.socialCode = '';
    this.socialError = '';
    this.socialSuccessMsg = '';
    this.authRememberMe = false;
  }

  sanitizeAuthPhone(value: string): string {
    return (value || '').replace(/\D/g, '').slice(0, 9);
  }

  authPasswordHasMinLength(): boolean {
    return this.authPassword.length >= 8;
  }

  authPasswordHasUppercase(): boolean {
    return /[A-ZÁÉÍÓÚÜÑ]/.test(this.authPassword);
  }

  authPasswordHasNumber(): boolean {
    return /\d/.test(this.authPassword);
  }

  authPasswordHasSpecialCharacter(): boolean {
    return /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d\s]/.test(this.authPassword);
  }

  authPasswordIsValid(): boolean {
    return this.authPasswordHasMinLength()
      && this.authPasswordHasUppercase()
      && this.authPasswordHasNumber()
      && this.authPasswordHasSpecialCharacter();
  }

  authPasswordsMatch(): boolean {
    return Boolean(this.authConfirmPassword) && this.authPassword === this.authConfirmPassword;
  }

  submitAuth(): void {
    this.authError = '';
    this.authSuccessMessage = '';
    const emailVal = this.authEmail.trim();
    const passwordVal = this.authPassword;
    const isRegister = this.authMode() === 'register';

    // Validación rápida e instantánea de campos requeridos
    if (!emailVal && !passwordVal) {
      this.authError = isRegister
        ? 'Por favor ingresa tu correo y contraseña para crear tu cuenta.'
        : 'Por favor ingresa tu correo y contraseña.';
      return;
    }
    if (!emailVal) {
      this.authError = 'Por favor ingresa tu correo electrónico.';
      return;
    }
    // Validación básica de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      this.authError = 'El formato del correo electrónico no es válido.';
      return;
    }
    if (!passwordVal) {
      this.authError = 'Por favor ingresa tu contraseña.';
      return;
    }

    if (this.authMode() === 'register') {
      const firstName = this.authFirstName.trim();
      const lastName = this.authLastName.trim();
      if (!firstName || !lastName) {
        this.authError = 'Por favor ingresa tu nombre y apellido.';
        return;
      }
      if (firstName.length < 2 || lastName.length < 2) {
        this.authError = 'El nombre y el apellido deben tener al menos 2 caracteres.';
        return;
      }
      if (firstName.length > 50 || lastName.length > 50) {
        this.authError = 'El nombre y el apellido no pueden superar los 50 caracteres.';
        return;
      }
      if (passwordVal.length < 8) {
        this.authError = 'La contraseña debe tener al menos 8 caracteres.';
        return;
      }
      if (!this.authPasswordIsValid()) {
        this.authError = 'La contraseña debe tener 8 caracteres e incluir una mayúscula, un número y un símbolo.';
        return;
      }
      if (this.authPhone && this.sanitizeAuthPhone(this.authPhone).length !== 9) {
        this.authError = 'El celular debe contener exactamente 9 dígitos de Perú.';
        return;
      }
      if (!this.authConfirmPassword) {
        this.authError = 'Por favor confirma tu contraseña.';
        return;
      }
      if (passwordVal !== this.authConfirmPassword) {
        this.authError = 'Las contraseñas no coinciden. Por favor verifica ambos campos.';
        return;
      }
    }

    this.authLoading = true;
    if (this.authMode() === 'login') {
      this.auth.login({ email: emailVal, password: passwordVal }).subscribe({
        next: res => {
          this.authLoading = false;
          if (res.success) {
            // Limpieza estricta de formularios y seguridad (no guardar correos ni claves en memoria de formulario)
            this.closeAuth();
            this.showToast(`¡Bienvenido de nuevo, ${res.data.user.firstName}!`, 'success');
            if (this.auth.isAdmin()) {
              this.activeTab.set('admin-panel');
              this.loadAdminData();
            } else if (this.auth.isOwner()) {
              this.activeTab.set('owner-panel');
              this.loadOwnerData();
            } else {
              this.activeTab.set('my-bookings');
              this.loadTenantBookings();
            }
          }
        },
        error: err => {
          this.authLoading = false;
          const details = err.error?.errors?.join(', ');
          this.authError = details || err.error?.message || 'Correo o contraseña incorrectos';
        }
      });
    } else {
      this.auth.register({
        firstName: this.authFirstName.trim(),
        lastName: this.authLastName.trim(),
        email: emailVal,
        password: passwordVal,
        phone: this.authPhone.trim() || undefined,
        role: this.authRole
      }, true).subscribe({
        next: res => {
          this.authLoading = false;
          if (res.success && res.data) {
            this.closeAuth();
            this.showToast(`¡Bienvenido a RoomiGo, ${res.data.user.firstName}!`, 'success');
            if (this.auth.isOwner()) {
              this.activeTab.set('owner-panel');
              this.loadOwnerData();
            } else {
              this.activeTab.set('my-bookings');
              this.loadTenantBookings();
            }
          } else {
            this.authError = res.message || 'No se pudo completar el registro. Inténtalo nuevamente.';
          }
        },
        error: err => {
          this.authLoading = false;
          const details = err.error?.errors?.join(', ');
          this.authError = err.status === 409
            ? (err.error?.message || 'Este correo ya está registrado. Inicia sesión o utiliza otro correo.')
            : (details || err.error?.message || 'Error al registrar la cuenta');
        }
      });
    }
  }

  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑAS FUNCIONAL
  // ==========================================
  openForgotPassword(): void {
    this.authError = '';
    this.authResetSuccessMessage = '';
    this.authResetEmail = this.authEmail.trim();
    this.authResetCode = '';
    this.authNewPassword = '';
    this.authConfirmPassword = '';
    this.authResetStep = 'REQUEST_CODE';
    this.authMode.set('forgot');
  }

  requestResetCode(): void {
    this.authError = '';
    this.authResetSuccessMessage = '';
    if (!this.authResetEmail.trim() || !this.authResetEmail.includes('@')) {
      this.authError = 'Por favor ingresa un correo electrónico válido.';
      return;
    }

    this.authResetLoading = true;
    this.auth.requestPasswordReset(this.authResetEmail.trim()).subscribe({
      next: res => {
        this.authResetLoading = false;
        if (res.success && res.code) {
          this.authResetStep = 'ENTER_NEW_PASSWORD';
          this.showToast(`Código de verificación enviado: ${res.code} (válido para ${this.authResetEmail})`, 'info');
        } else {
          this.authError = res.message;
        }
      },
      error: () => {
        this.authResetLoading = false;
        this.authError = 'No se pudo generar el código de recuperación.';
      }
    });
  }

  submitResetPassword(): void {
    this.authError = '';
    this.authResetSuccessMessage = '';

    if (!this.authResetCode.trim() || this.authResetCode.trim().length !== 6) {
      this.authError = 'Ingresa el código de 6 dígitos que fue enviado a tu correo.';
      return;
    }

    if (!this.authNewPassword || this.authNewPassword.length < 8) {
      this.authError = 'La nueva contraseña debe tener al menos 8 caracteres.';
      return;
    }

    if (this.authNewPassword !== this.authConfirmPassword) {
      this.authError = 'Las contraseñas no coinciden. Por favor verifícalas.';
      return;
    }

    this.authResetLoading = true;
    this.auth.verifyAndResetPassword(this.authResetEmail.trim(), this.authResetCode.trim(), this.authNewPassword).subscribe({
      next: res => {
        this.authResetLoading = false;
        if (res.success) {
          this.authPassword = this.authNewPassword;
          this.authEmail = this.authResetEmail.trim();
          this.authMode.set('login');
          this.showToast('¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión.', 'success');
        } else {
          this.authError = res.message;
        }
      },
      error: () => {
        this.authResetLoading = false;
        this.authError = 'Error al restablecer la contraseña.';
      }
    });
  }

  // ==========================================
  // AUTENTICACIÓN SOCIAL REAL (GOOGLE Y FACEBOOK CON CÓDIGO OTP POR CORREO)
  // ==========================================
  openSocialAuth(provider: 'GOOGLE' | 'FACEBOOK'): void {
    this.socialProvider.set(provider);
    this.socialStep.set('FORM');
    this.socialError = '';
    this.socialSuccessMsg = '';
    this.socialCode = '';
    this.socialDevCode = '';
    this.socialEmail = this.authEmail.trim();
    this.socialFirstName = this.authFirstName.trim();
    this.socialLastName = this.authLastName.trim();
    this.socialRole = this.authRole || 'ROLE_TENANT';
    this.showAuthModal.set(false);
    this.showSocialModal.set(true);
  }

  closeSocialModal(): void {
    this.showSocialModal.set(false);
    this.socialEmail = '';
    this.socialFirstName = '';
    this.socialLastName = '';
    this.socialCode = '';
    this.socialError = '';
    this.socialSuccessMsg = '';
    if (this.socialTimerInterval) {
      clearInterval(this.socialTimerInterval);
      this.socialTimerInterval = null;
    }
  }

  selectGoogleAccount(email: string, name: string, role?: UserRole): void {
    this.socialError = 'El acceso con Google aún no está configurado. Usa tu correo y contraseña para registrarte o iniciar sesión.';
  }

  loginWithGoogle(): void {
    this.openSocialAuth('GOOGLE');
  }

  loginWithFacebook(): void {
    this.openSocialAuth('FACEBOOK');
  }

  submitSocialSendCode(): void {
    this.socialError = '';
    const cleanEmail = this.socialEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      this.socialError = 'Por favor ingresa un correo electrónico válido.';
      return;
    }

    this.socialLoading = true;
    this.auth.sendSocialVerificationCode({
      email: cleanEmail,
      provider: this.socialProvider(),
      firstName: this.socialFirstName.trim() || undefined,
      lastName: this.socialLastName.trim() || undefined,
      role: this.socialRole
    }).subscribe({
      next: res => {
        this.socialLoading = false;
        if (res.success) {
          this.socialStep.set('OTP');
          this.socialSuccessMsg = `Código de 6 dígitos enviado exitosamente a ${cleanEmail}. Revisa tu bandeja de entrada o spam.`;
          this.socialDevCode = res.data?.devCode || '';
          this.startSocialCountdown();
          this.showToast('Código de verificación enviado a tu correo', 'success');
        } else {
          this.socialError = res.message || 'No se pudo enviar el código de verificación.';
        }
      },
      error: err => {
        this.socialLoading = false;
        this.socialError = err.error?.message || 'Error al comunicarse con el servidor de correo.';
      }
    });
  }

  startSocialCountdown(): void {
    this.socialExpiresIn = 600;
    if (this.socialTimerInterval) clearInterval(this.socialTimerInterval);
    this.socialTimerInterval = setInterval(() => {
      if (this.socialExpiresIn > 0) {
        this.socialExpiresIn--;
      } else {
        clearInterval(this.socialTimerInterval);
        this.socialTimerInterval = null;
      }
    }, 1000);
  }

  resendSocialCode(): void {
    if (this.socialExpiresIn > 540) {
      this.showToast('Por favor espera un momento antes de solicitar otro código.', 'info');
      return;
    }
    this.submitSocialSendCode();
  }

  submitSocialVerify(): void {
    this.socialError = '';
    const code = this.socialCode.trim();
    if (!code || code.length !== 6) {
      this.socialError = 'Por favor ingresa el código completo de 6 dígitos.';
      return;
    }

    this.socialLoading = true;
    this.auth.verifySocialCode({
      email: this.socialEmail.trim().toLowerCase(),
      code,
      provider: this.socialProvider(),
      firstName: this.socialFirstName.trim() || undefined,
      lastName: this.socialLastName.trim() || undefined,
      role: this.socialRole
    }).subscribe({
      next: res => {
        this.socialLoading = false;
        if (res.success) {
          this.closeSocialModal();
          const providerLabel = this.socialProvider() === 'GOOGLE' ? 'Google' : 'Facebook';
          this.showToast(`¡Cuenta de ${providerLabel} verificada con éxito! Bienvenido, ${res.data.user.firstName}`, 'success');

          if (this.auth.isAdmin()) {
            this.activeTab.set('admin-panel');
            this.loadAdminData();
          } else if (this.auth.isOwner()) {
            this.activeTab.set('owner-panel');
            this.loadOwnerData();
          } else {
            this.activeTab.set('my-bookings');
            this.loadTenantBookings();
          }
        } else {
          this.socialError = res.message || 'Código incorrecto o expirado.';
        }
      },
      error: err => {
        this.socialLoading = false;
        const msg = err.error?.message || err.error?.errors?.[0] || 'El código ingresado es incorrecto o ha expirado.';
        this.socialError = msg;
      }
    });
  }


  logout(): void {
    this.mobileMenuOpen.set(false);
    this.auth.logout();
    this.activeTab.set('explore');
    this.showToast('Has cerrado sesión correctamente', 'info');
  }

  // ==========================================
  // MODAL: EDICIÓN DE PERFIL DE USUARIO
  // ==========================================
  readonly showEditProfileModal = signal<boolean>(false);
  profileEditFirstName = '';
  profileEditLastName = '';
  profileEditPhone = '';
  profileEditImage = '';
  profileEditSaving = false;

  openEditProfileModal(): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this.profileEditFirstName = u.firstName || '';
    this.profileEditLastName = u.lastName || '';
    this.profileEditPhone = u.phone || '';
    this.profileEditImage = u.profileImage || '';
    this.showEditProfileModal.set(true);
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal.set(false);
  }

  saveProfileChanges(): void {
    if (!this.profileEditFirstName.trim()) {
      this.showToast('El nombre no puede estar vacío', 'error');
      return;
    }
    this.profileEditSaving = true;
    setTimeout(() => {
      this.auth.updateUserData({
        firstName: this.profileEditFirstName.trim(),
        lastName: this.profileEditLastName.trim(),
        phone: this.profileEditPhone.trim(),
        profileImage: this.profileEditImage.trim() || undefined
      });
      this.profileEditSaving = false;
      this.closeEditProfileModal();
      this.showToast('¡Tu perfil ha sido actualizado con éxito!', 'success');
    }, 300);
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.profileEditImage = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // ==========================================
  // CONFIGURACIONES & MODO OSCURO (THEME)
  // ==========================================
  readonly isDarkMode = signal<boolean>(false);
  readonly showSettingsModal = signal<boolean>(false);
  readonly notificationsOpen = signal<boolean>(true);

  toggleTheme(): void {
    const nextVal = !this.isDarkMode();
    this.isDarkMode.set(nextVal);
    if (typeof document !== 'undefined') {
      if (nextVal) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
      }
    }
    this.showToast(nextVal ? 'Modo Oscuro activado' : 'Modo Claro activado', 'info');
  }

  setTheme(mode: 'light' | 'dark'): void {
    const isDark = mode === 'dark';
    this.isDarkMode.set(isDark);
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark-theme');
        document.body.classList.add('dark-theme');
      } else {
        document.documentElement.classList.remove('dark-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }

  openSettingsModal(): void {
    this.showSettingsModal.set(true);
  }

  closeSettingsModal(): void {
    this.showSettingsModal.set(false);
  }

  toggleNotifications(): void {
    this.notificationsOpen.update(v => !v);
  }

  // ==========================================
  // NAVIGATION & TABS
  // ==========================================
  switchTab(tab: 'explore' | 'catalog' | 'favorites' | 'room-detail' | 'sign-in' | 'my-bookings' | 'owner-panel' | 'admin-panel'): void {
    this.mobileMenuOpen.set(false);
    this.dashboardDrawerOpen.set(false);
    if (tab === 'my-bookings') {
      if (!this.auth.isLoggedIn()) {
        this.openAuth('login');
        return;
      }
      if (!this.auth.isTenant()) {
        this.showToast('Acceso exclusivo para inquilinos', 'info');
        return;
      }
    }
    if (tab === 'owner-panel') {
      if (!this.auth.isLoggedIn()) {
        this.showToast('Acceso exclusivo para propietarios', 'info');
        this.openAuth('login');
        return;
      }
      if (!this.auth.isOwner()) {
        this.showToast('Acceso exclusivo para propietarios', 'info');
        return;
      }
    }
    if (tab === 'admin-panel') {
      if (!this.auth.isLoggedIn()) {
        this.showToast('Acceso exclusivo para el Administrador General', 'info');
        this.openAuth('login');
        return;
      }
      if (!this.auth.isAdmin()) {
        this.showToast('Acceso exclusivo para el Administrador General', 'info');
        return;
      }
    }
    this.activeTab.set(tab);
    if (tab === 'my-bookings') this.loadTenantBookings();
    if (tab === 'owner-panel') this.loadOwnerData();
    if (tab === 'admin-panel') this.loadAdminData();
  }

  // ==========================================
  // TOAST NOTIFICATIONS
  // ==========================================
  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast.set({ message, type });
    this.toastTimeout = setTimeout(() => {
      this.toast.set(null);
    }, 4000);
  }

  // ==========================================
  // PUBLIC SECTIONS SCROLL & HELP
  // ==========================================
  scrollToSection(sectionId: string): void {
    this.mobileMenuOpen.set(false);
    if (this.activeTab() !== 'explore') {
      this.switchTab('explore');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          this.scrollToElement(el);
        }
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        this.scrollToElement(el);
      }
    }
  }

  onSearchRoomsClick(): void {
    this.switchTab('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  submitLandingSearch(): void {
    this.loadRooms();
    this.onSearchRoomsClick();
  }

  openSignInPage(): void {
    this.switchAuthMode('login');
    this.switchTab('sign-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private scrollToElement(el: HTMLElement): void {
    const scrollMarginTop = Number.parseFloat(window.getComputedStyle(el).scrollMarginTop) || 0;
    const top = window.scrollY + el.getBoundingClientRect().top - scrollMarginTop;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  onPublishPropertyClick(): void {
    if (!this.auth.isLoggedIn()) {
      this.authRole = 'ROLE_OWNER';
      this.openAuth('register');
      this.showToast('Regístrate o inicia sesión como Propietario para publicar tu inmueble', 'info');
      return;
    }
    if (!this.auth.isOwner()) {
      this.showToast('Tu cuenta actual es de Inquilino. Inicia sesión como Propietario para publicar inmuebles.', 'info');
      return;
    }
    this.openNewRoomModal();
  }
}
