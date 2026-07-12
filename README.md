# Prokesra Tagihan

Project ini adalah aplikasi Google Apps Script yang digunakan untuk membantu proses verifikasi, simulasi, dan pelacakan tagihan di Google Sheets. Fokus utamanya adalah mempermudah pemeriksaan data debitur, perhitungan subsidi, serta menampilkan riwayat tagihan melalui dialog UI.

## Tujuan Proyek

Proyek ini menyediakan fitur-fitur berikut:

- Menyediakan menu di Google Sheets untuk verifikasi tagihan
- Menampilkan dialog verifikasi dan hasil verifikasi
- Menjalankan simulasi tagihan berdasarkan data debitur
- Menampilkan riwayat pembayaran/angsuran debitur
- Mengolah data tagihan dari sumber spreadsheet dan menyusunnya ke sheet hasil

## Struktur Folder

```text
.
├── appsscript.json          # Konfigurasi project Google Apps Script
├── Code.js                  # Entry point utama, menu UI, dan logika utama
├── DialogVerif.html         # Template HTML untuk dialog verifikasi tagihan
├── DialogVerifResult.html  # Template HTML untuk hasil verifikasi
├── ui/
│   └── DialogDebtorHistory.html  # Template HTML untuk riwayat debitur
└── utils/
    ├── index.js             # Helper umum seperti parse tanggal/angka
    ├── spreadsheet.js       # Mapping kolom dan helper spreadsheet
    ├── tagihan-installment.js  # Logika cek angsuran dan realisasi tagihan
    ├── tagihan-schedule.js     # Generator schedule angsuran/tagihan
    └── tagihan-simulation.js   # Logika simulasi tagihan debitur
```

### Penjelasan singkat tiap bagian

- `Code.js`
  - Berisi fungsi utama yang dipanggil dari menu Apps Script.
  - Menangani pembuatan dialog, pemrosesan data, dan workflow verifikasi.

- `DialogVerif.html` dan `DialogVerifResult.html`
  - File HTML untuk UI modal dialog yang dipakai dari Apps Script.

- `ui/`
  - Berisi template UI tambahan, terutama untuk tampilan riwayat debitur.

- `utils/`
  - Berisi helper modular agar logika utama tidak terlalu padat.
  - Setiap file fokus pada satu domain tertentu.

## Fitur Berdasarkan Menu

Menu yang tersedia di Google Sheets dibuat dari fungsi `onOpen()` di [Code.js](Code.js). Berikut penjelasan tiap item:

- `Verif Tagihan`
  - Membuka dialog verifikasi tagihan.
  - Memungkinkan pengguna memeriksa data tagihan per bulan tertentu.
  - Menjalankan proses validasi dan menyiapkan hasil verifikasi.

- `Verif Terakhir`
  - Menampilkan hasil verifikasi terakhir yang tersimpan.
  - Berguna untuk melihat ringkasan status, jumlah debitur, dan nilai subsidi yang teridentifikasi.

- `Lihat Riwayat Debitur`
  - Menampilkan riwayat tagihan/debitur berdasarkan baris yang dipilih di sheet aktif.
  - Menampilkan informasi utama debitur serta data angsuran/realization terkait.

- `Lihat Rekapitulasi`
  - Menyediakan akses ke tampilan rekapitulasi tagihan.
  - Biasanya dipakai untuk melihat ringkasan data yang lebih luas dari hasil proses.

## Setup Clasp

Proyek ini menggunakan Google Apps Script dan `clasp` untuk sinkronisasi file lokal dengan script project di Google Apps Editor.

### Prasyarat

- Node.js terinstall di komputer
- Akun Google yang memiliki akses ke project Apps Script
- `clasp` terinstall secara global

### Instalasi clasp

```bash
npm install -g @google/clasp
```

### Login ke Google

```bash
clasp login
```

### Pull project dari Apps Script

```bash
clasp pull
```

### Push perubahan ke Apps Script

```bash
clasp push
```

### Jalankan project lokal

Setelah script terhubung, Anda bisa mengedit file di workspace ini lalu mengunggah perubahan dengan:

```bash
clasp push
```

> Jika project belum pernah dikaitkan, Anda bisa membuat script project terlebih dahulu lalu gunakan `clasp create` sesuai kebutuhan.

## Konvensi Kode

Proyek ini menggunakan gaya penulisan sederhana yang sesuai dengan Google Apps Script.

### Penamaan

- Gunakan `camelCase` untuk fungsi dan variabel, misalnya `dialogVerif`, `parseDate`, `sourceDataColumn`.
- Gunakan `UPPER_SNAKE_CASE` untuk konstanta global, misalnya `DEFAULT_PERIOD_YEAR`, `DEFAULT_RATE_SUBSIDI`.
- Fungsi helper internal yang bersifat privat menggunakan awalan underscore, misalnya `_getColumnIndex`, `_remapColumnIndex`.

### Gaya penulisan

- Gunakan `function` declaration, bukan arrow function, agar konsisten dengan pola Apps Script.
- Gunakan `const` untuk nilai tetap dan `let` hanya saat nilainya memang berubah.
- Nama fungsi cenderung mengacu pada domain bisnis, misalnya `verifTagihan`, `dialogDebtorHistory`, `simulateTagihan`.
- Karena proyek ini berhubungan dengan data spreadsheet bisnis, nama kolom dan label UI sering menggunakan istilah Indonesia.

### Struktur logika

- Pisahkan logika bisnis ke dalam file `utils/` agar `Code.js` tetap lebih ringkas.
- Hindari logika yang terlalu panjang di satu fungsi; bagi ke helper yang lebih spesifik.
- Komentar boleh digunakan untuk menjelaskan aturan bisnis yang kompleks.

## Pengembangan Lokal

Untuk mengembangkan dan mengunggah perubahan ke Apps Script, biasanya digunakan `clasp`.

Contoh alur:

```bash
clasp pull
clasp push
```

Pastikan file `.clasp.json` sudah terkonfigurasi dengan benar sebelum melakukan push.

## Catatan

- Proyek ini berbasis Google Apps Script, bukan framework frontend biasa.
- Tidak ada bundler atau build step seperti React/Vite; file-file `.js` dan `.html` langsung dipakai oleh project Apps Script.
- Saat menambahkan fitur baru, usahakan tetap menjaga pemisahan antara logika bisnis, helper, dan UI.
