import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-mobile-nav-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-nav-drawer.component.html',
  styleUrls: []
})
export class MobileNavDrawerComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
