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

  return ReactDOM.createPortal(
    <Overlay
      isOpen={isOpen}
      onClose={onClose}
    >
      {isLoading && (
        <Spinner className="spinner" />
      )}
      <div
        ref={dialogRef}
        className={`dialog ${isMobile ? 'dialog-mobile' : 'dialog-desktop'}`}
        style={{
          display: isHidden ? 'none' : 'block',
          height: dialogHeight,
          transform: isMobile && isOpen ? 'translateY(0)' : undefined,
        }}
      >
        <CloseIcon
          onClick={onClose}
        />
        {children}
      </div>
    </Overlay>,
    portalRoot
  );
};
