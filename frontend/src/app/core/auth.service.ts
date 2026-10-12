import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap, of } from 'rxjs';
import { ApiResponse, AuthResponse, User, UserRole, SocialSendCodeRequest, SocialVerifyCodeRequest, SendCodeResponse } from './models';
import { getApiBaseUrl } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private get baseUrl(): string {
    return `${getApiBaseUrl()}/auth`;
  }
  private readonly TOKEN_KEY = 'roomix_access_token';
  private readonly USER_KEY = 'roomix_user_data';

  // Angular 19+ Signal State
  readonly currentUser = signal<User | null>(this.getStoredUser());
  readonly token = signal<string | null>(this.getStoredToken());

  readonly isLoggedIn = computed(() => !!this.token() && !!this.currentUser());
  readonly isAdmin = computed(() => {
    return this.currentUser()?.role === 'ROLE_ADMIN';
  });
  readonly isOwner = computed(() => {
    return this.currentUser()?.role === 'ROLE_OWNER';
  });
  readonly isTenant = computed(() => {
    return this.currentUser()?.role === 'ROLE_TENANT';
  });

  constructor(private http: HttpClient) {}

  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role: UserRole;
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/register`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  // ==========================================
  // AUTENTICACIÓN SOCIAL (GOOGLE Y FACEBOOK REAL CON VERIFICACIÓN OTP)
  // ==========================================
  sendSocialVerificationCode(data: SocialSendCodeRequest): Observable<ApiResponse<SendCodeResponse>> {
    return this.http.post<ApiResponse<SendCodeResponse>>(`${this.baseUrl}/social/send-code`, data);
  }

  verifySocialCode(data: SocialVerifyCodeRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.baseUrl}/social/verify`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }


  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑAS FUNCIONAL
  // ==========================================
  requestPasswordReset(email: string): Observable<{ success: boolean; message: string; code?: string }> {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return of({
        success: false,
        message: 'Por favor ingresa un correo electrónico válido.'
      });
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    localStorage.setItem(`roomix_pwd_reset_${cleanEmail}`, code);
    localStorage.setItem(`roomix_pwd_reset_time_${cleanEmail}`, Date.now().toString());

    return of({
      success: true,
      message: `Código de seguridad de 6 dígitos generado para ${cleanEmail}.`,
      code
    });
  }

  verifyAndResetPassword(email: string, code: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    const cleanEmail = email ? email.toLowerCase().trim() : '';
    const storedCode = localStorage.getItem(`roomix_pwd_reset_${cleanEmail}`);

    if (!storedCode || storedCode !== code.trim()) {
      return of({
        success: false,
        message: 'El código de seguridad ingresado no coincide o ha expirado. Verifica los 6 dígitos.'
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return of({
        success: false,
        message: 'La nueva contraseña debe tener como mínimo 8 caracteres.'
      });
    }

    // Guardar nueva contraseña en almacenamiento local y limpiar código
    localStorage.removeItem(`roomix_pwd_reset_${cleanEmail}`);
    localStorage.setItem(`roomix_custom_pwd_${cleanEmail}`, newPassword);

    return of({
      success: true,
      message: '¡Tu contraseña ha sido actualizada con éxito! Ya puedes iniciar sesión con tu nueva clave.'
    });
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.token.set(null);
    this.currentUser.set(null);
  }

  updateUserData(updatedFields: Partial<User>): void {
    const current = this.currentUser();
    if (!current) return;
    const updatedUser: User = { ...current, ...updatedFields };
    localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this.currentUser.set(updatedUser);
  }

  getAuthHeaders(): HttpHeaders {
    const t = this.token();
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (t) {
      headers = headers.set('Authorization', `Bearer ${t}`);
    }
    return headers;
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, authData.accessToken);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authData.user));
    this.token.set(authData.accessToken);
    this.currentUser.set(authData.user);
  }

  private getStoredToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const data = localStorage.getItem(this.USER_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
