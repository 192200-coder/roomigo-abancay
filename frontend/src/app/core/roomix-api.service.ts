import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  PageResponse,
  Room,
  RoomFilter,
  RoomRequest,
  Property,
  PropertyRequest,
  Booking,
  BookingRequest,
  Review,
  ReviewRequest,
  AdminStats
} from './models';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoomixApiService {
  private readonly baseUrl = 'http://localhost:8081/api/v1';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ==========================================
  // HABITACIONES (ROOMS)
  // ==========================================
  searchRooms(
    filter?: RoomFilter,
    page: number = 0,
    size: number = 50,
    sortBy: string = 'id',
    sortDir: string = 'DESC'
  ): Observable<ApiResponse<PageResponse<Room>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    if (filter) {
      if (filter.city) params = params.set('city', filter.city);
      if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.roomType) params = params.set('roomType', filter.roomType);
      if (filter.privateBathroom != null) params = params.set('privateBathroom', filter.privateBathroom.toString());
      if (filter.offersWifi != null) params = params.set('offersWifi', filter.offersWifi.toString());
      if (filter.acceptsPets != null) params = params.set('acceptsPets', filter.acceptsPets.toString());
      if (filter.minRating != null) params = params.set('minRating', filter.minRating.toString());
    }

    return this.http.get<ApiResponse<PageResponse<Room>>>(`${this.baseUrl}/rooms/search`, { params });
  }

  getRoomById(id: number): Observable<ApiResponse<Room>> {
    return this.http.get<ApiResponse<Room>>(`${this.baseUrl}/rooms/${id}`);
  }

  createRoom(request: RoomRequest): Observable<ApiResponse<Room>> {
    return this.http.post<ApiResponse<Room>>(`${this.baseUrl}/rooms`, request, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateRoomStatus(id: number, status: string): Observable<ApiResponse<Room>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/rooms/${id}/status`, null, {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  // ==========================================
  // PROPIEDADES (PROPERTIES)
  // ==========================================
  getMyProperties(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.baseUrl}/properties/my-properties`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  createProperty(request: PropertyRequest): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.baseUrl}/properties`, request, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==========================================
  // RESERVAS (BOOKINGS)
  // ==========================================
  createBooking(request: BookingRequest): Observable<ApiResponse<Booking>> {
    return this.http.post<ApiResponse<Booking>>(`${this.baseUrl}/bookings`, request, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getTenantBookings(): Observable<ApiResponse<Booking[]>> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.baseUrl}/bookings/my-bookings`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getOwnerBookings(): Observable<ApiResponse<Booking[]>> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.baseUrl}/bookings/owner-requests`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateBookingStatus(bookingId: number, status: string): Observable<ApiResponse<Booking>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<Booking>>(`${this.baseUrl}/bookings/${bookingId}/status`, null, {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  // ==========================================
  // RESEÑAS (REVIEWS)
  // ==========================================
  getReviewsByRoom(roomId: number): Observable<ApiResponse<Review[]>> {
    return this.http.get<ApiResponse<Review[]>>(`${this.baseUrl}/reviews/room/${roomId}`);
  }

  createReview(request: ReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.baseUrl}/reviews`, request, {
      headers: this.auth.getAuthHeaders()
    });
  }

  // ==========================================
  // ADMINISTRADOR GENERAL (ADMIN)
  // ==========================================
  getPendingRooms(): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(`${this.baseUrl}/admin/rooms/pending`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getAllRoomsAdmin(): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(`${this.baseUrl}/admin/rooms`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  approveRoom(id: number): Observable<ApiResponse<Room>> {
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}/approve`, null, {
      headers: this.auth.getAuthHeaders()
    });
  }

  rejectRoom(id: number, reason?: string): Observable<ApiResponse<Room>> {
    let params = new HttpParams();
    if (reason) params = params.set('reason', reason);
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}/reject`, null, {
      headers: this.auth.getAuthHeaders(),
      params
    });
  }

  getAdminStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.baseUrl}/admin/stats`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateRoomLocation(id: number, locationData: { address: string; district: string; city?: string; latitude?: string; longitude?: string }): Observable<ApiResponse<Room>> {
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}/location`, locationData, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateRoom(id: number, data: Partial<RoomRequest>): Observable<ApiResponse<Room>> {
    return this.http.put<ApiResponse<Room>>(`${this.baseUrl}/rooms/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  deleteRoom(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/rooms/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateRoomAdmin(id: number, data: Partial<RoomRequest>): Observable<ApiResponse<Room>> {
    return this.http.put<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    });
  }

  deleteRoomAdmin(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/rooms/${id}`, {
      headers: this.auth.getAuthHeaders()
    });
  }
}
