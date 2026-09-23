# Chaldea Command

**Chaldea Command** est une application web de suivi de comptes **Fate/Grand Order (FGO) — serveur NA**.

Elle a été conçue pour permettre à plusieurs Masters de suivre leur propre collection de Servants, leur progression et leur stock d'EXP, tout en pouvant consulter les données des autres membres du groupe.

Le projet est hébergé sur **GitHub Pages** et utilise **Supabase** pour les données partagées. Les informations générales des Servants proviennent d'**Atlas Academy** et les Support Lists publiques sont récupérées depuis **Rayshift**.

---

## À quoi sert le site ?

Le but est de remplacer un suivi FGO sous forme de tableur par une interface beaucoup plus lisible et adaptée au jeu.

Chaque membre du groupe possède ses propres données :

- Servants possédés ou non ;
- niveau ;
- niveau de NP ;
- niveaux des trois Skills ;
- niveaux des Append Skills ;
- Bond ;
- Graals ;
- Fou HP / ATK ;
- servant coins ;
- inventaire de cartes d'EXP.

Les autres utilisateurs peuvent consulter ces données sans pouvoir les modifier.

---

# Les différents onglets

## Overview

L'Overview fournit une vue d'ensemble d'un compte.

Elle présente notamment :

- le nombre de Servants possédés ;
- le nombre de 5★, 4★ et Welfares possédés ;
- la distribution des niveaux de Skills ;
- la moyenne du Skill 1, du Skill 2 et du Skill 3 ;
- le nombre de Servants au niveau 100 et 120 ;
- le nombre de Servants Bond 10+ ;
- la progression de collection des 4★ / 5★ ;
- le pourcentage de Servants Gold ayant atteint NP 5.

La distribution des Skills peut être visualisée selon deux populations :

- **ALL** : tous les Servants suivis ;
- **GOLD** : 4★, 5★ et Welfares.

Les moyennes des trois Skills suivent le même filtre ALL/GOLD.

---

## Servants

Cet onglet constitue le catalogue principal.

Il permet de :

- rechercher un Servant ;
- filtrer par classe ;
- filtrer par rareté ;
- sélectionner plusieurs classes ou plusieurs raretés en même temps ;
- masquer ou afficher les Servants non possédés ;
- choisir l'ordre de tri ;
- inverser le tri entre ascendant et descendant ;
- choisir une vue en cartes ou en tableau.

Les tris disponibles comprennent notamment :

- ordre de sortie ;
- Bond ;
- NP ;
- niveau ;
- ATK ;
- HP.

### Les cartes de Servants

Les petites cartes affichent les informations principales du Servant :

- artwork ;
- classe ;
- rareté ;
- niveau ;
- Graals ;
- NP ;
- et, selon le tri sélectionné, la statistique correspondante mise en avant.

Un Servant non possédé est visuellement désaturé et identifié par un indicateur **NON POSSÉDÉ**.

### Fiche détaillée

Un clic sur un Servant ouvre une fiche plus complète avec :

- artworks des quatre ascensions ;
- classe et rareté ;
- niveau ;
- nombre de Graals ;
- ATK et HP actuelles ;
- investissement Fou ;
- niveau de NP ;
- trois Skills ;
- cinq Append Skills ;
- Bond sous forme de 15 losanges ;
- les cinq Command Cards.

Lorsqu'un utilisateur possède les droits d'édition sur le compte affiché, les zones modifiables deviennent éditables.

Le Bond peut être défini directement en cliquant sur les losanges.

Une action secondaire permet également de retirer un Servant de sa collection lorsqu'il a été ajouté par erreur.

---

## Compare

L'onglet Compare permet de comparer les comptes de **Julien**, **Yanis** et **Attmann**.

La comparaison porte notamment sur :

- collection 4★ / 5★ / Welfare ;
- moyenne Skill 1 ;
- moyenne Skill 2 ;
- moyenne Skill 3 ;
- pourcentage de NP 5 ;
- Bond 10+ ;
- niveau 120.

Le profil de progression est représenté par un radar avec une couleur dédiée à chaque Master :

- **Julien** : rouge ;
- **Yanis** : bleu ;
- **Attmann** : vert.

