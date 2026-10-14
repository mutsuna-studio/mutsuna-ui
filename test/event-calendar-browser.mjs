import assert from "node:assert/strict";

/** Real pointer/hydration coverage for the packed Astro consumer. */
export async function verifyEventCalendar(page) {
  page.setDefaultTimeout(15000);
  const calendar = page.locator("#event-calendar-probe");
  const result = calendar.locator("[data-calendar-result]");
  async function verifyNowIndicator(timelineMode = false) {
    await calendar.evaluate(element => Promise.all(element.getAnimations({ subtree: true }).map(animation => animation.finished.catch(() => {}))));
    if (timelineMode) await calendar.locator('.timeline-viewport').evaluate(element => {
      const row = element.querySelector('[data-timeline-date="2026-10-05"]');
      element.scrollTop += row.getBoundingClientRect().top - element.getBoundingClientRect().top;
    });
    await page.waitForFunction(({ timelineMode }) => {
      const root = document.querySelector('#event-calendar-probe');
      const marker = root.querySelector(timelineMode ? '.timeline-now' : '.now-marker');
      if (!marker) return false;
      const rect = marker.getBoundingClientRect();
      if (timelineMode) {
        const row = root.querySelector('[data-timeline-date="2026-10-05"]');
        const track = row.querySelector('.timeline-track').getBoundingClientRect();
        const hours = root.querySelector('.timeline-hours span');
        const nextHour = hours.nextElementSibling;
        const hourWidth = nextHour.getBoundingClientRect().left - hours.getBoundingClientRect().left;
        const dot = getComputedStyle(marker, '::before');
        return Math.abs(rect.left + rect.width / 2 - (track.left + 2.25 * hourWidth)) < 1
          && Math.abs(rect.top - row.getBoundingClientRect().top) < 1
          && Math.abs(parseFloat(dot.left) + parseFloat(dot.width) / 2 - rect.width / 2) < .1
          && Math.abs(parseFloat(dot.top) + parseFloat(dot.height) / 2) < .1
          && root.querySelectorAll('.timeline-now').length === 1;
      }
      const column = root.querySelector('[data-day="2026-10-05"]').getBoundingClientRect();
      const line = root.querySelector('.now-line').getBoundingClientRect();
      return Math.abs(rect.left + rect.width / 2 - column.left - 1) < 1.1
        && Math.abs(rect.top + rect.height / 2 - line.top - line.height / 2) < .1;
    }, { timelineMode });
    assert.equal(await calendar.locator('[data-slot="event-calendar"]').evaluate(element => getComputedStyle(element).overflow), 'hidden', 'contents are clipped to the outer rounded border');
  }
  await verifyNowIndicator();
  async function verifyFixedHeaderLayout() {
    const savedStyle = await calendar.getAttribute('style');
    await calendar.evaluate(element => { element.style.width = '500px'; element.style.maxWidth = '500px'; });
    await calendar.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const layout = await calendar.evaluate(async element => {
      const surface = element.querySelector('.calendar-viewport');
      const header = element.querySelector('.fixed-calendar-header');
      const initialTop = surface.scrollTop;
      const horizontal = surface.querySelector('[data-slot="event-calendar-day-scroll"]') ?? surface;
      const initialLeft = horizontal.scrollLeft;
      const oldHeight = surface.style.height;
      surface.style.height = '120px';
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const top = header.getBoundingClientRect().top;
      const bottom = header.getBoundingClientRect().bottom;
      const dateTimeline = surface.classList.contains('date-timeline');
      const timeline = surface.classList.contains('timeline-viewport');
      if (!dateTimeline) header.dispatchEvent(new WheelEvent('wheel', { deltaY: 48, bubbles: true, cancelable: true }));
      else surface.scrollTop += 48;
      if (timeline) header.dispatchEvent(new WheelEvent('wheel', { deltaX: 80, bubbles: true, cancelable: true }));
      else horizontal.scrollLeft = 80;
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const heading = header.querySelector('.day-heading') ?? header.querySelector('.timeline-hours');
      const column = surface.querySelector('.day-column') ?? surface.querySelector('.timeline-track');
      const result = { headerOutside: !surface.contains(header), top, bottom,
        afterTop: header.getBoundingClientRect().top, afterBottom: header.getBoundingClientRect().bottom,
        scrollTop: surface.getBoundingClientRect().top, bodyScrolled: surface.scrollTop > initialTop, scrollLeft: horizontal.scrollLeft, hasHorizontalOverflow: horizontal.scrollWidth > horizontal.clientWidth,
        headerLeft: timeline ? header.scrollLeft : header.querySelector('.day-scroller').scrollLeft, headingX: heading.getBoundingClientRect().x, columnX: column.getBoundingClientRect().x };
      surface.style.height = oldHeight;
      surface.scrollTop = initialTop;
      horizontal.scrollLeft = initialLeft;
      return result;
    });
    assert.ok(layout.headerOutside, 'fixed headings are outside the element drawing scrollbars');
    assert.equal(layout.top, layout.afterTop);
    assert.equal(layout.bottom, layout.afterBottom);
    assert.ok(layout.scrollTop >= layout.bottom - 1, 'vertical scrollbar starts below the fixed header');
    assert.ok(layout.bodyScrolled, 'wheel input over a fixed header still scrolls the event body');
    assert.ok(!layout.hasHorizontalOverflow || layout.scrollLeft > 0);
    assert.ok(Math.abs(layout.headerLeft - layout.scrollLeft) < 1);
    assert.ok(Math.abs(layout.headingX - layout.columnX) < 1, 'headings and event columns stay aligned while scrolling horizontally');
    await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); }, savedStyle);
  }
  const initialViewport = page.viewportSize();
  const initialStyle = await calendar.getAttribute('style');
  await page.setViewportSize({ width: 1400, height: 420 });
  await calendar.evaluate(element => { element.style.maxWidth = '1100px'; element.style.width = '1100px'; });
  await calendar.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await calendar.locator('[data-slot="event-calendar-details-panel"]').count(), 0);
  const edges = await calendar.evaluate(element => {
    const main = element.querySelector('.calendar-main').getBoundingClientRect();
    const sheet = element.querySelector('.calendar-viewport .calendar-sheet');
    const lastDay = element.querySelector('.day-column:last-child').getBoundingClientRect();
    const scroll = element.querySelector('.calendar-viewport');
    return { mainHeight: main.height, mainBottom: main.bottom,
      sheetBorder: getComputedStyle(sheet).borderRightWidth,
      gridRight: lastDay.right, sheetRight: sheet.getBoundingClientRect().right,
      scrollbarWidth: getComputedStyle(scroll).scrollbarWidth, gutter: getComputedStyle(scroll).scrollbarGutter, nativeGutter: scroll.offsetWidth - scroll.clientWidth };
  });
  assert.equal(await calendar.locator('[data-slot="event-calendar-day-scroll"]').evaluate(element => getComputedStyle(element).scrollbarGutter), 'auto', 'horizontal scrolling reserves no unused vertical gutter');
  assert.equal(edges.sheetBorder, '0px', 'the sheet does not duplicate the outer calendar border');
  assert.ok(Math.abs(edges.sheetRight - edges.gridRight) < 1, `the final date column reaches the body sheet edge (${JSON.stringify(edges)})`);
  assert.equal(edges.scrollbarWidth, 'none', 'the native vertical bar leaves no reserved body width');
  assert.equal(edges.gutter, 'auto');
  assert.equal(edges.nativeGutter, 0, 'the calendar scrollbar overlays the event body');
  const nativeScrollbarWidth = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;width:64px;height:64px;overflow-y:scroll;scrollbar-gutter:stable;scrollbar-width:auto';
    const content = document.createElement('div'); content.style.height = '128px'; probe.append(content); document.body.append(probe);
    const width = probe.offsetWidth - probe.clientWidth; probe.remove(); return width;
  });
  if (process.platform === 'linux') assert.ok(nativeScrollbarWidth > 0, 'Linux tests a classic scrollbar environment without hiding native bars');
  console.log(`EventCalendar: native scrollbar ${nativeScrollbarWidth}px, calendar reserved width ${edges.nativeGutter}px`);
  await calendar.locator('.calendar-viewport').evaluate(element => { element.style.height = '240px'; element.scrollTop += 2; });
  await page.waitForFunction(() => document.querySelector('#event-calendar-probe .calendar-viewport').dataset.scrollbarState === 'visible');
  await calendar.locator('.calendar-viewport').evaluate(element => { element.style.removeProperty('height'); });
  await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); }, initialStyle);
  if (initialViewport) await page.setViewportSize(initialViewport);
  await verifyFixedHeaderLayout();
  async function drag(locator, dx, dy, cancel = false) {
    await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== "none");
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    assert.ok(box);
    const originalBackground = await locator.evaluate(element => {
      const card = element.closest('.calendar-event');
      return card ? getComputedStyle(card).backgroundColor : null;
    });
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 8 });
    if (originalBackground !== null) {
      assert.equal(await calendar.locator('.drag-preview').evaluate(element => getComputedStyle(element).backgroundColor), originalBackground,
        'moving and resizing retain the rendered event color');
    }
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up();
  }
  async function expectResult(expected) {
    await page.waitForFunction(expected => document.querySelector("[data-calendar-result]").textContent === expected, expected);
    assert.equal(await result.textContent(), expected);
  }
  // Backgrounds render in every mode without entering event layout or hit testing.
  for (const [label, expected] of [["週表示", 1], ["日表示", 1], ["月表示", 1], ["タイムライン", 3], ["日付タイムライン", 1]]) {
    await selectView(label);
    const bg = calendar.locator('[data-background-id="global-bg"]');
    assert.equal(await bg.count(), expected, `${label}: global range applies to the visible rows`);
    assert.equal(await bg.first().evaluate(element => getComputedStyle(element).backgroundColor), 'rgb(230, 235, 240)');
    assert.equal(await bg.first().evaluate(element => getComputedStyle(element).pointerEvents), 'none');
    assert.equal(await bg.first().getAttribute('aria-hidden'), 'true');
    assert.equal(await calendar.locator('[data-background-id="row-bg"]').count(), label === "タイムライン" ? 1 : 0);
    if (label === "週表示" || label === "日表示") {
      assert.equal(await bg.first().evaluate(element => element.offsetHeight), 48);
      assert.equal(await calendar.getByRole('button', { name: '2026-10-05 12:00に予定を作成', exact: true }).isEnabled(), true);
    }
  }
  await selectView("週表示");
  console.log("EventCalendar: week pointer and touch checks");
  async function touchSwipe(locator, dy) {
    await locator.scrollIntoViewIfNeeded();
    const box = await locator.boundingBox();
    assert.ok(box);
    const session = await page.context().newCDPSession(page);
    try {
      await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      const x = box.x + box.width / 2, y = box.y + box.height / 2;
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + dy * i / 8 }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    } finally {
      await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
      await session.detach();
    }
  }
  const creationSlot = calendar.getByRole("button", { name: "2026-10-06 09:00に予定を作成" });
  await creationSlot.scrollIntoViewIfNeeded();
  let slotBox = await creationSlot.boundingBox();
  assert.ok(slotBox);
  const touchSession = await page.context().newCDPSession(page);
  try {
    await touchSession.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    for (const moves of [1, 8]) {
      await creationSlot.scrollIntoViewIfNeeded();
      slotBox = await creationSlot.boundingBox();
      const x = slotBox.x + slotBox.width / 2, y = slotBox.y + slotBox.height / 2;
      await touchSession.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= moves; i++) {
        await touchSession.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y + i * 48 / moves }] });
      }
      await touchSession.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      const dialog = page.getByRole("dialog");
      await dialog.waitFor();
      const content = await dialog.textContent();
      assert.ok(content.includes("9:00～10:15"), `touch selection (${moves} moves): ${content}`);
      assert.equal(await result.textContent(), "");
      await page.keyboard.press("Escape");
      await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
      await creationSlot.scrollIntoViewIfNeeded();
      slotBox = await creationSlot.boundingBox();
    }
  } finally {
    await touchSession.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await touchSession.detach();
  }
  // Keep a moving selection through capture loss until the real release arrives.
  const releaseX = slotBox.x + slotBox.width / 2, releaseY = slotBox.y + slotBox.height / 2 + 48;
  await page.mouse.move(releaseX, releaseY - 48);
  await page.mouse.down();
  await page.mouse.move(releaseX, releaseY, { steps: 8 });
  assert.equal(await calendar.locator(".drag-preview").count(), 1);
  await calendar.locator('[data-slot="event-calendar-grid"]').evaluate(async element => {
    element.releasePointerCapture(1);
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  assert.equal(await calendar.locator(".drag-preview").count(), 1, "capture loss is not a cancelled gesture");
  // Release at a new position without waiting for a stationary frame.
  await page.mouse.move(releaseX + 8, releaseY + 12);
  await page.mouse.up();
  await page.getByRole("dialog").waitFor();
  assert.ok((await page.getByRole("dialog").textContent()).includes("9:00～10:30"));
  assert.equal(await calendar.locator(".drag-preview").count(), 1, "the selected range remains while creation is open");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  // Under the 4px drag threshold, crossing a slot boundary loses the native click.
  await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height - 1);
  await page.mouse.down();
  await page.mouse.move(slotBox.x + slotBox.width / 2, slotBox.y + slotBox.height + 2);
  await page.mouse.up();
  await page.getByRole("dialog").waitFor();
  assert.equal(await result.textContent(), "");
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  for (const direction of [-1, 1]) {
    await drag(creationSlot, direction * slotBox.width, 48);
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    assert.ok((await dialog.textContent()).includes("10月6日(火曜日)・9:00～10:15"));
    assert.equal(await result.textContent(), "");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  }
  await drag(creationSlot, 0, 48);
  const creation = page.getByRole("dialog");
  await creation.waitFor();
  assert.equal(await result.textContent(), "");
  await creation.getByRole("textbox", { name: "タイトル", exact: true }).fill("作成予定 1");
  await creation.getByRole("button", { name: "作成", exact: true }).click();
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  await expectResult("create 2026-10-06T09:00 2026-10-06T10:15");
  const created = calendar.getByRole("button", { name: /^作成予定 1 / });
  await created.click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label")?.startsWith("作成予定 1 "));
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  await drag(created, 0, 12);
  await expectResult("move 2026-10-06T09:15 2026-10-06T10:30");
  await drag(calendar.getByRole("button", { name: "作成予定 1の終了時刻を変更" }), 0, 12);
  await expectResult("resize-end 2026-10-06T09:15 2026-10-06T10:45");
  await drag(calendar.getByRole("button", { name: "作成予定 1の開始時刻を変更" }), 0, -12);
  await expectResult("resize-start 2026-10-06T09:00 2026-10-06T10:45");
  const beforeCancel = await result.textContent();
  await drag(created, 0, 32, true);
  assert.equal(await result.textContent(), beforeCancel);
  assert.equal(await calendar.locator(".drag-preview").count(), 0);
  await created.focus();
  await page.keyboard.press("Alt+ArrowRight");
  await expectResult("move 2026-10-07T09:00 2026-10-07T10:45");
  const timeLineY = await calendar.locator(".time-axis span").filter({ hasText: /^11$/ }).evaluate(element => element.getBoundingClientRect().y);
  await calendar.getByRole("button", { name: "次の週" }).click();
  assert.equal(await calendar.locator('[data-day="2026-10-12"]').count(), 1);
  await page.waitForFunction(expected => {
    const label = [...document.querySelectorAll(".time-axis span")].find(element => element.textContent === "11");
    return label && Math.abs(label.getBoundingClientRect().y - expected) < 1;
  }, timeLineY);
  await calendar.getByRole("button", { name: "前の週" }).click();
  assert.equal(await calendar.locator('[data-day="2026-10-05"]').count(), 1);
  await drag(calendar.getByRole("button", { name: "Astro短い予定の終了時刻を変更" }), 0, 12);
  await expectResult("resize-end 2026-10-08T11:00 2026-10-08T11:30");
  assert.equal(await page.getByRole("dialog").count(), 0);
  console.log("EventCalendar: scrolling keeps week/month range selection unchanged");
  const beforeScroll = await calendar.locator('[data-day]').first().getAttribute('data-day');
  const dayScroller = calendar.locator('[data-slot="event-calendar-day-scroll"]');
  const scrollBox = await dayScroller.boundingBox();
  const bodyBox = await calendar.locator('.calendar-viewport').boundingBox();
  await page.mouse.move(scrollBox.x + scrollBox.width / 2, Math.max(scrollBox.y, bodyBox.y) + 40);
  for (const direction of [1, -1]) {
    await page.mouse.wheel(direction * 3000, 0);
    await page.waitForTimeout(200);
    assert.equal(await calendar.locator('[data-day]').first().getAttribute('data-day'), beforeScroll);
  }
  await selectView('月表示');
  const monthDate = await calendar.locator('[data-month-day]').first().getAttribute('data-month-day');
  const monthBox = await calendar.locator('.month-dates').boundingBox();
  await page.mouse.move(monthBox.x + monthBox.width / 2, monthBox.y + 80);
  await page.mouse.wheel(0, 3000);
  await page.waitForTimeout(200);
  assert.equal(await calendar.locator('[data-month-day]').first().getAttribute('data-month-day'), monthDate);
  await selectView('タイムライン');
  console.log("EventCalendar: resource timeline and adaptive details");
  const timeline = calendar.locator('[data-slot="event-calendar-timeline"]');
  assert.deepEqual(await timeline.locator('.timeline-hours span').allTextContents(), Array.from({ length: 12 }, (_, index) => String(index + 8).padStart(2, '0')), 'timeline headers show hours without :00');
  async function verifyTimelineAllDay() {
    const cards = timeline.locator('.timeline-row-label .timeline-all-day');
    assert.ok(await cards.count() >= 3, "all-day events appear in the fixed label column");
    assert.equal(await timeline.locator('.timeline-track [data-all-day-event-id], .timeline-track [data-event-id^="all-day-"]').count(), 0);
    assert.ok(await cards.evaluateAll(elements => elements.every(element => {
      const card = element.getBoundingClientRect();
      const label = element.closest('.timeline-label').getBoundingClientRect();
      return card.left >= label.left && card.right <= label.right && card.bottom <= label.bottom;
    })), "multiple all-day cards fit within their row label");
    const card = cards.first();
    await card.click();
    await page.getByRole('dialog').waitFor({ state: 'visible' });
    assert.match(await page.getByRole('dialog').textContent(), /Astro終日予定1/);
    await page.keyboard.press('Escape');
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== 'none');
    assert.ok(await card.evaluate(element => element === document.activeElement), "closing details restores focus to the all-day event");
  }
  await verifyFixedHeaderLayout();
  await verifyNowIndicator(true);
  const timelineOriginalStyle = await calendar.getAttribute("style");
  await calendar.evaluate(element => { element.style.maxWidth = "700px"; element.style.width = "700px"; });
  const timelineDate = await timeline.locator(".timeline-heading > .timeline-label").textContent();
  await timeline.scrollIntoViewIfNeeded();
  const timelineBox = await timeline.boundingBox();
  assert.ok(timelineBox);
  await page.mouse.move(timelineBox.x + timelineBox.width / 2, timelineBox.y + 80);
  await page.mouse.wheel(2000, 0);
  await page.waitForTimeout(120);
  await page.mouse.wheel(2000, 0); // Even at the horizontal edge, keep the selected day.
  await page.waitForTimeout(400);
  assert.equal(await timeline.locator(".timeline-heading > .timeline-label").textContent(), timelineDate);
  assert.ok(await timeline.locator('.calendar-viewport').evaluate(element => element.scrollLeft > 0));
  assert.ok(await timeline.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).isIdentity));
  await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute("style"); else element.setAttribute("style", style); }, timelineOriginalStyle);
  for (let i = 0; i < 4; i++) await calendar.getByRole("button", { name: "次の日", exact: true }).click();
  await verifyTimelineAllDay();
  await calendar.getByRole("button", { name: "表示範囲を戻す", exact: true }).click();
  const originalViewport = page.viewportSize();
  const originalStyle = await calendar.getAttribute("style");
  await page.setViewportSize({ width: 1400, height: 900 });
  await calendar.evaluate(element => { element.style.maxWidth = "1100px"; element.style.width = "1100px"; });
  await page.waitForFunction(() => document.querySelector('[data-slot="event-calendar"]').clientWidth >= 1080);
  assert.equal(await calendar.locator('[data-slot="event-calendar-details-panel"]').count(), 0);
  await timeline.getByRole("button", { name: /^Astro予定 / }).click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await calendar.evaluate(element => { element.style.maxWidth = "1250px"; element.style.width = "1250px"; });
  assert.equal(await calendar.locator('[data-slot="event-calendar-details-panel"]').count(), 0);
  await page.getByRole("dialog").waitFor({ state: "visible" });
  assert.match(await page.getByRole("dialog").textContent(), /Astro予定/);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== 'none');
  assert.ok(await timeline.locator('.calendar-viewport').evaluate(element => element.scrollWidth <= element.clientWidth));
  assert.ok(await timeline.locator('.calendar-viewport').evaluate(element => Math.abs(element.querySelector(".timeline-sheet").getBoundingClientRect().width - element.clientWidth) <= 1), "the time axis fills the available width without a blank trailing area");
  await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute("style"); else element.setAttribute("style", style); }, originalStyle);
  if (originalViewport) await page.setViewportSize(originalViewport);
  await calendar.getByRole("button", { name: "カレンダーの表示", exact: true }).click();
  await page.getByRole("option", { name: "日付タイムライン", exact: true }).click();
  await verifyTimelineAllDay();
  assert.equal(await timeline.locator('[data-timeline-date="2026-10-10"] .timeline-all-day').count(), 0, "the exclusive end date has no all-day card");
  await verifyFixedHeaderLayout();
  console.log("EventCalendar: date timeline and vertical navigation");
  assert.equal(await timeline.locator(".timeline-row").count(), 35);
  await calendar.getByRole("button", { name: "表示範囲を戻す", exact: true }).click();
  await verifyNowIndicator(true);
  await timeline.getByRole("button", { name: /^2026-10-06 09:00 / }).click();
  await page.getByRole("textbox", { name: "タイトル", exact: true }).fill("日付行の予定");
  await page.getByRole("button", { name: "作成", exact: true }).click();
  await expectResult("create 2026-10-06T09:00 2026-10-06T09:15");
  const datedEvent = timeline.getByRole("button", { name: /^日付行の予定 / });
  await datedEvent.press("Alt+ArrowDown");
  await expectResult("move 2026-10-07T09:00 2026-10-07T09:15");
  assert.equal(await datedEvent.evaluate(element => element.closest("[data-timeline-date]").dataset.timelineDate), "2026-10-07");
  await page.waitForFunction(() => !document.querySelector('[role="dialog"]') && getComputedStyle(document.body).pointerEvents !== "none");
  await timeline.locator(".timeline-heading").scrollIntoViewIfNeeded();
  const dateTimelineBox = await timeline.boundingBox();
  const timeHeaderY = await timeline.locator(".timeline-heading").evaluate(element => element.getBoundingClientRect().y);
  const dateScroll = timeline.locator('.calendar-viewport');
  assert.equal(await dateScroll.evaluate(element => getComputedStyle(element).scrollbarWidth), 'none', 'continuous date scrolling has no changing vertical scrollbar');
  const horizontalBarStyle = await calendar.getAttribute('style');
  await calendar.evaluate(element => { element.style.width = '500px'; element.style.maxWidth = '500px'; });
  const horizontalBar = calendar.getByRole('region', { name: '時間軸の横スクロール', exact: true });
  await horizontalBar.waitFor();
  const barBox = await horizontalBar.boundingBox();
  const labelBox = await dateScroll.locator('.timeline-row-label').first().boundingBox();
  assert.ok(Math.abs(barBox.x - labelBox.x - labelBox.width) < 1, 'horizontal scrollbar starts after the fixed date column');
  await horizontalBar.evaluate(element => { element.scrollLeft = 80; });
  await page.waitForFunction(() => document.querySelector('.date-timeline').scrollLeft === 80);
  await dateScroll.evaluate(element => { element.scrollLeft = 40; });
  await page.waitForFunction(() => document.querySelector('.timeline-horizontal-scroll').scrollLeft === 40);
  await horizontalBar.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await page.waitForFunction(() => {
    const body = document.querySelector('.date-timeline');
    const bar = document.querySelector('.timeline-horizontal-scroll');
    return body.scrollLeft === body.scrollWidth - body.clientWidth && bar.scrollLeft === body.scrollLeft;
  });
  await dateScroll.evaluate(element => { element.scrollLeft = 0; });
  await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); }, horizontalBarStyle);
  await horizontalBar.waitFor({ state: 'hidden' });
  const firstDate = () => dateScroll.evaluate(element => {
    const top = element.getBoundingClientRect().top;
    return [...element.querySelectorAll('[data-timeline-date]')].find(row => row.getBoundingClientRect().bottom > top + 1)?.dataset.timelineDate;
  });
  const initialDate = await firstDate();
  await page.mouse.move(dateTimelineBox.x + 90, dateTimelineBox.y + 80);
  await page.mouse.wheel(0, 240);
  await page.waitForTimeout(250);
  assert.ok(await firstDate() > initialDate, 'vertical input scrolls dates rather than replacing a week');
  assert.equal(await timeline.locator('.timeline-incoming').count(), 0);
  assert.equal(await timeline.locator(".timeline-heading").evaluate(element => element.getBoundingClientRect().y), timeHeaderY);
  await dateScroll.scrollIntoViewIfNeeded();
  const dateBodyBox = await dateScroll.boundingBox();
  const screenHeight = page.viewportSize().height;
  const visibleBodyTop = Math.max(0, dateBodyBox.y);
  const visibleBodyBottom = Math.min(screenHeight, dateBodyBox.y + dateBodyBox.height);
  await page.mouse.move(dateBodyBox.x + dateBodyBox.width * .6, (visibleBodyTop + visibleBodyBottom) / 2);
  for (let i = 0; i < 4; i++) {
    const beforePacket = await firstDate();
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(100);
    assert.ok(await firstDate() > beforePacket, `downward wheel packet ${i} advances dates across buffer rebases (${beforePacket} -> ${await firstDate()})`);
  }
  const advanced = await firstDate();
  assert.ok(advanced > '2026-10-25', 'dates continue past the initial buffer');
  assert.equal(await timeline.locator('.timeline-row').count(), 35, 'the rendered date window stays bounded');
  for (let i = 0; i < 4; i++) {
    await dateScroll.evaluate(element => { element.scrollTop -= 900; });
    await page.waitForTimeout(100);
  }
  assert.ok(await firstDate() < advanced, 'continuous scrolling also works toward earlier dates');
  const afterWheel = await firstDate();
  const touchLabel = timeline.locator(`[data-timeline-date="${afterWheel}"] > .timeline-label > span`);
  await touchLabel.scrollIntoViewIfNeeded();
  const beforeTouch = await firstDate();
  await touchSwipe(touchLabel, -160);
  await page.waitForTimeout(300);
  assert.ok(await firstDate() > beforeTouch, 'touch uses native continuous vertical scrolling');
  await calendar.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  async function selectView(name) {
    await calendar.getByRole("button", { name: "カレンダーの表示", exact: true }).click();
    await page.getByRole("option", { name, exact: true }).click();
    await page.waitForFunction(() => getComputedStyle(document.body).pointerEvents !== "none");
  }
  async function confirm(title) {
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: "タイトル", exact: true }).fill(title);
    await dialog.getByRole("button", { name: "作成", exact: true }).click();
    await dialog.waitFor({ state: "hidden" });
  }
  console.log("EventCalendar: day pointer create/move/resize and details");
  await selectView("日表示");
  await verifyFixedHeaderLayout();
  await drag(calendar.getByRole("button", { name: "2026-10-05 12:00に予定を作成" }), 0, 12);
  await confirm("日表示操作");
  await expectResult("create 2026-10-05T12:00 2026-10-05T12:30");
  const daily = calendar.getByRole("button", { name: /^日表示操作 / });
  await drag(daily, 0, 12);
  await expectResult("move 2026-10-05T12:15 2026-10-05T12:45");
  await drag(calendar.getByRole("button", { name: "日表示操作の終了時刻を変更" }), 0, 12);
  await expectResult("resize-end 2026-10-05T12:15 2026-10-05T13:00");
  await daily.click();
  await page.getByRole("dialog").waitFor();
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await selectView("タイムライン");
  console.log("EventCalendar: resource pointer create, row move and horizontal resize");
  await timeline.getByRole("button", { name: "2026-10-05 12:00 会議室Aに予定を作成" }).click();
  await confirm("リソース操作");
  const resource = timeline.getByRole("button", { name: /^リソース操作 / });
  const rowBox = await timeline.locator('[data-timeline-row="1"]').boundingBox();
  const cardBox = await resource.boundingBox();
  await drag(resource, 0, rowBox.y + rowBox.height / 2 - cardBox.y - cardBox.height / 2);
  assert.equal(await resource.evaluate(element => element.closest("[data-timeline-row]").dataset.timelineRow), "1");
  const hourWidth = await timeline.locator(".timeline-slot").first().evaluate(element => element.getBoundingClientRect().width * 4);
  await drag(timeline.getByRole("button", { name: "リソース操作の終了時刻を変更" }), hourWidth / 4, 0);
  await expectResult("resize-end 2026-10-05T12:00 2026-10-05T12:30");
  await drag(timeline.getByRole("button", { name: "リソース操作の開始時刻を変更" }), -hourWidth / 4, 0);
  await expectResult("resize-start 2026-10-05T11:45 2026-10-05T12:30");
  await selectView("日付タイムライン");
  console.log("EventCalendar: date-row pointer move and resize");
  const dated = timeline.getByRole("button", { name: /^日付行の予定 / });
  await dated.scrollIntoViewIfNeeded();
  const datedBox = await dated.boundingBox();
  const destination = await timeline.locator('[data-timeline-date="2026-10-08"]').boundingBox();
  await drag(dated, 0, destination.y + destination.height / 2 - datedBox.y - datedBox.height / 2);
  await expectResult("move 2026-10-08T09:00 2026-10-08T09:15");
  await drag(timeline.getByRole("button", { name: "日付行の予定の終了時刻を変更" }), hourWidth / 4, 0);
  await expectResult("resize-end 2026-10-08T09:00 2026-10-08T09:30");
  console.log("EventCalendar: fetch states and visible-range notifications");
  const probe = page.locator('#event-calendar-probe');
  const notified = probe.locator('[data-calendar-range]');
  const notifications = probe.locator('[data-calendar-range-count]');
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  await selectView('週表示');
  await page.waitForFunction(() => document.querySelector('[data-calendar-range]').textContent === 'week 2026-10-05 2026-10-12');
  const beforeLoading = await notifications.textContent();
  const adjacent = probe.locator('[data-calendar-prefetch]');
  const prefetchCount = probe.locator('[data-calendar-prefetch-count]');
  assert.equal(await adjacent.textContent(), '2026-09-28 2026-10-05 / 2026-10-12 2026-10-19');
  const beforePrefetch = await prefetchCount.textContent();
  await probe.getByRole('button', { name: '予定を取得中にする', exact: true }).click();
  assert.equal(await notifications.textContent(), beforeLoading, 'fetch-state changes do not request the same range again');
  assert.equal(await prefetchCount.textContent(), beforePrefetch, 'fetch-state updates do not restart prefetch');
  assert.equal(await calendar.locator('[data-slot="event-calendar"]').getAttribute('aria-busy'), 'true');
  assert.equal(await calendar.getByRole('button', { name: '次の週', exact: true }).isEnabled(), true);
  assert.equal(await calendar.getByRole('button', { name: '2026-10-05 12:00に予定を作成', exact: true }).isEnabled(), false);
  await calendar.getByRole('button', { name: /^Astro予定 / }).click();
  await page.getByRole('dialog').waitFor({ state: 'visible' });
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await calendar.getByRole('button', { name: '次の週', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[data-calendar-range]').textContent === 'week 2026-10-12 2026-10-19');
  await calendar.getByRole('button', { name: '前の週', exact: true }).click();
  for (const [label, range] of [['月表示', 'month 2026-09-28 2026-11-02'], ['日表示', 'day 2026-10-05 2026-10-06'], ['タイムライン', 'timeline 2026-10-05 2026-10-06'], ['日付タイムライン', 'date-timeline 2026-10-05 2026-10-12'], ['週表示', 'week 2026-10-05 2026-10-12']]) {
    await selectView(label);
    if (label === '日付タイムライン') assert.match(await notified.textContent(), /^date-timeline 2026-10-05 2026-10-/);
    else assert.equal(await notified.textContent(), range);
    assert.match(await calendar.locator('[data-slot="event-calendar-events-state"]').textContent(), /予定を取得中/);
  }
  await probe.getByRole('button', { name: '3日間に変更する', exact: true }).click();
  assert.equal(await notified.textContent(), 'week 2026-10-05 2026-10-08', 'bound day-count changes notify without toolbar interaction');
  assert.equal(await adjacent.textContent(), '2026-10-02 2026-10-05 / 2026-10-08 2026-10-11');
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  await probe.getByRole('button', { name: '予定取得を失敗させる', exact: true }).click();
  assert.match(await calendar.getByRole('alert').textContent(), /予定の取得に失敗/);
  assert.equal(await calendar.getByRole('button', { name: '2026-10-05 12:00に予定を作成', exact: true }).isEnabled(), false);
  await calendar.getByRole('button', { name: '再取得', exact: true }).click();
  assert.equal(await calendar.locator('[data-slot="event-calendar"]').getAttribute('aria-busy'), 'true');
  await probe.getByRole('button', { name: '予定取得を完了させる', exact: true }).click();
  assert.equal(await calendar.getByRole('button', { name: '2026-10-05 12:00に予定を作成', exact: true }).isEnabled(), true);
  await selectView('月表示');
  await calendar.getByRole('button', { name: '次の月', exact: true }).click();
  assert.match(await calendar.locator('[data-slot="event-calendar-events-state"]').textContent(), /この期間に予定はありません/);
  assert.equal(await calendar.locator('[data-slot="event-calendar"]').getAttribute('aria-busy'), 'false');
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  await selectView('週表示');
  const beforeEvents = await prefetchCount.textContent();
  await probe.getByRole('button', { name: '先読みイベントを渡す', exact: true }).click();
  assert.equal(await prefetchCount.textContent(), beforeEvents, 'cached event updates do not restart prefetch');
  await calendar.getByRole('button', { name: '次の週', exact: true }).click();
  assert.equal(await notified.textContent(), 'week 2026-10-12 2026-10-19');
  assert.equal(await adjacent.textContent(), '2026-10-05 2026-10-12 / 2026-10-19 2026-10-26');
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  const wideStyle = await calendar.getAttribute('style');
  await calendar.evaluate(element => { element.style.width = '500px'; element.style.maxWidth = '500px'; });
  await page.waitForTimeout(100);
  const narrowScroller = calendar.locator('[data-slot="event-calendar-day-scroll"]');
  assert.equal(await narrowScroller.evaluate(element => getComputedStyle(element).overflowX), "auto", "day lanes retain native horizontal scrolling");
  await narrowScroller.scrollIntoViewIfNeeded();
  const narrowBox = await narrowScroller.boundingBox();
  const narrowBody = await calendar.locator('.calendar-viewport').boundingBox();
  const narrowTop = Math.max(0, narrowBox.y, narrowBody.y);
  const narrowBottom = Math.min(page.viewportSize().height, narrowBox.y + narrowBox.height, narrowBody.y + narrowBody.height);
  await page.mouse.move(narrowBox.x + narrowBox.width / 2, (narrowTop + narrowBottom) / 2);
  await page.mouse.wheel(3000, 0);
  await page.waitForTimeout(200);
  assert.ok(await narrowScroller.evaluate(element => element.scrollLeft > 0), 'narrow weeks keep within-range horizontal scrolling');
  assert.equal(await notified.textContent(), 'week 2026-10-05 2026-10-12');
  await page.mouse.wheel(-3000, 0);
  await page.waitForTimeout(200);
  assert.equal(await notified.textContent(), 'week 2026-10-05 2026-10-12');
  await calendar.evaluate((element, style) => { if (style === null) element.removeAttribute('style'); else element.setAttribute('style', style); }, wideStyle);
  console.log('EventCalendar: continuous drag visuals retain quantized values');
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  await selectView('日表示');
  async function smoothPreview(locator, axis, property, first = 5, cancel = true) {
    await locator.scrollIntoViewIfNeeded();
    const isTimelineSlot = await locator.evaluate(element => element.classList.contains('timeline-slot'));
    const box = await locator.boundingBox();
    const x = box.x + box.width / 2, y = box.y + box.height / 2;
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + (axis === 'x' ? first : 0), y + (axis === 'y' ? first : 0));
    const before = await calendar.locator('.drag-preview').boundingBox();
    await page.mouse.move(x + (axis === 'x' ? first + 3 : 0), y + (axis === 'y' ? first + 3 : 0));
    const after = await calendar.locator('.drag-preview').boundingBox();
    assert.ok(before && after);
    assert.ok(Math.abs(after[property] - before[property] - 3) < 0.2, `${property} follows a 3px pointer movement within one 15-minute slot (actual ${after[property] - before[property]})`);
    if (axis === 'x') {
      const row = await calendar.locator('.drag-preview').locator('xpath=ancestor::*[@data-timeline-row]').boundingBox();
      assert.ok(Math.abs(after.y + after.height - (row.y + row.height - 4)) < 1.1, 'timeline preview fills the row down to its bottom padding');
      if (isTimelineSlot) {
        assert.ok(Math.abs(after.y - row.y - 4) < 0.2, 'new timeline preview starts at the row top padding');
        assert.ok(after.height >= 39, 'new timeline preview fills even a compact row');
      }
    }
    if (cancel) await page.keyboard.press('Escape');
    await page.mouse.up();
  }
  const smoothEvent = calendar.getByRole('button', { name: /^Astro予定 / });
  await smoothPreview(smoothEvent, 'y', 'y');
  await smoothPreview(calendar.getByRole('button', { name: 'Astro予定の開始時刻を変更' }), 'y', 'y');
  await smoothPreview(calendar.getByRole('button', { name: 'Astro予定の終了時刻を変更' }), 'y', 'height');
  await smoothPreview(calendar.getByRole('button', { name: '2026-10-05 14:00に予定を作成', exact: true }), 'y', 'height', 40, false);
  await page.getByRole('dialog').waitFor();
  assert.match(await page.getByRole('dialog').textContent(), /14:00～15:15/, 'creation dialog uses the 15-minute result rather than visual pixel times');
  await confirm('連続追従の予定');
  await expectResult('create 2026-10-05T14:00 2026-10-05T15:15');
  await selectView('タイムライン');
  async function assertTimelineHeights() {
    const cards = await calendar.locator('.timeline-event').evaluateAll(elements => elements.map(element => {
      const card = element.getBoundingClientRect();
      const row = element.closest('[data-timeline-row]').getBoundingClientRect();
      return { bottomGap: row.bottom - card.bottom, topGap: card.top - row.top, height: card.height };
    }));
    assert.ok(cards.length > 0);
    for (const card of cards) assert.ok(Math.abs(card.bottomGap - 4) < 1.1, 'timeline cards fill remaining height while retaining staggered tops');
    assert.ok(cards.some(card => card.topGap === 4 && card.height >= 39), 'unobstructed timeline card fills its row');
  }
  await assertTimelineHeights();
  await smoothPreview(smoothEvent, 'x', 'x');
  await smoothPreview(calendar.getByRole('button', { name: 'Astro予定の開始時刻を変更' }), 'x', 'x');
  await smoothPreview(calendar.getByRole('button', { name: 'Astro予定の終了時刻を変更' }), 'x', 'width');
  await smoothPreview(calendar.getByRole('button', { name: '2026-10-05 14:00 会議室Aに予定を作成', exact: true }), 'x', 'width', 40);
  await selectView('日付タイムライン');
  await assertTimelineHeights();
  await smoothPreview(smoothEvent, 'x', 'x');
  await smoothPreview(calendar.getByRole('button', { name: 'Astro予定の終了時刻を変更' }), 'x', 'width');
  await smoothPreview(calendar.getByRole('button', { name: '2026-10-05 16:00 5日(月)に予定を作成', exact: true }), 'x', 'width', 40);
  await probe.getByRole('button', { name: 'アプリの画面を開かずに通知を確認' }).click();
  await probe.getByRole('button', { name: '表示範囲を戻す', exact: true }).click();
  await selectView('日表示');
  const countBeforeRequest = await calendar.locator('[data-event-id]').count();
  const createTrigger = calendar.getByRole('button', { name: '2026-10-05 17:00に予定を作成', exact: true });
  await createTrigger.press('Enter');
  assert.equal(await calendar.locator('[data-calendar-interaction]').textContent(), 'create 2026-10-05T17:00 2026-10-05T17:15 BUTTON title=false');
  assert.equal(await page.getByRole('dialog').count(), 0, 'a creation request opens no built-in UI');
  assert.equal(await calendar.locator('[data-event-id]').count(), countBeforeRequest, 'a creation request never persists events');
  await smoothEvent.press('Enter');
  assert.equal(await calendar.locator('[data-calendar-interaction]').textContent(), 'select one BUTTON');
  assert.equal(await page.getByRole('dialog').count(), 0, 'event selection opens no built-in UI');
  assert.equal(await calendar.locator('[data-slot="event-calendar-details-panel"]').count(), 0);

  await calendar.getByRole('button', { name: '領域いっぱいに表示', exact: true }).click();
  const fillRoot = calendar.locator('[data-slot="event-calendar"]');
  const fillContainer = calendar.locator('[data-calendar-container]');
  assert.equal(await calendar.getByRole('button', { name: 'カレンダーの表示', exact: true }).count(), 0, 'custom view switcher replaces the default control');
  await calendar.getByRole('button', { name: '追加の更新', exact: true }).click();
  assert.equal(await calendar.locator('[data-toolbar-updates]').textContent(), '1');
  for (const mode of ['day', 'week', 'month', 'timeline', 'date-timeline']) {
    await calendar.getByRole('combobox', { name: '独自の表示方法' }).selectOption(mode);
    await page.waitForFunction(() => {
      const root = document.querySelector('#event-calendar-probe [data-slot="event-calendar"]');
      const container = root.closest('[data-calendar-container]');
      const body = root.querySelector('[data-slot="event-calendar-viewport"], [data-slot="event-calendar-month"], [data-slot="event-calendar-timeline-scroll"]');
      const bar = root.querySelector('.timeline-horizontal-scroll');
      return body && Math.abs(root.getBoundingClientRect().bottom - container.getBoundingClientRect().bottom) < 2
        && Math.abs(body.getBoundingClientRect().bottom + (bar?.getBoundingClientRect().height ?? 0) - (root.getBoundingClientRect().bottom - 1)) < 2;
    });
    assert.ok(await fillRoot.evaluate(element => element.getBoundingClientRect().height > 890), `${mode} fills the bounded parent beyond the intrinsic 672px limit`);
    const horizontalEdges = await fillRoot.evaluate(root => {
      const surface = root.querySelector('[data-slot="event-calendar-viewport"], [data-slot="event-calendar-month"], [data-slot="event-calendar-timeline-scroll"]');
      const sheet = surface.querySelector('.calendar-sheet, .month-sheet, .timeline-sheet');
      const scrollbar = surface.offsetWidth - surface.clientWidth;
      return { right: surface.getBoundingClientRect().left + surface.clientWidth, sheetRight: sheet.getBoundingClientRect().right,
        sheetWidth: sheet.getBoundingClientRect().width, scrollWidth: surface.scrollWidth, clientWidth: surface.clientWidth,
        scrollbar, overflow: surface.scrollHeight > surface.clientHeight,
        headingRight: root.querySelector('.day-heading:last-child')?.getBoundingClientRect().right,
        gutter: getComputedStyle(surface).scrollbarGutter };
    });
    if (mode === 'day' || mode === 'week' || mode === 'month') {
      assert.ok(Math.abs(horizontalEdges.sheetRight - horizontalEdges.right) < 1, `${mode} uses the whole body width after only the real vertical scrollbar`);
      if (mode !== 'month') assert.ok(Math.abs(horizontalEdges.headingRight - horizontalEdges.sheetRight) < 1, `${mode} headings and time columns reach the same right edge`);
    }
    if (mode === 'month') {
      assert.equal(horizontalEdges.gutter, 'auto', 'month horizontal scrolling must not reserve an unused vertical scrollbar gutter');
      assert.equal(horizontalEdges.scrollbar, 0, 'month has no vertical scrollbar or trailing reserved space');
    }
    assert.equal(await fillRoot.locator('header').count(), 1);
    assert.equal(await fillRoot.getByRole('button', { name: '追加フィルター', exact: true }).count(), 1);
    if (mode === 'day' || mode === 'week') {
      const surface = fillRoot.locator('[data-slot="event-calendar-viewport"]');
      assert.ok(await surface.evaluate(element => element.scrollHeight > element.clientHeight), 'time slots retain vertical scrolling');
      assert.equal(horizontalEdges.scrollbar, 0, 'vertical overlay does not consume the calendar body width');
      const initialTop = await surface.evaluate(element => element.scrollTop);
      const thumb = fillRoot.locator('.calendar-overlay-thumb');
      await thumb.waitFor({ state: 'visible' });
      await fillRoot.hover();
      const thumbBox = await thumb.boundingBox();
      const bodyBox = await surface.boundingBox();
      assert.ok(thumbBox.x + thumbBox.width <= bodyBox.x + bodyBox.width + 1, 'thumb stays on top of the body right edge');
      assert.ok(thumbBox.y >= bodyBox.y - 1, 'the overlay starts below the fixed date and all-day header');
      await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2);
      await page.mouse.down(); await page.mouse.move(thumbBox.x + thumbBox.width / 2, thumbBox.y + thumbBox.height / 2 + 50, { steps: 5 }); await page.mouse.up();
      await page.waitForFunction(({ initialTop }) => document.querySelector('#event-calendar-probe [data-slot="event-calendar-viewport"]').scrollTop > initialTop + 10, { initialTop });
      await surface.press('Home');
      await page.waitForFunction(() => document.querySelector('#event-calendar-probe [data-slot="event-calendar-viewport"]').scrollTop < 1);
    }
  }
  await calendar.getByRole('button', { name: '高い領域で空の予定を表示', exact: true }).click();
  await page.waitForFunction(() => {
    const root = document.querySelector('#event-calendar-probe [data-slot="event-calendar"]');
    const viewport = root.querySelector('[data-slot="event-calendar-timeline-scroll"]');
    const anchor = viewport?.querySelector('[data-timeline-date="2026-10-05"]');
    return anchor && Math.abs(anchor.getBoundingClientRect().top - viewport.getBoundingClientRect().top) < 2
      && viewport.scrollHeight > viewport.clientHeight + 600;
  }).catch(async (error) => {
    const evidence = await fillRoot.evaluate(root => {
      const viewport = root.querySelector('[data-slot="event-calendar-timeline-scroll"]');
      const anchor = viewport.querySelector('[data-timeline-date="2026-10-05"]');
      return { rows: viewport.querySelectorAll('[data-timeline-date]').length, height: viewport.clientHeight,
        scrollHeight: viewport.scrollHeight, scrollTop: viewport.scrollTop, anchorTop: anchor?.getBoundingClientRect().top,
        viewportTop: viewport.getBoundingClientRect().top, range: root.closest('#event-calendar-probe').querySelector('[data-calendar-range]').textContent };
    });
    throw new Error(JSON.stringify(evidence), { cause: error });
  });
  assert.match(await calendar.locator('[data-calendar-range]').textContent(), /^date-timeline 2026-10-05 /, 'large empty fill viewport preserves the requested date');
  await calendar.getByRole('combobox', { name: '独自の表示方法' }).selectOption('day');
  await page.waitForFunction(() => {
    const root = document.querySelector('#event-calendar-probe');
    const viewport = root.querySelector('[data-slot="event-calendar-viewport"]');
    const grid = root.querySelector('[data-slot="event-calendar-grid"]');
    return grid && Math.abs(grid.getBoundingClientRect().height - viewport.clientHeight) < 2;
  });
  await calendar.getByRole('button', { name: '2026-10-05 17:00に予定を作成', exact: true }).press('Enter');
  assert.equal(await calendar.locator('[data-calendar-interaction]').textContent(), 'create 2026-10-05T17:00 2026-10-05T17:15 BUTTON title=false', 'expanded hour scale keeps quarter-hour creation');
  await calendar.getByRole('button', { name: '領域を縮める', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#event-calendar-probe [data-slot="event-calendar"]').getBoundingClientRect().height < 361);
  const savedViewport = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  await calendar.getByRole('combobox', { name: '独自の表示方法' }).selectOption('day');
  assert.ok(await fillContainer.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'narrow fill layout keeps toolbar controls inside the parent');
  await calendar.getByRole('button', { name: '次の日', exact: true }).click();
  await fillRoot.getByRole('button', { name: /^前の日$/ }).click();
  await page.setViewportSize(savedViewport);
  await calendar.getByRole('button', { name: '内容の高さに戻す', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#event-calendar-probe [data-slot="event-calendar-viewport"]').getBoundingClientRect().height <= 672);
  assert.equal(await calendar.getByRole('button', { name: 'カレンダーの表示', exact: true }).count(), 1, 'intrinsic layout and built-in toolbar remain available');
  console.log("Astro EventCalendar: five views, pointer/touch creation, date/resource moves, both resize edges, touch/wheel navigation, fixed axes, application-owned details, keyboard and cancellation passed");
}
