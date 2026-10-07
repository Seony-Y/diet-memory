import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, ChevronDown, Plus } from "lucide-react";

export function SelectField({
  name,
  value,
  defaultValue,
  options,
  ariaLabel,
  onChange,
}: {
  name?: string;
  value?: string;
  defaultValue?: string;
  options: readonly string[];
  ariaLabel: string;
  onChange?: (value: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? options[0] ?? "",
  );
  const selectedValue = value ?? internalValue;

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const selectValue = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    setOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = Math.max(options.indexOf(selectedValue), 0);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const offset = event.key === "ArrowDown" ? 1 : -1;
      const nextIndex =
        (currentIndex + offset + options.length) % options.length;
      selectValue(options[nextIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="select-field" ref={root}>
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        type="button"
        className="select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
      >
        <span>{selectedValue}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="select-options" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option === selectedValue}
              className={option === selectedValue ? "selected" : ""}
              onClick={() => selectValue(option)}
              key={option}
            >
              <span>{option}</span>
              {option === selectedValue && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <Icon size={21} />
      <span>{label}</span>
    </button>
  );
}

export function MacroProgress({
  label,
  current,
  goal,
  unit,
  width,
  color,
}: {
  label: string;
  current: number;
  goal: number;
  unit: string;
  width: string;
  color: string;
}) {
  const exceeded = current > goal;
  return (
    <div className="macro">
      <p>
        <span>{label}</span>
        <b>
          <strong className={exceeded ? "exceeded" : ""}>{current}</strong> /{" "}
          {goal}
          {unit}
        </b>
      </p>
      <div>
        <i style={{ width, background: color }} />
      </div>
    </div>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="section-title">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </header>
  );
}

export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <header className="page-title">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </header>
  );
}

export function MetricCard({
  icon: Icon,
  eyebrow,
  title,
  onAdd,
  children,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  onAdd: () => void;
  children: ReactNode;
}) {
  return (
    <section className="metric">
      <header>
        <div className="metric-icon">
          <Icon size={19} />
        </div>
        <p>
          <span>{eyebrow}</span>
          <b>{title}</b>
        </p>
        <button onClick={onAdd} aria-label={`${title} 추가`}>
          <Plus size={17} />
        </button>
      </header>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  unit,
  note,
}: {
  label: string;
  value: string;
  unit: string;
  note: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>
        {value}
        <small> {unit}</small>
      </strong>
      <em>{note}</em>
    </article>
  );
}

export function ChartCard({
  title,
  target,
  eyebrow = "WEEKLY",
  children,
}: {
  title: string;
  target: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  return (
    <section className="chart">
      <header>
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <b>{target}</b>
      </header>
      <div>{children}</div>
    </section>
  );
}
