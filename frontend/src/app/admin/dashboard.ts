import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { Category, Order, Product } from '../core/models';
import { errMsg, money, slotLabel } from '../core/util';

interface Stats {
  ordersToday: number; revenueToday: number; orders30: number; revenue30: number; pendingOrders: number;
  days: { date: string; orders: number; revenue: number }[];
  topProducts: { name: string; quantity: number }[];
  upcomingOrders: Order[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <h1>Tableau de bord</h1>
    @if (error) { <div class="err">{{ error }}</div> }
    @if (s; as st) {
      <div class="grid c4">
        <div class="stat"><span class="muted">Commandes aujourd'hui</span><b>{{ st.ordersToday }}</b></div>
        <div class="stat"><span class="muted">Chiffre du jour</span><b>{{ money(st.revenueToday) }}</b></div>
        <div class="stat"><span class="muted">Chiffre sur 30 jours</span><b>{{ money(st.revenue30) }}</b></div>
        <a class="stat" routerLink="/admin/commandes" style="text-decoration:none;color:inherit"><span class="muted">Commandes à traiter</span><b>{{ st.pendingOrders }}</b></a>
      </div>
      <div class="grid c2" style="margin-top:16px">
        <section class="card">
          <h3>Chiffre d'affaires des 14 derniers jours</h3>
          <div class="bars-wrap"><div class="bars">
            @for (d of st.days; track d.date) {
              <div [style.height.%]="barHeight(d.revenue)" [title]="d.date + ' : ' + money(d.revenue) + ' (' + d.orders + ' commandes)'"><span>{{ d.date.substring(8) }}</span></div>
            }
          </div></div>
        </section>
        <section class="card">
          <h3>Produits les plus commandés (30 jours)</h3>
          @if (!st.topProducts.length) { <p class="muted">Pas encore de commandes.</p> }
          @for (p of st.topProducts; track p.name) {
            <div class="line"><span>{{ p.name }}</span><b>{{ p.quantity }}</b></div>
          }
        </section>
      </div>
      <section class="card" style="margin-top:16px">
        <h3>Prochains retraits et livraisons</h3>
        @if (!st.upcomingOrders.length) { <p class="muted">Rien de prévu pour l'instant.</p> }
        @for (o of st.upcomingOrders; track o.id) {
          <div class="line">
            <div><b>{{ slot(o.scheduledAt) }}</b><div class="small muted">{{ o.customerName }} · {{ o.mode === 'DELIVERY' ? 'Livraison, ' + o.city : 'Retrait' }} · {{ o.code }}</div></div>
            <span class="badge" [class]="o.status">{{ money(o.total) }}</span>
          </div>
        }
      </section>
    }
    <section class="card" style="margin-top:16px">
      <div class="row" style="justify-content:space-between">
        <h3>La carte par catégorie</h3>
        <a class="btn btn-ghost btn-sm" routerLink="/admin/carte">Modifier la carte</a>
      </div>
      @if (!groups.length) { <p class="muted">Aucun produit pour l'instant.</p> }
      @for (g of groups; track g.cat.id) {
        <div class="cat-block">
          <h4>{{ g.cat.icon }} {{ g.cat.name }} <span class="muted small">({{ g.items.length }})</span>@if (!g.cat.active) { <span class="badge CANCELLED">masquée</span> }</h4>
          @for (p of g.items; track p.id) {
            <div class="line">
              <span>{{ p.name }}@if (!p.available) { <span class="badge CANCELLED">épuisé</span> }@if (!p.active) { <span class="badge CANCELLED">masqué</span> }</span>
              <b>{{ money(p.price) }}</b>
            </div>
          } @empty { <p class="muted small">Aucun produit dans cette catégorie.</p> }
        </div>
      }
    </section>
  `,
})
export class DashboardPage implements OnInit {
  private api = inject(Api);
  money = money;
  slot = slotLabel;
  s: Stats | null = null;
  error = '';
  groups: { cat: Category; items: Product[] }[] = [];

  ngOnInit() {
    this.api.get<Category[]>('/admin/categories').subscribe({
      next: (cats) => this.api.get<Product[]>('/admin/products').subscribe({
        next: (prods) => {
          const sorted = [...cats].sort((a, b) => a.position - b.position);
          this.groups = sorted.map((c) => ({ cat: c, items: prods.filter((p) => p.category?.id === c.id).sort((a, b) => a.position - b.position) }));
          const orphans = prods.filter((p) => !p.category || !cats.some((c) => c.id === p.category!.id));
          if (orphans.length) this.groups.push({ cat: { id: -1, name: 'Sans catégorie', position: 999, active: true } as Category, items: orphans });
        },
      }),
    });
    this.api.get<Stats>('/admin/stats').subscribe({ next: (x) => (this.s = x), error: (e) => (this.error = errMsg(e)) });
  }

  barHeight(v: number): number {
    const max = Math.max(1, ...(this.s?.days.map((d) => Number(d.revenue)) || [1]));
    return Math.max(2, (Number(v) / max) * 100);
  }
}
