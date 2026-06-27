// Aplica la migration SQL a Supabase via Management API
// Uso: node scripts/apply-migration.mjs <ACCESS_TOKEN>
const accessToken = process.argv[2];
if (!accessToken) { console.error("Uso: node scripts/apply-migration.mjs <ACCESS_TOKEN>"); process.exit(1); }

import("fs").then(async ({ readFileSync }) => {
  const sql = readFileSync("supabase/migrations/20260619_saas_pos_integration.sql", "utf8");
  const projectRef = "beacnoxukkoellhecofm";

  console.log("Aplicando migration a Supabase...");

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });

  const body = await res.text();
  console.log(`Status: ${res.status}`);
  if (!res.ok) console.error("Error:", body);
  else {
    try { console.log(JSON.stringify(JSON.parse(body), null, 2)); }
    catch { console.log(body.slice(0, 500)); }
  }
});
