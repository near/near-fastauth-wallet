import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './CloseIcon';
import { Overlay } from './Overlay';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isHidden?: boolean;
  dialogHeight?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, children, isHidden = false, dialogHeight = '375px' }) => {
  const [drawerRoot, setDrawerRoot] = useState<HTMLElement | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'drawer-root';
    document.body.appendChild(root);
    setDrawerRoot(root);

    return () => {
      document.body.removeChild(root);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !drawerRoot) return null;

  const drawerContent = (
    <div
      ref={drawerRef}
      style={{
        position: 'fixed',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10001,
        transition: 'transform 0.3s ease-in-out',
        left: 0,
        right: 0,
        bottom: 0,
        display: isHidden ? 'none' : 'block',
        height: dialogHeight,
        borderTopRightRadius: '12px',
        borderTopLeftRadius: '12px',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        overflow: 'auto',
      }}
    >
      <CloseIcon onClick={onClose} />
      {children}
    </div>
  );

  return ReactDOM.createPortal(
    <Overlay isOpen={isOpen} onClose={onClose}>
      {drawerContent}
    </Overlay>,
    drawerRoot
  );
};
