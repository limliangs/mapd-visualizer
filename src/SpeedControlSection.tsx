import { Stack, Box, Slider } from '@mui/material';

interface SpeedControlSectionProps {
  stepSize: number;
  onStepSizeChange: (stepSize: number) => void;
}

function SpeedControlSection({ stepSize, onStepSizeChange }: SpeedControlSectionProps) {
  const roundAndSetStepSize = (value: number) => {
    onStepSizeChange(Number(value.toFixed(1)));
  };

  const handleSliderChange = (_event: Event, value: number | number[]) => {
    if (typeof value === 'number') roundAndSetStepSize(value);
  };

  return (
    <Stack spacing={1}>
      <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Speed</Box>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Slider
          value={stepSize}
          step={0.2}
          min={0.2}
          max={10}
          valueLabelDisplay="auto"
          onChange={handleSliderChange}
          size="small"
          sx={{ flexGrow: 1 }}
        />
        <Box sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 35 }}>
          {stepSize.toFixed(1)}x
        </Box>
      </Stack>
    </Stack>
  );
}

export default SpeedControlSection;
