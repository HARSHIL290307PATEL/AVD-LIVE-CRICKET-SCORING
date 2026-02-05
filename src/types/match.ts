export interface Player {
  id: string;
  name: string;
  photo?: string; // Base64 data URL for player image
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  isImpactPlayer?: boolean;
  battingOrder?: number;
}

export interface BattingStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType?: string;
  dismissedBy?: string;
}

export interface BowlingStats {
  playerId: string;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  maidens: number;
  wides: number;
  noBalls: number;
  isThrowBowler?: boolean;
}

export interface BallEvent {
  id: string;
  over: number;
  ball: number;
  runs: number;
  extras: number;
  goldenBallBonus: number; // Bonus runs from golden ball (added to team total but not player stats)
  extraType?: ExtraType;
  isWicket: boolean;
  wicketType?: string;
  dismissedBy?: string;
  batsmanId: string;
  bowlerId: string;
  isGoldenBall: boolean;
  isGoldenDelivery: boolean;
  isPowerSurge: boolean;
  isPowerplay: boolean;
  isBehindStump: boolean;
  timestamp: number;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
  };
  battingStats: BattingStats[];
  bowlingStats: BowlingStats[];
  currentStriker: string | null;
  currentNonStriker: string | null;
  currentBowler: string | null;
  ballEvents: BallEvent[];
  isPowerplay: boolean;
  powerSurgeUsed: boolean;
  powerSurgeOver: number | null;
  goldenBalls: number[]; // Ball indices for golden balls
  goldenDeliveryDone: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  primaryColor: string;
  players: Player[];
}

export interface TossInfo {
  winnerId: string;
  winnerPlayerName: string;
  decision: 'bat' | 'bowl';
}

export interface Match {
  id: string;
  name: string;
  totalOvers: number;
  venue?: string;
  date: string;
  teams: {
    teamA: Team;
    teamB: Team;
  };
  toss?: TossInfo;
  currentInnings: 1 | 2;
  innings: {
    first?: Innings;
    second?: Innings;
  };
  status: 'setup' | 'toss' | 'live' | 'innings_break' | 'completed';
  result?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MatchState {
  matches: Match[];
  currentMatchId: string | null;
}

export type RunType = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
export type ExtraType = 'wide' | 'noball' | 'bye' | 'legbye' | 'penalty';
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'caught_tree';
