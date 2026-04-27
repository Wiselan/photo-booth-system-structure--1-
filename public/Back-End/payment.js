/* ================================================
   PopSnap! — payment.js
   Midtrans Sandbox integration
   ================================================ */

const midtransClient = require('midtrans-client');

// ── Init Midtrans Snap ───────────────────────────
const snap = new midtransClient.Snap({
  isProduction: false, // sandbox mode
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// ── Init Midtrans Core API (untuk verify) ────────
const coreApi = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

/**
 * Buat transaksi baru & dapatkan Snap Token
 * @param {Object} params
 * @param {string} params.orderId   - ID order unik
 * @param {string} params.name      - Nama pembeli
 * @param {string} params.email     - Email pembeli
 * @param {number} params.amount    - Jumlah pembayaran (Rp)
 * @returns {Promise<string>} snapToken
 */
async function createTransaction({ orderId, name, email, amount }) {
  const parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: amount
    },
    customer_details: {
      first_name: name,
      email: email
    },
    item_details: [
      {
        id: 'POPSNAP-STRIP',
        price: amount,
        quantity: 1,
        name: 'PopSnap! Foto Strip (4 foto + frame)',
        brand: 'PopSnap',
        category: 'Digital Photo'
      }
    ],
    callbacks: {
      finish: `${process.env.FRONTEND_URL || 'http://localhost:5500'}/Front-End/result.html`
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    console.log(`✅ Transaction created: ${orderId}`);
    return {
      token: transaction.token,
      redirectUrl: transaction.redirect_url
    };
  } catch (err) {
    console.error('❌ Midtrans createTransaction error:', err.message);
    throw new Error('Gagal membuat transaksi: ' + err.message);
  }
}

/**
 * Verifikasi status transaksi dari Midtrans
 * @param {string} orderId
 * @returns {Promise<Object>} status transaksi
 */
async function verifyTransaction(orderId) {
  try {
    const statusResponse = await coreApi.transaction.status(orderId);
    console.log(`📋 Transaction status ${orderId}:`, statusResponse.transaction_status);

    const {
      transaction_status,
      fraud_status,
      payment_type,
      gross_amount
    } = statusResponse;

    // Cek apakah transaksi sukses
    let isPaid = false;

    if (transaction_status === 'capture') {
      isPaid = fraud_status === 'accept';
    } else if (transaction_status === 'settlement') {
      isPaid = true;
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      isPaid = false;
    } else if (transaction_status === 'pending') {
      isPaid = false;
    }

    return {
      isPaid,
      status: transaction_status,
      fraudStatus: fraud_status,
      paymentType: payment_type,
      amount: gross_amount,
      orderId
    };
  } catch (err) {
    console.error('❌ Verify transaction error:', err.message);
    throw new Error('Gagal verifikasi transaksi: ' + err.message);
  }
}

/**
 * Handle Midtrans webhook notification
 * @param {Object} notification - body dari Midtrans webhook
 */
async function handleNotification(notification) {
  try {
    const statusResponse = await coreApi.transaction.notification(notification);
    const {
      order_id,
      transaction_status,
      fraud_status
    } = statusResponse;

    console.log(`🔔 Webhook: ${order_id} → ${transaction_status}`);

    let isPaid = false;
    if (transaction_status === 'capture' && fraud_status === 'accept') isPaid = true;
    if (transaction_status === 'settlement') isPaid = true;

    return { orderId: order_id, isPaid, status: transaction_status };
  } catch (err) {
    console.error('❌ Notification handler error:', err.message);
    throw err;
  }
}

module.exports = {
  createTransaction,
  verifyTransaction,
  handleNotification
};
