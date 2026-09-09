// Robust Day Summary Fetcher
async function loadDirectDaySummary() {
  try {
    const res = await fetch('/api/day-summary');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("Day Summary API Response:", data);

    // Handle direct object or nested summary payloads
    const summary = data.summary || data.data || data;

    const dateEl = document.getElementById('ds-date');
    const ordersEl = document.getElementById('ds-total-orders');
    const revenueEl = document.getElementById('ds-total-revenue');
    const cashEl = document.getElementById('ds-cash-sales');
    const cardEl = document.getElementById('ds-card-sales');

    // Flexible extraction across common backend property names
    const totalOrders = summary.totalOrders ?? summary.total_orders ?? summary.ordersCount ?? summary.orders ?? summary.count ?? 0;
    const totalRevenue = summary.totalRevenue ?? summary.revenue ?? summary.total_revenue ?? summary.total ?? 0;
    const cashSales = summary.cashSales ?? summary.cash_sales ?? summary.cash ?? 0;
    const cardSales = summary.cardSales ?? summary.card_sales ?? summary.card ?? 0;

    if (dateEl) dateEl.innerText = data.date || summary.date || new Date().toLocaleDateString();
    if (ordersEl) ordersEl.innerText = totalOrders;
    if (revenueEl) revenueEl.innerText = `Rs. ${Number(totalRevenue).toFixed(2)}`;
    if (cashEl) cashEl.innerText = `Rs. ${Number(cashSales).toFixed(2)}`;
    if (cardEl) cardEl.innerText = `Rs. ${Number(cardSales).toFixed(2)}`;

  } catch (err) {
    console.error("Failed to load Today Summary in drawer:", err);
  }
}