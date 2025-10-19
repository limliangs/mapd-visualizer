import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import ConfigBar from './ConfigBar';
import AnimationControl from './AnimationControl';
import Visualizer from './Visualizer';
import { Graph } from './Graph';
import { Solution } from './Solution';
import React, { useCallback } from 'react';
import { StrictMode, useRef } from 'react';

function App() {
  const pixiAppRef = useRef<{
    skipBackward?: () => void;
    skipForward?: () => void;
    restart?: () => void;
    fit?: () => void;
    takeScreenshot?: () => void;
  }>(null);

  const [graph, setGraph] = React.useState<Graph | null>(null);
  const [solution, setSolution] = React.useState<Solution | null>(null);
  const [playAnimation, setPlayAnimation] = React.useState<boolean>(true);
  const [stepSize, setStepSize] = React.useState<number>(1.0);
  const [loopAnimation, setLoopAnimation] = React.useState<boolean>(true);
  const [showAgentId, setShowAgentId] = React.useState<boolean>(false);
  const [tracePaths, setTracePaths] = React.useState<boolean>(true);
  const [canScreenshot, setCanScreenshot] = React.useState<boolean>(true);
  const [showCellId, setShowCellId] = React.useState<boolean>(false);
  const [showGoals, setShowGoals] = React.useState<boolean>(true);
  const [showGoalVectors, setShowGoalVectors] = React.useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = React.useState<boolean>(true);

  const onSkipBackward = () => {
    if (pixiAppRef.current?.skipBackward) {
      pixiAppRef.current.skipBackward();
    }
  }

  const onSkipForward = () => {
    if (pixiAppRef.current?.skipForward) {
      pixiAppRef.current.skipForward();
    }
  }

  const onRestart = () => {
    if (pixiAppRef.current?.restart) {
      pixiAppRef.current.restart();
    }
  }

  const onFitView = () => {
    if (pixiAppRef.current?.fit) {
      pixiAppRef.current.fit();
    }
  }

  const onTakeScreenshot = () => {
    if (pixiAppRef.current?.takeScreenshot) {
      pixiAppRef.current.takeScreenshot();
    }
  }

  return (
    <StrictMode>
    <Box sx={{ flexGrow: 1, position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Visualizer
          pixiAppRef = {pixiAppRef}
          graph={graph}
          solution={solution}
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
      </Box>

      <AnimationControl
        playAnimation={playAnimation}
        onPlayChange={setPlayAnimation}
        onSkipBackward={onSkipBackward}
        onSkipForward={onSkipForward}
        onOpenDrawer={() => setDrawerOpen(true)}
        onRestart={onRestart}
        stepSize={stepSize}
        onStepSizeChange={setStepSize}
        loopAnimation={loopAnimation}
        onLoopAnimationChange={setLoopAnimation}
        onFitView={onFitView}
        showAgentId={showAgentId}
        onShowAgentIdChange={setShowAgentId}
        tracePaths={tracePaths}
        onTracePathsChange={setTracePaths}
        canScreenshot={canScreenshot}
        takeScreenshot={onTakeScreenshot}
        showCellId={showCellId}
        setShowCellId={setShowCellId}
        showGoals={showGoals}
        setShowGoals={setShowGoals}
        showGoalVectors={showGoalVectors}
        setShowGoalVectors={setShowGoalVectors}
      />

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        keepMounted
        sx={{
          '& .MuiDrawer-paper': {
            width: 420,
            backgroundColor: 'background.default',
          },
        }}
      >
        <ConfigBar
          graph={graph}
          onGraphChange={useCallback((graph: Graph | null) => setGraph(graph), [])}
          onSolutionChange={useCallback((solution: Solution | null) => setSolution(solution), [])}
          onRestart={onRestart}
          stepSize={stepSize}
          onStepSizeChange={setStepSize}
          loopAnimation={loopAnimation}
          onLoopAnimationChange={setLoopAnimation}
          onFitView={onFitView}
          showAgentId={showAgentId}
          onShowAgentIdChange={setShowAgentId}
          tracePaths={tracePaths}
          onTracePathsChange={setTracePaths}
          canScreenshot={canScreenshot}
          takeScreenshot={onTakeScreenshot}
          showCellId={showCellId}
          setShowCellId={setShowCellId}
          showGoals={showGoals}
          setShowGoals={setShowGoals}
          showGoalVectors={showGoalVectors}
          setShowGoalVectors={setShowGoalVectors}
          onCloseDrawer={() => setDrawerOpen(false)}
        />
      </Drawer>
    </Box>
    </StrictMode>
  );
}

export default App;
