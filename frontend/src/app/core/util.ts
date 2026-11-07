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
