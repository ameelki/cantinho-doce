import { Component } from '@angular/core';
import { Column, CrudList, Field } from '../shared/crud-list';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CrudList],
  template: `
    <h1>Équipe et comptes</h1>
    <p class="muted">Le rôle « Cuisine » ouvre l'écran de préparation. Le rôle « Admin » donne accès à toute la configuration. Les clients ont le rôle « Client ».</p>
    <app-crud-list title="Comptes" endpoint="/admin/users" [fields]="fields" [columns]="cols" [defaults]="{ role: 'KITCHEN', active: true }" />
  `,
})
export class TeamPage {
  fields: Field[] = [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'email', label: 'Email', type: 'text', hint: 'Non modifiable après la création.' },
    { key: 'phone', label: 'Téléphone', type: 'text' },
    { key: 'role', label: 'Rôle', type: 'select', options: [
      { value: 'KITCHEN', label: 'Cuisine' }, { value: 'ADMIN', label: 'Admin' }, { value: 'CUSTOMER', label: 'Client' },
    ] },
    { key: 'password', label: 'Mot de passe', type: 'password', hint: '8 caractères minimum. Laissez vide pour ne pas le changer.' },
    { key: 'active', label: 'Compte actif', type: 'bool' },
  ];
  cols: Column[] = [
    { key: 'name', label: 'Nom' }, { key: 'email', label: 'Email' }, { key: 'role', label: 'Rôle' }, { key: 'active', label: 'Actif', type: 'bool' },
  ];
}
