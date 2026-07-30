/**
 * Paletas Star Wars — um par claro/escuro para o README servir os dois.
 *
 * `dark`  = espaço profundo, amarelo oficial da abertura (#FFE81F) e sabre azul.
 * `light` = Tatooine (areia, sóis gêmeos). Existe porque #FFE81F sobre fundo
 *           claro é ilegível; o tema claro troca para ocre queimado em vez de
 *           simplesmente clarear o tema escuro.
 */
export const THEMES = {
  dark: {
    id: 'dark',
    mode: 'space',
    bg: '#05070f',
    panel: '#0c1220',
    border: '#1c2a45',
    grid: '#111c2e',
    text: '#e8eef9',
    muted: '#9fb2cc',
    dim: '#6b7f9c',
    // "accent*" mantém os nomes genéricos: os scripts não precisam saber do tema
    accent: '#4bd5ee', // sabre azul
    accent2: '#8b5cf6', // sabre roxo
    accent3: '#ffe81f', // amarelo da abertura
    crawl: '#ffe81f',
    opening: '#4bd5ee', // "Há muito tempo..." é azul no filme
    saber: '#4bd5ee', // também usado em texto — precisa ser legível
    saberCore: '#ffffff',
    saberGlow: '#4bd5ee',
    saberHalo: 0.55,
    hilt: '#aab6c4',
    hiltDark: '#6b7684',
    star: '#ffffff',
    starOpacity: 0.9,
    starCount: 120,
    glow: 0.42,
    textGlow: 7,
  },
  light: {
    id: 'light',
    mode: 'desert',
    bg: '#f7edd9',
    panel: '#fffaee',
    border: '#dcc59c',
    grid: '#e6d5b4',
    text: '#2a1c0c',
    muted: '#6a5333',
    dim: '#947952',
    accent: '#b4531a', // ocre queimado
    accent2: '#8a3f12',
    accent3: '#a8720a', // dourado escuro, legível sobre areia
    crawl: '#9c6206',
    opening: '#1f6f8b',
    // Sabre azul sobre areia: além de ser a imagem icônica de Tatooine, é o
    // único jeito de a lâmina ter contraste num fundo claro — vermelho pálido
    // sobre creme desaparece.
    // Núcleo saturado e halo claro — o inverso do tema escuro. Num fundo
    // creme, núcleo pálido faz a lâmina parecer um tubo vazio.
    saber: '#2563eb', // também usado em texto — precisa ser legível
    saberCore: '#1d4ed8',
    saberGlow: '#93c5fd',
    saberHalo: 0.85,
    hilt: '#8a7355',
    hiltDark: '#5c4b34',
    star: '#c9ab7d', // poeira em suspensão, não estrelas
    starOpacity: 0.5,
    starCount: 70,
    glow: 0.5,
    textGlow: 0, // glow escuro sobre creme vira borrão, não brilho
  },
}

/** Cores oficiais do Linguist — reconhecíveis, não devem ser tematizadas. */
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

/** Largura aproximada de texto monoespaçado — suficiente para dimensionar chips. */
export const monoWidth = (text, size) => text.length * size * 0.6
