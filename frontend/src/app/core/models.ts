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
  totalPrice: number;
  status: ReservationStatus;
  notes?: string;
  createdAt?: string;
}

export interface BookingRequest {
  roomId: number;
  startDate: string;
  endDate: string;
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

export interface MercadoPagoPaymentRequest {
  title: string;
  amount: number;
  currency: 'PEN';
  subMethod: MercadoPagoSubMethod;
  payerEmail: string;
  payerName: string;
  payerDni?: string;
  cardNumber?: string;
  cardHolder?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardCvv?: string;
  installments?: number;
  yapeOtp?: string;
  notes?: string;
  entityType: 'BOOKING' | 'ROOM_PUBLICATION';
  entityId?: number;
}

export interface MercadoPagoPaymentResult {
  id: string; // e.g. MP-98421048
  status: 'approved' | 'in_process' | 'rejected' | 'pending';
  statusDetail: string;
  paymentMethod: string;
  paymentTypeId: string;
  transactionAmount: number;
  currency: string;
  dateApproved: string;
  authorizationCode: string;
  cipCode?: string; // Para PagoEfectivo
  qrCode?: string;  // Para Yape / QR
  qrCodeBase64?: string;
  receiptUrl?: string;
}

