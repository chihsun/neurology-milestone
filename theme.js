const THEME_KEY = 'neurologyMilestoneThemeV1';

function getPreferredTheme(mode) {
  if (mode === 'light' || mode === 'dark') return mode;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(mode) {
  const resolved = getPreferredTheme(mode);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.themeMode = mode;
  document.documentElement.style.colorScheme = resolved;
}

function initThemeControl() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);

  const select = document.getElementById('themeSelect');
  if (select) {
    select.value = saved;
    select.addEventListener('change', () => {
      localStorage.setItem(THEME_KEY, select.value);
      applyTheme(select.value);
    });
  }

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const syncSystemTheme = () => {
    const mode = localStorage.getItem(THEME_KEY) || 'system';
    if (mode === 'system') applyTheme('system');
  };
  if (media.addEventListener) media.addEventListener('change', syncSystemTheme);
  else if (media.addListener) media.addListener(syncSystemTheme);
}

initThemeControl();
