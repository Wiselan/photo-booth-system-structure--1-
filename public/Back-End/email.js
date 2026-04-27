/* ================================================
   PopSnap! — email.js
   Kirim foto strip via Gmail SMTP (Nodemailer)
   ================================================ */

const nodemailer = require('nodemailer');

// ── Gmail Transporter ────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,   // email pengirim
    pass: process.env.GMAIL_PASS    // Gmail App Password (bukan password biasa!)
  }
});

// Verifikasi koneksi saat startup
transporter.verify((err, success) => {
  if (err) {
    console.error('❌ Gmail SMTP error:', err.message);
    console.log('⚠️  Pastikan GMAIL_USER dan GMAIL_PASS sudah benar di .env');
  } else {
    console.log('✅ Gmail SMTP siap digunakan');
  }
});

/**
 * Kirim email dengan lampiran foto strip
 * @param {Object} params
 * @param {string} params.to        - Email penerima
 * @param {string} params.name      - Nama penerima
 * @param {string} params.orderId   - ID order
 * @param {string} params.imageData - Base64 PNG strip foto
 * @param {string} params.frame     - Nama frame yang dipilih
 */
async function sendStripEmail({ to, name, orderId, imageData, frame }) {
  // Validasi input
  if (!to || !imageData) {
    throw new Error('Email tujuan dan data gambar wajib diisi');
  }

  // Konversi base64 ke Buffer
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
  const imgBuffer  = Buffer.from(base64Data, 'base64');

  const frameNames = {
    'retro-pop':  'Retro Pop 🌈',
    'pastel':     'Pastel 🌸',
    'vintage':    'Vintage 📷',
    'monochrome': 'Monochrome 🖤'
  };

  const frameName = frameNames[frame] || frame || 'Custom';
  const firstName = name ? name.split(' ')[0] : 'Kamu';

  const mailOptions = {
    from: `"PopSnap! 📷" <${process.env.GMAIL_USER}>`,
    to: to,
    subject: `📸 Foto Strip Kamu dari PopSnap! — Order ${orderId}`,
    html: `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>PopSnap! Foto Strip</title>
      </head>
      <body style="margin:0;padding:0;background:#FFF8F0;font-family:'Nunito',Arial,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px 20px;">

          <!-- Header -->
          <div style="text-align:center;margin-bottom:28px;">
            <div style="background:linear-gradient(135deg,#FFB5C8,#FF85A1);border-radius:999px;display:inline-block;padding:12px 28px;">
              <span style="font-size:1.8rem;font-weight:900;color:white;letter-spacing:-0.5px;">
                📷 PopSnap!
              </span>
            </div>
          </div>

          <!-- Card utama -->
          <div style="background:white;border-radius:24px;padding:32px;border:2px solid rgba(255,181,200,0.25);box-shadow:0 8px 32px rgba(180,120,140,0.15);">

            <!-- Greeting -->
            <h1 style="font-size:1.6rem;color:#5C3D2E;margin:0 0 8px;text-align:center;">
              Hei, ${firstName}! 🎉
            </h1>
            <p style="color:#8B6F5E;text-align:center;margin:0 0 24px;font-size:0.95rem;line-height:1.6;">
              Strip foto kamu sudah siap! Simpan dan bagikan ke teman-teman ya ✨
            </p>

            <!-- Strip foto -->
            <div style="text-align:center;margin-bottom:24px;">
              <img src="cid:stripPhoto"
                   alt="Foto Strip PopSnap"
                   style="max-width:280px;width:100%;border-radius:12px;box-shadow:0 8px 24px rgba(180,120,140,0.2);"/>
            </div>

            <!-- Info detail -->
            <div style="background:#FFF8F0;border-radius:16px;padding:16px 20px;margin-bottom:24px;">
              <table style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="padding:8px 0;color:#BFA89C;font-size:0.82rem;font-weight:700;border-bottom:1px solid #FFE4C4;">Order ID</td>
                  <td style="padding:8px 0;color:#5C3D2E;font-size:0.82rem;font-weight:800;text-align:right;border-bottom:1px solid #FFE4C4;">${orderId}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#BFA89C;font-size:0.82rem;font-weight:700;border-bottom:1px solid #FFE4C4;">Frame</td>
                  <td style="padding:8px 0;color:#5C3D2E;font-size:0.82rem;font-weight:800;text-align:right;border-bottom:1px solid #FFE4C4;">${frameName}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#BFA89C;font-size:0.82rem;font-weight:700;border-bottom:1px solid #FFE4C4;">Total Bayar</td>
                  <td style="padding:8px 0;color:#5C3D2E;font-size:0.82rem;font-weight:800;text-align:right;border-bottom:1px solid #FFE4C4;">Rp 20.000</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;color:#BFA89C;font-size:0.82rem;font-weight:700;">Status</td>
                  <td style="padding:8px 0;color:#2E9E68;font-size:0.82rem;font-weight:800;text-align:right;">✅ Lunas</td>
                </tr>
              </table>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5500'}/Front-End/index.html"
                 style="display:inline-block;background:linear-gradient(135deg,#FFB5C8,#FF85A1);color:white;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:800;font-size:0.95rem;box-shadow:0 6px 20px rgba(255,133,161,0.4);">
                📸 Buat Foto Lagi!
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="text-align:center;margin-top:24px;color:#BFA89C;font-size:0.78rem;">
            <p>Made with ♥ — PopSnap! © 2025</p>
            <p>Powered by WebRTC · Midtrans · Gmail SMTP</p>
          </div>

        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `popsnap-strip-${orderId}.png`,
        content: imgBuffer,
        contentType: 'image/png',
        cid: 'stripPhoto'  // inline image di email
      }
    ]
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email terkirim ke ${to} — MessageId: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
      to
    };
  } catch (err) {
    console.error(`❌ Email gagal ke ${to}:`, err.message);
    throw new Error('Gagal mengirim email: ' + err.message);
  }
}

module.exports = { sendStripEmail };
