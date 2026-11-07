import { Injectable, inject, signal } from '@angular/core';
import { Api } from './api.service';
import { currentLang } from './i18n.service';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private api = inject(Api);
  readonly s = signal<Record<string, string>>({});
  readonly loaded = signal(false);

  load() {
    this.api.get<Record<string, string>>('/public/settings').subscribe({
      next: (v) => { this.s.set(v); this.loaded.set(true); this.applyBrand(v); },
      error: () => this.loaded.set(true),
    });
  }

  str(k: string, fallback = ''): string {
    const l = currentLang();
    if (l !== 'fr') { const t = this.s()[k + '.' + l]; if (t && t.trim()) return t; }
    return this.s()[k] ?? fallback;
  }
  bool(k: string): boolean { return (this.s()[k] ?? '').toLowerCase() === 'true'; }
  num(k: string): number { const n = parseFloat((this.s()[k] ?? '').replace(',', '.')); return isNaN(n) ? 0 : n; }

  private applyBrand(v: Record<string, string>) { applyTheme(v); }
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Assombrit (factor < 1) ou éclaircit (factor > 1) une couleur #rrggbb. */
export function shade(hex: string, factor: number): string {
  const n = (i: number) => {
    const c = parseInt(hex.substring(i, i + 2), 16);
    const v = factor < 1 ? c * factor : c + (255 - c) * (factor - 1);
    return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  };
  return '#' + n(1) + n(3) + n(5);
}

/** Applique le thème (couleurs, polices, arrondis) en variables CSS et charge les polices Google choisies. */
export function applyTheme(v: Record<string, string>) {
  const root = document.documentElement.style;
  const pick = (k: string, fallback: string) => (HEX.test(v[k] || '') ? v[k] : fallback);
  const primary = pick('theme.primary', pick('brand.primary', '#1f4fa3'));
  root.setProperty('--copper', primary);
  root.setProperty('--copper-deep', shade(primary, 0.78));
  root.setProperty('--pistache', pick('theme.accent', '#f2b632'));
  root.setProperty('--paper', pick('theme.background', '#fff8e7'));
  root.setProperty('--card', pick('theme.surface', '#ffffff'));
  root.setProperty('--text', pick('theme.text', '#2b1d14'));
  root.setProperty('--ink', pick('theme.dark', pick('brand.dark', '#0f2556')));
  root.setProperty('--ink-2', shade(pick('theme.dark', '#0f2556'), 1.18));
  const r = parseInt(v['theme.radius'] || '', 10);
  if (!isNaN(r)) root.setProperty('--radius', Math.max(0, Math.min(32, r)) + 'px');
  const heading = (v['theme.headingFont'] || '').trim();
  const body = (v['theme.bodyFont'] || '').trim();
  if (heading) root.setProperty('--display', "'" + heading + "', Georgia, serif");
  if (body) root.setProperty('--body', "'" + body + "', system-ui, sans-serif");
  loadFonts([heading, body]);
  if (v['cafe.name']) document.title = v['cafe.name'];
}

function loadFonts(names: string[]) {
  const safe = names.filter((n) => /^[A-Za-z0-9 ]{2,40}$/.test(n));
  if (!safe.length) return;
  const id = 'theme-fonts';
  const family = [...new Set(safe)].map((n) => 'family=' + n.replace(/ /g, '+') + ':wght@400;500;600;700').join('&');
  const href = 'https://fonts.googleapis.com/css2?' + family + '&display=swap';
  let link = document.getElementById(id) as HTMLLinkElement | null;
  if (!link) { link = document.createElement('link'); link.id = id; link.rel = 'stylesheet'; document.head.appendChild(link); }
  if (link.href !== href) link.href = href;
}
