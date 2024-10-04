import React from 'react';

interface CloseIconProps {
  onClick: () => void;
}

export const CloseIcon: React.FC<CloseIconProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        cursor: 'pointer',
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '24px',
        height: '24px',
        background: 'none',
        border: 'none',
        padding: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.8536 2.85355C13.0488 2.65829 13.0488 2.34171 12.8536 2.14645C12.6583 1.95118 12.3417 1.95118 12.1464 2.14645L8 6.29289L3.85355 2.14645C3.65829 1.95118 3.34171 1.95118 3.14645 2.14645C2.95118 2.34171 2.95118 2.65829 3.14645 2.85355L7.29289 7L3.14645 11.1464C2.95118 11.3417 2.95118 11.6583 3.14645 11.8536C3.34171 12.0488 3.65829 12.0488 3.85355 11.8536L8 7.70711L12.1464 11.8536C12.3417 12.0488 12.6583 12.0488 12.8536 11.8536C13.0488 11.6583 13.0488 11.3417 12.8536 11.1464L8.70711 7L12.8536 2.85355Z"
          fill="#706F6C"
        />
      </svg>
    </button>
  );
};

export default CloseIcon;
