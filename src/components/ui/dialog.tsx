import * as Primitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useRef, type ComponentProps } from 'react';
import { cn } from './button';
export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogTitle = Primitive.Title;
export const DialogDescription = Primitive.Description;
export const DialogClose = Primitive.Close;
export function DialogContent({
  children,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: ComponentProps<typeof Primitive.Content>) {
  const opener = useRef<HTMLElement | null>(null);
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="dialog-overlay" />
      <Primitive.Content
        className={cn('dialog-content', className)}
        {...props}
        onOpenAutoFocus={(event) => {
          const active = document.activeElement;
          // StrictMode can repeat autofocus after focus has entered the dialog.
          // Keep the external opener rather than replacing it with a dialog field.
          if (
            active instanceof HTMLElement &&
            active !== document.body &&
            !active.closest('[role="dialog"]')
          ) {
            opener.current = active;
          }
          onOpenAutoFocus?.(event);
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          if (!event.defaultPrevented && opener.current?.isConnected) {
            event.preventDefault();
            opener.current.focus();
          }
        }}
      >
        {children}
        <Primitive.Close className="dialog-close" aria-label="Close dialog">
          <X size={19} aria-hidden="true" />
        </Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  );
}
