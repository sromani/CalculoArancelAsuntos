interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Clases extra en el contenedor `.form-field` (p. ej. compacto en simulador). */
  className?: string;
}

export default function Select({ 
  label, 
  name, 
  value, 
  onChange, 
  options,
  placeholder = "Seleccione una opción",
  required = false,
  disabled = false,
  className,
}: SelectProps) {
  return (
    <div className={className ? `form-field ${className}` : 'form-field'}>
      <label htmlFor={name}>
        {label} {required && <span className="required">*</span>}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}