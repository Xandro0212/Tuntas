export type Lang = "id" | "en";

export interface LandingCopy {
  nav: { features: string; how: string; who: string; demo: string };
  signIn: string;
  tryDemo: string;
  workspace: string;
  openWorkspace: string;
  signInWorkspace: string;
  language: string;
  hero: {
    badge: string;
    line1: string;
    line2: string;
    line3: string;
    tagline?: string;
    description: string;
    ctaDemo: string;
    ctaHow: string;
    trust: string[];
    signedInAs: string;
    demoStats: string;
    explore: string;
  };
  stats: string[];
  marquee: string[];
  features: {
    eyebrow: string;
    title: string;
    description: string;
    ai: { tag: string; title: string; description: string };
    kanban: { tag: string; title: string; description: string };
    calendar: { tag: string; title: string; description: string };
    today: { tag: string; title: string; description: string };
    reminder: { tag: string; title: string; description: string };
    deadline: { tag: string; title: string; description: string };
  };
  how: {
    eyebrow: string;
    title: string;
    description: string;
    steps: { title: string; description: string }[];
    noteStrong: string;
    note: string;
  };
  who: {
    eyebrow: string;
    title: string;
    description: string;
    categories: { title: string; examples: string }[];
  };
  demo: {
    title: string;
    description: string;
    signIn: string;
    manual: string;
    note: string;
    workspace: string;
    stats: string;
    ready: string;
  };
  footer: {
    description: string;
    builtFor: string;
    product: string;
    workspace: string;
    links: { features: string; how: string; who: string; demo: string; signIn: string; register: string; kanban: string };
    copyright: string;
    version: string;
  };
}

