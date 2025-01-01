export function setupSettingsScreen(containerId: string): void {
  const container = document.getElementById(containerId)!;

  // Subsection toggle
  const shapesSubsection = container.querySelector("#shapes-subsection") as HTMLElement;
  const wordsSubsection = container.querySelector("#words-subsection") as HTMLElement;
  const syllablesSubsection = container.querySelector("#syllables-subsection") as HTMLElement;

  [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(subsec => {
    const header = subsec.querySelector(".subsection-header") as HTMLElement;
    header.addEventListener("click", () => {
      // Collapse all
      [shapesSubsection, wordsSubsection, syllablesSubsection].forEach(s => s.classList.remove("expanded"));

      // Mark chosen and expand
      subsec.classList.add("expanded");
      // Handle the logic for which stimulus type is active, etc.
    });
  });
}
