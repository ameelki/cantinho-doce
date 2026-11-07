import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Order, OrderStatus, Product } from '../core/models';
import { MODE_LABEL, errMsg, minutesAgo, slotLabel } from '../core/util';

@Component({
  selector: 'app-kitchen',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="shell kitchen" style="flex-direction:column">
      <div class="bar">
        <b style="font-family:var(--display)">Atelier</b>
        <button class="chip" [class.on]="tab === 'orders'" (click)="tab = 'orders'">Commandes ({{ orders.length }})</button>
        <button class="chip" [class.on]="tab === 'stock'" (click)="openStock()">Disponibilité</button>
        <span style="margin-left:auto"></span>
        <label class="check small"><input type="checkbox" [checked]="sound" (change)="sound = !sound" /> Son</label>
        @if (auth.isAdmin()) { <a routerLink="/admin" class="btn btn-ghost btn-sm" style="color:#fff">Admin</a> }
        <a routerLink="/" class="btn btn-ghost btn-sm" style="color:#fff">Site</a>
        <button class="btn btn-ghost btn-sm" style="color:#fff" (click)="auth.logout()">Déconnexion</button>
      </div>
      @if (error) { <div class="err" style="margin:10px 14px 0">{{ error }}</div> }
      @if (tab === 'orders') {
        <div class="cols">
          @for (c of columns; track c.status) {
            <section class="col">
              <h2>{{ c.title }} <span>{{ byStatus(c.status).length }}</span></h2>
              @if (!byStatus(c.status).length) { <p class="muted small">Rien pour l'instant.</p> }
              @for (o of byStatus(c.status); track o.id) {
                <article class="ticket" [class.late]="o.status === 'NEW' && age(o) >= 30" [class.READY]="o.status === 'READY'">
                  <div class="row between">
                    <b style="font-family:var(--display)">{{ o.code }}</b>
                    <span class="small muted">il y a {{ age(o) }} min</span>
                  </div>
                  <div><span class="badge">{{ mode[o.mode] }}</span>
                    <b> {{ slot(o.scheduledAt) }}</b>
                    <span class="muted small"> · {{ o.customerName }}</span></div>
                  <ul>
                    @for (it of o.items; track it.id) {
                      <li>{{ it.quantity }} × {{ it.name }}
                        @if (it.optionsText) { <small>{{ it.optionsText }}</small> }
                        @if (it.note) { <small>Note : {{ it.note }}</small> }</li>
                    }
                  </ul>
                  @if (o.mode === 'DELIVERY') { <div class="small">📍 {{ o.address }}, {{ o.postalCode }} {{ o.city }} · {{ o.phone }}</div> }
                  @if (o.note) { <div class="table-banner small">{{ o.note }}</div> }
                  <div class="row">
                    <button class="btn btn-primary btn-sm" (click)="advance(o)">{{ c.action }}</button>
                    @if (o.status === 'NEW') { <button class="btn btn-ghost btn-sm" (click)="cancel(o)">Annuler</button> }
                  </div>
                </article>
              }
            </section>
          }
        </div>
      } @else {
        <div style="padding:14px; overflow:auto; flex:1">
          <p class="muted">Marquez un produit comme épuisé : il disparaît des commandes tout de suite.</p>
          <div class="grid c3">
            @for (p of products; track p.id) {
              <label class="card check" style="color:var(--text)">
                <input type="checkbox" [checked]="p.available" (change)="toggle(p)" />
                <span><b>{{ p.name }}</b><br><span class="small muted">{{ p.available ? 'Disponible' : 'Épuisé' }}</span></span>
              </label>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class KitchenPage implements OnInit, OnDestroy {
  private api = inject(Api);
  auth = inject(AuthService);
  mode = MODE_LABEL;
  columns: { status: OrderStatus; title: string; action: string }[] = [
    { status: 'NEW', title: 'Nouvelles', action: 'Commencer' },
    { status: 'PREPARING', title: 'En préparation', action: 'Prête' },
    { status: 'READY', title: 'Prêtes', action: 'Remise / départ' },
    { status: 'DELIVERING', title: 'En livraison', action: 'Livrée' },
  ];
  slot = slotLabel;
  orders: Order[] = [];
  products: Product[] = [];
  tab: 'orders' | 'stock' = 'orders';
  sound = true;
  error = '';
  private lastNew = -1;
  private timer: any;
  private tick: any;
  private clock = Date.now();

  ngOnInit() {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 8000);
    this.tick = setInterval(() => (this.clock = Date.now()), 30000);
  }

  ngOnDestroy() { clearInterval(this.timer); clearInterval(this.tick); }

  byStatus(s: OrderStatus): Order[] { return this.orders.filter((o) => o.status === s); }
  age(o: Order): number { return minutesAgo(o.createdAt) + (this.clock ? 0 : 0); }

  refresh() {
    this.api.get<Order[]>('/kitchen/orders').subscribe({
      next: (list) => {
        const n = list.filter((o) => o.status === 'NEW').length;
        if (this.lastNew >= 0 && n > this.lastNew && this.sound) this.beep();
        this.lastNew = n;
        this.orders = list;
        this.error = '';
      },
      error: (e) => (this.error = errMsg(e)),
    });
  }

  advance(o: Order) {
    const next: Record<string, OrderStatus> = {
      NEW: 'PREPARING', PREPARING: 'READY', READY: o.mode === 'DELIVERY' ? 'DELIVERING' : 'SERVED', DELIVERING: 'SERVED',
    };
    this.setStatus(o, next[o.status]);
  }

  cancel(o: Order) {
    if (confirm('Annuler la commande ' + o.code + ' ?')) this.setStatus(o, 'CANCELLED');
  }

  private setStatus(o: Order, status: OrderStatus) {
    this.api.put<Order>('/kitchen/orders/' + o.id + '/status', { status }).subscribe({
      next: () => this.refresh(),
      error: (e) => { this.error = errMsg(e); this.refresh(); },
    });
  }

  openStock() {
    this.tab = 'stock';
    this.api.get<Product[]>('/kitchen/products').subscribe({ next: (p) => (this.products = p) });
  }

  toggle(p: Product) {
    this.api.put<Product>('/kitchen/products/' + p.id + '/availability', { available: !p.available }).subscribe({
      next: (x) => (p.available = x.available),
      error: (e) => (this.error = errMsg(e)),
    });
  }

  private beep() {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.15;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch { /* son indisponible */ }
  }
}
