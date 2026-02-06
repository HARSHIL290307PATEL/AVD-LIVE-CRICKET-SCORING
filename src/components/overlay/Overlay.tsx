import { Match } from "@/types/match";
import { useOverlayData } from "./useOverlayData";
import { useOverlayStore } from "@/store/overlayStore";
import { useEffect, useState } from "react";

interface OverlayProps {
  match: Match;
}

// Helper function to get ball circle color based on runs and type
const getBallCircleStyles = (ball: { runs: number; isWicket: boolean; extras: number; isGolden?: boolean } | null, isEmpty: boolean) => {
  if (isEmpty || !ball) {
    // Empty circle - not yet bowled
    return {
      background: 'transparent',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      color: 'transparent',
    };
  }

  // Golden ball - HIGHEST PRIORITY - always golden regardless of runs
  if (ball.isGolden) {
    return {
      background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 50%, #ffd700 100%)',
      border: '2px solid #ffd700',
      color: '#000',
      boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
    };
  }

  // Wicket - Red
  if (ball.isWicket) {
    return {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      border: '2px solid #ef4444',
      color: '#fff',
    };
  }

  // Six - Green
  if (ball.runs >= 6) {
    return {
      background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
      border: '2px solid #22c55e',
      color: '#fff',
    };
  }

  // Four - Purple/Magenta (changed from yellow)
  if (ball.runs >= 4) {
    return {
      background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)',
      border: '2px solid #a855f7',
      color: '#fff',
    };
  }

  // Extras - Orange
  if (ball.extras > 0) {
    return {
      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      border: '2px solid #f97316',
      color: '#fff',
    };
  }

  // Dot ball - Gray
  if (ball.runs === 0) {
    return {
      background: 'rgba(107, 114, 128, 0.8)',
      border: '2px solid #6b7280',
      color: 'rgba(255, 255, 255, 0.7)',
    };
  }

  // 1, 2, 3 runs - Light blue/cyan
  return {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    border: '2px solid #06b6d4',
    color: '#fff',
  };
};

