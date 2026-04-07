// src/admin/services/exportService.ts
// Generic data-export utilities for the admin dashboard.

import { toast } from 'sonner';

/**
 * Download an array of objects as a CSV file.
 * Each object's keys become the column headers.
 */
export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data?.length) {
    toast.error('No data to export');
    return;
  }
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const v = row[h];
        const str = v == null ? '' : String(v);
        // Wrap in quotes if it contains commas, double-quotes, or newlines
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows to ${a.download}`);
}

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function downloadPDF(data: Record<string, unknown>[], filename: string, title?: string): void {
  if (!data?.length) {
    toast.error('No data to export');
    return;
  }
  
  const doc = new jsPDF('landscape');
  
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 20);
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((h) => {
    const v = row[h];
    return v == null ? '' : String(v);
  }));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 30 : 20,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [196, 30, 58], textColor: 255 },
  });

  const exactFilename = `${filename}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(exactFilename);
  toast.success(`Exported PDF: ${exactFilename}`);
}

/**
 * Convert Firestore Timestamp / seconds-based objects / ISO strings
 * into a plain JS Date. Returns null if conversion fails.
 */
export function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Firestore Timestamp (has .toDate())
  if (typeof (value as any)?.toDate === 'function') return (value as any).toDate();
  // Firestore-style { seconds, nanoseconds }
  if (typeof (value as any)?.seconds === 'number')
    return new Date((value as any).seconds * 1000);
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Format a date-like value as a locale date string (en-IN).
 */
export function formatDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return 'N/A';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Format a date-like value as a locale date+time string (en-IN).
 */
export function formatDateTime(value: unknown): string {
  const d = toDate(value);
  if (!d) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Convert a date-like value to an ISO date string (YYYY-MM-DD).
 */
export function toDateString(value: unknown): string {
  const d = toDate(value);
  if (!d) return '';
  return d.toISOString().split('T')[0];
}
