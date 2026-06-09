import React, { useEffect, useState } from "react";
import HeatMap from "@uiw/react-heat-map";
import api from "../../config/api";



interface ActivityEntry {
  date: string;
  count: number;
}

type PanelColors = Record<number, string>;



const getPanelColors = (maxCount: number): PanelColors => {
  const colors: PanelColors = { 0: "rgba(255,255,255,0.04)" };

  
  
  const scale = Math.max(maxCount, 10);

  for (let i = 1; i <= scale; i++) {
    const t = i / scale;
    const a = 0.15 + t * 0.85;
    colors[i] = `rgba(0,${Math.round(255 * t)},${Math.round(163 * t)},${a})`;
  }
  return colors;
};




const HeatMapProfile: React.FC = () => {
  const [activityData, setActivityData]   = useState<ActivityEntry[]>([]);
  const [panelColors, setPanelColors]     = useState<PanelColors>({ 0: "rgba(255,255,255,0.04)" });
  const [totalContribs, setTotalContribs] = useState<number>(0);
  const [year, setYear]                   = useState<number>(new Date().getFullYear());
  const [loading, setLoading]             = useState<boolean>(true);

  useEffect(() => {
    const fetchContributions = async (): Promise<void> => {
      const userId = localStorage.getItem("userId");
      if (!userId) { setLoading(false); return; }

      try {
        const res = await api.get(`/contributions/${userId}`);
        const data: ActivityEntry[] = res.data.contributions || [];
        const fetchedYear: number   = res.data.year ?? new Date().getFullYear();

        const maxCount = data.length > 0
          ? Math.max(...data.map((d) => d.count))
          : 1;

        setActivityData(data);
        setPanelColors(getPanelColors(maxCount));
        setTotalContribs(data.reduce((s, d) => s + d.count, 0));
        setYear(fetchedYear);
      } catch (err) {
        console.error("Failed to fetch contributions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-white/[0.04] animate-pulse mb-4" />
        <div className="h-[120px] rounded-xl bg-white/[0.04] animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        .font-plex { font-family: 'IBM Plex Mono', monospace; }
        .font-syne { font-family: 'Syne', sans-serif; }

        .heatmap-themed > div,
        .heatmap-themed > div > div { width: 100% !important; }
        .heatmap-themed svg {
          width: 100% !important;
          height: auto !important;
          display: block;
        }
        .heatmap-themed text {
          fill: rgba(255,255,255,0.22) !important;
          font-family: 'IBM Plex Mono', monospace !important;
          font-size: 9px !important;
          letter-spacing: 0.03em;
        }
      `}</style>

      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="block w-1 h-3 rounded-full bg-[#00FFA3]/60" />
          <span className="font-plex text-[10px] uppercase tracking-widest text-gray-600">
            {year} contributions
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-syne text-sm font-bold text-white">
            {totalContribs.toLocaleString()}
            <span className="font-plex text-[10px] text-gray-600 font-normal ml-1.5">
              total
            </span>
          </span>
          {totalContribs === 0 && (
            <span className="font-plex text-[10px] text-gray-700 border border-white/[0.05]
                             px-2 py-0.5 rounded">
              no activity yet
            </span>
          )}
        </div>
      </div>

      
      <div className="heatmap-themed w-full">
        <HeatMap
          value={activityData}
          startDate={new Date(`${year}-01-01`)}
          endDate={new Date(`${year}-12-31`)}

          
          
          
          
          weekLabels={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}

          monthLabels={["Jan","Feb","Mar","Apr","May","Jun",
                        "Jul","Aug","Sep","Oct","Nov","Dec"]}
          rectSize={15}
          space={3}
          rectProps={{ rx: 2 }}
          panelColors={panelColors}
          style={{
            width: "100%",
            color: "rgba(255,255,255,0.22)",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
          }}
        />
      </div>

      
       <div className="flex items-center justify-end gap-2 mt-3">
        <span className="font-plex text-[9px] text-gray-700">Less</span>
        {[0.04, 0.2, 0.4, 0.65, 1].map((opacity, i) => (
          <span key={i} className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: `rgba(0,255,163,${opacity})` }} />
        ))}
        <span className="font-plex text-[9px] text-gray-700">More</span>
      </div>
    </>
  );
};

export default HeatMapProfile;
