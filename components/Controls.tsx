'use client';

import { useContext, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InlineControlsContext, ControlsHostContext } from './DemoPresentation';
import { useChangeHighlight } from './useChangeHighlight';

export type Control = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
  log?: boolean;
};

function formatValue(value: number, scientific: boolean) {
  if (!scientific || value === 0) return Number(value.toPrecision(5)).toString();
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = Number((value / 10 ** exponent).toPrecision(3));
  return `${mantissa} × 10^${exponent}`;
}

function parseValue(text: string) {
  const normalized = text
    .trim()
    .replace(/\s+/g, '')
    .replace(/[×xX*]10\^/i, 'e')
    .replace(/^10\^/i, '1e');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return NaN;
  return Number(normalized);
}

function ValueInput({
  id,
  control,
  value,
  set,
}: {
  id: string;
  control: Control;
  value: number;
  set: (key: string, value: number) => void;
}) {
  const highlighted = useChangeHighlight(value);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');
  const [invalidDraft, setInvalidDraft] = useState<string | null>(null);
  const scientific =
    !!control.log || Math.abs(value) >= 1e5 || (value !== 0 && Math.abs(value) < 1e-3);
  useEffect(() => {
    setInvalidDraft(null);
  }, [value]);
  const commit = (text: string) => {
    const next = parseValue(text);
    if (
      Number.isFinite(next) &&
      next >= control.min &&
      next <= control.max &&
      (!control.log || next > 0)
    ) {
      setInvalidDraft(null);
      set(control.key, next);
      return true;
    }
    return false;
  };
  return (
    <div className="value-entry">
      <input
        id={id}
        type="text"
        inputMode="decimal"
        aria-label={control.label}
        aria-describedby={invalidDraft !== null ? `${id}-error` : undefined}
        className={highlighted ? 'number-updated' : undefined}
        aria-invalid={invalidDraft !== null}
        title="Enter a number, such as 1 × 10^17 or 1e17"
        value={focused ? draft : (invalidDraft ?? formatValue(value, scientific))}
        onFocus={() => {
          setFocused(true);
          setDraft(invalidDraft ?? formatValue(value, scientific));
        }}
        onChange={(event) => {
          const text = event.target.value;
          setDraft(text);
          commit(text);
        }}
        onBlur={() => {
          setFocused(false);
          if (!commit(draft)) setInvalidDraft(draft);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(formatValue(value, scientific));
            setInvalidDraft(null);
          }
        }}
      />
      {invalidDraft !== null && (
        <span id={`${id}-error`} className="input-error" role="alert">
          Use {formatValue(control.min, !!control.log)} to {formatValue(control.max, !!control.log)}{' '}
          {control.unit}
        </span>
      )}
    </div>
  );
}

export function Controls({
  values,
  set,
  items,
  reset,
  children,
}: {
  values: Record<string, number>;
  set: (key: string, value: number) => void;
  items: Control[];
  reset: () => void;
  children?: React.ReactNode;
}) {
  const id = useId();
  const inlineControls = useContext(InlineControlsContext);
  const controlsHost = useContext(ControlsHostContext);
  const panel = useRef<HTMLElement>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!panel.current || inlineControls) return;
    const update = () =>
      document.documentElement.style.setProperty(
        '--controls-height',
        `${panel.current?.getBoundingClientRect().height ?? 0}px`,
      );
    const observer = new ResizeObserver(update);
    observer.observe(panel.current);
    update();
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--controls-height');
    };
  }, [inlineControls]);
  const contents = (
    <aside ref={panel} className="controls" aria-label="Experiment controls">
      <div className="controls-head">
        <h2>Controls</h2>
        <button
          className="reset-button"
          onClick={() => {
            reset();
            setRevision((old) => old + 1);
          }}
        >
          Reset
        </button>
      </div>
      <div className="control-list">
        {items.map((control) => {
          const value = values[control.key];
          return (
            <div className="control" key={control.key}>
              <label htmlFor={`${id}-${control.key}`}>
                {control.label}
                <span>{control.unit}</span>
              </label>
              <div className="control-inputs">
                <input
                  type="range"
                  aria-label={`${control.label} slider`}
                  min={control.log ? Math.log10(control.min) : control.min}
                  max={control.log ? Math.log10(control.max) : control.max}
                  step={control.log ? 0.01 : control.step}
                  value={control.log ? Math.log10(value) : value}
                  onChange={(event) =>
                    set(
                      control.key,
                      Math.max(
                        control.min,
                        Math.min(
                          control.max,
                          control.log
                            ? 10 ** Number(event.target.value)
                            : Number(event.target.value),
                        ),
                      ),
                    )
                  }
                />
                <ValueInput
                  key={revision}
                  id={`${id}-${control.key}`}
                  control={control}
                  value={value}
                  set={set}
                />
              </div>
            </div>
          );
        })}
      </div>
      {children && <div className="control-extra">{children}</div>}
    </aside>
  );
  return inlineControls && controlsHost ? createPortal(contents, controlsHost) : contents;
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="toggle">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <i />
    </label>
  );
}
