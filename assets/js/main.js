// ===== PENGATURAN: edit bagian ini saja =====

// Menu utama (urutan dan nama tab).
const links = [
  ["/", "Homepage"], ["/cv/", "CV"], ["/projects/", "Projects"],
  ["/photography/", "Photography"], ["/anime-list/", "Anime Watching List"],
  ["/manga-list/", "Manga Reading List"], ["/pembahasan-anime/", "Anime Diary"]
];

// Kontak: tampil di sidebar Homepage dan footer semua halaman.
// Isi alamat di kolom kedua, contoh: ["Email", "mailto:nama@email.com"].
// Yang dikosongkan ("") tidak ditampilkan.
const contact = [
  ["Email", "mailto:ikhsanudinmn@gmail.com"],
  ["LinkedIn", "https://www.linkedin.com/in/ikhsanudin-muhammad-nurzaini-9a6b88249"],
  ["GitHub", "https://github.com/Heatzen-7"],
  ["Instagram", "https://www.instagram.com/ikhsanudin_mn/"],
  ["MyAnimeList", "https://myanimelist.net/profile/Heatzen"],
  ["Facebook", "https://www.facebook.com/ikhsanudinmn"]
];

// ===== selesai =====

let path = location.pathname.replace(/index\.html$/, "");
if (!path.endsWith("/")) path += "/";

const header = document.getElementById("site-header");
header.innerHTML = '<nav aria-label="Menu utama">' + links.map(([u, t]) =>
  `<a href="${u}"${u === path ? ' aria-current="page"' : ""}>${t}</a>`).join("") + "</nav>";
const active = header.querySelector("[aria-current]");
if (active) active.scrollIntoView({ inline: "center", block: "nearest" });

const shown = contact.filter(([, url]) => url);
const side = document.querySelector(".side .links");
if (side) side.innerHTML = shown.map(([t, u]) => `<a href="${u}">${t}</a>`).join("");

const footer = document.createElement("footer");
footer.innerHTML = `<span>&copy; ${new Date().getFullYear()} Ikhsanudin Muhammad Nurzaini</span>` +
  (shown.length ? "<ul>" + shown.map(([t, u]) => `<li><a href="${u}">${t}</a></li>`).join("") + "</ul>" : "");
document.body.append(footer);
