import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Api } from '../core/api.service';
import { I18n } from '../core/i18n.service';
import { Menu, Product } from '../core/models';
import { SettingsService } from '../core/settings.service';
import { money, productImg } from '../core/util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="hero">
      <svg class="tiles" aria-hidden="true" width="100%" height="100%">
        <defs>
          <pattern id="azulejo" width="84" height="84" patternUnits="userSpaceOnUse">
            <path d="M42 6c8 10 8 20 0 30-8-10-8-20 0-30zM42 48c8 10 8 20 0 30-8-10-8-20 0-30zM6 42c10-8 20-8 30 0-10 8-20 8-30 0zM48 42c10-8 20-8 30 0-10 8-20 8-30 0z" fill="none" stroke="currentColor" stroke-width="2"/>
            <circle cx="42" cy="42" r="5" fill="currentColor"/>
            <circle cx="0" cy="0" r="3" fill="currentColor"/><circle cx="84" cy="0" r="3" fill="currentColor"/>
            <circle cx="0" cy="84" r="3" fill="currentColor"/><circle cx="84" cy="84" r="3" fill="currentColor"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#azulejo)"/>
      </svg>
      <div class="container hero-in">
        <div>
          <h1>{{ settings.str('theme.heroTitle', settings.str('cafe.name')) }}</h1>
          <p class="lead">{{ settings.str('theme.heroSubtitle') }}</p>
          <div class="cta">
            @if (settings.bool('orders.enabled')) { <a routerLink="/carte" class="btn btn-gold">Commander</a> }
            <a routerLink="/suivi" class="btn btn-ghost">Suivre ma commande</a>
          </div>
        </div>
        <div class="plate" aria-hidden="true">
          <svg viewBox="0 0 300 300">
            <circle cx="150" cy="150" r="140" fill="var(--pistache)"/>
            <circle cx="150" cy="150" r="118" fill="none" stroke="var(--card)" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round"/>
            <path d="M70 160h160l-16 62a14 14 0 0 1-14 11H100a14 14 0 0 1-14-11z" fill="#d98a3d"/>
            <path d="M70 160l8 14M95 160l6 18M122 160l4 20M150 160v22M178 160l-4 20M205 160l-6 18M230 160l-8 14" stroke="#b86a22" stroke-width="3" stroke-linecap="round"/>
            <ellipse cx="150" cy="158" rx="82" ry="22" fill="#fff0b8"/>
            <ellipse cx="150" cy="156" rx="70" ry="15" fill="#ffd96b"/>
            <circle cx="122" cy="154" r="6" fill="#a45a1c" opacity=".85"/><circle cx="160" cy="150" r="8" fill="#a45a1c" opacity=".85"/><circle cx="186" cy="159" r="5" fill="#a45a1c" opacity=".85"/>
          </svg>
        </div>
      </div>
    </section>
    <div class="info-band"><div class="container">
      @if (settings.bool('orders.pickup.enabled')) { <span>Retrait sur place</span> }
      @if (settings.bool('orders.delivery.enabled')) {
        <span>Livraison à domicile</span>
        @if (settings.num('delivery.freeFrom') > 0) { <span>Offerte dès {{ money(settings.num('delivery.freeFrom')) }}</span> }
      }
      <span>Vous choisissez le jour et l'heure</span>
    </div></div>

    @if (featured().length) {
      <section class="section">
        <div class="container">
          <h2>Nos douceurs du moment</h2>
          <div class="grid c4 feat">
            @for (p of featured(); track p.id) {
              <a routerLink="/carte" class="card feat-card">
                <img [src]="img(p)" [alt]="i18n.field(p, 'name')" loading="lazy" />
                <b>{{ i18n.field(p, 'name') }}</b>
                <span class="price">{{ money(p.price) }}</span>
              </a>
            }
          </div>
          <p style="margin-top:20px"><a routerLink="/carte" class="btn btn-dark">Voir toute la carte</a></p>
        </div>
      </section>
    }

    @if (settings.bool('orders.enabled')) {
      <section class="section how">
        <div class="container">
          <h2>Commander en trois étapes</h2>
          <ol class="how-list">
            <li><b>Composez votre commande</b><span>Parts, boîtes, gâteaux sur mesure : choisissez taille, parfum et décoration.</span></li>
            <li><b>Choisissez le jour et l'heure</b><span>Retrait ou livraison, sur le créneau qui vous arrange.</span></li>
            <li><b>Suivez-la en direct</b><span>Du four jusqu'à votre porte, chaque étape s'affiche sur votre écran.</span></li>
          </ol>
        </div>
      </section>
    }

    <section class="section">
      <div class="container grid c2">
        <div class="card">
          <h2>Retrait</h2>
          <p class="muted">{{ settings.str('orders.pickup.address') }}</p>
          <p class="muted">{{ settings.str('cafe.hours') }}</p>
        </div>
        <div class="card">
          <h2>Livraison</h2>
          <p class="muted">{{ settings.str('delivery.info') }}</p>
          <p class="muted">Frais à partir de {{ money(settings.num('delivery.fee')) }}@if (settings.num('delivery.freeFrom') > 0) { · offerts dès {{ money(settings.num('delivery.freeFrom')) }} }.</p>
        </div>
      </div>
    </section>
    <section class="section"><div class="container"><p class="lead-about">{{ settings.str('cafe.about') }}</p></div></section>
  `,
})
export class HomePage implements OnInit {
  private api = inject(Api);
  settings = inject(SettingsService);
  i18n = inject(I18n);
  money = money;
  img = productImg;
  featured = signal<Product[]>([]);

  ngOnInit() {
    this.api.get<Menu>('/public/menu').subscribe({
      next: (m) => this.featured.set(m.products.filter((p) => p.available).slice(0, 4)),
    });
  }
}
