import { useEffect, useRef } from "react";
import TicketForm from "./TicketForm";

interface NewTicketDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewTicketDialog({
  open,
  onClose,
  onSuccess,
}: NewTicketDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector("input")?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = () => onClose();
    dialog.addEventListener("cancel", handleCancel);

    return () => dialog.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="new-ticket-title"
      className="dialog"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="new-ticket-title" className="text-lg font-semibold text-ink">
            New ticket
          </h2>
          <p className="mt-1 text-sm text-muted">
            Tell us what needs attention.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close new ticket dialog"
          className="btn btn-ghost btn-sm"
        >
          Close
        </button>
      </div>
      <div className="mt-5">
        <TicketForm onSuccess={onSuccess} />
      </div>
    </dialog>
  );
}
