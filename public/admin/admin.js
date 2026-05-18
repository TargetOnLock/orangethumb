const state = { content: null, sortables: {} };

const loginPanel = document.getElementById("login-panel");
const editorPanel = document.getElementById("editor-panel");
const loginForm = document.getElementById("login-form");
const layoutTypeLabels = {
  hero: "Hero",
  highlights: "Highlights",
  about: "About",
  locationHours: "Location + Hours",
  gallery: "Gallery",
  customImage: "Custom Image Section",
  customText: "Custom Text Section"
};

function id() {
  return Math.random().toString(36).slice(2, 10);
}

function normalizeContent(content) {
  if (!content.pageSections || !Array.isArray(content.pageSections)) {
    content.pageSections = [
      { id: "hero-main", type: "hero" },
      { id: "highlights-main", type: "highlights" },
      { id: "about-main", type: "about" },
      { id: "location-main", type: "locationHours" },
      { id: "gallery-main", type: "gallery" }
    ];
  }
  return content;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.error || "Request failed");
  }
  return res.json();
}

function buildTextItem(text, onInput, onDelete) {
  const wrap = document.createElement("div");
  wrap.className = "sort-item";
  const input = document.createElement("textarea");
  input.value = text;
  input.addEventListener("input", () => onInput(input.value));
  const del = document.createElement("button");
  del.type = "button";
  del.textContent = "Delete";
  del.addEventListener("click", onDelete);
  wrap.append(input, del);
  return wrap;
}

function renderLayoutList() {
  const list = document.getElementById("layout-list");
  list.innerHTML = "";
  state.content.pageSections.forEach((section, index) => {
    const wrap = document.createElement("div");
    wrap.className = "sort-item";
    const canDelete = section.type === "customImage" || section.type === "customText";
    wrap.innerHTML = `<strong>${layoutTypeLabels[section.type] || section.type}</strong>`;

    if (section.type === "customImage") {
      const title = document.createElement("input");
      title.value = section.title || "";
      title.placeholder = "Section title (optional)";
      title.addEventListener("input", () => (state.content.pageSections[index].title = title.value));
      const src = document.createElement("input");
      src.value = section.src || "";
      src.placeholder = "Image URL (example: /uploads/your-image.jpg)";
      src.addEventListener("input", () => (state.content.pageSections[index].src = src.value));
      const caption = document.createElement("input");
      caption.value = section.caption || "";
      caption.placeholder = "Caption (optional)";
      caption.addEventListener("input", () => (state.content.pageSections[index].caption = caption.value));
      wrap.append(title, src, caption);
    }

    if (section.type === "customText") {
      const title = document.createElement("input");
      title.value = section.title || "";
      title.placeholder = "Section title (optional)";
      title.addEventListener("input", () => (state.content.pageSections[index].title = title.value));
      const body = document.createElement("textarea");
      body.value = section.body || "";
      body.placeholder = "Section text";
      body.addEventListener("input", () => (state.content.pageSections[index].body = body.value));
      wrap.append(title, body);
    }

    if (canDelete) {
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete Section";
      del.addEventListener("click", () => {
        state.content.pageSections.splice(index, 1);
        render();
      });
      wrap.append(del);
    }
    list.appendChild(wrap);
  });
}

