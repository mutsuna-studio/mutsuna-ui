import { flushSync, tick, untrack } from "svelte";
import { addDays } from "../../event-calendar/layout.js";
import type { EventCalendarEvent, EventCalendarProps, EventCalendarView, EventCalendarVisibleRange } from "../../event-calendar/types.js";

interface ViewportContext {
  readonly view: EventCalendarView;
  readonly date: string;
  readonly nowMinute: number;
  readonly todayDate: string;
  readonly events: readonly EventCalendarEvent[];
  readonly timelineRows: readonly { id: string | undefined; label: string; date: string }[];
  readonly effectiveTimelineHourWidth: number;
  readonly config: { from: number; to: number; height: number };
  readonly days: readonly string[];
  readonly isTimeline: boolean;
  readonly viewport: HTMLDivElement | null;
  readonly layout: EventCalendarProps["layout"];
  readonly dayCount: number | undefined;
  readonly timelineBufferCount: number;
  readonly drag: { moved: boolean } | null;
  changeDate(value: string): void;
}

/** Per-calendar viewport state. DOM access starts only when an action is mounted. */
export function createCalendarViewport(context: ViewportContext) {
  const changeDate = (value: string) => context.changeDate(value);

  let fixedHeaderHeight = $state(0);
  let timeViewportHeight = $state(0);
  let timelineViewportHeight = $state(0);
  let dateTimelineRange = $state<EventCalendarVisibleRange>();
  let dateTimelineBufferStart = $state("");
  let timelineAvailableWidth = $state(0);
  let monthHeight = $state(480);
  let monthWeekHeights = $state<Record<string, number>>({});
  const dayScrollers = new Set<HTMLElement>();
  let dayScrollWidth = $state(0);
  let dayScrollOffset = $state(0);
  let dayViewportWidth = $state(0);
  let timelineNowIndicator = $state<{ left: number; top: number; height: number; marker: boolean } | null>(null);
  let navigationAnimations: Animation[] = [];

  function stopNavigationAnimation() {
    for (const animation of navigationAnimations) animation.cancel();
    navigationAnimations = [];
  }

  function animateNavigation(direction: -1 | 1) {
    const root = context.viewport?.closest('[data-slot="event-calendar"]');
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const vertical = context.view === "month" || context.view === "date-timeline";
    const selector = context.view === "month" ? ".month-dates" : context.view === "date-timeline" ? ".timeline-rows" : context.view === "timeline" ? ".timeline-track" : ".day-heading-track, .all-day-grid, .week-grid";
    for (const element of root.querySelectorAll<HTMLElement>(selector)) {
      const transform = getComputedStyle(element).transform;
      const base = transform === "none" ? "" : transform;
      const distance = direction * 24;
      const animation = element.animate([
        { transform: `${vertical ? "translateY" : "translateX"}(${distance}px) ${base}`, opacity: 0 },
        { transform: base || "none", opacity: 1 }
      ], { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
      navigationAnimations.push(animation);
      const cleanup = () => {
        navigationAnimations = navigationAnimations.filter(item => item !== animation);
        if (!navigationAnimations.length && context.view === "date-timeline") context.viewport?.dispatchEvent(new Event("scroll"));
      };
      animation.onfinish = cleanup;
      animation.oncancel = cleanup;
    }
  }

  function frameResizeObserver(callback: () => void) {
    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; callback(); });
    });
    return {
      observe: (element: Element) => observer.observe(element),
      disconnect() { observer.disconnect(); if (frame !== undefined) cancelAnimationFrame(frame); }
    };
  }

  function measureTimeViewport(surface: HTMLDivElement) {
    const measure = () => { timeViewportHeight = surface.clientHeight; };
    measure();
    const observer = frameResizeObserver(measure);
    observer.observe(surface);
    return { destroy() { observer.disconnect(); timeViewportHeight = 0; } };
  }

  function preserveTimePosition(surface: HTMLDivElement, mode: EventCalendarProps["layout"]) {
    const candidate = surface.closest('.calendar-frame')?.querySelector<HTMLElement>('.calendar-headings');
    if (!candidate) return;
    const element: HTMLElement = candidate;
    let previousHeight: number | undefined;
    function compensate() {
      const height = element.getBoundingClientRect().height;
      const headingHeight = element.querySelector(".day-headings")?.getBoundingClientRect().height ?? 0;
      // The fixed header uses its own space. Retain enough body scroll range
      // to keep time labels anchored when the all-day row count changes.
      surface.style.maxHeight = mode === "fill" ? "" : `min(calc(42rem - ${height}px), ${context.config.height - Math.max(0, height - headingHeight - 33)}px)`;
      if (previousHeight === undefined) {
        // Anchor the time grid to the minimum all-day row, including on first render.
        surface.scrollTop += Math.max(0, height - headingHeight - 33);
      } else {
        surface.scrollTop += height - previousHeight;
      }
      previousHeight = height;
    }
    const observer = frameResizeObserver(compensate);
    observer.observe(element);
    observer.observe(surface);
    return { update(value: EventCalendarProps["layout"]) { mode = value; compensate(); }, destroy() { observer.disconnect(); } };
  }

  function fixedHeaderScroll(surface: HTMLDivElement) {
    const header = surface.closest('.calendar-frame')?.querySelector<HTMLElement>('.fixed-calendar-header');
    if (!header) return;
    function forwardWheel(event: WheelEvent) {
      if (event.ctrlKey) return;
      if (!surface.classList.contains("timeline-viewport") && Math.abs(event.deltaX) >= Math.abs(event.deltaY)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1;
      surface.scrollTop += event.deltaY * unit;
      if (surface.classList.contains("timeline-viewport")) surface.scrollLeft += event.deltaX * unit;
      if (event.cancelable) event.preventDefault();
    }
    header.addEventListener("wheel", forwardWheel, { passive: false });
    function sync() {
      fixedHeaderHeight = header!.getBoundingClientRect().height;
      header!.style.marginRight = `${surface.offsetWidth - surface.clientWidth}px`;
      header!.scrollLeft = surface.scrollLeft;
      if (surface.classList.contains("timeline-viewport")) {
        const frame = surface.closest(".calendar-frame")!.getBoundingClientRect();
        const body = surface.getBoundingClientRect();
        const rows = Array.from(surface.querySelectorAll<HTMLElement>("[data-timeline-date]"))
          .filter(row => row.dataset.timelineDate === context.todayDate);
        const first = rows[0];
        const last = rows.at(-1);
        const track = first?.querySelector<HTMLElement>(".timeline-track");
        if (first && track && last && context.nowMinute >= context.config.from && context.nowMinute < context.config.to) {
          const start = first.getBoundingClientRect().top;
          const end = Math.min(last.getBoundingClientRect().bottom, body.top + surface.clientHeight);
          const top = Math.max(start, body.top);
          const left = track.getBoundingClientRect().left + (context.nowMinute - context.config.from) / 60 * context.effectiveTimelineHourWidth;
          timelineNowIndicator = end > top && left >= body.left + 144 && left < body.left + surface.clientWidth
            ? { left: left - frame.left, top: top - frame.top, height: end - top, marker: start >= body.top - .5 } : null;
        } else timelineNowIndicator = null;
      }
    }
    $effect(() => { void context.view; void context.date; void context.nowMinute; void context.events; void context.timelineRows; void context.effectiveTimelineHourWidth; void context.config; tick().then(sync); });
    const observer = frameResizeObserver(sync);
    observer.observe(surface);
    surface.addEventListener('scroll', sync);
    sync();
    return { destroy() { observer.disconnect(); surface.removeEventListener('scroll', sync); header!.removeEventListener('wheel', forwardWheel); } };
  }

  /** Only scroll the selected days; range navigation belongs to the toolbar. */
  function synchronizedDayScroll(element: HTMLElement) {
    function measure() {
      const width = Math.max(element.clientWidth, Math.max(280, 56 + context.days.length * 100) - 56);
      element.style.setProperty("--day-scroll-width", `${width}px`);
      if (element.dataset.slot === "event-calendar-day-scroll") {
        dayScrollWidth = width;
        dayViewportWidth = element.clientWidth;
        dayScrollOffset = element.scrollLeft;
      }
    }
    function sync() {
      dayScrollOffset = element.scrollLeft;
      for (const other of dayScrollers) {
        if (other !== element && Math.abs(other.scrollLeft - element.scrollLeft) > .5) other.scrollLeft = element.scrollLeft;
      }
    }
    dayScrollers.add(element);
    measure();
    $effect(() => { void context.days.length; untrack(measure); });
    element.addEventListener("scroll", sync, { passive: true });
    const observer = frameResizeObserver(measure); observer.observe(element);
    return { destroy() { observer.disconnect(); element.removeEventListener("scroll", sync); dayScrollers.delete(element); } };
  }

  function measureMonthWeek(element: HTMLDivElement, key: string) {
    const cell = element.querySelector<HTMLElement>(".month-day");
    function measure() {
      const height = (cell ?? element).clientHeight;
      if (monthWeekHeights[key] !== height) monthWeekHeights[key] = height;
    }
    measure();
    const observer = frameResizeObserver(measure);
    observer.observe(cell ?? element);
    return { destroy() { observer.disconnect(); delete monthWeekHeights[key]; } };
  }

  function fitMonthViewport(element: HTMLDivElement, mode: EventCalendarProps["layout"]) {
    function resize() {
      // Size the whole month from its actual screen position, including headers
      // and surrounding app content, rather than fixing the height of each week.
      monthHeight = mode === "fill" ? element.clientHeight : Math.max(0, Math.floor(window.innerHeight - element.getBoundingClientRect().top - 16));
    }
    resize();
    const observer = frameResizeObserver(resize);
    observer.observe(element.parentElement!);
    observer.observe(element);
    window.addEventListener("resize", resize);
    return { update(value: EventCalendarProps["layout"]) { mode = value; resize(); }, destroy() { observer.disconnect(); window.removeEventListener("resize", resize); } };
  }

  function observeTimelineScrollbar(element: HTMLElement) {
    function resize() {
      timelineAvailableWidth = element.clientWidth;
    }
    resize();
    const observer = frameResizeObserver(resize);
    observer.observe(element);
    return { destroy() { observer.disconnect(); timelineAvailableWidth = 0; } };
  }

  function horizontalScroll(element: HTMLElement) {
    $effect(() => {
      const body = context.isTimeline ? context.viewport : context.viewport?.querySelector<HTMLElement>('[data-slot="event-calendar-day-scroll"]');
      if (!body) return;
      const fromBody = () => { if (Math.abs(element.scrollLeft - body.scrollLeft) > .5) element.scrollLeft = body.scrollLeft; };
      const fromBar = () => { if (Math.abs(body.scrollLeft - element.scrollLeft) > .5) body.scrollLeft = element.scrollLeft; };
      fromBody();
      body.addEventListener("scroll", fromBody, { passive: true });
      element.addEventListener("scroll", fromBar, { passive: true });
      return () => { body.removeEventListener("scroll", fromBody); element.removeEventListener("scroll", fromBar); };
    });
  }

  function continuousDateTimeline(element: HTMLElement) {
    timelineViewportHeight = element.clientHeight;
    let frame: number | undefined;
    let generation = 0;
    let aligning = true;
    let scrollDate = "";
    let lastEvents: readonly EventCalendarEvent[] | undefined;
    let lastCount: number | undefined;
    let lastBufferCount: number | undefined;
    function measure() {
      if (context.view !== "date-timeline" || aligning || context.drag?.moved || navigationAnimations.length) return;
      if (context.layout === "fill" && timelineViewportHeight !== element.clientHeight) {
        timelineViewportHeight = element.clientHeight;
        schedule();
        return;
      }
      const bounds = element.getBoundingClientRect();
      const visible = Array.from(element.querySelectorAll<HTMLElement>("[data-timeline-date]")).filter(row => {
        const rect = row.getBoundingClientRect();
        return rect.bottom > bounds.top + 1 && rect.top < bounds.top + element.clientHeight - 1;
      });
      if (!visible.length) return;
      const first = visible[0], start = first.dataset.timelineDate!;
      const end = addDays(visible[visible.length - 1].dataset.timelineDate!, 1);
      if (context.date !== start) {
        scrollDate = start;
        flushSync(() => changeDate(start));
      }
      const index = context.timelineRows.findIndex(row => row.date === start);
      if (index < 7 || index > context.timelineRows.length - 14) {
        const offset = first.getBoundingClientRect().top - bounds.top;
        aligning = true;
        flushSync(() => dateTimelineBufferStart = addDays(start, -14));
        const anchor = element.querySelector<HTMLElement>(`[data-timeline-date="${start}"]`);
        if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - bounds.top - offset;
        aligning = false;
      }
      if (dateTimelineRange?.start !== start || dateTimelineRange.end !== end) dateTimelineRange = { start, end, view: "date-timeline" };
    }
    function schedule() {
      if (frame !== undefined) return;
      frame = requestAnimationFrame(() => { frame = undefined; measure(); });
    }
    // Preserve the first visible date and its pixel offset when the bounded
    // date window is rebased or fetched events change row heights.
    $effect.pre(() => {
      const value = context.date, mode = context.view, currentEvents = context.events, currentCount = context.dayCount, currentBufferCount = context.timelineBufferCount;
      if (mode !== "date-timeline") { scrollDate = ""; return; }
      untrack(() => {
        if (value === scrollDate && currentEvents === lastEvents && currentCount === lastCount && currentBufferCount === lastBufferCount) return;
        const before = element.querySelector<HTMLElement>(`[data-timeline-date="${value}"]`);
        const offset = value === scrollDate && before && currentBufferCount === lastBufferCount ? before.getBoundingClientRect().top - element.getBoundingClientRect().top : 0;
        lastEvents = currentEvents; lastCount = currentCount; lastBufferCount = currentBufferCount;
        dateTimelineBufferStart = addDays(value, -14);
        const id = ++generation;
        aligning = true;
        void tick().then(() => {
          if (id !== generation || context.view !== "date-timeline") return;
          const anchor = element.querySelector<HTMLElement>(`[data-timeline-date="${value}"]`);
          if (anchor) element.scrollTop += anchor.getBoundingClientRect().top - element.getBoundingClientRect().top - offset;
          scrollDate = value;
          aligning = false;
          measure();
        });
      });
    });
    element.addEventListener("scroll", schedule, { passive: true });
    const observer = frameResizeObserver(schedule);
    observer.observe(element);
    return { destroy() { generation++; element.removeEventListener("scroll", schedule); observer.disconnect(); if (frame !== undefined) cancelAnimationFrame(frame); } };
  }
  return {
    stopNavigationAnimation,
    animateNavigation,
    measureTimeViewport,
    preserveTimePosition,
    fixedHeaderScroll,
    synchronizedDayScroll,
    measureMonthWeek,
    fitMonthViewport,
    observeTimelineScrollbar,
    horizontalScroll,
    continuousDateTimeline,
    resetDayScroll() { for (const element of dayScrollers) element.scrollLeft = 0; },
    get fixedHeaderHeight() { return fixedHeaderHeight; },
    get timeViewportHeight() { return timeViewportHeight; },
    get timelineViewportHeight() { return timelineViewportHeight; },
    get dateTimelineRange() { return dateTimelineRange; },
    get dateTimelineBufferStart() { return dateTimelineBufferStart; },
    get timelineAvailableWidth() { return timelineAvailableWidth; },
    get monthHeight() { return monthHeight; },
    get monthWeekHeights() { return monthWeekHeights; },
    get dayScrollWidth() { return dayScrollWidth; },
    get dayScrollOffset() { return dayScrollOffset; },
    get dayViewportWidth() { return dayViewportWidth; },
    get timelineNowIndicator() { return timelineNowIndicator; },
  };
}
