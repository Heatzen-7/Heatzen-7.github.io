// Preview MyAnimeList: membaca /data/mal.json, yang diperbarui otomatis tiap hari oleh GitHub Actions.
(() => {
  const box = document.getElementById("mal");
  if (!box) return;
  const kind = box.dataset.kind, user = box.dataset.user;
  const listUrl = `https://myanimelist.net/${kind}list/${encodeURIComponent(user)}`;
  const STATUS = { watching: "Sedang ditonton", completed: "Selesai", on_hold: "Ditunda", dropped: "Dihentikan",
    plan_to_watch: "Rencana", reading: "Sedang dibaca", plan_to_read: "Rencana" };

  function line(text) { const s = document.createElement("span"); s.textContent = text; return s; }
  function card(i) {
    const a = document.createElement("a");
    a.className = "mal-card"; a.href = i.url || listUrl; a.target = "_blank"; a.rel = "noopener";
    if (typeof i.image === "string" && i.image.startsWith("https://")) {
      const im = new Image(); im.src = i.image; im.alt = ""; im.loading = "lazy"; a.append(im);
    }
    const t = document.createElement("strong"); t.textContent = i.title || "Tanpa judul"; a.append(t);
    a.append(line(STATUS[i.status] || i.status || ""));
    if (i.status !== "completed" && i.progress != null) {
      a.append(line(`${kind === "anime" ? "Ep" : "Ch"} ${i.progress}${i.total ? "/" + i.total : ""}`));
    }
    if (i.score) a.append(line(`Skor ${i.score}`));
    return a;
  }
  const fail = () => { box.innerHTML = `<p>Preview belum tersedia. <a href="${listUrl}">Buka daftar lengkap di MyAnimeList</a>.</p>`; };

  fetch("/data/mal.json", { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      const items = (d[kind] || []).slice(0, 12);
      if (!items.length) return fail();
      box.replaceChildren(...items.map(card));
    })
    .catch(fail);
})();
