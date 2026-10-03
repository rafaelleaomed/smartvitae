import { describe, it, expect } from "vitest";
import { validateSafePublicUrl } from "@/lib/security/url-validator";
import { validateUploadedFile, sanitizeFileName, detectMagicBytes } from "@/lib/security/file-validator";

describe("Segurança: Validador de URLs e Proteção contra SSRF", () => {
  it("deve permitir URLs públicas válidas e seguras (HTTPS e HTTP)", () => {
    const validUrls = [
      "https://www.linkedin.com/jobs/view/123456789",
      "https://gupy.io/vagas/123",
      "http://example.com/careers/analyst",
    ];

    for (const url of validUrls) {
      const result = validateSafePublicUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBeDefined();
    }
  });

  it("deve bloquear requisições para localhost e loopback (IPv4 e IPv6)", () => {
    const dangerousUrls = [
      "http://localhost:3000/api/keys",
      "http://127.0.0.1:8080/admin",
      "http://127.0.0.2:80",
      "http://[::1]:5000",
      "http://app.localhost/secret",
    ];

    for (const url of dangerousUrls) {
      const result = validateSafePublicUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBeDefined();
    }
  });

  it("deve bloquear acessos a serviços de metadados de nuvem (AWS/GCP/Azure)", () => {
    const metadataUrls = [
      "http://169.254.169.254/latest/meta-data/",
      "http://metadata.google.internal/computeMetadata/v1/",
    ];

    for (const url of metadataUrls) {
      const result = validateSafePublicUrl(url);
      expect(result.isValid).toBe(false);
    }
  });

  it("deve bloquear faixas de IP privadas RFC 1918 (10.x, 172.16-31.x, 192.168.x)", () => {
    const privateUrls = [
      "http://10.0.0.1/internal-status",
      "http://172.16.0.5:9000",
      "http://172.31.255.254",
      "http://192.168.1.1/router",
    ];

    for (const url of privateUrls) {
      const result = validateSafePublicUrl(url);
      expect(result.isValid).toBe(false);
    }
  });

  it("deve bloquear protocolos arbitrários (file://, gopher://, ftp://)", () => {
    const badProtocols = [
      "file:///etc/passwd",
      "gopher://evil.com",
      "ftp://anonymous@ftp.example.com",
    ];

    for (const url of badProtocols) {
      const result = validateSafePublicUrl(url);
      expect(result.isValid).toBe(false);
    }
  });
});

describe("Segurança: Validador de Upload de Arquivos", () => {
  it("deve sanitizar nomes de arquivos com tentativas de path traversal", () => {
    expect(sanitizeFileName("../../../etc/passwd.pdf")).toBe("passwd.pdf");
    expect(sanitizeFileName("..\\..\\windows\\system32\\cmd.exe.pdf")).toBe("cmd.exe.pdf");
    expect(sanitizeFileName("curriculo & teste (1) [final].pdf")).toBe("curriculo___teste__1___final_.pdf");
  });

  it("deve detectar magic bytes de arquivos permitidos", () => {
    // PDF magic bytes %PDF-
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]);
    expect(detectMagicBytes(pdfBytes)).toBe("pdf");

    // PNG magic bytes
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMagicBytes(pngBytes)).toBe("png");

    // JPEG magic bytes
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(detectMagicBytes(jpegBytes)).toBe("jpeg");

    // Executável DOS (MZ)
    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]);
    expect(detectMagicBytes(exeBytes)).toBeNull();
  });

  it("deve rejeitar arquivo executável camuflado com extensão .pdf", () => {
    const fakePdfBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]); // MZ header
    const result = validateUploadedFile(
      { name: "curriculo_malicioso.pdf", size: 6 },
      fakePdfBytes
    );
    expect(result.isValid).toBe(false);
  });

  it("deve rejeitar arquivos acima do limite de 10MB", () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
    const result = validateUploadedFile(
      { name: "grande.pdf", size: 15 * 1024 * 1024 },
      pdfBytes
    );
    expect(result.isValid).toBe(false);
  });
});
