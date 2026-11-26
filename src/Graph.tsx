export class Coordinate {
    constructor(public x: number, public y: number) {}
    toString() { return `(${this.x}, ${this.y})`; }
}

export const REGION_COLORS = [0xdbeafe, 0xfef3c7, 0xdcfce7, 0xf3e8ff, 0xffe4e6, 0xccfbf1, 0xffedd5, 0xe0e7ff, 0xecfccb, 0xfae8ff];
export interface Port {
    position: Coordinate;
    kind: 'inlet' | 'outlet';
    arrow: string;
    region: string;
    peerRegion: string;
}
const DIRECTIONS: Record<string, [number, number]> = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };

export class Graph {
    public width: number;
    public height: number;
    public obstacles = new Map<string, boolean>();
    public regions = new Map<string, string>();
    public regionIds: string[] = [];
    public ports = new Map<string, Port>();

    constructor(fileContent: string) {
        const lines = fileContent.trim().split(/\r?\n/).map(line => line.trim());
        this.height = Number(/^height\s+(\d+)$/.exec(lines[1] ?? '')?.[1]);
        this.width = Number(/^width\s+(\d+)$/.exec(lines[2] ?? '')?.[1]);
        if (lines[0] !== 'type octile' || lines[3] !== 'map' || !this.width || !this.height)
            throw new Error('Invalid map header: expected type octile, height, width, map.');
        const end = 4 + this.height;
        const terrain = lines.slice(4, end);
        const hasRegions = lines.length > end;
        if (hasRegions && (lines[end] !== 'regions' || lines.length !== end + 1 + this.height))
            throw new Error('Expected a regions block with exactly height rows.');
        const regions = hasRegions ? lines.slice(end + 1) : [];
        if (terrain.length !== this.height || [...terrain, ...regions].some(row => row.length !== this.width))
            throw new Error('Map/regions dimensions do not match width and height.');
        for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
            const key = new Coordinate(x, y).toString();
            const char = terrain[y][x];
            if (!'.GS<>^v@OTW'.includes(char)) throw new Error(`Unknown terrain '${char}' at ${key}.`);
            if ('@OTW'.includes(char)) this.obstacles.set(key, true);
            if (hasRegions && !this.obstacles.has(key)) {
                const region = regions[y][x];
                if (!/\d/.test(region)) throw new Error(`Missing numeric region at ${key}.`);
                this.regions.set(key, region);
            }
        }
        this.regionIds = [...new Set(this.regions.values())].sort();
        for (let y = 0; y < this.height; y++) for (let x = 0; x < this.width; x++) {
            const arrow = terrain[y][x];
            if (!(arrow in DIRECTIONS)) continue;
            const position = new Coordinate(x, y);
            const region = this.regions.get(position.toString());
            if (region === undefined) throw new Error(`Port ${position} requires a regions block.`);
            const [dx, dy] = DIRECTIONS[arrow];
            const matches = (sign: number) => {
                const px = x + dx * sign, py = y + dy * sign;
                const peerRegion = this.regions.get(new Coordinate(px, py).toString());
                return terrain[py]?.[px] === arrow && peerRegion !== undefined && peerRegion !== region;
            };
            const forward = matches(1), backward = matches(-1);
            if (forward === backward) throw new Error(`Port ${position} needs exactly one same-arrow peer in another region.`);
            const sign = forward ? 1 : -1;
            this.ports.set(position.toString(), {
                position, arrow, region, kind: forward ? 'outlet' : 'inlet',
                peerRegion: this.regions.get(new Coordinate(x + dx * sign, y + dy * sign).toString())!,
            });
        }
    }
    regionColor(region: string) { return REGION_COLORS[this.regionIds.indexOf(region) % REGION_COLORS.length]; }
    validatePosition(position: Coordinate) {
        if (position.x < 0 || position.y < 0 || position.x >= this.width || position.y >= this.height)
            throw new Error(`Position ${position} is out of bounds.`);
        if (this.obstacles.has(position.toString())) throw new Error(`Position ${position} is on an obstacle.`);
    }
}
