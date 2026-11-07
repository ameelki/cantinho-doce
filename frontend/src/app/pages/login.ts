import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { errMsg } from '../core/util';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="container" style="padding:40px 0; max-width:440px">
      <h1 style="font-size:1.8rem">Connexion</h1>
      <form class="card" (ngSubmit)="submit()">
        @if (expired) { <div class="err">Votre session a expiré. Reconnectez-vous.</div> }
        @if (error) { <div class="err" role="alert">{{ error }}</div> }
        <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="username" /></div>
        <div class="field"><label for="pw">Mot de passe</label><input id="pw" name="pw" type="password" [(ngModel)]="password" required autocomplete="current-password" /></div>
        <button class="btn btn-primary btn-block" [disabled]="busy">{{ busy ? 'Connexion…' : 'Se connecter' }}</button>
        <p class="muted center" style="margin-top:14px">Pas encore de compte ? <a routerLink="/inscription">Créer un compte</a></p>
      </form>
    </div>
  `,
})
export class LoginPage implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  email = '';
  password = '';
  error = '';
  busy = false;
  expired = false;

  ngOnInit() { this.expired = !!this.route.snapshot.queryParamMap.get('expire'); }

  async submit() {
    this.error = '';
    this.busy = true;
    try {
      const u = await this.auth.login(this.email, this.password);
      const back = this.route.snapshot.queryParamMap.get('retour');
      this.router.navigateByUrl(back && back.startsWith('/') ? back : this.auth.homeFor(u));
    } catch (e) {
      this.error = errMsg(e);
    }
    this.busy = false;
  }
}
