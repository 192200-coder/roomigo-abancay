import { ListingOperation, PhotoCategory, Room, RoomType } from './models';

/**
 * Tipos de publicación orientados al público (Fase 5). Fuente única para selects,
 * insignias y textos: evita que cada vista tenga su propia traducción.
 */
export interface RoomTypeOption {
  value: RoomType;
  label: string;
  /** A quién se dirige. */
  audience: string;
  icon: string;
  /** Un cuarto solo se alquila. */
  allowsSale: boolean;
}

export const ROOM_TYPE_OPTIONS: readonly RoomTypeOption[] = [
  { value: 'ROOM', label: 'Cuarto', audience: 'Para estudiantes', icon: 'fa-solid fa-bed', allowsSale: false },
  { value: 'MINI_APARTMENT', label: 'Minidepartamento', audience: 'Para parejas', icon: 'fa-solid fa-couch', allowsSale: true },
  { value: 'APARTMENT', label: 'Departamento', audience: 'Para familias', icon: 'fa-solid fa-building', allowsSale: true },
  { value: 'HOUSE', label: 'Casa entera', audience: 'Para familias grandes', icon: 'fa-solid fa-house-chimney', allowsSale: true }
];

/** Tipos antiguos (antes de V5) por si quedan en caché o en datos de ejemplo. */
const LEGACY_TYPES: Record<string, RoomType> = {
  SINGLE: 'ROOM', SHARED: 'ROOM', DOUBLE: 'MINI_APARTMENT', SUITE: 'APARTMENT'
};

export function normalizeRoomType(type?: string | null): RoomType {
  if (!type) return 'ROOM';
  return (LEGACY_TYPES[type] ?? type) as RoomType;
}

export function roomTypeOption(type?: string | null): RoomTypeOption {
  const value = normalizeRoomType(type);
  return ROOM_TYPE_OPTIONS.find(o => o.value === value) ?? ROOM_TYPE_OPTIONS[0];
}

export function roomTypeLabel(type?: string | null): string {
  return roomTypeOption(type).label;
}

export function audienceLabel(type?: string | null): string {
  return roomTypeOption(type).audience;
}

export function isForSale(room?: Pick<Room, 'operation'> | null): boolean {
  return room?.operation === 'SALE';
}

export function operationLabel(operation?: ListingOperation | null): string {
  return operation === 'SALE' ? 'En venta' : 'En alquiler';
}

const PEN = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 0 });

/** Monto en soles sin decimales: «S/ 285 000». */
export function formatPen(amount?: number | null): string {
  return `S/ ${PEN.format(amount ?? 0)}`;
}

/** Precio principal de una publicación: renta mensual o precio de venta. */
export function mainPrice(room: Pick<Room, 'operation' | 'pricePerMonth' | 'salePrice'>): number {
  return (isForSale(room) ? room.salePrice : room.pricePerMonth) ?? 0;
}

// ------------------------------------------------------------------ fotos

export interface PhotoCategoryOption {
  value: PhotoCategory;
  label: string;
  hint: string;
  icon: string;
  required: boolean;
}

export const PHOTO_CATEGORY_OPTIONS: readonly PhotoCategoryOption[] = [
  { value: 'FACADE', label: 'Fachada', hint: 'La casa o el edificio desde la calle', icon: 'fa-solid fa-house', required: true },
  { value: 'ROOM', label: 'Habitación', hint: 'El cuarto o un dormitorio', icon: 'fa-solid fa-bed', required: true },
  { value: 'BATHROOM', label: 'Baño', hint: 'El baño que usará el inquilino', icon: 'fa-solid fa-shower', required: true },
  { value: 'LIVING_KITCHEN', label: 'Sala o cocina', hint: 'Áreas comunes', icon: 'fa-solid fa-kitchen-set', required: false },
  { value: 'OTHER', label: 'Otra vista', hint: 'Patio, cochera, vista…', icon: 'fa-regular fa-image', required: false }
];

export const REQUIRED_PHOTO_CATEGORIES: readonly PhotoCategory[] =
  PHOTO_CATEGORY_OPTIONS.filter(o => o.required).map(o => o.value);

/** Mismo tope que el backend (RoomServiceImpl.MAX_PHOTOS). */
export const MAX_PHOTOS = 8;

export function photoCategoryLabel(category?: PhotoCategory | null): string {
  return PHOTO_CATEGORY_OPTIONS.find(o => o.value === category)?.label ?? 'Foto';
}

/**
 * Reduce la foto a un máximo de 1600 px por lado y la recodifica en JPEG (calidad 0,82).
 * Una foto de celular de 4–6 MB queda en ~200–400 KB: el backend acepta hasta ~2 MB por foto
 * y se envían hasta 8 en una sola petición.
 */
export function compressImage(file: File, maxSide = 1600, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo no es una imagen'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
      const width = Math.round(img.naturalWidth * scale);
      const height = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No se pudo procesar la imagen'));
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}
