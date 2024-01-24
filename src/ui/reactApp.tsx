import React from 'react';
import ReactDOM from 'react-dom/client';
import IframeDialog from './IframeDialog';

type LoadIframeOptions = {
  isOpen?: boolean;
};

export const loadIframeDialog = (
  iframeSrc: string,
  options?: LoadIframeOptions
) => {
  const { isOpen = true } = options;
  let rootElement = document.querySelector('#nfw-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
  }
  rootElement.setAttribute('id', 'nfw-root');
  rootElement.replaceChildren();
  document.body.appendChild(rootElement);

  // Wait until React is available
  const renderApp = () => {
    if (React && ReactDOM) {
      const root = ReactDOM.createRoot(rootElement);
      root.render(<IframeDialog iframeSrc={iframeSrc} isOpen={isOpen} />);
    } else {
      setTimeout(renderApp, 100);
    }
  };

  renderApp();
};
