const { Pool } = require('pg');

// Initialize Neon PostgreSQL Connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.PGCONNECTION,
  ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
  // Set CORS and JSON Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify database connection string exists
    if (!process.env.DATABASE_URL && !process.env.PGCONNECTION) {
      return res.status(500).json({
        error: "Missing DATABASE_URL environment variable in Vercel settings."
      });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    // Query daily aggregate summary from orders/bills table
    // Adjust table and column names if your database schema uses different names
    const query = `
      SELECT 
        COUNT(*)::INT AS total_orders,
        COALESCE(SUM(total_amount), 0)::NUMERIC AS total_revenue,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'cash' THEN total_amount ELSE 0 END), 0)::NUMERIC AS cash_sales,
        COALESCE(SUM(CASE WHEN LOWER(payment_method) = 'card' THEN total_amount ELSE 0 END), 0)::NUMERIC AS card_sales
      FROM orders
      WHERE DATE(created_at) = $1;
    `;

    const { rows } = await pool.query(query, [todayStr]);
    const summary = rows[0] || { total_orders: 0, total_revenue: 0, cash_sales: 0, card_sales: 0 };

    return res.status(200).json({
      success: true,
      date: todayStr,
      summary: {
        totalOrders: summary.total_orders,
        totalRevenue: parseFloat(summary.total_revenue),
        cashSales: parseFloat(summary.cash_sales),
        cardSales: parseFloat(summary.card_sales)
      }
    });

  } catch (error) {
    console.error("Error executing day-summary query:", error);
    return res.status(500).json({
      error: "Failed to fetch day summary",
      details: error.message
    });
  }
};
