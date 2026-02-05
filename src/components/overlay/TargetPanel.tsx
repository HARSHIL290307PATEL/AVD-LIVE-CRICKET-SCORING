 import { Match, Innings } from "@/types/match";
 
 interface TargetPanelProps {
   match: Match;
   currentInnings: Innings;
   requiredRuns: number;
   requiredRR: number;
   currentRR: number;
   totalBalls: number;
 }
 
 export function TargetPanel({ 
   match, 
   currentInnings, 
   requiredRuns, 
   requiredRR,
   currentRR,
   totalBalls 
 }: TargetPanelProps) {
   const isSecondInnings = match.currentInnings === 2 && match.innings.first;
 
   return (
     <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-l from-blue-900/80 to-transparent min-w-[200px]">
       {isSecondInnings ? (
         <>
           {/* Target Info */}
           <div className="flex flex-col items-center px-4 py-1 bg-red-500/20 rounded-lg border border-red-500/40">
             <span className="text-[10px] text-red-400 uppercase tracking-wider">Target</span>
             <span className="text-2xl font-black text-red-400 tabular-nums">
               {match.innings.first!.runs + 1}
             </span>
           </div>
           
           {/* Need */}
           <div className="flex flex-col">
             <span className="text-[10px] text-white/40 uppercase">Need</span>
             <span className="text-lg font-bold text-white tabular-nums">
               {requiredRuns} <span className="text-xs text-white/50 font-normal">off {60 - totalBalls}</span>
             </span>
             <div className="flex gap-3 mt-0.5">
               <span className="text-xs text-white/50">
                 CRR: <span className="text-cyan-400 font-semibold">{currentRR.toFixed(2)}</span>
               </span>
               <span className="text-xs text-white/50">
                 RRR: <span className="text-red-400 font-semibold">{requiredRR.toFixed(2)}</span>
               </span>
             </div>
           </div>
         </>
       ) : (
         <div className="flex flex-col">
           <span className="text-[10px] text-white/40 uppercase">Run Rate</span>
           <span className="text-2xl font-bold text-cyan-400 tabular-nums">
             {currentRR.toFixed(2)}
           </span>
         </div>
       )}
     </div>
   );
 }