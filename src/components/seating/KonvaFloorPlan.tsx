import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group, Ellipse } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Table, Guest } from '@/types';
import KonvaTable from './KonvaTable';
import { CanvasElement } from './LeftSidebar';

// ─── Canvas toolbar tool type ────────────────────────────────────────────────
type ToolType = 'select' | 'pan' | 'rect' | 'text' | 'eraser';

interface KonvaFloorPlanProps {
  tables: Table[];
  guests: Guest[];
  selectedTableId: string | null;
  zoom: number;
  showGrid: boolean;
  selectedTool: ToolType;
  canvasElements: CanvasElement[];
  onTablePositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onSelectTable: (table: Table | null) => void;
  onZoomChange: (zoom: number) => void;
  onDropElement?: (elementType: string, x: number, y: number) => void;
  stageRef: React.RefObject<any>;
}

const KonvaFloorPlan: React.FC<KonvaFloorPlanProps> = ({
  tables,
  guests,
  selectedTableId,
  zoom,
  showGrid,
  selectedTool,
  canvasElements,
  onTablePositionChange,
  onSelectTable,
  onZoomChange,
  onDropElement,
  stageRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [hoveredTableId, setHoveredTableId] = useState<string | null>(null);

  // Track container size
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  // Center tables on initial load
  useEffect(() => {
    if (tables.length > 0 && dimensions.width > 0) {
      const bounds = getTableBounds(tables);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      setStagePos({
        x: dimensions.width / 2 - centerX * zoom,
        y: dimensions.height / 2 - centerY * zoom,
      });
    }
  }, [tables.length > 0, dimensions.width > 0]);

  // Handle drop from sidebar
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const elementType = e.dataTransfer?.getData('elementType');
      if (!elementType || !onDropElement) return;

      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left - stagePos.x) / zoom;
      const y = (e.clientY - rect.top - stagePos.y) / zoom;

      onDropElement(elementType, x, y);
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.dataTransfer!.dropEffect = 'copy';
    };

    container.addEventListener('drop', handleDrop);
    container.addEventListener('dragover', handleDragOver);

    return () => {
      container.removeEventListener('drop', handleDrop);
      container.removeEventListener('dragover', handleDragOver);
    };
  }, [stagePos, zoom, onDropElement]);

  // Get table bounds
  const getTableBounds = (tables: Table[]) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    tables.forEach((t) => {
      minX = Math.min(minX, t.positionX - 80);
      minY = Math.min(minY, t.positionY - 80);
      maxX = Math.max(maxX, t.positionX + 80);
      maxY = Math.max(maxY, t.positionY + 80);
    });
    return { minX, minY, maxX, maxY };
  };

  // Handle wheel zoom/pan
  const handleWheel = useCallback(
    (e: KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = zoom;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stagePos.x) / oldScale,
        y: (pointer.y - stagePos.y) / oldScale,
      };

      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const newScale = direction > 0
        ? Math.min(3, oldScale * 1.08)
        : Math.max(0.25, oldScale / 1.08);

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      onZoomChange(newScale);
      setStagePos(newPos);
    },
    [zoom, stagePos, onZoomChange, stageRef]
  );

  // Handle background click to deselect
  const handleStageClick = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      if (e.target === e.target.getStage()) {
        onSelectTable(null);
      }
    },
    [onSelectTable]
  );

  // Get guests for a specific table
  const getGuestsForTable = useCallback(
    (tableId: string) => guests.filter((g) => g.tableId === tableId),
    [guests]
  );

  // Grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null;

    const lines: React.ReactNode[] = [];
    const gridSize = 40;

    const startX = -stagePos.x / zoom;
    const startY = -stagePos.y / zoom;
    const endX = startX + dimensions.width / zoom;
    const endY = startY + dimensions.height / zoom;

    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#F0EFFE"
          strokeWidth={0.5 / zoom}
          listening={false}
        />
      );
    }

    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#F0EFFE"
          strokeWidth={0.5 / zoom}
          listening={false}
        />
      );
    }

    return lines;
  }, [showGrid, zoom, stagePos, dimensions]);

  // Render decorative canvas elements
  const renderCanvasElement = (el: CanvasElement) => {
    switch (el.type) {
      case 'dance':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Ellipse
              x={0}
              y={0}
              radiusX={75}
              radiusY={55}
              fill="rgba(108,92,231,0.06)"
              stroke="#c9c5f7"
              strokeWidth={1.5}
              dash={[5, 3]}
            />
            <Text
              x={-40}
              y={-6}
              width={80}
              text={el.label}
              fontSize={12}
              fill="#9b8ee8"
              align="center"
              listening={false}
            />
          </Group>
        );
      case 'arch':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Rect
              x={-30}
              y={-40}
              width={60}
              height={50}
              cornerRadius={[20, 20, 0, 0]}
              fill="rgba(255,182,193,0.15)"
              stroke="#f7a8b8"
              strokeWidth={1.5}
            />
            <Text
              x={-35}
              y={15}
              width={70}
              text={el.label || 'Bride & Groom'}
              fontSize={9}
              fill="#e8899a"
              align="center"
              listening={false}
            />
          </Group>
        );
      case 'stage':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Rect
              x={-50}
              y={-20}
              width={100}
              height={40}
              cornerRadius={6}
              fill="rgba(253,203,110,0.15)"
              stroke="#fdcb6e"
              strokeWidth={1.5}
            />
            <Text
              x={-25}
              y={-6}
              width={50}
              text={el.label || 'Stage'}
              fontSize={10}
              fill="#d4a843"
              align="center"
              listening={false}
            />
          </Group>
        );
      case 'wc':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Rect
              x={-20}
              y={-15}
              width={40}
              height={30}
              cornerRadius={4}
              fill="rgba(178,190,195,0.15)"
              stroke="#b2bec3"
              strokeWidth={1}
            />
            <Text
              x={-10}
              y={-5}
              width={20}
              text={el.label || 'WC'}
              fontSize={10}
              fill="#636e72"
              align="center"
              listening={false}
            />
          </Group>
        );
      case 'bar':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Rect
              x={-35}
              y={-12}
              width={70}
              height={24}
              cornerRadius={12}
              fill="rgba(108,92,231,0.08)"
              stroke="#a29bfe"
              strokeWidth={1}
            />
            <Text
              x={-15}
              y={-5}
              width={30}
              text={el.label || 'Bar'}
              fontSize={10}
              fill="#6c5ce7"
              align="center"
              listening={false}
            />
          </Group>
        );
      case 'tree':
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Circle
              x={0}
              y={-5}
              radius={15}
              fill="rgba(0,184,148,0.12)"
              stroke="#00b894"
              strokeWidth={1}
            />
            <Text
              x={-15}
              y={15}
              width={30}
              text={el.label || '🌿'}
              fontSize={10}
              align="center"
              listening={false}
            />
          </Group>
        );
      default:
        return (
          <Group key={el.id} x={el.x} y={el.y}>
            <Rect
              x={-15}
              y={-15}
              width={30}
              height={30}
              cornerRadius={4}
              fill="rgba(108,92,231,0.08)"
              stroke="#ddd8ff"
              strokeWidth={1}
            />
            <Text
              x={-20}
              y={-5}
              width={40}
              text={el.label}
              fontSize={8}
              fill="#636e72"
              align="center"
              listening={false}
            />
          </Group>
        );
    }
  };

  // Minimap
  const renderMinimap = () => {
    if (tables.length === 0 && canvasElements.length === 0) return null;

    const allPoints = [
      ...tables.map((t) => ({ x: t.positionX, y: t.positionY })),
      ...canvasElements.map((e) => ({ x: e.x, y: e.y })),
    ];

    const bounds = {
      minX: Math.min(...allPoints.map((p) => p.x)) - 100,
      minY: Math.min(...allPoints.map((p) => p.y)) - 100,
      maxX: Math.max(...allPoints.map((p) => p.x)) + 100,
      maxY: Math.max(...allPoints.map((p) => p.y)) + 100,
    };

    const viewW = bounds.maxX - bounds.minX || 800;
    const viewH = bounds.maxY - bounds.minY || 600;

    return (
      <Group x={0} y={0}>
        {tables.map((t) => (
          <Circle
            key={`mm-${t.id}`}
            x={((t.positionX - bounds.minX) / viewW) * 110}
            y={((t.positionY - bounds.minY) / viewH) * 75}
            radius={3}
            fill={selectedTableId === t.id ? '#6C5CE7' : '#ddd8ff'}
            stroke="#c9c5f7"
            strokeWidth={0.5}
          />
        ))}
      </Group>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden relative"
      style={{ cursor: selectedTool === 'pan' ? 'grab' : hoveredTableId ? 'pointer' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={dimensions.width}
        height={dimensions.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onTap={handleStageClick}
        draggable={selectedTool === 'pan'}
        onDragEnd={(e) => {
          if (e.target === e.target.getStage()) {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          {/* Background */}
          <Rect
            x={-5000}
            y={-5000}
            width={10000}
            height={10000}
            fill="#FAFAF8"
            listening={true}
          />

          {/* Grid */}
          {gridLines}

          {/* Canvas decorative elements */}
          {canvasElements.map(renderCanvasElement)}

          {/* Tables */}
          {tables.map((table) => (
            <KonvaTable
              key={table.id}
              table={table}
              guests={getGuestsForTable(table.id)}
              isSelected={selectedTableId === table.id}
              isHovered={hoveredTableId === table.id}
              onSelect={onSelectTable}
              onDragEnd={onTablePositionChange}
              onHover={setHoveredTableId}
            />
          ))}

          {/* Empty state */}
          {tables.length === 0 && canvasElements.length === 0 && (
            <Group
              x={dimensions.width / 2 / zoom - stagePos.x / zoom}
              y={dimensions.height / 2 / zoom - stagePos.y / zoom}
            >
              <Text
                x={-100}
                y={-20}
                width={200}
                text="No tables yet"
                fontSize={16}
                fill="#9CA3AF"
                align="center"
                listening={false}
              />
              <Text
                x={-100}
                y={5}
                width={200}
                text="Drag elements from the sidebar or click to add"
                fontSize={12}
                fill="#D1D5DB"
                align="center"
                listening={false}
              />
            </Group>
          )}
        </Layer>
      </Stage>

      {/* Minimap overlay */}
      {tables.length > 0 && (
        <div className="absolute bottom-3 right-3 w-32 h-24 bg-white/95 border border-gray-200 rounded-md overflow-hidden z-10 shadow-sm">
          <Stage width={120} height={80}>
            <Layer>
              <Rect x={0} y={0} width={120} height={80} fill="#FAFAF8" />
              {renderMinimap()}
            </Layer>
          </Stage>
          <div className="flex justify-between px-1.5 py-0.5 border-t border-gray-100 bg-white">
            <button
              className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
              onClick={() => onZoomChange(Math.min(3, zoom + 0.25))}
            >
              +
            </button>
            <span className="text-[9px] text-gray-400">{Math.round(zoom * 100)}%</span>
            <button
              className="text-[10px] text-gray-400 hover:text-gray-600 px-1"
              onClick={() => onZoomChange(Math.max(0.25, zoom - 0.25))}
            >
              −
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KonvaFloorPlan;
export type { ToolType };
