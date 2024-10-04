import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './CloseIcon';
import { Overlay } from './Overlay';
import { usePortal } from '../hooks/usePortal';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { Spinner } from './Spinner';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isHidden?: boolean;
  dialogHeight?: string;
  isLoading?: boolean;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  isHidden = false,
  dialogHeight = '375px',
  isLoading = false
}) => {
  const portalRoot = usePortal();
  const drawerRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(drawerRef, onClose);

  if (!isOpen || !portalRoot) return null;

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
      {isLoading && <Spinner
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001
        }}
      />}
      {drawerContent}
    </Overlay>,
    portalRoot
  );
};
