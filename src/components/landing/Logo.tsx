export function Logo({ size = 24 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="grid place-items-center rounded-lg bg-gradient-to-br from-[#8270ff] to-[#c06bff] shadow-glow" style={{ width: size, height: size }}>
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 32 32" fill="none"><path d="M21 11a7 7 0 1 0 0 10" stroke="#fff" strokeWidth="3" strokeLinecap="round" /><circle cx="21.5" cy="16" r="2.4" fill="#fff" /></svg>
      </span>
      <span className="text-[15px] font-semibold tracking-tight">CogniSpace</span>
    </span>
  );
}
