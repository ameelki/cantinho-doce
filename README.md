# Cantinho Doce

Plateforme de vente à domicile de desserts et douceurs (pâtisseries portugaises, gâteaux sur mesure, coffrets, salé).
Le client compose sa commande, choisit **retrait ou livraison**, le **jour et l'heure**, et suit sa commande en direct.
Tout se règle depuis l'espace admin : carte, photos, créneaux, frais de livraison, thème (couleurs, polices, arrondis).

## Stack

- **Backend** : Java 21, Spring Boot 3.3, JPA/Hibernate, JWT, PostgreSQL
- **Frontend** : Angular 18 (composants autonomes, signaux), interface en FR / PT / LB / DE
- **Base de données** : toutes les tables sont préfixées `cantinho_doce_` (la même base Neon peut héberger plusieurs projets)

## Fonctionnalités

- Carte par catégories, options (taille, parfum, décoration) avec supplément de prix, photos, disponibilité
- Commande en **retrait** ou en **livraison** (adresse, ville, code postal)
- **Jour et heure au choix** parmi les créneaux ouverts (horaires, durée du créneau, délai minimum, jours fermés, capacité par créneau)
- **Frais de livraison configurables** : montant par défaut, frais par ville, livraison offerte dès X €, commande minimum
- Suivi client par code (Reçue → En préparation → Prête → En livraison → Terminée)
- Atelier (écran de préparation) et gestion des commandes, paiement à la remise, statistiques
- Thème modifiable en ligne : 5 ambiances + couleurs, polices, arrondi, texte d'accueil

## Démarrage local

```bash
docker compose up -d                # PostgreSQL
cd backend && mvn spring-boot:run   # API sur :8080
cd frontend && npm install && npm start   # site sur :4200
```

Comptes créés au premier démarrage (à changer) : `admin@cantinho.lu` et `cuisine@cantinho.lu`, mot de passe `changeme123`
(variables `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KITCHEN_EMAIL`, `KITCHEN_PASSWORD`).

## Déploiement gratuit (Neon + Render + Netlify)

1. **Neon** : créez un projet PostgreSQL, copiez l'hôte, la base, l'utilisateur et le mot de passe.
2. **Render** : New → Blueprint (ou Web Service, Docker, dossier `backend`) sur ce dépôt. Variables :
   `DB_URL` = `jdbc:postgresql://HOTE/BASE?sslmode=require`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (32 caractères min.),
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `KITCHEN_EMAIL`, `KITCHEN_PASSWORD`, `SEED_DEMO=true` (carte de démonstration au premier démarrage).
3. **Netlify** : importez le dépôt (le `netlify.toml` fait le reste).
4. Mettez l'adresse du backend Render dans `frontend/src/assets/config.js` (`apiUrl`), enregistrez : Netlify redéploie.

Les sites `*.netlify.app` sont autorisés par défaut côté API ; pour un domaine perso, ajoutez `CORS_ORIGINS`.
Le plan gratuit de Render s'endort après ~15 min d'inactivité (premier chargement lent) : un moniteur gratuit type UptimeRobot sur `/actuator/health` le garde éveillé.

## Réglages principaux (admin)

| Page | Contenu |
|---|---|
| Carte et produits | catégories, produits, photos, options, traductions |
| Livraison et créneaux | retrait/livraison, horaires, délai, jours fermés, frais, zones |
| Thème et design | ambiances, couleurs, polices, arrondi, texte d'accueil |
| Réglages | nom, contact, textes traduits |
