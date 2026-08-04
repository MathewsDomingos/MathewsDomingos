#!/usr/bin/env node
/**
 * Gera assets/carousel.svg — um carrossel que passa sozinho,
 * a partir do arquivo projects.json.
 *
 * Como adicionar um projeto:
 *   1. edite projects.json
 *   2. (opcional) coloque a imagem em assets/projetos/
 *   3. node scripts/generate-carousel.mjs
 *
 * O GitHub Action já faz o passo 3 sozinho a cada push.
 *
 * Observação importante: o SVG do README não consegue carregar imagem
 * externa, então a imagem é embutida em base64 aqui dentro. Mantenha
 * cada arquivo abaixo de ~150 KB e no formato paisagem (ex.: 900x640).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const OUT = "assets/carousel.svg";
const SRC = "projects.json";

/* ------------------------------------------------------------- ajustes */

const W = 880;
const H = 340;
const SLIDE_DUR = 6.5; // segundos que cada projeto fica na tela
const FADE = 0.7; // duração do cruzamento entre projetos

const COR = {
  ok: { c: "#40E69A", t: "EM PRODUÇÃO" },
  wip: { c: "#FFC14D", t: "EM DESENVOLVIMENTO" },
  lab: { c: "#A78BFA", t: "LABORATÓRIO" },
};

const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

