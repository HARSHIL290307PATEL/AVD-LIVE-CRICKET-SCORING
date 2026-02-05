import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ScoreButtonProps {
  variant?: 'run' | 'extra' | 'wicket' | 'action' | 'golden' | 'power';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  run: "bg-gradient-to-br from-primary/90 to-primary hover:from-primary hover:to-primary/80 text-primary-foreground border-primary/50",
  extra: "bg-gradient-to-br from-secondary/90 to-secondary hover:from-secondary hover:to-secondary/80 text-secondary-foreground border-secondary/50",
  wicket: "bg-gradient-to-br from-destructive/90 to-destructive hover:from-destructive hover:to-destructive/80 text-destructive-foreground border-destructive/50",
  action: "bg-gradient-to-br from-muted to-muted/80 hover:from-muted/90 hover:to-muted/70 text-foreground border-muted-foreground/20",
  golden: "bg-gradient-to-br from-golden to-golden-glow hover:from-golden-glow hover:to-golden text-black border-golden/50 glow-golden animate-pulse-glow",
  power: "bg-gradient-to-br from-powersurge to-powerplay hover:from-powerplay hover:to-powersurge text-white border-powersurge/50",
};

const sizeStyles = {
  sm: "h-12 w-12 text-lg",
  md: "h-16 w-16 text-xl font-bold",
  lg: "h-20 w-20 text-2xl font-bold",
};

export function ScoreButton({
  variant = 'run',
  size = 'md',
  children,
  onClick,
  disabled,
  className,
}: ScoreButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "btn-score rounded-xl shadow-lg font-display transition-all duration-200",
        "active:scale-95 hover:scale-105 hover:shadow-xl",
        variantStyles[variant],
        sizeStyles[size],
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        className
      )}
    >
      {children}
    </Button>
  );
}
