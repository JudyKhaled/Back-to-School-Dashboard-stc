/*!
 * Chart.js v4.5.0
 * https://www.chartjs.org
 * (c) 2025 Chart.js Contributors
 * Released under the MIT License
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Chart = factory());
})(this, (function () { 'use strict';

  function noop() {}

  const uid = (function() {
    let id = 0;
    return function() {
      return id++;
    };
  }());

  function isNullOrUndef(value) {
    return value === null || typeof value === 'undefined';
  }

  function isArray(value) {
    if (Array.isArray && Array.isArray(value)) {
      return true;
    }
    const type = Object.prototype.toString.call(value);
    if (type.slice(0, 7) === '[object' && type.slice(-6) === 'Array]') {
      return true;
    }
    return false;
  }

  function isObject(value) {
    return value !== null && Object.prototype.toString.call(value) === '[object Object]';
  }

  function isNumber(value) {
    return typeof value === 'number' || value instanceof Number;
  }

  function isString(value) {
    return typeof value === 'string' || value instanceof String;
  }

  function isBoolean(value) {
    return value === true || value === false;
  }

  function isFunction(value) {
    return typeof value === 'function';
  }

  function isDate(value) {
    return Object.prototype.toString.call(value) === '[object Date]';
  }

  function valueOrDefault(value, defaultValue) {
    return typeof value === 'undefined' ? defaultValue : value;
  }

  function toPercentage(value, dimension) {
    return typeof value === 'string' && value.endsWith('%') ?
      parseFloat(value) / 100 * dimension :
      +value;
  }

  function toDimension(value, dimension) {
    return typeof value === 'string' && value.endsWith('%') ?
      parseFloat(value) / 100 * dimension :
      +value;
  }

  const exports = {
    noop,
    uid,
    isNullOrUndef,
    isArray,
    isObject,
    isNumber,
    isString,
    isBoolean,
    isFunction,
    isDate,
    valueOrDefault,
    toPercentage,
    toDimension
  };

  class Chart {
    constructor(item, config) {
      if (!item) {
        throw new Error('Failed to create chart: can\'t acquire context from the given item');
      }
      
      this.config = config || {};
      this.platform = window;
      this.id = uid();
      this.canvas = item;
      this.ctx = item.getContext('2d');
      this._plugins = [];
      this._metasets = [];
      this._active = [];
    }

    static register(...items) {
      items.forEach(item => {
        if (item.id) {
          Chart.registry.add(item);
        }
      });
    }

    static unregister(...items) {
      items.forEach(item => {
        if (item.id) {
          Chart.registry.remove(item);
        }
      });
    }

    static get registry() {
      return registry;
    }
  }

  // Register built-in components
  const registry = {
    _items: new Map(),
    
    add(item) {
      this._items.set(item.id, item);
    },

    remove(item) {
      this._items.delete(item.id);
    },

    get(id) {
      return this._items.get(id);
    },

    clear() {
      this._items.clear();
    }
  };

  return Chart;
}));
