'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { API_URL } from '../site-settings';

type TopUpItem = {
  id: string;
  amount: string;
  currency: string;
  status: string;
  method?: string | null;
  referenceCode?: string | null;
  note?: string | null;
  adminNote?: string | null;
  createdAt: string;
};

type Step = 'select' | 'transfer' | 'waiting' | 'approved' | 'rejected';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];

const METHODS = [
  {
    code: 'bank_transfer',
    label: 'โอนธนาคาร',
    title: 'บัญชีรับเงิน',
    detail: 'โอนตามยอดที่เลือก แล้วกลับมาแนบสลิป',
  },
  {
    code: 'qr_promptpay',
    label: 'QR PromptPay',
    title: 'สแกน QR เพื่อโอนเงิน',
    detail: 'สแกน QR ตามยอดที่เลือก แล้วกลับมาแนบสลิป',
  },
];

export default function DepositPage() {
  const [step, setStep] = useState<Step>('select');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('bank_transfer');
  const [note, setNote] = useState('');
  const [slipImageData, setSlipImageData] = useState('');
  const [slipImageName, setSlipImageName] = useState('');
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<TopUpItem | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (!pendingRequest?.id || step !== 'waiting') return;

    const interval = window.setInterval(async () => {
      const token = window.localStorage.getItem('member_access_token');
      if (!token) return;

      const res = await fetch(`${API_URL}/member/topups/${pendingRequest.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) return;

      setPendingRequest(data);
      setItems((current) => current.map((item) => (item.id === data.id ? data : item)));

      if (data.status === 'APPROVED') {
        setMessage('ทำรายการสำเร็จ ยอดถูกอนุมัติแล้ว');
        setStep('approved');
        window.clearInterval(interval);
      }

      if (data.status === 'REJECTED') {
        setMessage(data.adminNote ? `รายการไม่ผ่าน: ${data.adminNote}` : 'รายการไม่ผ่านการตรวจสอบ');
        setStep('rejected');
        window.clearInterval(interval);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [pendingRequest?.id, step]);

  const selectedMethod = useMemo(() => METHODS.find((item) => item.code === method) ?? METHODS[0], [method]);
  const parsedAmount = useMemo(() => Number(amount.trim().replace(/,/g, '')), [amount]);

  async function loadHistory() {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    const res = await fetch(`${API_URL}/member/topups`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => null);
    if (res.ok) setItems(data.items ?? []);
  }

  function goToTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage('กรุณาเลือกหรือใส่จำนวนเงินมากกว่า 0');
      return;
    }

    setMessage('');
    setStep('transfer');
  }

  async function handleSlipChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('กรุณาเลือกไฟล์รูปภาพสลิป');
      return;
    }

    const imageData = await resizeImage(file, 900, 0.7);
    setSlipImageName(file.name);
    setSlipImageData(imageData);
    setMessage('แนบสลิปแล้ว');
  }

  async function submitAfterTransfer() {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage('กรุณาเลือกหรือใส่จำนวนเงินมากกว่า 0');
      setStep('select');
      return;
    }

    if (!slipImageData) {
      setMessage('กรุณาแนบรูปสลิปก่อนกดเสร็จ');
      return;
    }

    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    setIsSubmitting(true);
    setMessage('กำลังส่งรายการให้แอดมินตรวจสอบ...');

    const proofNote = JSON.stringify({
      userNote: note,
      slipImageName,
      slipImageData,
    });

    const res = await fetch(`${API_URL}/member/topups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: parsedAmount, method, note: proofNote }),
    });

    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok) {
      setMessage(data?.message ?? 'ส่งรายการไม่สำเร็จ');
      return;
    }

    setNote('');
    setSlipImageName('');
    setSlipImageData('');
    setPendingRequest(data);
    setItems((current) => [data, ...current]);
    setMessage('ส่งรายการแล้ว รอแอดมินตรวจสอบและอนุมัติ');
    setStep('waiting');
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <a href="/">← หน้าแรก</a>
      <h1>ฝากเงิน / เติมเงิน</h1>
      <p>เลือกยอด เลือกช่องทาง โอนเงิน แนบสลิป แล้วรอแอดมินอนุมัติ</p>

      <section style={stepWrapStyle}>
        <div style={stepItemStyle(step === 'select')}>1 เลือกยอด</div>
        <div style={stepItemStyle(step === 'transfer')}>2 โอนเงิน</div>
        <div style={stepItemStyle(step === 'waiting' || step === 'approved' || step === 'rejected')}>3 ผลรายการ</div>
      </section>

      {step === 'select' && (
        <form onSubmit={goToTransfer} style={panelStyle}>
          <h2>เลือกจำนวนเงิน</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {AMOUNTS.map((value) => (
              <button key={value} type="button" onClick={() => setAmount(String(value))} style={amountButtonStyle(amount === String(value))}>
                ฿{value.toLocaleString('th-TH')}
              </button>
            ))}
          </div>

          <label>
            หรือใส่จำนวนเอง
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="เช่น 500" inputMode="decimal" style={inputStyle} />
          </label>

          <h2>เลือกวิธีการเติม</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {METHODS.map((item) => (
              <button key={item.code} type="button" onClick={() => setMethod(item.code)} style={methodButtonStyle(method === item.code)}>
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>

          <button type="submit" style={primaryButtonStyle}>เสร็จสิ้น</button>
          {message && <p>{message}</p>}
        </form>
      )}

      {step === 'transfer' && (
        <section style={panelStyle}>
          <h2>{selectedMethod.title}</h2>
          <div style={summaryStyle}>
            <p>ยอดที่ต้องโอน</p>
            <h1>฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1>
            <p>ช่องทาง: {selectedMethod.label}</p>
          </div>

          {method === 'bank_transfer' && (
            <section style={paymentBoxStyle}>
              <strong>ข้อมูลบัญชี</strong>
              <p>ชื่อบัญชี: Platform Demo</p>
              <p>เลขบัญชี: 000-000-0000</p>
              <p>ธนาคาร: Demo Bank</p>
              <p>โอนเสร็จแล้วให้แนบรูปสลิป แล้วกด “เสร็จ”</p>
            </section>
          )}

          {method === 'qr_promptpay' && (
            <section style={paymentBoxStyle}>
              <strong>QR Code</strong>
              <div style={qrBoxStyle}>QR</div>
              <p>สแกน QR แล้วโอนตามยอด ฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
            </section>
          )}

          <label>
            แนบสลิปโอนเงิน
            <input type="file" accept="image/*" onChange={handleSlipChange} style={inputStyle} />
          </label>

          {slipImageData && (
            <section style={previewBoxStyle}>
              <strong>ตัวอย่างสลิป</strong>
              <img src={slipImageData} alt="slip preview" style={{ width: '100%', maxWidth: 320, borderRadius: 12, marginTop: 10 }} />
              <p>{slipImageName}</p>
            </section>
          )}

          <label>
            หมายเหตุ
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม ถ้ามี" style={inputStyle} />
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setStep('select')} style={secondaryButtonStyle}>ย้อนกลับ</button>
            <button type="button" onClick={submitAfterTransfer} disabled={isSubmitting} style={primaryButtonStyle}>
              {isSubmitting ? 'กำลังส่ง...' : 'เสร็จ'}
            </button>
          </div>
          {message && <p>{message}</p>}
        </section>
      )}

      {step === 'waiting' && (
        <section style={panelStyle}>
          <h2>รอแอดมินอนุมัติ</h2>
          <p>รายการของคุณถูกส่งแล้ว สถานะตอนนี้: {pendingRequest?.status ?? 'PENDING'}</p>
          <p>หน้านี้จะเช็กสถานะให้อัตโนมัติทุก 5 วินาที หลังแอดมินอนุมัติจะขึ้นแจ้งเตือนว่าทำรายการสำเร็จ</p>
          <div style={summaryStyle}>
            <p>ยอดรายการ</p>
            <h1>฿{Number(pendingRequest?.amount ?? parsedAmount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1>
          </div>
          {message && <p>{message}</p>}
        </section>
      )}

      {step === 'approved' && (
        <section style={panelStyle}>
          <h2>ทำรายการเสร็จสิ้น ✅</h2>
          <p>แอดมินอนุมัติแล้ว ยอดจะถูกเพิ่มเข้ากระเป๋าเงิน</p>
          <a href="/" style={primaryLinkStyle}>กลับหน้าหลัก</a>
          {message && <p>{message}</p>}
        </section>
      )}

      {step === 'rejected' && (
        <section style={panelStyle}>
          <h2>รายการไม่ผ่าน</h2>
          <p>{message || 'กรุณาตรวจสอบข้อมูลแล้วทำรายการใหม่'}</p>
          <button type="button" onClick={() => setStep('select')} style={primaryButtonStyle}>ทำรายการใหม่</button>
        </section>
      )}

      <h2>ประวัติคำขอ</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => {
          const proof = parseProofNote(item.note);
          return (
            <section key={item.id} style={{ border: '1px solid #ddd', borderRadius: 14, padding: 16 }}>
              <strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
              <p>Status: {item.status}</p>
              <p>สลิป: {proof.slipImageData ? 'แนบแล้ว' : '-'}</p>
              <p>หมายเหตุ: {proof.userNote || '-'}</p>
              {item.adminNote && <p>Admin note: {item.adminNote}</p>}
            </section>
          );
        })}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
}

function parseProofNote(value?: string | null) {
  if (!value) return { userNote: '', slipImageData: '', slipImageName: '' };
  try {
    const data = JSON.parse(value);
    return {
      userNote: typeof data.userNote === 'string' ? data.userNote : '',
      slipImageData: typeof data.slipImageData === 'string' ? data.slipImageData : '',
      slipImageName: typeof data.slipImageName === 'string' ? data.slipImageName : '',
    };
  } catch {
    return { userNote: value, slipImageData: '', slipImageName: '' };
  }
}

function resizeImage(file: File, maxSize: number, quality: number) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('ไม่สามารถอ่านรูปสลิปได้'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('ไม่สามารถอ่านรูปสลิปได้'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านรูปสลิปได้'));
    reader.readAsDataURL(file);
  });
}

