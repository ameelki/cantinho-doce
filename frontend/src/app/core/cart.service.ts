import { Injectable, computed, signal } from '@angular/core';
import { CartLine } from './models';

@Injectable({ providedIn: 'root' })
export class CartService {
  readonly lines = signal<CartLine[]>(this.read());
  readonly open = signal(false);
  readonly count = computed(() => this.lines().reduce((n, l) => n + l.qty, 0));
  readonly total = computed(() => this.lines().reduce((n, l) => n + l.qty * l.unitPrice, 0));

  private read(): CartLine[] {
    try { const v = JSON.parse(localStorage.getItem('cantinho_cart') || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  }

  private save() {
    try { localStorage.setItem('cantinho_cart', JSON.stringify(this.lines())); } catch { /* ignore */ }
  }

  add(line: Omit<CartLine, 'key'>) {
    const key = line.productId + '#' + [...line.choices].sort().join('+') + '#' + (line.note || '');
    const list = [...this.lines()];
    const i = list.findIndex((l) => l.key === key);
    if (i >= 0) list[i] = { ...list[i], qty: list[i].qty + line.qty };
    else list.push({ ...line, key });
    this.lines.set(list);
    this.save();
  }

  setQty(key: string, qty: number) {
    const list = this.lines().map((l) => (l.key === key ? { ...l, qty } : l)).filter((l) => l.qty > 0);
    this.lines.set(list);
    this.save();
  }

  clear() { this.lines.set([]); this.save(); }
}
