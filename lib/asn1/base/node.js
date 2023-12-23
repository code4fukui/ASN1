import { Reporter } from '../base/reporter.js';
import { EncoderBuffer, DecoderBuffer } from "../base/buffer.js";
import assert from "https://code4fukui.github.io/minimalistic-assert/index.js";

// Supported tags
const tags = [
  'seq', 'seqof', 'set', 'setof', 'objid', 'bool',
  'gentime', 'utctime', 'null_', 'enum', 'int', 'objDesc',
  'bitstr', 'bmpstr', 'charstr', 'genstr', 'graphstr', 'ia5str', 'iso646str',
  'numstr', 'octstr', 'printstr', 't61str', 'unistr', 'utf8str', 'videostr'
];

// Public methods list
const methods = [
  'key', 'obj', 'use', 'optional', 'explicit', 'implicit', 'def', 'choice',
  'any', 'contains'
].concat(tags);

const stateProps = [
  'enc', 'parent', 'children', 'tag', 'args', 'reverseArgs', 'choice',
  'optional', 'any', 'obj', 'use', 'alteredUse', 'key', 'default', 'explicit',
  'implicit', 'contains'
];

// Overrided methods list
const overrided = [
  '_peekTag', 'decodeTag', 'use',
  'decodeStr', 'decodeObjid', 'decodeTime',
  'decodeNull', 'decodeInt', 'decodeBool', 'decodeList',

  'encodeComposite', 'encodeStr', 'encodeObjid', 'encodeTime',
  'encodeNull', 'encodeInt', 'encodeBool'
];

export class Node {
  constructor(enc, parent, name) {
    const state = {};
    this._baseState = state;

    state.name = name;
    state.enc = enc;

    state.parent = parent || null;
    state.children = null;

    // State
    state.tag = null;
    state.args = null;
    state.reverseArgs = null;
    state.choice = null;
    state.optional = false;
    state.any = false;
    state.obj = false;
    state.use = null;
    state.useDecoder = null;
    state.key = null;
    state['default'] = null;
    state.explicit = null;
    state.implicit = null;
    state.contains = null;

    // Should create new instance on each method
    if (!state.parent) {
      state.children = [];
      this.wrap();
    }
  }

  clone() {
    const state = this._baseState;
    const cstate = {};
    stateProps.forEach(function(prop) {
      cstate[prop] = state[prop];
    });
    const res = new this.constructor(cstate.parent);
    res._baseState = cstate;
    return res;
  };

  wrap() {
    const state = this._baseState;
    methods.forEach(function(method) {
      this[method] = function _wrappedMethod() {
        const clone = new this.constructor(this);
        state.children.push(clone);
        return clone[method].apply(clone, arguments);
      };
    }, this);
  };

  init(body) {
    const state = this._baseState;

    assert(state.parent === null);
    body.call(this);

    // Filter children
    state.children = state.children.filter(function(child) {
      return child._baseState.parent === this;
    }, this);
    //console.log(state.children)
    assert.equal(state.children.length, 1, 'Root node can have only one child');
  };

  useArgs(args) {
    const state = this._baseState;

    // Filter children and args
    const children = args.filter(function(arg) {
      return arg instanceof this.constructor;
    }, this);
    args = args.filter(function(arg) {
      return !(arg instanceof this.constructor);
    }, this);

    if (children.length !== 0) {
      assert(state.children === null);
      state.children = children;

      // Replace parent to maintain backward link
      children.forEach(function(child) {
        child._baseState.parent = this;
      }, this);
    }
    if (args.length !== 0) {
      assert(state.args === null);
      state.args = args;
      state.reverseArgs = args.map(function(arg) {
        if (typeof arg !== 'object' || arg.constructor !== Object)
          return arg;

        const res = {};
        Object.keys(arg).forEach(function(key) {
          if (key == (key | 0))
            key |= 0;
          const value = arg[key];
          res[value] = key;
        });
        return res;
      });
    }
  };

