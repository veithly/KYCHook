import type { ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ModalProps {
  title: string;
  message: ReactNode;
  onClose: () => void;
}

export function Modal({ title, message, onClose }: ModalProps) {
  return (
    <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="modal-dialog glass">
        <div className="modal-header">
          <div className="icon-wrapper-sm">
            <Icon name="alert-triangle" tone="accent" />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>{title}</h3>
            <p className="form-note" style={{ margin: 0 }}>
              Action required
            </p>
          </div>
          <button className="modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">{message}</div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="glow" onClick={onClose}>
            I will resubmit
          </Button>
        </div>
      </div>
    </div>
  );
}
