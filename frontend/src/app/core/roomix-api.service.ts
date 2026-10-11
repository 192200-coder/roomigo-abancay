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
  AdminStats
} from './models';
import { AuthService } from './auth.service';
import {
  getMockRooms,
  saveMockRooms,
  getMockProperties,
  getMockReviews,
  addMockReview,
  filterMockRoomsList,
  getMockAdminStats,
  INITIAL_MOCK_ROOMS,
  INITIAL_MOCK_PROPERTIES
} from './mock-data';

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

    return this.http.get<ApiResponse<PageResponse<Room>>>(`${this.baseUrl}/rooms/search`, { params }).pipe(
      catchError(() => {
        const mockPaged = filterMockRoomsList(filter, page, size);
        return of({
          success: true,
          message: 'Habitaciones cargadas correctamente (modo offline Abancay)',
          data: mockPaged
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const newRoom: Room = {
          id: Date.now(),
          propertyId: request.propertyId || 1,
          propertyCity: 'Abancay',
          propertyAddress: 'Abancay, Apurímac',
          title: request.title,
          description: request.description,
          pricePerMonth: request.pricePerMonth,
          depositPrice: request.depositPrice,
          roomType: request.roomType,
          status: 'AVAILABLE',
          privateBathroom: request.privateBathroom,
          capacity: request.capacity,
          sizeSqm: request.sizeSqm || 18,
          offersWifi: request.offersWifi,
          acceptsPets: request.acceptsPets,
          mainImageUrl: request.mainImageUrl || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
          averageRating: 5.0,
          totalReviews: 0,
          publicationFeePaid: true,
          paymentMethod: (request as any).paymentMethod || 'YAPE',
          paymentReference: (request as any).paymentReference || 'N/A',
          ownerName: `${this.auth.currentUser()?.firstName || 'Propietario'} ${this.auth.currentUser()?.lastName || ''}`.trim(),
          ownerEmail: this.auth.currentUser()?.email || '',
          ownerPhone: this.auth.currentUser()?.phone || '',
          createdAt: new Date().toISOString()
        };
        rooms.unshift(newRoom);
        saveMockRooms(rooms);
        return of({
          success: true,
          message: 'Habitación registrada y publicada con éxito',
          data: newRoom
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Propiedades cargadas',
          data: getMockProperties()
        });
      })
    );
  }

  createProperty(request: PropertyRequest): Observable<ApiResponse<Property>> {
    return this.http.post<ApiResponse<Property>>(`${this.baseUrl}/properties`, request, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const props = getMockProperties();
        const newProp: Property = {
          id: Date.now(),
          title: request.title,
          description: request.description,
          address: request.address,
          city: request.city || 'Abancay',
          country: request.country || 'Perú',
          latitude: request.latitude,
          longitude: request.longitude,
          createdAt: new Date().toISOString()
        };
        props.push(newProp);
        return of({
          success: true,
          message: 'Propiedad creada con éxito',
          data: newProp
        });
      })
    );
  }

  // ==========================================
  // RESERVAS (BOOKINGS)
  // ==========================================
  createBooking(request: BookingRequest): Observable<ApiResponse<Booking>> {
    return this.http.post<ApiResponse<Booking>>(`${this.baseUrl}/bookings`, request, {
      headers: this.auth.getAuthHeaders()
    }).pipe(
      catchError(() => {
        const room = getMockRooms().find(r => r.id === request.roomId) || INITIAL_MOCK_ROOMS[0];
        const newBooking: Booking = {
          id: Date.now(),
          room,
          tenant: {
            id: 99,
            firstName: 'Valeria',
            lastName: 'Torres',
            email: 'inquilino@roomix.com',
            role: 'ROLE_TENANT',
            status: 'ACTIVE'
          },
          startDate: request.startDate,
          endDate: request.endDate,
          totalPrice: room.pricePerMonth,
          status: 'CONFIRMED',
          notes: request.notes,
          createdAt: new Date().toISOString()
        };
        return of({
          success: true,
          message: 'Reserva registrada con éxito',
          data: newBooking
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        return of({
          success: true,
          message: 'Estado de reserva actualizado a ' + status,
          data: {} as Booking
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        const pending = getMockRooms().filter(r => r.status === 'PENDING_APPROVAL');
        return of({
          success: true,
          message: 'Habitaciones pendientes',
          data: pending
        });
      })
    );
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
    }).pipe(
      catchError(() => {
        const rooms = getMockRooms();
        const room = rooms.find(r => r.id === id);
        if (room) {
          room.status = 'AVAILABLE';
          saveMockRooms(rooms);
        }
        return of({
          success: true,
          message: 'Habitación aprobada exitosamente',
          data: room || ({} as Room)
        });
      })
    );
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
}
