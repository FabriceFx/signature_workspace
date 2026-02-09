/**
 * CONFIGURATION
 */
const DB_SPREADSHEET_ID = '1r93OsYwcfo69Xz34Kxo2E5ioJi1-zOK-Psxg1g439H8';


/**
 * LOGO PAR DÉFAUT (OBLIGATOIRE)
 * Si logoURL est vide dans la feuille, on utilise celui-ci.
 */
const DEFAULT_LOGO_URL =
  'https://storage.googleapis.com/signature_email_cooperl/1.%20Cooperl%20-%20fonctions%20transversales%2Binternational.png';


/**
 * LISTE DES ADMINS
 * Seuls ces emails verront le panneau de création de modèles.
 */
const ADMIN_EMAILS = [
  'admin-workspace-ff@cooperl.com',
  'admin.si@cooperl.com'
];


// ------------------------------------------------------------------


function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.isAdmin = isUserAdmin();
  template.defaultLogoUrl = DEFAULT_LOGO_URL; // utile côté client si besoin
  return template.evaluate()
    .setTitle('Générateur de signature')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}


/**
 * Vérifie si l'utilisateur connecté est dans la liste des admins
 */
function isUserAdmin() {
  const userEmail = Session.getActiveUser().getEmail();
  return ADMIN_EMAILS.includes(userEmail);
}


/**
 * Normalise une URL logo (obligatoire)
 * Gère le cas des '+' dans les URLs Google Storage
 */
function normalizeLogoUrl_(logoUrl) {
  let v = String(logoUrl || '').trim();
  if (!v) return DEFAULT_LOGO_URL;


  // Si quelqu'un colle un '+' dans le path, on le sécurise en %2B
  if (v.includes('storage.googleapis.com') && v.includes('+') && !v.includes('%2B')) {
    v = v.replaceAll('+', '%2B');
  }
  return v;
}


/**
 * Récupère les données de l'utilisateur via Admin Directory API
 */
function getUserProfile() {
  const userEmail = Session.getActiveUser().getEmail();


  try {
    const user = AdminDirectory.Users.get(userEmail, {
      viewType: 'domain_public'
    });


    const org = user.organizations ? user.organizations[0] : {};
    const address = user.addresses ? user.addresses[0] : {};
    const phones = user.phones || [];


    // Si on ne trouve pas, on renvoie un objet vide, on ne prend PAS le premier venu.
    const workPhone = phones.find(p => p.type === 'work') || {};
    const mobilePhone = phones.find(p => p.type === 'mobile') || {};


    return {
      firstName: user.name?.givenName || "",
      lastName: user.name?.familyName || "",
      title: org.title || "",
      department: org.department || "",


      // --- NOUVEAUX CHAMPS ---
      company: org.name || "Cooperl",
      costCenter: org.costCenter || "",
      // -----------------------


      address: address.formatted || "",
      phone: workPhone.value || "",
      mobile: mobilePhone.value || "",
      email: user.primaryEmail,


      // Fallback logo : on renvoie le logo par défaut
      logoUrl: DEFAULT_LOGO_URL
    };


  } catch (e) {
    throw new Error("Erreur profile : " + e.message);
  }
}


/**
 * Récupère les modèles depuis le Google Sheet
 * Colonnes: A: ID | B: Nom | C: HTML | D: LogoURL
 */
function getTemplates() {
  try {
    const sheet = SpreadsheetApp.openById(DB_SPREADSHEET_ID).getSheetByName('Modeles');
    if (!sheet) return [];


    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];


    return data.slice(1).map(row => ({
      id: row[0],
      name: row[1],
      html: row[2],
      logoUrl: normalizeLogoUrl_(row[3]) // ✅ Nettoyage + Fallback
    })).filter(t => t.id && t.name);


  } catch (e) {
    throw new Error("Erreur d'accès à la base de données (Sheet). Vérifiez l'ID.");
  }
}


/**
 * Sauvegarde ou Met à jour un modèle (ADMIN SEULEMENT)
 * Gère automatiquement l'ajout de la colonne LogoURL si elle manque
 */
