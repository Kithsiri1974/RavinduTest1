<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Day Item Summary</title>
  <link rel="stylesheet" href="style.css">
  <style>
    body {
      background-color: #0f111a;
      color: #fff;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #222;
      padding-bottom: 10px;
    }
    .back-btn {
      text-decoration: none;
      color: #00ff88;
      font-weight: bold;
      border: 1px solid #00ff88;
      padding: 6px 12px;
      border-radius: 4px;
      transition: background 0.2s;
    }
    .back-btn:hover {
      background: rgba(0, 255, 136, 0.1);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: #161b22;
      border-radius: 8px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #21262d;
    }
    th {
      background-color: #21262d;
      color: #00ff88;
      font-weight: 600;
    }
    tr:hover {
      background-color: #1f242c;
    }
    .status-msg {
      text-align: center;
      padding: 20px;
      color: #888;
    }
  </style>
</head>
<body>

  <div class="header-bar">
    <h2>📊 Day Item-wise Summary</h2>
    <a href="index.html" class="back-btn">← Back to Dashboard</a>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Item Code</th>
          <th>Description</th>
          <th>Size</th>
          <th>Total Qty Sold</th>
          <th>Unit Price (Rs.)</th>
          <th>Total Sales (Rs.)</th>
        </tr>
      </thead>
      <tbody id="summary-table-body">
        <tr>
          <td colspan="6" class="status-msg">Loading summary data...</td>
        </tr>
      </tbody>
    </table>
  </div>

  <script>
    async function loadDayItemSummary() {
      try {
        const response = await fetch('/api/day-item-summary');
        const data = await response.json();
        
        const tbody = document.getElementById('summary-table-body');
        tbody.innerHTML = '';

        if (!data.success || !data.items || data.items.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" class="status-msg">No sales recorded for today yet.</td></tr>`;
          return;
        }

        data.items.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${item.it_code || '-'}</td>
            <td>${item.it_desc || 'Unknown Item'}</td>
            <td>${item.item_size || 'STD'}</td>
            <td><strong>${item.total_qty}</strong></td>
            <td>Rs. ${parseFloat(item.unit_price).toFixed(2)}</td>
            <td style="color: #00ff88; font-weight: bold;">Rs. ${parseFloat(item.total_sales).toFixed(2)}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (error) {
        console.error('Error fetching item summary:', error);
        document.getElementById('summary-table-body').innerHTML = `<tr><td colspan="6" class="status-msg" style="color: #ff4d4d;">Failed to load item summary data.</td></tr>`;
      }
    }

    loadDayItemSummary();
  </script>
</body>
</html>