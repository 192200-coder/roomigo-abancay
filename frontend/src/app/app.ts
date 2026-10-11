import { AuthModalComponent } from './components/ui/modals/auth-modal/auth-modal.component';
import { LandingPageComponent } from './components/views/landingpage/landingpage.component';
import { TenantDashboardComponent } from './components/views/tenantdashboard/tenantdashboard.component';
import { OwnerDashboardComponent } from './components/views/ownerdashboard/ownerdashboard.component';
import { AdminDashboardComponent } from './components/views/admindashboard/admindashboard.component';
import { RoomCatalogComponent } from './components/views/roomcatalog/roomcatalog.component';
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
import { Component, OnInit, signal, computed, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RoomixApiService } from './core/roomix-api.service';
import { AuthService } from './core/auth.service';
import { MercadoPagoService } from './core/mercado-pago.service';
import { MapSectionComponent } from './components/ui/map-section/map-section.component';
import {
  Room,
  RoomFilter,
  RoomType,
  Property,
  Booking,
  Review,
  UserRole,
  AdminStats,
  MercadoPagoSubMethod,
  MercadoPagoPaymentResult
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
    TenantDashboardComponent,
    OwnerDashboardComponent,
    AdminDashboardComponent,
    RoomDetailModalComponent,
    BookingModalComponent,
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
    AuthModalComponent,
    FooterComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css', encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  // Navigation & View
  readonly activeTab = signal<'explore' | 'my-bookings' | 'owner-panel' | 'admin-panel'>('explore');

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
  maxPrice: number = 700;
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
  readonly showAuthPassword = signal<boolean>(false);
  authFirstName = '';
  authLastName = '';
  authPhone = '';
  authRole: UserRole = 'ROLE_TENANT';
  authError = '';
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
  authConfirmPassword = '';
  authResetStep: 'REQUEST_CODE' | 'ENTER_NEW_PASSWORD' = 'REQUEST_CODE';
  authResetLoading = false;
  authResetSuccessMessage = '';

  // Booking Form State con Pasarela Integral de Mercado Pago (Perú)
  bookingStartDate = '';
  bookingEndDate = '';
  bookingNotes = '';
  bookingPaymentMethod: string = 'MERCADO_PAGO';
  bookingPaymentRef = '';
  bookingSubmitting = false;

  // Billeteras Digitales Booking Fields (Yape / Plin / Tarjetas)
  mpBookingSubMethod: MercadoPagoSubMethod = 'YAPE';
  mpCardNumber = '';
  mpCardHolder = '';
  mpCardExp = '';
  mpCardCvv = '';
  mpCardDni = '';
  mpInstallments = 1;
  mpYapeOtp = '';
  mpCipGenerated = false;
  mpGeneratedCip = '';
  mpQrActive = true;

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

  // Comprobantes de Pago (Vouchers)
  publishVoucherImage = '';
  publishVoucherFileName = '';
  bookingVoucherImage = '';
  bookingVoucherFileName = '';

  // Modal Comprobante Oficial de Mercado Pago
  readonly showMpSuccessReceipt = signal<boolean>(false);
  mpReceiptData: MercadoPagoPaymentResult | null = null;

  // Review Form State
  reviewRating = 5;
  reviewComment = '';
  reviewBookingId: number | null = null;
  reviewSubmitting = false;

  // Owner Panel State
  readonly myProperties = signal<Property[]>([]);
  readonly ownerBookings = signal<Booking[]>([]);
  readonly tenantBookings = signal<Booking[]>([]);

  // Mobile Hamburger Menu State
  readonly mobileMenuOpen = signal<boolean>(false);

  // Tenant Panel Filter
  readonly tenantFilter = signal<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'EXPLORE'>('ALL');

  // Owner Panel Functional Tabs & Filters
  readonly ownerTab = signal<'requests' | 'properties' | 'stats' | 'explore'>('requests');
  readonly ownerBookingFilter = signal<'ALL' | 'PENDING' | 'CONFIRMED' | 'REJECTED'>('ALL');

  get filteredTenantBookings(): Booking[] {
    const filter = this.tenantFilter();
    const list = this.tenantBookings();
    if (filter === 'ALL') return list;
    return list.filter(b => b.status === filter);
  }

  get filteredOwnerBookings(): Booking[] {
    const filter = this.ownerBookingFilter();
    const list = this.ownerBookings();
    if (filter === 'ALL') return list;
    return list.filter(b => b.status === filter);
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
    const raw = phone ? phone.replace(/[^0-9]/g, '') : '983456789';
    const num = raw.startsWith('51') ? raw : '51' + raw;
    const msg = encodeURIComponent(`Hola, te contacto desde Roomix Abancay respecto a mi reserva confirmada de la habitación: ${roomTitle || 'en Abancay'}.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  }

  contactTenantWhatsApp(phone?: string, tenantName?: string, roomTitle?: string): void {
    const raw = phone ? phone.replace(/[^0-9]/g, '') : '983456789';
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

  onPublishVoucherSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.publishVoucherFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.publishVoucherImage = e.target?.result as string;
        this.showToast(`Comprobante adjuntado: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    }
  }

  onBookingVoucherSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.bookingVoucherFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.bookingVoucherImage = e.target?.result as string;
        this.showToast(`Comprobante adjuntado: ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    }
  }

  sendPublishVoucherWhatsApp(): void {
    const currentUser = this.auth.currentUser();
    const ownerName = `${currentUser?.firstName || 'Propietario'} ${currentUser?.lastName || ''}`.trim();
    const ownerPhone = currentUser?.phone || 'Sin número registrado';
    const method = this.mpPublishSubMethod === 'PLIN' ? 'Plin' : 'Yape';
    const cleanPhone = this.walletPhone().replace(/\D/g, '') || '983456789';
    const targetPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

    const text = 
`🏠 *COMPROBANTE DE PUBLICACIÓN - ROOMIX ABANCAY* 🏠

*DATOS DE LA HABITACIÓN:*
• *Título:* ${this.newRoomTitle || 'Habitación en Abancay'}
• *Dirección:* ${this.manualPropertyAddress || 'Abancay, Apurímac'}
• *Precio:* S/. ${this.newRoomPrice} /mes
• *Garantía:* S/. ${this.newRoomDeposit}
• *Tipo:* ${this.newRoomType}
• *Baño:* ${this.newRoomBathroom ? 'Privado' : 'Compartido'}
• *Capacidad:* ${this.newRoomCapacity} persona(s)
• *Servicios:* ${this.newRoomWifi ? 'WiFi incluido, ' : ''}${this.newRoomPets ? 'Acepta mascotas' : 'Sin mascotas'}

*DATOS DEL PAGO:*
• *Tarifa:* S/. ${this.publicationFee.toFixed(2)} PEN
• *Billetera:* ${method}
• *Destino:* ${this.walletBeneficiary()} (${this.walletPhone()})

*PROPIETARIO:*
• *Nombre:* ${ownerName}
• *Celular:* ${ownerPhone}
• *Email:* ${currentUser?.email || ''}

_Hola Administrador de Roomix Abancay, acabo de realizar el pago de la tarifa mediante ${method}. Adjunto mi comprobante para la verificación y publicación de mi cuarto._`;

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  sendBookingVoucherWhatsApp(): void {
    const room = this.selectedRoom();
    if (!room) return;

    const currentUser = this.auth.currentUser();
    const tenantName = `${currentUser?.firstName || 'Inquilino'} ${currentUser?.lastName || ''}`.trim();
    const tenantPhone = currentUser?.phone || 'Sin número registrado';
    const method = this.mpBookingSubMethod === 'PLIN' ? 'Plin' : 'Yape';
    const totalAmount = this.calculateBookingTotal();
    const targetPhone = (room.ownerPhone ? room.ownerPhone.replace(/\D/g, '') : '') || this.walletPhone().replace(/\D/g, '') || '983456789';
    const formattedPhone = targetPhone.startsWith('51') ? targetPhone : `51${targetPhone}`;

    const text = 
`📋 *COMPROBANTE DE RESERVA - ROOMIX ABANCAY* 📋

*HABITACIÓN RESERVADA:*
• *Cuarto:* ${room.title}
• *Dirección:* ${room.propertyAddress || 'Abancay, Apurímac'}
• *Precio Mensual:* S/. ${room.pricePerMonth}
• *Garantía:* S/. ${room.depositPrice}
• *Estadía:* ${this.bookingStartDate} al ${this.bookingEndDate} (${this.calculateStayDays()} días)
• *Total Abonado:* S/. ${totalAmount.toFixed(2)} PEN

*INQUILINO:*
• *Nombre:* ${tenantName}
• *Teléfono:* ${tenantPhone}
• *Email:* ${currentUser?.email || 'inquilino@gmail.com'}
• *Mensaje:* ${this.bookingNotes || 'Sin notas adicionales'}

*PAGO:*
• *Billetera:* ${method}
• *Receptor:* ${this.walletBeneficiary()} (${this.walletPhone()})

_Hola, acabo de realizar el pago de mi reserva mediante ${method}. Te adjunto mi comprobante para confirmar mi estadía en Roomix Abancay._`;

    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  getRoomsForProperty(propertyId: number): Room[] {
    return this.rooms().filter(r => r.propertyId === propertyId);
  }

  // New Room Form State con Pasarela de Pago Obligatoria (Yape / Plin)
  newRoomPropertyId: number | null = null;
  newRoomPropertyMode: 'select' | 'manual' = 'select';
  manualPropertyTitle = '';
  manualPropertyAddress = '';
  manualPropertyDistrict = 'Tamburco';

  // Fotos de la Habitación (Hasta 5 fotos)
  newRoomImages: string[] = [];
  newRoomImageUrlInput = '';

  newRoomTitle = '';
  newRoomDescription = '';
  newRoomPrice = 320;
  newRoomDeposit = 150;
  newRoomType: RoomType = 'SINGLE';
  newRoomBathroom = true;
  newRoomCapacity = 1;
  newRoomSize = 18;
  newRoomWifi = true;
  newRoomPets = false;
  newRoomImageUrl = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80';
  newRoomPaymentMethod: string = 'MERCADO_PAGO';
  newRoomPaymentRef = '';
  readonly publicationFee: number = 3.00;
  newRoomSubmitting = false;

  // Billeteras Digitales Publicación Fields (Yape / Plin / Tarjetas)
  mpPublishSubMethod: MercadoPagoSubMethod = 'YAPE';
  mpPublishCardNumber = '';
  mpPublishCardHolder = '';
  mpPublishCardExp = '';
  mpPublishCardCvv = '';
  mpPublishCardDni = '';
  mpPublishInstallments = 1;
  mpPublishYapeOtp = '';

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
  adminEditType: RoomType = 'SINGLE';
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
  ownerEditType: RoomType = 'SINGLE';
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
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Set default dates for booking (tomorrow to +1 month)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 31);

    this.bookingStartDate = tomorrow.toISOString().split('T')[0];
    this.bookingEndDate = nextMonth.toISOString().split('T')[0];

    // Load initial rooms for Abancay
    this.loadRooms();
  }

  // ==========================================
  // ROOM SEARCH & FILTERS (ABANCAY, APURÍMAC)
  // ==========================================
  loadRooms(): void {
    this.loadingRooms.set(true);

    const filter: RoomFilter = {};
    if (this.selectedCity.trim()) filter.city = this.selectedCity.trim();
    if (this.selectedRoomType) filter.roomType = this.selectedRoomType as RoomType;
    if (this.maxPrice < 1500) filter.maxPrice = this.maxPrice;
    if (this.filterBathroom) filter.privateBathroom = true;
    if (this.filterWifi) filter.offersWifi = true;
    if (this.filterPets) filter.acceptsPets = true;

    this.api.searchRooms(filter).subscribe({
      next: res => {
        if (res.success && res.data) {
          let list = (res.data.content || []).filter(r => r.status === 'AVAILABLE');
          if (this.searchKeyword.trim()) {
            const kw = this.searchKeyword.toLowerCase();
            list = list.filter(r => 
              r.title.toLowerCase().includes(kw) || 
              r.description?.toLowerCase().includes(kw) ||
              r.propertyAddress?.toLowerCase().includes(kw) ||
              r.propertyCity?.toLowerCase().includes(kw)
            );
          }
          if (this.selectedDistrict) {
            const dist = this.selectedDistrict.toLowerCase();
            list = list.filter(r => 
              r.title.toLowerCase().includes(dist) ||
              r.description?.toLowerCase().includes(dist) ||
              r.propertyAddress?.toLowerCase().includes(dist)
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

  applyChipFilter(chip: string): void {
    this.activeChip = chip;
    this.searchKeyword = '';
    this.selectedCity = '';
    this.selectedDistrict = '';
    this.selectedRoomType = '';
    this.filterBathroom = false;
    this.filterWifi = false;
    this.filterPets = false;
    this.maxPrice = 700;

    if (chip === 'unamba') {
      this.searchKeyword = 'UNAMBA';
      this.selectedDistrict = 'Tamburco';
    } else if (chip === 'centro') {
      this.searchKeyword = 'Centro';
    } else if (chip === 'utea') {
      this.searchKeyword = 'UTEA';
    } else if (chip === 'tamburco') {
      this.selectedDistrict = 'Tamburco';
    } else if (chip === 'patibamba') {
      this.searchKeyword = 'Patibamba';
    } else if (chip === 'bathroom') {
      this.filterBathroom = true;
    } else if (chip === 'wifi') {
      this.filterWifi = true;
    } else if (chip === 'cheap') {
      this.maxPrice = 300;
    }

    this.loadRooms();
  }

  resetFilters(): void {
    this.searchKeyword = '';
    this.selectedCity = '';
    this.selectedDistrict = '';
    this.selectedRoomType = '';
    this.maxPrice = 700;
    this.filterBathroom = false;
    this.filterWifi = false;
    this.filterPets = false;
    this.activeChip = 'all';
    this.loadRooms();
  }

  getRoomTypeName(type?: string): string {
    switch (type) {
      case 'SINGLE': return 'Individual';
      case 'DOUBLE': return 'Doble (Minidepa)';
      case 'SUITE': return 'Suite con Baño';
      case 'SHARED': return 'Compartida';
      default: return type || 'Habitación';
    }
  }

  getRoomStatusName(status?: string): string {
    switch (status) {
      case 'AVAILABLE': return 'Disponible';
      case 'OCCUPIED': return 'Ocupado';
      case 'RENTED': return 'Alquilado';
      case 'PENDING_APPROVAL': return 'Pendiente de Aprobación';
      case 'MAINTENANCE': return 'En Mantenimiento';
      case 'REJECTED': return 'Rechazado';
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
      default: return 'hero-badge-available';
    }
  }

  // ==========================================
  // ROOM DETAILS & REVIEWS
  // ==========================================
  openRoomDetails(room: Room): void {
    this.selectedRoom.set(room);
    this.showDetailModal.set(true);
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
    this.bookingPaymentRef = '';
    this.showBookingModal.set(true);
  }

  closeBookingModal(): void {
    this.showBookingModal.set(false);
    this.resetBookingForm();
  }

  resetBookingForm(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 31);
    this.bookingStartDate = tomorrow.toISOString().split('T')[0];
    this.bookingEndDate = nextMonth.toISOString().split('T')[0];
    this.bookingNotes = '';
    this.bookingPaymentMethod = 'MERCADO_PAGO';
    this.mpBookingSubMethod = 'YAPE';
    this.bookingVoucherImage = '';
    this.bookingVoucherFileName = '';
    this.mpCardNumber = '';
    this.mpCardHolder = '';
    this.mpCardExp = '';
    this.mpCardCvv = '';
    this.mpCardDni = '';
    this.mpInstallments = 1;
    this.mpYapeOtp = '';
    this.mpCipGenerated = false;
    this.bookingPaymentRef = '';
    this.selectedRoom.set(null);
  }

  calculateStayDays(): number {
    if (!this.bookingStartDate || !this.bookingEndDate) return 30;
    const start = new Date(this.bookingStartDate);
    const end = new Date(this.bookingEndDate);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return diff > 0 ? Math.round(diff) : 1;
  }

  calculateBookingTotal(): number {
    const room = this.selectedRoom();
    if (!room) return 0;
    const days = this.calculateStayDays();
    const dailyRate = room.pricePerMonth / 30;
    return Math.round((dailyRate * days + room.depositPrice) * 100) / 100;
  }

  submitBooking(): void {
    const room = this.selectedRoom();
    if (!room) return;

    if (!this.bookingStartDate || !this.bookingEndDate) {
      this.showToast('Selecciona fechas válidas de inicio y fin', 'error');
      return;
    }

    if (new Date(this.bookingEndDate) <= new Date(this.bookingStartDate)) {
      this.showToast('La fecha de fin debe ser posterior a la de inicio', 'error');
      return;
    }

    // Validaciones específicas de Mercado Pago según método elegido
    if (this.mpBookingSubMethod === 'CREDIT_CARD' || this.mpBookingSubMethod === 'DEBIT_CARD') {
      const cleanNum = this.mpCardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        this.showToast('Ingresa los 16 dígitos de tu tarjeta para procesar con Mercado Pago', 'error');
        return;
      }
      if (!this.mpCardHolder.trim()) {
        this.showToast('Ingresa el nombre del titular como figura en la tarjeta', 'error');
        return;
      }
      if (!this.mpCardExp.trim() || !/^\d{2}\/\d{2}$/.test(this.mpCardExp.trim())) {
        this.showToast('Ingresa la fecha de expiración en formato MM/AA (ej. 08/28)', 'error');
        return;
      }
      if (!this.mpCardCvv.trim() || this.mpCardCvv.trim().length < 3) {
        this.showToast('Ingresa el código CVV de seguridad (3 o 4 dígitos)', 'error');
        return;
      }
      if (!this.mpCardDni.trim() || this.mpCardDni.trim().length < 8) {
        this.showToast('Ingresa el DNI del titular para validación PCI de Mercado Pago', 'error');
        return;
      }
    } else if (this.mpBookingSubMethod === 'YAPE') {
      if (this.mpYapeOtp && !/^\d{6}$/.test(this.mpYapeOtp.trim())) {
        this.showToast('El código de aprobación de Yape debe tener exactamente 6 dígitos', 'error');
        return;
      }
    }

    this.bookingSubmitting = true;
    const totalAmount = this.calculateBookingTotal();
    const currentUser = this.auth.currentUser();

    // Procesar con la API de Mercado Pago
    this.mpService.processPayment({
      title: `Reserva RoomiGo: ${room.title} (Abancay)`,
      amount: totalAmount,
      currency: 'PEN',
      subMethod: this.mpBookingSubMethod,
      payerEmail: currentUser?.email || 'inquilino@roomix.com',
      payerName: `${currentUser?.firstName || 'Inquilino'} ${currentUser?.lastName || 'RoomiGo'}`.trim(),
      payerDni: this.mpCardDni || '74829103',
      cardNumber: this.mpCardNumber,
      cardHolder: this.mpCardHolder,
      cardExpMonth: this.mpCardExp.split('/')[0] || '12',
      cardExpYear: this.mpCardExp.split('/')[1] || '28',
      cardCvv: this.mpCardCvv,
      installments: this.mpInstallments,
      yapeOtp: this.mpYapeOtp,
      notes: this.bookingNotes,
      entityType: 'BOOKING',
      entityId: room.id
    }).subscribe({
      next: (mpResult: MercadoPagoPaymentResult) => {
        this.bookingPaymentRef = mpResult.id;
        const payNotes = `[Mercado Pago: ${mpResult.paymentMethod} | Ref: ${mpResult.id} | Auth: ${mpResult.authorizationCode}] ${this.bookingNotes || ''}`.trim();

        this.api.createBooking({
          roomId: room.id,
          startDate: this.bookingStartDate,
          endDate: this.bookingEndDate,
          notes: payNotes
        }).subscribe({
          next: res => {
            this.bookingSubmitting = false;
            this.closeBookingModal();
            this.mpReceiptData = mpResult;
            this.showMpSuccessReceipt.set(true);
            this.showToast(`¡Solicitud enviada al propietario (${mpResult.id})!`, 'success');
            // La habitación se mantiene visible en el Landing Page hasta que el propietario confirme
            this.loadRooms();
            this.loadOwnerData();
            this.loadTenantBookings();
            this.activeTab.set('my-bookings');
          },
          error: err => {
            this.bookingSubmitting = false;
            const msg = err.error?.message || 'Error al procesar la reserva';
            this.showToast(msg, 'error');
          }
        });
      },
      error: () => {
        this.bookingSubmitting = false;
        this.showToast('Error al conectar con la pasarela de Mercado Pago. Intenta nuevamente.', 'error');
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
    this.newRoomPaymentRef = '';
    this.newRoomImages = [];
    this.newRoomImageUrlInput = '';
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
    this.newRoomTitle = '';
    this.newRoomDescription = '';
    this.newRoomPrice = 320;
    this.newRoomDeposit = 150;
    this.newRoomType = 'SINGLE';
    this.newRoomBathroom = true;
    this.newRoomCapacity = 1;
    this.newRoomSize = 18;
    this.newRoomWifi = true;
    this.newRoomPets = false;
    this.newRoomPaymentMethod = 'YAPE';
    this.newRoomPaymentRef = '';
    this.newRoomImages = [];
    this.newRoomImageUrlInput = '';
    this.manualPropertyTitle = '';
    this.manualPropertyAddress = '';
    this.manualPropertyDistrict = 'Tamburco';
    this.newRoomPropertyMode = 'select';
    this.mpPublishSubMethod = 'YAPE';
    this.publishVoucherImage = '';
    this.publishVoucherFileName = '';
  }

  onSelectRoomPhotos(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const remainingSlots = 5 - this.newRoomImages.length;
    if (remainingSlots <= 0) {
      this.showToast('Ya has alcanzado el límite máximo de 5 fotos', 'error');
      return;
    }

    const filesToRead = Array.from(input.files).slice(0, remainingSlots);
    for (const file of filesToRead) {
      // Previsualización instantánea en 0 milisegundos con ObjectURL
      const tempUrl = URL.createObjectURL(file);
      this.newRoomImages = [...this.newRoomImages, tempUrl];
      this.cdr.detectChanges();

      // Carga en background a Base64 sin retrasar la interfaz
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.ngZone.run(() => {
          if (e.target?.result) {
            const dataUrl = e.target.result as string;
            const idx = this.newRoomImages.indexOf(tempUrl);
            if (idx !== -1) {
              this.newRoomImages[idx] = dataUrl;
            }
            this.cdr.detectChanges();
          }
        });
      };
      reader.readAsDataURL(file);
    }

    if (input.files.length > remainingSlots) {
      this.showToast(`Solo se agregaron ${remainingSlots} fotos (máximo 5 permitidas)`, 'info');
    }
    input.value = '';
    this.cdr.detectChanges();
  }

  addPhotoUrl(): void {
    const url = this.newRoomImageUrlInput.trim();
    if (!url) return;
    if (this.newRoomImages.length >= 5) {
      this.showToast('Máximo 5 fotos permitidas', 'error');
      return;
    }
    this.newRoomImages = [...this.newRoomImages, url];
    this.newRoomImageUrlInput = '';
    this.cdr.detectChanges();
  }

  removePhoto(index: number): void {
    this.newRoomImages.splice(index, 1);
    this.newRoomImages = [...this.newRoomImages];
    this.cdr.detectChanges();
  }

  submitNewRoom(): void {
    if (!this.newRoomTitle.trim()) {
      this.showToast('El título de la habitación es obligatorio', 'error');
      return;
    }

    // Validaciones Mercado Pago para publicación
    if (this.mpPublishSubMethod === 'CREDIT_CARD' || this.mpPublishSubMethod === 'DEBIT_CARD') {
      const cleanNum = this.mpPublishCardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        this.showToast('Ingresa los 16 dígitos de la tarjeta para pagar la publicación', 'error');
        return;
      }
      if (!this.mpPublishCardHolder.trim()) {
        this.showToast('Ingresa el nombre del titular de la tarjeta', 'error');
        return;
      }
      if (!this.mpPublishCardExp.trim() || !/^\d{2}\/\d{2}$/.test(this.mpPublishCardExp.trim())) {
        this.showToast('Ingresa la fecha de expiración MM/AA (ej. 09/27)', 'error');
        return;
      }
      if (!this.mpPublishCardCvv.trim() || this.mpPublishCardCvv.trim().length < 3) {
        this.showToast('Ingresa el código de seguridad CVV', 'error');
        return;
      }
      if (!this.mpPublishCardDni.trim() || this.mpPublishCardDni.trim().length < 8) {
        this.showToast('Ingresa el DNI del titular para procesar con Mercado Pago', 'error');
        return;
      }
    } else if (this.mpPublishSubMethod === 'YAPE' || this.mpPublishSubMethod === 'PLIN') {
      if (this.mpPublishYapeOtp && !/^\d{6}$/.test(this.mpPublishYapeOtp.trim())) {
        this.showToast('El código de aprobación debe tener 6 números', 'error');
        return;
      }
    }

    const mainImg = this.newRoomImages.length > 0 
      ? this.newRoomImages[0] 
      : (this.newRoomImageUrl.trim() || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80');

    this.newRoomSubmitting = true;
    const currentUser = this.auth.currentUser();

    // Procesar tarifa de publicación (S/. 15.00) mediante la API de Mercado Pago
    this.mpService.processPayment({
      title: `Tarifa de Publicación: ${this.newRoomTitle.trim()} (Abancay)`,
      amount: this.publicationFee,
      currency: 'PEN',
      subMethod: this.mpPublishSubMethod,
      payerEmail: currentUser?.email || '',
      payerName: `${currentUser?.firstName || 'Propietario'} ${currentUser?.lastName || ''}`.trim(),
      payerDni: this.mpPublishCardDni || '',
      cardNumber: this.mpPublishCardNumber,
      cardHolder: this.mpPublishCardHolder,
      cardExpMonth: this.mpPublishCardExp.split('/')[0] || '12',
      cardExpYear: this.mpPublishCardExp.split('/')[1] || '28',
      cardCvv: this.mpPublishCardCvv,
      installments: this.mpPublishInstallments,
      yapeOtp: this.mpPublishYapeOtp,
      entityType: 'ROOM_PUBLICATION'
    }).subscribe({
      next: (mpResult: MercadoPagoPaymentResult) => {
        this.newRoomPaymentRef = mpResult.id;

        // Modo Inmueble Manual: Primero crea la propiedad en Abancay y luego el cuarto
        if (this.newRoomPropertyMode === 'manual') {
          if (!this.manualPropertyTitle.trim() || !this.manualPropertyAddress.trim()) {
            this.newRoomSubmitting = false;
            this.showToast('Ingresa el nombre del inmueble y la dirección exacta en Abancay', 'error');
            return;
          }
          this.api.createProperty({
            title: this.manualPropertyTitle.trim(),
            description: `Inmueble ubicado en ${this.manualPropertyDistrict}, Abancay`,
            address: `${this.manualPropertyAddress.trim()} (${this.manualPropertyDistrict})`,
            city: 'Abancay',
            country: 'Perú'
          }).subscribe({
            next: pRes => {
              if (pRes.success && pRes.data) {
                this.newRoomPropertyId = pRes.data.id;
                this.loadOwnerData();
                this.executeCreateRoom(pRes.data.id, mainImg, mpResult);
              } else {
                this.newRoomSubmitting = false;
                this.showToast('Error al registrar el inmueble manual', 'error');
              }
            },
            error: err => {
              this.newRoomSubmitting = false;
              this.showToast(err.error?.message || 'Error al crear el inmueble manual', 'error');
            }
          });
        } else {
          if (!this.newRoomPropertyId) {
            this.newRoomSubmitting = false;
            this.showToast('Selecciona una propiedad de Abancay o escribe una manualmente', 'error');
            return;
          }
          this.executeCreateRoom(this.newRoomPropertyId, mainImg, mpResult);
        }
      },
      error: () => {
        this.newRoomSubmitting = false;
        this.showToast('Error al procesar el pago con Mercado Pago. Intenta nuevamente.', 'error');
      }
    });
  }

  private executeCreateRoom(propertyId: number, mainImg: string, mpResult?: MercadoPagoPaymentResult): void {
    const paymentRef = mpResult ? mpResult.id : (this.newRoomPaymentRef || `MP-${Date.now()}`);
    const methodStr = mpResult ? `MERCADO_PAGO_${this.mpPublishSubMethod}` : 'MERCADO_PAGO';

    this.api.createRoom({
      propertyId: propertyId,
      title: this.newRoomTitle.trim(),
      description: this.newRoomDescription.trim(),
      pricePerMonth: this.newRoomPrice,
      depositPrice: this.newRoomDeposit,
      roomType: this.newRoomType,
      privateBathroom: this.newRoomBathroom,
      capacity: this.newRoomCapacity,
      sizeSqm: this.newRoomSize,
      offersWifi: this.newRoomWifi,
      acceptsPets: this.newRoomPets,
      mainImageUrl: mainImg,
      imageUrls: this.newRoomImages,
      paymentMethod: methodStr,
      paymentReference: paymentRef
    }).subscribe({
      next: res => {
        this.newRoomSubmitting = false;
        if (res.success) {
          this.closeNewRoomModal();
          if (mpResult) {
            this.mpReceiptData = mpResult;
            this.showMpSuccessReceipt.set(true);
          }
          this.showToast(`¡Pago de S/. ${this.publicationFee.toFixed(2)} verificado (${paymentRef})! Anuncio publicado.`, 'success');
          this.loadRooms();
          this.loadOwnerData();
        }
      },
      error: err => {
        this.newRoomSubmitting = false;
        const msg = err.error?.message || 'Error al publicar habitación';
        this.showToast(msg, 'error');
      }
    });
  }

  // ==========================================
  // MERCADO PAGO INPUT FORMATTERS & HELPERS
  // ==========================================
  onMpCardNumberInput(event: Event, target: 'booking' | 'publish'): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.mpService.formatCardNumber(input.value);
    if (target === 'booking') {
      this.mpCardNumber = formatted;
    } else {
      this.mpPublishCardNumber = formatted;
    }
    input.value = formatted;
  }

  onMpCardExpInput(event: Event, target: 'booking' | 'publish'): void {
    const input = event.target as HTMLInputElement;
    const formatted = this.mpService.formatExpiry(input.value);
    if (target === 'booking') {
      this.mpCardExp = formatted;
    } else {
      this.mpPublishCardExp = formatted;
    }
    input.value = formatted;
  }

  onMpDniInput(event: Event, target: 'booking' | 'publish'): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 8);
    if (target === 'booking') {
      this.mpCardDni = digitsOnly;
    } else {
      this.mpPublishCardDni = digitsOnly;
    }
    input.value = digitsOnly;
  }

  onMpYapeOtpInput(event: Event, target: 'booking' | 'publish'): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 6);
    if (target === 'booking') {
      this.mpYapeOtp = digitsOnly;
    } else {
      this.mpPublishYapeOtp = digitsOnly;
    }
    input.value = digitsOnly;
  }

  closeMpReceipt(): void {
    this.showMpSuccessReceipt.set(false);
    this.mpReceiptData = null;
  }

  generateCipCode(): void {
    this.mpCipGenerated = true;
    this.mpGeneratedCip = `CIP-${Math.floor(10000000 + Math.random() * 90000000)}`;
  }

  // ==========================================
  // GESTIÓN DE PUBLICACIONES DEL PROPIETARIO (VER, EDITAR Y QUITAR)
  // ==========================================
  openOwnerEditRoomModal(room: Room): void {
    this.ownerEditingRoom = room;
    this.ownerEditTitle = room.title;
    this.ownerEditDescription = room.description || '';
    this.ownerEditPrice = room.pricePerMonth;
    this.ownerEditDeposit = room.depositPrice;
    this.ownerEditType = room.roomType;
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
    if (this.ownerEditPrice <= 0) {
      this.showToast('El precio mensual debe ser mayor a 0', 'error');
      return;
    }
    this.ownerEditSaving = true;
    const roomId = this.ownerEditingRoom.id;
    this.api.updateRoom(roomId, {
      title: this.ownerEditTitle.trim(),
      description: this.ownerEditDescription.trim(),
      pricePerMonth: this.ownerEditPrice,
      depositPrice: this.ownerEditDeposit,
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

  get adminReportStats() {
    const rooms = this.adminAllRooms();
    const total = rooms.length;
    const available = rooms.filter(r => r.status === 'AVAILABLE').length;
    const occupied = rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'RENTED').length;
    const pending = this.pendingRooms().length;
    const feesCollected = total * 15;
    const avgPrice = total > 0 ? Math.round(rooms.reduce((s, r) => s + (r.pricePerMonth || 0), 0) / total) : 0;
    const yapeCount = rooms.filter(r => (r.paymentMethod || 'YAPE') === 'YAPE').length;
    const plinCount = rooms.filter(r => r.paymentMethod === 'PLIN').length;

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
      yapeCount,
      plinCount,
      tamburco,
      centro,
      utea,
      unamba
    };
  }

  openAdminEditModal(room: Room): void {
    this.adminEditingRoom = room;
    this.adminEditTitle = room.title;
    this.adminEditPrice = room.pricePerMonth;
    this.adminEditDeposit = room.depositPrice;
    this.adminEditType = room.roomType;
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
    this.api.updateRoomAdmin(roomId, {
      title: this.adminEditTitle.trim(),
      pricePerMonth: this.adminEditPrice,
      depositPrice: this.adminEditDeposit,
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
  // YAPE INPUT FORMATTER (EXACTLY 6 DIGITS)
  // ==========================================
  onYapeInput(event: Event, target: 'booking' | 'publish'): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, '').slice(0, 6);
    if (target === 'booking') {
      this.bookingPaymentRef = digitsOnly;
    } else {
      this.newRoomPaymentRef = digitsOnly;
    }
    input.value = digitsOnly;
  }

  // ==========================================
  // AUTHENTICATION MODAL & DEMO LOGINS
  // ==========================================
  openAuth(mode: 'login' | 'register'): void {
    this.authMode.set(mode);
    this.authError = '';
    this.showAuthModal.set(true);
  }

  closeAuth(): void {
    this.showAuthModal.set(false);
    this.resetAuthForm();
  }

  resetAuthForm(): void {
    this.authEmail = '';
    this.authPassword = '';
    this.showAuthPassword.set(false);
    this.authFirstName = '';
    this.authLastName = '';
    this.authPhone = '';
    this.authRole = 'ROLE_TENANT';
    this.authError = '';
    this.authResetEmail = '';
    this.authResetCode = '';
    this.authNewPassword = '';
    this.authConfirmPassword = '';
    this.authResetStep = 'REQUEST_CODE';
    this.authResetSuccessMessage = '';
  }

  submitAuth(): void {
    this.authError = '';
    const emailVal = this.authEmail.trim();
    const passwordVal = this.authPassword;

    // Validación rápida e instantánea de campos requeridos
    if (!emailVal && !passwordVal) {
      this.authError = 'Por favor ingresa tu correo y contraseña.';
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
      if (!this.authFirstName.trim() || !this.authLastName.trim()) {
        this.authError = 'Por favor ingresa tu nombre y apellido.';
        return;
      }
      if (passwordVal.length < 8) {
        this.authError = 'La contraseña debe tener al menos 8 caracteres.';
        return;
      }
    }

    this.authLoading = true;
    if (this.authMode() === 'login') {
      this.auth.login({ email: this.authEmail.trim(), password: this.authPassword }).subscribe({
        next: res => {
          this.authLoading = false;
          if (res.success) {
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
        email: this.authEmail.trim(),
        password: this.authPassword,
        phone: this.authPhone.trim() || undefined,
        role: this.authRole
      }).subscribe({
        next: res => {
          this.authLoading = false;
          if (res.success) {
            this.closeAuth();
            const roleLabel = this.authRole === 'ROLE_ADMIN' 
              ? 'Administrador General' 
              : (this.authRole === 'ROLE_OWNER' ? 'Propietario' : 'Inquilino');
            this.showToast(`¡Cuenta de ${roleLabel} creada con éxito! Bienvenido, ${res.data.user.firstName}`, 'success');
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
          this.authError = details || err.error?.message || 'Error al registrar la cuenta';
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
    if (this.socialTimerInterval) {
      clearInterval(this.socialTimerInterval);
      this.socialTimerInterval = null;
    }
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
  switchTab(tab: 'explore' | 'my-bookings' | 'owner-panel' | 'admin-panel'): void {
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
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    } else {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  onSearchRoomsClick(): void {
    const el = document.getElementById('cuartos-catalog-grid') || document.getElementById('cuartos-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onPublishPropertyClick(): void {
    if (!this.auth.isLoggedIn()) {
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
