import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { SettingsService } from '../core/settings.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <nav class="side" aria-label="Administration">
        <a routerLink="/admin" class="brand">{{ settings.str('cafe.name', 'Cantinho Doce') }}</a>
        <a routerLink="/admin/tableau" routerLinkActive="active">Tableau de bord</a>
        <a routerLink="/admin/commandes" routerLinkActive="active">Commandes</a>
        <a routerLink="/admin/carte" routerLinkActive="active">Carte et produits</a>
        <a routerLink="/admin/livraison" routerLinkActive="active">Livraison et créneaux</a>
        <a routerLink="/admin/theme" routerLinkActive="active">Thème et design</a>
        <a routerLink="/admin/equipe" routerLinkActive="active">Équipe</a>
        <a routerLink="/admin/reglages" routerLinkActive="active">Réglages</a>
        <span style="flex:1"></span>
        <a routerLink="/cuisine">Atelier (préparation)</a>
        <a routerLink="/">Voir le site</a>
        <a href="#" (click)="$event.preventDefault(); auth.logout()">Déconnexion</a>
      </nav>
      <div class="main"><router-outlet /></div>
    </div>
  `,
})
export class AdminShell {
  auth = inject(AuthService);
  settings = inject(SettingsService);
}