### Servant Showdown

Le module **Servant Showdown** permet de sélectionner un Servant et d'afficher côte à côte les données de chaque compte pour ce même personnage.

La sélection utilise une saisie assistée afin d'éviter les erreurs liées aux variantes de noms.

---

## Calcul XP

Le calculateur XP sert à déterminer combien d'EXP il faut pour faire monter un Servant d'un niveau à un autre.

On peut choisir :

- le niveau actuel ;
- le niveau souhaité ;
- la classe du Servant à entraîner.

La classe est sélectionnée via les logos des classes FGO.

Le calcul prend en compte le bonus d'EXP de classe pour les cartes correspondantes.

### Inventaire EXP

Un tableau permet de saisir les cartes d'EXP disponibles par classe et par rareté.

Les catégories principales sont :

- 5★ ;
- 4★ ;
- 3★ ;
- autres cartes / EXP sans bonus de classe.

Les quantités saisies déclenchent immédiatement le recalcul des valeurs affichées.

Les informations sont sauvegardées pour le compte sélectionné lorsque l'utilisateur dispose des droits d'édition.

---

## Support Lists

L'onglet **Support Lists** affiche les six Support Lists publiques du compte sélectionné sur le serveur NA :

### Normal

1. Normal 1
2. Normal 2
3. Normal 3

### Event

1. Event 1
2. Event 2
3. Event 3

Les listes sont affichées sous forme d'images générées par Rayshift, dans l'interface du site.

La page permet de basculer entre **Normal** et **Event**.

Chaque compte est identifié par son **Friend ID NA**.

---

# Origine des données

## Données des Servants : Atlas Academy

Atlas Academy fournit les données FGO utilisées par l'application pour le catalogue NA, notamment :

- nom ;
- classe ;
- rareté ;
- statistiques ;
- artworks ;
- Command Cards ;
- autres métadonnées utiles à l'affichage.

Le site travaille avec le catalogue **NA**, et non avec le catalogue JP.

Le catalogue est synchronisé automatiquement afin que les nouveaux Servants NA puissent apparaître sans devoir ajouter manuellement chaque personnage dans le code du site.

Des exceptions explicites existent pour certains identifiants internes qui ne doivent pas être affichés dans le catalogue du joueur.

---

## Welfares

Les Welfares sont définis dans :

```text
/data/welfare-ids.json
```

Cette liste est volontairement explicite.

Elle ne doit pas être déduite automatiquement du nom du Servant ou de sa rareté : plusieurs Servants peuvent partager le même nom tout en ayant un statut différent.

Exemple : deux variantes de **BB** peuvent avoir des statuts différents. C'est pourquoi le statut Welfare est associé à l'identifiant du Servant.

Lorsqu'un nouveau Welfare arrive sur NA, il faut ajouter son identifiant à ce fichier si le système automatique ne dispose pas d'une information suffisamment fiable pour le classer.

---

# Comptes et permissions

Le site distingue trois Masters :

- Julien ;
- Yanis ;
- Attmann.

La connexion est gérée par **Supabase Auth**.

Une personne connectée peut consulter les données de tous les comptes, mais elle ne peut modifier que les données du compte qui lui a été attribué.

Exemple :

```text
Julien connecté
├── consulter Julien   ✅
├── consulter Yanis    ✅
├── consulter Attmann  ✅
├── modifier Julien    ✅
├── modifier Yanis     ❌
└── modifier Attmann   ❌
```

Le compte affiché dans le site n'est pas automatiquement remplacé par le compte connecté : cela permet de rester sur le profil d'un ami en lecture seule lors d'une consultation.

---

# Sauvegarde des données

## Sauvegarde d'un Servant

Lorsqu'un éditeur modifie une fiche Servant et clique sur **Enregistrer**, la modification doit être envoyée directement à Supabase.

Les statistiques d'un Servant sont identifiées par le couple :

```text
player_key + servant_id
```

La sauvegarde utilise donc un **upsert** : enregistrer plusieurs fois le même Servant ne crée pas une nouvelle ligne à chaque fois, mais met à jour la ligne existante.

---

## Enregistrement global

