import { Component, Inject, forwardRef } from '@angular/core';
import { App } from '../../../app';

@Component({
  selector: 'app-landing-community',
  standalone: true,
  templateUrl: './landing-community.component.html',
  styleUrls: ['./landing-community.component.css', './landing-community-responsive.css']
})
export class LandingCommunityComponent {
  constructor(@Inject(forwardRef(() => App)) public app: App) {}
}
