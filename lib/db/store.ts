import { DocumentRecord, EvidenceItem, Profile } from "./types";

const SEED_USER_ID = "00000000-0000-0000-0000-000000000001";

// Perfil em branco — nenhuma credencial, CRM ou RQE inventado!
const initialProfile: Profile = {
  id: "profile-1",
  user_id: SEED_USER_ID,
  full_name: "",
  target_country: "BR",
  preferred_language: "pt-BR",
  professional_area: "",
  career_goal: "",
  crm_number: null,
  crm_state: null,
  rqe_numbers: [],
  linkedin_url: "",
  portfolio_url: "",
};

// Base de documentos vazia até o usuário enviar seus arquivos reais
const initialDocuments: DocumentRecord[] = [];

// Base de evidências vazia até a IA extrair dados reais
const initialEvidence: EvidenceItem[] = [];

// In-Memory store para sessões locais auditáveis
class LocalStore {
  private profile: Profile = { ...initialProfile };
  private documents: DocumentRecord[] = [...initialDocuments];
  private evidence: EvidenceItem[] = [...initialEvidence];

  getProfile(userId: string): Profile {
    return { ...this.profile, user_id: userId };
  }

  updateProfile(userId: string, data: Partial<Profile>): Profile {
    this.profile = {
      ...this.profile,
      ...data,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };
    return this.profile;
  }

  getDocuments(userId: string): DocumentRecord[] {
    return this.documents.filter((d) => d.status !== "deleted");
  }

  addDocument(doc: DocumentRecord): DocumentRecord {
    const existing = this.documents.find(
      (d) => d.sha256 === doc.sha256 && d.status !== "deleted"
    );
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
    // Remove evidências atreladas ao documento excluído
    this.evidence = this.evidence.filter((e) => e.document_id !== docId);
  }

  getEvidence(userId: string): EvidenceItem[] {
    return this.evidence;
  }

  addEvidence(item: EvidenceItem): EvidenceItem {
    const withId: EvidenceItem = {
      ...item,
      id: item.id || crypto.randomUUID(),
      confidence: typeof item.confidence === "number" && !isNaN(item.confidence) ? item.confidence : 0.95,
      classification_source: item.classification_source || "jev",
      career_signal: item.career_signal || 4,
    };
    this.evidence.unshift(withId);
    return withId;
  }

  setEvidences(items: EvidenceItem[]): void {
    this.evidence = [...items];
  }

  clearEvidence(): void {
    this.evidence = [];
    this.documents = [];
    this.profile = { ...initialProfile };
  }

  updateEvidence(id: string, updates: Partial<EvidenceItem>): EvidenceItem | null {
    const index = this.evidence.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const current = this.evidence[index];
    if (current.user_locked && updates.user_locked === undefined) {
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

// Singleton global persistente para Next.js App Router
declare global {
  var __smartvitae_local_store: LocalStore | undefined;
}

export const localStore =
  globalThis.__smartvitae_local_store ?? new LocalStore();

if (process.env.NODE_ENV !== "production") {
  globalThis.__smartvitae_local_store = localStore;
}

export const DEMO_USER_ID = SEED_USER_ID;
