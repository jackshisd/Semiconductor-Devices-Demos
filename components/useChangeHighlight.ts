'use client';

import { useEffect, useRef, useState } from 'react';

export function useChangeHighlight(value: string | number, duration = 800) {
  const previous = useRef(value);
  const [highlighted, setHighlighted] = useState(false);

  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    previous.current = value;
    setHighlighted(true);
    const timer = window.setTimeout(() => setHighlighted(false), duration);
    return () => window.clearTimeout(timer);
  }, [value, duration]);

  return highlighted;
}
