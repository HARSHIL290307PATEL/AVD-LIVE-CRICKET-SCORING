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

    // Realtime Subscription & Initial Fetch (Global Sync)
    useEffect(() => {
        if (!supabase) return;

        // 1. Fetch ALL matches on mount to populate Dashboard
        const fetchAllMatches = async () => {
            const { data, error } = await supabase
                .from('matches')
                .select('data');

            if (data && !error) {
                const cloudMatches = data.map((d: any) => d.data);

                // Merge cloud matches into local store
                useMatchStore.setState((state) => {
                    const localMatchesMap = new Map(state.matches.map(m => [m.id, m]));
                    let hasChanges = false;

                    cloudMatches.forEach((cloudMatch: any) => {
                        const localMatch = localMatchesMap.get(cloudMatch.id);
                        if (!localMatch || cloudMatch.updatedAt > localMatch.updatedAt) {
                            localMatchesMap.set(cloudMatch.id, cloudMatch);
                            hasChanges = true;
                        }
                    });

                    if (hasChanges) {
                        console.log('Synced matches from cloud');
                        return { matches: Array.from(localMatchesMap.values()) };
                    }
                    return state;
                });
            }
        };
        fetchAllMatches();

        // 2. Subscribe to changes for ALL matches (so Dashboard updates live)
        const channel = supabase
            .channel(`all-matches`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'matches',
                },
                (payload) => {
                    const newMatchData = payload.new.data;
                    if (newMatchData) {
                        useMatchStore.setState((state) => {
                            const exists = state.matches.find(m => m.id === newMatchData.id);
                            if (!exists || newMatchData.updatedAt > exists.updatedAt) {
                                console.log('Received update for match:', newMatchData.id);
                                const otherMatches = state.matches.filter(m => m.id !== newMatchData.id);
                                return { matches: [...otherMatches, newMatchData] };
                            }
                            return state;
                        });
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'matches',
                },
                (payload) => {
                    const newMatchData = payload.new.data;
                    if (newMatchData) {
                        useMatchStore.setState((state) => ({
                            matches: [...state.matches, newMatchData]
                        }));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []); // Run once on mount

    return null; // This hook doesn't render anything
}


