// User-facing dialogs and file saving, per platform.
// Browser: native alert/confirm and a download link. Desktop (Tauri webview): those are either
// suppressed or save silently to Downloads, so native dialogs and a "Save as" picker are used instead.

import { invoke, isTauri } from '@tauri-apps/api/core';
import { ask, message } from '@tauri-apps/plugin-dialog';

export type NoticeKind = 'info' | 'error';

export type SaveOutcome =
  | { readonly _tag: 'Saved' }
  | { readonly _tag: 'Cancelled' }
  | { readonly _tag: 'Failed'; readonly reason: string };

export interface TextFile {
  /** File name proposed to the user, including the extension. */
  readonly suggestedName: string;
  /** Extension without the dot, used for the file type filter. */
  readonly extension: string;
  readonly contents: string;
  readonly mimeType: string;
}

export interface Dialogs {
  readonly notify: (text: string, kind: NoticeKind) => Promise<void>;
  readonly confirm: (text: string) => Promise<boolean>;
  readonly saveTextFile: (file: TextFile) => Promise<SaveOutcome>;
}

const DIALOG_TITLE = 'CNS Test';

const browserDialogs: Dialogs = {
  notify: async (text) => window.alert(text),
  confirm: async (text) => window.confirm(text),
  saveTextFile: async (file) => {
    const url = URL.createObjectURL(new Blob([file.contents], { type: file.mimeType }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.suggestedName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { _tag: 'Saved' };
  },
};

const isSaveOutcome = (value: unknown): value is SaveOutcome => {
  if (typeof value !== 'object' || value === null) return false;
  const tag = (value as { readonly _tag?: unknown })._tag;
  return tag === 'Saved' || tag === 'Cancelled'
    || (tag === 'Failed' && typeof (value as { readonly reason?: unknown }).reason === 'string');
};

const desktopDialogs: Dialogs = {
  notify: async (text, kind) => {
    await message(text, { title: DIALOG_TITLE, kind: kind === 'error' ? 'error' : 'info' });
  },
  confirm: (text) => ask(text, { title: DIALOG_TITLE, kind: 'warning' }),
  saveTextFile: async (file) => {
    try {
      const outcome = await invoke<unknown>('save_text_file', {
        suggestedName: file.suggestedName,
        extension: file.extension,
        contents: file.contents,
      });
      return isSaveOutcome(outcome) ? outcome : { _tag: 'Failed', reason: 'unexpected response from save_text_file' };
    } catch (error) {
      return { _tag: 'Failed', reason: String(error) };
    }
  },
};

export const dialogs: Dialogs = isTauri() ? desktopDialogs : browserDialogs;
