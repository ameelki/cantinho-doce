export type Role = 'CUSTOMER' | 'KITCHEN' | 'ADMIN';
export type OrderMode = 'PICKUP' | 'DELIVERY';
export type OrderStatus = 'NEW' | 'PREPARING' | 'READY' | 'DELIVERING' | 'SERVED' | 'CANCELLED';

export interface User { id: number; name: string; email: string; phone?: string; role: Role; active: boolean; }
export interface Category { id: number; name: string; description?: string; icon?: string; position: number; active: boolean; i18nJson?: string | null; }
export interface OptionChoice { name: string; price: number; }
export interface OptionGroup { name: string; required: boolean; multi: boolean; choices: OptionChoice[]; }
export interface Product {
  id: number; name: string; description?: string; price: number; imageUrl?: string; category?: Category;
  available: boolean; active: boolean; position: number; prepMinutes?: number; hasImage?: boolean; imageVersion?: number; tags?: string; optionsJson?: string; i18nJson?: string | null;
}
export interface Menu { categories: Category[]; products: Product[]; }
export interface CartLine {
  key: string; productId: number; name: string; unitPrice: number; qty: number;
  choices: string[]; optionsText: string; note?: string;
}
export interface OrderItem { id: number; productId: number; name: string; unitPrice: number; quantity: number; optionsText?: string; note?: string; }
export interface Order {
  id: number; code: string; mode: OrderMode; status: OrderStatus; customerName: string;
  phone?: string; email?: string; scheduledAt?: string; address?: string; postalCode?: string; city?: string;
  note?: string; subtotal: number; deliveryFee: number; total: number; paid: boolean;
  createdAt: string; updatedAt: string; items: OrderItem[];
}
export interface DaySlots { date: string; times: string[]; }
export interface DeliveryQuote { allowed: boolean; fee: number; free: boolean; minOrder: number; message: string; }
