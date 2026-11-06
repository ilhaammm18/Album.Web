# Moments — An Interactive Photography Wall

Sebuah galeri foto interaktif modern bertema minimalis (*clean dark aesthetic*) yang bergerak dinamis (*living mosaic*). Dinding foto mengalir secara mulus ke kanan dan kiri, membelah saat kursor melintas, serta menyediakan mode fokus tengah (*lightbox view*) yang tajam, elegan, dan responsif.

![Moments Preview](assets/favicon.svg)

---

## ✨ Fitur Utama

- **🌊 Dynamic Floating Wall (Gerakan Halus & Ringan):**
  - Menggunakan algoritma *linear translation* terpisah dengan *elastic spring lerp*, menghasilkan animasi 60–120 FPS tanpa lag atau getaran (*stutter*).
  - Trik pembelahan kursor (*cursor repulsion physics*) yang membuka ruang secara dinamis di sekitar kursor mouse pengunjung.
- **🔍 Clean Centre Focus View (Lightbox Minimalis):**
  - Mengklik kartu foto akan menampilkan foto dalam ukuran besar dan tajam di tengah layar.
  - Teks `"Momen #<nomor_urut>"` di atas foto dengan tipografi serif elegan (*Instrument Serif*).
  - Tanggal momen berformat bahasa Indonesia (*contoh: 27 September 2025*) di bawah foto, diekstrak otomatis dari nama berkas atau metadata.
  - Kartu-kartu di latar belakang otomatis diredupkan dengan efek *soft blur* (`opacity-30 blur-[2px]`).
- **🎯 Navigasi Lengkap & Cepat:**
  - Tombol interaktif `<` (sebelumnya) dan `>` (berikutnya) di sisi kiri dan kanan layar.
  - **Dukungan Keyboard:** Tombol panah Kiri (`←`) dan Kanan (`→`) untuk berpindah foto, serta tombol `Escape` untuk menutup fokus.
  - **Dukungan Sentuh (*Touch Swipe*):** Di layar HP / tablet, pengguna dapat menggeser foto ke kiri atau ke kanan untuk berpindah momen.
  - Tombol tutup **`✕`** elegan di pojok kanan atas bingkai foto.
- **⚡ Bebas Blokir ISP & Konversi WebP Otomatis:**
  - Mengintegrasikan Cloudflare CDN proxy (`wsrv.nl`) untuk melewati pemblokiran internet positif pada host gambar seperti ImgBB, sekaligus otomatis menyajikan gambar berformat WebP berkualitas tinggi.
- **📱 Responsif & Ringan:**
  - Desain adaptif untuk semua resolusi (Desktop 4K/1080p, Tablet, hingga Smartphone).
  - Tanpa dependensi berat (*Vanilla JavaScript & Tailwind CSS*).

---

## 📁 Struktur Direktori Proyek

Proyek ini telah distrukturisasi dengan rapi dan modular:

```text
Album.Web/
├── assets/
│   └── favicon.svg       # Favicon SVG modern (kamera & aperture)
├── css/
│   └── style.css         # Custom styling, animasi drift, dan transisi modal
├── js/
│   ├── config.js         # Pengaturan URL API Gist, data fallback, dan helper tanggal
│   └── app.js            # Engine dinding foto, fisika partisi, dan modal lightbox
├── .gitignore            # File pengecualian git (OS, cache, editor)
├── index.html            # Kerangka semantik HTML & metadata OpenGraph
└── README.md             # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan

1. **Jalankan Secara Lokal:**
   - Cukup klik dua kali (*double click*) pada berkas `index.html`, atau buka melalui browser apa pun (Google Chrome, Microsoft Edge, Firefox, Safari).
   - Atau jalankan dengan ekstensi *Live Server* di VS Code jika diinginkan.

2. **Memperbarui Foto Galeri:**
   - Foto dapat diperbarui secara langsung melalui tautan GitHub Gist yang terdaftar di `js/config.js` (`PHOTO_API_URL`).
   - Format file JSON di Gist dapat berupa array string URL gambar:
     ```json
     [
       "https://i.ibb.co/.../foto1.jpg",
       "https://i.ibb.co/.../foto2.jpg"
     ]
     ```
   - Galeri akan otomatis mengambil dan memperbarui foto secara instan tanpa perlu mengubah berkas kode utama.

---

## 🌐 Cara Publikasi / Deploy (Gratis)

Website ini adalah situs statis murni sehingga sangat mudah di-online-kan secara gratis:

1. **Vercel / Netlify:**
   - Buat akun di [Vercel](https://vercel.com/) atau [Netlify](https://www.netlify.com/).
   - Hubungkan repositori GitHub proyek ini, lalu klik **Deploy**. Website akan langsung aktif dengan domain HTTPS gratis (contoh: `moments-gallery.vercel.app`).
2. **GitHub Pages:**
   - Masuk ke repositori GitHub Anda di menu **Settings** > **Pages**.
   - Pilih *Source*: `Deploy from a branch` (branch `main`), lalu simpan. Dalam hitungan detik web Anda sudah aktif di internet!

---

## 🛠️ Teknologi yang Digunakan

- **HTML5 & Semantic Markup**
- **Tailwind CSS (CDN)** untuk styling utilitas cepat & konsisten
- **Custom CSS** untuk fisika transisi dan efek *backdrop blur*
- **Vanilla JavaScript (ES6+)** untuk mesin fisika kartu, penanganan interaksi kursor, dan mode lightbox
- **Cloudflare Images Proxy (wsrv.nl)** untuk akselerasi WebP dan CDN caching
- **Google Fonts:** *Instrument Serif* (Header Display) & *Inter* (UI Text)

