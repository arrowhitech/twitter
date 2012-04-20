define("application", function(require, exports, module) {
  var Application, NavigationController, SessionController, SidebarController, TwitterApplication, mediator, routes, support,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

Application = require('chaplin/application');

SessionController = require('controllers/session_controller');

NavigationController = require('controllers/navigation_controller');

SidebarController = require('controllers/sidebar_controller');

routes = require('routes');

support = require('chaplin/lib/support');

module.exports = TwitterApplication = (function(_super) {

  __extends(TwitterApplication, _super);

  function TwitterApplication() {
    TwitterApplication.__super__.constructor.apply(this, arguments);
  }

  TwitterApplication.prototype.title = 'Tweet your brunch';

  TwitterApplication.prototype.initialize = function() {
    TwitterApplication.__super__.initialize.apply(this, arguments);
    new SessionController();
    new NavigationController();
    new SidebarController();
    this.initRouter(routes, {
      pushState: false
    });
    if (support.propertyDescriptors && Object.seal) Object.seal(mediator);
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return TwitterApplication;

})(Application);
;
});
define("chaplin/application", function(require, exports, module) {
  'use strict';
var Application, ApplicationController, ApplicationView, Router, mediator;

mediator = require('mediator');

ApplicationController = require('chaplin/controllers/application_controller');

ApplicationView = require('chaplin/views/application_view');

Router = require('chaplin/lib/router');

require('lib/view_helper');

module.exports = Application = (function() {

  function Application() {}

  Application.prototype.title = '';

  Application.prototype.applicationController = null;

  Application.prototype.applicationView = null;

  Application.prototype.router = null;

  Application.prototype.initialize = function() {
    this.applicationController = new ApplicationController();
    return this.applicationView = new ApplicationView({
      title: this.title
    });
  };

  Application.prototype.initRouter = function(routes, options) {
    this.router = new Router(options);
    if (typeof routes === "function") routes(this.router.match);
    return this.router.startHistory();
  };

  Application.prototype.disposed = false;

  Application.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) return;
    properties = ['applicationController', 'applicationView', 'router'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      this[prop].dispose();
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Application;

})();
;
});
define("chaplin/controllers/application_controller", function(require, exports, module) {
  var ApplicationController, Subscriber, mediator, utils, _;

_ = require('underscore');

mediator = require('mediator');

utils = require('chaplin/lib/utils');

Subscriber = require('chaplin/lib/subscriber');

module.exports = ApplicationController = (function() {

  _(ApplicationController.prototype).extend(Subscriber);

  ApplicationController.prototype.previousControllerName = null;

  ApplicationController.prototype.currentControllerName = null;

  ApplicationController.prototype.currentController = null;

  ApplicationController.prototype.currentAction = null;

  ApplicationController.prototype.currentParams = null;

  ApplicationController.prototype.url = null;

  function ApplicationController() {
    this.initialize();
  }

  ApplicationController.prototype.initialize = function() {
    this.subscribeEvent('matchRoute', this.matchRoute);
    return this.subscribeEvent('!startupController', this.startupController);
  };

  ApplicationController.prototype.matchRoute = function(route, params) {
    return this.startupController(route.controller, route.action, params);
  };

  ApplicationController.prototype.startupController = function(controllerName, action, params) {
    var controllerFileName, handler, isSameController;
    if (action == null) action = 'index';
    if (params == null) params = {};
    if (params.changeURL !== false) params.changeURL = true;
    if (params.forceStartup !== true) params.forceStartup = false;
    isSameController = !params.forceStartup && this.currentControllerName === controllerName && this.currentAction === action && (!this.currentParams || _(params).isEqual(this.currentParams));
    if (isSameController) return;
    controllerFileName = utils.underscorize(controllerName) + '_controller';
    handler = _(this.controllerLoaded).bind(this, controllerName, action, params);
    return require(['controllers/' + controllerFileName], handler);
  };

  ApplicationController.prototype.controllerLoaded = function(controllerName, action, params, ControllerConstructor) {
    var controller, currentController, currentControllerName;
    currentControllerName = this.currentControllerName || null;
    currentController = this.currentController || null;
    if (currentController) {
      mediator.publish('beforeControllerDispose', currentController);
      currentController.dispose(params, controllerName);
    }
    controller = new ControllerConstructor();
    controller.initialize(params, currentControllerName);
    controller[action](params, currentControllerName);
    this.previousControllerName = currentControllerName;
    this.currentControllerName = controllerName;
    this.currentController = controller;
    this.currentAction = action;
    this.currentParams = params;
    this.adjustURL(controller, params);
    return mediator.publish('startupController', {
      previousControllerName: this.previousControllerName,
      controller: this.currentController,
      controllerName: this.currentControllerName,
      params: this.currentParams
    });
  };

  ApplicationController.prototype.adjustURL = function(controller, params) {
    var url;
    if (params.path) {
      url = params.path;
    } else if (typeof controller.historyURL === 'function') {
      url = controller.historyURL(params);
    } else if (typeof controller.historyURL === 'string') {
      url = controller.historyURL;
    } else {
      throw new Error('ApplicationController#adjustURL: controller for ' + ("" + this.currentControllerName + " does not provide a historyURL"));
    }
    if (params.changeURL) mediator.publish('!router:changeURL', url);
    return this.url = url;
  };

  ApplicationController.prototype.disposed = false;

  ApplicationController.prototype.dispose = function() {
    if (this.disposed) return;
    this.unsubscribeAllEvents();
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return ApplicationController;

})();
;
});
define("chaplin/controllers/controller", function(require, exports, module) {
  'use strict';
var Controller, Subscriber, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty;

_ = require('underscore');

Subscriber = require('chaplin/lib/subscriber');

module.exports = Controller = (function() {

  _(Controller.prototype).extend(Subscriber);

  Controller.prototype.view = null;

  Controller.prototype.currentId = null;

  function Controller() {
    this.dispose = __bind(this.dispose, this);    this.initialize();
  }

  Controller.prototype.initialize = function() {};

  Controller.prototype.disposed = false;

  Controller.prototype.dispose = function() {
    var obj, prop, properties, _i, _len;
    if (this.disposed) return;
    for (prop in this) {
      if (!__hasProp.call(this, prop)) continue;
      obj = this[prop];
      if (obj && typeof obj.dispose === 'function') {
        obj.dispose();
        delete this[prop];
      }
    }
    this.unsubscribeAllEvents();
    properties = ['currentId'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Controller;

})();
;
});
define("chaplin/lib/create_mediator", function(require, exports, module) {
  'use strict';
var Backbone, descriptorsSupported, support, _;

_ = require('underscore');

Backbone = require('backbone');

support = require('chaplin/lib/support');

descriptorsSupported = support.propertyDescriptors;

module.exports = function(options) {
  var defineProperty, mediator, privateUser, readonly, readonlyDescriptor;
  if (options == null) options = {};
  _(options).defaults({
    createRouterProperty: true,
    createUserProperty: true
  });
  defineProperty = function(prop, descriptor) {
    if (!descriptorsSupported) return;
    return Object.defineProperty(mediator, prop, descriptor);
  };
  readonlyDescriptor = {
    writable: false,
    enumerable: true,
    configurable: false
  };
  readonly = function() {
    var prop, _i, _len, _results;
    if (!descriptorsSupported) return;
    _results = [];
    for (_i = 0, _len = arguments.length; _i < _len; _i++) {
      prop = arguments[_i];
      _results.push(defineProperty(prop, readonlyDescriptor));
    }
    return _results;
  };
  mediator = {};
  mediator.subscribe = mediator.on = Backbone.Events.on;
  mediator.unsubscribe = mediator.off = Backbone.Events.off;
  mediator.publish = mediator.trigger = Backbone.Events.trigger;
  mediator._callbacks = null;
  readonly('subscribe', 'unsubscribe', 'publish');
  if (options.createUserProperty) {
    mediator.user = null;
    privateUser = null;
    defineProperty('user', {
      get: function() {
        return privateUser;
      },
      set: function() {
        throw new Error('mediator.user is not writable directly. ' + 'Please use mediator.setUser instead.');
      },
      enumerable: true,
      configurable: false
    });
    mediator.setUser = function(user) {
      if (descriptorsSupported) {
        return privateUser = user;
      } else {
        return mediator.user = user;
      }
    };
    readonly('setUser');
  }
  return mediator;
};
;
});
define("chaplin/lib/route", function(require, exports, module) {
  'use strict';
var Route, mediator, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty;

_ = require('underscore');

mediator = require('mediator');

module.exports = Route = (function() {
  var escapeRegExp, queryStringFieldSeparator, queryStringValueSeparator, reservedParams;

  reservedParams = 'path changeURL'.split(' ');

  escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

  queryStringFieldSeparator = '&';

  queryStringValueSeparator = '=';

  function Route(pattern, target, options) {
    var _ref;
    this.options = options != null ? options : {};
    this.handler = __bind(this.handler, this);
    this.addParamName = __bind(this.addParamName, this);
    this.pattern = pattern;
    _ref = target.split('#'), this.controller = _ref[0], this.action = _ref[1];
    this.createRegExp();
  }

  Route.prototype.createRegExp = function() {
    var pattern;
    if (_.isRegExp(this.pattern)) {
      this.regExp = this.pattern;
      return;
    }
    pattern = this.pattern.replace(escapeRegExp, '\\$&').replace(/:(\w+)/g, this.addParamName);
    return this.regExp = RegExp("^" + pattern + "(?=\\?|$)");
  };

  Route.prototype.addParamName = function(match, paramName) {
    if (this.paramNames == null) this.paramNames = [];
    if (_(reservedParams).include(paramName)) {
      throw new Error("Route#addParamName: parameter name " + paramName + " is reserved");
    }
    this.paramNames.push(paramName);
    return '([\\w-]+)';
  };

  Route.prototype.test = function(path) {
    var constraint, constraints, matched, name, params;
    matched = this.regExp.test(path);
    if (!matched) return false;
    constraints = this.options.constraints;
    if (constraints) {
      params = this.extractParams(path);
      for (name in constraints) {
        if (!__hasProp.call(constraints, name)) continue;
        constraint = constraints[name];
        if (!constraint.test(params[name])) return false;
      }
    }
    return true;
  };

  Route.prototype.handler = function(path, options) {
    var params;
    params = this.buildParams(path, options);
    return mediator.publish('matchRoute', this, params);
  };

  Route.prototype.buildParams = function(path, options) {
    var params, patternParams, queryParams;
    params = {};
    queryParams = this.extractQueryParams(path);
    _(params).extend(queryParams);
    patternParams = this.extractParams(path);
    _(params).extend(patternParams);
    _(params).extend(this.options.params);
    params.changeURL = Boolean(options && options.changeURL);
    params.path = path;
    return params;
  };

  Route.prototype.extractParams = function(path) {
    var index, match, matches, paramName, params, _len, _ref;
    params = {};
    matches = this.regExp.exec(path);
    _ref = matches.slice(1);
    for (index = 0, _len = _ref.length; index < _len; index++) {
      match = _ref[index];
      paramName = this.paramNames ? this.paramNames[index] : index;
      params[paramName] = match;
    }
    return params;
  };

  Route.prototype.extractQueryParams = function(path) {
    var current, field, matches, pair, pairs, params, queryString, regExp, value, _i, _len, _ref;
    params = {};
    regExp = /\?(.+?)(?=#|$)/;
    matches = regExp.exec(path);
    if (!matches) return params;
    queryString = matches[1];
    pairs = queryString.split(queryStringFieldSeparator);
    for (_i = 0, _len = pairs.length; _i < _len; _i++) {
      pair = pairs[_i];
      if (!pair.length) continue;
      _ref = pair.split(queryStringValueSeparator), field = _ref[0], value = _ref[1];
      if (!field.length) continue;
      field = decodeURIComponent(field);
      value = decodeURIComponent(value);
      current = params[field];
      if (current) {
        if (current.push) {
          current.push(value);
        } else {
          params[field] = [current, value];
        }
      } else {
        params[field] = value;
      }
    }
    return params;
  };

  return Route;

})();
;
});
define("chaplin/lib/router", function(require, exports, module) {
  'use strict';
var Backbone, Route, Router, Subscriber, mediator, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = require('underscore');

Backbone = require('backbone');

mediator = require('mediator');

Subscriber = require('chaplin/lib/subscriber');

Route = require('chaplin/lib/route');

module.exports = Router = (function() {

  _(Router.prototype).extend(Subscriber);

  function Router(options) {
    this.options = options != null ? options : {};
    this.route = __bind(this.route, this);
    this.match = __bind(this.match, this);
    this.subscribeEvent('!router:route', this.routeHandler);
    this.subscribeEvent('!router:changeURL', this.changeURLHandler);
    this.createHistory();
  }

  Router.prototype.createHistory = function() {
    return Backbone.history || (Backbone.history = new Backbone.History());
  };

  Router.prototype.startHistory = function() {
    var pushState, _ref;
    pushState = (_ref = this.options.pushState) != null ? _ref : true;
    return Backbone.history.start({
      pushState: pushState
    });
  };

  Router.prototype.stopHistory = function() {
    return Backbone.history.stop();
  };

  Router.prototype.match = function(pattern, target, options) {
    var route;
    if (options == null) options = {};
    route = new Route(pattern, target, options);
    return Backbone.history.route(route, route.handler);
  };

  Router.prototype.route = function(path) {
    var handler, _i, _len, _ref;
    path = path.replace(/^(\/#|\/)/, '');
    _ref = Backbone.history.handlers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      handler = _ref[_i];
      if (handler.route.test(path)) {
        handler.callback(path, {
          changeURL: true
        });
        return true;
      }
    }
    return false;
  };

  Router.prototype.routeHandler = function(path, callback) {
    var routed;
    routed = this.route(path);
    return typeof callback === "function" ? callback(routed) : void 0;
  };

  Router.prototype.changeURL = function(url) {
    return Backbone.history.navigate(url, {
      trigger: false
    });
  };

  Router.prototype.changeURLHandler = function(url) {
    return this.changeURL(url);
  };

  Router.prototype.disposed = false;

  Router.prototype.dispose = function() {
    if (this.disposed) return;
    this.stopHistory();
    delete Backbone.history;
    this.unsubscribeAllEvents();
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Router;

})();
;
});
define("chaplin/lib/subscriber", function(require, exports, module) {
  'use strict';
var Subscriber, mediator;

mediator = require('mediator');

Subscriber = {
  subscribeEvent: function(type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('Subscriber#subscribeEvent: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Subscriber#subscribeEvent: ' + 'handler argument must be a function');
    }
    mediator.unsubscribe(type, handler, this);
    return mediator.subscribe(type, handler, this);
  },
  unsubscribeEvent: function(type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('Subscriber#unsubscribeEvent: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('Subscriber#unsubscribeEvent: ' + 'handler argument must be a function');
    }
    return mediator.unsubscribe(type, handler);
  },
  unsubscribeAllEvents: function() {
    return mediator.unsubscribe(null, null, this);
  }
};

if (typeof Object.freeze === "function") Object.freeze(Subscriber);

module.exports = Subscriber;
;
});
define("chaplin/lib/support", function(require, exports, module) {
  'use strict';
var support;

support = {
  propertyDescriptors: (function() {
    var o;
    if (!(typeof Object.defineProperty === 'function' && typeof Object.defineProperties === 'function')) {
      return false;
    }
    try {
      o = {};
      Object.defineProperty(o, 'foo', {
        value: 'bar'
      });
      return o.foo === 'bar';
    } catch (error) {
      return false;
    }
  })()
};

module.exports = support;
;
});
define("chaplin/lib/sync_machine", function(require, exports, module) {
  'use strict';
var STATE_CHANGE, SYNCED, SYNCING, SyncMachine, UNSYNCED, event, _fn, _i, _len, _ref;

UNSYNCED = 'unsynced';

SYNCING = 'syncing';

SYNCED = 'synced';

STATE_CHANGE = 'syncStateChange';

SyncMachine = {
  _syncState: UNSYNCED,
  _previousSyncState: null,
  syncState: function() {
    return this._syncState;
  },
  isUnsynced: function() {
    return this._syncState === UNSYNCED;
  },
  isSynced: function() {
    return this._syncState === SYNCED;
  },
  isSyncing: function() {
    return this._syncState === SYNCING;
  },
  unsync: function() {
    var _ref;
    if ((_ref = this._syncState) === SYNCING || _ref === SYNCED) {
      this._previousSync = this._syncState;
      this._syncState = UNSYNCED;
      this.trigger(this._syncState);
      this.trigger(STATE_CHANGE);
    }
  },
  beginSync: function() {
    var _ref;
    if ((_ref = this._syncState) === UNSYNCED || _ref === SYNCED) {
      this._previousSync = this._syncState;
      this._syncState = SYNCING;
      this.trigger(this._syncState);
      this.trigger(STATE_CHANGE);
    }
  },
  finishSync: function() {
    if (this._syncState === SYNCING) {
      this._previousSync = this._syncState;
      this._syncState = SYNCED;
      this.trigger(this._syncState);
      this.trigger(STATE_CHANGE);
    }
  },
  abortSync: function() {
    if (this._syncState === SYNCING) {
      this._syncState = this._previousSync;
      this._previousSync = this._syncState;
      this.trigger(this._syncState);
      this.trigger(STATE_CHANGE);
    }
  }
};

_ref = [UNSYNCED, SYNCING, SYNCED, STATE_CHANGE];
_fn = function(event) {
  return SyncMachine[event] = function(callback, context) {
    if (context == null) context = this;
    this.on(event, callback, context);
    if (this._syncState === event) return callback.call(context);
  };
};
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  event = _ref[_i];
  _fn(event);
}

if (typeof Object.freeze === "function") Object.freeze(SyncMachine);

module.exports = SyncMachine;
;
});
define("chaplin/lib/utils", function(require, exports, module) {
  'use strict';
var $, mediator, utils, _,
  __hasProp = Object.prototype.hasOwnProperty,
  __slice = Array.prototype.slice;

$ = require('jquery');

_ = require('underscore');

mediator = require('mediator');

utils = {
  beget: (function() {
    var ctor;
    if (typeof Object.create === 'function') {
      return function(obj) {
        return Object.create(obj);
      };
    } else {
      ctor = function() {};
      return function(obj) {
        ctor.prototype = obj;
        return new ctor;
      };
    }
  })(),
  camelize: (function() {
    var camelizer, regexp;
    regexp = /[-_]([a-z])/g;
    camelizer = function(match, c) {
      return c.toUpperCase();
    };
    return function(string) {
      return string.replace(regexp, camelizer);
    };
  })(),
  upcase: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  },
  underscorize: function(string) {
    return string.replace(/[A-Z]/g, function(char, index) {
      return (index !== 0 ? '_' : '') + char.toLowerCase();
    });
  },
  dasherize: function(string) {
    return string.replace(/[A-Z]/g, function(char, index) {
      return (index !== 0 ? '-' : '') + char.toLowerCase();
    });
  },
  sessionStorage: (function() {
    if (window.sessionStorage && sessionStorage.getItem && sessionStorage.setItem && sessionStorage.removeItem) {
      return function(key, value) {
        if (typeof value === 'undefined') {
          value = sessionStorage.getItem(key);
          if ((value != null) && value.toString) {
            return value.toString();
          } else {
            return value;
          }
        } else {
          sessionStorage.setItem(key, value);
          return value;
        }
      };
    } else {
      return function(key, value) {
        if (typeof value === 'undefined') {
          return utils.getCookie(key);
        } else {
          utils.setCookie(key, value);
          return value;
        }
      };
    }
  })(),
  sessionStorageRemove: (function() {
    if (window.sessionStorage && sessionStorage.getItem && sessionStorage.setItem && sessionStorage.removeItem) {
      return function(key) {
        return sessionStorage.removeItem(key);
      };
    } else {
      return function(key) {
        return utils.expireCookie(key);
      };
    }
  })(),
  getCookie: function(key) {
    var end, keyPosition, start;
    keyPosition = document.cookie.indexOf("" + key + "=");
    if (keyPosition === -1) return false;
    start = keyPosition + key.length + 1;
    end = document.cookie.indexOf(';', start);
    if (end === -1) end = document.cookie.length;
    return decodeURIComponent(document.cookie.substring(start, end));
  },
  setCookie: function(key, value) {
    return document.cookie = key + '=' + encodeURIComponent(value);
  },
  expireCookie: function(key) {
    return document.cookie = "" + key + "=nil; expires=" + ((new Date).toGMTString());
  },
  loadLib: function(url, success, error, timeout) {
    var head, onload, script, timeoutHandle;
    if (timeout == null) timeout = 7500;
    head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
    script = document.createElement('script');
    script.async = 'async';
    script.src = url;
    onload = function(_, aborted) {
      if (aborted == null) aborted = false;
      if (!(aborted || !script.readyState || script.readyState === 'complete')) {
        return;
      }
      clearTimeout(timeoutHandle);
      script.onload = script.onreadystatechange = script.onerror = null;
      if (head && script.parentNode) head.removeChild(script);
      script = void 0;
      if (success && !aborted) return success();
    };
    script.onload = script.onreadystatechange = onload;
    script.onerror = function() {
      onload(null, true);
      if (error) return error();
    };
    timeoutHandle = setTimeout(script.onerror, timeout);
    return head.insertBefore(script, head.firstChild);
  },
  /*
    Wrap methods so they can be called before a deferred is resolved.
    The actual methods are called once the deferred is resolved.
  
    Parameters:
  
    Expects an options hash with the following properties:
  
    deferred
      The Deferred object to wait for.
  
    methods
      Either:
      - A string with a method name e.g. 'method'
      - An array of strings e.g. ['method1', 'method2']
      - An object with methods e.g. {method: -> alert('resolved!')}
  
    host (optional)
      If you pass an array of strings in the `methods` parameter the methods
      are fetched from this object. Defaults to `deferred`.
  
    target (optional)
      The target object the new wrapper methods are created at.
      Defaults to host if host is given, otherwise it defaults to deferred.
  
    onDeferral (optional)
      An additional callback function which is invoked when the method is called
      and the Deferred isn't resolved yet.
      After the method is registered as a done handler on the Deferred,
      this callback is invoked. This can be used to trigger the resolving
      of the Deferred.
  
    Examples:
  
    deferMethods(deferred: def, methods: 'foo')
      Wrap the method named foo of the given deferred def and
      postpone all calls until the deferred is resolved.
  
    deferMethods(deferred: def, methods: def.specialMethods)
      Read all methods from the hash def.specialMethods and
      create wrapped methods with the same names at def.
  
    deferMethods(
      deferred: def, methods: def.specialMethods, target: def.specialMethods
    )
      Read all methods from the object def.specialMethods and
      create wrapped methods at def.specialMethods,
      overwriting the existing ones.
  
    deferMethods(deferred: def, host: obj, methods: ['foo', 'bar'])
      Wrap the methods obj.foo and obj.bar so all calls to them are postponed
      until def is resolved. obj.foo and obj.bar are overwritten
      with their wrappers.
  */
  deferMethods: function(options) {
    var deferred, func, host, methods, methodsHash, name, onDeferral, target, _i, _len, _results;
    deferred = options.deferred;
    methods = options.methods;
    host = options.host || deferred;
    target = options.target || host;
    onDeferral = options.onDeferral;
    methodsHash = {};
    if (typeof methods === 'string') {
      methodsHash[methods] = host[methods];
    } else if (methods.length && methods[0]) {
      for (_i = 0, _len = methods.length; _i < _len; _i++) {
        name = methods[_i];
        func = host[name];
        if (typeof func !== 'function') {
          throw new TypeError("utils.deferMethods: method " + name + " notfound on host " + host);
        }
        methodsHash[name] = func;
      }
    } else {
      methodsHash = methods;
    }
    _results = [];
    for (name in methodsHash) {
      if (!__hasProp.call(methodsHash, name)) continue;
      func = methodsHash[name];
      if (typeof func !== 'function') continue;
      _results.push(target[name] = utils.createDeferredFunction(deferred, func, target, onDeferral));
    }
    return _results;
  },
  createDeferredFunction: function(deferred, func, context, onDeferral) {
    if (context == null) context = deferred;
    return function() {
      var args;
      args = arguments;
      if (deferred.state() === 'resolved') {
        return func.apply(context, args);
      } else {
        deferred.done(function() {
          return func.apply(context, args);
        });
        if (typeof onDeferral === 'function') return onDeferral.apply(context);
      }
    };
  },
  accumulator: {
    collectedData: {},
    handles: {},
    handlers: {},
    successHandlers: {},
    errorHandlers: {},
    interval: 2000
  },
  wrapAccumulators: function(obj, methods) {
    var func, name, _i, _len,
      _this = this;
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      name = methods[_i];
      func = obj[name];
      if (typeof func !== 'function') {
        throw new TypeError("utils.wrapAccumulators: method " + name + " not found");
      }
      obj[name] = utils.createAccumulator(name, obj[name], obj);
    }
    return $(window).unload(function() {
      var handler, name, _ref, _results;
      _ref = utils.accumulator.handlers;
      _results = [];
      for (name in _ref) {
        handler = _ref[name];
        _results.push(handler({
          async: false
        }));
      }
      return _results;
    });
  },
  createAccumulator: function(name, func, context) {
    var acc, accumulatedError, accumulatedSuccess, cleanup, id;
    if (!(id = func.__uniqueID)) {
      id = func.__uniqueID = name + String(Math.random()).replace('.', '');
    }
    acc = utils.accumulator;
    cleanup = function() {
      delete acc.collectedData[id];
      delete acc.successHandlers[id];
      return delete acc.errorHandlers[id];
    };
    accumulatedSuccess = function() {
      var handler, handlers, _i, _len;
      handlers = acc.successHandlers[id];
      if (handlers) {
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          handler = handlers[_i];
          handler.apply(this, arguments);
        }
      }
      return cleanup();
    };
    accumulatedError = function() {
      var handler, handlers, _i, _len;
      handlers = acc.errorHandlers[id];
      if (handlers) {
        for (_i = 0, _len = handlers.length; _i < _len; _i++) {
          handler = handlers[_i];
          handler.apply(this, arguments);
        }
      }
      return cleanup();
    };
    return function() {
      var data, error, handler, rest, success;
      data = arguments[0], success = arguments[1], error = arguments[2], rest = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
      if (data) acc.collectedData[id] = (acc.collectedData[id] || []).concat(data);
      if (success) {
        acc.successHandlers[id] = (acc.successHandlers[id] || []).concat(success);
      }
      if (error) {
        acc.errorHandlers[id] = (acc.errorHandlers[id] || []).concat(error);
      }
      if (acc.handles[id]) return;
      handler = function(options) {
        var args, collectedData;
        if (options == null) options = options;
        if (!(collectedData = acc.collectedData[id])) return;
        args = [collectedData, accumulatedSuccess, accumulatedError].concat(rest);
        func.apply(context, args);
        clearTimeout(acc.handles[id]);
        delete acc.handles[id];
        return delete acc.handlers[id];
      };
      acc.handlers[id] = handler;
      return acc.handles[id] = setTimeout((function() {
        return handler();
      }), acc.interval);
    };
  },
  afterLogin: function() {
    var args, context, eventType, func, loginHandler;
    context = arguments[0], func = arguments[1], eventType = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
    if (eventType == null) eventType = 'login';
    if (mediator.user) {
      return func.apply(context, args);
    } else {
      loginHandler = function() {
        mediator.unsubscribe(eventType, loginHandler);
        return func.apply(context, args);
      };
      return mediator.subscribe(eventType, loginHandler);
    }
  },
  deferMethodsUntilLogin: function(obj, methods, eventType) {
    var func, name, _i, _len, _results;
    if (eventType == null) eventType = 'login';
    if (typeof methods === 'string') methods = [methods];
    _results = [];
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      name = methods[_i];
      func = obj[name];
      if (typeof func !== 'function') {
        throw new TypeError("utils.deferMethodsUntilLogin: method " + name + "not found");
      }
      _results.push(obj[name] = _(utils.afterLogin).bind(null, obj, func, eventType));
    }
    return _results;
  },
  ensureLogin: function() {
    var args, context, e, eventType, func, loginContext;
    context = arguments[0], func = arguments[1], loginContext = arguments[2], eventType = arguments[3], args = 5 <= arguments.length ? __slice.call(arguments, 4) : [];
    if (eventType == null) eventType = 'login';
    utils.afterLogin.apply(utils, [context, func, eventType].concat(__slice.call(args)));
    if (!mediator.user) {
      if ((e = args[0]) && typeof e.preventDefault === 'function') {
        e.preventDefault();
      }
      return mediator.publish('!showLogin', loginContext);
    }
  },
  ensureLoginForMethods: function(obj, methods, loginContext, eventType) {
    var func, name, _i, _len, _results;
    if (eventType == null) eventType = 'login';
    if (typeof methods === 'string') methods = [methods];
    _results = [];
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      name = methods[_i];
      func = obj[name];
      if (typeof func !== 'function') {
        throw new TypeError("utils.ensureLoginForMethods: method " + name + "not found");
      }
      _results.push(obj[name] = _(utils.ensureLogin).bind(null, obj, func, loginContext, eventType));
    }
    return _results;
  },
  modifierKeyPressed: function(event) {
    return event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
  }
};

if (typeof Object.seal === "function") Object.seal(utils);

module.exports = utils;
;
});
define("chaplin/lib/view_helper", function(require, exports, module) {
  'use strict';
var Handlebars, mediator, utils;

Handlebars = require('handlebars');

mediator = require('mediator');

utils = require('chaplin/lib/utils');

Handlebars.registerHelper('if_logged_in', function(options) {
  if (mediator.user) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('with', function(context, options) {
  if (!context || Handlebars.Utils.isEmpty(context)) {
    return options.inverse(this);
  } else {
    return options.fn(context);
  }
});

Handlebars.registerHelper('without', function(context, options) {
  var inverse;
  inverse = options.inverse;
  options.inverse = options.fn;
  options.fn = inverse;
  return Handlebars.helpers["with"].call(this, context, options);
});

Handlebars.registerHelper('with_user', function(options) {
  var context;
  context = mediator.user || {};
  return Handlebars.helpers["with"].call(this, context, options);
});

null;
;
});
define("chaplin/models/collection", function(require, exports, module) {
  'use strict';
var Backbone, Collection, Subscriber, SyncMachine, _,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

_ = require('underscore');

Backbone = require('backbone');

Subscriber = require('chaplin/lib/subscriber');

SyncMachine = require('chaplin/lib/sync_machine');

module.exports = Collection = (function(_super) {

  __extends(Collection, _super);

  function Collection() {
    Collection.__super__.constructor.apply(this, arguments);
  }

  _(Collection.prototype).extend(Subscriber);

  Collection.prototype.initDeferred = function() {
    return _(this).extend($.Deferred());
  };

  Collection.prototype.initSyncMachine = function() {
    return _(this).extend(SyncMachine);
  };

  Collection.prototype.addAtomic = function(models, options) {
    var batch_direction, model;
    if (options == null) options = {};
    if (!models.length) return;
    options.silent = true;
    batch_direction = typeof options.at === 'number' ? 'pop' : 'shift';
    while (model = models[batch_direction]()) {
      this.add(model, options);
    }
    return this.trigger('reset');
  };

  Collection.prototype.update = function(newList, options) {
    var fingerPrint, i, ids, model, newFingerPrint, preexistent, _ids, _len, _results;
    if (options == null) options = {};
    fingerPrint = this.pluck('id').join();
    ids = _(newList).pluck('id');
    newFingerPrint = ids.join();
    if (fingerPrint !== newFingerPrint) {
      _ids = _(ids);
      i = this.models.length - 1;
      while (i >= 0) {
        model = this.models[i];
        if (!_ids.include(model.id)) this.remove(model);
        i--;
      }
    }
    if (!(fingerPrint === newFingerPrint && !options.deep)) {
      _results = [];
      for (i = 0, _len = newList.length; i < _len; i++) {
        model = newList[i];
        preexistent = this.get(model.id);
        if (preexistent) {
          if (!options.deep) continue;
          _results.push(preexistent.set(model));
        } else {
          _results.push(this.add(model, {
            at: i
          }));
        }
      }
      return _results;
    }
  };

  Collection.prototype.disposed = false;

  Collection.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) return;
    this.trigger('dispose', this);
    this.unsubscribeAllEvents();
    this.off();
    this.reset([], {
      silent: true
    });
    properties = ['model', 'models', '_byId', '_byCid'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Collection;

})(Backbone.Collection);
;
});
define("chaplin/models/model", function(require, exports, module) {
  'use strict';
var Backbone, Model, Subscriber, _,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

_ = require('underscore');

Backbone = require('backbone');

Subscriber = require('chaplin/lib/subscriber');

module.exports = Model = (function(_super) {

  __extends(Model, _super);

  function Model() {
    Model.__super__.constructor.apply(this, arguments);
  }

  _(Model.prototype).extend(Subscriber);

  Model.prototype.initDeferred = function() {
    return _(this).extend($.Deferred());
  };

  Model.prototype.getAttributes = function() {
    return this.attributes;
  };

  Model.prototype.disposed = false;

  Model.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) return;
    this.trigger('dispose', this);
    this.unsubscribeAllEvents();
    this.off();
    properties = ['collection', 'attributes', '_escapedAttributes', '_previousAttributes', '_silent', '_pending'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Model;

})(Backbone.Model);
;
});
define("chaplin/views/application_view", function(require, exports, module) {
  'use strict';
var $, ApplicationView, Subscriber, mediator, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$ = require('jquery');

_ = require('underscore');

mediator = require('mediator');

utils = require('chaplin/lib/utils');

Subscriber = require('chaplin/lib/subscriber');

module.exports = ApplicationView = (function() {

  _(ApplicationView.prototype).extend(Subscriber);

  ApplicationView.prototype.title = '';

  function ApplicationView(options) {
    if (options == null) options = {};
    this.openLink = __bind(this.openLink, this);
    this.title = options.title;
    this.subscribeEvent('beforeControllerDispose', this.hideOldView);
    this.subscribeEvent('startupController', this.showNewView);
    this.subscribeEvent('startupController', this.removeFallbackContent);
    this.subscribeEvent('startupController', this.adjustTitle);
    this.subscribeEvent('loginStatus', this.updateBodyClasses);
    this.updateBodyClasses();
    this.addDOMHandlers();
  }

  ApplicationView.prototype.hideOldView = function(controller) {
    var view;
    scrollTo(0, 0);
    view = controller.view;
    if (view) return view.$el.css('display', 'none');
  };

  ApplicationView.prototype.showNewView = function(context) {
    var view;
    view = context.controller.view;
    if (view) {
      return view.$el.css({
        display: 'block',
        opacity: 1,
        visibility: 'visible'
      });
    }
  };

  ApplicationView.prototype.adjustTitle = function(context) {
    var subtitle, title;
    title = this.title;
    subtitle = context.controller.title;
    if (subtitle) title = "" + subtitle + " \u2013 " + title;
    return setTimeout((function() {
      return document.title = title;
    }), 50);
  };

  ApplicationView.prototype.updateBodyClasses = function(loggedIn) {
    return $(document.body).toggleClass('logged-out', !loggedIn).toggleClass('logged-in', loggedIn);
  };

  ApplicationView.prototype.removeFallbackContent = function() {
    $('.accessible-fallback').remove();
    return this.unsubscribeEvent('startupController', this.removeFallbackContent);
  };

  ApplicationView.prototype.addDOMHandlers = function() {
    return $(document).delegate('.go-to', 'click', this.goToHandler).delegate('a', 'click', this.openLink);
  };

  ApplicationView.prototype.openLink = function(event) {
    var currentHostname, el, external, hostnameRegExp, href;
    if (utils.modifierKeyPressed(event)) return;
    el = event.currentTarget;
    href = el.getAttribute('href');
    if (href === '' || href.charAt(0) === '#') return;
    currentHostname = location.hostname.replace('.', '\\.');
    hostnameRegExp = RegExp("" + currentHostname + "$", "i");
    external = !hostnameRegExp.test(el.hostname);
    if (external) return;
    return this.openInternalLink(event);
  };

  ApplicationView.prototype.openInternalLink = function(event) {
    var el, path;
    if (utils.modifierKeyPressed(event)) return;
    el = event.currentTarget;
    path = el.pathname;
    if (!path) return;
    return mediator.publish('!router:route', path, function(routed) {
      if (routed) return event.preventDefault();
    });
  };

  ApplicationView.prototype.goToHandler = function(event) {
    var el, path;
    el = event.currentTarget;
    if (event.nodeName === 'A') return;
    path = $(el).data('href');
    if (!path) return;
    return mediator.publish('!router:route', path, function(routed) {
      if (routed) {
        return event.preventDefault();
      } else {
        return location.href = path;
      }
    });
  };

  ApplicationView.prototype.disposed = false;

  ApplicationView.prototype.dispose = function() {
    if (this.disposed) return;
    this.unsubscribeAllEvents();
    delete this.title;
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return ApplicationView;

})();
;
});
define("chaplin/views/collection_view", function(require, exports, module) {
  'use strict';
var $, CollectionView, View, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

$ = require('jquery');

_ = require('underscore');

utils = require('lib/utils');

View = require('chaplin/views/view');

module.exports = CollectionView = (function(_super) {

  __extends(CollectionView, _super);

  function CollectionView() {
    this.dispose = __bind(this.dispose, this);
    this.renderAllItems = __bind(this.renderAllItems, this);
    this.showHideFallback = __bind(this.showHideFallback, this);
    this.itemsResetted = __bind(this.itemsResetted, this);
    this.itemRemoved = __bind(this.itemRemoved, this);
    this.itemAdded = __bind(this.itemAdded, this);
    this.hideLoadingIndicator = __bind(this.hideLoadingIndicator, this);
    this.showLoadingIndicator = __bind(this.showLoadingIndicator, this);
    CollectionView.__super__.constructor.apply(this, arguments);
  }

  CollectionView.prototype.animationDuration = 500;

  CollectionView.prototype.listSelector = null;

  CollectionView.prototype.$list = null;

  CollectionView.prototype.fallbackSelector = null;

  CollectionView.prototype.$fallback = null;

  CollectionView.prototype.itemSelector = null;

  CollectionView.prototype.viewsByCid = null;

  CollectionView.prototype.visibleItems = null;

  CollectionView.prototype.getView = function() {
    throw new Error('CollectionView#getView must be overridden');
  };

  CollectionView.prototype.initialize = function(options) {
    if (options == null) options = {};
    CollectionView.__super__.initialize.apply(this, arguments);
    _(options).defaults({
      render: true,
      renderItems: true,
      filterer: null
    });
    this.viewsByCid = {};
    this.visibleItems = [];
    this.addCollectionListeners();
    if (options.filterer) this.filter(options.filterer);
    if (options.render) this.render();
    if (options.renderItems) return this.renderAllItems();
  };

  CollectionView.prototype.addCollectionListeners = function() {
    this.modelBind('loadStart', this.showLoadingIndicator);
    this.modelBind('load', this.hideLoadingIndicator);
    this.modelBind('add', this.itemAdded);
    this.modelBind('remove', this.itemRemoved);
    return this.modelBind('reset', this.itemsResetted);
  };

  CollectionView.prototype.showLoadingIndicator = function() {
    if (this.collection.length) return;
    return this.$('.loading').css('display', 'block');
  };

  CollectionView.prototype.hideLoadingIndicator = function() {
    return this.$('.loading').css('display', 'none');
  };

  CollectionView.prototype.itemAdded = function(item, collection, options) {
    if (options == null) options = {};
    return this.renderAndInsertItem(item, options.index);
  };

  CollectionView.prototype.itemRemoved = function(item) {
    return this.removeViewForItem(item);
  };

  CollectionView.prototype.itemsResetted = function() {
    return this.renderAllItems();
  };

  CollectionView.prototype.render = function() {
    CollectionView.__super__.render.apply(this, arguments);
    this.$list = this.listSelector ? this.$(this.listSelector) : this.$el;
    return this.initFallback();
  };

  CollectionView.prototype.initFallback = function() {
    var f, isDeferred;
    if (!this.fallbackSelector) return;
    this.$fallback = this.$(this.fallbackSelector);
    f = 'function';
    isDeferred = typeof this.collection.done === f && typeof this.collection.state === f;
    if (!isDeferred) return;
    return this.bind('visibilityChange', this.showHideFallback);
  };

  CollectionView.prototype.showHideFallback = function() {
    var empty;
    empty = this.visibleItems.length === 0 && this.collection.state() === 'resolved';
    return this.$fallback.css('display', empty ? 'block' : 'none');
  };

  CollectionView.prototype.renderAllItems = function() {
    var cid, index, item, items, remainingViewsByCid, view, _i, _len, _len2, _ref;
    items = this.collection.models;
    this.visibleItems = [];
    remainingViewsByCid = {};
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      view = this.viewsByCid[item.cid];
      if (view) remainingViewsByCid[item.cid] = view;
    }
    _ref = this.viewsByCid;
    for (cid in _ref) {
      if (!__hasProp.call(_ref, cid)) continue;
      view = _ref[cid];
      if (!(cid in remainingViewsByCid)) this.removeView(cid, view);
    }
    for (index = 0, _len2 = items.length; index < _len2; index++) {
      item = items[index];
      view = this.viewsByCid[item.cid];
      if (view) {
        this.insertView(item, view, index, 0);
      } else {
        this.renderAndInsertItem(item, index);
      }
    }
    if (!items.length) return this.trigger('visibilityChange', this.visibleItems);
  };

  CollectionView.prototype.filter = function(filterer) {
    var included, index, item, view, _len, _ref;
    this.filterer = filterer;
    if (!_(this.viewsByCid).isEmpty()) {
      _ref = this.collection.models;
      for (index = 0, _len = _ref.length; index < _len; index++) {
        item = _ref[index];
        included = filterer ? filterer(item, index) : true;
        view = this.viewsByCid[item.cid];
        if (!view) continue;
        $(view.el).stop(true, true)[included ? 'show' : 'hide']();
        this.updateVisibleItems(item, included, false);
      }
    }
    return this.trigger('visibilityChange', this.visibleItems);
  };

  CollectionView.prototype.renderAndInsertItem = function(item, index) {
    var view;
    view = this.renderItem(item);
    return this.insertView(item, view, index);
  };

  CollectionView.prototype.renderItem = function(item) {
    var view;
    view = this.viewsByCid[item.cid];
    if (!view) {
      view = this.getView(item);
      this.viewsByCid[item.cid] = view;
    }
    view.render();
    return view;
  };

  CollectionView.prototype.insertView = function(item, view, index, animationDuration) {
    var $list, $viewEl, children, included, position;
    if (index == null) index = null;
    if (animationDuration == null) animationDuration = this.animationDuration;
    position = typeof index === 'number' ? index : this.collection.indexOf(item);
    included = this.filterer ? this.filterer(item, position) : true;
    $viewEl = view.$el;
    if (included) {
      if (animationDuration) $viewEl.css('opacity', 0);
    } else {
      $viewEl.css('display', 'none');
    }
    $list = this.$list;
    children = $list.children(this.itemSelector);
    if (position === 0) {
      $list.prepend($viewEl);
    } else if (position < children.length) {
      children.eq(position).before($viewEl);
    } else {
      $list.append($viewEl);
    }
    view.trigger('addedToDOM');
    this.updateVisibleItems(item, included);
    if (animationDuration && included) {
      return $viewEl.animate({
        opacity: 1
      }, animationDuration);
    }
  };

  CollectionView.prototype.removeViewForItem = function(item) {
    var view;
    this.updateVisibleItems(item, false);
    view = this.viewsByCid[item.cid];
    return this.removeView(item.cid, view);
  };

  CollectionView.prototype.removeView = function(cid, view) {
    view.dispose();
    return delete this.viewsByCid[cid];
  };

  CollectionView.prototype.updateVisibleItems = function(item, includedInFilter, triggerEvent) {
    var includedInVisibleItems, visibilityChanged, visibleItemsIndex;
    if (triggerEvent == null) triggerEvent = true;
    visibilityChanged = false;
    visibleItemsIndex = _(this.visibleItems).indexOf(item);
    includedInVisibleItems = visibleItemsIndex > -1;
    if (includedInFilter && !includedInVisibleItems) {
      this.visibleItems.push(item);
      visibilityChanged = true;
    } else if (!includedInFilter && includedInVisibleItems) {
      this.visibleItems.splice(visibleItemsIndex, 1);
      visibilityChanged = true;
    }
    if (visibilityChanged && triggerEvent) {
      this.trigger('visibilityChange', this.visibleItems);
    }
    return visibilityChanged;
  };

  CollectionView.prototype.dispose = function() {
    var cid, prop, properties, view, _i, _len, _ref;
    if (this.disposed) return;
    _ref = this.viewsByCid;
    for (cid in _ref) {
      if (!__hasProp.call(_ref, cid)) continue;
      view = _ref[cid];
      view.dispose();
    }
    properties = ['$list', '$fallback', 'viewsByCid', 'visibleItems'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    return CollectionView.__super__.dispose.apply(this, arguments);
  };

  return CollectionView;

})(View);
;
});
define("chaplin/views/view", function(require, exports, module) {
  'use strict';
var $, Backbone, Handlebars, Subscriber, View, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

$ = require('jquery');

_ = require('underscore');

Backbone = require('backbone');

Handlebars = require('handlebars');

utils = require('chaplin/lib/utils');

Subscriber = require('chaplin/lib/subscriber');

require('chaplin/lib/view_helper');

module.exports = View = (function(_super) {
  var wrapMethod;

  __extends(View, _super);

  _(View.prototype).extend(Subscriber);

  View.prototype.autoRender = false;

  View.prototype.containerSelector = null;

  View.prototype.containerMethod = 'append';

  View.prototype.subviews = null;

  View.prototype.subviewsByName = null;

  wrapMethod = function(obj, name) {
    var func;
    func = obj[name];
    return obj[name] = function() {
      func.apply(obj, arguments);
      return obj["after" + (utils.upcase(name))].apply(obj, arguments);
    };
  };

  function View() {
    this.dispose = __bind(this.dispose, this);    if (this.initialize !== View.prototype.initialize) {
      wrapMethod(this, 'initialize');
    }
    if (this.initialize !== View.prototype.initialize) {
      wrapMethod(this, 'render');
    } else {
      this.render = _(this.render).bind(this);
    }
    View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.initialize = function(options) {
    this.subviews = [];
    this.subviewsByName = {};
    if (this.model || this.collection) this.modelBind('dispose', this.dispose);
    if (this.initialize === View.prototype.initialize) {
      return this.afterInitialize();
    }
  };

  View.prototype.afterInitialize = function() {
    var autoRender;
    autoRender = this.options.autoRender != null ? this.options.autoRender : this.autoRender;
    if (autoRender) return this.render();
  };

  View.prototype.delegateEvents = function() {};

  View.prototype.delegate = function(eventType, second, third) {
    var handler, selector;
    if (typeof eventType !== 'string') {
      throw new TypeError('View#delegate: first argument must be a string');
    }
    if (arguments.length === 2) {
      handler = second;
    } else if (arguments.length === 3) {
      selector = second;
      if (typeof selector !== 'string') {
        throw new TypeError('View#delegate: ' + 'second argument must be a string');
      }
      handler = third;
    } else {
      throw new TypeError('View#delegate: ' + 'only two or three arguments are allowed');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('View#delegate: ' + 'handler argument must be function');
    }
    eventType += ".delegate" + this.cid;
    handler = _(handler).bind(this);
    if (selector) {
      return this.$el.on(eventType, selector, handler);
    } else {
      return this.$el.on(eventType, handler);
    }
  };

  View.prototype.undelegate = function() {
    return this.$el.unbind(".delegate" + this.cid);
  };

  View.prototype.modelBind = function(type, handler) {
    var model;
    if (typeof type !== 'string') {
      throw new TypeError('View#modelBind: ' + 'type must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('View#modelBind: ' + 'handler argument must be function');
    }
    model = this.model || this.collection;
    if (!model) throw new TypeError('View#modelBind: no model or collection set');
    model.off(type, handler, this);
    return model.on(type, handler, this);
  };

  View.prototype.modelUnbind = function(type, handler) {
    var model;
    if (typeof type !== 'string') {
      throw new TypeError('View#modelUnbind: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('View#modelUnbind: ' + 'handler argument must be a function');
    }
    model = this.model || this.collection;
    if (!model) return;
    return model.off(type, handler);
  };

  View.prototype.modelUnbindAll = function() {
    var model;
    model = this.model || this.collection;
    if (!model) return;
    return model.off(null, null, this);
  };

  View.prototype.pass = function(attribute, selector) {
    var _this = this;
    return this.modelBind("change:" + attribute, function(model, value) {
      var $el;
      $el = _this.$(selector);
      if ($el.is(':input')) {
        return $el.val(value);
      } else {
        return $el.text(value);
      }
    });
  };

  View.prototype.subview = function(name, view) {
    if (name && view) {
      this.removeSubview(name);
      this.subviews.push(view);
      this.subviewsByName[name] = view;
      return view;
    } else if (name) {
      return this.subviewsByName[name];
    }
  };

  View.prototype.removeSubview = function(nameOrView) {
    var index, name, otherName, otherView, view, _ref;
    if (!nameOrView) return;
    if (typeof nameOrView === 'string') {
      name = nameOrView;
      view = this.subviewsByName[name];
    } else {
      view = nameOrView;
      _ref = this.subviewsByName;
      for (otherName in _ref) {
        otherView = _ref[otherName];
        if (view === otherView) {
          name = otherName;
          break;
        }
      }
    }
    if (!(name && view && view.dispose)) return;
    view.dispose();
    index = _(this.subviews).indexOf(view);
    if (index > -1) this.subviews.splice(index, 1);
    return delete this.subviewsByName[name];
  };

  View.prototype.getTemplateData = function() {
    var modelAttributes, templateData;
    modelAttributes = this.model && this.model.getAttributes();
    templateData = modelAttributes ? utils.beget(modelAttributes) : {};
    if (this.model && typeof this.model.state === 'function') {
      templateData.resolved = this.model.state() === 'resolved';
    }
    return templateData;
  };

  View.prototype.render = function() {
    var html, template;
    if (this.disposed) return;
    template = this.template;
    if (typeof template === 'string') {
      template = Handlebars.compile(template);
      this.template = template;
    }
    if (typeof template === 'function') {
      html = template(this.getTemplateData());
      this.$el.empty().append(html);
    }
    return this;
  };

  View.prototype.afterRender = function() {
    var container, containerMethod;
    container = this.options.container != null ? this.options.container : this.containerSelector;
    if (container) {
      containerMethod = this.options.containerMethod != null ? this.options.containerMethod : this.containerMethod;
      $(container)[containerMethod](this.el);
      this.trigger('addedToDOM');
    }
    return this;
  };

  View.prototype.disposed = false;

  View.prototype.dispose = function() {
    var prop, properties, view, _i, _j, _len, _len2, _ref;
    if (this.disposed) return;
    _ref = this.subviews;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      view = _ref[_i];
      view.dispose();
    }
    this.unsubscribeAllEvents();
    this.modelUnbindAll();
    this.off();
    this.$el.remove();
    properties = ['el', '$el', 'options', 'model', 'collection', 'subviews', 'subviewsByName'];
    for (_j = 0, _len2 = properties.length; _j < _len2; _j++) {
      prop = properties[_j];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return View;

})(Backbone.View);
;
});
define("controllers/controller", function(require, exports, module) {
  var ChaplinController, Controller,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

ChaplinController = require('chaplin/controllers/controller');

module.exports = Controller = (function(_super) {

  __extends(Controller, _super);

  function Controller() {
    Controller.__super__.constructor.apply(this, arguments);
  }

  return Controller;

})(ChaplinController);
;
});
define("controllers/navigation_controller", function(require, exports, module) {
  var Controller, Navigation, NavigationController, NavigationView, mediator,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Controller = require('./controller');

mediator = require('mediator');

Navigation = require('models/navigation');

NavigationView = require('views/navigation_view');

module.exports = NavigationController = (function(_super) {

  __extends(NavigationController, _super);

  function NavigationController() {
    NavigationController.__super__.constructor.apply(this, arguments);
  }

  NavigationController.prototype.historyURL = 'logout';

  NavigationController.prototype.initialize = function() {
    NavigationController.__super__.initialize.apply(this, arguments);
    this.model = new Navigation();
    return this.view = new NavigationView({
      model: this.model
    });
  };

  NavigationController.prototype.logout = function() {
    mediator.publish('!logout');
    return Backbone.history.navigate('//');
  };

  return NavigationController;

})(Controller);
;
});
define("controllers/session_controller", function(require, exports, module) {
  var Controller, LoginView, SessionController, Twitter, User, mediator, utils,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

utils = require('lib/utils');

User = require('models/user');

Controller = require('./controller');

Twitter = require('lib/services/twitter');

LoginView = require('views/login_view');

module.exports = SessionController = (function(_super) {

  __extends(SessionController, _super);

  function SessionController() {
    this.logout = __bind(this.logout, this);
    this.serviceProviderSession = __bind(this.serviceProviderSession, this);
    this.loginAttempt = __bind(this.loginAttempt, this);
    this.triggerLogin = __bind(this.triggerLogin, this);
    SessionController.__super__.constructor.apply(this, arguments);
  }

  SessionController.serviceProviders = {
    twitter: new Twitter()
  };

  SessionController.prototype.loginStatusDetermined = false;

  SessionController.prototype.loginView = null;

  SessionController.prototype.serviceProviderName = null;

  SessionController.prototype.initialize = function() {
    this.subscribeEvent('loginAttempt', this.loginAttempt);
    this.subscribeEvent('serviceProviderSession', this.serviceProviderSession);
    this.subscribeEvent('logout', this.logout);
    this.subscribeEvent('userData', this.userData);
    this.subscribeEvent('!showLogin', this.showLoginView);
    this.subscribeEvent('!login', this.triggerLogin);
    this.subscribeEvent('!logout', this.triggerLogout);
    return this.getSession();
  };

  SessionController.prototype.loadSDKs = function() {
    var name, serviceProvider, _ref, _results;
    _ref = SessionController.serviceProviders;
    _results = [];
    for (name in _ref) {
      serviceProvider = _ref[name];
      _results.push(serviceProvider.loadSDK());
    }
    return _results;
  };

  SessionController.prototype.createUser = function(userData) {
    var user;
    user = new User(userData);
    return mediator.setUser(user);
  };

  SessionController.prototype.getSession = function() {
    var name, serviceProvider, _ref, _results;
    this.loadSDKs();
    _ref = SessionController.serviceProviders;
    _results = [];
    for (name in _ref) {
      serviceProvider = _ref[name];
      _results.push(serviceProvider.done(serviceProvider.getLoginStatus));
    }
    return _results;
  };

  SessionController.prototype.showLoginView = function() {
    console.debug('SessionController#showLoginView');
    if (this.loginView) return;
    this.loadSDKs();
    return this.loginView = new LoginView({
      serviceProviders: SessionController.serviceProviders
    });
  };

  SessionController.prototype.hideLoginView = function() {
    if (!this.loginView) return;
    this.loginView.dispose();
    return this.loginView = null;
  };

  SessionController.prototype.triggerLogin = function(serviceProviderName) {
    var serviceProvider;
    serviceProvider = SessionController.serviceProviders[serviceProviderName];
    if (!serviceProvider.isLoaded()) {
      mediator.publish('serviceProviderMissing', serviceProviderName);
      return;
    }
    mediator.publish('loginAttempt', serviceProviderName);
    return serviceProvider.triggerLogin();
  };

  SessionController.prototype.loginAttempt = function() {};

  SessionController.prototype.serviceProviderSession = function(session) {
    this.serviceProviderName = session.provider.name;
    console.debug('SessionController#serviceProviderSession', session, this.serviceProviderName);
    this.hideLoginView();
    session.id = session.userId;
    delete session.userId;
    this.createUser(session);
    return this.publishLogin();
  };

  SessionController.prototype.publishLogin = function() {
    this.loginStatusDetermined = true;
    mediator.publish('login', mediator.user);
    return mediator.publish('loginStatus', true);
  };

  SessionController.prototype.triggerLogout = function() {
    return mediator.publish('logout');
  };

  SessionController.prototype.logout = function() {
    this.loginStatusDetermined = true;
    if (mediator.user) {
      mediator.user.dispose();
      mediator.user = null;
    }
    this.serviceProviderName = null;
    this.showLoginView();
    return mediator.publish('loginStatus', false);
  };

  SessionController.prototype.userData = function(data) {
    return mediator.user.set(data);
  };

  return SessionController;

})(Controller);
;
});
define("controllers/sidebar_controller", function(require, exports, module) {
  var Controller, SidebarController, SidebarView, StatusView,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Controller = require('./controller');

SidebarView = require('views/sidebar_view');

StatusView = require('views/status_view');

module.exports = SidebarController = (function(_super) {

  __extends(SidebarController, _super);

  function SidebarController() {
    SidebarController.__super__.constructor.apply(this, arguments);
  }

  SidebarController.prototype.initialize = function() {
    return this.view = new SidebarView();
  };

  return SidebarController;

})(Controller);
;
});
define("controllers/tweets_controller", function(require, exports, module) {
  var Controller, Tweets, TweetsController, TweetsView,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Controller = require('./controller');

Tweets = require('models/tweets');

TweetsView = require('views/tweets_view');

module.exports = TweetsController = (function(_super) {

  __extends(TweetsController, _super);

  function TweetsController() {
    TweetsController.__super__.constructor.apply(this, arguments);
  }

  TweetsController.prototype.historyURL = '';

  TweetsController.prototype.index = function(params) {
    this.collection = new Tweets();
    return this.view = new TweetsView({
      collection: this.collection
    });
  };

  return TweetsController;

})(Controller);
;
});
define("initialize", function(require, exports, module) {
  var Application;

Application = require('./application');

$(function() {
  var app;
  app = new Application();
  return app.initialize();
});
;
});
define("lib/services/service_provider", function(require, exports, module) {
  var ServiceProvider, Subscriber, utils, _;

_ = require('underscore');

utils = require('lib/utils');

Subscriber = require('chaplin/lib/subscriber');

module.exports = ServiceProvider = (function() {

  _(ServiceProvider.prototype).defaults(Subscriber);

  ServiceProvider.prototype.loading = false;

  function ServiceProvider() {
    _(this).extend($.Deferred());
    utils.deferMethods({
      deferred: this,
      methods: ['triggerLogin', 'getLoginStatus'],
      onDeferral: this.loadSDK
    });
  }

  ServiceProvider.prototype.disposed = false;

  ServiceProvider.prototype.dispose = function() {
    if (this.disposed) return;
    this.unsubscribeAllEvents();
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return ServiceProvider;

})();

/*

  Standard methods and their signatures:

  loadSDK: ->
    # Load a script like this:
    utils.loadLib 'http://example.org/foo.js', @sdkLoadHandler, @reject

  sdkLoadHandler: =>
    # Init the SDK, then resolve
    someSDK.init(foo: 'bar')
    @resolve()

  isLoaded: ->
    # Return a Boolean
    Boolean window.someSDK and someSDK.login

  # Trigger login popup
  triggerLogin: (loginContext) ->
    callback = _(@loginHandler).bind(this, @loginHandler)
    someSDK.login callback

  # Callback for the login popup
  loginHandler: (loginContext, response) =>

    if response
      # Publish successful login
      mediator.publish 'loginSuccessful',
        provider: this, loginContext: loginContext

      # Publish the session
      mediator.publish 'serviceProviderSession',
        provider: this
        userId: response.userId
        accessToken: response.accessToken
        # etc.

    else
      mediator.publish 'loginFail', provider: this, loginContext: loginContext

  getLoginStatus: (callback = @loginStatusHandler, force = false) ->
    someSDK.getLoginStatus callback, force

  loginStatusHandler: (response) =>
    return unless response
    mediator.publish 'serviceProviderSession',
      provider: this
      userId: response.userId
      accessToken: response.accessToken
      # etc.
*/
;
});
define("lib/services/twitter", function(require, exports, module) {
  var ServiceProvider, Twitter, mediator, utils,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

utils = require('lib/utils');

ServiceProvider = require('lib/services/service_provider');

module.exports = Twitter = (function(_super) {
  var consumerKey;

  __extends(Twitter, _super);

  consumerKey = 'w0uohox9lTgpKETJmscYIQ';

  Twitter.prototype.name = 'twitter';

  function Twitter() {
    this.loginStatusHandler = __bind(this.loginStatusHandler, this);
    this.loginHandler = __bind(this.loginHandler, this);
    this.sdkLoadHandler = __bind(this.sdkLoadHandler, this);    Twitter.__super__.constructor.apply(this, arguments);
    this.subscribeEvent('!logout', this.logout);
  }

  Twitter.prototype.loadSDK = function() {
    if (this.state() === 'resolved' || this.loading) return;
    this.loading = true;
    return utils.loadLib("http://platform.twitter.com/anywhere.js?id=" + consumerKey + "&v=1", this.sdkLoadHandler, this.reject);
  };

  Twitter.prototype.sdkLoadHandler = function() {
    var _this = this;
    this.loading = false;
    return twttr.anywhere(function(T) {
      mediator.publish('sdkLoaded');
      _this.T = T;
      return _this.resolve();
    });
  };

  Twitter.prototype.isLoaded = function() {
    return Boolean(window.twttr);
  };

  Twitter.prototype.publish = function(event, callback) {
    return this.T.trigger(event, callback);
  };

  Twitter.prototype.subscribe = function(event, callback) {
    return this.T.bind(event, callback);
  };

  Twitter.prototype.unsubscribe = function(event) {
    return this.T.unbind(event);
  };

  Twitter.prototype.triggerLogin = function(loginContext) {
    var callback;
    callback = _(this.loginHandler).bind(this, loginContext);
    this.T.signIn();
    this.subscribe('authComplete', function(event, currentUser, accessToken) {
      return callback({
        currentUser: currentUser,
        accessToken: accessToken
      });
    });
    return this.subscribe('signOut', function() {
      console.log('SIGNOUT EVENT');
      return callback();
    });
  };

  Twitter.prototype.publishSession = function(response) {
    var user;
    user = response.currentUser;
    mediator.publish('serviceProviderSession', {
      provider: this,
      userId: user.id,
      accessToken: response.accessToken || twttr.anywhere.token
    });
    return mediator.publish('userData', user.attributes);
  };

  Twitter.prototype.loginHandler = function(loginContext, response) {
    console.debug('Twitter#loginHandler', loginContext, response);
    if (response) {
      mediator.publish('loginSuccessful', {
        provider: this,
        loginContext: loginContext
      });
      return this.publishSession(response);
    } else {
      return mediator.publish('loginFail', {
        provider: this,
        loginContext: loginContext
      });
    }
  };

  Twitter.prototype.getLoginStatus = function(callback, force) {
    if (callback == null) callback = this.loginStatusHandler;
    if (force == null) force = false;
    console.debug('Twitter#getLoginStatus');
    return callback(this.T);
  };

  Twitter.prototype.loginStatusHandler = function(response) {
    console.debug('Twitter#loginStatusHandler', response);
    if (response.currentUser) {
      return this.publishSession(response);
    } else {
      return mediator.publish('logout');
    }
  };

  Twitter.prototype.logout = function() {
    var _ref;
    console.log('Twitter#logout');
    return typeof twttr !== "undefined" && twttr !== null ? (_ref = twttr.anywhere) != null ? typeof _ref.signOut === "function" ? _ref.signOut() : void 0 : void 0 : void 0;
  };

  return Twitter;

})(ServiceProvider);
;
});
define("lib/support", function(require, exports, module) {
  var chaplinSupport, support, utils;

utils = require('lib/utils');

chaplinSupport = require('chaplin/lib/support');

module.exports = support = utils.beget(chaplinSupport);
;
});
define("lib/utils", function(require, exports, module) {
  var chaplinUtils, mediator, utils;

mediator = require('mediator');

chaplinUtils = require('chaplin/lib/utils');

module.exports = utils = chaplinUtils.beget(chaplinUtils);

_(utils).extend({
  facebookImageURL: function(fbId, type) {
    var accessToken, params;
    if (type == null) type = 'square';
    params = {
      type: type
    };
    if (mediator.user) {
      accessToken = mediator.user.get('accessToken');
      if (accessToken) params.access_token = accessToken;
    }
    return "https://graph.facebook.com/" + fbId + "/picture?" + ($.param(params));
  }
});
;
});
define("lib/view_helper", function(require, exports, module) {
  var Handlebars;

Handlebars = require('handlebars');

Handlebars.registerHelper('transform_if_retweeted', function(options) {
  var data;
  if (this.retweeted_status) {
    data = _.clone(this.retweeted_status);
    data.retweeter = this.user;
    return options.fn(data);
  } else {
    return options.fn(this);
  }
});

Handlebars.registerHelper('auto_link', function(options) {
  return new Handlebars.SafeString(twttr.txt.autoLink(options.fn(this)));
});

Handlebars.registerHelper('format_date', function(options) {
  var date;
  date = new Date(options.fn(this));
  return new Handlebars.SafeString(moment(date).fromNow());
});

Handlebars.registerHelper('unless_is_web', function(source, options) {
  var string;
  string = source === 'web' ? '' : options.fn(this);
  return new Handlebars.SafeString(string);
});
;
});
define("mediator", function(require, exports, module) {
  var createMediator, mediator;

createMediator = require('chaplin/lib/create_mediator');

module.exports = mediator = createMediator({
  createRouterProperty: true,
  createUserProperty: true
});
;
});
define("models/collection", function(require, exports, module) {
  var ChaplinCollection, Collection,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

ChaplinCollection = require('chaplin/models/collection');

module.exports = Collection = (function(_super) {

  __extends(Collection, _super);

  function Collection() {
    Collection.__super__.constructor.apply(this, arguments);
  }

  return Collection;

})(ChaplinCollection);
;
});
define("models/model", function(require, exports, module) {
  var ChaplinModel, Model,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

ChaplinModel = require('chaplin/models/model');

module.exports = Model = (function(_super) {

  __extends(Model, _super);

  function Model() {
    Model.__super__.constructor.apply(this, arguments);
  }

  return Model;

})(ChaplinModel);
;
});
define("models/navigation", function(require, exports, module) {
  var Model, Navigation,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Model = require('./model');

module.exports = Navigation = (function(_super) {

  __extends(Navigation, _super);

  function Navigation() {
    Navigation.__super__.constructor.apply(this, arguments);
  }

  Navigation.prototype.defaults = {
    items: [
      {
        href: '/',
        title: 'Home'
      }, {
        href: '/mentions',
        title: 'Mentions'
      }, {
        href: '/logout',
        title: 'Logout'
      }
    ]
  };

  return Navigation;

})(Model);
;
});
define("models/status", function(require, exports, module) {
  var Model, Status, mediator,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

Model = require('./model');

module.exports = Status = (function(_super) {

  __extends(Status, _super);

  function Status() {
    Status.__super__.constructor.apply(this, arguments);
  }

  Status.prototype.minLength = 1;

  Status.prototype.maxLength = 140;

  Status.prototype.validate = function(attributes) {
    var text;
    text = attributes.text;
    if ((!text) || (text.length < this.minLength) || (text.length > this.maxLength)) {
      return 'Invalid text';
    }
  };

  Status.prototype.calcCharCount = function(value) {
    return this.maxLength - value;
  };

  Status.prototype.sync = function(method, model, options) {
    var provider, timeout,
      _this = this;
    provider = mediator.user.get('provider');
    timeout = setTimeout(options.error.bind(options, 'Timeout error'), 4000);
    provider.T.Status.update(model.get('text'), function(tweet) {
      window.clearTimeout(timeout);
      mediator.publish('tweet:add', tweet.attributes);
      return options.success(tweet.attributes);
    });
  };

  return Status;

})(Model);
;
});
define("models/tweet", function(require, exports, module) {
  var Model, Tweet,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

Model = require('./model');

module.exports = Tweet = (function(_super) {

  __extends(Tweet, _super);

  function Tweet() {
    Tweet.__super__.constructor.apply(this, arguments);
  }

  return Tweet;

})(Model);
;
});
define("models/tweets", function(require, exports, module) {
  var Collection, Tweet, Tweets, mediator,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

Collection = require('./collection');

Tweet = require('./tweet');

module.exports = Tweets = (function(_super) {

  __extends(Tweets, _super);

  function Tweets() {
    this.addTweet = __bind(this.addTweet, this);
    this.processTweets = __bind(this.processTweets, this);
    Tweets.__super__.constructor.apply(this, arguments);
  }

  Tweets.prototype.model = Tweet;

  Tweets.prototype.initialize = function() {
    Tweets.__super__.initialize.apply(this, arguments);
    _(this).extend($.Deferred());
    this.getTweets();
    this.subscribeEvent('login', this.getTweets);
    this.subscribeEvent('logout', this.reset);
    return this.subscribeEvent('tweet:add', this.addTweet);
  };

  Tweets.prototype.getTweets = function() {
    var provider, user;
    console.debug('Tweets#getTweets');
    user = mediator.user;
    if (!user) return;
    provider = user.get('provider');
    if (provider.name !== 'twitter') return;
    this.trigger('loadStart');
    return provider.T.currentUser.homeTimeline(this.processTweets);
  };

  Tweets.prototype.processTweets = function(response) {
    var tweets,
      _this = this;
    tweets = (response != null ? response.array : void 0) ? _(response.array).map(function(tweet) {
      return tweet.attributes;
    }) : [];
    console.debug('Tweets#processTweets', tweets);
    this.trigger('load');
    this.reset(tweets);
    return this.resolve();
  };

  Tweets.prototype.addTweet = function(tweet) {
    return this.add(tweet, {
      at: 0
    });
  };

  return Tweets;

})(Collection);
;
});
define("models/user", function(require, exports, module) {
  var Model, User, mediator,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

Model = require('./model');

module.exports = User = (function(_super) {

  __extends(User, _super);

  function User() {
    this.initializeMethods = __bind(this.initializeMethods, this);
    User.__super__.constructor.apply(this, arguments);
  }

  User.prototype.initialize = function() {
    User.__super__.initialize.apply(this, arguments);
    return mediator.on('userMethods', this.initializeMethods);
  };

  User.prototype.initializeMethods = function(methods) {
    var _this = this;
    return Object.keys(methods).filter(function(method) {
      return !_this[method];
    }).forEach(function(method) {
      return _this[method] = methods[method];
    });
  };

  return User;

})(Model);
;
});
define("routes", function(require, exports, module) {
  
module.exports = function(match) {
  match('', 'tweets#index');
  match('@:user', 'user#show');
  return match('logout', 'navigation#logout');
};
;
});
define("views/composite_view", function(require, exports, module) {
  var CompositeView, View,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

View = require('views/view');

module.exports = CompositeView = (function(_super) {

  __extends(CompositeView, _super);

  function CompositeView() {
    this.dispose = __bind(this.dispose, this);
    this.render = __bind(this.render, this);
    CompositeView.__super__.constructor.apply(this, arguments);
  }

  CompositeView.prototype.initialize = function() {
    CompositeView.__super__.initialize.apply(this, arguments);
    return this.subViews = [];
  };

  CompositeView.prototype.attachView = function(view) {
    return this.subViews.push(view);
  };

  CompositeView.prototype.renderSubViews = function() {
    var _this = this;
    return _(this.subViews).forEach(function(view) {
      return _this.$(view.containerSelector).append(view.render().el);
    });
  };

  CompositeView.prototype.render = function() {
    CompositeView.__super__.render.apply(this, arguments);
    return this.renderSubViews();
  };

  CompositeView.prototype.dispose = function() {
    var _this = this;
    CompositeView.__super__.dispose.apply(this, arguments);
    return _(this.subViews).forEach(function(view) {
      return view.dispose();
    });
  };

  return CompositeView;

})(View);
;
});
define("views/login_view", function(require, exports, module) {
  var LoginView, View, mediator, template, utils,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

utils = require('lib/utils');

View = require('./view');

template = require('./templates/login');

module.exports = LoginView = (function(_super) {

  __extends(LoginView, _super);

  function LoginView() {
    LoginView.__super__.constructor.apply(this, arguments);
  }

  LoginView.prototype.template = template;

  LoginView.prototype.id = 'login';

  LoginView.prototype.containerSelector = '#content-container';

  LoginView.prototype.autoRender = true;

  LoginView.prototype.initialize = function(options) {
    LoginView.__super__.initialize.apply(this, arguments);
    console.debug('LoginView#initialize', this.el, this.$el, options, options.serviceProviders);
    return this.initButtons(options.serviceProviders);
  };

  LoginView.prototype.initButtons = function(serviceProviders) {
    var buttonSelector, failed, loaded, loginHandler, serviceProvider, serviceProviderName, _results;
    console.debug('LoginView#initButtons', serviceProviders);
    _results = [];
    for (serviceProviderName in serviceProviders) {
      serviceProvider = serviceProviders[serviceProviderName];
      buttonSelector = "." + serviceProviderName;
      this.$(buttonSelector).addClass('service-loading');
      loginHandler = _(this.loginWith).bind(this, serviceProviderName, serviceProvider);
      this.delegate('click', buttonSelector, loginHandler);
      loaded = _(this.serviceProviderLoaded).bind(this, serviceProviderName, serviceProvider);
      serviceProvider.done(loaded);
      failed = _(this.serviceProviderFailed).bind(this, serviceProviderName, serviceProvider);
      _results.push(serviceProvider.fail(failed));
    }
    return _results;
  };

  LoginView.prototype.loginWith = function(serviceProviderName, serviceProvider, e) {
    console.debug('LoginView#loginWith', serviceProviderName, serviceProvider);
    e.preventDefault();
    if (!serviceProvider.isLoaded()) return;
    mediator.publish('login:pickService', serviceProviderName);
    return mediator.publish('!login', serviceProviderName);
  };

  LoginView.prototype.serviceProviderLoaded = function(serviceProviderName) {
    return this.$("." + serviceProviderName).removeClass('service-loading');
  };

  LoginView.prototype.serviceProviderFailed = function(serviceProviderName) {
    return this.$("." + serviceProviderName).removeClass('service-loading').addClass('service-unavailable').attr('disabled', true).attr('title', "Error connecting. Please check whether you areblocking " + (utils.upcase(serviceProviderName)) + ".");
  };

  return LoginView;

})(View);
;
});
define("views/navigation_view", function(require, exports, module) {
  var NavigationView, View, mediator, template,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

View = require('./view');

template = require('./templates/navigation');

module.exports = NavigationView = (function(_super) {

  __extends(NavigationView, _super);

  function NavigationView() {
    NavigationView.__super__.constructor.apply(this, arguments);
  }

  NavigationView.prototype.template = template;

  NavigationView.prototype.id = 'navigation';

  NavigationView.prototype.containerSelector = '#navigation-container';

  NavigationView.prototype.autoRender = true;

  NavigationView.prototype.initialize = function() {
    NavigationView.__super__.initialize.apply(this, arguments);
    this.subscribeEvent('loginStatus', this.render);
    return this.subscribeEvent('startupController', this.render);
  };

  return NavigationView;

})(View);
;
});
define("views/sidebar_view", function(require, exports, module) {
  var CompositeView, SidebarView, StatsView, StatusView, mediator, template,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

CompositeView = require('./composite_view');

StatsView = require('./stats_view');

StatusView = require('./status_view');

template = require('./templates/sidebar');

module.exports = SidebarView = (function(_super) {

  __extends(SidebarView, _super);

  function SidebarView() {
    this.loginStatusHandler = __bind(this.loginStatusHandler, this);
    SidebarView.__super__.constructor.apply(this, arguments);
  }

  SidebarView.prototype.template = template;

  SidebarView.prototype.id = 'sidebar';

  SidebarView.prototype.containerSelector = '#sidebar-container';

  SidebarView.prototype.autoRender = true;

  SidebarView.prototype.initialize = function() {
    SidebarView.__super__.initialize.apply(this, arguments);
    this.attachView(new StatusView());
    this.attachView(new StatsView());
    this.subscribeEvent('loginStatus', this.loginStatusHandler);
    return this.subscribeEvent('userData', this.render);
  };

  SidebarView.prototype.loginStatusHandler = function(loggedIn) {
    if (loggedIn) {
      this.model = mediator.user;
    } else {
      this.model = null;
    }
    return this.render();
  };

  return SidebarView;

})(CompositeView);
;
});
define("views/stats_view", function(require, exports, module) {
  var StatsView, View, mediator, template,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

View = require('./view');

template = require('./templates/stats');

module.exports = StatsView = (function(_super) {

  __extends(StatsView, _super);

  function StatsView() {
    this.loginStatusHandler = __bind(this.loginStatusHandler, this);
    StatsView.__super__.constructor.apply(this, arguments);
  }

  StatsView.prototype.template = template;

  StatsView.prototype.className = 'stats';

  StatsView.prototype.tagName = 'ul';

  StatsView.prototype.containerSelector = '#stats-container';

  StatsView.prototype.initialize = function() {
    StatsView.__super__.initialize.apply(this, arguments);
    this.subscribeEvent('loginStatus', this.loginStatusHandler);
    return this.subscribeEvent('userData', this.render);
  };

  StatsView.prototype.loginStatusHandler = function(loggedIn) {
    if (loggedIn) {
      this.model = mediator.user;
    } else {
      this.model = null;
    }
    return this.render();
  };

  return StatsView;

})(View);
;
});
define("views/status_view", function(require, exports, module) {
  var Status, StatusView, View, mediator, template,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

Status = require('models/status');

View = require('./view');

template = require('./templates/status');

module.exports = StatusView = (function(_super) {

  __extends(StatusView, _super);

  function StatusView() {
    this.render = __bind(this.render, this);
    this.createStatus = __bind(this.createStatus, this);
    this.updateStatusText = __bind(this.updateStatusText, this);
    this.updateCharacterCount = __bind(this.updateCharacterCount, this);
    this.loginStatusHandler = __bind(this.loginStatusHandler, this);
    StatusView.__super__.constructor.apply(this, arguments);
  }

  StatusView.prototype.template = template;

  StatusView.prototype.id = 'status';

  StatusView.prototype.className = 'status';

  StatusView.prototype.containerSelector = '#status-container';

  StatusView.prototype.initialize = function() {
    StatusView.__super__.initialize.apply(this, arguments);
    this.subscribeEvent('loginStatus', this.loginStatusHandler);
    return this.subscribeEvent('userData', this.render);
  };

  StatusView.prototype.loginStatusHandler = function(loggedIn) {
    if (loggedIn) {
      this.model = new Status();
    } else {
      this.model = null;
    }
    return this.render();
  };

  StatusView.prototype.updateCharacterCount = function(valid, count) {
    var $charCount, $createButton;
    $charCount = this.$('.status-character-count');
    $createButton = this.$('.status-create-button');
    $charCount.text(count);
    if (valid) {
      $charCount.removeClass('status-character-count-invalid');
      return $createButton.removeAttr('disabled');
    } else {
      if (count !== 140) $charCount.addClass('status-character-count-invalid');
      return $createButton.attr('disabled', 'disabled');
    }
  };

  StatusView.prototype.updateStatusText = function(event) {
    var count, text, valid;
    text = $(event.currentTarget).val();
    valid = this.model.set({
      text: text
    });
    count = this.model.calcCharCount(text.length);
    return this.updateCharacterCount(valid, count);
  };

  StatusView.prototype.createStatus = function(event) {
    var _this = this;
    return this.model.save({}, {
      error: function(model, error) {
        return console.error('Tweet error', error);
      },
      success: function(model, attributes) {
        console.debug('Tweet success', attributes);
        return _this.$('.status-text').val('').trigger('keydown');
      }
    });
  };

  StatusView.prototype.render = function() {
    var _this = this;
    StatusView.__super__.render.apply(this, arguments);
    _(['keyup', 'keydown']).each(function(eventName) {
      return _this.delegate(eventName, '.status-text', _this.updateStatusText);
    });
    return this.delegate('click', '.status-create-button', this.createStatus);
  };

  return StatusView;

})(View);
;
});
define("views/templates/login", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"login-note\">\n  <h3>Tweet your brunch</h3>\n  <img class=\"sign-in-button twitter\" src=\"https://si0.twimg.com/images/dev/buttons/sign-in-with-twitter-l.png\" alt=\"Sign in with Twitter\" /> \n</div>\n";});;
});
define("views/templates/navigation", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <div class=\"navbar-inner\">\n    <div class=\"container\">\n      <div class=\"nav-collapse\">\n        <ul class=\"nav\">\n          ";
  foundHelper = helpers.items;
  stack1 = foundHelper || depth0.items;
  stack2 = helpers.each;
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </ul>\n      </div>\n    </div>\n  </div>\n";
  return buffer;}
function program2(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n            <li class=\"nav-item\">\n              <a class=\"nav-item-link\" href=\"#";
  stack1 = depth0.href;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.href", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n                <div class=\"nav-item-icon-container\">\n                  <span class=\"nav-item-icon\"></span>\n                </div>\n                <span class=\"nav-item-title\">";
  stack1 = depth0.title;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "this.title", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</span>\n              </a>\n            </li>\n          ";
  return buffer;}

  foundHelper = helpers.if_logged_in;
  stack1 = foundHelper || depth0.if_logged_in;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});;
});
define("views/templates/sidebar", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"account-summary-container\">\n    <div class=\"account-summary\">\n      <img class=\"account-summary-avatar avatar size32\" src=\"";
  foundHelper = helpers.profile_image_url;
  stack1 = foundHelper || depth0.profile_image_url;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "profile_image_url", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" alt=\"";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n      <div class=\"account-summary-content\">\n        <strong class=\"account-summary-full-name\">";
  foundHelper = helpers.name;
  stack1 = foundHelper || depth0.name;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</strong>\n        <small class=\"account-summary-metadata\">View my profile page</small>\n      </div>\n    </div>\n  </div>\n  <div class=\"stats-container\" id=\"stats-container\"></div>\n  <div class=\"status-container\" id=\"status-container\"></div>\n";
  return buffer;}

function program3(depth0,data) {
  
  
  return "\n  <div class=\"app-description\">\n    Tweet your brunch is a simple twitter client built with <a href=\"http://brunch.io/\">Brunch</a> &amp; <a href=\"https://github.com/paulmillr/brunch-with-chaplin\">Brunch with Chaplin</a>.\n  </div>\n";}

  foundHelper = helpers.if_logged_in;
  stack1 = foundHelper || depth0.if_logged_in;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.program(3, program3, data);
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});;
});
define("views/templates/stats", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<li class=\"stat-tweets\"><strong>";
  foundHelper = helpers.statuses_count;
  stack1 = foundHelper || depth0.statuses_count;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "statuses_count", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</strong> tweets</li>\n<li class=\"stat-following\"><strong>";
  foundHelper = helpers.friends_count;
  stack1 = foundHelper || depth0.friends_count;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "friends_count", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</strong> following</li>\n<li class=\"stat-followers\"><strong>";
  foundHelper = helpers.followers_count;
  stack1 = foundHelper || depth0.followers_count;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "followers_count", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</strong> followers</li>\n";
  return buffer;});;
});
define("views/templates/status", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "\n  <textarea class=\"status-text\" placeholder=\"What's happening?\"></textarea>\n  <div class=\"status-info\">\n    <span class=\"status-character-count\">140</span>\n    <button class=\"status-create-button btn btn-primary\" disabled>Tweet</button>\n  </div>\n";}

  foundHelper = helpers.if_logged_in;
  stack1 = foundHelper || depth0.if_logged_in;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});;
});
define("views/templates/tweet", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, tmp1, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "", stack1, stack2;
  buffer += "\n  <div class=\"tweet-content\">\n    <header class=\"tweet-header\">\n      <a href=\"https://twitter.com/";
  foundHelper = helpers.user;
  stack1 = foundHelper || depth0.user;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.screen_name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "user.screen_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n        <img class=\"avatar\" src=\"";
  foundHelper = helpers.user;
  stack1 = foundHelper || depth0.user;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.profile_image_url);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "user.profile_image_url", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\" alt=\"\" />\n        <strong class=\"tweet-author-full-name\">\n          ";
  foundHelper = helpers.user;
  stack1 = foundHelper || depth0.user;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "user.name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\n        </strong>\n      </a>\n    </header>\n    <p class=\"tweet-text\">";
  foundHelper = helpers.auto_link;
  stack1 = foundHelper || depth0.auto_link;
  tmp1 = self.program(2, program2, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</p>\n    <footer class=\"tweet-footer\">\n      <a href=\"http://twitter.com/";
  foundHelper = helpers.user;
  stack1 = foundHelper || depth0.user;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.screen_name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "user.screen_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "/status/";
  foundHelper = helpers.id_str;
  stack1 = foundHelper || depth0.id_str;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "id_str", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n        <time class=\"tweet-created-at\" datetime=\"";
  foundHelper = helpers.created_at;
  stack1 = foundHelper || depth0.created_at;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "created_at", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">\n          ";
  foundHelper = helpers.format_date;
  stack1 = foundHelper || depth0.format_date;
  tmp1 = self.program(4, program4, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n        </time>\n      </a>\n      ";
  foundHelper = helpers.source;
  stack1 = foundHelper || depth0.source;
  foundHelper = helpers.unless_is_web;
  stack2 = foundHelper || depth0.unless_is_web;
  tmp1 = self.program(6, program6, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack2 === functionType) { stack1 = stack2.call(depth0, stack1, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack2, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  foundHelper = helpers.retweeter;
  stack1 = foundHelper || depth0.retweeter;
  stack2 = helpers['if'];
  tmp1 = self.program(8, program8, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  stack1 = stack2.call(depth0, stack1, tmp1);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    </footer>\n  </div>\n";
  return buffer;}
function program2(depth0,data) {
  
  var stack1;
  foundHelper = helpers.text;
  stack1 = foundHelper || depth0.text;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "text", { hash: {} }); }
  return escapeExpression(stack1);}

function program4(depth0,data) {
  
  var stack1;
  foundHelper = helpers.created_at;
  stack1 = foundHelper || depth0.created_at;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "created_at", { hash: {} }); }
  return escapeExpression(stack1);}

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        via <span class=\"tweet-source\">";
  foundHelper = helpers.source;
  stack1 = foundHelper || depth0.source;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "source", { hash: {} }); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</span>\n      ";
  return buffer;}

