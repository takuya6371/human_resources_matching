import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function LogoCarousel() {
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    base44.entities.TrustedCompany.filter({ visible: true }, "order", 50)
      .then(setPartners)
      .catch(() => {});
  }, []);

  const names = partners.length ? partners : ["TokyoTech", "OsakaWorks", "KyotoLabs", "NagoyaSoft", "Yokohama Co", "Sapporo Systems", "Fukuoka Digital", "Sendai Robotics"];
  const row = [...names, ...names];

  return (
    <div className="marquee-pause relative overflow-hidden">
      <div className="flex w-max animate-marquee items-center gap-12 pr-12">
        {row.map((p, i) => {
          const name = typeof p === "string" ? p : p.name;
          const logo = typeof p === "string" ? null : p.logo_url;
          return (
            <span key={i} className="flex items-center gap-2 whitespace-nowrap text-muted-foreground/70">
              {logo ? <img src={logo} alt={name} className="h-7 w-7 rounded object-cover" /> : <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />}
              <span className="font-display text-lg font-semibold">{name}</span>
            </span>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-muted/30 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-muted/30 to-transparent" />
    </div>
  );
}