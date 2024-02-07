import React from 'react';
import ReactDOM from 'react-dom/client';
import IframeDialog, { IframeModalProps } from './IframeDialog';

type LoadIframeOptions = {
  isOpen?: boolean;
};

const DEFAULT_OPTIONS = {
  isOpen: true,
};

export const loadIframeDialog = (
  iframeSrc: string,
  options?: LoadIframeOptions
) => {
  const { isOpen } = options ?? DEFAULT_OPTIONS;

  const IframeDialogWrapper: React.FC<IframeModalProps> = (props) => {
    // Ensure the component receives the updated isOpen prop
    return <IframeDialog {...props} isOpen={isOpen} />;
  };

  let rootElement = document.querySelector('#nfw-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'nfw-root');
    document.body.appendChild(rootElement);
  }

  ReactDOM.createRoot(rootElement).render(
    <IframeDialogWrapper iframeSrc={iframeSrc} />
  );
};
