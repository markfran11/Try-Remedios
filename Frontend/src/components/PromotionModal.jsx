import { useEffect, useRef, useState } from "react";

// Popups that are open right now. Only the one on top reacts to Esc and Tab.
const openPopups = [];

// Shared popup: dark background, Esc to close, Tab stays inside, focus returns to the button that opened it
const PromotionModal = ({ onClose, small = false, closeOnOverlay = true, role = "dialog", labelledBy, describedBy, children }) => {
  const boxRef = useRef(null);
  const closeRef = useRef(onClose);
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const token = {};
    openPopups.push(token);
    const box = boxRef.current;

    const focusables = () =>
      [...box.querySelectorAll("button, input, select")].filter(
        (el) => !el.disabled && !el.closest("[hidden]"),
      );

    // if nothing inside the popup asked for focus (autoFocus), focus the first control
    if (!box.contains(document.activeElement) && focusables().length) focusables()[0].focus();

    const onKeyDown = (e) => {
      if (openPopups[openPopups.length - 1] !== token) return;
      if (e.key === "Escape") {
        closeRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const f = focusables();
      const first = f[0];
      const last = f[f.length - 1];
      if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      openPopups.splice(openPopups.indexOf(token), 1);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [opener]);

  return (
    <div className="overlay" onClick={(e) => { if (closeOnOverlay && e.target === e.currentTarget) onClose(); }}>
      <div
        ref={boxRef}
        className={small ? "modal sm" : "modal"}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      >
        {children}
      </div>
    </div>
  );
};

export default PromotionModal;
