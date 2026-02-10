/**
 * CONFIGURATION DU GÉNÉRATEUR DE SIGNATURE
 * 
 * Ce fichier contient toutes les variables ajustables pour le déploiement.
 */

// 1. LISTE DES ADMINISTRATEURS
// Géré dynamiquement via les Propriétés du Script (Fichier > Propriétés du projet > Propriétés du script)
// Clé: 'ADMIN_EMAILS', Valeur: 'email1,email2'
// Si vide, le premier utilisateur à lancer l'app devient admin (fallback).

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
