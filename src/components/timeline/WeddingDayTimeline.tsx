/**
 * WeddingDayTimeline
 *
 * A stunning, interactive "Programme de la journée" (Wedding Day Schedule)
 * with a beautiful vertical timeline, drag-and-drop reordering,
 * inline editing, auto-calculated timestamps, and romantic styling.
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  GripVertical,
  Heart,
  Sun,
  Coffee,
  Scissors,
  Shirt,
  Utensils,
  Camera,
  Users,
  Car,
  Church,
  Diamond,
  Wine,
  Music,
  Cake,
  Sparkles,
  PartyPopper,
  Star,
  Clock,
  RotateCcw,
  Pencil,
  Check,
  X,
  Plus,
  Trash2,
  Moon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface TimelineEvent {
  id: string;
  title: string;
  durationMinutes: number;
  icon: string;
}

interface TimelineEventWithTime extends TimelineEvent {
  startTime: string; // HH:MM format
  endTime: string;
}

// ============================================================================
// Icon Map
// ============================================================================

const ICON_MAP: Record<string, { component: React.ElementType; color: string; bg: string }> = {
  heart: { component: Heart, color: 'text-rose-500', bg: 'bg-rose-50' },
  sun: { component: Sun, color: 'text-amber-500', bg: 'bg-amber-50' },
  coffee: { component: Coffee, color: 'text-orange-600', bg: 'bg-orange-50' },
  scissors: { component: Scissors, color: 'text-pink-500', bg: 'bg-pink-50' },
  shirt: { component: Shirt, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  utensils: { component: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  camera: { component: Camera, color: 'text-sky-500', bg: 'bg-sky-50' },
  users: { component: Users, color: 'text-violet-500', bg: 'bg-violet-50' },
  car: { component: Car, color: 'text-slate-500', bg: 'bg-slate-50' },
  church: { component: Church, color: 'text-purple-600', bg: 'bg-purple-50' },
  diamond: { component: Diamond, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  wine: { component: Wine, color: 'text-amber-600', bg: 'bg-amber-50' },
  music: { component: Music, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50' },
  cake: { component: Cake, color: 'text-pink-500', bg: 'bg-pink-50' },
  sparkles: { component: Sparkles, color: 'text-violet-500', bg: 'bg-violet-50' },
  partyPopper: { component: PartyPopper, color: 'text-rose-500', bg: 'bg-rose-50' },
  star: { component: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
  moon: { component: Moon, color: 'text-indigo-400', bg: 'bg-indigo-50' },
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

// ============================================================================
// Default Schedule
// ============================================================================

const DEFAULT_EVENTS: TimelineEvent[] = [
  { id: '1', title: 'Le grand jour', durationMinutes: 40, icon: 'heart' },
  { id: '2', title: 'Réveil et Douche', durationMinutes: 30, icon: 'sun' },
  { id: '3', title: 'Petit déjeuner', durationMinutes: 120, icon: 'coffee' },
  { id: '4', title: 'Coiffure et maquillage', durationMinutes: 30, icon: 'scissors' },
  { id: '5', title: 'Tout le monde s\'habille', durationMinutes: 20, icon: 'shirt' },
  { id: '6', title: 'Déjeuner ou collation', durationMinutes: 15, icon: 'utensils' },
  { id: '7', title: 'Arrivée du photographe', durationMinutes: 15, icon: 'camera' },
  { id: '8', title: 'Séance photo', durationMinutes: 60, icon: 'camera' },
  { id: '9', title: 'Photos de famille', durationMinutes: 15, icon: 'users' },
  { id: '10', title: 'Photos avec les invités', durationMinutes: 15, icon: 'users' },
  { id: '11', title: 'Arrivée de la limousine', durationMinutes: 20, icon: 'car' },
  { id: '12', title: 'Arrivée à la cérémonie', durationMinutes: 30, icon: 'church' },
  { id: '13', title: 'Dites Oui !', durationMinutes: 15, icon: 'diamond' },
  { id: '14', title: 'Cocktails et photos', durationMinutes: 20, icon: 'wine' },
  { id: '15', title: 'Tous se rendent à la réception', durationMinutes: 40, icon: 'car' },
  { id: '16', title: 'Grande entrée', durationMinutes: 20, icon: 'sparkles' },
  { id: '17', title: 'Première danse', durationMinutes: 15, icon: 'music' },
  { id: '18', title: 'Dîner', durationMinutes: 40, icon: 'utensils' },
  { id: '19', title: 'Toasts & Prières', durationMinutes: 40, icon: 'wine' },
  { id: '20', title: 'C\'est l\'heure de la fête !', durationMinutes: 100, icon: 'partyPopper' },
  { id: '21', title: 'Gâteau coupé', durationMinutes: 60, icon: 'cake' },
  { id: '22', title: 'Feu d\'artifice et envoi', durationMinutes: 30, icon: 'sparkles' },
  { id: '23', title: 'Grande sortie', durationMinutes: 30, icon: 'star' },
];

// ============================================================================
// Helpers
// ============================================================================

let nextId = 100;
function generateId(): string {
  return String(nextId++);
}

function minutesToTime(totalMinutes: number, use24h: boolean): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');

  if (use24h) {
    return `${h}:${m}`;
  }
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${m} ${period}`;
}

function calculateEventTimes(
  events: TimelineEvent[],
  startHour: number,
  use24h: boolean
): TimelineEventWithTime[] {
  let cumulativeMinutes = startHour * 60;

  return events.map((event) => {
    const startTime = minutesToTime(cumulativeMinutes, use24h);
    cumulativeMinutes += event.durationMinutes;
    const endTime = minutesToTime(cumulativeMinutes, use24h);
    return { ...event, startTime, endTime };
  });
}

// ============================================================================
// Main Component
// ============================================================================

interface WeddingDayTimelineProps {
  clientId?: string;
  weddingDate?: string;
  onSave?: (events: TimelineEvent[], startHour: number) => void;
}

const WeddingDayTimeline: React.FC<WeddingDayTimelineProps> = ({
  clientId,
  weddingDate: initialWeddingDate,
  onSave,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>(DEFAULT_EVENTS);
  const [startHour, setStartHour] = useState(6); // 6:00 AM
  const [use24h, setUse24h] = useState(true);
  const [weddingDate, setWeddingDate] = useState(initialWeddingDate || '');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'title' | 'duration' | 'icon' | null>(null);
  const [editValue, setEditValue] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const eventsWithTimes = useMemo(
    () => calculateEventTimes(events, startHour, use24h),
    [events, startHour, use24h]
  );

  const totalDuration = useMemo(
    () => events.reduce((sum, e) => sum + e.durationMinutes, 0),
    [events]
  );

  const endHour = useMemo(() => {
    const total = startHour * 60 + totalDuration;
    const hours = Math.floor(total / 60) % 24;
    const minutes = total % 60;
    return minutesToTime(startHour * 60 + totalDuration, use24h);
  }, [startHour, totalDuration, use24h]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = events.findIndex((e) => e.id === active.id);
    const newIndex = events.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    setEvents(arrayMove(events, oldIndex, newIndex));
  };

  // Editing handlers
  const startEdit = (id: string, field: 'title' | 'duration' | 'icon', value: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingId || !editingField) return;

    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== editingId) return e;
        if (editingField === 'title') return { ...e, title: editValue || e.title };
        if (editingField === 'duration') return { ...e, durationMinutes: Math.max(5, parseInt(editValue) || e.durationMinutes) };
        if (editingField === 'icon') return { ...e, icon: editValue };
        return e;
      })
    );
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingField(null);
    setEditValue('');
  };

  const handleReset = () => {
    setEvents(DEFAULT_EVENTS);
    setStartHour(6);
  };

  const addEvent = () => {
    const newEvent: TimelineEvent = {
      id: generateId(),
      title: 'Nouvel événement',
      durationMinutes: 30,
      icon: 'star',
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-pink-100 mb-4">
          <Heart className="h-8 w-8 text-rose-500" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-gray-800 mb-2">
          Programme de la journée
        </h2>
        <p className="text-sm text-gray-500 max-w-lg mx-auto leading-relaxed">
          Créez et imprimez le planning de votre grand jour. Du réveil jusqu'au « oui »,
          préparez un itinéraire complet qui vous accompagne pas à pas.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-rose-100 shadow-sm">
        <div className="flex items-center gap-3">
          <Label htmlFor="wedding-date" className="text-sm font-medium text-gray-600 whitespace-nowrap">
            📅 Date du mariage
          </Label>
          <Input
            id="wedding-date"
            type="date"
            value={weddingDate}
            onChange={(e) => setWeddingDate(e.target.value)}
            className="w-[160px] h-9 text-sm border-rose-200 focus:border-rose-400 focus:ring-rose-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <Label htmlFor="24h-toggle" className="text-sm font-medium text-gray-600">
          🕐 24h
          </Label>
          <Switch
            id="24h-toggle"
            checked={use24h}
            onCheckedChange={setUse24h}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Réinitialiser tout le programme
        </Button>
      </div>

      {/* Start Time Control */}
      <div className="flex items-center gap-4 mb-6 px-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-rose-400" />
          <span className="text-sm font-medium text-gray-600">Début :</span>
          <Input
            type="time"
            value={`${String(startHour).padStart(2, '0')}:00`}
            onChange={(e) => {
              const [h] = e.target.value.split(':');
              setStartHour(parseInt(h) || 6);
            }}
            className="w-[120px] h-8 text-sm border-rose-200 focus:border-rose-400 focus:ring-rose-400"
          />
        </div>
        <div className="text-xs text-gray-400">
          Fin estimée : <span className="font-medium text-gray-600">{endHour}</span>
          {' '}({Math.floor(totalDuration / 60)}h{totalDuration % 60 > 0 ? `${totalDuration % 60}min` : ''})
        </div>
      </div>

      {/* Timeline */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <SortableContext items={events.map((e) => e.id)} strategy={verticalListSortingStrategy}>
          <div className="relative">
            {/* Central timeline line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-rose-300 via-pink-300 to-violet-300 opacity-40" />

            {eventsWithTimes.map((event, index) => (
              <SortableTimelineItem
                key={event.id}
                event={event}
                index={index}
                isEditing={editingId === event.id}
                editingField={editingField}
                editValue={editValue}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onEditValueChange={setEditValue}
                onDelete={deleteEvent}
                isLast={index === eventsWithTimes.length - 1}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-rose-200 p-3 opacity-90 rotate-1">
              {events.find((e) => e.id === activeId)?.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Add Event Button */}
      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          onClick={addEvent}
          className="gap-2 border-dashed border-2 border-rose-300 text-rose-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-400"
        >
          <Plus className="h-4 w-4" />
          Ajouter un événement
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// Sortable Timeline Item
// ============================================================================

interface SortableTimelineItemProps {
  event: TimelineEventWithTime;
  index: number;
  isEditing: boolean;
  editingField: 'title' | 'duration' | 'icon' | null;
  editValue: string;
  onStartEdit: (id: string, field: 'title' | 'duration' | 'icon', value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onEditValueChange: (value: string) => void;
  onDelete: (id: string) => void;
  isLast: boolean;
}

const SortableTimelineItem: React.FC<SortableTimelineItemProps> = ({
  event,
  index,
  isEditing,
  editingField,
  editValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onDelete,
  isLast,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: event.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const iconConfig = ICON_MAP[event.icon] || ICON_MAP.star;
  const IconComponent = iconConfig.component;

  const hours = Math.floor(event.durationMinutes / 60);
  const mins = event.durationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h${mins > 0 ? `${mins}min` : ''}` : `${mins}min`;

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      {/* Timeline Node */}
      <div
        className={`absolute left-[15px] top-[18px] z-10 w-[18px] h-[18px] rounded-full border-[3px] border-white shadow-md transition-all duration-300 ${iconConfig.bg} ${iconConfig.color} flex items-center justify-center`}
      >
        <div className="w-2 h-2 rounded-full bg-current opacity-60" />
      </div>

      {/* Event Card */}
      <div className="ml-12 mb-3">
        <div
          className={`relative bg-white rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
            isDragging ? 'shadow-lg ring-2 ring-rose-300' : 'border-gray-100 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3 p-3">
            {/* Drag Handle */}
            <button
              className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            {/* Icon */}
            {isEditing && editingField === 'icon' ? (
              <div className="flex flex-wrap gap-1 p-1 bg-gray-50 rounded-lg max-w-[200px]">
                {ICON_OPTIONS.map((iconKey) => {
                  const cfg = ICON_MAP[iconKey];
                  const Ic = cfg.component;
                  return (
                    <button
                      key={iconKey}
                      onClick={() => {
                        onEditValueChange(iconKey);
                        // Auto-save on icon selection
                        setTimeout(onSaveEdit, 0);
                      }}
                      className={`p-1.5 rounded-md transition-all ${
                        editValue === iconKey
                          ? `${cfg.bg} ${cfg.color} ring-2 ring-current`
                          : 'hover:bg-gray-100 text-gray-400'
                      }`}
                    >
                      <Ic className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onStartEdit(event.id, 'icon', event.icon)}
                      className={`flex-shrink-0 w-10 h-10 rounded-xl ${iconConfig.bg} ${iconConfig.color} flex items-center justify-center transition-transform hover:scale-110`}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Changer l'icône</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Time */}
            <div className="flex-shrink-0 text-right min-w-[60px]">
              <span className="text-sm font-semibold text-rose-500">{event.startTime}</span>
              <div className="text-[10px] text-gray-400">→ {event.endTime}</div>
            </div>

            {/* Title */}
            <div className="flex-1 min-w-0">
              {isEditing && editingField === 'title' ? (
                <Input
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  onBlur={onSaveEdit}
                  className="h-7 text-sm font-medium"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => onStartEdit(event.id, 'title', event.title)}
                  className="text-sm font-medium text-gray-800 hover:text-rose-600 transition-colors text-left w-full truncate group-hover:underline decoration-rose-300 underline-offset-2"
                >
                  {event.title}
                </button>
              )}
            </div>

            {/* Duration */}
            {isEditing && editingField === 'duration' ? (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onSaveEdit();
                    if (e.key === 'Escape') onCancelEdit();
                  }}
                  onBlur={onSaveEdit}
                  className="w-[70px] h-7 text-sm text-center"
                  min={5}
                  autoFocus
                />
                <span className="text-xs text-gray-400">min</span>
              </div>
            ) : (
              <button
                onClick={() => onStartEdit(event.id, 'duration', String(event.durationMinutes))}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-gray-400 hover:text-rose-500 transition-colors bg-gray-50 hover:bg-rose-50 rounded-full px-2.5 py-1"
              >
                <Clock className="h-3 w-3" />
                {durationLabel}
              </button>
            )}

            {/* Delete */}
            <button
              onClick={() => onDelete(event.id)}
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeddingDayTimeline;
