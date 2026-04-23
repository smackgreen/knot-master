import React, { useState, useCallback, useEffect } from 'react';
import { Table, Guest } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Trash2, RotateCw, Minus, Plus, Shuffle, Sparkles,
  User, UserMinus, ChevronDown, LayoutGrid, Move, Palette,
} from 'lucide-react';

interface RightPanelProps {
  selectedTable: Table | null;
  guests: Guest[];
  unassignedGuests: Guest[];
  activeTab: 'properties' | 'smartassist';
  onTabChange: (tab: 'properties' | 'smartassist') => void;
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onRemoveGuest: (guestId: string) => void;
  onAssignGuest: (guestId: string, tableId: string) => void;
  onAutoAssign: () => void;
  autoAssignStrategy: 'family' | 'random' | 'balanced';
  onStrategyChange: (s: 'family' | 'random' | 'balanced') => void;
}

const RightPanel: React.FC<RightPanelProps> = ({
  selectedTable,
  guests,
  unassignedGuests,
  activeTab,
  onTabChange,
  onUpdateTable,
  onDeleteTable,
  onRemoveGuest,
  onAssignGuest,
  onAutoAssign,
  autoAssignStrategy,
  onStrategyChange,
}) => {
  const [localName, setLocalName] = useState('');
  const [localCapacity, setLocalCapacity] = useState(8);
  const [localRotation, setLocalRotation] = useState(0);
  const [localWidth, setLocalWidth] = useState(120);
  const [localHeight, setLocalHeight] = useState(120);
  const [localColor, setLocalColor] = useState('#FFFFFF');
  const [localBorderStyle, setLocalBorderStyle] = useState<'solid' | 'dashed' | 'dotted'>('solid');

  // Sync local state when selected table changes
  useEffect(() => {
    if (selectedTable) {
      setLocalName(selectedTable.name);
      setLocalCapacity(selectedTable.capacity);
      setLocalRotation(selectedTable.rotation || 0);
      setLocalWidth(selectedTable.width || 120);
      setLocalHeight(selectedTable.height || 120);
      setLocalColor((selectedTable as any).color || '#FFFFFF');
      setLocalBorderStyle((selectedTable as any).borderStyle || 'solid');
    }
  }, [selectedTable]);

  // Debounced update
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const debouncedUpdate = useCallback(
    (updates: Partial<Table>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (selectedTable) {
          onUpdateTable(selectedTable.id, updates);
        }
      }, 300);
    },
    [selectedTable, onUpdateTable]
  );

  // Table guests
  const tableGuests = selectedTable
    ? guests.filter((g) => g.tableId === selectedTable.id)
    : [];

  if (!selectedTable) {
    return (
      <div className="w-72 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {(['properties', 'smartassist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`flex-1 text-xs py-2.5 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-violet-600 border-violet-600'
                  : 'text-gray-400 border-transparent hover:text-gray-600'
              }`}
            >
              {tab === 'smartassist' ? '✦ Smart Assist' : 'Properties'}
            </button>
          ))}
        </div>

        {/* No selection state */}
        <div className="flex-1 flex items-center justify-center p-6">
          {activeTab === 'properties' ? (
            <div className="text-center">
              <LayoutGrid className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">Select a table to edit its properties</p>
            </div>
          ) : (
            <div className="w-full space-y-3">
              <div className="text-center mb-4">
                <Sparkles className="h-8 w-8 text-violet-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">
                  ✦ Auto-assign guests, suggest layouts, optimize seating
                </p>
              </div>
              <Select value={autoAssignStrategy} onValueChange={(v: any) => onStrategyChange(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">By family group</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={onAutoAssign}
                className="w-full bg-violet-600 text-white text-sm h-9"
                disabled={unassignedGuests.length === 0}
              >
                <Shuffle className="h-4 w-4 mr-2" />
                Auto-assign {unassignedGuests.length} guests
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 border-l border-gray-200 bg-white flex flex-col flex-shrink-0">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {(['properties', 'smartassist'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`flex-1 text-xs py-2.5 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'text-violet-600 border-violet-600'
                : 'text-gray-400 border-transparent hover:text-gray-600'
            }`}
          >
            {tab === 'smartassist' ? '✦ Smart Assist' : 'Properties'}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {activeTab === 'properties' ? (
          <div className="p-4 space-y-4">
            {/* Table name */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">Table Name</Label>
              <Input
                value={localName}
                onChange={(e) => {
                  setLocalName(e.target.value);
                  debouncedUpdate({ name: e.target.value });
                }}
                className="h-8 text-sm"
              />
            </div>

            {/* Seats */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">Seats</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const newCap = Math.max(1, localCapacity - 1);
                    setLocalCapacity(newCap);
                    debouncedUpdate({ capacity: newCap });
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">{localCapacity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    const newCap = Math.min(20, localCapacity + 1);
                    setLocalCapacity(newCap);
                    debouncedUpdate({ capacity: newCap });
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Position */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1">X</Label>
                <Input
                  type="number"
                  value={Math.round(selectedTable.positionX)}
                  onChange={(e) => {
                    debouncedUpdate({ positionX: Number(e.target.value) });
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Y</Label>
                <Input
                  type="number"
                  value={Math.round(selectedTable.positionY)}
                  onChange={(e) => {
                    debouncedUpdate({ positionY: Number(e.target.value) });
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">
                Rotation: {localRotation}°
              </Label>
              <Slider
                value={[localRotation]}
                min={-180}
                max={180}
                step={5}
                onValueChange={([val]) => {
                  setLocalRotation(val);
                  debouncedUpdate({ rotation: val });
                }}
                className="mt-1"
              />
            </div>

            {/* Width / Height */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs text-gray-500 mb-1">Width</Label>
                <Input
                  type="number"
                  value={localWidth}
                  onChange={(e) => {
                    setLocalWidth(Number(e.target.value));
                    debouncedUpdate({ width: Number(e.target.value) });
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1">Height</Label>
                <Input
                  type="number"
                  value={localHeight}
                  onChange={(e) => {
                    setLocalHeight(Number(e.target.value));
                    debouncedUpdate({ height: Number(e.target.value) });
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Table Color */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">Table Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localColor}
                  onChange={(e) => {
                    setLocalColor(e.target.value);
                    debouncedUpdate({ color: e.target.value } as any);
                  }}
                  className="w-10 h-8 rounded-md border border-gray-200 cursor-pointer"
                />
                <Input
                  value={localColor}
                  onChange={(e) => {
                    setLocalColor(e.target.value);
                    debouncedUpdate({ color: e.target.value } as any);
                  }}
                  className="h-8 text-sm flex-1"
                />
              </div>
            </div>

            {/* Border Style */}
            <div>
              <Label className="text-xs text-gray-500 mb-1">Border Style</Label>
              <Select
                value={localBorderStyle}
                onValueChange={(v: any) => {
                  setLocalBorderStyle(v);
                  debouncedUpdate({ borderStyle: v } as any);
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Guests */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5">
                Guests ({tableGuests.length}/{selectedTable.capacity})
              </Label>
              <div className="space-y-1">
                {tableGuests.map((guest) => (
                  <div
                    key={guest.id}
                    className="flex items-center justify-between py-1 px-2 bg-violet-50 rounded-md group"
                  >
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-violet-500" />
                      <span className="text-xs text-gray-700">
                        {guest.firstName} {guest.lastName}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveGuest(guest.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <UserMinus className="h-3 w-3 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                ))}
                {tableGuests.length === 0 && (
                  <p className="text-[10px] text-gray-400 py-1">No guests assigned</p>
                )}
              </div>

              {/* Assign guest dropdown */}
              {unassignedGuests.length > 0 && (
                <Select onValueChange={(guestId) => onAssignGuest(guestId, selectedTable.id)}>
                  <SelectTrigger className="h-7 text-xs mt-2">
                    <SelectValue placeholder="+ Assign guest..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedGuests.map((guest) => (
                      <SelectItem key={guest.id} value={guest.id}>
                        {guest.firstName} {guest.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Delete button */}
            <div className="pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs text-red-500 hover:bg-red-50 hover:border-red-200"
                onClick={() => onDeleteTable(selectedTable.id)}
              >
                <Trash2 className="h-3 w-3 mr-1.5" /> Delete Table
              </Button>
            </div>
          </div>
        ) : (
          /* Smart Assist tab */
          <div className="p-4 space-y-3">
            <div className="text-center mb-4">
              <Sparkles className="h-8 w-8 text-violet-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                ✦ Auto-assign guests, suggest layouts, optimize seating
              </p>
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1">Strategy</Label>
              <Select value={autoAssignStrategy} onValueChange={(v: any) => onStrategyChange(v)}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="family">By family group</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={onAutoAssign}
              className="w-full bg-violet-600 text-white text-sm h-9"
              disabled={unassignedGuests.length === 0}
            >
              <Shuffle className="h-4 w-4 mr-2" />
              Auto-assign {unassignedGuests.length} guests
            </Button>

            {/* Stats */}
            <div className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-medium text-gray-500">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-violet-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-violet-600">{tableGuests.length}</p>
                  <p className="text-[10px] text-gray-400">Seated</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-lg font-bold text-amber-600">{unassignedGuests.length}</p>
                  <p className="text-[10px] text-gray-400">Unassigned</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default RightPanel;
