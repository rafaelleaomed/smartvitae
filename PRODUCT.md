# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Profissionais de saúde, médicos, pesquisadores, gestores e especialistas técnicos que buscam vagas exigentes ou transição de carreira, necessitando de adequação curricular precisa, auditável e sem invenções.

## Product Purpose

Garantir que candidaturas profissionais tenham 100% de correspondência factual com a vaga pretendida. Submete o perfil a testes de estresse implacáveis de 6 dimensões via TypeSafe JEV (System One) e reconstrói o currículo para sistemas ATS com Claude 3.5 Sonnet, bloqueando fraudes e alucinações.

## Positioning

O oposto dos geradores genéricos de currículos com IA que adulam o candidato com scores inflados e fabricam títulos ou experiências. O SmartVitae opera como um auditor factual de carreira: diz a verdade sem rodeios (`KILL`, `FIX`, `SHIP`), protege o candidato de infrações éticas e rejeições humilhantes, e constrói currículos com lastro documental comprovável.

## Operating Context

Candidatos avaliando compatibilidade com vagas reais, submetendo arquivos em PDF, links de vagas ou texto livre, gerenciando documentos comprobatórios (Lattes, CRM, diplomas) e exportando currículos profissionais em PDF limpo e formatado.

## Capabilities and Constraints

- **Ingestão multiformato:** Upload e extração de PDFs (currículos e certificados), links de vagas e texto manual com sanitização LGPD.
- **Teste de estresse em 6 dimensões:** `profession_fit`, `mandatory_skills`, `daily_activities`, `fabrication_risk`, `industry_fit`, `experience_depth`.
- **Vereditos determinísticos:** `KILL` (bloqueio ético de geração e roadmap sincero), `FIX` (lacunas corrigíveis com evidências), `SHIP` (alta aderência com liberação imediata).
- **Base de evidências:** Repositório auditável onde cada habilidade declarada está associada a um documento real comprovado.
- **Editor e exportador de currículo ATS:** Visualização interativa e impressão otimizada em PDF limpo de folha única/dupla.
- **Restrição estrita:** Proibição absoluta de inventar credenciais clínicas, números de registro ou experiências não comprovadas.

## Brand Commitments

- Nome: **SmartVitae**.
- Tom de voz: Clínico, cirúrgico, sóbrio, direto, confiável e ético.
- Paleta: Tons de ardósia (slate/zinc) profundos, azul institucional médico, esmeralda para validação de evidências, âmbar/carmesim para alertas e vereditos de risco.

## Evidence on Hand

- Código funcional em Next.js 15 App Router, React 19, Tailwind CSS.
- Casos de teste de estresse implementados (`innovation` - Médico para Inovação em Saúde; `sales` - Médico para Gerente de Vendas Automotivas).
- Rotas API `/api/adapt`, `/api/generate-cv`, `/api/evidence`, `/api/documents`.

## Product Principles

1. **Verdade sem concessões:** É preferível apontar uma incompatibilidade estrutural do que gerar um currículo fictício que prejudique o candidato.
2. **Evidência acima de palavras-chave:** Toda qualificação deve poder ser comprovada por um diploma, certificado ou registro prévio.
3. **Clareza e densidade informativa:** Interface cirúrgica, objetiva e sem ruídos visuais ou distrações superficiais.
4. **Respeito regulatório e ético:** Alinhamento estrito à LGPD e à Resolução CFM nº 2.336/2023.

## Accessibility & Inclusion

Conformidade WCAG 2.1 AA (contraste >= 4.5:1), foco visível em todos os controles interativos, hierarquia semântica de cabeçalhos sem kickers redundantes, suporte total a teclado e visualização mobile com touch targets generosos (>= 44px).
