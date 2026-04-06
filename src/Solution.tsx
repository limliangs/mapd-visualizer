import { Coordinate } from './Graph';

export enum Orientation {
    NONE,
    X_MINUS,
    X_PLUS,
    Y_MINUS,
    Y_PLUS
}

export function orientationToRotation(o: Orientation): number {
    switch (o) {
        case Orientation.NONE: return 0;
        case Orientation.X_MINUS: return Math.PI;
        case Orientation.X_PLUS: return 0;
        case Orientation.Y_MINUS: return -Math.PI / 2;
        case Orientation.Y_PLUS: return Math.PI / 2;
    }
};

function orientationFromString(s: string): Orientation {
    switch (s) {
        case "X_MINUS": return Orientation.X_MINUS;
        case "X_PLUS": return Orientation.X_PLUS;
        case "Y_MINUS": return Orientation.Y_MINUS;
        case "Y_PLUS": return Orientation.Y_PLUS;
        default: return Orientation.NONE;
    }
}

export class Pose {
    public position: Coordinate = new Coordinate(0, 0);
    public orientation: Orientation = Orientation.NONE;
    public carrying: boolean = false;

    constructor(position: Coordinate = new Coordinate(0, 0), orientation: Orientation = Orientation.NONE, carrying: boolean = false) {
        this.position = position;
        this.orientation = orientation;
        this.carrying = carrying;
    }
}

export class Task {
    public pickup: Coordinate = new Coordinate(0, 0)
    public dropoff: Coordinate = new Coordinate(0, 0)
    public status: string = "U";

    constructor(pickup: Coordinate = new Coordinate(0, 0), dropoff: Coordinate = new Coordinate(0, 0), status: string = "U") {
        this.pickup = pickup;
        this.dropoff = dropoff;
        this.status = status;
    }
}

export type Config = Pose[];
export type Solution = Config[];
export type ConfigTasks = Task[];
export type SolutionTasks = ConfigTasks[];

export function parseSolution(text: string): [Solution, SolutionTasks] {
    const lines = text.trim().split("\n");
    const solution: Solution = [];
    const solTasks: SolutionTasks = [];

    for (const line of lines) {
        const config: Config = [];
        const configTasks: ConfigTasks = [];
        const agentSection = line.split(';T:')[0];
        const taskSection = line.split(';T:')[1];

        const pos_re = /(\((\d+),(\d+),([PCDI]),?([XY]{1}_[A-Z]{4,5})?\),)/g;
        const task_re = /\(\((\d+),(\d+)\),\((\d+),(\d+)\),([UC]|\d+)\),/g;        
        while (true) {
            const m = pos_re.exec(agentSection);
            if (m === null) break;
            if (m === null || m.length !== 6) throw new Error("Invalid solution");
            const x = Number(m[2]);
            if (x < 0) throw new Error(`Invalid solution: position ${x} is negative`);
            const y = Number(m[3]);
            if (y < 0) throw new Error(`Invalid solution: position ${y} is negative`);
            const carrying = m[4] === 'C';
            const o = orientationFromString(m[5]);
            const pose = new Pose(new Coordinate(x, y), o, carrying);
            config.push(pose);
        }
        if (config.length === 0) throw new Error("Invalid solution");
        solution.push(config);

        while (true) {
            const m = task_re.exec(taskSection);
            if (m === null) break;
            if (m === null || m.length !== 6) throw new Error("Invalid solution");
            const pickupX = Number(m[1]);
            const pickupY = Number(m[2]);
            const dropoffX = Number(m[3]);
            const dropoffY = Number(m[4]);
            const taskStatus = m[5];
            const task = new Task(new Coordinate(pickupX, pickupY), new Coordinate(dropoffX, dropoffY), taskStatus);
            configTasks.push(task);
        }

        if (configTasks.length === 0) throw new Error("Invalid solution");
        solTasks.push(configTasks);
    }
    return [solution, solTasks];
}
