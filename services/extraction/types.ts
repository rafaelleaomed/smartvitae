export interface ExtractedPage {
  pageNumber: number;
  text: string;
  charCount: number;
}

export interface ExtractedDocument {
  text: string;
  pageCount: number;
  pages: ExtractedPage[];
  sourceType: "upload" | "linkedin" | "lattes";
  mimeType: string;
  metadata?: Record<string, any>;
}

export interface NormalizedCertificateItem {
  title: string;
  issuer: string | null;
  workload_hours: number | null;
  issue_date: string | null;
  start_date: string | null;
  end_date: string | null;
  credential_id: string | null;
  excerpt: string;
  pageNumber: number;
}
