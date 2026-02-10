// ------------------------------------------------------------------
// HELPERS STOCKAGE JSON (DRIVE)
// ------------------------------------------------------------------

/**
 * Récupère le fichier DB dans le Drive.
 * S'il n'existe pas, il est créé avec un tableau vide [].
 */
/**
 * Récupère le fichier DB dans le Drive.
 * Utilise un CACHE (ScriptProperties) pour éviter de chercher le fichier à chaque fois.
 */
function getDbFile_() {
  const props = PropertiesService.getScriptProperties();
  const cachedId = props.getProperty('DB_FILE_ID');

  if (cachedId) {
    try {
      const file = DriveApp.getFileById(cachedId);
      Logger.log("Using cached DB file ID: " + cachedId);
      return file;
    } catch (e) {
      Logger.log("Cached ID invalid, searching again...");
      props.deleteProperty('DB_FILE_ID');
    }
  }

  Logger.log("Searching for DB file: " + DB_FILENAME);
  const files = DriveApp.getFilesByName(DB_FILENAME);
  
  if (files.hasNext()) {
    const file = files.next();
    props.setProperty('DB_FILE_ID', file.getId());
    Logger.log("DB file found & cached: " + file.getId());
    return file;
  } else {
    Logger.log("DB file NOT found, creating new one...");
    const file = DriveApp.createFile(DB_FILENAME, JSON.stringify([]), MimeType.PLAIN_TEXT);
    props.setProperty('DB_FILE_ID', file.getId());
    return file;
  }
}

/**
 * Lit les données du fichier JSON
 * @return {Array} La liste des modèles
 */
function readDb_() {
  Logger.log("readDb_ called");
  // Pas de try-catch ici : on veut que l'erreur remonte si permission manquante
  const file = getDbFile_();
  const content = file.getBlob().getDataAsString();
  Logger.log("DB content length: " + (content ? content.length : 0));
  if (!content) return [];
  return JSON.parse(content);
}

/**
 * Écrit les données dans le fichier JSON
 * @param {Array} data - La liste complète des modèles
 */
function writeDb_(data) {
  Logger.log("writeDb_ called with " + (data ? data.length : 0) + " items");
  try {
    const file = getDbFile_();
    file.setContent(JSON.stringify(data, null, 2));
    Logger.log("DB write successful");
  } catch (e) {
    Logger.log("Error inside writeDb_: " + e.message);
    throw new Error("Erreur écriture DB: " + e.message);
  }
}


// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------


