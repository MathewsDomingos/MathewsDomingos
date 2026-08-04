#!/usr/bin/env node
/**
 * Gera assets/status.svg — um painel "Latest data" estilo Zabbix
 * com métricas reais da conta do GitHub.
 *
 * Uso local:  GITHUB_USER=MathewsDomingos node scripts/generate-status.mjs
 * No Actions: as env vars já vêm preenchidas pelo workflow.
 */

import { writeFileSync, mkdirSync } from "node:fs";

const USER = process.env.GITHUB_USER || "MathewsDomingos";
const TOKEN = process.env.GITHUB_TOKEN || "";
const OUT = "assets/status.svg";

const HEADERS = {
  "User-Agent": `${USER}-profile-status`,
  Accept: "application/vnd.github+json",
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

async function api(path) {
  try {
    const r = await fetch(`https://api.github.com${path}`, { headers: HEADERS });
    if (!r.ok) throw new Error(`${r.status} ${path}`);
    return await r.json();
  } catch (e) {
    console.error(`aviso: falha em ${path} — ${e.message}`);
    return null;
  }
}

/* ---------------------------------------------------------------- coleta */

// SAMPLE=1 gera um painel de exemplo sem tocar na API (útil para prever o layout)
const SAMPLE = process.env.SAMPLE === "1";

const user = SAMPLE
  ? { public_repos: 24, created_at: "2020-02-14T00:00:00Z" }
  : (await api(`/users/${USER}`)) || {};

const repos = SAMPLE
  ? [
      { stargazers_count: 12, language: "PHP", pushed_at: new Date(Date.now() - 5e6).toISOString() },
      { stargazers_count: 7, language: "Python", pushed_at: "" },
      { stargazers_count: 3, language: "JavaScript", pushed_at: "" },
      { stargazers_count: 2, language: "Python", pushed_at: "" },
      { stargazers_count: 1, language: "PHP", pushed_at: "" },
      { stargazers_count: 0, language: "Shell", pushed_at: "" },
    ]
  : (await api(`/users/${USER}/repos?per_page=100&sort=pushed`)) || [];

// eventos públicos: até 3 páginas (~300 eventos, ~90 dias)
let events = [];
if (!SAMPLE) {
  for (let page = 1; page <= 3; page++) {
    const chunk = await api(`/users/${USER}/events/public?per_page=100&page=${page}`);
    if (!chunk || !chunk.length) break;
    events = events.concat(chunk);
  }
}

const DAYS = 30;
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const buckets = new Array(DAYS).fill(0);
if (SAMPLE) {
  const seed = [0,3,5,0,0,2,7,4,1,0,6,9,3,0,0,5,8,2,4,11,6,0,3,7,5,1,0,9,6,4];
  for (let i = 0; i < DAYS; i++) buckets[i] = seed[i];
}
for (const ev of events) {
  if (ev.type !== "PushEvent") continue;
  const d = new Date(ev.created_at);
  d.setUTCHours(0, 0, 0, 0);
  const idx = DAYS - 1 - Math.round((today - d) / 86400000);
  if (idx >= 0 && idx < DAYS) buckets[idx] += ev.payload?.commits?.length || 1;
}

const commits30 = buckets.reduce((a, b) => a + b, 0);
const activeDays = buckets.filter((v) => v > 0).length;
const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);

const langCount = {};
for (const r of repos) if (r.language) langCount[r.language] = (langCount[r.language] || 0) + 1;
const topLangs = Object.entries(langCount).sort((a, b) => b[1] - a[1]).slice(0, 3);

const lastPush = repos.length ? new Date(repos[0].pushed_at) : null;
const hoursSincePush = lastPush ? Math.floor((Date.now() - lastPush) / 3600000) : null;

const ago = (h) => {
  if (h == null) return "—";
  if (h < 1) return "agora há pouco";
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
};

const accountYears = user.created_at
  ? ((Date.now() - new Date(user.created_at)) / 31557600000).toFixed(1)
  : "—";

/* --------------------------------------------------------------- modelo */

// severidade: ok | warn | crit  → vira a cor da bolinha e do valor
const rows = [
  {
    key: "repos.public.count",
    label: "Repositórios públicos",
    value: user.public_repos ?? "—",
    sev: "ok",
  },
  {
    key: "commits.rate[30d]",
    label: "Commits nos últimos 30 dias",
    value: commits30,
    sev: commits30 >= 20 ? "ok" : commits30 >= 5 ? "warn" : "crit",
  },
  {
    key: "activity.days[30d]",
    label: "Dias com atividade",
    value: `${activeDays}/${DAYS}`,
    sev: activeDays >= 12 ? "ok" : activeDays >= 5 ? "warn" : "crit",
  },
  {
    key: "repos.stars.total",
    label: "Estrelas acumuladas",
    value: stars,
    sev: "ok",
  },
  {
    key: "stack.primary",
    label: "Linguagens dominantes",
    value: topLangs.length ? topLangs.map(([l]) => l).join(" · ") : "—",
    sev: "ok",
  },
  {
    key: "last.push.age",
    label: "Último push",
    value: ago(hoursSincePush),
    sev: hoursSincePush == null ? "warn" : hoursSincePush < 72 ? "ok" : hoursSincePush < 336 ? "warn" : "crit",
  },
  {
    key: "account.uptime",
    label: "Uptime da conta",
    value: `${accountYears} anos`,
    sev: "ok",
  },
];

