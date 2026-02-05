import { useParams } from "react-router-dom";
import { useMatchStore } from "@/store/matchStore";
import { TossPanel } from "@/components/admin/TossPanel";
import { ScoringPanel } from "@/components/admin/ScoringPanel";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AdminPanel = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const match = useMatchStore((state) => state.matches.find(m => m.id === matchId));

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">Match not found</p>
          <Link to="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show toss panel if not done yet
  if (match.status === 'setup' || match.status === 'toss') {
    return <TossPanel match={match} />;
  }

  // Show innings break screen
  if (match.status === 'innings_break') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-display gradient-text">Innings Break</h1>
          <p className="text-xl text-muted-foreground">
            {match.teams.teamA.name} scored {match.innings.first?.runs}/{match.innings.first?.wickets}
          </p>
          <p className="text-lg text-muted-foreground">
            Target: {(match.innings.first?.runs || 0) + 1} runs
          </p>
          <Button
            onClick={() => useMatchStore.getState().startInnings(matchId)}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent px-12 py-6 text-xl font-display"
          >
            Start 2nd Innings
          </Button>
        </div>
      </div>
    );
  }

  // Show completed screen
  if (match.status === 'completed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-display gradient-text">Match Completed</h1>
          <p className="text-2xl text-success font-display">{match.result}</p>
          <Link to="/">
            <Button size="lg" className="px-12 py-6 text-xl font-display">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show scoring panel for live matches
  return <ScoringPanel match={match} />;
};

export default AdminPanel;
