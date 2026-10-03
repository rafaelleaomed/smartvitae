/**
 * Validador e Sanitizador de Arquivos de Upload
 * Previne ataques de Unrestricted File Upload, Path Traversal e Executáveis camuflados
 */

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFileName: string;
  detectedType?: "pdf" | "docx" | "jpeg" | "png";
  reason?: string;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Sanitiza o nome do arquivo para prevenir Path Traversal e injeções de caracteres especiais
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName) return `doc_${Date.now()}`;

  // Extrai apenas o nome base ignorando diretórios e barras
  const baseName = rawName.split(/[/\\]/).pop() || rawName;

  // Substitui caracteres potencialmente perigosos por underscore, mantendo letras, números, ponto, hífen e underscore
  const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");

  // Garante que não comece com ponto (arquivos ocultos) e não tenha múltiplos pontos consecutivos (traversal)
  return safeName.replace(/^\.+/, "").replace(/\.{2,}/g, ".");
}

/**
 * Valida a assinatura de bytes (Magic Bytes) do buffer recebido
 */
export function detectMagicBytes(bytes: Uint8Array): "pdf" | "docx" | "jpeg" | "png" | null {
  if (bytes.length < 4) return null;

  // PDF: %PDF- (0x25, 0x50, 0x44, 0x46)
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "pdf";
  }

  // PNG: \x89PNG (0x89, 0x50, 0x4E, 0x47)
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return "png";
  }

  // JPEG: \xFF\xD8\xFF (0xFF, 0xD8, 0xFF)
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  // DOCX / ZIP: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
    return "docx";
  }

  return null;
}

/**
 * Validação rigorosa de arquivo de upload
 */
export function validateUploadedFile(
  file: File | { name: string; size: number },
  bytes: Uint8Array
): FileValidationResult {
  const sanitizedFileName = sanitizeFileName(file.name);

  // 1. Limite de tamanho de arquivo
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      sanitizedFileName,
      reason: `Arquivo excede o limite máximo permitido de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`,
    };
  }

  if (file.size === 0 || bytes.length === 0) {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "O arquivo enviado está vazio.",
    };
  }

  // 2. Verificação de extensão permitida
  const lowerName = sanitizedFileName.toLowerCase();
  const hasAllowedExt =
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".jpg") ||
    lowerName.endsWith(".jpeg") ||
    lowerName.endsWith(".png");

  if (!hasAllowedExt) {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "Extensão de arquivo não permitida. Envie arquivos PDF, DOCX, JPG ou PNG.",
    };
  }

  // 3. Verificação de Magic Bytes
  const detected = detectMagicBytes(bytes);
  if (!detected) {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "O conteúdo do arquivo não corresponde a uma assinatura válida de PDF, DOCX ou imagem suportada.",
    };
  }

  // 4. Checagem de coerência entre extensão e magic bytes
  if (lowerName.endsWith(".pdf") && detected !== "pdf") {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "Arquivo com extensão .pdf possui assinatura binária incompatível.",
    };
  }

  if (lowerName.endsWith(".docx") && detected !== "docx") {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "Arquivo com extensão .docx possui assinatura binária incompatível.",
    };
  }

  if ((lowerName.endsWith(".png") && detected !== "png") || ((lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) && detected !== "jpeg")) {
    return {
      isValid: false,
      sanitizedFileName,
      reason: "Arquivo de imagem possui assinatura binária incompatível com sua extensão.",
    };
  }

  return {
    isValid: true,
    sanitizedFileName,
    detectedType: detected,
  };
}
