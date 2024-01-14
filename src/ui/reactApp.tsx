import React from 'react';
import ReactDOM from 'react-dom/client';
import IframeDialog from './IframeDialog';

export const loadIframeViaReactApp = (iframeSrc: string) => {
  let rootElement = document.querySelector('#nfw-root');
  if (!rootElement) {
    rootElement = document.createElement('div');
  }
  rootElement.setAttribute('id', 'nfw-root');
  rootElement.replaceChildren();
  document.body.appendChild(rootElement);

  // Wait until React is available
  const checkReact = () => {
    if (React && ReactDOM) {
      console.log('React loaded');
      const root = ReactDOM.createRoot(rootElement);
      root.render(<IframeDialog iframeSrc={iframeSrc} />);
    } else {
      console.log('React not loaded...re-trying');
      // Retry after a short delay
      setTimeout(checkReact, 100);
    }
  };

  checkReact();
};
