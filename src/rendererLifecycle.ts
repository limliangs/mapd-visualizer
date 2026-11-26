/** Dispose an async renderer only after initialization, including cancelled mounts. */
export function initializeRenderer<T>(
    initialize: () => Promise<T>,
    attach: (renderer: T) => void,
    dispose: (renderer: T) => void,
    onError: (error: unknown) => void,
): () => void {
    let cancelled = false;
    let active: T | undefined;
    // Defer startup so StrictMode's immediately cancelled effect allocates no context.
    void Promise.resolve().then(async () => {
        if (cancelled) return;
        const renderer = await initialize();
        if (cancelled) { dispose(renderer); return; }
        active = renderer;
        attach(renderer);
    }).catch(error => {
        if (active !== undefined) { dispose(active); active = undefined; }
        if (!cancelled) onError(error);
    });
    return () => {
        cancelled = true;
        if (active !== undefined) { dispose(active); active = undefined; }
    };
}
