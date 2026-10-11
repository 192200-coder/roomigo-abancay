import { Room, Property, Review, Booking, AdminStats, RoomFilter, PageResponse } from './models';

const STORAGE_KEY_ROOMS = 'roomix_rooms_data_v1';
const STORAGE_KEY_PROPERTIES = 'roomix_properties_data_v1';
const STORAGE_KEY_REVIEWS = 'roomix_reviews_data_v1';
const STORAGE_KEY_BOOKINGS = 'roomix_bookings_data_v1';

// Limpieza automática de claves de prueba / mock heredadas
try {
  ['roomix_mock_rooms_v2', 'roomix_mock_properties_v1', 'roomix_mock_reviews_v1', 'roomix_mock_bookings_v1']
    .forEach(k => localStorage.removeItem(k));
} catch {}

export const INITIAL_MOCK_PROPERTIES: Property[] = [];
export const INITIAL_MOCK_ROOMS: Room[] = [];
export const INITIAL_MOCK_REVIEWS: Review[] = [];

export function getMockRooms(): Room[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveMockRooms(rooms: Room[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(rooms));
  } catch {}
}

export function getMockProperties(): Property[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROPERTIES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function getMockReviews(roomId: number): Review[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    if (raw) {
      const parsed: Review[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(r => r.roomId === roomId);
      }
    }
  } catch {}
  return [];
}

export function addMockReview(review: Review): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVIEWS);
    const list: Review[] = raw ? JSON.parse(raw) : [];
    list.unshift(review);
    localStorage.setItem(STORAGE_KEY_REVIEWS, JSON.stringify(list));
  } catch {}
}

export function filterMockRoomsList(
  filter?: RoomFilter,
  page: number = 0,
  size: number = 50
): PageResponse<Room> {
  let list = getMockRooms();

  if (filter) {
    if (filter.city) {
      const c = filter.city.toLowerCase().trim();
      list = list.filter(r =>
        (r.propertyCity && r.propertyCity.toLowerCase().includes(c)) ||
        (r.propertyAddress && r.propertyAddress.toLowerCase().includes(c)) ||
        r.title.toLowerCase().includes(c)
      );
    }
    if (filter.roomType) {
      list = list.filter(r => r.roomType === filter.roomType);
    }
    if (filter.minPrice != null) {
      list = list.filter(r => r.pricePerMonth >= filter.minPrice!);
    }
    if (filter.maxPrice != null) {
      list = list.filter(r => r.pricePerMonth <= filter.maxPrice!);
    }
    if (filter.privateBathroom) {
      list = list.filter(r => r.privateBathroom);
    }
    if (filter.offersWifi) {
      list = list.filter(r => r.offersWifi);
    }
    if (filter.acceptsPets) {
      list = list.filter(r => r.acceptsPets);
    }
    if (filter.minRating != null) {
      list = list.filter(r => (r.averageRating || 0) >= filter.minRating!);
    }
  }

  const totalElements = list.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const start = page * size;
  const paginated = list.slice(start, start + size);

  return {
    content: paginated,
    pageNumber: page,
    pageSize: size,
    totalElements,
    totalPages,
    last: page >= totalPages - 1
  };
}

export function getMockAdminStats(): AdminStats {
  const rooms = getMockRooms();
  const available = rooms.filter(r => r.status === 'AVAILABLE').length;
  const pending = rooms.filter(r => r.status === 'PENDING_APPROVAL').length;
  return {
    totalRooms: rooms.length,
    pendingRooms: pending,
    availableRooms: available,
    totalUsers: 0,
    totalProperties: 0,
    totalReservations: 0,
    totalFeesCollected: 0,
    city: 'Abancay, Apurímac'
  };
}
