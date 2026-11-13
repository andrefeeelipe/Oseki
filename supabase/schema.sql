-- =====================================================================
-- Oseki BJJ — banco de dados (Supabase)
-- Cole tudo no SQL Editor do Supabase e clique em RUN. Pode rodar de novo
-- sem perder dados: só cria o que falta e atualiza as funções.
-- =====================================================================

-- ---------- Tabelas ----------
create table if not exists public.profiles (
  id uuid primary key,
  role text not null check (role in ('aluno','prof','admin')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.att (
  id text primary key,
  sid uuid not null,
  date date not null,
  status text not null check (status in ('ok','pend','rej')),
  data jsonb not null default '{}'::jsonb
);
create index if not exists att_sid on public.att(sid);
create index if not exists att_date on public.att(date);
create table if not exists public.notifs (
  id text primary key,
  dest text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists notifs_dest on public.notifs(dest);
create table if not exists public.aulas    (id text primary key, data jsonb not null default '{}'::jsonb);
create table if not exists public.tecnicas (id text primary key, data jsonb not null default '{}'::jsonb);
create table if not exists public.access   (id text primary key, data jsonb not null default '{}'::jsonb);
create table if not exists public.avisos   (id text primary key, data jsonb not null default '{}'::jsonb);
create table if not exists public.settings (id int primary key default 1 check (id = 1), data jsonb not null default '{}'::jsonb);
-- Códigos de cadastro: só professores enxergam
create table if not exists public.segredos (
  id int primary key default 1 check (id = 1),
  codigo_aluno text not null default 'OSEKI-2026',
  codigo_prof text not null default ('PROF-' || upper(substr(md5(random()::text), 1, 6)))
);
insert into public.segredos (id) values (1) on conflict do nothing;

-- ---------- Funções auxiliares ----------
create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role in ('prof','admin'));
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Aluno só altera os próprios dados pessoais; o resto (faixa, aulas, pagamentos…) é do professor
create or replace function public.protege_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  livres text[] := array['nome','nasc','tel','resp','foto','geoAuto','notif','plano','fundador','contrato','payInformado','email','turma','apelido'];
  k text;
  novo jsonb;
begin
  if current_setting('oseki.sistema', true) = '1' then return new; end if;
  -- "aulas" é contado pelo banco; o app só pode zerar (na graduação)
  if coalesce((new.data->>'aulas')::int, 0) <> 0 or not (old.data ? 'aulas') then
    new.data := jsonb_set(new.data, '{aulas}', coalesce(old.data->'aulas', '0'::jsonb));
  end if;
  if public.is_staff() then
    -- só admin muda o papel de alguém; ninguém rebaixa o último admin por engano
    if new.role <> old.role and not public.is_admin() then new.role := old.role; end if;
    return new;
  end if;
  new.role := old.role;
  novo := old.data;
  foreach k in array livres loop
    if new.data ? k then novo := novo || jsonb_build_object(k, new.data -> k);
    elsif old.data ? k then novo := novo - k;
    end if;
  end loop;
  new.data := novo;
  return new;
end $$;
drop trigger if exists protege_perfil on public.profiles;
create trigger protege_perfil before update on public.profiles for each row execute function public.protege_perfil();

-- Conta as aulas na faixa automaticamente a cada presença confirmada
create or replace function public.conta_aulas() returns trigger
language plpgsql security definer set search_path = public as $$
declare delta int := 0; alvo uuid;
begin
  if tg_op = 'INSERT' then
    alvo := new.sid; if new.status = 'ok' then delta := 1; end if;
  elsif tg_op = 'UPDATE' then
    alvo := new.sid;
    if old.status <> 'ok' and new.status = 'ok' then delta := 1; end if;
    if old.status = 'ok' and new.status <> 'ok' then delta := -1; end if;
  else
    alvo := old.sid; if old.status = 'ok' then delta := -1; end if;
  end if;
  if delta <> 0 then
    perform set_config('oseki.sistema', '1', true);
    update public.profiles
      set data = jsonb_set(data, '{aulas}', to_jsonb(greatest(0, coalesce((data->>'aulas')::int, 0) + delta)))
      where id = alvo;
    perform set_config('oseki.sistema', '0', true);
  end if;
  return null;
end $$;
drop trigger if exists conta_aulas on public.att;
create trigger conta_aulas after insert or update or delete on public.att for each row execute function public.conta_aulas();

-- Compara nomes sem acento e sem diferença de maiúsculas
create or replace function public.norm(t text) returns text
language sql immutable as $$
  select regexp_replace(lower(translate(coalesce(t, ''), 'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñ', 'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNn')), '\s+', ' ', 'g');
$$;

-- "Já é aluno? Faça seu acesso": lista as fichas sem conta, só para quem tem o código da academia
create or replace function public.fichas_livres(p_codigo text) returns table (id uuid, nome text, apelido text, belt text, graus int)
language sql stable security definer set search_path = public as $$
  select p.id, p.data->>'nome', coalesce(p.data->>'apelido', ''), p.data->>'belt', coalesce((p.data->>'graus')::int, 0)
  from public.profiles p, public.segredos s
  where s.id = 1 and upper(trim(p_codigo)) = upper(s.codigo_aluno)
    and p.role = 'aluno' and (p.data->>'convidado')::boolean is true and coalesce(p.data->>'status', 'ativo') <> 'inativo'
  order by p.data->>'nome';
$$;

-- Cadastro: cria o perfil depois do sign-up, validando o código da academia
create or replace function public.criar_perfil(p_codigo text, p_role text, p_data jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  seg public.segredos;
  papel text;
  convidado uuid;
  mail text := lower(coalesce(p_data->>'email', ''));
begin
  if uid is null then raise exception 'Faça login primeiro.'; end if;
  if exists (select 1 from public.profiles where id = uid) then
    return (select role from public.profiles where id = uid);
  end if;
  select * into seg from public.segredos where id = 1;
  if p_role = 'aluno' then
    if upper(trim(p_codigo)) <> upper(seg.codigo_aluno) then raise exception 'Código da academia inválido.'; end if;
    papel := 'aluno';
    -- Aluno que já treina: assume a ficha que já existe (escolhida na lista, pelo e-mail ou pelo nome)
    if coalesce(p_data->>'vinculo', '') <> '' then
      select id into convidado from public.profiles
        where id::text = p_data->>'vinculo' and role = 'aluno' and (data->>'convidado')::boolean is true;
    end if;
    if convidado is null and mail <> '' then
      select id into convidado from public.profiles
        where role = 'aluno' and (data->>'convidado')::boolean is true and lower(data->>'email') = mail limit 1;
    end if;
    if convidado is null then
      select id into convidado from public.profiles
        where role = 'aluno' and (data->>'convidado')::boolean is true and public.norm(data->>'nome') = public.norm(p_data->>'nome')
        limit 1;
    end if;
    if convidado is not null then
      perform set_config('oseki.sistema', '1', true);
      update public.profiles set id = uid, data = (data || (p_data - 'vinculo' - 'nome' - 'belt' - 'graus' - 'aulas' - 'hist' - 'notes' - 'turma' - 'plano' - 'pagamentos' - 'contrato' - 'tecnicas' - 'mesesEmDia' - 'apto' - 'status') || jsonb_build_object('convidado', false)) where id = convidado;
      update public.att set sid = uid where sid = convidado;
      update public.notifs set dest = uid::text where dest = convidado::text;
      perform set_config('oseki.sistema', '0', true);
      return papel;
    end if;
  elsif p_role = 'prof' then
    if upper(trim(p_codigo)) <> upper(seg.codigo_prof) then raise exception 'Código de professor inválido.'; end if;
    papel := case when exists (select 1 from public.profiles where role = 'admin') then 'prof' else 'admin' end;
  else
    raise exception 'Tipo de conta inválido.';
  end if;
  insert into public.profiles (id, role, data) values (uid, papel, p_data);
  if papel = 'admin' then
    update public.aulas set data = jsonb_set(data, '{prof}', to_jsonb(coalesce(p_data->>'nome', ''))) where coalesce(data->>'prof', '') = '';
  end if;
  insert into public.notifs (id, dest, data) values (
    md5(random()::text), 'prof',
    jsonb_build_object('t', case when papel = 'aluno' then 'Novo aluno cadastrado' else 'Novo professor cadastrado' end,
      'd', coalesce(p_data->>'nome', ''), 'at', now(), 'kind', 'info', 'read', false));
  return papel;
end $$;

-- Mescla duas fichas do mesmo aluno (cadastro duplicado). Só professor.
-- p_manter: ficha cujos dados prevalecem. Campos vazios nela são completados pela outra.
-- Presenças, avisos, pagamentos, notas e histórico das duas ficam juntos.
-- Se só uma das fichas tem conta no app, a conta continua valendo (o login não se perde).
create or replace function public.mesclar_alunos(p_manter uuid, p_remover uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a public.profiles; b public.profiles; dados jsonb; k text; alvo uuid; outro uuid;
begin
  if not public.is_staff() then raise exception 'Só professores podem mesclar alunos.'; end if;
  if p_manter = p_remover then raise exception 'Escolha duas fichas diferentes.'; end if;
  select * into a from public.profiles where id = p_manter and role = 'aluno';
  select * into b from public.profiles where id = p_remover and role = 'aluno';
  if a.id is null or b.id is null then raise exception 'Ficha de aluno não encontrada.'; end if;
  dados := a.data;
  for k in select jsonb_object_keys(b.data) loop
    if not (dados ? k) or dados->k in ('null'::jsonb, '""'::jsonb, '[]'::jsonb, '{}'::jsonb) then
      dados := dados || jsonb_build_object(k, b.data->k);
    end if;
  end loop;
  dados := dados || jsonb_build_object(
    'notes', coalesce(a.data->'notes', '[]') || coalesce(b.data->'notes', '[]'),
    'hist', coalesce(a.data->'hist', '[]') || coalesce(b.data->'hist', '[]'),
    'pagamentos', coalesce((select jsonb_agg(x) from (
        select distinct on (x->>'mes') x from jsonb_array_elements(coalesce(a.data->'pagamentos', '[]') || coalesce(b.data->'pagamentos', '[]')) x
        order by x->>'mes') t), '[]'),
    'tecnicas', coalesce(b.data->'tecnicas', '{}') || coalesce(a.data->'tecnicas', '{}'),
    'totalAnterior', greatest(coalesce((a.data->>'totalAnterior')::int, 0), coalesce((b.data->>'totalAnterior')::int, 0)),
    'convidado', coalesce((a.data->>'convidado')::boolean, false) and coalesce((b.data->>'convidado')::boolean, false));
  -- fica o id que tem conta no app (o login é ligado ao id)
  if coalesce((a.data->>'convidado')::boolean, false) and not coalesce((b.data->>'convidado')::boolean, false) then
    alvo := b.id; outro := a.id;
  else
    alvo := a.id; outro := b.id;
  end if;
  perform set_config('oseki.sistema', '1', true);
  update public.att set sid = alvo where sid = outro;
  update public.notifs set dest = alvo::text where dest = outro::text;
  delete from public.profiles where id = outro;
  update public.profiles set data = dados || jsonb_build_object('aulas',
      coalesce((a.data->>'aulas')::int, 0) + coalesce((b.data->>'aulas')::int, 0)) where id = alvo;
  perform set_config('oseki.sistema', '0', true);
  return alvo;
end $$;

-- O primeiro professor recebe o código de professor sem precisar dele:
-- enquanto não existe nenhum admin, este código fica visível só para quem está criando a conta.
create or replace function public.primeiro_acesso() returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where role = 'admin');
$$;
create or replace function public.codigo_inicial() returns text
language sql stable security definer set search_path = public as $$
  select case when public.primeiro_acesso() then (select codigo_prof from public.segredos where id = 1) else null end;
$$;

-- Lista pública (dentro da academia) para ranking e nomes: sem telefone nem pagamentos
create or replace function public.diretorio() returns table (id uuid, role text, data jsonb)
language sql stable security definer set search_path = public as $$
  select p.id, p.role,
    jsonb_build_object('nome', p.data->'nome', 'apelido', p.data->'apelido', 'belt', p.data->'belt', 'graus', p.data->'graus', 'foto', p.data->'foto',
      'turma', p.data->'turma', 'nasc', p.data->'nasc', 'fundador', p.data->'fundador', 'plano', p.data->'plano', 'status', p.data->'status')
  from public.profiles p
  where auth.uid() is not null;
$$;
create or replace function public.presencas_ranking(p_desde date) returns table (id text, sid uuid, date date, status text, data jsonb)
language sql stable security definer set search_path = public as $$
  select a.id, a.sid, a.date, a.status, jsonb_build_object('classId', a.data->'classId', 'via', a.data->'via')
  from public.att a
  where auth.uid() is not null and a.status = 'ok' and a.date >= p_desde;
$$;

-- ---------- Segurança (RLS) ----------
alter table public.profiles enable row level security;
alter table public.att enable row level security;
alter table public.notifs enable row level security;
alter table public.aulas enable row level security;
alter table public.tecnicas enable row level security;
alter table public.access enable row level security;
alter table public.avisos enable row level security;
alter table public.settings enable row level security;
alter table public.segredos enable row level security;

drop policy if exists p_sel on public.profiles;
drop policy if exists p_ins on public.profiles;
drop policy if exists p_upd on public.profiles;
drop policy if exists p_del on public.profiles;
create policy p_sel on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy p_ins on public.profiles for insert with check (public.is_staff());
create policy p_upd on public.profiles for update using (id = auth.uid() or public.is_staff()) with check (id = auth.uid() or public.is_staff());
create policy p_del on public.profiles for delete using (public.is_admin());

drop policy if exists a_sel on public.att;
drop policy if exists a_ins on public.att;
drop policy if exists a_upd on public.att;
drop policy if exists a_del on public.att;
create policy a_sel on public.att for select using (sid = auth.uid() or public.is_staff());
create policy a_ins on public.att for insert with check (
  public.is_staff() or (sid = auth.uid() and (status = 'pend' or (status = 'ok' and data->>'via' in ('gps','qr')))));
create policy a_upd on public.att for update
  using (public.is_staff() or (sid = auth.uid() and status = 'rej'))
  with check (public.is_staff() or (sid = auth.uid() and status = 'pend'));
create policy a_del on public.att for delete using (public.is_staff());

drop policy if exists n_sel on public.notifs;
drop policy if exists n_ins on public.notifs;
drop policy if exists n_upd on public.notifs;
drop policy if exists n_del on public.notifs;
create policy n_sel on public.notifs for select using (dest = auth.uid()::text or (dest = 'prof' and public.is_staff()) or public.is_staff());
create policy n_ins on public.notifs for insert with check (auth.uid() is not null);
create policy n_upd on public.notifs for update using (dest = auth.uid()::text or public.is_staff());
create policy n_del on public.notifs for delete using (dest = auth.uid()::text or public.is_staff());

do $$
declare t text;
begin
  foreach t in array array['aulas','tecnicas','settings'] loop
    execute format('drop policy if exists r_sel on public.%I', t);
    execute format('drop policy if exists r_all on public.%I', t);
    execute format('create policy r_sel on public.%I for select using (auth.uid() is not null)', t);
    execute format('create policy r_all on public.%I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
  foreach t in array array['access','avisos','segredos'] loop
    execute format('drop policy if exists s_all on public.%I', t);
    execute format('create policy s_all on public.%I for all using (public.is_staff()) with check (public.is_staff())', t);
  end loop;
end $$;
-- Professores podem ler/alterar os códigos, mas a linha nunca é apagada
revoke delete on public.segredos from authenticated;

grant execute on function public.criar_perfil(text, text, jsonb) to authenticated;
grant execute on function public.diretorio() to authenticated;
grant execute on function public.mesclar_alunos(uuid, uuid) to authenticated;
grant execute on function public.presencas_ranking(date) to authenticated;
grant execute on function public.codigo_inicial() to anon, authenticated;
grant execute on function public.fichas_livres(text) to anon, authenticated;
grant execute on function public.primeiro_acesso() to anon, authenticated;

-- ---------- Tempo real ----------
do $$
declare t text;
begin
  foreach t in array array['profiles','att','notifs','aulas','tecnicas','settings','access','avisos'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when others then null; -- já adicionada ou publicação inexistente
    end;
  end loop;
end $$;

-- ---------- Dados iniciais da academia (só se ainda não existirem) ----------
insert into public.settings (id, data) values (1, '{
  "academia": "Oseki BJJ",
  "equipe": "Marangoni BJJ / Oseki BJJ",
  "endereco": "",
  "whatsapp": "",
  "codigo": "OSEKI-2026",
  "lat": null, "lng": null, "raio": 100, "revisarGps": false,
  "metodos": {"gps": true, "qr": true, "app": true},
  "proximoExame": null,
  "planoAula": {"tecnica": "", "passos": [
    {"t": "Aquecimento", "d": "Fuga de quadril, rolamentos e ponte", "min": 10, "done": false},
    {"t": "Técnica", "d": "Demonstração da técnica do dia", "min": 15, "done": false},
    {"t": "Drill", "d": "Repetições em dupla", "min": 15, "done": false},
    {"t": "Treino específico", "d": "Começando na posição do dia", "min": 12, "done": false},
    {"t": "Rola livre", "d": "Rounds de 5 min", "min": 25, "done": false}]},
  "requisitos": {"Branca": 40, "Cinza e Branca": 20, "Amarela": 20, "Laranja": 20, "Verde": 20, "Azul": 60, "Roxa": 60, "Marrom": 60, "Preta": 80},
  "fundadorVagas": 50, "fundadorDesconto": 15, "fundadorTolerancia": 10,
  "precos": {"avulso": 0, "mensal": 0, "trimestral": 0, "semestral": 0, "anual": 0},
  "vencimento": 15,
  "chavePix": "",
  "conteudo": {
    "Biblioteca de técnicas": {"avulso": false, "mensal": true, "trimestral": true, "semestral": true, "anual": true},
    "Posição da semana": {"avulso": true, "mensal": true, "trimestral": true, "semestral": true, "anual": true},
    "Open mat de sábado": {"avulso": false, "mensal": false, "trimestral": true, "semestral": true, "anual": true},
    "Aulas de competição": {"avulso": false, "mensal": false, "trimestral": true, "semestral": true, "anual": true},
    "Seminários gravados": {"avulso": false, "mensal": false, "trimestral": false, "semestral": true, "anual": true},
    "Plano de treino individual": {"avulso": false, "mensal": false, "trimestral": false, "semestral": false, "anual": true}
  },
  "rankingPublicado": false
}'::jsonb) on conflict (id) do nothing;

insert into public.aulas (id, data) values
  ('adulto', '{"id":"adulto","nome":"Jiu-Jitsu Adulto","ini":"19:30","fim":"21:00","dias":[1,3],"publico":"Adulto","prof":"","vagas":40,"grupo":"Adulto"}'),
  ('lab', '{"id":"lab","nome":"Laboratório Oseki BJJ","ini":"19:30","fim":"20:30","dias":[5],"publico":"Adulto","prof":"","vagas":40,"grupo":"Adulto"}')
on conflict (id) do nothing;

-- Mostra o código de professor gerado (use para criar a primeira conta de professor)
select codigo_aluno as "Código do aluno", codigo_prof as "Código do professor" from public.segredos;
