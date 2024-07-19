import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Modal, Drawer, Spin, Flex } from 'antd';
import { CloseOutlined, LoadingOutlined } from '@ant-design/icons';

const boxStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

export type IframeModalProps = {
  iframeSrc: string;
  isOpen?: boolean;
  onLoad?: React.EventHandler<React.SyntheticEvent>;
};

type MessageEventData = {
  dialogHeight?: number;
  closeIframe?: boolean;
  hideModal?: boolean;
  onClose?: () => void;
  type: string;
};

export const IframeDialog = forwardRef<HTMLIFrameElement, IframeModalProps>(
  ({ iframeSrc, isOpen, onLoad }, ref) => {
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
      <>
        {!isIframeLoaded && (
          <Flex style={boxStyle} justify="center" align="center">
            <Spin
              indicator={
                <LoadingOutlined style={{ fontSize: 55, color: '#fff' }} spin />
              }
            />
          </Flex>
        )}
        <iframe
          ref={ref}
          id="nfw-connect-iframe"
          title="Iframe Content"
          src={iframeSrc}
          width="100%"
          height="100%" // Set your desired height
          allowFullScreen
          allow="publickey-credentials-get *; clipboard-write"
          style={{ borderRadius: '12px' }}
          onLoad={(e) => {
            setIsIframeLoaded(true);
            onLoad(e);
          }}
        />
      </>
    );

    if (isMobile) {
      return (
        <Drawer
          placement="bottom"
          width="auto"
          onClose={handleDialogClose}
          open={isDialogOpen}
          contentWrapperStyle={{ height: 'unset' }}
          zIndex={10000}
          destroyOnClose
          closeIcon={isIframeLoaded}
          maskClosable={false}
          styles={{
            header: {
              display: 'none',
            },
            content: {
              padding: 0,
              borderTopRightRadius: '12px',
              borderTopLeftRadius: '12px',
              height: dialogHeight,
              maxHeight: '80vh',
              ...(isHidden ? { display: 'none' } : {}),
            },
            body: {
              width: '100%',
              padding: 0,
              overflow: 'hidden',
              position: 'relative',
              ...(isHidden ? { display: 'none' } : {}),
            },
            ...(isHidden ? { mask: { display: 'none' } } : {}),
          }}
        >
          {isIframeLoaded && (
            <CloseOutlined // Add close button
              data-testid="close-button"
              style={{
                cursor: 'pointer',
                position: 'absolute',
                top: '16px',
                right: '16px',
                width: '16px',
                height: '16px',
                color: '#706F6C',
              }}
              onClick={handleDialogClose}
            />
          )}

          {iframeElement}
        </Drawer>
      );
    }

    return (
      <Modal
        centered
        open={isDialogOpen}
        onOk={() => setIsDialogOpen(false)}
        onCancel={handleDialogClose}
        footer={null}
        width="auto"
        zIndex={10000}
        closeIcon={isIframeLoaded}
        maskClosable={false}
        destroyOnClose
        styles={{
          content: {
            padding: 0,
            ...(isHidden ? { display: 'none' } : {}),
          },
          body: {
            height: dialogHeight,
            width: '375px',
            borderRadius: '12px',
            ...(isHidden ? { display: 'none' } : {}),
          },
          ...(isHidden ? { mask: { display: 'none' } } : {}),
        }}
      >
        {iframeElement}
      </Modal>
    );
  }
);

export default IframeDialog;
