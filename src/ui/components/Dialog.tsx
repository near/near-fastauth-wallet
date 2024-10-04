import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './CloseIcon';
import { Overlay } from './Overlay';
import { usePortal } from '../hooks/usePortal';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { Spinner } from './Spinner';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dialogHeight?: string;
  isHidden?: boolean;
  isLoading?: boolean;
  isMobile: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  children,
  dialogHeight = '500px',
  isHidden = false,
  isLoading = false,
  isMobile
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const portalRoot = usePortal();

  useOnClickOutside(dialogRef, onClose);

  if (!isOpen || !portalRoot) return null;

  const dialogContent = (
    <div
      ref={dialogRef}
      style={{
        display: isHidden ? 'none' : 'block',
        position: 'fixed',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10001,
        ...(isMobile
          ? {
            left: 0,
            right: 0,
            bottom: 0,
            height: dialogHeight,
            borderTopRightRadius: '12px',
            borderTopLeftRadius: '12px',
            transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
            transition: 'transform 0.3s ease-in-out',
          }
          : {
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '375px',
            maxWidth: '100%',
            height: dialogHeight,
            maxHeight: 'none',
            borderRadius: '12px',
          }),
        overflow: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
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
      {dialogContent}
    </Overlay>,
    portalRoot
  );
};
