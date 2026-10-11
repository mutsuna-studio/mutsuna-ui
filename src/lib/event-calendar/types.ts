import type { Snippet } from "svelte";

export type EventCalendarView = "day" | "week" | "month" | "timeline" | "date-timeline";

/** Displayed civil dates (YYYY-MM-DD), including adjacent-month cells. End is exclusive. */
export interface EventCalendarVisibleRange extends EventCalendarRange {
  view: EventCalendarView;
}
export interface EventCalendarPrefetchRange {
  previous: EventCalendarVisibleRange;
  next: EventCalendarVisibleRange;
}

/** Civil date/time in the consumer's display zone: YYYY-MM-DDTHH:mm (no offset).
 * Convert instants in the consumer; the calendar never infers the browser's zone. */
export interface EventCalendarRange {
  start: string;
  end: string;
}
export interface EventCalendarEvent extends EventCalendarRange {
  id: string;
  title: string;
  rowId?: string;
  /** All-day display. start/end are YYYY-MM-DD; end is exclusive. No time-grid gestures. */
  allDay?: boolean;
  description?: string;
  /** CSS color; the default uses the primary theme token. */
  color?: string;
  /** Disables moving/resizing this event, while keeping details accessible. */
  editable?: boolean;
}
export interface EventCalendarChange extends EventCalendarRange {
  rowId?: string;
  event: EventCalendarEvent;
  kind: "move" | "resize-start" | "resize-end";
}
export interface EventCalendarCreate extends EventCalendarRange {
  rowId?: string;
  /** All-day creation uses YYYY-MM-DD dates with an exclusive end. */
  allDay?: boolean;
}
/** The application can restore focus to this trigger when its UI closes. */
export interface EventCalendarInteractionContext {
  trigger: HTMLElement;
}
/** Decorative civil-date/time range. End is exclusive; no edit restrictions.
 * YYYY-MM-DD covers whole days; YYYY-MM-DDTHH:mm covers exact times.
 * rowId targets only a resource timeline row. Without it, applies to all rows/views. */
export interface EventCalendarBackgroundRange extends EventCalendarRange {
  id: string;
  color: string;
  rowId?: string;
}
export interface EventCalendarProps {
  /** Bindable displayed day or any YYYY-MM-DD within the week/month. Required for deterministic SSR. */
  date: string;
  /** Bindable display mode; defaults to week. */
  view?: EventCalendarView;
  onViewChange?: (view: EventCalendarView) => void;
  /** Overrides day/week display length (1–31). Explicit counts start at date.
   * Omit for day=1 and week=7 aligned to weekStartsOn.
   * Date timeline uses viewport-fit visible dates; this count sets its minimum buffered window. */
  dayCount?: number;
  events?: readonly EventCalendarEvent[];
  /** Decorative backgrounds, painted in array order behind events and grid lines. */
  backgroundRanges?: readonly EventCalendarBackgroundRange[];
  rows?: readonly EventCalendarRow[];
  /** Minimum pixels per hour in timeline view (default 64, minimum 48). Expands to fill available width. */
  timelineHourWidth?: number;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  locale?: string;
  ariaLabel?: string;
  startHour?: number;
  endHour?: number;
  /** Minute increment (default 15), must divide 60. */
  step?: number;
  /** Pixels per hour (default 48). */
  hourHeight?: number;
  /** Minimum visual event height in pixels (default 24, at least 20). Does not change duration. */
  eventMinHeight?: number;
  /** Display-zone civil time for the current-time marker and Today. Consumer updates it.
   * Without it, no marker is rendered and Today uses the browser local date. */
  currentTime?: string;
  readonly?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Event fetching only: keeps navigation, scrolling and cached-event details available; disables edits. */
  eventsLoading?: boolean;
  /** Fetch failure, distinct from an empty result. Disables edits until resolved. */
  eventsError?: string;
  onEventsRetry?: (range: EventCalendarVisibleRange) => void;
  /** Initial client mount and visible range/view changes, including bound prop changes. Not called during SSR. */
  onVisibleRangeChange?: (range: EventCalendarVisibleRange) => void;
  /** Initial client mount and adjacent-range/view changes. App owns fetching and caching; not called during SSR. */
  onPrefetchRange?: (ranges: EventCalendarPrefetchRange) => void;
  error?: string;
  class?: string;
  /** Notification after navigation updates date. Use bind:date to share display state. */
  onDateChange?: (date: string) => void;
  /** Selection request from a click or completed drag. Does not save an event or open UI. */
  onCreate?: (range: EventCalendarCreate, context: EventCalendarInteractionContext) => void;
  /** Application-owned pending creation shown until saved/cancelled. Never included in events. */
  draft?: EventCalendarEvent | null;
  onEventChange?: (change: EventCalendarChange) => void;
  /** Selection notification only; the application owns details and focus restoration. */
  onEventClick?: (event: EventCalendarEvent, context: EventCalendarInteractionContext) => void;
  eventContent?: Snippet<[EventCalendarEvent]>;
}

export interface EventCalendarRow {
  id: string;
  label: string;
}
