<div align="center">

**Language:** [English](README.md) · [Português do Brasil](README.pt-BR.md)

# SmartVitae

**Evidence-grounded career alignment and resume adaptation.**

[Live demo](https://smartvitae.onrender.com)

</div>

## The problem

Generic resume assistants can overstate job fit or introduce qualifications that the candidate cannot verify. This is especially risky in regulated professions, where licenses, certifications and specialist titles must remain factual.

SmartVitae compares professional evidence with job requirements, identifies material gaps and creates traceable resume adaptations for candidate review. It supports career decisions; it does not guarantee selection or employment.

## What is implemented

- intake from resume PDFs, LinkedIn exports, text and job descriptions;
- extraction into structured evidence categories;
- comparison across profession, mandatory skills, routine, industry and experience depth;
- `KILL`, `FIX` and `SHIP` verdicts to separate structural mismatch, remediable gaps and stronger alignment;
- interactive gap resolution with supporting documents or explicit declarations of missing experience;
- ATS-oriented resume generation linked to stored evidence;
- client- and server-side sanitization of sensitive identifiers;
- mobile-responsive interface and print-ready output.

## Decision and AI design

A deterministic decision layer evaluates fit before generative adaptation. Language models structure source material and draft content, but accepted evidence remains reviewable and can be locked against automatic replacement.

“Evidence-grounded” means generated claims should be traceable to provided material. It does not mean that extraction is infallible; the candidate must verify the final document.

## Architecture

- **Application:** Next.js 15, React 19 and TypeScript 5.7;
- **Interface:** Tailwind CSS and Lucide React;
- **Decision layer:** TypeSafe AI / JEV;
- **Language processing:** Anthropic Claude through OpenRouter;
- **Documents:** server-side PDF text extraction;
- **Quality:** Vitest coverage for decisions, privacy, extraction and taxonomy rules;
- **Deployment:** Docker and Render.

## Run locally

```bash
npm install
npm test
npm run dev
```

External integrations require local environment variables. Do not commit credentials or candidate documents.

## Current limitations

- document extraction quality varies with PDF structure;
- evidence quality depends on the material supplied by the candidate;
- verdicts are decision support, not an objective measure of employability;
- every generated resume requires final human review.

## Author

**Rafael Leão, MD:** physician building healthcare, AI and digital-product software.
[GitHub](https://github.com/rafaelleaomed) · [LinkedIn](https://www.linkedin.com/in/rafaelleaomed/)