function doGet() {
  Logger.log("doGet started");
  try {
    const template = HtmlService.createTemplateFromFile('Index');
    Logger.log("Template Index created");
    
    template.isAdmin = isUserAdmin();
    Logger.log("isAdmin: " + template.isAdmin);
    
    template.defaultLogoUrl = DEFAULT_LOGO_URL; 
    
    const output = template.evaluate();
    Logger.log("Template evaluated");
    
    return output
      .setTitle('Générateur de signature')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (e) {
    Logger.log("Error in doGet: " + e.toString());
    return HtmlService.createHtmlOutput("<h1>Erreur Serveur</h1><p>" + e.toString() + "</p>");
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/**
 * Vérifie si l'utilisateur connecté est dans la liste des admins
 */
/**
 * Vérifie si l'utilisateur connecté est admin.
 * Source: ScriptProperties 'ADMIN_EMAILS' (csv).
 * Auto-init: Si vide, l'utilisateur courant devient admin.
 */
function isUserAdmin() {
  const userEmail = Session.getActiveUser().getEmail();
  const props = PropertiesService.getScriptProperties();
  let adminList = props.getProperty('ADMIN_EMAILS');

  // Auto-bootstrap: premier run
  if (!adminList) {
    Logger.log("First run: setting " + userEmail + " as admin.");
    props.setProperty('ADMIN_EMAILS', userEmail);
    return true;
  }

  // FALLBACK DE SECOURS (IMPORTANT : À GARDER POUR L'ACCÈS DU DÉVELOPPEUR)
  if (userEmail === 'fabrice@atelier-informatique.com') return true;

  const admins = adminList.split(',').map(e => e.trim().toLowerCase());
  return admins.includes(userEmail.toLowerCase());
}


/**
 * Normalise une URL logo (obligatoire)
 * Gère le cas des '+' dans les URLs Google Storage
 */
function normalizeLogoUrl_(logoUrl) {
  let v = String(logoUrl || '').trim();
  // Si la valeur est vide, on retourne le défaut
  if (!v) return DEFAULT_LOGO_URL;

  // FIX: Si l'URL est l'ancien placeholder par défaut, on le remplace par le nouveau défaut
  // (Cas où le modèle a été sauvegardé avec l'URL en dur)
  if (v.includes('via.placeholder.com') && v.includes('Votre+Logo')) {
    return DEFAULT_LOGO_URL;
  }

  // Si quelqu'un colle un '+' dans le path, on le sécurise en %2B
  if (v.includes('storage.googleapis.com') && v.includes('+') && !v.includes('%2B')) {
    v = v.replaceAll('+', '%2B');
  }
  return v;
}



/**
 * Sauvegarde la préférence de modèle de l'utilisateur courant
 */
function saveUserTemplatePreference(templateId) {
  const userProps = PropertiesService.getUserProperties();
  // On stocke l'ID en chaîne de caractères
  userProps.setProperty('PREFERRED_TEMPLATE_ID', String(templateId));
}

/**
 * Récupère les données de l'utilisateur via Admin Directory API
 */
function getUserProfile() {
  Logger.log("getUserProfile called");
  const userEmail = Session.getActiveUser().getEmail();
  Logger.log("User email: " + userEmail);

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

    const userProps = PropertiesService.getUserProperties();
    const preferredId = userProps.getProperty('PREFERRED_TEMPLATE_ID') || "";

    return {
      firstName: user.name?.givenName || "",
      lastName: user.name?.familyName || "",
      title: org.title || "",
      department: org.department || "",

      // --- NOUVEAUX CHAMPS ---
      company: org.name || DEFAULT_COMPANY,
      costCenter: org.costCenter || "",
      // -----------------------
      
      address: address.formatted || DEFAULT_ADDRESS,
      phone: workPhone.value || "",
      mobile: mobilePhone.value || "",
      email: user.primaryEmail,

      // Fallback logo : on renvoie le logo par défaut
      logoUrl: DEFAULT_LOGO_URL,
      
      // Préférence utilisateur (ID du modèle)
      preferredTemplateId: preferredId
    };

  } catch (e) {
    Logger.log("Error in getUserProfile: " + e.toString());
    throw new Error("Erreur profile : " + e.message);
  }
}



/**
 * Récupère les modèles depuis le fichier JSON
 */
function getTemplates() {
  Logger.log("getTemplates START");
  try {
    const data = readDb_(); // Lit le JSON
    Logger.log("Data retrieved from DB: " + (data ? data.length : "null"));
    
    // Mapping pour sécuriser les champs
    const result = data.map(t => ({
      id: t.id,
      name: t.name,
      html: t.html,
      logoUrl: normalizeLogoUrl_(t.logoUrl)
    })).filter(t => t.id && t.name);
    
    Logger.log("getTemplates END, returning: " + result.length + " templates");
    return result;

  } catch (e) {
    Logger.log("ERROR in getTemplates: " + e.toString());
    throw new Error("Erreur d'accès à la base de données (JSON Drive).");
  }
}


/**
 * Sauvegarde ou Met à jour un modèle (ADMIN SEULEMENT)
 * Écrit dans le fichier JSON
 */
function saveTemplate(id, name, html, logoUrl) {
  Logger.log("saveTemplate called with ID: " + id + ", Name: " + name);
  
  if (!isUserAdmin()) {
    Logger.log("User is NOT admin, access denied");
    throw new Error("Accès refusé. Vous n'êtes pas administrateur.");
  }

  const safeName = String(name || '').trim();
  const safeHtml = String(html || '').trim();
  const safeLogoUrl = normalizeLogoUrl_(logoUrl);

  if (!safeName || !safeHtml) {
    Logger.log("Missing name or html");
    throw new Error("Nom et HTML requis.");
  }

  const db = readDb_();
  let found = false;

  // Mise à jour si ID existe
  if (id) {
    for (let i = 0; i < db.length; i++) {
      if (String(db[i].id) === String(id)) {
        db[i].name = safeName;
        db[i].html = safeHtml;
        db[i].logoUrl = safeLogoUrl;
        found = true;
        Logger.log("Updated existing template ID: " + id);
        break;
      }
    }
  }

  // Création si pas d'ID ou ID introuvable (bien que l'UI envoie un ID vide pour new)
  if (!found) {
    // Calcul nouvel ID
    let maxId = 0;
    if (db.length > 0) {
      const ids = db.map(t => parseInt(t.id)).filter(n => !isNaN(n));
      if (ids.length > 0) maxId = Math.max(...ids);
    }
    const newId = maxId + 1;
    
    db.push({
      id: newId,
      name: safeName,
      html: safeHtml,
      logoUrl: safeLogoUrl
    });
    Logger.log("Created new template ID: " + newId);
    writeDb_(db);
    return "Nouveau modèle créé (ID: " + newId + ")";
  } else {
    writeDb_(db);
    return "Modèle mis à jour avec succès.";
  }
}


/**
 * Supprime un modèle (ADMIN SEULEMENT)
 */
function deleteTemplate(id) {
  if (!isUserAdmin()) throw new Error("Accès refusé.");

  let db = readDb_();
  const initialLength = db.length;

  db = db.filter(t => String(t.id) !== String(id));

  if (db.length < initialLength) {
    writeDb_(db);
    return "Modèle supprimé.";
  } else {
    throw new Error("ID introuvable.");
  }
}


// MIGRATION FUNCTION REMOVED FOR PRODUCTIZATION
// The original migration logic specific to the previous Google Sheet has been removed.
// If migration is needed, it should be re-implemented based on the specific source.


// ------------------------------------------------------------------
// AUTO-UPDATE & TRIGGERS
// ------------------------------------------------------------------

// --- DEBUG ---
function testManuallyEnableAutoUpdate() {
  Logger.log("Running manual test...");
  try {
    toggleAutoUpdate(true);
    Logger.log("Manual test SUCCESS");
  } catch (e) {
    Logger.log("Manual test FAILED: " + e.toString());
  }
}
// -------------

/**
 * Active ou Désactive la mise à jour automatique (Trigger de nuit)
 */
function toggleAutoUpdate(enable) {
  Logger.log("toggleAutoUpdate called with: " + enable);
  
  // 1. Supprimer les triggers existants pour éviter les doublons
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (t.getHandlerFunction() === 'autoUpdateSignature') {
      ScriptApp.deleteTrigger(t);
    }
  });

  // 2. Si activation, créer un nouveau trigger
  if (enable) {
    ScriptApp.newTrigger('autoUpdateSignature')
      .timeBased()
      .everyDays(1)
      .atHour(2) // 2h du matin
      .create();
    Logger.log("Trigger created for 2am");
    
    // VERIFICATION IMMEDIATE
    const check = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === 'autoUpdateSignature');
    Logger.log("Immediate check callback: Trigger found? " + check);
  }
  
  return enable;
}

