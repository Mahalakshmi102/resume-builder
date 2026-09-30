// ============================================================
// pdfService.ts
// Extracts raw text from uploaded PDFs and DOCX files.
// Supports: text-based PDF, scanned-PDF (graceful error),
//           DOCX (.docx Word documents via mammoth)
// ============================================================
import pdfParse from 'pdf-parse';

// Try to load mammoth — graceful fallback if not installed yet
let mammoth: any = null;
try {
  mammoth = require('mammoth');
} catch {
  console.warn('[pdfService] mammoth not installed — DOCX support disabled');
}

// ──────────────────────────────────────────
// PDF Text Extraction
// ──────────────────────────────────────────
export const extractTextFromPDF = async (buffer: Buffer): Promise<string> => {
  try {
    const data = await pdfParse(buffer);
    let text = data.text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive blank lines
      .replace(/\n{4,}/g, '\n\n\n')
      // Collapse multiple spaces to one (but not newlines)
      .replace(/[ \t]{3,}/g, '  ')
      .trim();

    if (!text || text.length < 30) {
      throw new Error(
        'PDF appears to be scanned or image-based. Please upload a text-based PDF or a DOCX file.'
      );
    }

    return text;
  } catch (error: any) {
    console.error('[PDF] extractTextFromPDF error:', error.message);
    if (error.message.includes('scanned')) throw error;
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

// ──────────────────────────────────────────
// DOCX Text Extraction
// ──────────────────────────────────────────
export const extractTextFromDOCX = async (buffer: Buffer): Promise<string> => {
  if (!mammoth) {
    throw new Error(
      'DOCX support is not available. Please install mammoth (npm install mammoth in backend) or upload a PDF.'
    );
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n')
      .trim();

    if (!text || text.length < 30) {
      throw new Error('DOCX file appears empty or could not be parsed.');
    }

    return text;
  } catch (error: any) {
    console.error('[DOCX] extractTextFromDOCX error:', error.message);
    throw new Error(`DOCX parsing failed: ${error.message}`);
  }
};

// ──────────────────────────────────────────
// Universal extractor (PDF or DOCX)
// ──────────────────────────────────────────
export const extractTextFromFile = async (
  buffer: Buffer,
  mimetype: string
): Promise<string> => {
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    return extractTextFromDOCX(buffer);
  }
  return extractTextFromPDF(buffer);
};

// ──────────────────────────────────────────
// Metadata helper
// ──────────────────────────────────────────
export const getPDFMetadata = async (buffer: Buffer) => {
  try {
    const data = await pdfParse(buffer);
    return {
      numpages: data.numpages,
      wordCount: data.text.split(/\s+/).filter(Boolean).length,
      charCount: data.text.length,
    };
  } catch {
    return { numpages: 0, wordCount: 0, charCount: 0 };
  }
};
