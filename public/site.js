async function loadContent() {
  const res = await fetch("/api/content");
  const content = await res.json();

  document.getElementById("brand-name").textContent = content.brand.name;
  document.getElementById("tagline").textContent = content.brand.tagline;
  document.getElementById("logo-image").src = content.brand.logo || "/images/logo.jpg";
  document.getElementById("logo-image").alt = `${content.brand.name} logo`;
  document.getElementById("phone-link").textContent = `Call ${content.brand.phone}`;
  document.getElementById("phone-link").href = `tel:${content.brand.phone.replace(/[^\d+]/g, "")}`;
  document.getElementById("footer-phone").textContent = content.brand.phone;
  document.getElementById("footer-phone").href = `tel:${content.brand.phone.replace(/[^\d+]/g, "")}`;
  document.getElementById("footer-address").textContent = content.brand.address || content.brand.city || "";
  document.getElementById("facebook-link").href = content.brand.facebook || "https://www.facebook.com/orangethumbws";
  document.getElementById("yelp-link").href = content.brand.yelp || "https://www.yelp.com/biz/orange-thumb-west-salem";

  renderPageSections(content);
}

function renderPageSections(content) {
  const root = document.getElementById("page-sections");
  root.innerHTML = "";

  const sections =
    content.pageSections ||
    [
      { id: "hero-main", type: "hero" },
      { id: "highlights-main", type: "highlights" },
      { id: "about-main", type: "about" },
      { id: "location-main", type: "locationHours" },
      { id: "gallery-main", type: "gallery" }
    ];

  sections.forEach((section) => {
    if (section.type === "hero") root.appendChild(buildHero(content));
    if (section.type === "highlights") root.appendChild(buildHighlights(content));
    if (section.type === "about") root.appendChild(buildAbout(content));
    if (section.type === "locationHours") root.appendChild(buildLocation(content));
    if (section.type === "gallery") root.appendChild(buildGallery(content));
    if (section.type === "customImage") root.appendChild(buildCustomImage(section));
    if (section.type === "customText") root.appendChild(buildCustomText(section));
  });
}

function buildHero(content) {
  const section = document.createElement("section");
  section.className = "hero";
  section.innerHTML = `
    <div class="container hero-grid">
      <div>
        <h2>${content.hero.title || ""}</h2>
        <p>${content.hero.subtitle || ""}</p>
        <a href="#gallery" class="btn">Explore The Boutique</a>
      </div>
      <div class="glow-card">
        <h3>Shopping Experience Like No Other</h3>
        <p>Women's accessories, handcrafted decor, jewelry, soaps, clothing, and fresh arrivals every visit.</p>
      </div>
    </div>
  `;
  return section;
}

function buildHighlights(content) {
  const section = document.createElement("section");
  section.className = "highlights container";
  (content.highlightBlocks || []).forEach((block) => {
    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `<h3>${block.title || "Featured"}</h3><p>${block.body || ""}</p>`;
    section.appendChild(card);
  });
  return section;
}

function buildAbout(content) {
  const section = document.createElement("section");
  section.className = "about container";
  const heading = document.createElement("h2");
  heading.textContent = content.about.heading || "About";
  section.appendChild(heading);
  (content.about.paragraphs || []).forEach((paragraph) => {
    const p = document.createElement("p");
    p.textContent = paragraph;
    section.appendChild(p);
  });
  return section;
}

function buildLocation(content) {
  const section = document.createElement("section");
  section.className = "location-hours container";
  const hoursHtml = (content.hours || [])
    .map((row) => `<p>${row.day}: ${row.open}</p>`)
    .join("");
  section.innerHTML = `
    <div class="card">
      <h3>Visit Orange Thumb</h3>
      <p>${content.brand.address || ""}</p>
      <p><a target="_blank" rel="noopener noreferrer" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        content.brand.address || "West Salem WI"
      )}">Open in Google Maps</a></p>
    </div>
    <div class="card">
      <h3>Store Hours</h3>
      <div>${hoursHtml}</div>
    </div>
  `;
  return section;
}

function buildGallery(content) {
  const section = document.createElement("section");
  section.className = "gallery-wrap";
  section.id = "gallery";
  const container = document.createElement("div");
  container.className = "container";
  container.innerHTML = `<h2>Inside Orange Thumb</h2><div class="gallery"></div>`;
  const gallery = container.querySelector(".gallery");
  (content.mediaGallery || []).forEach((item) => {
    const card = document.createElement("div");
    card.className = "media-card";
    const mediaTag =
      item.type === "video"
        ? `<video controls preload="metadata" src="${item.src}"></video>`
        : `<img src="${item.src}" alt="${item.caption || "Orange Thumb gallery image"}" loading="lazy" />`;
    card.innerHTML = `${mediaTag}<p>${item.caption || ""}</p>`;
    gallery.appendChild(card);
  });
  section.appendChild(container);
  return section;
}

function buildCustomImage(sectionData) {
  const section = document.createElement("section");
  section.className = "container custom-image";
  section.innerHTML = `
    <div class="card">
      ${sectionData.title ? `<h3>${sectionData.title}</h3>` : ""}
      <img src="${sectionData.src || "/images/logo.jpg"}" alt="${sectionData.caption || "Orange Thumb image"}" loading="lazy" />
      ${sectionData.caption ? `<p>${sectionData.caption}</p>` : ""}
    </div>
  `;
  return section;
}

function buildCustomText(sectionData) {
  const section = document.createElement("section");
  section.className = "container";
  section.innerHTML = `
    <div class="card">
      ${sectionData.title ? `<h3>${sectionData.title}</h3>` : ""}
      <p>${sectionData.body || ""}</p>
    </div>
  `;
  return section;
}

loadContent();
