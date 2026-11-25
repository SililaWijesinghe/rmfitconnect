import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, X } from "lucide-react";

import { cn } from "@/lib/utils";

/** One coach mark: points at the element carrying `data-tour="<target>"`. */
export type GuideStep = {
  target: string;
  title: string;
  body: string;
};

const CARD_WIDTH = 340;
const GAP = 14;
const EDGE = 16;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Runs a guide the first time a page is visited. Completion is remembered per
 * page key; the button on each page can reopen it any time.
 */
export function useFirstVisitGuide(storageKey: string) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(storageKey)) setOpen(true);
    } catch {
      // Private mode / storage disabled — don't nag, keep it manual.
    }
  }, [storageKey]);

  const markSeen = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // Nothing to remember with storage blocked.
    }
    setOpen(false);
  }, [storageKey]);

  return { open, setOpen, markSeen };
}

export function GuideButton({
  onClick,
  label = "Guide me",
  className,
  tourId,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
  tourId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tour={tourId}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1 text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground",
        className,
      )}
    >
      <Compass className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}

/**
 * Spotlight + message box walkthrough. Dims the page, rings the target control
 * and anchors a short explanation beside it. Steps whose target isn't on the
 * page are skipped, so one definition works for pending and active users alike.
 */
export function SpotlightTour({
  steps,
  open,
  onOpenChange,
  onComplete,
  storageKey,
}: {
  steps: GuideStep[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  storageKey?: string;
}) {
  const [index, setIndex] = useState(0);
  const [available, setAvailable] = useState<GuideStep[]>([]);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [mobile, setMobile] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const step = available[index];

  /* Resolve which steps actually have a target on this page. */
  useEffect(() => {
    if (!open) return;
    const found = steps.filter((s) =>
      document.querySelector(`[data-tour="${s.target}"]`),
    );
    if (found.length === 0) {
      onOpenChange(false);
      return;
    }
    setAvailable(found);
    setIndex((i) => Math.min(i, found.length - 1));
  }, [open, steps, onOpenChange]);

  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;
    setRect(el.getBoundingClientRect());
  }, [step]);

  /*
   * Scroll the target to the middle of the screen, then follow it frame by frame
   * while the smooth scroll runs. window.scrollTo is used instead of
   * scrollIntoView so the offset is predictable under a sticky header.
   */
  useEffect(() => {
    if (!open || !step) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) return;

    const rectNow = el.getBoundingClientRect();
    const tall = rectNow.height > window.innerHeight * 0.7;
    const nextTop = tall
      ? window.scrollY + rectNow.top - 88
      : window.scrollY + rectNow.top - (window.innerHeight - rectNow.height) / 2;
    // Instant, not smooth: predictable, and smooth scrolling is a no-op in some
    // embedded Chromium builds, which left the ring behind the viewport.
    window.scrollTo(0, Math.max(0, nextTop));

    // Measure on timers rather than requestAnimationFrame: rAF is paused in a
    // backgrounded tab, which would leave the ring unpositioned.
    const apply = () => setRect(el.getBoundingClientRect());
    apply();
    const timers = [80, 240, 600].map((ms) => window.setTimeout(apply, ms));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [open, step]);

  /* Keep the ring glued to the element while the page moves. */
  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const sync = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [open, measure]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => setMobile(window.innerWidth < 640);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  const close = useCallback(() => {
    if (storageKey) {
      try {
        window.localStorage.setItem(storageKey, new Date().toISOString());
      } catch {
        // Ignore storage failures.
      }
    }
    onComplete?.();
    setIndex(0);
    setRect(null);
    setPos(null);
    onOpenChange(false);
  }, [storageKey, onComplete, onOpenChange]);

  const next = useCallback(() => {
    if (index >= available.length - 1) close();
    else setIndex((i) => i + 1);
  }, [index, available.length, close]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  /* Keyboard: Escape skips, arrows move, Tab stays inside the card. */
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        next();
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
        return;
      }
      if (event.key === "Tab" && cardRef.current) {
        const focusables = cardRef.current.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => cardRef.current?.focus(), 30);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, close, next, prev]);

  /* Place the card below the target, flip above when there's no room. */
  useLayoutEffect(() => {
    if (!open || !rect) {
      setPos(null);
      return;
    }
    if (mobile) {
      setPos(null);
      return;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(CARD_WIDTH, vw - EDGE * 2);
    const height = cardRef.current?.offsetHeight ?? 196;
    const left = clamp(rect.left + rect.width / 2 - width / 2, EDGE, vw - width - EDGE);
    let top = rect.bottom + GAP;
    if (top + height > vh - EDGE) top = rect.top - height - GAP;
    if (top < EDGE) top = clamp(rect.bottom + GAP, EDGE, vh - height - EDGE);
    setPos({ left, top, width });
  }, [open, rect, index, mobile]);

  if (!open || !step) return null;

  const isLast = index === available.length - 1;

  return (
    <div className="fixed inset-0 z-40" role="presentation">
      <div className="absolute inset-0 bg-background/80" onClick={close} aria-hidden="true" />

      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_0_36px_-2px_rgba(255,255,255,0.55)]"
          style={{
            left: rect.left - 6,
            top: rect.top - 6,
            width: rect.width + 12,
            height: rect.height + 12,
          }}
          aria-hidden="true"
        />
      )}

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-body"
        tabIndex={-1}
        style={
          mobile
            ? undefined
            : pos
              ? { left: pos.left, top: pos.top, width: pos.width }
              : { left: -9999, top: 0, width: CARD_WIDTH }
        }
        className={cn(
          "fixed z-50 rounded-xl border border-white/20 bg-card p-4 shadow-[0_20px_60px_-12px_rgba(0,0,0,0.9)] outline-none",
          "rm-pop",
          mobile && "inset-x-4 bottom-4",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
            Guide · {index + 1} of {available.length}
          </p>
          <button
            type="button"
            onClick={close}
            aria-label="Close guide"
            className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <h3 id="guide-title" className="mt-1.5 font-display text-lg tracking-wide text-balance">
          {step.title}
        </h3>
        <p
          id="guide-body"
          className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground"
        >
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={close}
            className="text-[11px] text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Skip
          </button>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prev}
              disabled={index === 0}
              aria-label="Previous tip"
              className="glass inline-flex size-8 items-center justify-center rounded-lg disabled:opacity-40"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              className="btn-neon hover:btn-neon-hover inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px]"
            >
              {isLast ? "Done" : "Next"}
              {!isLast && <ArrowRight className="size-3.5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
          {available.map((s, i) => (
            <span
              key={s.target}
              className={cn(
                "h-0.5 flex-1 rounded-full transition-opacity duration-200",
                i <= index ? "bg-white opacity-100" : "bg-white opacity-25",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
