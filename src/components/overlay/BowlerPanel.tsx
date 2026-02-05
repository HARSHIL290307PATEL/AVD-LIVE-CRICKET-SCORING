import { Player } from "@/types/match";
import { User } from "lucide-react";

interface BowlerPanelProps {
  bowler: Player | undefined;
  bowlerStats: { overs: string; runs: number; wickets: number; maidens: number };
}

export function BowlerPanel({ bowler, bowlerStats }: BowlerPanelProps) {
  if (!bowler) return null;

  return (
    <div className="flex items-center gap-3 px-5 py-2 border-r border-white/10 min-w-[160px]">
      {/* Bowler Photo */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0 ring-2 ring-cyan-400/50">
        {bowler.photo ? (
          <img src={bowler.photo} alt={bowler.name} className="w-full h-full object-cover" />
        ) : (
          <User className="h-5 w-5 text-white" />
        )}
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Bowling</span>
        <span className="text-sm font-semibold text-white truncate">{bowler.name}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-sm font-bold text-cyan-400 tabular-nums">
            {bowlerStats.wickets}-{bowlerStats.runs}
          </span>
          <span className="text-xs text-white/40">({bowlerStats.overs} ov)</span>
        </div>
      </div>
    </div>
  );
}