import { useState } from 'react'

const files = [
  {
    category: 'Front-End',
    color: 'blue',
    icon: '🌐',
    items: [
      { name: 'index.html', desc: 'Halaman beranda PopSnap!', done: true },
      { name: 'camera.html', desc: 'Ambil 4 foto via WebRTC', done: true },
      { name: 'frame.html', desc: 'Pilih frame + preview canvas', done: true },
      { name: 'result.html', desc: 'Form email + Midtrans payment', done: true },
      { name: 'app.js', desc: 'Semua logika JS (kamera, canvas, payment)', done: true },
      { name: 'style.css', desc: 'Design system pastel cute', done: true },
    ]
  },
  {
    category: 'Back-End',
    color: 'green',
    icon: '⚙️',
    items: [
      { name: 'server.js', desc: 'Express.js server utama', done: true },
      { name: 'payment.js', desc: 'Midtrans Sandbox integration', done: true },
      { name: 'email.js', desc: 'Nodemailer Gmail SMTP', done: true },
      { name: 'routes.js', desc: 'API endpoints lengkap', done: true },
    ]
  },
  {
    category: 'Frames',
    color: 'yellow',
    icon: '🖼️',
    items: [
      { name: 'retro-pop.png', desc: 'Frame warna-warni ceria', done: true },
      { name: 'pastel.png', desc: 'Frame pastel lembut', done: true },
      { name: 'vintage.png', desc: 'Frame vintage sepia', done: true },
      { name: 'monochrome.png', desc: 'Frame hitam putih elegan', done: true },
    ]
  }
]

const steps = [
  { num: '01', title: 'Setup Backend', emoji: '⚙️', color: '#B8EDD8', items: [
    'cd ke folder project',
    'Copy .env.example → .env',
    'Isi MIDTRANS_SERVER_KEY dan CLIENT_KEY',
    'Isi GMAIL_USER dan GMAIL_PASS',
    'npm install',
    'npm run dev',
  ]},
  { num: '02', title: 'Jalankan Frontend', emoji: '🌐', color: '#FFD6E4', items: [
    'Install Live Server di VS Code',
    'Klik kanan index.html → Open with Live Server',
    'Atau pakai: npx serve Front-End/',
    'Buka http://localhost:5500/Front-End/',
  ]},
  { num: '03', title: 'Test Alur Lengkap', emoji: '🧪', color: '#EDE0FF', items: [
    'Buka index.html → klik Mulai Foto',
    'Izinkan akses kamera di browser',
    'Ambil 4 foto → pilih frame',
    'Isi email → bayar Rp 20.000',
    'Gunakan kartu test Midtrans Sandbox',
    'Cek email untuk strip foto!',
  ]},
]

const apis = [
  { method: 'POST', endpoint: '/api/create-payment', desc: 'Buat transaksi Midtrans → return snap token', color: '#B8EDD8' },
  { method: 'POST', endpoint: '/api/send-email', desc: 'Kirim strip foto ke email via Gmail', color: '#FFD6E4' },
  { method: 'POST', endpoint: '/api/verify-payment', desc: 'Verifikasi status pembayaran', color: '#EDE0FF' },
  { method: 'POST', endpoint: '/api/midtrans-webhook', desc: 'Terima notifikasi dari Midtrans', color: '#FFF8CC' },
  { method: 'GET', endpoint: '/api/health', desc: 'Cek status server & konfigurasi', color: '#FFE4C4' },
]

