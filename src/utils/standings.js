export const calculateStandings = (matches = [], teams = [], sports = []) => {
  const table = new Map();

  for (const sport of sports) {
    for (const team of teams) {
      table.set(`${sport.id}:${team.id}`, {
        sport_id: sport.id,
        team_id: team.id,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        matches_played: 0,
      });
    }
  }

  for (const match of matches) {
    if (match.status !== 'completed') {
      continue;
    }

    const team1Key = `${match.sport_id}:${match.team1_id}`;
    const team2Key = `${match.sport_id}:${match.team2_id}`;

    if (!table.has(team1Key) || !table.has(team2Key)) {
      continue;
    }

    const team1 = table.get(team1Key);
    const team2 = table.get(team2Key);

    team1.matches_played += 1;
    team2.matches_played += 1;

    if (!match.winner_id) {
      team1.points += 1;
      team2.points += 1;
      team1.draws += 1;
      team2.draws += 1;
      continue;
    }

    if (match.winner_id === match.team1_id) {
      team1.points += 3;
      team1.wins += 1;
      team2.losses += 1;
      continue;
    }

    if (match.winner_id === match.team2_id) {
      team2.points += 3;
      team2.wins += 1;
      team1.losses += 1;
    }
  }

  return Array.from(table.values());
};

export const buildOverallLeaderboard = (standings = []) => {
  const leaderboard = new Map();

  for (const row of standings) {
    const teamId = row.team?.id ?? row.team_id;

    if (!teamId) {
      continue;
    }

    if (!leaderboard.has(teamId)) {
      leaderboard.set(teamId, {
        team: row.team,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        matches_played: 0,
      });
    }

    const current = leaderboard.get(teamId);
    current.points += row.points ?? 0;
    current.wins += row.wins ?? 0;
    current.losses += row.losses ?? 0;
    current.draws += row.draws ?? 0;
    current.matches_played += row.matches_played ?? 0;
  }

  return Array.from(leaderboard.values()).sort((left, right) => right.points - left.points || right.wins - left.wins);
};

export const buildSportLeaders = (sports = [], standings = []) =>
  sports
    .map((sport) => {
      const rows = standings
        .filter((row) => row.sport_id === sport.id)
        .sort((left, right) => right.points - left.points || right.wins - left.wins);

      return {
        sport,
        leader: rows[0] ?? null,
      };
    })
    .filter((entry) => entry.leader);
