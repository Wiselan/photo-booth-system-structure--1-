/* ================================================
   PopSnap! — app.js
   Logika utama: Kamera, Strip, Frame, Canvas, Payment
   ================================================ */

'use strict';

// ── Konfigurasi ──────────────────────────────────
const CONFIG = {
  PHOTO_COUNT: 4,
  COUNTDOWN_SEC: 3,
  DELAY_BETWEEN: 1500,      // ms antar foto
  BACKEND_URL: 'http://localhost:3000',// ganti dengan URL backend kamu
  STRIP_WIDTH: 400,
  STRIP_PHOTO_HEIGHT: 300,
  STRIP_PADDING: 0,
  STRIP_GAP: 0,
};

const FRAME_SLOTS = {
  'retro-pop': [
    { x: 241, y: 225, w: 293, h: 211 },
    { x: 241, y: 478, w: 286, h: 212 },
    { x: 241, y: 735, w: 286, h: 215 },
    { x: 238, y: 996, w: 283, h: 215 },
  ],
  'pastel': [
    { x: 234, y: 159, w: 300, h: 238 },
    { x: 234, y: 439, w: 296, h: 241 },
    { x: 234, y: 726, w: 300, h: 237 },
    { x: 231, y: 1009, w: 306, h: 241 },
  ],
  'vintage': [
    { x: 238, y: 143, w: 286, h: 248 },
    { x: 234, y: 433, w: 293, h: 244 },
    { x: 234, y: 726, w: 290, h: 241 },
    { x: 234, y: 1022, w: 293, h: 244 },
  ],
  'monochrome': [
    { x: 238, y: 143, w: 286, h: 248 },
    { x: 234, y: 433, w: 293, h: 244 },
    { x: 234, y: 726, w: 290, h: 241 },
    { x: 234, y: 1022, w: 293, h: 244 },
  ],
};

// ── State Global ─────────────────────────────────
let photos = [];           // array base64 foto
let selectedFrame = null;  // nama frame terpilih
let finalImageData = null; // base64 strip final

// ── Load dari sessionStorage ──────────────────────
function loadState() {
  const p = sessionStorage.getItem('popsnap_photos');
  const f = sessionStorage.getItem('popsnap_frame');
  const img = sessionStorage.getItem('popsnap_final');
  if (p) photos = JSON.parse(p);
  if (f) selectedFrame = f;
  if (img) finalImageData = img;
}

function saveState() {
  sessionStorage.setItem('popsnap_photos', JSON.stringify(photos));
  if (selectedFrame) sessionStorage.setItem('popsnap_frame', selectedFrame);
  if (finalImageData) sessionStorage.setItem('popsnap_final', finalImageData);
}

function clearState() {
  sessionStorage.removeItem('popsnap_photos');
  sessionStorage.removeItem('popsnap_frame');
  sessionStorage.removeItem('popsnap_final');
}

// ── Toast Notification ────────────────────────────
function showToast(msg, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ════════════════════════════════════════════════
//  HALAMAN KAMERA (camera.html)
// ════════════════════════════════════════════════

let videoStream = null;
let currentPhotoIndex = 0;
let isCapturing = false;

async function initCamera() {
  const videoEl = document.getElementById('videoEl');
  const cameraWrapper = document.getElementById('cameraWrapper');
  const permissionError = document.getElementById('permissionError');

  if (!videoEl) return;

  // Redirect jika sudah punya 4 foto
  loadState();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    videoStream = stream;
    videoEl.srcObject = stream;
    videoEl.play();

    updateStripUI();
    showToast('Kamera siap! 📸', 'success');
  } catch (err) {
    console.error('Camera error:', err);
    if (cameraWrapper) cameraWrapper.style.display = 'none';
    if (permissionError) permissionError.style.display = 'block';
    document.getElementById('photoCounter').style.display = 'none';
    document.getElementById('statusText').style.display = 'none';
    document.querySelectorAll('.camera-controls .btn').forEach(b => b.style.display = 'none');
  }
}

