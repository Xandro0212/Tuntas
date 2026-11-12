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

Testing:

```bash
npm test
```

CI menjalankan unit test dan production build pada setiap push/PR:
`.github/workflows/ci.yml`.

## Tampilan publik

Halaman utama di `/` adalah landing page publik dengan animasi (hero board, marquee, reveal saat scroll, counter, hover cards), pilihan bahasa **ID/EN**, dan tombol **Coba demo** yang langsung masuk ke akun contoh. Logo baru diekstrak dari gambar yang diberikan: ikon transparan dan wordmark cream/cokelat tersedia di `public/brand/`, lalu dipakai di landing, login, sidebar, serta favicon. Versi SVG juga disimpan sebagai aset alternatif.

## Akun demo

| | |
| --- | --- |
| Email | `demo@tuntas.id` |
| Password | `demo123` |

Tombol **“Coba demo”** dan **“Masuk dengan akun demo”** sekarang membuat **workspace demo sementara** yang terpisah untuk setiap pengunjung. Data demo lama dibersihkan otomatis setelah 24 jam, sehingga pengunjung lain tidak bisa merusak data yang sedang dilihat juri.

Akun demo bersama tetap tersedia untuk akses manual:

- **5 proyek seed** (patung kuda, nasi kotak katering, relief garuda, ukiran pintu, desain ruang kantor)
- **65 tugas seed** dengan status, tanggal, penanggung jawab, dan ketergantungan
- Kalender dengan hari libur, hari cadangan, dan deadline klien
- Peringatan tugas terlambat + draf pesan WhatsApp
- Halaman **Hari ini** dengan tugas per orang

## Fitur yang sudah jalan

- **Landing page ID/EN** — pilihan bahasa Indonesia/Inggris di header landing, tersimpan di `localStorage` + cookie
- **Owner & Employee** — Owner mengelola workspace, proyek, tim, dan tugas; Employee hanya bisa memperbarui tugas yang ditugaskan kepadanya. UMKM tanpa karyawan tetap berjalan sebagai Owner tunggal
- **Tim** — Owner membuat tautan undangan; karyawan membuat password sendiri, lalu bisa ditugaskan ke tugas. Owner juga bisa menghapus karyawan dan mencabut undangan
- **Buat proyek** — form cerita proyek, **Modal proyek**, rekam suara (Web Speech API), tempel chat WA, lampiran foto/PDF
- **Edit proyek** — Owner bisa mengubah judul, klien, deadline, cerita, dan nilai proyek; perubahan deadline otomatis menyusun ulang tanggal tugas
- **Kelola tahap** — Owner bisa menambah, mengganti nama, menaikkan/menurunkan urutan, dan menghapus tahap proyek; tahap yang masih punya tugas tidak bisa dihapus
- **Aktivitas** — jejak perubahan proyek, tugas, tahap, hari libur, karyawan, undangan, dan jadwal di halaman `/aktivitas`
- **Auto-refresh** — halaman diperbarui otomatis setiap 30 detik dan saat tab kembali aktif, sehingga perubahan dari perangkat lain cepat terlihat
- **Pertanyaan AI** — maksimal 3 pertanyaan pilihan ganda sebelum menyusun rencana
- **Draf rencana** — tahap, tugas, durasi, ketergantungan, PJ, risiko; bisa diedit, dihapus, ditambah sebelum diterapkan
- **Penjadwalan mundur** — Minggu selalu libur, hari libur nasional/Bali/ditambahkan sendiri dilewati, cadangan 10% durasi (minimal 1 hari kerja)
- **Kanban** — kolom Belum mulai · Sedang dikerjakan · Menunggu klien · Selesai, drag & drop di desktop, plus pemilih **Pindah** yang ramah sentuhan di mobile/tablet
- **Deskripsi progres** — setiap tugas bisa punya update singkat; tampil di kartu, detail tugas, dan ringkasan **Progres tahap**
- **Validasi tanggal langsung** — memilih Minggu atau hari libur pada tanggal tugas langsung memunculkan notifikasi dan menyimpan tombol simpan tetap nonaktif
- **Ringkasan jadwal** — peringatan hanya muncul jika target mulai hasil hitung mundur memang sudah lewat; pengguna bisa menutup peringatan atau kembali mengubah deadline
- **Prioritas proyek** — urutan pengerjaan berdasarkan deadline, sisa durasi, progres, dan cadangan; AI memberi rekomendasi pembagian tim saat ada deadline bertabrakan
- **Kalender** — tampilan bulanan, warna per tahap, deadline klien, hari cadangan, hari libur, opsi menampilkan proyek lain; ada agenda khusus mobile
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

## Bot WhatsApp

Tuntas mendukung **WhatsApp Cloud API** (opsional) untuk:

