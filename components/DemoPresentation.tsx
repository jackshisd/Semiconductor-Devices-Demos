'use client';

import { createContext } from 'react';

export const InlineControlsContext = createContext(false);
export const ControlsHostContext = createContext<HTMLElement | null>(null);
