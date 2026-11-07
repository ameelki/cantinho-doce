import { I18n } from '../core/i18n.service';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { CartService } from '../core/cart.service';
import { SettingsService } from '../core/settings.service';
import { ToastService } from '../core/toast.service';
import { Category, Menu, OptionChoice, OptionGroup, Product } from '../core/models';
import { errMsg, money, parseOptions, productImg } from '../core/util';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="padding-top:20px">
      <h1 style="font-size:clamp(1.6rem,4vw,2.4rem)">La carte</h1>
      @if (settings.loaded() && !settings.bool('orders.enabled')) {
        <div class="err">Les commandes en ligne sont fermées pour le moment. {{ settings.str('orders.message') }}</div>
      } @else if (settings.str('orders.message')) {
        <div class="table-banner">{{ settings.str('orders.message') }}</div>
      }
      @if (error) { <div class="err">{{ error }}</div> }
      @if (menu(); as m) {
        <div class="cats" role="tablist" aria-label="Catégories">
          <button class="chip" [class.on]="active() === null" (click)="active.set(null)">Tout</button>
          @for (c of m.categories; track c.id) {
            <button class="chip" [class.on]="active() === c.id" (click)="active.set(c.id)">{{ c.icon }} {{ i18n.field(c, 'name') }}</button>
          }
        </div>
        @for (c of m.categories; track c.id) {
          @if (active() === null || active() === c.id) {
            <section style="margin:24px 0">
              <h2>{{ c.icon }} {{ i18n.field(c, 'name') }}</h2>
              @if (c.description) { <p class="muted">{{ i18n.field(c, 'description') }}</p> }
              <div class="grid c2">
                @for (p of itemsOf(m, c); track p.id) {
                  <div class="prod" [class.off]="!p.available" role="button" tabindex="0" (click)="open(p)" (keydown.enter)="open(p)">
                    <div class="pic"><img [src]="img(p)" [alt]="i18n.field(p, 'name')" loading="lazy" /></div>
                    <div>
                      <h3>{{ i18n.field(p, 'name') }}</h3>
                      @if (p.description) { <p class="desc">{{ i18n.field(p, 'description') }}</p> }
                      <div class="row between">
                        <span class="price">{{ money(p.price) }}</span>
                        @if (!p.available) { <span class="badge CANCELLED">Épuisé</span> } @else { <span class="badge READY">Ajouter</span> }
                      </div>
                      @if (p.tags) { <div style="margin-top:6px">@for (t of tagsOf(p); track t) { <span class="tag">{{ t }}</span> }</div> }
                    </div>
                  </div>
                }
              </div>
            </section>
          }
        }
        @if (!m.products.length) { <p class="muted">La carte est en cours de préparation.</p> }
      } @else if (!error) {
        <p class="muted">Chargement de la carte…</p>
      }
    </div>

    @if (sel) {
      <div class="overlay" (click)="sel = null">
        <div class="modal" role="dialog" [attr.aria-label]="i18n.field(sel, 'name')" (click)="$event.stopPropagation()">
          <h2>{{ i18n.field(sel, 'name') }}</h2>
          @if (sel.description) { <p class="muted">{{ i18n.field(sel, 'description') }}</p> }
          @for (g of groups; track g.name) {
            <div class="stack" style="margin-bottom:14px">
              <div class="lbl">{{ g.name }} @if (g.required) { <span class="muted small">(obligatoire)</span> } @else { <span class="muted small">(facultatif)</span> }</div>
              @for (c of g.choices; track c.name) {
                <div class="opt" [class.on]="isOn(g, c)" role="button" tabindex="0" (click)="toggle(g, c)" (keydown.enter)="toggle(g, c)">
                  <span>{{ c.name }}</span>
                  <span class="muted">{{ c.price ? '+ ' + money(c.price) : '' }}</span>
                </div>
              }
            </div>
          }
          <div class="field"><label for="note">Précision pour la cuisine</label><input id="note" [(ngModel)]="note" placeholder="Sans glaçons, bien chaud…" maxlength="200" /></div>
          @if (pickError) { <div class="err">{{ pickError }}</div> }
          <div class="row between">
            <div class="qty"><button (click)="qty = max1(qty - 1)" aria-label="Moins">−</button><span>{{ qty }}</span><button (click)="qty = qty + 1" aria-label="Plus">+</button></div>
            <button class="btn btn-primary" (click)="confirm()">Ajouter · {{ money(unit() * qty) }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MenuPage implements OnInit {
  i18n = inject(I18n);
  private api = inject(Api);
  private toast = inject(ToastService);
  cart = inject(CartService);
  settings = inject(SettingsService);
  money = money;
  img = productImg;

  menu = signal<Menu | null>(null);
  active = signal<number | null>(null);
  error = '';
  sel: Product | null = null;
  groups: OptionGroup[] = [];
  picks: Record<string, string[]> = {};
  qty = 1;
  note = '';
  pickError = '';

  ngOnInit() {
    this.api.get<Menu>('/public/menu').subscribe({ next: (m) => this.menu.set(m), error: (e) => (this.error = errMsg(e)) });
  }

  itemsOf(m: Menu, c: Category): Product[] { return m.products.filter((p) => p.category?.id === c.id); }
  tagsOf(p: Product): string[] { return (p.tags || '').split(',').map((s) => s.trim()).filter(Boolean); }
  max1(n: number) { return Math.max(1, n); }

  open(p: Product) {
    if (!p.available || !this.settings.bool('orders.enabled')) return;
    const groups = parseOptions(p.optionsJson);
    if (!groups.length) {
      this.cart.add({ productId: p.id, name: this.i18n.field(p, 'name'), unitPrice: Number(p.price), qty: 1, choices: [], optionsText: '' });
      this.toast.show(this.i18n.tr('§ ajouté au panier'.replace('§', this.i18n.field(p, 'name'))));
      return;
    }
    this.sel = p;
    this.groups = groups;
    this.picks = {};
    for (const g of groups) if (g.required && !g.multi && g.choices.length) this.picks[g.name] = [g.name + '|' + g.choices[0].name];
    this.qty = 1;
    this.note = '';
    this.pickError = '';
  }

  isOn(g: OptionGroup, c: OptionChoice): boolean { return (this.picks[g.name] || []).includes(g.name + '|' + c.name); }

  toggle(g: OptionGroup, c: OptionChoice) {
    const key = g.name + '|' + c.name;
    const cur = this.picks[g.name] || [];
    if (g.multi) this.picks[g.name] = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
    else this.picks[g.name] = cur.includes(key) && !g.required ? [] : [key];
  }

  unit(): number {
    if (!this.sel) return 0;
    let total = Number(this.sel.price);
    for (const g of this.groups) for (const c of g.choices) if (this.isOn(g, c)) total += Number(c.price || 0);
    return total;
  }

  confirm() {
    if (!this.sel) return;
    for (const g of this.groups) {
      if (g.required && !(this.picks[g.name] || []).length) { this.pickError = 'Choisissez « ' + g.name + ' ».'; return; }
    }
    const choices: string[] = [];
    const names: string[] = [];
    for (const g of this.groups) for (const c of g.choices) if (this.isOn(g, c)) { choices.push(g.name + '|' + c.name); names.push(c.name); }
    this.cart.add({ productId: this.sel.id, name: this.i18n.field(this.sel, 'name'), unitPrice: this.unit(), qty: this.qty, choices, optionsText: names.join(', '), note: this.note.trim() || undefined });
    this.toast.show(this.i18n.tr('§ ajouté au panier'.replace('§', this.i18n.field(this.sel, 'name'))));
    this.sel = null;
  }
}
