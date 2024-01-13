import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { Modal, Drawer } from 'antd';

type IframeModalProps = {
  iframeSrc: string;
};

export const IframeDialog: React.FC<IframeModalProps> = ({ iframeSrc }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [isOpen, setIsOpen] = useState(true);
  const [dialogHeight, setDialogHeight] = useState('fit-content');

  useEffect(() => {
    window.addEventListener(
      'message',
      (event) => {
        if (event.data.iframeDialogHeight)
          setDialogHeight(`${event.data.iframeDialogHeight}px`);
      },
      false
    );
  }, []);

  const iframe = (
    <iframe
      id="myIframe"
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
        width={500}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        contentWrapperStyle={{ height: 'unset' }}
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
      open={isOpen}
      onOk={() => setIsOpen(false)}
      onCancel={() => setIsOpen(false)}
      footer={null}
      width="auto"
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
