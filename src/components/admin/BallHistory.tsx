import { BallEvent } from "@/types/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BallHistoryProps {
    ballEvents: BallEvent[];
    currentOver: number;
}

export function BallHistory({ ballEvents, currentOver }: BallHistoryProps) {
    // Group balls by over
    const ballsByOver: Record<number, BallEvent[]> = {};

    ballEvents.forEach(event => {
        if (!ballsByOver[event.over]) {
            ballsByOver[event.over] = [];
        }
        ballsByOver[event.over].push(event);
    });

    const overs = Object.keys(ballsByOver)
        .map(Number)
        .sort((a, b) => a - b);

    const getBallDisplay = (ball: BallEvent) => {
        if (ball.isWicket) return 'W';
        if (ball.extraType === 'wide') return `${ball.extras}Wd`;
        if (ball.extraType === 'noball') return `${ball.extras}Nb`;
        if (ball.extraType === 'bye') return `${ball.extras}B`;
        if (ball.extraType === 'legbye') return `${ball.extras}Lb`;
        return ball.runs.toString();
    };

    const getBallClass = (ball: BallEvent) => {
        if (ball.isWicket) return 'bg-wicket text-white';
        if (ball.runs === 4 || ball.runs === 8) return 'bg-four text-black';
        if (ball.runs === 6 || ball.runs === 12) return 'bg-six text-white';
        if (ball.extraType) return 'bg-secondary text-secondary-foreground';
        if (ball.isGoldenBall || ball.isGoldenDelivery) return 'bg-golden text-black';
        if (ball.runs === 0) return 'bg-muted/50 text-muted-foreground';
        return 'bg-muted text-foreground';
    };

    return (
        <Card className="glass-panel border-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Ball History (All Overs)</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-48">
                    <div className="space-y-2">
                        {overs.length === 0 ? (
                            <p className="text-muted-foreground text-sm text-center py-4">
                                No balls bowled yet
                            </p>
                        ) : (
                            overs.map(over => (
                                <div
                                    key={over}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg ${over === currentOver ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30'
                                        }`}
                                >
                                    <span className={`text-sm font-bold min-w-[60px] ${over === currentOver ? 'text-primary' : 'text-muted-foreground'
                                        }`}>
                                        Over {over + 1}
                                    </span>
                                    <div className="flex gap-1.5 flex-wrap">
                                        {ballsByOver[over].map(ball => (
                                            <div
                                                key={ball.id}
                                                className={`h-7 min-w-[28px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold ${getBallClass(ball)}`}
                                                title={`${ball.runs} runs${ball.isWicket ? ' (Wicket)' : ''}${ball.extraType ? ` (${ball.extraType})` : ''}`}
                                            >
                                                {getBallDisplay(ball)}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="ml-auto text-xs text-muted-foreground">
                                        {ballsByOver[over].reduce((sum, b) => sum + b.runs + (b.extras || 0) + (b.goldenBallBonus || 0), 0)} runs
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
