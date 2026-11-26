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

    constructor(position: Coordinate = new Coordinate(0, 0), orientation: Orientation = Orientation.NONE) {
        this.position = position;
        this.orientation = orientation;
    }
}

export type Config = Pose[];
export type Solution = Config[];

export function parseSolution(text: string): Solution {
    const solution: Solution = [];
    let orientationAware: boolean | undefined;
    for (const [timestep, line] of text.trim().split(/\r?\n/).entries()) {
        const header = /^\s*(\d+)\s*:(.*)$/.exec(line);
        if (!header || Number(header[1]) !== timestep) throw new Error('Path timesteps must be consecutive, starting at 0.');
        const config: Config = [];
        const pattern = /\(\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(X_MINUS|X_PLUS|Y_MINUS|Y_PLUS)\s*)?\)\s*,?/g;
        for (const match of header[2].matchAll(pattern)) {
            const aware = !!match[3];
            orientationAware ??= aware;
            if (aware !== orientationAware) throw new Error('All poses must consistently include or omit orientation.');
            config.push(new Pose(new Coordinate(Number(match[1]), Number(match[2])), orientationFromString(match[3])));
        }
        if (!config.length || header[2].replace(pattern, '').trim()) throw new Error(`Invalid path at timestep ${timestep}.`);
        if (solution.length && config.length !== solution[0].length) throw new Error('Agent count must be the same at every timestep.');
        solution.push(config);
    }
    return solution;
}
