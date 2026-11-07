import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { Order, OrderStatus } from '../core/models';
import { MODE_LABEL, ORDER_LABEL, errMsg, money, slotLabel } from '../core/util';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="row between"><h1>Commandes</h1>
      <select [(ngModel)]="filter" style="width:auto" aria-label="Filtrer par statut">
        <option value="">Tous les statuts</option>
        @for (s of statuses; track s) { <option [value]="s">{{ label[s] }}</option> }
      </select></div>
    @if (error) { <div class="err">{{ error }}</div> }
    <div class="tbl-wrap"><table class="t">
      <thead><tr><th>Code</th><th>Pour le</th><th>Client</th><th>Détail</th><th>Total</th><th>Statut</th><th>Payée</th></tr></thead>
      <tbody>
        @for (o of shown(); track o.id) {
          <tr>
            <td data-label="Code"><b>{{ o.code }}</b></td>
            <td data-label="Pour le"><b>{{ slot(o.scheduledAt) }}</b><br><span class="muted small">reçue le {{ o.createdAt.substring(0, 10) }}</span></td>
            <td data-label="Client">{{ o.customerName }}<br><span class="muted small">{{ mode[o.mode] }} · {{ o.phone }}</span>@if (o.mode === 'DELIVERY') { <br><span class="small">{{ o.address }}, {{ o.postalCode }} {{ o.city }}</span> }</td>
            <td class="small" data-label="Détail">@for (it of o.items; track it.id) { <div>{{ it.quantity }} × {{ it.name }}{{ it.optionsText ? ' (' + it.optionsText + ')' : '' }}</div> }</td>
            <td data-label="Total">{{ money(o.total) }}@if (o.mode === 'DELIVERY') { <br><span class="muted small">dont livraison {{ money(o.deliveryFee) }}</span> }</td>
            <td data-label="Statut">
              @if (o.status === 'SERVED' || o.status === 'CANCELLED') { <span class="badge" [class]="o.status">{{ label[o.status] }}</span> }
              @else {
                <select [ngModel]="o.status" (ngModelChange)="setStatus(o, $event)" style="width:auto;min-height:36px" [attr.aria-label]="'Statut ' + o.code">
                  @for (s of statuses; track s) { <option [value]="s">{{ label[s] }}</option> }
                </select>
              }
            </td>
            <td data-label="Payée"><input type="checkbox" [checked]="o.paid" (change)="setPaid(o)" [attr.aria-label]="'Payée ' + o.code" /></td>
          </tr>
        }
      </tbody>
    </table></div>
    @if (!shown().length) { <p class="muted">Aucune commande.</p> }
  `,
})
export class AdminOrdersPage implements OnInit, OnDestroy {
  private api = inject(Api);
  money = money;
  label = ORDER_LABEL;
  mode = MODE_LABEL;
  slot = slotLabel;
  statuses: OrderStatus[] = ['NEW', 'PREPARING', 'READY', 'DELIVERING', 'SERVED', 'CANCELLED'];
  orders: Order[] = [];
  filter = '';
  error = '';
  private timer: any;

  ngOnInit() { this.load(); this.timer = setInterval(() => this.load(), 15000); }
  ngOnDestroy() { clearInterval(this.timer); }

  shown(): Order[] { return this.filter ? this.orders.filter((o) => o.status === this.filter) : this.orders; }

  load() { this.api.get<Order[]>('/admin/orders').subscribe({ next: (o) => (this.orders = o), error: (e) => (this.error = errMsg(e)) }); }

  setStatus(o: Order, status: OrderStatus) {
    this.api.put<Order>('/admin/orders/' + o.id + '/status', { status }).subscribe({ next: () => this.load(), error: (e) => { this.error = errMsg(e); this.load(); } });
  }

  setPaid(o: Order) {
    this.api.put<Order>('/admin/orders/' + o.id + '/paid', { paid: !o.paid }).subscribe({ next: (x) => (o.paid = x.paid), error: (e) => (this.error = errMsg(e)) });
  }
}
