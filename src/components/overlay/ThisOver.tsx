 import { cn } from "@/lib/utils";
 import { BallEvent } from "@/types/match";
 
 interface ThisOverProps {
   currentOverBalls: BallEvent[];
 }
 
 export function ThisOver({ currentOverBalls }: ThisOverProps) {
   const getBallDisplay = (ball: BallEvent) => {
     if (ball.isWicket) return 'W';
     if (ball.extraType === 'wide') return 'Wd';
     if (ball.extraType === 'noball') return 'Nb';
     if (ball.extraType === 'bye') return `${ball.runs}B`;
     if (ball.extraType === 'legbye') return `${ball.runs}Lb`;
     return ball.runs.toString();
   };
 
   return (
     <div className="flex flex-col justify-center px-5 py-2 border-r border-white/10">
       <span className="text-[10px] text-white/40 uppercase tracking-wider text-center mb-1.5">This Over</span>
       <div className="flex gap-1.5">
         {currentOverBalls.map((ball) => (
           <div
             key={ball.id}
             className={cn(
               "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
               ball.isWicket && "bg-red-500 text-white",
               !ball.isWicket && (ball.runs === 4 || ball.runs === 8) && "bg-emerald-500 text-white",
               !ball.isWicket && (ball.runs === 6 || ball.runs === 12) && "bg-yellow-500 text-black",
               !ball.isWicket && ball.extraType && "bg-blue-500/80 text-white",
               !ball.isWicket && !ball.extraType && ball.runs !== 4 && ball.runs !== 6 && ball.runs !== 8 && ball.runs !== 12 && "bg-white/20 text-white"
             )}
           >
             {getBallDisplay(ball)}
           </div>
         ))}
         {/* Empty placeholders */}
         {Array.from({ length: Math.max(0, 6 - currentOverBalls.length) }).map((_, i) => (
           <div key={`empty-${i}`} className="h-8 w-8 rounded-full bg-white/5 border border-white/20" />
         ))}
       </div>
     </div>
   );
 }