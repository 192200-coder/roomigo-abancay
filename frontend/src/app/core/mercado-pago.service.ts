import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApiResponse, CheckoutSession, PaymentStatusResult } from './models';
import { getApiBaseUrl } from './api-config';

/** Parámetros con los que Mercado Pago devuelve al comprador desde Checkout Pro. */
export interface CheckoutReturnParams {
  paymentId: string | null;
  status: string | null;
  externalReference: string | null;
}

/**
 * Pagos con Mercado Pago Checkout Pro.
 *
 * El frontend nunca procesa datos de tarjeta ni decide si un pago fue aprobado:
 * pide al backend un checkout, redirige al usuario a Mercado Pago y, al volver,
 * pide al backend que confirme el pago consultando la API de Mercado Pago.
 */
@Injectable({
  providedIn: 'root'
})
export class MercadoPagoService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private get baseUrl(): string {
    return `${getApiBaseUrl()}/payments`;
  }

  /** Crea el checkout del pago inicial (primer mes + depósito) de una reserva aprobada. */
  startBookingCheckout(reservationId: number): Observable<CheckoutSession> {
    return this.http.post<ApiResponse<CheckoutSession>>(`${this.baseUrl}/checkout/bookings/${reservationId}`, null, {
      headers: this.auth.getAuthHeaders()
    }).pipe(map(res => res.data));
  }

  /** Crea el checkout de la tarifa de publicación de un cuarto. */
  startPublicationCheckout(roomId: number): Observable<CheckoutSession> {
    return this.http.post<ApiResponse<CheckoutSession>>(`${this.baseUrl}/checkout/rooms/${roomId}/publication`, null, {
      headers: this.auth.getAuthHeaders()
    }).pipe(map(res => res.data));
  }

  /** Pide al backend que consulte y concilie el pago con el que volvió el usuario. */
  confirmPayment(paymentId: string): Observable<PaymentStatusResult> {
    return this.http.get<ApiResponse<PaymentStatusResult>>(`${this.baseUrl}/mercadopago/confirm`, {
      headers: this.auth.getAuthHeaders(),
      params: { paymentId }
    }).pipe(map(res => res.data));
  }

  /** Lleva al usuario a la página de pago de Mercado Pago. */
  redirectToCheckout(session: CheckoutSession): void {
    window.location.assign(session.checkoutUrl);
  }

  /** Devuelve los parámetros de vuelta de Checkout Pro, o null si la URL no es una vuelta de pago. */
  readReturnParams(): CheckoutReturnParams | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('pago') !== 'resultado') return null;
    const clean = (v: string | null) => (v && v !== 'null' ? v : null);
    return {
      paymentId: clean(params.get('payment_id') || params.get('collection_id')),
      status: clean(params.get('status') || params.get('collection_status')),
      externalReference: clean(params.get('external_reference'))
    };
  }

  /** Quita de la barra de direcciones los parámetros de Mercado Pago. */
  clearReturnParams(): void {
    if (typeof window === 'undefined') return;
    window.history.replaceState(window.history.state, '', window.location.pathname);
  }
}
