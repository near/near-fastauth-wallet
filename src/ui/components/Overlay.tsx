import React from 'react';
import ReactDOM from 'react-dom';

interface OverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const Overlay: React.FC<OverlayProps> = ({ isOpen, onClose, children, ...props }) => {
  if (!isOpen) return null;

  const overlayContent = (
    <div
      {...props}
      className={`nfw-overlay ${props.className || ''}`}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );

  return ReactDOM.createPortal(
    overlayContent,
    document.body
  );
};