function render() {
  const c = state.content;
  document.getElementById("brandName").value = c.brand.name;
  document.getElementById("brandPhone").value = c.brand.phone;
  document.getElementById("brandAddress").value = c.brand.address || "";
  document.getElementById("brandLogo").value = c.brand.logo || "";
  document.getElementById("brandTagline").value = c.brand.tagline;
  document.getElementById("heroTitle").value = c.hero.title;
  document.getElementById("heroSubtitle").value = c.hero.subtitle;
  document.getElementById("hoursEditor").value = (c.hours || [])
    .map((row) => `${row.day}|${row.open}`)
    .join("\n");

  const aboutList = document.getElementById("about-list");
  aboutList.innerHTML = "";
  c.about.paragraphs.forEach((paragraph, index) => {
    const item = buildTextItem(
      paragraph,
      (value) => (state.content.about.paragraphs[index] = value),
      () => {
        state.content.about.paragraphs.splice(index, 1);
        render();
      }
    );
    aboutList.appendChild(item);
  });

  const highlights = document.getElementById("highlight-list");
  highlights.innerHTML = "";
  c.highlightBlocks.forEach((block, index) => {
    const wrap = document.createElement("div");
    wrap.className = "sort-item";
    wrap.innerHTML = `
      <label>Title <input value="${escapeHtml(block.title || "")}" /></label>
      <label>Body <textarea>${escapeHtml(block.body || "")}</textarea></label>
      <button type="button">Delete</button>
    `;
    const [titleInput, bodyInput, del] = wrap.querySelectorAll("input, textarea, button");
    titleInput.addEventListener("input", () => (state.content.highlightBlocks[index].title = titleInput.value));
    bodyInput.addEventListener("input", () => (state.content.highlightBlocks[index].body = bodyInput.value));
    del.addEventListener("click", () => {
      state.content.highlightBlocks.splice(index, 1);
      render();
    });
    highlights.appendChild(wrap);
  });

  const mediaList = document.getElementById("media-list");
  mediaList.innerHTML = "";
  c.mediaGallery.forEach((item, index) => {
    const wrap = document.createElement("div");
    wrap.className = "sort-item";
    const media =
      item.type === "video"
        ? `<video class="media-preview" controls src="${item.src}"></video>`
        : `<img class="media-preview" src="${item.src}" alt="media" />`;
    wrap.innerHTML = `${media}
      <label>Caption <input value="${escapeHtml(item.caption || "")}" /></label>
      <button type="button">Delete</button>`;
    const [caption, del] = wrap.querySelectorAll("input, button");
    caption.addEventListener("input", () => (state.content.mediaGallery[index].caption = caption.value));
    del.addEventListener("click", () => {
      state.content.mediaGallery.splice(index, 1);
      render();
    });
    mediaList.appendChild(wrap);
  });

  renderLayoutList();
  sortableSetup();
}

function sortableSetup() {
  Object.values(state.sortables).forEach((sortable) => sortable?.destroy());
  state.sortables = {};
  state.sortables.about = Sortable.create(document.getElementById("about-list"), {
    animation: 150,
    onEnd: (evt) => moveItem(state.content.about.paragraphs, evt.oldIndex, evt.newIndex)
  });
  state.sortables.highlight = Sortable.create(document.getElementById("highlight-list"), {
    animation: 150,
    onEnd: (evt) => moveItem(state.content.highlightBlocks, evt.oldIndex, evt.newIndex)
  });
  state.sortables.media = Sortable.create(document.getElementById("media-list"), {
    animation: 150,
    onEnd: (evt) => moveItem(state.content.mediaGallery, evt.oldIndex, evt.newIndex)
  });
  state.sortables.layout = Sortable.create(document.getElementById("layout-list"), {
    animation: 150,
    onEnd: (evt) => moveItem(state.content.pageSections, evt.oldIndex, evt.newIndex)
  });
}

