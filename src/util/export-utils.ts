/**
 * Utility functions for exporting data
 */

/**
 * Exports data as a JSON file for download
 * @param data - The data to export
 * @param filename - The name of the file to download
 */
export async function exportDataAsJson<T>(data: T, filename: string): Promise<void> {
  try {
    // Convert the data to a JSON string
    const jsonData = JSON.stringify(data, null, 2);

    // Create a blob from the JSON string
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;

    // Append the link to the document, click it, and remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Release the URL object
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

/**
 * Reads a JSON file selected via an <input type="file"> element and returns parsed data.
 * - Validates MIME type and basic JSON parsing errors.
 * - Rejects non-JSON files.
 */
export function readJsonFile<T = unknown>(file: File): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const isJsonType = file.type === 'application/json' || file.name.toLowerCase().endsWith('.json');
      if (!isJsonType) {
        reject(new Error('Selected file is not a JSON file.'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Error reading file.'));
      reader.onload = () => {
        try {
          const text = String(reader.result ?? '');
          const data = JSON.parse(text) as T;
          resolve(data);
        } catch (e) {
          reject(new Error('Invalid JSON content.'));
        }
      };
      reader.readAsText(file);
    } catch (e) {
      reject(e);
    }
  });
}