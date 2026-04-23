import React, { useState } from 'react';
import { Table, TableShape } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Circle, Square, RectangleHorizontal, Armchair, Music,
  LayoutGrid, Heart, Sparkles, Wine, ChevronDown, ChevronRight,
  GripVertical, Eye, EyeOff, Lock, Unlock,
} from 'lucide-react';

// ─── Element definitions ─────────────────────────────────────────────────────
const ELEMENTS = [
  { type: 'round',  label: 'Round Table',  icon: Circle },
  { type: 'rect',   label: 'Rect Table',   icon: RectangleHorizontal },
  { type: 'square', label: 'Square Table',  icon: Square },
  { type: 'chair',  label: 'Chair',         icon: Armchair },
  { type: 'dance',  label: 'Dance Floor',   icon: Music },
  { type: 'stage',  label: 'Stage',         icon: LayoutGrid },
  { type: 'arch',   label: 'Arch',          icon: Heart },
  { type: 'tree',   label: 'Tree / Plant',  icon: Sparkles },
  { type: 'deco',   label: 'Decoration',    icon: Sparkles },
  { type: 'wc',     label: 'Restroom',      icon: Square },
  { type: 'bar',    label: 'Bar',           icon: Wine },
];

// ─── Templates ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'classic',  label: 'Classic Wedding',  tables: 8, desc: '8 round tables' },
  { id: 'intimate', label: 'Intimate Dinner',  tables: 4, desc: '4 round tables' },
  { id: 'banquet',  label: 'Banquet Style',    tables: 6, desc: '6 rectangular' },
  { id: 'mixed',    label: 'Mixed Layout',     tables: 5, desc: '3 round + 2 rect' },
];

// ─── Canvas element type for layers ──────────────────────────────────────────
interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  label: string;
  visible?: boolean;
  locked?: boolean;
}

