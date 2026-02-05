 import { Team } from "@/types/match";
 
 interface TeamScoreProps {
   team: Team;
   runs: number;
   wickets: number;
   overs: number;
   balls: number;
 }
 
 export function TeamScore({ team, runs, wickets, overs, balls }: TeamScoreProps) {
   return (
     <div className="flex items-center gap-4 px-6 py-3 bg-gradient-to-r from-blue-900/80 to-transparent border-r border-cyan-500/30">
       {/* Team Logo */}
       <div className="relative">
         <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
           {team.logo ? (
             <img src={team.logo} alt={team.name} className="w-12 h-12 rounded-full object-cover" />
           ) : (
             <span className="text-xl font-black text-white">{team.shortName || team.name.substring(0, 3).toUpperCase()}</span>
           )}
         </div>
       </div>
       
       {/* Team Name & Score */}
       <div className="flex flex-col">
         <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
           {team.name}
         </span>
         <div className="flex items-baseline gap-1">
           <span className="text-5xl font-black text-white tabular-nums leading-none" 
             style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
             {runs}
           </span>
           <span className="text-3xl font-bold text-white/60 leading-none">/{wickets}</span>
         </div>
         <span className="text-sm font-medium text-white/50 mt-0.5">
           ({overs}.{balls} ov)
         </span>
       </div>
     </div>
   );
 }