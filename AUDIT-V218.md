# Audit V218 — 6 octobre 2026

Base de travail : `Stat_ChaldeaTEST/main` V217 (`08ebc0a`). La proposition pour `Stat_Chaldea` reprend cette interface et conserve ses snapshots cloud, sa configuration et ses workflows de synchronisation.

## Corrections réalisées

- **Lecture Supabase** : pagination ordonnée des statistiques et des dépenses. Les 1 000 premières lignes ne suffisent pas aux trois comptes : le snapshot TEST contient 1 253 lignes. Une lecture complète réussie remplace les statistiques cloud et prend en compte les suppressions. Une lecture incomplète ou en erreur conserve les données précédentes.
- **Sauvegarde Servant** : cible joueur capturée, droits vérifiés avant modification, validation des nombres, prévention des doubles sauvegardes, restauration locale en cas d'échec et protection contre les lectures périodiques concurrentes.
- **Fiches Atlas** : conservation des champs saisis et du groupe de galerie lors du chargement. Fermer/changer de joueur/ouvrir une autre fenêtre invalide les callbacks tardifs. Les types NP et les sprites se chargent indépendamment.
- **GSSR** : brouillons isolés par joueur et événement, réponse de sauvegarde attachée au joueur initial, résultat cloud tardif pris en compte, conservation d'un résultat lorsqu'on reclique sur le même pavillon, et saisie libre Destiny préservant les cases cochées.
- **Identité des Servants** : IDs pour les choix Destiny et leurs résultats. Plusieurs SSR partagent un nom (Altria Caster, Leonardo da Vinci, James Moriarty). Pour les miniatures GSSR, la rareté et la classe du pavillon permettent de résoudre les variantes ; un nom encore ambigu affiche ses initiales au lieu de deviner.
- **Destiny historique** : Alter Ego appartient à Extra II. Les choix historiques sont limités aux collections 350 / 384 / 416 pour les anniversaires 2024 / 2025 / 2026 ; Archetype: EARTH, Aesc et Space Ereshkigal sont exclus de leur propre événement. La liste 2026 comprend bien 162 SSR dans le snapshot actuel.
- **Comptages** : Mash exclue des totaux, comparaison rafraîchie après modification, noms futurs normalisés de façon cohérente.
- **XP** : niveaux entiers, sauvegarde différée attachée au joueur initial, écritures ordonnées, protection de l'inventaire modifié contre une lecture tardive, totaux de lignes et de colonnes recalculés et bonus appliqué à la classe sélectionnée.
- **Dépenses** : accès de navigation lié à la session Julien, rejet d'un montant vide/invalide, protection des résultats tardifs après déconnexion, décodage des anciennes lignes dont `characters=[]`, date locale pour la saisie.
- **Session** : fenêtre utilisable pour un compte non associé, échappement des champs venant du compte, nettoyage des données privées à la déconnexion/changement d'identité. L'attribution des Masters passe par l'administrateur Supabase.
- **Interface** : colonnes de fiche remises à une seule colonne sur mobile, profils NP pouvant utiliser davantage de largeur sur desktop, ATK/HP explicitement calculées depuis le niveau et les Fou, versions de cache HTML/CSS/JS cohérentes.
- **Synchronisation** : une seule lecture XP par génération, pagination ordonnée, exclusion 152 cohérente, élimination des doublons de collection et des IDs non positifs, absence de commits uniquement dus aux timestamps, retrait des images d'un Friend ID effacé. Les deux workflows de production partagent une file d'attente et réessaient les pushes concurrents.

## Validation

`node --test tests/*.test.cjs` : **28 tests réussis**, avec des services simulés et aucune écriture vers Supabase. Les 11 premiers cas échouaient sur la version TEST initiale. Syntaxe JavaScript vérifiée pour l'application, la configuration et les deux scripts de synchronisation.

Le workflow `.github/workflows/checks.yml` rejoue ces vérifications pour chaque pull request.

**Limites vérifiées** : aucun navigateur local n'était disponible et son téléchargement n'a pas abouti. Le rendu visuel mobile et les interactions DOM réelles ne sont donc pas validés dans cet environnement. Les connexions réelles, les policies déployées, les tables privées et les sauvegardes Supabase n'ont pas été testées avec des identifiants utilisateur. Les accès Atlas/Fandom/Rayshift restent dépendants de leurs services.

## Étape nécessaire pour Supabase

Pour une base existante, exécuter `supabase-audit-v218-migration.sql` dans le SQL Editor, après lecture. Ce script ajoute les colonnes de dépenses manquantes, les droits des séquences, la table/policies GSSR et révoque l'auto-attribution de Julien. Il ne supprime aucune donnée. Pour une nouvelle base, utiliser `supabase.sql`.

**La migration n'a pas été exécutée par cet audit** : aucun accès administrateur Supabase n'est disponible. Une modification du JavaScript ne peut pas réparer à elle seule une policy RLS déjà déployée.

## Lacunes de contenu encore présentes

Les compositions intégrées de plusieurs pavillons GSSR sont incomplètes. Les événements Nouvel An 2025 et 2026 ne contiennent aucun Servant dans leurs pavillons, et certaines autres listes sont partielles. La saisie libre existante reste disponible pour les pavillons vides. L'ajout automatique des futurs événements n'existe pas : le fichier JSON doit être enrichi à partir des annonces officielles. L'audit ne présente pas ces listes partielles comme validées exhaustivement.

Le catalogue contient encore des exclusions manuelles et des enregistrements futurs possibles : le filtrage complet par date réelle de disponibilité NA mériterait une source de dates dédiée. Les estimations historiques de servant coins et les conventions ATK/HP (Fou standard supposé à +1 000) restent les conventions existantes du projet ; elles ne constituent pas des mesures du compte.

Sources Destiny officielles :
- https://webview.fate-go.us/webview/summon/20240707_7th_destiny_0UraUDZ_header.html
- https://webview.fate-go.us/webview/summon/20250706_8th_anniversary_FhfskU_header.html
- https://webview.fate-go.us/webview/summon/20260705_9th_destiny_HhDJG_header.html
- https://news.fate-go.jp/2024/9th_destiny/
