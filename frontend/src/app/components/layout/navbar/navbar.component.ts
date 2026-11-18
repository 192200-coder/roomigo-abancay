import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css', './navbar-styles-1.css']
})
export class NavbarComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
