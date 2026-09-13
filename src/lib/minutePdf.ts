/**
 * Joint-minute PDF in memory. Works in Node and in the browser.
 * Avelis does not keep the file.
 */

export type MinutePdfInput = {
  title: string;
  status: string;
  body: string;
  exportedAt: string;
};

function pdfEscape(s: string): string {
  const latin = s.replace(/[^\x20-\x7E]/g, (c) => {
    const map: Record<string, string> = {
      '—': '-',
      '–': '-',
      '’': "'",
      '‘': "'",
      '“': '"',
      '”': '"',
      '…': '...',
    };
    return map[c] || '?';
  });
  return latin.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrapLine(line: string, width = 86): string[] {
  if (!line) return [''];
  const out: string[] = [];
  let rest = line;
  while (rest.length > width) {
    let cut = rest.lastIndexOf(' ', width);
    if (cut < 40) cut = width;
    out.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  out.push(rest);
  return out;
}

function utf8Len(s: string): number {
  return new TextEncoder().encode(s).length;
}

function pageStream(lines: string[], header: string[]): string {
  const cmds = ['BT', '/F1 9 Tf', '50 760 Td', `(${pdfEscape(header[0])}) Tj`, '0 -14 Td', '/F1 11 Tf'];
  for (const line of lines) {
    cmds.push(`(${pdfEscape(line)}) Tj`, '0 -14 Td');
  }
  cmds.push('ET');
  return cmds.join('\n');
}

export function renderMinutePdfBytes(input: MinutePdfInput): Uint8Array {
  const header = [
    `Avelis joint minute  ·  ${input.status}  ·  ${input.exportedAt}`,
    'The joint minute is not a transcript. This file is not stored by Avelis.',
  ];
  const wrapped: string[] = [`Session: ${input.title}`, '', ...header.slice(1), ''];
  for (const raw of input.body.replace(/\r\n/g, '\n').split('\n')) {
    wrapped.push(...wrapLine(raw));
  }
  const perPage = 48;
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += perPage) {
    pages.push(wrapped.slice(i, i + perPage));
  }
  if (pages.length === 0) pages.push(['(empty)']);

  const objects: string[] = [];
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj');
  const kids = pages.map((_, i) => `${3 + i * 2} 0 R`).join(' ');
  objects.push(`2 0 obj << /Type /Pages /Kids [${kids}] /Count ${pages.length} >> endobj`);
  pages.forEach((lines, i) => {
    const pageId = 3 + i * 2;
    const contentId = pageId + 1;
    const stream = pageStream(lines, header);
    objects.push(
      `${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${3 + pages.length * 2} 0 R >> >> >> endobj`
    );
    objects.push(`${contentId} 0 obj << /Length ${utf8Len(stream)} >> stream\n${stream}\nendstream endobj`);
  });
  const fontId = 3 + pages.length * 2;
  objects.push(`${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (const obj of objects) {
    offsets.push(utf8Len(body));
    body += obj + '\n';
  }
  const xrefAt = utf8Len(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += '0000000000 65535 f \n';
  for (let i = 1; i < offsets.length; i++) {
    body += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }
  body += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new TextEncoder().encode(body);
}

export function renderMinutePdf(input: MinutePdfInput): Buffer {
  return Buffer.from(renderMinutePdfBytes(input));
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
