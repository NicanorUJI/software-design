import React from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
};

export default function SidePanel({ isOpen, onClose, children }: Props) {
  return (
    <div style={{ ...panelStyle, transform: isOpen ? "translateX(0)" : "translateX(-110%)" }}>
      <div style={{ padding: 12 }}>
        <button onClick={onClose} style={closeBtn}>✕</button>
      </div>
      <div style={{ padding: 16 }}>{children ?? <p>Panel content</p>}</div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  position: "absolute",
  top: 80,
  left: 24,
  bottom: 24,
  width: 420,
  background: "white",
  borderRadius: 20,
  boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  transition: "transform 0.25s ease",
  overflow: "auto",
};
const closeBtn: React.CSSProperties = {
  background: "white",
  border: "none",
  height: 36,
  width: 36,
  borderRadius: "50%",
  cursor: "pointer",
  fontSize: 16,
  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
};
