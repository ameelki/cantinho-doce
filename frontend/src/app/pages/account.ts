import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Order, User } from '../core/models';
import { ORDER_LABEL, errMsg, money, slotLabel } from '../core/util';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="padding:24px 0">
      <h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">Mon compte</h1>
      <div class="two-col">
        <div class="stack">
          <section class="card">
            <h2>Mes commandes</h2>
            @if (!orders.length) { <p class="muted">Aucune commande pour l'instant.</p> }
            @for (o of orders; track o.id) {
              <a class="line" style="text-decoration:none;color:inherit" [routerLink]="['/suivi', o.code]">
                <div><b>{{ o.code }}</b><div class="small muted">{{ slot(o.scheduledAt) }} · {{ o.items.length }} article(s)</div></div>
                <div style="text-align:right"><span class="badge" [class]="o.status">{{ orderLabel[o.status] }}</span><div class="price">{{ money(o.total) }}</div></div>
              </a>
            }
          </section>
        </div>
        <form class="card" (ngSubmit)="save()">
          <h3>Mes informations</h3>
          @if (msg) { <div class="ok-msg">{{ msg }}</div> }
          @if (error) { <div class="err">{{ error }}</div> }
          <div class="field"><label for="n">Nom</label><input id="n" name="n" [(ngModel)]="name" required /></div>
          <div class="field"><label for="p">Téléphone</label><input id="p" name="p" [(ngModel)]="phone" type="tel" /></div>
          <div class="field"><label>Email</label><input [value]="auth.user()?.email" disabled /></div>
          <button class="btn btn-dark btn-block">Enregistrer</button>
        </form>
      </div>
    </div>
  `,
})
export class AccountPage implements OnInit {
  private api = inject(Api);
  auth = inject(AuthService);
  money = money;
  slot = slotLabel;
  orderLabel = ORDER_LABEL;
  orders: Order[] = [];
  name = '';
  phone = '';
  msg = '';
  error = '';

  ngOnInit() {
    const u = this.auth.user();
    if (u) { this.name = u.name; this.phone = u.phone || ''; }
    this.api.get<Order[]>('/me/orders').subscribe({ next: (o) => (this.orders = o) });
  }

  save() {
    this.msg = '';
    this.error = '';
    this.api.put<User>('/me', { name: this.name, phone: this.phone }).subscribe({
      next: (u) => {
        this.auth.user.set(u);
        try { localStorage.setItem('cantinho_user', JSON.stringify(u)); } catch { /* ignore */ }
        this.msg = 'Informations enregistrées.';
      },
      error: (e) => (this.error = errMsg(e)),
    });
  }
}
