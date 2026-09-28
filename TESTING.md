# MAXI MOBILE — Panduan Pengujian (Phase 7)

Tiga lapis pengujian, dari yang paling cepat ke paling menyeluruh. Lakukan berurutan — lapis 1 dan 2 menangkap sebagian besar masalah sebelum Anda repot mengeklik satu per satu di lapis 3.

## Lapis 1 — Otomatis, terhadap backend tiruan (sudah dilakukan)

```
node test/run.js
```

150 skenario (login/lockout, presensi, cuti/izin/lembur, approval, admin, Settings) sudah lulus terhadap Apps Script tiruan. Ini menguji **logika** backend, bukan Google/GitHub sungguhan. Jalankan lagi setiap kali Anda mengubah isi `backend/*.gs`.

## Lapis 2 — Otomatis, terhadap backend yang SUDAH DI-DEPLOY

Setelah Web App Apps Script di-deploy (lihat `DEPLOY.md`), uji dari komputer Anda (bukan dari sini — lingkungan ini tidak punya akses ke `script.google.com`):

```
node test/live-check.js https://script.google.com/macros/s/XXXX/exec admin@example.com PasswordAnda
```

Pakai akun uji, bukan akun yang sedang dipakai orang lain (skrip ini logout di akhir). Mengecek: API hidup, login benar/salah, token acak ditolak, action tak dikenal ditolak, logout benar-benar mencabut sesi. Kalau semua lulus, backend Anda sudah bisa diajak bicara oleh frontend.

## Lapis 3 — Manual, di browser sungguhan

Ini yang tidak bisa digantikan skrip: tampilan, alur klik, dan perilaku di HP. Gunakan akun uji sungguhan (buat lewat `admin.employees.create`, bukan `seedDummyData`) untuk salah satu Employee, satu Manager, satu Admin/HR yang berhubungan atasan-bawahan.

### 3.1 Umum (semua halaman)

- [ ] Buka di Chrome & Safari desktop, dan minimal satu browser HP (Chrome Android atau Safari iOS)
- [ ] Lebar layar kecil (~360px): sidebar jadi drawer, tombol menu (☰) berfungsi, konten tidak melebar ke samping
- [ ] Buka Console browser (F12) → tidak ada error merah, terutama pelanggaran CSP (`Content-Security-Policy`) atau `Failed to fetch`
- [ ] Logo MAXICON tampil bersih di login, header, dan sidebar (bukan pecah/blur)
- [ ] Tab keyboard berjalan wajar dan terlihat jelas dot fokusnya di semua elemen interaktif

### 3.2 Login & sesi

- [ ] Email/password salah → pesan "Email atau password salah", bukan detail teknis
- [ ] 5x salah berturut-turut → pesan akun terkunci sementara
- [ ] Login benar dengan akun **baru** (belum pernah ganti password) → diarahkan ke halaman Ganti Password, tidak bisa lompat ke Dashboard lewat URL langsung
- [ ] Setelah ganti password → masuk ke Dashboard
- [ ] Centang "Tetap masuk" → tutup tab, buka lagi → masih login. Tanpa centang → tutup **browser sepenuhnya**, buka lagi → diminta login lagi
- [ ] Klik Keluar → kembali ke halaman login. Tekan tombol **Back** di browser → tidak menampilkan Dashboard yang lama (harus redirect ke login)
- [ ] Buka salah satu halaman dalam (`dashboard.html`, dll.) langsung lewat URL tanpa login → dilempar ke login, bukan menampilkan halaman kosong/error

### 3.3 Presensi (role Employee, ulangi untuk Manager)

- [ ] Sebelum Clock In: tombol Clock In aktif, Clock Out nonaktif
- [ ] Clock In → jam yang tercatat sama dengan jam saat itu (bukan jam yang bisa diubah dari device)
- [ ] Setelah Clock In: tombol Clock In nonaktif, Clock Out aktif
- [ ] Clock Out → tercatat, kedua tombol nonaktif setelahnya
- [ ] Riwayat bulan berjalan menampilkan baris hari ini
- [ ] Ganti ke bulan lain di dropdown bulan → riwayat berganti
- [ ] *(Perlu koordinasi jam, atau uji lewat `live-check` tambahan)*: coba Clock In pada hari Minggu / hari libur yang sudah didaftarkan di sheet Holidays → ditolak dengan pesan yang jelas

### 3.4 Cuti / Izin / Lembur (role Employee)

