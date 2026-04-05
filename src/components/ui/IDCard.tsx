'use client';
import { useState, useRef } from 'react';
import { User } from '@/types';
import { getInitials } from '@/lib/utils';
import { Modal } from './Modal';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, RotateCcw, FileImage, FileText } from 'lucide-react';
import { VOALogoSVG } from './VOALogo';
import toast from 'react-hot-toast';

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function memberID(user: User) {
  const year = user.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const id = (user._id || '000000').slice(-6).toUpperCase();
  return `VOA-${year}-${id}`;
}

function safeDate(dateStr?: string) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function roleLabel(user: User) {
  return `${user.isVice ? 'Vice ' : ''}${(user.role || 'member').replace(/_/g, ' ')}`;
}

/* ── Card dimensions (CR80 ratio: 85.6 × 54mm → 856 × 540px at 10x) ─────── */
const W = 428; // px at 5x scale for screen
const H = 270;

/* ── FRONT CARD ──────────────────────────────────────────────────────────── */
function CardFront({ user, id: mid }: { user: User; id: string }) {
  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${user._id}` : `https://voa.org/verify/${user._id}`;
  const role = roleLabel(user);

  return (
    <div
      id="voa-card-front"
      style={{
        width: W, height: H, position: 'relative', overflow: 'hidden',
        borderRadius: 14, fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        background: 'linear-gradient(135deg, #0f2460 0%, #1E3A8A 45%, #1a4fa8 100%)',
        color: 'white', flexShrink: 0, boxShadow: '0 8px 32px rgba(30,58,138,0.45)',
      }}
    >
      {/* Watermark */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%) rotate(-25deg)', opacity: 0.03, fontSize: 110, fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: 8, pointerEvents: 'none', userSelect: 'none' }}>VOA</div>

      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(249,115,22,0.12)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(34,197,94,0.08)', pointerEvents: 'none' }} />

      {/* Top orange bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #F97316 0%, #fb923c 60%, #22C55E 100%)' }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px 6px' }}>
        <VOALogoSVG size={38} onDark />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: '#F97316', lineHeight: 1 }}>VOICE OF ADOLESCENTS</div>
          <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', marginTop: 1 }}>MEMBER IDENTIFICATION CARD</div>
        </div>
        <div style={{ textAlign: 'right', fontSize: 7.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
          <div style={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)' }}>{mid}</div>
          <div>Valid: {new Date().getFullYear()}</div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />

      {/* Body */}
      <div style={{ display: 'flex', gap: 12, padding: '10px 16px 8px' }}>
        {/* Avatar */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt={user.fullName}
              crossOrigin="anonymous"
              style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', border: '2.5px solid rgba(249,115,22,0.7)', display: 'block' }}
            />
          ) : (
            <div style={{ width: 68, height: 68, borderRadius: 10, background: 'rgba(249,115,22,0.18)', border: '2.5px solid rgba(249,115,22,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#F97316' }}>
              {getInitials(user.fullName || 'V O')}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.status === 'active' ? '#22C55E' : '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', textTransform: 'capitalize' }}>{user.status || 'active'}</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <div style={{ fontSize: 15, fontWeight: 800, lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.fullName || 'Member Name'}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(249,115,22,0.22)', border: '1px solid rgba(249,115,22,0.45)', borderRadius: 5, padding: '2px 7px', fontSize: 8, fontWeight: 700, color: '#F97316', textTransform: 'uppercase', letterSpacing: '0.06em', width: 'fit-content' }}>
            {role}
          </div>
          <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginTop: 2 }}>
            {user.email ? <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉ {user.email}</div> : null}
            {user.phone ? <div>📞 {user.phone}</div> : null}
            <div>📅 Joined: {safeDate(user.createdAt)}</div>
            <div>⭐ Score: {user.engagementScore ?? 0} pts</div>
          </div>
        </div>

        {/* QR */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ background: 'white', padding: 4, borderRadius: 6, lineHeight: 0 }}>
            <QRCodeCanvas value={verifyUrl} size={52} level="M" />
          </div>
          <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.3 }}>Scan to<br />verify</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.3)', padding: '5px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>&ldquo;Empowering Voices. Building Futures.&rdquo;</div>
        <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.35)' }}>voa.org</div>
      </div>
    </div>
  );
}

