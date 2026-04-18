import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { Table, Guest } from "@/types";
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragMoveEvent,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  Modifier,
  defaultDropAnimation,
  UniqueIdentifier
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import DraggableTable from "./DraggableTable";
import Minimap from "./Minimap";

interface FloorPlanProps {
  tables: Table[];
  guests: Guest[];
  zoom: number;
  showGrid: boolean;
  resetView?: boolean;
  selectedTableIds?: string[];
  showMinimap?: boolean;
  onTablePositionChange: (tableId: string, positionX: number, positionY: number) => void;
  onTableRotationChange: (tableId: string, rotation: number) => void;
  onTableSelect: (table: Table, isMultiSelect: boolean) => void;
  onGuestAssign: (guestId: string, tableId: string) => void;
  onGuestRemove: (guestId: string) => void;
  onResetViewComplete?: () => void;
  onZoomChange?: (newZoom: number) => void;
}

const FloorPlan = ({
  tables,
  guests,
  zoom,
  showGrid,
  resetView = false,
  selectedTableIds = [],
  showMinimap = true,
  onTablePositionChange,
  onTableRotationChange,
  onTableSelect,
  onGuestAssign,
  onGuestRemove,
  onResetViewComplete,
  onZoomChange
}: FloorPlanProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 800 });

  // Track container dimensions for minimap and initial view state
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [initialViewSet, setInitialViewSet] = useState(false);

  // Configure sensors for drag detection - optimized for different input methods
  const sensors = useSensors(
    useSensor(MouseSensor, {
      // Lower activation distance for mouse for more responsive dragging
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      // Higher activation distance for touch to avoid accidental drags
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      // Add keyboard support for accessibility
      coordinateGetter: (event, { context }) => {
        const { active, droppableRects } = context;
        if (active) {
          const table = tables.find(t => t.id === active.id);
          if (table) {
            return { x: table.positionX, y: table.positionY };
          }
        }
        return { x: 0, y: 0 };
      },
    })
  );

  // Create a modifier that adjusts for zoom without constraining to container
  const adjustForZoomModifier = useCallback<Modifier>((args) => {
    const { transform, active } = args;

    if (!active) return transform;

    // Find the table being dragged
    const tableId = active.id as string;
    const table = tables.find(t => t.id === tableId);

    if (!table) return transform;

    // Adjust transform for zoom to ensure consistent movement speed
    // When zoomed out, we need to move faster, when zoomed in, we need to move slower
    return {
      ...transform,
      x: transform.x / zoom,
      y: transform.y / zoom,
    };
  }, [tables, zoom]);

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateSize();

    // Use ResizeObserver for more efficient resize detection
    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(updateSize);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
      };
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', updateSize);
      return () => window.removeEventListener('resize', updateSize);
    }
  }, []);

  // Track active drag item
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // Memoize event handlers to prevent recreation on every render
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
  }, []);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    // Optional: Add any drag move logic here if needed
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    setActiveId(null);

    const tableId = active.id as string;

    // Find the table being dragged
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    // Calculate new position with zoom adjustment
    // The delta already has the zoom adjustment applied from the modifier
    const newPositionX = table.positionX + delta.x;
    const newPositionY = table.positionY + delta.y;

    // Update table position without any boundaries
    onTablePositionChange(tableId, newPositionX, newPositionY);
  }, [tables, onTablePositionChange]);

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Memoize the background style to prevent recalculation on every render
  const backgroundStyle = useMemo(() => ({
    backgroundImage: showGrid ? 'linear-gradient(to right, #f0f0f0 1px, transparent 1px), linear-gradient(to bottom, #f0f0f0 1px, transparent 1px)' : 'none',
    backgroundSize: `${20 * zoom}px ${20 * zoom}px`
  }), [showGrid, zoom]);

  // Track pan position for moving around when zoomed
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  // Function to calculate the pan position to center all tables
  const calculateCenterPanPosition = useCallback(() => {
    if (tables.length === 0 || containerDimensions.width === 0) {
      return { x: 0, y: 0 };
    }

    // Calculate the bounds of all tables
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    tables.forEach(table => {
      minX = Math.min(minX, table.positionX);
      minY = Math.min(minY, table.positionY);
      maxX = Math.max(maxX, table.positionX + table.width);
      maxY = Math.max(maxY, table.positionY + table.height);
    });

    // Calculate the center point of all tables
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate the pan position to center the tables in the viewport
    const newPanX = (containerDimensions.width / 2) - (centerX * zoom);
    const newPanY = (containerDimensions.height / 2) - (centerY * zoom);

    return { x: newPanX, y: newPanY };
  }, [tables, containerDimensions, zoom]);

  // Reset view when requested
  useEffect(() => {
    if (resetView) {
      const centerPosition = calculateCenterPanPosition();
      setPanPosition(centerPosition);

      if (onResetViewComplete) {
        onResetViewComplete();
      }
    }
  }, [resetView, onResetViewComplete, calculateCenterPanPosition]);

  // Memoize the transform style to prevent recalculation on every render
  const transformStyle = useMemo(() => ({
    transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
    width: '100%',
    height: '100%',
    willChange: 'transform', // Hint to browser to optimize transforms
  }), [zoom, panPosition]);

  // Memoize the table components to prevent recreation on every render
  const tableComponents = useMemo(() => {
    return tables.map(table => (
      <DraggableTable
        key={table.id}
        table={table}
        isSelected={selectedTableIds.includes(table.id)}
        onSelect={onTableSelect}
      />
    ));
  }, [tables, onTableSelect, selectedTableIds]);

  // Configure drop animation
  const dropAnimation = useMemo(() => ({
    ...defaultDropAnimation,
    dragSourceOpacity: 0.5,
  }), []);

  // Handle mouse wheel for zooming and panning
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    // Check if Ctrl key is pressed for zooming
    if (e.ctrlKey) {
      // Zoom in/out with Ctrl + wheel
      const delta = e.deltaY < 0 ? 0.1 : -0.1;
      const newZoom = Math.max(0.5, Math.min(2, zoom + delta));

      // Get mouse position relative to container
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        // Calculate the point in the floor plan where the mouse is pointing
        // This is in the coordinate system of the floor plan before zooming
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert mouse position to world coordinates (before zoom)
        const worldX = (mouseX - panPosition.x) / zoom;
        const worldY = (mouseY - panPosition.y) / zoom;

        // Calculate new pan position to keep the world point under the mouse
        // after zooming
        const newPanX = mouseX - worldX * newZoom;
        const newPanY = mouseY - worldY * newZoom;

        setPanPosition({ x: newPanX, y: newPanY });
      }

      // Update zoom level in parent component
      if (zoom !== newZoom && onZoomChange) {
        onZoomChange(newZoom);
      }
    } else {
      // Pan with wheel (no Ctrl key)
      // Adjust pan speed based on zoom level
      const panSpeed = 1.5 / zoom;

      setPanPosition(prev => ({
        x: prev.x - e.deltaX * panSpeed,
        y: prev.y - e.deltaY * panSpeed
      }));
    }
  }, [zoom, panPosition, onZoomChange]);

  // Handle mouse down for panning with mouse drag
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePosition, setLastMousePosition] = useState({ x: 0, y: 0 });
  const [isDraggingTable, setIsDraggingTable] = useState(false);

  // This ref will help us track if we're dragging a table
  const isDraggingTableRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Check if we're clicking on the background (not a table)
    // We'll use the e.target to determine this
    const target = e.target as HTMLElement;
    const isClickingTable = target.closest('[data-draggable="true"]') !== null;

    // Only enable panning when clicking on the background with left mouse button
    // or with middle mouse button anywhere
    if ((e.button === 0 && !isClickingTable) || e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePosition.x;
      const dy = e.clientY - lastMousePosition.y;

      setPanPosition(prev => ({
        x: prev.x + dx,
        y: prev.y + dy
      }));

      setLastMousePosition({ x: e.clientX, y: e.clientY });
    }
  }, [isPanning, lastMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Add event listeners for mouse up outside the component
  useEffect(() => {
    if (isPanning) {
      const handleGlobalMouseUp = () => setIsPanning(false);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isPanning]);

  // Update container dimensions when the container is resized
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial update
    updateDimensions();

    // Add resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Auto-center tables when the component first loads
  useEffect(() => {
    // Only run once when tables are available and container dimensions are set
    if (tables.length > 0 && containerDimensions.width > 0 && !initialViewSet) {
      // Use our reusable function to calculate the center position
      const centerPosition = calculateCenterPanPosition();
      setPanPosition(centerPosition);

      // Mark initial view as set
      setInitialViewSet(true);
    }
  }, [tables, containerDimensions, initialViewSet, calculateCenterPanPosition]);

  // Handle minimap navigation
  const handleMinimapNavigate = useCallback((x: number, y: number) => {
    setPanPosition({ x, y });
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] relative overflow-hidden bg-white"
      style={backgroundStyle}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        className="absolute top-0 left-0 w-full h-full transform-origin-center"
        style={transformStyle}
      >
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[adjustForZoomModifier]}
          accessibility={{
            announcements: {
              onDragStart: ({ active }) => `Picked up table ${active.id}`,
              onDragEnd: ({ active }) => `Dropped table ${active.id}`,
              onDragCancel: ({ active }) => `Cancelled dragging table ${active.id}`,
            },
          }}
        >
          {tableComponents}
        </DndContext>
      </div>

      {/* Minimap */}
      {showMinimap && containerDimensions.width > 0 && (
        <Minimap
          tables={tables}
          containerWidth={containerDimensions.width}
          containerHeight={containerDimensions.height}
          viewportWidth={containerDimensions.width}
          viewportHeight={containerDimensions.height}
          panPosition={panPosition}
          zoom={zoom}
          onNavigate={handleMinimapNavigate}
          transformOrigin="center" // Match the transform origin used in the main view
        />
      )}

      {/* Center View Button */}
      <button
        className="absolute top-4 right-4 z-10 bg-white/90 rounded-md shadow-md p-2 text-xs flex items-center gap-1 hover:bg-white"
        onClick={() => {
          const centerPosition = calculateCenterPanPosition();
          setPanPosition(centerPosition);
        }}
        title="Center view on all tables"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        Center
      </button>
    </div>
  );
};

export default FloorPlan;
