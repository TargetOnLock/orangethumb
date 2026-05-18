const path = require("path");
const fs = require("fs/promises");
const { defaultContent } = require("./defaultContent");
const { useSupabase, getSupabase } = require("./supabase");

const DATA_FILE = path.join(__dirname, "..", "data", "site-content.json");
const CONTENT_ROW_ID = "main";

async function readLocalFile() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function readFromSupabase() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("site_content")
    .select("content")
    .eq("id", CONTENT_ROW_ID)
    .maybeSingle();

  if (error) throw error;
  if (data?.content) return data.content;

  const migrated = (await readLocalFile()) || defaultContent;
  await writeToSupabase(migrated);
  return migrated;
}

async function writeToSupabase(content) {
  const supabase = getSupabase();
  const { error } = await supabase.from("site_content").upsert({
    id: CONTENT_ROW_ID,
    content,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

async function readContent() {
  if (useSupabase()) return readFromSupabase();
  const local = await readLocalFile();
  return local || defaultContent;
}

async function writeContent(content) {
  if (useSupabase()) {
    await writeToSupabase(content);
    return;
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(content, null, 2), "utf8");
}

async function ensureLocalDataFile() {
  if (useSupabase()) return;
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(defaultContent, null, 2), "utf8");
  }
}

module.exports = { readContent, writeContent, ensureLocalDataFile, DATA_FILE };
