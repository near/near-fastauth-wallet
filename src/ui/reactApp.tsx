import ReactDOM from 'react-dom/client';
import IframeDialog from './IframeDialog';

export const renderIFrame = ({
  iframeSrc,
  isModal
}: {
  iframeSrc: string;
  isModal?: boolean;
}): void => {
  let rootElement = document.querySelector('#nfw-root');

  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.setAttribute('id', 'nfw-root');
    document.body.appendChild(rootElement);
  }

  ReactDOM.createRoot(rootElement).render(
    <IframeDialog
        isOpen
        iframeSrc={iframeSrc}
        isModal={isModal}
      />
  );
};
