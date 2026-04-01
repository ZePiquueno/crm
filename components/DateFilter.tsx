"use client";

import { CalendarDays } from "lucide-react";

export function DateFilter() {
  return (
    <div className="flex items-center gap-2 bg-card border px-3 py-1.5 rounded-lg shadow-sm">
      <CalendarDays className="w-4 h-4 text-muted-foreground mr-1" />
      <input 
        type="date" 
        className="bg-transparent text-sm focus:outline-none text-foreground w-[115px] cursor-text" 
        defaultValue={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
        style={{ colorScheme: "dark" }}
      />
      <span className="text-muted-foreground text-xs font-semibold">até</span>
      <input 
        type="date" 
        className="bg-transparent text-sm focus:outline-none text-foreground w-[115px] cursor-text" 
        defaultValue={new Date().toISOString().split('T')[0]}
        style={{ colorScheme: "dark" }}
      />
    </div>
  );
}
