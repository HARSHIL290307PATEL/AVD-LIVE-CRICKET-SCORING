import { Link, useNavigate } from "react-router-dom";
import { useMatchStore } from "@/store/matchStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Play,
  Eye,
  Trash2,
  Upload,
  Download,
  Trophy,
  Clock,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";
import { useState, useRef } from "react";

const Dashboard = () => {
  const navigate = useNavigate();
  const { matches, deleteMatch, importMatch, exportAllMatches } = useMatchStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result as string;
        importMatch(data);
        toast.success("Match imported successfully!");
      } catch {
        toast.error("Failed to import match");
      }
    };
    reader.readAsText(file);
  };

  const handleExportAll = () => {
    const data = exportAllMatches();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `HCL_2026_AllMatches_${Date.now()}.json`;
    a.click();
    toast.success("All matches exported");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'setup':
        return <Badge variant="outline" className="border-muted-foreground/50"><Clock className="h-3 w-3 mr-1" /> Setup</Badge>;
      case 'toss':
        return <Badge variant="outline" className="border-accent"><Trophy className="h-3 w-3 mr-1" /> Toss</Badge>;
      case 'live':
        return <Badge className="bg-success text-success-foreground animate-pulse"><Play className="h-3 w-3 mr-1" /> LIVE</Badge>;
      case 'innings_break':
        return <Badge className="bg-secondary text-secondary-foreground"><Clock className="h-3 w-3 mr-1" /> Break</Badge>;
      case 'completed':
        return <Badge variant="outline" className="border-primary"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-5xl lg:text-7xl font-display tracking-wider">
            <span className="gradient-text">HCL 2026</span>
          </h1>
          <p className="text-xl text-muted-foreground font-display">
            Live Scoreboard System
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted-foreground">Offline Ready</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/setup">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-8 py-6 text-lg font-display glow-primary"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Match
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="px-8 py-6 text-lg font-display"
          >
            <Upload className="h-5 w-5 mr-2" />
            Import Match
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          {matches.length > 0 && (
            <Button
              size="lg"
              variant="outline"
              onClick={handleExportAll}
              className="px-8 py-6 text-lg font-display"
            >
              <Download className="h-5 w-5 mr-2" />
              Export All
            </Button>
          )}
        </div>

        {/* Matches List */}
        {matches.length === 0 ? (
          <Card className="glass-panel border-none">
            <CardContent className="py-16 text-center">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-xl text-muted-foreground">No matches yet</p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Create your first match to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => (
              <Card
                key={match.id}
                className="glass-panel border-none hover:border-primary/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-display">{match.name}</CardTitle>
                    {getStatusBadge(match.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {match.teams?.teamA?.name || 'Team A'}
                    </span>
                    <span className="text-muted-foreground">vs</span>
                    <span className="text-muted-foreground">
                      {match.teams?.teamB?.name || 'Team B'}
                    </span>
                  </div>

                  {match.innings.first && (
                    <div className="text-center">
                      <p className="text-2xl font-score gradient-text">
                        {match.innings.first.runs}/{match.innings.first.wickets}
                        <span className="text-lg text-muted-foreground ml-2">
                          ({match.innings.first.overs}.{match.innings.first.balls})
                        </span>
                      </p>
                    </div>
                  )}

                  {match.result && (
                    <p className="text-sm text-center text-success font-medium">
                      {match.result}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/admin/${match.id}`)}
                      className="flex-1 bg-primary hover:bg-primary/80"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      {match.status === 'live' ? 'Score' : 'Open'}
                    </Button>
                    <Button
                      onClick={() => navigate(`/overlay/${match.id}`)}
                      variant="outline"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Overlay
                    </Button>
                    <Button
                      onClick={() => {
                        deleteMatch(match.id);
                        toast.success("Match deleted");
                      }}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            HCL 2026 Live Scoreboard • Works Offline • OBS Compatible
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