/* ── BACK CARD ───────────────────────────────────────────────────────────── */
function CardBack({ user, id: mid }: { user: User; id: string }) {
  const verifyUrl = typeof window !== 'undefined' ? `${window.location.origin}/verify/${user._id}` : `https://voa.org/verify/${user._id}`;

  return (
    <div
      id="voa-card-back"
      style={{
        width: W, height: H, position: 'relative', overflow: 'hidden',
        borderRadius: 14, fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: 'white', flexShrink: 0, boxShadow: '0 8px 32px rgba(30,58,138,0.45)',
      }}
    >
      {/* Bottom orange bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg, #22C55E 0%, #F97316 60%, #F97316 100%)' }} />

      {/* Decorative */}
      <div style={{ position: 'absolute', top: -50, left: -50, width: 160, height: 160, borderRadius: '50%', background: 'rgba(30,58,138,0.3)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: 20, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(249,115,22,0.08)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 16px 8px' }}>
        <VOALogoSVG size={34} onDark />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#F97316' }}>VOICE OF ADOLESCENTS</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em' }}>NGO Registration · Est. 2021</div>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 16px' }} />

      {/* Body */}
      <div style={{ display: 'flex', gap: 14, padding: '10px 16px 8px', alignItems: 'flex-start' }}>
        {/* Left: text */}
        <div style={{ flex: 1, fontSize: 8, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>MEMBERSHIP TERMS</div>
          <div>• This card remains the property of VOA</div>
          <div>• Must be returned upon request</div>
          <div>• Not transferable to another person</div>
          <div>• Valid for current membership year only</div>
          <div style={{ marginTop: 6, fontSize: 7.5, color: 'rgba(255,255,255,0.4)' }}>
            Card No: <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>{mid}</span>
          </div>
          <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)' }}>
            Issued: {new Date().getFullYear()} · Expires: {new Date().getFullYear() + 1}
          </div>
        </div>

        {/* Right: QR + signature */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ background: 'white', padding: 4, borderRadius: 6, lineHeight: 0 }}>
            <QRCodeCanvas value={verifyUrl} size={56} level="H" />
          </div>
          <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>Verification QR</div>

          {/* Signature line */}
          <div style={{ marginTop: 4, borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 4, width: 80, textAlign: 'center' }}>
            <div style={{ fontSize: 6.5, color: 'rgba(255,255,255,0.35)' }}>Authorized Signature</div>
          </div>
        </div>
      </div>

      {/* Motto */}
      <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, textAlign: 'center', fontSize: 7.5, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', letterSpacing: '0.05em' }}>
        &ldquo;Empowering Voices. Building Futures.&rdquo; · voa.org
      </div>
    </div>
  );
}

/* ── Export helpers ──────────────────────────────────────────────────────── */
async function captureElement(id: string): Promise<HTMLCanvasElement | null> {
  const el = document.getElementById(id);
  if (!el) return null;
  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(el, {
    scale: 3,
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 5000,
  });
}

