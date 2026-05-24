import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActivityEntry {
  date: string;
  count: number;
}

type PanelColors = Record<number, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateActivityData = (startDate: string, endDate: string): ActivityEntry[] => {
  const data: ActivityEntry[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    data.push({
      date: current.toISOString().split("T")[0],
      count: Math.floor(Math.random() * 50),
    });
    current.setDate(current.getDate() + 1);
  }
  return data;
};

const getPanelColors = (maxCount: number): PanelColors => {
  const colors: PanelColors = {
    0: "rgba(255,255,255,0.04)",
  };
  for (let i = 1; i <= maxCount; i++) {
    const t = i / maxCount;
    const a = 0.15 + t * 0.85;
    colors[i] = `rgba(0,${Math.round(255 * t)},${Math.round(163 * t)},${a})`;
  }
  return colors;
};

// ─── Component ────────────────────────────────────────────────────────────────

const HeatMapProfile: React.FC = () => {
  const [activityData, setActivityData]     = useState<ActivityEntry[]>([]);
  const [panelColors, setPanelColors]       = useState<PanelColors>({});
  const [totalContribs, setTotalContribs]   = useState<number>(0);

  useEffect(() => {
    const data     = generateActivityData("2026-01-01", "2026-12-31");
    const maxCount = Math.max(...data.map((d) => d.count));
    setActivityData(data);
    setPanelColors(getPanelColors(maxCount));
    setTotalContribs(data.reduce((s, d) => s + d.count, 0));
  }, []);

  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }
        .font-dm   { font-family: 'DM Sans', sans-serif; }

        /* ── Force uiw SVG to stretch to full container width ── */
        .heatmap-themed > div,
        .heatmap-themed > div > div {
          width: 100% !important;
        }
        .heatmap-themed svg {
          width: 100% !important;
          height: auto !important;
          display: block;
        }

        /* ── Theme internal text ── */
        .heatmap-themed text {
          fill: rgba(255,255,255,0.22) !important;
          font-family: 'IBM Plex Mono', monospace !important;
          font-size: 9px !important;
          letter-spacing: 0.03em;
        }
      `}</style>

      {/* ── Stat row ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="block w-1 h-3 rounded-full bg-[#00FFA3]/60" />
          <span className="font-plex text-[10px] uppercase tracking-widest text-gray-600">
            2026 contributions
          </span>
        </div>
        <span className="font-syne text-sm font-bold text-white">
          {totalContribs.toLocaleString()}
          <span className="font-plex text-[10px] text-gray-600 font-normal ml-1.5">total</span>
        </span>
      </div>

      {/* ── Heatmap — full width stretch ── */}
      <div className="heatmap-themed w-[full] flex justify-center mx-auto items-center lg:ml-10 lg:mr-10">
        <HeatMap
          value={activityData}
          startDate={new Date("2026-01-01")}
          endDate={new Date("2026-12-31")}
          weekLabels={["", "Mon", "", "Wed", "", "Fri", ""]}
          monthLabels={["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}
          rectSize={13}
          space={3}
          rectProps={{ rx: 2 }}
          panelColors={panelColors}
          style={{
            width: "100%",
            color: "rgba(255,255,255,0.22)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            marginLeft:"auto"
          }}
        />
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="font-plex text-[9px] text-gray-700">Less</span>
        {[0.04, 0.2, 0.4, 0.65, 1].map((opacity, i) => (
          <span
            key={i}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: `rgba(0,255,163,${opacity})` }}
          />
        ))}
        <span className="font-plex text-[9px] text-gray-700">More</span>
      </div>
    </>
  );
};

export default HeatMapProfile;