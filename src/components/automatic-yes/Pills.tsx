import type { ChangeEvent } from "react";

/**
 * A choice block's options, as real checkboxes or radios inside labels.
 *
 * They look like pills, but they are inputs: a div with a click handler would
 * be unreachable by keyboard and silent to a screen reader, and this page asks
 * people to answer questions about themselves.
 */

interface PillsProps {
  name: string;
  options: string[];
  single: boolean;
  other: boolean;
  otherPlaceholder: string;
  value: string[];
  otherValue: string;
  onChange: (next: string[]) => void;
  onOtherChange: (next: string) => void;
}

const Pills = ({
  name,
  options,
  single,
  other,
  otherPlaceholder,
  value,
  otherValue,
  onChange,
  onOtherChange,
}: PillsProps) => {
  const toggle = (option: string) => (event: ChangeEvent<HTMLInputElement>) => {
    if (single) {
      onChange(event.target.checked ? [option] : []);
      return;
    }
    onChange(
      event.target.checked ? [...value, option] : value.filter((chosen) => chosen !== option),
    );
  };

  return (
    <div className="pills">
      {options.map((option) => (
        <label className={`pill${value.includes(option) ? " on" : ""}`} key={option}>
          <input
            type={single ? "radio" : "checkbox"}
            name={name}
            value={option}
            checked={value.includes(option)}
            onChange={toggle(option)}
          />
          <span>{option}</span>
        </label>
      ))}

      {other && (
        // Typing in the box ticks it: having to type *and* tick is a trap
        // people fall into, and then their answer is not counted.
        <label className={`pill other${otherValue ? " on" : ""}`}>
          <input
            type="text"
            value={otherValue}
            placeholder={otherPlaceholder}
            aria-label={otherPlaceholder}
            onChange={(event) => onOtherChange(event.target.value)}
          />
        </label>
      )}
    </div>
  );
};

export default Pills;
