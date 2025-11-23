export function setupFooter(appContainer: HTMLElement, footerHtml: string, buttonCallbackMap: {
  buttonFn: () => HTMLButtonElement,
  callback: () => void | Promise<void>
}[]): void {
  // remove old one
  const footerElement = document.getElementById("footer");
  if (footerElement) {
    appContainer.removeChild(footerElement);
  }

  // Inserts the footer HTML at the end of the container
  appContainer.insertAdjacentHTML('beforeend', footerHtml);

  buttonCallbackMap.forEach((buttonCallback) => {
    buttonCallback.buttonFn().addEventListener("click", buttonCallback.callback);
  })
}
