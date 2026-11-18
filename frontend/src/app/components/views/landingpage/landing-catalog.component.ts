import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-landing-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-catalog.component.html',
  styleUrls: ['./landing-catalog.component.css', './landing-catalog-responsive.css']
})
export class LandingCatalogComponent {
  readonly roomFallbackImages = [
    '/images/landing/room-a.jpg',
    '/images/landing/room-b.jpg',
    '/images/landing/room-c.jpg'
  ];

  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
