import React, { useState, useRef, useEffect } from 'react';
import { AppFlow, Screen, FlowStep } from '../utils/screenStore';

// Interfaces for our component
interface Position {
  x: number;
  y: number;
}

interface NodePosition {
  id: string;
  position: Position;
  step: FlowStep;
  screenName?: string;
  isFirstStep?: boolean;
  isLastStep?: boolean;
}

interface UserJourneyFlowDiagramProps {
  appFlow: AppFlow;
  screens: Screen[];
  onAddStep?: () => void;
  onDeleteStep?: (stepId: string) => void;
}

const UserJourneyFlowDiagram: React.FC<UserJourneyFlowDiagramProps> = ({ 
  appFlow, 
  screens, 
  onAddStep, 
  onDeleteStep 
}) => {
  // State for node positions, pan position, zoom level, and dragging
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [boardPosition, setBoardPosition] = useState<Position>({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [draggingBoard, setDraggingBoard] = useState<boolean>(false);
  const [startDragPos, setStartDragPos] = useState<Position | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize node positions
  useEffect(() => {
    if (appFlow.steps.length === 0) return;

    // Create initial positions with proper spacing
    const horizontalSpacing = 400; // Increased from 300 for better separation
    const positions: NodePosition[] = [];
    
    // Calculate initial board position to center the flow
    const boardWidth = boardRef.current?.clientWidth || 1000;
    const totalFlowWidth = appFlow.steps.length * horizontalSpacing;
    const initialX = Math.max(50, (boardWidth - totalFlowWidth) / 2); // Ensure minimum margin
    
    // Add step nodes - no separate start/end nodes
    appFlow.steps.forEach((step, index) => {
      const screenName = step.screenId 
        ? screens.find(s => s.id === step.screenId)?.name 
        : undefined;
      
      positions.push({
        id: step.id,
        position: { 
          x: initialX + index * horizontalSpacing, 
          y: 150 
        },
        step,
        screenName,
        isFirstStep: index === 0,
        isLastStep: index === appFlow.steps.length - 1
      });
    });

    setNodePositions(positions);
  }, [appFlow, screens]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle mouse down on a node to start dragging
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    setStartDragPos({ x: e.clientX, y: e.clientY });
  };

  // Handle mouse down on the board to start panning
  const handleBoardMouseDown = (e: React.MouseEvent) => {
    // Only start dragging the board if we're not dragging a node
    if (draggingNodeId === null) {
      setDraggingBoard(true);
      setStartDragPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse move for dragging nodes or panning the board
  const handleMouseMove = (e: React.MouseEvent) => {
    if (startDragPos === null) return;

    const dx = e.clientX - startDragPos.x;
    const dy = e.clientY - startDragPos.y;

    if (draggingNodeId) {
      // Update node position
      setNodePositions(prevPositions => 
        prevPositions.map(node => 
          node.id === draggingNodeId
            ? { 
                ...node, 
                position: { 
                  x: node.position.x + dx / zoomLevel, 
                  y: node.position.y + dy / zoomLevel 
                } 
              }
            : node
        )
      );
      setStartDragPos({ x: e.clientX, y: e.clientY });
    } else if (draggingBoard) {
      // Pan the board
      setBoardPosition(prev => ({
        x: prev.x + dx / zoomLevel,
        y: prev.y + dy / zoomLevel
      }));
      setStartDragPos({ x: e.clientX, y: e.clientY });
    }
  };

  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setDraggingNodeId(null);
    setDraggingBoard(false);
    setStartDragPos(null);
  };

  // Handle zoom with mouse wheel - completely rewritten to match Miro/Mural behavior
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default browser behavior and stop propagation to parent elements
    e.preventDefault();
    e.stopPropagation();
    
    // Get the board's bounding rectangle
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Get cursor position relative to the board
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Ensure the cursor is within the board bounds
    if (cursorX < 0 || cursorX > rect.width || cursorY < 0 || cursorY > rect.height) {
      return; // Ignore wheel events outside the board
    }
    
    // Calculate cursor position in the virtual space (before zoom)
    const virtualX = (cursorX - boardPosition.x) / zoomLevel;
    const virtualY = (cursorY - boardPosition.y) / zoomLevel;
    
    // Determine new zoom level (more gradual for smoother zooming)
    const zoomDelta = e.deltaY > 0 ? 0.9 : 1.1; // Zoom out or in
    const newZoomLevel = Math.max(0.3, Math.min(2.5, zoomLevel * zoomDelta));
    
    // Calculate new board position to keep cursor over the same virtual point
    const newBoardX = cursorX - virtualX * newZoomLevel;
    const newBoardY = cursorY - virtualY * newZoomLevel;
    
    // Apply the new zoom level and board position
    setZoomLevel(newZoomLevel);
    setBoardPosition({
      x: newBoardX,
      y: newBoardY
    });
  };

  // Handle zoom in button click - improved to zoom toward center
  const handleZoomIn = () => {
    const newZoomLevel = Math.min(2.5, zoomLevel * 1.2);
    
    if (!boardRef.current) return;
    
    // Get the center of the board
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate the virtual point at the center
    const virtualCenterX = (centerX - boardPosition.x) / zoomLevel;
    const virtualCenterY = (centerY - boardPosition.y) / zoomLevel;
    
    // Calculate new board position to keep center at the same virtual point
    const newBoardX = centerX - virtualCenterX * newZoomLevel;
    const newBoardY = centerY - virtualCenterY * newZoomLevel;
    
    setZoomLevel(newZoomLevel);
    setBoardPosition({
      x: newBoardX,
      y: newBoardY
    });
  };

  // Handle zoom out button click - improved to zoom toward center
  const handleZoomOut = () => {
    const newZoomLevel = Math.max(0.3, zoomLevel * 0.8);
    
    if (!boardRef.current) return;
    
    // Get the center of the board
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate the virtual point at the center
    const virtualCenterX = (centerX - boardPosition.x) / zoomLevel;
    const virtualCenterY = (centerY - boardPosition.y) / zoomLevel;
    
    // Calculate new board position to keep center at the same virtual point
    const newBoardX = centerX - virtualCenterX * newZoomLevel;
    const newBoardY = centerY - virtualCenterY * newZoomLevel;
    
    setZoomLevel(newZoomLevel);
    setBoardPosition({
      x: newBoardX,
      y: newBoardY
    });
  };

  // Reset the view to default - improved with animation
  const resetView = () => {
    if (!boardRef.current) return;
    
    const rect = boardRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Find the center of all nodes
    if (nodePositions.length > 0) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      
      nodePositions.forEach(node => {
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + 300); // Node width
        minY = Math.min(minY, node.position.y);
        maxY = Math.max(maxY, node.position.y + 120); // Approximate node height
      });
      
      const nodesWidth = maxX - minX;
      const nodesHeight = maxY - minY;
      const nodesCenterX = minX + nodesWidth / 2;
      const nodesCenterY = minY + nodesHeight / 2;
      
      // Calculate zoom to fit all nodes with some padding
      const zoomX = (rect.width - 100) / nodesWidth;
      const zoomY = (rect.height - 100) / nodesHeight;
      const newZoom = Math.min(1, Math.min(zoomX, zoomY));
      
      // Calculate board position to center nodes
      const newBoardX = centerX - nodesCenterX * newZoom;
      const newBoardY = centerY - nodesCenterY * newZoom;
      
      setZoomLevel(newZoom);
      setBoardPosition({
        x: newBoardX,
        y: newBoardY
      });
    } else {
      // Default reset if no nodes
      setZoomLevel(1);
      setBoardPosition({ x: 0, y: 0 });
    }
  };

  // Handle dropdown toggle for a node
  const toggleDropdown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setActiveDropdownId(activeDropdownId === nodeId ? null : nodeId);
  };

  // Handle delete step
  const handleDeleteStep = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    if (onDeleteStep) {
      onDeleteStep(stepId);
    }
    setActiveDropdownId(null);
  };

  // Generate SVG paths connecting nodes
  const generatePaths = () => {
    if (nodePositions.length < 2) return null;
    
    return nodePositions.slice(0, -1).map((node, index) => {
      const nextNode = nodePositions[index + 1];
      
      const startX = node.position.x + 150; // Right of current node
      const startY = node.position.y + 60; // Middle of current node
      
      const endX = nextNode.position.x; // Left of next node
      const endY = nextNode.position.y + 60; // Middle of next node
      
      const midX = (startX + endX) / 2;
      
      // Path with curved lines
      const path = `
        M ${startX} ${startY}
        C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}
      `;
      
      return (
        <g key={`path-${node.id}-${nextNode.id}`}>
          {/* Shadow path for depth effect */}
          <path 
            d={path}
            stroke="rgba(0,0,0,0.05)"
            strokeWidth="4"
            fill="none"
            strokeDasharray="0"
            transform="translate(2, 2)"
          />
          {/* Main path */}
          <path 
            d={path}
            stroke="#0F533A"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="0"
            markerEnd="url(#arrowhead)"
            className="transition-all duration-300"
          />
        </g>
      );
    });
  };

  // Determine node color based on position in flow
  const getNodeStyles = (node: NodePosition) => {
    if (node.isFirstStep) {
      return {
        className: 'bg-gradient-to-br from-blue-400 to-blue-600 text-white',
        iconName: 'play',
        label: 'Start'
      };
    }
    if (node.isLastStep) {
      return {
        className: 'bg-gradient-to-br from-purple-400 to-purple-600 text-white',
        iconName: 'flag',
        label: 'End'
      };
    }
    return {
      className: 'bg-gradient-to-br from-white to-gray-50',
      iconName: 'steps',
      label: ''
    };
  };

  // Render icon for step
  const renderStepIcon = (iconName: string) => {
    if (iconName === 'play') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 3L19 12L5 21V3Z" fill="currentColor" />
        </svg>
      );
    } else if (iconName === 'flag') {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 15H20L15 9L20 3H4V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    } else {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 12H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 18H3.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-6 sm:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-[#0F533A] mr-2"></div>
          <h2 className="text-xl font-semibold text-[#111827]">User Journey Flow Diagram</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddStep}
            className="inline-flex items-center justify-center bg-[#0F533A] text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-[#0F533A]/90 transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add Step
          </button>
          <div className="h-5 border-l border-gray-300 mx-1"></div>
          <button
            onClick={handleZoomOut}
            className="inline-flex items-center justify-center bg-[#0F533A]/10 text-[#0F533A] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#0F533A]/20 transition-colors"
            aria-label="Zoom out"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="text-sm font-medium text-gray-700">
            {Math.round(zoomLevel * 100)}%
          </div>
          <button
            onClick={handleZoomIn}
            className="inline-flex items-center justify-center bg-[#0F533A]/10 text-[#0F533A] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#0F533A]/20 transition-colors"
            aria-label="Zoom in"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={resetView}
            className="inline-flex items-center justify-center bg-[#0F533A]/10 text-[#0F533A] px-3 py-1 rounded-lg text-sm font-medium hover:bg-[#0F533A]/20 transition-colors"
            aria-label="Reset view"
          >
            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Reset
          </button>
        </div>
      </div>
      
      <div 
        ref={boardRef}
        className="relative w-full h-[500px] overflow-hidden border border-gray-200 rounded-lg bg-gray-50"
        style={{ 
          cursor: draggingBoard ? 'grabbing' : 'grab',
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px), radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: `${20 * zoomLevel}px ${20 * zoomLevel}px`,
          backgroundPosition: `0 0, ${10 * zoomLevel}px ${10 * zoomLevel}px`,
          WebkitUserSelect: 'none', /* Safari */
          MozUserSelect: 'none', /* Firefox */
          msUserSelect: 'none', /* IE10+/Edge */
          userSelect: 'none' /* Standard */
        }}
        onMouseDown={handleBoardMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${boardPosition.x}px, ${boardPosition.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
          }}
        >
          {/* SVG for paths */}
          <svg
            width="5000"
            height="5000"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#0F533A" />
              </marker>
            </defs>
            {generatePaths()}
          </svg>
          
          {/* Render Nodes */}
          {nodePositions.map((node, index) => {
            const nodeStyle = getNodeStyles(node);
            const isFirstOrLast = Boolean(node.isFirstStep || node.isLastStep);
            
            return (
              <div
                key={node.id}
                className={`absolute select-none rounded-lg ${nodeStyle.className} border border-gray-200 shadow-lg p-5 w-[300px] cursor-move transition-transform duration-200 hover:scale-105 group`}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  zIndex: draggingNodeId === node.id ? 10 : 1,
                  boxShadow: draggingNodeId === node.id ? 
                    '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 
                    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              >
                {/* Three-dot menu - visible only on hover */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="relative">
                    <button
                      className={`p-1.5 rounded-full ${
                        isFirstOrLast 
                          ? 'bg-white/30 hover:bg-white/40' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      } transition-colors`}
                      onClick={(e) => toggleDropdown(e, node.id)}
                      aria-label="Options menu"
                    >
                      <svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke={isFirstOrLast ? 'white' : '#374151'}
                        strokeWidth="2.5"
                      >
                        <path 
                          d="M12 12V12.01M12 5V5.01M12 19V19.01" 
                          stroke="currentColor" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                      </svg>
                    </button>
                    
                    {/* Dropdown menu */}
                    {activeDropdownId === node.id && (
                      <div 
                        className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg z-50 py-1 border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium"
                          onClick={(e) => handleDeleteStep(e, node.id)}
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none">
                            <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 11V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M14 11V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M4 7H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 7L9.6445 3.83886C9.87407 3.32047 10.4111 3 11 3H13C13.5889 3 14.1259 3.32047 14.3555 3.83886L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Delete Step
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center mb-3">
                  <div className={`mr-2 p-1 rounded ${isFirstOrLast ? 'bg-white/20' : 'bg-[#0F533A]/10'}`}>
                    {renderStepIcon(nodeStyle.iconName)}
                  </div>
                  <div className={`text-xs font-semibold ${isFirstOrLast ? 'text-white' : 'text-[#0F533A]'}`}>
                    {nodeStyle.label || `Step ${index + 1}`}
                  </div>
                </div>
                
                <div className={`text-base font-medium ${isFirstOrLast ? 'text-white' : 'text-[#111827]'} mb-2`}>
                  {node.step.description}
                </div>
                
                {node.screenName && (
                  <div className="mt-3 flex items-center">
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" 
                         stroke={isFirstOrLast ? 'white' : '#0F533A'}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
                    </svg>
                    <div className="text-sm rounded inline-block" 
                        style={{color: isFirstOrLast ? 'rgba(255,255,255,0.9)' : '#0F533A'}}>
                      {node.screenName}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 flex justify-center items-center">
        <div className="text-sm text-gray-500 flex items-center">
          <svg className="w-4 h-4 mr-2 text-[#0F533A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Drag boxes to reposition • Mouse wheel zooms at cursor position • Drag background to pan
        </div>
      </div>
    </div>
  );
};

export default UserJourneyFlowDiagram; 