import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';

@Component({
  selector: 'app-room-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roomcatalog.component.html'
})
export class RoomCatalogComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
