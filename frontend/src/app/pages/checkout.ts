import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { SettingsService } from '../core/settings.service';
import { DaySlots, DeliveryQuote, Order, OrderMode } from '../core/models';
import { localeTag } from '../core/i18n.service';
import { dateFr, errMsg, money } from '../core/util';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="padding:24px 0">
      <h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">Votre commande</h1>
      @if (!cart.lines().length) {
        <div class="card"><p>Votre panier est vide.</p><a routerLink="/carte" class="btn btn-primary">Voir la carte</a></div>
      } @else {
        <div class="two-col">
          <form class="card" (ngSubmit)="submit()" #f="ngForm">
            @if (error) { <div class="err" role="alert">{{ error }}</div> }
            <div class="field">
              <span class="lbl">Comment souhaitez-vous recevoir votre commande ?</span>
              <div class="choice-row">
                @if (settings.bool('orders.pickup.enabled')) {
                  <label class="choice" [class.on]="mode === 'PICKUP'"><input type="radio" name="mode" value="PICKUP" [(ngModel)]="mode" (ngModelChange)="refreshQuote()" /> <b>Retrait</b><span class="small muted">Je viens la chercher</span></label>
                }
                @if (settings.bool('orders.delivery.enabled')) {
                  <label class="choice" [class.on]="mode === 'DELIVERY'"><input type="radio" name="mode" value="DELIVERY" [(ngModel)]="mode" (ngModelChange)="refreshQuote()" /> <b>Livraison</b><span class="small muted">Chez moi, à l'adresse indiquée</span></label>
                }
              </div>
              @if (mode === 'PICKUP' && settings.str('orders.pickup.address')) { <p class="small muted">{{ settings.str('orders.pickup.address') }}</p> }
              @if (mode === 'DELIVERY' && settings.str('delivery.info')) { <p class="small muted">{{ settings.str('delivery.info') }}</p> }
            </div>

            <div class="field">
              <span class="lbl">{{ mode === 'DELIVERY' ? 'Jour de livraison' : 'Jour de retrait' }}</span>
              <div class="slot-row" role="group" aria-label="Jour">
                @for (d of days(); track d.date) {
                  <button type="button" class="slot day-chip" [class.on]="day === d.date" [attr.aria-pressed]="day === d.date" (click)="pickDay(d.date)">
                    <span class="small">{{ dayShort(d.date) }}</span><b>{{ dayNum(d.date) }}</b><span class="small">{{ monthShort(d.date) }}</span>
                  </button>
                }
              </div>
            </div>
            @if (day) {
              <div class="field">
                <span class="lbl">Heure</span>
                <div class="slot-grid" role="group" aria-label="Heure">
                  @for (t of times(); track t) {
                    <button type="button" class="slot" [class.on]="time === t" [attr.aria-pressed]="time === t" (click)="time = t">{{ t }}</button>
                  }
                </div>
              </div>
            }
            @if (day && time) { <p class="ok-msg">{{ dateFr(day) }}, {{ time }}</p> }
            @if (!loadedDays) { <p class="muted">Chargement des créneaux… (le premier chargement peut prendre une minute)</p> }
            @if (loadFailed) { <p class="err">Impossible de charger les créneaux. <button type="button" class="btn btn-ghost btn-sm" (click)="loadSchedule()">Réessayer</button></p> }
            @if (loadedDays && !loadFailed && !days().length) { <p class="err">Aucun créneau disponible pour le moment. Revenez bientôt ou contactez-nous.</p> }
            <p class="small muted">Commande à passer au moins {{ settings.num('schedule.leadHours') }} h à l'avance, jusqu'à {{ settings.num('schedule.maxDays') }} jours.</p>

            @if (mode === 'DELIVERY') {
              <div class="field"><label for="addr">Adresse de livraison</label><input id="addr" name="addr" [(ngModel)]="address" required autocomplete="street-address" /></div>
              <div class="form-grid">
                <div class="field"><label for="zip">Code postal</label><input id="zip" name="zip" [(ngModel)]="postalCode" autocomplete="postal-code" /></div>
                <div class="field"><label for="city">Ville</label><input id="city" name="city" [(ngModel)]="city" (blur)="refreshQuote()" required autocomplete="address-level2" /></div>
              </div>
              @if (quote && !quote.allowed) { <div class="err" role="alert">{{ quote.message }}</div> }
            }

            <div class="form-grid">
              <div class="field"><label for="name">Nom</label><input id="name" name="name" [(ngModel)]="name" required autocomplete="name" /></div>
              <div class="field"><label for="phone">Téléphone</label><input id="phone" name="phone" [(ngModel)]="phone" type="tel" required autocomplete="tel" /></div>
            </div>
            <div class="field"><label for="email">Email (pour la confirmation)</label><input id="email" name="email" [(ngModel)]="email" type="email" autocomplete="email" /></div>
            <div class="field"><label for="note">Remarque</label><textarea id="note" name="note" [(ngModel)]="note" maxlength="300"></textarea></div>
            <p class="muted small">Le paiement se fait à la remise ou à la livraison.</p>
            <button class="btn btn-primary btn-block" [disabled]="busy || f.invalid || (mode === 'DELIVERY' && !!quote && !quote.allowed)">{{ busy ? 'Envoi…' : 'Envoyer ma commande · ' + money(grandTotal()) }}</button>
          </form>
          <aside class="card summary">
            <h3>Récapitulatif</h3>
            @for (l of cart.lines(); track l.key) {
              <div class="line">
                <div><b>{{ l.qty }} × {{ l.name }}</b>@if (l.optionsText) { <div class="small muted">{{ l.optionsText }}</div> }</div>
                <div class="price">{{ money(l.qty * l.unitPrice) }}</div>
              </div>
            }
            <div class="row between" style="margin-top:14px"><span>Sous-total</span><span>{{ money(cart.total()) }}</span></div>
            @if (mode === 'DELIVERY') {
              <div class="row between"><span>Frais de livraison</span>
                <span>@if (!quote || !city) { à calculer } @else if (quote.free) { offerts } @else { {{ money(quote.fee) }} }</span></div>
              @if (settings.num('delivery.freeFrom') > 0) { <p class="small muted">Livraison offerte dès {{ money(settings.num('delivery.freeFrom')) }}.</p> }
            }
            <div class="row between" style="margin-top:10px"><b>Total</b><b class="big-total">{{ money(grandTotal()) }}</b></div>
          </aside>
        </div>
      }
    </div>
  `,
})
export class CheckoutPage implements OnInit {
  private api = inject(Api);
  private router = inject(Router);
  private auth = inject(AuthService);
  cart = inject(CartService);
  settings = inject(SettingsService);
  money = money;
  dateFr = dateFr;

  schedule = signal<DaySlots[]>([]);
  days = computed(() => this.schedule());
  loadedDays = false;
  loadFailed = false;
  mode: OrderMode = 'PICKUP';
  day = '';
  time = '';
  address = '';
  postalCode = '';
  city = '';
  name = '';
  phone = '';
  email = '';
  note = '';
  quote: DeliveryQuote | null = null;
  busy = false;
  error = '';

  pickDay(d: string) { this.day = d; this.time = ''; }

  private dt(iso: string): Date {
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  dayShort(iso: string): string { return this.dt(iso).toLocaleDateString(localeTag(), { weekday: 'short' }); }
  dayNum(iso: string): string { return String(this.dt(iso).getDate()); }
  monthShort(iso: string): string { return this.dt(iso).toLocaleDateString(localeTag(), { month: 'short' }); }

  times(): string[] {
    return this.schedule().find((d) => d.date === this.day)?.times ?? [];
  }

  grandTotal(): number {
    return this.cart.total() + (this.mode === 'DELIVERY' && this.quote?.allowed ? Number(this.quote.fee) : 0);
  }

  ngOnInit() {
    this.mode = this.settings.bool('orders.pickup.enabled') ? 'PICKUP' : 'DELIVERY';
    const u = this.auth.user();
    // Seuls les clients préremplissent leurs infos : un compte admin/atelier garde un formulaire vide.
    if (u && u.role === 'CUSTOMER') { this.name = u.name; this.phone = u.phone || ''; this.email = u.email; }
    this.loadSchedule();
  }

  loadSchedule() {
    this.loadedDays = false;
    this.loadFailed = false;
    this.api.get<DaySlots[]>('/public/schedule').subscribe({
      next: (d) => { this.schedule.set(d); this.loadedDays = true; },
      error: () => { this.loadFailed = true; this.loadedDays = true; },
    });
  }

  refreshQuote() {
    if (this.mode !== 'DELIVERY') { this.quote = null; return; }
    this.api.get<DeliveryQuote>('/public/delivery/quote', { subtotal: String(this.cart.total()), city: this.city || '' })
      .subscribe({ next: (q) => (this.quote = q) });
  }

  submit() {
    this.error = '';
    if (!this.day || !this.time) { this.error = 'Choisissez le jour et l\'heure.'; return; }
    this.busy = true;
    const delivery = this.mode === 'DELIVERY';
    const body = {
      mode: this.mode,
      customerName: this.name,
      phone: this.phone,
      email: this.email || null,
      scheduledAt: this.day + 'T' + this.time + ':00',
      address: delivery ? this.address : null,
      postalCode: delivery ? this.postalCode || null : null,
      city: delivery ? this.city : null,
      note: this.note || null,
      items: this.cart.lines().map((l) => ({ productId: l.productId, quantity: l.qty, choices: l.choices, note: l.note || null })),
    };
    this.api.post<Order>('/public/orders', body).subscribe({
      next: (o) => {
        try { localStorage.setItem('cantinho_last_order', o.code); } catch { /* ignore */ }
        this.cart.clear();
        this.router.navigate(['/suivi', o.code]);
      },
      error: (e) => { this.error = errMsg(e); this.busy = false; },
    });
  }
}
