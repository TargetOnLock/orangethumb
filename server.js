require("dotenv").config();
const express = require("express");
const cookieSession = require("cookie-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs/promises");
const bcrypt = require("bcryptjs");
const { defaultContent, cryptoRandomId } = require("./lib/defaultContent");
const { readContent, writeContent, ensureLocalDataFile } = require("./lib/contentStore");
const { useSupabase, uploadFileToStorage } = require("./lib/supabase");

const app = express();
const PORT = process.env.PORT || 3000;
const UPLOAD_DIR = path.join(__dirname, "uploads");
const SOURCE_IMAGE_DIR = process.env.SOURCE_IMAGE_DIR || "";
const SESSION_SECRET = process.env.SESSION_SECRET || "orange-thumb-secret-change-me";
const ADMIN_USER = process.env.ADMIN_USER || "owner";
const ADMIN_PASSWORD_HASH =
  process.env.ADMIN_PASSWORD_HASH ||
  bcrypt.hashSync(process.env.ADMIN_PASSWORD || "OrangeThumb!2026", 10);
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);

app.set("trust proxy", 1);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: "ot-admin",
    keys: [SESSION_SECRET],
    maxAge: 1000 * 60 * 60 * 8,
    secure: isProduction,
    sameSite: "lax",
    httpOnly: true
  })
);

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

function requireAdmin(req, res, next) {
  if (!req.session?.isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

async function saveUploadedFile(file) {
  if (useSupabase()) {
    const publicUrl = await uploadFileToStorage(file);
    return {
      id: cryptoRandomId(),
      type: file.mimetype.startsWith("video/") ? "video" : "image",
      src: publicUrl,
      caption: ""
    };
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "-");
  const filename = `${stamp}-${safe}`;
  await fs.writeFile(path.join(UPLOAD_DIR, filename), file.buffer);
  return {
    id: cryptoRandomId(),
    type: file.mimetype.startsWith("video/") ? "video" : "image",
    src: `/uploads/${filename}`,
    caption: ""
  };
}

async function seedFromPictureFolderIfEmpty() {
  if (useSupabase() || !SOURCE_IMAGE_DIR) return;

  let content = await readContent();
  if (content.mediaGallery.length > 0) return;

  try {
    const entries = await fs.readdir(SOURCE_IMAGE_DIR, { withFileTypes: true });
    const imageFiles = entries
      .filter(
        (entry) =>
          entry.isFile() && /\.(png|jpg|jpeg|webp|gif|mp4|mov|webm)$/i.test(entry.name)
      )
      .slice(0, 24);

    for (const item of imageFiles) {
      const buffer = await fs.readFile(path.join(SOURCE_IMAGE_DIR, item.name));
      const uploaded = await saveUploadedFile({
        originalname: item.name,
        mimetype: /\.(mp4|mov|webm)$/i.test(item.name) ? "video/mp4" : "image/jpeg",
        buffer
      });
      content.mediaGallery.push({
        ...uploaded,
        caption: "Orange Thumb in-store moment"
      });
    }

    await writeContent(content);
  } catch {
    // Optional local seed folder.
  }
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    storage: useSupabase() ? "supabase" : "local",
    vercel: Boolean(process.env.VERCEL)
  });
});

app.get("/api/content", async (_req, res) => {
  try {
    const content = await readContent();
    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load content" });
  }
});

app.get("/api/admin/session", (req, res) => {
  res.json({ isAdmin: Boolean(req.session?.isAdmin), username: req.session?.username || null });
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (username !== ADMIN_USER) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password || "", ADMIN_PASSWORD_HASH);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  req.session = { isAdmin: true, username };
  return res.json({ success: true });
});

app.post("/api/admin/logout", (req, res) => {
  req.session = null;
  res.json({ success: true });
});

app.put("/api/admin/content", requireAdmin, async (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid payload" });
  }
  try {
    await writeContent(incoming);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to save content" });
  }
});

app.post("/api/admin/upload", requireAdmin, upload.array("files", 20), async (req, res) => {
  try {
    const files = req.files || [];
    const uploaded = [];
    for (const file of files) {
      uploaded.push(await saveUploadedFile(file));
    }
    res.json({ uploaded });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Upload failed" });
  }
});

app.get("/admin", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  await ensureLocalDataFile();
  if (!useSupabase()) {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
  await seedFromPictureFolderIfEmpty();

  app.listen(PORT, () => {
    console.log(`Orange Thumb site running on http://localhost:${PORT}`);
    console.log(`Storage: ${useSupabase() ? "Supabase" : "local files"}`);
    console.log(`Admin login username: ${ADMIN_USER}`);
  });
}

module.exports = app;

if (!process.env.VERCEL) {
  start();
}
