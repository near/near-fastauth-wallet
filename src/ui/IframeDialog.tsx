import { useState, useEffect, useRef, forwardRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import {
  Dialog,
  DialogContent,
} from "./components/ui/dialog"
import {
  Drawer,
  DrawerContent,
} from "./components/ui/drawer"
import { X } from "lucide-react"

export type IframeModalProps = {
  iframeSrc: string;
  isOpen: boolean;
  styleModal?: boolean;
};

type MessageEventData = {
  dialogHeight?: number;
  closeIframe?: boolean;
  hideModal?: boolean;
  onClose?: () => void;
  type: string;
};

export const IframeDialog = forwardRef<HTMLIFrameElement, IframeModalProps>(
  ({ iframeSrc, isOpen, styleModal }, ref) => {
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const onCloseRef = useRef(null);

    const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
    const [dialogHeight, setDialogHeight] = useState('0px');
    const [isHidden, setIsHideModal] = useState(false);
    const [isIframeLoaded, setIsIframeLoaded] = useState(false);

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
        className="nfw-iframe"
        allowFullScreen
        allow="publickey-credentials-get *; clipboard-write"
        onLoad={() => setIsIframeLoaded(true)}
      />
    )

    if (!styleModal) {
      return isDialogOpen ? (
        <div id="nfw-connect-iframe-container" className="nfw-iframe-container">
          {isIframeLoaded && <X onClick={handleDialogClose} className="nfw-close-button" />}
          {iframeElement}
        </div>
      ) : null;
    } else {
      return isDesktop ?
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className={`${isHidden ? 'hidden' : ''} w-[375px]`}
            style={{
              height: dialogHeight,
            }}>
            {iframeElement}
          </DialogContent>
        </Dialog>
        :
        <Drawer open={isDialogOpen} onOpenChange={handleDialogClose}   >
          <DrawerContent className={`${isHidden ? 'hidden' : ''}`}
            style={{
              height: dialogHeight,
            }}>
            {iframeElement}
          </DrawerContent>
        </Drawer>
    }
  }
);

export default IframeDialog;
