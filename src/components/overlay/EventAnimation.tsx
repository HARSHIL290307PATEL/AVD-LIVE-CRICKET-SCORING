 import { cn } from "@/lib/utils";
 
 interface EventAnimationProps {
   showAnimation: 'four' | 'six' | 'wicket' | null;
 }
 
 export function EventAnimation({ showAnimation }: EventAnimationProps) {
   if (!showAnimation) return null;
 
   return (
     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
       <div className={cn(
         "text-9xl font-black tracking-tight animate-score-pop drop-shadow-2xl",
         showAnimation === 'four' && "text-four",
         showAnimation === 'six' && "text-six", 
         showAnimation === 'wicket' && "text-wicket animate-wicket-shake"
       )}
       style={{
         textShadow: showAnimation === 'four' 
           ? '0 0 60px rgba(0, 255, 136, 0.8), 0 0 120px rgba(0, 255, 136, 0.4)'
           : showAnimation === 'six'
           ? '0 0 60px rgba(255, 215, 0, 0.8), 0 0 120px rgba(255, 215, 0, 0.4)'
           : '0 0 60px rgba(255, 59, 48, 0.8), 0 0 120px rgba(255, 59, 48, 0.4)'
       }}>
         {showAnimation === 'four' && 'FOUR!'}
         {showAnimation === 'six' && 'SIX!'}
         {showAnimation === 'wicket' && 'OUT!'}
       </div>
     </div>
   );
 }