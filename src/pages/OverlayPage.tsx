import { useParams } from "react-router-dom";
import { useMatchStore } from "@/store/matchStore";
import { Overlay } from "@/components/overlay/Overlay";

const OverlayPage = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const match = useMatchStore((state) => state.matches.find(m => m.id === matchId));

  if (!match) {
    return (
      <div className="overlay-container min-h-screen flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="overlay-panel rounded-xl px-8 py-4">
          <p className="text-xl font-display text-muted-foreground">Match not found</p>
        </div>
      </div>
    );
  }

  return <Overlay match={match} />;
};

export default OverlayPage;
