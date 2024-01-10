import ReactDOM from 'react-dom/client';
import IframeUI from './IframeUI';
import { ChakraProvider } from '@chakra-ui/react';

export const loadIframeIntoReactApp = (iframeSrc) => {
  try {
    const rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'nfw');
    document.body.appendChild(rootElement);

    const root = ReactDOM.createRoot(rootElement);

    root.render(
      <ChakraProvider>
        <IframeUI iframeSrc={iframeSrc} />
      </ChakraProvider>
    );
  } catch (error) {
    console.error('Error creating React app:', error);
  }
};
