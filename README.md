# Tuntas

Kanban + kalender proyek klien untuk UMKM, dengan AI yang memecah cerita proyek menjadi tugas. Tanggal dihitung mundur dari deadline klien, Minggu dan hari libur dilewati, dan selalu ada cadangan waktu.

Dibuat dari PRD **“PRD Ringkas — Tuntas” v0.1 (6 Nov 2026)**.

## Jalankan

```bash
npm install
npm run dev
```

Buka <http://localhost:3000>. Kalau port 3000 sedang dipakai:

```bash
npm run dev -- -p 3100
```

Build produksi:

```bash
npm run build
npm start
```

## Tampilan publik

Halaman utama di `/` adalah landing page publik dengan animasi (hero board, marquee, reveal saat scroll, counter, hover cards), pilihan bahasa **ID/EN**, dan tombol **Coba demo** yang langsung masuk ke akun contoh. Logo baru diekstrak dari gambar yang diberikan: ikon transparan dan wordmark cream/cokelat tersedia di `public/brand/`, lalu dipakai di landing, login, sidebar, serta favicon. Versi SVG juga disimpan sebagai aset alternatif.

## Akun demo

| | |
| --- | --- |
| Email | `demo@tuntas.id` |
| Password | `demo123` |

Di halaman login ada tombol **“Masuk dengan akun demo”** yang langsung membuka ruang kerja contoh.

Akun demo berisi:

- **4 proyek** (patung kuda, nasi kotak katering, relief garuda, ukiran pintu)
- **47 tugas** dengan status, tanggal, penanggung jawab, dan ketergantungan
- Kalender dengan hari libur, hari cadangan, dan deadline klien
- Peringatan tugas terlambat + draf pesan WhatsApp
- Halaman **Hari ini** dengan tugas per orang

## Fitur yang sudah jalan

- **Landing page ID/EN** — pilihan bahasa Indonesia/Inggris di header landing, tersimpan di `localStorage` + cookie
- **Buat proyek** — form cerita proyek, **Modal proyek**, rekam suara (Web Speech API), tempel chat WA, lampiran foto/PDF
- **Pertanyaan AI** — maksimal 3 pertanyaan pilihan ganda sebelum menyusun rencana
- **Draf rencana** — tahap, tugas, durasi, ketergantungan, PJ, risiko; bisa diedit, dihapus, ditambah sebelum diterapkan
- **Penjadwalan mundur** — Minggu selalu libur, hari libur nasional/Bali/ditambahkan sendiri dilewati, cadangan 10% durasi (minimal 1 hari kerja)
- **Kanban** — kolom Belum mulai · Sedang dikerjakan · Menunggu klien · Selesai, drag & drop, tersimpan langsung
- **Deskripsi progres** — setiap tugas bisa punya update singkat; tampil di kartu, detail tugas, dan ringkasan **Progres tahap**
- **Prioritas proyek** — urutan pengerjaan berdasarkan deadline, sisa durasi, progres, dan cadangan; AI memberi rekomendasi pembagian tim saat ada deadline bertabrakan
- **Kalender** — tampilan bulanan/timeline, warna per tahap, deadline klien, hari cadangan, hari libur, opsi menampilkan proyek lain; ada agenda khusus mobile
- **Hari ini** — tugas per orang dengan centang selesai, deadline terdekat, jadwal besok
- **Klien** — daftar klien otomatis dari proyek, tautan WhatsApp
- **Peringatan** — banner tugas terlambat atau cadangan tinggal 1 hari, tombol draf WhatsApp (tidak mengirim otomatis)
- **Ekspor .ics** — unduh jadwal proyek untuk Google Calendar/Apple Calendar
- **Logo baru** — ikon + wordmark diekstrak dari gambar yang diberikan; klik logo di dalam aplikasi kembali ke landing page
- **Responsif** — sidebar desktop, bottom navigation + agenda di layar 360 px

## AI

Secara default aplikasi memakai **planner lokal** (deterministik, tanpa API key) supaya demo langsung bisa dipakai. Planner ini tetap mengikuti aturan PRD: hanya memecah tugas, tidak mengarang tanggal, dan menyertakan tugas yang sering terlupa (persetujuan klien, DP/pelunasan, vendor, pengiriman).

Untuk memakai LLM sungguhan, salin `.env.example` menjadi `.env.local` dan isi:

```env
AI_API_KEY=...
AI_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o-mini
```

Endpoint yang dipakai adalah `POST /chat/completions` yang kompatibel dengan OpenAI. Jika output bukan JSON valid, sistem mencoba ulang maksimal 2 kali (total 3 percobaan) lalu menampilkan pesan error yang jelas.

## Penyimpanan data

Data disimpan di `data/db.json` (dibuat otomatis dari seed saat pertama kali dijalankan). Lampiran disimpan di `public/uploads/`.

Reset ke kondisi demo awal:

```bash
# hentikan server, lalu:
rm data/db.json
rm -rf public/uploads/*
npm run dev
```

Di Windows PowerShell:

```powershell
Remove-Item data\db.json -Force
Remove-Item public\uploads\* -Force
```

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Lucide icons + Sonner toast
- Penyimpanan JSON lokal (tanpa database eksternal)
- Auth cookie ber-HMAC + password scrypt
- Web Speech API untuk rekam suara
- Drag & drop native HTML5

## Struktur singkat

```
app/                 halaman + API routes
components/          shell, kanban, kalender, wizard, hari ini, modal
lib/
  schedule.ts        penjadwalan mundur (hari kerja, libur, cadangan)
  ai.ts              planner lokal + integrasi LLM opsional
  seed.ts            data akun demo
  store.ts           penyimpanan JSON
  auth.ts            sesi & cookie
  data.ts            query + ringkasan proyek
```
