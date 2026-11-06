/* ==========================================================================
   Moments — Configuration & Data Helpers
   ========================================================================== */

// URL API eksternal (GitHub Gist / npoint.io) agar foto tidak tersimpan di repositori GitHub
const PHOTO_API_URL = 'https://gist.githubusercontent.com/ilhaammm18/5bec52221270d36ccfb6e56ca083d6f8/raw/b91f0d469661086e46a3437130bb1221fd19932f/photos.json';

// Nama bulan dalam bahasa Indonesia
const INDO_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// Helper Unsplash CDN URL
const IMG = (id, w = 500) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Konfigurasi Grid & Animasi Dinding
const WALL_CONFIG = {
  ROWS: 7,
  GAP: 12,
  BLEED: 24,            // Rows bleed sedikit melewati tepi atas & bawah
  HOVER_SCALE: 1.85,
  ACTIVE_SCALE: 2.4,
  CURSOR_R: 260,        // Radius pembelahan dinding di sekitar kursor
  HOVER_R: 440,         // Radius pembelahan di sekitar kartu yang di-hover
  LERP_POS: 0.1,
  LERP_INTRO: 0.055,    // Animasi gliding saat pertama kali masuk
  LERP_LEAVE: 0.06,
  LERP_SCALE: 0.12
};

// Ekstraksi tanggal cerdas dari nama file WhatsApp/kamera/metadata
function extractPhotoDate(url, index, item) {
  if (item && item.date && typeof item.date === 'string' && item.date.trim() !== '') {
    return item.date.trim();
  }
  if (typeof url === 'string') {
    // Format tanggal pada nama file WhatsApp atau kamera: YYYYMMDD atau YYYY-MM-DD
    const match = url.match(/(20\d\d)[-_]?(0[1-9]|1[0-2])[-_]?(0[1-9]|[12]\d|3[01])/);
    if (match) {
      const year = match[1];
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = match[3];
      return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
    }
  }
  // Fallback tanggal teratur jika tidak tertera tanggal di URL
  const day = String(((index * 7 + 3) % 28) + 1).padStart(2, '0');
  const monthIdx = (index * 4 + 2) % 12;
  const year = (item && item.year) || (2022 + (index % 5));
  return `${day} ${INDO_MONTHS[monthIdx]} ${year}`;
}

// Mendapatkan URL resolusi tinggi yang tajam & bebas blokir
function getHighResUrl(p) {
  if (!p) return '';
  if (p.highResUrl) return p.highResUrl;
  const rawUrl = p.rawUrl || p.url || '';
  if (rawUrl) {
    if (rawUrl.includes('ibb.co')) {
      // Sajikan dengan kualitas maksimal (q=95) dan tanpa pembesaran paksa (we=true) agar tidak blur
      return `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&output=webp&q=95&we=true`;
    }
    return rawUrl;
  }
  if (p.id) return IMG(p.id, 1200);
  return '';
}

// Data foto cadangan (fallback jika API belum/gagal dimuat)
let PHOTOS = [
  { cat: 'LANDSCAPE', title: 'Sleeping Giant', place: 'Dolomites, Italy', year: 2023, o: 'l', id: '1506905925346-21bda4d32df4' },
  { cat: 'ARCHITECTURE', title: 'Spiral', place: 'Vatican City', year: 2022, o: 'p', id: '1487958449943-2429e8be8625' },
  { cat: 'LANDSCAPE', title: 'Cold Country', place: 'Lofoten, Norway', year: 2021, o: 'l', id: '1464822759023-fed622ff2c3b' },
  { cat: 'LANDSCAPE', title: 'Granite Light', place: 'Yosemite, USA', year: 2022, o: 'l', id: '1506744038136-46273834b3fb' },
  { cat: 'NATURE', title: 'Emerald Hush', place: 'Black Forest, Germany', year: 2020, o: 'l', id: '1448375240586-882707db888b' },
  { cat: 'PORTRAIT', title: 'Stillness', place: 'Lisbon, Portugal', year: 2023, o: 'p', id: '1534528741775-53994a69daeb' },
  { cat: 'LANDSCAPE', title: 'Glass Water', place: 'Lago di Braies, Italy', year: 2022, o: 'l', id: '1501785888041-af3ef285b470' },
  { cat: 'LANDSCAPE', title: 'Blue Hour', place: 'Patagonia, Chile', year: 2021, o: 'l', id: '1519681393784-d120267933ba' },
  { cat: 'NATURE', title: 'Cathedral Pines', place: 'Oregon, USA', year: 2020, o: 'p', id: '1511497584788-876760111969' },
  { cat: 'LANDSCAPE', title: 'Rolling Mist', place: 'Tuscany, Italy', year: 2023, o: 'l', id: '1470071459604-3b5ec3a7fe05' },
  { cat: 'ARCHITECTURE', title: 'Monolith', place: 'Frankfurt, Germany', year: 2021, o: 'p', id: '1486406146926-c627a92ad1ab' },
  { cat: 'LANDSCAPE', title: 'Last Light', place: 'Banff, Canada', year: 2022, o: 'l', id: '1469474968028-56623f02e42e' },
  { cat: 'COASTAL', title: 'Northern Swell', place: 'Vík, Iceland', year: 2021, o: 'l', id: '1505118380757-91f5f5632de0' },
  { cat: 'PORTRAIT', title: 'Golden Hour', place: 'Bali, Indonesia', year: 2022, o: 'p', id: '1517841905240-472988babdf9' },
  { cat: 'LANDSCAPE', title: 'Moraine', place: 'Alberta, Canada', year: 2020, o: 'l', id: '1493246507139-91e8fad9978e' },
  { cat: 'NATURE', title: 'Footbridge', place: 'Kyoto, Japan', year: 2023, o: 'l', id: '1441974231531-c6227db76b6e' },
  { cat: 'LANDSCAPE', title: 'Silent Summit', place: 'Swiss Alps', year: 2021, o: 'l', id: '1454496522488-7a8e488e8606' },
  { cat: 'ARCHITECTURE', title: 'Grid City', place: 'Chicago, USA', year: 2022, o: 'l', id: '1477959858617-67f85cf4f1df' },
  { cat: 'LANDSCAPE', title: 'Valley Floor', place: 'Yosemite, USA', year: 2020, o: 'l', id: '1426604966848-d7adac402bff' },
  { cat: 'COASTAL', title: 'Turquoise', place: 'Faroe Islands', year: 2023, o: 'l', id: '1518837695005-2083093ee35b' },
  { cat: 'LANDSCAPE', title: 'Mirror Lake', place: 'Wanaka, New Zealand', year: 2022, o: 'l', id: '1439853949127-fa647821eba0' },
  { cat: 'NATURE', title: 'Wild Meadow', place: 'Provence, France', year: 2021, o: 'l', id: '1500530855697-b586d89ba3ee' },
  { cat: 'LANDSCAPE', title: 'Far Ridge', place: 'Scottish Highlands', year: 2023, o: 'l', id: '1472214103451-9374bd1c798e' },
  { cat: 'NATURE', title: 'Veil Falls', place: 'Skógafoss, Iceland', year: 2020, o: 'p', id: '1433086966358-54859d0ed716' },
];

PHOTOS.forEach((p, i) => {
  p.photoIndex = i;
  p.momentNumber = i + 1;
  p.dateFormatted = extractPhotoDate(p.url || '', i, p);
  p.highResUrl = p.id ? IMG(p.id, 1200) : p.url;
});

