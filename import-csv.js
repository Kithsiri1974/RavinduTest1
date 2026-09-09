const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const readline = require('readline');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const DATABASE_URL = 'postgresql://neondb_owner:npg_GaeXmTBuw2v3@ep-square-queen-aeogdrnx-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CSV_FILE_PATH = path.join(__dirname, 'stockmast.csv');

async function parseCustomFile() {
  const fileStream = fs.createReadStream(CSV_FILE_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const rowsMap = new Map();

  for await (const line of rl) {
    const trimmed = line.trim();
    // Skip empty lines or separator borders
    if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('===')) continue;

    // Split line by comma instead of pipe (|)
    const parts = line.split(',').map(p => p.trim());
    if (parts.length < 5) continue;

    // Mapping columns from stockmast.csv format:
    // Index 0: Item Code (e.g., '010')
    // Index 1: Item Size
    // Index 2: Item Category
    // Index 3: Description / Title (e.g., 'Rice')
    // Index 4: Sub-description / Category Detail (e.g., 'Vegetable R/C')
    // Index 6: Stock In Hand (e.g., -129)
    // Index 7: Unit / Type (e.g., 'Kic')
    // Index 9: Selling Price (e.g., 300)
    const itCode = parts[0] || '';
    const itemSize = parts[1] || '';

    // Skip header rows or entries missing an item code
    if (itCode.toLowerCase() === 'it_code' || !itCode) continue;

    const itemCat = (parts[2] || parts[4] || '').substring(0, 35);
    const itDesc = (parts[3] || '').substring(0, 60);
    const stockInHnd = parseFloat(parts[6]) || 0;
    const itUnit = (parts[7] || '').substring(0, 3);
    const itemType = (parts[7] || '').substring(0, 3);
    const itUprisePur = parseFloat(parts[8]) || 0;
    const itUpriseSal = parseFloat(parts[9]) || 0;

    // Deduplicate by composite key (code + size)
    const compositeKey = `${itCode}_${itemSize}`;
    rowsMap.set(compositeKey, {
      itCode,
      itemSize,
      itemCat,
      itDesc,
      itUnit,
      stockInHnd,
      itemType,
      itUprisePur,
      itUpriseSal
    });
  }

  return Array.from(rowsMap.values());
}

async function batchInsert(client, rows) {
  if (rows.length === 0) return;

  const valueTuples = [];
  const params = [];
  const COLS_PER_ROW = 9;

  rows.forEach((row, i) => {
    const offset = i * COLS_PER_ROW;
    const placeholders = Array.from({ length: COLS_PER_ROW }, (_, k) => `$${offset + k + 1}`).join(', ');
    valueTuples.push(`(${placeholders})`);

    params.push(
      row.itCode,
      row.itemSize,
      row.itemCat,
      row.itDesc,
      row.itUnit,
      row.stockInHnd,
      row.itemType,
      row.itUprisePur,
      row.itUpriseSal
    );
  });

  const query = `
    INSERT INTO stock_mast (
      it_code, 
      item_size, 
      item_cat, 
      it_desc, 
      it_unit, 
      stock_in_hnd, 
      item_type, 
      it_uprise_pur, 
      it_uprise_sal
    )
    VALUES ${valueTuples.join(', ')}
    ON CONFLICT (it_code, item_size) DO UPDATE SET
      item_cat = EXCLUDED.item_cat,
      it_desc = EXCLUDED.it_desc,
      it_unit = EXCLUDED.it_unit,
      stock_in_hnd = EXCLUDED.stock_in_hnd,
      item_type = EXCLUDED.item_type,
      it_uprise_pur = EXCLUDED.it_uprise_pur,
      it_uprise_sal = EXCLUDED.it_uprise_sal;
  `;

  await client.query(query, params);
}

async function startImport() {
  console.log('Parsing file lines...');
  const rows = await parseCustomFile();
  console.log(`Extracted ${rows.length} valid item rows. Uploading to Neon...`);

  let client;
  try {
    client = await pool.connect();
    const CHUNK_SIZE = 200;
    let totalInserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      await batchInsert(client, chunk);
      totalInserted += chunk.length;
      console.log(`Uploaded ${totalInserted} / ${rows.length} items...`);
    }

    console.log(`\n SUCCESS! Fully imported ${totalInserted} rows into stock_mast table.`);
  } catch (err) {
    console.error('\n Import Failed Error details:', err.message || err);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

startImport();