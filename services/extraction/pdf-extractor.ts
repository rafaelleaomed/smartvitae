import { extractText } from "unpdf";
import { ExtractedDocument, ExtractedPage } from "./types";

/**
 * Extrator Nativo de PDF
 * Executa parsing local sem dependência de binários externos ou serviços de OCR pagos
 * quando o PDF contiver texto nativo selecionável.
 */
export async function extractPdfText(buffer: Uint8Array): Promise<ExtractedDocument> {
  try {
    const { text, totalPages } = await extractText(buffer);

    const pages: ExtractedPage[] = text.map((pageText, index) => ({
      pageNumber: index + 1,
      text: pageText.trim(),
      charCount: pageText.trim().length,
    }));

    const fullText = pages.map((p) => p.text).join("\n\n");

    return {
      text: fullText,
      pageCount: totalPages,
      pages,
      sourceType: "upload",
      mimeType: "application/pdf",
    };
  } catch (error: any) {
    throw new Error(`Falha na extração de texto do PDF: ${error.message}`);
  }
}
