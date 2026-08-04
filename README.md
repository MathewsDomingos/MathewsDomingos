<img src="./assets/header.svg" alt="Mateus Domingos — Observabilidade, Automação, Zabbix / Grafana / n8n" width="100%">

<p align="center">
  <a href="#-whoami">whoami</a> ·
  <a href="#-status-ao-vivo">status</a> ·
  <a href="#-casos-o-que-eu-construí">casos</a> ·
  <a href="#-stack-em-produção">stack</a> ·
  <a href="#-contato">contato</a>
</p>

---

### 🖥️ whoami

```console
$ mateus --describe

NOME       Mateus Domingos
FUNÇÃO     Analista de Monitoramento & Desenvolvedor de Observabilidade
FOCO       transformar métrica crua em decisão de negócio
SETORES    varejo · infraestrutura · rodovias · energia · óleo e gás
IDIOMA     pt-BR (nativo) · en (técnico)
PET        1 gato, uptime 100%

$ mateus --what-i-actually-do

  ├── desenho templates Zabbix (SNMP, SSH, LLD, preprocessing JS, dependent items)
  ├── construo dashboards Grafana que a diretoria entende sem legenda
  ├── escrevo módulos PHP dentro do frontend do Zabbix
  ├── automatizo o chato com n8n, Python e API
  └── conecto alerta → chamado → WhatsApp → relatório, sem ninguém no meio
```

> Não gosto de monitoramento que só pisca vermelho. Gosto do que responde
> *"quanto isso custou?"* e *"o que eu faço agora?"*.

---

### 📊 Status ao vivo

<sub>Este painel é gerado por um GitHub Action a cada 6 horas. Nada aqui é estático.</sub>

<img src="./assets/status.svg" alt="Painel de métricas do GitHub em tempo quase real" width="100%">

---

### 🧩 Casos: o que eu construí

<sub>Cada projeto está escrito como um chamado: sintoma → diagnóstico → correção → impacto.
Clique para abrir.</sub>

<br>

<details>
<summary><b>🟩&nbsp; zabbix-whatsapp-webhook</b> &nbsp;—&nbsp; <i>alerta que chega onde a equipe realmente olha</i></summary>

<br>

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Sintoma**  | Alertas por e-mail eram ignorados. Tempo médio de reação alto demais.       |
| **Correção** | Webhook nativo no Zabbix que entrega o problema no WhatsApp **com o screenshot do gráfico anexado** — o técnico vê a curva antes de abrir o notebook. |
| **Stack**    | `JavaScript (webhook Zabbix)` · `Evolution API` · `Zabbix API` |
| **Estado**   | 🟢 Open source, em produção |

<!-- 👇 troque por um GIF de 10s: alerta disparando → mensagem chegando no celular -->
<!-- <img src="./assets/demos/whatsapp.gif" width="100%"> -->

