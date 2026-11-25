-- Milestone M1: Views (chỉ đọc từ results) & Bảo mật mức dòng (RLS)

-- Hàm tiện ích kiểm tra Admin
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ============================================================
-- VIEWS (chỉ dùng bảng results, không lộ score_submissions)
-- ============================================================

-- 1. Cờ chờ duyệt & xung đột cho công khai (không lộ tỉ số đề xuất)
create or replace view v_pending_flags
with (security_invoker = false)
as
select
  m.id as match_id,
  count(s.id) filter (where s.status = 'pending') > 0 as has_pending,
  (
    count(distinct case
      when s.status = 'pending' and s.sets_a > s.sets_b then 'a'
      when s.status = 'pending' and s.sets_b > s.sets_a then 'b'
    end) > 1
  ) as has_conflict
from matches m
left join score_submissions s on s.match_id = m.id
group by m.id;

-- 2. Bảng xếp hạng đội
create or replace view v_team_standings as
with side_teams as (
  select distinct
    ms.match_id,
    ms.side,
    sp.team_id
  from match_sides ms
  join matches m on m.id = ms.match_id
  join season_players sp on sp.season_id = m.season_id and sp.player_id = ms.player_id
)
select
  t.season_id,
  t.id as team_id,
  t.name as team_name,
  t.color,
  t.sort_order,
  count(r.match_id) filter (
    where (st.side = 'a' and r.winner_side = 'a')
       or (st.side = 'b' and r.winner_side = 'b')
  ) as wins,
  count(r.match_id) filter (
    where r.match_id is not null and (
      (st.side = 'a' and (r.winner_side = 'b' or r.winner_side is null))
      or (st.side = 'b' and (r.winner_side = 'a' or r.winner_side is null))
    )
  ) as losses,
  coalesce(sum(
    case
      when r.match_id is null then 0
      when st.side = 'a' then r.sets_a
      else r.sets_b
    end
  ), 0) as sets_won,
  coalesce(sum(
    case
      when r.match_id is null then 0
      when st.side = 'a' then r.sets_b
      else r.sets_a
    end
  ), 0) as sets_lost,
  count(r.match_id) filter (
    where m.kind = 'singles'
      and ((st.side = 'a' and r.winner_side = 'a') or (st.side = 'b' and r.winner_side = 'b'))
  ) as singles_wins
from teams t
left join side_teams st on st.team_id = t.id
left join matches m on m.id = st.match_id
left join results r on r.match_id = m.id
group by t.season_id, t.id, t.name, t.color, t.sort_order;

-- 3. Thống kê cá nhân
create or replace view v_player_stats as
select
  sp.season_id,
  p.id as player_id,
  p.full_name,
  p.nickname,
  sp.team_id,
  sp.rating_start,
  sp.is_provisional,
  count(r.match_id) filter (
    where m.kind = 'singles'
      and ((ms.side = 'a' and r.winner_side = 'a') or (ms.side = 'b' and r.winner_side = 'b'))
  ) as singles_wins,
  count(r.match_id) filter (
    where m.kind = 'singles'
      and r.match_id is not null
      and not ((ms.side = 'a' and r.winner_side = 'a') or (ms.side = 'b' and r.winner_side = 'b'))
  ) as singles_losses,
  count(r.match_id) filter (
    where m.kind = 'doubles'
      and ((ms.side = 'a' and r.winner_side = 'a') or (ms.side = 'b' and r.winner_side = 'b'))
  ) as doubles_wins,
  count(r.match_id) filter (
    where m.kind = 'doubles'
      and r.match_id is not null
      and not ((ms.side = 'a' and r.winner_side = 'a') or (ms.side = 'b' and r.winner_side = 'b'))
  ) as doubles_losses
from season_players sp
join players p on p.id = sp.player_id
left join match_sides ms on ms.player_id = sp.player_id
left join matches m on m.id = ms.match_id and m.season_id = sp.season_id
left join results r on r.match_id = m.id
group by sp.season_id, p.id, p.full_name, p.nickname, sp.team_id, sp.rating_start, sp.is_provisional;

