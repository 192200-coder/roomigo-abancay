import { Injectable, computed, signal } from '@angular/core';
import { Room } from './models';

const FAVORITES_KEY = 'roomix_favorite_rooms_v1';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  readonly rooms = signal<Room[]>(this.readFavorites());
  readonly count = computed(() => this.rooms().length);

  isFavorite(roomId: number): boolean {
    return this.rooms().some(room => room.id === roomId);
  }

  toggle(room: Room): boolean {
    const current = this.rooms();
    const next = current.some(saved => saved.id === room.id)
      ? current.filter(saved => saved.id !== room.id)
      : [room, ...current];

    if (!this.persist(next)) return false;
    this.rooms.set(next);
    return true;
  }

  private readFavorites(): Room[] {
    if (typeof localStorage === 'undefined') return [];

    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!Array.isArray(parsed) || !parsed.every(this.isRoom)) {
        throw new Error('El formato guardado de favoritos no es válido.');
      }
      return parsed;
    } catch (error) {
      console.error('No se pudieron cargar los favoritos guardados.', error);
      return [];
    }
  }

  private isRoom(value: unknown): value is Room {
    if (!value || typeof value !== 'object') return false;
    const room = value as Partial<Room>;
    return Number.isFinite(room.id) && typeof room.title === 'string';
  }

  private persist(rooms: Room[]): boolean {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(rooms));
      return true;
    } catch (error) {
      console.error('No se pudieron guardar los favoritos.', error);
      return false;
    }
  }
}
