/**
 * Matriz de Taxonomia Profissional e Regras Regulatórias de Conselhos de Classe
 * Evita rigorosamente qualquer alucinação de equivalência entre profissões distintas
 * (ex: Odontologia/CRO jamais pode assumir vaga privativa de Medicina/CRM).
 */

export type RegulatedProfession =
  | "medicina"
  | "odontologia"
  | "enfermagem"
  | "farmacia"
  | "fisioterapia"
  | "psicologia"
  | "nutricao"
  | "biomedicina"
  | "direito"
  | "engenharia"
  | "tecnologia"
  | "vendas_comercial"
  | "administracao"
  | "outro";

export interface ProfessionalProfileDetection {
  primaryProfession: RegulatedProfession;
  professionLabel: string;
  detectedCouncil?: string; // CRM, CRO, COREN, OAB, etc.
  isHealthcare: boolean;
  specialties: string[];
}

export interface JobRequirementDetection {
  requiredProfession: RegulatedProfession;
  requiredProfessionLabel: string;
  requiredCouncil?: string;
  isHealthcare: boolean;
  requiredSpecialty?: string;
  isStrictlyRegulated: boolean;
}

export interface CompatibilityCheckResult {
  isCompatible: boolean;
  isFatalMismatch: boolean;
  fatalReason?: string;
  candidateProfessionLabel: string;
  jobProfessionLabel: string;
  missingMandatoryGaps: string[];
}

/**
 * Detecta a profissão real do candidato a partir do texto do currículo
 */
