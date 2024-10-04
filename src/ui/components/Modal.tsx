import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useMediaQuery } from 'usehooks-ts';
import { CloseIcon } from './CloseIcon';
import { Overlay } from './Overlay';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  dialogHeight?: string;
  isHidden?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, dialogHeight = '500px', isHidden = false }) => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.createElement('div');
    root.id = 'modal-root';
    document.body.appendChild(root);
    setModalRoot(root);

    return () => {
      document.body.removeChild(root);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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

  if (!isOpen || !modalRoot) return null;

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
      {modalContent}
    </Overlay>,
    modalRoot
  );
};
