import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { useMediaQuery } from 'usehooks-ts';
import { CloseIcon } from './CloseIcon';
import { Overlay } from './Overlay';
import { usePortal } from '../hooks/usePortal';
import { useOnClickOutside } from '../hooks/useOnClickOutside';
import { Spinner } from './Spinner';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dialogHeight?: string;
  isHidden?: boolean;
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  dialogHeight = '500px',
  isHidden = false,
  isLoading = false
}) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const modalRef = useRef<HTMLDivElement>(null);
  const portalRoot = usePortal();

  useOnClickOutside(modalRef, onClose);

  if (!isOpen || !portalRoot) return null;

  const modalContent = (
    <div
      ref={modalRef}
      style={{
        display: isHidden ? 'none' : 'block',
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 10001,
        width: isMobile ? '100%' : '375px',
        maxWidth: '100%',
        height: dialogHeight,
        maxHeight: isMobile ? '80vh' : 'none',
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
      {modalContent}
    </Overlay>,
    portalRoot
  );
};
