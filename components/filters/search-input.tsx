interface SearchInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  inputClassName?: string;
  suggestions?: string[];
}

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  inputClassName,
  suggestions
}: SearchInputProps) {
  const suggestionItems = suggestions ?? [];
  const listId = suggestionItems.length
    ? `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-suggestions`
    : undefined;

  return (
    <label className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-400">
        {label}
      </span>
      <input
        className={`input-shell ${inputClassName ?? ""}`}
        value={value}
        placeholder={placeholder}
        list={listId}
        onChange={(event) => onChange(event.target.value)}
      />
      {listId ? (
        <datalist id={listId}>
          {suggestionItems.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
      ) : null}
    </label>
  );
}
