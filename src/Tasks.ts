import { Coordinate, Graph } from './Graph';
export interface Task { position: Coordinate; completedAt: number; }
export type Tasks = Task[][];

export function parseTasks(text: string, graph: Graph, agentCount: number): Tasks {
    const lines = text.trim().split(/\r?\n/);
    const count = Number(lines.shift());
    if (!Number.isInteger(count) || count < 1 || count !== agentCount)
        throw new Error(`Tasks must contain ${agentCount} agents, matching the paths.`);
    const summary = lines[lines.length - 1]?.match(/^Total completed tasks:\s*(\d+)\s*$/);
    if (summary) lines.pop();
    if (lines.length !== count) throw new Error('Expected one task row per agent (in agent ID order).');
    const tasks = lines.map((line, agent) => {
        const entries: Task[] = [];
        const pattern = /\(\s*(\d+)\s*,\s*(\d+)\s*\)\s*,\s*(-?\d+)\s*,\s*;/g;
        let lastTime = -1, pending = false;
        for (const match of line.matchAll(pattern)) {
            const position = new Coordinate(Number(match[1]), Number(match[2]));
            const completedAt = Number(match[3]);
            graph.validatePosition(position);
            if (completedAt < -1 || (completedAt >= 0 && (pending || completedAt < lastTime)))
                throw new Error(`Agent ${agent}: completion times must be ordered, followed by pending (-1) goals.`);
            pending ||= completedAt === -1;
            lastTime = completedAt;
            entries.push({ position, completedAt });
        }
        if (line.replace(pattern, '').trim()) throw new Error(`Invalid task row for agent ${agent}. Expected (x,y),time,;`);
        return entries;
    });
    if (summary && Number(summary[1]) !== tasks.flat().filter(task => task.completedAt >= 0).length)
        throw new Error('Total completed tasks does not match task records.');
    return tasks;
}

// Completion at t means the next queued goal is active at t, including when scrubbing backwards.
export function currentTask(tasks: Task[], timestep: number): Task | undefined {
    return tasks.find(task => task.completedAt === -1 || task.completedAt > timestep);
}
