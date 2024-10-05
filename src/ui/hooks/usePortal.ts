import { useState, useEffect } from 'react';

export const usePortal = () => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'portal-root';
    document.body.appendChild(root);
    setPortalRoot(root);

    return () => {
      document.body.removeChild(root);
    };
  }, []);

  return portalRoot;
};