  use(item) {
    assert(item);
    const state = this._baseState;

    assert(state.use === null);
    state.use = item;

    return this;
  };

  optional() {
    const state = this._baseState;

    state.optional = true;

    return this;
  };

  def(val) {
    const state = this._baseState;

    assert(state['default'] === null);
    state['default'] = val;
    state.optional = true;

    return this;
  };

  explicit(num) {
    const state = this._baseState;

    assert(state.explicit === null && state.implicit === null);
    state.explicit = num;

    return this;
  };

  implicit(num) {
    const state = this._baseState;

    assert(state.explicit === null && state.implicit === null);
    state.implicit = num;

    return this;
  };

  obj() {
    const state = this._baseState;
    const args = Array.prototype.slice.call(arguments);

    state.obj = true;

    if (args.length !== 0)
      this.useArgs(args);

    return this;
  };

  key(newKey) {
    const state = this._baseState;

    assert(state.key === null);
    state.key = newKey;

    return this;
  };

  any() {
    const state = this._baseState;

    state.any = true;

    return this;
  };

  choice(obj) {
    const state = this._baseState;

    assert(state.choice === null);
    state.choice = obj;
    this.useArgs(Object.keys(obj).map(function(key) {
      return obj[key];
    }));

    return this;
  };

  contains(item) {
    const state = this._baseState;

    assert(state.use === null);
    state.contains = item;

    return this;
  };

  //
  // Decoding
  //

  decode(input, options) {
    const state = this._baseState;

    // Decode root node
    if (state.parent === null)
      return input.wrapResult(state.children[0].decode(input, options));

    let result = state['default'];
    let present = true;

    let prevKey = null;
    if (state.key !== null)
      prevKey = input.enterKey(state.key);

    // Check if tag is there
    if (state.optional) {
      let tag = null;
      if (state.explicit !== null)
        tag = state.explicit;
      else if (state.implicit !== null)
        tag = state.implicit;
      else if (state.tag !== null)
        tag = state.tag;

      if (tag === null && !state.any) {
        // Trial and Error
        const save = input.save();
        try {
          if (state.choice === null)
            this.decodeGeneric(state.tag, input, options);
          else
            this.decodeChoice(input, options);
          present = true;
        } catch (e) {
          present = false;
        }
        input.restore(save);
      } else {
        present = this.peekTag(input, tag, state.any);

        if (input.isError(present))
          return present;
      }
    }

    // Push object on stack
    let prevObj;
    if (state.obj && present)
      prevObj = input.enterObject();

    if (present) {
      // Unwrap explicit values
      if (state.explicit !== null) {
        const explicit = this.decodeTag(input, state.explicit);
        if (input.isError(explicit))
          return explicit;
        input = explicit;
      }

      const start = input.offset;

      // Unwrap implicit and normal values
      if (state.use === null && state.choice === null) {
        let save;
        if (state.any)
          save = input.save();
        const body = this.decodeTag(
          input,
          state.implicit !== null ? state.implicit : state.tag,
          state.any
        );
        if (input.isError(body))
          return body;

        if (state.any)
          result = input.raw(save);
        else
          input = body;
      }

      if (options && options.track && state.tag !== null)
        options.track(input.path(), start, input.length, 'tagged');

      if (options && options.track && state.tag !== null)
        options.track(input.path(), input.offset, input.length, 'content');

      // Select proper method for tag
      if (state.any) {
        // no-op
      } else if (state.choice === null) {
        result = this.decodeGeneric(state.tag, input, options);
      } else {
        result = this.decodeChoice(input, options);
      }

      if (input.isError(result))
        return result;

      // Decode children
      if (!state.any && state.choice === null && state.children !== null) {
        state.children.forEach(function decodeChildren(child) {
          // NOTE: We are ignoring errors here, to let parser continue with other
          // parts of encoded data
          child.decode(input, options);
        });
      }

      // Decode contained/encoded by schema, only in bit or octet strings
      if (state.contains && (state.tag === 'octstr' || state.tag === 'bitstr')) {
        const data = new DecoderBuffer(result);
        result = this._getUse(state.contains, input._reporterState.obj)
          .decode(data, options);
      }
    }

    // Pop object
    if (state.obj && present)
      result = input.leaveObject(prevObj);

    // Set key
    if (state.key !== null && (result !== null || present === true))
      input.leaveKey(prevKey, state.key, result);
    else if (prevKey !== null)
      input.exitKey(prevKey);

    return result;
  }

