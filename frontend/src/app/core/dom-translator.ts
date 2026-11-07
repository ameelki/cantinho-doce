import { I18n } from './i18n.service';

const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'TITLE']);

/**
 * Traduit l'interface à la volée : remplace chaque texte français (et placeholder / title / aria-label)
 * par sa traduction, y compris pour les éléments ajoutés plus tard par Angular.
 * Ne fait rien en français.
 */
export function startDomTranslation(i18n: I18n): void {
  document.documentElement.lang = ({ lb: 'lb', pt: 'pt-PT', de: 'de-LU', fr: 'fr' } as Record<string, string>)[i18n.lang];
  if (i18n.lang === 'fr') return;
  // Diagnostic : ?notr=1 désactive la traduction automatique du texte (le reste de la langue reste actif).
  if (new URLSearchParams(location.search).get('notr') === '1') return;

  // confirm() : messages traduits aussi
  const nativeConfirm = window.confirm.bind(window);
  window.confirm = (message?: string) => nativeConfirm(i18n.tr(message ?? ''));

  const shownText = new WeakMap<Node, string>();
  const shownAttr = new WeakMap<Element, Record<string, string>>();
  // Garde-fou : un même nœud n'est jamais retraduit plus de 6 fois (évite toute boucle avec Angular).
  const touches = new WeakMap<object, number>();
  const allowed = (o: object): boolean => {
    const n = (touches.get(o) ?? 0) + 1;
    touches.set(o, n);
    return n <= 6;
  };

  let observer: MutationObserver;
  const pending = new Set<Node>();
  let scheduled = false;

  const translateText = (n: Node): void => {
    const parent = n.parentElement;
    if (!parent || SKIP.has(parent.tagName)) return;
    const t = n.nodeValue ?? '';
    if (shownText.get(n) === t) return;
    const trimmed = t.trim();
    if (!trimmed) return;
    const out = i18n.tr(trimmed);
    if (out !== trimmed.replace(/\s+/g, ' ') && allowed(n)) {
      const nv = t.replace(trimmed, () => out);
      shownText.set(n, nv);
      n.nodeValue = nv;
    }
  };

  const translateAttrs = (el: Element): void => {
    for (const a of ATTRS) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const seen = shownAttr.get(el) ?? {};
      if (seen[a] === v) continue;
      const out = i18n.tr(v);
      if (out !== v && allowed(el)) {
        seen[a] = out;
        shownAttr.set(el, seen);
        el.setAttribute(a, out);
      }
    }
  };

  const walk = (root: Node): void => {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const el = root as Element;
    if (SKIP.has(el.tagName)) return;
    translateAttrs(el);
    el.childNodes.forEach(walk);
  };

  const opts: MutationObserverInit = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS };

  // Les modifications sont regroupées et traitées hors observation : nos propres écritures ne relancent rien.
  const flush = (): void => {
    scheduled = false;
    const nodes = Array.from(pending);
    pending.clear();
    observer.disconnect();
    try {
      for (const n of nodes) if (n.isConnected) walk(n);
    } finally {
      observer.observe(document.body, opts);
    }
  };

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') m.addedNodes.forEach((n) => pending.add(n));
      else pending.add(m.target);
    }
    if (!scheduled && pending.size) { scheduled = true; setTimeout(flush, 30); }
  });
  observer.observe(document.body, opts);

  walk(document.body);
}
