"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { ESTAGIOS_CONFIG, Lead, KANBAN_COLUNAS } from "@/lib/types";
import { LeadCard } from "./LeadCard";
import { LeadSlideOver } from "./LeadSlideOver";

export function KanbanBoard({ leads, onLeadsChange }: { leads: Lead[], onLeadsChange: (l: Lead[], updatedLead?: Lead) => void }) {
  const [mounted, setMounted] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLeadUpdate = (updatedLead: Lead) => {
    const newLeads = leads.map((l) => (l.id === updatedLead.id ? updatedLead : l));
    onLeadsChange(newLeads, updatedLead);
    setSelectedLead(updatedLead);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newLeads = Array.from(leads);
    const draggedIndex = newLeads.findIndex((l) => l.id === draggableId);
    if (draggedIndex === -1) return;

    const newEstagio = destination.droppableId as any;
    const draggedLead = { ...newLeads[draggedIndex], estagio: newEstagio };
    newLeads[draggedIndex] = draggedLead;

    onLeadsChange(newLeads, draggedLead);
  };

  if (!mounted) return <div className="animate-pulse flex h-full gap-4 opacity-50"><div className="w-[300px] bg-muted/50 rounded-lg"></div></div>;

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex h-full gap-4 overflow-x-auto pb-4 items-stretch px-1">
          {KANBAN_COLUNAS.map((colunaId) => {
            const colunaInfo = ESTAGIOS_CONFIG[colunaId];
            const items = leads.filter((l) => l.estagio === colunaId);

            return (
              <div key={colunaId} className="flex flex-col min-w-[320px] w-[320px] bg-secondary/50 border border-border/40 rounded-xl p-3 select-none">
                <div className="flex justify-between items-center mb-3 px-2 pt-1 pb-3 border-b border-border/50">
                  <h3 className="font-semibold text-xs tracking-wider uppercase text-muted-foreground mr-2 truncate" title={colunaInfo.label}>{colunaInfo.label}</h3>
                  <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-bold">{items.length}</span>
                </div>
                
                <Droppable droppableId={colunaId}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto overflow-x-hidden space-y-2.5 min-h-[150px] transition-all rounded-lg p-1 ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-primary/20 ring-dashed' : ''}`}
                    >
                      {items.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedLead(lead)}
                              style={{
                                ...provided.draggableProps.style,
                                opacity: snapshot.isDragging ? 0.9 : 1,
                                transform: provided.draggableProps.style?.transform,
                              }}
                            >
                              <LeadCard lead={lead} isDragging={snapshot.isDragging} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      <LeadSlideOver 
        lead={selectedLead} 
        open={!!selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdateLead={handleLeadUpdate}
      />
    </>
  );
}
