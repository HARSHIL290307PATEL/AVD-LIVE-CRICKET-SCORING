
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Crown, Star } from "lucide-react";
import { Match } from "@/types/match";
import { Card } from "@/components/ui/card";

interface MatchResultAnimationProps {
    match: Match;
}

export function MatchResultAnimation({ match }: MatchResultAnimationProps) {
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        // Small delay for entrance animation
        const timer = setTimeout(() => setShowContent(true), 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Animated Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 animate-bounce duration-[3000ms]">
                    <Star className="h-12 w-12 text-yellow-400/20 fill-yellow-400/20" />
                </div>
                <div className="absolute top-1/3 right-1/4 animate-bounce duration-[2500ms] delay-700">
                    <Star className="h-8 w-8 text-primary/20 fill-primary/20" />
                </div>
                <div className="absolute bottom-1/4 left-1/3 animate-pulse duration-[4000ms]">
                    <Crown className="h-24 w-24 text-accent/10 rotate-[-15deg]" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            </div>

            <Card className={`
        glass-panel border-primary/20 max-w-2xl w-full p-8 text-center space-y-8 relative z-10
        transition-all duration-1000 transform
        ${showContent ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}
      `}>
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/30 blur-2xl rounded-full animate-pulse" />
                        <Trophy className="h-32 w-32 text-yellow-500 drop-shadow-lg relative z-10 animate-[bounce_3s_infinite]" />
                        <div className="absolute -top-4 -right-4 animate-ping">
                            <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-primary to-yellow-500 animate-gradient-x">
                        MATCH WON!
                    </h1>

                    <div className="py-6 space-y-2">
                        <p className="text-2xl md:text-3xl font-medium text-foreground/90">
                            {match.result}
                        </p>
                        <p className="text-muted-foreground">
                            {match.name} • {new Date(match.date).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-border/50">
                        <div className="text-center p-4 rounded-lg bg-secondary/20">
                            <p className="text-sm text-muted-foreground mb-1">{match.teams.teamA.name}</p>
                            <p className="text-2xl font-bold font-mono">
                                {match.innings.first?.battingTeamId === match.teams.teamA.id
                                    ? match.innings.first?.runs
                                    : match.innings.second?.runs || 0}
                                <span className="text-base text-muted-foreground ml-1">
                                    /
                                    {match.innings.first?.battingTeamId === match.teams.teamA.id
                                        ? match.innings.first?.wickets
                                        : match.innings.second?.wickets || 0}
                                </span>
                            </p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-secondary/20">
                            <p className="text-sm text-muted-foreground mb-1">{match.teams.teamB.name}</p>
                            <p className="text-2xl font-bold font-mono">
                                {match.innings.first?.battingTeamId === match.teams.teamB.id
                                    ? match.innings.first?.runs
                                    : match.innings.second?.runs || 0}
                                <span className="text-base text-muted-foreground ml-1">
                                    /
                                    {match.innings.first?.battingTeamId === match.teams.teamB.id
                                        ? match.innings.first?.wickets
                                        : match.innings.second?.wickets || 0}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <Link to="/">
                    <Button size="lg" className="w-full md:w-auto px-12 py-6 text-xl font-display group hover:scale-105 transition-transform">
                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Button>
                </Link>
            </Card>
        </div>
    );
}