async function startSession() {
  if (isCapturing) return;

  // Reset semua
  photos = [];
  currentPhotoIndex = 0;
  clearState();
  updateStripUI();

  isCapturing = true;
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('btnRetake').classList.add('hidden');

  for (let i = 0; i < CONFIG.PHOTO_COUNT; i++) {
    currentPhotoIndex = i;
    updateStripUI();

    // Update status
    setStatus(`📸 Foto ${i + 1} dari ${CONFIG.PHOTO_COUNT}`);

    // Countdown
    await countdown(CONFIG.COUNTDOWN_SEC);

    // Ambil foto
    await capturePhoto(i);

    // Delay sebelum foto berikutnya
    if (i < CONFIG.PHOTO_COUNT - 1) {
      setStatus(`✨ Bagus! Bersiap untuk foto ${i + 2}...`);
      await sleep(CONFIG.DELAY_BETWEEN);
    }
  }

  // Selesai
  isCapturing = false;
  setStatus('🎉 Semua foto sudah diambil! Lanjut pilih frame ya!');
  document.getElementById('btnStart').classList.add('hidden');
  document.getElementById('btnRetake').classList.remove('hidden');

  // Simpan dan redirect
  saveState();
  showToast('4 foto berhasil diambil! 🎊', 'success', 2000);

  setTimeout(() => {
    window.location.href = 'frame.html';
  }, 2000);
}

function countdown(sec) {
  return new Promise(resolve => {
    const overlay = document.getElementById('countdownOverlay');
    overlay.style.display = 'flex';
    let count = sec;

    overlay.textContent = count;

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        overlay.style.display = 'none';
        resolve();
      } else {
        overlay.textContent = count;
        // Re-trigger animation
        overlay.style.animation = 'none';
        void overlay.offsetWidth;
        overlay.style.animation = 'countPulse 1s ease';
      }
    }, 1000);
  });
}

function capturePhoto(index) {
  return new Promise(resolve => {
    const video = document.getElementById('videoEl');
    const canvas = document.getElementById('captureCanvas');

    // Flash effect
    const flash = document.getElementById('flashOverlay');
    flash.style.opacity = '1';
    setTimeout(() => { flash.style.opacity = '0'; }, 150);

    // Set canvas size sesuai video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');

    // Mirror foto (flip horizontal)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const dataURL = canvas.toDataURL('image/jpeg', 0.92);
    photos[index] = dataURL;

    // Update slot di strip sidebar
    const slot = document.getElementById(`slot-${index}`);
    if (slot) {
      slot.innerHTML = `<img src="${dataURL}" alt="Foto ${index + 1}"/><span class="slot-num">${index + 1}</span>`;
      slot.classList.add('filled');
      slot.classList.remove('active-slot');
    }

    // Update dot
    const dot = document.getElementById(`dot-${index}`);
    if (dot) {
      dot.classList.remove('active');
      dot.classList.add('taken');
    }

    // Aktifkan slot berikutnya
    if (index + 1 < CONFIG.PHOTO_COUNT) {
      const nextSlot = document.getElementById(`slot-${index + 1}`);
      const nextDot = document.getElementById(`dot-${index + 1}`);
      if (nextSlot) nextSlot.classList.add('active-slot');
      if (nextDot) nextDot.classList.add('active');
    }

    resolve();
  });
}

function retakeAll() {
  photos = [];
  clearState();
  currentPhotoIndex = 0;

  // Reset UI strip
  for (let i = 0; i < CONFIG.PHOTO_COUNT; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (slot) {
      slot.innerHTML = `<span class="slot-empty-icon">📷</span><span class="slot-num">${i + 1}</span>`;
      slot.classList.remove('filled', 'active-slot');
    }
    const dot = document.getElementById(`dot-${i}`);
    if (dot) {
      dot.classList.remove('taken', 'active');
    }
  }

  // Set active state awal
  document.getElementById('slot-0')?.classList.add('active-slot');
  document.getElementById('dot-0')?.classList.add('active');

  document.getElementById('btnStart').classList.remove('hidden');
  document.getElementById('btnRetake').classList.add('hidden');
  setStatus('Siap? Tekan tombol untuk mulai! 📸');

  showToast('Foto direset. Mulai lagi ya! 🔄', 'info');
}

