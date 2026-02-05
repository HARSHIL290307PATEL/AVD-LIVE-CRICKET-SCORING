import { Match, BallEvent, Team } from "@/types/match";
import { useOverlayData } from "./useOverlayData";
import { useOverlayStore } from "@/store/overlayStore";
import { User } from "lucide-react";
import { useEffect, useState, useRef } from "react";

interface OverlayProps {
  match: Match;
}

export function Overlay({ match }: OverlayProps) {
  const data = useOverlayData(match);
  const isVisible = useOverlayStore((state) => state.isVisible);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [notification, setNotification] = useState<{ type: 'wicket' | 'four' | 'six'; event: BallEvent } | null>(null);


  const lastEventId = useRef<string | null>(null);

  useEffect(() => {
    if (data.currentInnings) {
      const events = data.currentInnings.ballEvents;
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];

        // Check if this is a new event we haven't processed
        if (lastEvent.id !== lastEventId.current) {
          lastEventId.current = lastEvent.id;

          // Determine notification type
          if (lastEvent.isWicket) {
            setNotification({ type: 'wicket', event: lastEvent });
            // Extended time for wicket details
            const timer = setTimeout(() => setNotification(null), 8000);
            return () => clearTimeout(timer);
          } else if (lastEvent.runs === 6) {
            setNotification({ type: 'six', event: lastEvent });
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
          } else if (lastEvent.runs === 4) {
            setNotification({ type: 'four', event: lastEvent });
            const timer = setTimeout(() => setNotification(null), 4000);
            return () => clearTimeout(timer);
          }
        }
      }
    }
  }, [data.currentInnings?.ballEvents, data.currentInnings?.wickets]);

  // Handle visibility changes with animation
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Wait for animation to complete before removing from DOM
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!data.currentInnings) {
    return (
      <div className="overlay-container min-h-screen flex items-end justify-center pb-6" style={{ background: 'transparent' }}>
        <div className="text-white/50 text-xl font-medium">Waiting for match to start...</div>
      </div>
    );
  }

  if (!shouldRender) {
    return <div className="overlay-container min-h-screen" style={{ background: 'transparent' }} />;
  }

  return (
    <div className="overlay-container min-h-screen relative" style={{ background: 'transparent' }}>

      {/* Notification Animation Overlay (Wicket, 4s, 6s) */}
      {notification && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-12">
          {/* Background Strip */}
          <div className={`absolute inset-x-0 h-48 opacity-90 animate-pulse transform -skew-y-3 ${notification.type === 'wicket' ? 'bg-gradient-to-r from-transparent via-red-600 to-transparent' :
              notification.type === 'four' ? 'bg-gradient-to-r from-transparent via-yellow-500 to-transparent' :
                'bg-gradient-to-r from-transparent via-purple-600 to-transparent'
            }`} />

          {/* TEXT */}
          <div className="relative z-10 flex flex-col items-center animate-bounce duration-700">
            <span className="text-9xl font-black text-white italic tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] scale-150"
              style={{ textShadow: '4px 4px 0 #000, -2px -2px 0 #000' }}>
              {notification.type.toUpperCase()}
            </span>
            <div className="mt-4 filter drop-shadow-md text-center">
              {notification.type === 'four' ? (
                <div className="text-4xl font-bold text-white tracking-widest uppercase">BOUNDARY!</div>
              ) : notification.type === 'six' ? (
                <div className="text-4xl font-bold text-white tracking-widest uppercase">MAXIMUM!</div>
              ) : (
                // Wicket Details
                (() => {
                  const event = notification.event;
                  const battingTeam = data.battingTeam;
                  const bowlingTeam = data.bowlingTeam;

                  const getP = (t: Team, id: string) => t.players.find(p => p.id === id)?.name || '';
                  const batsmanName = getP(battingTeam, event.batsmanId);
                  const bowlerName = getP(bowlingTeam, event.bowlerId);
                  const fielderName = event.dismissedBy ? getP(bowlingTeam, event.dismissedBy) : '';

                  let reason = '';
                  switch (event.wicketType) {
                    case 'bowled': reason = `b ${bowlerName}`; break;
                    case 'caught': reason = `c ${fielderName} b ${bowlerName}`; break;
                    case 'runout': reason = `Run Out (${fielderName})`; break;
                    case 'stumped': reason = `st ${fielderName} b ${bowlerName}`; break;
                    case 'lbw': reason = `lbw b ${bowlerName}`; break;
                    case 'hitwicket': reason = `Hit Wicket b ${bowlerName}`; break;
                    default: reason = `b ${bowlerName}`;
                  }

                  return (
                    <div className="flex flex-col items-center gap-1 mt-2">
                      <div className="text-4xl font-bold text-yellow-300">{batsmanName}</div>
                      <div className="text-2xl text-white/90 font-semibold">{reason}</div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Width Bottom Scoreboard with Fly-in Animation */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full transition-all duration-500 ease-out"
        style={{
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          opacity: isAnimating ? 1 : 0,
        }}
      >
        {/* Container for side panels */}
        <div className="relative flex w-full items-stretch">

          {/* Left Panel - Batting Team Info */}
          <div className="relative flex-1 min-w-0">
            {/* Orange Lightning Accent - Left Edge */}
            <div className="absolute left-0 top-0 bottom-0 w-3 z-10">
              <svg viewBox="0 0 12 80" className="h-full w-full" preserveAspectRatio="none">
                <path d="M12 0 L6 15 L12 20 L3 40 L12 45 L6 60 L12 65 L0 80 L0 0 Z" fill="#f97316" />
              </svg>
            </div>

            {/* Purple Panel */}
            <div
              className="relative pl-6 pr-4 py-4 h-full"
              style={{
                background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1033 50%, #2d1b4e 100%)',
              }}
            >
              {/* Diamond Pattern */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)`,
                }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-4 h-full">
                {/* Team Logo */}
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-orange-400/50">
                  {data.battingTeam.logo ? (
                    <img src={data.battingTeam.logo} alt={data.battingTeam.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-xl">{data.battingTeam.shortName || data.battingTeam.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>

                {/* Team Name Only */}
                <div>
                  <div className="text-white text-lg font-black uppercase tracking-wider">{data.battingTeam.shortName || data.battingTeam.name}</div>
                </div>

                {/* Separator */}
                <div className="w-px h-10 bg-white/20" />

                {/* Batsmen Info */}
                <div className="flex flex-col gap-1 min-w-[150px]">
                  {data.striker && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full overflow-hidden bg-green-500 flex items-center justify-center flex-shrink-0">
                        {data.striker.photo ? (
                          <img src={data.striker.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span className="text-white text-xs font-medium truncate max-w-[80px]">{data.striker.name}</span>
                      <span className="text-green-400 text-sm font-bold tabular-nums">{data.strikerStats.runs}*</span>
                      <span className="text-white/30 text-[10px]">({data.strikerStats.balls})</span>
                    </div>
                  )}
                  {data.nonStriker && (
                    <div className="flex items-center gap-1.5 opacity-60">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
                        {data.nonStriker.photo ? (
                          <img src={data.nonStriker.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-2 h-2 text-white/70" />
                        )}
                      </div>
                      <span className="text-white/60 text-[10px] truncate max-w-[80px]">{data.nonStriker.name}</span>
                      <span className="text-white/50 text-xs tabular-nums">{data.nonStrikerStats.runs}</span>
                    </div>
                  )}
                </div>

                {/* Separator */}
                <div className="w-px h-10 bg-white/20" />

                {/* Partnership */}
                <div className="text-center">
                  <div className="text-white/30 text-[8px] uppercase tracking-wider">P'ship</div>
                  <div className="text-white text-sm font-bold tabular-nums">{data.partnership.runs}<span className="text-white/40 text-[10px]">({data.partnership.balls})</span></div>
                </div>
              </div>
            </div>

            {/* Orange Lightning - Right */}
            <div className="absolute right-0 top-0 bottom-0 w-3 z-10">
              <svg viewBox="0 0 12 80" className="h-full w-full" preserveAspectRatio="none">
                <path d="M0 0 L6 15 L0 20 L9 40 L0 45 L6 60 L0 65 L12 80 L12 0 Z" fill="#f97316" />
              </svg>
            </div>
          </div>

          {/* Center Section - Absolutely positioned pink oval */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex items-center">
            {/* Pink Center - Target/RR */}
            <div
              className="px-6 py-2.5 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
                boxShadow: '0 4px 20px rgba(236, 72, 153, 0.5)',
              }}
            >
              {/* Main Score Display */}
              <div className="flex flex-col items-center">
                <div className="flex items-baseline gap-2 leading-none mb-1">
                  <span className="text-white text-4xl font-black tabular-nums drop-shadow-md">
                    {data.totalRuns}/{data.currentInnings.wickets}
                  </span>
                  <span className="text-white/80 text-lg font-bold">
                    ({data.currentInnings.overs}.{data.currentInnings.balls})
                  </span>
                </div>

                {match.currentInnings === 2 && data.requiredRuns > 0 ? (
                  <div className="flex gap-2 text-white/90 text-[10px] uppercase font-bold tracking-wide">
                    <span>Need {data.requiredRuns} off {60 - data.totalBalls}</span>
                    <span className="opacity-50">•</span>
                    <span>Target {match.innings.first?.runs ? match.innings.first.runs + 1 : 0}</span>
                  </div>
                ) : (
                  <div className="text-white/90 text-[10px] uppercase font-bold tracking-wide">
                    CRR: {data.currentRR}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Bowler & Info */}
          <div className="relative flex-1 min-w-0">
            {/* Orange Lightning - Left */}
            <div className="absolute left-0 top-0 bottom-0 w-3 z-10">
              <svg viewBox="0 0 12 80" className="h-full w-full" preserveAspectRatio="none">
                <path d="M12 0 L6 15 L12 20 L3 40 L12 45 L6 60 L12 65 L0 80 L0 0 Z" fill="#f97316" />
              </svg>
            </div>

            {/* Purple Panel */}
            <div
              className="relative pl-4 pr-6 py-4 h-full"
              style={{
                background: 'linear-gradient(135deg, #2d1b4e 0%, #1a1033 50%, #2d1b4e 100%)',
              }}
            >
              {/* Diamond Pattern */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.05) 8px, rgba(255,255,255,0.05) 16px)`,
                }}
              />

              {/* Content */}
              <div className="relative flex items-center gap-4 h-full justify-end">
                {/* Ball-by-ball runs */}
                <div className="flex items-center gap-1.5">
                  {data.currentOverBalls.map((ball, idx) => (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${ball.isWicket
                        ? 'bg-red-500 text-white'
                        : ball.runs >= 6
                          ? 'bg-green-500 text-white'
                          : ball.runs >= 4
                            ? 'bg-yellow-400 text-black'
                            : ball.extras > 0
                              ? 'bg-orange-400 text-white'
                              : ball.runs === 0
                                ? 'bg-gray-600 text-white/70'
                                : 'bg-white/30 text-white'
                        }`}
                    >
                      {ball.display}
                    </div>
                  ))}
                </div>

                {/* Separator */}
                <div className="w-px h-12 bg-white/20" />

                {/* Extras Detailed */}
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-white/40 text-[8px] uppercase">Wd</div>
                    <div className="text-orange-400 text-sm font-bold tabular-nums">{data.currentInnings.extras.wides}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[8px] uppercase">NB</div>
                    <div className="text-orange-400 text-sm font-bold tabular-nums">{data.currentInnings.extras.noBalls}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[8px] uppercase">B</div>
                    <div className="text-cyan-400 text-sm font-bold tabular-nums">{data.currentInnings.extras.byes}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/40 text-[8px] uppercase">LB</div>
                    <div className="text-cyan-400 text-sm font-bold tabular-nums">{data.currentInnings.extras.legByes}</div>
                  </div>
                </div>

                {/* Separator */}
                <div className="w-px h-12 bg-white/20" />

                {/* Bowling Team Logo */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-purple-400/50">
                  {data.bowlingTeam.logo ? (
                    <img src={data.bowlingTeam.logo} alt={data.bowlingTeam.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-base">{data.bowlingTeam.shortName || data.bowlingTeam.name.substring(0, 2).toUpperCase()}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Orange Lightning - Right Edge */}
            <div className="absolute right-0 top-0 bottom-0 w-3 z-10">
              <svg viewBox="0 0 12 80" className="h-full w-full" preserveAspectRatio="none">
                <path d="M0 0 L6 15 L0 20 L9 40 L0 45 L6 60 L0 65 L12 80 L12 0 Z" fill="#f97316" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