const cardTest = [
  { label: 'Kartu Kredit Sukses', value: '4811 1111 1111 1114', extra: 'CVV: 123 | Expired: 01/39' },
  { label: 'Kartu Kredit Gagal', value: '4911 1111 1111 1113', extra: 'CVV: 123 | Expired: 01/39' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'api'>('overview')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  function copyText(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    blue:   { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8', badge: '#DBEAFE' },
    green:  { bg: '#F0FFF8', border: '#B8EDD8', text: '#2E9E68', badge: '#DFFAF0' },
    yellow: { bg: '#FFFDF0', border: '#FFE4A0', text: '#B8860B', badge: '#FFF8CC' },
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F0', fontFamily: "'Nunito', sans-serif" }}>

      {/* Background decorations */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {['⭐','✦','🌸','💫','⭐','✦'].map((s, i) => (
          <span key={i} style={{
            position: 'absolute',
            fontSize: '1rem',
            opacity: 0.4,
            top: `${[8,15,40,60,80,20][i]}%`,
            left: `${[5,90,3,95,10,85][i]}%`,
            animation: `float ${3.5 + i * 0.3}s ease-in-out infinite`,
          }}>{s}</span>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@400;700;800&display=swap');
        @keyframes float {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(15deg); }
        }
        @keyframes shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .tab-btn {
          padding: 10px 24px;
          border-radius: 999px;
          border: 2px solid transparent;
          cursor: pointer;
          font-family: 'Nunito', sans-serif;
          font-weight: 800;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }
        .tab-btn:hover { transform: translateY(-2px); }
        .file-item:hover { transform: translateX(4px); }
        .file-item { transition: transform 0.2s ease; }
        .step-item:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(180,120,140,0.15); }
        .step-item { transition: all 0.25s ease; }
        .api-row:hover { background: rgba(255,181,200,0.08) !important; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, margin: '0 auto', padding: '0 24px 60px' }}>

        {/* NAVBAR */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0' }}>
          <div style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #FF85A1, #D4B8F0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            📷 PopSnap!
          </div>
          <span style={{ background: '#FFD6E4', color: '#FF85A1', borderRadius: 999, padding: '4px 14px', fontSize: '0.75rem', fontWeight: 800 }}>
            ✨ Project Guide
          </span>
        </nav>

        {/* HERO */}
        <div style={{ textAlign: 'center', padding: '40px 0 48px' }}>
          <div style={{ display: 'inline-block', background: '#FFD6E4', color: '#FF85A1', borderRadius: 999, padding: '6px 20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: 20 }}>
            🎉 Semua File Sudah Dibuat!
          </div>

          <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#5C3D2E', lineHeight: 1.1, marginBottom: 16 }}>
            PopSnap! <span style={{ background: 'linear-gradient(135deg,#FF85A1,#D4B8F0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Photo Booth</span>
          </h1>

          <p style={{ color: '#8B6F5E', fontSize: '1.05rem', fontWeight: 600, maxWidth: 520, margin: '0 auto 36px', lineHeight: 1.7 }}>
            Foto booth online dengan WebRTC + Canvas + Midtrans + Gmail.
            Semua file sudah siap — tinggal isi API keys & jalankan! 🚀
          </p>

          {/* Alur Flow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { emoji: '📸', label: 'Ambil Foto', bg: '#DBEAFE' },
              { emoji: '→', label: '', bg: 'transparent' },
              { emoji: '🖼️', label: 'Pilih Frame', bg: '#EDE0FF' },
              { emoji: '→', label: '', bg: 'transparent' },
              { emoji: '💳', label: 'Bayar', bg: '#DFFAF0' },
              { emoji: '→', label: '', bg: 'transparent' },
              { emoji: '📧', label: 'Terima Email', bg: '#FFF8CC' },
            ].map((item, i) => (
              item.label ? (
                <div key={i} style={{ background: item.bg, borderRadius: 12, padding: '10px 16px', fontSize: '0.85rem', fontWeight: 800, color: '#5C3D2E' }}>
                  {item.emoji} {item.label}
                </div>
              ) : (
                <span key={i} style={{ fontSize: '1.2rem', color: '#BFA89C' }}>{item.emoji}</span>
              )
            ))}
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(['overview', 'setup', 'api'] as const).map(tab => (
              <button key={tab} className="tab-btn"
                style={{
                  background: activeTab === tab ? 'linear-gradient(135deg,#FFB5C8,#FF85A1)' : 'white',
                  color: activeTab === tab ? 'white' : '#8B6F5E',
                  borderColor: activeTab === tab ? '#FF85A1' : '#FFE4C4',
                  boxShadow: activeTab === tab ? '0 4px 16px rgba(255,133,161,0.35)' : 'none',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' && '📁 Struktur File'}
                {tab === 'setup' && '🚀 Cara Setup'}
                {tab === 'api' && '🔌 API Endpoints'}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
              {files.map(group => {
                const c = colorMap[group.color]
                return (
                  <div key={group.category} style={{ background: c.bg, borderRadius: 20, border: `2px solid ${c.border}`, padding: 24, boxShadow: '0 4px 20px rgba(180,120,140,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                      <span style={{ fontSize: '1.5rem' }}>{group.icon}</span>
                      <div>
                        <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#5C3D2E' }}>
                          {group.category}/
                        </div>
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text }}>
                          {group.category === 'Front-End' ? 'HTML, CSS, JS' : group.category === 'Back-End' ? 'Node.js + Express' : 'PNG Design Frames'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {group.items.map(item => (
                        <div key={item.name} className="file-item" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', background: 'white', borderRadius: 12, border: `1.5px solid ${c.border}` }}>
                          <span style={{ fontSize: '0.75rem', marginTop: 2 }}>{item.done ? '✅' : '⏳'}</span>
                          <div>
                            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', color: '#5C3D2E' }}>{item.name}</div>
                            <div style={{ fontSize: '0.73rem', color: '#8B6F5E', fontWeight: 600, marginTop: 2 }}>{item.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* .env info */}
            <div style={{ background: 'linear-gradient(135deg, #FFF0F5, #F5F0FF)', borderRadius: 20, border: '2px solid #FFD6E4', padding: 24 }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#5C3D2E', marginBottom: 16 }}>
                🔑 Yang Perlu Diisi di <code style={{ background: '#FFD6E4', padding: '2px 8px', borderRadius: 6, fontSize: '0.9rem' }}>.env</code>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
                {[
                  { key: 'MIDTRANS_SERVER_KEY', val: 'SB-Mid-server-xxx...', color: '#DFFAF0', border: '#B8EDD8' },
                  { key: 'MIDTRANS_CLIENT_KEY', val: 'SB-Mid-client-xxx...', color: '#DFFAF0', border: '#B8EDD8' },
                  { key: 'GMAIL_USER', val: 'emailkamu@gmail.com', color: '#FFD6E4', border: '#FFB5C8' },
                  { key: 'GMAIL_PASS', val: 'xxxx xxxx xxxx xxxx', color: '#FFD6E4', border: '#FFB5C8' },
                ].map((env, i) => (
                  <div key={i} style={{ background: env.color, borderRadius: 12, border: `1.5px solid ${env.border}`, padding: '12px 14px', cursor: 'pointer' }}
                    onClick={() => copyText(`${env.key}=${env.val}`, i)}
                  >
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#5C3D2E', marginBottom: 4 }}>{env.key}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#8B6F5E' }}>{env.val}</div>
                    {copiedIdx === i && <div style={{ fontSize: '0.7rem', color: '#2E9E68', fontWeight: 800, marginTop: 4 }}>✅ Copied!</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: SETUP ── */}
        {activeTab === 'setup' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map((step, i) => (
              <div key={i} className="step-item" style={{ background: 'white', borderRadius: 20, border: '2px solid #FFE4C4', padding: 24, boxShadow: '0 4px 16px rgba(180,120,140,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                    {step.emoji}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#BFA89C', textTransform: 'uppercase', letterSpacing: 1 }}>Step {step.num}</div>
                    <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#5C3D2E' }}>{step.title}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {step.items.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: '#FFF8F0', borderRadius: 10, border: '1.5px solid #FFE4C4' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#FF85A1', width: 20, flexShrink: 0 }}>{j + 1}.</span>
                      <code style={{ fontSize: '0.82rem', fontWeight: 700, color: '#5C3D2E', fontFamily: 'monospace' }}>{item}</code>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Test cards */}
            <div style={{ background: 'linear-gradient(135deg,#FFF8CC,#FFECB3)', borderRadius: 20, border: '2px solid #FFE066', padding: 24 }}>
              <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#5C3D2E', marginBottom: 16 }}>
                💳 Kartu Test Midtrans Sandbox
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {cardTest.map((card, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 12, padding: '14px 16px', border: '1.5px solid #FFE066', cursor: 'pointer' }}
                    onClick={() => copyText(card.value, 100 + i)}
                  >
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#8B6F5E', marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '1rem', color: '#5C3D2E', letterSpacing: 2 }}>{card.value}</div>
                    <div style={{ fontSize: '0.72rem', color: '#BFA89C', marginTop: 4 }}>{card.extra}</div>
                    {copiedIdx === 100 + i && <div style={{ fontSize: '0.7rem', color: '#2E9E68', fontWeight: 800, marginTop: 4 }}>✅ Copied!</div>}
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#8B6F5E', fontWeight: 700, marginTop: 12 }}>
                💡 Klik kartu untuk copy nomor. Gunakan saat checkout di sandbox!
              </p>
            </div>
          </div>
        )}

        {/* ── TAB: API ── */}
        {activeTab === 'api' && (
          <div>
            <div style={{ background: 'white', borderRadius: 20, border: '2px solid #FFE4C4', overflow: 'hidden', boxShadow: '0 4px 20px rgba(180,120,140,0.1)' }}>
              <div style={{ padding: '16px 24px', borderBottom: '2px solid #FFF0DC', background: '#FFF8F0' }}>
                <div style={{ fontFamily: "'Baloo 2', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#5C3D2E' }}>
                  🔌 API Endpoints — Base URL: <code style={{ background: '#FFD6E4', padding: '2px 8px', borderRadius: 6 }}>http://localhost:3000</code>
                </div>
              </div>
              {apis.map((api, i) => (
                <div key={i} className="api-row" style={{ padding: '16px 24px', borderBottom: i < apis.length - 1 ? '1px solid #FFF0DC' : 'none', display: 'flex', alignItems: 'flex-start', gap: 16, cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => copyText(`${api.method} http://localhost:3000${api.endpoint}`, 200 + i)}
                >
                  <span style={{ background: api.color, padding: '4px 10px', borderRadius: 6, fontFamily: 'monospace', fontWeight: 900, fontSize: '0.75rem', color: '#5C3D2E', flexShrink: 0 }}>
                    {api.method}
                  </span>
                  <div style={{ flex: 1 }}>
                    <code style={{ fontWeight: 800, fontSize: '0.88rem', color: '#5C3D2E' }}>{api.endpoint}</code>
                    <div style={{ fontSize: '0.78rem', color: '#8B6F5E', fontWeight: 600, marginTop: 4 }}>{api.desc}</div>
                    {copiedIdx === 200 + i && <div style={{ fontSize: '0.7rem', color: '#2E9E68', fontWeight: 800, marginTop: 4 }}>✅ Copied!</div>}
                  </div>
                </div>
              ))}
            </div>

            {/* Request examples */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                {
                  title: 'POST /api/create-payment — Request Body',
                  color: '#DFFAF0',
                  border: '#B8EDD8',
                  code: `{
  "name": "Sarah",
  "email": "sarah@gmail.com",
  "amount": 20000,
  "orderId": "POPSNAP-1735000000000"
}`
                },
                {
                  title: 'POST /api/send-email — Request Body',
                  color: '#FFD6E4',
                  border: '#FFB5C8',
                  code: `{
  "name": "Sarah",
  "email": "sarah@gmail.com",
  "orderId": "POPSNAP-1735000000000",
  "imageData": "data:image/png;base64,iVBORw0KGgo...",
  "frame": "retro-pop"
}`
                },
              ].map((ex, i) => (
                <div key={i} style={{ background: ex.color, borderRadius: 16, border: `1.5px solid ${ex.border}`, padding: 20 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#5C3D2E', marginBottom: 10 }}>{ex.title}</div>
                  <pre style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#5C3D2E', margin: 0, overflowX: 'auto', background: 'white', borderRadius: 10, padding: '14px 16px', border: `1px solid ${ex.border}` }}>
                    {ex.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div style={{ textAlign: 'center', marginTop: 48, padding: '24px 0', color: '#BFA89C', fontSize: '0.85rem', fontWeight: 700 }}>
          Made with <span style={{ color: '#FF85A1' }}>♥</span> — PopSnap! © 2025<br/>
          <span style={{ opacity: 0.7, fontSize: '0.78rem' }}>Powered by WebRTC · Midtrans Sandbox · Gmail SMTP</span>
        </div>

      </div>
    </div>
  )
}
