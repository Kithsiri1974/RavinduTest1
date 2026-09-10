const tabs = document.querySelectorAll('.top-tab');
const subCatContainer = document.getElementById('sub-cat-container');
const gridContainer = document.getElementById('grid-container');
const dashboardContainer = document.getElementById('dashboard-container');
const toggleBillBtn = document.getElementById('toggle-bill-btn');
const billPanel = document.getElementById('bill-panel');
const todaySpecialTrack = document.getElementById('today-special-track');

// Left Drawer Panel Elements
const toggleLeftDrawerBtn = document.getElementById('toggle-left-drawer-btn');
const leftDrawerPanel = document.getElementById('left-drawer-panel');

let selectedPaymentMethod = 'cash';
let isAlreadyEntered = true;
let allCurrentData = [];
let cart = {};

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80';

// Right Bill Panel Toggle
if (toggleBillBtn && billPanel) {
  toggleBillBtn.addEventListener('click', () => {
    billPanel.classList.toggle('active');
    toggleBillBtn.classList.toggle('active');
  });
}

// Left Drawer Panel Toggle with Automatic Day Summary Loading
if (toggleLeftDrawerBtn && leftDrawerPanel) {
  toggleLeftDrawerBtn.addEventListener('click', () => {
    leftDrawerPanel.classList.toggle('open');
    leftDrawerPanel.classList.toggle('active');
    toggleLeftDrawerBtn.classList.toggle('open');
    toggleLeftDrawerBtn.classList.toggle('active');

    // Load live Day Summary data when the drawer opens
    if (leftDrawerPanel.classList.contains('open') || leftDrawerPanel.classList.contains('active')) {
      loadDirectDaySummary();
    }
  });
}

