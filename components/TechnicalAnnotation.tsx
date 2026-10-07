/**
 * A hairline leader from a point on the object to a label. The line is the
 * only drawn thing; the label is small type. `side` decides which way the
 * leader runs out to the text.
 */
export function TechnicalAnnotation({
  index,
  label,
  detail,
  side = 'right',
}: {
  index: string;
  label: string;
  detail?: string;
  side?: 'left' | 'right';
}) {
  return (
    <div className={`annot annot--${side}`}>
      <span className="annot__line" aria-hidden="true" />
      <p className="annot__text">
        <span className="annot__index">{index}</span>
        <span className="annot__label">{label}</span>
        {detail ? <span className="annot__detail">{detail}</span> : null}
      </p>
    </div>
  );
}
