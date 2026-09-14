/** Shared by speculative imports and rendering; fulfilled modules never suspend again. */
export function createPageResource<T>(load: () => Promise<T>) {
  let state:
    | { status: 'idle' }
    | { status: 'pending'; promise: Promise<T> }
    | { status: 'ready'; value: T; promise: Promise<T> }
    | { status: 'failed'; error: unknown } = { status: 'idle' };

  function preload(): Promise<T> {
    if (state.status === 'pending' || state.status === 'ready') return state.promise;
    const promise = load().then(
      (value) => {
        state = { status: 'ready', value, promise };
        return value;
      },
      (error: unknown) => {
        state = { status: 'failed', error };
        throw error;
      },
    );
    state = { status: 'pending', promise };
    return promise;
  }
  return {
    preload,
    read(): T {
      if (state.status === 'ready') return state.value;
      if (state.status === 'failed') throw state.error;
      throw preload();
    },
    resetFailure() {
      if (state.status === 'failed') state = { status: 'idle' };
    },
  };
}
