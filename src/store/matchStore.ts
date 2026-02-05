import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Match, MatchState, Team, Player, Innings, BallEvent, RunType, ExtraType, WicketType } from '@/types/match';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyInnings = (battingTeamId: string, bowlingTeamId: string): Innings => ({
  battingTeamId,
  bowlingTeamId,
  runs: 0,
  wickets: 0,
  overs: 0,
  balls: 0,
  extras: { wides: 0, noBalls: 0, byes: 0, legByes: 0 },
  battingStats: [],
  bowlingStats: [],
  currentStriker: null,
  currentNonStriker: null,
  currentBowler: null,
  ballEvents: [],
  isPowerplay: true,
  powerSurgeUsed: false,
  powerSurgeOver: null,
  goldenBalls: [], // Now admin-controlled, not random
  goldenDeliveryDone: false,
});

interface MatchStore extends MatchState {
  // Match management
  createMatch: (name: string, totalOvers: number, teamA: Team, teamB: Team) => string;
  deleteMatch: (matchId: string) => void;
  setCurrentMatch: (matchId: string | null) => void;
  getMatch: (matchId: string) => Match | undefined;
  getCurrentMatch: () => Match | undefined;

  // Toss
  setToss: (matchId: string, winnerId: string, winnerPlayerName: string, decision: 'bat' | 'bowl') => void;

  // Innings management
  startInnings: (matchId: string) => void;
  endInnings: (matchId: string) => void;

  // Player selection
  setStriker: (matchId: string, playerId: string) => void;
  setNonStriker: (matchId: string, playerId: string) => void;
  setBowler: (matchId: string, playerId: string) => void;
  swapBatsmen: (matchId: string) => void;

  // Scoring
  addRuns: (matchId: string, runs: RunType, options?: {
    isBehindStump?: boolean;
    isGoldenBall?: boolean;
  }) => void;
  addExtra: (matchId: string, type: ExtraType, runs?: number) => void;
  addWicket: (matchId: string, type: WicketType, dismissedBy?: string, options?: {
    isGoldenBall?: boolean;
  }) => void;

  // Special features
  activatePowerSurge: (matchId: string) => void;
  triggerGoldenBall: (matchId: string) => void;

  // Undo
  undoLastBall: (matchId: string) => void;

  // Export/Import
  exportMatch: (matchId: string) => string;
  importMatch: (jsonData: string) => void;
  exportAllMatches: () => string;
}