export function detectCandidateProfession(rawText: string): ProfessionalProfileDetection {
  const text = rawText.toLowerCase();

  // 1. Odontologia / Dentista / Bucomaxilo (PRIORITÁRIO para não confundir com medicina)
  const isDentistry =
    text.includes("odontolog") ||
    text.includes("dentista") ||
    text.includes("cirurgião-dentista") ||
    text.includes("cirurgiao-dentista") ||
    text.includes("cirurgiã-dentista") ||
    text.includes("cirurgia e traumatologia bucomaxilofacial") ||
    text.includes("bucomaxilofacial") ||
    text.includes("buco-maxilo") ||
    text.includes("bucomaxilo") ||
    text.includes("cro-") ||
    text.includes("cro/") ||
    text.includes("cro ") ||
    text.includes("crosp") ||
    text.includes("crorj") ||
    text.includes("cropr") ||
    text.includes("ortodontia") ||
    text.includes("endodontia") ||
    text.includes("periodontia") ||
    text.includes("implantodontia") ||
    text.includes("odontopediatria");

  if (isDentistry) {
    const specialties: string[] = [];
    if (text.includes("bucomaxilo") || text.includes("buco-maxilo") || text.includes("traumatologia buco")) {
      specialties.push("Cirurgia e Traumatologia Bucomaxilofacial");
    }
    if (text.includes("ortodontia")) specialties.push("Ortodontia");
    if (text.includes("implantodontia")) specialties.push("Implantodontia");
    if (text.includes("endodontia")) specialties.push("Endodontia");

    return {
      primaryProfession: "odontologia",
      professionLabel: "Cirurgião-Dentista (Odontologia)",
      detectedCouncil: "CRO",
      isHealthcare: true,
      specialties: specialties.length > 0 ? specialties : ["Odontologia Clínica"],
    };
  }

  // 2. Medicina (Exige CRM ou Graduação explícita em Medicina)
  const hasMedicalCouncil =
    text.includes("crm-") ||
    text.includes("crm/") ||
    text.includes("crm ") ||
    text.includes("crmsp") ||
    text.includes("crmrj") ||
    text.includes("crmmg") ||
    text.includes("crmpr");

  const hasMedicalDegree =
    text.includes("graduação em medicina") ||
    text.includes("graduacao em medicina") ||
    text.includes("bacharel em medicina") ||
    text.includes("faculdade de medicina") ||
    text.includes("curso de medicina") ||
    text.includes("médico clínico") ||
    text.includes("medico clinico") ||
    text.includes("médica clínica") ||
    text.includes("médico assistente") ||
    text.includes("médica assistente") ||
    text.includes("residência em clínica médica") ||
    text.includes("residencia em clinica medica") ||
    text.includes("residência médica") ||
    text.includes("residencia medica");

  const isPhysician = (hasMedicalCouncil || hasMedicalDegree) && !text.includes("biomédic") && !text.includes("médico-veterinári");

  if (isPhysician) {
    const specialties: string[] = [];
    if (text.includes("endocrinolog")) specialties.push("Endocrinologia e Metabologia");
    if (text.includes("cardiolog")) specialties.push("Cardiologia");
    if (text.includes("pediatr")) specialties.push("Pediatria");
    if (text.includes("dermatolog")) specialties.push("Dermatologia");
    if (text.includes("psiquiatr")) specialties.push("Psiquiatria");
    if (text.includes("cirurgia geral")) specialties.push("Cirurgia Geral");
    if (text.includes("clínica médica") || text.includes("clinica medica")) specialties.push("Clínica Médica");

    return {
      primaryProfession: "medicina",
      professionLabel: "Médico (Medicina)",
      detectedCouncil: "CRM",
      isHealthcare: true,
      specialties: specialties.length > 0 ? specialties : ["Clínica Geral"],
    };
  }

  // 3. Enfermagem
  if (text.includes("enfermagem") || text.includes("enfermeir") || text.includes("coren")) {
    return {
      primaryProfession: "enfermagem",
      professionLabel: "Enfermeiro(a)",
      detectedCouncil: "COREN",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 4. Farmácia
  if (text.includes("farmácia") || text.includes("farmacia") || text.includes("farmacêutic") || text.includes("crf")) {
    return {
      primaryProfession: "farmacia",
      professionLabel: "Farmacêutico(a)",
      detectedCouncil: "CRF",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 5. Fisioterapia
  if (text.includes("fisioterapia") || text.includes("fisioterapeut") || text.includes("crefito")) {
    return {
      primaryProfession: "fisioterapia",
      professionLabel: "Fisioterapeuta",
      detectedCouncil: "CREFITO",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 6. Psicologia
  if (text.includes("psicolog") || text.includes("psicólog") || text.includes("crp")) {
    return {
      primaryProfession: "psicologia",
      professionLabel: "Psicólogo(a)",
      detectedCouncil: "CRP",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 7. Nutrição
  if (text.includes("nutricionist") || text.includes("nutrição") || text.includes("crn")) {
    return {
      primaryProfession: "nutricao",
      professionLabel: "Nutricionista",
      detectedCouncil: "CRN",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 8. Biomedicina
  if (text.includes("biomedic") || text.includes("biomédic") || text.includes("crbm")) {
    return {
      primaryProfession: "biomedicina",
      professionLabel: "Biomédico(a)",
      detectedCouncil: "CRBM",
      isHealthcare: true,
      specialties: [],
    };
  }

  // 9. Direito
  if (text.includes("advogad") || text.includes("oab") || text.includes("bacharel em direito") || text.includes("jurídic")) {
    return {
      primaryProfession: "direito",
      professionLabel: "Advogado(a)",
      detectedCouncil: "OAB",
      isHealthcare: false,
      specialties: [],
    };
  }

  // 10. Engenharia
  if (text.includes("engenheir") || text.includes("crea") || text.includes("engenharia civil")) {
    return {
      primaryProfession: "engenharia",
      professionLabel: "Engenheiro(a)",
      detectedCouncil: "CREA",
      isHealthcare: false,
      specialties: [],
    };
  }

  // 11. Vendas / Comercial
  if (text.includes("vendas") || text.includes("consultor comercial") || text.includes("vendedor") || text.includes("veículos")) {
    return {
      primaryProfession: "vendas_comercial",
      professionLabel: "Profissional de Vendas / Comercial",
      isHealthcare: false,
      specialties: [],
    };
  }

  // 12. Tecnologia
  if (text.includes("software") || text.includes("desenvolvedor") || text.includes("programador") || text.includes("full stack")) {
    return {
      primaryProfession: "tecnologia",
      professionLabel: "Profissional de Tecnologia / Software",
      isHealthcare: false,
      specialties: [],
    };
  }

  return {
    primaryProfession: "outro",
    professionLabel: "Perfil Profissional Geral",
    isHealthcare: false,
    specialties: [],
  };
}

/**
 * Detecta os requisitos de formação e conselho exigidos pela vaga
 */
export function detectJobRequirements(rawText: string): JobRequirementDetection {
  const text = rawText.toLowerCase();

  // 1. Vaga de Odontologia
  if (
    text.includes("dentista") ||
    text.includes("odontologia") ||
    text.includes("cirurgião dentista") ||
    text.includes("cirurgiao dentista") ||
    text.includes("cro ativo") ||
    text.includes("registro no cro") ||
    text.includes("bucomaxilo") ||
    text.includes("ortodontista") ||
    text.includes("implantodontista")
  ) {
    let specialty: string | undefined;
    if (text.includes("bucomaxilo") || text.includes("buco-maxilo")) specialty = "Bucomaxilofacial";
    if (text.includes("ortodont")) specialty = "Ortodontia";

    return {
      requiredProfession: "odontologia",
      requiredProfessionLabel: "Cirurgião-Dentista (Odontologia)",
      requiredCouncil: "CRO",
      isHealthcare: true,
      requiredSpecialty: specialty,
      isStrictlyRegulated: true,
    };
  }

  // 2. Vaga Privativa de Medicina
  const isMedicalJob =
    text.includes("médico") ||
    text.includes("medico") ||
    text.includes("médica") ||
    text.includes("crm ativo") ||
    text.includes("registro no crm") ||
    text.includes("graduação em medicina") ||
    text.includes("formação em medicina") ||
    text.includes("endocrinologista") ||
    text.includes("cardiologista") ||
    text.includes("pediatra") ||
    text.includes("dermatologista") ||
    text.includes("psiquiatra") ||
    text.includes("ginecologista") ||
    text.includes("oftalmologista") ||
    text.includes("cirurgião geral") ||
    text.includes("médico assistente") ||
    text.includes("médico plantonista") ||
    text.includes("médico do trabalho") ||
    text.includes("médico auditor");

  if (isMedicalJob) {
    let specialty: string | undefined;
    if (text.includes("endocrinolog")) specialty = "Endocrinologia e Metabologia";
    if (text.includes("cardiolog")) specialty = "Cardiologia";
    if (text.includes("pediatr")) specialty = "Pediatria";
    if (text.includes("dermatolog")) specialty = "Dermatologia";
    if (text.includes("psiquiatr")) specialty = "Psiquiatria";
    if (text.includes("trabalho")) specialty = "Medicina do Trabalho";

    return {
      requiredProfession: "medicina",
      requiredProfessionLabel: specialty ? `Médico Especialista em ${specialty}` : "Médico (Medicina)",
      requiredCouncil: "CRM",
      isHealthcare: true,
      requiredSpecialty: specialty,
      isStrictlyRegulated: true,
    };
  }

  // 3. Vaga de Enfermagem
  if (text.includes("enfermeir") || text.includes("coren ativo") || text.includes("enfermagem")) {
    return {
      requiredProfession: "enfermagem",
      requiredProfessionLabel: "Enfermeiro(a)",
      requiredCouncil: "COREN",
      isHealthcare: true,
      isStrictlyRegulated: true,
    };
  }

  // 4. Vaga de Farmácia
  if (text.includes("farmacêutic") || text.includes("farmaceutic") || text.includes("crf ativo") || text.includes("farmácia hospitalar")) {
    return {
      requiredProfession: "farmacia",
      requiredProfessionLabel: "Farmacêutico(a)",
      requiredCouncil: "CRF",
      isHealthcare: true,
      isStrictlyRegulated: true,
    };
  }

  // 5. Vaga de Fisioterapia
  if (text.includes("fisioterapeut") || text.includes("crefito")) {
    return {
      requiredProfession: "fisioterapia",
      requiredProfessionLabel: "Fisioterapeuta",
      requiredCouncil: "CREFITO",
      isHealthcare: true,
      isStrictlyRegulated: true,
    };
  }

  // 6. Vaga de Direito
  if (text.includes("advogad") || text.includes("oab ativa") || text.includes("direito societário") || text.includes("contencioso")) {
    return {
      requiredProfession: "direito",
      requiredProfessionLabel: "Advogado(a)",
      requiredCouncil: "OAB",
      isHealthcare: false,
      isStrictlyRegulated: true,
    };
  }

  // 7. Vaga de Engenharia Civil/Mecânica/Elétrica
  if (text.includes("engenheiro civil") || text.includes("crea ativo") || text.includes("engenharia elétrica")) {
    return {
      requiredProfession: "engenharia",
      requiredProfessionLabel: "Engenheiro(a)",
      requiredCouncil: "CREA",
      isHealthcare: false,
      isStrictlyRegulated: true,
    };
  }

  // 8. Vagas de Vendas
  if (text.includes("vendas") || text.includes("consultor de vendas") || text.includes("comercial") || text.includes("veículos")) {
    return {
      requiredProfession: "vendas_comercial",
      requiredProfessionLabel: "Profissional de Vendas / Comercial",
      isHealthcare: false,
      isStrictlyRegulated: false,
    };
  }

  // 9. Vagas de Tecnologia
  if (text.includes("desenvolvedor") || text.includes("software engineer") || text.includes("frontend") || text.includes("backend")) {
    return {
      requiredProfession: "tecnologia",
      requiredProfessionLabel: "Engenheiro de Software / Tecnologia",
      isHealthcare: false,
      isStrictlyRegulated: false,
    };
  }

  return {
    requiredProfession: "outro",
    requiredProfessionLabel: "Função Geral de Mercado",
    isHealthcare: text.includes("saúde") || text.includes("hospital") || text.includes("clínica"),
    isStrictlyRegulated: false,
  };
}

/**
 * Validação rigorosa e intransponível de conformidade regulatória entre candidato e vaga
 */
export function validateProfessionalCompatibility(
  candidateText: string,
  jobText: string
): CompatibilityCheckResult {
  const candidate = detectCandidateProfession(candidateText);
  const job = detectJobRequirements(jobText);

  // -------------------------------------------------------------
  // CASO CRÍTICO 1: Vaga privativa de MEDICINA (CRM)
  // -------------------------------------------------------------
  if (job.requiredProfession === "medicina") {
    if (candidate.primaryProfession !== "medicina") {
      const gaps = [
        `Ausência de diploma de graduação em Medicina (candidato possui formação em ${candidate.professionLabel}).`,
        "Ausência de registro ativo no Conselho Regional de Medicina (CRM).",
      ];

      if (job.requiredSpecialty) {
        gaps.push(
          `Ausência de Residência Médica (CNRM) ou RQE na especialidade médica de ${job.requiredSpecialty}.`
        );
      }

      return {
        isCompatible: false,
        isFatalMismatch: true,
        fatalReason: `Incompatibilidade regulatória intransponível: a vaga anunciada é privativa de médicos portadores de CRM ativo (Lei do Ato Médico nº 12.842/2013). O histórico do candidato comprova formação em ${candidate.professionLabel} (${candidate.detectedCouncil || "outro conselho"}). O SmartVitae bloqueia terminantemente a candidatura para proteger a ética profissional e impedir o exercício ilegal da medicina (Art. 282 do Código Penal).`,
        candidateProfessionLabel: candidate.professionLabel,
        jobProfessionLabel: job.requiredProfessionLabel,
        missingMandatoryGaps: gaps,
      };
    }
  }

  // -------------------------------------------------------------
  // CASO CRÍTICO 2: Vaga privativa de ODONTOLOGIA (CRO)
  // -------------------------------------------------------------
  if (job.requiredProfession === "odontologia") {
    if (candidate.primaryProfession !== "odontologia") {
      return {
        isCompatible: false,
        isFatalMismatch: true,
        fatalReason: `Incompatibilidade regulatória: a vaga é privativa de Cirurgiões-Dentistas com inscrição ativa no CRO (Lei nº 5.081/1966). O candidato possui formação em ${candidate.professionLabel}.`,
        candidateProfessionLabel: candidate.professionLabel,
        jobProfessionLabel: job.requiredProfessionLabel,
        missingMandatoryGaps: [
          `Ausência de diploma em Odontologia (candidato é ${candidate.professionLabel}).`,
          "Ausência de inscrição ativa no Conselho Regional de Odontologia (CRO).",
        ],
      };
    }
  }

  // -------------------------------------------------------------
  // CASO CRÍTICO 3: Vaga privativa de ENFERMAGEM (COREN)
  // -------------------------------------------------------------
  if (job.requiredProfession === "enfermagem") {
    if (candidate.primaryProfession !== "enfermagem") {
      return {
        isCompatible: false,
        isFatalMismatch: true,
        fatalReason: `Incompatibilidade regulatória: a vaga exige privativamente registro ativo no Conselho Regional de Enfermagem (COREN). O candidato possui formação em ${candidate.professionLabel}.`,
        candidateProfessionLabel: candidate.professionLabel,
        jobProfessionLabel: job.requiredProfessionLabel,
        missingMandatoryGaps: [
          "Ausência de diploma em Enfermagem.",
          "Ausência de inscrição ativa no COREN.",
        ],
      };
    }
  }

  // -------------------------------------------------------------
  // CASO CRÍTICO 4: Profissão da saúde vs Vaga puramente Comercial/Vendas
  // -------------------------------------------------------------
  if (job.requiredProfession === "vendas_comercial" && candidate.isHealthcare) {
    const jobHasHealthContext =
      jobText.toLowerCase().includes("médic") ||
      jobText.toLowerCase().includes("hospital") ||
      jobText.toLowerCase().includes("saúde") ||
      jobText.toLowerCase().includes("health");

    if (!jobHasHealthContext) {
      return {
        isCompatible: false,
        isFatalMismatch: true,
        fatalReason: `Incompatibilidade estrutural de carreira: o candidato possui formação em saúde (${candidate.professionLabel}) enquanto a oportunidade é de vendas puras de varejo/automotivo sem qualquer sobreposição técnica. Gerar um currículo adaptado exigiria fabricar uma trajetória comercial fictícia.`,
        candidateProfessionLabel: candidate.professionLabel,
        jobProfessionLabel: job.requiredProfessionLabel,
        missingMandatoryGaps: [
          "Inexistência de histórico em vendas e atingimento de metas comerciais.",
          "Ausência de domínio das rotinas de negociação do setor automotivo/comercial.",
        ],
      };
    }
  }

  // -------------------------------------------------------------
  // CASO CRÍTICO 5: Direito (OAB) vs Engenharia (CREA)
  // -------------------------------------------------------------
  if (job.requiredProfession === "direito" && candidate.primaryProfession !== "direito") {
    return {
      isCompatible: false,
      isFatalMismatch: true,
      fatalReason: "A vaga exige bacharelado em Direito e inscrição na OAB. Incompatibilidade estrutural.",
      candidateProfessionLabel: candidate.professionLabel,
      jobProfessionLabel: job.requiredProfessionLabel,
      missingMandatoryGaps: ["Ausência de formação em Direito e OAB."],
    };
  }

  if (job.requiredProfession === "engenharia" && candidate.primaryProfession !== "engenharia") {
    return {
      isCompatible: false,
      isFatalMismatch: true,
      fatalReason: "A vaga exige graduação em Engenharia e registro no CREA.",
      candidateProfessionLabel: candidate.professionLabel,
      jobProfessionLabel: job.requiredProfessionLabel,
      missingMandatoryGaps: ["Ausência de graduação em Engenharia e CREA."],
    };
  }

  return {
    isCompatible: true,
    isFatalMismatch: false,
    candidateProfessionLabel: candidate.professionLabel,
    jobProfessionLabel: job.requiredProfessionLabel,
    missingMandatoryGaps: [],
  };
}
