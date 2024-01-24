import React, { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Modal, Drawer } from 'antd';

type IframeModalProps = {
  iframeSrc: string;
  isOpen?: boolean;
};

export const IframeDialog: React.FC<IframeModalProps> = ({
  iframeSrc,
  isOpen,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const onCloseRef = useRef(null);

  const [isDialogOpen, setIsDialogOpen] = useState(isOpen);
  const [dialogHeight, setDialogHeight] = useState('0px');

  const handleOnMessage = (event) => {
    if (event.data.dialogHeight) {
      setDialogHeight(`${event.data.dialogHeight}px`);
    }

    if (event.data.onClose) {
      // Unserialize the onClose function from the string
      onCloseRef.current = new Function(`return ${event.data.onClose}`)();
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

  const iframe = (
    <iframe
      id="nfw-connect-iframe"
      title="Iframe Content"
      src={iframeSrc}
      width="100%"
      height="100%" // Set your desired height
      allowFullScreen
      allow="publickey-credentials-get *; clipboard-write"
      style={{ borderRadius: '12px' }}
    />
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
        styles={{
          header: {
            display: 'none',
          },
          content: {
            padding: 0,
            borderTopRightRadius: '12px',
            borderTopLeftRadius: '12px',
            height: dialogHeight,
          },
          body: {
            width: '100%',
            padding: 0,
          },
        }}
      >
        {iframe}
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
      styles={{
        content: {
          padding: 0,
        },
        body: {
          height: dialogHeight,
          width: '375px',
          borderRadius: '12px',
        },
      }}
    >
      {iframe}
    </Modal>
  );
};

export default IframeDialog;
