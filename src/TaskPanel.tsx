import { Box, Chip, Stack, Typography } from '@mui/material';
import { Graph } from './Graph';
import { Tasks, currentTask } from './Tasks';
import { AGENT_COLORS } from './Params';
const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`;

export default function TaskPanel({ graph, tasks, timestep }: { graph: Graph | null; tasks: Tasks | null; timestep: number }) {
    if (!graph) return null;
    return <Box sx={{ flexShrink: 0, maxHeight: '30vh', mx: 2, my: 1, overflow: 'auto', p: 1.5, borderRadius: 2, bgcolor: 'rgba(18,18,18,.92)' }}>
        <Typography variant="subtitle2">MAPD · timestep {timestep}</Typography>
        <Stack direction="row" useFlexGap flexWrap="wrap" gap={0.5} sx={{ my: 1 }}>
            {graph.regionIds.map(id => <Chip key={id} size="small" label={`Region ${id}`} sx={{ bgcolor: hex(graph.regionColor(id)), color: '#182230' }} />)}
        </Stack>
        {graph.ports.size > 0 && <Typography variant="caption" component="p">IN = inlet · OUT = outlet<br />Arrows show transfer direction across boundaries.</Typography>}
        {tasks ? <>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Current goals</Typography>
            {tasks.map((queue, agent) => {
                const goal = currentTask(queue, timestep);
                const completed = queue.filter(task => task.completedAt >= 0 && task.completedAt <= timestep).length;
                return <Typography key={agent} variant="body2" sx={{ my: 0.5 }}>
                    <span style={{ color: hex(AGENT_COLORS[agent % AGENT_COLORS.length]) }}>● Agent {agent}</span>
                    {' → '}{goal ? `${goal.position} · R${graph.regions.get(goal.position.toString()) ?? '—'}` : 'All tasks complete'}
                    <Typography component="span" variant="caption" color="text.secondary"> · {completed}/{queue.length}</Typography>
                </Typography>;
            })}
        </> : <Typography variant="caption">Load tasks to show current goals.<br />Goal markers currently show path endpoints.</Typography>}
    </Box>;
}
