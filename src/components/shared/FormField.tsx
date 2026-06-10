import { TextField, Label, Input, FieldError } from 'react-aria-components';

interface FormFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email';
  error?: string;
  isRequired?: boolean;
}

const inputClasses =
  'w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all data-[invalid]:border-porsche-red data-[invalid]:ring-2 data-[invalid]:ring-porsche-red/20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm hover:border-porsche-silver-dark';

/**
 * Labeled text input with validation error, built on react-aria's TextField.
 * Keeps form markup DRY and consistent across forms.
 */
export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  error,
  isRequired = false,
}: FormFieldProps) {
  return (
    <TextField
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      isRequired={isRequired}
      isInvalid={!!error}
      className="flex flex-col gap-2"
    >
      <Label className="text-xs font-semibold text-porsche-black flex items-center gap-1 tracking-wide uppercase">
        {label}
        {isRequired && <span className="text-porsche-red">*</span>}
      </Label>
      <Input className={inputClasses} />
      {error && (
        <FieldError className="text-sm text-porsche-red font-medium flex items-center gap-1">
          <span aria-hidden="true">⚠️</span>
          {error}
        </FieldError>
      )}
    </TextField>
  );
}
