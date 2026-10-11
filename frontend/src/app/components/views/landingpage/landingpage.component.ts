import { Component, Inject, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';
import { MapSectionComponent } from '../../ui/map-section/map-section.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MapSectionComponent],
  templateUrl: './landingpage.component.html'
})
export class LandingPageComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