async function downloadPNG(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png', 1.0);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/* ── Main Modal ──────────────────────────────────────────────────────────── */
export function IDCardModal({ user, open, onClose }: { user: User; open: boolean; onClose: () => void }) {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [exporting, setExporting] = useState<string | null>(null);
  const mid = memberID(user);
  const name = (user.fullName || 'Member').replace(/\s+/g, '-');

  const handleExportPNG = async (which: 'front' | 'back' | 'both') => {
    setExporting(`png-${which}`);
    try {
      if (which === 'front' || which === 'both') {
        setSide('front');
        await new Promise(r => setTimeout(r, 200));
        const c = await captureElement('voa-card-front');
        if (c) await downloadPNG(c, `VOA-ID-Front-${name}.png`);
      }
      if (which === 'back' || which === 'both') {
        setSide('back');
        await new Promise(r => setTimeout(r, 200));
        const c = await captureElement('voa-card-back');
        if (c) await downloadPNG(c, `VOA-ID-Back-${name}.png`);
      }
      toast.success('Downloaded successfully!');
    } catch (e) {
      console.error(e);
      toast.error('Export failed. Please try again.');
    } finally { setExporting(null); }
  };

  const handleExportPDF = async () => {
    setExporting('pdf');
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        captureElement('voa-card-front'),
        captureElement('voa-card-back'),
      ]);
      if (!frontCanvas || !backCanvas) throw new Error('Canvas capture failed');

      const jsPDF = (await import('jspdf')).default;
      // A4 landscape: 297 × 210mm — center card (85.6 × 54mm)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = 297, pageH = 210;
      const cardW = 85.6, cardH = 54;
      const x = (pageW - cardW) / 2, y = (pageH - cardH) / 2;

      pdf.addImage(frontCanvas.toDataURL('image/png', 1.0), 'PNG', x, y, cardW, cardH);
      pdf.addPage();
      pdf.addImage(backCanvas.toDataURL('image/png', 1.0), 'PNG', x, y, cardW, cardH);
      pdf.save(`VOA-ID-Card-${name}.pdf`);
      toast.success('PDF downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed.');
    } finally { setExporting(null); }
  };

  const handlePrint = () => {
    const frontEl = document.getElementById('voa-card-front');
    const backEl = document.getElementById('voa-card-back');
    if (!frontEl || !backEl) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>VOA ID Card — ${user.fullName}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:#f8fafc;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;gap:24px;padding:24px;font-family:system-ui,sans-serif}
      .label{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px;text-align:center}
      @media print{body{background:white;padding:0;gap:16px}@page{size:A4;margin:20mm}}
    </style></head><body>
    <div><div class="label">Front</div>${frontEl.outerHTML}</div>
    <div><div class="label">Back</div>${backEl.outerHTML}</div>
    <script>window.onload=()=>{window.print();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <Modal open={open} onClose={onClose} title="VOA Member ID Card" size="xl">
      <div className="space-y-5">
        {/* Member ID */}
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Member ID</p>
            <p className="text-base font-extrabold text-[#1E3A8A] dark:text-blue-400 font-mono">{mid}</p>
          </div>
          {/* Side toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
            {(['front', 'back'] as const).map(s => (
              <button key={s} onClick={() => setSide(s)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${side === s ? 'bg-[#1E3A8A] text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Card preview — both rendered, only one visible */}
        <div className="flex justify-center overflow-x-auto py-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl">
          <div style={{ display: side === 'front' ? 'block' : 'none' }}>
            <CardFront user={user} id={mid} />
          </div>
          <div style={{ display: side === 'back' ? 'block' : 'none' }}>
            <CardBack user={user} id={mid} />
          </div>
          {/* Hidden render of the other side for export */}
          <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
            {side === 'front' ? <CardBack user={user} id={mid} /> : <CardFront user={user} id={mid} />}
          </div>
        </div>

        {/* Export actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button onClick={() => handleExportPNG('front')} disabled={!!exporting}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-all disabled:opacity-50 group">
            <FileImage className="w-5 h-5 text-[#1E3A8A] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Front PNG</span>
          </button>
          <button onClick={() => handleExportPNG('back')} disabled={!!exporting}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#F97316] hover:bg-[#F97316]/5 transition-all disabled:opacity-50 group">
            <FileImage className="w-5 h-5 text-[#F97316] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Back PNG</span>
          </button>
          <button onClick={handleExportPDF} disabled={!!exporting}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#22C55E] hover:bg-[#22C55E]/5 transition-all disabled:opacity-50 group">
            <FileText className="w-5 h-5 text-[#22C55E] group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">PDF (Both)</span>
          </button>
          <button onClick={handlePrint} disabled={!!exporting}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 group">
            <Printer className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Print</span>
          </button>
        </div>

        {exporting && (
          <p className="text-center text-xs text-slate-400 animate-pulse">
            Generating {exporting}... please wait
          </p>
        )}

        <p className="text-center text-xs text-slate-400">
          Valid for {new Date().getFullYear()} · Present at VOA events for verification
        </p>
      </div>
    </Modal>
  );
}