➜ **[Ver repositório](https://github.com/MathewsDomingos/zabbix-whatsapp-webhook)**

</details>

<details>
<summary><b>🟩&nbsp; Módulos de frontend para Zabbix</b> &nbsp;—&nbsp; <i>quando o Zabbix não tem a tela, eu escrevo a tela</i></summary>

<br>

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Sintoma**  | Informação existia no banco, mas exigia sair do Zabbix, abrir outra ferramenta e cruzar na mão. |
| **Correção** | Módulos PHP em arquitetura MVC dentro do próprio frontend (`manifest.json` + `CController` + views), integrados por API. Um exporta o inventário de coletas de um host para planilha, com filtro por tipo de item; outro traz os chamados do GLPI para dentro da tela de problemas. |
| **Stack**    | `PHP 8` · `Zabbix 7.0/7.4 module API` · `GLPI REST API` · `JS` |
| **Estado**   | 🟡 Em desenvolvimento ativo |

<!-- <img src="./assets/demos/modulo.gif" width="100%"> -->

</details>

<details>
<summary><b>🟩&nbsp; Motor de SLA mensal + painel executivo</b> &nbsp;—&nbsp; <i>disponibilidade que o cliente consegue auditar</i></summary>

<br>

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Sintoma**  | SLA discutido em reunião por planilha, sem fonte única de verdade. Ninguém sabia dizer o número do mês anterior. |
| **Correção** | Item do tipo *Script* (JavaScript) consultando a API do Zabbix de hora em hora: calcula % up/down do mês corrente e do mês anterior, com reset automático na virada. Resultado exposto num card HTML/CSS/JS no Grafana, feito para telão de gerência. |
| **Stack**    | `JavaScript` · `Zabbix API` · `Grafana` · `gapit-htmlgraphics-panel` |
| **Estado**   | 🟢 Em produção · SLO 98,5% |

<!-- <img src="./assets/demos/sla.gif" width="100%"> -->

</details>

<details>
<summary><b>🟩&nbsp; Gerador de topologias para ambiente air-gapped</b> &nbsp;—&nbsp; <i>planilha entra, mapa sai</i></summary>

<br>

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Sintoma**  | Dezenas de mapas de rede para desenhar à mão, num ambiente sem acesso à internet. Cada topologia levava horas e saía visualmente diferente da anterior. |
| **Correção** | Pipeline que lê a planilha de inventário e emite o YAML de mapa pronto para importar no Zabbix — layout simétrico estilo Cisco Enterprise, âncoras de roteamento de link, status ao vivo por trigger, ícones próprios desenhados no Figma em 4 estados (ok / problema / desabilitado / manutenção). |
| **Stack**    | `Python` · `Pillow` · `Zabbix export YAML` · `Figma` |
| **Estado**   | 🟡 Primeira topologia importada com sucesso; automação em construção |

<!-- <img src="./assets/demos/topologia.gif" width="100%"> -->

</details>

<details>
<summary><b>🟪&nbsp; shorts-ai-mvp</b> &nbsp;—&nbsp; <i>projeto pessoal: vídeo curto gerado do início ao fim por pipeline</i></summary>

<br>

|              |                                                                            |
| ------------ | -------------------------------------------------------------------------- |
| **Sintoma**  | Curiosidade honesta: dá para automatizar 100% de um canal de vídeos curtos? |
| **Correção** | Pipeline em Python/Docker: baixa a fonte com `yt-dlp`, transcreve local com `faster-whisper` (custo zero de API), pontua os melhores trechos com a Claude API e renderiza em 9:16 com legenda ASS via FFmpeg. |
| **Stack**    | `Python` · `Docker` · `faster-whisper` · `Claude API` · `FFmpeg` |
| **Estado**   | 🟣 Laboratório — é onde eu quebro coisas de propósito |

</details>

<br>

<details>
<summary><b>📁 Outros trabalhos entregues</b> <sub>(clique para expandir)</sub></summary>

<br>

| Projeto | O que faz | Stack |
| ------- | --------- | ----- |
| **Excel → Infra** | Planilha de inventário vira template Zabbix (YAML) + dashboard Grafana (JSON) gerados automaticamente | `Python` · `Zabbix` · `Grafana` |
| **Relatório BGP/SLA mensal** | Coleta, interpreta e envia o relatório mensal sem intervenção humana | `Zabbix` · `n8n` · `Claude API` |
| **Integração Zabbix ↔ GLPI** | Abertura, atualização e fechamento automático de chamados a partir do alerta | `Webhook GLPi` · `REST API` |
| **Instalador Zabbix 7 + Grafana** | Provisiona o stack completo em Oracle Linux 8 do zero | `Bash` · `Oracle Linux 8` |
| **Diagnóstico MikroTik via API** | Investigação de reboots espontâneos quando o syslog estava bloqueado por ACL | `Python` · `librouteros` |
| **Migração de dashboards** | Move dashboards entre ambientes remapeando UID de datasource, em ambiente só-RDP | `PowerShell` · `Grafana API` |

</details>

---

### ⚙️ Stack em produção

<sub>Não é lista de ícone. É o que eu uso, e o quanto eu uso.</sub>

| Ferramenta | Onde eu chego | Uso |
| ---------- | ------------- | --- |
| **Zabbix** | Server, Proxy, API, templates SNMP/SSH, LLD, preprocessing JS, dependent items, módulos PHP | `██████████` diário |
| **Grafana** | Datasources, htmlgraphics, ECharts, provisioning, migração entre ambientes | `█████████░` diário |
| **n8n** | Workflows, APIs, Supabase, S3, Telegram, geração de PDF | `███████░░░` semanal |
| **Linux** | Oracle Linux · Ubuntu · Debian — instalação, tuning, troubleshooting | `█████████░` diário |
| **Python** | Automação, scripts de infra, pipelines, integrações | `███████░░░` semanal |
| **PHP** | Módulos de frontend do Zabbix (MVC) | `██████░░░░` em evolução |
| **PostgreSQL / MySQL** | Query no schema do Zabbix, otimização, relatórios | `███████░░░` semanal |
| **Docker** | Compose, queue mode, ambientes de laboratório | `███████░░░` semanal |
| **HTML / CSS / JS** | Cards e painéis customizados dentro do Grafana | `████████░░` frequente |

<details>
<summary><b>📜 Certificações</b></summary>

<br>

- **Zabbix Certified User** (ZCU)
- **n8n Automations Advanced** — Rocketseat
- **Boas práticas de Cibersegurança** — IBSEC

</details>

---

### 📬 Contato

<p align="center">
  <a href="https://www.linkedin.com/in/mathews-domingos"><img src="https://img.shields.io/badge/LinkedIn-0B131F?style=for-the-badge&logo=linkedin&logoColor=40E69A&labelColor=0B131F"></a>
  <a href="mailto:mateusdomingos.etec@gmail.com"><img src="https://img.shields.io/badge/E--mail-0B131F?style=for-the-badge&logo=gmail&logoColor=40E69A&labelColor=0B131F"></a>
  <a href="https://api.whatsapp.com/send/?phone=%2B5516991585851"><img src="https://img.shields.io/badge/WhatsApp-0B131F?style=for-the-badge&logo=whatsapp&logoColor=40E69A&labelColor=0B131F"></a>
  <a href="https://www.instagram.com/mathews.domingos/"><img src="https://img.shields.io/badge/Instagram-0B131F?style=for-the-badge&logo=instagram&logoColor=40E69A&labelColor=0B131F"></a>
</p>

<p align="center">
  <sub>Observabilidade é transformar dado em decisão.</sub>
</p>