const COLOR = { ok: "#40E69A", warn: "#FFC14D", crit: "#FF6A4E" };

/* ------------------------------------------------------------ renderiza */

const W = 880;
const ROW_H = 34;
const TOP = 96;
const H = TOP + rows.length * ROW_H + 92;

const maxBar = Math.max(1, ...buckets);
const barW = 18;
const barGap = 5;
const chartScale = (W - 60) / (DAYS * (barW + barGap));

const bars = buckets
  .map((v, i) => {
    const h = Math.max(2, Math.round((v / maxBar) * 46));
    const x = 30 + i * (barW + barGap) * chartScale;
    const w = barW * chartScale;
    const y = H - 34 - h;
    const c = v === 0 ? "#1D2A3A" : v >= maxBar * 0.66 ? "#40E69A" : v >= maxBar * 0.33 ? "#2FB57A" : "#1F6B4D";
    return `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="2" fill="${c}">
      <animate attributeName="height" from="0" to="${h}" dur="0.7s" begin="${(i * 0.02).toFixed(2)}s" fill="freeze"/>
      <animate attributeName="y" from="${H - 34}" to="${y}" dur="0.7s" begin="${(i * 0.02).toFixed(2)}s" fill="freeze"/>
    </rect>`;
  })
  .join("\n    ");

const rowSvg = rows
  .map((r, i) => {
    const y = TOP + i * ROW_H;
    const c = COLOR[r.sev];
    const stripe = i % 2 === 0 ? `<rect x="16" y="${y - 22}" width="${W - 32}" height="${ROW_H}" fill="#101A27"/>` : "";
    const pulse =
      r.sev !== "ok"
        ? `<animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>`
        : "";
    return `${stripe}
    <circle cx="34" cy="${y - 5}" r="4" fill="${c}">${pulse}</circle>
    <text x="52" y="${y}" fill="#8FA3B8" font-size="12.5">${esc(r.key)}</text>
    <text x="300" y="${y}" fill="#5C7086" font-size="12">${esc(r.label)}</text>
    <text x="${W - 30}" y="${y}" fill="${c}" font-size="13.5" font-weight="700" text-anchor="end">${esc(r.value)}</text>`;
  })
  .join("\n    ");

const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Painel de status do GitHub de ${esc(USER)}">
  <defs>
    <pattern id="g" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M22 0 L0 0 0 22" fill="none" stroke="#141E2B" stroke-width="1"/>
    </pattern>
    <clipPath id="c"><rect width="${W}" height="${H}" rx="14"/></clipPath>
  </defs>
  <g clip-path="url(#c)" font-family="ui-monospace, 'SF Mono', 'JetBrains Mono', 'Cascadia Code', Consolas, monospace">
    <rect width="${W}" height="${H}" fill="#0B131F"/>
    <rect width="${W}" height="${H}" fill="url(#g)" opacity="0.6"/>

    <rect x="0" y="0" width="${W}" height="60" fill="#121A26"/>
    <rect x="0" y="59" width="${W}" height="1" fill="#22303F"/>
    <rect x="0" y="0" width="4" height="60" fill="#40E69A"/>

    <text x="30" y="27" fill="#E8EEF5" font-size="14" font-weight="700" letter-spacing="2.2">LATEST DATA</text>
    <text x="30" y="46" fill="#4E6076" font-size="11" letter-spacing="1.2">host: github.com/${esc(USER)}  ·  intervalo de coleta: 6h</text>
    <circle cx="${W - 168}" cy="30" r="4" fill="#40E69A"><animate attributeName="opacity" values="1;0.2;1" dur="2s" repeatCount="indefinite"/></circle>
    <text x="${W - 30}" y="34" fill="#5C7086" font-size="10.5" text-anchor="end" letter-spacing="1">${esc(stamp)}</text>

    ${rowSvg}

    <text x="30" y="${H - 96}" fill="#4E6076" font-size="10.5" letter-spacing="1.8">COMMITS · ÚLTIMOS ${DAYS} DIAS</text>
    <rect x="30" y="${H - 33}" width="${W - 60}" height="1" fill="#1D2A3A"/>
    ${bars}

    <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="#1D2A3A"/>
  </g>
</svg>
`;

mkdirSync("assets", { recursive: true });
writeFileSync(OUT, svg);
console.log(`ok → ${OUT} (${commits30} commits / ${activeDays} dias ativos)`);
