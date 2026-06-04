"use client";

import { useSyncExternalStore } from "react";

import { CalendarDays, Clock3 } from "lucide-react";

import { cn } from "@/lib/utils";

export type HomeClockCopy = {
  compactDescription: string;
  description: string;
  miniTitle: string;
  timezoneLabel: string;
  title: string;
};

type HomeClockSectionProps = {
  copy: HomeClockCopy;
  density?: "comfortable" | "compact" | "mini";
  locale: string;
};

const CLOCK_TIME_ZONE = "Asia/Shanghai";
const EMPTY_TIME_TEXT = "--:--";
const EMPTY_SECONDS_TEXT = "--";

let currentTimestamp = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

export function HomeClockSection({
  copy,
  density = "comfortable",
  locale,
}: HomeClockSectionProps) {
  const timestamp = useClockTimestamp();
  const date = timestamp ? new Date(timestamp) : null;
  const compact = density !== "comfortable";
  const mini = density === "mini";
  const display = formatClockDisplay(date, locale);
  const hands = getClockHandAngles(date);

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden"
      data-testid="home-clock-section"
    >
      <div className="min-w-0">
        <h3
          className={cn(
            "flex items-center gap-2 font-bold tracking-tight text-[#23313a]",
            mini ? "text-base" : compact ? "text-lg" : "text-xl",
          )}
        >
          <Clock3 className="size-5 shrink-0 text-[#486782]" />
          <span className="min-w-0 break-words">
            {mini ? copy.miniTitle : copy.title}
          </span>
        </h3>
        {!mini ? (
          <p
            className={cn(
              "mt-2 break-words text-sm leading-7 text-[#69747d]",
              compact && "line-clamp-2 text-xs leading-6",
            )}
          >
            {compact ? copy.compactDescription : copy.description}
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 flex min-h-0 flex-1 items-center gap-4",
          mini && "mt-3 flex-col justify-between gap-2",
          compact && !mini && "justify-between",
        )}
      >
        <ClockFace angles={hands} mini={mini} />
        <div
          className={cn(
            "min-w-0 flex-1",
            mini && "w-full flex-none text-center",
          )}
        >
          <time
            className={cn(
              "block break-words font-mono font-bold leading-none text-[#23313a]",
              mini ? "text-xl" : compact ? "text-3xl" : "text-5xl",
            )}
            dateTime={date?.toISOString()}
            data-testid="home-clock-time"
          >
            {display.time}
          </time>
          <p
            className={cn(
              "mt-2 font-mono font-semibold leading-none text-[#486782]",
              mini ? "text-xs" : "text-sm",
            )}
            data-testid="home-clock-seconds"
          >
            {display.seconds}
          </p>

          {!mini ? (
            <div className="mt-4 min-w-0 space-y-2 text-sm leading-6 text-[#69747d]">
              <p className="flex min-w-0 items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-[#486782]" />
                <span className="min-w-0 break-words">{display.date}</span>
              </p>
              <p className="break-words text-xs font-semibold text-[#7b858d]">
                {copy.timezoneLabel}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ClockFace({
  angles,
  mini,
}: {
  angles: ClockHandAngles;
  mini: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative shrink-0 rounded-full border border-[#d9e2e8] bg-[#fbfaf8] shadow-inner",
        mini ? "size-14" : "size-24",
      )}
      data-testid="home-clock-face"
    >
      <span className="absolute left-1/2 top-1.5 h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-[#7b858d]" />
      <span className="absolute bottom-1.5 left-1/2 h-1.5 w-0.5 -translate-x-1/2 rounded-full bg-[#7b858d]" />
      <span className="absolute left-1.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 rounded-full bg-[#7b858d]" />
      <span className="absolute right-1.5 top-1/2 h-0.5 w-1.5 -translate-y-1/2 rounded-full bg-[#7b858d]" />
      <ClockHand
        className="h-[28%] w-1 bg-[#23313a]"
        degrees={angles.hour}
      />
      <ClockHand
        className="h-[36%] w-0.5 bg-[#486782]"
        degrees={angles.minute}
      />
      <ClockHand
        className="h-[40%] w-px bg-[#9d3a35]"
        degrees={angles.second}
      />
      <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#486782]" />
    </div>
  );
}

function ClockHand({
  className,
  degrees,
}: {
  className: string;
  degrees: number;
}) {
  return (
    <span
      className={cn(
        "absolute bottom-1/2 left-1/2 origin-bottom -translate-x-1/2 rounded-full",
        className,
      )}
      style={{ transform: `translateX(-50%) rotate(${degrees}deg)` }}
    />
  );
}

function useClockTimestamp() {
  return useSyncExternalStore(
    subscribeClock,
    getClockSnapshot,
    getServerClockSnapshot,
  );
}

function subscribeClock(callback: () => void) {
  listeners.add(callback);
  startClock();

  return () => {
    listeners.delete(callback);

    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function startClock() {
  if (timer) {
    return;
  }

  currentTimestamp = Date.now();
  timer = setInterval(() => {
    currentTimestamp = Date.now();
    listeners.forEach((listener) => listener());
  }, 1000);
}

function getClockSnapshot() {
  return currentTimestamp;
}

function getServerClockSnapshot() {
  return 0;
}

type ClockHandAngles = {
  hour: number;
  minute: number;
  second: number;
};

function getClockHandAngles(date: Date | null): ClockHandAngles {
  if (!date) {
    return {
      hour: 0,
      minute: 0,
      second: 0,
    };
  }

  const parts = getClockParts(date);
  const hour = parts.hour % 12;

  return {
    hour: hour * 30 + parts.minute * 0.5,
    minute: parts.minute * 6 + parts.second * 0.1,
    second: parts.second * 6,
  };
}

function formatClockDisplay(date: Date | null, locale: string) {
  if (!date) {
    return {
      date: "",
      seconds: EMPTY_SECONDS_TEXT,
      time: EMPTY_TIME_TEXT,
    };
  }

  return {
    date: new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "long",
      timeZone: CLOCK_TIME_ZONE,
      weekday: "long",
    }).format(date),
    seconds: new Intl.DateTimeFormat(locale, {
      second: "2-digit",
      timeZone: CLOCK_TIME_ZONE,
    }).format(date),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      timeZone: CLOCK_TIME_ZONE,
    }).format(date),
  };
}

function getClockParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    second: "2-digit",
    timeZone: CLOCK_TIME_ZONE,
  }).formatToParts(date);

  return {
    hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
    minute: Number(parts.find((part) => part.type === "minute")?.value ?? 0),
    second: Number(parts.find((part) => part.type === "second")?.value ?? 0),
  };
}
