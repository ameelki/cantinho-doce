import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { Order, OrderStatus } from '../core/models';
import { MODE_LABEL, ORDER_LABEL, errMsg, money, slotLabel } from '../core/util';

@Component({
  selector: 'app-track-order',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="container" style="padding:24px 0; max-width:720px">
      <h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">Suivre ma commande</h1>
      <form class="row" (ngSubmit)="search()" style="margin-bottom:20px">
        <input name="code" [(ngModel)]="input" placeholder="Votre code, ex : D-7KQ3XM" style="flex:1;min-width:200px" aria-label="Code de commande" />
        <button class="btn btn-dark">Afficher</button>
      </form>
      @if (error) { <div class="err">{{ error }}</div> }
      @if (order; as o) {
        <div class="card">
          <div class="row between">
            <span class="code">{{ o.code }}</span>
            <span class="badge" [class]="o.status">{{ label[o.status] }}</span>
          </div>
          @if (o.status === 'CANCELLED') {
            <p style="margin-top:16px">Cette commande a été annulée.</p>
          } @else {
            <div class="steps" aria-label="Avancement">
              @for (s of flowFor(o); track s; let i = $index) {
                <div class="step" [class.done]="i < idx(o)" [class.now]="i === idx(o)">{{ label[s] }}</div>
              }
            </div>
            @if (o.status === 'READY') {
              <div class="ok-msg">Votre commande est prête{{ o.mode === 'PICKUP' ? ' : vous pouvez venir la récupérer.' : ' : le livreur part bientôt.' }}</div>
            }
            @if (o.status === 'DELIVERING') { <div class="ok-msg">Votre commande est en route vers votre adresse.</div> }
          }
          <p class="muted">{{ modeLabel[o.mode] }} · {{ slot(o.scheduledAt) }}@if (o.mode === 'DELIVERY') { · {{ o.address }}, {{ o.postalCode }} {{ o.city }} }</p>
          @for (it of o.items; track it.id) {
            <div class="line"><div><b>{{ it.quantity }} × {{ it.name }}</b>@if (it.optionsText) { <div class="small muted">{{ it.optionsText }}</div> }</div><div class="price">{{ money(it.unitPrice * it.quantity) }}</div></div>
          }
          @if (o.mode === 'DELIVERY') {
            <div class="row between" style="margin-top:10px"><span>Sous-total</span><span>{{ money(o.subtotal) }}</span></div>
            <div class="row between"><span>Livraison</span><span>{{ o.deliveryFee > 0 ? money(o.deliveryFee) : 'offerte' }}</span></div>
          }
          <div class="row between" style="margin-top:14px"><b>Total à régler à la remise</b><b class="big-total">{{ money(o.total) }}</b></div>
          @if (o.status === 'NEW') {
            <button class="btn btn-ghost btn-sm" style="margin-top:14px" (click)="cancel()">Annuler ma commande</button>
          }
          <p class="muted small" style="margin-top:14px">Cette page se met à jour automatiquement.</p>
        </div>
      }
    </div>
  `,
})
export class TrackOrderPage implements OnInit, OnDestroy {
  private api = inject(Api);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  money = money;
  label = ORDER_LABEL;
  modeLabel = MODE_LABEL;
  slot = slotLabel;
  flowFor(o: Order): OrderStatus[] {
    return o.mode === 'DELIVERY' ? ['NEW', 'PREPARING', 'READY', 'DELIVERING', 'SERVED'] : ['NEW', 'PREPARING', 'READY', 'SERVED'];
  }
  input = '';
  order: Order | null = null;
  error = '';
  private timer: any;

  ngOnInit() {
    this.route.paramMap.subscribe((p) => {
      let code = p.get('code') || '';
      if (!code) { try { code = localStorage.getItem('cantinho_last_order') || ''; } catch { code = ''; } }
      this.input = code;
      if (code) this.load(code);
    });
    this.timer = setInterval(() => {
      if (this.order && this.order.status !== 'SERVED' && this.order.status !== 'CANCELLED') this.load(this.order.code, true);
    }, 10000);
  }

  ngOnDestroy() { clearInterval(this.timer); }

  idx(o: Order): number { return this.flowFor(o).indexOf(o.status); }

  search() {
    const c = this.input.trim();
    if (c) this.router.navigate(['/suivi', c.toUpperCase()]);
  }

  load(code: string, silent = false) {
    this.api.get<Order>('/public/orders/' + encodeURIComponent(code)).subscribe({
      next: (o) => { this.order = o; this.error = ''; },
      error: (e) => { if (!silent) { this.order = null; this.error = errMsg(e); } },
    });
  }

  cancel() {
    if (!this.order) return;
    this.api.post<Order>('/public/orders/' + this.order.code + '/cancel').subscribe({
      next: (o) => (this.order = o),
      error: (e) => (this.error = errMsg(e)),
    });
  }
}
