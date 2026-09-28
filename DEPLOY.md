# MAXI MOBILE — Panduan Deploy ke GitHub Pages (Phase 7)

Repo resmi: `rizkimaxicon-svg/maxi-mobile-powered-by-rz`, branch `main`. Jangan buat repo baru.

## 1. Prasyarat

- Backend Phase 2 sudah di-deploy sebagai Web App dan Anda punya URL yang berakhiran `/exec` (lihat `backend/README.md` bagian 3 & 10 kalau belum).
- Semua file Phase 3–6 (folder `assets/`, `employee/`, `client/`, `index.html`, dan sekarang `TESTING.md`, `DEPLOY.md`, `404.html`, `test/live-check.js`) sudah ada di working copy lokal Anda.

## 2. Sambungkan frontend ke backend

Buka `assets/js/config.js`, isi `API_URL`:

```js
window.MAXI_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/XXXXXXXXXXXX/exec',
  ...
};
```

Begitu `API_URL` terisi, mode demo (`USE_MOCK`) otomatis tidak aktif — Anda tidak perlu mengubah baris itu. Simpan file.

## 3. Commit & push ke GitHub

Dari Google Antigravity (atau terminal biasa):

```
git add .
git commit -m "Phase 7: hubungkan ke backend, tambah testing & deploy guide"
git push origin main
```

## 4. Aktifkan GitHub Pages

1. Buka repo di github.com → **Settings** → **Pages** (menu kiri).
2. **Build and deployment → Source**: pilih **Deploy from a branch**.
3. **Branch**: `main`, folder **/(root)** → **Save**.
4. Tunggu 1–2 menit. GitHub akan menampilkan URL situs, biasanya:
   `https://rizkimaxicon-svg.github.io/maxi-mobile-powered-by-rz/`
5. Buka URL itu → halaman pemilih portal (Employee / Client) harus tampil.

## 5. Uji setelah live

1. Jalankan pengujian otomatis terhadap backend yang sudah live (lihat `TESTING.md` Lapis 2):
   ```
   node test/live-check.js https://script.google.com/macros/s/XXXX/exec admin@example.com PasswordAnda
   ```
2. Buka `…/employee/login.html` dari domain GitHub Pages (bukan dibuka sebagai file lokal — Apps Script akan menolak origin `file://` karena bukan HTTPS) dan login sungguhan.
3. Ikuti checklist manual di `TESTING.md` Lapis 3.

**Jika Console browser menunjukkan error CSP** (`Refused to connect...`): berarti domain Apps Script berubah dari yang diasumsikan. Cek `<meta http-equiv="Content-Security-Policy">` di setiap file HTML — nilainya sudah mengizinkan `script.google.com` dan `script.googleusercontent.com`; kalau Google mengarahkan ke domain lain, tambahkan ke daftar `connect-src` di semua file HTML.

## 6. Setiap kali ada perubahan berikutnya

- **Ubah frontend saja** (HTML/CSS/JS): `git push` seperti biasa. GitHub Pages otomatis build ulang dalam 1–2 menit. Jika perubahan belum terlihat, hard refresh (Ctrl/Cmd+Shift+R) — CDN GitHub Pages kadang menyimpan cache sebentar.
- **Ubah backend** (`backend/*.gs`): edit di script.google.com, lalu **Deploy → Manage deployments → ikon pensil → Version: New version → Deploy**. URL `/exec` tidak berubah, jadi `config.js` tidak perlu diubah.

## 7. Rencana jika ada masalah setelah deploy

- **Frontend bermasalah**: `git revert <commit>` lalu push, atau perbaiki langsung dan push lagi — GitHub Pages akan membangun ulang otomatis.
- **Backend bermasalah**: di **Manage deployments**, Anda bisa melihat riwayat versi. Buat versi baru yang memperbaiki masalah (Apps Script tidak punya "rollback" satu klik, jadi cara amannya adalah selalu uji dengan `test/run.js` sebelum men-deploy versi baru).
- Kalau situasinya darurat (mis. ada bug keamanan): set `access` di **Manage deployments** untuk deployment itu, atau nonaktifkan sementara lewat Script Properties (misalnya tambahkan flag `MAINTENANCE = TRUE` yang dicek di `doPost` — belum ada di kode saat ini, beri tahu saya bila mau ditambahkan).

## 8. Sebelum mengumumkan ke karyawan

Selesaikan dulu daftar **"Pra go-live"** di `TESTING.md`, khususnya: hapus data dummy dari Spreadsheet produksi, hapus `FIRST_ADMIN_*` dari Script Properties, isi Holidays tahun berjalan, dan pastikan 2FA aktif di akun `rizki.maxicon@gmail.com`.

## 9. Domain kustom (opsional, lewati kalau tidak perlu sekarang)

GitHub Pages mendukung domain sendiri (mis. `portal.perusahaananda.com`) lewat file `CNAME` di root repo dan pengaturan DNS CNAME/ALIAS di penyedia domain Anda. Karena ini belum diminta, langkah ini dilewati — beri tahu saya kapan pun jika ingin ditambahkan.
