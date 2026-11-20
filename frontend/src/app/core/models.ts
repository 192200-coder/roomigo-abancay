export type UserRole = 'ROLE_ADMIN' | 'ROLE_OWNER' | 'ROLE_TENANT';
/** Tipo de inmueble, orientado al público: cuarto (estudiantes), minidepartamento (parejas),
 * departamento (familias grandes) o casa entera. */
export type RoomType = 'ROOM' | 'MINI_APARTMENT' | 'APARTMENT' | 'HOUSE';
/** Alquiler mensual o venta. */
export type ListingOperation = 'RENT' | 'SALE';
export type RoomStatus = 'PENDING_APPROVAL' | 'AVAILABLE' | 'RENTED' | 'OCCUPIED' | 'MAINTENANCE' | 'REJECTED' | 'SOLD';
/** Qué muestra cada foto. Fachada, habitación y baño son obligatorias. */
export type PhotoCategory = 'FACADE' | 'ROOM' | 'BATHROOM' | 'LIVING_KITCHEN' | 'OTHER';

export interface RoomPhoto {
  url: string;
  category: PhotoCategory;
}

// Traducciones oficiales de estados en español para toda la aplicación
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupado',
  RENTED: 'Alquilado',
  PENDING_APPROVAL: 'Pendiente de Aprobación',
  MAINTENANCE: 'En Mantenimiento',
  REJECTED: 'Rechazado',
  SOLD: 'Vendido'
};

export type RoomStatusEs = 'Disponible' | 'Ocupado' | 'Alquilado' | 'Pendiente de Aprobación' | 'En Mantenimiento' | 'Rechazado';
export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: string;
  status: string;
  createdAt?: string;
}


export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: User;
}

export interface Property {
  id: number;
  title: string;
  description: string;
  address: string;
  city: string;
  district?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  owner?: User;
  createdAt?: string;
}

