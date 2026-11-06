import type { Category } from "./types";

export interface ProjectDemo {
  id: string;
  category: Category;
  title: { id: string; en: string };
  clientName: string;
  clientWa: string;
  deadlineOffset: number;
  deadlineTime?: string;
  value: number;
  team: string[];
  story: { id: string; en: string };
}

export const PROJECT_DEMOS: ProjectDemo[] = [
  {
    id: "kerajinan-patung",
    category: "kerajinan",
    title: {
      id: "Patung kuda fiberglass — Kantor Dinas",
      en: "Fiberglass horse statue — Provincial Office",
    },
    clientName: "Bu Ayu",
    clientWa: "081234567890",
    deadlineOffset: 30,
    value: 45_000_000,
    team: ["Made", "Kadek", "Wayan"],
    story: {
      id: "Klien memesan patung kuda fiberglass setinggi 2 meter untuk lobby kantor dinas. Finishing cat perunggu, alas/plakat nama dari vendor, dan pemasangan di lokasi. Klien ingin melihat sketsa 3 tampak dulu sebelum produksi. Bahan fiberglass, resin, cat, dan rangka besi perlu dicek. Hari Minggu dan hari libur tidak dihitung.",
      en: "The client ordered a 2-meter fiberglass horse statue for the provincial office lobby. Bronze paint finish, a nameplate base from a vendor, and on-site installation. The client wants to approve a 3-view sketch before production. Check fiberglass, resin, paint, and the steel frame. Sundays and public holidays are excluded.",
    },
  },
  {
    id: "katering-nasi-kotak",
    category: "katering",
    title: {
      id: "Nasi kotak 150 porsi — Rapat Kantor Camat",
      en: "150 lunch boxes — District Office meeting",
    },
    clientName: "Bu Sari",
    clientWa: "081246801357",
    deadlineOffset: 14,
    deadlineTime: "11:00",
    value: 7_500_000,
    team: ["Bu Sari", "Kadek", "Putu", "Komang"],
    story: {
      id: "Pesanan 150 nasi kotak untuk rapat kantor camat, tiba di lokasi pukul 11.00. Menu nasi putih, ayam betutu, lawar, telur, dan sambal. Ada 20 porsi vegetarian. Kemasan diberi stiker logo kantor. Klien minta food tasting satu kali sebelum produksi. Belanja bahan segar dilakukan H-1 dan produksi dimulai pagi hari.",
      en: "An order of 150 lunch boxes for a district office meeting, arriving at 11:00. Menu: white rice, betutu chicken, lawar, egg, and sambal. Twenty portions are vegetarian. Packaging needs the office logo sticker. The client asks for one food tasting before production. Buy fresh ingredients the day before and start cooking in the morning.",
    },
  },
  {
    id: "konveksi-seragam",
    category: "konveksi",
    title: {
      id: "Seragam batik 40 stel — Desa Adat",
      en: "40 batik uniforms — Village Office",
    },
    clientName: "Pak Wayan",
    clientWa: "081337654321",
    deadlineOffset: 21,
    value: 12_000_000,
    team: ["Ni Luh", "Made", "Komang"],
    story: {
      id: "Pesanan 40 stel seragam batik untuk staf desa adat. Ukuran S sampai XXL, motif batik ungu, dan bordir logo di dada kiri. Klien perlu menyetujui sampel kain dan pola sebelum produksi. Bahan kain, benang, dan jasa bordir dipesan dari vendor. Pengiriman harus selesai tiga hari sebelum upacara adat.",
      en: "An order of 40 batik uniform sets for village staff. Sizes S to XXL, purple batik motif, and an embroidered logo on the left chest. The client must approve the fabric and pattern sample before production. Fabric, thread, and embroidery are ordered from vendors. Delivery must be completed three days before the traditional ceremony.",
    },
  },
  {
    id: "jasa-dekorasi",
    category: "jasa",
    title: {
      id: "Dekorasi & dokumentasi acara — Hotel Ubud",
      en: "Event decoration & documentation — Hotel Ubud",
    },
    clientName: "Hotel Ubud",
    clientWa: "081999887766",
    deadlineOffset: 18,
    deadlineTime: "08:00",
    value: 18_000_000,
    team: ["Made", "Putu", "Ayu"],
    story: {
      id: "Proyek dekorasi dan dokumentasi acara pernikahan di Hotel Ubud untuk 200 tamu. Tema garden party dengan bunga lokal, pencahayaan hangat, panggung kecil, dan area foto. Klien meminta moodboard dan RAB sebelum DP. Setup dua hari sebelum acara, koordinasi vendor bunga, sound system, dan fotografer. Hari acara tidak boleh mundur.",
      en: "Decoration and documentation for a wedding at Hotel Ubud with 200 guests. A garden party theme with local flowers, warm lighting, a small stage, and a photo area. The client wants a moodboard and budget before the deposit. Set up two days before the event and coordinate flower, sound system, and photography vendors. The event date cannot move.",
    },
  },
];
