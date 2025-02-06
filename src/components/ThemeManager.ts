export const ThemeManager = (() => {
  const themes = [
    'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'retro', 
    'valentine', 'halloween', 'garden', 'forest', 'aqua', 'lofi', 'pastel', 
    'dracula', 'business', 'night', 'coffee', 'winter', 'dim', 'sunset', 'abyss'
  ];

  // Get initial theme index from localStorage or default to 0 ("light").
  let currentThemeIndex = themes.indexOf(localStorage.getItem('theme') || 'light');
  if (currentThemeIndex === -1) {
    currentThemeIndex = 0; // Default to 0 if no saved theme matches
  }

  return {
    getCurrentTheme() {
      return themes[currentThemeIndex];
    },
    getNextTheme() {
      const nextIndex = (currentThemeIndex + 1) % themes.length;
      return themes[nextIndex];
    },
    setTheme(theme: string) {
      const index = themes.indexOf(theme);
      if (index !== -1) {
        currentThemeIndex = index;
      }
    }
  };
})();