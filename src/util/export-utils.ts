import { Result, success, failure } from "./result.ts";
import { dialogs, SaveOutcome } from "../platform/dialogs.ts";

/**
 * Utility functions for exporting data
 */

export type FileError =
  | { readonly _tag: 'FileReaderError'; readonly error: unknown }
  | { readonly _tag: 'InvalidJsonError'; readonly error: unknown }
  | { readonly _tag: 'NotAJsonFileError' };

/**
 * Exports data as a JSON file: a download in the browser, a "Save as" dialog on desktop.
 * @param data - The data to export
 * @param filename - The file name proposed to the user
 */
export function exportDataAsJson<T>(data: T, filename: string): Promise<SaveOutcome> {
  return dialogs.saveTextFile({
    suggestedName: filename,
    extension: 'json',
    contents: JSON.stringify(data, null, 2),
    mimeType: 'application/json',
  });
}

/**
 * Reads a JSON file selected via an <input type="file"> element and returns parsed data.
 * - Validates MIME type and basic JSON parsing errors.
 * - Rejects non-JSON files.
 */
export function readJsonFile(file: File): Promise<Result<unknown, FileError>> {
  return new Promise((resolve) => {
    try {
      const isJsonType = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
      if (!isJsonType) {
        resolve(failure({ _tag: 'NotAJsonFileError' }));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => resolve(failure({ _tag: 'FileReaderError', error: 'Error reading file.' }));
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '');
          const data: unknown = JSON.parse(text);
          resolve(success(data));
        } catch (e) {
          resolve(failure({ _tag: 'InvalidJsonError', error: e }));
        }
      };
      reader.readAsText(file);
    } catch (e) {
      resolve(failure({ _tag: 'FileReaderError', error: e }));
    }
  });
}
