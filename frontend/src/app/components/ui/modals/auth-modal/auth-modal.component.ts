import { AuthSocialComponent } from './auth-social.component';
import { AuthRegisterComponent } from './auth-register.component';
import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../../app';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [AuthSocialComponent, AuthRegisterComponent, CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
