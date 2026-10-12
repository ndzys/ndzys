import { useEffect } from 'react';

const SEQUENCE = 'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a';
const LENGTH = SEQUENCE.split(' ').length;

export function useKonami(onMatch: () => void) {
  useEffect(() => {
    const recent: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      recent.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
      if (recent.length > LENGTH) recent.shift();
      if (recent.join(' ') === SEQUENCE) {
        recent.length = 0;
        onMatch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onMatch]);
}
