import React, { useEffect, useState } from 'react';

function format(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
}

export function ProcessClock({
  endsAt,
  minutes,
  elapsed,
  isFacilitator,
  onSet,
}: {
  endsAt: number | null;
  minutes: number | null;
  elapsed: boolean;
  isFacilitator: boolean;
  onSet: (minutes: number | null) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = endsAt ? endsAt - now : 0;

  return (
    <div className="room-clock">
      {endsAt ? (
        <span className={'room-clock__time' + (elapsed || remaining <= 0 ? ' room-clock__time--elapsed' : '')}>
          {elapsed || remaining <= 0 ? 'Elapsed' : format(remaining)}
          {minutes ? <span className="room-clock__budget"> / {minutes}m</span> : null}
        </span>
      ) : (
        <span className="room-clock__time room-clock__time--unset">No timebox</span>
      )}
      {isFacilitator && (
        <div className="room-clock__set" aria-label="Set process clock">
          {[25, 50, 90].map((m) => (
            <button key={m} type="button" className="room-chip" onClick={() => onSet(m)}>
              {m}m
            </button>
          ))}
          {endsAt && (
            <button type="button" className="room-chip" onClick={() => onSet(null)}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