- [ ] Halaman Cuti menampilkan saldo, yang menunggu persetujuan, dan yang tersedia — dan berubah setelah submit
- [ ] Ajukan cuti pada rentang yang tumpang tindih dengan pengajuan yang sudah ada → ditolak (`OVERLAP`)
- [ ] Ajukan cuti melebihi saldo tersedia → ditolak (`INSUFFICIENT_BALANCE`)
- [ ] Ajukan izin per jam (isi jam mulai & selesai) dan izin sehari penuh (kosongkan jam) — dua-duanya berhasil
- [ ] Ajukan lembur dengan jam selesai sebelum jam mulai → ditolak dengan pesan jelas, bukan diam saja
- [ ] Riwayat menampilkan status Pending, lalu berubah ke Approved/Rejected setelah diproses atasan (lanjutkan ke 3.5 lalu kembali ke sini)
- [ ] Jika ditolak: catatan atasan tampil di riwayat

### 3.5 Approval (role Manager, lalu Admin)

- [ ] Manager hanya melihat pengajuan bawahan langsungnya, bukan seluruh perusahaan
- [ ] Admin melihat semua pengajuan Pending
- [ ] Tombol Reject meminta alasan (dibatalkan jika alasan dikosongkan)
- [ ] Approve cuti → saldo karyawan yang bersangkutan langsung berkurang (cek di halaman Karyawan atau dashboard karyawan itu)
- [ ] Coba proses ulang pengajuan yang sudah diputuskan (refresh lalu klik lagi jika ada bekas tombol) → seharusnya tidak bisa (tervalidasi di server)
- [ ] Ganti filter status ke Approved/Rejected/Semua → daftar berubah sesuai

### 3.6 Admin/HR — Karyawan, Hari Libur, Pengaturan, Presensi tim

- [ ] Tambah karyawan baru → dapat password sementara yang **tampil sekali** (screenshot/salin sebelum menutup notifikasi)
- [ ] Login dengan akun baru itu → dipaksa ganti password
- [ ] Ubah atasan seorang karyawan menjadi bawahannya sendiri (buat lingkaran) → ditolak
- [ ] Nonaktifkan karyawan yang masih menjadi atasan aktif bagi orang lain → ditolak dengan pesan jelas
- [ ] Reset password seorang karyawan → sesi lamanya langsung tidak berlaku (kalau bisa, uji di browser/perangkat lain yang sedang login sebagai karyawan tsb.)
- [ ] Tambah hari libur pada tanggal yang sudah ada hari libur aktif → ditolak
- [ ] Ubah `late_tolerance_minutes` di halaman Pengaturan → coba Clock In di sekitar ambang waktu itu dan lihat status Present/Late berubah sesuai
- [ ] Jalankan **pratinjau** pergantian tahun cuti → tidak mengubah data (cek saldo karyawan tidak berubah). Baru setelah itu klik Terapkan bila memang ingin menjalankannya
- [ ] Presensi tim: ubah rentang tanggal, pastikan Admin melihat semua orang dan Manager hanya bawahannya
- [ ] Koreksi presensi (mis. isi Clock Out yang lupa) tanpa mengisi alasan → ditolak; dengan alasan → tersimpan dan muncul di Aktivitas karyawan yang bersangkutan

### 3.7 Kasus tepi & keamanan

- [ ] Coba akses halaman Admin (`employees.html`, `settings.html`, dll.) sambil login sebagai Employee, lewat mengetik URL langsung → dilempar ke Dashboard, bukan menampilkan data
- [ ] Sambil DevTools terbuka, lihat tab Network saat memakai aplikasi → tidak ada Spreadsheet ID, password, atau token pihak lain yang terlihat di request/response selain milik sesi sendiri
- [ ] Buka aplikasi di dua tab berbeda dengan dua akun berbeda → tidak saling tertukar data (masing-masing tab pakai sesi sendiri karena disimpan per-tab di `sessionStorage`, kecuali kalau memilih "Tetap masuk")

## Pra go-live (sebelum dipakai karyawan sungguhan)

- [ ] Hapus/nonaktifkan data dummy (`seedDummyData`) dari Spreadsheet **produksi** — jalankan itu hanya di Spreadsheet uji terpisah kalau masih perlu
- [ ] Hapus `FIRST_ADMIN_NAME` / `FIRST_ADMIN_EMAIL` dari Script Properties (lihat README backend bagian 3)
- [ ] Isi sheet Holidays untuk tahun berjalan (hari libur nasional & cuti bersama sebenarnya)
- [ ] Tinjau semua nilai di halaman Pengaturan (jam kerja, toleransi telat, jatah cuti, carry-over) — ini yang menentukan bagaimana sistem berjalan sehari-hari
- [ ] Pastikan setiap karyawan sungguhan sudah punya `supervisor_id` yang benar, supaya pengajuan mereka punya penyetuju
- [ ] Sampaikan password sementara ke setiap karyawan lewat jalur yang aman (langsung/chat pribadi), bukan email massal atau grup
