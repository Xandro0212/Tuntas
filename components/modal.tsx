"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "./language-provider";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
}) {
  const { t } = useI18n();
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop animate-fade-in" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("Tutup")}
        onClick={onClose}
      />
      <div
        className={`modal-panel relative animate-slide-up ${wide ? "sm:max-w-[720px]" : ""}`}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[12px] leading-relaxed text-muted">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn -mr-1 -mt-1" onClick={onClose} aria-label={t("Tutup")}>
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
