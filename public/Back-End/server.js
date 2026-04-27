/* ================================================
   PopSnap! — server.js
   Server utama Express.js
   ================================================ */

require('dotenv').config();
console.log("=== DEBUG ENV ===");
console.log("GMAIL_USER:", process.env.GMAIL_USER);
console.log("GMAIL_PASS:", process.env.GMAIL_PASS);
console.log("=================");
const express = require('express');
const cors    = require('cors');
const routes  = require('./routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ───────────────────────────────────
app.use(cors({
  origin: [
    'https://wiselan.github.io',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON — limit 50mb untuk base64 image
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Routes ───────────────────────────────────────
app.use('/api', routes);

// ── Health check ─────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    app: 'PopSnap! Backend',
    version: '1.0.0',
    endpoints: [
      'POST /api/create-payment',
      'POST /api/send-email',
      'POST /api/verify-payment'
    ]
  });
});

// ── Error handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ── Start server ─────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════╗
║       PopSnap! Backend Server        ║
║                                      ║
║  Status  : ✅ Running                ║
║  Port    : ${PORT}                        ║
║  Mode    : ${process.env.NODE_ENV || 'development'}               ║
║  Midtrans: ${process.env.MIDTRANS_ENV || 'sandbox'}                 ║
╚══════════════════════════════════════╝
  `);
});

module.exports = app;

