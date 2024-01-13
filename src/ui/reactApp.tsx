import React from 'react';
import ReactDOM from 'react-dom/client';
import IframeUI from './IframeUI';

export const loadIframeViaReactApp = (iframeSrc: string) => {
  const rootElement = document.createElement('div');
  rootElement.setAttribute('id', 'nfw');
  document.body.appendChild(rootElement);

  const root = ReactDOM.createRoot(rootElement);

  root.render(<IframeUI iframeSrc={iframeSrc} />);
};
