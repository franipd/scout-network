// The network diagram. Node positions are percentages of a fixed-aspect
// stage so the SVG edges and the HTML cards always agree.

import { useState } from 'react';

// Cards are absolutely positioned, so unbounded content makes neighbours
// overlap (the orchestrator's matchup details were vanishing under Scout B).
// Collapsed cards clamp the subtitle and preview a few queries; clicking a
// card expands it above its neighbours with everything visible.
const QUERY_PREVIEW = 2;
const SUBTITLE_CLAMP_HINT = 70; // chars — beyond this the clamp likely hides text

const NODE_POS = {
  orchestrator: { x: 50, y: 12 },
  scoutA: { x: 16, y: 52 },
  scoutB: { x: 50, y: 52 },
  scoutC: { x: 84, y: 52 },
  chief: { x: 50, y: 90 },
};

const EDGES = [
  ['orchestrator', 'scoutA'],
  ['orchestrator', 'scoutB'],
  ['orchestrator', 'scoutC'],
  ['scoutA', 'chief'],
  ['scoutB', 'chief'],
  ['scoutC', 'chief'],
];

function edgeState(from, to, nodes) {
  const a = nodes[from]?.status;
  const b = nodes[to]?.status;
  if (b === 'active' || (from === 'orchestrator' && a === 'done' && b === 'active'))
    return 'flowing';
  if (a === 'done' && (b === 'done' || b === 'error')) return 'done';
  if (b === 'error') return 'error';
  return 'idle';
}

function ConfidenceBar({ value }) {
  if (typeof value !== 'number') return null;
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const tone = value >= 0.75 ? 'ok' : value >= 0.6 ? 'warn' : 'err';
  return (
    <div className="conf" title={`Confidence ${pct}%`}>
      <div className="conf-track">
        <div className={`conf-fill conf-${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="conf-num">{(value ?? 0).toFixed(2)}</span>
    </div>
  );
}

function Node({ id, node }) {
  const [expanded, setExpanded] = useState(false);
  const pos = NODE_POS[id];
  const status = node?.status || 'idle';
  const queries = node.queries || [];
  const shownQueries = expanded ? queries : queries.slice(0, QUERY_PREVIEW);
  const hiddenCount = queries.length - shownQueries.length;
  const expandable =
    queries.length > QUERY_PREVIEW || (node.subtitle || '').length > SUBTITLE_CLAMP_HINT;
  const toggle = () => {
    if (expandable) setExpanded((e) => !e);
  };
  return (
    <div
      className={`node node-${status}${expanded ? ' node-expanded' : ''}${expandable ? ' node-expandable' : ''}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      role={expandable ? 'button' : undefined}
      tabIndex={expandable ? 0 : undefined}
      aria-expanded={expandable ? expanded : undefined}
      title={expandable && !expanded ? node.subtitle : undefined}
      onClick={toggle}
      onKeyDown={(e) => {
        if (expandable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          toggle();
        }
      }}
    >
      <div className="node-kind">{node.kind}</div>
      <div className="node-title">{node.title}</div>
      {node.subtitle && (
        <div className={`node-sub${expanded ? '' : ' node-sub-clamp'}`}>{node.subtitle}</div>
      )}
      {shownQueries.length > 0 && (
        <ul className="node-queries">
          {shownQueries.map((q, i) => (
            <li key={i}>&ldquo;{q}&rdquo;</li>
          ))}
          {hiddenCount > 0 && (
            <li className="node-more">+{hiddenCount} more search{hiddenCount > 1 ? 'es' : ''} — click to expand</li>
          )}
        </ul>
      )}
      <div className="node-footer">
        <ConfidenceBar value={node.confidence} />
        {node.gaps > 0 && <span className="badge badge-warn">{node.gaps} gap{node.gaps > 1 ? 's' : ''} flagged</span>}
        {status === 'error' && <span className="badge badge-err">failed</span>}
        {status === 'active' && <span className="badge badge-live">live</span>}
        {typeof node.latencyMs === 'number' && (
          <span className="node-latency">{(node.latencyMs / 1000).toFixed(1)}s</span>
        )}
      </div>
    </div>
  );
}

export default function AgentGraph({ nodes }) {
  return (
    <div className="graph" role="img" aria-label="Agent network: orchestrator dispatching three scouts feeding a chief scout">
      <svg className="graph-edges" viewBox="0 0 100 100" preserveAspectRatio="none">
        {EDGES.map(([from, to]) => {
          const a = NODE_POS[from];
          const b = NODE_POS[to];
          const midY = (a.y + b.y) / 2;
          const d = `M ${a.x} ${a.y} C ${a.x} ${midY}, ${b.x} ${midY}, ${b.x} ${b.y}`;
          return (
            <path
              key={`${from}-${to}`}
              d={d}
              className={`edge edge-${edgeState(from, to, nodes)}`}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      {Object.keys(NODE_POS).map((id) => (
        <Node key={id} id={id} node={nodes[id]} />
      ))}
    </div>
  );
}
