const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL || "";
// On utilise la secret key (service role) pour bypasser les RLS côté backend
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ── Bucket où sont stockées les images des articles ──────────────────────────
const BUCKET = "articles";

/**
 * Supprime une image du Supabase Storage à partir de son URL publique.
 * @param {string} publicUrl - URL publique complète de l'image
 */
const deleteImageFromStorage = async (publicUrl) => {
  try {
    if (!publicUrl || typeof publicUrl !== "string") {
      return { error: "URL d'image invalide ou manquante." };
    }

    // Si ce n'est pas une URL Supabase (ex: /uploads/... ou image locale), on ignore sans erreur
    if (!publicUrl.includes("supabase.co") || !publicUrl.includes(`/storage/v1/object/public/${BUCKET}`)) {
      return { skipped: true, reason: "Non stocké sur Supabase Storage" };
    }

    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = url.pathname.indexOf(marker);
    if (markerIndex === -1) {
      return { error: "Format d'URL Supabase Storage invalide." };
    }

    let filePath = url.pathname.substring(markerIndex + marker.length);
    filePath = decodeURIComponent(filePath).replace(/^\/+/, "");

    console.log(`[Supabase Storage] 🗑️ Suppression du fichier: bucket="${BUCKET}", path="${filePath}"`);
    const { data, error } = await supabase.storage.from(BUCKET).remove([filePath]);
    if (error) {
      console.error(`[Supabase Storage] ❌ Erreur lors de la suppression de "${filePath}":`, error.message);
      return { error: error.message };
    }

    console.log(`[Supabase Storage] ✅ Fichier supprimé avec succès: "${filePath}"`);
    return { data, filePath };
  } catch (err) {
    console.error("[Supabase Storage] ❌ Exception lors de la suppression:", err.message);
    return { error: err.message };
  }
};

/**
 * Supprime plusieurs images du Supabase Storage.
 * @param {string[]} urls - Liste des URLs publiques
 */
const deleteImagesFromStorage = async (urls) => {
  if (!Array.isArray(urls) || urls.length === 0) return [];
  const results = [];
  for (const url of urls) {
    if (url) {
      const res = await deleteImageFromStorage(url);
      results.push(res);
    }
  }
  return results;
};

/**
 * S'assure que le bucket de stockage existe et est public
 */
const ensureBucketExists = async () => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets && buckets.some((b) => b.name === BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET, { public: true });
    }
  } catch (err) {
    console.warn("⚠️ Impossible de vérifier/créer le bucket Supabase:", err.message);
  }
};

/**
 * Upload une image encodée en base64 vers Supabase Storage et retourne l'URL publique.
 * @param {string} base64Data - Chaîne base64 (avec ou sans prefixe data:image/...)
 * @param {string} [originalName] - Nom du fichier original pour conserver l'extension
 * @returns {Promise<{ publicUrl?: string, error?: string }>}
 */
const uploadImageToStorage = async (base64Data, originalName = "image.jpg") => {
  try {
    await ensureBucketExists();

    let contentType = "image/jpeg";
    let pureBase64 = base64Data;

    // Détecter et parser le préfixe data:image/xxx;base64,
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      contentType = matches[1];
      pureBase64 = matches[2];
    }

    // Déterminer l'extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";
    else if (originalName && originalName.includes(".")) {
      ext = originalName.split(".").pop().toLowerCase();
    }

    const buffer = Buffer.from(pureBase64, "base64");
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const filePath = `articles/${uniqueSuffix}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return { publicUrl: data.publicUrl, filePath };
  } catch (err) {
    return { error: err.message };
  }
};

module.exports = {
  supabase,
  BUCKET,
  deleteImageFromStorage,
  deleteImagesFromStorage,
  uploadImageToStorage,
  ensureBucketExists,
};

