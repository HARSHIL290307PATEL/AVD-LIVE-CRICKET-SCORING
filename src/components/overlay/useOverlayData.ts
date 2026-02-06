import { useState, useEffect, useMemo } from "react";
import { Match, Player } from "@/types/match";

export function useOverlayData(match: Match) {
  const [showAnimation, setShowAnimation] = useState<'four' | 'six' | 'wicket' | 'golden' | 'freehit' | null>(null);
  const [specialEventText, setSpecialEventText] = useState<string | null>(null);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  // State for stable batsman slots to prevent jumping
  const [batsmanOneId, setBatsmanOneId] = useState<string | null>(null);
  const [batsmanTwoId, setBatsmanTwoId] = useState<string | null>(null);

  const currentInnings = match.currentInnings === 1 ? match.innings.first : match.innings.second;

  // Watch for new events and trigger animations
  useEffect(() => {
    if (!currentInnings || currentInnings.ballEvents.length === 0) return;

    const lastEvent = currentInnings.ballEvents[currentInnings.ballEvents.length - 1];
    if (lastEvent.id !== lastEventId) {
      setLastEventId(lastEvent.id);

      if (lastEvent.isWicket) {
        setShowAnimation('wicket');
        setSpecialEventText("WICKET!");
        setTimeout(() => { setShowAnimation(null); setSpecialEventText(null); }, 4000);
      } else if (lastEvent.runs === 6 || lastEvent.runs === 12) {
        setShowAnimation('six');
        setSpecialEventText("SUPER SIX!");
        setTimeout(() => { setShowAnimation(null); setSpecialEventText(null); }, 4000);
      } else if (lastEvent.runs === 4 || lastEvent.runs === 8) {
        setShowAnimation('four');
        setSpecialEventText("FOUR RUNS!");
        setTimeout(() => { setShowAnimation(null); setSpecialEventText(null); }, 4000);
      } else if (lastEvent.isGoldenBall || lastEvent.isGoldenDelivery) {
        setShowAnimation('golden');
        setSpecialEventText("GOLDEN BALL!");
        setTimeout(() => { setShowAnimation(null); setSpecialEventText(null); }, 4000);
      } else if (lastEvent.extraType === 'noball') {
        setShowAnimation('freehit');
        setSpecialEventText("FREE HIT!");
        setTimeout(() => { setShowAnimation(null); setSpecialEventText(null); }, 4000);
      }
    }
  }, [currentInnings?.ballEvents.length, lastEventId]);

  // Update stable batsman slots
  useEffect(() => {
    if (!currentInnings) return;

    const strikerId = currentInnings.currentStriker;
    const nonStrikerId = currentInnings.currentNonStriker;

    if (!strikerId && !nonStrikerId) return;

    // Initial setup
    if (!batsmanOneId && !batsmanTwoId) {
      if (strikerId) setBatsmanOneId(strikerId);
      if (nonStrikerId) setBatsmanTwoId(nonStrikerId);
      return;
    }

    // Logic to keep players in their slots
    // If a player is already locally stored, keep them there.
    // If a slot is empty or invalid (player out/not in current pair), update it.

    const activeIds = [strikerId, nonStrikerId].filter(Boolean) as string[];

    // If both slots match active players (in any order), we are good
    if (activeIds.includes(batsmanOneId!) && activeIds.includes(batsmanTwoId!)) {
      return;
    }

    // If one slot matches an active player, put the OTHER active player in the OTHER slot
    if (activeIds.includes(batsmanOneId!) && !activeIds.includes(batsmanTwoId!)) {
      const newPlayer = activeIds.find(id => id !== batsmanOneId);
      if (newPlayer) setBatsmanTwoId(newPlayer);
    } else if (activeIds.includes(batsmanTwoId!) && !activeIds.includes(batsmanOneId!)) {
      const newPlayer = activeIds.find(id => id !== batsmanTwoId);
      if (newPlayer) setBatsmanOneId(newPlayer);
    } else {
      // Clean slate if everything confused
      if (strikerId) setBatsmanOneId(strikerId);
      if (nonStrikerId) setBatsmanTwoId(nonStrikerId);
    }

  }, [currentInnings?.currentStriker, currentInnings?.currentNonStriker, batsmanOneId, batsmanTwoId]);

  const battingTeam = currentInnings?.battingTeamId === match.teams.teamA.id
    ? match.teams.teamA
    : match.teams.teamB;
  const bowlingTeam = currentInnings?.bowlingTeamId === match.teams.teamA.id
    ? match.teams.teamA
    : match.teams.teamB;

  // Resolve player objects from IDs
  const batsmanOne = battingTeam?.players.find(p => p.id === batsmanOneId);
  const batsmanTwo = battingTeam?.players.find(p => p.id === batsmanTwoId);

  const currentStrikerId = currentInnings?.currentStriker;
  // const currentNonStrikerId = currentInnings?.currentNonStriker;

  const startStriker = battingTeam?.players.find(p => p.id === currentInnings?.currentStriker);
  const startNonStriker = battingTeam?.players.find(p => p.id === currentInnings?.currentNonStriker);
  const bowler = bowlingTeam?.players.find(p => p.id === currentInnings?.currentBowler);

  const currentOver = currentInnings?.overs ?? 0;
  const isPowerplay = currentOver < 2;
  const isPowerSurge = currentInnings?.powerSurgeOver === currentOver;

  const totalBalls = (currentInnings?.overs ?? 0) * 6 + (currentInnings?.balls ?? 0);
  const isCurrentBallGolden = currentInnings?.goldenBalls.includes(totalBalls) ?? false;
  const isGoldenDelivery = totalBalls === 0 && !currentInnings?.goldenDeliveryDone;

  // Calculate total runs from events to ensure consistency with other stats
  const totalRuns = currentInnings
    ? currentInnings.ballEvents.reduce((sum, e) => sum + e.runs + (e.extras || 0) + (e.goldenBallBonus || 0), 0)
    : 0;

  // Calculate run rates
  let requiredRuns = 0;
  let requiredRR = 0;
  if (match.currentInnings === 2 && match.innings.first && currentInnings) {
    const target = match.innings.first.runs + 1;
    requiredRuns = Math.max(0, target - totalRuns);
    const ballsRemaining = 60 - totalBalls;
    const oversRemaining = ballsRemaining / 6;
    requiredRR = oversRemaining > 0 ? requiredRuns / oversRemaining : 0;
  }

  const currentRR = totalBalls > 0
    ? (totalRuns / totalBalls) * 6
    : 0;

  // Get current over balls
  const currentOverBalls = useMemo(() =>
    currentInnings?.ballEvents.filter(e => e.over === currentInnings.overs) ?? [],
    [currentInnings?.ballEvents, currentInnings?.overs]
  );

  // Get batsman stats
  const getBatsmanStats = (player: Player | undefined) => {
    if (!player || !currentInnings) return { runs: 0, balls: 0, fours: 0, sixes: 0 };
    const events = currentInnings.ballEvents.filter(e => e.batsmanId === player.id && !e.extraType);
    return {
      runs: events.reduce((sum, e) => sum + e.runs, 0),
      balls: events.length,
      fours: events.filter(e => e.runs === 4 || e.runs === 8).length,
      sixes: events.filter(e => e.runs === 6 || e.runs === 12).length,
    };
  };

  const strikerStats = getBatsmanStats(startStriker);
  const nonStrikerStats = getBatsmanStats(startNonStriker);

  const batsmanOneStats = getBatsmanStats(batsmanOne);
  const batsmanTwoStats = getBatsmanStats(batsmanTwo);

  // Is out check - naive check against current innings stats
  const batsmanOneIsOut = currentInnings?.battingStats.find(s => s.playerId === batsmanOneId)?.isOut ?? false;
  const batsmanTwoIsOut = currentInnings?.battingStats.find(s => s.playerId === batsmanTwoId)?.isOut ?? false;

  // Calculate partnership
  const partnership = useMemo(() => {
    if (!currentInnings || !startStriker || !startNonStriker) return { runs: 0, balls: 0 };

    // Find last wicket index
    const lastWicketIdx = [...currentInnings.ballEvents].reverse().findIndex(e => e.isWicket);
    const startIdx = lastWicketIdx === -1 ? 0 : currentInnings.ballEvents.length - lastWicketIdx;

    const partnershipEvents = currentInnings.ballEvents.slice(startIdx);
    return {
      runs: partnershipEvents.reduce((sum, e) => sum + e.runs + (e.extras || 0) + (e.goldenBallBonus || 0), 0),
      balls: partnershipEvents.filter(e => !e.extraType || e.extraType === 'legbye' || e.extraType === 'bye').length,
    };
  }, [currentInnings?.ballEvents, startStriker?.id, startNonStriker?.id]);

  // Get bowler stats
  const bowlerStats = useMemo(() => {
    if (!bowler || !currentInnings) return { overs: '0.0', runs: 0, wickets: 0, maidens: 0 };
    const events = currentInnings.ballEvents.filter(e => e.bowlerId === bowler.id);
    const legalBalls = events.filter(e => !e.extraType || e.extraType === 'legbye' || e.extraType === 'bye').length;
    const completedOvers = Math.floor(legalBalls / 6);
    const remainingBalls = legalBalls % 6;

    return {
      overs: `${completedOvers}.${remainingBalls}`,
      runs: events.reduce((sum, e) => sum + e.runs + (e.extras || 0) + (e.goldenBallBonus || 0), 0),
      wickets: events.filter(e => e.isWicket).length,
      maidens: 0,
    };
  }, [currentInnings?.ballEvents, bowler?.id]);

  return {
    currentInnings,
    showAnimation,
    specialEventText,
    battingTeam,
    bowlingTeam,
    striker: startStriker,
    nonStriker: startNonStriker,

    // Stable slots
    batsmanOne,
    batsmanOneStats,
    batsmanOneIsStriker: batsmanOneId === currentStrikerId,
    batsmanOneIsOut,

    batsmanTwo,
    batsmanTwoStats,
    batsmanTwoIsStriker: batsmanTwoId === currentStrikerId,
    batsmanTwoIsOut,

    bowler,
    isPowerplay,
    isPowerSurge,
    isCurrentBallGolden,
    isGoldenDelivery,
    totalBalls,
    requiredRuns,
    requiredRR: requiredRR.toFixed(2),
    currentRR: currentRR.toFixed(2),
    currentOverBalls: currentOverBalls.map(ball => ({
      ...ball,
      display: ball.isWicket ? 'W' : ball.extraType ? `${ball.extras}${ball.extraType[0].toUpperCase()}` : ball.runs.toString(),
    })),
    strikerStats,
    nonStrikerStats,
    partnership,
    bowlerStats,
    totalRuns,

  };
}