function updateStripUI() {
  // Update semua slot dari array photos
  for (let i = 0; i < CONFIG.PHOTO_COUNT; i++) {
    const slot = document.getElementById(`slot-${i}`);
    if (!slot) continue;

    if (photos[i]) {
      slot.innerHTML = `<img src="${photos[i]}" alt="Foto ${i + 1}"/><span class="slot-num">${i + 1}</span>`;
      slot.classList.add('filled');
      slot.classList.remove('active-slot');
    }
  }
}

function setStatus(text) {
  const el = document.getElementById('statusText');
  if (el) el.textContent = text;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ════════════════════════════════════════════════
//  HALAMAN FRAME (frame.html)
// ════════════════════════════════════════════════

function initFramePage() {
  loadState();

  // Cek apakah ada foto
  if (!photos || photos.length < CONFIG.PHOTO_COUNT) {
    showToast('Belum ada foto! Ambil foto dulu ya 📸', 'error');
    setTimeout(() => { window.location.href = 'camera.html'; }, 2000);
    return;
  }

  // Restore frame jika ada
  if (selectedFrame) {
    const frameEl = document.querySelector(`[data-frame="${selectedFrame}"]`);
    if (frameEl) {
      frameEl.classList.add('selected');
      renderPreview(selectedFrame);
      document.getElementById('btnLanjut').disabled = false;
    }
  }
}

function selectFrame(el) {
  // Remove semua selected
  document.querySelectorAll('.frame-option').forEach(f => f.classList.remove('selected'));

  // Set selected
  el.classList.add('selected');
  selectedFrame = el.dataset.frame;

  // Update info
  const frameInfo = document.getElementById('frameInfo');
  const frameInfoText = document.getElementById('frameInfoText');
  if (frameInfo) frameInfo.classList.remove('hidden');
  if (frameInfoText) {
    const names = {
      'retro-pop': 'Retro Pop 🌈',
      'pastel': 'Pastel 🌸',
      'vintage': 'Vintage 📷',
      'monochrome': 'Monochrome 🖤'
    };
    frameInfoText.textContent = `Frame: ${names[selectedFrame] || selectedFrame}`;
  }

  // Enable tombol lanjut
  document.getElementById('btnLanjut').disabled = false;

  // Render preview
  renderPreview(selectedFrame);
  saveState();
}

async function renderPreview(frameName) {
  const canvas = document.getElementById('previewCanvas');
  const empty = document.getElementById('previewEmpty');
  if (!canvas) return;

  // Show spinner
  const spinner = document.getElementById('canvasSpinner');
  if (spinner) spinner.style.display = 'flex';

  try {
    const dataURL = await buildStrip(frameName);
    finalImageData = dataURL;
    saveState();

    canvas.style.display = 'block';
    if (empty) empty.style.display = 'none';

    // Tampilkan di canvas
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      if (spinner) spinner.style.display = 'none';
    };
    img.src = dataURL;
  } catch (err) {
    console.error('Render preview error:', err);
    if (spinner) spinner.style.display = 'none';
    showToast('Gagal render preview 😢', 'error');
  }
}

function goToResult() {
  if (!selectedFrame) {
    showToast('Pilih frame dulu ya! 🖼️', 'error');
    return;
  }
  saveState();
  window.location.href = 'result.html';
}

// ════════════════════════════════════════════════
//  BUILD STRIP CANVAS
// ════════════════════════════════════════════════

