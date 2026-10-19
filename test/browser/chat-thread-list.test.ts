import { expect, test, vi } from "vitest";
import { userEvent } from "storybook/test";
import { ChatThreadList } from "@mutsuna/ui/chat-thread-list";
import StatusFixture from "./chat-thread-list-status-fixture.svelte";
import { render } from "./render.js";
import { reactiveProps } from "./props.svelte.js";

test("selection is controlled and click, Enter and Space notify the selected id", async () => {
  const onSelect = vi.fn();
  const props = reactiveProps({
    items: [{ id: "a", title: "最初の会話" }, { id: "b", title: "次の会話" }, { id: "c", title: "操作不可", disabled: true }],
    selectedId: "a", onSelect,
  });
  const view = render(ChatThreadList, props);
  const first = view.getByRole("button", { name: "最初の会話" });
  const next = view.getByRole("button", { name: "次の会話" });
  await userEvent.click(next);
  expect(onSelect).toHaveBeenLastCalledWith("b");
  expect(first.getAttribute("aria-current")).toBe("true");
  props.selectedId = "b";
  await expect.poll(() => next.getAttribute("aria-current")).toBe("true");
  expect(first.hasAttribute("aria-current")).toBe(false);
  next.focus();
  await userEvent.keyboard("{Enter}");
  await userEvent.keyboard(" ");
  expect(onSelect).toHaveBeenCalledTimes(3);
  expect((view.getByRole("button", { name: "操作不可" }) as HTMLButtonElement).disabled).toBe(true);
});
test("loading, error, retry and empty states preserve consumer-owned data", async () => {
  const onRetry = vi.fn();
  const props = reactiveProps({ items: [] as { id: string; title: string }[], loading: true, error: undefined as string | undefined, onRetry });
  const view = render(ChatThreadList, props);
  expect(view.getByRole("navigation").getAttribute("aria-busy")).toBe("true");
  expect(view.getByRole("status").textContent).toContain("読み込み中");
  expect(view.queryByText("会話はまだありません。")).toBeNull();
  props.loading = false; props.error = "読み込みに失敗しました。";
  await expect.poll(() => view.queryByRole("alert")).not.toBeNull();
  await userEvent.click(view.getByRole("button", { name: "再試行" }));
  expect(onRetry).toHaveBeenCalledOnce();
  props.error = undefined;
  await expect.poll(() => view.queryByText("会話はまだありません。")).not.toBeNull();
  props.items = [{ id: "b", title: "復元された会話" }, { id: "a", title: "後の会話" }];
  await expect.poll(() => view.getAllByRole("button").length).toBe(2);
  expect(view.getAllByRole("button").map(item => item.textContent?.trim())).toEqual(["復元された会話", "後の会話"]);
});
test("long text, time and unread counts fit a narrow list and global disabling blocks selection", async () => {
  const onSelect = vi.fn();
  const view = render(ChatThreadList, {
    disabled: true, onSelect, items: [{ id: "long", title: "長い会話のタイトル".repeat(20), preview: "長いメッセージ".repeat(40), time: "10:24", datetime: "2026-10-18T10:24:00+09:00", unreadCount: 120, online: true }],
  });
  view.target.style.width = "240px";
  const list = view.getByRole("navigation");
  expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth);
  const button = view.getByRole("button") as HTMLButtonElement;
  expect(button.disabled).toBe(true);
  expect(button.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
  expect(view.getByLabelText("未読120件").textContent).toBe("99+");
  expect(list.querySelector("time")?.getAttribute("datetime")).toBe("2026-10-18T10:24:00+09:00");
  await userEvent.click(button);
  expect(onSelect).not.toHaveBeenCalled();
});

test("two-line rows keep timestamps aligned with and without unread counts", () => {
  const view = render(ChatThreadList, { items: [
    { id: "a", title: "佐藤 美咲", preview: "余白を広げた案、よさそうです！", time: "10:24", unreadCount: 2 },
    { id: "b", title: "田中 花", preview: "ありがとうございます。確認します。", time: "09:40" },
  ] });
  view.target.style.cssText = "width:280px;padding:0";
  const rows = view.getAllByRole("button");
  const times = rows.map(row => row.querySelector("time")!.getBoundingClientRect());
  expect(times[0].right).toBe(times[1].right);
  expect(rows[0].getBoundingClientRect().height).toBe(rows[1].getBoundingClientRect().height);
  for (const row of rows) {
    expect(row.getBoundingClientRect().height).toBeLessThanOrEqual(64);
    expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
  }
});


test.each(["default", "compact"] as const)("status labels align without squeezing their padding (%s)", (variant) => {
  const view = render(StatusFixture, { variant });
  view.target.style.cssText = "width:240px;padding:0";
  const badges = [...view.target.querySelectorAll<HTMLElement>("[data-slot=badge]")];
  const right = badges[0].getBoundingClientRect().right;
  for (const badge of badges) {
    const rect = badge.getBoundingClientRect();
    const style = getComputedStyle(badge);
    const text = document.createRange(); text.selectNodeContents(badge);
    expect(rect.right).toBe(right);
    expect(parseFloat(style.paddingLeft)).toBeGreaterThan(0);
    expect(style.paddingLeft).toBe(style.paddingRight);
    expect(rect.width + 1).toBeGreaterThanOrEqual(text.getBoundingClientRect().width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight));
    text.detach();
  }
  expect(view.getByRole("navigation").scrollWidth).toBeLessThanOrEqual(view.getByRole("navigation").clientWidth);
});
