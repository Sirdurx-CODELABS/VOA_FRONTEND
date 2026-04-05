'use client';
import { useState } from 'react';
import { Contribution } from '@/types';
import { Modal } from './Modal';
import { VOALogoSVG } from './VOALogo';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

function formatMonth(month: string) {
  const [y, m] = month.split('-');
  return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function safeDate(d?: string) {
  if (!d) return 'N/A';
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? 'N/A' : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ReceiptCard({ contribution }: { contribution: Contribution }) {
  const verifyUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/verify/receipt/${contribution._id}`
    : `https://voa.org/verify/receipt/${contribution._id}`;

  return (
    <div
      id="voa-receipt"
      style={{
        width: 380, background: '#ffffff',
        fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(30,58,138,0.15)',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e4db7 100%)', padding: '20px 24px 16px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <VOALogoSVG size={36} onDark />
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', color: '#F97316' }}>VOICE OF ADOLESCENTS</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.05em' }}>OFFICIAL CONTRIBUTION RECEIPT</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.05em' }}>RECEIPT</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>#{contribution.receiptNumber || 'PENDING'}</div>
          </div>
          <div style={{ background: '#22C55E', color: 'white', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.1em' }}>
            ✓ VERIFIED
          </div>
        </div>
      </div>

      {/* Orange accent */}
      <div style={{ height: 4, background: 'linear-gradient(90deg, #F97316, #fb923c, #22C55E)' }} />

      {/* Body */}
      <div style={{ padding: '20px 24px' }}>
        {/* Member info */}
        <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Member Details</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#1E3A8A' }}>{contribution.userId?.fullName || 'N/A'}</div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{contribution.userId?.email}</div>
        </div>

        {/* Amount */}
        <div style={{ textAlign: 'center', padding: '14px 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount Paid</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#22C55E', marginTop: 4 }}>
            ₦{contribution.amount?.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>For: {formatMonth(contribution.month)}</div>
          {contribution.isAboveMinimum && contribution.extraAmount > 0 && (
            <div style={{ marginTop: 6, display: 'inline-block', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '3px 10px' }}>
              <span style={{ fontSize: 9, color: '#ea580c', fontWeight: 700 }}>
                ❤️ Extra Support: +₦{contribution.extraAmount?.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Minimum Required', value: `₦${contribution.minimumRequiredAmount?.toLocaleString() || 'N/A'}` },
            { label: 'Amount Paid', value: `₦${contribution.amount?.toLocaleString()}` },
            { label: 'Payment Method', value: (contribution.paymentMethod || 'N/A').replace(/_/g, ' ') },
            { label: 'Payment Date', value: safeDate(contribution.approvedAt) },
            { label: 'Approved By', value: contribution.approvedBy?.fullName || 'N/A' },
            { label: 'Points Awarded', value: `+${contribution.pointsAwarded || 0} pts` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '8px 10px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 8, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginTop: 2, textTransform: 'capitalize' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* QR */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ background: 'white', padding: 6, borderRadius: 8, border: '1px solid #e2e8f0', lineHeight: 0 }}>
            <QRCodeCanvas value={verifyUrl} size={60} level="M" />
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
          <div style={{ fontSize: 9, color: '#94a3b8', fontStyle: 'italic' }}>&ldquo;Empowering Voices. Building Futures.&rdquo;</div>
          <div style={{ fontSize: 8, color: '#cbd5e1', marginTop: 4 }}>voa.org · This receipt is computer-generated and valid without signature</div>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({ contribution, open, onClose }: { contribution: Contribution; open: boolean; onClose: () => void }) {
  const [exporting, setExporting] = useState(false);

  const handleDownloadPNG = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = document.getElementById('voa-receipt');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const link = document.createElement('a');
      link.download = `VOA-Receipt-${contribution.receiptNumber || contribution._id}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Receipt downloaded!');
    } catch { toast.error('Download failed'); }
    finally { setExporting(false); }
  };

  const handleDownloadPDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;
      const el = document.getElementById('voa-receipt');
      if (!el) return;
      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: '#ffffff', logging: false });
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgW = 100, imgH = (canvas.height / canvas.width) * imgW;
      const x = (210 - imgW) / 2, y = 20;
      pdf.addImage(canvas.toDataURL('image/png', 1.0), 'PNG', x, y, imgW, imgH);
      pdf.save(`VOA-Receipt-${contribution.receiptNumber || contribution._id}.pdf`);
      toast.success('PDF downloaded!');
    } catch { toast.error('PDF failed'); }
    finally { setExporting(false); }
  };

  const handlePrint = () => {
    const el = document.getElementById('voa-receipt');
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>VOA Receipt</title>
    <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f8fafc;padding:20px;}@media print{body{background:white;padding:0;}}</style>
    </head><body>${el.outerHTML}<script>window.onload=()=>{window.print();}<\/script></body></html>`);
    win.document.close();
  };

  return (
    <Modal open={open} onClose={onClose} title="Contribution Receipt" size="md">
      <div className="space-y-5">
        <div className="flex justify-center overflow-x-auto py-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <ReceiptCard contribution={contribution} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'PNG', icon: Download, action: handleDownloadPNG, color: 'text-[#1E3A8A]' },
            { label: 'PDF', icon: FileText, action: handleDownloadPDF, color: 'text-[#22C55E]' },
            { label: 'Print', icon: Printer, action: handlePrint, color: 'text-slate-500' },
          ].map(({ label, icon: Icon, action, color }) => (
            <button key={label} onClick={action} disabled={exporting}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-all disabled:opacity-50">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
