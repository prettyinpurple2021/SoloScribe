/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { ReactNode, useState } from 'react';
import c from 'classnames';
import { X } from 'lucide-react';
import { Tooltip } from './Tooltip';

type ModalProps = {
  children?: ReactNode;
  onClose: () => void;
  className?: string;
  title?: string;
};

/**
 * A generic, reusable modal component that displays content in a centered overlay.
 */
export default function Modal({ children, onClose, className, title }: ModalProps) {
  return (
    <div className="modalShroud">
      <div className={c('modal', className)}>
        <div className="modal-header">
          <h2>{title || 'System Message'}</h2>
          <Tooltip content="Close" position="left">
            <button onClick={onClose} className="modalClose">
              <X size={24} />
            </button>
          </Tooltip>
        </div>
        <div className="modalContent">{children}</div>
      </div>
    </div>
  );
}

type ConfirmModalProps = {
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
};

export function ConfirmModal({ 
  title = 'Confirm Action', 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  variant = 'primary'
}: ConfirmModalProps) {
  return (
    <div className="modalShroud">
      <div className="modal max-w-md">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onCancel} className="modalClose">
            <X size={24} />
          </button>
        </div>
        <div className="modalContent space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={onConfirm}
              className={c(
                "px-6 py-2 rounded-lg font-bold transition-all shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none",
                variant === 'danger' ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

type PromptModalProps = {
  title?: string;
  message: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  placeholder?: string;
};

export function PromptModal({
  title = 'Input Required',
  message,
  defaultValue = '',
  onConfirm,
  onCancel,
  confirmText = 'Submit',
  cancelText = 'Cancel',
  placeholder = 'Type here...'
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="modalShroud">
      <div className="modal max-w-md">
        <div className="modal-header">
          <h2>{title}</h2>
          <button onClick={onCancel} className="modalClose">
            <X size={24} />
          </button>
        </div>
        <div className="modalContent space-y-4">
          <p className="text-sm text-muted-foreground font-mono uppercase tracking-tighter">{message}</p>
          <input 
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm(value)}
            placeholder={placeholder}
            className="brutalist-input w-full"
          />
          <div className="flex justify-end gap-3 pt-4">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => onConfirm(value)}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold shadow-[3px_3px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
