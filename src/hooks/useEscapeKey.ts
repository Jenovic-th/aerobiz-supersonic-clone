import { useEffect } from 'react';

/**
 * Custom hook to standardize Escape key modal closing across all game interfaces.
 * Closes the active modal when the user presses the 'Escape' key.
 */
export function useEscapeKey(onClose?: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || !onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, enabled]);
}
