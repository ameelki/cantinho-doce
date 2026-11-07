import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { SettingsService, applyTheme } from '../core/settings.service';
import { errMsg } from '../core/util';

interface Preset { id: string; name: string; v: Record<string, string>; }

const PRESETS: Preset[] = [
  { id: 'azulejo', name: 'Azulejo', v: { 'theme.primary': '#1f4fa3', 'theme.accent': '#f2b632', 'theme.background': '#fff8e7', 'theme.surface': '#ffffff', 'theme.text': '#2b1d14', 'theme.dark': '#0f2556', 'theme.headingFont': 'Fraunces', 'theme.bodyFont': 'Nunito Sans', 'theme.radius': '16' } },
  { id: 'framboise', name: 'Framboise', v: { 'theme.primary': '#b8244f', 'theme.accent': '#ffc9d6', 'theme.background': '#fff4f6', 'theme.surface': '#ffffff', 'theme.text': '#3a1620', 'theme.dark': '#4a0f26', 'theme.headingFont': 'Playfair Display', 'theme.bodyFont': 'DM Sans', 'theme.radius': '22' } },
  { id: 'chocolat', name: 'Chocolat', v: { 'theme.primary': '#6b3a1e', 'theme.accent': '#e9b872', 'theme.background': '#f8efe4', 'theme.surface': '#ffffff', 'theme.text': '#2a170d', 'theme.dark': '#25130a', 'theme.headingFont': 'DM Serif Display', 'theme.bodyFont': 'Lato', 'theme.radius': '10' } },
  { id: 'pistache', name: 'Pistache', v: { 'theme.primary': '#3f7d4e', 'theme.accent': '#f6d365', 'theme.background': '#f4f8ec', 'theme.surface': '#ffffff', 'theme.text': '#1f2d22', 'theme.dark': '#173223', 'theme.headingFont': 'Lora', 'theme.bodyFont': 'Nunito Sans', 'theme.radius': '18' } },
  { id: 'nuit', name: 'Nuit sucrée', v: { 'theme.primary': '#7c3aed', 'theme.accent': '#fbbf24', 'theme.background': '#faf7ff', 'theme.surface': '#ffffff', 'theme.text': '#241a3a', 'theme.dark': '#1b1033', 'theme.headingFont': 'Poppins', 'theme.bodyFont': 'Inter', 'theme.radius': '26' } },
];

const KEYS = ['theme.preset', 'theme.primary', 'theme.accent', 'theme.background', 'theme.surface', 'theme.text', 'theme.dark',
  'theme.headingFont', 'theme.bodyFont', 'theme.radius', 'theme.heroTitle', 'theme.heroSubtitle'];

