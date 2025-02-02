


export abstract class Model {
  _cleanups: (() => void)[] = [];
  constructor() {
    this._cleanups = [];
  }
  async dispose() {
    this._cleanups.forEach(cleanup => cleanup());
    this._cleanups = [];
  }
  addCleanup(cleanup: () => void) {
    this._cleanups.push(cleanup);
  }
}
