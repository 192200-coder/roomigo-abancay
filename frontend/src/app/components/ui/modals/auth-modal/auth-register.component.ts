import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.css'],
  host: { style: 'display: contents' }
})
export class AuthRegisterComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
