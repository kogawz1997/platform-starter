'use client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export default function ExportsPage() {
  function download(path: string) {
    const token = window.localStorage.getItem('admin_access_token');
    if (!token) { alert('กรุณา login admin ก่อน'); return; }
    fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json().catch(() => null))?.message ?? 'Export ไม่สำเร็จ');
        return res.text();
      })
      .then((text) => {
        const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = path.split('/').pop() ?? 'export.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => alert(error.message));
  }

  return (
    <main style={pageStyle}>
      <a href="/settings" style={backStyle}>← Settings</a>
      <p style={eyebrowStyle}>Finance Export</p>
      <h1 style={titleStyle}>Exports</h1>
      <p style={mutedStyle}>ดาวน์โหลดข้อมูลการเงินเป็น CSV สำหรับตรวจสอบและทำบัญชี</p>
      <section style={gridStyle}>
        <ExportCard title="Top-ups CSV" text="รายการเติมเงินทั้งหมด" onClick={() => download('/admin/exports/topups.csv')} />
        <ExportCard title="Withdrawals CSV" text="รายการถอนเงินทั้งหมด" onClick={() => download('/admin/exports/withdrawals.csv')} />
        <ExportCard title="Ledgers CSV" text="ประวัติ ledger ยอดก่อน/หลัง" onClick={() => download('/admin/exports/ledgers.csv')} />
      </section>
    </main>
  );
}

function ExportCard({ title, text, onClick }: { title: string; text: string; onClick: () => void }) {
  return <section style={cardStyle}><h2 style={{ margin: 0 }}>{title}</h2><p style={mutedStyle}>{text}</p><button type="button" onClick={onClick} style={buttonStyle}>Download</button></section>;
}

const pageStyle = { maxWidth: 1000, margin: '0 auto', padding: '22px 16px 44px', color: '#fff' } as const;
const backStyle = { color: '#f5c542', textDecoration: 'none', fontWeight: 900 } as const;
const eyebrowStyle = { margin: '18px 0 0', opacity: 0.66, fontSize: 14 } as const;
const titleStyle = { margin: '6px 0 8px', fontSize: 'clamp(36px, 10vw, 68px)', lineHeight: 0.96, letterSpacing: -1.4 } as const;
const mutedStyle = { margin: 0, opacity: 0.76, lineHeight: 1.55 } as const;
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 18 } as const;
const cardStyle = { border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24, padding: 16, background: '#181818', display: 'grid', gap: 12 } as const;
const buttonStyle = { padding: '13px 14px', borderRadius: 14, cursor: 'pointer', background: '#f5c542', color: '#111', border: 0, fontWeight: 900 } as const;
