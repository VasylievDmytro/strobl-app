interface SearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
}

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  inputClassName
}: SearchInputProps) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
        {label}
      </span>
      <input
        className={`input-shell ${inputClassName ?? ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
