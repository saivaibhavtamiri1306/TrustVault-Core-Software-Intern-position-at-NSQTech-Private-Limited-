import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CsvService {
  download(filename: string, headers: string[], rows: (string | number)[][]): void {
    const cell = (v: string | number) => {
      let s = String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s; // blocks spreadsheet formula injection
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [headers, ...rows].map(r => r.map(cell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