const panelStyle = {
  display: 'grid',
  gap: 14,
  border: '1px solid #ddd',
  borderRadius: 16,
  padding: 20,
  marginBottom: 24,
} as const;

const inputStyle = {
  display: 'block',
  width: '100%',
  maxWidth: '100%',
  padding: 10,
  marginTop: 6,
  borderRadius: 10,
  border: '1px solid #ccc',
  boxSizing: 'border-box',
} as const;

const primaryButtonStyle = {
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer',
  background: '#0a84ff',
  color: '#fff',
  border: 0,
} as const;

const primaryLinkStyle = {
  display: 'inline-block',
  textAlign: 'center' as const,
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer',
  background: '#0a84ff',
  color: '#fff',
  border: 0,
  textDecoration: 'none',
} as const;

const secondaryButtonStyle = {
  padding: 12,
  borderRadius: 10,
  cursor: 'pointer',
} as const;

const stepWrapStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 8,
  margin: '18px 0',
} as const;

function stepItemStyle(active: boolean) {
  return {
    padding: 10,
    borderRadius: 12,
    textAlign: 'center' as const,
    border: '1px solid #ddd',
    background: active ? '#0a84ff' : '#fff',
    color: active ? '#fff' : '#111',
  };
}

function amountButtonStyle(active: boolean) {
  return {
    padding: 12,
    borderRadius: 12,
    border: active ? '2px solid #0a84ff' : '1px solid #ddd',
    cursor: 'pointer',
    background: active ? '#e8f2ff' : '#fff',
  };
}

function methodButtonStyle(active: boolean) {
  return {
    display: 'grid',
    gap: 4,
    textAlign: 'left' as const,
    padding: 14,
    borderRadius: 12,
    border: active ? '2px solid #0a84ff' : '1px solid #ddd',
    cursor: 'pointer',
    background: active ? '#e8f2ff' : '#fff',
  };
}

const summaryStyle = {
  border: '1px solid #ddd',
  borderRadius: 14,
  padding: 16,
} as const;

const paymentBoxStyle = {
  border: '1px solid #ddd',
  borderRadius: 14,
  padding: 16,
} as const;

const previewBoxStyle = {
  border: '1px solid #ddd',
  borderRadius: 14,
  padding: 16,
} as const;

const qrBoxStyle = {
  width: 180,
  height: 180,
  border: '1px dashed #999',
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  fontSize: 36,
  margin: '12px 0',
} as const;
