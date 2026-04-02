"use client";

import { CalendarDays } from "lucide-react";

interface DateFilterProps {
  startDate: string;
  endDate: string;
  onChangeStart: (date: string) => void;
  onChangeEnd: (date: string) => void;
}

export function DateFilter({ startDate, endDate, onChangeStart, onChangeEnd }: DateFilterProps) {
  return (
    <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg shadow-sm">
      <CalendarDays className="w-4 h-4 text-muted-foreground mr-1" />
      <input 
        type="date" 
        className="bg-transparent text-sm focus:outline-none text-foreground w-[115px] cursor-text" 
        value={startDate}
        onChange={(e) => onChangeStart(e.target.value)}
        style={{ colorScheme: "dark" }}
      />
      <span className="text-muted-foreground text-xs font-semibold">até</span>
      <input 
        type="date" 
        className="bg-transparent text-sm focus:outline-none text-foreground w-[115px] cursor-text" 
        value={endDate}
        onChange={(e) => onChangeEnd(e.target.value)}
        style={{ colorScheme: "dark" }}
      />
    </div>
  );
}
