import { initializeRenderer } from './rendererLifecycle';
import { Tasks, currentTask } from './Tasks';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { Graph } from './Graph';
import { Solution, Orientation, orientationToRotation } from './Solution';
import { Coordinate } from './Graph';
import { BACKGROUND_COLOR, GRID_COLOR, TEXT_COLOR, AGENT_COLORS } from './Params';

const GRID_UNIT_TO_PX: number = 100;
const FONT_SUPER_RESOLUTION_SCALE = 3;

interface PixiAppProps {
    width: number;
    height: number;
    graph: Graph | null;
    solution: Solution | null;
    tasks: Tasks | null;
    onTimestepChange: (time: number) => void;
    playAnimation: boolean;
    stepSize: number;
    loopAnimation: boolean;
    showAgentId: boolean;
    tracePaths: boolean;
    setCanScreenshot: (canScreenshot: boolean) => void;
    showCellId: boolean,
    showGoals: boolean,
    showGoalVectors: boolean,
}

const PixiApp = forwardRef(({
    width,
    height,
    graph,
    solution,
    tasks,
    onTimestepChange,
    playAnimation,
    stepSize,
    loopAnimation,
    showAgentId,
    tracePaths,
    setCanScreenshot,
    showCellId,
    showGoals,
    showGoalVectors,
}: PixiAppProps, ref) => {
    // this is a mess of state and refs, but how I got everything to work...
    // maybe someday I will clean this up or maybe someone who knows React better than me can help
    //
    // the variables that are used inside the animation callbacks must
    // be stored in refs because the callbacks are created "once" and
    // the variables are updated outside of the callbacks
    const [app, setApp] = useState<PIXI.Application | null>(null);
    const [viewport, setViewport] = useState<Viewport | null>(null);
    const hostRef = useRef<HTMLDivElement>(null);
    const [rendererError, setRendererError] = useState<string | null>(null);
    const [grid, setGrid] = useState<PIXI.Container | null>(null);
    const playAnimationRef = useRef(playAnimation);
    const timestepRef = useRef(0.0);
    const stepSizeRef = useRef(1.0);
    const loopAnimationRef = useRef(loopAnimation);
    const hudRef = useRef<PIXI.Container | null>(null);
    const timestepTextRef = useRef<PIXI.Text | null>(null);
    const showAgentIdRef = useRef(showAgentId);
    const tickerCallbackRef = useRef<() => void>(() => {});
    const agentsRef = useRef<PIXI.Container | null>(null);
    const agentPathsRef = useRef<{ full: PIXI.Container, partial: PIXI.Container }>({
        full: new PIXI.Container(),
        partial: new PIXI.Container()
    });  // same order as agentsRef
    const goalMarkersRef = useRef<PIXI.Container>(new PIXI.Container());
    const goalVectorsRef = useRef<PIXI.Container>(new PIXI.Container());

    // Scale a position from grid units to pixels
    const scalePosition = (position: number) : number => {
        return position * GRID_UNIT_TO_PX + GRID_UNIT_TO_PX / 2;
    }

    function resetTimestep() {
        timestepRef.current = 0.0;
    }

    function takeScreenshot() {
        if (app && viewport && grid && !grid.destroyed) {
            app.renderer.extract.base64(viewport).then((data) => {
                const link = document.createElement('a');
                link.download = 'screenshot.png';
                link.href = data;
                link.click();
                link.remove();
            });
        }
    }

    useImperativeHandle(ref, () => ({
        skipBackward: () => {
            timestepRef.current = Math.max(0, Math.ceil(timestepRef.current) - 1);
        },
        skipForward: () => {
            if (solution) {
                timestepRef.current = Math.min(Math.floor(timestepRef.current) + 1, solution.length - 1);
            }
        },
        restart: () => {
            resetTimestep();
        },
        fit: () => {
            fit();
        },
        takeScreenshot: () => {
            takeScreenshot();
        }
    }));

    // Fit the viewport to the grid
    const fit = useCallback(() => {
        if (viewport === null || grid === null || grid.destroyed) return;
        viewport.fitWorld();
        viewport.moveCenter(
            grid.position.x + grid.width / 2,
            grid.position.y + grid.height / 2
        );
    }, [viewport, grid]);

    const moveAndRotateSprites = useCallback((agents: PIXI.Container[], currentTime: number) => {
        if (!solution) return;

        const currentTimestep = Math.floor(currentTime);
        const interpolationProgress = currentTime - currentTimestep;
        const currentState = solution[currentTimestep];
        const nextState = solution[Math.min(currentTimestep + 1, solution.length - 1)];

        // Interpolate between current and next states
        agents.forEach((agent, index) => {
            // Show or hide agent ID
            const idText = agent.children[1];
            if (idText !== undefined) {
                idText.visible = showAgentIdRef.current;
            }

            const startPose = currentState[index];
            const endPose = nextState[index];

            // Interpolate position
            agent.x =
                startPose.position.x +
                (endPose.position.x - startPose.position.x) * interpolationProgress;
            agent.y =
                startPose.position.y +
                (endPose.position.y - startPose.position.y) * interpolationProgress;
            agent.x = scalePosition(agent.x);
            agent.y = scalePosition(agent.y);

            // orientation-aware visualization has two objects for each sprite
            const circleContainer: PIXI.Container = agent.children[0];
            if (circleContainer === undefined || circleContainer.children.length < 2) return;

            // Interpolate rotation
            const startRotation = orientationToRotation(startPose.orientation);
            const endRotation = orientationToRotation(endPose.orientation);

            circleContainer.rotation =
                startRotation +
                (endRotation - startRotation) * interpolationProgress;
        });
    }, [solution]);

    const updatePaths = useCallback((agents: PIXI.Container[], currentTime: number) => {
        if (!solution) return;

        const currentTimestep = Math.floor(currentTime);
        const interpolationProgress = currentTime - currentTimestep;


        agents.forEach((_agent, index) => {
            const agentLineStyle = {
                width: GRID_UNIT_TO_PX / 10,
                color: AGENT_COLORS[index % AGENT_COLORS.length],
                cap: "round" as const
            };

            const full_segments = agentPathsRef.current.full.children[index] as PIXI.Container
            const partial_segments = agentPathsRef.current.partial.children[index] as PIXI.Container


            while(full_segments.children.length > currentTimestep) {
                if (full_segments.children.length === 0) break;
                (full_segments.removeChildAt(full_segments.children.length - 1) as PIXI.Container).destroy();
            }
            const partial = partial_segments.children[0] as PIXI.Graphics;
            partial.clear();

            // Full segments
            while (full_segments.children.length < currentTimestep) {
                const segIndex = full_segments.children.length;
                const segment = full_segments.addChild(new PIXI.Graphics());
                segment.moveTo(
                    scalePosition(solution[segIndex][index].position.x),
                    scalePosition(solution[segIndex][index].position.y)
                );
                segment.lineTo(
                    scalePosition(solution[segIndex + 1][index].position.x),
                    scalePosition(solution[segIndex + 1][index].position.y)
                );
                segment.stroke(agentLineStyle);
            }

            // Partial segment
            if (interpolationProgress > 0 && currentTimestep < solution.length - 1) {
                const segment = partial;
            //     const segment = path.children.length === currentTimestep ? path.addChild(new PIXI.Graphics()) : path.children[currentTimestep] as PIXI.Graphics;
                segment.moveTo(
                    scalePosition(solution[currentTimestep][index].position.x),
                    scalePosition(solution[currentTimestep][index].position.y)
                );
                const interpolatedPosition = {
                    x: solution[currentTimestep][index].position.x +
                        (solution[currentTimestep + 1][index].position.x - solution[currentTimestep][index].position.x) * interpolationProgress,
                    y: solution[currentTimestep][index].position.y +
                        (solution[currentTimestep + 1][index].position.y - solution[currentTimestep][index].position.y) * interpolationProgress,
                }
                segment.lineTo(scalePosition(interpolatedPosition.x), scalePosition(interpolatedPosition.y));
                segment.stroke(agentLineStyle);
            }
        });
    }, [solution]);

    const updateGoalVectors = useCallback((agents: PIXI.Container[]) => {
        if (!solution) return;
        agents.forEach((agent, index) => {
            const goal = tasks ? currentTask(tasks[index], Math.floor(timestepRef.current))?.position : solution[solution.length - 1][index].position;
            const marker = goalMarkersRef.current.children[index];
            const vector = goalVectorsRef.current.children[index] as PIXI.Graphics;
            marker.visible = !!goal;
            vector.clear();
            if (!goal) return;
            marker.position.set(scalePosition(goal.x), scalePosition(goal.y));
            vector.moveTo(agent.x, agent.y).lineTo(scalePosition(goal.x), scalePosition(goal.y))
                .stroke({ color: AGENT_COLORS[index % AGENT_COLORS.length], width: 3, alpha: 0.7 });
        });
    }, [solution, tasks]);

    // Animate the solution
    const animateSolution = useCallback(() => {
        if (app === null || viewport === null) return;
        if (tickerCallbackRef.current) {
            app.ticker.remove(tickerCallbackRef.current);
            if (agentsRef.current) { agentsRef.current.destroy({ children: true }); agentsRef.current = null; }
            if (agentPathsRef.current) {
                agentPathsRef.current.full.removeChildren().forEach(child => child.destroy({ children: true }));
                agentPathsRef.current.partial.removeChildren().forEach(child => child.destroy({ children: true }));
            }
            if (timestepTextRef.current) timestepTextRef.current.text = "";
            if (goalMarkersRef.current) goalMarkersRef.current.removeChildren().forEach(child => child.destroy({ children: true }));
            if (goalVectorsRef.current) goalVectorsRef.current.removeChildren().forEach(child => child.destroy({ children: true }));
        }
        if (solution === null) return;
        resetTimestep();

        // Check if the solution is orientation-aware
        const orientationAware: boolean = solution[0][0].orientation !== Orientation.NONE;

        // Goal markers
        const goalMarkers = viewport.addChild(goalMarkersRef.current);
        solution[0].forEach((_pose, agentId) => {
            const marker = goalMarkers.addChild(new PIXI.Container());
            marker.addChild(new PIXI.Graphics()).rect(-38, -38, 76, 76)
                .stroke({ color: AGENT_COLORS[agentId % AGENT_COLORS.length], width: 6 });
            marker.addChild(new PIXI.Text({ text: `G${agentId}`, x: -33, y: -37,
                style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: AGENT_COLORS[agentId % AGENT_COLORS.length] } }));
        });

        // Paths
        viewport.addChild(agentPathsRef.current.full);
        viewport.addChild(agentPathsRef.current.partial);
        solution[0].forEach(() => {
            agentPathsRef.current.full.addChild(new PIXI.Container());
            agentPathsRef.current.partial.addChild(new PIXI.Container()).addChild(new PIXI.Graphics());
        });

        // Goal vectors
        const goalVectors = viewport.addChild(goalVectorsRef.current);
        solution[solution.length - 1].forEach(() => {
            goalVectors.addChild(new PIXI.Graphics());
        });

        // Agents
        const agents = viewport.addChild(new PIXI.Container());
        agentsRef.current = agents;
        solution[0].forEach((_pose, agentId) => {
            // build agent
            const agent = agents.addChild(new PIXI.Container());
            const circleContainer = agent.addChild(new PIXI.Container());
            const circle = circleContainer.addChild(new PIXI.Graphics());
            const agentColor = AGENT_COLORS[agentId % AGENT_COLORS.length];
            circle
                .circle(0, 0, GRID_UNIT_TO_PX/3)
                .fill(agentColor);
            if (orientationAware) {
                const radius = circle.width / 2;
                const triangle = circleContainer.addChild(new PIXI.Graphics());
                triangle
                    .poly([0, radius, 0, -radius, radius, 0])
                    .fill(BACKGROUND_COLOR);
            }
            const idText = agent.addChild(new PIXI.Text({
                text: `${agentId}`,
                style: {
                    fontFamily: 'Arial',
                    fontSize: circle.width / 2,
                    fill: TEXT_COLOR,
                }
            }));
            idText.style.fontSize *= FONT_SUPER_RESOLUTION_SCALE;
            idText.scale.set(1 / FONT_SUPER_RESOLUTION_SCALE, 1 / FONT_SUPER_RESOLUTION_SCALE);
            idText.x = -idText.width / 2;
            idText.y = -idText.height / 2;
        });

        const animate = () => {
            if (playAnimationRef.current === true) {
                if (timestepRef.current < solution.length - 1) {
                    const approximateFramerate = 60;
                    timestepRef.current = Math.min(solution.length - 1, timestepRef.current + stepSizeRef.current / approximateFramerate);
                } else if (loopAnimationRef.current) {
                    resetTimestep();
                }
            }

            if (timestepTextRef.current) timestepTextRef.current.text = `${timestepRef.current.toFixed(1)} / ${(solution.length - 1).toFixed(1)}`;
            onTimestepChange(Math.floor(timestepRef.current));
            moveAndRotateSprites(agents.children as PIXI.Container[], timestepRef.current);
            updatePaths(agents.children as PIXI.Container[], timestepRef.current);
            updateGoalVectors(agents.children as PIXI.Container[]);
        }
        app.ticker.add(animate);
        tickerCallbackRef.current = animate;
    }, [app, viewport, solution, moveAndRotateSprites, updatePaths, updateGoalVectors, onTimestepChange]);

    // Each async initialization owns a separate canvas/context. A stale mount can
    // never destroy the context used by the current mount (React StrictMode/HMR).
    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        setRendererError(null);
        return initializeRenderer(async () => {
            const instance = new PIXI.Application();
            await instance.init({ width: 1, height: 1, background: BACKGROUND_COLOR, antialias: true });
            return instance;
        }, instance => {
            instance.canvas.style.display = 'block';
            host.appendChild(instance.canvas);
            const view = new Viewport({ screenWidth: 1, screenHeight: 1, worldWidth: 1, worldHeight: 1, events: instance.renderer.events });
            view.drag().pinch().wheel().decelerate();
            instance.stage.addChild(view);
            const hud = instance.stage.addChild(new PIXI.Container());
            hudRef.current = hud;
            timestepTextRef.current = hud.addChild(new PIXI.Text({
                style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: TEXT_COLOR, stroke: { color: BACKGROUND_COLOR, width: 4 } },
            }));
            setApp(instance); setViewport(view);
        }, instance => {
            instance.destroy({ removeView: true }, { children: true });
        }, error => {
            setRendererError(`Could not start the map renderer: ${error instanceof Error ? error.message : String(error)}`);
        });
    }, []);

    const drawGrid = useCallback(() => {
        if (viewport === null || graph === null) return null;
        const grid = viewport.addChild(new PIXI.Container());

        for (let x: number = 0; x < graph.width; x++) {
            for (let y: number = 0; y < graph.height; y++) {
                const cellContainer = grid.addChild(new PIXI.Container());
                const cellGraphic = cellContainer.addChild(new PIXI.Graphics());
                const cellX = x * GRID_UNIT_TO_PX;
                const cellY = y * GRID_UNIT_TO_PX;
                const strokeWidth = 1;
                cellGraphic.rect(cellX, cellY, GRID_UNIT_TO_PX, GRID_UNIT_TO_PX)
                .fill(graph.obstacles.has(new Coordinate(x, y).toString()) ? GRID_COLOR :
                    graph.regions.has(new Coordinate(x, y).toString()) ? graph.regionColor(graph.regions.get(new Coordinate(x, y).toString())!) : BACKGROUND_COLOR)
                .stroke({color: 0x94a3b8, width: strokeWidth});
                if (graph.obstacles.has(new Coordinate(x, y).toString())) {
                    cellGraphic.fill({color: GRID_COLOR});
                }
                const idText = cellContainer.addChild(new PIXI.Text({
                    text: `${x + y * graph.width}`,
                    style: {
                        fontFamily: 'Arial',
                        fontSize: cellGraphic.width / 6,
                        fill: TEXT_COLOR,
                    }
                }));
                idText.style.fontSize *= FONT_SUPER_RESOLUTION_SCALE;
                idText.scale.set(1 / FONT_SUPER_RESOLUTION_SCALE, 1 / FONT_SUPER_RESOLUTION_SCALE);
                idText.x = cellX + strokeWidth;
                idText.y = cellY + strokeWidth;
                const key = new Coordinate(x, y).toString();
                const region = graph.regions.get(key);
                if (region !== undefined) {
                    const boundary = cellContainer.addChild(new PIXI.Graphics());
                    for (const [dx, dy, x1, y1, x2, y2] of [
                        [-1, 0, 0, 0, 0, 100], [1, 0, 100, 0, 100, 100],
                        [0, -1, 0, 0, 100, 0], [0, 1, 0, 100, 100, 100],
                    ]) {
                        if (graph.regions.get(new Coordinate(x + dx, y + dy).toString()) !== region)
                            boundary.moveTo(cellX + x1, cellY + y1).lineTo(cellX + x2, cellY + y2);
                    }
                    boundary.stroke({ color: 0x334155, width: 5 });
                }
                const port = graph.ports.get(key);
                if (port) {
                    const color = port.kind === 'inlet' ? 0x00695c : 0x9a3412;
                    const arrow = { '>': '→', '<': '←', '^': '↑', 'v': '↓' }[port.arrow];
                    cellContainer.addChild(new PIXI.Graphics()).roundRect(cellX + 6, cellY + 6, 88, 88, 8)
                        .fill({ color: 0xffffff, alpha: 0.85 }).stroke({ color, width: 3 });
                    cellContainer.addChild(new PIXI.Text({ text: `${arrow}\n${port.kind === 'inlet' ? 'IN' : 'OUT'}`,
                        x: cellX + 50, y: cellY + 50, anchor: 0.5,
                        style: { fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', align: 'center', fill: color, lineHeight: 34 } }));
                    cellContainer.eventMode = 'static';
                    cellContainer.on('pointerover', () => { app?.canvas.setAttribute('title', `Region ${port.region} ${port.kind} ${port.position} · peer region ${port.peerRegion}`); });
                    cellContainer.on('pointerout', () => { app?.canvas.removeAttribute('title'); });
                }

            }
        }

        viewport.worldHeight = grid.height * 1.2;
        viewport.worldWidth = grid.width * 1.2;
        return grid;
    }, [app, viewport, graph]);

    // Resize the viewport when the width or height changes
    useEffect(() => {
        if (app !== null && viewport !== null) {
            app.renderer.resize(Math.max(1, width), Math.max(1, height));
            viewport.resize(Math.max(1, width), Math.max(1, height));
            if (hudRef.current) {
                hudRef.current.children[0].x = width / 100;
                hudRef.current.children[0].y = height / 100;
            }
            fit();
        }
    }, [app, fit, viewport, width, height]);

    // Draw the grid when the graph changes
    useEffect(() => {
        if (app && viewport) {
            if (grid) grid.destroy({ children: true });
            setGrid(graph ? drawGrid() : null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [app, graph, viewport]); // Excluding 'grid' to prevent infinite loop

    // Fit the viewport and try to animate the solution when the grid or solution changes
    useEffect(() => {
        fit();
        animateSolution();
        setCanScreenshot(!!graph && !!app);
    }, [grid, graph, app, solution, animateSolution, fit, setCanScreenshot]);

    // Update the playAnimationRef when the playAnimation changes
    useEffect(() => {
        playAnimationRef.current = playAnimation;
        stepSizeRef.current = stepSize;
        loopAnimationRef.current = loopAnimation;
        showAgentIdRef.current = showAgentId;
    }, [playAnimation, stepSize, loopAnimation, showAgentId]);

    useEffect(() => {
        if (!grid || grid.destroyed) return;
        grid.children.forEach((cellContainer) => {
            const idText = cellContainer.children[1];
            if (idText) {
                idText.visible = showCellId;
            }
        });
    }, [showCellId, grid]);

    useEffect(() => {
        if (agentPathsRef.current) {
            agentPathsRef.current.full.visible = tracePaths;
            agentPathsRef.current.partial.visible = tracePaths;
        }
        if (goalMarkersRef.current) goalMarkersRef.current.visible = showGoals;
        if (goalVectorsRef.current) goalVectorsRef.current.visible = showGoalVectors;
    }, [tracePaths, showGoals, showGoalVectors]);

    return <div ref={hostRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
        {rendererError && <div role="alert" style={{ padding: 24, color: '#b91c1c', background: '#fff' }}>{rendererError}</div>}
    </div>
});

export default PixiApp;
