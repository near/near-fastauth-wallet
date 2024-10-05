import { useState, useEffect, useRef, forwardRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Dialog } from './components/Dialog';

export type IframeModalProps = {
  iframeSrc: string;
  isOpen: boolean;
  isModal?: boolean;
};

type MessageEventData = {
  dialogHeight?: number;
  closeIframe?: boolean;
  hideModal?: boolean;
  onClose?: () => void;
  type: string;
};

export const IframeDialog = forwardRef<HTMLIFrameElement, IframeModalProps>(
  ({ iframeSrc, isOpen, isModal }, ref) => {
    const isMobile = useMediaQuery('(max-width: 767px)');
    const onCloseRef = useRef(null);

    const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
    const [dialogHeight, setDialogHeight] = useState('0px');
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);
    const [isHidden, setIsHideModal] = useState(false);

    const handleOnMessage = (event: MessageEvent<MessageEventData>) => {
      if (event.data.dialogHeight) {
        setDialogHeight(`${event.data.dialogHeight}px`);
      }

      if (event.data.onClose) {
        // Un-serialize the onClose function from the string
        onCloseRef.current = new Function(`return ${event.data.onClose}`)();
      }

      if (event.data.closeIframe) {
        handleDialogClose();
      }

      if (event.data.hideModal) {
        setIsHideModal(true);
      }
    };

    useEffect(() => {
      window.addEventListener('message', handleOnMessage, false);
      return () => {
        window.removeEventListener('message', handleOnMessage, false);
      };
    }, []);

    useEffect(() => {
      if (typeof isOpen === 'boolean' && isOpen !== isDialogOpen)
        setIsDialogOpen(isOpen);
    }, [isOpen]);

    const handleDialogClose = () => {
      setIsDialogOpen(false);
      onCloseRef.current?.();
    };

    const iframeElement = (
      <iframe
        ref={ref}
        id="nfw-connect-iframe"
        title="Iframe Content"
        src={iframeSrc}
        className="iframe"
        allowFullScreen
        allow="publickey-credentials-get *; clipboard-write"
        onLoad={() => {
          setIsIframeLoaded(true);
        }}
      />
    )

    if (!isModal && isDialogOpen) {
      return (
        <div id="nfw-connect-iframe-container" className="iframe-container">
          {iframeElement}
        </div>
      );
    } else {
      return <Dialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        dialogHeight={dialogHeight}
        isHidden={isHidden}
        isLoading={!isIframeLoaded}
        isMobile={isMobile}
      >
        {iframeElement}
      </Dialog>
    }
  }
);

export default IframeDialog;
