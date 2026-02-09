# Générateur de Signature Email (Google Workspace)

Une application web hébergée sur Apps Script pour permettre aux utilisateurs de votre domaine de générer et d'appliquer automatiquement leur signature Gmail uniformisée.

## Fonctionnalités

*   **Interface Moderne** : Basée sur Material Design.
*   **Données Automatiques** : Pré-remplissage via l'annuaire Google Workspace (Admin Directory).
*   **Modèles HTML** : Création et modification de modèles de signature via une interface administrateur.
*   **Application Directe** : Mise à jour de la signature Gmail (compte principal et alias supportés*) en un clic.
*   **Stockage JSON** : Les modèles sont sauvegardés dans un fichier `signatures_db.json` sur le Google Drive du compte propriétaire.

## Pré-requis

*   Un compte **Google Workspace**.
*   Accès à **Google Drive** et **Apps Script**.
*   Droits d'administration (pour lire l'annuaire) ou à défaut, les utilisateurs devront modifier leurs infos manuellement.

## Installation / Déploiement

1.  **Créer le projet** : Importez les fichiers (`code.gs`, `Config.gs`, `Index.html`, `JavaScript.html`, `Stylesheet.html`, `appsscript.json`) dans un nouveau projet Google Apps Script.
2.  **Configuration** :
    *   Ouvrez le fichier `Config.gs`.
    *   Modifiez `ADMIN_EMAILS` avec l'adresse email des administrateurs autorisés à éditer les modèles.
    *   (Optionnel) Changez `DEFAULT_LOGO_URL` ou `DB_FILENAME`.
3.  **Services Avancés** :
    *   Dans l'éditeur, cliquez sur le `+` à côté de "Services".
    *   Ajoutez **Admin SDK API** (Directory).
    *   Ajoutez **Gmail API**.
4.  **Permissions Alias (Manifeste)** :
    *   Le fichier `appsscript.json` est déjà configuré. Assurez-vous qu'il contient bien `"https://www.googleapis.com/auth/gmail.settings.sharing"`.
5.  **Déploiement** :
    *   Cliquez sur **Déployer > Nouveau déploiement**.
    *   Type : **Application Web**.
    *   Exécuter en tant que : **Moi** (le propriétaire du script).
    *   Accès : **Au sein de [Votre Domaine]**.
    *   Copiez l'URL de l'application web.

## Utilisation

1.  **Premier Lancement** :
    *   L'administrateur lance l'application. Un fichier `signatures_db.json` vide est créé automatiquement dans son Drive.
    *   Dans le panneau de gauche, cliquez sur le bouton `+` (visible uniquement par les admins) pour créer un premier modèle.
2.  **Utilisateurs** :
    *   Ils accèdent à l'URL.
    *   Leurs informations sont pré-remplies.
    *   Ils cliquent sur le bouton flottant "Enregistrer" pour appliquer la signature.

## Limitations

*   **Alias Gmail** : En raison des restrictions de sécurité Google, le script ne peut mettre à jour que la signature de l'adresse principale et des alias "simples". Les alias liés à des comptes de service ou des groupes peuvent échouer (un message d'avertissement sera affiché).
