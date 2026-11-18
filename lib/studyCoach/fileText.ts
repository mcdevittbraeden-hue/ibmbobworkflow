/**
 * Extracts text from an uploaded syllabus in the browser: PDF (pdf.js), Word
 * (mammoth) or plain text. The readers load from cdnjs only when a student
 * actually uploads that file type, so they add nothing to the page bundle.
 */

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';
const MAMMOTH = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';

interface PdfTextItem { str: string; transform: number[] }
interface PdfJs {
  getDocument(src: { data: Uint8Array }): {
    promise: Promise<{
      numPages: number;
      getPage(n: number): Promise<{ getTextContent(): Promise<{ items: PdfTextItem[] }> }>;
    }>;
  };
}
interface Mammoth { extractRawText(o: { arrayBuffer: ArrayBuffer }): Promise<{ value: string }> }

declare global {
  interface Window {
    pdfjsLib?: PdfJs;
    pdfjsWorker?: unknown;
    mammoth?: Mammoth;
  }
}

const loading = new Map<string, Promise<void>>();
function loadScript(src: string): Promise<void> {
  if (!loading.has(src)) {
    loading.set(src, new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        loading.delete(src);
        reject(new Error('The file reader could not load. Check your connection, or paste the syllabus text instead.'));
      };
      document.head.append(s);
    }));
  }
  return loading.get(src)!;
}

export async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return pdfToText(file);
  if (name.endsWith('.docx')) return docxToText(file);
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return file.text();
  throw new Error('Upload a PDF, Word (.docx) or text file, or paste the syllabus text instead.');
}

async function pdfToText(file: File): Promise<string> {
  // Loading the worker as a script lets pdf.js run on the main thread, which
  // avoids cross-origin worker restrictions.
  await loadScript(`${PDFJS}/pdf.min.js`);
  await loadScript(`${PDFJS}/pdf.worker.min.js`);
  const pdfjs = window.pdfjsLib;
  if (!pdfjs) throw new Error('The PDF reader did not load. Paste the syllabus text instead.');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    // Rebuild lines from text positions so schedule table rows stay on one line.
    const rows = new Map<number, Array<{ x: number; s: string }>>();
    for (const it of content.items) {
      const y = Math.round(it.transform[5]);
      const key = [...rows.keys()].find((k) => Math.abs(k - y) <= 2) ?? y;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key)!.push({ x: it.transform[4], s: it.str });
    }
    pages.push(
      [...rows.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map((q) => q.s).join(' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n'),
    );
  }
  return pages.join('\n');
}

async function docxToText(file: File): Promise<string> {
  await loadScript(MAMMOTH);
  if (!window.mammoth) throw new Error('The Word reader did not load. Paste the syllabus text instead.');
  const { value } = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return value;
}
