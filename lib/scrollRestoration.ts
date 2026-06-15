

const STORAGE_KEY = 'properties_list_scroll_state';

export interface ScrollState {
  scrollPosition: number;
  currentPage: number;
  timestamp: number;
}


export function saveScrollState(page: number): void {
  if (typeof window === 'undefined') return;

  const scrollPosition = window.scrollY || document.documentElement.scrollTop;
  const state: ScrollState = {
    scrollPosition,
    currentPage: page,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) { }
}


export function restoreScrollState(): { page: number; scrollPosition: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const state: ScrollState = JSON.parse(stored);

    const isRecent = Date.now() - state.timestamp < 10 * 60 * 1000;
    if (!isRecent) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      page: state.currentPage,
      scrollPosition: state.scrollPosition,
    };
  } catch (error) {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}


export function clearScrollState(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) { }
}

