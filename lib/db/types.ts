import { z } from "zod";

// Taxonomia oficial do MVP (Seção 9 da especificação)
export const EvidenceTypeEnum = z.enum([
  "graduacao",
  "pos_graduacao",
  "residencia",
  "mestrado",
  "doutorado",
  "titulo_especialista",
  "registro_profissional",
  "certificacao_profissional",
  "curso_aperfeicoamento",
  "curso_livre",
  "evento",
  "publicacao",
  "ensino",
  "projeto",
  "experiencia",
  "voluntariado",
  "idioma",
  "outro",
  "nao_identificado",
]);

export type EvidenceType = z.infer<typeof EvidenceTypeEnum>;

export const ResumeSectionEnum = z.enum([
  "formacao",
  "experiencia",
  "certificacoes",
  "cursos",
  "pesquisa_publicacoes",
  "ensino",
  "projetos",
  "idiomas",
  "voluntariado",
  "omitir",
  "revisao_humana",
]);

export type ResumeSection = z.infer<typeof ResumeSectionEnum>;

export const ReviewStatusEnum = z.enum([
  "pending",
  "approved",
  "corrected",
  "rejected",
]);

export type ReviewStatus = z.infer<typeof ReviewStatusEnum>;

// Schemas Zod para Validação e Tipagem em Runtime
export const ProfileSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  full_name: z.string().min(2, "Nome é obrigatório"),
  target_country: z.string().default("BR"),
  preferred_language: z.string().default("pt-BR"),
  professional_area: z.string().nullable().optional(),
  career_goal: z.string().nullable().optional(),
  crm_number: z.string().nullable().optional(),
  crm_state: z.string().max(2).nullable().optional(),
  rqe_numbers: z.array(z.string()).default([]),
  linkedin_url: z.string().url().nullable().optional().or(z.literal("")),
  portfolio_url: z.string().url().nullable().optional().or(z.literal("")),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const DocumentSourceTypeEnum = z.enum(["upload", "linkedin", "lattes"]);
export const DocumentStatusEnum = z.enum([
  "uploaded",
  "extracting",
  "extracted",
  "review",
  "failed",
  "deleted",
]);

export const DocumentSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  source_type: DocumentSourceTypeEnum.default("upload"),
  storage_path: z.string().nullable().optional(),
  original_name: z.string(),
  mime_type: z.string(),
  sha256: z.string().length(64),
  status: DocumentStatusEnum.default("uploaded"),
  extraction_provider: z.string().nullable().optional(),
  extraction_version: z.string().nullable().optional(),
  page_count: z.number().int().default(1),
  raw_text: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DocumentRecord = z.infer<typeof DocumentSchema>;

export const EvidenceItemSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  document_id: z.string().uuid().nullable().optional(),
  evidence_type: EvidenceTypeEnum,
  resume_section: ResumeSectionEnum,
  title: z.string().min(1, "Título é obrigatório"),
  issuer_or_organization: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  issue_date: z.string().nullable().optional(),
  expiry_date: z.string().nullable().optional(),
  workload_hours: z.number().int().nullable().optional(),
  credential_id: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  skills: z.array(z.string()).optional().default([]),
  source_pages: z.array(z.number().int()).optional().default([]),
  source_excerpt: z.string().nullable().optional(),
  classification_source: z
    .enum(["rule", "jev", "llm", "user", "local_rule", "mock"])
    .default("jev"),
  confidence: z.number().min(0).max(1).default(1.0),
  career_signal: z.number().int().min(1).max(5).default(3),
  review_status: ReviewStatusEnum.default("pending"),
  user_locked: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export interface AIAuditLog {
  id?: string;
  user_id: string;
  operation: string;
  provider: string;
  model: string;
  input_hash: string;
  prompt_version?: string;
  output_json?: any;
  confidence?: number;
  latency_ms?: number;
  estimated_cost?: number;
  created_at?: string;
}
