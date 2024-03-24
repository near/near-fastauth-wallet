import React, { useState } from 'react';
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
): Promise<HTMLIFrameElement> => {
  return new Promise((resolve) => {
    const { isOpen } = options ?? DEFAULT_OPTIONS;

    const IframeDialogWrapper: React.FC<IframeModalProps> = (props) => {
      const [iframeRef, setIframeRef] = useState<HTMLIFrameElement | null>(
        null
      );

      return (
        <IframeDialog
          {...props}
          isOpen={isOpen}
          ref={setIframeRef}
          onLoad={() => resolve(iframeRef)}
        />
      );
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
  });
};
