import { Stack, Box, Checkbox } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import LooksOneOutlinedIcon from '@mui/icons-material/LooksOneOutlined';
import DirectionsOutlinedIcon from '@mui/icons-material/DirectionsOutlined';
import OutlinedFlagIcon from '@mui/icons-material/OutlinedFlag';
import PolylineOutlinedIcon from '@mui/icons-material/PolylineOutlined';

interface DisplaySectionProps {
  showAgentId: boolean;
  onShowAgentIdChange: (showAgentId: boolean) => void;
  showCellId: boolean;
  setShowCellId: (showCellId: boolean) => void;
  tracePaths: boolean;
  onTracePathsChange: (tracePaths: boolean) => void;
  showGoals: boolean;
  setShowGoals: (showGoals: boolean) => void;
  showGoalVectors: boolean;
  setShowGoalVectors: (showGoalVectors: boolean) => void;
}

function DisplaySection({
  showAgentId,
  onShowAgentIdChange,
  showCellId,
  setShowCellId,
  tracePaths,
  onTracePathsChange,
  showGoals,
  setShowGoals,
  showGoalVectors,
  setShowGoalVectors,
}: DisplaySectionProps) {
  return (
    <Stack spacing={1}>
      <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Display</Box>
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => onShowAgentIdChange(!showAgentId)}>
          <Checkbox size="small" checked={showAgentId} onChange={(e) => onShowAgentIdChange(e.target.checked)} sx={{ py: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.875rem' }}>
            <SmartToyOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            Agent IDs
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setShowCellId(!showCellId)}>
          <Checkbox size="small" checked={showCellId} onChange={(e) => setShowCellId(e.target.checked)} sx={{ py: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.875rem' }}>
            <LooksOneOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            Cell IDs
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => onTracePathsChange(!tracePaths)}>
          <Checkbox size="small" checked={tracePaths} onChange={(e) => onTracePathsChange(e.target.checked)} sx={{ py: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.875rem' }}>
            <DirectionsOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            Paths
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setShowGoals(!showGoals)}>
          <Checkbox size="small" checked={showGoals} onChange={(e) => setShowGoals(e.target.checked)} sx={{ py: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.875rem' }}>
            <OutlinedFlagIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            Goals
          </Box>
        </Stack>

        <Stack direction="row" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => setShowGoalVectors(!showGoalVectors)}>
          <Checkbox size="small" checked={showGoalVectors} onChange={(e) => setShowGoalVectors(e.target.checked)} sx={{ py: 0.5 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.875rem' }}>
            <PolylineOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            Vectors
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}

export default DisplaySection;
