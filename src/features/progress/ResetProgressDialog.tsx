import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import type { RefObject } from 'react';

interface ResetProgressDialogProps {
  open: boolean;
  result: string;
  returnFocusRef: RefObject<HTMLElement | null>;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function ResetProgressDialog({
  open,
  result,
  returnFocusRef,
  onOpenChange,
  onConfirm,
}: ResetProgressDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="confirm-dialog"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          requestAnimationFrame(() => {
            if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus();
          });
        }}
      >
        <DialogTitle>Reset your progress?</DialogTitle>
        <DialogDescription>
          Clear new and Legacy practice scores in this browser. Your musical setup stays. This
          cannot be undone.
        </DialogDescription>
        {result && (
          <p role="status" className="notice">
            {result}
          </p>
        )}
        <div className="button-row">
          <Button onClick={() => onOpenChange(false)}>Keep progress</Button>
          <Button variant="danger" onClick={onConfirm}>
            Reset progress
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
