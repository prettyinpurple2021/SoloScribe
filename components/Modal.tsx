/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ReactNode } from 'react';
import c from 'classnames';
import { X } from 'lucide-react';

type ModalProps = {
  children?: ReactNode;
  onClose: () => void;
  className?: string;
  title?: string;
};

/**
 * A generic, reusable modal component that displays content in a centered overlay.
 * @param children The content to be rendered inside the modal.
 * @param onClose A callback function that is triggered when the close button is clicked.
 * @param className Optional additional CSS classes to apply to the modal container.
 * @param title Optional title to display in the modal header.
 */
export default function Modal({ children, onClose, className, title }: ModalProps) {
  return (
    <div className="modalShroud">
      <div className={c('modal', className)}>
        <div className="modal-header">
          <h2>{title || 'System Message'}</h2>
          <button onClick={onClose} className="modalClose">
            <X size={24} />
          </button>
        </div>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  );
}