// Robust Day Summary Fetcher
async function loadDirectDaySummary() {
  try {
    const res = await fetch('/api/day-summary');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    console.log("Day Summary API Response:", data);

    const summary = data.summary || data.data || data;

    const dateEl = document.getElementById('ds-date');
    const ordersEl = document.getElementById('ds-total-orders');
    const revenueEl = document.getElementById('ds-total-revenue');
    const cashEl = document.getElementById('ds-cash-sales');
    const cardEl = document.getElementById('ds-card-sales');

    const totalOrders = summary.totalOrders ?? summary.totalEvents ?? summary.completedTasks ?? summary.total_orders ?? summary.count ?? 0;
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

function selectPayment(method) {
  selectedPaymentMethod = method;
  const cashBtn = document.getElementById('pay-cash-btn');
  const cardBtn = document.getElementById('pay-card-btn');
  if (cashBtn) cashBtn.classList.toggle('active', method === 'cash');
  if (cardBtn) cardBtn.classList.toggle('active', method === 'card');
}

function setEnteredStatus(entered) {
  isAlreadyEntered = entered;

  const yesBtn = document.getElementById('entered-yes-btn');
  const noBtn = document.getElementById('entered-no-btn');
  if (yesBtn) yesBtn.classList.toggle('active', entered);
  if (noBtn) noBtn.classList.toggle('active', !entered);

  const tableBox = document.getElementById('table-box');
  const reachTimeBox = document.getElementById('reach-time-box');

  if (entered) {
    if (tableBox) tableBox.style.display = 'flex';
    if (reachTimeBox) reachTimeBox.style.display = 'none';
    const reachInput = document.getElementById('reach-time-input');
    if (reachInput) reachInput.value = '';
  } else {
    if (tableBox) tableBox.style.display = 'none';
    if (reachTimeBox) reachTimeBox.style.display = 'flex';
    const tableInput = document.getElementById('table-no-input');
    if (tableInput) tableInput.value = '';
  }
}

function formatPhoneNumber(input) {
  let digits = input.value.replace(/\D/g, '');
  if (digits.length > 10) digits = digits.substring(0, 10);

  if (digits.length > 3) {
    input.value = `${digits.substring(0, 3)} ${digits.substring(3)}`;
  } else {
    input.value = digits;
  }
}

function getValidPrice(item) {
  if (item.price !== undefined && item.price !== null && parseFloat(item.price) > 0) {
    return parseFloat(item.price);
  }
  if (item.price_std !== undefined && item.price_std !== null && parseFloat(item.price_std) > 0) {
    return parseFloat(item.price_std);
  }
  if (item.item_price !== undefined && item.item_price !== null && parseFloat(item.item_price) > 0) {
    return parseFloat(item.item_price);
  }
  if (item.variations && item.variations.length > 0) {
    const firstVarPrice = parseFloat(item.variations[0].price || item.variations[0].price_std || 0);
    if (firstVarPrice > 0) return firstVarPrice;
  }
  return 0;
}

// Fetch Today Special & Setup Infinite Marquee Track
async function loadTodaySpecial() {
  try {
    const res = await fetch(`/api/stock-mast?td_special=yes`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    const specials = data || [];

    if (!todaySpecialTrack) return;

    if (specials.length === 0) {
      todaySpecialTrack.innerHTML = '<div class="status-msg" style="font-size:11px; padding-left:15px;">No specials available</div>';
      return;
    }

    const buildItemHTML = (item) => {
      const rawPrice = getValidPrice(item);
      const priceDisplay = rawPrice.toFixed(2);
      const safeName = item.item_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const itemType = item.item_type || '';
      const itemCat = (item.item_cat || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const imgSrc = item.pic_link && item.pic_link.trim() !== '' ? item.pic_link : DEFAULT_IMAGE;

      return `
        <div class="special-item-card" 
             style="cursor: pointer;"
             onclick="selectSpecialItem('${safeName}', '${itemType}', '${itemCat}')">
          <img class="special-img" src="${imgSrc}" 
               alt="${item.item_name}" 
               onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'" />
          <div class="special-info">
            <span class="special-name" title="${item.item_name}">${item.item_name}</span>
            <span class="special-price">Rs. ${priceDisplay}</span>
          </div>
        </div>
      `;
    };

    const listHTML = specials.map(buildItemHTML).join('');
    todaySpecialTrack.innerHTML = listHTML + listHTML;

    const totalItems = specials.length * 2;
    const speedInSeconds = Math.max(15, totalItems * 3);
    todaySpecialTrack.style.animationDuration = `${speedInSeconds}s`;

  } catch (err) {
    console.error("Today Special Fetch Error:", err);
    if (todaySpecialTrack) {
      todaySpecialTrack.innerHTML = '<div class="status-msg" style="font-size:11px; padding-left:15px;">Failed to load specials.</div>';
    }
  }
}

// Auto Search, Filter & Highlight Selected Special Item
async function selectSpecialItem(itemName, itemType, itemCat) {
  if (!itemName) return;

  const currentActiveTab = document.querySelector('.top-tab.active');
  const currentType = currentActiveTab ? currentActiveTab.getAttribute('data-type') : null;
  const targetTab = Array.from(tabs).find(t => t.getAttribute('data-type') === itemType);

  if (targetTab && currentType !== itemType) {
    tabs.forEach(t => t.classList.remove('active'));
    targetTab.classList.add('active');

    const glow = targetTab.getAttribute('data-glow');
    const border = targetTab.getAttribute('data-border');

    await loadCategoryData(itemType, glow, border);
  }

  if (itemCat && subCatContainer) {
    const subCatTabs = subCatContainer.querySelectorAll('.sub-cat-item');
    let matchedSubTab = null;

    subCatTabs.forEach(sub => {
      if (sub.innerText.trim().toLowerCase() === itemCat.trim().toLowerCase()) {
        matchedSubTab = sub;
      }
    });

    if (matchedSubTab) {
      filterBySubCat(itemCat, matchedSubTab);
    }
  }

  setTimeout(() => {
    if (!gridContainer) return;

    const cards = gridContainer.querySelectorAll('.category-card');
    let targetCard = null;

    cards.forEach(card => {
      const nameEl = card.querySelector('.category-name');
      if (nameEl && nameEl.innerText.trim().toLowerCase() === itemName.trim().toLowerCase()) {
        targetCard = card;
      }
    });

    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

      targetCard.style.transition = 'all 0.3s ease-in-out';
      targetCard.style.borderColor = '#00ff88';
      targetCard.style.boxShadow = '0 0 30px #00ff88, inset 0 0 15px rgba(0, 255, 136, 0.4)';
      targetCard.style.transform = 'scale(1.05)';

      setTimeout(() => {
        targetCard.style.borderColor = '';
        targetCard.style.boxShadow = '';
        targetCard.style.transform = '';
      }, 2500);
    }
  }, 150);
}

async function loadCategoryData(type, glowColor, borderColor) {
  try {
    if (dashboardContainer) {
      if (glowColor) dashboardContainer.style.boxShadow = `0 0 30px ${glowColor}`;
      if (borderColor) dashboardContainer.style.borderColor = borderColor;
    }

    if (subCatContainer) subCatContainer.innerHTML = '<div class="status-msg">Loading...</div>';
    if (gridContainer) gridContainer.innerHTML = '<div class="status-msg">Loading...</div>';

    const url = type ? `/api/stock-mast?item_type=${encodeURIComponent(type)}` : '/api/stock-mast';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data = await res.json();
    allCurrentData = data;

    if (!data || data.length === 0) {
      if (subCatContainer) subCatContainer.innerHTML = '<div class="status-msg">No categories</div>';
      if (gridContainer) gridContainer.innerHTML = '<div class="status-msg">No items found.</div>';
      return;
    }

    const categories = [...new Set(data.map(item => item.item_cat))].filter(Boolean);

    if (subCatContainer) {
      subCatContainer.innerHTML = categories.map((cat, idx) => `
        <div class="sub-cat-item ${idx === 0 ? 'active' : ''}" onclick="filterBySubCat('${cat.replace(/'/g, "\\'")}', this)">
          ${cat}
        </div>
      `).join('');
    }

    if (categories.length > 0 && subCatContainer) {
      filterBySubCat(categories[0], subCatContainer.querySelector('.sub-cat-item'));
    } else {
      renderCards(data);
    }

  } catch (err) {
    console.error("Fetch Error:", err);
    if (subCatContainer) subCatContainer.innerHTML = '<div class="status-msg">Error</div>';
    if (gridContainer) gridContainer.innerHTML = `<div class="status-msg">Failed to load data.</div>`;
  }
}

function filterBySubCat(category, element) {
  document.querySelectorAll('.sub-cat-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');

  const filtered = allCurrentData.filter(item => item.item_cat === category);
  renderCards(filtered);
}

function changeQty(itemName, sizeStr, priceVal, delta, itCode) {
  const cartKey = `${itemName}_${sizeStr}`;
  const inputEl = document.getElementById(`qty-${cartKey}`);
  const rowEl = document.getElementById(`row-${cartKey}`);

  let currentQty = inputEl ? parseInt(inputEl.value) || 0 : 0;
  currentQty += delta;
  if (currentQty < 0) currentQty = 0;

  if (inputEl) inputEl.value = currentQty;

  if (currentQty > 0) {
    cart[cartKey] = { name: itemName, size: sizeStr, price: priceVal, qty: currentQty, it_code: itCode || itemName };
    if (rowEl) rowEl.classList.add('has-qty');
  } else {
    delete cart[cartKey];
    if (rowEl) rowEl.classList.remove('has-qty');
  }

  updateBillDrawer();
}

async function placeOrder() {
  const keys = Object.keys(cart);
  if (keys.length === 0) {
    alert("Please add at least one item to place an order.");
    return;
  }

  const rawPhoneNo = document.getElementById('phone-no-input')?.value.replace(/\s+/g, '').trim() || '';
  const reachTime = document.getElementById('reach-time-input')?.value || '';
  const inputTableNo = document.getElementById('table-no-input')?.value.trim();
  const tableNo = inputTableNo || "01";

  if (!isAlreadyEntered) {
    if (!rawPhoneNo || !reachTime) {
      alert("Enter Tel No & Reach Time");
      return;
    }
  }

  const placeOrderBtn = document.getElementById('btn-place-order');

  const itemsArray = keys.map(key => ({
    name: cart[key].name,
    size: cart[key].size,
    qty: cart[key].qty,
    price: cart[key].price,
    it_code: cart[key].it_code
  }));

  try {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = true;
      placeOrderBtn.innerText = "SAVING...";
    }

    const response = await fetch('/api/place-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        alreadyEntered: isAlreadyEntered,
        tableNo: isAlreadyEntered ? tableNo : null,
        reachTime: !isAlreadyEntered ? reachTime : null,
        phoneNo: rawPhoneNo,
        paymentMethod: selectedPaymentMethod,
        items: itemsArray
      })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert(`Order Saved Successfully!\nReq No: ${result.reqNo}`);

      cart = {};
      updateBillDrawer();
      document.querySelectorAll('.qty-val').forEach(input => input.value = 0);
      document.querySelectorAll('.size-row').forEach(row => row.classList.remove('has-qty'));
      if (document.getElementById('table-no-input')) document.getElementById('table-no-input').value = '';
      if (document.getElementById('reach-time-input')) document.getElementById('reach-time-input').value = '';
      if (document.getElementById('phone-no-input')) document.getElementById('phone-no-input').value = '';

      loadDirectDaySummary();
    } else {
      alert(`Failed to save order: ${result.details || result.error || 'Server Error'}`);
    }
  } catch (err) {
    console.error("Place Order API Error:", err);
    alert("Network Error: Could not reach server.");
  } finally {
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.innerText = "PLACE ORDER";
    }
  }
}

