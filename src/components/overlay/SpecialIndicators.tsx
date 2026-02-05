 import { Zap, Sparkles, Flame } from "lucide-react";
 
 interface SpecialIndicatorsProps {
   isPowerplay: boolean;
   isPowerSurge: boolean;
   isCurrentBallGolden: boolean;
   isGoldenDelivery: boolean;
 }
 
 export function SpecialIndicators({ 
   isPowerplay, 
   isPowerSurge, 
   isCurrentBallGolden, 
   isGoldenDelivery 
 }: SpecialIndicatorsProps) {
   if (!isPowerplay && !isPowerSurge && !isCurrentBallGolden && !isGoldenDelivery) return null;
 
   return (
     <div className="flex items-center justify-center gap-4 py-2 bg-gradient-to-r from-transparent via-black/60 to-transparent">
       {isPowerplay && (
         <div className="flex items-center gap-2 px-5 py-1.5 bg-cyan-500/20 rounded-full border border-cyan-400/60 animate-pulse">
           <Zap className="h-4 w-4 text-cyan-400" />
           <span className="text-sm font-bold text-cyan-400 tracking-wider uppercase">Powerplay</span>
         </div>
       )}
       {isPowerSurge && (
         <div className="flex items-center gap-2 px-5 py-1.5 bg-orange-500/20 rounded-full border border-orange-400/60 animate-pulse">
           <Flame className="h-4 w-4 text-orange-400" />
           <span className="text-sm font-bold text-orange-400 tracking-wider uppercase">Power Surge</span>
         </div>
       )}
       {(isCurrentBallGolden || isGoldenDelivery) && (
         <div className="flex items-center gap-2 px-5 py-1.5 bg-yellow-500/20 rounded-full border border-yellow-400/60"
           style={{ boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>
           <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
           <span className="text-sm font-bold text-yellow-400 tracking-wider uppercase">
             {isGoldenDelivery ? 'Golden Delivery' : 'Golden Ball'}
           </span>
         </div>
       )}
     </div>
   );
 }