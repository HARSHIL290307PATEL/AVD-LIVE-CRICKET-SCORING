import { useState } from "react";
import { Link } from "react-router-dom";
import { Match } from "@/types/match";
import { useMatchStore } from "@/store/matchStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, ArrowRight, AlertTriangle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface TossPanelProps {
  match: Match;
}

export function TossPanel({ match }: TossPanelProps) {
  const setToss = useMatchStore((state) => state.setToss);
  const startInnings = useMatchStore((state) => state.startInnings);

  // Backward compatibility check for teamA/teamB vs home/away
  const teamA = match.teams.teamA || (match.teams as any).home;
  const teamB = match.teams.teamB || (match.teams as any).away;

  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [decision, setDecision] = useState<'bat' | 'bowl' | null>(null);

  if (!teamA || !teamB) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="glass-panel border-destructive/50 max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Invalid Match Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The match data structure appears to be invalid or outdated. This can happen with older match data after an update.
            </p>
            <div className="flex flex-col gap-2">
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = () => {
    if (!selectedTeam) {
      toast.error("Please select the toss winner");
      return;
    }
    if (!playerName.trim()) {
      toast.error("Please enter the player name who won the toss");
      return;
    }
    if (!decision) {
      toast.error("Please select the decision");
      return;
    }

    setToss(match.id, selectedTeam, playerName, decision);
    startInnings(match.id);
    toast.success("Toss recorded! Match started.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="glass-panel border-none max-w-xl w-full">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <Coins className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-display gradient-text">Toss</CardTitle>
          <p className="text-muted-foreground">{match.name}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-muted-foreground text-sm mb-3 block">Who won the toss?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setSelectedTeam(teamA.id)}
                variant="outline"
                className={`h-20 text-lg font-display transition-all ${selectedTeam === teamA.id
                  ? 'bg-primary text-primary-foreground border-primary glow-primary'
                  : 'bg-muted/50 hover:bg-muted border-muted-foreground/20'
                  }`}
              >
                {teamA.name || 'Team A'}
              </Button>
              <Button
                onClick={() => setSelectedTeam(teamB.id)}
                variant="outline"
                className={`h-20 text-lg font-display transition-all ${selectedTeam === teamB.id
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'bg-muted/50 hover:bg-muted border-muted-foreground/20'
                  }`}
              >
                {teamB.name || 'Team B'}
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Player who won the toss</Label>
            <Input
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g., Rohit Sharma"
              className="bg-muted/50 border-muted-foreground/20 mt-1"
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-3 block">Decision</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setDecision('bat')}
                variant="outline"
                className={`h-16 text-lg font-display transition-all ${decision === 'bat'
                  ? 'bg-success text-success-foreground border-success'
                  : 'bg-muted/50 hover:bg-muted border-muted-foreground/20'
                  }`}
              >
                🏏 Bat First
              </Button>
              <Button
                onClick={() => setDecision('bowl')}
                variant="outline"
                className={`h-16 text-lg font-display transition-all ${decision === 'bowl'
                  ? 'bg-powersurge text-white border-powersurge'
                  : 'bg-muted/50 hover:bg-muted border-muted-foreground/20'
                  }`}
              >
                🎾 Bowl First
              </Button>
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground py-6 text-xl font-display glow-primary"
          >
            Start Match
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
