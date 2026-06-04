# Glide MCP jako remote connector (Netlify)

Tento repozitář obsahuje dvě varianty stejného Glide MCP serveru:

| Varianta | Soubor | K čemu |
|---|---|---|
| **Lokální (stdio)** | `tools/glide-mcp/index.js` | běh uvnitř vývojového prostředí (Claude Code) |
| **Remote (HTTP)** | `netlify/functions/mcp.mjs` | veřejný `https://…/mcp` endpoint → custom connector v appce Claude |

Obě umí stejné 4 nástroje nad tabulkou Users1: `users1_get`, `users1_add`, `users1_edit`, `users1_delete`.

## Nasazení na Netlify

1. **Propoj repo s Netlify** → New site → import z GitHubu (větev s těmito soubory).
2. Build nastavení se vezmou z `netlify.toml` (žádný build, publish `public/`, funkce v `netlify/functions`).
3. **Nastav environment proměnné** (Site settings → Environment variables):
   - `GLIDE_TOKEN` – tvůj Glide API token
   - `GLIDE_APP` – `SSTBPKEkmJdwAT3Q1eQg`
   - `MCP_SECRET` – dlouhý náhodný klíč (vygeneruj např. `openssl rand -hex 24`)
4. Deploy. Endpoint pak bude:

   ```
   https://<nazev-site>.netlify.app/mcp?key=<MCP_SECRET>
   ```

## Přidání do Claude (custom connector)

Na **claude.ai v prohlížeči na PC** → Settings → Connectors → **Add custom connector**:

- **Name:** `PLANiX Glide`
- **Remote MCP server URL:** `https://<nazev-site>.netlify.app/mcp?key=<MCP_SECRET>`
- OAuth pole nech prázdná.

Po uložení se konektor objeví i v mobilní appce Claude, kde ho zaškrtneš.

## Bezpečnost

- Endpoint umí i **mazat** data — proto je chráněný `MCP_SECRET` v URL. Drž tu URL v tajnosti.
- Token Glide nikdy neposílej v URL; je jen jako env proměnná na serveru.
- Klíč jde kdykoliv „zneplatnit" změnou `MCP_SECRET` na Netlify (a aktualizací URL v konektoru).
