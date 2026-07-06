'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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

type Step = 'select' | 'pay' | 'done';

const AMOUNTS = [100, 300, 500, 1000, 3000, 5000];

const METHODS = [
  {
    code: 'bank_transfer',
    label: 'โอนธนาคาร',
    title: 'บัญชีรับเงิน',
    detail: 'กรุณาโอนตามยอดที่เลือก แล้วกดเสร็จสิ้น',
  },
  {
    code: 'manual',
    label: 'Manual',
    title: 'Manual Top Up',
    detail: 'ส่งคำขอให้แอดมินตรวจสอบและปรับยอด',
  },
];

export default function DepositPage() {
  const [step, setStep] = useState<Step>('select');
  const [amount, setAmount] = useState('500');
  const [method, setMethod] = useState('bank_transfer');
  const [referenceCode, setReferenceCode] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<TopUpItem[]>([]);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

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

  function goToPay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage('กรุณาเลือกหรือใส่จำนวนเงินมากกว่า 0');
      return;
    }

    setMessage('');
    setStep('pay');
  }

  async function finishTopUp() {
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage('กรุณาเลือกหรือใส่จำนวนเงินมากกว่า 0');
      setStep('select');
      return;
    }

    const token = window.localStorage.getItem('member_access_token');
    if (!token) {
      setMessage('กรุณาเข้าสู่ระบบก่อนทำรายการ');
      return;
    }

    setIsSubmitting(true);
    setMessage('กำลังส่งคำขอให้แอดมินตรวจสอบ...');

    const res = await fetch(`${API_URL}/member/topups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: parsedAmount, method, referenceCode, note }),
    });

    const data = await res.json().catch(() => null);
    setIsSubmitting(false);

    if (!res.ok) {
      setMessage(data?.message ?? 'ส่งคำขอไม่สำเร็จ');
      return;
    }

    setReferenceCode('');
    setNote('');
    setMessage('ส่งคำขอสำเร็จ รอแอดมินตรวจสอบและอนุมัติ');
    setItems((current) => [data, ...current]);
    setStep('done');
  }

  return (
    <main style={{ maxWidth: 980, margin: '32px auto', padding: 24 }}>
      <a href="/">← หน้าแรก</a>
      <h1>ฝากเงิน / เติมเงิน</h1>
      <p>เลือกยอด เลือกวิธีทำรายการ แล้วกดเสร็จสิ้นหลังทำรายการเรียบร้อย</p>

      <section style={stepWrapStyle}>
        <div style={stepItemStyle(step === 'select')}>1 เลือกยอด</div>
        <div style={stepItemStyle(step === 'pay')}>2 ทำรายการ</div>
        <div style={stepItemStyle(step === 'done')}>3 รอตรวจสอบ</div>
      </section>

      {step === 'select' && (
        <form onSubmit={goToPay} style={panelStyle}>
          <h2>เลือกจำนวนเงิน</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                style={amountButtonStyle(amount === String(value))}
              >
                ฿{value.toLocaleString('th-TH')}
              </button>
            ))}
          </div>

          <label>
            หรือใส่จำนวนเอง
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="เช่น 500" inputMode="decimal" style={inputStyle} />
          </label>

          <h2>เลือกวิธีการทำรายการ</h2>
          <div style={{ display: 'grid', gap: 10 }}>
            {METHODS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setMethod(item.code)}
                style={methodButtonStyle(method === item.code)}
              >
                <strong>{item.label}</strong>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>

          <button type="submit" style={primaryButtonStyle}>เติมเงิน</button>
          {message && <p>{message}</p>}
        </form>
      )}

      {step === 'pay' && (
        <section style={panelStyle}>
          <h2>ทำรายการตามข้อมูลนี้</h2>
          <div style={summaryStyle}>
            <p>ยอดที่ต้องทำรายการ</p>
            <h1>฿{parsedAmount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</h1>
            <p>วิธี: {selectedMethod.label}</p>
          </div>

          <section style={{ border: '1px solid #ddd', borderRadius: 14, padding: 16 }}>
            <strong>{selectedMethod.title}</strong>
            <p>{selectedMethod.detail}</p>
            {method === 'bank_transfer' && (
              <div>
                <p>ชื่อบัญชี: Platform Demo</p>
                <p>เลขบัญชี: 000-000-0000</p>
                <p>ธนาคาร: Demo Bank</p>
              </div>
            )}
          </section>

          <label>
            Reference / เลขอ้างอิง
            <input value={referenceCode} onChange={(e) => setReferenceCode(e.target.value)} placeholder="เช่น เลขสลิป" style={inputStyle} />
          </label>
          <label>
            หมายเหตุ
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="รายละเอียดเพิ่มเติม" style={inputStyle} />
          </label>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setStep('select')} style={secondaryButtonStyle}>ย้อนกลับ</button>
            <button type="button" onClick={finishTopUp} disabled={isSubmitting} style={primaryButtonStyle}>
              {isSubmitting ? 'กำลังส่ง...' : 'เสร็จสิ้น'}
            </button>
          </div>
          {message && <p>{message}</p>}
        </section>
      )}

      {step === 'done' && (
        <section style={panelStyle}>
          <h2>ส่งคำขอแล้ว</h2>
          <p>รายการของคุณอยู่ในสถานะ PENDING รอแอดมินตรวจสอบและอนุมัติ</p>
          <button type="button" onClick={() => setStep('select')} style={primaryButtonStyle}>เติมเงินอีกครั้ง</button>
          {message && <p>{message}</p>}
        </section>
      )}

      <h2>ประวัติคำขอ</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {items.map((item) => (
          <section key={item.id} style={{ border: '1px solid #ddd', borderRadius: 14, padding: 16 }}>
            <strong>{item.currency} {Number(item.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</strong>
            <p>Status: {item.status}</p>
            <p>Ref: {item.referenceCode || '-'}</p>
            <p>Note: {item.note || '-'}</p>
            {item.adminNote && <p>Admin note: {item.adminNote}</p>}
          </section>
        ))}
        {items.length === 0 && <p>ยังไม่มีรายการ</p>}
      </div>
    </main>
  );
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
