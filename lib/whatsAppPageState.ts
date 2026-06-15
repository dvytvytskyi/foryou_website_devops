'use client';

import { useState, useEffect } from 'react';

export type WhatsAppPageContextType = 'property' | 'area' | 'developer' | 'news' | 'general';

export interface WhatsAppPageState {
  contextType: WhatsAppPageContextType;
  contextName: string;
}

const defaultState: WhatsAppPageState = { contextType: 'general', contextName: '' };

let currentState: WhatsAppPageState = { ...defaultState };
const listeners = new Set<(s: WhatsAppPageState) => void>();

export function setWhatsAppPageContext(state: WhatsAppPageState) {
  currentState = state;
  listeners.forEach((l) => l(state));
}

export function clearWhatsAppPageContext() {
  setWhatsAppPageContext({ ...defaultState });
}

export function useWhatsAppPageContext(): WhatsAppPageState {
  const [state, setState] = useState<WhatsAppPageState>(currentState);

  useEffect(() => {

    setState(currentState);
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
