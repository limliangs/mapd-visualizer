import { Tasks } from './Tasks';
import Box from '@mui/material/Box';
import { Solution } from './Solution';
import { Graph } from './Graph';
import PixiApp from './PixiApp';
import { useState, useRef, useEffect } from 'react';

interface VisualizerProps {
  graph: Graph | null;
  solution: Solution | null;
  tasks: Tasks | null;
  onTimestepChange: (time: number) => void;
  playAnimation: boolean;
  pixiAppRef: React.MutableRefObject<{ skipBackward?: () => void; skipForward?: () => void; restart?: () => void; } | null>;
  stepSize: number;
  loopAnimation: boolean;
  showAgentId: boolean;
  tracePaths: boolean;
  setCanScreenshot: (canScreenshot: boolean) => void;
  showCellId: boolean;
  showGoals: boolean;
  showGoalVectors: boolean;
}

function Visualizer({
  graph,
  solution,
  tasks,
  onTimestepChange,
  playAnimation,
  pixiAppRef,
  stepSize,
  loopAnimation,
  showAgentId,
  tracePaths,
  setCanScreenshot,
  showCellId,
  showGoals,
  showGoalVectors,
}: VisualizerProps) {
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (boxRef.current && canvasRef.current) {
        const width = Math.max(1, boxRef.current.clientWidth);
        const height = Math.max(1, boxRef.current.clientHeight);
        setViewportSize(previous => previous?.width === width && previous.height === height ? previous : { width, height });
      }
    };
    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (boxRef.current) observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Box width="100%" height="100%" ref={boxRef}>
      <div ref={canvasRef} style={{ height: '100%', overflow: 'hidden' }}>
      {viewportSize !== null &&
        <PixiApp
          ref={pixiAppRef}
          width={viewportSize.width}
          height={viewportSize.height}
          graph={graph}
          solution={solution}
          tasks={tasks}
          onTimestepChange={onTimestepChange}
          playAnimation={playAnimation}
          stepSize={stepSize}
          loopAnimation={loopAnimation}
          showAgentId={showAgentId}
          tracePaths={tracePaths}
          setCanScreenshot={setCanScreenshot}
          showCellId={showCellId}
          showGoals={showGoals}
          showGoalVectors={showGoalVectors}
        />
      }
      </div>
    </Box>
);
}

export default Visualizer;
