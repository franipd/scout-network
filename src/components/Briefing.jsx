function Gauge({ value }) {
  const pct = Math.round(Math.min(1, Math.max(0, value ?? 0)) * 100);
  const tone = pct >= 75 ? 'ok' : pct >= 60 ? 'warn' : 'err';
  return (
    <div className={`gauge gauge-${tone}`} role="meter" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <div className="gauge-fill" style={{ width: `${pct}%` }} />
      <span className="gauge-label">{pct}% confidence</span>
    </div>
  );
}

export default function Briefing({ briefing }) {
  if (!briefing) return null;
  const { matchup } = briefing;
  let section = 0;
  const delay = () => ({ style: { animationDelay: `${section++ * 0.35}s` } });

  return (
    <article className="dossier" aria-label="Match briefing">
      <header className="dossier-head" {...delay()}>
        <div className="dossier-eyebrow">
          PRE-MATCH INTELLIGENCE BRIEFING · COMPILED BY AGENT NETWORK · {matchup?.date}
        </div>
        <h2 className="dossier-title">
          {matchup?.teamA} <span className="dossier-v">v</span> {matchup?.teamB}
        </h2>
        <div className="dossier-venue">{matchup?.venue}</div>
      </header>

      {briefing.executiveSummary && (
        <section className="dossier-section" {...delay()}>
          <h3>Executive summary</h3>
          <p>{briefing.executiveSummary}</p>
        </section>
      )}

      {briefing.teamDossiers?.length > 0 && (
        <section className="dossier-section dossier-teams" {...delay()}>
          {briefing.teamDossiers.map((t, i) => (
            <div className="team-card" key={i}>
              <h3>{t.team}</h3>
              <h4>Strengths</h4>
              <ul>{(t.strengths || []).map((s, j) => <li key={j}>{s}</li>)}</ul>
              <h4>Vulnerabilities</h4>
              <ul>{(t.vulnerabilities || []).map((s, j) => <li key={j}>{s}</li>)}</ul>
              <h4>Key players</h4>
              <ul>{(t.keyPlayers || []).map((s, j) => <li key={j}>{s}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      {briefing.keyBattles?.length > 0 && (
        <section className="dossier-section" {...delay()}>
          <h3>Key battles</h3>
          {briefing.keyBattles.map((b, i) => (
            <p className="battle" key={i}>
              <strong>{b.battle}.</strong> {b.why}
            </p>
          ))}
        </section>
      )}

      {briefing.tacticalRead && (
        <section className="dossier-section" {...delay()}>
          <h3>Tactical read</h3>
          <p>{briefing.tacticalRead}</p>
        </section>
      )}

      {briefing.prediction && (
        <section className="dossier-section dossier-prediction" {...delay()}>
          <h3>The call</h3>
          <p className="prediction-call">{briefing.prediction.call}</p>
          <Gauge value={briefing.prediction.confidence} />
          {briefing.prediction.caveat && (
            <p className="prediction-caveat">Would change this: {briefing.prediction.caveat}</p>
          )}
        </section>
      )}

      {briefing.flaggedGaps?.length > 0 && (
        <section className="dossier-section dossier-gaps" {...delay()}>
          <h3>Flagged gaps — what the network could not verify</h3>
          <ul>{briefing.flaggedGaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
          <p className="gaps-note">
            Gaps are reported, not hidden. A briefing that admits what it doesn&rsquo;t know
            is a briefing you can act on.
          </p>
        </section>
      )}
    </article>
  );
}
