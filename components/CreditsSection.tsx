import { CREDITS } from '@/data/credits';
import { SET } from '@/data/site';
import { SpeakField } from './Incantation';

/** Credits, and the wordmark small at the foot. */
export function CreditsSection() {
  return (
    <footer id="credits" className="credits">
      <dl className="credits__list">
        {CREDITS.map((c) => (
          <div key={c.role} className="credits__item">
            <dt>{c.role}</dt>
            <dd>{c.name}</dd>
          </div>
        ))}
      </dl>
      <SpeakField stage={0} />
      <div className="credits__foot">
        <span className="credits__mark">{SET.name}</span>
        <span>{SET.year}</span>
      </div>
    </footer>
  );
}
