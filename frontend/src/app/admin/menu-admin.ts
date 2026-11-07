import { Component } from '@angular/core';
import { Column, CrudList, Field } from '../shared/crud-list';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CrudList],
  template: `
    <h1>Carte et produits</h1>
    <p class="muted">Les produits apparaissent sur le site dans l'ordre de leur position. Un produit « épuisé » reste visible mais ne peut plus être commandé.</p>
    <app-crud-list title="Catégories" endpoint="/admin/categories" [fields]="catFields" [columns]="catCols" [defaults]="{ active: true, position: 0, icon: '☕' }" />
    <div style="height:32px"></div>
    <app-crud-list title="Produits" endpoint="/admin/products" [fields]="prodFields" [columns]="prodCols" [defaults]="{ active: true, available: true, position: 0, price: 0 }" />
  `,
})
export class MenuAdminPage {
  catFields: Field[] = [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'icon', label: 'Icône (un emoji)', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
    { key: 'i18nJson', label: 'Traductions', type: 'i18n', hint: 'Le français reste la langue de base. Laissez vide pour afficher le français.' },
    { key: 'position', label: 'Position', type: 'number', hint: 'Plus petit = plus haut dans la carte.' },
    { key: 'active', label: 'Visible sur le site', type: 'bool' },
  ];
  catCols: Column[] = [
    { key: 'icon', label: '' }, { key: 'name', label: 'Nom' }, { key: 'position', label: 'Position' }, { key: 'active', label: 'Visible', type: 'bool' },
  ];
  prodFields: Field[] = [
    { key: 'name', label: 'Nom', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'price', label: 'Prix (€)', type: 'number' },
    { key: 'category', label: 'Catégorie', type: 'ref', refUrl: '/admin/categories' },
    { key: 'image', label: 'Photo', type: 'image', hint: 'JPG, PNG ou WebP, réduite automatiquement. Sans photo, une image par défaut s\'affiche.' },
    { key: 'i18nJson', label: 'Traductions (nom et description)', type: 'i18n', hint: 'Portugais, luxembourgeois, allemand. Le français reste la langue de base.' },
    { key: 'tags', label: 'Étiquettes', type: 'text', hint: 'Séparées par des virgules : vegan, sans gluten…' },
    { key: 'prepMinutes', label: 'Temps de préparation (min)', type: 'number' },
    { key: 'position', label: 'Position', type: 'number' },
    { key: 'available', label: 'Disponible (décochez si épuisé)', type: 'bool' },
    { key: 'active', label: 'Visible sur le site', type: 'bool' },
    { key: 'optionsJson', label: 'Options (taille, lait, cuisson…)', type: 'options', hint: 'Chaque groupe propose des choix, avec un supplément de prix éventuel.' },
  ];
  prodCols: Column[] = [
    { key: 'photo', label: 'Photo', type: 'image' }, { key: 'name', label: 'Produit' }, { key: 'category.name', label: 'Catégorie' }, { key: 'price', label: 'Prix', type: 'money' },
    { key: 'available', label: 'Disponible', type: 'bool' }, { key: 'active', label: 'Visible', type: 'bool' },
  ];
}