/**
 * Vérifie si la mise à jour auto est active
 */
function getAutoUpdateStatus() {
  const triggers = ScriptApp.getProjectTriggers();
  const found = triggers.some(t => t.getHandlerFunction() === 'autoUpdateSignature');
  Logger.log("getAutoUpdateStatus found " + triggers.length + " triggers. Match: " + found);
  return found;
}

/**
 * TÂCHE PLANIFIÉE (ne pas appeler directement, sauf test)
 * S'exécute la nuit pour mettre à jour la signature avec les dernières infos.
 */
/**
 * TÂCHE PLANIFIÉE (Nuit)
 * Exécute la mise à jour et envoie un email d'alerte aux admins en cas d'échec critique.
 */
function autoUpdateSignature() {
  Logger.log("autoUpdateSignature STARTED");
  
  try {
    // ... logic de update ...
    forceUpdateSignature(); // On réutilise la même logique
    Logger.log("autoUpdateSignature COMPLETED");

  } catch (e) {
    Logger.log("CRITICAL ERROR in autoUpdateSignature: " + e.toString());
    
    // Alerte Admin
    try {
      const props = PropertiesService.getScriptProperties();
      const adminList = props.getProperty('ADMIN_EMAILS');
      if (adminList) {
        MailApp.sendEmail({
          to: adminList,
          subject: "[ALERTE] Échec Mise à jour Signature",
          body: "Bonjour,\n\nLa mise à jour automatique des signatures a échoué cette nuit.\n\nErreur : " + e.toString() + "\n\nMerci de vérifier les logs.",
          noReply: true
        });
      }
    } catch (mailError) {
      Logger.log("Failed to send alert email: " + mailError);
    }
  }
}

