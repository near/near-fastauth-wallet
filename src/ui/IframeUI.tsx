import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useMediaQuery,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from '@chakra-ui/react';
import React, { useEffect } from 'react';

type IframeModalProps = {
  iframeSrc: string;
};
export const IframeUI: React.FC<IframeModalProps> = ({ iframeSrc }) => {
  const [isMobile] = useMediaQuery('(max-width: 768px)');
  const { isOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  useEffect(() => {
    console.log('IframeUI mounted');
    console.log('Iframe src ', iframeSrc);
  }, []);

  const iframe = (
    <iframe
      title="Iframe Content"
      src={iframeSrc}
      width="100%"
      height="100%" // Set your desired height
      allowFullScreen
      allow="publickey-credentials-get *; clipboard-write"
    />
  );

  if (isMobile) {
    return (
      <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent
          bg="transparent"
          boxShadow="none"
          maxWidth="unset"
          w="100vw"
          h="80vh"
        >
          <DrawerCloseButton top="20px" right="20px" />
          <DrawerBody
            p={0}
            borderTopLeftRadius="16px"
            borderTopRightRadius="16px"
          >
            {iframe}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        bg="transparent"
        boxShadow="none"
        maxWidth="unset"
        h="100vh"
      >
        <ModalCloseButton right="25px" />
        <ModalBody bg="transparent" px={0}>
          {iframe}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default IframeUI;
