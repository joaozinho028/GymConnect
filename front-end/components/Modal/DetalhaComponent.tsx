import { Backdrop, Fade } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import { X } from "lucide-react";
import React, { Fragment, useEffect, useState } from "react";

import { twMerge } from "tailwind-merge";

interface IOtherBtnProps {
  className: string;
  disabled: boolean;
  onClick: any;
  text: string;
}
interface ModalProps {
  children: React.ReactNode;
  opened?: boolean;
  onClose?: () => void;
  onDeny?: () => void | undefined;
  saved?: any;
  isSubmitting?: any;
  hasSaveButton?: boolean;
  hasDenyButton?: boolean;
  hasCloseBtn?: boolean;
  hasForm?: boolean;
  denyButtonText?: string;
  className?: string;
  classNameBody?: string;
  header?: string | any;
  typeButton?: string;
  defaultW?: string;
  otherButtons?: any;
}

export default function ModalComponente({
  onClose,
  onDeny,
  opened = false,
  children,
  saved,
  header,
  hasCloseBtn = true,
  hasForm = true,
  typeButton = "button",
  hasSaveButton = true,
  hasDenyButton = false,
  denyButtonText,
  className,
  classNameBody = "px-8 py-6",
  defaultW = "w-96",
  isSubmitting = false,
  otherButtons,
  ...props
}: ModalProps) {
  const [openModal, setOpenModal] = useState(false);
  useEffect(() => {
    setOpenModal(opened);
  }, [opened]);

  const claasBoxModal = twMerge(
    `absolute dark:bg-black bg-white left-[4px] right-[4px] top-[4px] bottom-[4px] w-auto h-auto 
     sm:left-[4px] sm:right-[4px] sm:top-[4px] sm:bottom-[4px] sm:w-auto sm:h-auto rounded-md`,
    className
  );

  return (
    <Fragment>
      <Modal
        {...props}
        open={openModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
          },
        }}
        className="transition-all "
      >
        <Fade in={openModal}>
          <Box className={claasBoxModal}>
            <header
              style={{ zIndex: 999, backgroundColor: "#64FA36" }}
              className={`sticky !z-99999  shadow-sm text-black p-2 dark:text-stroke font-medium text-lg overflow-y-auto w-full flex  justify-between top-0 right-0 dark:bg-black`}
            >
              {header ? (
                <div className="p-2 pl-5 w-full">{header}</div>
              ) : (
                <div></div>
              )}
              {hasCloseBtn && (
                <Button onClick={onClose} className="text-white">
                  <X size={20} className="text-black" />
                </Button>
              )}
            </header>

            <main className={classNameBody}>
              {hasForm ? (
                <form className="">{children}</form>
              ) : (
                <div className="">{children}</div>
              )}
            </main>

            {/* {(hasDenyButton || hasSaveButton || otherButtons) && (
              <footer
                className={`bottom-2 ${
                  (hasDenyButton || hasSaveButton || otherButtons) && "mt-3"
                }  sticky w-full flex justify-end gap-2 pr-3 bg-white dark:bg-black`}
              >
                {hasDenyButton && (
                  <button
                    className={`bg-body  ${
                      isSubmitting && "opacity-50 pointer-events-none" // Disable button if submitting
                    } text-white rounded-md text-sm py-2 px-4`}
                    onClick={onDeny}
                    type="button"
                  >
                    {denyButtonText}
                  </button>
                )}
                {hasSaveButton && (
                  <button
                    className={`bg-success text-white rounded-md text-sm py-2 px-4 ${
                      isSubmitting && "opacity-50 pointer-events-none" // Disable button if submitting
                    }`}
                    type="submit"
                    disabled={isSubmitting}
                    onClick={(e: any) => saved(e)}
                  >
                    Confirmar
                  </button>
                )}
                {otherButtons &&
                  otherButtons.map((button: IOtherBtnProps, index: number) => {
                    return (
                      <button
                        key={index}
                        className={button.className}
                        disabled={button.disabled}
                        onClick={button.onClick}
                      >
                        {button.text}
                      </button>
                    );
                  })}
              </footer>
            )} */}
          </Box>
        </Fade>
      </Modal>
    </Fragment>
  );
}