@Component({
  selector: 'app-theme',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h1>Thème et design</h1>
    <p class="muted">Les changements s'affichent tout de suite sur cette page. Cliquez sur « Enregistrer » pour les appliquer au site.</p>
    @if (msg) { <div class="ok-msg" role="status">{{ msg }}</div> }
    @if (error) { <div class="err" role="alert">{{ error }}</div> }
    <section class="card" style="margin-bottom:16px">
      <h2>Ambiances prêtes à l'emploi</h2>
      <div class="theme-presets">
        @for (p of presets; track p.id) {
          <button type="button" class="preset" [class.on]="vals['theme.preset'] === p.id" (click)="usePreset(p)">
            <i><s [style.background]="p.v['theme.primary']"></s><s [style.background]="p.v['theme.accent']"></s><s [style.background]="p.v['theme.background']"></s><s [style.background]="p.v['theme.dark']"></s></i>
            <b>{{ p.name }}</b>
          </button>
        }
      </div>
    </section>
    <section class="card" style="margin-bottom:16px">
      <h2>Couleurs</h2>
      <div class="form-grid">
        @for (c of colors; track c.key) {
          <div class="field"><label [for]="c.key">{{ c.label }}</label>
            <input [id]="c.key" type="color" [ngModel]="vals[c.key]" (ngModelChange)="set(c.key, $event)" [name]="c.key" style="padding:4px" /></div>
        }
      </div>
    </section>
    <section class="card" style="margin-bottom:16px">
      <h2>Polices et formes</h2>
      <div class="form-grid">
        <div class="field"><label for="hf">Police des titres</label>
          <select id="hf" name="hf" [ngModel]="vals['theme.headingFont']" (ngModelChange)="set('theme.headingFont', $event)">
            @for (f of headingFonts; track f) { <option [value]="f">{{ f }}</option> }
          </select></div>
        <div class="field"><label for="bf">Police du texte</label>
          <select id="bf" name="bf" [ngModel]="vals['theme.bodyFont']" (ngModelChange)="set('theme.bodyFont', $event)">
            @for (f of bodyFonts; track f) { <option [value]="f">{{ f }}</option> }
          </select></div>
        <div class="field"><label for="rad">Arrondi des cartes et boutons : {{ vals['theme.radius'] }} px</label>
          <input id="rad" name="rad" type="range" min="0" max="32" [ngModel]="vals['theme.radius']" (ngModelChange)="set('theme.radius', $event)" /></div>
      </div>
    </section>
    <section class="card" style="margin-bottom:16px">
      <h2>Texte de la page d'accueil</h2>
      <div class="field"><label for="ht">Titre</label><input id="ht" name="ht" [(ngModel)]="vals['theme.heroTitle']" /></div>
      <div class="field"><label for="hs">Sous-titre</label><input id="hs" name="hs" [(ngModel)]="vals['theme.heroSubtitle']" /></div>
      <p class="muted small">Pour les versions portugais, luxembourgeois et allemand : Réglages, « Textes traduits ».</p>
    </section>
    <section class="card preview" style="margin-bottom:16px">
      <h3>Aperçu</h3>
      <div class="row"><button class="btn btn-primary" type="button">Commander</button><button class="btn btn-gold" type="button">Bouton accent</button><button class="btn btn-dark" type="button">Bouton sombre</button><span class="tag">végétarien</span></div>
    </section>
    <button class="btn btn-primary" (click)="save()" [disabled]="saving">{{ saving ? 'Enregistrement…' : 'Enregistrer le thème' }}</button>
  `,
})
export class ThemePage implements OnInit {
  private api = inject(Api);
  private settings = inject(SettingsService);
  presets = PRESETS;
  vals: Record<string, string> = {};
  msg = '';
  error = '';
  saving = false;
  colors = [
    { key: 'theme.primary', label: 'Couleur principale (boutons, bandeau d\'accueil)' },
    { key: 'theme.accent', label: 'Couleur d\'accent (en-tête, détails)' },
    { key: 'theme.background', label: 'Fond du site' },
    { key: 'theme.surface', label: 'Fond des cartes' },
    { key: 'theme.text', label: 'Texte' },
    { key: 'theme.dark', label: 'Couleur sombre (en-tête, pied de page)' },
  ];
  headingFonts = ['Fraunces', 'Playfair Display', 'DM Serif Display', 'Lora', 'Cormorant Garamond', 'Abril Fatface', 'Poppins', 'Montserrat', 'Unbounded'];
  bodyFonts = ['Nunito Sans', 'DM Sans', 'Inter', 'Lato', 'Poppins', 'Figtree', 'Open Sans'];

  ngOnInit() {
    this.api.get<Record<string, string>>('/admin/settings').subscribe({
      next: (s) => { this.vals = { ...s }; },
      error: (e) => (this.error = errMsg(e)),
    });
  }

  set(k: string, v: string) {
    this.vals[k] = String(v);
    this.vals['theme.preset'] = 'custom';
    applyTheme(this.vals);
  }

  usePreset(p: Preset) {
    this.vals = { ...this.vals, ...p.v, 'theme.preset': p.id };
    applyTheme(this.vals);
  }

  save() {
    this.msg = '';
    this.error = '';
    this.saving = true;
    const body: Record<string, string> = {};
    for (const k of KEYS) body[k] = String(this.vals[k] ?? '');
    body['brand.primary'] = body['theme.primary'];
    body['brand.dark'] = body['theme.dark'];
    this.api.put<Record<string, string>>('/admin/settings', body).subscribe({
      next: (s) => { this.vals = { ...s }; this.saving = false; this.msg = 'Thème enregistré : il est appliqué à tout le site.'; this.settings.load(); },
      error: (e) => { this.saving = false; this.error = errMsg(e); },
    });
  }
}
