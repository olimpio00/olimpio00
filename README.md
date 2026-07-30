<h1 align="center">Olímpio</h1>

<p align="center">
  <strong>Fullstack Developer</strong><br>
  Angular &amp; React no front, Node/Go/Python no back — de CRUD corporativo a app desktop.
</p>

<p align="center">
  <a href="https://github.com/olimpio00?tab=repositories">
    <img src="https://img.shields.io/badge/Repositórios-10-1f6feb?style=flat-square&logo=github&logoColor=white" alt="Repositórios">
  </a>
  <a href="mailto:olimpio@sellentt.com.br">
    <img src="https://img.shields.io/badge/Email-contato-EA4335?style=flat-square&logo=gmail&logoColor=white" alt="Email">
  </a>
  <!-- Adicione seu LinkedIn aqui:
  <a href="https://linkedin.com/in/SEU-USUARIO">
    <img src="https://img.shields.io/badge/LinkedIn-perfil-0A66C2?style=flat-square&logo=linkedin&logoColor=white" alt="LinkedIn">
  </a>
  -->
</p>

---

## Sobre mim

Desenvolvedor fullstack focado em aplicações web. No dia a dia trabalho com **Angular + TypeScript** e backends em **Node.js**, e nos projetos pessoais exploro **Go**, **Python** e integrações com APIs de terceiros (Spotify, YouTube, Supabase).

Gosto de projeto que **roda de ponta a ponta**: interface, API, banco e deploy. A maior parte do que está aqui foi construída assim — não são exercícios soltos, são sistemas completos.

- 🧩 Arquitetura de frontend: separação container/apresentação, custom hooks, organização por feature
- ⚙️ Backends e integrações: REST, autenticação, permissões por papel, real-time
- 🖥️ Também construo desktop: GUIs em Python empacotadas como executável
- 🚀 Deploy: Render, GitHub Actions, Firebase Hosting

---

## Stack

**Linguagens**

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)
![Go](https://img.shields.io/badge/Go-00ADD8?style=flat-square&logo=go&logoColor=white)

**Frontend**

![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat-square&logo=angular&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

**Backend, dados & infra**

![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)
![Render](https://img.shields.io/badge/Render-000000?style=flat-square&logo=render&logoColor=white)

---

## Projetos em destaque

### 🎛️ [IROS — Overlay](https://github.com/olimpio00/Overlay)

Sistema de **overlay em tempo real para OBS**, controlado pelo navegador. Cria sessões e entrega **editor e viewer separados**, para que o streamer edite em uma janela enquanto o OBS captura a outra — sem recarregar a cena. Suporta texto, imagem, áudio, vídeo, timers e iframes.

`Go` `JavaScript` `HTML/CSS` — backend em Go servindo templates e assets · 125 commits · AGPL-3.0

> Meu projeto mais completo: arquitetura em camadas (`cmd/`, `core/`, `meta/`), estado de sessão em tempo real e configuração via `.env`.

---

### 🎴 [GachArena](https://github.com/olimpio00/GachArena)

Sistema de **gacha** com temática de animes (Bleach, Naruto, One Piece, Dragon Ball): abertura de caixas temáticas, raridade de personagens, mecânica de drop expansível e coleção do usuário.

`TypeScript` `Angular` `Node.js` `GitHub Actions` — monorepo `frontend/` + `backend/` com pipeline de CI

> Modelagem de probabilidade e raridade — a parte divertida é garantir que o drop rate seja justo *e* auditável.

---

### 🛒 [ProdutorStore](https://github.com/olimpio00/produtor-store)

E-commerce em **Angular 17** com catálogo de produtos, consumindo API mockada via `json-server` e proxy de desenvolvimento.

`Angular 17` `TypeScript` `JSON Server`

---

### ⚛️ [Refactory-React](https://github.com/olimpio00/Refactory-React)

Estudo prático de **arquitetura de frontend**: refatoração de um `ProductPage` monolítico em uma estrutura escalável.

`React` `TypeScript` `Vite`

Cinco princípios aplicados:
1. Separação de responsabilidades
2. Divisão container / apresentacional
3. Extração de custom hooks (`useProducts`)
4. Organização por feature (`features/products/`)
5. Componentes de UI agnósticos à fonte de dados

---

### 🎵 [Player Music](https://github.com/olimpio00/player-music)

**Player de música desktop** com interface inspirada no Spotify. Suporta MP3/WAV/OGG/FLAC, shuffle inteligente sem repetição, playlists persistidas em JSON, mini-player e **teclas de mídia funcionando em background**.

`Python 3.11` `tkinter` `Pygame` `Mutagen` `PyWin32` `PyInstaller` — MIT

> Empacotado como `.exe` via PyInstaller. Integração com as media keys do Windows foi a parte mais interessante.

---

### ⬇️ [Spotify → YouTube Downloader](https://github.com/olimpio00/Spotify-YouTube-Downloader)

App desktop para baixar **faixas e playlists do Spotify** (resolvidas via YouTube) em MP3, e vídeos do YouTube de 240p até **4K 60fps com upscaling automático**.

`Python` `CustomTkinter` `yt-dlp` `Spotipy` `FFmpeg`

> Integração com a Spotify Web API + pipeline de conversão em FFmpeg, com progresso em tempo real na UI.

---

### 🗂️ [Star Wars Fan Wiki](https://github.com/olimpio00/Star-Wars-Fan-Wiki) · [🌐 ao vivo](https://star-wars-fan-wiki.onrender.com)

**Gerenciador de arquivos** com tema Star Wars: upload/download, organização em pastas e categorias, autenticação e **permissões por papel** (admin / usuário padrão). Responsivo em mobile.

`Python` `NiceGUI` `Supabase` (auth + storage + database) — MIT · deploy na Render

---

### 🕵️ [Andor Missions](https://github.com/olimpio00/Andor-Missions)

CRUD de **missões no universo de Cassian Andor** — infiltração, sabotagem, reconhecimento e exfiltração. Pequeno, rápido e pronto para deploy.

`Python` `Flet` `Supabase` — deploy declarativo via `render.yaml`

---

### 📓 Projetos de estágio

| Projeto | Descrição | Stack |
|---|---|---|
| [Estagio-etapa-2](https://github.com/olimpio00/Estagio-etapa-2) | Webapp de social media | `Angular` `TypeScript` |
| [Estagio-etapa-1](https://github.com/olimpio00/Estagio-etapa-1) | Backend da etapa inicial | `JavaScript` `Node.js` |

---

## GitHub

<p align="center">
  <img height="165" src="https://github-readme-stats.vercel.app/api?username=olimpio00&show_icons=true&hide_border=true&theme=tokyonight&count_private=true" alt="Estatísticas de olimpio00">
  <img height="165" src="https://github-readme-stats.vercel.app/api/top-langs/?username=olimpio00&layout=compact&hide_border=true&theme=tokyonight&langs_count=8" alt="Linguagens mais usadas">
</p>

---

## Contato

- 📫 **Email:** [olimpio@sellentt.com.br](mailto:olimpio@sellentt.com.br)
- 💻 **GitHub:** [@olimpio00](https://github.com/olimpio00)
<!-- - 💼 **LinkedIn:** [seu-perfil](https://linkedin.com/in/SEU-USUARIO) -->
<!-- - 🌐 **Portfólio:** https://seusite.com -->

<p align="center"><sub>Aberto a oportunidades e colaborações. 🚀</sub></p>
