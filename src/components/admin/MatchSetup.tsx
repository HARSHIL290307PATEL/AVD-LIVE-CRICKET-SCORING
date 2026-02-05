import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMatchStore } from "@/store/matchStore";
import { Team, Player } from "@/types/match";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Crown, Star, ArrowRight, Upload, User, Image } from "lucide-react";
import { toast } from "sonner";

const generateId = () => Math.random().toString(36).substring(2, 9);

const defaultColors = {
  teamA: "hsl(24, 95%, 53%)",
  teamB: "hsl(195, 100%, 50%)",
};

// Compress and convert image to base64
const processImage = (file: File, maxSize = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if needed
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = (height / width) * maxSize;
            width = maxSize;
          } else {
            width = (width / height) * maxSize;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export function MatchSetup() {
  const navigate = useNavigate();
  const createMatch = useMatchStore((state) => state.createMatch);

  const [matchName, setMatchName] = useState("");
  const [totalOvers, setTotalOvers] = useState("5");
  const [teamA, setTeamA] = useState<Team>({
    id: generateId(),
    name: "",
    shortName: "",
    primaryColor: defaultColors.teamA,
    players: [],
  });
  const [teamB, setTeamB] = useState<Team>({
    id: generateId(),
    name: "",
    shortName: "",
    primaryColor: defaultColors.teamB,
    players: [],
  });
  const [newPlayerA, setNewPlayerA] = useState("");
  const [newPlayerB, setNewPlayerB] = useState("");
  const [newPlayerPhotoA, setNewPlayerPhotoA] = useState<string>("");
  const [newPlayerPhotoB, setNewPlayerPhotoB] = useState<string>("");

  const logoInputARef = useRef<HTMLInputElement>(null);
  const logoInputBRef = useRef<HTMLInputElement>(null);
  const playerPhotoInputARef = useRef<HTMLInputElement>(null);
  const playerPhotoInputBRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (team: 'A' | 'B', file: File) => {
    try {
      const base64 = await processImage(file, 150);
      if (team === 'A') {
        setTeamA({ ...teamA, logo: base64 });
      } else {
        setTeamB({ ...teamB, logo: base64 });
      }
      toast.success("Logo uploaded!");
    } catch {
      toast.error("Failed to process image");
    }
  };

  const handlePlayerPhotoUpload = async (team: 'A' | 'B', file: File) => {
    try {
      const base64 = await processImage(file, 100);
      if (team === 'A') {
        setNewPlayerPhotoA(base64);
      } else {
        setNewPlayerPhotoB(base64);
      }
    } catch {
      toast.error("Failed to process image");
    }
  };

  const addPlayer = (team: 'A' | 'B') => {
    const playerName = team === 'A' ? newPlayerA : newPlayerB;
    const playerPhoto = team === 'A' ? newPlayerPhotoA : newPlayerPhotoB;
    if (!playerName.trim()) return;

    const player: Player = {
      id: generateId(),
      name: playerName.trim(),
      photo: playerPhoto || undefined,
    };

    if (team === 'A') {
      setTeamA({ ...teamA, players: [...teamA.players, player] });
      setNewPlayerA("");
      setNewPlayerPhotoA("");
    } else {
      setTeamB({ ...teamB, players: [...teamB.players, player] });
      setNewPlayerB("");
      setNewPlayerPhotoB("");
    }
  };

  const removePlayer = (team: 'A' | 'B', playerId: string) => {
    if (team === 'A') {
      setTeamA({ ...teamA, players: teamA.players.filter(p => p.id !== playerId) });
    } else {
      setTeamB({ ...teamB, players: teamB.players.filter(p => p.id !== playerId) });
    }
  };

  const toggleCaptain = (team: 'A' | 'B', playerId: string) => {
    const updateFn = (t: Team) => ({
      ...t,
      players: t.players.map(p => ({
        ...p,
        isCaptain: p.id === playerId ? !p.isCaptain : false,
      })),
    });
    if (team === 'A') setTeamA(updateFn(teamA));
    else setTeamB(updateFn(teamB));
  };

  const toggleViceCaptain = (team: 'A' | 'B', playerId: string) => {
    const updateFn = (t: Team) => ({
      ...t,
      players: t.players.map(p => ({
        ...p,
        isViceCaptain: p.id === playerId ? !p.isViceCaptain : false,
      })),
    });
    if (team === 'A') setTeamA(updateFn(teamA));
    else setTeamB(updateFn(teamB));
  };

  const handleCreateMatch = () => {
    if (!matchName.trim()) {
      toast.error("Please enter a match name");
      return;
    }
    if (!teamA.name.trim() || !teamB.name.trim()) {
      toast.error("Please enter team names");
      return;
    }
    if (teamA.players.length < 5 || teamB.players.length < 5) {
      toast.error("Each team must have at least 5 players");
      return;
    }

    const matchId = createMatch(matchName, parseInt(totalOvers) || 20, teamA, teamB);
    toast.success("Match created successfully!");
    navigate(`/admin/${matchId}`);
  };

  const renderTeamCard = (
    team: Team,
    setTeam: (t: Team) => void,
    teamLabel: string,
    newPlayer: string,
    setNewPlayer: (s: string) => void,
    newPlayerPhoto: string,
    setNewPlayerPhoto: (s: string) => void,
    teamKey: 'A' | 'B',
    logoInputRef: React.RefObject<HTMLInputElement>,
    playerPhotoInputRef: React.RefObject<HTMLInputElement>
  ) => (
    <Card className="glass-panel border-none">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-display gradient-text">Team {teamLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Team Logo */}
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-lg bg-muted/50 border border-muted-foreground/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => logoInputRef.current?.click()}
          >
            {team.logo ? (
              <img src={team.logo} alt="Team logo" className="w-full h-full object-cover" />
            ) : (
              <Image className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {team.logo ? 'Change Logo' : 'Upload Logo'}
            </Button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(teamKey, file);
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-muted-foreground text-sm">Team Name</Label>
            <Input
              value={team.name}
              onChange={(e) => setTeam({ ...team, name: e.target.value })}
              placeholder="Mumbai Indians"
              className="bg-muted/50 border-muted-foreground/20 mt-1"
            />
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Short Name</Label>
            <Input
              value={team.shortName}
              onChange={(e) => setTeam({ ...team, shortName: e.target.value.toUpperCase().slice(0, 3) })}
              placeholder="MI"
              maxLength={3}
              className="bg-muted/50 border-muted-foreground/20 mt-1"
            />
          </div>
        </div>

        <div>
          <Label className="text-muted-foreground text-sm">Players ({team.players.length})</Label>
          <div className="flex gap-2 mt-1">
            {/* Player Photo Preview/Upload */}
            <div
              className="w-10 h-10 rounded-full bg-muted/50 border border-muted-foreground/20 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
              onClick={() => playerPhotoInputRef.current?.click()}
              title="Add player photo"
            >
              {newPlayerPhoto ? (
                <img src={newPlayerPhoto} alt="Player" className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <input
              ref={playerPhotoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePlayerPhotoUpload(teamKey, file);
              }}
            />
            <Input
              value={newPlayer}
              onChange={(e) => setNewPlayer(e.target.value)}
              placeholder="Enter player name"
              className="bg-muted/50 border-muted-foreground/20"
              onKeyDown={(e) => e.key === 'Enter' && addPlayer(teamKey)}
            />
            <Button
              onClick={() => addPlayer(teamKey)}
              size="icon"
              className="bg-primary hover:bg-primary/80"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {newPlayerPhoto && (
            <p className="text-xs text-muted-foreground mt-1">Photo attached. Press + to add player.</p>
          )}
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {team.players.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2 animate-slide-up"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="flex items-center gap-2">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium">{player.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-7 w-7 ${player.isCaptain ? 'text-accent' : 'text-muted-foreground'}`}
                  onClick={() => toggleCaptain(teamKey, player.id)}
                  title="Captain"
                >
                  <Crown className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`h-7 w-7 ${player.isViceCaptain ? 'text-secondary' : 'text-muted-foreground'}`}
                  onClick={() => toggleViceCaptain(teamKey, player.id)}
                  title="Vice Captain"
                >
                  <Star className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => removePlayer(teamKey, player.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display gradient-text tracking-wider">
            HCL 2026 - Create Match
          </h1>
          <p className="text-muted-foreground">Set up your cricket match</p>
        </div>

        <Card className="glass-panel border-none">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label className="text-muted-foreground text-sm">Match Name</Label>
                <Input
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="HCL 2026 - Match 1"
                  className="bg-muted/50 border-muted-foreground/20 mt-1 text-lg"
                />
              </div>
              <div>
                <Label className="text-muted-foreground text-sm">Total Overs</Label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={totalOvers}
                  onChange={(e) => setTotalOvers(e.target.value)}
                  className="bg-muted/50 border-muted-foreground/20 mt-1 text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {renderTeamCard(teamA, setTeamA, 'A', newPlayerA, setNewPlayerA, newPlayerPhotoA, setNewPlayerPhotoA, 'A', logoInputARef, playerPhotoInputARef)}
          {renderTeamCard(teamB, setTeamB, 'B', newPlayerB, setNewPlayerB, newPlayerPhotoB, setNewPlayerPhotoB, 'B', logoInputBRef, playerPhotoInputBRef)}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleCreateMatch}
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground px-12 py-6 text-xl font-display glow-primary"
          >
            Create Match
            <ArrowRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
