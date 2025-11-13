const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos\n');
    
    // Test exact query from API
    const sql = `
      SELECT 
        al.id,
        al.name,
        al.slug,
        al.description,
        al.display_order,
        COUNT(DISTINCT s.id) as subject_count,
        COUNT(DISTINCT qb.id) as test_count
      FROM academic_levels al
      LEFT JOIN subjects s ON al.id = s.level_id
      LEFT JOIN question_banks qb ON s.id = qb.subject_id AND qb.is_active = true
      WHERE al.is_active = true
      GROUP BY al.id, al.name, al.slug, al.description, al.display_order
      ORDER BY al.display_order ASC
    `;
    
    console.log('🔍 Ejecutando query del API...\n');
    const result = await client.query(sql);
    
    console.log(`✅ Query exitosa - ${result.rows.length} filas\n`);
    console.log('📊 Resultados:\n');
    
    result.rows.forEach(row => {
      console.log(`${row.name} (${row.slug})`);
      console.log(`  - ID: ${row.id}`);
      console.log(`  - Asignaturas: ${row.subject_count}`);
      console.log(`  - Tests: ${row.test_count}`);
      console.log(`  - Display Order: ${row.display_order}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nDetalles completos:');
    console.error(error);
  } finally {
    await client.end();
  }
})();