function program8(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <p class=\"tweet-retweeter\">\n          Retweeted by <a class=\"tweet-retweeter-username\" href=\"https://twitter.com/";
  foundHelper = helpers.retweeter;
  stack1 = foundHelper || depth0.retweeter;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.screen_name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "retweeter.screen_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\">";
  foundHelper = helpers.retweeter;
  stack1 = foundHelper || depth0.retweeter;
  stack1 = (stack1 === null || stack1 === undefined || stack1 === false ? stack1 : stack1.screen_name);
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "retweeter.screen_name", { hash: {} }); }
  buffer += escapeExpression(stack1) + "</a>\n        </p>\n      ";
  return buffer;}

  foundHelper = helpers.transform_if_retweeted;
  stack1 = foundHelper || depth0.transform_if_retweeted;
  tmp1 = self.program(1, program1, data);
  tmp1.hash = {};
  tmp1.fn = tmp1;
  tmp1.inverse = self.noop;
  if(foundHelper && typeof stack1 === functionType) { stack1 = stack1.call(depth0, tmp1); }
  else { stack1 = blockHelperMissing.call(depth0, stack1, tmp1); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n";
  return buffer;});;
});
define("views/templates/tweets", function(require, exports, module) {
  module.exports = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<header class=\"tweets-header\">\n  <h3>Tweets</h3>\n</header>\n<div class=\"tweets\"></div>\n";});;
});
define("views/tweet_view", function(require, exports, module) {
  var TweetView, View, template,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

template = require('./templates/tweet');

View = require('./view');

module.exports = TweetView = (function(_super) {

  __extends(TweetView, _super);

  function TweetView() {
    TweetView.__super__.constructor.apply(this, arguments);
  }

  TweetView.prototype.template = template;

  TweetView.prototype.className = 'tweet';

  return TweetView;

})(View);
;
});
define("views/tweets_view", function(require, exports, module) {
  var CollectionView, TweetView, TweetsView, mediator, template,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

mediator = require('mediator');

CollectionView = require('chaplin/views/collection_view');

TweetView = require('./tweet_view');

template = require('./templates/tweets');

module.exports = TweetsView = (function(_super) {

  __extends(TweetsView, _super);

  function TweetsView() {
    TweetsView.__super__.constructor.apply(this, arguments);
  }

  TweetsView.prototype.template = template;

  TweetsView.prototype.tagName = 'div';

  TweetsView.prototype.id = 'tweets';

  TweetsView.prototype.containerSelector = '#content-container';

  TweetsView.prototype.listSelector = '.tweets';

  TweetsView.prototype.fallbackSelector = '.fallback';

  TweetsView.prototype.initialize = function() {
    TweetsView.__super__.initialize.apply(this, arguments);
    return this.subscribeEvent('loginStatus', this.showHideLoginNote);
  };

  TweetsView.prototype.getView = function(item) {
    return new TweetView({
      model: item
    });
  };

  TweetsView.prototype.showHideLoginNote = function() {
    return this.$('.tweets, .tweets-header').css('display', mediator.user ? 'block' : 'none');
  };

  TweetsView.prototype.render = function() {
    console.log('TweetsView#render', this, this.$el);
    TweetsView.__super__.render.apply(this, arguments);
    return this.showHideLoginNote();
  };

  TweetsView.prototype.afterRender = function() {
    TweetsView.__super__.afterRender.apply(this, arguments);
    return console.log('TweetsView#afterRender', this.containerSelector, $(this.containerSelector));
  };

  return TweetsView;

})(CollectionView);
;
});
define("views/view", function(require, exports, module) {
  var ChaplinView, View,
  __hasProp = Object.prototype.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

ChaplinView = require('chaplin/views/view');

module.exports = View = (function(_super) {

  __extends(View, _super);

  function View() {
    View.__super__.constructor.apply(this, arguments);
  }

  return View;

})(ChaplinView);
;
});
