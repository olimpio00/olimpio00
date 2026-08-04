/**
 * Paletas Mustafar — um par claro/escuro para o README servir os dois.
 *
 * `dark`  = lado sombrio: basalto quase preto, rio de lava e sabre vermelho.
 *           O crawl é vermelho-brasa, não o amarelo canônico: o perfil inteiro
 *           lê como arquivo do Império, e amarelo aqui brigaria com a lava.
 * `light` = as cinzas depois da erupção. Existe porque #ff3b30 sobre fundo
 *           claro perde contraste; o tema claro troca para carmim queimado em
 *           vez de simplesmente clarear o escuro.
 *
 * Regra ao mexer: `dim` é o tamanho de texto menor da cena (rótulos de 10.5px
 * em maiúsculas). Se escurecer `dim` no tema escuro, confira o contraste — o
 * valor atual está em ~5.4:1 sobre `panel`, com folga sobre os 4.5:1 exigidos.
 */
export const THEMES = {
  dark: {
    id: 'dark',
    bg: '#010409',
    panel: '#0b0405',
    border: '#2a1113',
    text: '#e6edf3',
    title: '#f5f7fa',
    muted: '#c2b3b3',
    dim: '#9a8687',
    // "accent*" mantém os nomes genéricos: os scripts não precisam saber do tema
    accent: '#ff3b30', // brasa viva
    accent2: '#8b1a1a', // rocha em brasa
    accent3: '#e5484d', // halo do calor
    crawl: '#ff3b30',
    opening: '#4bd5ee', // "Há muito tempo..." é azul no filme — único frio da cena
    saber: '#ff5b52', // também usado em texto — precisa ser legível
    saberCore: '#fff1ef', // núcleo branco-quente com sangria vermelha
    saberGlow: '#ff3b30',
    saberHalo: 0.6,
    hilt: '#aab6c4',
    hiltDark: '#6b7684',
    star: '#ffffff',
    starOpacity: 0.85,
    starCount: 110,
    // Cena vulcânica: rocha da frente mais escura que a do fundo é o que cria
    // profundidade — sem isso as duas cristas viram uma mancha só.
    rock: '#0a070c',
    rockFar: '#1b1015',
    rockEdge: '#5c2422',
    lavaCore: '#ffe0bc', // molten, quase branco no centro do veio
    lavaHot: '#ff8a3d',
    lavaMid: '#ff3b30',
    ember: '#ff6b5e',
    sky: '#1a0507', // topo do céu, onde o calor sobe
    scrim: 0.97, // opacidade do véu que protege a legibilidade do nome
    glow: 0.55,
    textGlow: 11,
    glowColor: '#ff3b30',
  },
  light: {
    id: 'light',
    bg: '#f2e6dd',
    panel: '#fffdfb',
    border: '#d6b9ad',
    text: '#2a1210',
    title: '#1c0c0a',
    muted: '#6b4a44',
    dim: '#87645c',
    accent: '#b3261e', // carmim queimado
    accent2: '#8a1c16',
    accent3: '#c2410c',
    crawl: '#a01b14',
    opening: '#1f6f8b',
    // Sabre vermelho sobre cinza clara: núcleo saturado e halo pálido — o
    // inverso do tema escuro. Num fundo creme, núcleo pálido faz a lâmina
    // parecer um tubo vazio.
    saber: '#b3261e', // também usado em texto — precisa ser legível
    saberCore: '#8a1c16',
    saberGlow: '#f0a49d',
    saberHalo: 0.85,
    hilt: '#8a7355',
    hiltDark: '#5c4b34',
    star: '#c9aba3', // cinza em suspensão, não estrelas
    starOpacity: 0.45,
    starCount: 60,
    // Rocha coberta de cinza, não basalto: o nome é escuro e precisa de base
    // clara. Silhueta preta aqui exigiria inverter o texto no meio da imagem.
    rock: '#bfa899',
    rockFar: '#d4c2b6',
    rockEdge: '#8a5a4c',
    lavaCore: '#fff2d8',
    lavaHot: '#f97316',
    lavaMid: '#c2410c',
    ember: '#c2410c',
    sky: '#f7dccc',
    scrim: 0.5, // mais leve que no escuro: aqui o véu clareia, não escurece
    glow: 0.45,
    textGlow: 0, // glow escuro sobre creme vira borrão, não brilho
    glowColor: '#c2410c',
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

/**
 * O resto da cena é monocromático em vermelho, mas a barra de linguagens não:
 * um degradê de vermelhos deixa sete faixas indistinguíveis entre si e da
 * legenda. Cor do Linguist é reconhecível de longe (TS azul, Go ciano) e é a
 * única parte do card que precisa ser lida como dado, não como cenário.
 */
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
