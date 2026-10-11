import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-abancay-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map-section.component.html',
  styleUrls: []
})
export class MapSectionComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
