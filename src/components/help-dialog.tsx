import type { ReactNode } from 'react';
import { CircleHelp } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface HelpDialogProps {
  triggerLabel: string;
  title: string;
  description: string;
  steps: readonly { title: string; body: ReactNode }[];
  children?: ReactNode;
}

/** Contextual guidance; opening help leaves the current exercise and settings intact. */
export function HelpDialog({ triggerLabel, title, description, steps, children }: HelpDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="help-trigger">
          <CircleHelp size={16} aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="help-dialog">
        <header className="help-dialog-header">
          <p className="eyebrow">A little guidance</p>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </header>
        <div className="help-dialog-body">
          <ol className="help-steps" aria-label="Practice steps">
            {steps.map((step, i) => (
              <li key={step.title}>
                <span className="help-step-number" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {children && <div className="help-details">{children}</div>}
        </div>
        <footer className="help-dialog-footer">
          <DialogClose asChild>
            <Button variant="primary">Got it</Button>
          </DialogClose>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
