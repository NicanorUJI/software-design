export default function HamburgerMenu({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="menu"
      className="h-11 w-11 rounded-full bg-white/95 backdrop-blur shadow-xl border border-black/5
                 flex items-center justify-center hover:bg-white transition"
    >
      <span className="text-xl leading-none">≡</span>
    </button>
  );
}
