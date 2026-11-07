import { Component } from '@angular/core';
import { SettingField, SettingsForm } from '../shared/settings-form';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [SettingsForm],
  template: `
    <h1>Réglages</h1>
    <app-settings-form title="La boutique" [fields]="identity" />
    <app-settings-form title="Textes traduits (laisser vide = français)" [fields]="translated" />
  `,
})
export class SettingsPage {
  identity: SettingField[] = [
    { key: 'cafe.name', label: 'Nom de la boutique', type: 'text' },
    { key: 'cafe.tagline', label: 'Slogan', type: 'text' },
    { key: 'cafe.about', label: 'Texte de présentation (page d\'accueil)', type: 'textarea' },
    { key: 'cafe.address', label: 'Adresse', type: 'text' },
    { key: 'cafe.phone', label: 'Téléphone', type: 'text' },
    { key: 'cafe.email', label: 'Email de contact', type: 'text' },
    { key: 'cafe.hours', label: 'Texte des horaires (affiché sur le site)', type: 'text' },
  ];
  translated: SettingField[] = [
    ...[['pt', 'Português'], ['lb', 'Lëtzebuergesch'], ['de', 'Deutsch']].flatMap(([l, n]) => [
      { key: 'cafe.tagline.' + l, label: 'Slogan (' + n + ')', type: 'text' as const },
      { key: 'cafe.about.' + l, label: 'Présentation (' + n + ')', type: 'textarea' as const },
      { key: 'cafe.hours.' + l, label: 'Horaires (' + n + ')', type: 'text' as const },
      { key: 'theme.heroTitle.' + l, label: 'Accueil : titre (' + n + ')', type: 'text' as const },
      { key: 'theme.heroSubtitle.' + l, label: 'Accueil : sous-titre (' + n + ')', type: 'text' as const },
      { key: 'delivery.info.' + l, label: 'Texte livraison (' + n + ')', type: 'textarea' as const },
      { key: 'orders.pickup.address.' + l, label: 'Texte retrait (' + n + ')', type: 'textarea' as const },
      { key: 'orders.message.' + l, label: 'Message sur la carte (' + n + ')', type: 'text' as const },
    ]),
  ];
}
