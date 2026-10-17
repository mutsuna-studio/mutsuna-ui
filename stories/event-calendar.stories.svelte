<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { expect, userEvent, waitFor, within } from "storybook/test";
  import { EventCalendar } from "@mutsuna/ui/event-calendar";
  import FillDemo from "./event-calendar-fill-demo.svelte";
  import Demo from "./event-calendar-demo.svelte";
  import RemoteDemo from "./event-calendar-remote-demo.svelte";
  const { Story } = defineMeta({ title: "Components/Data Display/Event Calendar", component: EventCalendar, tags: ["autodocs"], parameters: { docs: { description: { component: "表示範囲は前後ボタン・今日・日付選択で切り替えます。タッチでは通常のスワイプで縦・横にスクロールし、長押ししてから指を動かすと予約の範囲を選択できます。スワイプは日付範囲の切り替えには使いません。月表示は狭い画面でも7列を幅に収め、日・週・タイムラインの横スクロールバーは本文に重ねます。" } } } });
  async function instanceIsolationInteraction({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const sections = Array.from(canvasElement.querySelectorAll("section")).filter(section => section.querySelector(":scope > h3"));
    const editable = within(sections[0]);
    const readonly = within(sections[1]);
    const disabled = within(sections[2]);
    const readonlyDays = Array.from(sections[1].querySelectorAll("[data-day]"), element => element.getAttribute("data-day"));
    await userEvent.click(editable.getByRole("button", { name: "次の3日" }));
    await finishNavigation(sections[0]);
    await expect(Array.from(sections[1].querySelectorAll("[data-day]"), element => element.getAttribute("data-day"))).toEqual(readonlyDays);
    await expect(disabled.getByRole("button", { name: "次の週" })).toBeDisabled();
    // Independent instances retain their own edit policy after another one navigates.
    await expect(editable.getByRole("button", { name: "2026-10-08 09:00に予定を作成" })).toBeEnabled();
    await expect(readonly.getByRole("button", { name: "2026-10-05 09:00に予定を作成" })).toBeDisabled();
    await expect(canvas.getByRole("alert")).toHaveTextContent("予定を保存できませんでした");
  }
  async function remoteInteraction({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(canvas.getByRole("button", { name: "取得待ちを試す" }));
    await expect(canvas.getByText("予定を取得中…", { exact: true })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "次の週" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: "2026-10-05 09:00に予定を作成" })).toBeDisabled();
    await userEvent.click(canvas.getByRole("button", { name: /^取得済みの予定 / }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "次の週" }));
    await userEvent.click(canvas.getByRole("button", { name: "次の週" }));
    await expect(canvas.getByTestId("visible-range")).toHaveTextContent("2026-10-19 ～ 2026-10-26");
    await waitFor(() => expect(canvas.queryByText("予定を取得中…")).toBeNull(), { timeout: 5000 });
    await expect(canvas.getByRole("button", { name: /^取得した予定 / })).toHaveAccessibleName(/10月19日/);
    await userEvent.click(canvas.getByRole("button", { name: "取得失敗を試す" }));
    await waitFor(() => expect(canvas.getByRole("alert")).toHaveTextContent("予定を取得できませんでした"), { timeout: 5000 });
    await userEvent.click(canvas.getByRole("button", { name: "再取得" }));
    await waitFor(() => expect(canvas.queryByRole("alert")).toBeNull());
    await waitFor(() => expect(canvas.queryByText("予定を取得中…")).toBeNull(), { timeout: 5000 });
    await userEvent.click(canvas.getByRole("button", { name: "先読みを有効にする" }));
    await waitFor(() => expect(canvas.getByTestId("prefetch-state")).toHaveTextContent("前後の予定を先読み済み"), { timeout: 5000 });
    await userEvent.click(canvas.getByRole("button", { name: "次の週" }));
    await expect(canvas.getByTestId("visible-range")).toHaveTextContent("2026-10-26 ～ 2026-11-02");
    await expect(canvas.queryByText("予定を取得中…")).toBeNull();
    await expect(canvas.getByRole("button", { name: /^取得した予定 / })).toHaveAccessibleName(/10月26日/);
    await finishNavigation(canvasElement);
  }
  async function navigationAnimationInteraction({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="event-calendar"]')!;
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    for (const [label, unit, selector, axis] of [
      ["週表示", "週", ".week-grid", "X"], ["日表示", "日", ".week-grid", "X"],
      ["月表示", "月", ".month-dates", "Y"], ["タイムライン", "日", ".timeline-track", "X"],
      ["日付タイムライン", "7日", ".timeline-rows", "Y"]
    ]) {
      await userEvent.click(canvas.getByRole("button", { name: "カレンダーの表示" }));
      await userEvent.click(body.getByRole("option", { name: label }));
      await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
      canvas.getByRole("button", { name: label === "日付タイムライン" ? /^次の\d+日$/ : `次の${unit}` }).click();
      const lane = root.querySelector<HTMLElement>(selector)!;
      const first = lane.getAnimations()[0];
      await expect(first).toBeDefined();
      await expect((first.effect as KeyframeEffect).getKeyframes()[0].transform).toContain(`translate${axis}(24px)`);
      await expect(root.querySelector('.time-axis')?.getAnimations().length ?? 0).toBe(0);
      await expect(root.querySelector('.month-weekdays')?.getAnimations().length ?? 0).toBe(0);
      canvas.getByRole("button", { name: label === "日付タイムライン" ? /^前の\d+日$/ : `前の${unit}` }).click();
      await expect(first.playState).toBe("idle");
      const second = root.querySelector<HTMLElement>(selector)!.getAnimations()[0];
      await expect((second.effect as KeyframeEffect).getKeyframes()[0].transform).toContain(`translate${axis}(-24px)`);
      await Promise.all(root.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
      await expect(root.getAnimations({ subtree: true }).length).toBe(0);
    }
  }
  async function finishNavigation(element: HTMLElement) {
    await Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {})));
  }
  async function clickSlot(element: HTMLElement) {
    await finishNavigation(element.closest('[data-slot="event-calendar"]')!);
    const box = element.getBoundingClientRect();
    await userEvent.pointer({ target: element, coords: { clientX: box.x + box.width / 2, clientY: box.y + box.height / 2 }, keys: "[MouseLeft]" });
  }
  async function applicationDetailsInteraction({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvasElement.querySelector('[data-slot="event-calendar-details-panel"]')).toBeNull();
    const event = canvas.getByRole("button", { name: /^デザインレビュー / });
    await userEvent.click(event);
    await waitFor(() => expect(body.getByRole("dialog")).toHaveTextContent("デザインレビュー"));
    await expect(body.getByRole("dialog")).toHaveTextContent("10月5日(月曜日)・9:00～10:30");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(event).toHaveFocus());
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
  }
  async function interaction({ canvasElement }: { canvasElement: HTMLElement }) {
    const canvas = within(canvasElement);
    const allDay = canvas.getByRole("button", { name: "複数日にまたがる予定 10月7日(水曜日)～10月9日(金曜日)・終日" });
    await expect(allDay).toBeVisible();
    await userEvent.click(allDay);
    const allDayBody = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(allDayBody.getByRole("dialog")).toBeVisible());
    await expect(allDayBody.getByRole("dialog")).toHaveTextContent("10月7日(水曜日)～10月9日(金曜日)・終日");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(allDay).toHaveFocus());
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "2026-10-06に終日予定を作成" }));
    await waitFor(() => expect(allDayBody.getByRole("dialog")).toBeVisible());
    await expect(allDayBody.getByRole("dialog")).toHaveTextContent("10月6日(火曜日)・終日");
    await userEvent.type(allDayBody.getByRole("textbox", { name: "タイトル" }), "新しい終日予定");
    await expect(canvasElement.querySelector(".all-day-preview")).toHaveTextContent("新しい終日予定");
    await userEvent.click(allDayBody.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvas.getByRole("button", { name: "新しい終日予定 10月6日(火曜日)・終日" })).toBeVisible();
    await expect(canvasElement.querySelector(".all-day-preview")).toBeNull();
    const shortCard = canvasElement.querySelector<HTMLElement>('[data-event-id="short"]')!;
    const nextCard = canvasElement.querySelector<HTMLElement>('[data-event-id="short-next"]')!;
    const halfCard = canvasElement.querySelector<HTMLElement>('[data-event-id="half"]')!;
    await expect(shortCard.getBoundingClientRect().height).toBe(24);
    await expect(halfCard.getBoundingClientRect().height).toBe(24);
    await expect(nextCard.getBoundingClientRect().top - shortCard.getBoundingClientRect().top).toBe(12);
    await expect(nextCard.getBoundingClientRect().left).toBeGreaterThan(shortCard.getBoundingClientRect().left);
    await expect(Number(getComputedStyle(nextCard).zIndex)).toBeGreaterThan(Number(getComputedStyle(shortCard).zIndex));
    const weekdayColor = getComputedStyle(canvas.getByText("5日(月)", { exact: true })).color;
    const saturdayColor = getComputedStyle(canvas.getByText("10日(土)", { exact: true })).color;
    const sundayColor = getComputedStyle(canvas.getByText("11日(日)", { exact: true })).color;
    await expect(saturdayColor).not.toBe(weekdayColor);
    await expect(sundayColor).not.toBe(weekdayColor);
    await expect(saturdayColor).not.toBe(sundayColor);
    const slot = canvas.getByRole("button", { name: "2026-10-06 09:00に予定を作成" });
    await clickSlot(slot);
    const creationBody = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(creationBody.getByRole("dialog")).toBeVisible());
    await userEvent.type(creationBody.getByRole("textbox", { name: "タイトル" }), "キャンセルする予定");
    await userEvent.click(creationBody.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(slot).toHaveFocus());
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvas.queryByRole("button", { name: /^キャンセルする予定 / })).toBeNull();
    await clickSlot(slot);
    await waitFor(() => expect(creationBody.getByRole("dialog")).toBeVisible());
    await userEvent.type(creationBody.getByRole("textbox", { name: "タイトル" }), "新しい予定 1");
    await userEvent.click(creationBody.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("作成: 2026-10-06T09:00 ～ 2026-10-06T09:15");
    const event = canvas.getByRole("button", { name: /^新しい予定 1 / });
    const title = event.querySelector("strong")!;
    await expect(title.getBoundingClientRect().height).toBeGreaterThan(0);
    await expect(title.getBoundingClientRect().bottom).toBeLessThanOrEqual(event.getBoundingClientRect().bottom);
    await expect(event.querySelector("span")).toBeNull();
    await userEvent.click(event);
    const body = within(canvasElement.ownerDocument.body);
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(event).toHaveFocus());
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    for (const edge of ["開始", "終了"]) {
      const handle = canvas.getByRole("button", { name: `新しい予定 1の${edge}時刻を変更` });
      await userEvent.click(handle);
      await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(handle).toHaveFocus());
      await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    }
    event.focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("move: 2026-10-06T09:15");
    const end = canvas.getByRole("button", { name: "新しい予定 1の終了時刻を変更" });
    end.focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("resize-end: 2026-10-06T09:15 ～ 2026-10-06T09:45");
    await userEvent.click(canvas.getByRole("button", { name: "次の週" }));
    await expect(getComputedStyle(canvas.getByText("12日(月)", { exact: true })).color).toBe(sundayColor);
    await userEvent.click(canvas.getByRole("button", { name: "カレンダーの表示" }));
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("option", { name: "月表示" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvasElement.querySelector('[data-slot="event-calendar-month"]')).not.toBeNull();
    await expect(canvasElement.querySelectorAll("[data-month-day]").length).toBe(35);
    await userEvent.click(canvas.getByRole("button", { name: /^10月7日\(水曜日\)の予定を全件表示、他\d件$/ }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await expect(body.getByRole("dialog")).toHaveTextContent("7件の予定");
    await expect(within(body.getByRole("dialog")).getAllByRole("button")).toHaveLength(8);
    await userEvent.click(within(body.getByRole("dialog")).getByRole("button", { name: /^資料のレビュー / }));
    await waitFor(() => expect(body.getAllByRole("dialog")).toHaveLength(1));
    await waitFor(() => expect(body.getByRole("heading", { name: "資料のレビュー" })).toBeVisible());
    await expect(body.getByRole("dialog")).toHaveTextContent("10月7日(水曜日)・16:00～20:00");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "次の月" }));
    await expect(canvas.getByRole("heading", { name: "11月" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "前の月" }));
    await expect(canvas.getByRole("heading", { name: "10月" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "2026-10-13に終日予定を作成" }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await expect(body.getByRole("dialog")).toHaveTextContent("10月13日(火曜日)・終日");
    await userEvent.type(body.getByRole("textbox", { name: "タイトル" }), "月表示の予定");
    await expect(canvasElement.querySelector(".all-day-preview")).toHaveTextContent("月表示の予定");
    await userEvent.click(body.getByRole("button", { name: "キャンセル" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: "カレンダーの表示" }));
    await userEvent.click(body.getByRole("option", { name: "日表示" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvasElement.querySelectorAll("[data-day]").length).toBe(1);
    await expect(canvasElement.querySelector('[data-day="2026-10-01"]')).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "次の日" }));
    await expect(canvasElement.querySelector('[data-day="2026-10-02"]')).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "前の日" }));
    await clickSlot(canvas.getByRole("button", { name: "2026-10-01 09:00に予定を作成" }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.type(body.getByRole("textbox", { name: "タイトル" }), "日表示の予定");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    const dailyEvent = canvas.getByRole("button", { name: /^日表示の予定 / });
    dailyEvent.focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("move: 2026-10-01T09:15");
    await userEvent.click(canvas.getByRole("button", { name: "カレンダーの表示" }));
    await userEvent.click(body.getByRole("option", { name: "タイムライン" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvasElement.querySelector('[data-slot="event-calendar-timeline"]')).not.toBeNull();
    await clickSlot(canvas.getByRole("button", { name: "2026-10-01 09:00 会議室Aに予定を作成" }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.type(body.getByRole("textbox", { name: "タイトル" }), "タイムラインの予定");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    const timelineEvent = canvas.getByRole("button", { name: /^タイムラインの予定 / });
    await expect(timelineEvent.closest("[data-timeline-row]")?.getAttribute("data-timeline-row")).toBe("0");
    timelineEvent.focus();
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("move: 2026-10-01T09:15");
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(canvas.getByRole("button", { name: /^タイムラインの予定 / }).closest("[data-timeline-row]")?.getAttribute("data-timeline-row")).toBe("1");
    await userEvent.click(canvas.getByRole("button", { name: "カレンダーの表示" }));
    await userEvent.click(body.getByRole("option", { name: "日付タイムライン" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await expect(canvasElement.querySelectorAll(".timeline-row")).toHaveLength(35);
    await clickSlot(canvas.getByRole("button", { name: /^2026-10-02 09:00 / }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.type(body.getByRole("textbox", { name: "タイトル" }), "日付タイムラインの予定");
    await userEvent.click(body.getByRole("button", { name: "作成" }));
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    const dateEvent = canvas.getByRole("button", { name: /^日付タイムラインの予定 / });
    dateEvent.focus();
    await userEvent.keyboard("{Alt>}{ArrowDown}{/Alt}");
    await expect(canvas.getByTestId("calendar-action")).toHaveTextContent("move: 2026-10-03T09:00");
    await userEvent.click(canvas.getByRole("button", { name: /^日付タイムラインの予定 / }));
    await waitFor(() => expect(body.getByRole("dialog")).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(getComputedStyle(canvasElement.ownerDocument.body).pointerEvents).not.toBe("none"));
    await userEvent.click(canvas.getByRole("button", { name: /^日付を選択:/ }));
    await waitFor(() => expect(body.getByRole("button", { name: "年月" })).toBeVisible());
    await userEvent.click(body.getByRole("button", { name: "年月" }));
    await userEvent.click(body.getByRole("button", { name: "年を1つ進める" }));
    await userEvent.click(body.getByRole("button", { name: "月を1つ進める" }));
    await userEvent.click(body.getByRole("button", { name: "日付選択へ戻る" }));
    await userEvent.click(body.getByRole("button", { name: "2027年11月15日月曜日" }));
    await expect(canvasElement.querySelector('[data-timeline-date="2027-11-15"]')).not.toBeNull();


  }
</script>
<Story name="Week" asChild><Demo /></Story>
<Story name="Date Timeline" asChild><Demo initialView="date-timeline" /></Story>
<Story name="Remote Events" asChild><RemoteDemo /></Story>
<Story name="Remote Events Test" tags={["!dev", "!autodocs"]} asChild play={remoteInteraction}><RemoteDemo /></Story>
{#snippet states()}
  <div class="grid gap-8"><section><h3 class="mb-2 font-semibold">選択日から3日間</h3><Demo dayCount={3} /></section><section><h3 class="mb-2 font-semibold">閲覧のみ</h3><Demo readonly /></section><section><h3 class="mb-2 font-semibold">読み込み中・操作無効</h3><Demo loading disabled /></section><section><h3 class="mb-2 font-semibold">エラー・狭い画面（横スクロール）</h3><Demo narrow error="予定を保存できませんでした。再度お試しください。" /></section></div>
{/snippet}
<Story name="States" asChild>{@render states()}</Story>
<Story name="Instance Isolation Test" tags={["!dev", "!autodocs"]} asChild play={instanceIsolationInteraction}>{@render states()}</Story>
<Story name="Interaction Test" tags={["!dev", "!autodocs"]} asChild play={interaction}><div style:max-width="1000px"><Demo /></div></Story>
<Story name="Application Details Test" tags={["!dev", "!autodocs"]} asChild play={applicationDetailsInteraction}><div style:width="1100px"><Demo /></div></Story>

<Story name="Navigation Animation Test" tags={["!dev", "!autodocs"]} asChild play={navigationAnimationInteraction}><Demo /></Story>

<Story name="Fill Layout" asChild><FillDemo /></Story>
