// Latest Updates di Homepage: gabungan otomatis (data/updates.json, dibuat GitHub Actions) dan catatan manual.
(() => {
  // ===== PENGATURAN =====
  const JUMLAH = 5; // jumlah pembaruan yang ditampilkan
  // Pembaruan manual, untuk hal yang tidak bisa dilacak otomatis (mis. foto baru di Instagram).
  // Hapus tanda // di depan baris contoh, lalu isi. Format tanggal: TAHUN-BULAN-TANGGAL.
  const MANUAL = [
    // { tanggal: "2026-10-27", kategori: "Photography", judul: "Foto baru di Photography", ringkasan: "", url: "/photography/" },
  ];
  // ===== selesai =====

  const box = document.getElementById("updates");
  if (!box) return;
  const fmt = iso => new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  function kartu(u) {
    const a = document.createElement("article"); a.className = "update";
    const m = document.createElement("p"); m.className = "meta";
    const b = document.createElement("b"); b.textContent = u.kategori;
    m.append(fmt(u.tanggal) + " · ", b);
    const h = document.createElement("h3"), l = document.createElement("a"); l.href = u.url; l.textContent = u.judul; h.append(l);
    a.append(m, h);
    if (u.ringkasan) { const p = document.createElement("p"); p.textContent = u.ringkasan; a.append(p); }
    return a;
  }

  fetch("/data/updates.json", { cache: "no-cache" })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => d.items || [])
    .catch(() => [])
    .then(auto => {
      const manual = MANUAL.map(x => ({ ...x, tanggal: x.tanggal + "T00:00:00" }));
      const semua = [...auto, ...manual].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)).slice(0, JUMLAH);
      if (!semua.length) { box.innerHTML = '<p class="meta">Belum ada pembaruan.</p>'; return; }
      box.replaceChildren(...semua.map(kartu));
    });
})();
