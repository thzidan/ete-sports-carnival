export const MATCH_SELECT = `
  id,
  sport_id,
  team1_id,
  team2_id,
  team1_score,
  team2_score,
  winner_id,
  status,
  scheduled_at,
  venue,
  notes,
  created_at,
  sport:sports!matches_sport_id_fkey(id, name, icon),
  team1:teams!matches_team1_id_fkey(id, name, logo_url),
  team2:teams!matches_team2_id_fkey(id, name, logo_url),
  winner:teams!matches_winner_id_fkey(id, name, logo_url)
`;

export const STANDINGS_SELECT = `
  id,
  sport_id,
  team_id,
  points,
  wins,
  losses,
  draws,
  matches_played,
  sport:sports!standings_sport_id_fkey(id, name, icon),
  team:teams!standings_team_id_fkey(id, name, logo_url)
`;

export const PLAYER_SELECT = `
  id,
  name,
  series,
  position,
  photo_url,
  base_price,
  sold_price,
  sold_to_team_id,
  status,
  created_at,
  team:teams!players_sold_to_team_id_fkey(id, name, logo_url, auction_credits)
`;
