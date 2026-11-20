import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
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
  AdminStats,
  VisitRequest,
  VisitRequestPayload,
  VisitRequestStatus
} from './models';
import { AuthService } from './auth.service';
import {
  getMockRooms,
  saveMockRooms,
  getMockProperties,
  getMockReviews,
  addMockReview,
  getMockAdminStats,
  INITIAL_MOCK_ROOMS,
  INITIAL_MOCK_PROPERTIES
} from './mock-data';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class RoomixApiService {
  private get baseUrl(): string {
    return getApiBaseUrl();
  }

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
      if (filter.district) params = params.set('district', filter.district);
      if (filter.minPrice != null) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice != null) params = params.set('maxPrice', filter.maxPrice.toString());
      if (filter.operation) params = params.set('operation', filter.operation);
      if (filter.roomType) params = params.set('roomType', filter.roomType);
      if (filter.minBedrooms != null) params = params.set('minBedrooms', filter.minBedrooms.toString());
      if (filter.privateBathroom != null) params = params.set('privateBathroom', filter.privateBathroom.toString());
      if (filter.offersWifi != null) params = params.set('offersWifi', filter.offersWifi.toString());
      if (filter.acceptsPets != null) params = params.set('acceptsPets', filter.acceptsPets.toString());
      if (filter.minRating != null) params = params.set('minRating', filter.minRating.toString());
    }

    return this.http.get<ApiResponse<PageResponse<Room>>>(`${this.baseUrl}/rooms/search`, { params });
  }

  getRoomById(id: number): Observable<ApiResponse<Room>> {
    return this.http.get<ApiResponse<Room>>(`${this.baseUrl}/rooms/${id}`).pipe(
      catchError(() => {
        const found = getMockRooms().find(r => r.id === id) || INITIAL_MOCK_ROOMS[0];
        return of({
          success: true,
          message: 'Habitación cargada',
          data: found
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          room.status = status as any;
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Estado de habitación actualizado',
          data: room || ({} as Room)
        });
      })
    );
  }

  // ==========================================
  // PROPIEDADES (PROPERTIES)
  // ==========================================
  getMyProperties(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.baseUrl}/properties/my-properties`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getMyRooms(): Observable<ApiResponse<Room[]>> {
    return this.http.get<ApiResponse<Room[]>>(`${this.baseUrl}/rooms/my-rooms`, {
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
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Mis reservas',
          data: []
        });
      })
    );
  }

  getOwnerBookings(): Observable<ApiResponse<Booking[]>> {
    return this.http.get<ApiResponse<Booking[]>>(`${this.baseUrl}/bookings/owner-requests`, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Solicitudes recibidas',
          data: []
        });
      })
    );
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
    return this.http.get<ApiResponse<Review[]>>(`${this.baseUrl}/reviews/room/${roomId}`).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Reseñas obtenidas',
          data: getMockReviews(roomId)
        });
      })
    );
  }

  createReview(request: ReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.baseUrl}/reviews`, request, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const newRev: Review = {
          id: Date.now(),
          roomId: request.bookingId || 1,
          authorName: 'Inquilino Roomix',
          rating: request.rating,
          comment: request.comment,
          createdAt: new Date().toISOString()
        };
        addMockReview(newRev);
        return of({
          success: true,
          message: 'Reseña registrada con éxito',
          data: newRev
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Todas las habitaciones',
          data: getMockRooms()
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          room.status = 'REJECTED';
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Habitación rechazada',
          data: room || ({} as Room)
        });
      })
    );
  }

  getAdminStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.baseUrl}/admin/stats`, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Estadísticas del sistema',
          data: getMockAdminStats()
        });
      })
    );
  }

  updateRoomLocation(id: number, locationData: { address: string; district: string; city?: string; latitude?: string; longitude?: string }): Observable<ApiResponse<Room>> {
    return this.http.patch<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}/location`, locationData, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          room.propertyAddress = locationData.address;
          if (locationData.city) room.propertyCity = locationData.city;
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Ubicación actualizada',
          data: room || ({} as Room)
        });
      })
    );
  }

  updateRoom(id: number, data: Partial<RoomRequest>): Observable<ApiResponse<Room>> {
    return this.http.put<ApiResponse<Room>>(`${this.baseUrl}/rooms/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          Object.assign(room, data);
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Habitación actualizada',
          data: room || ({} as Room)
        });
      })
    );
  }

  deleteRoom(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/rooms/${id}`, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms().filter(r => r.id !== id);
        saveMockRooms(rooms);
        return of({
          success: true,
          message: 'Habitación eliminada',
          data: undefined
        });
      })
    );
  }

  updateRoomAdmin(id: number, data: Partial<RoomRequest>): Observable<ApiResponse<Room>> {
    return this.http.put<ApiResponse<Room>>(`${this.baseUrl}/admin/rooms/${id}`, data, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          Object.assign(room, data);
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Habitación actualizada por administrador',
          data: room || ({} as Room)
        });
      })
    );
  }

  deleteRoomAdmin(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/admin/rooms/${id}`, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms().filter(r => r.id !== id);
        saveMockRooms(rooms);
        return of({
          success: true,
          message: 'Habitación eliminada por administrador',
          data: undefined
        });
      })
    );
  }

  // ==========================================
  // VISITAS (publicaciones en venta)
  // Sin datos simulados: si falla, el error debe verse.
  // ==========================================
  createVisitRequest(payload: VisitRequestPayload): Observable<ApiResponse<VisitRequest>> {
    return this.http.post<ApiResponse<VisitRequest>>(`${this.baseUrl}/visit-requests`, payload, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getMyVisitRequests(): Observable<ApiResponse<VisitRequest[]>> {
    return this.http.get<ApiResponse<VisitRequest[]>>(`${this.baseUrl}/visit-requests/mine`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  getOwnerVisitRequests(): Observable<ApiResponse<VisitRequest[]>> {
    return this.http.get<ApiResponse<VisitRequest[]>>(`${this.baseUrl}/visit-requests/owner`, {
      headers: this.auth.getAuthHeaders()
    });
  }

  updateVisitRequestStatus(id: number, status: VisitRequestStatus, note?: string): Observable<ApiResponse<VisitRequest>> {
    return this.http.patch<ApiResponse<VisitRequest>>(`${this.baseUrl}/visit-requests/${id}/status`,
      { status, note: note?.trim() || null }, { headers: this.auth.getAuthHeaders() });
  }
}
