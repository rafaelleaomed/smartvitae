<div align="center">

**Idioma:** [Português do Brasil](README.pt-BR.md) · [English](README.md)

# SmartVitae

**Adequação curricular e análise de carreira fundamentadas em evidências.**

[Demonstração](https://smartvitae.onrender.com)

</div>

## O problema

Assistentes genéricos de currículo podem exagerar a aderência a uma vaga ou introduzir qualificações que o candidato não consegue comprovar. O risco é maior em profissões regulamentadas, nas quais registros, certificações e títulos de especialista precisam permanecer factuais.

O SmartVitae compara evidências profissionais com os requisitos da vaga, identifica lacunas relevantes e cria adaptações rastreáveis para revisão do candidato. A ferramenta apoia decisões de carreira; não garante seleção ou contratação.

## O que está implementado

- entrada por currículo em PDF, exportação do LinkedIn, texto e descrição da vaga;
- extração em categorias estruturadas de evidências;
- comparação de profissão, requisitos obrigatórios, rotina, setor e profundidade de experiência;
- vereditos `KILL`, `FIX` e `SHIP` para diferenciar incompatibilidade estrutural, lacunas corrigíveis e maior aderência;
- resolução interativa de lacunas por documentos ou declaração explícita da experiência ausente;
- geração de currículo orientado a ATS e ligado às evidências armazenadas;
- sanitização de identificadores sensíveis no cliente e no servidor;
- interface responsiva e saída preparada para impressão.

## Decisão e uso de IA

Uma camada determinística avalia a aderência antes da adaptação generativa. Modelos de linguagem estruturam as fontes e redigem conteúdo, mas as evidências aceitas continuam revisáveis e podem ser bloqueadas contra substituição automática.

“Fundamentado em evidências” significa que as afirmações geradas devem ser rastreáveis ao material fornecido. A extração não é infalível; o candidato precisa conferir o documento final.

## Arquitetura

- **Aplicação:** Next.js 15, React 19 e TypeScript 5.7;
- **Interface:** Tailwind CSS e Lucide React;
- **Camada de decisão:** TypeSafe AI / JEV;
- **Processamento de linguagem:** Anthropic Claude via OpenRouter;
- **Documentos:** extração de texto de PDF no servidor;
- **Qualidade:** testes Vitest para decisões, privacidade, extração e taxonomia;
- **Publicação:** Docker e Render.

## Executar localmente

```bash
npm install
npm test
npm run dev
```

As integrações externas exigem variáveis locais. Não versione credenciais nem documentos de candidatos.

## Limitações atuais

- a qualidade da extração varia conforme a estrutura do PDF;
- a qualidade das evidências depende do material enviado pelo candidato;
- os vereditos apoiam a decisão, mas não medem objetivamente a empregabilidade;
- todo currículo gerado exige revisão humana final.

## Autor

**Rafael Leão, médico:** desenvolvimento de software em saúde, IA e produtos digitais.
[GitHub](https://github.com/rafaelleaomed) · [LinkedIn](https://www.linkedin.com/in/rafaelleaomed/)
