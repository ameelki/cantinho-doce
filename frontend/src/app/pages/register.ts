import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="padding:40px 0; max-width:480px">
      <h1 style="font-size:1.8rem">Créer un compte</h1>
      <form class="card" (ngSubmit)="submit()">
        @if (error) { <div class="err" role="alert">{{ error }}</div> }
        <div class="field"><label for="name">Nom</label><input id="name" name="name" [(ngModel)]="name" required autocomplete="name" /></div>
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" /></div>
        <div class="field"><label for="phone">Téléphone</label><input id="phone" name="phone" type="tel" [(ngModel)]="phone" autocomplete="tel" /></div>
        <div class="field"><label for="pw">Mot de passe (8 caractères minimum)</label><input id="pw" name="pw" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" /></div>
        <button class="btn btn-primary btn-block" [disabled]="busy">{{ busy ? 'Création…' : 'Créer mon compte' }}</button>
        <p class="muted center" style="margin-top:14px">Déjà inscrit ? <a routerLink="/connexion">Se connecter</a></p>
      </form>
    </div>
  `,
})
export class RegisterPage {
  private auth = inject(AuthService);
  private router = inject(Router);
  name = '';
  email = '';
  phone = '';
  password = '';
  error = '';
  busy = false;

  async submit() {
    this.error = '';
    this.busy = true;
    try {
      const u = await this.auth.register(this.name, this.email, this.password, this.phone);
      this.router.navigateByUrl(this.auth.homeFor(u));
    } catch (e) {
      this.error = errMsg(e);
    }
    this.busy = false;
  }
}
