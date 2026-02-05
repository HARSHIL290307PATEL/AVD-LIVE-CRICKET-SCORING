import { Player } from "@/types/match";
import { User } from "lucide-react";

interface BatsmenPanelProps {
  striker: Player | undefined;
  nonStriker: Player | undefined;
  strikerStats: { runs: number; balls: number; fours: number; sixes: number };
  nonStrikerStats: { runs: number; balls: number; fours: number; sixes: number };
  partnership: { runs: number; balls: number };
}

export function BatsmenPanel({
  striker,
  nonStriker,
  strikerStats,
  nonStrikerStats,
  partnership
}: BatsmenPanelProps) {
  return (
    <div className="flex-1 flex items-center gap-6 px-6 py-3 border-r border-white/10">
      {/* Batsmen */}
      <div className="flex flex-col gap-1.5 min-w-[250px]">
        {/* Striker */}
        {striker && (
          <div className="flex items-center gap-3">
            {/* Player Photo */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0 ring-2 ring-green-400">
              {striker.photo ? (
                <img src={striker.photo} alt={striker.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-white" />
              )}
            </div>
            <span className="text-base font-semibold text-white min-w-[100px]">
              {striker.name}
            </span>
            <span className="text-lg font-bold text-white tabular-nums">
              {strikerStats.runs}
              <span className="text-sm text-white/50 font-normal">({strikerStats.balls})</span>
            </span>
            <div className="flex gap-2 text-xs text-white/40">
              <span>{strikerStats.fours}×4</span>
              <span>{strikerStats.sixes}×6</span>
            </div>
          </div>
        )}

        {/* Non-Striker */}
        {nonStriker && (
          <div className="flex items-center gap-3 opacity-70">
            {/* Player Photo */}
            <div className="w-6 h-6 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0">
              {nonStriker.photo ? (
                <img src={nonStriker.photo} alt={nonStriker.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-3 w-3 text-white/60" />
              )}
            </div>
            <span className="text-sm text-white/70 min-w-[100px]">
              {nonStriker.name}
            </span>
            <span className="text-sm text-white/70 tabular-nums">
              {nonStrikerStats.runs}
              <span className="text-xs text-white/40">({nonStrikerStats.balls})</span>
            </span>
          </div>
        )}
      </div>

      {/* Partnership */}
      <div className="flex flex-col items-center px-4 py-2 bg-white/5 rounded-lg border border-white/10">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Partnership</span>
        <span className="text-lg font-bold text-white tabular-nums">
          {partnership.runs}
          <span className="text-xs text-white/40 font-normal">({partnership.balls})</span>
        </span>
      </div>
    </div>
  );
}