import { useEffect, useRef } from 'react';

export default function LogPanel({ entries }) {
  const bodyRef = useRef(null);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries]);

  return (
    <section className="log" aria-label="Orchestration log">
      <div className="log-head">
        <span className="log-dot" aria-hidden="true" />
        ORCHESTRATION LOG
      </div>
      <div className="log-body" ref={bodyRef}>
        {entries.length === 0 && (
          <div className="log-empty">Awaiting deployment. Every line below will be a real agent event.</div>
        )}
        {entries.map((e, i) => (
          <div key={i} className={`log-line log-${e.level}`}>
            <span className="log-ts">{e.ts}</span>
            <span className="log-msg">{e.msg}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
