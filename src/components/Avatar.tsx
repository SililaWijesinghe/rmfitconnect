export function Avatar({
  url,
  name,
  size = 40,
  className = "",
}: {
  url?: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const style = { width: size, height: size } as const;
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={style}
        className={`rounded-full object-cover ring-1 ring-white/20 ${className}`}
      />
    );
  }
  return (
    <div
      style={style}
      className={`btn-neon flex items-center justify-center rounded-full font-display font-bold ${className}`}
    >
      {initial}
    </div>
  );
}
