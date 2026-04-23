import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Line, Circle, Text, Group } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Table, Guest } from '@/types';
import KonvaTable from './KonvaTable';

interface KonvaFloorPlanProps {
  tables: Table[];
  guests: Guest[];
  selectedTableId: string | null;
  zoom: number;
  showGrid: boolean;
  onTablePositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onSelectTable: (table: Table | null) => void;
  onZoomChange: (zoom: number) => void;
  stageRef: React.RefObject<any>;
}

const KonvaFloorPlan: React.FC<KonvaFloorPlanProps> = ({
  tables,
  guests,
  selectedTableId,
  zoom,
  showGrid,
  onTablePositionChange,
  onSelectTable,
  onZoomChange,
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
      // Click on empty area
      if (e.target === e.target.getStage()) {
        onSelectTable(null);
      }
    },
    [onSelectTable]
  );

  // Get guests for a specific table
  const getGuestsForTable = useCallback(
    (tableId: string) => {
      return guests.filter((g) => g.tableId === tableId);
    },
    [guests]
  );

  // Grid lines
  const gridLines = useMemo(() => {
    if (!showGrid) return null;

    const lines: React.ReactNode[] = [];
    const gridSize = 40;
    const scaledGrid = gridSize * zoom;

    // Calculate visible area
    const startX = -stagePos.x / zoom;
    const startY = -stagePos.y / zoom;
    const endX = startX + dimensions.width / zoom;
    const endY = startY + dimensions.height / zoom;

    // Vertical lines
    for (let x = Math.floor(startX / gridSize) * gridSize; x < endX; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke="#F3F4F6"
          strokeWidth={0.5 / zoom}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = Math.floor(startY / gridSize) * gridSize; y < endY; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke="#F3F4F6"
          strokeWidth={0.5 / zoom}
          listening={false}
        />
      );
    }

    return lines;
  }, [showGrid, zoom, stagePos, dimensions]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ cursor: hoveredTableId ? 'pointer' : 'grab' }}
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
        draggable
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
            fill="#FAFAFA"
            listening={true}
          />

          {/* Grid */}
          {gridLines}

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
          {tables.length === 0 && (
            <Group x={dimensions.width / 2 / zoom - stagePos.x / zoom} y={dimensions.height / 2 / zoom - stagePos.y / zoom}>
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
                text="Click 'Add Table' to get started"
                fontSize={12}
                fill="#D1D5DB"
                align="center"
                listening={false}
              />
            </Group>
          )}
        </Layer>
      </Stage>
    </div>
  );
};

export default KonvaFloorPlan;
