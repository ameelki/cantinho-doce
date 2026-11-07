import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from './api.service';
import { User } from './models';

interface AuthResponse { token: string; user: User; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(Api);
  private router = inject(Router);
  readonly user = signal<User | null>(this.read());
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');
  readonly isKitchen = computed(() => this.user()?.role === 'KITCHEN' || this.user()?.role === 'ADMIN');

  get token(): string | null {
    try { return localStorage.getItem('cantinho_token'); } catch { return null; }
  }

  private read(): User | null {
    try {
      const raw = localStorage.getItem('cantinho_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private store(r: AuthResponse) {
    try {
      localStorage.setItem('cantinho_token', r.token);
      localStorage.setItem('cantinho_user', JSON.stringify(r.user));
    } catch { /* stockage indisponible */ }
    this.user.set(r.user);
  }

  async login(email: string, password: string): Promise<User> {
    const r = await new Promise<AuthResponse>((ok, ko) => this.api.post<AuthResponse>('/auth/login', { email, password }).subscribe({ next: ok, error: ko }));
    this.store(r);
    return r.user;
  }

  async register(name: string, email: string, password: string, phone: string): Promise<User> {
    const r = await new Promise<AuthResponse>((ok, ko) => this.api.post<AuthResponse>('/auth/register', { name, email, password, phone }).subscribe({ next: ok, error: ko }));
    this.store(r);
    return r.user;
  }

  forget() {
    try { localStorage.removeItem('cantinho_token'); localStorage.removeItem('cantinho_user'); } catch { /* ignore */ }
    this.user.set(null);
  }

  logout() {
    this.forget();
    this.router.navigateByUrl('/');
  }

  homeFor(u: User): string {
    return u.role === 'ADMIN' ? '/admin' : u.role === 'KITCHEN' ? '/cuisine' : '/compte';
  }
}
