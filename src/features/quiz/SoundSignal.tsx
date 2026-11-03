export function Signal() {
  return (
    <div className="signal" aria-hidden="true">
      {[
        9, 13, 19, 12, 26, 36, 22, 47, 32, 61, 44, 72, 49, 64, 77, 51, 63, 39, 54, 32, 47, 27, 37,
        18, 29, 16, 21, 11, 15, 8, 11,
      ].map((height, i) => (
        <i key={i} style={{ height }} />
      ))}
    </div>
  );
}
