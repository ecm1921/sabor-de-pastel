// Roda as migrations e os testes SQL num PostgreSQL local (PGlite).
// Uso: npm run test:db            (todos)
//      npm run test:db -- 02      (só os arquivos cujo nome contém "02")
import { PGlite } from "@electric-sql/pglite";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const filtro = process.argv[2] ?? "";
const db = new PGlite();
const rodar = (arquivo) => db.exec(readFileSync(arquivo, "utf8"));

await rodar("supabase/tests/_local/shim.sql");
for (const f of readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql")).sort()) {
  await rodar(`supabase/migrations/${f}`);
}
if (existsSync("supabase/seed.sql")) await rodar("supabase/seed.sql");

let falhas = 0;
const testes = readdirSync("supabase/tests").filter((f) => f.endsWith(".sql") && f.includes(filtro)).sort();
for (const f of testes) {
  try {
    await rodar(`supabase/tests/${f}`);
    console.log(`ok    ${f}`);
  } catch (e) {
    falhas++;
    console.log(`FALHA ${f}: ${e.message}`);
    try {
      await db.exec("rollback");
    } catch {
      // nada a desfazer
    }
  }
}
console.log(falhas ? `${falhas} de ${testes.length} arquivo(s) falharam` : `${testes.length} arquivo(s) ok`);
process.exit(falhas ? 1 : 0);