export const useMatchStore = create<MatchStore>()(
  persist(
    (set, get) => ({
      matches: [],
      currentMatchId: null,

      createMatch: (name, totalOvers, teamA, teamB) => {
        const id = generateId();
        const match: Match = {
          id,
          name,
          totalOvers,
          date: new Date().toISOString(),
          teams: { teamA, teamB },
          currentInnings: 1,
          innings: {},
          status: 'setup',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({
          matches: [...state.matches, match],
          currentMatchId: id,
        }));
        return id;
      },

      deleteMatch: (matchId) => {
        set((state) => ({
          matches: state.matches.filter((m) => m.id !== matchId),
          currentMatchId: state.currentMatchId === matchId ? null : state.currentMatchId,
        }));
      },

      setCurrentMatch: (matchId) => {
        set({ currentMatchId: matchId });
      },

      getMatch: (matchId) => {
        return get().matches.find((m) => m.id === matchId);
      },

      getCurrentMatch: () => {
        const { matches, currentMatchId } = get();
        return matches.find((m) => m.id === currentMatchId);
      },

      setToss: (matchId, winnerId, winnerPlayerName, decision) => {
        set((state) => ({
          matches: state.matches.map((m) =>
            m.id === matchId
              ? {
                ...m,
                toss: { winnerId, winnerPlayerName, decision },
                status: 'toss' as const,
                updatedAt: Date.now(),
              }
              : m
          ),
        }));
      },

      startInnings: (matchId) => {
        const match = get().getMatch(matchId);
        if (!match || !match.toss) return;

        // Safety check for legacy data or incomplete setup
        const teamAId = match.teams?.teamA?.id || (match.teams as any)?.home?.id;
        const teamBId = match.teams?.teamB?.id || (match.teams as any)?.away?.id;

        if (!teamAId || !teamBId) {
          console.error('Invalid team data in startInnings');
          return;
        }

        const battingFirst = match.toss.decision === 'bat'
          ? match.toss.winnerId
          : (match.toss.winnerId === teamAId ? teamBId : teamAId);

        const bowlingFirst = battingFirst === teamAId
          ? teamBId
          : teamAId;

        if (match.currentInnings === 1) {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                  ...m,
                  innings: {
                    ...m.innings,
                    first: createEmptyInnings(battingFirst, bowlingFirst),
                  },
                  status: 'live' as const,
                  updatedAt: Date.now(),
                }
                : m
            ),
          }));
        } else {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                  ...m,
                  innings: {
                    ...m.innings,
                    second: createEmptyInnings(bowlingFirst, battingFirst),
                  },
                  status: 'live' as const,
                  updatedAt: Date.now(),
                }
                : m
            ),
          }));
        }
      },

      endInnings: (matchId) => {
        const match = get().getMatch(matchId);
        if (!match) return;

        if (match.currentInnings === 1) {
          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                  ...m,
                  currentInnings: 2,
                  status: 'innings_break' as const,
                  updatedAt: Date.now(),
                }
                : m
            ),
          }));
        } else {
          // Calculate result
          const firstInningsRuns = match.innings.first?.runs || 0;
          const secondInningsRuns = match.innings.second?.runs || 0;
          let result = '';

          if (secondInningsRuns > firstInningsRuns) {
            const wicketsRemaining = 10 - (match.innings.second?.wickets || 0);
            const winningTeamId = match.innings.second?.battingTeamId;
            const winningTeam = winningTeamId === match.teams.teamA.id ? match.teams.teamA : match.teams.teamB;
            result = `${winningTeam.name} won by ${wicketsRemaining} wickets`;
          } else if (firstInningsRuns > secondInningsRuns) {
            const runsDiff = firstInningsRuns - secondInningsRuns;
            const winningTeamId = match.innings.first?.battingTeamId;
            const winningTeam = winningTeamId === match.teams.teamA.id ? match.teams.teamA : match.teams.teamB;
            result = `${winningTeam.name} won by ${runsDiff} runs`;
          } else {
            result = 'Match Tied';
          }

          set((state) => ({
            matches: state.matches.map((m) =>
              m.id === matchId
                ? {
                  ...m,
                  status: 'completed' as const,
                  result,
                  updatedAt: Date.now(),
                }
                : m
            ),
          }));
        }
      },

      setStriker: (matchId, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings) return m;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: { ...innings, currentStriker: playerId },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      setNonStriker: (matchId, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings) return m;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: { ...innings, currentNonStriker: playerId },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      setBowler: (matchId, playerId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings) return m;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: { ...innings, currentBowler: playerId },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      swapBatsmen: (matchId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings) return m;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: {
                  ...innings,
                  currentStriker: innings.currentNonStriker,
                  currentNonStriker: innings.currentStriker,
                },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      addRuns: (matchId, runs, options = {}) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings || !innings.currentStriker || !innings.currentBowler) return m;

            const isGoldenBall = options.isGoldenBall || false; // Admin-controlled only

            // Player gets actual runs, bonus goes to team total
            let playerRuns = runs;
            let goldenBallBonus = 0;
            let behindStumpBonus = options.isBehindStump ? 1 : 0;

            // Golden ball doubles runs - player gets actual, bonus is extra
            if (isGoldenBall) {
              goldenBallBonus = runs; // Bonus equals the original runs (so total is doubled)
            }

            const totalRunsForTeam = playerRuns + goldenBallBonus + behindStumpBonus;

            const newBalls = (innings.balls + 1) % 6;
            const newOvers = newBalls === 0 ? innings.overs + 1 : innings.overs;
            const shouldSwap = runs % 2 === 1 || (newBalls === 0 && runs % 2 === 0);

            const ballEvent: BallEvent = {
              id: generateId(),
              over: innings.overs,
              ball: innings.balls,
              runs: playerRuns + behindStumpBonus, // Player's actual runs
              extras: 0,
              goldenBallBonus: goldenBallBonus, // Bonus for team total
              isWicket: false,
              batsmanId: innings.currentStriker,
              bowlerId: innings.currentBowler,
              isGoldenBall,
              isGoldenDelivery: false,
              isPowerSurge: innings.powerSurgeOver === innings.overs,
              isPowerplay: innings.overs < 2,
              isBehindStump: options.isBehindStump || false,
              timestamp: Date.now(),
            };

            const newTotalRuns = innings.runs + totalRunsForTeam;
            const updatedInnings = {
              ...innings,
              runs: newTotalRuns,
              overs: newOvers,
              balls: newBalls,
              ballEvents: [...innings.ballEvents, ballEvent],
              currentStriker: shouldSwap ? innings.currentNonStriker : innings.currentStriker,
              currentNonStriker: shouldSwap ? innings.currentStriker : innings.currentNonStriker,
              currentBowler: newBalls === 0 ? null : innings.currentBowler,
              isPowerplay: newOvers < 2,
            };

            let finalStatus = m.status;
            let finalResult = m.result;
            let finalCurrentInnings = m.currentInnings;

            // Check Overs Limit
            const matchOvers = m.totalOvers || 20;
            const isOversLimit = newOvers >= matchOvers && newBalls === 0; // Check if over finished and reached limit

            if (m.currentInnings === 2) {
              const firstRuns = m.innings.first?.runs || 0;
              if (newTotalRuns > firstRuns) {
                finalStatus = 'completed';
                const wicketsLost = innings.wickets;
                const wicketsRemaining = 10 - wicketsLost;
                const winningTeam = m.innings.second?.battingTeamId === m.teams.teamA.id ? m.teams.teamA : m.teams.teamB;
                finalResult = `${winningTeam.name} won by ${wicketsRemaining} wickets`;
              }
            }

            if (isOversLimit && finalStatus !== 'completed') {
              if (m.currentInnings === 1) {
                finalCurrentInnings = 2;
                finalStatus = 'innings_break';
              } else {
                finalStatus = 'completed';
                // Calculate Result (Defended or Tie)
                const r1 = m.innings.first?.runs || 0;
                const r2 = newTotalRuns;
                if (r1 > r2) {
                  const wTeam = m.innings.first?.battingTeamId === m.teams.teamA.id ? m.teams.teamA : m.teams.teamB;
                  finalResult = `${wTeam.name} won by ${r1 - r2} runs`;
                } else if (r1 === r2) {
                  finalResult = 'Match Tied';
                }
              }
            }

            return {
              ...m,
              status: finalStatus,
              currentInnings: finalCurrentInnings,
              result: finalResult,
              innings: {
                ...m.innings,
                [inningsKey]: updatedInnings,
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      addExtra: (matchId, type, additionalRuns = 0) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings || !innings.currentBowler) return m;

            const extraRuns = type === 'wide' || type === 'noball' ? 1 + additionalRuns : additionalRuns;
            const isLegalBall = type !== 'wide' && type !== 'noball' && type !== 'penalty';

            const newBalls = isLegalBall ? (innings.balls + 1) % 6 : innings.balls;
            const newOvers = isLegalBall && newBalls === 0 ? innings.overs + 1 : innings.overs;

            const ballEvent: BallEvent = {
              id: generateId(),
              over: innings.overs,
              ball: innings.balls,
              runs: additionalRuns,
              extras: extraRuns,
              goldenBallBonus: 0,
              extraType: type,
              isWicket: false,
              batsmanId: innings.currentStriker || '',
              bowlerId: innings.currentBowler,
              isGoldenBall: false,
              isGoldenDelivery: false,
              isPowerSurge: innings.powerSurgeOver === innings.overs,
              isPowerplay: innings.overs < 2,
              isBehindStump: false,
              timestamp: Date.now(),
            };

            const updatedExtras = { ...innings.extras };
            if (type === 'wide') updatedExtras.wides += extraRuns;
            else if (type === 'noball') updatedExtras.noBalls += extraRuns;
            else if (type === 'bye') updatedExtras.byes += extraRuns;
            else if (type === 'legbye') updatedExtras.legByes += extraRuns;
            // Penalty runs are just added to total, not tracked in specific extra category in this simple model, 
            // or we could add a 'penalty' field to extras object if needed. 
            // For now, they contribute to runs but not specific extra stats unless we expand Innings interface.
            // The user didn't ask for specfic stats, just adding the rules. 
            // However, to keep types clean, I should probably leave it as is, 
            // as 'runs' property of Innings will increment by extraRuns.
            // But wait, the Store update below does `runs: innings.runs + extraRuns`. That works.

            const newTotalRuns = innings.runs + extraRuns;
            const updatedInnings = {
              ...innings,
              runs: newTotalRuns,
              overs: newOvers,
              balls: newBalls,
              extras: updatedExtras,
              ballEvents: [...innings.ballEvents, ballEvent],
              currentBowler: isLegalBall && newBalls === 0 ? null : innings.currentBowler,
              isPowerplay: newOvers < 2,
            };

            let finalStatus = m.status;
            let finalResult = m.result;
            let finalCurrentInnings = m.currentInnings;

            // Check Overs Limit
            const matchOvers = m.totalOvers || 20;
            const isOversLimit = newOvers >= matchOvers && newBalls === 0;

            if (m.currentInnings === 2) {
              const firstRuns = m.innings.first?.runs || 0;
              if (newTotalRuns > firstRuns) {
                finalStatus = 'completed';
                const wicketsRemaining = 10 - innings.wickets;
                const winningTeam = m.innings.second?.battingTeamId === m.teams.teamA.id ? m.teams.teamA : m.teams.teamB;
                finalResult = `${winningTeam.name} won by ${wicketsRemaining} wickets`;
              }
            }

            if (isOversLimit && finalStatus !== 'completed') {
              if (m.currentInnings === 1) {
                finalCurrentInnings = 2;
                finalStatus = 'innings_break';
              } else {
                finalStatus = 'completed';
                const r1 = m.innings.first?.runs || 0;
                const r2 = newTotalRuns;
                if (r1 > r2) {
                  const wTeam = m.innings.first?.battingTeamId === m.teams.teamA.id ? m.teams.teamA : m.teams.teamB;
                  finalResult = `${wTeam.name} won by ${r1 - r2} runs`;
                } else if (r1 === r2) {
                  finalResult = 'Match Tied';
                }
              }
            }

            return {
              ...m,
              status: finalStatus,
              currentInnings: finalCurrentInnings,
              result: finalResult,
              innings: {
                ...m.innings,
                [inningsKey]: updatedInnings,
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      addWicket: (matchId, type, dismissedBy, options = {}) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings || !innings.currentStriker || !innings.currentBowler) return m;

            const isGoldenBall = options.isGoldenBall || false; // Admin-controlled only

            // Golden ball wicket deducts 6 runs
            const runsDeduction = isGoldenBall ? -6 : 0;

            const newBalls = (innings.balls + 1) % 6;
            const newOvers = newBalls === 0 ? innings.overs + 1 : innings.overs;

            const ballEvent: BallEvent = {
              id: generateId(),
              over: innings.overs,
              ball: innings.balls,
              runs: runsDeduction,
              extras: 0,
              goldenBallBonus: 0,
              isWicket: true,
              wicketType: type,
              dismissedBy,
              batsmanId: innings.currentStriker,
              bowlerId: innings.currentBowler,
              isGoldenBall,
              isGoldenDelivery: false,
              isPowerSurge: innings.powerSurgeOver === innings.overs,
              isPowerplay: innings.overs < 2,
              isBehindStump: false,
              timestamp: Date.now(),
            };

            const newWickets = innings.wickets + 1;
            const updatedInnings = {
              ...innings,
              runs: Math.max(0, innings.runs + runsDeduction),
              wickets: newWickets,
              overs: newOvers,
              balls: newBalls,
              ballEvents: [...innings.ballEvents, ballEvent],
              currentStriker: null,
              currentBowler: newBalls === 0 ? null : innings.currentBowler,
              isPowerplay: newOvers < 2,
            };

            const isAllOut = newWickets >= 10;
            let finalStatus = m.status;
            let finalCurrentInnings = m.currentInnings;
            let finalResult = m.result;

            if (isAllOut) {
              if (m.currentInnings === 1) {
                finalCurrentInnings = 2;
                finalStatus = 'innings_break';
              } else {
                finalStatus = 'completed';
                // Calculate Result
                const r1 = m.innings.first?.runs || 0;
                const r2 = updatedInnings.runs;
                const diff = r1 - r2;

                // Identify winning team name
                // Usually First Innings Batting Team vs Second.
                // m.innings.first.battingTeamId should exist.
                const firstBattingTeamId = m.innings.first?.battingTeamId;
                const team1 = m.teams.teamA.id === firstBattingTeamId ? m.teams.teamA : m.teams.teamB;
                const team2 = team1.id === m.teams.teamA.id ? m.teams.teamB : m.teams.teamA;

                if (diff > 0) {
                  finalResult = `${team1.name} won by ${diff} runs`;
                } else if (diff < 0) {
                  finalResult = `${team2.name} won`;
                } else {
                  finalResult = 'Match Tied';
                }
              }
            }

            return {
              ...m,
              status: finalStatus,
              currentInnings: finalCurrentInnings,
              result: finalResult,
              innings: {
                ...m.innings,
                [inningsKey]: updatedInnings,
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      activatePowerSurge: (matchId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings || innings.powerSurgeUsed) return m;

            // Can only activate between overs 3-8
            if (innings.overs < 2 || innings.overs >= 8) return m;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: {
                  ...innings,
                  powerSurgeUsed: true,
                  powerSurgeOver: innings.overs + 1, // Next over will be power surge
                },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      triggerGoldenBall: (matchId) => {
        // This is used when umpire manually triggers golden ball
        // The actual golden ball logic is in addRuns and addWicket
      },

      undoLastBall: (matchId) => {
        set((state) => ({
          matches: state.matches.map((m) => {
            if (m.id !== matchId) return m;
            const inningsKey = m.currentInnings === 1 ? 'first' : 'second';
            const innings = m.innings[inningsKey];
            if (!innings || innings.ballEvents.length === 0) return m;

            const lastEvent = innings.ballEvents[innings.ballEvents.length - 1];
            const newBallEvents = innings.ballEvents.slice(0, -1);

            // Recalculate state from events
            let runs = 0;
            let wickets = 0;
            const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0 };
            let legalBalls = 0;

            newBallEvents.forEach((event) => {
              runs += event.runs + event.extras + (event.goldenBallBonus || 0);
              if (event.isWicket) wickets++;
              if (event.extraType === 'wide') extras.wides += event.extras;
              else if (event.extraType === 'noball') extras.noBalls += event.extras;
              else if (event.extraType === 'bye') extras.byes += event.extras;
              else if (event.extraType === 'legbye') extras.legByes += event.extras;

              if (!event.extraType || (event.extraType !== 'wide' && event.extraType !== 'noball')) {
                legalBalls++;
              }
            });

            const overs = Math.floor(legalBalls / 6);
            const balls = legalBalls % 6;

            return {
              ...m,
              innings: {
                ...m.innings,
                [inningsKey]: {
                  ...innings,
                  runs,
                  wickets,
                  overs,
                  balls,
                  extras,
                  ballEvents: newBallEvents,
                  currentStriker: lastEvent.isWicket ? innings.currentStriker :
                    (lastEvent.runs % 2 === 1 ? innings.currentNonStriker : innings.currentStriker),
                  currentNonStriker: lastEvent.isWicket ? innings.currentNonStriker :
                    (lastEvent.runs % 2 === 1 ? innings.currentStriker : innings.currentNonStriker),
                  isPowerplay: overs < 2,
                },
              },
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      exportMatch: (matchId) => {
        const match = get().getMatch(matchId);
        if (!match) return '';
        return JSON.stringify(match, null, 2);
      },

      importMatch: (jsonData) => {
        try {
          const match = JSON.parse(jsonData) as Match;
          match.id = generateId(); // Generate new ID to avoid conflicts
          set((state) => ({
            matches: [...state.matches, match],
          }));
        } catch (e) {
          console.error('Failed to import match:', e);
        }
      },

      exportAllMatches: () => {
        return JSON.stringify(get().matches, null, 2);
      },
    }),
    {
      name: 'hcl-2026-matches',
    }
  )
);

// Cross-tab synchronization: Listen for localStorage changes from other tabs
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'hcl-2026-matches') {
      const newValue = event.newValue;
      if (newValue) {
        try {
          const parsed = JSON.parse(newValue);
          if (parsed.state) {
            useMatchStore.setState(parsed.state);
          }
        } catch (e) {
          console.error('Failed to sync state across tabs:', e);
        }
      }
    }
  });
}
