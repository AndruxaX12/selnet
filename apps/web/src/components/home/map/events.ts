type Listener = (count: number) => void;
type MarkerClickListener = (signalId: string) => void;

const listeners = new Set<Listener>();
const markerClickListeners = new Set<MarkerClickListener>();

export function emitHomeMapCount(count: number) {
  for (const listener of listeners) {
    listener(count);
  }
}

export function subscribeHomeMapCount(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Emit when a marker is clicked on the map
export function emitMarkerClick(signalId: string) {
  for (const listener of markerClickListeners) {
    listener(signalId);
  }
}

// Subscribe to marker click events
export function subscribeMarkerClick(listener: MarkerClickListener) {
  markerClickListeners.add(listener);
  return () => {
    markerClickListeners.delete(listener);
  };
}
