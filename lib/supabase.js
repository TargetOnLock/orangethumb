const { createClient } = require("@supabase/supabase-js");

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

function useSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabase() {
  if (!useSupabase()) return null;
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function uploadFileToStorage(file) {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase is not configured");

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const objectPath = `${stamp}-${safe}`;

  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, file.buffer, {
    contentType: file.mimetype,
    upsert: false
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

module.exports = { useSupabase, getSupabase, uploadFileToStorage, BUCKET };
