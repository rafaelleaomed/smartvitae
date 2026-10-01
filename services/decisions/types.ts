import { EvidenceType, ResumeSection } from "@/lib/db/types";

export interface CertificateState {
  document_label: string;
  normalized_title: string;
  issuer: string | null;
  dates: {
    issued?: string;
    start?: string;
    end?: string;
  };
  workload_hours: number | null;
  text_excerpt: string;
  existing_candidate?: any;
  target_role?: string | null;
}

export interface CertificateDecision {
  evidence_type: EvidenceType;
  resume_section: ResumeSection;
  include_in_base_resume: boolean;
  requires_human_review: boolean;
  career_signal: number; // 1 a 5
  confidence: number; // 0.0 a 1.0
  decision_source: "jev" | "local_rule" | "mock";
  reasoning?: string;
}

export interface JobEvidenceState {
  requirement: string;
  evidence: {
    type: string;
    title: string;
    description: string;
  };
}

export interface JobEvidenceDecision {
  is_relevant: boolean;
  match_strength: number; // 1 a 5
  needs_explanation: boolean;
  confidence: number;
}

export interface DecisionProvider {
  classifyCertificate(state: CertificateState): Promise<CertificateDecision>;
  scoreEvidenceForJob?(state: JobEvidenceState): Promise<JobEvidenceDecision>;
}