export function Overlay({ match }: OverlayProps) {
  const data = useOverlayData(match);
  const isVisible = useOverlayStore((state) => state.isVisible);
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(isVisible);

  // Handle visibility changes with animation
  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
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

  // Create dynamic ball slots for current over - handle extras beyond 6 legal balls
  // Count legal balls (non-extras) in the current over
  const legalBallsInOver = data.currentOverBalls.filter(
    ball => !ball.extraType || ball.extraType === 'bye' || ball.extraType === 'legbye'
  ).length;

  // Total balls bowled in this over (including extras)
  const totalBallsInOver = data.currentOverBalls.length;

  // If over is complete (6 legal balls), show only the last 6 balls (sliding window)
  // Otherwise show up to 6 slots with actual balls
  const ballSlots = (() => {
    if (legalBallsInOver >= 6 && totalBallsInOver > 6) {
      // Over complete with extras - show last 6 deliveries
      return data.currentOverBalls.slice(-6).map(ball => ({
        ...ball,
        isGolden: ball.isGoldenBall,
      }));
    } else {
      // Over in progress - show all balls bowled plus empty slots up to max needed
      const maxSlots = Math.max(6, totalBallsInOver);
      return Array(maxSlots).fill(null).map((_, idx) => {
        const ball = data.currentOverBalls[idx];
        if (ball) {
          return { ...ball, isGolden: ball.isGoldenBall };
        }
        // Only show empty slots for remaining legal balls needed
        return idx < 6 ? null : undefined;
      }).filter(slot => slot !== undefined);
    }
  })();

  // Get event theme colors
  const getEventStripStyles = () => {
    switch (data.showAnimation) {
      case 'golden':
        return {
          background: 'linear-gradient(90deg, #ffd700 0%, #ffb300 25%, #ffd700 50%, #ffb300 75%, #ffd700 100%)',
          color: '#000',
          boxShadow: '0 0 30px rgba(255, 215, 0, 0.8)',
        };
      case 'wicket':
        return {
          background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 25%, #dc2626 50%, #b91c1c 75%, #dc2626 100%)',
          color: '#fff',
          boxShadow: '0 0 30px rgba(220, 38, 38, 0.8)',
        };
      case 'freehit':
        return {
          background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 25%, #3b82f6 50%, #1d4ed8 75%, #3b82f6 100%)',
          color: '#fff',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)',
        };
      case 'four':
        return {
          background: 'linear-gradient(90deg, #a855f7 0%, #9333ea 25%, #a855f7 50%, #9333ea 75%, #a855f7 100%)',
          color: '#fff',
          boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)',
        };
      case 'six':
        return {
          background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 25%, #22c55e 50%, #16a34a 75%, #22c55e 100%)',
          color: '#fff',
          boxShadow: '0 0 30px rgba(34, 197, 94, 0.8)',
        };
      default:
        return null;
    }
  };

  const eventStripStyles = getEventStripStyles();

  return (
    <div className="overlay-container min-h-screen relative" style={{ background: 'transparent' }}>
      {/* Bottom Scoreboard with Fly-in Animation */}
      <div
        className="absolute bottom-0 left-0 right-0 w-full transition-all duration-500 ease-out"
        style={{
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
          opacity: isAnimating ? 1 : 0,
        }}
      >
        {/* Special Events Strip - Above Scoreboard */}
        {data.specialEventText && eventStripStyles && (
          <div
            className="w-full overflow-hidden"
            style={{
              ...eventStripStyles,
              height: '36px',
              transition: 'all 0.3s ease-out',
              animation: 'slideUp 0.4s ease-out',
            }}
          >
            {/* Marquee Container */}
            <div
              className="flex items-center h-full whitespace-nowrap"
              style={{
                animation: 'marquee 8s linear infinite',
              }}
            >
              <span className="text-lg font-black uppercase tracking-widest px-8">
                {data.specialEventText}
              </span>
              <span className="text-lg font-black uppercase tracking-widest px-8">
                {data.specialEventText}
              </span>
              <span className="text-lg font-black uppercase tracking-widest px-8">
                {data.specialEventText}
              </span>
            </div>
          </div>
        )}

        {/* Main scoreboard container */}
        <div
          className="w-full flex items-stretch"
          style={{
            background: 'linear-gradient(180deg, rgba(0, 30, 60, 0.95) 0%, rgba(0, 20, 40, 0.98) 100%)',
            borderTop: '3px solid #0ea5e9',
          }}
        >
          {/* Left Section - Batting Team with Score */}
          <div className="flex items-center gap-4 px-6 py-3">
            {/* Team Logo */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-blue-400/50">
              {data.battingTeam?.logo ? (
                <img src={data.battingTeam.logo} alt={data.battingTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xl">{data.battingTeam?.shortName || data.battingTeam?.name?.substring(0, 3).toUpperCase()}</span>
              )}
            </div>

            {/* Team Name above, Score with Overs beside */}
            <div className="flex flex-col">
              <div className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-1">
                {data.battingTeam?.name}
              </div>
              <div className="flex items-end gap-6">
                <span className="text-white text-5xl font-black tabular-nums">
                  {data.currentInnings.runs}-{data.currentInnings.wickets}
                </span>
                <div className="flex flex-col items-center">
                  <span className="text-white/50 text-[10px] uppercase tracking-wider">OVERS</span>
                  <span className="text-white/70 text-lg font-bold tabular-nums">{data.currentInnings.overs}.{data.currentInnings.balls}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center Section - Single Continuous Cylinder for Both Batsmen */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-1">
            {/* Single Cylinder Container - Fixed positions, sliding highlight */}
            <div
              className="flex items-center relative"
              style={{
                background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.04) 50%, rgba(255, 255, 255, 0.12) 100%)',
                borderRadius: '40px',
                border: '2px solid rgba(255, 255, 255, 0.15)',
                boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.05)',
              }}
            >
              {/* Sliding Highlight Background */}
              <div
                className="absolute top-0 h-full pointer-events-none"
                style={{
                  left: data.batsmanOneIsStriker ? '0' : '50%',
                  width: '50%',
                  background: 'linear-gradient(180deg, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.2) 50%, rgba(34, 197, 94, 0.4) 100%)',
                  borderRadius: '40px',
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), inset 0 1px 3px rgba(255,255,255,0.15)',
                  border: '2px solid rgba(34, 197, 94, 0.6)',
                  transition: 'left 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  zIndex: 1,
                }}
              />

              {/* Batsman 1 - Fixed position */}
              {data.batsmanOne && (
                <div
                  className="flex items-center gap-4 px-8 py-1.5 min-w-[280px] relative z-10"
                  style={{
                    opacity: data.batsmanOneIsOut ? 0.35 : 1,
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Arrow before striker name - hide if out */}
                  <span
                    className="text-green-400 text-xs"
                    style={{
                      opacity: data.batsmanOneIsStriker && !data.batsmanOneIsOut ? 1 : 0,
                      transform: data.batsmanOneIsStriker && !data.batsmanOneIsOut ? 'scale(1) translateX(0)' : 'scale(0) translateX(-10px)',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >▶</span>
                  <span
                    className="text-lg font-black uppercase tracking-wide"
                    style={{
                      color: data.batsmanOneIsOut
                        ? 'rgb(239, 68, 68)'
                        : data.batsmanOneIsStriker
                          ? 'rgb(134, 239, 172)'
                          : 'rgba(255, 255, 255, 0.7)',
                      transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {data.batsmanOne.name?.split(' ').pop()?.toUpperCase()}
                    {data.batsmanOneIsOut && <span className="text-red-500 text-xs ml-1">OUT</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-2xl font-black tabular-nums"
                      style={{
                        color: data.batsmanOneIsOut
                          ? 'rgba(255, 255, 255, 0.5)'
                          : data.batsmanOneIsStriker
                            ? 'white'
                            : 'rgba(255, 255, 255, 0.6)',
                        transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >{data.batsmanOneStats.runs}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{
                        color: data.batsmanOneIsOut
                          ? 'rgba(255, 255, 255, 0.3)'
                          : data.batsmanOneIsStriker
                            ? 'rgba(134, 239, 172, 0.7)'
                            : 'rgba(255, 255, 255, 0.4)',
                        transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >({data.batsmanOneStats.balls})</span>
                  </div>
                </div>
              )}

              {/* Batsman 2 - Fixed position */}
              {data.batsmanTwo && (
                <div
                  className="flex items-center gap-4 px-8 py-1.5 min-w-[260px] relative z-10"
                  style={{
                    opacity: data.batsmanTwoIsOut ? 0.35 : 1,
                    transition: 'opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {/* Arrow before striker name - hide if out */}
                  <span
                    className="text-green-400 text-xs"
                    style={{
                      opacity: data.batsmanTwoIsStriker && !data.batsmanTwoIsOut ? 1 : 0,
                      transform: data.batsmanTwoIsStriker && !data.batsmanTwoIsOut ? 'scale(1) translateX(0)' : 'scale(0) translateX(-10px)',
                      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >▶</span>
                  <span
                    className="text-lg font-bold uppercase tracking-wide"
                    style={{
                      color: data.batsmanTwoIsOut
                        ? 'rgb(239, 68, 68)'
                        : data.batsmanTwoIsStriker
                          ? 'rgb(134, 239, 172)'
                          : 'rgba(255, 255, 255, 0.7)',
                      transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {data.batsmanTwo.name?.split(' ').pop()?.toUpperCase()}
                    {data.batsmanTwoIsOut && <span className="text-red-500 text-xs ml-1">OUT</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xl font-bold tabular-nums"
                      style={{
                        color: data.batsmanTwoIsOut
                          ? 'rgba(255, 255, 255, 0.5)'
                          : data.batsmanTwoIsStriker
                            ? 'white'
                            : 'rgba(255, 255, 255, 0.6)',
                        transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >{data.batsmanTwoStats.runs}</span>
                    <span
                      className="text-sm font-medium tabular-nums"
                      style={{
                        color: data.batsmanTwoIsOut
                          ? 'rgba(255, 255, 255, 0.3)'
                          : data.batsmanTwoIsStriker
                            ? 'rgba(134, 239, 172, 0.7)'
                            : 'rgba(255, 255, 255, 0.4)',
                        transition: 'color 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >({data.batsmanTwoStats.balls})</span>
                  </div>
                </div>
              )}
            </div>

            {/* Extras Display - Only shows when extras exist */}
            {data.currentInnings && (data.currentInnings.extras.wides > 0 || data.currentInnings.extras.noBalls > 0 || data.currentInnings.extras.byes > 0 || data.currentInnings.extras.legByes > 0) && (
              <div
                className="flex items-center gap-2 mt-1"
                style={{
                  animation: 'fadeIn 0.3s ease-out',
                }}
              >
                <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">EXTRAS:</span>
                <span className="text-white text-sm font-bold">
                  {(data.currentInnings.extras.wides + data.currentInnings.extras.noBalls + data.currentInnings.extras.byes + data.currentInnings.extras.legByes)}
                </span>
                <span className="text-white/60 text-xs">
                  ({data.currentInnings.extras.wides > 0 && `W${data.currentInnings.extras.wides}`}
                  {data.currentInnings.extras.wides > 0 && (data.currentInnings.extras.noBalls > 0 || data.currentInnings.extras.byes > 0 || data.currentInnings.extras.legByes > 0) && ', '}
                  {data.currentInnings.extras.noBalls > 0 && `NB${data.currentInnings.extras.noBalls}`}
                  {data.currentInnings.extras.noBalls > 0 && (data.currentInnings.extras.byes > 0 || data.currentInnings.extras.legByes > 0) && ', '}
                  {data.currentInnings.extras.byes > 0 && `B${data.currentInnings.extras.byes}`}
                  {data.currentInnings.extras.byes > 0 && data.currentInnings.extras.legByes > 0 && ', '}
                  {data.currentInnings.extras.legByes > 0 && `LB${data.currentInnings.extras.legByes}`})
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Bowling Team with Bowler Info and Ball-by-Ball below */}
          <div className="flex items-center gap-5 px-6 py-2">
            {/* Bowler Info with Ball Circles Below */}
            <div className="flex flex-col items-center gap-1.5">
              {/* Bowling Team Name above Bowler */}
              <div className="text-green-400 text-xs font-bold uppercase tracking-wider">
                {data.bowlingTeam?.name}
              </div>

              {/* Bowler Name and Stats - wickets-runs overs format */}
              {data.bowler && (
                <div className="flex items-center gap-2">
                  <span className="text-white text-base font-bold uppercase tracking-wide">
                    {data.bowler.name?.split(' ').pop()?.toUpperCase()}
                  </span>
                  <span className="text-green-400 text-base font-bold tabular-nums">
                    {data.bowlerStats?.wickets || 0}-{data.bowlerStats?.runs || 0}
                  </span>
                  <span className="text-green-400/60 text-sm font-medium tabular-nums">
                    {data.bowlerStats?.overs || '0.0'}
                  </span>
                </div>
              )}

              {/* Ball-by-ball circles - smaller, below bowler */}
              <div className="flex items-center gap-1.5">
                {ballSlots.map((ball, idx) => {
                  const styles = getBallCircleStyles(ball, ball === null);
                  return (
                    <div
                      key={idx}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
                      style={styles}
                    >
                      {ball ? ball.display : ''}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bowling Team Logo */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-green-400/50">
              {data.bowlingTeam?.logo ? (
                <img src={data.bowlingTeam.logo} alt={data.bowlingTeam.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-black text-xl">{data.bowlingTeam?.shortName || data.bowlingTeam?.name?.substring(0, 3).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
