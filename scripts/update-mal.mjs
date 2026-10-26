// Mengambil pembaruan terakhir dari daftar MyAnimeList lewat API resmi MAL,
// lalu menyimpannya ke data/mal.json (dibaca oleh halaman Anime dan Manga).
// Dijalankan otomatis oleh GitHub Actions (lihat scripts/update-mal.workflow.yml).
import { mkdir, writeFile } from "node:fs/promises";

const USER = process.env.MAL_USERNAME || "Heatzen";
const CLIENT_ID = process.env.MAL_CLIENT_ID;
const LIMIT = 12; // jumlah entri per daftar
if (!CLIENT_ID) { console.error("MAL_CLIENT_ID belum diatur. Lihat panduan: buat secret bernama MAL_CLIENT_ID."); process.exit(1); }

async function fetchList(kind) {
  const fields = kind === "anime" ? "list_status,num_episodes" : "list_status,num_chapters";
  // Judul dewasa (NSFW) sengaja tidak disertakan (perilaku bawaan MAL).
  const url = `https://api.myanimelist.net/v2/users/${encodeURIComponent(USER)}/${kind}list?fields=${fields}&sort=list_updated_at&limit=${LIMIT}`;
  const r = await fetch(url, { headers: { "X-MAL-CLIENT-ID": CLIENT_ID } });
  if (!r.ok) throw new Error(`${kind}: HTTP ${r.status} ${await r.text()}`);
  const { data } = await r.json();
  return data.map(({ node, list_status: s }) => ({
    id: node.id,
    title: node.title,
    image: (node.main_picture && node.main_picture.medium) || "",
    url: `https://myanimelist.net/${kind}/${node.id}`,
    status: s.status,
    score: s.score || 0,
    progress: kind === "anime" ? s.num_episodes_watched : s.num_chapters_read,
    total: (kind === "anime" ? node.num_episodes : node.num_chapters) || 0
  }));
}

const out = { anime: await fetchList("anime"), manga: await fetchList("manga") };
await mkdir("data", { recursive: true });
await writeFile("data/mal.json", JSON.stringify(out, null, 1) + "\n");
console.log(`OK: ${out.anime.length} anime, ${out.manga.length} manga`);
