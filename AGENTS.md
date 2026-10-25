# SmartVitae — contexto para agentes

## Produto e arquitetura
- Plataforma de adequação profissional factual, construída com Next.js 15, React 19, TypeScript e Supabase.
- Rotas e telas ficam em `app/`; componentes em `components/`; domínio e integrações em `lib/`.
- `PRODUCT.md` descreve o produto; consulte-o apenas para decisões de escopo ou experiência.

## Validação
- Execute `npm test` para regras e normalizadores.
- Execute `npm run build` antes de concluir mudanças de produção.

## Regras críticas
- Nunca invente formação, experiência, certificação, registro profissional ou evidência.
- Toda adaptação de currículo deve permanecer rastreável ao conteúdo fornecido pelo usuário.
- Preserve sanitização de dados pessoais e isolamento no Supabase.
- Não publique nem faça deploy sem aprovação explícita.
- Ignore dependências, caches e skills externas quando não forem necessárias à tarefa.
