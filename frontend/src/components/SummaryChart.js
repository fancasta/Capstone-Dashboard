import { indicators } from "./disclosures";
import "./disclosures.css";

export default function SummaryChart({ group }) {
  return (
    <>
      <p>Reports with each disclosure · {group.total} {group.total === 1 ? "report" : "reports"} in this selection</p>
      <ul className="disclosure-bars">
        {indicators.map(([field, label]) => (
          <li key={field}>
            <span>{label}</span>
            <span className="disclosure-track" aria-hidden="true">
              <span style={{ width: `${100 * group.counts[field] / group.total}%` }} />
            </span>
            <strong>{group.counts[field]}</strong>
          </li>
        ))}
      </ul>
    </>
  );
}
