import React from "react";

export default function HamburgerMenu({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={btnStyle} aria-label="menu">
      ☰
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  height: 44,
  width: 44,
  borderRadius: "50%",
  border: "none",
  boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
  background: "white",
  cursor: "pointer",
  fontSize: 20,
};