async function buildStrip(frameName) {
  // 1. Load frame dulu untuk dapat dimensi aslinya
  let frameImg = null;
  try {
    frameImg = await loadImage(`/public/frames/${frameName}.png`);
  } catch(e) {
    console.warn('Frame tidak ditemukan:', e);
  }

  // Gunakan dimensi frame asli sebagai ukuran canvas
  const W = frameImg ? frameImg.width : CONFIG.STRIP_WIDTH;
  const TOTAL_H = frameImg ? frameImg.height : 
    (CONFIG.STRIP_PADDING * 2 + CONFIG.PHOTO_COUNT * CONFIG.STRIP_PHOTO_HEIGHT + 
     (CONFIG.PHOTO_COUNT - 1) * CONFIG.STRIP_GAP);

  const offscreen = document.createElement('canvas');
  offscreen.width  = W;
  offscreen.height = TOTAL_H;
  const ctx = offscreen.getContext('2d');

  // Background putih
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, TOTAL_H);

  // 2. Gambar frame DULU sebagai background
  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, W, TOTAL_H);
  }

  // 3. Tentukan area foto dari frame
  // ⚠️ SESUAIKAN koordinat ini dengan posisi lubang foto di frame PNG kamu!
 const photoSlots = FRAME_SLOTS[frameName] || FRAME_SLOTS['retro-pop'];

  // 4. Gambar foto di dalam slot dengan clipping
  for (let i = 0; i < CONFIG.PHOTO_COUNT; i++) {
    if (!photos[i]) continue;

    const slot = photoSlots[i];
    const photoImg = await loadImage(photos[i]);

    ctx.save();
    
    // Clip ke area slot agar foto tidak keluar
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();

    // Hitung crop agar foto mengisi slot (object-fit: cover)
    const srcAspect = photoImg.width / photoImg.height;
    const dstAspect = slot.w / slot.h;

    let sx = 0, sy = 0, sw = photoImg.width, sh = photoImg.height;

    if (srcAspect > dstAspect) {
      sw = photoImg.height * dstAspect;
      sx = (photoImg.width - sw) / 2;
    } else {
      sh = photoImg.width / dstAspect;
      sy = (photoImg.height - sh) / 2;
    }

    ctx.drawImage(photoImg, sx, sy, sw, sh, slot.x, slot.y, slot.w, slot.h);
    
    ctx.restore();
  }

  // 5. Gambar frame LAGI di atas foto (agar border frame menutupi tepi foto)
  if (frameImg) {
    ctx.drawImage(frameImg, 0, 0, W, TOTAL_H);
  }

  return offscreen.toDataURL('image/png', 1.0);
}

function drawFallbackFrame(ctx, W, H, frameName) {
  const colors = {
    'retro-pop':  { border: '#FFB5C8', text: '#FF85A1', bg: 'rgba(255,181,200,0.15)' },
    'pastel':     { border: '#D4B8F0', text: '#7C4DCC', bg: 'rgba(212,184,240,0.15)' },
    'vintage':    { border: '#D4A96A', text: '#8B6F5E', bg: 'rgba(212,169,106,0.15)' },
    'monochrome': { border: '#888888', text: '#333333', bg: 'rgba(100,100,100,0.15)' },
  };

  const c = colors[frameName] || colors['retro-pop'];

  // Overlay tipis
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W, H);

  // Border luar
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, W - 8, H - 8);

  // Teks atas
  const labels = {
    'retro-pop':  '✦ RETRO POP ✦',
    'pastel':     '✦ PASTEL ✦',
    'vintage':    '✦ VINTAGE ✦',
    'monochrome': '✦ MONO ✦',
  };

  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(labels[frameName] || 'PopSnap!', W / 2, 16);
  ctx.fillText('PopSnap! ✨', W / 2, H - 6);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });
}

// ════════════════════════════════════════════════
//  HALAMAN RESULT / PAYMENT (result.html)
// ════════════════════════════════════════════════

function initResultPage() {
  loadState();

  // Validasi: harus ada foto & frame
  if (!photos || photos.length < CONFIG.PHOTO_COUNT) {
    showToast('Data foto tidak ditemukan 😢', 'error');
    setTimeout(() => { window.location.href = 'camera.html'; }, 2000);
    return;
  }

  if (!selectedFrame) {
    showToast('Frame belum dipilih 🖼️', 'error');
    setTimeout(() => { window.location.href = 'frame.html'; }, 2000);
    return;
  }

  // Tampilkan strip final di canvas
  renderFinalCanvas();

  // Update meta info
  const metaFrame = document.getElementById('metaFrame');
  if (metaFrame) {
    const names = {
      'retro-pop': 'Retro Pop 🌈',
      'pastel': 'Pastel 🌸',
      'vintage': 'Vintage 📷',
      'monochrome': 'Monochrome 🖤'
    };
    metaFrame.textContent = names[selectedFrame] || selectedFrame;
  }

  // Listen input changes
  const inputName  = document.getElementById('inputName');
  const inputEmail = document.getElementById('inputEmail');
  if (inputName)  inputName.addEventListener('input', updatePayBtn);
  if (inputEmail) inputEmail.addEventListener('input', updatePayBtn);
}