export interface PropertyRequest {
  title: string;
  description: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface Room {
  id: number;
  propertyId: number;
  propertyCity?: string;
  propertyDistrict?: string;
  propertyAddress?: string;
  title: string;
  description: string;
  /** Alquiler o venta (las publicaciones antiguas llegan como RENT). */
  operation?: ListingOperation;
  /** Renta mensual; null en venta. */
  pricePerMonth: number;
  /** Depósito de garantía; null en venta. */
  depositPrice: number;
  /** Precio de venta; null en alquiler. */
  salePrice?: number | null;
  roomType: RoomType;
  status: RoomStatus;
  privateBathroom: boolean;
  capacity: number;
  /** Área construida (o del cuarto) en m². */
  sizeSqm?: number;
  landAreaSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  /** Galería completa con categorías: solo viene en el detalle (GET /rooms/{id}). */
  photos?: RoomPhoto[] | null;
  offersWifi: boolean;
  acceptsPets: boolean;
  mainImageUrl?: string;
  averageRating?: number;
  totalReviews?: number;
  publicationFeePaid?: boolean;
  paymentMethod?: string;
  paymentReference?: string;
  publicationFeeAmount?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  createdAt?: string;
}

export interface RoomRequest {
  propertyId: number;
  title: string;
  description: string;
  operation: ListingOperation;
  pricePerMonth?: number | null;
  depositPrice?: number | null;
  salePrice?: number | null;
  roomType: RoomType;
  privateBathroom: boolean;
  capacity: number;
  sizeSqm?: number | null;
  landAreaSqm?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  offersWifi: boolean;
  acceptsPets: boolean;
  mainImageUrl?: string;
  /** Al crear: obligatorio (fachada + habitación + baño). Al editar: omitir conserva las actuales. */
  photos?: RoomPhoto[];
  paymentMethod?: string;
  paymentReference?: string;
  status?: RoomStatus | string;
}

export interface AdminStats {
  totalRooms: number;
  pendingRooms: number;
  availableRooms: number;
  totalUsers: number;
  totalProperties: number;
  totalReservations: number;
  totalFeesCollected: number;
  city: string;
}

export interface RoomFilter {
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  operation?: ListingOperation;
  roomType?: RoomType;
  minBedrooms?: number;
  privateBathroom?: boolean;
  offersWifi?: boolean;
  acceptsPets?: boolean;
  minRating?: number;
}

export interface Booking {
  id: number;
  room: Room;
  tenant: User;
  startDate: string;
  endDate: string;
  /** Duración contratada en meses (endDate = startDate + months). */
  months?: number;
  /** Valor total del contrato: renta × meses + depósito. */
  totalPrice: number;
  /** Primer mes + depósito: lo que se cobra al pagar la reserva aprobada. */
  initialPayment?: number;
  /** Estado del pago por Mercado Pago (null si aún no se inició). */
  paymentStatus?: PaymentStatus | null;
  status: ReservationStatus;
  notes?: string;
  createdAt?: string;
}

export interface BookingRequest {
  roomId: number;
  startDate: string;
  /** Duración del alquiler en meses (1–12). El backend calcula la fecha de fin. */
  months: number;
  notes?: string;
}

export interface Review {
  id: number;
  roomId: number;
  authorName: string;
  rating: number;
  comment: string;
  createdAt?: string;
}

export interface ReviewRequest {
  bookingId: number;
  rating: number;
  comment: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface SocialSendCodeRequest {
  email: string;
  provider: 'GOOGLE' | 'FACEBOOK';
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface SocialVerifyCodeRequest {
  email: string;
  code: string;
  provider: 'GOOGLE' | 'FACEBOOK';
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  phone?: string;
  avatarUrl?: string;
}

export interface SendCodeResponse {
  email: string;
  provider: string;
  codeSent: boolean;
  expiresInSeconds: number;
  message: string;
  devCode?: string;
}

// ==========================================
// MERCADO PAGO INTEGRATION MODELS
// ==========================================
export type MercadoPagoSubMethod = 'YAPE' | 'PLIN' | 'CREDIT_CARD' | 'DEBIT_CARD';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
export type PaymentPurpose = 'BOOKING' | 'ROOM_PUBLICATION';

/** Checkout Pro creado por el backend: el frontend redirige a checkoutUrl. */
export interface CheckoutSession {
  paymentId: number;
  purpose: PaymentPurpose;
  preferenceId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

/** Estado de un pago conciliado por el backend con Mercado Pago. */
export interface PaymentStatusResult {
  paymentId: number;
  purpose: PaymentPurpose;
  reservationId?: number;
  roomId: number;
  concept: string;
  status: PaymentStatus;
  statusDetail?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  /** Número de operación en Mercado Pago. */
  providerPaymentId?: string;
  paidAt?: string;
}



export type NotificationType =
  | 'BOOKING_REQUEST' | 'BOOKING_APPROVED' | 'BOOKING_REJECTED' | 'BOOKING_CANCELLED'
  | 'PAYMENT_CONFIRMED' | 'PAYMENT_RECEIVED' | 'PUBLICATION_PAID'
  | 'ROOM_APPROVED' | 'ROOM_REJECTED' | 'REVIEW_RECEIVED'
  | 'VISIT_REQUESTED' | 'VISIT_CONFIRMED' | 'VISIT_DECLINED' | 'VISIT_CANCELLED';

/** Aviso para el usuario autenticado (reservas, pagos, publicaciones). */
export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ==========================================
// VISITAS (publicaciones en venta)
// ==========================================
export type VisitRequestStatus = 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';

export interface VisitRequestPayload {
  roomId: number;
  /** yyyy-MM-dd */
  preferredDate: string;
  /** HH:mm (opcional) */
  preferredTime?: string | null;
  contactPhone?: string;
  message?: string;
}

export interface VisitRequest {
  id: number;
  roomId: number;
  roomTitle: string;
  roomAddress?: string;
  roomMainImageUrl?: string;
  salePrice?: number;
  requesterName: string;
  requesterEmail: string;
  contactPhone?: string;
  ownerName: string;
  /** Solo llega al interesado cuando el propietario confirma. */
  ownerPhone?: string | null;
  preferredDate: string;
  preferredTime?: string | null;
  message?: string;
  status: VisitRequestStatus;
  ownerNote?: string;
  createdAt?: string;
}
