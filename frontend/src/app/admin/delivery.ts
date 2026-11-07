import { Component } from '@angular/core';
import { SettingField, SettingsForm } from '../shared/settings-form';

@Component({
  selector: 'app-delivery',
  standalone: true,
  imports: [SettingsForm],
  template: `
    <h1>Livraison et créneaux</h1>
    <app-settings-form title="Retrait et livraison" [fields]="modes" />
    <app-settings-form title="Jours et heures proposés aux clients" [fields]="slots" />
    <app-settings-form title="Frais de livraison" [fields]="fees" />
  `,
})
export class DeliveryPage {
  modes: SettingField[] = [
    { key: 'orders.enabled', label: 'Commandes ouvertes', type: 'bool' },
    { key: 'orders.pickup.enabled', label: 'Retrait sur place', type: 'bool' },
    { key: 'orders.pickup.address', label: 'Texte du retrait (adresse, consignes)', type: 'textarea' },
    { key: 'orders.delivery.enabled', label: 'Livraison à domicile', type: 'bool' },
    { key: 'orders.message', label: 'Message affiché sur la carte', type: 'text', hint: 'Exemple : commandes fermées du 1er au 10 août.' },
  ];
  slots: SettingField[] = [
    { key: 'schedule.openFrom', label: 'Premier créneau de la journée', type: 'time' },
    { key: 'schedule.openTo', label: 'Dernier créneau de la journée', type: 'time' },
    { key: 'schedule.slotMinutes', label: 'Durée d\'un créneau (minutes)', type: 'number', hint: '60 = un créneau par heure, 30 = toutes les demi-heures.' },
    { key: 'schedule.leadHours', label: 'Délai minimum avant retrait/livraison (heures)', type: 'number', hint: '24 = commande la veille au plus tard.' },
    { key: 'schedule.maxDays', label: 'Jours ouverts à la réservation à l\'avance', type: 'number' },
    { key: 'schedule.closedWeekdays', label: 'Jours fermés', type: 'text', hint: '1 = lundi … 7 = dimanche. Exemple : 1,7 pour fermer lundi et dimanche.' },
    { key: 'schedule.maxPerSlot', label: 'Commandes maximum par créneau', type: 'number', hint: '0 = illimité.' },
  ];
  fees: SettingField[] = [
    { key: 'delivery.fee', label: 'Frais de livraison par défaut (€)', type: 'number' },
    { key: 'delivery.freeFrom', label: 'Livraison offerte dès (€)', type: 'number', hint: '0 = jamais offerte.' },
    { key: 'delivery.minOrder', label: 'Commande minimum pour la livraison (€)', type: 'number' },
    { key: 'delivery.zones', label: 'Frais par ville', type: 'textarea', hint: 'Une ligne par ville : Strassen:3.50. Les autres villes paient les frais par défaut.' },
    { key: 'delivery.onlyZones', label: 'Livrer uniquement les villes listées ci-dessus', type: 'bool' },
    { key: 'delivery.info', label: 'Texte affiché au client', type: 'textarea' },
  ];
}
