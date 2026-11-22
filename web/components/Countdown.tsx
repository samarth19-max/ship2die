"use client";

import { useEffect, useState } from "react";

/** Countdown to Cyber Monday end (Nov 30, 23:59 US Eastern = Dec 1 04:59 UTC) —
    a fixed absolute instant, so every visitor sees the same remaining time. */
const END = new Date("2026-12-01T04:59:00Z");
const BF = new Date("2026-11-27T00:00:00Z");

function pad(n: number) { return n < 10 ? "0" + n : "" + n; }

export function FinalCountdown() {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = END.getTime() - Date.now();
      if (diff <= 0) { setT({ d: 0, h: 0, m: 0, s: 0 }); return; }
      const s = Math.floor(diff / 1000);
      setT({ d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 });
      setTimeout(tick, 1000);
    };
    tick();
  }, []);
  return (
    <div className="count" aria-hidden="true">
      {[["f-d", t.d, "days"], ["f-h", t.h, "hrs"], ["f-m", t.m, "min"], ["f-s", t.s, "sec"]].map(([id, v, l]) => (
        <div className="cd" key={id as string}><b>{pad(v as number)}</b><span>{l as string}</span></div>
      ))}
    </div>
  );
}

export function BfDays() {
  const [txt, setTxt] = useState("…");
  useEffect(() => {
    const d = Math.ceil((BF.getTime() - Date.now()) / 86400000);
    setTxt(d > 0 ? "in " + d + " day" + (d === 1 ? "" : "s") : "TODAY");
    const rib = document.getElementById("ribTxt");
    if (rib) rib.textContent = d > 0
      ? "BLACK FRIDAY IS IN " + d + " DAYS · ONE OFFER IN, ONE PUBLISH PACK OUT"
      : "BLACK FRIDAY IS HERE · ONE OFFER IN, ONE PUBLISH PACK OUT";
  }, []);
  return <b>{txt}</b>;
}
