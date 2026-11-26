import { Graph } from './Graph';
import { parseSolution, Solution } from './Solution';
import { Divider, Stack, Box, IconButton } from '@mui/material';
import React, { useEffect } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import QuickStartSection from './QuickStartSection';
import FilesSection from './FilesSection';
import SpeedControlSection from './SpeedControlSection';
import ControlsSection from './ControlsSection';
import DisplaySection from './DisplaySection';

interface ConfigBarProps {
  graph: Graph | null;
  onGraphChange: (graph: Graph | null) => void;
  onSolutionChange: (solution: Solution | null) => void;
  onRestart: () => void;
  stepSize: number;
  onStepSizeChange: (speed: number) => void;
  loopAnimation: boolean,
  onLoopAnimationChange: (loopAnimation: boolean) => void;
  onFitView: () => void;
  showAgentId: boolean;
  onShowAgentIdChange: (showAgentId: boolean) => void;
  tracePaths: boolean;
  onTracePathsChange: (tracePaths: boolean) => void;
  canScreenshot: boolean;
  takeScreenshot: () => void;
  showCellId: boolean;
  setShowCellId: (showCellId: boolean) => void;
  showGoals: boolean;
  setShowGoals: (showGoals: boolean) => void;
  showGoalVectors: boolean;
  setShowGoalVectors: (showGoalVectors: boolean) => void;
  onCloseDrawer: () => void;
}

function ConfigBar({
  graph,
  onGraphChange,
  onSolutionChange,
  onRestart,
  stepSize,
  onStepSizeChange,
  loopAnimation,
  onLoopAnimationChange,
  onFitView,
  showAgentId,
  onShowAgentIdChange,
  tracePaths,
  onTracePathsChange,
  canScreenshot,
  takeScreenshot,
  showCellId,
  setShowCellId,
  showGoals,
  setShowGoals,
  showGoalVectors,
  setShowGoalVectors,
  onCloseDrawer,
}: ConfigBarProps) {
  const repoName = "JustinShetty/mapf-visualizer";
  const [mapFile, setMapFile] = React.useState<File | null>(null);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [solutionFile, setSolutionFile] = React.useState<File | null>(null);
  const [solutionError, setSolutionError] = React.useState<string | null>(null);

  const blurActiveElement = () => {
    // Blur (remove focus from) the file input
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  const handleLoadDemo = (mapName: string) => {
    fetch(`${import.meta.env.BASE_URL}/${mapName}.map`)
      .then((response) => response.text())
      .then((text) => {
        handleMapChange(new File([text], `${mapName}.map`));
        return fetch(`${import.meta.env.BASE_URL}/demo_${mapName}.txt`);
      })
      .then((response) => response.text())
      .then((text) => {
        handleSolutionChange(new File([text], `demo_${mapName}.txt`));
      });
  };

  useEffect(() => {
    let cancelled = false;
    onGraphChange(null);
    setMapError(null);
    if (mapFile) void mapFile.text().then(text => {
      if (!cancelled) onGraphChange(new Graph(text));
    }).catch(error => { if (!cancelled) setMapError(String(error)); });
    return () => { cancelled = true; };
  }, [mapFile, onGraphChange]);

  useEffect(() => {
    let cancelled = false;
    onSolutionChange(null);
    setSolutionError(null);
    if (graph && solutionFile) void solutionFile.text().then(text => {
      if (cancelled) return;
      const parsed = parseSolution(text);
      parsed.forEach(config => config.forEach(pose => graph.validatePosition(pose.position)));
      onSolutionChange(parsed);
    }).catch(error => { if (!cancelled) setSolutionError(String(error)); });
    return () => { cancelled = true; };
  }, [graph, solutionFile, onSolutionChange]);

  const handleMapChange = (newValue: File | null) => {
    setMapFile(newValue);
    setSolutionFile(null);
    blurActiveElement();
  };

  const handleSolutionChange = (newValue: File | null) => {
    setSolutionFile(newValue);
    blurActiveElement();
  };

  return (
    <Stack direction="column" spacing={2.5} sx={{padding: 2.5, height: '100%'}} >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -1, mr: -1 }}>
        <IconButton onClick={onCloseDrawer} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <QuickStartSection onLoadDemo={handleLoadDemo} />

      <Divider sx={{ opacity: 0.5 }} />

      <FilesSection
        mapFile={mapFile}
        onMapChange={handleMapChange}
        mapError={mapError}
        solutionFile={solutionFile}
        onSolutionChange={handleSolutionChange}
        solutionError={solutionError}
      />

      <Divider sx={{ opacity: 0.5 }} />

      <SpeedControlSection
        stepSize={stepSize}
        onStepSizeChange={onStepSizeChange}
      />

      <Divider sx={{ opacity: 0.5 }} />

      <ControlsSection
        onRestart={onRestart}
        loopAnimation={loopAnimation}
        onLoopAnimationChange={onLoopAnimationChange}
        onFitView={onFitView}
        canScreenshot={canScreenshot}
        takeScreenshot={takeScreenshot}
      />

      <Divider sx={{ opacity: 0.5 }} />

      <DisplaySection
        showAgentId={showAgentId}
        onShowAgentIdChange={onShowAgentIdChange}
        showCellId={showCellId}
        setShowCellId={setShowCellId}
        tracePaths={tracePaths}
        onTracePathsChange={onTracePathsChange}
        showGoals={showGoals}
        setShowGoals={setShowGoals}
        showGoalVectors={showGoalVectors}
        setShowGoalVectors={setShowGoalVectors}
      />

      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      <Box sx={{ py: 1 }}>
        <a
          target="_blank"
          href={`https://github.com/${repoName}`}
          style={{
            color: 'inherit',
            textDecoration: 'none',
            fontSize: '0.875rem',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {repoName}
        </a>
      </Box>
    </Stack>
  );
}

export default ConfigBar;
