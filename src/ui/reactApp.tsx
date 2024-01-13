import React from 'react';
import ReactDOM from 'react-dom/client';
import IframeDialog from './IframeDialog';

export const loadIframeViaReactApp = (iframeSrc: string) => {
  const rootElement = document.createElement('div');
  rootElement.setAttribute('id', 'nfw');
  document.body.appendChild(rootElement);

  const root = ReactDOM.createRoot(rootElement);

  root.render(<IframeDialog iframeSrc={iframeSrc} />);
};
