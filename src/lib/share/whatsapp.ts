/**
 * Shared WhatsApp sharing utilities.
 */

/**
 * Opens the WhatsApp share dialog with the given text pre-filled.
 * @param text — The text to share. Will be URI-encoded automatically.
 */
export function shareOnWhatsApp(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}
