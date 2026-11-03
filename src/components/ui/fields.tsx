import type { Option as SelectOption } from '@/shared/options';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

export function Field({
  label,
  children,
  className = 'field',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export type { Option as SelectOption } from '@/shared/options';
type SelectProps<Value extends string | number> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange' | 'children'
> & {
  label: string;
  value: Value;
  options: readonly SelectOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
};
/** Native selection with typed values; no unchecked string-to-enum casts in callers. */
export function SelectField<Value extends string | number>({
  label,
  value,
  options,
  onChange,
  className = 'field',
  ...props
}: SelectProps<Value>) {
  return (
    <Field label={label} className={className}>
      <select
        {...props}
        value={value}
        onChange={(event) => {
          const selected = options.find((option) => String(option.value) === event.target.value);
          if (selected) onChange(selected.value);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

type CheckProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'checked' | 'onChange' | 'children'
> & {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};
export function CheckField({
  label,
  checked,
  onChange,
  className = 'check-label',
  ...props
}: CheckProps) {
  return (
    <label className={className}>
      <input
        {...props}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}