interface LeftSidebarProps {
  onAddTable: (tableData: Partial<Table>) => void;
  onAddCanvasElement?: (element: CanvasElement) => void;
  canvasElements?: CanvasElement[];
  tables?: Table[];
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({
  onAddTable,
  onAddCanvasElement,
  canvasElements = [],
  tables = [],
}) => {
  const [showElements, setShowElements] = useState(true);
  const [showTemplates, setShowTemplates] = useState(true);
  const [showLayers, setShowLayers] = useState(true);

  // Handle drag start for element palette
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData('elementType', elementType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Handle template click
  const handleTemplateClick = (templateId: string) => {
    switch (templateId) {
      case 'classic': {
        const positions = [
          { x: 150, y: 150 }, { x: 350, y: 150 }, { x: 550, y: 150 },
          { x: 150, y: 350 }, { x: 350, y: 350 }, { x: 550, y: 350 },
          { x: 150, y: 550 }, { x: 550, y: 550 },
        ];
        positions.forEach((pos, i) => {
          onAddTable({
            name: `Table ${i + 1}`,
            shape: 'round' as TableShape,
            capacity: 8,
            positionX: pos.x,
            positionY: pos.y,
            width: 120,
            height: 120,
          } as Partial<Table>);
        });
        break;
      }
      case 'intimate': {
        const positions = [
          { x: 200, y: 200 }, { x: 450, y: 200 },
          { x: 200, y: 400 }, { x: 450, y: 400 },
        ];
        positions.forEach((pos, i) => {
          onAddTable({
            name: `Table ${i + 1}`,
            shape: 'round' as TableShape,
            capacity: 6,
            positionX: pos.x,
            positionY: pos.y,
            width: 100,
            height: 100,
          } as Partial<Table>);
        });
        break;
      }
      case 'banquet': {
        const positions = [
          { x: 100, y: 150 }, { x: 350, y: 150 }, { x: 600, y: 150 },
          { x: 100, y: 350 }, { x: 350, y: 350 }, { x: 600, y: 350 },
        ];
        positions.forEach((pos, i) => {
          onAddTable({
            name: `Table ${i + 1}`,
            shape: 'rectangular' as TableShape,
            capacity: 10,
            positionX: pos.x,
            positionY: pos.y,
            width: 160,
            height: 80,
          } as Partial<Table>);
        });
        break;
      }
      case 'mixed': {
        const roundPositions = [
          { x: 150, y: 200 }, { x: 450, y: 200 }, { x: 300, y: 400 },
        ];
        const rectPositions = [
          { x: 150, y: 550 }, { x: 450, y: 550 },
        ];
        roundPositions.forEach((pos, i) => {
          onAddTable({
            name: `Table ${i + 1}`,
            shape: 'round' as TableShape,
            capacity: 8,
            positionX: pos.x,
            positionY: pos.y,
            width: 120,
            height: 120,
          } as Partial<Table>);
        });
        rectPositions.forEach((pos, i) => {
          onAddTable({
            name: `Table ${roundPositions.length + i + 1}`,
            shape: 'rectangular' as TableShape,
            capacity: 10,
            positionX: pos.x,
            positionY: pos.y,
            width: 160,
            height: 80,
          } as Partial<Table>);
        });
        break;
      }
    }
  };

  return (
    <div className="w-56 border-r border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-hidden">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* ── Add Elements ────────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowElements(!showElements)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 w-full"
            >
              {showElements ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Add Elements
            </button>
            {showElements && (
              <div className="grid grid-cols-2 gap-1.5">
                {ELEMENTS.map((el) => (
                  <div
                    key={el.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, el.type)}
                    onClick={() => {
                      // Quick add on click
                      if (el.type === 'round') {
                        onAddTable({
                          name: `Table ${tables.length + 1}`,
                          shape: 'round' as TableShape,
                          capacity: 8,
                          positionX: 200 + Math.random() * 300,
                          positionY: 200 + Math.random() * 200,
                          width: 120,
                          height: 120,
                        } as Partial<Table>);
                      } else if (el.type === 'rect') {
                        onAddTable({
                          name: `Table ${tables.length + 1}`,
                          shape: 'rectangular' as TableShape,
                          capacity: 10,
                          positionX: 200 + Math.random() * 300,
                          positionY: 200 + Math.random() * 200,
                          width: 160,
                          height: 80,
                        } as Partial<Table>);
                      } else if (el.type === 'square') {
                        onAddTable({
                          name: `Table ${tables.length + 1}`,
                          shape: 'square' as TableShape,
                          capacity: 4,
                          positionX: 200 + Math.random() * 300,
                          positionY: 200 + Math.random() * 200,
                          width: 80,
                          height: 80,
                        } as Partial<Table>);
                      } else if (onAddCanvasElement) {
                        onAddCanvasElement({
                          id: `${el.type}-${Date.now()}`,
                          type: el.type,
                          x: 300 + Math.random() * 200,
                          y: 300 + Math.random() * 200,
                          label: el.label,
                        });
                      }
                    }}
                    className="border border-gray-200 rounded-lg p-2 cursor-grab text-center text-[10px] text-gray-500 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 transition-colors active:scale-95"
                  >
                    <el.icon className="h-5 w-5 mx-auto mb-1" />
                    {el.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Templates ───────────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 w-full"
            >
              {showTemplates ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Templates
            </button>
            {showTemplates && (
              <div className="space-y-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplateClick(tmpl.id)}
                    className="w-full text-left px-3 py-2 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors group"
                  >
                    <div className="text-xs font-medium text-gray-700 group-hover:text-violet-700">{tmpl.label}</div>
                    <div className="text-[10px] text-gray-400">{tmpl.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Layers ──────────────────────────────────────────────────── */}
          <div>
            <button
              onClick={() => setShowLayers(!showLayers)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 w-full"
            >
              {showLayers ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              Layers
            </button>
            {showLayers && (
              <div className="space-y-0.5">
                {tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-xs text-gray-600 group"
                  >
                    <GripVertical className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Circle className="h-3 w-3 text-violet-400 flex-shrink-0" />
                    <span className="truncate flex-1">{table.name}</span>
                    <Eye className="h-3 w-3 text-gray-300 hover:text-gray-500" />
                  </div>
                ))}
                {canvasElements.map((el) => (
                  <div
                    key={el.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-50 text-xs text-gray-500 group"
                  >
                    <GripVertical className="h-3 w-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <LayoutGrid className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate flex-1">{el.label}</span>
                    <Eye className="h-3 w-3 text-gray-300 hover:text-gray-500" />
                  </div>
                ))}
                {tables.length === 0 && canvasElements.length === 0 && (
                  <p className="text-[10px] text-gray-400 py-2 px-2">No elements yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default React.memo(LeftSidebar);
export type { CanvasElement };
