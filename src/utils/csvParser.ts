/**
 * Robust CSV Parser & Serializer Utility for Hospital Inventory Database
 */

export function parseCsv<T = Record<string, any>>(csvText: string): T[] {
  if (!csvText || !csvText.trim()) return [];

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped double-quote
      } else if (char === '"') {
        insideQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r' && nextChar === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++; // skip \n
      } else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
      } else {
        currentField += char;
      }
    }
  }

  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.some(f => f.trim() !== '')).map(row => {
    const obj: any = {};
    headers.forEach((h, idx) => {
      const rawVal = row[idx] !== undefined ? row[idx] : '';
      if (rawVal === '') {
        obj[h] = '';
      } else if (/^-?\d+(\.\d+)?$/.test(rawVal)) {
        obj[h] = Number(rawVal);
      } else if (rawVal.toLowerCase() === 'true') {
        obj[h] = true;
      } else if (rawVal.toLowerCase() === 'false') {
        obj[h] = false;
      } else if ((rawVal.startsWith('{') && rawVal.endsWith('}')) || (rawVal.startsWith('[') && rawVal.endsWith(']'))) {
        try {
          obj[h] = JSON.parse(rawVal);
        } catch {
          obj[h] = rawVal;
        }
      } else {
        obj[h] = rawVal;
      }
    });
    return obj as T;
  });
}

export function toCsvString(rows: any[], headers?: string[]): string {
  if (!rows || rows.length === 0) return '';
  const cols = headers || Object.keys(rows[0]);

  const escapeCell = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      str = '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };

  const headerLine = cols.join(',');
  const lines = rows.map(row => cols.map(c => escapeCell(row[c])).join(','));
  return [headerLine, ...lines].join('\n');
}

/**
 * Initiates browser file download for CSV, SQL, or text content
 */
export function downloadFile(filename: string, content: string, mimeType = 'text/csv;charset=utf-8;'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates an Excel-compatible XML Spreadsheet or HTML table (.xls format)
 */
export function downloadAsExcelXls(filename: string, sheetName: string, rows: any[], headers?: string[]): void {
  if (!rows || rows.length === 0) return;
  const cols = headers || Object.keys(rows[0]);

  let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
  html += `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>`;
  html += `<x:Name>${sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>`;
  html += `<table border="1"><thead><tr>`;
  for (const c of cols) {
    html += `<th style="background-color:#0f172a;color:#ffffff;font-weight:bold;padding:8px;font-family:sans-serif;">${c}</th>`;
  }
  html += `</tr></thead><tbody>`;

  for (const row of rows) {
    html += `<tr>`;
    for (const c of cols) {
      const val = row[c] === null || row[c] === undefined ? '' : typeof row[c] === 'object' ? JSON.stringify(row[c]) : row[c];
      html += `<td style="padding:6px;font-family:sans-serif;">${val}</td>`;
    }
    html += `</tr>`;
  }

  html += `</tbody></table></body></html>`;

  downloadFile(filename.endsWith('.xls') ? filename : `${filename}.xls`, html, 'application/vnd.ms-excel;charset=utf-8;');
}