const ID: LandingCopy = {
  nav: { features: "Fitur", how: "Cara kerja", who: "Untuk siapa", demo: "Demo" },
  signIn: "Masuk",
  tryDemo: "Coba demo",
  workspace: "Ruang kerja",
  openWorkspace: "Buka ruang kerja",
  signInWorkspace: "Masuk ke ruang kerja",
  language: "Bahasa",
  hero: {
    badge: "Kanban + AI untuk UMKM",
    line1: "Dari cerita klien,",
    line2: "Jadi rencana",
    line3: "Yang tuntas.",
    description:
      "Tuntas membaca cerita proyekmu, memecahnya menjadi tugas, lalu menghitung tanggal mundur dari deadline. Minggu dan hari libur dilewati. Cadangan waktu dijaga.",
    ctaDemo: "Coba demo gratis",
    ctaHow: "Lihat cara kerja",
    trust: ["Akun demo siap", "Tanpa kartu kredit", "Bahasa Indonesia"],
    signedInAs: "Masuk sebagai",
    demoStats: "4 proyek · 47 tugas di akun demo",
    explore: "Jelajahi fitur",
  },
  stats: [
    "tugas dari satu cerita",
    "tugas di hari Minggu",
    "cadangan waktu dijaga",
    "kolom Kanban yang rapi",
  ],
  marquee: [
    "Produksi kerajinan",
    "Katering & acara",
    "Konveksi & seragam",
    "Jasa & desain",
    "Mebel custom",
    "Ukiran & patung",
    "Nasi kotak",
    "Event organizer",
    "Toko online",
    "Seragam kantor",
  ],
  features: {
    eyebrow: "Fitur",
    title: "Bukan cuma papan tulis. Ini rekan kerja yang menjaga jadwal.",
    description:
      "AI, Kanban, kalender, dan pengingat bekerja dari cerita yang sama. Kamu tidak perlu menyalin data dari satu tempat ke tempat lain.",
    ai: {
      tag: "AI Planner",
      title: "AI yang paham cerita, bukan cuma form.",
      description:
        "Tuntas membaca detail proyek seperti ukuran, bahan, siapa yang memasang, dan hal yang sering terlupa. Lalu memecahnya jadi tugas yang masuk akal.",
    },
    kanban: {
      tag: "Kanban",
      title: "Papan yang mengikuti ritme kerjamu.",
      description:
        "Empat kolom yang jelas. Geser kartu, status langsung tersimpan, dan semua orang tahu apa yang harus dikerjakan.",
    },
    calendar: {
      tag: "Kalender",
      title: "Tahu hari libur & odalan.",
      description:
        "Tanggal dihitung mundur, Minggu dan hari libur dilewati. Cadangan waktu ditandai agar tidak ada kejutan.",
    },
    today: {
      tag: "Hari ini",
      title: "Tugas hari ini, per orang.",
      description:
        "Buka pagi, lihat tugas yang harus disentuh, centang yang selesai. Tim tahu bagiannya tanpa bertanya.",
    },
    reminder: {
      tag: "Pengingat",
      title: "Pengingat yang sopan.",
      description:
        "Saat tugas klien menahan jadwal, Tuntas menyiapkan draf WhatsApp. Kamu yang cek dan tekan kirim.",
    },
    deadline: {
      tag: "Jaga jadwal",
      title: "Deadline, progres, dan cadangan — selalu kelihatan.",
      description:
        "Satu baris di atas papan menunjukkan sisa hari, progres tugas, dan cadangan waktu. Kalau ada yang terlambat, Tuntas angkat tangan lebih awal.",
    },
  },
  how: {
    eyebrow: "Cara kerja",
    title: "Mulai dari cerita, bukan spreadsheet.",
    description: "Empat langkah. Tidak ada data yang masuk tanpa kamu setujui.",
    steps: [
      {
        title: "Ceritakan proyeknya",
        description:
          "Tulis bebas, rekam suara, atau tempel chat WhatsApp klien. Tidak perlu mengisi spreadsheet.",
      },
      {
        title: "Jawab 3 pertanyaan",
        description:
          "AI hanya bertanya hal yang benar-benar mengubah pembagian tugas: pemasangan, persetujuan, dan bahan.",
      },
      {
        title: "Cek & ubah rencana",
        description:
          "Draf 18 tugas, 4 tahap, durasi, dan PJ bisa diedit, dihapus, atau ditambah sebelum diterapkan.",
      },
      {
        title: "Kerjakan sampai tuntas",
        description:
          "Semua tugas masuk Kanban, muncul di kalender, dan masuk daftar Hari ini per orang.",
      },
    ],
    noteStrong: "Tanggal tidak dikarang AI.",
    note: "Sistem yang menghitung mundur, melewati Minggu dan hari libur, lalu menyisakan cadangan 10% durasi — minimal 1 hari kerja.",
  },
  who: {
    eyebrow: "Untuk siapa",
    title: "Satu aplikasi, banyak jenis usaha.",
    description:
      "Jenis usaha hanya mengubah contoh dan pola tahapan yang dipakai AI. Cara kerjanya tetap sama: cerita masuk, rencana keluar.",
    categories: [
      { title: "Kerajinan", examples: "Patung, relief, mebel, ukiran" },
      { title: "Katering & acara", examples: "Nasi kotak, prasmanan, event" },
      { title: "Konveksi", examples: "Seragam, sablon, bordir" },
      { title: "Jasa & desain", examples: "Dekorasi, konten, konsultasi" },
      { title: "Usaha lain", examples: "Apa pun yang punya deadline" },
    ],
  },
  demo: {
    title: "Coba Tuntas dengan akun demo.",
    description:
      "Tidak perlu mengisi apa pun. Akun demo sudah berisi proyek patung kuda, katering, relief, dan ukiran — lengkap dengan tugas, kalender, dan peringatan.",
    signIn: "Masuk sebagai demo",
    manual: "Masuk manual",
    note: "Data demo lokal · tidak ada pesan yang terkirim otomatis",
    workspace: "Ruang kerja demo",
    stats: "47 tugas · 3 hari libur",
    ready: "Siap dijelajahi",
  },
  footer: {
    description:
      "Kanban + kalender proyek klien untuk UMKM. Dibuat agar kerja lebih tenang dan deadline tidak lagi jadi kejutan.",
    builtFor: "Dibuat untuk UMKM Bali & Indonesia",
    product: "Produk",
    workspace: "Ruang kerja",
    links: {
      features: "Fitur",
      how: "Cara kerja",
      who: "Untuk siapa",
      demo: "Akun demo",
      signIn: "Masuk",
      register: "Buat akun",
      kanban: "Buka Kanban",
    },
    copyright: "© 2026 Tuntas. Semua cerita berhak jadi rencana yang tuntas.",
    version: "v0.1 · demo planner + LLM opsional",
  },
};