Le bouton **Enregistrer toutes mes données** est une solution secondaire permettant de renvoyer en une fois les données du compte affiché vers Supabase.

Il n'est pas nécessaire pour une modification normale d'un Servant ou d'une case de l'inventaire XP : les modifications courantes sont sauvegardées individuellement.

---

# Supabase

Supabase sert de base de données distante pour les données personnalisées.

Les principales tables utilisées sont notamment :

```text
chaldea_members
chaldea_stats
chaldea_xp
chaldea_support_profiles
```

### `chaldea_members`

Associe un utilisateur Supabase Auth à son compte du site :

```text
julien
yanis
attmann
```

et définit ses droits d'édition.

### `chaldea_stats`

Contient les statistiques personnalisées des Servants par joueur.

### `chaldea_xp`

Contient l'inventaire de cartes d'EXP par joueur.

### `chaldea_support_profiles`

Contient les informations nécessaires pour relier un compte du site à son Friend ID Rayshift.

---

# Snapshot local

Le fichier :

```text
/data/initial-state.json
```

est un **snapshot local de secours**.

Il permet au site d'avoir une base de données initiale même si Supabase n'est pas disponible immédiatement.

Lorsque la version cloud est configurée, Supabase constitue la source principale pour les données personnalisées.

Le snapshot peut être régénéré automatiquement par GitHub Actions à partir des données cloud.

---

# Synchronisation automatique

Le dépôt contient deux workflows GitHub Actions principaux.

## `Sync cloud snapshot`

```text
.github/workflows/sync-initial-state.yml
```

Son rôle est de reconstruire :

```text
/data/initial-state.json
```

à partir des données Supabase et du catalogue NA.

Les secrets GitHub nécessaires sont :

```text
SUPABASE_URL
SUPABASE_SECRET_KEY
```

La clé secrète est utilisée uniquement par GitHub Actions et ne doit jamais être placée dans `config.js` ni dans le code du navigateur.

Le workflow peut être lancé automatiquement selon son calendrier ou manuellement depuis l'onglet **Actions** du dépôt.

---

## `Sync Rayshift support lists`

```text
.github/workflows/sync-support-lists.yml
```

Ce workflow récupère les Friend IDs des comptes, interroge les données publiques de Rayshift et met à jour :

```text
/data/support-lists.json
```

Les images des six listes sont ensuite construites à partir des URLs `deck-gen` de Rayshift.

Aucune clé secrète Rayshift n'est nécessaire pour l'accès aux informations publiques utilisées par le projet.

---

# Support Lists et Rayshift

Les images affichées dans l'application suivent le format Rayshift :

```text
https://rayshift.io/static/images/deck-gen/{region}/{friendId}/{guid}/{decksToStack}/{flags}.png
```

Pour le serveur NA :

```text
region = na
```

Les trois listes normales correspondent aux masques :

```text
1
2
4
```

et les trois listes événementielles :

```text
8
16
32
```

Le projet stocke notamment le GUID et les URLs des images dans :

```text
/data/support-lists.json
```

---

# Images locales

Les petites icônes de l'interface ne dépendent pas de Fandom.

Elles sont stockées dans le dossier :

```text
/IMG
```

avec notamment :

```text
IMG/saber.webp
IMG/archer.webp
IMG/lancer.webp
IMG/rider.webp
IMG/caster.webp
IMG/assassin.webp
IMG/berserker.webp
IMG/ruler.webp
IMG/avenger.webp
IMG/alter_ego.webp
IMG/moon_cancer.webp
IMG/foreigner.webp
IMG/pretender.webp
IMG/shielder.webp
IMG/beast.webp
IMG/graal.webp
IMG/np.webp
IMG/quick.webp
IMG/arts.webp
IMG/buster.webp
```

Cela évite que l'affichage des classes, du Graal, du NP ou des Command Cards dépende du chargement d'une image externe.

Les artworks des Servants peuvent, eux, provenir d'Atlas Academy.

---

# Structure principale du dépôt

