---
"@mutsuna/ui": patch
---

Fix searchable Select keyboard navigation, Escape cancellation, focus retention and per-instance listbox IDs. Separate Select positioning and Markdown toolbar internals, and remove Dialog/Calendar barrel import cycles without changing public exports.

Guard Markdown editor initialization/teardown and pending updates, track Select element and visual viewport resizing, and share locked-item reorder logic while preserving keyboard focus.
