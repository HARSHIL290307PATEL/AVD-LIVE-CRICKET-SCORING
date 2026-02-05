import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OverlayStore {
    isVisible: boolean;
    setVisible: (visible: boolean) => void;
    toggle: () => void;
}

export const useOverlayStore = create<OverlayStore>()(
    persist(
        (set) => ({
            isVisible: true,
            setVisible: (visible) => set({ isVisible: visible }),
            toggle: () => set((state) => ({ isVisible: !state.isVisible })),
        }),
        {
            name: 'hcl-2026-overlay',
        }
    )
);

// Cross-tab synchronization
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
        if (event.key === 'hcl-2026-overlay') {
            const newValue = event.newValue;
            if (newValue) {
                try {
                    const parsed = JSON.parse(newValue);
                    if (parsed.state) {
                        useOverlayStore.setState(parsed.state);
                    }
                } catch (e) {
                    console.error('Failed to sync overlay state:', e);
                }
            }
        }
    });
}
