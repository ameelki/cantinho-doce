import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Api } from '../core/api.service';
import { OptionGroup } from '../core/models';
import { compressImage } from '../core/image';
import { errMsg, money, parseOptions, productImg } from '../core/util';

export interface Field {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'bool' | 'date' | 'select' | 'password' | 'ref' | 'options' | 'image' | 'i18n';
  options?: { value: string; label: string }[];
  refUrl?: string;
  refLabel?: string;
  hint?: string;
}
export interface Column { key: string; label: string; type?: 'text' | 'money' | 'bool' | 'image'; }

/** Liste + formulaire d'édition générique, utilisée par tous les écrans de configuration. */
@Component({
  selector: 'app-crud-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="row between" style="margin:8px 0 12px">
      <h2 style="margin:0">{{ title }}</h2>
      <button class="btn btn-primary btn-sm" (click)="open(null)">Ajouter</button>
    </div>
    @if (error && !editing) { <div class="err">{{ error }}</div> }
    <div class="tbl-wrap"><table class="t">
      <thead><tr>@for (c of columns; track c.key) { <th>{{ c.label }}</th> }<th></th></tr></thead>
      <tbody>
        @for (it of items; track it.id) {
          <tr>
            @for (c of columns; track c.key) {
              <td [attr.data-label]="c.label">@if (c.type === 'image') { <img class="thumb-sm" [src]="img(it)" alt="" loading="lazy" /> } @else { {{ cell(it, c) }} }</td>
            }
            <td style="white-space:nowrap">
              <button class="btn btn-ghost btn-sm" (click)="open(it)">Modifier</button>
              <button class="btn btn-ghost btn-sm" (click)="remove(it)">Supprimer</button>
            </td>
          </tr>
        }
      </tbody>
    </table></div>
    @if (!items.length) { <p class="muted">Rien pour l'instant. Utilisez « Ajouter » pour commencer.</p> }

    @if (editing) {
      <div class="overlay" (click)="editing = null">
        <div class="modal wide" role="dialog" [attr.aria-label]="title" (click)="$event.stopPropagation()">
          <h2>{{ editing.id ? 'Modifier' : 'Ajouter' }} · {{ title }}</h2>
          @if (error) { <div class="err" role="alert">{{ error }}</div> }
          @for (f of fields; track f.key) {
            @switch (f.type) {
              @case ('bool') {
                <label class="check field"><input type="checkbox" [(ngModel)]="editing[f.key]" /> {{ f.label }}</label>
              }
              @case ('textarea') {
                <div class="field"><label>{{ f.label }}</label><textarea [(ngModel)]="editing[f.key]"></textarea></div>
              }
              @case ('number') {
                <div class="field"><label>{{ f.label }}</label><input type="number" step="any" [(ngModel)]="editing[f.key]" />@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
              }
              @case ('date') {
                <div class="field"><label>{{ f.label }}</label><input type="date" [(ngModel)]="editing[f.key]" /></div>
              }
              @case ('password') {
                <div class="field"><label>{{ f.label }}</label><input type="password" autocomplete="new-password" [(ngModel)]="editing[f.key]" />@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
              }
              @case ('select') {
                <div class="field"><label>{{ f.label }}</label>
                  <select [(ngModel)]="editing[f.key]">@for (o of f.options; track o.value) { <option [value]="o.value">{{ o.label }}</option> }</select></div>
              }
              @case ('ref') {
                <div class="field"><label>{{ f.label }}</label>
                  <select [ngModel]="editing[f.key]?.id" (ngModelChange)="setRef(f, $event)">
                    <option [ngValue]="null">Aucune</option>
                    @for (r of refs[f.key] || []; track r.id) { <option [ngValue]="r.id">{{ r[f.refLabel || 'name'] }}</option> }
                  </select></div>
              }
              @case ('image') {
                <div class="field">
                  <span class="lbl">{{ f.label }}</span>
                  <div class="row" style="flex-wrap:nowrap; align-items:flex-start">
                    <img class="thumb" [src]="preview || currentImg()" alt="Aperçu de la photo" />
                    <div class="stack">
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" (change)="pick($event)" aria-label="Choisir une photo" />
                      @if (hasPhoto()) { <button type="button" class="btn btn-ghost btn-sm" (click)="removePhoto()">Retirer la photo</button> }
                      @if (f.hint) { <span class="muted small">{{ f.hint }}</span> }
                    </div>
                  </div>
                </div>
              }
              @case ('i18n') {
                <div class="field">
                  <span class="lbl">{{ f.label }}</span>
                  @if (f.hint) { <span class="muted small">{{ f.hint }}</span> }
                  @for (l of trLangs; track l.code) {
                    <div class="opt-group">
                      <b>{{ l.label }}</b>
                      <div class="field"><label>Nom ({{ l.label }})</label><input [(ngModel)]="tr[l.code].name" /></div>
                      <div class="field"><label>Description ({{ l.label }})</label><textarea [(ngModel)]="tr[l.code].description"></textarea></div>
                    </div>
                  }
                </div>
              }
              @case ('options') {
                <div class="field">
                  <span class="lbl">{{ f.label }}</span>
                  @if (f.hint) { <span class="muted small">{{ f.hint }}</span> }
                  @for (g of groups; track $index; let gi = $index) {
                    <div class="opt-group">
                      <div class="field"><label>Nom du groupe (ex : Taille, Cuisson)</label><input [(ngModel)]="g.name" /></div>
                      <div class="row">
                        <label class="check"><input type="checkbox" [(ngModel)]="g.required" /> Obligatoire</label>
                        <label class="check"><input type="checkbox" [(ngModel)]="g.multi" /> Plusieurs choix possibles</label>
                        <button type="button" class="btn btn-ghost btn-sm" (click)="groups.splice(gi, 1)">Supprimer le groupe</button>
                      </div>
                      @for (c of g.choices; track $index; let ci = $index) {
                        <div class="row" style="margin-top:8px; flex-wrap:nowrap">
                          <input [(ngModel)]="c.name" placeholder="Nom du choix" aria-label="Nom du choix" />
                          <input type="number" step="0.1" [(ngModel)]="c.price" placeholder="Supplément €" aria-label="Supplément en euros" style="width:130px" />
                          <button type="button" class="btn btn-ghost btn-sm" (click)="g.choices.splice(ci, 1)">Retirer</button>
                        </div>
                      }
                      <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px" (click)="g.choices.push({ name: '', price: 0 })">Ajouter un choix</button>
                    </div>
                  }
                  <button type="button" class="btn btn-ghost btn-sm" (click)="groups.push({ name: '', required: false, multi: false, choices: [] })">Ajouter un groupe d'options</button>
                </div>
              }
              @default {
                <div class="field"><label>{{ f.label }}</label><input [(ngModel)]="editing[f.key]" />@if (f.hint) { <span class="muted small">{{ f.hint }}</span> }</div>
              }
            }
          }
          <div class="row" style="justify-content:flex-end; margin-top:12px">
            <button class="btn btn-ghost" (click)="editing = null">Annuler</button>
            <button class="btn btn-primary" [disabled]="saving" (click)="save()">{{ saving ? 'Enregistrement…' : 'Enregistrer' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class CrudList implements OnInit {
  private api = inject(Api);
  @Input() title = '';
  @Input() endpoint = '';
  @Input() fields: Field[] = [];
  @Input() columns: Column[] = [];
  @Input() defaults: any = {};
  @Output() changed = new EventEmitter<void>();

  items: any[] = [];
  editing: any = null;
  groups: OptionGroup[] = [];
  refs: Record<string, any[]> = {};
  error = '';
  saving = false;
  img = productImg;
  pendingFile: Blob | null = null;
  preview = '';
  removeFlag = false;

  ngOnInit() { this.load(); }

  load() {
    this.api.get<any[]>(this.endpoint).subscribe({ next: (l) => (this.items = l), error: (e) => (this.error = errMsg(e)) });
  }

  private loadRefs() {
    for (const f of this.fields) {
      if (f.type === 'ref' && f.refUrl) this.api.get<any[]>(f.refUrl).subscribe({ next: (l) => (this.refs[f.key] = l) });
    }
  }

  trLangs = [{ code: 'pt', label: 'Português' }, { code: 'lb', label: 'Lëtzebuergesch' }, { code: 'de', label: 'Deutsch' }];
  tr: Record<string, { name: string; description: string }> = this.emptyTr();

  private emptyTr(): Record<string, { name: string; description: string }> {
    return { pt: { name: '', description: '' }, lb: { name: '', description: '' }, de: { name: '', description: '' } };
  }

  private i18nKey(): string | null {
    const f = this.fields.find((x) => x.type === 'i18n');
    return f ? f.key : null;
  }

  private optionsKey(): string | null {
    const f = this.fields.find((x) => x.type === 'options');
    return f ? f.key : null;
  }

  open(item: any) {
    this.error = '';
    this.editing = item ? JSON.parse(JSON.stringify(item)) : JSON.parse(JSON.stringify(this.defaults));
    for (const f of this.fields) if (f.type === 'password') this.editing[f.key] = '';
    const ok = this.optionsKey();
    this.groups = ok ? parseOptions(this.editing[ok]) : [];
    this.tr = this.emptyTr();
    const ik = this.i18nKey();
    if (ik && this.editing[ik]) {
      try {
        const p = JSON.parse(this.editing[ik]);
        for (const l of ['pt', 'lb', 'de']) this.tr[l] = { name: p?.[l]?.name || '', description: p?.[l]?.description || '' };
      } catch { /* JSON invalide : champs vides */ }
    }
    this.pendingFile = null;
    this.preview = '';
    this.removeFlag = false;
    this.loadRefs();
  }

  currentImg(): string { return this.removeFlag ? productImg({ id: 0 }) : productImg(this.editing); }
  hasPhoto(): boolean { return !!this.preview || (!!this.editing?.hasImage && !this.removeFlag); }

  async pick(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const blob = await compressImage(file);
      this.pendingFile = blob;
      this.preview = URL.createObjectURL(blob);
      this.removeFlag = false;
      this.error = '';
    } catch {
      this.error = 'Image illisible. Essayez un autre fichier.';
    }
  }

  removePhoto() {
    this.pendingFile = null;
    this.preview = '';
    this.removeFlag = true;
  }

  setRef(f: Field, id: number | null) {
    this.editing[f.key] = id === null || id === undefined ? null : { id };
  }

  save() {
    this.error = '';
    const body = { ...this.editing };
    const ok = this.optionsKey();
    if (ok) {
      const clean = this.groups
        .filter((g) => g.name && g.name.trim())
        .map((g) => ({ ...g, name: g.name.trim(), choices: g.choices.filter((c) => c.name && c.name.trim()).map((c) => ({ name: c.name.trim(), price: Number(c.price || 0) })) }));
      body[ok] = clean.length ? JSON.stringify(clean) : null;
    }
    for (const f of this.fields) if (f.type === 'password' && !body[f.key]) delete body[f.key];
    const ik = this.i18nKey();
    if (ik) {
      const out: Record<string, { name: string; description: string }> = {};
      for (const l of ['pt', 'lb', 'de']) {
        const n = (this.tr[l].name || '').trim(), d = (this.tr[l].description || '').trim();
        if (n || d) out[l] = { name: n, description: d };
      }
      body[ik] = Object.keys(out).length ? JSON.stringify(out) : null;
    }
    this.saving = true;
    const call = body.id ? this.api.put<any>(this.endpoint + '/' + body.id, body) : this.api.post<any>(this.endpoint, body);
    call.subscribe({
      next: (saved) => this.afterSave(saved),
      error: (e) => { this.saving = false; this.error = errMsg(e); },
    });
  }

  private afterSave(saved: any) {
    const done = () => { this.saving = false; this.editing = null; this.load(); this.changed.emit(); };
    const fail = (e: any) => { this.saving = false; this.error = 'Élément enregistré, mais la photo a échoué : ' + errMsg(e); this.load(); };
    if (this.pendingFile && saved?.id) {
      this.api.upload<any>(this.endpoint + '/' + saved.id + '/image', this.pendingFile, 'photo.jpg').subscribe({ next: done, error: fail });
    } else if (this.removeFlag && saved?.id) {
      this.api.del<any>(this.endpoint + '/' + saved.id + '/image').subscribe({ next: done, error: fail });
    } else {
      done();
    }
  }

  remove(it: any) {
    if (!confirm('Supprimer cet élément ?')) return;
    this.error = '';
    this.api.del<void>(this.endpoint + '/' + it.id).subscribe({
      next: () => { this.load(); this.changed.emit(); },
      error: (e) => (this.error = errMsg(e)),
    });
  }

  cell(it: any, c: Column): string {
    const v = c.key.split('.').reduce((acc: any, k) => (acc == null ? acc : acc[k]), it);
    if (c.type === 'money') return money(v);
    if (c.type === 'bool') return v ? 'Oui' : 'Non';
    return v == null ? '' : String(v);
  }
}