function updateBillDrawer() {
  const container = document.getElementById('bill-items-container');
  const totalValEl = document.getElementById('bill-total-val');

  if (!container || !totalValEl) return;

  const keys = Object.keys(cart);
  if (keys.length === 0) {
    container.innerHTML = '<p style="color:#888; font-size: 10px;">No items selected.</p>';
    totalValEl.innerText = '0.00';
    return;
  }

  let grandTotal = 0;
  let html = '';

  keys.forEach(key => {
    const item = cart[key];
    const itemTotal = item.price * item.qty;
    grandTotal += itemTotal;

    html += `
      <div class="bill-item-row">
        <div class="bill-item-info">
          <div class="bill-item-name" title="${item.name}">${item.name}</div>
          <div class="bill-item-size">(${item.size})</div>
        </div>
        <div class="bill-qty-badge">${item.qty}</div>
        <div class="bill-item-price">${itemTotal.toFixed(2)}</div>
      </div>
    `;
  });

  container.innerHTML = html;
  totalValEl.innerText = grandTotal.toFixed(2);
}

function renderCards(items) {
  if (!gridContainer) return;

  if (!items || items.length === 0) {
    gridContainer.innerHTML = '<div class="status-msg">No items available.</div>';
    return;
  }

  gridContainer.innerHTML = items.map(item => {
    const fallbackPrice = getValidPrice(item);

    const variations = item.variations || [
      { item_size: 'L', price: fallbackPrice },
      { item_size: 'M', price: fallbackPrice },
      { item_size: 'S', price: fallbackPrice },
      { item_size: 'XS', price: fallbackPrice }
    ];

    const overlayHtml = variations.map(v => {
      const sizeStr = v.item_size || 'STD';
      const priceVal = parseFloat(v.price || fallbackPrice);
      const safeName = item.item_name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeCode = (v.it_code || item.item_name).replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const cartKey = `${item.item_name}_${sizeStr}`;
      const currentVal = cart[cartKey] ? cart[cartKey].qty : 0;
      const hasQtyClass = currentVal > 0 ? 'has-qty' : '';

      return `
        <div class="size-row ${hasQtyClass}" id="row-${cartKey}">
          <span class="size-code">${sizeStr}</span>
          <div class="size-price-badge">
            <span class="price-tag">${priceVal.toFixed(2)}</span>
          </div>
          <div class="qty-stepper">
            <button class="qty-btn" onclick="changeQty('${safeName}', '${sizeStr}', ${priceVal}, -1, '${safeCode}')">-</button>
            <input type="number" id="qty-${cartKey}" class="qty-val" value="${currentVal}" readonly />
            <button class="qty-btn" onclick="changeQty('${safeName}', '${sizeStr}', ${priceVal}, 1, '${safeCode}')">+</button>
          </div>
        </div>
      `;
    }).join('');

    const imgSrc = item.pic_link && item.pic_link.trim() !== '' ? item.pic_link : DEFAULT_IMAGE;

    return `
      <div class="category-card">
        <div class="image-wrapper">
          <div class="size-overlay">${overlayHtml}</div>
          <img src="${imgSrc}" 
               alt="${item.item_name}" 
               onerror="this.onerror=null; this.src='${DEFAULT_IMAGE}'" />
        </div>
        <div class="category-name">${item.item_name}</div>
      </div>
    `;
  }).join('');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const itemType = tab.getAttribute('data-type');
    const glow = tab.getAttribute('data-glow');
    const border = tab.getAttribute('data-border');
    loadCategoryData(itemType, glow, border);
  });
});

// Initial Load Setup
document.addEventListener('DOMContentLoaded', () => {
  loadTodaySpecial();
  loadDirectDaySummary();

  const activeTab = document.querySelector('.top-tab.active') || tabs[0];
  if (activeTab) {
    activeTab.classList.add('active');
    const itemType = activeTab.getAttribute('data-type');
    const glow = activeTab.getAttribute('data-glow');
    const border = activeTab.getAttribute('data-border');
    loadCategoryData(itemType, glow, border);
  }
});