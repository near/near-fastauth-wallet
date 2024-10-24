import ReactDOM from 'react-dom/client';
import IframeDialog from './IframeDialog';
import './styles.css';

export const renderIFrame = ({
  iframeSrc,
  styleModal
}: {
  iframeSrc: string;
  styleModal?: boolean;
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
      styleModal={styleModal}
    />
  );
};
