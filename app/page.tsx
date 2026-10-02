'use client';
import { useState } from 'react';
import type { Finding, Report } from '@/lib/types';

function FindingCard({finding}: {finding: Finding}) {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  async function suggest() {
    setLoading(true);
    try {
      const response = await fetch('/api/suggest', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: finding.id, help: finding.help, html: finding.nodes[0]?.html || ''})});
      const data = await response.json();
      setSuggestion(data.suggestion || data.error);
    } catch { setSuggestion('Unable to reach the suggestion service.'); }
    finally { setLoading(false); }
  }
  return <article className="finding">
    <div className="finding-top"><span className={`badge ${finding.impact}`}>{finding.impact}</span><span className="muted">{finding.nodes.length} affected element{finding.nodes.length !== 1 && 's'}</span></div>
    <h3>{finding.help}</h3><p className="rule">{finding.id} · {finding.tags.filter(t => t.startsWith('wcag')).join(', ') || 'Best practice'}</p>
    <details><summary>Inspect elements and remediation guidance</summary>{finding.nodes.map((node, i) => <div className="node" key={i}>
      <p className="selector">{node.target.join(' → ')}</p><pre><code>{node.html}</code></pre><p>{node.failureSummary}</p>
    </div>)}</details>
    <div className="actions"><a href={finding.helpUrl} target="_blank" rel="noreferrer">Rule documentation ↗</a>
      <button className="secondary" onClick={suggest} disabled={loading}>{loading ? 'Generating…' : 'Suggest a fix with AI'}</button></div>
    {suggestion && <pre className="suggestion" role="status">{suggestion}</pre>}
  </article>;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [severity, setSeverity] = useState('all');
  async function scan(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError(''); setReport(null); setSeverity('all');
    try {
      const response = await fetch('/api/audit', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({url})});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Audit failed.');
      setReport(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to run the audit.'); }
    finally { setLoading(false); }
  }
  function download() {
    const blob = new Blob([JSON.stringify(report, null, 2)], {type: 'application/json'});
    const href = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = href; link.download = 'accessibility-report.json'; link.click(); URL.revokeObjectURL(href);
  }
  const findings = report?.violations.filter(v => severity === 'all' || v.impact === severity) || [];
  return <>
    <a className="skip" href="#main">Skip to main content</a>
    <header><a className="brand" href="/" aria-label="AccessLens home"><span className="logo" aria-hidden="true">◎</span> AccessLens</a><span className="header-note">ACCESSIBILITY AUDITOR</span></header>
    <main id="main">
      <section className="hero"><p className="eyebrow">BETTER WEB, FEWER BARRIERS</p><h1>See what’s standing<br/>in your users’ way.</h1>
        <p className="intro">Inspect a page for accessibility issues. Find affected elements, understand the barriers, and start fixing them.</p>
        <form onSubmit={scan}><label htmlFor="url">Page URL</label><div className="input-row"><input id="url" type="url" required placeholder="https://example.com" value={url} onChange={e => setUrl(e.target.value)} disabled={loading}/><button disabled={loading} type="submit">{loading ? 'Scanning…' : 'Audit page →'}</button></div></form>
        <p className="hint">Public pages · WCAG 2.1 A/AA checks · No account required</p>
        {loading && <p role="status">Opening the page and checking accessibility. This may take up to 45 seconds.</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      {report ? <section aria-label="Audit results" className="results">
        <div className="result-title"><div><p className="eyebrow">AUDIT COMPLETE</p><h2>{report.title || 'Untitled page'}</h2><p className="muted url">{report.url}</p></div><button className="secondary" onClick={download}>Download JSON ↓</button></div>
        <div className="stats"><div><strong>{report.violations.length}</strong><span>Rules with violations</span></div><div><strong>{report.violations.reduce((n,v) => n + v.nodes.length,0)}</strong><span>Affected elements</span></div><div><strong>{report.passes}</strong><span>Rules passed</span></div><div><strong>{report.incomplete}</strong><span>Rules needing review</span></div></div>
        <div className="report-grid"><div><div className="filter"><h2>Findings</h2><label>Severity <select value={severity} onChange={e => setSeverity(e.target.value)}><option value="all">All severities</option>{['critical','serious','moderate','minor','unknown'].map(s => <option key={s}>{s}</option>)}</select></label></div>
          {findings.map(f => <FindingCard key={f.id} finding={f}/>)}
          {!findings.length && <p className="empty">{report.violations.length ? 'No findings match this filter.' : 'No violations detected by these automated checks. Manual review is still needed.'}</p>}
        </div><aside><h2>Page preview</h2><p className="muted">Red outlines mark affected elements in the captured viewport.</p><img className="screenshot" src={report.screenshot} alt={`Annotated screenshot of ${report.title || report.url}`}/><p className="hint">{report.highlightedElements} elements outlined across the page. Frame and shadow DOM findings may have no outline.</p><p className="hint">{report.engine} · {(report.durationMs / 1000).toFixed(1)}s · {new Date(report.scannedAt).toLocaleString()}</p></aside></div>
      </section> : !loading && <section className="features" aria-label="How it works"><article><span>01 / INSPECT</span><h2>Real browser checks</h2><p>Chromium renders the page before axe-core checks for common accessibility barriers.</p></article><article><span>02 / UNDERSTAND</span><h2>Find the exact element</h2><p>Inspect selectors, HTML snippets, and an annotated screenshot beside your findings.</p></article><article><span>03 / IMPROVE</span><h2>A clear path to fixes</h2><p>Read rule guidance or request an optional AI suggestion for the affected markup.</p></article></section>}
      <footer>Automated testing catches a subset of accessibility issues. Review keyboard navigation, screen reader behavior, and content manually. AI suggestions require review.</footer>
    </main>
  </>;
}
