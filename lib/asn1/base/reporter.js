export class Reporter {
  constructor(options) {
    this._reporterState = {
      obj: null,
      path: [],
      options: options || {},
      errors: []
    };
  }

  isError(obj) {
    return obj instanceof ReporterError;
  };

  save() {
    const state = this._reporterState;

    return { obj: state.obj, pathLen: state.path.length };
  };

  restore(data) {
    const state = this._reporterState;

    state.obj = data.obj;
    state.path = state.path.slice(0, data.pathLen);
  };

  enterKey(key) {
    return this._reporterState.path.push(key);
  };

  exitKey(index) {
    const state = this._reporterState;

    state.path = state.path.slice(0, index - 1);
  };

  leaveKey(index, key, value) {
    const state = this._reporterState;

    this.exitKey(index);
    if (state.obj !== null)
      state.obj[key] = value;
  };

  path() {
    return this._reporterState.path.join('/');
  };

  enterObject() {
    const state = this._reporterState;

    const prev = state.obj;
    state.obj = {};
    return prev;
  };

  leaveObject(prev) {
    const state = this._reporterState;

    const now = state.obj;
    state.obj = prev;
    return now;
  };

  error(msg) {
    let err;
    const state = this._reporterState;

    const inherited = msg instanceof ReporterError;
    if (inherited) {
      err = msg;
    } else {
      err = new ReporterError(state.path.map(function(elem) {
        return '[' + JSON.stringify(elem) + ']';
      }).join(''), msg.message || msg, msg.stack);
    }

    if (!state.options.partial)
      throw err;

    if (!inherited)
      state.errors.push(err);

    return err;
  };

  wrapResult(result) {
    const state = this._reporterState;
    if (!state.options.partial)
      return result;

    return {
      result: this.isError(result) ? null : result,
      errors: state.errors
    };
  };
};

class ReporterError extends Error {
  constructor(path, msg) {
    super(msg);
    this.path = path;
    this.rethrow(msg);
  }

  rethrow(msg) {
    this.message = msg + ' at: ' + (this.path || '(shallow)');
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, ReporterError);

    if (!this.stack) {
      try {
        // IE only adds stack when thrown
        throw new Error(this.message);
      } catch (e) {
        this.stack = e.stack;
      }
    }
    return this;
  };
};
