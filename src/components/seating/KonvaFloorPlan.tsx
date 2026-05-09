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
  selectedCanvasElementId: string | null;
  onTablePositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onSelectTable: (table: Table | null) => void;
  onSelectCanvasElement: (elementId: string | null) => void;
  onZoomChange: (zoom: number) => void;
  onDropElement?: (elementType: string, x: number, y: number) => void;
  onTableResize?: (tableId: string, width: number, height: number) => void;
  onTableRotate?: (tableId: string, rotation: number) => void;
  onCanvasElementTransform?: (elementId: string, updates: Partial<CanvasElement>) => void;
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
  selectedCanvasElementId,
  onTablePositionChange,
  onSelectTable,
  onSelectCanvasElement,
  onZoomChange,
  onDropElement,
  onTableResize,
  onTableRotate,
  onCanvasElementTransform,
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
        onSelectCanvasElement(null);
      }
    },
    [onSelectTable, onSelectCanvasElement]
  );

  // Memoize guests lookup per table — avoids new array references on every render
  const guestsByTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    for (const g of guests) {
      if (g.tableId) {
        const arr = map.get(g.tableId) || [];
        arr.push(g);
        map.set(g.tableId, arr);
      }
    }
    return map;
  }, [guests]);

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

  // ─── Canvas element transform constants ──────────────────────────────────────
  const CE_HANDLE_SIZE = 8;
  const CE_ROTATION_HANDLE_DISTANCE = 25;
  const CE_ROTATION_HANDLE_RADIUS = 6;

  // Default dimensions for each canvas element type
  const getElementDefaults = (type: string): { width: number; height: number } => {
    switch (type) {
      case 'dance': return { width: 150, height: 110 };
      case 'arch': return { width: 60, height: 55 };
      case 'stage': return { width: 100, height: 40 };
      case 'wc': return { width: 40, height: 30 };
      case 'bar': return { width: 70, height: 24 };
      case 'tree': return { width: 30, height: 40 };
      default: return { width: 30, height: 30 };
    }
  };

  // Track resize start state for canvas elements
  const ceResizeStartRef = useRef<{ x: number; y: number; width: number; height: number; corner: string } | null>(null);

  // Render decorative canvas elements with selection, drag, resize, and rotate
  const renderCanvasElement = (el: CanvasElement) => {
    const defaults = getElementDefaults(el.type);
    const w = el.width || defaults.width;
    const h = el.height || defaults.height;
    const rotation = el.rotation || 0;
    const isSelected = selectedCanvasElementId === el.id;
    const isDraggable = selectedTool === 'select';

    // Render the element content based on type, scaled to w x h
    const renderContent = () => {
      switch (el.type) {
        case 'dance':
          return (
            <>
              <Ellipse
                x={0} y={0}
                radiusX={w / 2}
                radiusY={h / 2}
                fill="rgba(108,92,231,0.06)"
                stroke={isSelected ? '#6C5CE7' : '#c9c5f7'}
                strokeWidth={isSelected ? 2 : 1.5}
                dash={[5, 3]}
              />
              <Text
                x={-w / 2 + 10} y={-6}
                width={w - 20}
                text={el.label}
                fontSize={12}
                fill="#9b8ee8"
                align="center"
                listening={false}
              />
            </>
          );
        case 'arch':
          return (
            <>
              <Rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                cornerRadius={[w / 3, w / 3, 0, 0]}
                fill="rgba(255,182,193,0.15)"
                stroke={isSelected ? '#e8899a' : '#f7a8b8'}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              <Text
                x={-w / 2 - 5} y={h / 2 - 18}
                width={w + 10}
                text={el.label || 'Bride & Groom'}
                fontSize={9}
                fill="#e8899a"
                align="center"
                listening={false}
              />
            </>
          );
        case 'stage':
          return (
            <>
              <Rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                cornerRadius={6}
                fill="rgba(253,203,110,0.15)"
                stroke={isSelected ? '#d4a843' : '#fdcb6e'}
                strokeWidth={isSelected ? 2 : 1.5}
              />
              <Text
                x={-w / 2 + 5} y={-6}
                width={w - 10}
                text={el.label || 'Stage'}
                fontSize={10}
                fill="#d4a843"
                align="center"
                listening={false}
              />
            </>
          );
        case 'wc':
          return (
            <>
              <Rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                cornerRadius={4}
                fill="rgba(178,190,195,0.15)"
                stroke={isSelected ? '#636e72' : '#b2bec3'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <Text
                x={-w / 2 + 2} y={-5}
                width={w - 4}
                text={el.label || 'WC'}
                fontSize={10}
                fill="#636e72"
                align="center"
                listening={false}
              />
            </>
          );
        case 'bar':
          return (
            <>
              <Rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                cornerRadius={h / 2}
                fill="rgba(108,92,231,0.08)"
                stroke={isSelected ? '#6c5ce7' : '#a29bfe'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <Text
                x={-w / 2 + 5} y={-5}
                width={w - 10}
                text={el.label || 'Bar'}
                fontSize={10}
                fill="#6c5ce7"
                align="center"
                listening={false}
              />
            </>
          );
        case 'tree':
          return (
            <>
              <Circle
                x={0} y={-5}
                radius={Math.min(w, h) / 2}
                fill="rgba(0,184,148,0.12)"
                stroke={isSelected ? '#00b894' : '#00b894'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <Text
                x={-w / 2} y={h / 2 - 5}
                width={w}
                text={el.label || '🌿'}
                fontSize={10}
                align="center"
                listening={false}
              />
            </>
          );
        default:
          return (
            <>
              <Rect
                x={-w / 2} y={-h / 2}
                width={w} height={h}
                cornerRadius={4}
                fill="rgba(108,92,231,0.08)"
                stroke={isSelected ? '#6C5CE7' : '#ddd8ff'}
                strokeWidth={isSelected ? 2 : 1}
              />
              <Text
                x={-w / 2 - 5} y={-5}
                width={w + 10}
                text={el.label}
                fontSize={8}
                fill="#636e72"
                align="center"
                listening={false}
              />
            </>
          );
      }
    };

    // Render transform handles when selected
    const renderHandles = () => {
      if (!isSelected) return null;

      const topCenter = { x: 0, y: -h / 2 };
      const rotationHandleY = topCenter.y - CE_ROTATION_HANDLE_DISTANCE;
      const corners = [
        { key: 'tl', x: -w / 2, y: -h / 2 },
        { key: 'tr', x: w / 2, y: -h / 2 },
        { key: 'bl', x: -w / 2, y: h / 2 },
        { key: 'br', x: w / 2, y: h / 2 },
      ];

      return (
        <>
          {/* Selection border */}
          <Rect
            x={-w / 2} y={-h / 2}
            width={w} height={h}
            stroke="#6C5CE7"
            strokeWidth={1.5}
            dash={[4, 4]}
            listening={false}
          />

          {/* Connection line to rotation handle */}
          <Line
            points={[topCenter.x, topCenter.y, topCenter.x, rotationHandleY]}
            stroke="#6C5CE7"
            strokeWidth={1.5}
            dash={[3, 3]}
            listening={false}
          />

          {/* Rotation handle */}
          <Circle
            x={topCenter.x}
            y={rotationHandleY}
            radius={CE_ROTATION_HANDLE_RADIUS}
            fill="white"
            stroke="#6C5CE7"
            strokeWidth={2}
            draggable
            onDragStart={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
            }}
            onDragMove={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
              if (!onCanvasElementTransform) return;

              const group = e.target.getParent();
              if (!group) return;
              const stage = group.getStage();
              if (!stage) return;

              const pointerPos = stage.getPointerPosition();
              if (!pointerPos) return;

              // Transform pointer position to account for stage zoom/pan
              const stageTransform = stage.getAbsoluteTransform().copy().invert();
              const stagePoint = stageTransform.point(pointerPos);

              // Calculate angle from element center to mouse
              const dx = stagePoint.x - el.x;
              const dy = stagePoint.y - el.y;
              let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;

              // Snap to 5-degree increments
              angle = Math.round(angle / 5) * 5;

              // Normalize to -180 to 180
              while (angle > 180) angle -= 360;
              while (angle < -180) angle += 360;

              onCanvasElementTransform(el.id, { rotation: angle });
            }}
            onDragEnd={(e: KonvaEventObject<DragEvent>) => {
              e.cancelBubble = true;
            }}
            onMouseEnter={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'crosshair';
            }}
            onMouseLeave={(e) => {
              const stage = e.target.getStage();
              if (stage) stage.container().style.cursor = 'default';
            }}
          />
          {/* Rotation icon */}
          <Text
            x={topCenter.x - 5}
            y={rotationHandleY - 5}
            width={10} height={10}
            text="↻"
            fontSize={10}
            fill="#6C5CE7"
            align="center"
            verticalAlign="middle"
            listening={false}
          />

          {/* Corner resize handles */}
          {corners.map((corner) => (
            <Rect
              key={`ce-handle-${corner.key}`}
              x={corner.x - CE_HANDLE_SIZE / 2}
              y={corner.y - CE_HANDLE_SIZE / 2}
              width={CE_HANDLE_SIZE}
              height={CE_HANDLE_SIZE}
              fill="white"
              stroke="#6C5CE7"
              strokeWidth={2}
              cornerRadius={2}
              draggable
              onDragStart={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true;
                ceResizeStartRef.current = {
                  x: e.evt.clientX,
                  y: e.evt.clientY,
                  width: w,
                  height: h,
                  corner: corner.key,
                };
              }}
              onDragMove={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true;
                if (!ceResizeStartRef.current || !onCanvasElementTransform) return;

                const start = ceResizeStartRef.current;
                const dx = e.evt.clientX - start.x;
                const dy = e.evt.clientY - start.y;

                // Account for rotation
                const rot = ((rotation) * Math.PI) / 180;
                const cosR = Math.cos(rot);
                const sinR = Math.sin(rot);

                // Rotate delta to element's local coordinate system
                const localDx = dx * cosR + dy * sinR;
                const localDy = -dx * sinR + dy * cosR;

                // Scale factor from stage zoom
                const stage = e.target.getStage();
                const zoomFactor = stage?.scaleX() || 1;

                let newWidth = start.width;
                let newHeight = start.height;

                if (corner.key === 'br') {
                  newWidth = Math.max(20, start.width + localDx / zoomFactor);
                  newHeight = Math.max(20, start.height + localDy / zoomFactor);
                } else if (corner.key === 'bl') {
                  newWidth = Math.max(20, start.width - localDx / zoomFactor);
                  newHeight = Math.max(20, start.height + localDy / zoomFactor);
                } else if (corner.key === 'tr') {
                  newWidth = Math.max(20, start.width + localDx / zoomFactor);
                  newHeight = Math.max(20, start.height - localDy / zoomFactor);
                } else if (corner.key === 'tl') {
                  newWidth = Math.max(20, start.width - localDx / zoomFactor);
                  newHeight = Math.max(20, start.height - localDy / zoomFactor);
                }

                onCanvasElementTransform(el.id, {
                  width: Math.round(newWidth),
                  height: Math.round(newHeight),
                });
              }}
              onDragEnd={(e: KonvaEventObject<DragEvent>) => {
                e.cancelBubble = true;
                ceResizeStartRef.current = null;
              }}
              onMouseEnter={(e) => {
                const stage = e.target.getStage();
                if (stage) {
                  const cursors: Record<string, string> = {
                    tl: 'nwse-resize',
                    tr: 'nesw-resize',
                    bl: 'nesw-resize',
                    br: 'nwse-resize',
                  };
                  stage.container().style.cursor = cursors[corner.key];
                }
              }}
              onMouseLeave={(e) => {
                const stage = e.target.getStage();
                if (stage) stage.container().style.cursor = 'default';
              }}
            />
          ))}
        </>
      );
    };

    return (
      <Group
        key={el.id}
        x={el.x}
        y={el.y}
        rotation={rotation}
        draggable={isDraggable && !isSelected}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelectCanvasElement(el.id);
        }}
        onTap={(e) => {
          e.cancelBubble = true;
          onSelectCanvasElement(el.id);
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          onCanvasElementTransform?.(el.id, { x: e.target.x(), y: e.target.y() });
        }}
        onMouseEnter={() => {
          if (isDraggable) {
            const stage = stageRef.current;
            if (stage) stage.container().style.cursor = 'pointer';
          }
        }}
        onMouseLeave={() => {
          const stage = stageRef.current;
          if (stage) stage.container().style.cursor = 'default';
        }}
      >
        {renderContent()}
        {renderHandles()}
      </Group>
    );
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
              guests={guestsByTable.get(table.id) || []}
              isSelected={selectedTableId === table.id}
              isHovered={hoveredTableId === table.id}
              isDraggable={selectedTool === 'select'}
              onSelect={onSelectTable}
              onDragEnd={onTablePositionChange}
              onHover={setHoveredTableId}
              onResize={onTableResize}
              onRotate={onTableRotate}
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

export default React.memo(KonvaFloorPlan);
export type { ToolType };
