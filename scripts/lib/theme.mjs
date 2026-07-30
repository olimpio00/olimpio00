/** Tokens de cor — um par claro/escuro, para o README servir os dois via <picture>. */
export const THEMES = {
  dark: {
    id: 'dark',
    bg: '#0b0f19',
    panel: '#10192b',
    border: '#1e2a40',
    grid: '#1a2436',
    text: '#e8eef9',
    muted: '#8b9cb8',
    dim: '#5b6b85',
    accent: '#4d9fff',
    accent2: '#8b5cf6',
    accent3: '#3fcf8e',
    glow: 0.5,
  },
  light: {
    id: 'light',
    bg: '#ffffff',
    panel: '#f7f9fd',
    border: '#dfe6f1',
    grid: '#e6ecf5',
    text: '#0d1117',
    muted: '#4d5f7a',
    dim: '#7b8aa3',
    accent: '#1f6feb',
    accent2: '#6d3fe0',
    accent3: '#12a370',
    glow: 0.22,
  },
}

/** Cores oficiais do Linguist para as linguagens que aparecem nos repos. */
export const LANG_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Go: '#00add8',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Java: '#b07219',
  'C#': '#178600',
  Batchfile: '#c1f12e',
  PowerShell: '#012456',
  Makefile: '#427819',
  Procfile: '#a91e50',
}

export const langColor = (name, theme) => LANG_COLORS[name] ?? theme.dim

export const SANS =
  "'Segoe UI','SF Pro Display',-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif"
export const MONO = "ui-monospace,'SF Mono','Cascadia Code',Consolas,'Liberation Mono',monospace"

export const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Largura aproximada de um texto monoespaçado — suficiente para dimensionar chips. */
export const monoWidth = (text, size) => text.length * size * 0.6
