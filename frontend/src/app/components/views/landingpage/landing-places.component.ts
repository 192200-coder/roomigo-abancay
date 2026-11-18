import { Component, Inject, forwardRef } from '@angular/core';
import { App } from '../../../app';

@Component({
  selector: 'app-landing-places',
  standalone: true,
  templateUrl: './landing-places.component.html',
  styleUrls: ['./landing-places.component.css', './landing-places-responsive.css']
})
export class LandingPlacesComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
