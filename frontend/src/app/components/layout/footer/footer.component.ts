import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