function moveItem(arr, from, to) {
  if (from === to || from < 0 || to < 0) return;
  const [item] = arr.splice(from, 1);
  arr.splice(to, 0, item);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wireForm() {
  document.getElementById("brandName").addEventListener("input", (e) => (state.content.brand.name = e.target.value));
  document.getElementById("brandPhone").addEventListener("input", (e) => (state.content.brand.phone = e.target.value));
  document.getElementById("brandAddress").addEventListener("input", (e) => (state.content.brand.address = e.target.value));
  document.getElementById("brandLogo").addEventListener("input", (e) => (state.content.brand.logo = e.target.value));
  document
    .getElementById("brandTagline")
    .addEventListener("input", (e) => (state.content.brand.tagline = e.target.value));
  document.getElementById("heroTitle").addEventListener("input", (e) => (state.content.hero.title = e.target.value));
  document
    .getElementById("heroSubtitle")
    .addEventListener("input", (e) => (state.content.hero.subtitle = e.target.value));
  document.getElementById("hoursEditor").addEventListener("input", (e) => {
    state.content.hours = e.target.value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [day, open] = line.split("|");
        return { day: (day || "").trim(), open: (open || "").trim() };
      });
  });

  document.getElementById("add-about").addEventListener("click", () => {
    state.content.about.paragraphs.push("New paragraph");
    render();
  });
  document.getElementById("add-highlight").addEventListener("click", () => {
    state.content.highlightBlocks.push({ id: id(), type: "text", title: "New highlight", body: "Edit this text" });
    render();
  });
  document.getElementById("add-custom-image").addEventListener("click", () => {
    state.content.pageSections.push({
      id: id(),
      type: "customImage",
      title: "",
      src: state.content.mediaGallery[0]?.src || state.content.brand.logo || "/images/logo.jpg",
      caption: ""
    });
    render();
  });
  document.getElementById("add-custom-text").addEventListener("click", () => {
    state.content.pageSections.push({
      id: id(),
      type: "customText",
      title: "Text Section",
      body: "Add text here."
    });
    render();
  });

  document.getElementById("save-btn").addEventListener("click", async () => {
    try {
      await api("/api/admin/content", { method: "PUT", body: JSON.stringify(state.content) });
      alert("Saved");
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    location.reload();
  });

  const dropzone = document.getElementById("dropzone");
  const mediaInput = document.getElementById("media-input");
  dropzone.addEventListener("click", () => mediaInput.click());
  mediaInput.addEventListener("change", () => uploadFiles(mediaInput.files, { addAsSections: false }));
  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.style.background = "#fff0e3";
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.style.background = "#fff7f2";
  });
  dropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropzone.style.background = "#fff7f2";
    uploadFiles(e.dataTransfer.files, { addAsSections: false });
  });

  const layoutDropzone = document.getElementById("layout-image-dropzone");
  const layoutImageInput = document.getElementById("layout-image-input");
  layoutDropzone.addEventListener("click", () => layoutImageInput.click());
  layoutImageInput.addEventListener("change", () =>
    uploadFiles(layoutImageInput.files, { addAsSections: true, imagesOnly: true })
  );
  layoutDropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    layoutDropzone.style.background = "#fff0e3";
  });
  layoutDropzone.addEventListener("dragleave", () => {
    layoutDropzone.style.background = "#fff7f2";
  });
  layoutDropzone.addEventListener("drop", (e) => {
    e.preventDefault();
    layoutDropzone.style.background = "#fff7f2";
    uploadFiles(e.dataTransfer.files, { addAsSections: true, imagesOnly: true });
  });
}

async function uploadFiles(files, options = {}) {
  if (!files || files.length === 0) return;
  const { addAsSections = false, imagesOnly = false } = options;
  const list = Array.from(files).filter((file) => (imagesOnly ? file.type.startsWith("image/") : true));
  if (list.length === 0) return;
  const form = new FormData();
  for (const file of list) form.append("files", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  if (!res.ok) return alert("Upload failed");
  const payload = await res.json();
  state.content.mediaGallery.push(...payload.uploaded);
  if (addAsSections) {
    payload.uploaded
      .filter((item) => item.type === "image")
      .forEach((item) => {
        state.content.pageSections.push({
          id: id(),
          type: "customImage",
          title: "",
          src: item.src,
          caption: item.caption || ""
        });
      });
  }
  render();
}

async function boot() {
  wireForm();
  const session = await api("/api/admin/session");
  if (session.isAdmin) {
    state.content = normalizeContent(await api("/api/content"));
    loginPanel.classList.add("hidden");
    editorPanel.classList.remove("hidden");
    render();
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(loginForm);
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password")
      })
    });
    state.content = normalizeContent(await api("/api/content"));
    loginPanel.classList.add("hidden");
    editorPanel.classList.remove("hidden");
    render();
  } catch (err) {
    alert(err.message);
  }
});

boot();