const EN: LandingCopy = {
  nav: { features: "Features", how: "How it works", who: "Who it's for", demo: "Demo" },
  signIn: "Sign in",
  tryDemo: "Try demo",
  workspace: "Workspace",
  openWorkspace: "Open workspace",
  signInWorkspace: "Sign in to workspace",
  language: "Language",
  hero: {
    badge: "Kanban + AI for small business",
    line1: "PLAN IT. TRACK IT.",
    line2: "GET IT DONE.",
    line3: "",
    tagline: "Tell us your deadline. Tuntas builds the roadmap to get you there.",
    description:
      "Tuntas transforms your project story into an actionable task plan, calculates every deadline backward, skips Sundays and holidays, and protects buffer time so you can finish without the last-minute chaos.",
    ctaDemo: "Try demo free",
    ctaHow: "See how it works",
    trust: ["No sign-up needed", "AI builds the task plan", "Buffer time protected"],
    signedInAs: "Signed in as",
    demoStats: "4 projects · 47 tasks in the demo account",
    explore: "Explore features",
  },
  stats: [
    "tasks from one story",
    "tasks on Sundays",
    "buffer time protected",
    "tidy Kanban columns",
  ],
  marquee: [
    "Craft production",
    "Catering & events",
    "Apparel & uniforms",
    "Services & design",
    "Custom furniture",
    "Carving & statues",
    "Lunch boxes",
    "Event organizer",
    "Online store",
    "Office uniforms",
  ],
  features: {
    eyebrow: "Features",
    title: "More than a board. A teammate that protects your schedule.",
    description:
      "AI, Kanban, calendar, and reminders work from the same story. No copying data from one place to another.",
    ai: {
      tag: "AI Planner",
      title: "AI that understands the story, not just the form.",
      description:
        "Tuntas reads project details like size, materials, who installs it, and the things people often forget. Then it turns them into tasks that make sense.",
    },
    kanban: {
      tag: "Kanban",
      title: "A board that follows your rhythm.",
      description:
        "Four clear columns. Drag a card, the status saves instantly, and everyone knows what to do.",
    },
    calendar: {
      tag: "Calendar",
      title: "Knows holidays and temple days.",
      description:
        "Dates count backwards, Sundays and holidays are skipped. Buffer time is marked so there are no surprises.",
    },
    today: {
      tag: "Today",
      title: "Today's tasks, per person.",
      description:
        "Open it in the morning, see what needs attention, tick off what's done. The team knows their part without asking.",
    },
    reminder: {
      tag: "Reminder",
      title: "Polite reminders.",
      description:
        "When a client task holds up the schedule, Tuntas prepares a WhatsApp draft. You check it and press send.",
    },
    deadline: {
      tag: "Protect the plan",
      title: "Deadlines, progress, and buffer — always visible.",
      description:
        "One line above the board shows days left, task progress, and buffer time. If something is late, Tuntas raises its hand early.",
    },
  },
  how: {
    eyebrow: "How it works",
    title: "Start with a story, not a spreadsheet.",
    description: "Four steps. Nothing enters your workspace without your approval.",
    steps: [
      {
        title: "Tell the story",
        description:
          "Write freely, record a voice note, or paste the client's WhatsApp chat. No spreadsheets.",
      },
      {
        title: "Answer 3 questions",
        description:
          "AI only asks what really changes the task breakdown: installation, approvals, and materials.",
      },
      {
        title: "Review & edit the plan",
        description:
          "A draft of 18 tasks, 4 phases, durations, and owners can be edited, deleted, or added before applying.",
      },
      {
        title: "Work it to done",
        description:
          "Every task lands on the Kanban, shows on the calendar, and appears in Today per person.",
      },
    ],
    noteStrong: "Dates are not invented by AI.",
    note: "The system counts backwards, skips Sundays and holidays, and reserves a 10% buffer — at least 1 working day.",
  },
  who: {
    eyebrow: "Who it's for",
    title: "One app, many kinds of business.",
    description:
      "The business type only changes the examples and phase patterns used by AI. The workflow stays the same: story in, plan out.",
    categories: [
      { title: "Crafts", examples: "Statues, reliefs, furniture, carving" },
      { title: "Catering & events", examples: "Lunch boxes, buffets, events" },
      { title: "Apparel", examples: "Uniforms, screen printing, embroidery" },
      { title: "Services & design", examples: "Decoration, content, consulting" },
      { title: "Other businesses", examples: "Anything with a deadline" },
    ],
  },
  demo: {
    title: "Try Tuntas with the demo account.",
    description:
      "Nothing to fill in. The demo account already has a horse statue project, catering, relief, and a carved door — complete with tasks, calendar, and reminders.",
    signIn: "Sign in as demo",
    manual: "Sign in manually",
    note: "Local demo data · no messages sent automatically",
    workspace: "Demo workspace",
    stats: "47 tasks · 3 holidays",
    ready: "Ready to explore",
  },
  footer: {
    description:
      "Kanban + client project calendar for small businesses. Built for calmer work and deadlines that no longer surprise you.",
    builtFor: "Built for small businesses in Bali & Indonesia",
    product: "Product",
    workspace: "Workspace",
    links: {
      features: "Features",
      how: "How it works",
      who: "Who it's for",
      demo: "Demo account",
      signIn: "Sign in",
      register: "Create account",
      kanban: "Open Kanban",
    },
    copyright: "© 2026 Tuntas. Every story deserves a plan that gets done.",
    version: "v0.1 · demo planner + optional LLM",
  },
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { id: ID, en: EN };

export const HERO_BOARD_COPY = {
  id: {
    workspace: "Ruang kerja Made Art Studio",
    aria:
      "Pratinjau papan Kanban Tuntas untuk proyek Patung kuda, dengan deadline 7 Desember, progres 6 dari 18 tugas, dan cadangan 2 hari kerja.",
    activeProject: "Proyek aktif",
    progress: "Progres",
    ofTasks: "dari 18 tugas",
    buffer: "Cadangan",
    workingDays: "hari kerja",
    weekendSkipped: "Minggu & libur dilewati",
    notStarted: "Belum mulai",
    inProgress: "Dikerjakan",
    done: "Selesai",
    aiBroke: "AI selesai memecah",
    tasksFromStory: "tugas dari 1 cerita",
    phases: "4 tahap",
    owners: "3 PJ",
    today: "Hari ini, Jumat 6 November 2026",
    aiActive: "AI planner aktif",
    bufferChip: "CADANGAN",
    bufferValue: "2 hari kerja",
  },
  en: {
    workspace: "Made Art Studio workspace",
    aria:
      "Preview of the Tuntas Kanban board for the horse statue project, with a 7 December deadline, 6 of 18 tasks complete, and 2 working days of buffer.",
    activeProject: "Active project",
    progress: "Progress",
    ofTasks: "of 18 tasks",
    buffer: "Buffer",
    workingDays: "working days",
    weekendSkipped: "Sundays & holidays skipped",
    notStarted: "Not started",
    inProgress: "In progress",
    done: "Done",
    aiBroke: "AI finished the breakdown",
    tasksFromStory: "tasks from 1 story",
    phases: "4 phases",
    owners: "3 owners",
    today: "Today, Friday 6 November 2026",
    aiActive: "AI planner active",
    bufferChip: "BUFFER",
    bufferValue: "2 working days",
  },
} as const;
