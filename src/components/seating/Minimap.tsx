import React, { useMemo } from 'react';
import { Table } from '@/types';

interface MinimapProps {
  tables: Table[];
  containerWidth: number;
  containerHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  panPosition: { x: number; y: number };
  zoom: number;
  onNavigate: (x: number, y: number) => void;
  transformOrigin?: string;
}

const Minimap: React.FC<MinimapProps> = ({
  tables,
  containerWidth,
  containerHeight,
  viewportWidth,
  viewportHeight,
  panPosition,
  zoom,
  onNavigate,
  transformOrigin = 'center',
}) => {
  // Fixed minimap dimensions
  const minimapWidth = 150;
  const minimapHeight = 150;

  // Calculate the bounds of all tables to determine the floor plan size
  const { minX, minY, maxX, maxY, worldWidth, worldHeight } = useMemo(() => {
    // Default values if no tables
    if (tables.length === 0) {
      return {
        minX: -500, minY: -500,
        maxX: 500, maxY: 500,
        worldWidth: 1000, worldHeight: 1000
      };
    }

    // Find the actual bounds of all tables
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

    // Add padding
    const padding = 200;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // Calculate world dimensions
    const width = maxX - minX;
    const height = maxY - minY;

    return {
      minX, minY, maxX, maxY,
      worldWidth: width, worldHeight: height
    };
  }, [tables]);

  // Calculate scale to fit the world in the minimap
  const scale = Math.min(minimapWidth / worldWidth, minimapHeight / worldHeight);

  // Calculate the viewport rectangle in minimap coordinates
  const viewportRect = useMemo(() => {
    // In the main view, the transform is applied to the content div
    // The transform origin is 'center', so the center of the viewport is at (0,0) in the transformed space
    // The pan position moves this center point

    // Calculate the viewport's visible area in world coordinates

    // First, get the center point of the viewport in world coordinates
    // This is the point at the center of the screen, which is at (-panX/zoom, -panY/zoom) in world coordinates
    const viewportCenterX = -panPosition.x / zoom;
    const viewportCenterY = -panPosition.y / zoom;

    // Calculate the half-width and half-height of the viewport in world coordinates
    const halfViewportWidth = (viewportWidth / 2) / zoom;
    const halfViewportHeight = (viewportHeight / 2) / zoom;

    // Calculate the world coordinates of the viewport corners
    const viewportLeft = viewportCenterX - halfViewportWidth;
    const viewportTop = viewportCenterY - halfViewportHeight;
    const viewportRight = viewportCenterX + halfViewportWidth;
    const viewportBottom = viewportCenterY + halfViewportHeight;

    // Convert world coordinates to minimap coordinates
    const minimapLeft = (viewportLeft - minX) * scale;
    const minimapTop = (viewportTop - minY) * scale;
    const minimapRight = (viewportRight - minX) * scale;
    const minimapBottom = (viewportBottom - minY) * scale;

    return {
      left: minimapLeft,
      top: minimapTop,
      width: minimapRight - minimapLeft,
      height: minimapBottom - minimapTop
    };
  }, [panPosition, zoom, viewportWidth, viewportHeight, minX, minY, scale]);

  // Handle click on the minimap to navigate
  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Get click position in minimap coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const minimapX = e.clientX - rect.left;
    const minimapY = e.clientY - rect.top;

    // Convert from minimap coordinates to world coordinates
    const worldX = (minimapX / scale) + minX;
    const worldY = (minimapY / scale) + minY;

    // Calculate the new pan position to center the view on the clicked point
    // We need to negate the world coordinates and multiply by zoom
    // This will center the view on the clicked point
    const newPanX = -worldX * zoom;
    const newPanY = -worldY * zoom;



    onNavigate(newPanX, newPanY);
  };

  // Render the tables in the minimap
  const tableElements = useMemo(() => {
    return tables.map(table => {
      // Get the center point of the table in world coordinates
      const tableCenterX = table.positionX + (table.width / 2);
      const tableCenterY = table.positionY + (table.height / 2);

      // Convert table center to minimap coordinates
      const minimapCenterX = (tableCenterX - minX) * scale;
      const minimapCenterY = (tableCenterY - minY) * scale;

      // Calculate size in minimap
      const minimapWidth = table.width * scale;
      const minimapHeight = table.height * scale;

      // Ensure minimum size for visibility
      const minSize = 5;
      const displayWidth = Math.max(minimapWidth, minSize);
      const displayHeight = Math.max(minimapHeight, minSize);

      // Calculate top-left position from center
      const adjustedX = minimapCenterX - (displayWidth / 2);
      const adjustedY = minimapCenterY - (displayHeight / 2);

      // Determine if the table is visible in the main view
      // A table is visible if any part of it is within the viewport
      const tableLeft = table.positionX;
      const tableTop = table.positionY;
      const tableRight = tableLeft + table.width;
      const tableBottom = tableTop + table.height;

      // Calculate viewport bounds in world coordinates
      const viewportCenterX = -panPosition.x / zoom;
      const viewportCenterY = -panPosition.y / zoom;
      const halfViewportWidth = (viewportWidth / 2) / zoom;
      const halfViewportHeight = (viewportHeight / 2) / zoom;
      const viewportLeft = viewportCenterX - halfViewportWidth;
      const viewportTop = viewportCenterY - halfViewportHeight;
      const viewportRight = viewportCenterX + halfViewportWidth;
      const viewportBottom = viewportCenterY + halfViewportHeight;

      // Check if the table is visible in the viewport
      const isVisible = !(
        tableRight < viewportLeft ||
        tableLeft > viewportRight ||
        tableBottom < viewportTop ||
        tableTop > viewportBottom
      );

      // Table color based on shape and visibility
      const baseColor =
        table.shape === 'round' ? '#10b981' :
        table.shape === 'square' ? '#3b82f6' :
        '#ef4444';

      // Use a more vibrant color for visible tables
      const color = isVisible ? baseColor : `${baseColor}80`; // 50% opacity for non-visible tables

      return (
        <div
          key={table.id}
          style={{
            position: 'absolute',
            left: `${adjustedX}px`,
            top: `${adjustedY}px`,
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            backgroundColor: color,
            borderRadius: table.shape === 'round' ? '50%' : '2px',
            transform: `rotate(${table.rotation}deg)`,
            transformOrigin: 'center',
            border: isVisible ? '1px solid rgba(0,0,0,0.3)' : '1px solid rgba(0,0,0,0.1)',
            zIndex: isVisible ? 2 : 1,
            boxShadow: isVisible ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
          }}
        />
      );
    });
  }, [tables, scale, minX, minY, panPosition, zoom, viewportWidth, viewportHeight]);



  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white/90 rounded-md shadow-md p-2">
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 0.7; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(0.8); opacity: 0.7; }
          }
        `}
      </style>
      <div
        className="relative border border-gray-300 bg-gray-100 cursor-pointer"
        style={{ width: minimapWidth, height: minimapHeight }}
        onClick={handleMinimapClick}
      >

        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 pointer-events-none">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-px bg-gray-200"
              style={{ left: `${(i + 1) * 25}%` }}
            />
          ))}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-px bg-gray-200"
              style={{ top: `${(i + 1) * 25}%` }}
            />
          ))}
        </div>

        {/* Tables */}
        {tables.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
            No tables
          </div>
        ) : tableElements}

        {/* Viewport indicator */}
        {(() => {

          // Calculate viewport position and size, ensuring it stays within minimap bounds
          let left = viewportRect.left;
          let top = viewportRect.top;
          let width = viewportRect.width;
          let height = viewportRect.height;

          // Adjust if viewport is partially outside minimap
          if (left < 0) {
            width += left; // Reduce width by the amount it's outside
            left = 0;
          }

          if (top < 0) {
            height += top; // Reduce height by the amount it's outside
            top = 0;
          }

          // Ensure viewport doesn't extend beyond right/bottom edges
          if (left + width > minimapWidth) {
            width = minimapWidth - left;
          }

          if (top + height > minimapHeight) {
            height = minimapHeight - top;
          }

          // Check if viewport is completely outside the minimap
          const isCompletelyOutside =
            viewportRect.left > minimapWidth ||
            viewportRect.top > minimapHeight ||
            viewportRect.left + viewportRect.width < 0 ||
            viewportRect.top + viewportRect.height < 0;

          // Only show viewport if it's at least partially visible
          if (width <= 0 || height <= 0) {
            // If viewport is completely outside, show direction indicators
            if (isCompletelyOutside) {
              // Determine which edge to show the indicator on
              let indicatorLeft = 0;
              let indicatorTop = 0;

              if (viewportRect.left > minimapWidth) {
                indicatorLeft = minimapWidth - 8; // Right edge
              } else if (viewportRect.left + viewportRect.width < 0) {
                indicatorLeft = 0; // Left edge
              } else {
                indicatorLeft = Math.max(0, Math.min(minimapWidth - 8, viewportRect.left));
              }

              if (viewportRect.top > minimapHeight) {
                indicatorTop = minimapHeight - 8; // Bottom edge
              } else if (viewportRect.top + viewportRect.height < 0) {
                indicatorTop = 0; // Top edge
              } else {
                indicatorTop = Math.max(0, Math.min(minimapHeight - 8, viewportRect.top));
              }

              return (
                <div
                  className="absolute w-2 h-2 bg-indigo-500 rounded-full"
                  style={{
                    left: `${indicatorLeft}px`,
                    top: `${indicatorTop}px`,
                    zIndex: 3,
                    animation: 'pulse 1.5s infinite ease-in-out',
                  }}
                  title="View is outside the minimap area"
                />
              );
            }
            return null;
          }

          return (
            <div
              className="absolute border-2 border-indigo-500 bg-indigo-500/20 pointer-events-none"
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${width}px`,
                height: `${height}px`,
                zIndex: 3
              }}
            />
          );
        })()}
      </div>
      <div className="text-xs text-center mt-1">
        Minimap
        <div className="text-[8px] text-gray-500 mt-1">
          Pan: {Math.round(panPosition.x)},{Math.round(panPosition.y)} | Zoom: {zoom.toFixed(1)}
        </div>
      </div>
    </div>
  );
};

export default Minimap;
