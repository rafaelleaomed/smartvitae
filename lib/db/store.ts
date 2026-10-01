import { DocumentRecord, EvidenceItem, Profile } from "./types";

// Seed de demonstração médica inicial para a comunidade Médicos Híbridos
const SEED_USER_ID = "00000000-0000-0000-0000-000000000001";

const initialProfile: Profile = {
  id: "profile-1",
  user_id: SEED_USER_ID,
  full_name: "Dr. Lucas Carvalho",
  target_country: "BR",
  preferred_language: "pt-BR",
  professional_area: "Medicina & Inteligência Artificial / Inovação em Saúde",
  career_goal: "Transição para liderança médica em Healthtechs e avaliação clínica de IA",
  crm_number: "123456",
  crm_state: "SP",
  rqe_numbers: ["65432"], // Ex: Cardiologia
  linkedin_url: "https://www.linkedin.com/in/drlucascarvalho",
  portfolio_url: "",
};

const initialDocuments: DocumentRecord[] = [
  {
    id: "doc-1",
    user_id: SEED_USER_ID,
    source_type: "upload",
    original_name: "Residencia_Clinica_Medica_HC_FMUSP.pdf",
    mime_type: "application/pdf",
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    status: "extracted",
    page_count: 1,
    raw_text: "Certificado de Residência Médica em Clínica Médica pela Faculdade de Medicina da USP. Credenciado pela CNRM. Carga horária: 5760h.",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "doc-2",
    user_id: SEED_USER_ID,
    source_type: "upload",
    original_name: "Certificado_Generative_AI_for_Healthcare_Google.pdf",
    mime_type: "application/pdf",
    sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    status: "extracted",
    page_count: 1,
    raw_text: "Completion badge for Generative AI for Healthcare. Emissor: Google Cloud. Carga horária: 40h.",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const initialEvidence: EvidenceItem[] = [
  {
    id: "ev-1",
    user_id: SEED_USER_ID,
    document_id: "doc-1",
    evidence_type: "residencia",
    resume_section: "formacao",
    title: "Residência Médica em Clínica Médica",
    issuer_or_organization: "Hospital das Clínicas da FMUSP",
    issue_date: "2023",
    workload_hours: 5760,
    credential_id: "CNRM-SP-2023",
    description: "Programa formal de residência médica de 2 anos em Clínica Médica com rotação em UTI e emergências.",
    skills: ["Clínica Médica", "UTI", "Emergências"],
    classification_source: "local_rule",
    confidence: 0.95,
    career_signal: 5,
    review_status: "approved",
    user_locked: true,
    source_excerpt: "Certificado de conclusão do programa de Residência Médica em Clínica Médica",
    source_pages: [1],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "ev-2",
    user_id: SEED_USER_ID,
    document_id: "doc-2",
    evidence_type: "certificacao_profissional",
    resume_section: "certificacoes",
    title: "Generative AI for Healthcare Badge",
    issuer_or_organization: "Google Cloud",
    issue_date: "2024",
    workload_hours: 40,
    credential_id: "GC-GENAI-MED-891",
    description: "Certificação em modelos generativos, avaliação de segurança clínica e LLMs aplicadas a fluxos hospitalares.",
    skills: ["GenAI", "Health Informatics", "Cloud"],
    classification_source: "jev",
    confidence: 0.92,
    career_signal: 4,
    review_status: "approved",
    user_locked: false,
    source_excerpt: "Completion badge for Generative AI for Healthcare - Google Cloud",
    source_pages: [1],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "ev-3",
    user_id: SEED_USER_ID,
    document_id: null,
    evidence_type: "projeto",
    resume_section: "projetos",
    title: "Painel NeuroGestor (MNIO Analytics)",
    issuer_or_organization: "Projeto Independente / Comunidade Médicos Híbridos",
    issue_date: "2024",
    workload_hours: null,
    credential_id: null,
    description: "Projeto para estruturação, monitorização neurofisiológica intraoperatória e visualização de biomarcadores cirúrgicos.",
    skills: ["Analytics", "Neurofisiologia", "Python"],
    classification_source: "user",
    confidence: 1.0,
    career_signal: 4,
    review_status: "approved",
    user_locked: true,
    source_excerpt: "Projeto de tecnologia em saúde",
    source_pages: [],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

// In-Memory store para sessões locais / demonstrações sem banco configurado
class LocalStore {
  private profile: Profile = initialProfile;
  private documents: DocumentRecord[] = [...initialDocuments];
  private evidence: EvidenceItem[] = [...initialEvidence];

  getProfile(userId: string): Profile {
    return { ...this.profile, user_id: userId };
  }

  updateProfile(userId: string, data: Partial<Profile>): Profile {
    this.profile = { ...this.profile, ...data, user_id: userId, updated_at: new Date().toISOString() };
    return this.profile;
  }

  getDocuments(userId: string): DocumentRecord[] {
    return this.documents.filter((d) => d.status !== "deleted");
  }

  addDocument(doc: DocumentRecord): DocumentRecord {
    const existing = this.documents.find((d) => d.sha256 === doc.sha256 && d.status !== "deleted");
    if (existing) {
      throw new Error("Arquivo duplicado: este documento já foi enviado anteriormente.");
    }
    this.documents.unshift(doc);
    return doc;
  }

  deleteDocument(docId: string): void {
    const doc = this.documents.find((d) => d.id === docId);
    if (doc) {
      doc.status = "deleted";
    }
    // Remove evidências atreladas
    this.evidence = this.evidence.filter((e) => e.document_id !== docId);
  }

  getEvidence(userId: string): EvidenceItem[] {
    return this.evidence;
  }

  addEvidence(item: EvidenceItem): EvidenceItem {
    this.evidence.unshift(item);
    return item;
  }

  updateEvidence(id: string, updates: Partial<EvidenceItem>): EvidenceItem | null {
    const index = this.evidence.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const current = this.evidence[index];
    if (current.user_locked && updates.user_locked === undefined) {
      // Se estiver travado pelo usuário, rejeita alterações de automações
      throw new Error("Este item foi validado e travado manualmente pelo usuário.");
    }

    this.evidence[index] = {
      ...current,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.evidence[index];
  }

  deleteEvidence(id: string): void {
    this.evidence = this.evidence.filter((e) => e.id !== id);
  }
}

// Singleton global para desenvolvimento
export const localStore = new LocalStore();
export const DEMO_USER_ID = SEED_USER_ID;
