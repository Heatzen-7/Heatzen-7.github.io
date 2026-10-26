// Preview MyAnimeList lewat Jikan (API tak resmi MAL, tanpa kunci). Daftar MAL harus publik.
(() => {
  const box = document.getElementById("mal");
  if (!box) return;
  const kind = box.dataset.kind, user = box.dataset.user;
  const listUrl = `https://myanimelist.net/${kind}list/${encodeURIComponent(user)}`;
  const STATUS = { Watching: "Sedang ditonton", Completed: "Selesai", "On-Hold": "Ditunda", Dropped: "Dihentikan",
    "Plan to Watch": "Rencana", Reading: "Sedang dibaca", "Plan to Read": "Rencana" };

  async function load() {
    try { const c = JSON.parse(sessionStorage.getItem("mal-" + user)); if (c && Date.now() - c.t < 6e5) return c.d; } catch {}
    const r = await fetch(`https://api.jikan.moe/v4/users/${encodeURIComponent(user)}/updates`);
    if (!r.ok) throw new Error(r.status);
    const d = (await r.json()).data;
    try { sessionStorage.setItem("mal-" + user, JSON.stringify({ t: Date.now(), d })); } catch {}
    return d;
  }
  function line(text) { const s = document.createElement("span"); s.textContent = text; return s; }
  function card(i) {
    const e = i.entry || {};
    const a = document.createElement("a");
    a.className = "mal-card"; a.href = e.url || listUrl; a.target = "_blank"; a.rel = "noopener";
    const src = (e.images && e.images.jpg && e.images.jpg.image_url) || "";
    if (src.startsWith("https://")) { const im = new Image(); im.src = src; im.alt = ""; im.loading = "lazy"; a.append(im); }
    const t = document.createElement("strong"); t.textContent = e.title || "Tanpa judul"; a.append(t);
    a.append(line(STATUS[i.status] || i.status || ""));
    const [done, total, unit] = kind === "anime" ? [i.episodes_seen, i.episodes_total, "Ep"] : [i.chapters_read, i.chapters_total, "Ch"];
    if (i.status !== "Completed" && done != null) a.append(line(`${unit} ${done}${total ? "/" + total : ""}`));
    if (i.score) a.append(line(`Skor ${i.score}`));
    return a;
  }
  const fail = () => { box.innerHTML = `<p>Preview belum bisa dimuat. <a href="${listUrl}">Buka daftar lengkap di MyAnimeList</a>.</p>`; };

  load().then(d => {
    const items = ((d && d[kind]) || []).slice(0, 12);
    if (!items.length) return fail();
    box.replaceChildren(...items.map(card));
  }).catch(fail);
})();
