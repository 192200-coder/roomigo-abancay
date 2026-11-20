import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';
import { PhotoCategory, Room } from '../../../core/models';

interface GalleryPhoto {
  url: string;
  category: PhotoCategory | null;
}

@Component({
  selector: 'app-property-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.css', './property-detail-styles-1.css']
})
export class PropertyDetailComponent {
  /** Foto activa de la galería. Se reinicia al cambiar de publicación. */
  private activeIndex = 0;
  private activeRoomId: number | null = null;

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  /**
   * Galería de la publicación: las fotos categorizadas del detalle o, mientras cargan
   * (o en publicaciones antiguas), solo la imagen principal.
   */
  gallery(room: Room): GalleryPhoto[] {
    if (room.photos?.length) return room.photos;
    return room.mainImageUrl ? [{ url: room.mainImageUrl, category: null }] : [];
  }

  activePhoto(room: Room): GalleryPhoto | null {
    if (this.activeRoomId !== room.id) {
      this.activeRoomId = room.id;
      this.activeIndex = 0;
    }
    const photos = this.gallery(room);
    return photos[Math.min(this.activeIndex, photos.length - 1)] ?? null;
  }

  isActive(index: number): boolean {
    return index === this.activeIndex;
  }

  selectPhoto(index: number): void {
    this.activeIndex = index;
  }

  step(room: Room, delta: number): void {
    const total = this.gallery(room).length;
    if (total > 1) this.activeIndex = (this.activeIndex + delta + total) % total;
  }
}
