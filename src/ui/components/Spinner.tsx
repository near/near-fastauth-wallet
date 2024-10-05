import React from 'react';

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 24, color = '#fff', ...props }) => {
  return (
    <svg
      {...props}
      className={`nfw-spinner ${props.className || ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="11"
        stroke={color}
        strokeWidth="3"
        fill="none"
        strokeDasharray="34.55751918948772 34.55751918948772"
        strokeLinecap="round"
      />
    </svg>
  );
};
