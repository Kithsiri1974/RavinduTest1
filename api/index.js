const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// Serve static assets from public folder
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Route root requests directly to index.html inside public
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Fallback for subpaths
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

module.exports = app;