-- 4. Thống kê cặp đôi
create or replace view v_pair_stats as
with doubles_pairs as (
  select
    m.season_id,
    m.id as match_id,
    ms.side,
    min(ms.player_id::text)::uuid as player_1_id,
    max(ms.player_id::text)::uuid as player_2_id
  from matches m
  join match_sides ms on ms.match_id = m.id
  where m.kind = 'doubles'
  group by m.season_id, m.id, ms.side
  having count(*) = 2
)
select
  dp.season_id,
  dp.player_1_id,
  dp.player_2_id,
  count(r.match_id) filter (
    where (dp.side = 'a' and r.winner_side = 'a')
       or (dp.side = 'b' and r.winner_side = 'b')
  ) as wins,
  count(r.match_id) filter (
    where r.match_id is not null
      and not ((dp.side = 'a' and r.winner_side = 'a') or (dp.side = 'b' and r.winner_side = 'b'))
  ) as losses
from doubles_pairs dp
left join results r on r.match_id = dp.match_id
group by dp.season_id, dp.player_1_id, dp.player_2_id;

-- ============================================================
-- BẬT RLS CHO MỌI BẢNG
-- ============================================================

alter table seasons enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table season_players enable row level security;
alter table handicap_rules enable row level security;
alter table periods enable row level security;
alter table alert_log enable row level security;
alter table fixtures enable row level security;
alter table matches enable row level security;
alter table match_sides enable row level security;
alter table score_submissions enable row level security;
alter table results enable row level security;
alter table rating_decisions enable row level security;
alter table audit_log enable row level security;
alter table attendance enable row level security;
alter table admins enable row level security;

-- Chính sách đọc công khai cho khách
create policy "public_read_seasons" on seasons for select using (true);
create policy "public_read_teams" on teams for select using (true);
create policy "public_read_players" on players for select using (true);
create policy "public_read_season_players" on season_players for select using (true);
create policy "public_read_handicap_rules" on handicap_rules for select using (true);
create policy "public_read_periods" on periods for select using (true);
create policy "public_read_fixtures" on fixtures for select using (true);

-- Khách chỉ xem trận thuộc kỳ đã đăng hoặc đã đóng (AC16)
create policy "public_read_published_matches" on matches
  for select using (
    exists (
      select 1 from periods p
      where p.id = matches.period_id
        and p.status in ('published', 'closed')
    )
  );

create policy "public_read_published_match_sides" on match_sides
  for select using (
    exists (
      select 1 from matches m
      join periods p on p.id = m.period_id
      where m.id = match_sides.match_id
        and p.status in ('published', 'closed')
    )
  );

create policy "public_read_results" on results for select using (true);
create policy "public_read_attendance" on attendance for select using (true);

-- Lưu ý AC8:
-- Không tạo policy select/insert/update/delete cho khách trên score_submissions!
-- Khách gửi tỉ số qua Route Handler phía server sử dụng service_role.

-- Toàn quyền cho Admin trên mọi bảng
create policy "admin_all_seasons" on seasons for all using (is_admin()) with check (is_admin());
create policy "admin_all_teams" on teams for all using (is_admin()) with check (is_admin());
create policy "admin_all_players" on players for all using (is_admin()) with check (is_admin());
create policy "admin_all_season_players" on season_players for all using (is_admin()) with check (is_admin());
create policy "admin_all_handicap_rules" on handicap_rules for all using (is_admin()) with check (is_admin());
create policy "admin_all_periods" on periods for all using (is_admin()) with check (is_admin());
create policy "admin_all_alert_log" on alert_log for all using (is_admin()) with check (is_admin());
create policy "admin_all_fixtures" on fixtures for all using (is_admin()) with check (is_admin());
create policy "admin_all_matches" on matches for all using (is_admin()) with check (is_admin());
create policy "admin_all_match_sides" on match_sides for all using (is_admin()) with check (is_admin());
create policy "admin_all_score_submissions" on score_submissions for all using (is_admin()) with check (is_admin());
create policy "admin_all_results" on results for all using (is_admin()) with check (is_admin());
create policy "admin_all_rating_decisions" on rating_decisions for all using (is_admin()) with check (is_admin());
create policy "admin_all_audit_log" on audit_log for all using (is_admin()) with check (is_admin());
create policy "admin_all_attendance" on attendance for all using (is_admin()) with check (is_admin());
create policy "admin_read_self" on admins for select using (auth.uid() = user_id);