  decodeGeneric(tag, input, options) {
    const state = this._baseState;

    if (tag === 'seq' || tag === 'set')
      return null;
    if (tag === 'seqof' || tag === 'setof')
      return this.decodeList(input, tag, state.args[0], options);
    else if (/str$/.test(tag))
      return this.decodeStr(input, tag, options);
    else if (tag === 'objid' && state.args)
      return this.decodeObjid(input, state.args[0], state.args[1], options);
    else if (tag === 'objid')
      return this.decodeObjid(input, null, null, options);
    else if (tag === 'gentime' || tag === 'utctime')
      return this.decodeTime(input, tag, options);
    else if (tag === 'null_')
      return this.decodeNull(input, options);
    else if (tag === 'bool')
      return this.decodeBool(input, options);
    else if (tag === 'objDesc')
      return this.decodeStr(input, tag, options);
    else if (tag === 'int' || tag === 'enum')
      return this.decodeInt(input, state.args && state.args[0], options);

    if (state.use !== null) {
      return this._getUse(state.use, input._reporterState.obj)
        .decode(input, options);
    } else {
      return input.error('unknown tag: ' + tag);
    }
  }

  _getUse(entity, obj) {

    const state = this._baseState;
    // Create altered use decoder if implicit is set
    state.useDecoder = this.use(entity, obj);
    assert(state.useDecoder._baseState.parent === null);
    state.useDecoder = state.useDecoder._baseState.children[0];
    if (state.implicit !== state.useDecoder._baseState.implicit) {
      state.useDecoder = state.useDecoder.clone();
      state.useDecoder._baseState.implicit = state.implicit;
    }
    return state.useDecoder;
  }

  decodeChoice(input, options) {
    const state = this._baseState;
    let result = null;
    let match = false;

    Object.keys(state.choice).some(function(key) {
      const save = input.save();
      const node = state.choice[key];
      try {
        const value = node.decode(input, options);
        if (input.isError(value))
          return false;

        result = { type: key, value: value };
        match = true;
      } catch (e) {
        input.restore(save);
        return false;
      }
      return true;
    }, this);

    if (!match)
      return input.error('Choice not matched');

    return result;
  };

  //
  // Encoding
  //

  createEncoderBuffer(data) {
    return new EncoderBuffer(data, this.reporter);
  };

  encode(data, reporter, parent) {
    const state = this._baseState;
    if (state['default'] !== null && state['default'] === data)
      return;

    const result = this.encodeValue(data, reporter, parent);
    if (result === undefined)
      return;

    if (this._skipDefault(result, reporter, parent))
      return;

    return result;
  };

