"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export interface EvolutionData {
  date: string;
  leads: number;
  investido: number;
}

export function EvolutionChart({ data }: { data: EvolutionData[] }) {
  if (!data || data.length === 0) return (
    <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground animate-pulse">
      Buscando dados históricos...
    </div>
  );
  
  return (
    <div className="h-[300px] w-full pt-4 pr-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} vertical={false} />
          <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis yAxisId="left" stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: number) => `${val}`} />
          <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: number) => `R$${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgba(10,10,10,0.9)", borderColor: "#2f3346", borderRadius: "8px" }}
            itemStyle={{ color: "#fff" }}
          />
          <Legend verticalAlign="top" height={36} iconType="circle" />
          <Line yAxisId="left" type="monotone" name="Leads Gerados" dataKey="leads" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          <Line yAxisId="right" type="monotone" name="Investimento (Meta)" dataKey="investido" stroke="#ec4899" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
