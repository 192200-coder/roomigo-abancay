import { Component, Inject, ViewEncapsulation, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { App } from '../../../app';
import { LandingHeroComponent } from './landing-hero.component';
import { LandingCatalogComponent } from './landing-catalog.component';
import { LandingPlacesComponent } from './landing-places.component';
import { LandingCommunityComponent } from './landing-community.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    CommonModule,
    LandingHeroComponent,
    LandingCatalogComponent,
    LandingPlacesComponent,
    LandingCommunityComponent
  ],
  templateUrl: './landingpage.component.html',
  styleUrls: ['./landingpage.component.css', './landingpage-responsive.css'],
  encapsulation: ViewEncapsulation.None
})
export class LandingPageComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
