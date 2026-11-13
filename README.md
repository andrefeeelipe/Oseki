# Oseki BJJ — app

App de jiu-jitsu da **Marangoni BJJ / Oseki BJJ**: presença, faixa e evolução de cada aluno, no tatame e no celular.
Feito a partir dos wireframes e do design system **Oseki App** (cores, tipografia, faixa, componentes `os-`).

## Testar agora

| Onde | Como |
|---|---|
| **Navegador (qualquer celular ou PC)** | https://andrefeeelipe.github.io/Oseki/ — no celular, use "Adicionar à tela inicial" para virar app. |
| **Android (APK)** | Baixe `OsekiBJJ.apk` em [Releases → última versão](../../releases/latest) e instale (permita "instalar apps desconhecidos"). |
| **Painel desktop** | https://andrefeeelipe.github.io/Oseki/#/painel — código de verificação na demo: `123456`. |

Na tela de entrada, use **Entrar como aluno** ou **Entrar como professor** (sem cadastro).
Contas de teste: `lucas@demo.oseki` (aluno) e `prof@demo.oseki` (professor), qualquer senha. Código da academia: `OSEKI-2026`.

> **Importante:** nesta versão os dados ficam salvos **no próprio aparelho** (demonstração).
> Aluno, professor e painel compartilham os dados quando usados no mesmo aparelho/navegador
> (dá para abrir aluno numa aba e professor em outra). Para sincronizar entre celulares diferentes,
> o próximo passo é ligar um backend (ex.: Supabase ou Firebase) — veja "Próximos passos".
> Em **Perfil → Restaurar dados de demonstração** tudo volta ao exemplo.

## O que já funciona

**Aluno** — Início (presença automática por GPS, aula de hoje, progresso, posição da semana) · Presença (calendário, marcar dia, status presente/pendente/recusada) · Faixa (graus, meta, anotações, histórico) · Perfil (foto pela câmera/galeria, dados, presença automática, notificações) · Grade semanal · Check-in por QR Code (câmera real) · Notificações · Evolução · Biblioteca de técnicas · Exame de faixa · Carteirinha · Mensalidade (Pix) · Regras · Planos e Aluno Fundador · Meu contrato · Ranking.

**Professor** — Chamada (marcar/desfazer, aprovar) · Aprovações · Alunos e ficha (faixa, graus, apto para exame, anotações) · Painel · Graduação · Comunicado · Área de presença (define o local da academia pelo GPS do celular) · Dados da academia · Grade e nova aula · QR Code da aula (muda a cada 30 s) · Plano de aula · Convidar aluno (WhatsApp) · Histórico · Avaliação técnica · Requisitos por faixa · Publicar técnica · Financeiro · Relatórios (exporta planilha) · Contratos · Controle de acesso · Perfil.

**Painel desktop (admin)** — Login com 2 etapas · Painel · Presenças do dia · Aprovações · Alunos · Ficha · Graduação · Grade · Financeiro · Ranking · Planos e fundador · Contratos · Conteúdo por plano · Controle de acesso · Configurações.

### Testar a presença por GPS de verdade
1. Entre como **professor** → **Mais → Área de presença** → **Usar minha localização atual** (estando na academia).
2. Entre como **aluno** no horário de uma aula da turma dele (30 min antes até 15 min após o início).
3. Ao entrar no raio, a presença é registrada sozinha. Fora da academia, use **Simular chegada**.

## Como contribuir (Diego)

Tudo que for enviado para a branch `main` publica o site e gera um APK novo sozinho (aba **Actions**).

**Pelo navegador, sem instalar nada:** abra o repositório, aperte a tecla `.` (ponto) para abrir o editor no navegador, edite e faça *Commit & Push*.

**No computador:**
```bash
git clone https://github.com/andrefeeelipe/Oseki.git
cd Oseki
npm install
npm run dev        # abre em http://localhost:5173
```

### Onde fica cada coisa
```
src/
  styles/tokens.css      cores, fontes, espaços (design system Oseki App)
  styles/bundle.css      componentes os- (botão, chip, faixa, card…)
  styles/app.css         layout das telas
  data/seed.ts           alunos, turmas e dados de exemplo
  data/store.ts          "banco" local e ações (marcar presença, aprovar, graduar…)
  data/util.ts           datas, faixas, frequência, GPS
  ui/kit.tsx             componentes React (Belt, Avatar, Calendar, TabBar…)
  screens/aluno/         telas do aluno
  screens/prof/          telas do professor
  screens/desk/          painel desktop
```
Regras do design system: textos em português, títulos em caixa alta (Barlow Condensed), faixa sempre desenhada,
um destaque vermelho por tela, valores sem definição entre colchetes (`R$ [VALOR]`), sem emoji na interface.

## Próximos passos sugeridos
- Backend com login real e sincronização entre aparelhos (Supabase/Firebase): trocar `src/data/store.ts` mantendo as mesmas funções.
- Notificações push reais.
- Pix real (integração com o banco da academia) e preços definidos.
- Endereço e WhatsApp reais da academia.
