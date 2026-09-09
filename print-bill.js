const postgres = require("postgres");

let sql;
function getDb() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is missing.");
    }
    sql = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      connect_timeout: 10,
      max: 10
    });
  }
  return sql;
}

async function generateReqNo(db) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const datePrefix = `${yy}${mm}${dd}`;

  try {
    const seqResult = await db`SELECT nextval('ord_req_seq') AS seq`;
    const num = parseInt(seqResult[0].seq, 10);
    const formattedNum = String(((num - 1) % 9999) + 1).padStart(4, '0');
    return `${datePrefix}${formattedNum}`;
  } catch (err) {
    try {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const countResult = await db`
        SELECT COUNT(*) AS total FROM ord_req WHERE req_date >= ${startOfDay}
      `;
      const nextNum = parseInt(countResult[0].total, 10) + 1;
      return `${datePrefix}${String(nextNum).padStart(4, '0')}`;
    } catch (fallbackErr) {
      const random4 = String(Math.floor(1000 + Math.random() * 9000));
      return `${datePrefix}${random4}`;
    }
  }
}

module.exports = async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDb();
    const { reqNo, paymentMethod, phoneNo, items, tableNo, userName, remarks, reachTime } = req.body || {};

    const now = new Date();
    let effectiveReqNo = reqNo || (await generateReqNo(db));

    const orderItems = (items && Array.isArray(items) && items.length > 0)
      ? items
      : [{ name: "General Item", it_code: "ORD1", size: "STD", qty: 1 }];

    for (const item of orderItems) {
      const safeReqNo = String(effectiveReqNo).substring(0, 50);
      const safeTableNo = String(tableNo || "01").substring(0, 20);
      
      const rawCode = String(item.it_code || item.itemId || item.id || "0000");
      const safeItCode = rawCode.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4) || "0000";
      
      const safeSize = String(item.size || item.sizeCode || "STD").substring(0, 3);
      const safeQty = parseFloat(item.qty) || 1.00;
      const safeDesc = String(item.name || item.it_desc || "Item").substring(0, 50);
      const safePhone = String(phoneNo || "").replace(/\D/g, '').substring(0, 11);
      const safePayMethod = String(paymentMethod || "CASH").substring(0, 30);
      const safeUser = String(userName || "POS").substring(0, 30);
      const safeUnit = String(item.unit || "PCS").substring(0, 50);
      const safeReachTime = String(reachTime || "").substring(0, 50);

      await db`
        INSERT INTO ord_req (
          req_no, req_date, req_date1, table_no, it_code, item_size,
          qty, it_desc, req_ok, user_name, teleno, it_unit, remarks,
          reach_time, pay_method
        )
        VALUES (
          ${safeReqNo}, ${now}, ${now}, ${safeTableNo}, ${safeItCode}, ${safeSize},
          ${safeQty}, ${safeDesc}, ${true}, ${safeUser}, ${safePhone}, ${safeUnit},
          ${remarks || ""}, ${safeReachTime}, ${safePayMethod}
        )
      `;
    }

    return res.status(200).json({ 
      success: true, 
      reqNo: effectiveReqNo, 
      message: "Successfully saved into ord_req!" 
    });

  } catch (error) {
    console.error("Vercel Serverless Print Bill Error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to insert into ord_req", 
      details: error.message 
    });
  }
};