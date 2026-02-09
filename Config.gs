/**
 * CONFIGURATION DU GÉNÉRATEUR DE SIGNATURE
 * 
 * Ce fichier contient toutes les variables ajustables pour le déploiement.
 */

// 1. LISTE DES ADMINISTRATEURS
// Seuls ces emails auront accès aux fonctions de création/modification de modèles.
const ADMIN_EMAILS = [
  'admin@example.com', // À REMPLACER PAR L'EMAIL DE L'ADMINISTRATEUR
  'fabrice@atelier-informatique.com' // Gardé pour vos tests, à retirer avant livraison finale si besoin
];

// 2. LOGO PAR DÉFAUT
// Utilisé si l'utilisateur n'a pas de logo spécifique défini dans le modèle ou son profil.
const DEFAULT_LOGO_URL = 'https://atelier-informatique.com/MonLogo.png';

// 3. BASE DE DONNÉES
// Nom du fichier JSON stocké dans le Drive de l'utilisateur qui déploie le script.
const DB_FILENAME = 'signatures_db.json';

// 4. VALEURS PAR DÉFAUT (FALLBACK)
// Ces valeurs sont utilisées si l'annuaire Google Workspace ne renvoie pas d'information.
const DEFAULT_COMPANY = ""; // Ex: "Ma Société"
const DEFAULT_ADDRESS = ""; // Ex: "123 Rue de la Paix, 22800 Quintin"