- Mengirim konfirmasi pesanan saat proyek dibuat.
- Mengirim update otomatis saat tugas selesai, menunggu klien, atau punya catatan progres.
- Menerima perintah klien lewat webhook:
  - `STATUS` — ringkasan progres proyek
  - `KONFIRMASI` — konfirmasi pesanan
  - `BANTU` — daftar perintah
- Tombol **Konfirmasi WA** di halaman proyek untuk mengirim konfirmasi manual.

Environment yang diperlukan:

```env
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=token-verifikasi-bebas
WHATSAPP_APP_SECRET=
WHATSAPP_API_VERSION=v23.0
```

Webhook URL untuk Meta:

```text
https://tuntas-tau.vercel.app/api/whatsapp/webhook
```

Tanpa environment tersebut, fitur WhatsApp otomatis nonaktif dan task/proyek tetap tersimpan normal.

## Penyimpanan data

Tuntas memakai **Supabase** untuk penyimpanan persisten saat berjalan di Vercel. Data disimpan sebagai satu dokumen JSONB di tabel `public.tuntas_state`, lengkap dengan nomor versi agar dua perangkat tidak saling menimpa.

Model datanya sekarang memiliki:

- `workspaces` — satu workspace per usaha
- `users` — identity login dengan `workspaceId` dan role `owner` / `employee`
- `projects.workspaceId` — isolasi proyek per workspace
- `tasks.assigneeUserId` — penugasan tugas ke akun karyawan
- `holidays.workspaceId` — hari libur per workspace; hari libur nasional/Bali memakai workspace `*`
- `invites` — tautan undangan karyawan sekali pakai, berlaku 7 hari

### Setup Supabase

1. Buat project di <https://supabase.com/dashboard>.
2. Buka **SQL Editor**, lalu jalankan isi `supabase/schema.sql`.
3. Buka **Project Settings → API**, salin:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Isi `.env.local` untuk lokal dan **Environment Variables** di Vercel untuk produksi:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
```

Saat pertama kali dijalankan, aplikasi otomatis mengisi tabel dengan data demo jika masih kosong. Akun demo langsung bisa dipakai tanpa langkah seeding manual.

> Gunakan **service_role key** hanya di server. Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk key ini.

Jika `SUPABASE_URL` dan key belum diisi, aplikasi memakai fallback `data/db.json` untuk pengembangan lokal. Fallback ini **tidak bisa menulis di Vercel Serverless** karena filesystem produksi read-only.

Reset data demo di Supabase: hapus baris `id = 'main'` dari tabel `tuntas_state`, lalu buka aplikasi lagi. Data demo akan dibuat ulang otomatis.

### Lampiran

Lampiran disimpan di **Supabase Storage** (bucket privat `tuntas-uploads`) saat environment Supabase tersedia. Aplikasi menyimpan path objek, lalu membuat **signed URL berlaku 1 jam** saat halaman proyek dibuka. Pada mode lokal tanpa Supabase, fallback memakai `public/uploads/`. Ekstensi file ditentukan dari MIME yang diizinkan, bukan dari nama file asli.

### Rate limit

Login, registrasi, demo, AI, upload, pembuatan undangan, dan penerimaan undangan memiliki rate limit dasar per IP/user. Limiter berjalan in-memory per instance; untuk produksi multi-instance skala besar, gunakan Redis/Upstash atau rate limiter terdistribusi.

### Proteksi CSRF

`proxy.ts` memeriksa `Origin` dan `Sec-Fetch-Site` untuk semua request API yang mengubah data (`POST`, `PATCH`, `DELETE`). Request dari domain lain ditolak dengan `403`; request non-browser tanpa header tetap kompatibel.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Lucide icons + Sonner toast
- Supabase (PostgREST + JSONB state) untuk penyimpanan persisten
- Supabase Storage untuk lampiran produksi
- Workspace + role `owner`/`employee` + task assignment
- Auth cookie ber-HMAC + password scrypt
- Web Speech API untuk rekam suara
- Drag & drop native HTML5 + pemilih status ramah sentuhan

## Struktur singkat

```
app/                 halaman + API routes
components/          shell, kanban, kalender, wizard, tim, hari ini, modal
lib/
  schedule.ts        penjadwalan mundur (hari kerja, libur, cadangan)
  ai.ts              planner lokal + integrasi LLM opsional
  seed.ts            data akun demo
  store.ts           Supabase + fallback JSON lokal
  migrate.ts         migrasi data lama ke workspace/role
  auth.ts            sesi, cookie, owner guard
  data.ts            query + ringkasan proyek per workspace
  uploads.ts         Supabase Storage + fallback lokal
supabase/
  schema.sql         tabel state Supabase
```
