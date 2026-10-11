export function Logo({ className = "text-xl" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold tracking-tight ${className}`}>
      d<span className="text-pink">Streak</span>
      <span className="ml-0.5 inline-block h-1.5 w-1.5 rounded-full bg-orange align-baseline" />
    </span>
  );
}
