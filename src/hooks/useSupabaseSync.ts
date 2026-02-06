import { useEffect, useRef } from 'react';
import { useMatchStore } from '@/store/matchStore';
import { supabase } from '@/lib/supabase';

const SYNC_DEBOUNCE_MS = 2000;

export function useSupabaseSync() {
    const currentMatchId = useMatchStore((state) => state.currentMatchId);
    const getMatch = useMatchStore((state) => state.getMatch);

    // Ref to track last synced data to avoid loops or redundant updates
    const lastSyncedRef = useRef<number>(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!currentMatchId) return;

        const syncToSupabase = async () => {
            const match = getMatch(currentMatchId);
            if (!match) return;

            // Skip if not modified since last sync (approximate check using timestamp)
            if (match.updatedAt <= lastSyncedRef.current) return;

            if (!supabase) return;

            const { data, error } = await supabase
                .from('matches')
                .upsert({
                    id: match.id,
                    data: match,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'id' });

            if (error) {
                console.error('Error syncing match to Supabase:', error);
            } else {
                console.log('Match synced to Supabase:', match.id);
                lastSyncedRef.current = match.updatedAt;
            }
        };

        // Subscribe to store changes specifically for the current match
        const unsubscribe = useMatchStore.subscribe((state, prevState) => {
            const match = state.matches.find(m => m.id === currentMatchId);
            const prevMatch = prevState.matches.find(m => m.id === currentMatchId);

            // If match data changed
            if (match && match.updatedAt !== prevMatch?.updatedAt) {
                // Debounce the sync
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                timeoutRef.current = setTimeout(syncToSupabase, SYNC_DEBOUNCE_MS);
            }
        });

        return () => {
            unsubscribe();
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentMatchId, getMatch]);

    return null; // This hook doesn't render anything
}
