'use client';

export type Control = { key: string; label: string; min: number; max: number; step: number; unit?: string; log?: boolean };

export function Controls({ values, set, items, reset, children }: {
  values: Record<string, number>;
  set: (key: string, value: number) => void;
  items: Control[];
  reset: () => void;
  children?: React.ReactNode;
}) {
  return <aside className="controls">
    <div className="controls-head"><h2>Controls</h2><button className="reset-button" onClick={reset}>Reset</button></div>
    {items.map(control => {
      const value = values[control.key];
      return <div className="control" key={control.key}>
        <label htmlFor={control.key}>{control.label}<span>{control.unit}</span></label>
        <div className="control-inputs">
          <input type="range" aria-label={`${control.label} slider`}
            min={control.log ? Math.log10(control.min) : control.min}
            max={control.log ? Math.log10(control.max) : control.max}
            step={control.log ? .01 : control.step}
            value={control.log ? Math.log10(value) : value}
            onChange={event => set(control.key, control.log ? 10 ** Number(event.target.value) : Number(event.target.value))} />
          <input id={control.key} type="number" aria-label={control.label}
            min={control.min} max={control.max} step={control.step}
            value={Number(value.toPrecision(4))}
            onChange={event => set(control.key, Number(event.target.value))} />
        </div>
      </div>;
    })}
    {children}
  </aside>;
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="toggle"><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} /><i /></label>;
}
