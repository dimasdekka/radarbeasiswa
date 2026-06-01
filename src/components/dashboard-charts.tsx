"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar,
  Tooltip,
  PolarAngleAxis,
} from "recharts";

export interface DashboardCharts {
  byCountry: { negara: string; count: number }[];
  byJenjang: { jenjang: string; count: number }[];
  funding: { name: string; value: number }[];
}

const AURORA = ["#8b5cf6", "#22d3ee", "#fbbf24", "#f0abfc", "#86efac", "#fca5a5"];

function Panel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/60 p-5 backdrop-blur-sm">
      <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">{eyebrow}</p>
      <h3 className="mb-3 mt-1 font-display text-lg font-bold tracking-tight text-foreground">{title}</h3>
      <div className="h-52">{children}</div>
    </div>
  );
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{label ?? payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} beasiswa</p>
    </div>
  );
}

export function DashboardCharts({ data }: { data: DashboardCharts }) {
  const totalJenjang = data.byJenjang.reduce((s, d) => s + d.count, 0) || 1;
  const jenjangRadial = data.byJenjang.map((d, i) => ({
    name: d.jenjang,
    value: Math.round((d.count / totalJenjang) * 100),
    count: d.count,
    fill: AURORA[i % AURORA.length],
  }));

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* By country — horizontal bars */}
      <Panel eyebrow="Sebaran" title="Beasiswa per Negara">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.byCountry} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="negara"
              width={88}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<TooltipBox />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
              {data.byCountry.map((_, i) => (
                <Cell key={i} fill={AURORA[i % AURORA.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Panel>

      {/* By jenjang — radial */}
      <Panel eyebrow="Jenjang" title="Cakupan Jenjang Studi">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="30%" outerRadius="100%" data={jenjangRadial} startAngle={90} endAngle={-270}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={8} />
            <Tooltip content={<TooltipBox />} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4">
          {jenjangRadial.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
              <span className="font-semibold text-foreground">{d.name}</span>
              <span className="text-muted-foreground">{d.count}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Funding — donut */}
      <Panel eyebrow="Pendanaan" title="Cakupan Biaya">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.funding}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="none"
            >
              <Cell fill="#8b5cf6" />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
            <Tooltip content={<TooltipBox />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-2 flex justify-center gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="font-semibold text-foreground">Full Funded</span>
            <span className="text-muted-foreground">{data.funding[0]?.value ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            <span className="font-semibold text-foreground">Parsial</span>
            <span className="text-muted-foreground">{data.funding[1]?.value ?? 0}</span>
          </div>
        </div>
      </Panel>
    </div>
  );
}
