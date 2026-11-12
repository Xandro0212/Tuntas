"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/language-provider";

export function DemoButton({
  isLoggedIn,
  label,
  className = "btn-primary",
}: {
  isLoggedIn: boolean;
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  if (isLoggedIn) {
    return (
      <Link href="/kanban" className={className}>
        {label ?? "Buka ruang kerja"} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    );
  }

  async function openDemo() {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/demo", {
        method: "POST",
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(payload.error ? t(payload.error) : t("Gagal membuka akun demo."));
      window.location.href = "/kanban";
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("Gagal membuka akun demo."),
      );
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openDemo}
      disabled={loading}
      aria-busy={loading}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("Menyiapkan…")}
        </>
      ) : (
        <>
          {label ?? "Coba demo"} <ArrowUpRight className="h-3.5 w-3.5" />
        </>
      )}
    </button>
  );
}
