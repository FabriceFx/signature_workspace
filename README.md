# Signature Workspace Generator

![License MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Platform](https://img.shields.io/badge/Platform-Google%20Apps%20Script-green)
![Runtime](https://img.shields.io/badge/Google%20Apps%20Script-V8-green)
![Author](https://img.shields.io/badge/Auteur-Fabrice%20Faucheux-orange)

## Description
**Signature Workspace Generator** est une solution d'entreprise conçue pour centraliser et automatiser la gestion des signatures Gmail au sein d'une organisation Google Workspace. Cette application permet aux collaborateurs de générer une signature professionnelle harmonisée en un clic, tout en offrant aux administrateurs un contrôle total sur les modèles graphiques.

## Auteur
**Fabrice Faucheux**

## Fonctionnalités Clés
* **Synchronisation en Temps Réel** : Récupère automatiquement les informations de l'utilisateur (nom, fonction, service, téléphone) via l'API Admin Directory.
* **Éditeur de Modèles (Admin)** : Interface dédiée aux administrateurs pour créer, modifier ou dupliquer des modèles de signature en HTML avec un aperçu dynamique.
* **Gestion des Logos Spécifiques** : Possibilité d'assigner un logo particulier par modèle ou d'utiliser un logo par défaut sécurisé (gestion des caractères spéciaux pour Google Cloud Storage).
* **Multi-Identités (SendAs)** : La signature est appliquée automatiquement à l'adresse principale ainsi qu'à tous les alias de messagerie configurés pour l'utilisateur.
* **Aperçu Interactif** : Les utilisateurs peuvent prévisualiser leur signature avec leurs propres données avant de l'appliquer à leur compte Gmail.

## Installation Manuelle

### 1. Préparation du Google Sheet
1.  Créez un nouveau Google Sheet.
2.  Récupérez l'**ID du classeur** dans l'URL.
3.  Nommez une feuille `Modeles` et préparez les en-têtes suivants en ligne 1 : `ID`, `Nom`, `HTML`, `LogoURL`.

### 2. Configuration du Script
1.  Ouvrez [script.google.com](https://script.google.com) et créez un nouveau projet "Signature Generator".
2.  Copiez le contenu du fichier `code.gs` dans l'éditeur de script.
3.  Mettez à jour la constante `DB_SPREADSHEET_ID` avec l'ID de votre Google Sheet.
4.  Ajoutez vos emails administrateurs dans la constante `ADMIN_EMAILS`.
5.  Créez un fichier HTML nommé `Index.html` et collez-y le code de l'interface.

### 3. Activation des Services Avancés
Pour fonctionner, le projet nécessite l'activation des services suivants dans les paramètres du projet Google Apps Script :
* **Admin Directory API** (pour la lecture des profils utilisateurs).
* **Gmail API** (pour la mise à jour des paramètres de signature).

### 4. Déploiement
1.  Cliquez sur **Déployer** > **Nouveau déploiement**.
2.  Type de déploiement : **Application Web**.
3.  Exécuter en tant que : **L'utilisateur accédant à l'application web**.
4.  Qui a accès : **Tous les membres de votre domaine**.

---
*Ce projet est sous licence MIT.*
