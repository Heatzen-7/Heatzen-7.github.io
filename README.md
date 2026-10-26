# Heatzen-7.github.io

Situs pribadi Ikhsanudin Muhammad Nurzaini. Situs statis (HTML, CSS, sedikit JavaScript), tanpa framework.

## Struktur
- `index.html` : Homepage
- `cv/`, `projects/`, `photography/`, `anime-list/`, `manga-list/`, `pembahasan-anime/` : satu folder per halaman, isinya `index.html` (supaya alamatnya bersih, mis. `/cv`)
- `assets/css/style.css` : seluruh tampilan (warna ada di bagian `:root`)
- `assets/js/main.js` : daftar menu utama (ubah di satu tempat, berlaku di semua halaman)
- `assets/img/` : foto dan gambar

## Mengisi konten
Cari teks berwarna kuning `[...]` dan komentar `<!-- ... -->` di tiap file untuk petunjuk.

## Mencoba di komputer
Jalankan `python3 -m http.server 8000` di folder ini, lalu buka http://localhost:8000
(membuka file langsung dengan klik ganda tidak akan memuat menu dan gaya).

## Preview Instagram dan MyAnimeList
- Photography memakai embed profil Instagram `@htzarchive` (otomatis terbarui). Atur tinggi di `.igwrap iframe` pada `assets/css/style.css`.
- Anime dan Manga memakai `assets/js/mal.js` (Jikan API, username `Heatzen`). Daftar MAL harus publik. Menampilkan 12 pembaruan terakhir.
- Pembahasan Pribadi Anime memakai embed profil Instagram `@habisin_listz` (akun harus publik).

## Kontak dan menu
Daftar menu dan kontak (Email, LinkedIn, dst.) diatur di satu tempat: bagian PENGATURAN di `assets/js/main.js`. Perubahan berlaku di sidebar Homepage dan footer semua halaman.
