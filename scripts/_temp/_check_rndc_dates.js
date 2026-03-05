const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  // Find a remesa that HAS respuestaRndcJson to see what fields RNDC returns
  const withJson = await p.$queryRawUnsafe(`
    SELECT "numeroRemesa", "numeroRemesaRndc", "respuestaRndcJson"
    FROM remesas
    WHERE "respuestaRndcJson" IS NOT NULL
    LIMIT 3
  `);
  if (withJson.length > 0) {
    console.log('=== Sample RNDC responses ===');
    for (const r of withJson) {
      console.log(`\nRemesa ${r.numeroRemesa} (RNDC: ${r.numeroRemesaRndc}):`);
      console.log(JSON.stringify(r.respuestaRndcJson, null, 2));
    }
  } else {
    console.log('No remesas have respuestaRndcJson populated.');
  }
  
  // Check how many remesas have that field
  const counts = await p.$queryRawUnsafe(`
    SELECT 
      COUNT(*) AS total,
      COUNT("respuestaRndcJson") AS with_json,
      COUNT("numeroRemesaRndc") AS with_rndc_num
    FROM remesas
  `);
  console.log('\n=== Counts ===');
  console.table(counts.map(c => ({
    total: Number(c.total),
    withRndcJson: Number(c.with_json),
    withRndcNum: Number(c.with_rndc_num)
  })));
  
  await p.$disconnect();
})();
