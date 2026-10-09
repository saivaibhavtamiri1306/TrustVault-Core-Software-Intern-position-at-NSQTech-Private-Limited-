import { Injectable } from '@angular/core';
import { Candidate, STAGES, Stage, VaultRecord } from './models';

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/** Builds a clean white "paper" report off-screen, snapshots it with html2canvas and saves it as a PDF. */
@Injectable({ providedIn: 'root' })
export class ReportService {
  async exportCandidate(rec: VaultRecord, c: Candidate, stage: Stage): Promise<void> {
    const h2cMod: any = await import('html2canvas');
    const pdfMod: any = await import('jspdf');
    const html2canvas = h2cMod.default ?? h2cMod;
    const jsPDF = pdfMod.jsPDF ?? pdfMod.default;

    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;padding:48px;background:#fff;color:#0f172a;font-family:Arial,Helvetica,sans-serif';
    const row = (k: string, v: string) => `<tr><td style="padding:8px 0;color:#64748b;width:200px">${k}</td><td style="padding:8px 0;font-weight:bold">${esc(v)}</td></tr>`;
    el.innerHTML = `
      <div style="border-bottom:4px solid #06b6d4;padding-bottom:16px;margin-bottom:24px">
        <div style="font-size:12px;letter-spacing:4px;color:#06b6d4">TRUSTVAULT CORE</div>
        <div style="font-size:28px;font-weight:bold;margin-top:6px">Background Verification Report</div>
        <div style="font-size:12px;color:#64748b;margin-top:6px">Generated ${new Date().toLocaleString()} · DEMO DATA ONLY</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${row('Candidate', c.name)}${row('Applied role', c.role)}${row('Candidate ID', c.id)}
        ${row('Aadhaar (masked)', c.aadhaar.replace(/\d(?=(?:\D*\d){4})/g, 'X'))}
        ${row('Source document', `${rec.title} (${rec.id})`)}${row('Clearance', rec.level)}
        ${row('Data integrity score', c.score + '%')}${row('Verification stage', `${STAGES[stage]} (${stage + 1} of 4)`)}
      </table>
      <div style="margin-top:32px;display:flex;gap:8px">${STAGES.map((s, i) =>
        `<div style="flex:1;padding:10px;text-align:center;font-size:12px;border-radius:6px;background:${i <= stage ? '#06b6d4' : '#e2e8f0'};color:${i <= stage ? '#fff' : '#64748b'}">${s}</div>`).join('')}</div>
      <p style="margin-top:40px;font-size:11px;color:#94a3b8">This document is part of a demonstration. All names and numbers are fictional.</p>`;
    document.body.appendChild(el);
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      const w = pdf.internal.pageSize.getWidth();
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, (canvas.height * w) / canvas.width);
      pdf.save(`TrustVault-${c.id}-report.pdf`);
    } finally { el.remove(); }
  }
}
