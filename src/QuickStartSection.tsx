import { Stack, Button, Box } from '@mui/material';

interface QuickStartSectionProps {
  onLoadDemo: (mapName: string) => void;
}

function QuickStartSection({ onLoadDemo }: QuickStartSectionProps) {
  return (
    <Stack spacing={1}>
      <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Quick Start</Box>
      <Stack direction="row" spacing={1}>
        <Button
          variant="outlined"
          onClick={() => onLoadDemo("2x2")}
          size="small"
          sx={{ flex: 1, textTransform: 'none' }}
        >
          2x2
        </Button>
        <Button
          variant="outlined"
          onClick={() => onLoadDemo("random-32-32-20")}
          size="small"
          sx={{ flex: 1, textTransform: 'none' }}
        >
          32x32
        </Button>
      </Stack>
    </Stack>
  );
}

export default QuickStartSection;
