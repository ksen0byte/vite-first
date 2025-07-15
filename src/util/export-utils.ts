/**
 * Utility functions for exporting data
 */

/**
 * Exports data as a JSON file for download
 * @param data - The data to export
 * @param filename - The name of the file to download
 */
export async function exportDataAsJson(data: any, filename: string): Promise<void> {
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