```text
Stat_Chaldea/
│
├── index.html
├── app.js
├── styles.css
├── config.js
├── README.md
│
├── IMG/
│   ├── saber.webp
│   ├── archer.webp
│   ├── ...
│   ├── graal.webp
│   ├── np.webp
│   ├── quick.webp
│   ├── arts.webp
│   └── buster.webp
│
├── data/
│   ├── initial-state.json
│   ├── welfare-ids.json
│   └── support-lists.json
│
├── tools/
│   ├── sync-initial-state.mjs
│   └── sync-support-lists.mjs
│
├── .github/
│   └── workflows/
│       ├── sync-initial-state.yml
│       └── sync-support-lists.yml
│
└── supabase/
    └── functions/
        └── rayshift-proxy/
            └── index.ts
```

---

# Mise en ligne

Le site est une application statique et peut être publié avec **GitHub Pages**.

Une configuration typique est :

```text
GitHub Pages
    ↓
index.html
app.js
styles.css
    ↓
Supabase
    ↓
données personnalisées
```

Aucun serveur web classique n'est nécessaire pour l'interface elle-même.

---

# Configuration de Supabase

Le navigateur utilise uniquement :

- l'URL du projet Supabase ;
- la clé **publishable**.

Exemple :

```js
window.CHALDEA_CONFIG = {
  supabaseUrl: 'https://...supabase.co',
  supabasePublishableKey: 'sb_publishable_...',
  workspaceId: 'fgo-chaldea',
  rayshiftProxyUrl: '',
  enableRealtime: false
};
```

La clé secrète Supabase ne doit pas être placée ici.

Elle est réservée aux scripts GitHub Actions ou aux fonctions serveur.

---

# Ajouter un nouveau Master

Le projet est actuellement prévu pour trois comptes, mais son architecture repose sur une clé de joueur (`player_key`) et peut évoluer.

Pour ajouter un nouvel utilisateur, il faut notamment :

1. créer son compte dans Supabase Auth ;
2. l'associer à une ligne de `chaldea_members` ;
3. lui attribuer un `player_key` ;
4. éventuellement lui associer un Friend ID Rayshift ;
5. alimenter son snapshot initial si nécessaire.

---

# Ajouter un nouveau Servant

Il n'est normalement pas nécessaire de modifier manuellement le code pour chaque nouveau Servant NA.

Le catalogue du site se synchronise avec Atlas Academy NA.

Le processus attendu est :

```text
nouveau Servant disponible sur NA
        ↓
Atlas Academy met à jour son catalogue
        ↓
synchronisation du site
        ↓
le Servant apparaît dans le catalogue
        ↓
il est initialement non possédé pour chaque Master
```

Les exclusions spécifiques sont maintenues séparément dans la logique du projet afin d'éviter l'affichage de personnages techniques ou non destinés au roster jouable.

---

# Tests et vérifications

Avant de publier une version, les fichiers JavaScript peuvent être vérifiés avec :

```bash
node --check app.js
node --check tools/sync-initial-state.mjs
node --check tools/sync-support-lists.mjs
```

Les fichiers JSON peuvent être validés avec un parseur JSON standard.

---

# Limites actuelles

Certaines informations ne peuvent pas être déduites de manière parfaitement fiable à partir d'Atlas Academy seul.

Le principal exemple est le statut **Welfare**. Il est donc maintenu avec une liste explicite d'identifiants.

Les Support Lists dépendent également de la disponibilité des données publiques fournies par Rayshift.

Le site utilise principalement une logique de snapshot pour garantir qu'une ouverture de page reste possible même lorsqu'un service externe est momentanément indisponible.

---

# En résumé

**Chaldea Command** est donc un tableau de bord FGO NA partagé :

```text
                  ATLAS ACADEMY
                  catalogue NA
                       │
                       ▼
                 ┌─────────────┐
                 │   GitHub    │
                 │ Pages + UI  │
                 └──────┬──────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
      SUPABASE                    RAYSHIFT
      comptes + stats             supports publics
           │                         │
           └────────────┬────────────┘
                        ▼
                 CHALDEA COMMAND
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Julien         Yanis        Attmann
```

L'objectif est de conserver une **saisie simple des statistiques** tout en offrant une **interface complète de consultation, de comparaison et de suivi de progression** adaptée à FGO.
