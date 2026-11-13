# Oseki BJJ

App da **Marangoni BJJ / Oseki BJJ**: presença, faixa, evolução e mensalidade de cada aluno.
São dois produtos que usam os mesmos dados, em tempo real:

| Produto | Para quem | Onde baixar |
|---|---|---|
| **App do celular** | Alunos e professores | Android: `OsekiBJJ.apk` em [Releases](../../releases/latest) · iPhone: abrir https://andrefeeelipe.github.io/Oseki/ no Safari → Compartilhar → *Adicionar à Tela de Início* (ou `OsekiBJJ-iPhone.ipa` via AltStore/Sideloadly) |
| **Painel da academia** | Professores e administradores, no computador | Windows: `OsekiBJJ-Painel-Setup.exe` em [Releases](../../releases/latest) · Navegador: https://andrefeeelipe.github.io/Oseki/painel/ |

## Primeiro uso

1. **Primeiro professor (administrador):** no app ou no painel, toque em **Criar conta**, escolha **Sou professor** e preencha. A primeira conta de professor vira administradora automaticamente, sem precisar de código.
2. Em **Mais → Dados da academia**, preencha **valores dos planos**, **dia de vencimento**, **chave Pix**, endereço e WhatsApp. Ali também ficam os **códigos de cadastro**:
   - **Código dos alunos** (padrão `OSEKI-2026`): passe para os alunos criarem a conta.
   - **Código de professor**: passe só para outros professores.
3. Em **Mais → Área de presença**, estando na academia, toque em **Usar minha localização atual**. Isso liga a presença automática por GPS.
4. Confira a **Grade de aulas** (Mais → Grade): as turmas iniciais vieram dos wireframes. Ajuste horários, dias e professor.
5. **Alunos:** cada um baixa o app, toca em **Criar conta** e usa o código dos alunos. Outra opção é o professor usar **Convidar** (cria a ficha e manda o convite pelo WhatsApp).

## O que dá para editar sem programar

Tudo isso se faz dentro do app ou do painel:
- **Nomes:** o seu em *Meu perfil*; o dos alunos na ficha do aluno → *Editar*.
- **Valores dos planos, vencimento e chave Pix:** *Dados da academia*.
- **Mensalidades:** *Financeiro*. Ali se vê quem está em dia, os valores, e se registra ou confirma pagamentos.
- **Turmas, horários e professores:** *Grade*.
- **Faixas, graus, anotações e graduação:** ficha do aluno e *Graduação*.
- **Técnicas e vídeos:** *Publicar técnica* (cole um link do YouTube).
- **Avisos para os alunos:** *Comunicado*.

Os dados também podem ser vistos e corrigidos direto no banco: Supabase → **Table Editor**.

## Mudar o código do app com IA (sem o Claude)

**Jules (Google, incluso no Gemini / Google AI Pro):** é o caminho mais fácil.
1. Entre em https://jules.google.com com a conta Google e conecte o GitHub.
2. Escolha o repositório **Oseki** e descreva a mudança em português. Exemplo:
   *"Na tela Minha faixa do aluno, mostre também a data da última graduação. Siga o design system descrito no README e em src/styles."*
3. O Jules faz a alteração e abre um **pull request**. Revise e clique em **Merge**.
4. Em poucos minutos o GitHub publica o site e gera o APK e o instalador novos sozinho (aba **Actions**).

**ChatGPT, Gemini, Claude Free ou Grok, no modo manual:**
1. No repositório, aperte a tecla `.` para abrir o editor no navegador.
2. Abra o arquivo da tela (lista abaixo), copie e cole na IA com o pedido.
3. Cole de volta o código que a IA devolver, clique em *Source Control → Commit & Push*.

### Onde fica cada coisa
```
src/screens/aluno/        telas do aluno (Inicio, Presenca, Faixa, Perfil, Subs, Planos)
src/screens/prof/         telas do professor (Chamada, Aprovacoes, Alunos, Subs, Subs2)
src/screens/desk/Desk.tsx painel do computador
src/screens/Login.tsx     entrar e criar conta
src/data/store.ts         ligação com o banco de dados
src/data/util.ts          datas, faixas, frequência, mensalidade
src/styles/               cores e componentes do design system Oseki App
supabase/schema.sql       estrutura e regras de segurança do banco
electron/main.cjs         janela do instalador Windows
```
Regras de design: português, títulos em caixa alta (Barlow Condensed), faixa sempre desenhada, um destaque vermelho por tela, sem emoji.

## Banco de dados (Supabase)

- O projeto fica na conta do Supabase da academia, no plano gratuito (não pede cartão).
- `supabase/schema.sql` cria as tabelas e as regras de segurança. Pode rodar de novo no **SQL Editor** sem perder dados.
- Em **Authentication → Sign In / Providers → Email**, deixe *Confirm email* **desligado** para o aluno entrar logo após criar a conta. Se preferir ligar, o aluno recebe um e-mail de confirmação antes do primeiro acesso.
- O endereço e a chave pública ficam em `src/config.ts`.
- Projetos gratuitos pausam após 7 dias sem uso. Com aula toda semana isso não acontece. Se pausar, é só entrar no Supabase e clicar em *Restore*.

## Rodar no computador (para quem programa)
```bash
npm install
npm run dev            # app do celular em http://localhost:5173
npm run desktop        # painel em janela (Electron)
```

## Alunos que já treinam

A lista de alunos da planilha está em `supabase/import_alunos.sql` (faixa, graus, total de aulas, último treino e exames marcados).
Esses alunos aparecem no app como "sem app" até criarem o acesso. No celular eles tocam em **Já é aluno? Faça seu acesso**, digitam o código da academia, escolhem o próprio nome na lista e criam e-mail e senha. A faixa e o histórico continuam os mesmos.

## Currículo de exames

As 40 técnicas de cada faixa (PDFs de exame) ficam em `src/data/curriculo.ts`. Graus 1 e 2 cobram da 1 à 20, graus 3 e 4 da 21 à 40, e a troca de faixa sorteia entre todas. O cronograma de treinos do ano fica em `src/data/cronograma.ts`.
