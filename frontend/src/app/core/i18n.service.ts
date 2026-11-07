import { Injectable } from '@angular/core';
import { DICT, PATTERNS } from './i18n.dict';

export type Lang = 'fr' | 'pt' | 'lb' | 'de';
export const LANGS: { code: Lang; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'lb', label: 'Lëtzebuergesch' },
  { code: 'de', label: 'Deutsch' },
];

const KEY = 'cantinho_lang';

export function currentLang(): Lang {
  try {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'pt' || q === 'lb' || q === 'de' || q === 'fr') { localStorage.setItem(KEY, q); return q; }
    const v = localStorage.getItem(KEY);
    if (v === 'pt' || v === 'lb' || v === 'de' || v === 'fr') return v;
    const nav = (navigator.language || 'fr').toLowerCase();
    if (nav.startsWith('pt')) return 'pt';
    if (nav.startsWith('lb')) return 'lb';
    if (nav.startsWith('de')) return 'de';
  } catch { /* stockage indisponible */ }
  return 'fr';
}

/** Balise BCP-47 pour Intl (dates écrites dans le code TypeScript). */
export const TAG_BY_LANG: Record<Lang, string> = { fr: 'fr-FR', pt: 'pt-PT', lb: 'lb-LU', de: 'de-LU' };
export const localeTag = (): string => TAG_BY_LANG[currentLang()];

/** Traduction de l'interface : le texte français exact sert de clé (voir i18n.dict.ts). */
@Injectable({ providedIn: 'root' })
export class I18n {
  lang: Lang = currentLang();
  private cache = new Map<string, any>();

  /** Change la langue puis recharge la page (dates et textes compris). */
  set(l: Lang): void {
    try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
    location.reload();
  }

  tr(text: string): string {
    if (this.lang === 'fr' || !text) return text;
    const lang = this.lang;
    const key = text.replace(/\s+/g, ' ').trim();
    const hit = DICT[lang][key];
    if (hit !== undefined) return hit;
    for (const [re, tpl] of PATTERNS[lang]) {
      const m = re.exec(key);
      if (m) return tpl.replace(/([$§])(\d)/g, (_f, kind: string, d: string) => (kind === '§' ? this.tr(m[+d] || '') : m[+d] || ''));
    }
    // Listes d'options : « Petit, Soja, Sirop caramel »
    if (key.includes(', ')) {
      const parts = key.split(', ');
      const out = parts.map((p) => DICT[lang][p] ?? p);
      if (out.some((p, i) => p !== parts[i])) return out.join(', ');
    }
    return key;
  }

  /** Nom ou description d'un produit / d'une catégorie dans la langue choisie (français par défaut). */
  field(item: { name?: string; description?: string; i18nJson?: string | null } | null | undefined, f: 'name' | 'description'): string {
    if (!item) return '';
    const base = (item[f] as string | undefined) ?? '';
    if (this.lang === 'fr' || !item.i18nJson) return base;
    let parsed = this.cache.get(item.i18nJson);
    if (parsed === undefined) {
      try { parsed = JSON.parse(item.i18nJson); } catch { parsed = null; }
      this.cache.set(item.i18nJson, parsed);
    }
    const v = parsed?.[this.lang]?.[f];
    return typeof v === 'string' && v.trim() ? v : base;
  }
}
