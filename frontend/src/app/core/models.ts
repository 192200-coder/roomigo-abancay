export type UserRole = 'ROLE_ADMIN' | 'ROLE_OWNER' | 'ROLE_TENANT';
export type RoomType = 'SINGLE' | 'DOUBLE' | 'SUITE' | 'SHARED';
export type RoomStatus = 'PENDING_APPROVAL' | 'AVAILABLE' | 'RENTED' | 'OCCUPIED' | 'MAINTENANCE' | 'REJECTED';

// Traducciones oficiales de estados en español para toda la aplicación
export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  AVAILABLE: 'Disponible',
  OCCUPIED: 'Ocupado',
  RENTED: 'Alquilado',
  PENDING_APPROVAL: 'Pendiente de Aprobación',
  MAINTENANCE: 'En Mantenimiento',
  REJECTED: 'Rechazado'
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
  pricePerMonth: number;
  depositPrice: number;
  roomType: RoomType;
  status: RoomStatus;
  privateBathroom: boolean;
  capacity: number;
  sizeSqm?: number;
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
  pricePerMonth: number;
  depositPrice: number;
  roomType: RoomType;
  privateBathroom: boolean;
  capacity: number;
  sizeSqm?: number;
  offersWifi: boolean;
  acceptsPets: boolean;
  mainImageUrl?: string;
  imageUrls?: string[];
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
  roomType?: RoomType;
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
  | 'ROOM_APPROVED' | 'ROOM_REJECTED' | 'REVIEW_RECEIVED';

/** Aviso para el usuario autenticado (reservas, pagos, publicaciones). */
export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
