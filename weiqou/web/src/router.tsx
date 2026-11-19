import React, { useSyncExternalStore } from 'react';

// ponytail: a ~20-line pushState router; switch to react-router if routes ever need params or nested loaders.
const subscribe = (cb: () => void) => {
  window.addEventListener('popstate', cb);
  return () => window.removeEventListener('popstate', cb);
};

export const usePath = () => useSyncExternalStore(subscribe, () => window.location.pathname);
export const useQuery = (key: string) =>
  useSyncExternalStore(subscribe, () => new URLSearchParams(window.location.search).get(key));

export function navigate(to: string, replace = false) {
  window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
  if (!replace) window.scrollTo(0, 0);
}

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }> = ({ to, onClick, ...rest }) => (
  <a
    href={to}
    onClick={(e) => {
      onClick?.(e);
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      navigate(to);
    }}
    {...rest}
  />
);
