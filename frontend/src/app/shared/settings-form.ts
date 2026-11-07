import { Component, Input, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { SettingsService } from '../core/settings.service';
import { errMsg } from '../core/util';

export interface SettingField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'bool' | 'color' | 'time';
  hint?: string;
}

/** Formulaire de réglages : lit /admin/settings et n'enregistre que les clés qu'il affiche. */
@Component({
  selector: 'app-settings-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card" style="margin-bottom:16px">
      <h2>{{ title }}</h2>
      @if (msg) { <div class="ok-msg" role="status">{{ msg }}</div> }
      @if (error) { <div class="err" role="alert">{{ error }}</div> }
      <div class="form-grid">
        @for (f of fields; track f.key) {
          @switch (f.type) {
            @case ('bool') {
              <label class="check field"><input type="checkbox" [checked]="vals[f.key] === 'true'" (change)="vals[f.key] = vals[f.key] === 'true' ? 'false' : 'true'" /> {{ f.label }}</label>
            }
            @case ('textarea') {
              <div class="field" style="grid-column:1/-1"><label>{{ f.label }}</label><textarea [(ngModel)]="vals[f.key]"></textarea>@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
            }
            @case ('color') {
              <div class="field"><label>{{ f.label }}</label><input type="color" [(ngModel)]="vals[f.key]" style="padding:4px" /></div>
            }
            @case ('number') {
              <div class="field"><label>{{ f.label }}</label><input type="number" step="any" [(ngModel)]="vals[f.key]" />@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
            }
            @case ('time') {
              <div class="field"><label>{{ f.label }}</label><input type="time" [(ngModel)]="vals[f.key]" /></div>
            }
            @default {
              <div class="field"><label>{{ f.label }}</label><input [(ngModel)]="vals[f.key]" />@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
            }
          }
        }
      </div>
      <button class="btn btn-primary" [disabled]="saving" (click)="save()">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
    </section>
  `,
})
export class SettingsForm implements OnInit {
  private api = inject(Api);
  private settings = inject(SettingsService);
  @Input() title = '';
  @Input() fields: SettingField[] = [];
  vals: Record<string, string> = {};
  msg = '';
  error = '';
  saving = false;

  ngOnInit() {
    this.api.get<Record<string, string>>('/admin/settings').subscribe({
      next: (s) => (this.vals = { ...s }),
      error: (e) => (this.error = errMsg(e)),
    });
  }

  save() {
    this.msg = '';
    this.error = '';
    this.saving = true;
    const body: Record<string, string> = {};
    for (const f of this.fields) body[f.key] = String(this.vals[f.key] ?? '');
    this.api.put<Record<string, string>>('/admin/settings', body).subscribe({
      next: (s) => { this.vals = { ...s }; this.saving = false; this.msg = 'Réglages enregistrés.'; this.settings.load(); },
      error: (e) => { this.saving = false; this.error = errMsg(e); },
    });
  }
}
