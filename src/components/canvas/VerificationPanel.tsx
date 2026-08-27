import { useState } from 'react';
import {
  FormDecision,
  VerificationReport,
} from '../../hooks/useDiagramGeneration';

interface VerificationPanelProps {
  report?: VerificationReport | null;
  decision?: FormDecision | null;
  scopeOfValidity?: string | null;
  refused?: boolean;
}

/**
 * Verified-mode provenance surface: the form decision (with rationale and
 * license) and the deterministic verification report. Every verified figure
 * ships with this — it is the product's proof that nothing was fabricated
 * and no claim was coerced into a non-fitting canonical form.
 */
export function VerificationPanel({
  report,
  decision,
  scopeOfValidity,
  refused,
}: VerificationPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (!report && !decision) return null;

  const passed = report?.checks.filter((c) => c.passed).length ?? 0;
  const total = report?.checks.length ?? 0;
  const verdict = refused ? 'REFUSED' : report?.verdict ?? '—';
  const verdictColor =
    verdict === 'PASS' ? '#16a34a' : verdict === 'REFUSED' ? '#d97706' : '#dc2626';

  return (
    <div
      style={{
        borderTop: '1px solid var(--border, #e5e7eb)',
        padding: '10px 16px',
        fontSize: 12,
        background: 'var(--bg-secondary, #f8fafc)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          color: 'var(--text, #1f2937)',
        }}
      >
        <span style={{ fontWeight: 700, color: verdictColor }}>
          {verdict === 'PASS' ? '✓' : verdict === 'REFUSED' ? '◇' : '✗'} Verification: {verdict}
        </span>
        {report && (
          <span style={{ color: 'var(--text-secondary, #6b7280)' }}>
            {passed}/{total} checks
          </span>
        )}
        {decision && (
          <span style={{ color: 'var(--text-secondary, #6b7280)' }}>
            · {decision.match_result}
            {decision.construction_rule ? ` · ${decision.construction_rule}` : ''}
            {decision.families?.length ? ` · ${decision.families.join(' × ')}` : ''}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: 'var(--text-secondary, #6b7280)' }}>
          {expanded ? '▾' : '▸'}
        </span>
      </button>

      {expanded && (
        <div style={{ marginTop: 8, lineHeight: 1.5 }}>
          {decision?.rationale && (
            <p style={{ margin: '4px 0', color: 'var(--text-secondary, #6b7280)' }}>
              <b>Form decision:</b> {decision.rationale}
            </p>
          )}
          {decision?.unsupported_route && (
            <p style={{ margin: '4px 0', color: '#92400e' }}>
              <b>Gated — needs {decision.unsupported_route.needed_rule}:</b>{' '}
              {decision.unsupported_route.explanation}
            </p>
          )}
          {report && (
            <ul style={{ listStyle: 'none', margin: '6px 0 0', padding: 0 }}>
              {report.checks.map((c) => (
                <li
                  key={c.id}
                  style={{
                    padding: '3px 0',
                    borderBottom: '1px solid var(--border, #eef2f7)',
                  }}
                >
                  <b style={{ color: c.passed ? '#16a34a' : '#dc2626' }}>
                    {c.passed ? '✓' : '✗'} {c.name}
                  </b>{' '}
                  <span style={{ color: 'var(--text-secondary, #6b7280)' }}>
                    — {c.detail}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {scopeOfValidity && (
            <p style={{ margin: '8px 0 0', color: 'var(--text-secondary, #9ca3af)', fontSize: 11 }}>
              <b>Scope of validity:</b> {scopeOfValidity}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
