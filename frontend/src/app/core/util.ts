import { localeTag } from './i18n.service';
import { environment } from '../../environments/environment';
import { OptionGroup, OrderStatus } from './models';

export function money(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  return n.toFixed(2).replace('.', ',') + ' €';
}

export function errMsg(e: any): string {
  return e?.error?.message || (e?.status === 0 ? 'Serveur injoignable. Vérifiez votre connexion.' : 'Une erreur est survenue.');
}

export function parseOptions(json?: string | null): OptionGroup[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export const ORDER_LABEL: Record<OrderStatus, string> = {
  NEW: 'Reçue', PREPARING: 'En préparation', READY: 'Prête', DELIVERING: 'En livraison', SERVED: 'Terminée', CANCELLED: 'Annulée',
};
export const MODE_LABEL: Record<string, string> = { PICKUP: 'Retrait', DELIVERY: 'Livraison' };

/** Date + heure lisibles d'un créneau ISO (« samedi 14 novembre, 15:00 »). */
export function slotLabel(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long' }) + ', ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function isoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

export function dateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function timeHm(t: string | undefined): string {
  return (t || '').substring(0, 5);
}

export function minutesAgo(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

/** Photo d'un produit : photo envoyée > lien externe > image par défaut. */
export function productImg(p: { id: number; hasImage?: boolean | null; imageVersion?: number | null; imageUrl?: string | null }): string {
  if (p.hasImage) return environment.apiUrl + '/public/products/' + p.id + '/image?v=' + (p.imageVersion || 0);
  return p.imageUrl || DEFAULT_PRODUCT_IMG;
}
export const DEFAULT_PRODUCT_IMG = 'assets/default-product.svg';