/**
 * Force la mise à jour immédiate (appelé par UI ou Trigger)
 */
function forceUpdateSignature() {
    // 1. Récupérer le profil utilisateur (Google Directory)
    const user = getUserProfile();
    Logger.log("User profile fetched for: " + user.email);

    // 2. Vérifier la préférence de modèle
    const prefId = user.preferredTemplateId;
    if (!prefId) {
      Logger.log("No preferred template saved. Skipping update.");
      return "Aucun modèle favori sélectionné.";
    }

    // 3. Charger le modèle
    const templates = getTemplates();
    const tpl = templates.find(t => String(t.id) === String(prefId));
    
    if (!tpl) {
      Logger.log("Preferred template ID " + prefId + " NOT found." );
      throw new Error("Modèle favori introuvable (ID: " + prefId + ")");
    }

    // 4. Compiler le HTML
    const finalHtml = compileSignature_(tpl.html, user, tpl.logoUrl);
    
    // 5. Appliquer la signature
    return updateSignature(finalHtml);
}

/**
 * Helper serveur pour remplacer les ${userData.Field}
 */
function compileSignature_(rawHtml, userData, templateLogoUrl) {
  let html = String(rawHtml || "");
  const logoUrl = templateLogoUrl || userData.logoUrl || DEFAULT_LOGO_URL;
  
  // Mêmes champs que le JS client
  const map = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    title: userData.title,
    department: userData.department,
    company: userData.company,
    costCenter: userData.costCenter,
    email: userData.email,
    mobile: userData.mobile,
    phone: userData.phone,
    address: userData.address,
    logoUrl: logoUrl
  };

  // Remplacement regex
  // On cherche ${userData.key}
  return html.replace(/\$\{userData\.(\w+)\}/g, (match, key) => {
    return map[key] || "";
  });
}


/**
 * Met à jour la signature Gmail de l'utilisateur connecté
 * -> applique sur TOUTES les identités "SendAs" (primary + alias)
 */
function updateSignature(htmlSignature) {
  Logger.log("updateSignature called");
  const userEmail = Session.getActiveUser().getEmail();
  Logger.log("User: " + userEmail);

  try {
    const safeHtml = String(htmlSignature || "").trim();
    if (!safeHtml) throw new Error("Signature vide : rien à appliquer.");

    // Récupère toutes les identités d’envoi (primary + alias)
    const list = Gmail.Users.Settings.SendAs.list('me');
    const sendAs = (list && list.sendAs) ? list.sendAs : [];
    
    Logger.log("Found " + sendAs.length + " SendAs identities");

    if (sendAs.length === 0) {
      throw new Error("Aucune identité d'envoi trouvée.");
    }

    const payload = { signature: safeHtml };
    const updated = [];
    const failed = [];

    // Boucle sur chaque alias pour appliquer la signature
    sendAs.forEach(sa => {
      const addr = sa.sendAsEmail;
      Logger.log("Attempting to update signature for: " + addr);
      try {
        Gmail.Users.Settings.SendAs.patch(payload, 'me', addr);
        updated.push(addr);
        Logger.log("Success for: " + addr);
      } catch (e) {
        if (e.message.includes("Access restricted to service accounts")) {
          failed.push(`${addr} (Restriction Google API : impossible de modifier la signature de cet alias via script)`);
          Logger.log("Known restriction for: " + addr);
        } else {
          failed.push(`${addr} (${e.message})`);
          Logger.log("Failed for: " + addr + " Error: " + e.message);
        }
      }
    });

    // Message de retour détaillé
    let msg = `✅ Signature appliquée avec succès.\n\n`;
    msg += `Comptes mis à jour (${updated.length}) :\n- ${updated.join("\n- ")}\n\n`;
    
    if (failed.length) {
      msg += `⚠️ Échecs (${failed.length}) :\n- ${failed.join("\n- ")}`;
    }

    Logger.log("updateSignature result: " + msg);
    return msg;


  } catch (e) {
    Logger.log("CRITICAL ERROR in updateSignature: " + e.message);
    throw new Error("Impossible de mettre à jour Gmail : " + e.message);
  }
}
