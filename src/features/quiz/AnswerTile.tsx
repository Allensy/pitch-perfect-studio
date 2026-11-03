import { cn } from '@/components/ui/button';
interface Props {
  label: string;
  caption: string;
  accessibleLabel: string;
  disabled: boolean;
  wrong?: boolean;
  selected?: boolean;
  pressed?: boolean;
  onClick: () => void;
}
export function AnswerTile({
  label,
  caption,
  accessibleLabel,
  disabled,
  wrong = false,
  selected = false,
  pressed,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      className={cn('answer-key', selected && 'selected', wrong && 'is-wrong')}
      aria-label={accessibleLabel}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
    >
      <span>{label}</span>
      <small>{caption}</small>
      {wrong && (
        <i className="answer-mark" aria-hidden="true">
          ×
        </i>
      )}
    </button>
  );
}
