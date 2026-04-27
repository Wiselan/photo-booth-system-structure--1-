/* ================================================
   PopSnap! — routes.js
   Semua API endpoint
   ================================================ */

const express  = require('express');
const router   = express.Router();
const { createTransaction, verifyTransaction, handleNotification } = require('./payment');
const { sendStripEmail } = require('./email');

// ── Rate limiter sederhana (in-memory) ───────────
const rateLimitMap = new Map();

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 menit
  const maxRequests = 10;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter(t => now - t < windowMs);
  requests.push(now);
  rateLimitMap.set(ip, requests);

  if (requests.length > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak request. Coba lagi dalam 1 menit.'
    });
  }

  next();
}

// ── Validasi email sederhana ─────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ════════════════════════════════════════════════
//  POST /api/create-payment
//  Buat transaksi Midtrans → return snap token
// ════════════════════════════════════════════════
router.post('/create-payment', rateLimit, async (req, res) => {
  try {
    const { name, email, amount, orderId } = req.body;

    // Validasi
    if (!name || !email || !amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'name, email, amount, dan orderId wajib diisi'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    if (amount !== 20000) {
      return res.status(400).json({
        success: false,
        message: 'Jumlah pembayaran tidak valid'
      });
    }

    console.log(`💳 Creating payment: ${orderId} for ${email}`);

    const result = await createTransaction({
      orderId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      amount
    });

    res.json({
      success: true,
      token: result.token,
      redirectUrl: result.redirectUrl,
      orderId
    });

  } catch (err) {
    console.error('❌ /create-payment error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal membuat transaksi'
    });
  }
});

// ════════════════════════════════════════════════
//  POST /api/send-email
//  Kirim strip foto ke email user setelah bayar
// ════════════════════════════════════════════════
router.post('/send-email', rateLimit, async (req, res) => {
  try {
    const { name, email, orderId, imageData, frame } = req.body;

    // Validasi
    if (!email || !orderId || !imageData) {
      return res.status(400).json({
        success: false,
        message: 'email, orderId, dan imageData wajib diisi'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format email tidak valid'
      });
    }

    if (!imageData.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Format imageData tidak valid (harus base64 image)'
      });
    }

    // Optional: verifikasi pembayaran dulu
    // Bisa dikembangkan dengan menyimpan orderId yang sudah bayar di DB
    // Untuk sekarang, percaya frontend
    console.log(`📧 Sending email to ${email} for order ${orderId}`);

    const result = await sendStripEmail({
      to: email.trim().toLowerCase(),
      name: name?.trim() || 'Kamu',
      orderId,
      imageData,
      frame: frame || 'retro-pop'
    });

    res.json({
      success: true,
      message: 'Email berhasil dikirim!',
      messageId: result.messageId
    });

  } catch (err) {
    console.error('❌ /send-email error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Gagal mengirim email'
    });
  }
});

// ════════════════════════════════════════════════
//  POST /api/verify-payment
//  Verifikasi status pembayaran (opsional / manual check)
// ════════════════════════════════════════════════
router.post('/verify-payment', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId wajib diisi'
      });
    }

    const result = await verifyTransaction(orderId);

    res.json({
      success: true,
      ...result
    });

  } catch (err) {
    console.error('❌ /verify-payment error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// ════════════════════════════════════════════════
//  POST /api/midtrans-webhook
//  Midtrans payment notification webhook
// ════════════════════════════════════════════════
router.post('/midtrans-webhook', async (req, res) => {
  try {
    const notification = req.body;
    console.log('🔔 Midtrans webhook received:', notification.order_id);

    const result = await handleNotification(notification);

    // Jika bayar sukses, bisa trigger email di sini juga
    if (result.isPaid) {
      console.log(`✅ Payment confirmed via webhook: ${result.orderId}`);
      // TODO: Ambil data email dari DB berdasarkan orderId
      // dan kirim email strip
    }

    res.status(200).json({ status: 'ok' });

  } catch (err) {
    console.error('❌ /midtrans-webhook error:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Health check ─────────────────────────────────
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      midtrans: !!process.env.MIDTRANS_SERVER_KEY ? 'configured' : 'missing key',
      gmail: !!process.env.GMAIL_USER ? 'configured' : 'missing credentials'
    }
  });
});

module.exports = router;
router.get('/debug-keys', (req, res) => {
  res.json({
    midtrans_server: process.env.MIDTRANS_SERVER_KEY?.substring(0, 20) + '...',
    midtrans_client: process.env.MIDTRANS_CLIENT_KEY?.substring(0, 20) + '...',
    gmail: process.env.GMAIL_USER
  });
});