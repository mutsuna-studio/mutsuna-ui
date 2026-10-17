import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import { parseDate } from "@internationalized/date";
import { Calendar } from "@mutsuna/ui/calendar";
import { BusinessHoursFields } from "@mutsuna/ui/business-hours-fields";
import { MarkdownEditor } from "@mutsuna/ui/markdown";
import Fixture from "./controls-fixture.svelte";
import { contrastRatio } from "./contrast.js";
import { render } from "./render.js";

test("BusinessHoursFields exposes names for weekday and holiday time inputs", () => {
  const view = render(BusinessHoursFields, { title: "営業時間", description: "曜日別の設定", businessHours: [{ weekday: "monday", label: "月曜日", isOpen: true, opensAt: "09:00", closesAt: "18:00" }], holidayDates: "", holidayIsOpen: true, holidayOpensAt: "10:00", holidayClosesAt: "17:00", holidayPriority: true });
  for (const name of ["月曜日の開始時刻", "月曜日の終了時刻", "祝日の開始時刻", "祝日の終了時刻"]) {
    expect(view.getByLabelText(name).getAttribute("type")).toBe("time");
  }
});

test("Markdown editor forwards the visible label to its editable surface", async () => {
  const view = render(MarkdownEditor, { id: "contract-markdown", label: "説明", value: "テスト" });
  await expect.poll(() => view.queryByRole("textbox", { name: "説明" })).not.toBeNull();
});

test("Calendar retains a keyboard-accessible grid and readable Sunday coloring", async () => {
  const view = render(Calendar, { type: "single", value: parseDate("2026-10-05"), placeholder: parseDate("2026-10-05"), locale: "ja-JP" });
  expect(view.getByRole("grid")).toBeTruthy();
  const sunday = view.getByRole("button", { name: /2026年10月4日/ });
  expect(getComputedStyle(sunday).color).not.toBe(getComputedStyle(view.getByRole("button", { name: /2026年10月6日/ })).color);
  expect(contrastRatio(getComputedStyle(sunday).color, getComputedStyle(document.documentElement).getPropertyValue("--background"))).toBeGreaterThanOrEqual(4.5);
  const selected = view.getByRole("button", { name: /2026年10月5日/ });
  selected.focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.poll(() => document.activeElement?.getAttribute("aria-label")).toContain("10月6日");
});

test("input group and select focus surfaces retain borders and avoid an outer ring", async () => {
  const view = render(Fixture, {});
  for (const [role, name] of [["textbox", "入力グループ"], ["button", "通常の選択"], ["combobox", "検索付き選択"]] as const) {
    const element = view.getByRole(role, { name });
    element.focus();
    await userEvent.keyboard("{Shift}");
    const surface = element.closest<HTMLElement>('[data-slot="input-group"], [data-slot="select-trigger"]')!;
    const style = getComputedStyle(surface);
    for (const side of ["Top", "Right", "Bottom", "Left"] as const) expect(style[`border${side}Width`]).toBe("1px");
    expect(style.boxShadow).toBe("none");
  }
});
