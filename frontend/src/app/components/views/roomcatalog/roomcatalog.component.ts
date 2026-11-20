import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';
import { ListingOperation, Room } from '../../../core/models';
import { mainPrice } from '../../../core/listings';

@Component({
  selector: 'app-room-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roomcatalog.component.html',
  styleUrls: ['./roomcatalog.component.css', './roomcatalog-styles-1.css', './roomcatalog-styles-2.css', './roomcatalog-styles-3.css']
})
export class RoomCatalogComponent {
  readonly pageSize = 8;
  page = 1;
  sortOrder: 'newest' | 'price-low' | 'price-high' = 'newest';

  readonly operations: { value: ListingOperation | ''; label: string }[] = [
    { value: '', label: 'Todo' },
    { value: 'RENT', label: 'Alquiler' },
    { value: 'SALE', label: 'Venta' }
  ];

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  /** Cambia la operación y busca de inmediato; un cuarto no se vende, así que se limpia ese tipo. */
  setOperation(operation: ListingOperation | ''): void {
    this.app.selectedOperation = operation;
    if (operation === 'SALE' && this.app.selectedRoomType === 'ROOM') this.app.selectedRoomType = '';
    this.search();
  }

  get sortedRooms(): Room[] {
    const rooms = [...this.app.rooms()];
    // Con «Todo», ordenar por precio mezclaría rentas y ventas: se ordena dentro de cada operación.
    const byOperation = (a: Room, b: Room) => Number(a.operation === 'SALE') - Number(b.operation === 'SALE');
    if (this.sortOrder === 'price-low') return rooms.sort((a, b) => byOperation(a, b) || mainPrice(a) - mainPrice(b));
    if (this.sortOrder === 'price-high') return rooms.sort((a, b) => byOperation(a, b) || mainPrice(b) - mainPrice(a));
    return rooms.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  get pageCount(): number {
    return Math.ceil(this.sortedRooms.length / this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.pageCount }, (_, index) => index + 1);
  }

  get paginatedRooms(): Room[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sortedRooms.slice(start, start + this.pageSize);
  }

  search(): void {
    this.page = 1;
    this.app.loadRooms();
  }

  clearFilters(): void {
    this.app.searchKeyword = '';
    this.app.selectedCity = '';
    this.app.selectedDistrict = '';
    this.app.selectedRoomType = '';
    this.app.selectedOperation = '';
    this.app.maxSalePrice = null;
    this.app.minBedrooms = 0;
    this.app.maxPrice = 1200;
    this.app.filterBathroom = false;
    this.app.filterWifi = false;
    this.app.filterPets = false;
    this.page = 1;
    this.app.loadRooms();
  }

  filterToMapZone(zone: string): void {
    this.page = 1;
    this.app.selectMapZone(zone);
    this.app.applyChipFilter(zone);
    document.getElementById('cuartos-catalog-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  setPage(page: number): void {
    if (page < 1 || page > this.pageCount) return;
    this.page = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

}
