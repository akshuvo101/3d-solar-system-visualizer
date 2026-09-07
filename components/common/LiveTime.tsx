"use client";

import { useEffect, useState } from "react";

export default function LiveTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return (
      <div className="select-none text-center">

        <div className="mt-1 font-mono text-xl font-medium tracking-wider text-white">
          --:--:-- --
        </div>

        <div className="mt-0.5 whitespace-nowrap text-[11px] text-white/50">
          Loading...
        </div>
      </div>
    );
  }

  const time = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const date = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="select-none text-center">

      <div className="mt-1 font-mono text-xl font-medium tracking-wider text-white">
        {time}
      </div>

      <div className="mt-0.5 whitespace-nowrap text-[11px] text-white/50">
        {date}
      </div>
    </div>
  );
}