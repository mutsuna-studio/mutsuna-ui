/** Serialize teardown after asynchronous creation; never publish a disposed editor. */
export function startEditorLifecycle(editor: { create(): Promise<unknown>; destroy(): Promise<unknown> },
  onReady: () => void, onFailure: (error: unknown) => void): () => void {
  let disposed = false;
  let created = false;
  let destroyed = false;
  const destroy = async () => {
    if (!created || destroyed) return;
    destroyed = true;
    try { await editor.destroy(); }
    catch (error) { if (!disposed) onFailure(error); }
  };
  void (async () => {
    try {
      await editor.create();
      created = true;
      if (disposed) await destroy();
      else onReady();
    } catch (error) {
      // Milkdown remains OnCreate after a failed create; destroy would poll forever.
      await destroy();
      if (!disposed) onFailure(error);
    }
  })();
  return () => { disposed = true; void destroy(); };
}