async function renderFinalCanvas() {
  const canvas = document.getElementById('finalCanvas');
  if (!canvas) return;

  try {
    let dataURL = finalImageData;

    // Build ulang jika belum ada
    if (!dataURL) {
      dataURL = await buildStrip(selectedFrame);
      finalImageData = dataURL;
      saveState();
    }

    const img = new Image();
    img.onload = () => {
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
    };
    img.src = dataURL;
  } catch (err) {
    console.error('Final canvas error:', err);
  }
}

function updatePayBtn() {
  const name  = document.getElementById('inputName')?.value.trim();
  const email = document.getElementById('inputEmail')?.value.trim();
  const terms = document.getElementById('chkTerms')?.checked;
  const btn   = document.getElementById('btnPay');

  if (!btn) return;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  btn.disabled = !(name && emailValid && terms);
}

async function handlePayment() {
  const name  = document.getElementById('inputName').value.trim();
  const email = document.getElementById('inputEmail').value.trim();
  const btn   = document.getElementById('btnPay');

  if (!name || !email) {
    showToast('Isi nama dan email dulu ya! 📝', 'error');
    return;
  }

  if (!finalImageData) {
    showToast('Data strip tidak ditemukan 😢', 'error');
    return;
  }

  // Loading state
  btn.classList.add('loading');
  btn.disabled = true;

  try {
    // 1. Request token dari backend
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/create-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        amount: 20000,
        orderId: `POPSNAP-${Date.now()}`
      })
    });

    if (!res.ok) throw new Error('Gagal membuat transaksi');

    const data = await res.json();
    const { token } = data;

    // 2. Buka Midtrans Snap
    window.snap.pay(token, {
      onSuccess: async (result) => {
        showToast('Pembayaran berhasil! 🎉', 'success');
        await sendEmailWithStrip(name, email, result.order_id);
      },
      onPending: (result) => {
        showToast('Pembayaran pending, cek email ya! ⏳', 'info');
        btn.classList.remove('loading');
        btn.disabled = false;
      },
      onError: (result) => {
        showToast('Pembayaran gagal 😢 Coba lagi ya!', 'error');
        btn.classList.remove('loading');
        btn.disabled = false;
      },
      onClose: () => {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  } catch (err) {
    console.error('Payment error:', err);
    showToast('Koneksi ke server gagal 😢', 'error');
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

async function sendEmailWithStrip(name, email, orderId) {
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        orderId,
        imageData: finalImageData,
        frame: selectedFrame
      })
    });

    if (!res.ok) throw new Error('Gagal kirim email');

    // Tampilkan success state
    showSuccessState(name, email);
    clearState();
  } catch (err) {
    console.error('Email error:', err);
    showToast('Pembayaran sukses tapi email gagal terkirim. Hubungi support! 📧', 'error', 6000);
    showSuccessState(name, email);
    clearState();
  }
}

function showSuccessState(name, email) {
  const mainLayout = document.getElementById('mainLayout');
  const successState = document.getElementById('successState');
  const successEmail = document.getElementById('successEmail');
  const successFrame = document.getElementById('successFrame');

  if (mainLayout) mainLayout.style.display = 'none';
  if (successState) successState.style.display = 'block';

  if (successEmail) successEmail.textContent = email;

  if (successFrame) {
    const names = {
      'retro-pop': 'Retro Pop 🌈',
      'pastel': 'Pastel 🌸',
      'vintage': 'Vintage 📷',
      'monochrome': 'Monochrome 🖤'
    };
    successFrame.textContent = names[selectedFrame] || selectedFrame;
  }

  // Confetti sederhana via emoji floating
  launchConfetti();
}

function launchConfetti() {
  const emojis = ['🎉','✨','🌸','⭐','🎀','💫','🌟'];
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.style.cssText = `
        position: fixed;
        top: -40px;
        left: ${Math.random() * 100}vw;
        font-size: ${1 + Math.random()}rem;
        animation: confettiFall ${2 + Math.random() * 2}s ease-in forwards;
        pointer-events: none;
        z-index: 9999;
      `;
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    }, i * 150);
  }

  // Tambah keyframe confetti jika belum ada
  if (!document.getElementById('confettiStyle')) {
    const style = document.createElement('style');
    style.id = 'confettiStyle';
    style.textContent = `
      @keyframes confettiFall {
        0%   { transform: translateY(-40px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
}
