import { useState } from "react";
import { Match, Player, RunType, ExtraType, WicketType } from "@/types/match";
import { useMatchStore } from "@/store/matchStore";
import { useOverlayStore } from "@/store/overlayStore";
import { ScoreButton } from "@/components/ui/ScoreButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Undo2,
  Zap,
  Sparkles,
  ArrowLeftRight,
  AlertTriangle,
  Save,
  Download,
  Upload,
  Eye,
  EyeOff,
  Monitor
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BallHistory } from "./BallHistory";

interface ScoringPanelProps {
  match: Match;
}

export function ScoringPanel({ match }: ScoringPanelProps) {
  const {
    addRuns,
    addExtra,
    addWicket,
    setStriker,
    setNonStriker,
    setBowler,
    swapBatsmen,
    activatePowerSurge,
    undoLastBall,
    endInnings,
    exportMatch,
  } = useMatchStore();

  const { isVisible: isOverlayVisible, toggle: toggleOverlay } = useOverlayStore();

  const [isGoldenBallActive, setIsGoldenBallActive] = useState(false);
  const [showWicketOptions, setShowWicketOptions] = useState(false);
  const [selectedExtraType, setSelectedExtraType] = useState<ExtraType | null>(null);
  const [customExtraRuns, setCustomExtraRuns] = useState("");
  const [pendingWicketType, setPendingWicketType] = useState<WicketType | null>(null);

  const currentInnings = match.currentInnings === 1 ? match.innings.first : match.innings.second;

  if (!currentInnings) return null;

  if (!match.teams?.teamA || !match.teams?.teamB) {
    return <div className="p-4 text-center text-destructive">Error: Invalid team data</div>;
  }

  const battingTeam = currentInnings.battingTeamId === match.teams.teamA.id
    ? match.teams.teamA
    : match.teams.teamB;
  const bowlingTeam = currentInnings.bowlingTeamId === match.teams.teamA.id
    ? match.teams.teamA
    : match.teams.teamB;

  // Track dismissed players
  const dismissedPlayers = new Set(currentInnings.ballEvents.filter(e => e.isWicket).map(e => e.batsmanId));
  const isPlayerDismissed = (id: string) => dismissedPlayers.has(id);

  const currentOver = currentInnings.overs;
  const isPowerplay = currentOver < 2;
  const isPowerSurge = currentInnings.powerSurgeOver === currentOver;
  const canActivatePowerSurge = !currentInnings.powerSurgeUsed && currentOver >= 2 && currentOver < 8;

  const totalBalls = currentInnings.overs * 6 + currentInnings.balls;
  const isCurrentBallGolden = currentInnings.goldenBalls.includes(totalBalls);
  const isGoldenDelivery = totalBalls === 0 && !currentInnings.goldenDeliveryDone;

  const getAvailableBatsmen = () => {
    const usedBatsmen = new Set([
      currentInnings.currentStriker,
      currentInnings.currentNonStriker,
      ...currentInnings.ballEvents
        .filter(e => e.isWicket)
        .map(e => e.batsmanId)
    ]);
    return battingTeam.players.filter(p => !usedBatsmen.has(p.id));
  };

  const getAvailableBowlers = () => {
    // If we are starting a new over (and it's not the first one)
    if (currentInnings.balls === 0 && currentInnings.overs > 0) {
      // Find the bowler who bowled the last ball of the previous over
      // We look at the last event to ensure we get the correct bowler who finished the over
      const lastBallEvent = [...currentInnings.ballEvents]
        .reverse()
        .find(e => e.over === currentInnings.overs - 1);

      if (lastBallEvent) {
        return bowlingTeam.players.filter(p => p.id !== lastBallEvent.bowlerId);
      }
    }
    return bowlingTeam.players;
  };

  const handleRuns = (runs: RunType) => {
    if (!currentInnings.currentStriker || !currentInnings.currentBowler) {
      toast.error("Please select striker and bowler");
      return;
    }

    // Power surge six = OUT
    if (isPowerSurge && runs === 6) {
      addWicket(match.id, 'bowled', undefined, { isGoldenBall: isGoldenBallActive });
      toast.error("OUT! Six during Power Surge = Wicket!");
      setIsGoldenBallActive(false);
      return;
    }

    // Power surge only allows 1,2,3,4
    if (isPowerSurge && runs === 6) {
      toast.error("Only 1, 2, 3, 4 runs allowed during Power Surge");
      return;
    }

    addRuns(match.id, runs, { isGoldenBall: isGoldenBallActive });
    setIsGoldenBallActive(false);
  };

  const handleExtra = (type: ExtraType, additionalRuns = 0) => {
    addExtra(match.id, type, additionalRuns);
  };

  const handleWicket = (type: WicketType) => {
    if (!currentInnings.currentStriker) {
      toast.error("Please select striker");
      return;
    }

    if (type === 'caught' || type === 'runout' || type === 'stumped') {
      setPendingWicketType(type);
      setShowWicketOptions(false);
      return;
    }

    addWicket(match.id, type, undefined, { isGoldenBall: isGoldenBallActive });
    setShowWicketOptions(false);
    setIsGoldenBallActive(false);
    toast.error("WICKET!");
  };

  const handleUndo = () => {
    undoLastBall(match.id);
    toast.info("Last ball undone");
  };

  const handlePowerSurge = () => {
    activatePowerSurge(match.id);
    toast.success("Power Surge activated for next over!");
  };

  const handleEndInnings = () => {
    endInnings(match.id);
    toast.success("Innings ended");
  };

  const handleExport = () => {
    const data = exportMatch(match.id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${match.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    toast.success("Match exported");
  };

  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display gradient-text">{match.name}</h1>
            <p className="text-muted-foreground text-sm">
              {match.currentInnings === 1 ? '1st' : '2nd'} Innings
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={isOverlayVisible ? "default" : "outline"}
              size="sm"
              onClick={() => {
                toggleOverlay();
                toast.success(isOverlayVisible ? "Overlay hidden" : "Overlay shown");
              }}
              className={isOverlayVisible ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isOverlayVisible ? <Eye className="h-4 w-4 mr-1" /> : <EyeOff className="h-4 w-4 mr-1" />}
              <Monitor className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleEndInnings}>
              End Innings
            </Button>
          </div>
        </div>

        {/* Score Display */}
        <div className="sticky top-0 z-50 -mx-4 px-4 lg:-mx-6 lg:px-6 pt-2 pb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Card className="glass-panel-strong border-none overflow-hidden shadow-2xl">
            <CardContent className="p-4 lg:p-6 relative">
              <div className="flex flex-col items-center justify-center text-center">

                {/* Team Name */}
                <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase mb-1">
                  {battingTeam.name}
                </p>

                {/* Main Score */}
                <div className="relative">
                  <p className="text-7xl lg:text-8xl font-score gradient-text leading-none">
                    {currentInnings.runs}/{currentInnings.wickets}
                  </p>
                </div>

                {/* Overs */}
                <p className="text-xl text-muted-foreground font-display mt-2">
                  ({currentInnings.overs}.{currentInnings.balls} overs)
                </p>

                {/* Badges - Absolute Right on Desktop, Flow on Mobile */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4 lg:absolute lg:right-6 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:items-end lg:mt-0">
                  {isPowerplay && (
                    <Badge className="bg-powerplay text-white animate-pulse">
                      <Zap className="h-3 w-3 mr-1" /> POWERPLAY
                    </Badge>
                  )}
                  {isPowerSurge && (
                    <Badge className="bg-powersurge text-white animate-pulse-glow">
                      <Sparkles className="h-3 w-3 mr-1" /> POWER SURGE
                    </Badge>
                  )}
                  {(isCurrentBallGolden || isGoldenDelivery) && (
                    <Badge className="bg-golden text-black glow-golden animate-golden-shimmer">
                      ⭐ GOLDEN BALL
                    </Badge>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ball History - All Overs */}
        <BallHistory
          ballEvents={currentInnings.ballEvents}
          currentOver={currentInnings.overs}
        />

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Player Selection */}
          <Card className="glass-panel border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Batsmen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Striker *</label>
                <Select
                  value={currentInnings.currentStriker || ''}
                  onValueChange={(v) => setStriker(match.id, v)}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {battingTeam.players
                      .filter(p => !isPlayerDismissed(p.id) && p.id !== currentInnings.currentNonStriker)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Non-Striker</label>
                <Select
                  value={currentInnings.currentNonStriker || ''}
                  onValueChange={(v) => setNonStriker(match.id, v)}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select non-striker" />
                  </SelectTrigger>
                  <SelectContent>
                    {battingTeam.players
                      .filter(p => !isPlayerDismissed(p.id) && p.id !== currentInnings.currentStriker)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={() => swapBatsmen(match.id)}
                className="w-full"
              >
                <ArrowLeftRight className="h-4 w-4 mr-2" /> Swap Batsmen
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bowler</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={currentInnings.currentBowler || ''}
                onValueChange={(v) => setBowler(match.id, v)}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBowlers().map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="glass-panel border-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Special Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setSelectedExtraType('penalty')}
                className="w-full"
              >
                Extra Runs (+VAR)
              </Button>
              <Button
                variant={isGoldenBallActive ? "default" : "outline"}
                onClick={() => setIsGoldenBallActive(!isGoldenBallActive)}
                className={`w-full ${isGoldenBallActive ? 'bg-golden text-black' : ''}`}
              >
                <Sparkles className="h-4 w-4 mr-2" /> Golden Ball
              </Button>
              {canActivatePowerSurge && (
                <Button
                  onClick={handlePowerSurge}
                  className="w-full bg-powersurge hover:bg-powersurge/80"
                >
                  <Zap className="h-4 w-4 mr-2" /> Activate Power Surge
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Scoring Grid */}
        <Card className="glass-panel border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center">
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(0)}>0</ScoreButton>
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(1)}>1</ScoreButton>
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(2)}>2</ScoreButton>
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(3)}>3</ScoreButton>
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(4)} className="bg-gradient-to-br from-four to-green-600">4</ScoreButton>
              <ScoreButton variant="run" size="lg" onClick={() => handleRuns(6)} className="bg-gradient-to-br from-six to-purple-800">6</ScoreButton>
            </div>
          </CardContent>
        </Card>

        {/* Extras */}
        <Card className="glass-panel border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Extras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 justify-center">
              <ScoreButton variant="extra" onClick={() => setSelectedExtraType('wide')}>Wide</ScoreButton>
              <ScoreButton variant="extra" onClick={() => setSelectedExtraType('noball')}>No Ball</ScoreButton>
              <ScoreButton variant="extra" onClick={() => setSelectedExtraType('bye')}>Bye</ScoreButton>
              <ScoreButton variant="extra" onClick={() => setSelectedExtraType('legbye')}>Leg Bye</ScoreButton>
            </div>
          </CardContent>
        </Card>

        {/* Wickets */}
        <Card className="glass-panel border-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Wicket
            </CardTitle>
          </CardHeader>
          <CardContent>
            {showWicketOptions ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3 justify-center">
                  <ScoreButton variant="wicket" onClick={() => handleWicket('bowled')}>Bowled</ScoreButton>
                  <ScoreButton variant="wicket" onClick={() => handleWicket('caught')}>Caught</ScoreButton>
                  <ScoreButton variant="wicket" onClick={() => handleWicket('lbw')}>LBW</ScoreButton>
                  <ScoreButton variant="wicket" onClick={() => handleWicket('runout')}>Run Out</ScoreButton>
                  <ScoreButton variant="wicket" onClick={() => handleWicket('stumped')}>Stumped</ScoreButton>
                  <ScoreButton variant="wicket" onClick={() => handleWicket('hitwicket')}>Hit Wicket</ScoreButton>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowWicketOptions(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowWicketOptions(true)}
                className="w-full bg-destructive hover:bg-destructive/80 text-destructive-foreground h-16 text-xl font-display"
              >
                WICKET
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={handleUndo}
            className="flex-1 max-w-xs"
          >
            <Undo2 className="h-4 w-4 mr-2" /> Undo Last Ball
          </Button>
        </div>

        {/* Next Bowler Dialog */}
        <Dialog open={!currentInnings.currentBowler && match.status === 'live'} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Select Next Bowler</DialogTitle>
              <DialogDescription>
                Choose the bowler for the next over.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Over {currentInnings.overs} completed. Choose the bowler for Over {currentInnings.overs + 1}.
              </p>
              <Select
                onValueChange={(v) => setBowler(match.id, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableBowlers().map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>

        {/* Opening Batsmen Dialog */}
        <Dialog open={(!currentInnings.currentStriker || !currentInnings.currentNonStriker) && match.status === 'live' && currentInnings.ballEvents.length === 0} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Select Opening Batsmen</DialogTitle>
              <DialogDescription>
                Choose the striker and non-striker to start the innings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Please select the two opening batsmen to start the innings.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Striker</label>
                  <Select
                    value={currentInnings.currentStriker || ''}
                    onValueChange={(v) => setStriker(match.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Show all avail, plus current non-striker isn't selected yet or is filtered */}
                      {battingTeam.players
                        .filter(p => !isPlayerDismissed(p.id) && p.id !== currentInnings.currentNonStriker)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Non-Striker</label>
                  <Select
                    value={currentInnings.currentNonStriker || ''}
                    onValueChange={(v) => setNonStriker(match.id, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select non-striker" />
                    </SelectTrigger>
                    <SelectContent>
                      {battingTeam.players
                        .filter(p => !isPlayerDismissed(p.id) && p.id !== currentInnings.currentStriker)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Next Batsman Dialog - Only after wickets (events > 0) */}
        <Dialog open={!currentInnings.currentStriker && match.status === 'live' && currentInnings.wickets < 10 && currentInnings.ballEvents.length > 0} onOpenChange={() => { }}>
          <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>New Batsman</DialogTitle>
              <DialogDescription>
                Select the new batsman to come to the crease.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                Wicket fell! Choose the new batsman.
              </p>
              <Select
                onValueChange={(v) => setStriker(match.id, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select batsman" />
                </SelectTrigger>
                <SelectContent>
                  {battingTeam.players
                    .filter(p => !isPlayerDismissed(p.id) && p.id !== currentInnings.currentNonStriker && p.id !== currentInnings.currentStriker)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>

        {/* Extra Runs Dialog */}
        <Dialog open={!!selectedExtraType} onOpenChange={(open) => !open && setSelectedExtraType(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedExtraType === 'penalty' ? 'Extra Runs' : `${selectedExtraType === 'noball' ? 'No Ball' : selectedExtraType?.toUpperCase()} Runs`}
              </DialogTitle>
              <DialogDescription>
                Enter additional runs or select standard extras.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground text-center">
                {(selectedExtraType === 'wide' || selectedExtraType === 'noball')
                  ? "Select additional runs (e.g., 1 for WD+1)"
                  : "Select total runs"}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {/* 0 is only for Wide/NoBall (standard wide/nb) */}
                {(selectedExtraType === 'wide' || selectedExtraType === 'noball') && (
                  <Button
                    onClick={() => {
                      if (!selectedExtraType) return;
                      addExtra(match.id, selectedExtraType, 0);
                      setSelectedExtraType(null);
                      toast.success(`Added ${selectedExtraType}`);
                    }}
                    variant="outline"
                    className="h-12 w-12 text-lg font-bold"
                  >
                    0
                  </Button>
                )}
                {[1, 2, 3, 4, 5, 6].map((run) => (
                  <Button
                    key={run}
                    onClick={() => {
                      if (!selectedExtraType) return;
                      // Pass 'run' directly as additional runs.
                      // For Wide/NB: 1 -> 1+1 = 2 total.
                      // For Bye: 1 -> 1 total.
                      addExtra(match.id, selectedExtraType, run);
                      setSelectedExtraType(null);
                      toast.success(`Added ${selectedExtraType} + ${run} runs`);
                    }}
                    variant="outline"
                    className="h-12 w-12 text-lg font-bold"
                  >
                    {run}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Custom runs"
                  value={customExtraRuns}
                  onChange={(e) => setCustomExtraRuns(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md bg-background text-foreground"
                />
                <Button
                  onClick={() => {
                    if (!selectedExtraType) return;
                    const runs = parseInt(customExtraRuns);
                    if (!isNaN(runs)) {
                      addExtra(match.id, selectedExtraType, runs);
                      setSelectedExtraType(null);
                      setCustomExtraRuns("");
                      toast.success(`Added ${selectedExtraType} + ${runs} runs`);
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fielder Selection Dialog */}
        <Dialog open={!!pendingWicketType} onOpenChange={(open) => !open && setPendingWicketType(null)}>
          <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">Select Fielder ({pendingWicketType})</DialogTitle>
              <DialogDescription>
                Choose the fielder involved in the dismissal.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 py-4">
              {bowlingTeam.players.map((player) => (
                <Button
                  key={player.id}
                  variant="outline"
                  onClick={() => {
                    if (!pendingWicketType) return;
                    addWicket(match.id, pendingWicketType, player.id, { isGoldenBall: isGoldenBallActive });
                    setPendingWicketType(null);
                    setIsGoldenBallActive(false);
                    toast.error(`WICKET! ${pendingWicketType} by ${player.name}`);
                  }}
                  className="justify-start truncate"
                >
                  {player.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
