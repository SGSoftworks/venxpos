/**
 * Cross-platform Save File dialog.
 *
 * - Chrome / Tauri WebView: showSaveFilePicker API (native dialog)
 * - Fallback: browser download (a.click)
 */

async function saveWeb(defaultName: string, content: Uint8Array, mimeType: string): Promise<boolean> {
  if ('showSaveFilePicker' in window) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const handle = await w.showSaveFilePicker?.({
        suggestedName: defaultName,
        types: [{ accept: { [mimeType]: ['.' + (defaultName.split('.').pop() || '*')] } }],
      });
      if (!handle) return false; // user cancelled
      const writable = await handle.createWritable();
      await writable.write(content as unknown as BlobPart);
      await writable.close();
      return true;
    } catch {
      return false; // user cancelled dialog
    }
  }
  // fallback: browser download (API not available)
  const blob = new Blob([content as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = defaultName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}

export async function saveFile(
  defaultName: string,
  content: Uint8Array,
  mimeType: string,
): Promise<boolean> {
  return saveWeb(defaultName, content, mimeType);
}
