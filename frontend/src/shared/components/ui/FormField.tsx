import { ReactNode } from 'react';
import { Label } from '../../../components/ui/label';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
  description?: string;
}

export function FormField({
  label,
  required = false,
  error,
  children,
  description,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
