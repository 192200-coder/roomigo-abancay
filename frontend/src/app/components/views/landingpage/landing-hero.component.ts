import { Component, Inject, forwardRef, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { App } from '../../../app';
import { Room } from '../../../core/models';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing-hero.component.html',
  styleUrls: ['./landing-hero.component.css', './landing-hero-styles-1.css', './landing-hero-styles-2.css', './landing-hero-responsive.css']
})
export class LandingHeroComponent implements OnInit, OnDestroy {
  // Índice actual de diapositiva en el Hero Showcase
  readonly currentIndex = signal<number>(0);
  
  // Estado de pausa cuando el usuario pasa el cursor sobre el carrusel
  readonly isPaused = signal<boolean>(false);

  // Temporizador para rotación continua
  private autoSlideTimer: any = null;
  readonly slideIntervalMs = 4500;

  // Fallbacks de alta fidelidad si aún no cargaron los datos del backend
  private readonly fallbackRooms: Room[] = [
    {
      id: 50,
      propertyId: 28,
      propertyDistrict: 'Centro',
      propertyCity: 'Abancay',
      propertyAddress: 'Jr. Lima 340, Plaza de Armas',
      title: 'Estudio Moderno a Pasos de Plaza de Armas y UTEA',
      description: 'Acogedor minidepartamento monoambiente en pleno centro de Abancay.',
      pricePerMonth: 550,
      depositPrice: 300,
      roomType: 'MINI_APARTMENT',
      status: 'AVAILABLE',
      privateBathroom: true,
      capacity: 2,
      offersWifi: true,
      acceptsPets: true,
      mainImageUrl: '/images/landing/room-c.jpg',
      publicationFeeAmount: 15,
      publicationFeePaid: true
    },
    {
      id: 48,
      propertyId: 27,
      propertyDistrict: 'Tamburco',
      propertyCity: 'Abancay',
      propertyAddress: 'Av. Universitaria 412, frente a UNAMBA',
      title: 'Habitación Universitaria Frente a UNAMBA',
      description: 'Habitación iluminada y tranquila para estudiantes con internet de alta velocidad.',
      pricePerMonth: 280,
      depositPrice: 150,
      roomType: 'ROOM',
      status: 'AVAILABLE',
      privateBathroom: true,
      capacity: 1,
      offersWifi: true,
      acceptsPets: false,
      mainImageUrl: '/images/landing/room-a.jpg',
      publicationFeeAmount: 10,
      publicationFeePaid: true
    },
    {
      id: 52,
      propertyId: 29,
      propertyDistrict: 'Patibamba',
      propertyCity: 'Abancay',
      propertyAddress: 'Av. Seoane 580, Patibamba Baja',
      title: 'Minidepartamento Familiar en Patibamba Baja',
      description: 'Hermoso departamento de 2 ambientes en zona residencial de Patibamba.',
      pricePerMonth: 650,
      depositPrice: 400,
      roomType: 'APARTMENT',
      status: 'AVAILABLE',
      privateBathroom: true,
      capacity: 3,
      offersWifi: true,
      acceptsPets: true,
      mainImageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      publicationFeeAmount: 10,
      publicationFeePaid: true
    },
    {
      id: 49,
      propertyId: 27,
      propertyDistrict: 'Tamburco',
      propertyCity: 'Abancay',
      propertyAddress: 'Av. Universitaria 412, frente a UNAMBA',
      title: 'Cuarto Compartido Estudiantil UNAMBA',
      description: 'Habitación espaciosa para 2 estudiantes con agua caliente, luz y wifi.',
      pricePerMonth: 200,
      depositPrice: 100,
      roomType: 'ROOM',
      status: 'AVAILABLE',
      privateBathroom: false,
      capacity: 2,
      offersWifi: true,
      acceptsPets: false,
      mainImageUrl: '/images/landing/room-b.jpg',
      publicationFeeAmount: 10,
      publicationFeePaid: true
    }
  ];

  // Algoritmo: Priorizar quienes pagaron más (publicationFeeAmount) y rotación aleatoria
  readonly heroRooms = computed<Room[]>(() => {
    const all = this.app.rooms();
    const available = (all || []).filter(r => r.status === 'AVAILABLE');
    if (!available || available.length === 0) {
      return this.fallbackRooms;
    }

    // 1. Quienes pagan más se muestran en la cabecera (tarifa de publicación más alta)
    // 2. Mezclado aleatorio dentro del mismo tramo para que roten justamente
    const tierPremium = available.filter(r => (r.publicationFeeAmount || 0) >= 15);
    const tierStandard = available.filter(r => (r.publicationFeeAmount || 0) > 0 && (r.publicationFeeAmount || 0) < 15);
    const tierRegular = available.filter(r => !(r.publicationFeeAmount && r.publicationFeeAmount > 0));

    const shuffle = (list: Room[]) => {
      const copy = [...list];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const ordered = [
      ...shuffle(tierPremium),
      ...shuffle(tierStandard),
      ...shuffle(tierRegular)
    ];

    // Tomamos hasta 8 cuartos destacados para la rotación del Hero
    return ordered.slice(0, 8);
  });

  // Índice seguro que nunca se sale de rango
  readonly currentIndexSafe = computed<number>(() => {
    const total = this.heroRooms().length;
    if (total === 0) return 0;
    const cur = this.currentIndex();
    return ((cur % total) + total) % total;
  });

  constructor(@Inject(forwardRef(() => App)) public app: App) {}

  ngOnInit(): void {
    this.startAutoSlide();
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    this.autoSlideTimer = setInterval(() => {
      if (!this.isPaused()) {
        this.nextSlide();
      }
    }, this.slideIntervalMs);
  }

  stopAutoSlide(): void {
    if (this.autoSlideTimer) {
      clearInterval(this.autoSlideTimer);
      this.autoSlideTimer = null;
    }
  }

  pauseCarousel(): void {
    this.isPaused.set(true);
  }

  resumeCarousel(): void {
    this.isPaused.set(false);
  }

  nextSlide(): void {
    const total = this.heroRooms().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i + 1) % total);
  }

  prevSlide(): void {
    const total = this.heroRooms().length;
    if (total === 0) return;
    this.currentIndex.update(i => (i - 1 + total) % total);
  }

  goToSlide(index: number): void {
    const total = this.heroRooms().length;
    if (index >= 0 && index < total) {
      this.currentIndex.set(index);
    }
  }

  getRoomImage(room: Room, index: number): string {
    if (room.mainImageUrl && room.mainImageUrl.trim() !== '') {
      return room.mainImageUrl;
    }
    const fallbacks = [
      '/images/landing/room-a.jpg',
      '/images/landing/room-b.jpg',
      '/images/landing/room-c.jpg',
      '/images/landing/hero-room.jpg'
    ];
    return fallbacks[index % fallbacks.length];
  }

  handleImageError(event: Event, index: number): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      const fallbacks = [
        '/images/landing/room-c.jpg',
        '/images/landing/room-b.jpg',
        '/images/landing/room-a.jpg',
        '/images/landing/hero-room.jpg'
      ];
      img.src = fallbacks[index % fallbacks.length];
    }
  }

  onSelectRoom(room: Room): void {
    this.app.openRoomDetails(room);
  }
}