function saveTemplate(id, name, html, logoUrl) {
  if (!isUserAdmin()) throw new Error("Accès refusé. Vous n'êtes pas administrateur.");


  const ss = SpreadsheetApp.openById(DB_SPREADSHEET_ID);
  let sheet = ss.getSheetByName('Modeles');


  // Création de l'onglet ou vérification des en-têtes
  if (!sheet) {
    sheet = ss.insertSheet('Modeles');
    sheet.appendRow(['ID', 'Nom', 'HTML', 'LogoURL']);
  } else {
    // Sécurise l'entête si l'onglet existait avant l'ajout de la colonne D
    const lastCol = Math.max(4, sheet.getLastColumn());
    const header = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    if (header[3] !== 'LogoURL') {
      sheet.getRange(1, 4).setValue('LogoURL');
    }
  }


  const safeName = String(name || '').trim();
  const safeHtml = String(html || '').trim();
  const safeLogoUrl = normalizeLogoUrl_(logoUrl);


  if (!safeName || !safeHtml) {
    throw new Error("Nom et HTML requis.");
  }


  const data = sheet.getDataRange().getValues();
  let rowIndex = -1;


  // Recherche si l'ID existe déjà pour mise à jour
  if (id) {
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(id)) {
        rowIndex = i + 1; // index sheet (1-based)
        break;
      }
    }
  }


  if (rowIndex > 0) {
    // Mise à jour: colonnes B:C:D
    sheet.getRange(rowIndex, 2, 1, 3).setValues([[safeName, safeHtml, safeLogoUrl]]);
    return "Modèle mis à jour avec succès.";
  } else {
    // Création
    let maxId = 0;
    if (data.length > 1) {
      const ids = data.slice(1).map(r => r[0]).filter(n => !isNaN(n));
      if (ids.length > 0) maxId = Math.max(...ids);
    }
    const newId = maxId + 1;
    sheet.appendRow([newId, safeName, safeHtml, safeLogoUrl]);
    return "Nouveau modèle créé (ID: " + newId + ")";
  }
}


/**
 * Supprime un modèle (ADMIN SEULEMENT)
 */
function deleteTemplate(id) {
  if (!isUserAdmin()) throw new Error("Accès refusé.");


  const sheet = SpreadsheetApp.openById(DB_SPREADSHEET_ID).getSheetByName('Modeles');
  const data = sheet.getDataRange().getValues();


  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return "Modèle supprimé.";
    }
  }
  throw new Error("ID introuvable.");
}


/**
 * Met à jour la signature Gmail de l'utilisateur connecté
 * -> applique sur TOUTES les identités "SendAs" (primary + alias)
 */
function updateSignature(htmlSignature) {
  const userEmail = Session.getActiveUser().getEmail();


  try {
    const safeHtml = String(htmlSignature || "").trim();
    if (!safeHtml) throw new Error("Signature vide : rien à appliquer.");


    // Récupère toutes les identités d’envoi (primary + alias)
    const list = Gmail.Users.Settings.SendAs.list('me');
    const sendAs = (list && list.sendAs) ? list.sendAs : [];


    if (sendAs.length === 0) {
      throw new Error("Aucune identité d'envoi trouvée.");
    }


    const payload = { signature: safeHtml };
    const updated = [];
    const failed = [];


    // Boucle sur chaque alias pour appliquer la signature
    sendAs.forEach(sa => {
      const addr = sa.sendAsEmail;
      try {
        Gmail.Users.Settings.SendAs.patch(payload, 'me', addr);
        updated.push(addr);
      } catch (e) {
        failed.push(`${addr} (${e.message})`);
      }
    });


    // Message de retour détaillé
    let msg = `✅ Signature appliquée avec succès.\n\n`;
    msg += `Comptes mis à jour (${updated.length}) :\n- ${updated.join("\n- ")}\n\n`;
    
    if (failed.length) {
      msg += `⚠️ Échecs (${failed.length}) :\n- ${failed.join("\n- ")}`;
    }


    return msg;


  } catch (e) {
    throw new Error("Impossible de mettre à jour Gmail : " + e.message);
  }
}