/* ------------------------------------------------------------ utilidades */

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/** quebra o texto em linhas que caibam na largura dada (fonte monoespaçada) */
function wrap(text, maxWidth, fontSize) {
  const perChar = fontSize * 0.6;
  const max = Math.floor(maxWidth / perChar);
  const linhas = [];
  let atual = "";
  for (const palavra of String(text || "").split(/\s+/)) {
    if (!palavra) continue;
    if ((atual + " " + palavra).trim().length > max) {
      if (atual) linhas.push(atual.trim());
      atual = palavra;
    } else {
      atual = (atual + " " + palavra).trim();
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function embutirImagem(caminho) {
  if (!caminho || !existsSync(caminho)) return null;
  const ext = caminho.split(".").pop().toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  const b64 = readFileSync(caminho).toString("base64");
  return `data:${mime};base64,${b64}`;
}

/* ---------------------------------------------------------------- dados */

let projetos;
try {
  projetos = JSON.parse(readFileSync(SRC, "utf8"));
} catch (e) {
  console.error(`erro ao ler ${SRC}: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(projetos) || !projetos.length) {
  console.error(`${SRC} precisa ser uma lista com pelo menos um projeto`);
  process.exit(1);
}

const N = projetos.length;
const TOTAL = N * SLIDE_DUR;

/* ------------------------------------------------------------ renderiza */

/** animação de opacidade: visível só na fatia de tempo deste slide */
function anim(indice) {
  if (N === 1) return "";
  const k = [
    0,
    FADE / TOTAL,
    SLIDE_DUR / TOTAL,
    (SLIDE_DUR + FADE) / TOTAL,
    1,
  ]
    .map((v) => v.toFixed(4))
    .join(";");
  return `<animate attributeName="opacity" begin="${(indice * SLIDE_DUR).toFixed(2)}s"
      dur="${TOTAL}s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="${k}" calcMode="linear"/>`;
}

const TX = 40; // coluna de texto
const TW = 420; // largura da coluna de texto
const IX = 500; // coluna da imagem
const IW = 344;
const IY = 78;
const IH = 224;

const slides = projetos
  .map((p, i) => {
    const sev = COR[p.estado] || COR.ok;
    const dataUri = embutirImagem(p.imagem);

    const desc = wrap(p.descricao, TW, 12.5)
      .slice(0, 5)
      .map((l, j) => `<text x="${TX}" y="${188 + j * 19}" fill="#7A8CA3" font-size="12.5">${esc(l)}</text>`)
      .join("\n        ");

    // chips de stack
    let cx = TX;
    const chips = (p.stack || [])
      .map((s) => {
        const w = Math.round(String(s).length * 6.6) + 20;
        if (cx + w > TX + TW) return "";
        const el = `<g><rect x="${cx}" y="${288}" width="${w}" height="22" rx="11" fill="#16202E" stroke="#22303F"/>
          <text x="${cx + w / 2}" y="${303}" fill="#9FB2C6" font-size="10.5" text-anchor="middle">${esc(s)}</text></g>`;
        cx += w + 7;
        return el;
      })
      .join("\n        ");

    const visual = dataUri
      ? `<image href="${dataUri}" x="${IX}" y="${IY}" width="${IW}" height="${IH}"
          preserveAspectRatio="xMidYMid slice" clip-path="url(#shot)"/>
        <rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10" fill="none" stroke="#22303F"/>`
      : `<g>
          <rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10" fill="#101A27" stroke="#22303F"/>
          <rect x="${IX}" y="${IY}" width="${IW}" height="30" rx="10" fill="#16202E"/>
          <rect x="${IX}" y="${IY + 20}" width="${IW}" height="10" fill="#16202E"/>
          <circle cx="${IX + 18}" cy="${IY + 15}" r="4" fill="#FF6A4E" opacity="0.7"/>
          <circle cx="${IX + 32}" cy="${IY + 15}" r="4" fill="#FFC14D" opacity="0.7"/>
          <circle cx="${IX + 46}" cy="${IY + 15}" r="4" fill="#40E69A" opacity="0.7"/>
          <text x="${IX + IW / 2}" y="${IY + IH / 2}" fill="#2D3E52" font-size="12"
            text-anchor="middle" letter-spacing="1.5">sem captura ainda</text>
          <text x="${IX + IW / 2}" y="${IY + IH / 2 + 20}" fill="#22303F" font-size="10"
            text-anchor="middle">assets/projetos/</text>
        </g>`;

    const link = p.link
      ? `<text x="${TX}" y="${332}" fill="#3E5670" font-size="10.5">↗ ${esc(p.link)}</text>`
      : "";

    return `<g opacity="0">
        ${anim(i)}
        ${visual}
        <text x="${TX}" y="${92}" fill="${sev.c}" font-size="10" letter-spacing="2">${esc(sev.t)}</text>
        <text x="${TX}" y="${128}" fill="#E8EEF5" font-size="21" font-weight="700">${esc(p.titulo)}</text>
        <text x="${TX}" y="${152}" fill="${sev.c}" font-size="12.5" opacity="0.85">${esc(p.subtitulo)}</text>
        ${desc}
        ${chips}
        ${link}
        <text x="${W - 34}" y="${36}" fill="#3E5670" font-size="11" text-anchor="end">${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}</text>
      </g>`;
  })
  .join("\n      ");

// bolinhas de progresso
const dotGap = 16;
const dotX0 = W / 2 - ((N - 1) * dotGap) / 2;
const dots = projetos
  .map((_, i) => {
    const k = [0, FADE / TOTAL, SLIDE_DUR / TOTAL, (SLIDE_DUR + FADE) / TOTAL, 1]
      .map((v) => v.toFixed(4))
      .join(";");
    const a =
      N === 1
        ? ""
        : `<animate attributeName="opacity" begin="${(i * SLIDE_DUR).toFixed(2)}s" dur="${TOTAL}s"
        repeatCount="indefinite" values="0.15;1;1;0.15;0.15" keyTimes="${k}"/>`;
    return `<circle cx="${dotX0 + i * dotGap}" cy="${H - 14}" r="3.5" fill="#40E69A" opacity="0.15">${a}</circle>`;
  })
  .join("\n      ");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Carrossel de projetos: ${projetos.map((p) => esc(p.titulo)).join(", ")}">
  <defs>
    <pattern id="pg" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M22 0 L0 0 0 22" fill="none" stroke="#141E2B" stroke-width="1"/>
    </pattern>
    <clipPath id="pc"><rect width="${W}" height="${H}" rx="14"/></clipPath>
    <clipPath id="shot"><rect x="${IX}" y="${IY}" width="${IW}" height="${IH}" rx="10"/></clipPath>
  </defs>

  <g clip-path="url(#pc)" font-family="ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace">
    <rect width="${W}" height="${H}" fill="#0B131F"/>
    <rect width="${W}" height="${H}" fill="url(#pg)" opacity="0.6"/>

    <rect x="0" y="0" width="${W}" height="52" fill="#121A26"/>
    <rect x="0" y="51" width="${W}" height="1" fill="#22303F"/>
    <rect x="0" y="0" width="4" height="52" fill="#40E69A"/>
    <text x="34" y="32" fill="#E8EEF5" font-size="13" font-weight="700" letter-spacing="2.4">PROJETOS</text>

    <!-- barra de progresso do ciclo -->
    <rect x="0" y="50" width="${W}" height="2" fill="#40E69A" opacity="0.85">
      <animate attributeName="width" values="0;${W}" dur="${SLIDE_DUR}s" repeatCount="indefinite"/>
    </rect>

    <g>
      ${slides}
    </g>

    <g>
      ${dots}
    </g>

    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#1D2A3A"/>
  </g>
</svg>
`;

mkdirSync("assets", { recursive: true });
writeFileSync(OUT, svg);
const kb = (Buffer.byteLength(svg) / 1024).toFixed(0);
console.log(`ok → ${OUT} (${N} projetos, ciclo de ${TOTAL}s, ${kb} KB)`);
if (kb > 900) console.warn("aviso: SVG grande — comprima as imagens em assets/projetos/");
