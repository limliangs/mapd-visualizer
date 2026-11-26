import { Stack, Box, Button, Tooltip } from '@mui/material';
import { MuiFileInput } from "mui-file-input";
import ClearIcon from '@mui/icons-material/Clear';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';

interface FilesSectionProps {
  tasksFile: File | null;
  onTasksChange: (file: File | null) => void;
  tasksError: string | null;
  mapFile: File | null;
  onMapChange: (file: File | null) => void;
  mapError: string | null;
  solutionFile: File | null;
  onSolutionChange: (file: File | null) => void;
  solutionError: string | null;
}

function FilesSection({
  tasksFile, onTasksChange, tasksError,
  mapFile,
  onMapChange,
  mapError,
  solutionFile,
  onSolutionChange,
  solutionError,
}: FilesSectionProps) {
  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Stack spacing={1.5}>
      <Stack spacing={1}>
        <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Map</Box>
        <Stack direction="row" spacing={1}>
          <MuiFileInput
            value={mapFile}
            onChange={onMapChange}
            placeholder="Select .emap or .map file"
            size="small"
            sx={{ flexGrow: 1 }}
            clearIconButtonProps={{
              title: "Clear",
              children: <ClearIcon fontSize="small" />
            }}
          />
          {mapFile && (
            <Tooltip title={`Download ${mapFile.name}`}>
              <Button
                onClick={() => downloadFile(mapFile)}
                size="small"
                variant="outlined"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <FileDownloadOutlinedIcon fontSize="small" />
              </Button>
            </Tooltip>
          )}
        </Stack>
        {mapError && <Box sx={{color: 'error.main', fontSize: '0.75rem'}}>{mapError}</Box>}
      </Stack>

      <Stack spacing={1}>
        <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 1 }}>Paths</Box>
        <Stack direction="row" spacing={1}>
          <MuiFileInput
            value={solutionFile}
            onChange={onSolutionChange}
            placeholder="Select solution file"
            size="small"
            sx={{ flexGrow: 1 }}
            clearIconButtonProps={{
              title: "Clear",
              children: <ClearIcon fontSize="small" />
            }}
          />
          {solutionFile && (
            <Tooltip title={`Download ${solutionFile.name}`}>
              <Button
                onClick={() => downloadFile(solutionFile)}
                size="small"
                variant="outlined"
                sx={{ minWidth: 'auto', px: 1 }}
              >
                <FileDownloadOutlinedIcon fontSize="small" />
              </Button>
            </Tooltip>
          )}
        </Stack>
        {solutionError && <Box sx={{color: 'error.main', fontSize: '0.75rem'}}>{solutionError}</Box>}
      </Stack>
      <Stack spacing={1}>
        <Box sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'text.secondary' }}>Tasks (optional)</Box>
        <MuiFileInput value={tasksFile} onChange={onTasksChange} disabled={!solutionFile}
          placeholder="Select tasks .txt file" size="small"
          clearIconButtonProps={{ title: 'Clear tasks', children: <ClearIcon fontSize="small" /> }} />
        {tasksError && <Box role="alert" sx={{ color: 'error.main', fontSize: '0.75rem' }}>{tasksError}</Box>}
        <Box sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>With tasks: current queued goal. Without tasks: final path position.</Box>
      </Stack>
    </Stack>
  );
}

export default FilesSection;