  encode(data, reporter, parent) {
    const state = this._baseState;

    // Decode root node
    if (state.parent === null)
      return state.children[0].encode(data, reporter || new Reporter());

    let result = null;

    // Set reporter to share it with a child class
    this.reporter = reporter;

    // Check if data is there
    if (state.optional && data === undefined) {
      if (state['default'] !== null)
        data = state['default'];
      else
        return;
    }

    // Encode children first
    let content = null;
    let primitive = false;
    if (state.any) {
      // Anything that was given is translated to buffer
      result = this.createEncoderBuffer(data);
    } else if (state.choice) {
      result = this.encodeChoice(data, reporter);
    } else if (state.contains) {
      content = this._getUse(state.contains, parent).encode(data, reporter);
      primitive = true;
    } else if (state.children) {
      content = state.children.map(function(child) {
        if (child._baseState.tag === 'null_')
          return child.encode(null, reporter, data);

        if (child._baseState.key === null)
          return reporter.error('Child should have a key');
        const prevKey = reporter.enterKey(child._baseState.key);

        if (typeof data !== 'object')
          return reporter.error('Child expected, but input is not object');

        const res = child.encode(data[child._baseState.key], reporter, data);
        reporter.leaveKey(prevKey);

        return res;
      }, this).filter(function(child) {
        return child;
      });
      content = this.createEncoderBuffer(content);
    } else {
      if (state.tag === 'seqof' || state.tag === 'setof') {
        // TODO(indutny): this should be thrown on DSL level
        if (!(state.args && state.args.length === 1))
          return reporter.error('Too many args for : ' + state.tag);

        if (!Array.isArray(data))
          return reporter.error('seqof/setof, but data is not Array');

        const child = this.clone();
        child._baseState.implicit = null;
        content = this.createEncoderBuffer(data.map(function(item) {
          const state = this._baseState;

          return this._getUse(state.args[0], data).encode(item, reporter);
        }, child));
      } else if (state.use !== null) {
        result = this._getUse(state.use, parent).encode(data, reporter);
      } else {
        content = this.encodePrimitive(state.tag, data);
        primitive = true;
      }
    }

    // Encode data itself
    if (!state.any && state.choice === null) {
      const tag = state.implicit !== null ? state.implicit : state.tag;
      const cls = state.implicit === null ? 'universal' : 'context';

      if (tag === null) {
        if (state.use === null)
          reporter.error('Tag could be omitted only for .use()');
      } else {
        if (state.use === null)
          result = this.encodeComposite(tag, primitive, cls, content);
      }
    }

    // Wrap in explicit
    if (state.explicit !== null)
      result = this.encodeComposite(state.explicit, false, 'context', result);

    return result;
  };

  encodeChoice(data, reporter) {
    const state = this._baseState;

    const node = state.choice[data.type];
    if (!node) {
      assert(
        false,
        data.type + ' not found in ' +
              JSON.stringify(Object.keys(state.choice)));
    }
    return node.encode(data.value, reporter);
  };

  encodePrimitive(tag, data) {
    const state = this._baseState;

    if (/str$/.test(tag))
      return this.encodeStr(data, tag);
    else if (tag === 'objid' && state.args)
      return this.encodeObjid(data, state.reverseArgs[0], state.args[1]);
    else if (tag === 'objid')
      return this.encodeObjid(data, null, null);
    else if (tag === 'gentime' || tag === 'utctime')
      return this.encodeTime(data, tag);
    else if (tag === 'null_')
      return this.encodeNull();
    else if (tag === 'int' || tag === 'enum')
      return this.encodeInt(data, state.args && state.reverseArgs[0]);
    else if (tag === 'bool')
      return this.encodeBool(data);
    else if (tag === 'objDesc')
      return this.encodeStr(data, tag);
    else
      throw new Error('Unsupported tag: ' + tag);
  };

  isNumstr(str) {
    return /^[0-9 ]*$/.test(str);
  };

  isPrintstr(str) {
    return /^[A-Za-z0-9 '()+,-./:=?]*$/.test(str);
  };
};

//
// Overrided methods
//
/*
overrided.forEach(function(method) {
  Node.prototype[method] = function _overrided() {
    const state = this._baseState;
    throw new Error(method + ' not implemented for encoding: ' + state.enc);
  };
});
*/
//
// Public methods
//
tags.forEach(function(tag) {
  Node.prototype[tag] = function _tagMethod() {
    const state = this._baseState;
    const args = Array.prototype.slice.call(arguments);

    assert(state.tag === null);
    state.tag = tag;

    this.useArgs(args);

    return this;
  };
});
