"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "./language-provider";

interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechResultEvent {
  resultIndex: number;
  results: ArrayLike<SpeechResult>;
}

interface SpeechErrorEvent {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEvent) => void) | null;
  onerror: ((event: SpeechErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const win = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
}

function polishTranscript(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const capitalized = text.charAt(0).toUpperCase() + text.slice(1);
  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

export function SpeechToText({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const { lang, t } = useI18n();
  const [supported, setSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const manualStopRef = useRef(false);
  const recordingRef = useRef(false);
  const finishedRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    setSupported(Boolean(getRecognitionCtor()));
    return () => {
      mountedRef.current = false;
      recordingRef.current = false;
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.abort?.();
    };
  }, []);

  useEffect(() => {
    if (!recording) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      return;
    }
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [recording]);

  function finish() {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const text = polishTranscript(
      `${finalRef.current} ${interimRef.current}`,
    );
    if (text) {
      onTranscript(text);
      toast.success(t("Hasil rekaman ditambahkan ke cerita."));
    }
    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterim("");
    setRecording(false);
    recordingRef.current = false;
  }

  function errorMessage(code: string): string {
    if (code === "not-allowed" || code === "service-not-allowed") {
      return t("Izin mikrofon ditolak. Aktifkan mikrofon di pengaturan browser.");
    }
    if (code === "no-speech") {
      return t("Tidak ada suara terdeteksi. Coba rekam lagi.");
    }
    if (code === "audio-capture") {
      return t("Mikrofon tidak ditemukan.");
    }
    if (code === "network") {
      return t("Layanan suara browser sedang bermasalah. Periksa koneksi.");
    }
    if (code === "language-not-supported") {
      return t("Bahasa rekaman belum didukung browser ini.");
    }
    return t("Rekaman berhenti. Coba lagi.");
  }

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      toast.error(
        t("Browser ini belum mendukung rekam suara. Gunakan Chrome/Edge atau ketik cerita."),
      );
      return;
    }
    if (recordingRef.current) return;

    setError("");
    setFinalText("");
    setInterim("");
    finalRef.current = "";
    interimRef.current = "";
    finishedRef.current = false;
    manualStopRef.current = false;
    recordingRef.current = true;
    setRecording(true);

    const recognition = new Ctor();
    recognition.lang = lang === "en" ? "en-US" : "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError("");
    };

    recognition.onresult = (event) => {
      let nextInterim = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          finalRef.current = `${finalRef.current} ${transcript}`.trim();
        } else {
          nextInterim = `${nextInterim} ${transcript}`.trim();
        }
      }
      interimRef.current = nextInterim;
      setFinalText(finalRef.current);
      setInterim(nextInterim);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted") return;
      manualStopRef.current = true;
      recordingRef.current = false;
      setRecording(false);
      setError(errorMessage(event.error));
      finish();
    };

    recognition.onend = () => {
      if (
        mountedRef.current &&
        !manualStopRef.current &&
        recordingRef.current
      ) {
        // Chrome/Android often ends continuous recognition after a pause.
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // Ignore duplicate start; the next end event will stop gracefully.
          }
        }, 350);
        return;
      }
      finish();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch {
      recordingRef.current = false;
      setRecording(false);
      setError(t("Mikrofon belum bisa dimulai. Coba lagi."));
    }
  }

  function stop() {
    manualStopRef.current = true;
    recordingRef.current = false;
    setRecording(false);
    recognitionRef.current?.stop?.();
    finish();
  }

  function cancel() {
    manualStopRef.current = true;
    recordingRef.current = false;
    recognitionRef.current?.abort?.();
    finalRef.current = "";
    interimRef.current = "";
    finishedRef.current = true;
    setFinalText("");
    setInterim("");
    setRecording(false);
    setError("");
  }

  const transcript = `${finalText} ${interim}`.replace(/\s+/g, " ").trim();
  const wordCount = transcript ? transcript.split(/\s+/).length : 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={disabled || !supported}
          className={`btn btn-xs border ${
            recording
              ? "border-rust/30 bg-rust-soft text-rust"
              : "border-line bg-card text-ink-2 hover:bg-paper"
          } disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {recording ? (
            <>
              <Square className="h-3 w-3 fill-current" /> {t("Stop & masukkan")}
            </>
          ) : (
            <>
              <Mic className="h-3.5 w-3.5" /> {t("Rekam suara")}
            </>
          )}
        </button>
        {transcript && (
          <button
            type="button"
            onClick={cancel}
            className="btn btn-xs border border-line bg-card text-muted hover:bg-paper hover:text-ink"
          >
            <Trash2 className="h-3 w-3" /> {t("Batalkan rekaman")}
          </button>
        )}
        <span className="text-[10px] text-muted">
          {lang === "en" ? "Voice input: English" : "Input suara: Indonesia"}
        </span>
      </div>

      {!supported && (
        <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
          {t(
            "Rekam suara belum didukung browser ini. Gunakan Chrome/Edge di Android/desktop, atau ketik dan tempel cerita.",
          )}
        </p>
      )}

      {recording && (
        <div className="mt-2 rounded-xl border border-rust/20 bg-rust-soft/60 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-rust">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rust" />
              {t("Mendengarkan…")}
            </span>
            <span className="font-mono text-[10.5px] font-semibold text-rust/80">
              {mm}:{ss}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5, 6].map((bar) => (
              <span
                key={bar}
                className="h-2 w-1 animate-pulse rounded-full bg-rust/50"
                style={{ animationDelay: `${bar * 100}ms` }}
              />
            ))}
          </div>
          <div
            className="mt-2 min-h-[42px] rounded-lg bg-white/65 px-2.5 py-2 text-[11.5px] leading-relaxed text-ink-2"
            aria-live="polite"
          >
            {transcript || t("Mulai bicara… hasil akan muncul di sini.")}
          </div>
          <div className="mt-1 text-[9.5px] text-rust/70">
            {t("{n} kata", { n: wordCount })} ·{" "}
            {t("Tekan Stop untuk menambahkan ke cerita.")}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1.5 rounded-lg border border-rust/20 bg-rust-soft px-2.5 py-1.5 text-[10.5px] leading-relaxed text-rust">
          {error}
        </p>
      )}
    </div>
  );
}
