// Peta Frontline: membaca file KML dari Google Earth langsung di browser, lalu menerapkan aturan tampilan.
// Taruh KML di data/Frontline_Project.kml. Mengunggah KML baru dengan nama sama otomatis memperbarui peta.
(() => {
  // ===== PENGATURAN =====
  // Titik hanya tampil jika namanya diawali salah satu awalan ini. Titik lain dianggap dummy dan disembunyikan.
  const AWALAN = { "S.": "Stasiun", "H.": "Halte" };
  // Warna status: putih = aktif; titik nonaktif = biru; jalur nonaktif = kuning.
  const WARNA = { aktif: "#ffffff", titikNonaktif: "#3b8be8", jalurNonaktif: "#fbc02d" };
  // Nama dan catatan khusus untuk titik tertentu (kunci = nama persis di KML).
  const KHUSUS = {
    "S. ?": {
      nama: "Lokasi diduga stasiun (nama belum diketahui)",
      catatan: "Banyak jalur menuju titik ini, tetapi tidak ada catatan resmi sebagai stasiun. Menurut ulasan Google, lahannya milik PTKAI."
    }
  };
  // Folder dengan nama ini bukan nama lintas, jadi nama lintas diambil dari folder di atasnya.
  const FOLDER_BUKAN_LINTAS = /^(rute|daftar)/i;
  // ===== selesai =====

  const KMLNS = "http://www.opengis.net/kml/2.2";
  const RANK = { pasti: 0, kuat: 1, lemah: 2 };
  const kid = (e, n) => { for (const c of e.children) if (c.localName === n) return c; return null; };
  const txt = (e, n) => { const k = e && kid(e, n); return k ? k.textContent.trim() : ""; };
  const first = (e, n) => e.getElementsByTagNameNS("*", n)[0] || null;
  const bersih = s => s.replace(/\?+/g, "").replace(/\s+/g, " ").trim();
  const yakin = s => /\?\?\?/.test(s) ? "lemah" : /\?/.test(s) ? "kuat" : "pasti";
  const terlemah = (...a) => a.map(yakin).reduce((x, y) => RANK[y] > RANK[x] ? y : x, "pasti");

  function coords(el) {
    const c = el && first(el, "coordinates");
    if (!c) return [];
    return c.textContent.trim().split(/\s+/).map(t => { const a = t.split(","); return [parseFloat(a[1]), parseFloat(a[0])]; })
      .filter(a => isFinite(a[0]) && isFinite(a[1]));
  }

  function parseKml(xml) {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) throw new Error("KML tidak valid");
    const styles = {}, maps = {};
    for (const el of Array.from(doc.getElementsByTagNameNS("*", "*"))) {
      const n = el.localName;
      if (n !== "CascadingStyle" && n !== "Style" && n !== "StyleMap") continue;
      const id = el.getAttributeNS(KMLNS, "id") || el.getAttribute("id") || el.getAttribute("kml:id");
      if (!id) continue;
      if (n === "StyleMap") {
        for (const p of el.children) if (p.localName === "Pair" && txt(p, "key") === "normal") maps[id] = txt(p, "styleUrl").replace(/^#/, "");
      } else styles[id] = el;
    }
    // Status: ikon berwarna = nonaktif; garis berwarna (bukan putih) = nonaktif; tanpa warna = aktif (putih bawaan).
    function nonaktif(pm, jenis) {
      let sid = txt(pm, "styleUrl").replace(/^#/, "");
      sid = maps[sid] || sid;
      const s = styles[sid];
      if (!s) return false;
      if (jenis === "titik") {
        const icon = first(s, "Icon");
        const m = (icon ? txt(icon, "href") : "").match(/[?&]color=([0-9a-f]{6})/i);
        return !!m && m[1].toLowerCase() !== "ffffff";
      }
      const ls = first(s, "LineStyle");
      const c = ls ? txt(ls, "color").toLowerCase() : "";
      return !!c && c !== "ffffffff";
    }
    function lintas(pm) {
      for (let p = pm.parentNode; p && p.localName === "Folder"; p = p.parentNode) {
        const n = txt(p, "name");
        if (n && !FOLDER_BUKAN_LINTAS.test(n)) return n;
      }
      return "";
    }
    const out = { titik: [], jalur: [] };
    for (const pm of Array.from(doc.getElementsByTagNameNS("*", "Placemark"))) {
      const orig = txt(pm, "name");
      const pt = first(pm, "Point"), ln = first(pm, "LineString"), pg = first(pm, "Polygon");
      if (pt) {
        const aw = Object.keys(AWALAN).find(a => orig.startsWith(a));
        const ll = coords(pt)[0];
        if (!aw || !ll) continue;
        const k = KHUSUS[orig];
        out.titik.push({
          nama: k ? k.nama : (AWALAN[aw] + " " + bersih(orig.slice(aw.length))).trim(),
          jenis: AWALAN[aw], non: nonaktif(pm, "titik"), kep: yakin(orig), ll, catatan: k ? k.catatan : ""
        });
      } else if (ln || pg) {
        const pts = coords(ln || pg), lt = lintas(pm);
        if (pts.length < 2) continue;
        out.jalur.push({
          nama: pg ? (bersih(orig) || "Area") : (bersih(lt) || bersih(orig) || "Jalur"),
          non: nonaktif(pm, "jalur"), kep: terlemah(orig, lt), pts, area: !!pg
        });
      }
    }
    return out;
  }
  window.FrontlineParse = parseKml;

  const box = document.getElementById("frontline-map");
  if (!box) return;
  const SRC = box.dataset.src || "/data/Frontline_Project.kml";
  const sum = document.getElementById("frontline-sum");
  const LEAFLET = "https://unpkg.com/leaflet@1.9.4/dist/";
  const KET = { pasti: "Kepastian: pasti", kuat: "Kepastian: asumsi kuat (?)", lemah: "Kepastian: asumsi lemah (???)" };

  const css = document.createElement("style");
  css.textContent = "#frontline-map{position:relative;height:420px;margin:1rem 0 .5rem;border:1px solid var(--line);background:#0b0b0b;color:var(--mute);display:grid;place-items:center}" +
    "#frontline-map.fl-ready{display:block}#frontline-map.fl-full{position:fixed;inset:0;z-index:9999;height:100%;margin:0;border:0}" +
    ".fl-legend{background:rgba(0,0,0,.78);color:#f4f4f4;padding:.5rem .7rem;border-radius:4px;font:12px/1.6 system-ui,sans-serif}" +
    ".fl-legend i{display:inline-block;vertical-align:middle;margin-right:.45rem;box-sizing:border-box}" +
    ".fl-dot{width:11px;height:11px;border-radius:50%;border:2px solid}.fl-ln{width:18px;height:0;border-top:3px solid}" +
    ".fl-btn{background:#fff;color:#111;border:2px solid rgba(0,0,0,.3);border-radius:4px;padding:3px 8px;font:12px system-ui,sans-serif;cursor:pointer}" +
    ".leaflet-popup-content{color:#111;font:13px/1.5 system-ui,sans-serif}";
  document.head.append(css);
  box.textContent = "Memuat peta...";

  function muatLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise((ok, gagal) => {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = LEAFLET + "leaflet.css"; document.head.append(l);
      const s = document.createElement("script"); s.src = LEAFLET + "leaflet.js"; s.onload = ok; s.onerror = gagal; document.head.append(s);
    });
  }
  function popup(judul, baris, catatan) {
    const d = document.createElement("div");
    const b = document.createElement("b"); b.textContent = judul; d.append(b);
    for (const t of baris) { d.append(document.createElement("br"), document.createTextNode(t)); }
    if (catatan) { const c = document.createElement("div"); c.style.cssText = "margin-top:6px;max-width:230px"; c.textContent = catatan; d.append(c); }
    return d;
  }

  function build(xml) {
    const d = parseKml(xml);
    if (!d.titik.length && !d.jalur.length) throw new Error("kosong");
    box.textContent = ""; box.classList.add("fl-ready");
    const map = L.map(box, { renderer: L.canvas({ padding: .5, tolerance: 6 }) });
    const base = {
      "Peta gelap": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd", maxZoom: 19, attribution: "&copy; OpenStreetMap, &copy; CARTO" }),
      "OpenStreetMap": L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }),
      "Citra satelit": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "Tiles &copy; Esri" })
    };
    base["Peta gelap"].addTo(map);
    L.control.layers(base, null).addTo(map);
    const group = L.featureGroup().addTo(map);

    for (const j of d.jalur) { // garis digambar dulu agar titik berada di atasnya
      const w = j.non ? WARNA.jalurNonaktif : WARNA.aktif;
      const o = { color: w, weight: 3, opacity: j.kep === "lemah" ? .6 : .95, dashArray: j.kep === "pasti" ? null : j.kep === "kuat" ? "8 6" : "2 7" };
      const lay = j.area ? L.polygon(j.pts, { ...o, fillColor: w, fillOpacity: .12 }) : L.polyline(j.pts, o);
      lay.bindPopup(popup(j.nama, [(j.area ? "Area " : "Jalur ") + (j.non ? "nonaktif" : "aktif"), KET[j.kep]])).addTo(group);
    }
    for (const t of d.titik) {
      const w = t.non ? WARNA.titikNonaktif : WARNA.aktif;
      L.circleMarker(t.ll, { radius: 5, color: w, weight: 2, fillColor: w, fillOpacity: t.kep === "pasti" ? .95 : t.kep === "kuat" ? .12 : .05,
        opacity: t.kep === "lemah" ? .65 : 1, dashArray: t.kep === "lemah" ? "2 3" : null })
        .bindTooltip(t.nama, { direction: "top" })
        .bindPopup(popup(t.nama, [t.jenis + " " + (t.non ? "nonaktif" : "aktif"), KET[t.kep]], t.catatan)).addTo(group);
    }
    map.fitBounds(group.getBounds(), { padding: [20, 20] });

    const Legend = L.Control.extend({ options: { position: "bottomleft" }, onAdd() {
      const e = L.DomUtil.create("div", "fl-legend");
      e.innerHTML = '<div><i class="fl-dot" style="background:#fff;border-color:#fff"></i>Stasiun/halte aktif</div>' +
        '<div><i class="fl-dot" style="background:' + WARNA.titikNonaktif + ';border-color:' + WARNA.titikNonaktif + '"></i>Stasiun/halte nonaktif</div>' +
        '<div><i class="fl-ln" style="border-color:#fff"></i>Jalur aktif</div>' +
        '<div><i class="fl-ln" style="border-color:' + WARNA.jalurNonaktif + '"></i>Jalur nonaktif</div>' +
        '<div><i class="fl-dot" style="border-color:#fff"></i>Asumsi kuat (?)</div>' +
        '<div><i class="fl-dot" style="border:2px dotted #fff;opacity:.65"></i>Asumsi lemah (???)</div>';
      L.DomEvent.disableClickPropagation(e); return e;
    } });
    new Legend().addTo(map);

    let tombol;
    const Full = L.Control.extend({ options: { position: "topleft" }, onAdd() {
      tombol = L.DomUtil.create("button", "fl-btn"); tombol.type = "button"; tombol.textContent = "Layar penuh";
      L.DomEvent.on(tombol, "click", ev => { L.DomEvent.stop(ev); layarPenuh(); }); return tombol;
    } });
    new Full().addTo(map);
    function layarPenuh() {
      const on = box.classList.toggle("fl-full");
      tombol.textContent = on ? "Tutup" : "Layar penuh";
      document.documentElement.style.overflow = on ? "hidden" : "";
      map.invalidateSize();
    }
    document.addEventListener("keydown", e => { if (e.key === "Escape" && box.classList.contains("fl-full")) layarPenuh(); });

    if (sum) {
      const a = d.titik.filter(t => !t.non).length;
      const k = d.titik.filter(t => t.kep === "kuat").length, l = d.titik.filter(t => t.kep === "lemah").length;
      sum.textContent = `${d.titik.length} stasiun dan halte (${a} aktif, ${d.titik.length - a} nonaktif; ${k} asumsi kuat, ${l} asumsi lemah), ${d.jalur.filter(j => !j.area).length} jalur, ${d.jalur.filter(j => j.area).length} area.`;
    }
  }

  function mulai() {
    Promise.all([muatLeaflet(), fetch(SRC, { cache: "no-cache" }).then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })])
      .then(([, xml]) => build(xml))
      .catch(() => { box.textContent = "Peta belum bisa dimuat. Coba muat ulang halaman."; });
  }
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); mulai(); } }, { rootMargin: "300px" });
    io.observe(box);
  } else mulai();
})();
