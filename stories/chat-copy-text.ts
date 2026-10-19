// Support the HTTP/Tailscale preview as well as secure contexts.
export async function copyChatText(text: string) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; } catch { /* Try selection-based copy. */ }
  }
  const active = document.activeElement as HTMLElement | null;
  const selection = active instanceof HTMLTextAreaElement ? [active.selectionStart, active.selectionEnd] : undefined;
  const field = document.createElement("textarea");
  field.value = text;
  field.style.cssText = "position:fixed;top:0;left:-9999px;opacity:0;font-size:16px";
  document.body.append(field);
  try { field.select(); if (!document.execCommand("copy")) throw new Error("Copy unavailable"); }
  finally { field.remove(); active?.focus({ preventScroll: true }); if (selection && active instanceof HTMLTextAreaElement) active.setSelectionRange(selection[0], selection[1]); }
}
