import { useEffect } from 'react';

// Adds a class to <body> while `active`, so fixed bars (compare tray, contact bar) can make room
// for each other and for the page content underneath them.
export function useBodyClass(className: string, active = true) {
  useEffect(() => {
    if (!active) return;
    document.body.classList.add(className);
    return () => document.body.classList.remove(className);
  }, [className, active]);
}
