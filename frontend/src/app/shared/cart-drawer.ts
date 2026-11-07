import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../core/cart.service';
import { money } from '../core/util';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  template: `
    @if (cart.open()) {
      <div class="overlay" style="justify-content:flex-end" (click)="cart.open.set(false)"></div>
      <aside class="drawer" role="dialog" aria-label="Panier">
        <header class="row between">
          <h2 style="margin:0">Votre panier</h2>
          <button class="btn btn-ghost btn-sm" (click)="cart.open.set(false)" aria-label="Fermer">Fermer</button>
        </header>
        <div class="body">
          @if (!cart.lines().length) {
            <p class="muted" style="padding:24px 0">Votre panier est vide. Parcourez la carte pour ajouter un plat ou une boisson.</p>
          }
          @for (l of cart.lines(); track l.key) {
            <div class="line">
              <div>
                <b>{{ l.name }}</b>
                @if (l.optionsText) { <div class="small muted">{{ l.optionsText }}</div> }
                @if (l.note) { <div class="small muted">Note : {{ l.note }}</div> }
              </div>
              <div class="price">{{ money(l.unitPrice * l.qty) }}</div>
              <div class="qty">
                <button (click)="cart.setQty(l.key, l.qty - 1)" aria-label="Retirer un">−</button>
                <span>{{ l.qty }}</span>
                <button (click)="cart.setQty(l.key, l.qty + 1)" aria-label="Ajouter un">+</button>
              </div>
            </div>
          }
        </div>
        <footer>
          <div class="row between" style="margin-bottom:12px"><span>Total</span><b class="big-total">{{ money(cart.total()) }}</b></div>
          <button class="btn btn-primary btn-block" [disabled]="!cart.lines().length" (click)="go()">Valider la commande</button>
        </footer>
      </aside>
    }
  `,
})
export class CartDrawer {
  cart = inject(CartService);
  private router = inject(Router);
  money = money;

  go() {
    this.cart.open.set(false);
    this.router.navigateByUrl('/commande');
  }
}
