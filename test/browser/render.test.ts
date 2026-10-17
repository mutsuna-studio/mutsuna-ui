import { expect, test } from "vitest";
import { userEvent } from "storybook/test";
import RenderFixture from "./render-fixture.svelte";
import { render } from "./render.js";
test("render accepts required props combined with HTML attributes", async () => {
 let clicks = 0;
 // Keep the helper's required-prop inference checked by svelte-check.
 if (false) {
  // @ts-expect-error label is required
  render(RenderFixture, { disabled: true });
 }
 const view = render(RenderFixture, { label: "追加確認", onclick: () => clicks++ });
 const button = view.getByRole("button", { name: "追加確認" });
 button.focus();
 await userEvent.keyboard("{Enter}");
 expect(clicks).toBe(1);
 const disabled = render(RenderFixture, { label: "無効", disabled: true, onclick: () => clicks++ });
 await userEvent.click(disabled.getByRole("button", { name: "無効" }));
 expect(clicks).toBe(1);
});
