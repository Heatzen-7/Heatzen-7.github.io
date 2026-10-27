// Membuat data/updates.json dari riwayat perubahan (git log) untuk "Latest Updates" di Homepage.
// Dijalankan otomatis oleh GitHub Actions (lihat workflow update-latest.yml).
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

// ===== PENGATURAN =====
// Setiap kali file atau folder di "path" ini berubah, muncul satu pembaruan di Homepage.
const SUMBER = [
  { path: "data/Frontline_Project.kml", kategori: "Projects", judul: "Peta Frontline diperbarui", url: "/projects/" },
  { path: "projects", kategori: "Projects", judul: "Halaman Projects diperbarui", url: "/projects/" },
  { path: "assets/pdf", kategori: "Projects", judul: "PDF baru ditambahkan", url: "/projects/" },
  { path: "cv", kategori: "CV", judul: "Halaman CV diperbarui", url: "/cv/" },
  { path: "assets/cv-ikhsanudin.pdf", kategori: "CV", judul: "File PDF CV diperbarui", url: "/cv/" },
  { path: "data/mal.json", kategori: "Anime", judul: "Daftar anime dan manga diperbarui", url: "/anime-list/" }
];
// ===== selesai =====

// Pesan bawaan GitHub tidak dijadikan ringkasan. Pesan yang Anda tulis sendiri saat "Commit changes" akan tampil.
const BAWAAN = /^(Add files via upload|Update |Create |Delete |Rename |Merge |Upload )/i;
const lihat = new Set(), items = [];
for (const s of SUMBER) {
  const out = execFileSync("git", ["log", "-1", "--format=%H%x1f%cI%x1f%s", "--", s.path], { encoding: "utf8" }).trim();
  if (!out) continue;
  const [sha, tanggal, pesan] = out.split("\x1f");
  if (lihat.has(sha)) continue; // satu commit = satu pembaruan
  lihat.add(sha);
  items.push({ sha, tanggal, kategori: s.kategori, judul: s.judul, url: s.url, ringkasan: BAWAAN.test(pesan) ? "" : pesan });
}
items.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
await mkdir("data", { recursive: true });
await writeFile("data/updates.json", JSON.stringify({ items }, null, 1) + "\n");
console.log(`OK: ${items.length} pembaruan`);
