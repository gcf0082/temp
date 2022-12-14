/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/balanced-match/index.js":
/*!**********************************************!*\
  !*** ./node_modules/balanced-match/index.js ***!
  \**********************************************/
/***/ ((module) => {

"use strict";

module.exports = balanced;
function balanced(a, b, str) {
  if (a instanceof RegExp) a = maybeMatch(a, str);
  if (b instanceof RegExp) b = maybeMatch(b, str);

  var r = range(a, b, str);

  return r && {
    start: r[0],
    end: r[1],
    pre: str.slice(0, r[0]),
    body: str.slice(r[0] + a.length, r[1]),
    post: str.slice(r[1] + b.length)
  };
}

function maybeMatch(reg, str) {
  var m = str.match(reg);
  return m ? m[0] : null;
}

balanced.range = range;
function range(a, b, str) {
  var begs, beg, left, right, result;
  var ai = str.indexOf(a);
  var bi = str.indexOf(b, ai + 1);
  var i = ai;

  if (ai >= 0 && bi > 0) {
    if(a===b) {
      return [ai, bi];
    }
    begs = [];
    left = str.length;

    while (i >= 0 && !result) {
      if (i == ai) {
        begs.push(i);
        ai = str.indexOf(a, i + 1);
      } else if (begs.length == 1) {
        result = [ begs.pop(), bi ];
      } else {
        beg = begs.pop();
        if (beg < left) {
          left = beg;
          right = bi;
        }

        bi = str.indexOf(b, i + 1);
      }

      i = ai < bi && ai >= 0 ? ai : bi;
    }

    if (begs.length) {
      result = [ left, right ];
    }
  }

  return result;
}


/***/ }),

/***/ "./node_modules/brace-expansion/index.js":
/*!***********************************************!*\
  !*** ./node_modules/brace-expansion/index.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var concatMap = __webpack_require__(/*! concat-map */ "./node_modules/concat-map/index.js");
var balanced = __webpack_require__(/*! balanced-match */ "./node_modules/balanced-match/index.js");

module.exports = expandTop;

var escSlash = '\0SLASH'+Math.random()+'\0';
var escOpen = '\0OPEN'+Math.random()+'\0';
var escClose = '\0CLOSE'+Math.random()+'\0';
var escComma = '\0COMMA'+Math.random()+'\0';
var escPeriod = '\0PERIOD'+Math.random()+'\0';

function numeric(str) {
  return parseInt(str, 10) == str
    ? parseInt(str, 10)
    : str.charCodeAt(0);
}

function escapeBraces(str) {
  return str.split('\\\\').join(escSlash)
            .split('\\{').join(escOpen)
            .split('\\}').join(escClose)
            .split('\\,').join(escComma)
            .split('\\.').join(escPeriod);
}

function unescapeBraces(str) {
  return str.split(escSlash).join('\\')
            .split(escOpen).join('{')
            .split(escClose).join('}')
            .split(escComma).join(',')
            .split(escPeriod).join('.');
}


// Basically just str.split(","), but handling cases
// where we have nested braced sections, which should be
// treated as individual members, like {a,{b,c},d}
function parseCommaParts(str) {
  if (!str)
    return [''];

  var parts = [];
  var m = balanced('{', '}', str);

  if (!m)
    return str.split(',');

  var pre = m.pre;
  var body = m.body;
  var post = m.post;
  var p = pre.split(',');

  p[p.length-1] += '{' + body + '}';
  var postParts = parseCommaParts(post);
  if (post.length) {
    p[p.length-1] += postParts.shift();
    p.push.apply(p, postParts);
  }

  parts.push.apply(parts, p);

  return parts;
}

function expandTop(str) {
  if (!str)
    return [];

  // I don't know why Bash 4.3 does this, but it does.
  // Anything starting with {} will have the first two bytes preserved
  // but *only* at the top level, so {},a}b will not expand to anything,
  // but a{},b}c will be expanded to [a}c,abc].
  // One could argue that this is a bug in Bash, but since the goal of
  // this module is to match Bash's rules, we escape a leading {}
  if (str.substr(0, 2) === '{}') {
    str = '\\{\\}' + str.substr(2);
  }

  return expand(escapeBraces(str), true).map(unescapeBraces);
}

function identity(e) {
  return e;
}

function embrace(str) {
  return '{' + str + '}';
}
function isPadded(el) {
  return /^-?0\d/.test(el);
}

function lte(i, y) {
  return i <= y;
}
function gte(i, y) {
  return i >= y;
}

function expand(str, isTop) {
  var expansions = [];

  var m = balanced('{', '}', str);
  if (!m || /\$$/.test(m.pre)) return [str];

  var isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
  var isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
  var isSequence = isNumericSequence || isAlphaSequence;
  var isOptions = m.body.indexOf(',') >= 0;
  if (!isSequence && !isOptions) {
    // {a},b}
    if (m.post.match(/,.*\}/)) {
      str = m.pre + '{' + m.body + escClose + m.post;
      return expand(str);
    }
    return [str];
  }

  var n;
  if (isSequence) {
    n = m.body.split(/\.\./);
  } else {
    n = parseCommaParts(m.body);
    if (n.length === 1) {
      // x{{a,b}}y ==> x{a}y x{b}y
      n = expand(n[0], false).map(embrace);
      if (n.length === 1) {
        var post = m.post.length
          ? expand(m.post, false)
          : [''];
        return post.map(function(p) {
          return m.pre + n[0] + p;
        });
      }
    }
  }

  // at this point, n is the parts, and we know it's not a comma set
  // with a single entry.

  // no need to expand pre, since it is guaranteed to be free of brace-sets
  var pre = m.pre;
  var post = m.post.length
    ? expand(m.post, false)
    : [''];

  var N;

  if (isSequence) {
    var x = numeric(n[0]);
    var y = numeric(n[1]);
    var width = Math.max(n[0].length, n[1].length)
    var incr = n.length == 3
      ? Math.abs(numeric(n[2]))
      : 1;
    var test = lte;
    var reverse = y < x;
    if (reverse) {
      incr *= -1;
      test = gte;
    }
    var pad = n.some(isPadded);

    N = [];

    for (var i = x; test(i, y); i += incr) {
      var c;
      if (isAlphaSequence) {
        c = String.fromCharCode(i);
        if (c === '\\')
          c = '';
      } else {
        c = String(i);
        if (pad) {
          var need = width - c.length;
          if (need > 0) {
            var z = new Array(need + 1).join('0');
            if (i < 0)
              c = '-' + z + c.slice(1);
            else
              c = z + c;
          }
        }
      }
      N.push(c);
    }
  } else {
    N = concatMap(n, function(el) { return expand(el, false) });
  }

  for (var j = 0; j < N.length; j++) {
    for (var k = 0; k < post.length; k++) {
      var expansion = pre + N[j] + post[k];
      if (!isTop || isSequence || expansion)
        expansions.push(expansion);
    }
  }

  return expansions;
}



/***/ }),

/***/ "./node_modules/concat-map/index.js":
/*!******************************************!*\
  !*** ./node_modules/concat-map/index.js ***!
  \******************************************/
/***/ ((module) => {

module.exports = function (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        var x = fn(xs[i], i);
        if (isArray(x)) res.push.apply(res, x);
        else res.push(x);
    }
    return res;
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};


/***/ }),

/***/ "./node_modules/fs.realpath/index.js":
/*!*******************************************!*\
  !*** ./node_modules/fs.realpath/index.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = realpath
realpath.realpath = realpath
realpath.sync = realpathSync
realpath.realpathSync = realpathSync
realpath.monkeypatch = monkeypatch
realpath.unmonkeypatch = unmonkeypatch

var fs = __webpack_require__(/*! fs */ "fs")
var origRealpath = fs.realpath
var origRealpathSync = fs.realpathSync

var version = process.version
var ok = /^v[0-5]\./.test(version)
var old = __webpack_require__(/*! ./old.js */ "./node_modules/fs.realpath/old.js")

function newError (er) {
  return er && er.syscall === 'realpath' && (
    er.code === 'ELOOP' ||
    er.code === 'ENOMEM' ||
    er.code === 'ENAMETOOLONG'
  )
}

function realpath (p, cache, cb) {
  if (ok) {
    return origRealpath(p, cache, cb)
  }

  if (typeof cache === 'function') {
    cb = cache
    cache = null
  }
  origRealpath(p, cache, function (er, result) {
    if (newError(er)) {
      old.realpath(p, cache, cb)
    } else {
      cb(er, result)
    }
  })
}

function realpathSync (p, cache) {
  if (ok) {
    return origRealpathSync(p, cache)
  }

  try {
    return origRealpathSync(p, cache)
  } catch (er) {
    if (newError(er)) {
      return old.realpathSync(p, cache)
    } else {
      throw er
    }
  }
}

function monkeypatch () {
  fs.realpath = realpath
  fs.realpathSync = realpathSync
}

function unmonkeypatch () {
  fs.realpath = origRealpath
  fs.realpathSync = origRealpathSync
}


/***/ }),

/***/ "./node_modules/fs.realpath/old.js":
/*!*****************************************!*\
  !*** ./node_modules/fs.realpath/old.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var pathModule = __webpack_require__(/*! path */ "path");
var isWindows = process.platform === 'win32';
var fs = __webpack_require__(/*! fs */ "fs");

// JavaScript implementation of realpath, ported from node pre-v6

var DEBUG = process.env.NODE_DEBUG && /fs/.test(process.env.NODE_DEBUG);

function rethrow() {
  // Only enable in debug mode. A backtrace uses ~1000 bytes of heap space and
  // is fairly slow to generate.
  var callback;
  if (DEBUG) {
    var backtrace = new Error;
    callback = debugCallback;
  } else
    callback = missingCallback;

  return callback;

  function debugCallback(err) {
    if (err) {
      backtrace.message = err.message;
      err = backtrace;
      missingCallback(err);
    }
  }

  function missingCallback(err) {
    if (err) {
      if (process.throwDeprecation)
        throw err;  // Forgot a callback but don't know where? Use NODE_DEBUG=fs
      else if (!process.noDeprecation) {
        var msg = 'fs: missing callback ' + (err.stack || err.message);
        if (process.traceDeprecation)
          console.trace(msg);
        else
          console.error(msg);
      }
    }
  }
}

function maybeCallback(cb) {
  return typeof cb === 'function' ? cb : rethrow();
}

var normalize = pathModule.normalize;

// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
  var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
  var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
  var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
  var splitRootRe = /^[\/]*/;
}

exports.realpathSync = function realpathSync(p, cache) {
  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return cache[p];
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstatSync(base);
      knownHard[base] = true;
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  // NB: p.length changes.
  while (pos < p.length) {
    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      continue;
    }

    var resolvedLink;
    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // some known symbolic link.  no need to stat again.
      resolvedLink = cache[base];
    } else {
      var stat = fs.lstatSync(base);
      if (!stat.isSymbolicLink()) {
        knownHard[base] = true;
        if (cache) cache[base] = base;
        continue;
      }

      // read the link if it wasn't read before
      // dev/ino always return 0 on windows, so skip the check.
      var linkTarget = null;
      if (!isWindows) {
        var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
        if (seenLinks.hasOwnProperty(id)) {
          linkTarget = seenLinks[id];
        }
      }
      if (linkTarget === null) {
        fs.statSync(base);
        linkTarget = fs.readlinkSync(base);
      }
      resolvedLink = pathModule.resolve(previous, linkTarget);
      // track this, if given a cache.
      if (cache) cache[base] = resolvedLink;
      if (!isWindows) seenLinks[id] = linkTarget;
    }

    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }

  if (cache) cache[original] = p;

  return p;
};


exports.realpath = function realpath(p, cache, cb) {
  if (typeof cb !== 'function') {
    cb = maybeCallback(cache);
    cache = null;
  }

  // make p is absolute
  p = pathModule.resolve(p);

  if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
    return process.nextTick(cb.bind(null, null, cache[p]));
  }

  var original = p,
      seenLinks = {},
      knownHard = {};

  // current character position in p
  var pos;
  // the partial path so far, including a trailing slash if any
  var current;
  // the partial path without a trailing slash (except when pointing at a root)
  var base;
  // the partial path scanned in the previous round, with slash
  var previous;

  start();

  function start() {
    // Skip over roots
    var m = splitRootRe.exec(p);
    pos = m[0].length;
    current = m[0];
    base = m[0];
    previous = '';

    // On windows, check that the root exists. On unix there is no need.
    if (isWindows && !knownHard[base]) {
      fs.lstat(base, function(err) {
        if (err) return cb(err);
        knownHard[base] = true;
        LOOP();
      });
    } else {
      process.nextTick(LOOP);
    }
  }

  // walk down the path, swapping out linked pathparts for their real
  // values
  function LOOP() {
    // stop if scanned past end of path
    if (pos >= p.length) {
      if (cache) cache[original] = p;
      return cb(null, p);
    }

    // find the next part
    nextPartRe.lastIndex = pos;
    var result = nextPartRe.exec(p);
    previous = current;
    current += result[0];
    base = previous + result[1];
    pos = nextPartRe.lastIndex;

    // continue if not a symlink
    if (knownHard[base] || (cache && cache[base] === base)) {
      return process.nextTick(LOOP);
    }

    if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
      // known symbolic link.  no need to stat again.
      return gotResolvedLink(cache[base]);
    }

    return fs.lstat(base, gotStat);
  }

  function gotStat(err, stat) {
    if (err) return cb(err);

    // if not a symlink, skip to the next path part
    if (!stat.isSymbolicLink()) {
      knownHard[base] = true;
      if (cache) cache[base] = base;
      return process.nextTick(LOOP);
    }

    // stat & read the link if not read before
    // call gotTarget as soon as the link target is known
    // dev/ino always return 0 on windows, so skip the check.
    if (!isWindows) {
      var id = stat.dev.toString(32) + ':' + stat.ino.toString(32);
      if (seenLinks.hasOwnProperty(id)) {
        return gotTarget(null, seenLinks[id], base);
      }
    }
    fs.stat(base, function(err) {
      if (err) return cb(err);

      fs.readlink(base, function(err, target) {
        if (!isWindows) seenLinks[id] = target;
        gotTarget(err, target);
      });
    });
  }

  function gotTarget(err, target, base) {
    if (err) return cb(err);

    var resolvedLink = pathModule.resolve(previous, target);
    if (cache) cache[base] = resolvedLink;
    gotResolvedLink(resolvedLink);
  }

  function gotResolvedLink(resolvedLink) {
    // resolve the link, then start over
    p = pathModule.resolve(resolvedLink, p.slice(pos));
    start();
  }
};


/***/ }),

/***/ "./node_modules/glob/common.js":
/*!*************************************!*\
  !*** ./node_modules/glob/common.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

exports.setopts = setopts
exports.ownProp = ownProp
exports.makeAbs = makeAbs
exports.finish = finish
exports.mark = mark
exports.isIgnored = isIgnored
exports.childrenIgnored = childrenIgnored

function ownProp (obj, field) {
  return Object.prototype.hasOwnProperty.call(obj, field)
}

var fs = __webpack_require__(/*! fs */ "fs")
var path = __webpack_require__(/*! path */ "path")
var minimatch = __webpack_require__(/*! minimatch */ "./node_modules/minimatch/minimatch.js")
var isAbsolute = __webpack_require__(/*! path-is-absolute */ "./node_modules/path-is-absolute/index.js")
var Minimatch = minimatch.Minimatch

function alphasort (a, b) {
  return a.localeCompare(b, 'en')
}

function setupIgnores (self, options) {
  self.ignore = options.ignore || []

  if (!Array.isArray(self.ignore))
    self.ignore = [self.ignore]

  if (self.ignore.length) {
    self.ignore = self.ignore.map(ignoreMap)
  }
}

// ignore patterns are always in dot:true mode.
function ignoreMap (pattern) {
  var gmatcher = null
  if (pattern.slice(-3) === '/**') {
    var gpattern = pattern.replace(/(\/\*\*)+$/, '')
    gmatcher = new Minimatch(gpattern, { dot: true })
  }

  return {
    matcher: new Minimatch(pattern, { dot: true }),
    gmatcher: gmatcher
  }
}

function setopts (self, pattern, options) {
  if (!options)
    options = {}

  // base-matching: just use globstar for that.
  if (options.matchBase && -1 === pattern.indexOf("/")) {
    if (options.noglobstar) {
      throw new Error("base matching requires globstar")
    }
    pattern = "**/" + pattern
  }

  self.silent = !!options.silent
  self.pattern = pattern
  self.strict = options.strict !== false
  self.realpath = !!options.realpath
  self.realpathCache = options.realpathCache || Object.create(null)
  self.follow = !!options.follow
  self.dot = !!options.dot
  self.mark = !!options.mark
  self.nodir = !!options.nodir
  if (self.nodir)
    self.mark = true
  self.sync = !!options.sync
  self.nounique = !!options.nounique
  self.nonull = !!options.nonull
  self.nosort = !!options.nosort
  self.nocase = !!options.nocase
  self.stat = !!options.stat
  self.noprocess = !!options.noprocess
  self.absolute = !!options.absolute
  self.fs = options.fs || fs

  self.maxLength = options.maxLength || Infinity
  self.cache = options.cache || Object.create(null)
  self.statCache = options.statCache || Object.create(null)
  self.symlinks = options.symlinks || Object.create(null)

  setupIgnores(self, options)

  self.changedCwd = false
  var cwd = process.cwd()
  if (!ownProp(options, "cwd"))
    self.cwd = cwd
  else {
    self.cwd = path.resolve(options.cwd)
    self.changedCwd = self.cwd !== cwd
  }

  self.root = options.root || path.resolve(self.cwd, "/")
  self.root = path.resolve(self.root)
  if (process.platform === "win32")
    self.root = self.root.replace(/\\/g, "/")

  // TODO: is an absolute `cwd` supposed to be resolved against `root`?
  // e.g. { cwd: '/test', root: __dirname } === path.join(__dirname, '/test')
  self.cwdAbs = isAbsolute(self.cwd) ? self.cwd : makeAbs(self, self.cwd)
  if (process.platform === "win32")
    self.cwdAbs = self.cwdAbs.replace(/\\/g, "/")
  self.nomount = !!options.nomount

  // disable comments and negation in Minimatch.
  // Note that they are not supported in Glob itself anyway.
  options.nonegate = true
  options.nocomment = true
  // always treat \ in patterns as escapes, not path separators
  options.allowWindowsEscape = false

  self.minimatch = new Minimatch(pattern, options)
  self.options = self.minimatch.options
}

function finish (self) {
  var nou = self.nounique
  var all = nou ? [] : Object.create(null)

  for (var i = 0, l = self.matches.length; i < l; i ++) {
    var matches = self.matches[i]
    if (!matches || Object.keys(matches).length === 0) {
      if (self.nonull) {
        // do like the shell, and spit out the literal glob
        var literal = self.minimatch.globSet[i]
        if (nou)
          all.push(literal)
        else
          all[literal] = true
      }
    } else {
      // had matches
      var m = Object.keys(matches)
      if (nou)
        all.push.apply(all, m)
      else
        m.forEach(function (m) {
          all[m] = true
        })
    }
  }

  if (!nou)
    all = Object.keys(all)

  if (!self.nosort)
    all = all.sort(alphasort)

  // at *some* point we statted all of these
  if (self.mark) {
    for (var i = 0; i < all.length; i++) {
      all[i] = self._mark(all[i])
    }
    if (self.nodir) {
      all = all.filter(function (e) {
        var notDir = !(/\/$/.test(e))
        var c = self.cache[e] || self.cache[makeAbs(self, e)]
        if (notDir && c)
          notDir = c !== 'DIR' && !Array.isArray(c)
        return notDir
      })
    }
  }

  if (self.ignore.length)
    all = all.filter(function(m) {
      return !isIgnored(self, m)
    })

  self.found = all
}

function mark (self, p) {
  var abs = makeAbs(self, p)
  var c = self.cache[abs]
  var m = p
  if (c) {
    var isDir = c === 'DIR' || Array.isArray(c)
    var slash = p.slice(-1) === '/'

    if (isDir && !slash)
      m += '/'
    else if (!isDir && slash)
      m = m.slice(0, -1)

    if (m !== p) {
      var mabs = makeAbs(self, m)
      self.statCache[mabs] = self.statCache[abs]
      self.cache[mabs] = self.cache[abs]
    }
  }

  return m
}

// lotta situps...
function makeAbs (self, f) {
  var abs = f
  if (f.charAt(0) === '/') {
    abs = path.join(self.root, f)
  } else if (isAbsolute(f) || f === '') {
    abs = f
  } else if (self.changedCwd) {
    abs = path.resolve(self.cwd, f)
  } else {
    abs = path.resolve(f)
  }

  if (process.platform === 'win32')
    abs = abs.replace(/\\/g, '/')

  return abs
}


// Return true, if pattern ends with globstar '**', for the accompanying parent directory.
// Ex:- If node_modules/** is the pattern, add 'node_modules' to ignore list along with it's contents
function isIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return item.matcher.match(path) || !!(item.gmatcher && item.gmatcher.match(path))
  })
}

function childrenIgnored (self, path) {
  if (!self.ignore.length)
    return false

  return self.ignore.some(function(item) {
    return !!(item.gmatcher && item.gmatcher.match(path))
  })
}


/***/ }),

/***/ "./node_modules/glob/glob.js":
/*!***********************************!*\
  !*** ./node_modules/glob/glob.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// Approach:
//
// 1. Get the minimatch set
// 2. For each pattern in the set, PROCESS(pattern, false)
// 3. Store matches per-set, then uniq them
//
// PROCESS(pattern, inGlobStar)
// Get the first [n] items from pattern that are all strings
// Join these together.  This is PREFIX.
//   If there is no more remaining, then stat(PREFIX) and
//   add to matches if it succeeds.  END.
//
// If inGlobStar and PREFIX is symlink and points to dir
//   set ENTRIES = []
// else readdir(PREFIX) as ENTRIES
//   If fail, END
//
// with ENTRIES
//   If pattern[n] is GLOBSTAR
//     // handle the case where the globstar match is empty
//     // by pruning it out, and testing the resulting pattern
//     PROCESS(pattern[0..n] + pattern[n+1 .. $], false)
//     // handle other cases.
//     for ENTRY in ENTRIES (not dotfiles)
//       // attach globstar + tail onto the entry
//       // Mark that this entry is a globstar match
//       PROCESS(pattern[0..n] + ENTRY + pattern[n .. $], true)
//
//   else // not globstar
//     for ENTRY in ENTRIES (not dotfiles, unless pattern[n] is dot)
//       Test ENTRY against pattern[n]
//       If fails, continue
//       If passes, PROCESS(pattern[0..n] + item + pattern[n+1 .. $])
//
// Caveat:
//   Cache all stats and readdirs results to minimize syscall.  Since all
//   we ever care about is existence and directory-ness, we can just keep
//   `true` for files, and [children,...] for directories, or `false` for
//   things that don't exist.

module.exports = glob

var rp = __webpack_require__(/*! fs.realpath */ "./node_modules/fs.realpath/index.js")
var minimatch = __webpack_require__(/*! minimatch */ "./node_modules/minimatch/minimatch.js")
var Minimatch = minimatch.Minimatch
var inherits = __webpack_require__(/*! inherits */ "./node_modules/inherits/inherits.js")
var EE = (__webpack_require__(/*! events */ "events").EventEmitter)
var path = __webpack_require__(/*! path */ "path")
var assert = __webpack_require__(/*! assert */ "assert")
var isAbsolute = __webpack_require__(/*! path-is-absolute */ "./node_modules/path-is-absolute/index.js")
var globSync = __webpack_require__(/*! ./sync.js */ "./node_modules/glob/sync.js")
var common = __webpack_require__(/*! ./common.js */ "./node_modules/glob/common.js")
var setopts = common.setopts
var ownProp = common.ownProp
var inflight = __webpack_require__(/*! inflight */ "./node_modules/inflight/inflight.js")
var util = __webpack_require__(/*! util */ "util")
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

var once = __webpack_require__(/*! once */ "./node_modules/once/once.js")

function glob (pattern, options, cb) {
  if (typeof options === 'function') cb = options, options = {}
  if (!options) options = {}

  if (options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return globSync(pattern, options)
  }

  return new Glob(pattern, options, cb)
}

glob.sync = globSync
var GlobSync = glob.GlobSync = globSync.GlobSync

// old api surface
glob.glob = glob

function extend (origin, add) {
  if (add === null || typeof add !== 'object') {
    return origin
  }

  var keys = Object.keys(add)
  var i = keys.length
  while (i--) {
    origin[keys[i]] = add[keys[i]]
  }
  return origin
}

glob.hasMagic = function (pattern, options_) {
  var options = extend({}, options_)
  options.noprocess = true

  var g = new Glob(pattern, options)
  var set = g.minimatch.set

  if (!pattern)
    return false

  if (set.length > 1)
    return true

  for (var j = 0; j < set[0].length; j++) {
    if (typeof set[0][j] !== 'string')
      return true
  }

  return false
}

glob.Glob = Glob
inherits(Glob, EE)
function Glob (pattern, options, cb) {
  if (typeof options === 'function') {
    cb = options
    options = null
  }

  if (options && options.sync) {
    if (cb)
      throw new TypeError('callback provided to sync glob')
    return new GlobSync(pattern, options)
  }

  if (!(this instanceof Glob))
    return new Glob(pattern, options, cb)

  setopts(this, pattern, options)
  this._didRealPath = false

  // process each pattern in the minimatch set
  var n = this.minimatch.set.length

  // The matches are stored as {<filename>: true,...} so that
  // duplicates are automagically pruned.
  // Later, we do an Object.keys() on these.
  // Keep them as a list so we can fill in when nonull is set.
  this.matches = new Array(n)

  if (typeof cb === 'function') {
    cb = once(cb)
    this.on('error', cb)
    this.on('end', function (matches) {
      cb(null, matches)
    })
  }

  var self = this
  this._processing = 0

  this._emitQueue = []
  this._processQueue = []
  this.paused = false

  if (this.noprocess)
    return this

  if (n === 0)
    return done()

  var sync = true
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false, done)
  }
  sync = false

  function done () {
    --self._processing
    if (self._processing <= 0) {
      if (sync) {
        process.nextTick(function () {
          self._finish()
        })
      } else {
        self._finish()
      }
    }
  }
}

Glob.prototype._finish = function () {
  assert(this instanceof Glob)
  if (this.aborted)
    return

  if (this.realpath && !this._didRealpath)
    return this._realpath()

  common.finish(this)
  this.emit('end', this.found)
}

Glob.prototype._realpath = function () {
  if (this._didRealpath)
    return

  this._didRealpath = true

  var n = this.matches.length
  if (n === 0)
    return this._finish()

  var self = this
  for (var i = 0; i < this.matches.length; i++)
    this._realpathSet(i, next)

  function next () {
    if (--n === 0)
      self._finish()
  }
}

Glob.prototype._realpathSet = function (index, cb) {
  var matchset = this.matches[index]
  if (!matchset)
    return cb()

  var found = Object.keys(matchset)
  var self = this
  var n = found.length

  if (n === 0)
    return cb()

  var set = this.matches[index] = Object.create(null)
  found.forEach(function (p, i) {
    // If there's a problem with the stat, then it means that
    // one or more of the links in the realpath couldn't be
    // resolved.  just return the abs value in that case.
    p = self._makeAbs(p)
    rp.realpath(p, self.realpathCache, function (er, real) {
      if (!er)
        set[real] = true
      else if (er.syscall === 'stat')
        set[p] = true
      else
        self.emit('error', er) // srsly wtf right here

      if (--n === 0) {
        self.matches[index] = set
        cb()
      }
    })
  })
}

Glob.prototype._mark = function (p) {
  return common.mark(this, p)
}

Glob.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}

Glob.prototype.abort = function () {
  this.aborted = true
  this.emit('abort')
}

Glob.prototype.pause = function () {
  if (!this.paused) {
    this.paused = true
    this.emit('pause')
  }
}

Glob.prototype.resume = function () {
  if (this.paused) {
    this.emit('resume')
    this.paused = false
    if (this._emitQueue.length) {
      var eq = this._emitQueue.slice(0)
      this._emitQueue.length = 0
      for (var i = 0; i < eq.length; i ++) {
        var e = eq[i]
        this._emitMatch(e[0], e[1])
      }
    }
    if (this._processQueue.length) {
      var pq = this._processQueue.slice(0)
      this._processQueue.length = 0
      for (var i = 0; i < pq.length; i ++) {
        var p = pq[i]
        this._processing--
        this._process(p[0], p[1], p[2], p[3])
      }
    }
  }
}

Glob.prototype._process = function (pattern, index, inGlobStar, cb) {
  assert(this instanceof Glob)
  assert(typeof cb === 'function')

  if (this.aborted)
    return

  this._processing++
  if (this.paused) {
    this._processQueue.push([pattern, index, inGlobStar, cb])
    return
  }

  //console.error('PROCESS %d', this._processing, pattern)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // see if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index, cb)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) ||
      isAbsolute(pattern.map(function (p) {
        return typeof p === 'string' ? p : '[*]'
      }).join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip _processing
  if (childrenIgnored(this, read))
    return cb()

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar, cb)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar, cb)
}

Glob.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    return self._processReaddir2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}

Glob.prototype._processReaddir2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return cb()

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  //console.error('prd2', prefix, entries, remain[0]._glob, matchedEntries)

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return cb()

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return cb()
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix) {
      if (prefix !== '/')
        e = prefix + '/' + e
      else
        e = prefix + e
    }
    this._process([e].concat(remain), index, inGlobStar, cb)
  }
  cb()
}

Glob.prototype._emitMatch = function (index, e) {
  if (this.aborted)
    return

  if (isIgnored(this, e))
    return

  if (this.paused) {
    this._emitQueue.push([index, e])
    return
  }

  var abs = isAbsolute(e) ? e : this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute)
    e = abs

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  var st = this.statCache[abs]
  if (st)
    this.emit('stat', e, st)

  this.emit('match', e)
}

Glob.prototype._readdirInGlobStar = function (abs, cb) {
  if (this.aborted)
    return

  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false, cb)

  var lstatkey = 'lstat\0' + abs
  var self = this
  var lstatcb = inflight(lstatkey, lstatcb_)

  if (lstatcb)
    self.fs.lstat(abs, lstatcb)

  function lstatcb_ (er, lstat) {
    if (er && er.code === 'ENOENT')
      return cb()

    var isSym = lstat && lstat.isSymbolicLink()
    self.symlinks[abs] = isSym

    // If it's not a symlink or a dir, then it's definitely a regular file.
    // don't bother doing a readdir in that case.
    if (!isSym && lstat && !lstat.isDirectory()) {
      self.cache[abs] = 'FILE'
      cb()
    } else
      self._readdir(abs, false, cb)
  }
}

Glob.prototype._readdir = function (abs, inGlobStar, cb) {
  if (this.aborted)
    return

  cb = inflight('readdir\0'+abs+'\0'+inGlobStar, cb)
  if (!cb)
    return

  //console.error('RD %j %j', +inGlobStar, abs)
  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs, cb)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return cb()

    if (Array.isArray(c))
      return cb(null, c)
  }

  var self = this
  self.fs.readdir(abs, readdirCb(this, abs, cb))
}

function readdirCb (self, abs, cb) {
  return function (er, entries) {
    if (er)
      self._readdirError(abs, er, cb)
    else
      self._readdirEntries(abs, entries, cb)
  }
}

Glob.prototype._readdirEntries = function (abs, entries, cb) {
  if (this.aborted)
    return

  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries
  return cb(null, entries)
}

Glob.prototype._readdirError = function (f, er, cb) {
  if (this.aborted)
    return

  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        this.emit('error', error)
        this.abort()
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict) {
        this.emit('error', er)
        // If the error is handled, then we abort
        // if not, we threw out of here
        this.abort()
      }
      if (!this.silent)
        console.error('glob error', er)
      break
  }

  return cb()
}

Glob.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar, cb) {
  var self = this
  this._readdir(abs, inGlobStar, function (er, entries) {
    self._processGlobStar2(prefix, read, abs, remain, index, inGlobStar, entries, cb)
  })
}


Glob.prototype._processGlobStar2 = function (prefix, read, abs, remain, index, inGlobStar, entries, cb) {
  //console.error('pgs2', prefix, remain[0], entries)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return cb()

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false, cb)

  var isSym = this.symlinks[abs]
  var len = entries.length

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return cb()

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true, cb)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true, cb)
  }

  cb()
}

Glob.prototype._processSimple = function (prefix, index, cb) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var self = this
  this._stat(prefix, function (er, exists) {
    self._processSimple2(prefix, index, er, exists, cb)
  })
}
Glob.prototype._processSimple2 = function (prefix, index, er, exists, cb) {

  //console.error('ps2', prefix, exists)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return cb()

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
  cb()
}

// Returns either 'DIR', 'FILE', or false
Glob.prototype._stat = function (f, cb) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return cb()

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return cb(null, c)

    if (needDir && c === 'FILE')
      return cb()

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (stat !== undefined) {
    if (stat === false)
      return cb(null, stat)
    else {
      var type = stat.isDirectory() ? 'DIR' : 'FILE'
      if (needDir && type === 'FILE')
        return cb()
      else
        return cb(null, type, stat)
    }
  }

  var self = this
  var statcb = inflight('stat\0' + abs, lstatcb_)
  if (statcb)
    self.fs.lstat(abs, statcb)

  function lstatcb_ (er, lstat) {
    if (lstat && lstat.isSymbolicLink()) {
      // If it's a symlink, then treat it as the target, unless
      // the target does not exist, then treat it as a file.
      return self.fs.stat(abs, function (er, stat) {
        if (er)
          self._stat2(f, abs, null, lstat, cb)
        else
          self._stat2(f, abs, er, stat, cb)
      })
    } else {
      self._stat2(f, abs, er, lstat, cb)
    }
  }
}

Glob.prototype._stat2 = function (f, abs, er, stat, cb) {
  if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
    this.statCache[abs] = false
    return cb()
  }

  var needDir = f.slice(-1) === '/'
  this.statCache[abs] = stat

  if (abs.slice(-1) === '/' && stat && !stat.isDirectory())
    return cb(null, false, stat)

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'
  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return cb()

  return cb(null, c, stat)
}


/***/ }),

/***/ "./node_modules/glob/sync.js":
/*!***********************************!*\
  !*** ./node_modules/glob/sync.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = globSync
globSync.GlobSync = GlobSync

var rp = __webpack_require__(/*! fs.realpath */ "./node_modules/fs.realpath/index.js")
var minimatch = __webpack_require__(/*! minimatch */ "./node_modules/minimatch/minimatch.js")
var Minimatch = minimatch.Minimatch
var Glob = (__webpack_require__(/*! ./glob.js */ "./node_modules/glob/glob.js").Glob)
var util = __webpack_require__(/*! util */ "util")
var path = __webpack_require__(/*! path */ "path")
var assert = __webpack_require__(/*! assert */ "assert")
var isAbsolute = __webpack_require__(/*! path-is-absolute */ "./node_modules/path-is-absolute/index.js")
var common = __webpack_require__(/*! ./common.js */ "./node_modules/glob/common.js")
var setopts = common.setopts
var ownProp = common.ownProp
var childrenIgnored = common.childrenIgnored
var isIgnored = common.isIgnored

function globSync (pattern, options) {
  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  return new GlobSync(pattern, options).found
}

function GlobSync (pattern, options) {
  if (!pattern)
    throw new Error('must provide pattern')

  if (typeof options === 'function' || arguments.length === 3)
    throw new TypeError('callback provided to sync glob\n'+
                        'See: https://github.com/isaacs/node-glob/issues/167')

  if (!(this instanceof GlobSync))
    return new GlobSync(pattern, options)

  setopts(this, pattern, options)

  if (this.noprocess)
    return this

  var n = this.minimatch.set.length
  this.matches = new Array(n)
  for (var i = 0; i < n; i ++) {
    this._process(this.minimatch.set[i], i, false)
  }
  this._finish()
}

GlobSync.prototype._finish = function () {
  assert.ok(this instanceof GlobSync)
  if (this.realpath) {
    var self = this
    this.matches.forEach(function (matchset, index) {
      var set = self.matches[index] = Object.create(null)
      for (var p in matchset) {
        try {
          p = self._makeAbs(p)
          var real = rp.realpathSync(p, self.realpathCache)
          set[real] = true
        } catch (er) {
          if (er.syscall === 'stat')
            set[self._makeAbs(p)] = true
          else
            throw er
        }
      }
    })
  }
  common.finish(this)
}


GlobSync.prototype._process = function (pattern, index, inGlobStar) {
  assert.ok(this instanceof GlobSync)

  // Get the first [n] parts of pattern that are all strings.
  var n = 0
  while (typeof pattern[n] === 'string') {
    n ++
  }
  // now n is the index of the first one that is *not* a string.

  // See if there's anything else
  var prefix
  switch (n) {
    // if not, then this is rather simple
    case pattern.length:
      this._processSimple(pattern.join('/'), index)
      return

    case 0:
      // pattern *starts* with some non-trivial item.
      // going to readdir(cwd), but not include the prefix in matches.
      prefix = null
      break

    default:
      // pattern has some string bits in the front.
      // whatever it starts with, whether that's 'absolute' like /foo/bar,
      // or 'relative' like '../baz'
      prefix = pattern.slice(0, n).join('/')
      break
  }

  var remain = pattern.slice(n)

  // get the list of entries.
  var read
  if (prefix === null)
    read = '.'
  else if (isAbsolute(prefix) ||
      isAbsolute(pattern.map(function (p) {
        return typeof p === 'string' ? p : '[*]'
      }).join('/'))) {
    if (!prefix || !isAbsolute(prefix))
      prefix = '/' + prefix
    read = prefix
  } else
    read = prefix

  var abs = this._makeAbs(read)

  //if ignored, skip processing
  if (childrenIgnored(this, read))
    return

  var isGlobStar = remain[0] === minimatch.GLOBSTAR
  if (isGlobStar)
    this._processGlobStar(prefix, read, abs, remain, index, inGlobStar)
  else
    this._processReaddir(prefix, read, abs, remain, index, inGlobStar)
}


GlobSync.prototype._processReaddir = function (prefix, read, abs, remain, index, inGlobStar) {
  var entries = this._readdir(abs, inGlobStar)

  // if the abs isn't a dir, then nothing can match!
  if (!entries)
    return

  // It will only match dot entries if it starts with a dot, or if
  // dot is set.  Stuff like @(.foo|.bar) isn't allowed.
  var pn = remain[0]
  var negate = !!this.minimatch.negate
  var rawGlob = pn._glob
  var dotOk = this.dot || rawGlob.charAt(0) === '.'

  var matchedEntries = []
  for (var i = 0; i < entries.length; i++) {
    var e = entries[i]
    if (e.charAt(0) !== '.' || dotOk) {
      var m
      if (negate && !prefix) {
        m = !e.match(pn)
      } else {
        m = e.match(pn)
      }
      if (m)
        matchedEntries.push(e)
    }
  }

  var len = matchedEntries.length
  // If there are no matched entries, then nothing matches.
  if (len === 0)
    return

  // if this is the last remaining pattern bit, then no need for
  // an additional stat *unless* the user has specified mark or
  // stat explicitly.  We know they exist, since readdir returned
  // them.

  if (remain.length === 1 && !this.mark && !this.stat) {
    if (!this.matches[index])
      this.matches[index] = Object.create(null)

    for (var i = 0; i < len; i ++) {
      var e = matchedEntries[i]
      if (prefix) {
        if (prefix.slice(-1) !== '/')
          e = prefix + '/' + e
        else
          e = prefix + e
      }

      if (e.charAt(0) === '/' && !this.nomount) {
        e = path.join(this.root, e)
      }
      this._emitMatch(index, e)
    }
    // This was the last one, and no stats were needed
    return
  }

  // now test all matched entries as stand-ins for that part
  // of the pattern.
  remain.shift()
  for (var i = 0; i < len; i ++) {
    var e = matchedEntries[i]
    var newPattern
    if (prefix)
      newPattern = [prefix, e]
    else
      newPattern = [e]
    this._process(newPattern.concat(remain), index, inGlobStar)
  }
}


GlobSync.prototype._emitMatch = function (index, e) {
  if (isIgnored(this, e))
    return

  var abs = this._makeAbs(e)

  if (this.mark)
    e = this._mark(e)

  if (this.absolute) {
    e = abs
  }

  if (this.matches[index][e])
    return

  if (this.nodir) {
    var c = this.cache[abs]
    if (c === 'DIR' || Array.isArray(c))
      return
  }

  this.matches[index][e] = true

  if (this.stat)
    this._stat(e)
}


GlobSync.prototype._readdirInGlobStar = function (abs) {
  // follow all symlinked directories forever
  // just proceed as if this is a non-globstar situation
  if (this.follow)
    return this._readdir(abs, false)

  var entries
  var lstat
  var stat
  try {
    lstat = this.fs.lstatSync(abs)
  } catch (er) {
    if (er.code === 'ENOENT') {
      // lstat failed, doesn't exist
      return null
    }
  }

  var isSym = lstat && lstat.isSymbolicLink()
  this.symlinks[abs] = isSym

  // If it's not a symlink or a dir, then it's definitely a regular file.
  // don't bother doing a readdir in that case.
  if (!isSym && lstat && !lstat.isDirectory())
    this.cache[abs] = 'FILE'
  else
    entries = this._readdir(abs, false)

  return entries
}

GlobSync.prototype._readdir = function (abs, inGlobStar) {
  var entries

  if (inGlobStar && !ownProp(this.symlinks, abs))
    return this._readdirInGlobStar(abs)

  if (ownProp(this.cache, abs)) {
    var c = this.cache[abs]
    if (!c || c === 'FILE')
      return null

    if (Array.isArray(c))
      return c
  }

  try {
    return this._readdirEntries(abs, this.fs.readdirSync(abs))
  } catch (er) {
    this._readdirError(abs, er)
    return null
  }
}

GlobSync.prototype._readdirEntries = function (abs, entries) {
  // if we haven't asked to stat everything, then just
  // assume that everything in there exists, so we can avoid
  // having to stat it a second time.
  if (!this.mark && !this.stat) {
    for (var i = 0; i < entries.length; i ++) {
      var e = entries[i]
      if (abs === '/')
        e = abs + e
      else
        e = abs + '/' + e
      this.cache[e] = true
    }
  }

  this.cache[abs] = entries

  // mark and cache dir-ness
  return entries
}

GlobSync.prototype._readdirError = function (f, er) {
  // handle errors, and cache the information
  switch (er.code) {
    case 'ENOTSUP': // https://github.com/isaacs/node-glob/issues/205
    case 'ENOTDIR': // totally normal. means it *does* exist.
      var abs = this._makeAbs(f)
      this.cache[abs] = 'FILE'
      if (abs === this.cwdAbs) {
        var error = new Error(er.code + ' invalid cwd ' + this.cwd)
        error.path = this.cwd
        error.code = er.code
        throw error
      }
      break

    case 'ENOENT': // not terribly unusual
    case 'ELOOP':
    case 'ENAMETOOLONG':
    case 'UNKNOWN':
      this.cache[this._makeAbs(f)] = false
      break

    default: // some unusual error.  Treat as failure.
      this.cache[this._makeAbs(f)] = false
      if (this.strict)
        throw er
      if (!this.silent)
        console.error('glob error', er)
      break
  }
}

GlobSync.prototype._processGlobStar = function (prefix, read, abs, remain, index, inGlobStar) {

  var entries = this._readdir(abs, inGlobStar)

  // no entries means not a dir, so it can never have matches
  // foo.txt/** doesn't match foo.txt
  if (!entries)
    return

  // test without the globstar, and with every child both below
  // and replacing the globstar.
  var remainWithoutGlobStar = remain.slice(1)
  var gspref = prefix ? [ prefix ] : []
  var noGlobStar = gspref.concat(remainWithoutGlobStar)

  // the noGlobStar pattern exits the inGlobStar state
  this._process(noGlobStar, index, false)

  var len = entries.length
  var isSym = this.symlinks[abs]

  // If it's a symlink, and we're in a globstar, then stop
  if (isSym && inGlobStar)
    return

  for (var i = 0; i < len; i++) {
    var e = entries[i]
    if (e.charAt(0) === '.' && !this.dot)
      continue

    // these two cases enter the inGlobStar state
    var instead = gspref.concat(entries[i], remainWithoutGlobStar)
    this._process(instead, index, true)

    var below = gspref.concat(entries[i], remain)
    this._process(below, index, true)
  }
}

GlobSync.prototype._processSimple = function (prefix, index) {
  // XXX review this.  Shouldn't it be doing the mounting etc
  // before doing stat?  kinda weird?
  var exists = this._stat(prefix)

  if (!this.matches[index])
    this.matches[index] = Object.create(null)

  // If it doesn't exist, then just mark the lack of results
  if (!exists)
    return

  if (prefix && isAbsolute(prefix) && !this.nomount) {
    var trail = /[\/\\]$/.test(prefix)
    if (prefix.charAt(0) === '/') {
      prefix = path.join(this.root, prefix)
    } else {
      prefix = path.resolve(this.root, prefix)
      if (trail)
        prefix += '/'
    }
  }

  if (process.platform === 'win32')
    prefix = prefix.replace(/\\/g, '/')

  // Mark this as a match
  this._emitMatch(index, prefix)
}

// Returns either 'DIR', 'FILE', or false
GlobSync.prototype._stat = function (f) {
  var abs = this._makeAbs(f)
  var needDir = f.slice(-1) === '/'

  if (f.length > this.maxLength)
    return false

  if (!this.stat && ownProp(this.cache, abs)) {
    var c = this.cache[abs]

    if (Array.isArray(c))
      c = 'DIR'

    // It exists, but maybe not how we need it
    if (!needDir || c === 'DIR')
      return c

    if (needDir && c === 'FILE')
      return false

    // otherwise we have to stat, because maybe c=true
    // if we know it exists, but not what it is.
  }

  var exists
  var stat = this.statCache[abs]
  if (!stat) {
    var lstat
    try {
      lstat = this.fs.lstatSync(abs)
    } catch (er) {
      if (er && (er.code === 'ENOENT' || er.code === 'ENOTDIR')) {
        this.statCache[abs] = false
        return false
      }
    }

    if (lstat && lstat.isSymbolicLink()) {
      try {
        stat = this.fs.statSync(abs)
      } catch (er) {
        stat = lstat
      }
    } else {
      stat = lstat
    }
  }

  this.statCache[abs] = stat

  var c = true
  if (stat)
    c = stat.isDirectory() ? 'DIR' : 'FILE'

  this.cache[abs] = this.cache[abs] || c

  if (needDir && c === 'FILE')
    return false

  return c
}

GlobSync.prototype._mark = function (p) {
  return common.mark(this, p)
}

GlobSync.prototype._makeAbs = function (f) {
  return common.makeAbs(this, f)
}


/***/ }),

/***/ "./node_modules/inflight/inflight.js":
/*!*******************************************!*\
  !*** ./node_modules/inflight/inflight.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wrappy = __webpack_require__(/*! wrappy */ "./node_modules/wrappy/wrappy.js")
var reqs = Object.create(null)
var once = __webpack_require__(/*! once */ "./node_modules/once/once.js")

module.exports = wrappy(inflight)

function inflight (key, cb) {
  if (reqs[key]) {
    reqs[key].push(cb)
    return null
  } else {
    reqs[key] = [cb]
    return makeres(key)
  }
}

function makeres (key) {
  return once(function RES () {
    var cbs = reqs[key]
    var len = cbs.length
    var args = slice(arguments)

    // XXX It's somewhat ambiguous whether a new callback added in this
    // pass should be queued for later execution if something in the
    // list of callbacks throws, or if it should just be discarded.
    // However, it's such an edge case that it hardly matters, and either
    // choice is likely as surprising as the other.
    // As it happens, we do go ahead and schedule it for later execution.
    try {
      for (var i = 0; i < len; i++) {
        cbs[i].apply(null, args)
      }
    } finally {
      if (cbs.length > len) {
        // added more in the interim.
        // de-zalgo, just in case, but don't call again.
        cbs.splice(0, len)
        process.nextTick(function () {
          RES.apply(null, args)
        })
      } else {
        delete reqs[key]
      }
    }
  })
}

function slice (args) {
  var length = args.length
  var array = []

  for (var i = 0; i < length; i++) array[i] = args[i]
  return array
}


/***/ }),

/***/ "./node_modules/inherits/inherits.js":
/*!*******************************************!*\
  !*** ./node_modules/inherits/inherits.js ***!
  \*******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

try {
  var util = __webpack_require__(/*! util */ "util");
  /* istanbul ignore next */
  if (typeof util.inherits !== 'function') throw '';
  module.exports = util.inherits;
} catch (e) {
  /* istanbul ignore next */
  module.exports = __webpack_require__(/*! ./inherits_browser.js */ "./node_modules/inherits/inherits_browser.js");
}


/***/ }),

/***/ "./node_modules/inherits/inherits_browser.js":
/*!***************************************************!*\
  !*** ./node_modules/inherits/inherits_browser.js ***!
  \***************************************************/
/***/ ((module) => {

if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}


/***/ }),

/***/ "./node_modules/minimatch/minimatch.js":
/*!*********************************************!*\
  !*** ./node_modules/minimatch/minimatch.js ***!
  \*********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = minimatch
minimatch.Minimatch = Minimatch

var path = (function () { try { return __webpack_require__(/*! path */ "path") } catch (e) {}}()) || {
  sep: '/'
}
minimatch.sep = path.sep

var GLOBSTAR = minimatch.GLOBSTAR = Minimatch.GLOBSTAR = {}
var expand = __webpack_require__(/*! brace-expansion */ "./node_modules/brace-expansion/index.js")

var plTypes = {
  '!': { open: '(?:(?!(?:', close: '))[^/]*?)'},
  '?': { open: '(?:', close: ')?' },
  '+': { open: '(?:', close: ')+' },
  '*': { open: '(?:', close: ')*' },
  '@': { open: '(?:', close: ')' }
}

// any single thing other than /
// don't need to escape / when using new RegExp()
var qmark = '[^/]'

// * => any number of characters
var star = qmark + '*?'

// ** when dots are allowed.  Anything goes, except .. and .
// not (^ or / followed by one or two dots followed by $ or /),
// followed by anything, any number of times.
var twoStarDot = '(?:(?!(?:\\\/|^)(?:\\.{1,2})($|\\\/)).)*?'

// not a ^ or / followed by a dot,
// followed by anything, any number of times.
var twoStarNoDot = '(?:(?!(?:\\\/|^)\\.).)*?'

// characters that need to be escaped in RegExp.
var reSpecials = charSet('().*{}+?[]^$\\!')

// "abc" -> { a:true, b:true, c:true }
function charSet (s) {
  return s.split('').reduce(function (set, c) {
    set[c] = true
    return set
  }, {})
}

// normalizes slashes.
var slashSplit = /\/+/

minimatch.filter = filter
function filter (pattern, options) {
  options = options || {}
  return function (p, i, list) {
    return minimatch(p, pattern, options)
  }
}

function ext (a, b) {
  b = b || {}
  var t = {}
  Object.keys(a).forEach(function (k) {
    t[k] = a[k]
  })
  Object.keys(b).forEach(function (k) {
    t[k] = b[k]
  })
  return t
}

minimatch.defaults = function (def) {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) {
    return minimatch
  }

  var orig = minimatch

  var m = function minimatch (p, pattern, options) {
    return orig(p, pattern, ext(def, options))
  }

  m.Minimatch = function Minimatch (pattern, options) {
    return new orig.Minimatch(pattern, ext(def, options))
  }
  m.Minimatch.defaults = function defaults (options) {
    return orig.defaults(ext(def, options)).Minimatch
  }

  m.filter = function filter (pattern, options) {
    return orig.filter(pattern, ext(def, options))
  }

  m.defaults = function defaults (options) {
    return orig.defaults(ext(def, options))
  }

  m.makeRe = function makeRe (pattern, options) {
    return orig.makeRe(pattern, ext(def, options))
  }

  m.braceExpand = function braceExpand (pattern, options) {
    return orig.braceExpand(pattern, ext(def, options))
  }

  m.match = function (list, pattern, options) {
    return orig.match(list, pattern, ext(def, options))
  }

  return m
}

Minimatch.defaults = function (def) {
  return minimatch.defaults(def).Minimatch
}

function minimatch (p, pattern, options) {
  assertValidPattern(pattern)

  if (!options) options = {}

  // shortcut: comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    return false
  }

  return new Minimatch(pattern, options).match(p)
}

function Minimatch (pattern, options) {
  if (!(this instanceof Minimatch)) {
    return new Minimatch(pattern, options)
  }

  assertValidPattern(pattern)

  if (!options) options = {}

  pattern = pattern.trim()

  // windows support: need to use /, not \
  if (!options.allowWindowsEscape && path.sep !== '/') {
    pattern = pattern.split(path.sep).join('/')
  }

  this.options = options
  this.set = []
  this.pattern = pattern
  this.regexp = null
  this.negate = false
  this.comment = false
  this.empty = false
  this.partial = !!options.partial

  // make the set of regexps etc.
  this.make()
}

Minimatch.prototype.debug = function () {}

Minimatch.prototype.make = make
function make () {
  var pattern = this.pattern
  var options = this.options

  // empty patterns and comments match nothing.
  if (!options.nocomment && pattern.charAt(0) === '#') {
    this.comment = true
    return
  }
  if (!pattern) {
    this.empty = true
    return
  }

  // step 1: figure out negation, etc.
  this.parseNegate()

  // step 2: expand braces
  var set = this.globSet = this.braceExpand()

  if (options.debug) this.debug = function debug() { console.error.apply(console, arguments) }

  this.debug(this.pattern, set)

  // step 3: now we have a set, so turn each one into a series of path-portion
  // matching patterns.
  // These will be regexps, except in the case of "**", which is
  // set to the GLOBSTAR object for globstar behavior,
  // and will not contain any / characters
  set = this.globParts = set.map(function (s) {
    return s.split(slashSplit)
  })

  this.debug(this.pattern, set)

  // glob --> regexps
  set = set.map(function (s, si, set) {
    return s.map(this.parse, this)
  }, this)

  this.debug(this.pattern, set)

  // filter out everything that didn't compile properly.
  set = set.filter(function (s) {
    return s.indexOf(false) === -1
  })

  this.debug(this.pattern, set)

  this.set = set
}

Minimatch.prototype.parseNegate = parseNegate
function parseNegate () {
  var pattern = this.pattern
  var negate = false
  var options = this.options
  var negateOffset = 0

  if (options.nonegate) return

  for (var i = 0, l = pattern.length
    ; i < l && pattern.charAt(i) === '!'
    ; i++) {
    negate = !negate
    negateOffset++
  }

  if (negateOffset) this.pattern = pattern.substr(negateOffset)
  this.negate = negate
}

// Brace expansion:
// a{b,c}d -> abd acd
// a{b,}c -> abc ac
// a{0..3}d -> a0d a1d a2d a3d
// a{b,c{d,e}f}g -> abg acdfg acefg
// a{b,c}d{e,f}g -> abdeg acdeg abdeg abdfg
//
// Invalid sets are not expanded.
// a{2..}b -> a{2..}b
// a{b}c -> a{b}c
minimatch.braceExpand = function (pattern, options) {
  return braceExpand(pattern, options)
}

Minimatch.prototype.braceExpand = braceExpand

function braceExpand (pattern, options) {
  if (!options) {
    if (this instanceof Minimatch) {
      options = this.options
    } else {
      options = {}
    }
  }

  pattern = typeof pattern === 'undefined'
    ? this.pattern : pattern

  assertValidPattern(pattern)

  // Thanks to Yeting Li <https://github.com/yetingli> for
  // improving this regexp to avoid a ReDOS vulnerability.
  if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
    // shortcut. no need to expand.
    return [pattern]
  }

  return expand(pattern)
}

var MAX_PATTERN_LENGTH = 1024 * 64
var assertValidPattern = function (pattern) {
  if (typeof pattern !== 'string') {
    throw new TypeError('invalid pattern')
  }

  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new TypeError('pattern is too long')
  }
}

// parse a component of the expanded set.
// At this point, no pattern may contain "/" in it
// so we're going to return a 2d array, where each entry is the full
// pattern, split on '/', and then turned into a regular expression.
// A regexp is made at the end which joins each array with an
// escaped /, and another full one which joins each regexp with |.
//
// Following the lead of Bash 4.1, note that "**" only has special meaning
// when it is the *only* thing in a path portion.  Otherwise, any series
// of * is equivalent to a single *.  Globstar behavior is enabled by
// default, and can be disabled by setting options.noglobstar.
Minimatch.prototype.parse = parse
var SUBPARSE = {}
function parse (pattern, isSub) {
  assertValidPattern(pattern)

  var options = this.options

  // shortcuts
  if (pattern === '**') {
    if (!options.noglobstar)
      return GLOBSTAR
    else
      pattern = '*'
  }
  if (pattern === '') return ''

  var re = ''
  var hasMagic = !!options.nocase
  var escaping = false
  // ? => one single character
  var patternListStack = []
  var negativeLists = []
  var stateChar
  var inClass = false
  var reClassStart = -1
  var classStart = -1
  // . and .. never match anything that doesn't start with .,
  // even when options.dot is set.
  var patternStart = pattern.charAt(0) === '.' ? '' // anything
  // not (start or / followed by . or .. followed by / or end)
  : options.dot ? '(?!(?:^|\\\/)\\.{1,2}(?:$|\\\/))'
  : '(?!\\.)'
  var self = this

  function clearStateChar () {
    if (stateChar) {
      // we had some state-tracking character
      // that wasn't consumed by this pass.
      switch (stateChar) {
        case '*':
          re += star
          hasMagic = true
        break
        case '?':
          re += qmark
          hasMagic = true
        break
        default:
          re += '\\' + stateChar
        break
      }
      self.debug('clearStateChar %j %j', stateChar, re)
      stateChar = false
    }
  }

  for (var i = 0, len = pattern.length, c
    ; (i < len) && (c = pattern.charAt(i))
    ; i++) {
    this.debug('%s\t%s %s %j', pattern, i, re, c)

    // skip over any that are escaped.
    if (escaping && reSpecials[c]) {
      re += '\\' + c
      escaping = false
      continue
    }

    switch (c) {
      /* istanbul ignore next */
      case '/': {
        // completely not allowed, even escaped.
        // Should already be path-split by now.
        return false
      }

      case '\\':
        clearStateChar()
        escaping = true
      continue

      // the various stateChar values
      // for the "extglob" stuff.
      case '?':
      case '*':
      case '+':
      case '@':
      case '!':
        this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c)

        // all of those are literals inside a class, except that
        // the glob [!a] means [^a] in regexp
        if (inClass) {
          this.debug('  in class')
          if (c === '!' && i === classStart + 1) c = '^'
          re += c
          continue
        }

        // if we already have a stateChar, then it means
        // that there was something like ** or +? in there.
        // Handle the stateChar, then proceed with this one.
        self.debug('call clearStateChar %j', stateChar)
        clearStateChar()
        stateChar = c
        // if extglob is disabled, then +(asdf|foo) isn't a thing.
        // just clear the statechar *now*, rather than even diving into
        // the patternList stuff.
        if (options.noext) clearStateChar()
      continue

      case '(':
        if (inClass) {
          re += '('
          continue
        }

        if (!stateChar) {
          re += '\\('
          continue
        }

        patternListStack.push({
          type: stateChar,
          start: i - 1,
          reStart: re.length,
          open: plTypes[stateChar].open,
          close: plTypes[stateChar].close
        })
        // negation is (?:(?!js)[^/]*)
        re += stateChar === '!' ? '(?:(?!(?:' : '(?:'
        this.debug('plType %j %j', stateChar, re)
        stateChar = false
      continue

      case ')':
        if (inClass || !patternListStack.length) {
          re += '\\)'
          continue
        }

        clearStateChar()
        hasMagic = true
        var pl = patternListStack.pop()
        // negation is (?:(?!js)[^/]*)
        // The others are (?:<pattern>)<type>
        re += pl.close
        if (pl.type === '!') {
          negativeLists.push(pl)
        }
        pl.reEnd = re.length
      continue

      case '|':
        if (inClass || !patternListStack.length || escaping) {
          re += '\\|'
          escaping = false
          continue
        }

        clearStateChar()
        re += '|'
      continue

      // these are mostly the same in regexp and glob
      case '[':
        // swallow any state-tracking char before the [
        clearStateChar()

        if (inClass) {
          re += '\\' + c
          continue
        }

        inClass = true
        classStart = i
        reClassStart = re.length
        re += c
      continue

      case ']':
        //  a right bracket shall lose its special
        //  meaning and represent itself in
        //  a bracket expression if it occurs
        //  first in the list.  -- POSIX.2 2.8.3.2
        if (i === classStart + 1 || !inClass) {
          re += '\\' + c
          escaping = false
          continue
        }

        // handle the case where we left a class open.
        // "[z-a]" is valid, equivalent to "\[z-a\]"
        // split where the last [ was, make sure we don't have
        // an invalid re. if so, re-walk the contents of the
        // would-be class to re-translate any characters that
        // were passed through as-is
        // TODO: It would probably be faster to determine this
        // without a try/catch and a new RegExp, but it's tricky
        // to do safely.  For now, this is safe and works.
        var cs = pattern.substring(classStart + 1, i)
        try {
          RegExp('[' + cs + ']')
        } catch (er) {
          // not a valid class!
          var sp = this.parse(cs, SUBPARSE)
          re = re.substr(0, reClassStart) + '\\[' + sp[0] + '\\]'
          hasMagic = hasMagic || sp[1]
          inClass = false
          continue
        }

        // finish up the class.
        hasMagic = true
        inClass = false
        re += c
      continue

      default:
        // swallow any state char that wasn't consumed
        clearStateChar()

        if (escaping) {
          // no need
          escaping = false
        } else if (reSpecials[c]
          && !(c === '^' && inClass)) {
          re += '\\'
        }

        re += c

    } // switch
  } // for

  // handle the case where we left a class open.
  // "[abc" is valid, equivalent to "\[abc"
  if (inClass) {
    // split where the last [ was, and escape it
    // this is a huge pita.  We now have to re-walk
    // the contents of the would-be class to re-translate
    // any characters that were passed through as-is
    cs = pattern.substr(classStart + 1)
    sp = this.parse(cs, SUBPARSE)
    re = re.substr(0, reClassStart) + '\\[' + sp[0]
    hasMagic = hasMagic || sp[1]
  }

  // handle the case where we had a +( thing at the *end*
  // of the pattern.
  // each pattern list stack adds 3 chars, and we need to go through
  // and escape any | chars that were passed through as-is for the regexp.
  // Go through and escape them, taking care not to double-escape any
  // | chars that were already escaped.
  for (pl = patternListStack.pop(); pl; pl = patternListStack.pop()) {
    var tail = re.slice(pl.reStart + pl.open.length)
    this.debug('setting tail', re, pl)
    // maybe some even number of \, then maybe 1 \, followed by a |
    tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, function (_, $1, $2) {
      if (!$2) {
        // the | isn't already escaped, so escape it.
        $2 = '\\'
      }

      // need to escape all those slashes *again*, without escaping the
      // one that we need for escaping the | character.  As it works out,
      // escaping an even number of slashes can be done by simply repeating
      // it exactly after itself.  That's why this trick works.
      //
      // I am sorry that you have to see this.
      return $1 + $1 + $2 + '|'
    })

    this.debug('tail=%j\n   %s', tail, tail, pl, re)
    var t = pl.type === '*' ? star
      : pl.type === '?' ? qmark
      : '\\' + pl.type

    hasMagic = true
    re = re.slice(0, pl.reStart) + t + '\\(' + tail
  }

  // handle trailing things that only matter at the very end.
  clearStateChar()
  if (escaping) {
    // trailing \\
    re += '\\\\'
  }

  // only need to apply the nodot start if the re starts with
  // something that could conceivably capture a dot
  var addPatternStart = false
  switch (re.charAt(0)) {
    case '[': case '.': case '(': addPatternStart = true
  }

  // Hack to work around lack of negative lookbehind in JS
  // A pattern like: *.!(x).!(y|z) needs to ensure that a name
  // like 'a.xyz.yz' doesn't match.  So, the first negative
  // lookahead, has to look ALL the way ahead, to the end of
  // the pattern.
  for (var n = negativeLists.length - 1; n > -1; n--) {
    var nl = negativeLists[n]

    var nlBefore = re.slice(0, nl.reStart)
    var nlFirst = re.slice(nl.reStart, nl.reEnd - 8)
    var nlLast = re.slice(nl.reEnd - 8, nl.reEnd)
    var nlAfter = re.slice(nl.reEnd)

    nlLast += nlAfter

    // Handle nested stuff like *(*.js|!(*.json)), where open parens
    // mean that we should *not* include the ) in the bit that is considered
    // "after" the negated section.
    var openParensBefore = nlBefore.split('(').length - 1
    var cleanAfter = nlAfter
    for (i = 0; i < openParensBefore; i++) {
      cleanAfter = cleanAfter.replace(/\)[+*?]?/, '')
    }
    nlAfter = cleanAfter

    var dollar = ''
    if (nlAfter === '' && isSub !== SUBPARSE) {
      dollar = '$'
    }
    var newRe = nlBefore + nlFirst + nlAfter + dollar + nlLast
    re = newRe
  }

  // if the re is not "" at this point, then we need to make sure
  // it doesn't match against an empty path part.
  // Otherwise a/* will match a/, which it should not.
  if (re !== '' && hasMagic) {
    re = '(?=.)' + re
  }

  if (addPatternStart) {
    re = patternStart + re
  }

  // parsing just a piece of a larger pattern.
  if (isSub === SUBPARSE) {
    return [re, hasMagic]
  }

  // skip the regexp for non-magical patterns
  // unescape anything in it, though, so that it'll be
  // an exact match against a file etc.
  if (!hasMagic) {
    return globUnescape(pattern)
  }

  var flags = options.nocase ? 'i' : ''
  try {
    var regExp = new RegExp('^' + re + '$', flags)
  } catch (er) /* istanbul ignore next - should be impossible */ {
    // If it was an invalid regular expression, then it can't match
    // anything.  This trick looks for a character after the end of
    // the string, which is of course impossible, except in multi-line
    // mode, but it's not a /m regex.
    return new RegExp('$.')
  }

  regExp._glob = pattern
  regExp._src = re

  return regExp
}

minimatch.makeRe = function (pattern, options) {
  return new Minimatch(pattern, options || {}).makeRe()
}

Minimatch.prototype.makeRe = makeRe
function makeRe () {
  if (this.regexp || this.regexp === false) return this.regexp

  // at this point, this.set is a 2d array of partial
  // pattern strings, or "**".
  //
  // It's better to use .match().  This function shouldn't
  // be used, really, but it's pretty convenient sometimes,
  // when you just want to work with a regex.
  var set = this.set

  if (!set.length) {
    this.regexp = false
    return this.regexp
  }
  var options = this.options

  var twoStar = options.noglobstar ? star
    : options.dot ? twoStarDot
    : twoStarNoDot
  var flags = options.nocase ? 'i' : ''

  var re = set.map(function (pattern) {
    return pattern.map(function (p) {
      return (p === GLOBSTAR) ? twoStar
      : (typeof p === 'string') ? regExpEscape(p)
      : p._src
    }).join('\\\/')
  }).join('|')

  // must match entire pattern
  // ending in a * or ** will make it less strict.
  re = '^(?:' + re + ')$'

  // can match anything, as long as it's not this.
  if (this.negate) re = '^(?!' + re + ').*$'

  try {
    this.regexp = new RegExp(re, flags)
  } catch (ex) /* istanbul ignore next - should be impossible */ {
    this.regexp = false
  }
  return this.regexp
}

minimatch.match = function (list, pattern, options) {
  options = options || {}
  var mm = new Minimatch(pattern, options)
  list = list.filter(function (f) {
    return mm.match(f)
  })
  if (mm.options.nonull && !list.length) {
    list.push(pattern)
  }
  return list
}

Minimatch.prototype.match = function match (f, partial) {
  if (typeof partial === 'undefined') partial = this.partial
  this.debug('match', f, this.pattern)
  // short-circuit in the case of busted things.
  // comments, etc.
  if (this.comment) return false
  if (this.empty) return f === ''

  if (f === '/' && partial) return true

  var options = this.options

  // windows: need to use /, not \
  if (path.sep !== '/') {
    f = f.split(path.sep).join('/')
  }

  // treat the test path as a set of pathparts.
  f = f.split(slashSplit)
  this.debug(this.pattern, 'split', f)

  // just ONE of the pattern sets in this.set needs to match
  // in order for it to be valid.  If negating, then just one
  // match means that we have failed.
  // Either way, return on the first hit.

  var set = this.set
  this.debug(this.pattern, 'set', set)

  // Find the basename of the path by looking for the last non-empty segment
  var filename
  var i
  for (i = f.length - 1; i >= 0; i--) {
    filename = f[i]
    if (filename) break
  }

  for (i = 0; i < set.length; i++) {
    var pattern = set[i]
    var file = f
    if (options.matchBase && pattern.length === 1) {
      file = [filename]
    }
    var hit = this.matchOne(file, pattern, partial)
    if (hit) {
      if (options.flipNegate) return true
      return !this.negate
    }
  }

  // didn't get any hits.  this is success if it's a negative
  // pattern, failure otherwise.
  if (options.flipNegate) return false
  return this.negate
}

// set partial to true to test if, for example,
// "/a/b" matches the start of "/*/b/*/d"
// Partial means, if you run out of file before you run
// out of pattern, then that's fine, as long as all
// the parts match.
Minimatch.prototype.matchOne = function (file, pattern, partial) {
  var options = this.options

  this.debug('matchOne',
    { 'this': this, file: file, pattern: pattern })

  this.debug('matchOne', file.length, pattern.length)

  for (var fi = 0,
      pi = 0,
      fl = file.length,
      pl = pattern.length
      ; (fi < fl) && (pi < pl)
      ; fi++, pi++) {
    this.debug('matchOne loop')
    var p = pattern[pi]
    var f = file[fi]

    this.debug(pattern, p, f)

    // should be impossible.
    // some invalid regexp stuff in the set.
    /* istanbul ignore if */
    if (p === false) return false

    if (p === GLOBSTAR) {
      this.debug('GLOBSTAR', [pattern, p, f])

      // "**"
      // a/**/b/**/c would match the following:
      // a/b/x/y/z/c
      // a/x/y/z/b/c
      // a/b/x/b/x/c
      // a/b/c
      // To do this, take the rest of the pattern after
      // the **, and see if it would match the file remainder.
      // If so, return success.
      // If not, the ** "swallows" a segment, and try again.
      // This is recursively awful.
      //
      // a/**/b/**/c matching a/b/x/y/z/c
      // - a matches a
      // - doublestar
      //   - matchOne(b/x/y/z/c, b/**/c)
      //     - b matches b
      //     - doublestar
      //       - matchOne(x/y/z/c, c) -> no
      //       - matchOne(y/z/c, c) -> no
      //       - matchOne(z/c, c) -> no
      //       - matchOne(c, c) yes, hit
      var fr = fi
      var pr = pi + 1
      if (pr === pl) {
        this.debug('** at the end')
        // a ** at the end will just swallow the rest.
        // We have found a match.
        // however, it will not swallow /.x, unless
        // options.dot is set.
        // . and .. are *never* matched by **, for explosively
        // exponential reasons.
        for (; fi < fl; fi++) {
          if (file[fi] === '.' || file[fi] === '..' ||
            (!options.dot && file[fi].charAt(0) === '.')) return false
        }
        return true
      }

      // ok, let's see if we can swallow whatever we can.
      while (fr < fl) {
        var swallowee = file[fr]

        this.debug('\nglobstar while', file, fr, pattern, pr, swallowee)

        // XXX remove this slice.  Just pass the start index.
        if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
          this.debug('globstar found match!', fr, fl, swallowee)
          // found a match.
          return true
        } else {
          // can't swallow "." or ".." ever.
          // can only swallow ".foo" when explicitly asked.
          if (swallowee === '.' || swallowee === '..' ||
            (!options.dot && swallowee.charAt(0) === '.')) {
            this.debug('dot detected!', file, fr, pattern, pr)
            break
          }

          // ** swallows a segment, and continue.
          this.debug('globstar swallow a segment, and continue')
          fr++
        }
      }

      // no match was found.
      // However, in partial mode, we can't say this is necessarily over.
      // If there's more *pattern* left, then
      /* istanbul ignore if */
      if (partial) {
        // ran out of file
        this.debug('\n>>> no match, partial?', file, fr, pattern, pr)
        if (fr === fl) return true
      }
      return false
    }

    // something other than **
    // non-magic patterns just have to match exactly
    // patterns with magic have been turned into regexps.
    var hit
    if (typeof p === 'string') {
      hit = f === p
      this.debug('string match', p, f, hit)
    } else {
      hit = f.match(p)
      this.debug('pattern match', p, f, hit)
    }

    if (!hit) return false
  }

  // Note: ending in / means that we'll get a final ""
  // at the end of the pattern.  This can only match a
  // corresponding "" at the end of the file.
  // If the file ends in /, then it can only match a
  // a pattern that ends in /, unless the pattern just
  // doesn't have any more for it. But, a/b/ should *not*
  // match "a/b/*", even though "" matches against the
  // [^/]*? pattern, except in partial mode, where it might
  // simply not be reached yet.
  // However, a/b/ should still satisfy a/*

  // now either we fell off the end of the pattern, or we're done.
  if (fi === fl && pi === pl) {
    // ran out of pattern and filename at the same time.
    // an exact hit!
    return true
  } else if (fi === fl) {
    // ran out of file, but still had pattern left.
    // this is ok if we're doing the match as part of
    // a glob fs traversal.
    return partial
  } else /* istanbul ignore else */ if (pi === pl) {
    // ran out of pattern, still have file left.
    // this is only acceptable if we're on the very last
    // empty segment of a file with a trailing slash.
    // a/* should match a/b/
    return (fi === fl - 1) && (file[fi] === '')
  }

  // should be unreachable.
  /* istanbul ignore next */
  throw new Error('wtf?')
}

// replace stuff like \* with *
function globUnescape (s) {
  return s.replace(/\\(.)/g, '$1')
}

function regExpEscape (s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}


/***/ }),

/***/ "./node_modules/node-domexception/index.js":
/*!*************************************************!*\
  !*** ./node_modules/node-domexception/index.js ***!
  \*************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/*! node-domexception. MIT License. Jimmy W??rting <https://jimmy.warting.se/opensource> */

if (!globalThis.DOMException) {
  try {
    const { MessageChannel } = __webpack_require__(/*! worker_threads */ "worker_threads"),
    port = new MessageChannel().port1,
    ab = new ArrayBuffer()
    port.postMessage(ab, [ab, ab])
  } catch (err) {
    err.constructor.name === 'DOMException' && (
      globalThis.DOMException = err.constructor
    )
  }
}

module.exports = globalThis.DOMException


/***/ }),

/***/ "./node_modules/once/once.js":
/*!***********************************!*\
  !*** ./node_modules/once/once.js ***!
  \***********************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wrappy = __webpack_require__(/*! wrappy */ "./node_modules/wrappy/wrappy.js")
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}


/***/ }),

/***/ "./node_modules/path-is-absolute/index.js":
/*!************************************************!*\
  !*** ./node_modules/path-is-absolute/index.js ***!
  \************************************************/
/***/ ((module) => {

"use strict";


function posix(path) {
	return path.charAt(0) === '/';
}

function win32(path) {
	// https://github.com/nodejs/node/blob/b3fcc245fb25539909ef1d5eaa01dbf92e168633/lib/path.js#L56
	var splitDeviceRe = /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/]+)?([\\\/])?([\s\S]*?)$/;
	var result = splitDeviceRe.exec(path);
	var device = result[1] || '';
	var isUnc = Boolean(device && device.charAt(1) !== ':');

	// UNC paths are always absolute
	return Boolean(result[2] || isUnc);
}

module.exports = process.platform === 'win32' ? win32 : posix;
module.exports.posix = posix;
module.exports.win32 = win32;


/***/ }),

/***/ "./src/callGraphViewer.ts":
/*!********************************!*\
  !*** ./src/callGraphViewer.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CallGraphViewer = void 0;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
const path = __importStar(__webpack_require__(/*! path */ "path"));
const filesystemUtils_1 = __webpack_require__(/*! ./filesystemUtils */ "./src/filesystemUtils.ts");
const glob = __importStar(__webpack_require__(/*! glob */ "./node_modules/glob/glob.js"));
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
class CallGraphViewer {
    constructor(context) {
        this.fsUtils = new filesystemUtils_1.FileSystemUtils();
        this.extensionContext = context;
    }
    generateAndWriteJavascriptFile(nodesJson, edgesJson, callbackFunction) {
        var _a;
        const jsContent = this.generateJavascriptContent(nodesJson, edgesJson);
        const outputJsFilename = CallGraphViewer._name + '.js';
        try {
            this.fsUtils.writeFile((_a = this.extensionContext) === null || _a === void 0 ? void 0 : _a.asAbsolutePath(path.join('.', outputJsFilename)), jsContent, callbackFunction);
        }
        catch (ex) {
            console.log('Dgml Viewer Exception:' + ex);
        }
    }
    generateJavascriptContent(nodesJson, edgesJson) {
        var _a;
        const templateJsFilename = CallGraphViewer._name + '_Template.js';
        let template = fs_1.default.readFileSync((_a = this.extensionContext) === null || _a === void 0 ? void 0 : _a.asAbsolutePath(path.join('templates', templateJsFilename)), 'utf8');
        let jsContent = template.replace('var nodeElements = [];', `var nodeElements = ${nodesJson};`);
        jsContent = jsContent.replace('var edgeElements = [];', `var edgeElements =${edgesJson};`);
        //jsContent = jsContent.replace('\'shape\': \'round-rectangle\',', `'shape': '${this.config.nodeShape}',`);
        //jsContent = jsContent.replace('const edgeArrowType = \'triangle\' // edge arrow to type', `const edgeArrowType = '${this.config.edgeArrowToType}' // edge arrow to type}`);
        //jsContent = jsContent.replace('ctx.strokeStyle = \'blue\'; // graph selection guideline color', `ctx.strokeStyle = '${this.config.graphSelectionGuidelineColor}'; // graph selection guideline color`);
        //jsContent = jsContent.replace('ctx.lineWidth = 1; // graph selection guideline width', `ctx.lineWidth = ${this.config.graphSelectionGuidelineWidth}; // graph selection guideline width`);
        //jsContent = jsContent.replace('selectionCanvasContext.strokeStyle = \'red\';', `selectionCanvasContext.strokeStyle = '${this.config.graphSelectionColor}';`);
        //jsContent = jsContent.replace('selectionCanvasContext.lineWidth = 2;', `selectionCanvasContext.lineWidth = ${this.config.graphSelectionWidth};`);
        //jsContent = jsContent.replace("const defaultLayout = ''; // The graph layout from the dgml file itself", `const defaultLayout = '${this.config.defaultLayout}'; // The graph layout from the dgml file itself`);
        // jsContent = jsContent.replace('const defaultZoom = 1.25;', `const defaultZoom = ${this.zoom};`);
        return jsContent;
    }
    generateHtmlContent(webview, outputJsFilename) {
        var _a;
        const templateHtmlFilename = CallGraphViewer._name + '_Template.html';
        let htmlContent = fs_1.default.readFileSync((_a = this.extensionContext) === null || _a === void 0 ? void 0 : _a.asAbsolutePath(path.join('templates', templateHtmlFilename)), 'utf8');
        const javascriptIncludes = ['cytoscape.min.js', 'cytoscape-svg.js', 'cytoscape-klay.js', 'klay.js'];
        javascriptIncludes.forEach((includeFile) => {
            const includePath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'javascript', includeFile);
            const includeUri = webview.asWebviewUri(includePath);
            htmlContent = htmlContent.replace(includeFile, includeUri.toString());
        });
        const cssPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, 'stylesheets', CallGraphViewer._name + '.css');
        const cssUri = webview.asWebviewUri(cssPath);
        htmlContent = htmlContent.replace(CallGraphViewer._name + '.css', cssUri.toString());
        const nonce = this.getNonce();
        htmlContent = htmlContent.replace('nonce-nonce', `nonce-${nonce}`);
        htmlContent = htmlContent.replace(/<script /g, `<script nonce="${nonce}" `);
        htmlContent = htmlContent.replace('cspSource', webview.cspSource);
        const jsPath = vscode.Uri.joinPath(this.extensionContext.extensionUri, outputJsFilename);
        const jsUri = webview.asWebviewUri(jsPath);
        htmlContent = htmlContent.replace(CallGraphViewer._name + '.js', jsUri.toString());
        return htmlContent;
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    viewCallGraph(nodesJson, edgesJson, webview) {
        webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'gotoLinenumber': {
                    if (vscode.workspace.workspaceFolders == undefined) {
                        return;
                    }
                    const workSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
                    const pos1 = message.callerClass.indexOf('$');
                    let classFile = message.callerClass;
                    if (pos1 != -1) {
                        classFile = message.callerClass.substring(0, pos1);
                    }
                    const javaFile = classFile.replaceAll('.', '/') + '.java';
                    let javaPath = '';
                    for (const specPath of glob.sync(`${workSpacePath}/**/${javaFile}`)) {
                        javaPath = specPath;
                        break;
                    }
                    const lineNum = message.linenum;
                    const searchLineNum = ' ' + lineNum + ' */ ';
                    const fileContent = fs_1.default.readFileSync(javaPath, 'utf-8');
                    const lines = fileContent.split(/\r?\n/);
                    let newLineNum = 0;
                    for (let i = 0; i < lines.length; ++i) {
                        if (lines[i].indexOf(searchLineNum) != -1) {
                            newLineNum = i;
                            break;
                        }
                    }
                    var pos = new vscode.Position(newLineNum, 1);
                    var openPath = vscode.Uri.file(javaPath);
                    vscode.workspace.openTextDocument(openPath).then(doc => {
                        vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Two }).then(editor => {
                            // Line added - by having a selection at the same position twice, the cursor jumps there
                            editor.selections = [new vscode.Selection(pos, pos)];
                            // And the visible range jumps there too
                            var range = new vscode.Range(pos, pos);
                            editor.revealRange(range);
                        });
                    });
                    return;
                }
            }
        });
        const extensionPath = this.extensionContext.extensionPath;
        const javascriptPath = webview.asWebviewUri(vscode.Uri.file(path.join(extensionPath, 'javascript')));
        const outputJsFilename = CallGraphViewer._name + '.js';
        let htmlContent = this.generateHtmlContent(webview, outputJsFilename);
        this.generateAndWriteJavascriptFile(nodesJson, edgesJson, () => {
            webview.html = htmlContent;
        });
    }
}
exports.CallGraphViewer = CallGraphViewer;
CallGraphViewer._name = 'callgraphViewer';


/***/ }),

/***/ "./src/extension.ts":
/*!**************************!*\
  !*** ./src/extension.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
const callGraphViewer_1 = __webpack_require__(/*! ./callGraphViewer */ "./src/callGraphViewer.ts");
const externalCalleesProvider_1 = __webpack_require__(/*! ./externalCalleesProvider */ "./src/externalCalleesProvider.ts");
const data_1 = __webpack_require__(/*! ./mock/data */ "./src/mock/data.ts");
const node_fetch_1 = __importDefault(__webpack_require__(/*! node-fetch */ "./node_modules/node-fetch/src/index.js"));
const child_process_1 = __webpack_require__(/*! child_process */ "child_process");
const glob = __importStar(__webpack_require__(/*! glob */ "./node_modules/glob/glob.js"));
const fs_1 = __importDefault(__webpack_require__(/*! fs */ "fs"));
function activate(context) {
    let calleegraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllers`, (node) => __awaiter(this, void 0, void 0, function* () {
        let fullMethod = '';
        if (node != undefined) {
            fullMethod = node.data.fullMethod;
        }
        else {
            const method = yield vscode.window.showInputBox({
                value: '',
                placeHolder: 'input method',
            });
            fullMethod = method;
        }
        //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
        //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);
        //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
        const respone = yield (0, node_fetch_1.default)(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
        const project = yield respone.json();
        const res = yield (0, node_fetch_1.default)(`http://127.0.0.1:8080/callee_graph?project_name=${project.name}&method=${fullMethod}`);
        const data = yield res.json();
        console.log(data);
        const callgrapViewerPanel = vscode.window.createWebviewPanel('Call Graph', 'Call Graph Viewer', vscode.ViewColumn.One, {
            enableScripts: true
        });
        const command = new callGraphViewer_1.CallGraphViewer(context);
        let callgraph = JSON.parse(data_1.data4);
        command.viewCallGraph(JSON.stringify(data.nodes), JSON.stringify(data.edges), callgrapViewerPanel.webview);
    }));
    context.subscriptions.push(calleegraphViewerDisposable);
    let callergraphViewerDisposable = vscode.commands.registerCommand(`vscode-callgraph.getCallGraphCalllees`, (node) => __awaiter(this, void 0, void 0, function* () {
        let fullMethod = '';
        if (node != undefined) {
            fullMethod = node.data.fullMethod;
        }
        else {
            const method = yield vscode.window.showInputBox({
                value: '',
                placeHolder: 'input method',
            });
            fullMethod = method;
        }
        //vscode.window.showInformationMessage(`Got: ${fullMethod}`); 
        //const res = await fetch(`http://127.0.0.1:8080/caller_graph?project_name=test&method=${fullMethod}`);
        //const fullMethod = 'java.io.PrintStream:println(java.lang.String)';//method;
        const respone = yield (0, node_fetch_1.default)(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
        const project = yield respone.json();
        const res = yield (0, node_fetch_1.default)(`http://127.0.0.1:8080/caller_graph?project_name=${project.name}&method=${fullMethod}`);
        const data = yield res.json();
        console.log(data);
        const callgrapViewerPanel = vscode.window.createWebviewPanel('Call Graph', 'Call Graph Viewer', vscode.ViewColumn.One, {
            enableScripts: true
        });
        const command = new callGraphViewer_1.CallGraphViewer(context);
        let callgraph = JSON.parse(data_1.data4);
        command.viewCallGraph(JSON.stringify(data.nodes), JSON.stringify(data.edges), callgrapViewerPanel.webview);
    }));
    context.subscriptions.push(callergraphViewerDisposable);
    let startServerDisposable = vscode.commands.registerCommand(`vscode-callgraph.startServer`, () => __awaiter(this, void 0, void 0, function* () {
        const extension = vscode.extensions.getExtension('xylab.vscode-callgraph');
        let callgraph_path = '';
        if (extension != undefined) {
            callgraph_path = extension.extensionPath + '/server/start_callgraph.bat';
        }
        const callgraph_command = callgraph_path;
        const cp_callgraph = (0, child_process_1.exec)(callgraph_command, (err, stdout, stderr) => {
            console.log(err || stdout || stderr);
        });
        cp_callgraph.on("close", (code, singal) => {
            console.log(code === 0 ? vscode.window.showInformationMessage('??????callgrap????????????') :
                vscode.window.showInformationMessage('??????callgrap????????????'));
        });
    }));
    context.subscriptions.push(startServerDisposable);
    let openFileDisposable = vscode.commands.registerCommand(`vscode-callgraph.openfile`, (data) => __awaiter(this, void 0, void 0, function* () {
        if (vscode.workspace.workspaceFolders == undefined) {
            return;
        }
        const workSpacePath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        const pos1 = data.callerClass.indexOf('$');
        let classFile = data.callerClass;
        if (pos1 != -1) {
            classFile = data.callerClass.substring(0, pos1);
        }
        const javaFile = classFile.replaceAll('.', '/') + '.java';
        let javaPath = '';
        for (const specPath of glob.sync(`${workSpacePath}/**/${javaFile}`)) {
            javaPath = specPath;
            break;
        }
        const lineNum = data.lineNum;
        const searchLineNum = ' ' + lineNum + ' */ ';
        const fileContent = fs_1.default.readFileSync(javaPath, 'utf-8');
        const lines = fileContent.split(/\r?\n/);
        let newLineNum = 0;
        for (let i = 0; i < lines.length; ++i) {
            if (lines[i].indexOf(searchLineNum) != -1) {
                newLineNum = i;
                break;
            }
        }
        var pos = new vscode.Position(newLineNum, 1);
        var openPath = vscode.Uri.file(javaPath);
        vscode.workspace.openTextDocument(openPath).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                // Line added - by having a selection at the same position twice, the cursor jumps there
                editor.selections = [new vscode.Selection(pos, pos)];
                // And the visible range jumps there too
                var range = new vscode.Range(pos, pos);
                editor.revealRange(range);
            });
        });
    }));
    context.subscriptions.push(openFileDisposable);
    let externalCalleeProvider = new externalCalleesProvider_1.ExternalCalleeProvider();
    //vscode.window.registerTreeDataProvider('method-callees', new CallGraphCalleeProvider());
    vscode.window.registerTreeDataProvider('project-external-callees', externalCalleeProvider);
    /* ???????????????????????????????????????
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("codeseeker.dangerousFunction")) {
        externalCalleeProvider.refreshDangerousFunctionHighlight();
      }
    }))*/
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),

/***/ "./src/externalCalleesProvider.ts":
/*!****************************************!*\
  !*** ./src/externalCalleesProvider.ts ***!
  \****************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ExternalCalleeProvider = void 0;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
const node_fetch_1 = __importDefault(__webpack_require__(/*! node-fetch */ "./node_modules/node-fetch/src/index.js"));
class ExternalCalleeProvider {
    constructor() {
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.data = [];
        this.rules = [
            {
                name: "????????????",
                id: "commend_inject",
                patterns: [
                    "java.lang.Runtime:exec",
                    "java.lang.ProcessBuilder"
                ]
            },
            {
                name: "????????????",
                id: "env",
                patterns: [
                    "java.lang.System:getenv",
                    "java.lang.System:setenv"
                ]
            },
            {
                name: "??????_java",
                id: "other_java",
                patterns: [
                    "java",
                    "javax"
                ]
            },
            {
                name: "??????_huawei",
                id: "other_huawei",
                patterns: [
                    "com.huawei"
                ]
            }
        ];
        const disposable = vscode.commands.registerCommand('vscode-callgraph.getProjectExternalCallees', () => __awaiter(this, void 0, void 0, function* () {
            const respone = yield (0, node_fetch_1.default)(`http://127.0.0.1:8080/project/current`, { method: 'GET' });
            const project = yield respone.json();
            (0, node_fetch_1.default)(`http://127.0.0.1:8080/callee?project_name=${project.name}`, { method: 'GET' }).then(res => res.json()).then(json => {
                vscode.window.showInformationMessage(JSON.stringify(json));
                this.refresh(JSON.stringify(json));
            });
        }));
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    }
    transferCallGraph2TreeJson(external_callees, callerFlag) {
        let mapCallees = new Map();
        for (const external_callee of external_callees) {
            const calleeMethod = external_callee.calleeMethod;
            const caller = mapCallees.get(calleeMethod);
            if (caller == undefined) {
                let callerMap = new Map();
                callerMap.set(external_callee.callerMehtod, { data: { linenum: external_callee.linenum, callerClass: external_callee.callerClass } });
                mapCallees.set(calleeMethod, callerMap);
            }
            else {
                caller.set(external_callee.callerMehtod, { data: { linenum: external_callee.linenum, callerClass: external_callee.callerClass } });
                mapCallees.set(calleeMethod, caller);
            }
        }
        for (const [callee, calllers] of mapCallees.entries()) {
            var newNode = new Callee('');
            newNode.label = callee;
            newNode.data = {};
            newNode.data.fullMethod = callee;
            newNode.children = new Array(calllers.length);
            newNode.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            newNode.iconPath = new vscode.ThemeIcon('getting-started-setup');
            for (const [callerMethod, callerAttr] of calllers.entries()) {
                var newCaller = new Callee('');
                newCaller.label = callerMethod;
                newCaller.data = {};
                newCaller.data.fullMethod = callerMethod;
                newCaller.data.lineNum = callerAttr.data.linenum;
                newCaller.data.callerClass = callerAttr.data.callerClass;
                newCaller.build();
                newCaller.collapsibleState = vscode.TreeItemCollapsibleState.None;
                newNode.children.push(newCaller);
            }
            this.pushCatalogNode(newNode);
        }
    }
    refresh(jsonData) {
        this.data = [];
        this.transferCallGraph2TreeJson(JSON.parse(jsonData), true);
        //this.refreshDangerousFunctionHighlight();
        this._onDidChangeTreeData.fire(null);
    }
    pushCatalogNode(calleeNode) {
        let catalog;
        let foundRule = false;
        let ruleAdded = false;
        let ruleId = '';
        let catalogName = '??????';
        let i = 0;
        //????????????????????????
        for (i = 0; !foundRule && i < this.rules.length; ++i) {
            for (let j = 0; !foundRule && j < this.rules[i].patterns.length; ++j) {
                if (calleeNode.data.fullMethod.indexOf(this.rules[i].patterns[j]) == 0) {
                    foundRule = true;
                    ruleId = this.rules[i].id;
                    catalogName = this.rules[i].name;
                    break;
                }
            }
        }
        //???????????????????????????
        for (catalog of this.data) {
            if (ruleId == catalog.data.id) {
                ruleAdded = true;
                break;
            }
        }
        //??????????????????
        if (ruleAdded && catalog != undefined && catalog.children != undefined) {
            catalog.children.push(calleeNode);
        }
        else {
            catalog = new Callee('');
            catalog.label = catalogName;
            catalog.data = {};
            catalog.data.id = ruleId;
            catalog.children = [];
            catalog.children.push(calleeNode);
            catalog.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
            this.data.push(catalog);
        }
    }
    refreshDangerousFunctionHighlight() {
        const dangerousFuncs = vscode.workspace.getConfiguration('codeseeker').dangerousFunction;
        this.data.forEach((item) => {
            dangerousFuncs.forEach((func) => {
                if (item.data.fullMethod.indexOf(func) != -1) {
                    item.iconPath = new vscode.ThemeIcon('getting-started-setup', new vscode.ThemeColor('list.highlightForeground'));
                }
                else {
                    item.iconPath = new vscode.ThemeIcon('getting-started-setup');
                }
            });
        });
        this._onDidChangeTreeData.fire(null);
    }
}
exports.ExternalCalleeProvider = ExternalCalleeProvider;
class Callee extends vscode.TreeItem {
    constructor(label, children) {
        super(label);
        this.contextValue = 'mytreeitem';
    }
    build() {
        this.command = { command: 'vscode-callgraph.openfile', title: "Open File", arguments: [this.data] };
        this.tooltip = this.data.fullMethod + ' :' + this.data.lineNum;
    }
}
class Rule {
    constructor(name, id, patterns) {
        this.name = name;
        this.id = id;
        this.patterns = [...patterns];
    }
}


/***/ }),

/***/ "./src/filesystemUtils.ts":
/*!********************************!*\
  !*** ./src/filesystemUtils.ts ***!
  \********************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * Methods for accessing the filesystem
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSystemUtils = void 0;
const vscode = __importStar(__webpack_require__(/*! vscode */ "vscode"));
const path = __importStar(__webpack_require__(/*! path */ "path"));
const fs = __importStar(__webpack_require__(/*! fs */ "fs"));
class FileSystemUtils {
    listFiles(dir, excludeDirectories, isMatchingFile) {
        const directories = this.listDirectories(dir, excludeDirectories);
        directories.push(dir);
        let files = [];
        directories.forEach(directory => {
            const filesInDirectory = fs.readdirSync(directory)
                .map(name => path.join(directory, name))
                .filter((name) => fs.lstatSync(name).isFile())
                .filter((name) => isMatchingFile(name));
            files = files.concat(filesInDirectory);
        });
        return files;
    }
    fileExists(filename) {
        try {
            return fs.lstatSync(filename).isFile();
        }
        catch (_a) {
            return false;
        }
    }
    isDirectory(directoryName) {
        return fs.lstatSync(directoryName).isDirectory();
    }
    listDirectories(dir, excludeDirectories) {
        if (excludeDirectories.includes(path.basename(dir))) {
            return [];
        }
        const directories = fs.readdirSync(dir).map(name => path.join(dir, name)).filter(this.isDirectory);
        let result = [];
        if (directories && directories.length > 0) {
            directories.forEach(directory => {
                if (!excludeDirectories.includes(path.basename(directory))) {
                    result.push(directory);
                    const subDirectories = this.listDirectories(directory, excludeDirectories);
                    if (subDirectories.length > 0) {
                        result = result.concat(subDirectories.filter(element => { return !(excludeDirectories.includes(path.basename(element))); }));
                    }
                }
            });
        }
        return result;
    }
    getWorkspaceFolder() {
        var folder = vscode.workspace.workspaceFolders;
        var directoryPath = '';
        if (folder !== null && folder !== undefined) {
            directoryPath = folder[0].uri.fsPath;
        }
        return directoryPath;
    }
    writeFile(filename, content, callback) {
        fs.writeFile(filename, content, function (err) {
            if (err) {
                return console.error(err);
            }
            callback();
        });
    }
    writeFileAndOpen(filename, content) {
        this.writeFile(filename, content, () => {
            var openPath = vscode.Uri.parse("file:///" + filename);
            vscode.workspace.openTextDocument(openPath).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        });
    }
}
exports.FileSystemUtils = FileSystemUtils;


/***/ }),

/***/ "./src/mock/data.ts":
/*!**************************!*\
  !*** ./src/mock/data.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, exports) => {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.data_external_callees = exports.data4 = exports.data2 = exports.data1 = void 0;
exports.data1 = `{
    "method_hash": "Z4lMSWOI60SP_uKDAewipg#031",
    "method_full": "test.call_graph.method_call.TestMCCaller:test1a()",
    "children": [
      {
        "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
        "method_full": "test.call_graph.method_call.TestMCCallee:test1(java.lang.String)",
        "lineNum": 20
      },
      {
        "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
        "method_full": "test.call_graph.method_call.TestMCCallee2:test2(java.lang.String)",
        "lineNum": 21,
        "children": [
            {
                "method_hash": "SP_MOiuKbyMirmBMygzpGw#040",
                "method_full": "test.call_graph.method_call.TestMCCallee3:test3(java.lang.String)",
                "lineNum": 20
            }
        ]
      }
    ]
  }`;
exports.data2 = `{
    "method_hash": "7DjbtcSxeK7OKIUZ9SCcHg#091",
    "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:initialize(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
    "children": [
        {
            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
            "method_full": "java.util.Date:<init>()",
            "lineNum": 67
        },
        {
            "method_hash": "rJkTIWkkUpaMtD-HUIf4pw#04f",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getFileTime()",
            "lineNum": 68
        },
        {
            "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
            "method_full": "java.util.Date:<init>(long)",
            "lineNum": 68
        },
        {
            "method_hash": "IYT126XB_FarCFspnnqaMA#051",
            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
            "lineNum": 68,
            "children": [
                {
                    "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                    "lineNum": 1616,
                    "children": [
                        {
                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                            "lineNum": 1593,
                            "children": [
                                {
                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                    "method_full": "java.util.TimeZone:getDefault()",
                                    "lineNum": 360
                                }
                            ]
                        },
                        {
                            "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                            "lineNum": 1602,
                            "children": [
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1621
                                },
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1626
                                },
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1631
                                }
                            ]
                        },
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 1605
                        },
                        {
                            "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                            "method_full": "java.util.Date:<init>(long)",
                            "lineNum": 1605
                        },
                        {
                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                            "lineNum": 1606,
                            "children": [
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1181,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                    "lineNum": 1181
                                },
                                {
                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                    "method_full": "java.util.Date:getTime()",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                    "method_full": "java.util.Date:<init>(long)",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1203
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1204
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1218
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1220
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1228
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1239
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1241
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1250
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1270,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1283,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1286,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1294,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1313
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1322,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1330,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1350
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1354
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1356
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1358,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1392,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1448,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1471
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1472
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1483,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                    "lineNum": 1506
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1525
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1527
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1552
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1554
                                }
                            ]
                        },
                        {
                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                            "method_full": "java.util.Date:before(java.util.Date)",
                            "lineNum": 1607
                        },
                        {
                            "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                            "method_full": "java.util.Date:compareTo(java.util.Date)",
                            "lineNum": 1611
                        }
                    ]
                }
            ]
        },
        {
            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
            "method_full": "java.util.Date:<init>()",
            "lineNum": 69
        },
        {
            "method_hash": "IYT126XB_FarCFspnnqaMA#051",
            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
            "lineNum": 69,
            "children": [
                {
                    "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                    "lineNum": 1616,
                    "children": [
                        {
                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                            "lineNum": 1593,
                            "children": [
                                {
                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                    "method_full": "java.util.TimeZone:getDefault()",
                                    "lineNum": 360
                                }
                            ]
                        },
                        {
                            "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                            "lineNum": 1602,
                            "children": [
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1621
                                },
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1626
                                },
                                {
                                    "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                    "lineNum": 1631
                                }
                            ]
                        },
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 1605
                        },
                        {
                            "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                            "method_full": "java.util.Date:<init>(long)",
                            "lineNum": 1605
                        },
                        {
                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                            "lineNum": 1606,
                            "children": [
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1181,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                    "lineNum": 1181
                                },
                                {
                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                    "method_full": "java.util.Date:getTime()",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                    "method_full": "java.util.Date:<init>(long)",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1203
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1204
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1218
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1220
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1228
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1239
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1241
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1250
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1270,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1283,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1286,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1294,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1313
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1322,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1330,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1350
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1354
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1356
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1358,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1392,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1448,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1471
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1472
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1483,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                    "lineNum": 1506
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1525
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1527
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1552
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1554
                                }
                            ]
                        },
                        {
                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                            "method_full": "java.util.Date:before(java.util.Date)",
                            "lineNum": 1607
                        },
                        {
                            "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                            "method_full": "java.util.Date:compareTo(java.util.Date)",
                            "lineNum": 1611
                        }
                    ]
                }
            ]
        },
        {
            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
            "lineNum": 70
        },
        {
            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
            "method_full": "java.util.Date:getTime()",
            "lineNum": 70
        },
        {
            "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
            "lineNum": 70
        },
        {
            "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
            "lineNum": 71
        },
        {
            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
            "lineNum": 72
        },
        {
            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
            "method_full": "java.util.Date:getTime()",
            "lineNum": 72
        },
        {
            "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
            "lineNum": 72,
            "children": [
                {
                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                    "method_full": "java.util.Date:<init>(long)",
                    "lineNum": 130
                },
                {
                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                    "lineNum": 130
                }
            ]
        },
        {
            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
            "lineNum": 73
        },
        {
            "method_hash": "N59e7ic2pw_AkVDi5S6L1w#055",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setTimeBased(boolean)",
            "lineNum": 73
        },
        {
            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
            "method_full": "java.util.Date:before(java.util.Date)",
            "lineNum": 75
        },
        {
            "method_hash": "YI2B90T3SoTSRrgivb3JWg#04e",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:rollover()",
            "lineNum": 77,
            "children": [
                {
                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                    "method_full": "java.util.Date:<init>()",
                    "lineNum": 149
                },
                {
                    "method_hash": "IYT126XB_FarCFspnnqaMA#051",
                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
                    "lineNum": 149,
                    "children": [
                        {
                            "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                            "lineNum": 1616,
                            "children": [
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1593,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                                    "lineNum": 1602,
                                    "children": [
                                        {
                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                            "lineNum": 1621
                                        },
                                        {
                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                            "lineNum": 1626
                                        },
                                        {
                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                            "lineNum": 1631
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                    "method_full": "java.util.Date:getTime()",
                                    "lineNum": 1605
                                },
                                {
                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                    "method_full": "java.util.Date:<init>(long)",
                                    "lineNum": 1605
                                },
                                {
                                    "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                    "lineNum": 1606,
                                    "children": [
                                        {
                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                            "lineNum": 1181,
                                            "children": [
                                                {
                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                    "lineNum": 360
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                            "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                            "lineNum": 1181
                                        },
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 1185
                                        },
                                        {
                                            "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                            "method_full": "java.util.Date:<init>(long)",
                                            "lineNum": 1185
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1203
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1204
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1218
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1220
                                        },
                                        {
                                            "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                            "lineNum": 1228
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1239
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1241
                                        },
                                        {
                                            "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                            "lineNum": 1250
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1270,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1283,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                            "lineNum": 1286,
                                            "children": [
                                                {
                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                    "lineNum": 360
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1294,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                            "method_full": "java.util.Date:before(java.util.Date)",
                                            "lineNum": 1313
                                        },
                                        {
                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                            "lineNum": 1322,
                                            "children": [
                                                {
                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                    "lineNum": 360
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1330,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                            "method_full": "java.util.Date:before(java.util.Date)",
                                            "lineNum": 1350
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1354
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1356
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1358,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1392,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1448,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1471
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1472
                                        },
                                        {
                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                            "lineNum": 1483,
                                            "children": [
                                                {
                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                    "lineNum": 1676
                                                },
                                                {
                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                    "lineNum": 1698
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                            "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                            "lineNum": 1506
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1525
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1527
                                        },
                                        {
                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                            "method_full": "java.util.SortedSet:size()",
                                            "lineNum": 1552
                                        },
                                        {
                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                            "method_full": "java.util.SortedSet:first()",
                                            "lineNum": 1554
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1607
                                },
                                {
                                    "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                                    "method_full": "java.util.Date:compareTo(java.util.Date)",
                                    "lineNum": 1611
                                }
                            ]
                        }
                    ]
                },
                {
                    "method_hash": "2-oiwc2UGpH9GvTVT4LZGg#069",
                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(java.util.Date,java.util.Date)",
                    "lineNum": 149,
                    "children": [
                        {
                            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                            "lineNum": 365
                        },
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 365
                        },
                        {
                            "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
                            "lineNum": 365,
                            "children": [
                                {
                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                    "method_full": "java.util.Date:<init>(long)",
                                    "lineNum": 130
                                },
                                {
                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                    "lineNum": 130
                                }
                            ]
                        },
                        {
                            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                            "lineNum": 366
                        },
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 366
                        },
                        {
                            "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
                            "lineNum": 366
                        },
                        {
                            "method_hash": "yEK9OH_vMu2UitWu13C0UA#04c",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover()",
                            "lineNum": 367,
                            "children": [
                                {
                                    "method_hash": "22fB1RUA3ApXNcv9n1HV8Q#053",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:hasOutputStream()",
                                    "lineNum": 371
                                },
                                {
                                    "method_hash": "BvVWLsTDU5RcjdOW-PGbfA#054",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isCreateOnDemand()",
                                    "lineNum": 371,
                                    "children": [
                                        {
                                            "method_hash": "7ohN_DEounvTU1s1UrEQNw#045",
                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:isCreateOnDemand()",
                                            "lineNum": 0
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "hvjVivV82nkf7x_ZUrEplw#051",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isDirectWrite()",
                                    "lineNum": 371
                                },
                                {
                                    "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                    "lineNum": 375
                                },
                                {
                                    "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                    "lineNum": 376
                                },
                                {
                                    "method_hash": "T6eyAlcOOXnt7c4jBsO7Og#063",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverTriggered(java.lang.String)",
                                    "lineNum": 378
                                },
                                {
                                    "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                    "lineNum": 380
                                },
                                {
                                    "method_hash": "r45QCSKe6mKx0tjYqG5dZQ#01e",
                                    "method_full": "java.lang.Thread:interrupted()",
                                    "lineNum": 386
                                },
                                {
                                    "method_hash": "9AOFgj6cjqniC2_1VW6jGQ#036",
                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String)",
                                    "lineNum": 389
                                },
                                {
                                    "method_hash": "6Vb11-rGm8zCk6l3sSladQ#08b",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(org.apache.logging.log4j.core.appender.rolling.RolloverStrategy)",
                                    "lineNum": 392,
                                    "children": [
                                        {
                                            "method_hash": "QNFPuXg6R-1kHuwbiT2oGQ#028",
                                            "method_full": "java.util.concurrent.Semaphore:acquire()",
                                            "lineNum": 492
                                        },
                                        {
                                            "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                            "lineNum": 495
                                        },
                                        {
                                            "method_hash": "02pC5aI3pVadW5t6FJG2jA#08b",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverStrategy:rollover(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                            "lineNum": 502
                                        },
                                        {
                                            "method_hash": "xz9uxGWYYDRcxnnc-ldQZA#04f",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:writeFooter()",
                                            "lineNum": 504
                                        },
                                        {
                                            "method_hash": "R1Ciu543VORoW7D4n0-37Q#055",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:closeOutputStream()",
                                            "lineNum": 505
                                        },
                                        {
                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                            "lineNum": 506,
                                            "children": [
                                                {
                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                            "lineNum": 507,
                                            "children": [
                                                {
                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                            "lineNum": 507
                                        },
                                        {
                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                            "lineNum": 509,
                                            "children": [
                                                {
                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "xC6DufXbTNEVUIsJ4uOkDA#046",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.action.Action:execute()",
                                            "lineNum": 509
                                        },
                                        {
                                            "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                            "lineNum": 512
                                        },
                                        {
                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                            "lineNum": 516,
                                            "children": [
                                                {
                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                            "lineNum": 517,
                                            "children": [
                                                {
                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                            "lineNum": 517
                                        },
                                        {
                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                            "lineNum": 518,
                                            "children": [
                                                {
                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                    "lineNum": 0
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "n8fdAnY0OWxG7IDXCzMHUg#0d4",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager$AsyncAction:<init>(org.apache.logging.log4j.core.appender.rolling.action.Action,org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                            "lineNum": 518,
                                            "children": [
                                                {
                                                    "method_hash": "zSCDY7xBHieHlFNQCyWJvQ#04d",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.action.AbstractAction:<init>()",
                                                    "lineNum": 545
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "zTsT_sEXWAqLn-yIjM0VyA#040",
                                            "method_full": "java.util.concurrent.ExecutorService:execute(java.lang.Runnable)",
                                            "lineNum": 518
                                        },
                                        {
                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                            "lineNum": 526
                                        },
                                        {
                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                            "lineNum": 526
                                        },
                                        {
                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                            "lineNum": 526
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                    "method_full": "java.lang.System:currentTimeMillis()",
                                    "lineNum": 395
                                },
                                {
                                    "method_hash": "nv9gbzB7gdOlPgkYR1-d1A#05b",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createFileAfterRollover()",
                                    "lineNum": 396,
                                    "children": [
                                        {
                                            "method_hash": "yqOGdtCv9LlO2pyzHfPBJg#056",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createOutputStream()",
                                            "lineNum": 419,
                                            "children": [
                                                {
                                                    "method_hash": "04hWR-wNgeVlAbTaX413iQ#047",
                                                    "method_full": "org.apache.logging.log4j.core.appender.FileManager:createOutputStream()",
                                                    "lineNum": 0,
                                                    "children": [
                                                        {
                                                            "method_hash": "kUUtyE-yshpkrlLF8CizJQ#040",
                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:getFileName()",
                                                            "lineNum": 188,
                                                            "children": [
                                                                {
                                                                    "method_hash": "AjqeyG3azkKFvR0N-tS_ww#03c",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.FileManager:getName()",
                                                                    "lineNum": 286,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "rG7hUyPbbfhJR24G1aun9g#044",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:getName()",
                                                                            "lineNum": 0,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                            "method_full": "java.util.Date:<init>()",
                                                            "lineNum": 189
                                                        },
                                                        {
                                                            "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                            "lineNum": 189
                                                        },
                                                        {
                                                            "method_hash": "bVcWvqzqttgH8z2t2R8_UA#025",
                                                            "method_full": "java.io.File:<init>(java.lang.String)",
                                                            "lineNum": 190
                                                        },
                                                        {
                                                            "method_hash": "dO6Tsyiv9mWcpx5mclu1hw#050",
                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:createParentDir(java.io.File)",
                                                            "lineNum": 191
                                                        },
                                                        {
                                                            "method_hash": "Vcg5W6E6Et4xchwVhfV3Aw#035",
                                                            "method_full": "java.io.FileOutputStream:<init>(java.io.File,boolean)",
                                                            "lineNum": 192
                                                        },
                                                        {
                                                            "method_hash": "h5sUwZofbSPjw3FsIyNmuw#015",
                                                            "method_full": "java.io.File:exists()",
                                                            "lineNum": 193
                                                        },
                                                        {
                                                            "method_hash": "jEwGDKaNxrqlr_Fu5LBEGg#015",
                                                            "method_full": "java.io.File:length()",
                                                            "lineNum": 193
                                                        },
                                                        {
                                                            "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                            "method_full": "java.lang.System:currentTimeMillis()",
                                                            "lineNum": 195
                                                        },
                                                        {
                                                            "method_hash": "XTRqcn8pEc_W7IDattsO4A#031",
                                                            "method_full": "java.nio.file.attribute.FileTime:fromMillis(long)",
                                                            "lineNum": 195
                                                        },
                                                        {
                                                            "method_hash": "0qQVGMvv1qmA4ZkhtzHmzQ#015",
                                                            "method_full": "java.io.File:toPath()",
                                                            "lineNum": 196
                                                        },
                                                        {
                                                            "method_hash": "frQm5mNTus-YYezDKI4BrA#071",
                                                            "method_full": "java.nio.file.Files:setAttribute(java.nio.file.Path,java.lang.String,java.lang.Object,java.nio.file.LinkOption[])",
                                                            "lineNum": 196
                                                        },
                                                        {
                                                            "method_hash": "zTk20a5at3-bP7-ZuCovDw#047",
                                                            "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object)",
                                                            "lineNum": 198
                                                        },
                                                        {
                                                            "method_hash": "rX3OlAkJ11jSH_NiV_ryMQ#054",
                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:writeHeader(java.io.OutputStream)",
                                                            "lineNum": 200,
                                                            "children": [
                                                                {
                                                                    "method_hash": "HxZd6k-iTe3nt1fJyIbtfA#05c",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:writeHeader(java.io.OutputStream)",
                                                                    "lineNum": 0,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "8o28hTGaDSpneaWxiHyQbA#030",
                                                                            "method_full": "org.apache.logging.log4j.core.Layout:getHeader()",
                                                                            "lineNum": 127,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "Zolp049DcmF04lVMNA_Hmw#03f",
                                                                                    "method_full": "org.apache.logging.log4j.core.layout.AbstractLayout:getHeader()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "Pew9p1cKFRIdw-TF-2HLRw#02a",
                                                                            "method_full": "java.io.OutputStream:write(byte[],int,int)",
                                                                            "lineNum": 130
                                                                        },
                                                                        {
                                                                            "method_hash": "vIpY5gly7pSa9E-OUOebtA#069",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:logError(java.lang.String,java.lang.Throwable)",
                                                                            "lineNum": 132,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "-p4pq5TXjyh1ivdMMKEeXw#065",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                    "lineNum": 0,
                                                                                    "children": [
                                                                                        {
                                                                                            "method_hash": "WeZJT46eBnjyxwyc89RvrA#07f",
                                                                                            "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:log(org.apache.logging.log4j.Level,java.lang.String,java.lang.Throwable)",
                                                                                            "lineNum": 243,
                                                                                            "children": [
                                                                                                {
                                                                                                    "method_hash": "k9RmyBKtgxgjYHxQbALiow#033",
                                                                                                    "method_full": "org.apache.logging.log4j.Logger:getMessageFactory()",
                                                                                                    "lineNum": 233
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                    "lineNum": 234
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "FrMlsynGLAVgglkclwZW5Q#05f",
                                                                                                    "method_full": "org.apache.logging.log4j.message.MessageFactory:newMessage(java.lang.String,java.lang.Object[])",
                                                                                                    "lineNum": 233
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "ssQL2kR6f7fV2aYFpu0JBQ#080",
                                                                                                    "method_full": "org.apache.logging.log4j.Logger:log(org.apache.logging.log4j.Level,org.apache.logging.log4j.message.Message,java.lang.Throwable)",
                                                                                                    "lineNum": 235
                                                                                                }
                                                                                            ]
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "method_hash": "V1UxhLaycijayebyEX29QQ#03c",
                                                            "method_full": "java.nio.file.Paths:get(java.lang.String,java.lang.String[])",
                                                            "lineNum": 202
                                                        },
                                                        {
                                                            "method_hash": "v7hcG_w3P185cHZn9H4zaw#05a",
                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:defineAttributeView(java.nio.file.Path)",
                                                            "lineNum": 202,
                                                            "children": [
                                                                {
                                                                    "method_hash": "dJ-R_QAcjdry6NhECWPloQ#01b",
                                                                    "method_full": "java.nio.file.Path:toFile()",
                                                                    "lineNum": 213
                                                                },
                                                                {
                                                                    "method_hash": "kb_oR9deZH3YU2zLFbGHag#01c",
                                                                    "method_full": "java.io.File:createNewFile()",
                                                                    "lineNum": 213
                                                                },
                                                                {
                                                                    "method_hash": "jqL9hd_q_9uyCT2VIpT6ig#08d",
                                                                    "method_full": "org.apache.logging.log4j.core.util.FileUtils:defineFilePosixAttributeView(java.nio.file.Path,java.util.Set,java.lang.String,java.lang.String)",
                                                                    "lineNum": 215,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "JxFEWpwCG5b9mrXZxE1N3Q#067",
                                                                            "method_full": "java.nio.file.Files:getFileAttributeView(java.nio.file.Path,java.lang.Class,java.nio.file.LinkOption[])",
                                                                            "lineNum": 154
                                                                        },
                                                                        {
                                                                            "method_hash": "Ae1bRXNtUA_XChmiVWvpbw#026",
                                                                            "method_full": "java.nio.file.FileSystems:getDefault()",
                                                                            "lineNum": 156
                                                                        },
                                                                        {
                                                                            "method_hash": "-Nhm7eOJBGgzmhZBaA5sfQ#038",
                                                                            "method_full": "java.nio.file.FileSystem:getUserPrincipalLookupService()",
                                                                            "lineNum": 157
                                                                        },
                                                                        {
                                                                            "method_hash": "2FAUvlIeVW0jnPfIMNTX_A#05a",
                                                                            "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByName(java.lang.String)",
                                                                            "lineNum": 159
                                                                        },
                                                                        {
                                                                            "method_hash": "fYfF_awaLMmXS936f_v22g#05e",
                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setOwner(java.nio.file.attribute.UserPrincipal)",
                                                                            "lineNum": 165
                                                                        },
                                                                        {
                                                                            "method_hash": "m1eHUeFrT21OqC9en-KKBw#05f",
                                                                            "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByGroupName(java.lang.String)",
                                                                            "lineNum": 169
                                                                        },
                                                                        {
                                                                            "method_hash": "1c57ZXQzPOWuMmLzVMNP1w#05f",
                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setGroup(java.nio.file.attribute.GroupPrincipal)",
                                                                            "lineNum": 173
                                                                        },
                                                                        {
                                                                            "method_hash": "Xy81WN9lrGaKy6GdaorlPA#04c",
                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setPermissions(java.util.Set)",
                                                                            "lineNum": 177
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "UldRC_OpA4O_DkOj6iRhtQ#06a",
                                                                    "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                    "lineNum": 217
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "2zeqSMkVZh9oAdXTHYfv8A#067",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:setOutputStream(java.io.OutputStream)",
                                            "lineNum": 419
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                    "lineNum": 398
                                },
                                {
                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                    "method_full": "java.lang.Thread:currentThread()",
                                    "lineNum": 403
                                },
                                {
                                    "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                    "method_full": "java.lang.Thread:interrupt()",
                                    "lineNum": 403
                                },
                                {
                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                    "method_full": "java.lang.Thread:currentThread()",
                                    "lineNum": 403
                                },
                                {
                                    "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                    "method_full": "java.lang.Thread:interrupt()",
                                    "lineNum": 403
                                },
                                {
                                    "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                    "lineNum": 406
                                },
                                {
                                    "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                    "lineNum": 407
                                },
                                {
                                    "method_hash": "pyei62ud1ZkzkDUnIu6CJw#062",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverComplete(java.lang.String)",
                                    "lineNum": 409
                                },
                                {
                                    "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                    "lineNum": 411
                                }
                            ]
                        }
                    ]
                },
                {
                    "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                    "lineNum": 151,
                    "children": [
                        {
                            "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                            "lineNum": 38
                        }
                    ]
                }
            ]
        },
        {
            "method_hash": "bMoRM1MogztlFzL6scw1Eg#041",
            "method_full": "org.apache.logging.log4j.core.config.Configuration:getScheduler()",
            "lineNum": 80,
            "children": [
                {
                    "method_hash": "ZZdC4HTiFEiOh-yhBkW2RA#049",
                    "method_full": "org.apache.logging.log4j.core.config.AbstractConfiguration:getScheduler()",
                    "lineNum": 0
                }
            ]
        },
        {
            "method_hash": "OzEp6K0cEvsTdN36GBQQnw#052",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isExecutorServiceSet()",
            "lineNum": 81
        },
        {
            "method_hash": "_bv0moHZmZSKEoNiP9Xhtg#055",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:incrementScheduledItems()",
            "lineNum": 83,
            "children": [
                {
                    "method_hash": "OzEp6K0cEvsTdN36GBQQnw#052",
                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isExecutorServiceSet()",
                    "lineNum": 90
                },
                {
                    "method_hash": "rz4g57RjH3SrjKJXFg6Odw#048",
                    "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object)",
                    "lineNum": 91
                }
            ]
        },
        {
            "method_hash": "Yi-6KMm9ml5498WgjYat5g#047",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:isStarted()",
            "lineNum": 85,
            "children": [
                {
                    "method_hash": "BMfzeUTEwhtGbC9z0hin7g#03b",
                    "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:isStarted()",
                    "lineNum": 0
                }
            ]
        },
        {
            "method_hash": "r0uOQSfIjxEp814y00pUVA#043",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:start()",
            "lineNum": 86,
            "children": [
                {
                    "method_hash": "0LUt7OhHdX87NbJSTCVdcQ#037",
                    "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:start()",
                    "lineNum": 56,
                    "children": [
                        {
                            "method_hash": "3X9XfPVn-NMMZcYblwFImg#03c",
                            "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:setStarted()",
                            "lineNum": 131,
                            "children": [
                                {
                                    "method_hash": "f3Zsa7WP60oGoKMJauKuag#067",
                                    "method_full": "org.apache.logging.log4j.core.AbstractLifeCycle:setState(org.apache.logging.log4j.core.LifeCycle$State)",
                                    "lineNum": 103
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "method_hash": "urn2mVpqTPFhTEJYdll4dA#0e1",
            "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:<init>(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy,org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$1)",
            "lineNum": 89,
            "children": [
                {
                    "method_hash": "RqGdrN0vBLt06xzel_lNxA#09b",
                    "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:<init>(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy)",
                    "lineNum": 168,
                    "children": [
                        {
                            "method_hash": "s48xhk9TorXpI_3sTySsTg#055",
                            "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy$CronTrigger:run()",
                            "lineNum": 0,
                            "children": [
                                {
                                    "method_hash": "TFeq-gS2Mx58u3UZ0w2_ZQ#093",
                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:access$100(org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy)",
                                    "lineNum": 172,
                                    "children": [
                                        {
                                            "method_hash": "YI2B90T3SoTSRrgivb3JWg#04e",
                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.CronTriggeringPolicy:rollover()",
                                            "lineNum": 41,
                                            "children": [
                                                {
                                                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                    "method_full": "java.util.Date:<init>()",
                                                    "lineNum": 149
                                                },
                                                {
                                                    "method_hash": "IYT126XB_FarCFspnnqaMA#051",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getPrevFireTime(java.util.Date)",
                                                    "lineNum": 149,
                                                    "children": [
                                                        {
                                                            "method_hash": "TPaWanH6LEa1GFnImAQ6Bw#04f",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeBefore(java.util.Date)",
                                                            "lineNum": 1616,
                                                            "children": [
                                                                {
                                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                    "lineNum": 1593,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                                            "lineNum": 360
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "Q3ipfWiqRb_NpmvVcrUmxQ#044",
                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:findMinIncrement()",
                                                                    "lineNum": 1602,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                            "lineNum": 1621
                                                                        },
                                                                        {
                                                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                            "lineNum": 1626
                                                                        },
                                                                        {
                                                                            "method_hash": "GD4WULMYmWjhM9PJgS2tAA#04d",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:minInSet(java.util.TreeSet)",
                                                                            "lineNum": 1631
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                                    "method_full": "java.util.Date:getTime()",
                                                                    "lineNum": 1605
                                                                },
                                                                {
                                                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                    "method_full": "java.util.Date:<init>(long)",
                                                                    "lineNum": 1605
                                                                },
                                                                {
                                                                    "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                                                    "lineNum": 1606,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                            "lineNum": 1181,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                                                    "lineNum": 360
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                                            "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                                            "lineNum": 1181
                                                                        },
                                                                        {
                                                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                                            "method_full": "java.util.Date:getTime()",
                                                                            "lineNum": 1185
                                                                        },
                                                                        {
                                                                            "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                            "method_full": "java.util.Date:<init>(long)",
                                                                            "lineNum": 1185
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1203
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1204
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1218
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1220
                                                                        },
                                                                        {
                                                                            "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                                            "lineNum": 1228
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1239
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1241
                                                                        },
                                                                        {
                                                                            "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                                            "lineNum": 1250
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1270,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1283,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                            "lineNum": 1286,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                                                    "lineNum": 360
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1294,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                            "method_full": "java.util.Date:before(java.util.Date)",
                                                                            "lineNum": 1313
                                                                        },
                                                                        {
                                                                            "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                                            "lineNum": 1322,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                                                    "method_full": "java.util.TimeZone:getDefault()",
                                                                                    "lineNum": 360
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1330,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                            "method_full": "java.util.Date:before(java.util.Date)",
                                                                            "lineNum": 1350
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1354
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1356
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1358,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1392,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1448,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1471
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1472
                                                                        },
                                                                        {
                                                                            "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                                            "lineNum": 1483,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                                                    "lineNum": 1676
                                                                                },
                                                                                {
                                                                                    "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                                                    "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                                                    "lineNum": 1698
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                                            "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                                            "lineNum": 1506
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1525
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1527
                                                                        },
                                                                        {
                                                                            "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                                            "method_full": "java.util.SortedSet:size()",
                                                                            "lineNum": 1552
                                                                        },
                                                                        {
                                                                            "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                                            "method_full": "java.util.SortedSet:first()",
                                                                            "lineNum": 1554
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                                    "lineNum": 1607
                                                                },
                                                                {
                                                                    "method_hash": "n2GwKPBZC0vtp_N67Exqzw#028",
                                                                    "method_full": "java.util.Date:compareTo(java.util.Date)",
                                                                    "lineNum": 1611
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "2-oiwc2UGpH9GvTVT4LZGg#069",
                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(java.util.Date,java.util.Date)",
                                                    "lineNum": 149,
                                                    "children": [
                                                        {
                                                            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                                                            "lineNum": 365
                                                        },
                                                        {
                                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                            "method_full": "java.util.Date:getTime()",
                                                            "lineNum": 365
                                                        },
                                                        {
                                                            "method_hash": "Pd4jXDnoGS52ypFlKhyfdw#055",
                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setPrevFileTime(long)",
                                                            "lineNum": 365,
                                                            "children": [
                                                                {
                                                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                                    "method_full": "java.util.Date:<init>(long)",
                                                                    "lineNum": 130
                                                                },
                                                                {
                                                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                    "lineNum": 130
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "method_hash": "pw9yvtgapneh-aNIgFU5KQ#057",
                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:getPatternProcessor()",
                                                            "lineNum": 366
                                                        },
                                                        {
                                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                            "method_full": "java.util.Date:getTime()",
                                                            "lineNum": 366
                                                        },
                                                        {
                                                            "method_hash": "_aSSFev0lN8qJ2mHjSRnPw#058",
                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.PatternProcessor:setCurrentFileTime(long)",
                                                            "lineNum": 366
                                                        },
                                                        {
                                                            "method_hash": "yEK9OH_vMu2UitWu13C0UA#04c",
                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover()",
                                                            "lineNum": 367,
                                                            "children": [
                                                                {
                                                                    "method_hash": "22fB1RUA3ApXNcv9n1HV8Q#053",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:hasOutputStream()",
                                                                    "lineNum": 371
                                                                },
                                                                {
                                                                    "method_hash": "BvVWLsTDU5RcjdOW-PGbfA#054",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isCreateOnDemand()",
                                                                    "lineNum": 371,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "7ohN_DEounvTU1s1UrEQNw#045",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:isCreateOnDemand()",
                                                                            "lineNum": 0
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "hvjVivV82nkf7x_ZUrEplw#051",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:isDirectWrite()",
                                                                    "lineNum": 371
                                                                },
                                                                {
                                                                    "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                                                    "lineNum": 375
                                                                },
                                                                {
                                                                    "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                                                    "lineNum": 376
                                                                },
                                                                {
                                                                    "method_hash": "T6eyAlcOOXnt7c4jBsO7Og#063",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverTriggered(java.lang.String)",
                                                                    "lineNum": 378
                                                                },
                                                                {
                                                                    "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                    "lineNum": 380
                                                                },
                                                                {
                                                                    "method_hash": "r45QCSKe6mKx0tjYqG5dZQ#01e",
                                                                    "method_full": "java.lang.Thread:interrupted()",
                                                                    "lineNum": 386
                                                                },
                                                                {
                                                                    "method_hash": "9AOFgj6cjqniC2_1VW6jGQ#036",
                                                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String)",
                                                                    "lineNum": 389
                                                                },
                                                                {
                                                                    "method_hash": "6Vb11-rGm8zCk6l3sSladQ#08b",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:rollover(org.apache.logging.log4j.core.appender.rolling.RolloverStrategy)",
                                                                    "lineNum": 392,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "QNFPuXg6R-1kHuwbiT2oGQ#028",
                                                                            "method_full": "java.util.concurrent.Semaphore:acquire()",
                                                                            "lineNum": 492
                                                                        },
                                                                        {
                                                                            "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                            "lineNum": 495
                                                                        },
                                                                        {
                                                                            "method_hash": "02pC5aI3pVadW5t6FJG2jA#08b",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverStrategy:rollover(org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                                                            "lineNum": 502
                                                                        },
                                                                        {
                                                                            "method_hash": "xz9uxGWYYDRcxnnc-ldQZA#04f",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:writeFooter()",
                                                                            "lineNum": 504
                                                                        },
                                                                        {
                                                                            "method_hash": "R1Ciu543VORoW7D4n0-37Q#055",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:closeOutputStream()",
                                                                            "lineNum": 505
                                                                        },
                                                                        {
                                                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                            "lineNum": 506,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                            "lineNum": 507,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                            "lineNum": 507
                                                                        },
                                                                        {
                                                                            "method_hash": "PUqbD110pfx35TItVto-Qg#053",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getSynchronous()",
                                                                            "lineNum": 509,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "BcffQoaQ7RIRmPDlrlS0TA#057",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getSynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "xC6DufXbTNEVUIsJ4uOkDA#046",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.action.Action:execute()",
                                                                            "lineNum": 509
                                                                        },
                                                                        {
                                                                            "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                            "lineNum": 512
                                                                        },
                                                                        {
                                                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                            "lineNum": 516,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                            "lineNum": 517,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                                            "lineNum": 517
                                                                        },
                                                                        {
                                                                            "method_hash": "Lmgm_iTVOpkV6UZr9n7yKw#054",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescription:getAsynchronous()",
                                                                            "lineNum": 518,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "dSGqbQuktielM2et6B43DA#058",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverDescriptionImpl:getAsynchronous()",
                                                                                    "lineNum": 0
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "n8fdAnY0OWxG7IDXCzMHUg#0d4",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager$AsyncAction:<init>(org.apache.logging.log4j.core.appender.rolling.action.Action,org.apache.logging.log4j.core.appender.rolling.RollingFileManager)",
                                                                            "lineNum": 518,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "zSCDY7xBHieHlFNQCyWJvQ#04d",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.action.AbstractAction:<init>()",
                                                                                    "lineNum": 545
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "zTsT_sEXWAqLn-yIjM0VyA#040",
                                                                            "method_full": "java.util.concurrent.ExecutorService:execute(java.lang.Runnable)",
                                                                            "lineNum": 518
                                                                        },
                                                                        {
                                                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                                                            "lineNum": 526
                                                                        },
                                                                        {
                                                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                                                            "lineNum": 526
                                                                        },
                                                                        {
                                                                            "method_hash": "BB2z1dPQDZw4e152Pmc4Tg#028",
                                                                            "method_full": "java.util.concurrent.Semaphore:release()",
                                                                            "lineNum": 526
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                                    "method_full": "java.lang.System:currentTimeMillis()",
                                                                    "lineNum": 395
                                                                },
                                                                {
                                                                    "method_hash": "nv9gbzB7gdOlPgkYR1-d1A#05b",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createFileAfterRollover()",
                                                                    "lineNum": 396,
                                                                    "children": [
                                                                        {
                                                                            "method_hash": "yqOGdtCv9LlO2pyzHfPBJg#056",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:createOutputStream()",
                                                                            "lineNum": 419,
                                                                            "children": [
                                                                                {
                                                                                    "method_hash": "04hWR-wNgeVlAbTaX413iQ#047",
                                                                                    "method_full": "org.apache.logging.log4j.core.appender.FileManager:createOutputStream()",
                                                                                    "lineNum": 0,
                                                                                    "children": [
                                                                                        {
                                                                                            "method_hash": "kUUtyE-yshpkrlLF8CizJQ#040",
                                                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:getFileName()",
                                                                                            "lineNum": 188,
                                                                                            "children": [
                                                                                                {
                                                                                                    "method_hash": "AjqeyG3azkKFvR0N-tS_ww#03c",
                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.FileManager:getName()",
                                                                                                    "lineNum": 286,
                                                                                                    "children": [
                                                                                                        {
                                                                                                            "method_hash": "rG7hUyPbbfhJR24G1aun9g#044",
                                                                                                            "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:getName()",
                                                                                                            "lineNum": 0,
                                                                                                            "children": [
                                                                                                                {
                                                                                                                    "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                                    "lineNum": 0
                                                                                                                }
                                                                                                            ]
                                                                                                        }
                                                                                                    ]
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                                                                            "method_full": "java.util.Date:<init>()",
                                                                                            "lineNum": 189
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                                                            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                                                            "lineNum": 189
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "bVcWvqzqttgH8z2t2R8_UA#025",
                                                                                            "method_full": "java.io.File:<init>(java.lang.String)",
                                                                                            "lineNum": 190
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "dO6Tsyiv9mWcpx5mclu1hw#050",
                                                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:createParentDir(java.io.File)",
                                                                                            "lineNum": 191
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "Vcg5W6E6Et4xchwVhfV3Aw#035",
                                                                                            "method_full": "java.io.FileOutputStream:<init>(java.io.File,boolean)",
                                                                                            "lineNum": 192
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "h5sUwZofbSPjw3FsIyNmuw#015",
                                                                                            "method_full": "java.io.File:exists()",
                                                                                            "lineNum": 193
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "jEwGDKaNxrqlr_Fu5LBEGg#015",
                                                                                            "method_full": "java.io.File:length()",
                                                                                            "lineNum": 193
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                                                                            "method_full": "java.lang.System:currentTimeMillis()",
                                                                                            "lineNum": 195
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "XTRqcn8pEc_W7IDattsO4A#031",
                                                                                            "method_full": "java.nio.file.attribute.FileTime:fromMillis(long)",
                                                                                            "lineNum": 195
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "0qQVGMvv1qmA4ZkhtzHmzQ#015",
                                                                                            "method_full": "java.io.File:toPath()",
                                                                                            "lineNum": 196
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "frQm5mNTus-YYezDKI4BrA#071",
                                                                                            "method_full": "java.nio.file.Files:setAttribute(java.nio.file.Path,java.lang.String,java.lang.Object,java.nio.file.LinkOption[])",
                                                                                            "lineNum": 196
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "zTk20a5at3-bP7-ZuCovDw#047",
                                                                                            "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object)",
                                                                                            "lineNum": 198
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "rX3OlAkJ11jSH_NiV_ryMQ#054",
                                                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:writeHeader(java.io.OutputStream)",
                                                                                            "lineNum": 200,
                                                                                            "children": [
                                                                                                {
                                                                                                    "method_hash": "HxZd6k-iTe3nt1fJyIbtfA#05c",
                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:writeHeader(java.io.OutputStream)",
                                                                                                    "lineNum": 0,
                                                                                                    "children": [
                                                                                                        {
                                                                                                            "method_hash": "8o28hTGaDSpneaWxiHyQbA#030",
                                                                                                            "method_full": "org.apache.logging.log4j.core.Layout:getHeader()",
                                                                                                            "lineNum": 127,
                                                                                                            "children": [
                                                                                                                {
                                                                                                                    "method_hash": "Zolp049DcmF04lVMNA_Hmw#03f",
                                                                                                                    "method_full": "org.apache.logging.log4j.core.layout.AbstractLayout:getHeader()",
                                                                                                                    "lineNum": 0
                                                                                                                }
                                                                                                            ]
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "Pew9p1cKFRIdw-TF-2HLRw#02a",
                                                                                                            "method_full": "java.io.OutputStream:write(byte[],int,int)",
                                                                                                            "lineNum": 130
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "vIpY5gly7pSa9E-OUOebtA#069",
                                                                                                            "method_full": "org.apache.logging.log4j.core.appender.OutputStreamManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                                            "lineNum": 132,
                                                                                                            "children": [
                                                                                                                {
                                                                                                                    "method_hash": "-p4pq5TXjyh1ivdMMKEeXw#065",
                                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:logError(java.lang.String,java.lang.Throwable)",
                                                                                                                    "lineNum": 0,
                                                                                                                    "children": [
                                                                                                                        {
                                                                                                                            "method_hash": "WeZJT46eBnjyxwyc89RvrA#07f",
                                                                                                                            "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:log(org.apache.logging.log4j.Level,java.lang.String,java.lang.Throwable)",
                                                                                                                            "lineNum": 243,
                                                                                                                            "children": [
                                                                                                                                {
                                                                                                                                    "method_hash": "k9RmyBKtgxgjYHxQbALiow#033",
                                                                                                                                    "method_full": "org.apache.logging.log4j.Logger:getMessageFactory()",
                                                                                                                                    "lineNum": 233
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    "method_hash": "AQb9OExaN4oGivNRc6-qpg#040",
                                                                                                                                    "method_full": "org.apache.logging.log4j.core.appender.AbstractManager:getName()",
                                                                                                                                    "lineNum": 234
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    "method_hash": "FrMlsynGLAVgglkclwZW5Q#05f",
                                                                                                                                    "method_full": "org.apache.logging.log4j.message.MessageFactory:newMessage(java.lang.String,java.lang.Object[])",
                                                                                                                                    "lineNum": 233
                                                                                                                                },
                                                                                                                                {
                                                                                                                                    "method_hash": "ssQL2kR6f7fV2aYFpu0JBQ#080",
                                                                                                                                    "method_full": "org.apache.logging.log4j.Logger:log(org.apache.logging.log4j.Level,org.apache.logging.log4j.message.Message,java.lang.Throwable)",
                                                                                                                                    "lineNum": 235
                                                                                                                                }
                                                                                                                            ]
                                                                                                                        }
                                                                                                                    ]
                                                                                                                }
                                                                                                            ]
                                                                                                        }
                                                                                                    ]
                                                                                                }
                                                                                            ]
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "V1UxhLaycijayebyEX29QQ#03c",
                                                                                            "method_full": "java.nio.file.Paths:get(java.lang.String,java.lang.String[])",
                                                                                            "lineNum": 202
                                                                                        },
                                                                                        {
                                                                                            "method_hash": "v7hcG_w3P185cHZn9H4zaw#05a",
                                                                                            "method_full": "org.apache.logging.log4j.core.appender.FileManager:defineAttributeView(java.nio.file.Path)",
                                                                                            "lineNum": 202,
                                                                                            "children": [
                                                                                                {
                                                                                                    "method_hash": "dJ-R_QAcjdry6NhECWPloQ#01b",
                                                                                                    "method_full": "java.nio.file.Path:toFile()",
                                                                                                    "lineNum": 213
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "kb_oR9deZH3YU2zLFbGHag#01c",
                                                                                                    "method_full": "java.io.File:createNewFile()",
                                                                                                    "lineNum": 213
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "jqL9hd_q_9uyCT2VIpT6ig#08d",
                                                                                                    "method_full": "org.apache.logging.log4j.core.util.FileUtils:defineFilePosixAttributeView(java.nio.file.Path,java.util.Set,java.lang.String,java.lang.String)",
                                                                                                    "lineNum": 215,
                                                                                                    "children": [
                                                                                                        {
                                                                                                            "method_hash": "JxFEWpwCG5b9mrXZxE1N3Q#067",
                                                                                                            "method_full": "java.nio.file.Files:getFileAttributeView(java.nio.file.Path,java.lang.Class,java.nio.file.LinkOption[])",
                                                                                                            "lineNum": 154
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "Ae1bRXNtUA_XChmiVWvpbw#026",
                                                                                                            "method_full": "java.nio.file.FileSystems:getDefault()",
                                                                                                            "lineNum": 156
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "-Nhm7eOJBGgzmhZBaA5sfQ#038",
                                                                                                            "method_full": "java.nio.file.FileSystem:getUserPrincipalLookupService()",
                                                                                                            "lineNum": 157
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "2FAUvlIeVW0jnPfIMNTX_A#05a",
                                                                                                            "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByName(java.lang.String)",
                                                                                                            "lineNum": 159
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "fYfF_awaLMmXS936f_v22g#05e",
                                                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setOwner(java.nio.file.attribute.UserPrincipal)",
                                                                                                            "lineNum": 165
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "m1eHUeFrT21OqC9en-KKBw#05f",
                                                                                                            "method_full": "java.nio.file.attribute.UserPrincipalLookupService:lookupPrincipalByGroupName(java.lang.String)",
                                                                                                            "lineNum": 169
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "1c57ZXQzPOWuMmLzVMNP1w#05f",
                                                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setGroup(java.nio.file.attribute.GroupPrincipal)",
                                                                                                            "lineNum": 173
                                                                                                        },
                                                                                                        {
                                                                                                            "method_hash": "Xy81WN9lrGaKy6GdaorlPA#04c",
                                                                                                            "method_full": "java.nio.file.attribute.PosixFileAttributeView:setPermissions(java.util.Set)",
                                                                                                            "lineNum": 177
                                                                                                        }
                                                                                                    ]
                                                                                                },
                                                                                                {
                                                                                                    "method_hash": "UldRC_OpA4O_DkOj6iRhtQ#06a",
                                                                                                    "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                                                    "lineNum": 217
                                                                                                }
                                                                                            ]
                                                                                        }
                                                                                    ]
                                                                                }
                                                                            ]
                                                                        },
                                                                        {
                                                                            "method_hash": "2zeqSMkVZh9oAdXTHYfv8A#067",
                                                                            "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:setOutputStream(java.io.OutputStream)",
                                                                            "lineNum": 419
                                                                        }
                                                                    ]
                                                                },
                                                                {
                                                                    "method_hash": "-mtuiEe_hHStrVOSkaIh1Q#070",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RollingFileManager:logError(java.lang.String,java.lang.Throwable)",
                                                                    "lineNum": 398
                                                                },
                                                                {
                                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                    "method_full": "java.lang.Thread:currentThread()",
                                                                    "lineNum": 403
                                                                },
                                                                {
                                                                    "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                                                    "method_full": "java.lang.Thread:interrupt()",
                                                                    "lineNum": 403
                                                                },
                                                                {
                                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                    "method_full": "java.lang.Thread:currentThread()",
                                                                    "lineNum": 403
                                                                },
                                                                {
                                                                    "method_hash": "65w-RB4Y5QsDzL87n0Omgw#01c",
                                                                    "method_full": "java.lang.Thread:interrupt()",
                                                                    "lineNum": 403
                                                                },
                                                                {
                                                                    "method_hash": "4mhnUdVGG5fBVk6ChESS4A#030",
                                                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:size()",
                                                                    "lineNum": 406
                                                                },
                                                                {
                                                                    "method_hash": "T_CsnN40dubgjfKnMS_8ig#034",
                                                                    "method_full": "java.util.concurrent.CopyOnWriteArrayList:iterator()",
                                                                    "lineNum": 407
                                                                },
                                                                {
                                                                    "method_hash": "pyei62ud1ZkzkDUnIu6CJw#062",
                                                                    "method_full": "org.apache.logging.log4j.core.appender.rolling.RolloverListener:rolloverComplete(java.lang.String)",
                                                                    "lineNum": 409
                                                                },
                                                                {
                                                                    "method_hash": "Nuu3cfa6VB4K8m1btVgupw#069",
                                                                    "method_full": "org.apache.logging.log4j.Logger:warn(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                                                    "lineNum": 411
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                                                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                                                    "lineNum": 151,
                                                    "children": [
                                                        {
                                                            "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                                                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                                                            "lineNum": 38
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "method_hash": "FvzLmegVkHqN68Arszd_Dw#0a1",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:scheduleWithCron(org.apache.logging.log4j.core.util.CronExpression,java.util.Date,java.lang.Runnable)",
            "lineNum": 89,
            "children": [
                {
                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                    "method_full": "java.util.Date:<init>()",
                    "lineNum": 150
                },
                {
                    "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                    "lineNum": 150,
                    "children": [
                        {
                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                            "lineNum": 311,
                            "children": [
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1181,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                    "lineNum": 1181
                                },
                                {
                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                    "method_full": "java.util.Date:getTime()",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                    "method_full": "java.util.Date:<init>(long)",
                                    "lineNum": 1185
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1203
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1204
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1218
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1220
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1228
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1239
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1241
                                },
                                {
                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                    "lineNum": 1250
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1270,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1283,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1286,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1294,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1313
                                },
                                {
                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                    "lineNum": 1322,
                                    "children": [
                                        {
                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                            "method_full": "java.util.TimeZone:getDefault()",
                                            "lineNum": 360
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1330,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                    "method_full": "java.util.Date:before(java.util.Date)",
                                    "lineNum": 1350
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1354
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1356
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1358,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1392,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1448,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1471
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1472
                                },
                                {
                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                    "lineNum": 1483,
                                    "children": [
                                        {
                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                            "lineNum": 1676
                                        },
                                        {
                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                            "lineNum": 1698
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                    "lineNum": 1506
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1525
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1527
                                },
                                {
                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                    "method_full": "java.util.SortedSet:size()",
                                    "lineNum": 1552
                                },
                                {
                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                    "method_full": "java.util.SortedSet:first()",
                                    "lineNum": 1554
                                }
                            ]
                        }
                    ]
                },
                {
                    "method_hash": "iAewsRT1cbxXWcM5kgR4hw#0d1",
                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:<init>(org.apache.logging.log4j.core.config.ConfigurationScheduler,java.lang.Runnable,org.apache.logging.log4j.core.util.CronExpression)",
                    "lineNum": 151,
                    "children": [
                        {
                            "method_hash": "ruQqG0yrVkObB_Lt7wfg4w#04e",
                            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:run()",
                            "lineNum": 0,
                            "children": [
                                {
                                    "method_hash": "VQWm6xL5q97VTPaUpEzH3g#046",
                                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:getFireTime()",
                                    "lineNum": 233,
                                    "children": [
                                        {
                                            "method_hash": "UgAi9LmAK-sHRUqWNsADZA#093",
                                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:access$000(org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData)",
                                            "lineNum": 38
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                    "method_full": "java.util.Date:getTime()",
                                    "lineNum": 233
                                },
                                {
                                    "method_hash": "Db1pSyrspiE6RZ-lBNYLRg#024",
                                    "method_full": "java.lang.System:currentTimeMillis()",
                                    "lineNum": 233
                                },
                                {
                                    "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                    "lineNum": 235
                                },
                                {
                                    "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                    "lineNum": 235
                                },
                                {
                                    "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                    "lineNum": 235
                                },
                                {
                                    "method_hash": "I-14UUNhrKJwDmNJ4WcexA#01c",
                                    "method_full": "java.lang.Thread:sleep(long)",
                                    "lineNum": 237
                                },
                                {
                                    "method_hash": "5al39h2bFBQQAEVODcvt3w#018",
                                    "method_full": "java.lang.Runnable:run()",
                                    "lineNum": 242
                                },
                                {
                                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                    "method_full": "java.util.Date:<init>()",
                                    "lineNum": 246
                                },
                                {
                                    "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                    "lineNum": 246,
                                    "children": [
                                        {
                                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                            "lineNum": 311,
                                            "children": [
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1181,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                    "lineNum": 1181
                                                },
                                                {
                                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                    "method_full": "java.util.Date:getTime()",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                    "method_full": "java.util.Date:<init>(long)",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1203
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1204
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1218
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1220
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1228
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1239
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1241
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1250
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1270,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1283,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1286,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1294,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1313
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1322,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1330,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1350
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1354
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1356
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1358,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1392,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1448,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1471
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1472
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1483,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                    "lineNum": 1506
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1525
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1527
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1552
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1554
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                            "method_full": "java.util.Date:<init>()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                            "lineNum": 128,
                                            "children": [
                                                {
                                                    "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                    "lineNum": 198
                                                },
                                                {
                                                    "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                    "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                    "lineNum": 201,
                                                    "children": [
                                                        {
                                                            "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                            "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                            "lineNum": 40,
                                                            "children": [
                                                                {
                                                                    "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                    "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                    "lineNum": 76
                                                                },
                                                                {
                                                                    "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                    "method_full": "java.lang.System:getSecurityManager()",
                                                                    "lineNum": 79
                                                                },
                                                                {
                                                                    "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                    "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                    "lineNum": 80
                                                                },
                                                                {
                                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                    "method_full": "java.lang.Thread:currentThread()",
                                                                    "lineNum": 81
                                                                },
                                                                {
                                                                    "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                    "method_full": "java.lang.Thread:getThreadGroup()",
                                                                    "lineNum": 81
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                    "lineNum": 201
                                                },
                                                {
                                                    "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 202
                                                },
                                                {
                                                    "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 203
                                                },
                                                {
                                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                    "lineNum": 207
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                            "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                            "lineNum": 128
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                    "lineNum": 250,
                                    "children": [
                                        {
                                            "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                            "lineNum": 42
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                    "lineNum": 244
                                },
                                {
                                    "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                    "lineNum": 244
                                },
                                {
                                    "method_hash": "gA3yxChI30QQ5AdTGgDDxA#059",
                                    "method_full": "org.apache.logging.log4j.Logger:error(java.lang.String,java.lang.Object,java.lang.Object)",
                                    "lineNum": 244
                                },
                                {
                                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                    "method_full": "java.util.Date:<init>()",
                                    "lineNum": 246
                                },
                                {
                                    "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                    "lineNum": 246,
                                    "children": [
                                        {
                                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                            "lineNum": 311,
                                            "children": [
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1181,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                    "lineNum": 1181
                                                },
                                                {
                                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                    "method_full": "java.util.Date:getTime()",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                    "method_full": "java.util.Date:<init>(long)",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1203
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1204
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1218
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1220
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1228
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1239
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1241
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1250
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1270,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1283,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1286,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1294,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1313
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1322,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1330,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1350
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1354
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1356
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1358,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1392,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1448,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1471
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1472
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1483,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                    "lineNum": 1506
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1525
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1527
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1552
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1554
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                            "method_full": "java.util.Date:<init>()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                            "lineNum": 128,
                                            "children": [
                                                {
                                                    "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                    "lineNum": 198
                                                },
                                                {
                                                    "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                    "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                    "lineNum": 201,
                                                    "children": [
                                                        {
                                                            "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                            "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                            "lineNum": 40,
                                                            "children": [
                                                                {
                                                                    "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                    "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                    "lineNum": 76
                                                                },
                                                                {
                                                                    "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                    "method_full": "java.lang.System:getSecurityManager()",
                                                                    "lineNum": 79
                                                                },
                                                                {
                                                                    "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                    "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                    "lineNum": 80
                                                                },
                                                                {
                                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                    "method_full": "java.lang.Thread:currentThread()",
                                                                    "lineNum": 81
                                                                },
                                                                {
                                                                    "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                    "method_full": "java.lang.Thread:getThreadGroup()",
                                                                    "lineNum": 81
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                    "lineNum": 201
                                                },
                                                {
                                                    "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 202
                                                },
                                                {
                                                    "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 203
                                                },
                                                {
                                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                    "lineNum": 207
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                            "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                            "lineNum": 128
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                    "lineNum": 250,
                                    "children": [
                                        {
                                            "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                            "lineNum": 42
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                    "method_full": "java.util.Date:<init>()",
                                    "lineNum": 246
                                },
                                {
                                    "method_hash": "UdEhlTtcNO_TwEek926bmQ#057",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getNextValidTimeAfter(java.util.Date)",
                                    "lineNum": 246,
                                    "children": [
                                        {
                                            "method_hash": "b0BRueJa4v4LRMgvFcFJXg#04e",
                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeAfter(java.util.Date)",
                                            "lineNum": 311,
                                            "children": [
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1181,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "3QkBuoKdmwf0aAzBclBg5A#036",
                                                    "method_full": "java.util.GregorianCalendar:<init>(java.util.TimeZone)",
                                                    "lineNum": 1181
                                                },
                                                {
                                                    "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                                    "method_full": "java.util.Date:getTime()",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "f0ucDDVa_FAgRj5UCYsA4g#01b",
                                                    "method_full": "java.util.Date:<init>(long)",
                                                    "lineNum": 1185
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1203
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1204
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1218
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1220
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1228
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1239
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1241
                                                },
                                                {
                                                    "method_hash": "0XChlxcewAgJsCJWwIOr0Q#059",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:setCalendarHour(java.util.Calendar,int)",
                                                    "lineNum": 1250
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1270,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1283,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1286,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1294,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1313
                                                },
                                                {
                                                    "method_hash": "kcrljP_ryCMKRshzWmZodA#03f",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getTimeZone()",
                                                    "lineNum": 1322,
                                                    "children": [
                                                        {
                                                            "method_hash": "fQWMxxzmu7BTbSU-q4pKKw#01f",
                                                            "method_full": "java.util.TimeZone:getDefault()",
                                                            "lineNum": 360
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1330,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Bg74jcok85zIpa0GL5lMLg#025",
                                                    "method_full": "java.util.Date:before(java.util.Date)",
                                                    "lineNum": 1350
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1354
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1356
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1358,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1392,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1448,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1471
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1472
                                                },
                                                {
                                                    "method_hash": "HJrmhI0h63AKQU6_wL4uMQ#04c",
                                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getLastDayOfMonth(int,int)",
                                                    "lineNum": 1483,
                                                    "children": [
                                                        {
                                                            "method_hash": "aRJABvuoDqlPtk17YF1zGA#041",
                                                            "method_full": "org.apache.logging.log4j.core.util.CronExpression:isLeapYear(int)",
                                                            "lineNum": 1676
                                                        },
                                                        {
                                                            "method_hash": "k0MGrC9H5c_kYzweIt1Fxw#03b",
                                                            "method_full": "java.lang.IllegalArgumentException:<init>(java.lang.String)",
                                                            "lineNum": 1698
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "4VI4H_EEyZ1-mbdnMIJGQA#040",
                                                    "method_full": "java.lang.UnsupportedOperationException:<init>(java.lang.String)",
                                                    "lineNum": 1506
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1525
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1527
                                                },
                                                {
                                                    "method_hash": "xlMIezKM0A3KPTb2E23wKw#01a",
                                                    "method_full": "java.util.SortedSet:size()",
                                                    "lineNum": 1552
                                                },
                                                {
                                                    "method_hash": "0pInFFUnm-TvyRho_xhrdA#01b",
                                                    "method_full": "java.util.SortedSet:first()",
                                                    "lineNum": 1554
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                                            "method_full": "java.util.Date:<init>()",
                                            "lineNum": 190
                                        },
                                        {
                                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                                            "method_full": "java.util.Date:getTime()",
                                            "lineNum": 190
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                    "lineNum": 247,
                                    "children": [
                                        {
                                            "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                                            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                                            "lineNum": 128,
                                            "children": [
                                                {
                                                    "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                                    "lineNum": 198
                                                },
                                                {
                                                    "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                                    "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                                    "lineNum": 201,
                                                    "children": [
                                                        {
                                                            "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                                            "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                                            "lineNum": 40,
                                                            "children": [
                                                                {
                                                                    "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                                    "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                                    "lineNum": 76
                                                                },
                                                                {
                                                                    "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                                    "method_full": "java.lang.System:getSecurityManager()",
                                                                    "lineNum": 79
                                                                },
                                                                {
                                                                    "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                                    "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                                    "lineNum": 80
                                                                },
                                                                {
                                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                                    "method_full": "java.lang.Thread:currentThread()",
                                                                    "lineNum": 81
                                                                },
                                                                {
                                                                    "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                                    "method_full": "java.lang.Thread:getThreadGroup()",
                                                                    "lineNum": 81
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                                    "lineNum": 201
                                                },
                                                {
                                                    "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 202
                                                },
                                                {
                                                    "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                                    "lineNum": 203
                                                },
                                                {
                                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                                    "lineNum": 207
                                                }
                                            ]
                                        },
                                        {
                                            "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                                            "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                                            "lineNum": 128
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "OqLI8IUlQ0yxevFj_v4vMw#048",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$100()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "jf7gpWktLEw5TCaK_DGi6g#083",
                                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:access$000(org.apache.logging.log4j.core.config.ConfigurationScheduler)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                                    "lineNum": 248
                                },
                                {
                                    "method_hash": "PQYqdOCRLdDwLxXTnGhDaA#073",
                                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:reset(java.util.concurrent.ScheduledFuture,java.util.Date)",
                                    "lineNum": 250,
                                    "children": [
                                        {
                                            "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                                            "lineNum": 42
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "method_hash": "EDLlDtqGWQPTfj14kRl92A#05c",
                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:nextFireInterval(java.util.Date)",
                    "lineNum": 152,
                    "children": [
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 190
                        },
                        {
                            "method_hash": "wuTZqiMTEnCdIeE5MvQGbA#017",
                            "method_full": "java.util.Date:<init>()",
                            "lineNum": 190
                        },
                        {
                            "method_hash": "gwBnuA8E9ti9N-Lj8ceyWQ#018",
                            "method_full": "java.util.Date:getTime()",
                            "lineNum": 190
                        }
                    ]
                },
                {
                    "method_hash": "dY3qZCIA2ajTZQGtsgQ4_A#07b",
                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                    "lineNum": 152,
                    "children": [
                        {
                            "method_hash": "TxBUi_espaGg1FJvOHwMyg#050",
                            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:getExecutorService()",
                            "lineNum": 128,
                            "children": [
                                {
                                    "method_hash": "AjAQ45QCaQNbHJpgIdR9GA#059",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object)",
                                    "lineNum": 198
                                },
                                {
                                    "method_hash": "5urKvUS-V9jSsKaQPAZ26g#061",
                                    "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:createDaemonThreadFactory(java.lang.String)",
                                    "lineNum": 201,
                                    "children": [
                                        {
                                            "method_hash": "fVo3_lNCegxpe0JN5o9EzA#05a",
                                            "method_full": "org.apache.logging.log4j.core.util.Log4jThreadFactory:<init>(java.lang.String,boolean,int)",
                                            "lineNum": 40,
                                            "children": [
                                                {
                                                    "method_hash": "4Li-EuHybvIZeOfzYaiYxA#03b",
                                                    "method_full": "java.util.concurrent.atomic.AtomicInteger:getAndIncrement()",
                                                    "lineNum": 76
                                                },
                                                {
                                                    "method_hash": "GJ7ueqT0vfcGUztewrfeSA#025",
                                                    "method_full": "java.lang.System:getSecurityManager()",
                                                    "lineNum": 79
                                                },
                                                {
                                                    "method_hash": "Kw9ooIZ3I_i2kLyW1ZsGrw#02a",
                                                    "method_full": "java.lang.SecurityManager:getThreadGroup()",
                                                    "lineNum": 80
                                                },
                                                {
                                                    "method_hash": "Gd5kD_9bNBlFw0RWzejchA#020",
                                                    "method_full": "java.lang.Thread:currentThread()",
                                                    "lineNum": 81
                                                },
                                                {
                                                    "method_hash": "TkV63e_olwOQWKIDx0177w#021",
                                                    "method_full": "java.lang.Thread:getThreadGroup()",
                                                    "lineNum": 81
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "method_hash": "Ra1KUlpLpSCJPWhUMYHG4w#05f",
                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:<init>(int,java.util.concurrent.ThreadFactory)",
                                    "lineNum": 201
                                },
                                {
                                    "method_hash": "IbXiM5ivFZmCPGGV8aMZ8w#06d",
                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setContinueExistingPeriodicTasksAfterShutdownPolicy(boolean)",
                                    "lineNum": 202
                                },
                                {
                                    "method_hash": "HznmuRoy5QiA9LIAhmMaug#06b",
                                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:setExecuteExistingDelayedTasksAfterShutdownPolicy(boolean)",
                                    "lineNum": 203
                                },
                                {
                                    "method_hash": "zVkiljbfdEShQRtRJojm9w#048",
                                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object)",
                                    "lineNum": 207
                                }
                            ]
                        },
                        {
                            "method_hash": "CEkkBR_Knx5wEAA4T-pGzQ#06d",
                            "method_full": "java.util.concurrent.ScheduledExecutorService:schedule(java.lang.Runnable,long,java.util.concurrent.TimeUnit)",
                            "lineNum": 128
                        }
                    ]
                },
                {
                    "method_hash": "8FLI_8Gm6FuyBpzDi693Xw#074",
                    "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture:<init>(java.util.concurrent.ScheduledFuture,java.util.Date)",
                    "lineNum": 153,
                    "children": [
                        {
                            "method_hash": "Sq10o2L4NrOa_8m-NWb6JA#0b8",
                            "method_full": "org.apache.logging.log4j.core.config.CronScheduledFuture$FutureData:<init>(org.apache.logging.log4j.core.config.CronScheduledFuture,java.util.concurrent.ScheduledFuture,java.util.Date)",
                            "lineNum": 34
                        }
                    ]
                },
                {
                    "method_hash": "7moi1k3s3T4xoFwRASyZ7g#095",
                    "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler$CronRunnable:setScheduledFuture(org.apache.logging.log4j.core.config.CronScheduledFuture)",
                    "lineNum": 154
                },
                {
                    "method_hash": "IuDXsMdDASuDHHDfL2HP_Q#045",
                    "method_full": "org.apache.logging.log4j.core.util.CronExpression:getCronExpression()",
                    "lineNum": 155
                },
                {
                    "method_hash": "5LvefN1x3tEbz_Rugg2Ahw#06a",
                    "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String,java.lang.Object,java.lang.Object,java.lang.Object)",
                    "lineNum": 155
                }
            ]
        },
        {
            "method_hash": "cVLTuaFyytgryy6SwI6jcg#046",
            "method_full": "org.apache.logging.log4j.core.config.ConfigurationScheduler:toString()",
            "lineNum": 90,
            "children": [
                {
                    "method_hash": "BJ9sucfIlfAP89goymWNcg#03b",
                    "method_full": "java.util.concurrent.ScheduledThreadPoolExecutor:getQueue()",
                    "lineNum": 266
                }
            ]
        },
        {
            "method_hash": "pUUVpJGDv5bVG0WsKYvqoQ#037",
            "method_full": "org.apache.logging.log4j.Logger:debug(java.lang.String)",
            "lineNum": 90
        }
    ]
  }`;
let data3 = `
{
  "method_hash": "9lUz1PxsHtwpH_m0v7Aewg#08d",
  "method_full": "com.alibaba.fastjson2.reader.ObjectReaderBaseModule:getObjectReader(com.alibaba.fastjson2.reader.ObjectReaderProvider,java.lang.reflect.Type)",
  "children": [
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1145
      },
      {
          "method_hash": "RwfNc-ILD_P0dYQUUQZi1Q#038",
          "method_full": "java.util.concurrent.ConcurrentMap:get(java.lang.Object)",
          "lineNum": 1184
      },
      {
          "method_hash": "lUaqb6uWytYwj-6uaWQVjg#051",
          "method_full": "java.util.concurrent.ConcurrentMap:putIfAbsent(java.lang.Object,java.lang.Object)",
          "lineNum": 1188
      },
      {
          "method_hash": "2ktolgkUCVLLoBXVR4PE9A#030",
          "method_full": "java.lang.reflect.ParameterizedType:getRawType()",
          "lineNum": 1467
      },
      {
          "method_hash": "tD2FagHmtjpQ8428hewIng#03c",
          "method_full": "java.lang.reflect.ParameterizedType:getActualTypeArguments()",
          "lineNum": 1469
      },
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1502
      },
      {
          "method_hash": "2uHAQlRAO1VmDc3j4IdfyQ#024",
          "method_full": "java.lang.reflect.Type:getTypeName()",
          "lineNum": 1584
      },
      {
          "method_hash": "_jD-fVUQ_nUXLEBa54Ogtg#03c",
          "method_full": "java.lang.reflect.GenericArrayType:getGenericComponentType()",
          "lineNum": 1606
      },
      {
          "method_hash": "NatC6sngeeuN0kGKJqgt2Q#02f",
          "method_full": "java.lang.reflect.WildcardType:getUpperBounds()",
          "lineNum": 1610
      }
  ]
}`;
exports.data4 = `{
    "nodes": [
      {
        "data": {
          "id": "OCyR2dMQDTwHrKpjJJLxQA#036",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_1()",
          "simpleMethod": "test_func_1"
        }
      },
      {
        "data": {
          "id": "JWs-sMySpZCOp8KfhSlP8w#036",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_4()",
          "simpleMethod": "test_func_4"
        }
      },
      {
        "data": {
          "id": "q24xXI2ez5jPZ8xO1Eq6sQ#036",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_3()",
          "simpleMethod": "test_func_3"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#036",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_5()",
          "simpleMethod": "test_func_5"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#0366",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_6()",
          "simpleMethod": "test_func_6"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#0367",
          "fullMethod": "test.call_graph.method_call.TestMCCallee:test_func_7()",
          "simpleMethod": "test_func_7"
        }
      }
    ],
    "edges": [
      {
        "data": {
          "id": "OCyR2dMQDTwHrKpjJJLxQA#036_JWs-sMySpZCOp8KfhSlP8w#036",
          "source": "OCyR2dMQDTwHrKpjJJLxQA#036",
          "target": "JWs-sMySpZCOp8KfhSlP8w#036"
        }
      },
      {
        "data": {
          "id": "JWs-sMySpZCOp8KfhSlP8w#036_q24xXI2ez5jPZ8xO1Eq6sQ#036",
          "source": "JWs-sMySpZCOp8KfhSlP8w#036",
          "target": "q24xXI2ez5jPZ8xO1Eq6sQ#036"
        }
      },
      {
        "data": {
          "id": "q24xXI2ez5jPZ8xO1Eq6sQ#036_f5cAcG7F28ffoe7LKY9xNQ#036",
          "source": "q24xXI2ez5jPZ8xO1Eq6sQ#036",
          "target": "f5cAcG7F28ffoe7LKY9xNQ#036"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#0366_JWs-sMySpZCOp8KfhSlP8w#036",
          "source": "f5cAcG7F28ffoe7LKY9xNQ#0366",
          "target": "JWs-sMySpZCOp8KfhSlP8w#036"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#0366_JWs-sMySpZCOp8KfhSlP8w#036",
          "source": "f5cAcG7F28ffoe7LKY9xNQ#0366",
          "target": "JWs-sMySpZCOp8KfhSlP8w#036"
        }
      },
      {
        "data": {
          "id": "f5cAcG7F28ffoe7LKY9xNQ#0366_f5cAcG7F28ffoe7LKY9xNQ#0367",
          "source": "f5cAcG7F28ffoe7LKY9xNQ#0366",
          "target": "f5cAcG7F28ffoe7LKY9xNQ#0367"
        }
      },
      {
        "data": {
          "id": "q24xXI2ez5jPZ8xO1Eq6sQ#036_f5cAcG7F28ffoe7LKY9xNQ#0367",
          "source": "q24xXI2ez5jPZ8xO1Eq6sQ#036",
          "target": "f5cAcG7F28ffoe7LKY9xNQ#0367"
        }
      }
    ]
  }`;
exports.data_external_callees = `
  [
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test1()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 15,
        "calleeMethod": "java.awt.Button:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test1()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 16,
        "calleeMethod": "java.awt.Button:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test2()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 20,
        "calleeMethod": "java.awt.Button:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test3()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 29,
        "calleeMethod": "java.awt.Button:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test4()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 38,
        "calleeMethod": "java.awt.Button:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test1()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 15,
        "calleeMethod": "java.awt.Button:addActionListener(java.awt.event.ActionListener)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test1()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 16,
        "calleeMethod": "java.awt.Button:addActionListener(java.awt.event.ActionListener)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test2()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 20,
        "calleeMethod": "java.awt.Button:addActionListener(java.awt.event.ActionListener)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test3()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 29,
        "calleeMethod": "java.awt.Button:addActionListener(java.awt.event.ActionListener)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test4()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 38,
        "calleeMethod": "java.awt.Button:addActionListener(java.awt.event.ActionListener)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:test4()",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 38,
        "calleeMethod": "java.awt.event.ActionListener:actionPerformed()"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCaller:argsWithArray(java.lang.String[])",
        "callerClass": "test.call_graph.method_call.TestMCCaller",
        "linenum": 176,
        "calleeMethod": "java.io.PrintStream:println(boolean)"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCallee:test2(java.lang.String,java.lang.String)",
        "callerClass": "test.call_graph.method_call.TestMCCallee",
        "linenum": 21,
        "calleeMethod": "java.io.PrintStream:println(int)"
    },
    {
        "callerMehtod": "test.call_graph.stream.TestStream1:test1()",
        "callerClass": "test.call_graph.stream.TestStream1",
        "linenum": 24,
        "calleeMethod": "java.io.PrintStream:println(java.lang.Object)"
    },
    {
        "callerMehtod": "test.call_graph.stream.TestStream2:test2()",
        "callerClass": "test.call_graph.stream.TestStream2",
        "linenum": 18,
        "calleeMethod": "java.io.PrintStream:println(java.lang.Object)"
    },
    {
        "callerMehtod": "test.call_graph.stream.TestStream2:test2()",
        "callerClass": "test.call_graph.stream.TestStream2",
        "linenum": 21,
        "calleeMethod": "java.io.PrintStream:println(java.lang.Object)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener$1:actionPerformed(java.awt.event.ActionEvent)",
        "callerClass": "test.call_graph.action_listener.TestActionListener$1",
        "linenum": 23,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.extend.A1_1:<init>()",
        "callerClass": "test.call_graph.extend.A1_1",
        "linenum": 12,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.extend.A1_1:fa1_1()",
        "callerClass": "test.call_graph.extend.A1_1",
        "linenum": 21,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.extend.A2_1:fa2_1()",
        "callerClass": "test.call_graph.extend.A2_1",
        "linenum": 17,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.extend.A2_2:f2()",
        "callerClass": "test.call_graph.extend.A2_2",
        "linenum": 14,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.AbstractClass1:test()",
        "callerClass": "test.call_graph.implement.AbstractClass1",
        "linenum": 12,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.AbstractClassL2:f1()",
        "callerClass": "test.call_graph.implement.AbstractClassL2",
        "linenum": 12,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass1:f1()",
        "callerClass": "test.call_graph.implement.ImplClass1",
        "linenum": 12,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_1:f1()",
        "callerClass": "test.call_graph.implement.ImplClassL2_1",
        "linenum": 12,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCallee:run(int,java.lang.String,java.math.BigDecimal)",
        "callerClass": "test.call_graph.method_call.TestMCCallee",
        "linenum": 31,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.RunnableImpl1:run()",
        "callerClass": "test.call_graph.runnable_impl.RunnableImpl1",
        "linenum": 13,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:lambda$f4$1()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 37,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:lambda$f4$0()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 30,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.same_name.a.SameNameClass1:test()",
        "callerClass": "test.call_graph.same_name.a.SameNameClass1",
        "linenum": 10,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.same_name.b.SameNameClass1:test()",
        "callerClass": "test.call_graph.same_name.b.SameNameClass1",
        "linenum": 10,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.variable_argument.TestVAVariableLength1:log(java.lang.String,int,java.lang.String[])",
        "callerClass": "test.call_graph.variable_argument.TestVAVariableLength1",
        "linenum": 23,
        "calleeMethod": "java.io.PrintStream:println(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.thread.ThreadChild:run()",
        "callerClass": "test.call_graph.thread.ThreadChild",
        "linenum": 13,
        "calleeMethod": "java.io.PrintStream:println(long)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass2:f2()",
        "callerClass": "test.call_graph.implement.ImplClass2",
        "linenum": 22,
        "calleeMethod": "java.lang.InterruptedException:printStackTrace()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_2:f2()",
        "callerClass": "test.call_graph.implement.ImplClassL2_2",
        "linenum": 22,
        "calleeMethod": "java.lang.InterruptedException:printStackTrace()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 26,
        "calleeMethod": "java.lang.Runnable:run()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 35,
        "calleeMethod": "java.lang.Runnable:run()"
    },
    {
        "callerMehtod": "test.call_graph.argument.TestArgument2:test()",
        "callerClass": "test.call_graph.argument.TestArgument2",
        "linenum": 11,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.future.CallableImpl:call()",
        "callerClass": "test.call_graph.future.CallableImpl",
        "linenum": 15,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.future.FutureImpl:get()",
        "callerClass": "test.call_graph.future.FutureImpl",
        "linenum": 32,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ChildClass2:f2()",
        "callerClass": "test.call_graph.implement.ChildClass2",
        "linenum": 17,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$1:execute()",
        "callerClass": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$1",
        "linenum": 17,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCaller:test1g()",
        "callerClass": "test.call_graph.method_call.TestMCCaller",
        "linenum": 50,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCaller:test2c()",
        "callerClass": "test.call_graph.method_call.TestMCCaller",
        "linenum": 78,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.method_call.TestMCCaller:test2c()",
        "callerClass": "test.call_graph.method_call.TestMCCaller",
        "linenum": 85,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.thread.ThreadChild:run()",
        "callerClass": "test.call_graph.thread.ThreadChild",
        "linenum": 13,
        "calleeMethod": "java.lang.System:currentTimeMillis()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ChildClass1:f2()",
        "callerClass": "test.call_graph.implement.ChildClass1",
        "linenum": 17,
        "calleeMethod": "java.lang.System:exit(int)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.ActionListener1:actionPerformed(java.awt.event.ActionEvent)",
        "callerClass": "test.call_graph.action_listener.ActionListener1",
        "linenum": 14,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.future.FutureImpl:get(long,java.util.concurrent.TimeUnit)",
        "callerClass": "test.call_graph.future.FutureImpl",
        "linenum": 37,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.future.TestFuture$1:call()",
        "callerClass": "test.call_graph.future.TestFuture$1",
        "linenum": 29,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.future.TestFuture$2:run()",
        "callerClass": "test.call_graph.future.TestFuture$2",
        "linenum": 50,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.future.TestFuture$3:run()",
        "callerClass": "test.call_graph.future.TestFuture$3",
        "linenum": 60,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.future.TestFuture:lambda$test4$0()",
        "callerClass": "test.call_graph.future.TestFuture",
        "linenum": 40,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ChildClass1:f1()",
        "callerClass": "test.call_graph.implement.ChildClass1",
        "linenum": 12,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass1:f2()",
        "callerClass": "test.call_graph.implement.ImplClass1",
        "linenum": 17,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_1:f2()",
        "callerClass": "test.call_graph.implement.ImplClassL2_1",
        "linenum": 17,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.lambda.TestLambda:lambda$test$0(java.lang.String)",
        "callerClass": "test.call_graph.lambda.TestLambda",
        "linenum": 14,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.fixed.FixedService1b:execute()",
        "callerClass": "test.call_graph.manual_add_callgraph.fixed.FixedService1b",
        "linenum": 11,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.unfixed.UnfixedService1a:execute(java.lang.Long,java.util.LinkedList)",
        "callerClass": "test.call_graph.manual_add_callgraph.unfixed.UnfixedService1a",
        "linenum": 13,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:lambda$f4$0()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 28,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.thread.TestThread$1:run()",
        "callerClass": "test.call_graph.thread.TestThread$1",
        "linenum": 29,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.variable_argument.TestVAArg1:test()",
        "callerClass": "test.call_graph.variable_argument.TestVAArg1",
        "linenum": 11,
        "calleeMethod": "java.lang.System:getProperty(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ChildClass2:f1()",
        "callerClass": "test.call_graph.implement.ChildClass2",
        "linenum": 12,
        "calleeMethod": "java.lang.System:getenv(java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$3:execute()",
        "callerClass": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$3",
        "linenum": 36,
        "calleeMethod": "java.lang.System:setErr(java.io.PrintStream)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$2:execute(java.math.BigDecimal,java.util.Set)",
        "callerClass": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$2",
        "linenum": 37,
        "calleeMethod": "java.lang.System:setIn(java.io.InputStream)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$3:execute(java.lang.String,java.util.List)",
        "callerClass": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$3",
        "linenum": 47,
        "calleeMethod": "java.lang.System:setOut(java.io.PrintStream)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener$2:actionPerformed(java.awt.event.ActionEvent)",
        "callerClass": "test.call_graph.action_listener.TestActionListener$2",
        "linenum": 32,
        "calleeMethod": "java.lang.System:setProperty(java.lang.String,java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.action_listener.TestActionListener:lambda$test4$0(java.awt.event.ActionEvent)",
        "callerClass": "test.call_graph.action_listener.TestActionListener",
        "linenum": 38,
        "calleeMethod": "java.lang.System:setProperty(java.lang.String,java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$2:execute()",
        "callerClass": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$2",
        "linenum": 26,
        "calleeMethod": "java.lang.System:setProperty(java.lang.String,java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$1:execute(java.lang.Integer,java.util.ArrayList)",
        "callerClass": "test.call_graph.manual_add_callgraph.unfixed.TestUnfixedManualAddCallGraph$1",
        "linenum": 27,
        "calleeMethod": "java.lang.System:setProperty(java.lang.String,java.lang.String)"
    },
    {
        "callerMehtod": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$4:execute()",
        "callerClass": "test.call_graph.manual_add_callgraph.fixed.TestFixedManualAddCallGraph$4",
        "linenum": 46,
        "calleeMethod": "java.lang.System:setSecurityManager(java.lang.SecurityManager)"
    },
    {
        "callerMehtod": "test.call_graph.thread.TestThread$1:<init>(test.call_graph.thread.TestThread)",
        "callerClass": "test.call_graph.thread.TestThread$1",
        "linenum": 26,
        "calleeMethod": "java.lang.Thread:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.thread.TestThread$ThreadInner:<init>(test.call_graph.thread.TestThread)",
        "callerClass": "test.call_graph.thread.TestThread$ThreadInner",
        "linenum": 34,
        "calleeMethod": "java.lang.Thread:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.thread.ThreadChild:<init>()",
        "callerClass": "test.call_graph.thread.ThreadChild",
        "linenum": 9,
        "calleeMethod": "java.lang.Thread:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f2()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 18,
        "calleeMethod": "java.lang.Thread:<init>(java.lang.Runnable)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f3()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 22,
        "calleeMethod": "java.lang.Thread:<init>(java.lang.Runnable)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 26,
        "calleeMethod": "java.lang.Thread:<init>(java.lang.Runnable)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 35,
        "calleeMethod": "java.lang.Thread:<init>(java.lang.Runnable)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f3()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 22,
        "calleeMethod": "java.lang.Thread:run()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass2:f2()",
        "callerClass": "test.call_graph.implement.ImplClass2",
        "linenum": 20,
        "calleeMethod": "java.lang.Thread:sleep(long)"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_2:f2()",
        "callerClass": "test.call_graph.implement.ImplClassL2_2",
        "linenum": 20,
        "calleeMethod": "java.lang.Thread:sleep(long)"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f2()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 18,
        "calleeMethod": "java.lang.Thread:start()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 33,
        "calleeMethod": "java.lang.Thread:start()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:f4()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 38,
        "calleeMethod": "java.lang.Thread:start()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass2:f1()",
        "callerClass": "test.call_graph.implement.ImplClass2",
        "linenum": 14,
        "calleeMethod": "java.security.SecureRandom:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_2:f1()",
        "callerClass": "test.call_graph.implement.ImplClassL2_2",
        "linenum": 14,
        "calleeMethod": "java.security.SecureRandom:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:lambda$f4$0()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 32,
        "calleeMethod": "java.security.SecureRandom:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.thread.TestThread$ThreadInner:run()",
        "callerClass": "test.call_graph.thread.TestThread$ThreadInner",
        "linenum": 38,
        "calleeMethod": "java.security.SecureRandom:<init>()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClass2:f1()",
        "callerClass": "test.call_graph.implement.ImplClass2",
        "linenum": 14,
        "calleeMethod": "java.security.SecureRandom:nextInt()"
    },
    {
        "callerMehtod": "test.call_graph.implement.ImplClassL2_2:f1()",
        "callerClass": "test.call_graph.implement.ImplClassL2_2",
        "linenum": 14,
        "calleeMethod": "java.security.SecureRandom:nextInt()"
    },
    {
        "callerMehtod": "test.call_graph.runnable_impl.TestRunnable:lambda$f4$0()",
        "callerClass": "test.call_graph.runnable_impl.TestRunnable",
        "linenum": 32,
        "calleeMethod": "java.security.SecureRandom:nextInt()"
    },
    {
        "callerMehtod": "test.call_graph.thread.TestThread$ThreadInner:run()",
        "callerClass": "test.call_graph.thread.TestThread$ThreadInner",
        "linenum": 38,
        "calleeMethod": "java.security.SecureRandom:nextInt()"
    },
    {
        "callerMehtod": "test.call_graph.future.TestFuture:test4()",
        "callerClass": "test.call_graph.future.TestFuture",
        "linenum": 38,
        "calleeMethod": "java.util.concurrent.Callable:call()"
    },
    {
        "callerMehtod": "test.call_graph.future.FutureTaskChild:<init>(java.lang.Runnable,java.lang.Object)",
        "callerClass": "test.call_graph.future.FutureTaskChild",
        "linenum": 19,
        "calleeMethod": "java.util.concurrent.FutureTask:<init>(java.lang.Runnable,java.lang.Object)"
    },
    {
        "callerMehtod": "test.call_graph.future.FutureTaskChild:<init>(java.util.concurrent.Callable)",
        "callerClass": "test.call_graph.future.FutureTaskChild",
        "linenum": 15,
        "calleeMethod": "java.util.concurrent.FutureTask:<init>(java.util.concurrent.Callable)"
    }
]`;


/***/ }),

/***/ "./node_modules/web-streams-polyfill/dist/ponyfill.es2018.js":
/*!*******************************************************************!*\
  !*** ./node_modules/web-streams-polyfill/dist/ponyfill.es2018.js ***!
  \*******************************************************************/
/***/ (function(__unused_webpack_module, exports) {

/**
 * web-streams-polyfill v3.2.1
 */
(function (global, factory) {
     true ? factory(exports) :
    0;
}(this, (function (exports) { 'use strict';

    /// <reference lib="es2015.symbol" />
    const SymbolPolyfill = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ?
        Symbol :
        description => `Symbol(${description})`;

    /// <reference lib="dom" />
    function noop() {
        return undefined;
    }
    function getGlobals() {
        if (typeof self !== 'undefined') {
            return self;
        }
        else if (typeof window !== 'undefined') {
            return window;
        }
        else if (typeof global !== 'undefined') {
            return global;
        }
        return undefined;
    }
    const globals = getGlobals();

    function typeIsObject(x) {
        return (typeof x === 'object' && x !== null) || typeof x === 'function';
    }
    const rethrowAssertionErrorRejection = noop;

    const originalPromise = Promise;
    const originalPromiseThen = Promise.prototype.then;
    const originalPromiseResolve = Promise.resolve.bind(originalPromise);
    const originalPromiseReject = Promise.reject.bind(originalPromise);
    function newPromise(executor) {
        return new originalPromise(executor);
    }
    function promiseResolvedWith(value) {
        return originalPromiseResolve(value);
    }
    function promiseRejectedWith(reason) {
        return originalPromiseReject(reason);
    }
    function PerformPromiseThen(promise, onFulfilled, onRejected) {
        // There doesn't appear to be any way to correctly emulate the behaviour from JavaScript, so this is just an
        // approximation.
        return originalPromiseThen.call(promise, onFulfilled, onRejected);
    }
    function uponPromise(promise, onFulfilled, onRejected) {
        PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), undefined, rethrowAssertionErrorRejection);
    }
    function uponFulfillment(promise, onFulfilled) {
        uponPromise(promise, onFulfilled);
    }
    function uponRejection(promise, onRejected) {
        uponPromise(promise, undefined, onRejected);
    }
    function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
        return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
    }
    function setPromiseIsHandledToTrue(promise) {
        PerformPromiseThen(promise, undefined, rethrowAssertionErrorRejection);
    }
    const queueMicrotask = (() => {
        const globalQueueMicrotask = globals && globals.queueMicrotask;
        if (typeof globalQueueMicrotask === 'function') {
            return globalQueueMicrotask;
        }
        const resolvedPromise = promiseResolvedWith(undefined);
        return (fn) => PerformPromiseThen(resolvedPromise, fn);
    })();
    function reflectCall(F, V, args) {
        if (typeof F !== 'function') {
            throw new TypeError('Argument is not a function');
        }
        return Function.prototype.apply.call(F, V, args);
    }
    function promiseCall(F, V, args) {
        try {
            return promiseResolvedWith(reflectCall(F, V, args));
        }
        catch (value) {
            return promiseRejectedWith(value);
        }
    }

    // Original from Chromium
    // https://chromium.googlesource.com/chromium/src/+/0aee4434a4dba42a42abaea9bfbc0cd196a63bc1/third_party/blink/renderer/core/streams/SimpleQueue.js
    const QUEUE_MAX_ARRAY_SIZE = 16384;
    /**
     * Simple queue structure.
     *
     * Avoids scalability issues with using a packed array directly by using
     * multiple arrays in a linked list and keeping the array size bounded.
     */
    class SimpleQueue {
        constructor() {
            this._cursor = 0;
            this._size = 0;
            // _front and _back are always defined.
            this._front = {
                _elements: [],
                _next: undefined
            };
            this._back = this._front;
            // The cursor is used to avoid calling Array.shift().
            // It contains the index of the front element of the array inside the
            // front-most node. It is always in the range [0, QUEUE_MAX_ARRAY_SIZE).
            this._cursor = 0;
            // When there is only one node, size === elements.length - cursor.
            this._size = 0;
        }
        get length() {
            return this._size;
        }
        // For exception safety, this method is structured in order:
        // 1. Read state
        // 2. Calculate required state mutations
        // 3. Perform state mutations
        push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
                newBack = {
                    _elements: [],
                    _next: undefined
                };
            }
            // push() is the mutation most likely to throw an exception, so it
            // goes first.
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
                this._back = newBack;
                oldBack._next = newBack;
            }
            ++this._size;
        }
        // Like push(), shift() follows the read -> calculate -> mutate pattern for
        // exception safety.
        shift() { // must not be called on an empty queue
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
                newFront = oldFront._next;
                newCursor = 0;
            }
            // No mutations before this point.
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
                this._front = newFront;
            }
            // Permit shifted element to be garbage collected.
            elements[oldCursor] = undefined;
            return element;
        }
        // The tricky thing about forEach() is that it can be called
        // re-entrantly. The queue may be mutated inside the callback. It is easy to
        // see that push() within the callback has no negative effects since the end
        // of the queue is checked for on every iteration. If shift() is called
        // repeatedly within the callback then the next iteration may return an
        // element that has been removed. In this case the callback will be called
        // with undefined values until we either "catch up" with elements that still
        // exist or reach the back of the queue.
        forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== undefined) {
                if (i === elements.length) {
                    node = node._next;
                    elements = node._elements;
                    i = 0;
                    if (elements.length === 0) {
                        break;
                    }
                }
                callback(elements[i]);
                ++i;
            }
        }
        // Return the element that would be returned if shift() was called now,
        // without modifying the queue.
        peek() { // must not be called on an empty queue
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
        }
    }

    function ReadableStreamReaderGenericInitialize(reader, stream) {
        reader._ownerReadableStream = stream;
        stream._reader = reader;
        if (stream._state === 'readable') {
            defaultReaderClosedPromiseInitialize(reader);
        }
        else if (stream._state === 'closed') {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
        }
        else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
        }
    }
    // A client of ReadableStreamDefaultReader and ReadableStreamBYOBReader may use these functions directly to bypass state
    // check.
    function ReadableStreamReaderGenericCancel(reader, reason) {
        const stream = reader._ownerReadableStream;
        return ReadableStreamCancel(stream, reason);
    }
    function ReadableStreamReaderGenericRelease(reader) {
        if (reader._ownerReadableStream._state === 'readable') {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        }
        else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
        }
        reader._ownerReadableStream._reader = undefined;
        reader._ownerReadableStream = undefined;
    }
    // Helper functions for the readers.
    function readerLockException(name) {
        return new TypeError('Cannot ' + name + ' a stream using a released reader');
    }
    // Helper functions for the ReadableStreamDefaultReader.
    function defaultReaderClosedPromiseInitialize(reader) {
        reader._closedPromise = newPromise((resolve, reject) => {
            reader._closedPromise_resolve = resolve;
            reader._closedPromise_reject = reject;
        });
    }
    function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseReject(reader, reason);
    }
    function defaultReaderClosedPromiseInitializeAsResolved(reader) {
        defaultReaderClosedPromiseInitialize(reader);
        defaultReaderClosedPromiseResolve(reader);
    }
    function defaultReaderClosedPromiseReject(reader, reason) {
        if (reader._closedPromise_reject === undefined) {
            return;
        }
        setPromiseIsHandledToTrue(reader._closedPromise);
        reader._closedPromise_reject(reason);
        reader._closedPromise_resolve = undefined;
        reader._closedPromise_reject = undefined;
    }
    function defaultReaderClosedPromiseResetToRejected(reader, reason) {
        defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
    }
    function defaultReaderClosedPromiseResolve(reader) {
        if (reader._closedPromise_resolve === undefined) {
            return;
        }
        reader._closedPromise_resolve(undefined);
        reader._closedPromise_resolve = undefined;
        reader._closedPromise_reject = undefined;
    }

    const AbortSteps = SymbolPolyfill('[[AbortSteps]]');
    const ErrorSteps = SymbolPolyfill('[[ErrorSteps]]');
    const CancelSteps = SymbolPolyfill('[[CancelSteps]]');
    const PullSteps = SymbolPolyfill('[[PullSteps]]');

    /// <reference lib="es2015.core" />
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite#Polyfill
    const NumberIsFinite = Number.isFinite || function (x) {
        return typeof x === 'number' && isFinite(x);
    };

    /// <reference lib="es2015.core" />
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc#Polyfill
    const MathTrunc = Math.trunc || function (v) {
        return v < 0 ? Math.ceil(v) : Math.floor(v);
    };

    // https://heycam.github.io/webidl/#idl-dictionaries
    function isDictionary(x) {
        return typeof x === 'object' || typeof x === 'function';
    }
    function assertDictionary(obj, context) {
        if (obj !== undefined && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
        }
    }
    // https://heycam.github.io/webidl/#idl-callback-functions
    function assertFunction(x, context) {
        if (typeof x !== 'function') {
            throw new TypeError(`${context} is not a function.`);
        }
    }
    // https://heycam.github.io/webidl/#idl-object
    function isObject(x) {
        return (typeof x === 'object' && x !== null) || typeof x === 'function';
    }
    function assertObject(x, context) {
        if (!isObject(x)) {
            throw new TypeError(`${context} is not an object.`);
        }
    }
    function assertRequiredArgument(x, position, context) {
        if (x === undefined) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
        }
    }
    function assertRequiredField(x, field, context) {
        if (x === undefined) {
            throw new TypeError(`${field} is required in '${context}'.`);
        }
    }
    // https://heycam.github.io/webidl/#idl-unrestricted-double
    function convertUnrestrictedDouble(value) {
        return Number(value);
    }
    function censorNegativeZero(x) {
        return x === 0 ? 0 : x;
    }
    function integerPart(x) {
        return censorNegativeZero(MathTrunc(x));
    }
    // https://heycam.github.io/webidl/#idl-unsigned-long-long
    function convertUnsignedLongLongWithEnforceRange(value, context) {
        const lowerBound = 0;
        const upperBound = Number.MAX_SAFE_INTEGER;
        let x = Number(value);
        x = censorNegativeZero(x);
        if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
        }
        x = integerPart(x);
        if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
        }
        if (!NumberIsFinite(x) || x === 0) {
            return 0;
        }
        // TODO Use BigInt if supported?
        // let xBigInt = BigInt(integerPart(x));
        // xBigInt = BigInt.asUintN(64, xBigInt);
        // return Number(xBigInt);
        return x;
    }

    function assertReadableStream(x, context) {
        if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
        }
    }

    // Abstract operations for the ReadableStream.
    function AcquireReadableStreamDefaultReader(stream) {
        return new ReadableStreamDefaultReader(stream);
    }
    // ReadableStream API exposed for controllers.
    function ReadableStreamAddReadRequest(stream, readRequest) {
        stream._reader._readRequests.push(readRequest);
    }
    function ReadableStreamFulfillReadRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readRequest = reader._readRequests.shift();
        if (done) {
            readRequest._closeSteps();
        }
        else {
            readRequest._chunkSteps(chunk);
        }
    }
    function ReadableStreamGetNumReadRequests(stream) {
        return stream._reader._readRequests.length;
    }
    function ReadableStreamHasDefaultReader(stream) {
        const reader = stream._reader;
        if (reader === undefined) {
            return false;
        }
        if (!IsReadableStreamDefaultReader(reader)) {
            return false;
        }
        return true;
    }
    /**
     * A default reader vended by a {@link ReadableStream}.
     *
     * @public
     */
    class ReadableStreamDefaultReader {
        constructor(stream) {
            assertRequiredArgument(stream, 1, 'ReadableStreamDefaultReader');
            assertReadableStream(stream, 'First parameter');
            if (IsReadableStreamLocked(stream)) {
                throw new TypeError('This stream has already been locked for exclusive reading by another reader');
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed,
         * or rejected if the stream ever errors or the reader's lock is released before the stream finishes closing.
         */
        get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
                return promiseRejectedWith(defaultReaderBrandCheckException('closed'));
            }
            return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = undefined) {
            if (!IsReadableStreamDefaultReader(this)) {
                return promiseRejectedWith(defaultReaderBrandCheckException('cancel'));
            }
            if (this._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('cancel'));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Returns a promise that allows access to the next chunk from the stream's internal queue, if available.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read() {
            if (!IsReadableStreamDefaultReader(this)) {
                return promiseRejectedWith(defaultReaderBrandCheckException('read'));
            }
            if (this._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('read from'));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve, reject) => {
                resolvePromise = resolve;
                rejectPromise = reject;
            });
            const readRequest = {
                _chunkSteps: chunk => resolvePromise({ value: chunk, done: false }),
                _closeSteps: () => resolvePromise({ value: undefined, done: true }),
                _errorSteps: e => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamDefaultReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
                throw defaultReaderBrandCheckException('releaseLock');
            }
            if (this._ownerReadableStream === undefined) {
                return;
            }
            if (this._readRequests.length > 0) {
                throw new TypeError('Tried to release a reader lock when that reader has pending read() calls un-settled');
            }
            ReadableStreamReaderGenericRelease(this);
        }
    }
    Object.defineProperties(ReadableStreamDefaultReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableStreamDefaultReader',
            configurable: true
        });
    }
    // Abstract operations for the readers.
    function IsReadableStreamDefaultReader(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_readRequests')) {
            return false;
        }
        return x instanceof ReadableStreamDefaultReader;
    }
    function ReadableStreamDefaultReaderRead(reader, readRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === 'closed') {
            readRequest._closeSteps();
        }
        else if (stream._state === 'errored') {
            readRequest._errorSteps(stream._storedError);
        }
        else {
            stream._readableStreamController[PullSteps](readRequest);
        }
    }
    // Helper functions for the ReadableStreamDefaultReader.
    function defaultReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
    }

    /// <reference lib="es2018.asynciterable" />
    /* eslint-disable @typescript-eslint/no-empty-function */
    const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () { }).prototype);

    /// <reference lib="es2018.asynciterable" />
    class ReadableStreamAsyncIteratorImpl {
        constructor(reader, preventCancel) {
            this._ongoingPromise = undefined;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
        }
        next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ?
                transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) :
                nextSteps();
            return this._ongoingPromise;
        }
        return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ?
                transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) :
                returnSteps();
        }
        _nextSteps() {
            if (this._isFinished) {
                return Promise.resolve({ value: undefined, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('iterate'));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve, reject) => {
                resolvePromise = resolve;
                rejectPromise = reject;
            });
            const readRequest = {
                _chunkSteps: chunk => {
                    this._ongoingPromise = undefined;
                    // This needs to be delayed by one microtask, otherwise we stop pulling too early which breaks a test.
                    // FIXME Is this a bug in the specification, or in the test?
                    queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
                },
                _closeSteps: () => {
                    this._ongoingPromise = undefined;
                    this._isFinished = true;
                    ReadableStreamReaderGenericRelease(reader);
                    resolvePromise({ value: undefined, done: true });
                },
                _errorSteps: reason => {
                    this._ongoingPromise = undefined;
                    this._isFinished = true;
                    ReadableStreamReaderGenericRelease(reader);
                    rejectPromise(reason);
                }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
        }
        _returnSteps(value) {
            if (this._isFinished) {
                return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('finish iterating'));
            }
            if (!this._preventCancel) {
                const result = ReadableStreamReaderGenericCancel(reader, value);
                ReadableStreamReaderGenericRelease(reader);
                return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
        }
    }
    const ReadableStreamAsyncIteratorPrototype = {
        next() {
            if (!IsReadableStreamAsyncIterator(this)) {
                return promiseRejectedWith(streamAsyncIteratorBrandCheckException('next'));
            }
            return this._asyncIteratorImpl.next();
        },
        return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
                return promiseRejectedWith(streamAsyncIteratorBrandCheckException('return'));
            }
            return this._asyncIteratorImpl.return(value);
        }
    };
    if (AsyncIteratorPrototype !== undefined) {
        Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
    }
    // Abstract operations for the ReadableStream.
    function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
        const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
        iterator._asyncIteratorImpl = impl;
        return iterator;
    }
    function IsReadableStreamAsyncIterator(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_asyncIteratorImpl')) {
            return false;
        }
        try {
            // noinspection SuspiciousTypeOfGuard
            return x._asyncIteratorImpl instanceof
                ReadableStreamAsyncIteratorImpl;
        }
        catch (_a) {
            return false;
        }
    }
    // Helper functions for the ReadableStream.
    function streamAsyncIteratorBrandCheckException(name) {
        return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
    }

    /// <reference lib="es2015.core" />
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN#Polyfill
    const NumberIsNaN = Number.isNaN || function (x) {
        // eslint-disable-next-line no-self-compare
        return x !== x;
    };

    function CreateArrayFromList(elements) {
        // We use arrays to represent lists, so this is basically a no-op.
        // Do a slice though just in case we happen to depend on the unique-ness.
        return elements.slice();
    }
    function CopyDataBlockBytes(dest, destOffset, src, srcOffset, n) {
        new Uint8Array(dest).set(new Uint8Array(src, srcOffset, n), destOffset);
    }
    // Not implemented correctly
    function TransferArrayBuffer(O) {
        return O;
    }
    // Not implemented correctly
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function IsDetachedBuffer(O) {
        return false;
    }
    function ArrayBufferSlice(buffer, begin, end) {
        // ArrayBuffer.prototype.slice is not available on IE10
        // https://www.caniuse.com/mdn-javascript_builtins_arraybuffer_slice
        if (buffer.slice) {
            return buffer.slice(begin, end);
        }
        const length = end - begin;
        const slice = new ArrayBuffer(length);
        CopyDataBlockBytes(slice, 0, buffer, begin, length);
        return slice;
    }

    function IsNonNegativeNumber(v) {
        if (typeof v !== 'number') {
            return false;
        }
        if (NumberIsNaN(v)) {
            return false;
        }
        if (v < 0) {
            return false;
        }
        return true;
    }
    function CloneAsUint8Array(O) {
        const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
        return new Uint8Array(buffer);
    }

    function DequeueValue(container) {
        const pair = container._queue.shift();
        container._queueTotalSize -= pair.size;
        if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
        }
        return pair.value;
    }
    function EnqueueValueWithSize(container, value, size) {
        if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError('Size must be a finite, non-NaN, non-negative number.');
        }
        container._queue.push({ value, size });
        container._queueTotalSize += size;
    }
    function PeekQueueValue(container) {
        const pair = container._queue.peek();
        return pair.value;
    }
    function ResetQueue(container) {
        container._queue = new SimpleQueue();
        container._queueTotalSize = 0;
    }

    /**
     * A pull-into request in a {@link ReadableByteStreamController}.
     *
     * @public
     */
    class ReadableStreamBYOBRequest {
        constructor() {
            throw new TypeError('Illegal constructor');
        }
        /**
         * Returns the view for writing in to, or `null` if the BYOB request has already been responded to.
         */
        get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
                throw byobRequestBrandCheckException('view');
            }
            return this._view;
        }
        respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
                throw byobRequestBrandCheckException('respond');
            }
            assertRequiredArgument(bytesWritten, 1, 'respond');
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, 'First parameter');
            if (this._associatedReadableByteStreamController === undefined) {
                throw new TypeError('This BYOB request has been invalidated');
            }
            if (IsDetachedBuffer(this._view.buffer)) ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
        }
        respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
                throw byobRequestBrandCheckException('respondWithNewView');
            }
            assertRequiredArgument(view, 1, 'respondWithNewView');
            if (!ArrayBuffer.isView(view)) {
                throw new TypeError('You can only respond with array buffer views');
            }
            if (this._associatedReadableByteStreamController === undefined) {
                throw new TypeError('This BYOB request has been invalidated');
            }
            if (IsDetachedBuffer(view.buffer)) ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
        }
    }
    Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
        respond: { enumerable: true },
        respondWithNewView: { enumerable: true },
        view: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableStreamBYOBRequest',
            configurable: true
        });
    }
    /**
     * Allows control of a {@link ReadableStream | readable byte stream}'s state and internal queue.
     *
     * @public
     */
    class ReadableByteStreamController {
        constructor() {
            throw new TypeError('Illegal constructor');
        }
        /**
         * Returns the current BYOB pull request, or `null` if there isn't one.
         */
        get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
                throw byteStreamControllerBrandCheckException('byobRequest');
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying byte source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
                throw byteStreamControllerBrandCheckException('desiredSize');
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
            if (!IsReadableByteStreamController(this)) {
                throw byteStreamControllerBrandCheckException('close');
            }
            if (this._closeRequested) {
                throw new TypeError('The stream has already been closed; do not close it again!');
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== 'readable') {
                throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
        }
        enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
                throw byteStreamControllerBrandCheckException('enqueue');
            }
            assertRequiredArgument(chunk, 1, 'enqueue');
            if (!ArrayBuffer.isView(chunk)) {
                throw new TypeError('chunk must be an array buffer view');
            }
            if (chunk.byteLength === 0) {
                throw new TypeError('chunk must have non-zero byteLength');
            }
            if (chunk.buffer.byteLength === 0) {
                throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
                throw new TypeError('stream is closed or draining');
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== 'readable') {
                throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e = undefined) {
            if (!IsReadableByteStreamController(this)) {
                throw byteStreamControllerBrandCheckException('error');
            }
            ReadableByteStreamControllerError(this, e);
        }
        /** @internal */
        [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
                const entry = this._queue.shift();
                this._queueTotalSize -= entry.byteLength;
                ReadableByteStreamControllerHandleQueueDrain(this);
                const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
                readRequest._chunkSteps(view);
                return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== undefined) {
                let buffer;
                try {
                    buffer = new ArrayBuffer(autoAllocateChunkSize);
                }
                catch (bufferE) {
                    readRequest._errorSteps(bufferE);
                    return;
                }
                const pullIntoDescriptor = {
                    buffer,
                    bufferByteLength: autoAllocateChunkSize,
                    byteOffset: 0,
                    byteLength: autoAllocateChunkSize,
                    bytesFilled: 0,
                    elementSize: 1,
                    viewConstructor: Uint8Array,
                    readerType: 'default'
                };
                this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
        }
    }
    Object.defineProperties(ReadableByteStreamController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        byobRequest: { enumerable: true },
        desiredSize: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableByteStreamController',
            configurable: true
        });
    }
    // Abstract operations for the ReadableByteStreamController.
    function IsReadableByteStreamController(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableByteStream')) {
            return false;
        }
        return x instanceof ReadableByteStreamController;
    }
    function IsReadableStreamBYOBRequest(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_associatedReadableByteStreamController')) {
            return false;
        }
        return x instanceof ReadableStreamBYOBRequest;
    }
    function ReadableByteStreamControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
        if (!shouldPull) {
            return;
        }
        if (controller._pulling) {
            controller._pullAgain = true;
            return;
        }
        controller._pulling = true;
        // TODO: Test controller argument
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
                controller._pullAgain = false;
                ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
        }, e => {
            ReadableByteStreamControllerError(controller, e);
        });
    }
    function ReadableByteStreamControllerClearPendingPullIntos(controller) {
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        controller._pendingPullIntos = new SimpleQueue();
    }
    function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
        let done = false;
        if (stream._state === 'closed') {
            done = true;
        }
        const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
        if (pullIntoDescriptor.readerType === 'default') {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
        }
        else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
        }
    }
    function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
        const bytesFilled = pullIntoDescriptor.bytesFilled;
        const elementSize = pullIntoDescriptor.elementSize;
        return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
    }
    function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
        controller._queue.push({ buffer, byteOffset, byteLength });
        controller._queueTotalSize += byteLength;
    }
    function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
        const elementSize = pullIntoDescriptor.elementSize;
        const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
        const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
        const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
        const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
        let totalBytesToCopyRemaining = maxBytesToCopy;
        let ready = false;
        if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
        }
        const queue = controller._queue;
        while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
                queue.shift();
            }
            else {
                headOfQueue.byteOffset += bytesToCopy;
                headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
        }
        return ready;
    }
    function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
        pullIntoDescriptor.bytesFilled += size;
    }
    function ReadableByteStreamControllerHandleQueueDrain(controller) {
        if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
        }
        else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
    }
    function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
        if (controller._byobRequest === null) {
            return;
        }
        controller._byobRequest._associatedReadableByteStreamController = undefined;
        controller._byobRequest._view = null;
        controller._byobRequest = null;
    }
    function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
        while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
                return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
                ReadableByteStreamControllerShiftPendingPullInto(controller);
                ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
        }
    }
    function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
        const stream = controller._controlledReadableByteStream;
        let elementSize = 1;
        if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
        }
        const ctor = view.constructor;
        // try {
        const buffer = TransferArrayBuffer(view.buffer);
        // } catch (e) {
        //   readIntoRequest._errorSteps(e);
        //   return;
        // }
        const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: 'byob'
        };
        if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            // No ReadableByteStreamControllerCallPullIfNeeded() call since:
            // - No change happens on desiredSize
            // - The source has already been notified of that there's at least 1 pending read(view)
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
        }
        if (stream._state === 'closed') {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
        }
        if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
                const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
                ReadableByteStreamControllerHandleQueueDrain(controller);
                readIntoRequest._chunkSteps(filledView);
                return;
            }
            if (controller._closeRequested) {
                const e = new TypeError('Insufficient bytes to fill elements in the given buffer');
                ReadableByteStreamControllerError(controller, e);
                readIntoRequest._errorSteps(e);
                return;
            }
        }
        controller._pendingPullIntos.push(pullIntoDescriptor);
        ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
        ReadableByteStreamControllerCallPullIfNeeded(controller);
    }
    function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
        const stream = controller._controlledReadableByteStream;
        if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
                const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
                ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
        }
    }
    function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
        ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
        if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
        }
        ReadableByteStreamControllerShiftPendingPullInto(controller);
        const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
        if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
        }
        pullIntoDescriptor.bytesFilled -= remainderSize;
        ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
        ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
    }
    function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        const state = controller._controlledReadableByteStream._state;
        if (state === 'closed') {
            ReadableByteStreamControllerRespondInClosedState(controller);
        }
        else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
    }
    function ReadableByteStreamControllerShiftPendingPullInto(controller) {
        const descriptor = controller._pendingPullIntos.shift();
        return descriptor;
    }
    function ReadableByteStreamControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== 'readable') {
            return false;
        }
        if (controller._closeRequested) {
            return false;
        }
        if (!controller._started) {
            return false;
        }
        if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
        }
        if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
        }
        const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
            return true;
        }
        return false;
    }
    function ReadableByteStreamControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = undefined;
        controller._cancelAlgorithm = undefined;
    }
    // A client of ReadableByteStreamController may use these functions directly to bypass state check.
    function ReadableByteStreamControllerClose(controller) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== 'readable') {
            return;
        }
        if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
        }
        if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
                const e = new TypeError('Insufficient bytes to fill elements in the given buffer');
                ReadableByteStreamControllerError(controller, e);
                throw e;
            }
        }
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamClose(stream);
    }
    function ReadableByteStreamControllerEnqueue(controller, chunk) {
        const stream = controller._controlledReadableByteStream;
        if (controller._closeRequested || stream._state !== 'readable') {
            return;
        }
        const buffer = chunk.buffer;
        const byteOffset = chunk.byteOffset;
        const byteLength = chunk.byteLength;
        const transferredBuffer = TransferArrayBuffer(buffer);
        if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer)) ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
        }
        ReadableByteStreamControllerInvalidateBYOBRequest(controller);
        if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
                ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            }
            else {
                if (controller._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerShiftPendingPullInto(controller);
                }
                const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
                ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
        }
        else if (ReadableStreamHasBYOBReader(stream)) {
            // TODO: Ideally in this branch detaching should happen only if the buffer is not consumed fully.
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
        }
        ReadableByteStreamControllerCallPullIfNeeded(controller);
    }
    function ReadableByteStreamControllerError(controller, e) {
        const stream = controller._controlledReadableByteStream;
        if (stream._state !== 'readable') {
            return;
        }
        ReadableByteStreamControllerClearPendingPullIntos(controller);
        ResetQueue(controller);
        ReadableByteStreamControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e);
    }
    function ReadableByteStreamControllerGetBYOBRequest(controller) {
        if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
        }
        return controller._byobRequest;
    }
    function ReadableByteStreamControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableByteStream._state;
        if (state === 'errored') {
            return null;
        }
        if (state === 'closed') {
            return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
    }
    function ReadableByteStreamControllerRespond(controller, bytesWritten) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === 'closed') {
            if (bytesWritten !== 0) {
                throw new TypeError('bytesWritten must be 0 when calling respond() on a closed stream');
            }
        }
        else {
            if (bytesWritten === 0) {
                throw new TypeError('bytesWritten must be greater than 0 when calling respond() on a readable stream');
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
                throw new RangeError('bytesWritten out of range');
            }
        }
        firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
        ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
    }
    function ReadableByteStreamControllerRespondWithNewView(controller, view) {
        const firstDescriptor = controller._pendingPullIntos.peek();
        const state = controller._controlledReadableByteStream._state;
        if (state === 'closed') {
            if (view.byteLength !== 0) {
                throw new TypeError('The view\'s length must be 0 when calling respondWithNewView() on a closed stream');
            }
        }
        else {
            if (view.byteLength === 0) {
                throw new TypeError('The view\'s length must be greater than 0 when calling respondWithNewView() on a readable stream');
            }
        }
        if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError('The region specified by view does not match byobRequest');
        }
        if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError('The buffer of view has different capacity than byobRequest');
        }
        if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError('The region specified by view is larger than byobRequest');
        }
        const viewByteLength = view.byteLength;
        firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
        ReadableByteStreamControllerRespondInternal(controller, viewByteLength);
    }
    function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
        controller._controlledReadableByteStream = stream;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._byobRequest = null;
        // Need to set the slots so that the assert doesn't fire. In the spec the slots already exist implicitly.
        controller._queue = controller._queueTotalSize = undefined;
        ResetQueue(controller);
        controller._closeRequested = false;
        controller._started = false;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        controller._autoAllocateChunkSize = autoAllocateChunkSize;
        controller._pendingPullIntos = new SimpleQueue();
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
        }, r => {
            ReadableByteStreamControllerError(controller, r);
        });
    }
    function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
        const controller = Object.create(ReadableByteStreamController.prototype);
        let startAlgorithm = () => undefined;
        let pullAlgorithm = () => promiseResolvedWith(undefined);
        let cancelAlgorithm = () => promiseResolvedWith(undefined);
        if (underlyingByteSource.start !== undefined) {
            startAlgorithm = () => underlyingByteSource.start(controller);
        }
        if (underlyingByteSource.pull !== undefined) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
        }
        if (underlyingByteSource.cancel !== undefined) {
            cancelAlgorithm = reason => underlyingByteSource.cancel(reason);
        }
        const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
        if (autoAllocateChunkSize === 0) {
            throw new TypeError('autoAllocateChunkSize must be greater than 0');
        }
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
    }
    function SetUpReadableStreamBYOBRequest(request, controller, view) {
        request._associatedReadableByteStreamController = controller;
        request._view = view;
    }
    // Helper functions for the ReadableStreamBYOBRequest.
    function byobRequestBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
    }
    // Helper functions for the ReadableByteStreamController.
    function byteStreamControllerBrandCheckException(name) {
        return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
    }

    // Abstract operations for the ReadableStream.
    function AcquireReadableStreamBYOBReader(stream) {
        return new ReadableStreamBYOBReader(stream);
    }
    // ReadableStream API exposed for controllers.
    function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
        stream._reader._readIntoRequests.push(readIntoRequest);
    }
    function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
        const reader = stream._reader;
        const readIntoRequest = reader._readIntoRequests.shift();
        if (done) {
            readIntoRequest._closeSteps(chunk);
        }
        else {
            readIntoRequest._chunkSteps(chunk);
        }
    }
    function ReadableStreamGetNumReadIntoRequests(stream) {
        return stream._reader._readIntoRequests.length;
    }
    function ReadableStreamHasBYOBReader(stream) {
        const reader = stream._reader;
        if (reader === undefined) {
            return false;
        }
        if (!IsReadableStreamBYOBReader(reader)) {
            return false;
        }
        return true;
    }
    /**
     * A BYOB reader vended by a {@link ReadableStream}.
     *
     * @public
     */
    class ReadableStreamBYOBReader {
        constructor(stream) {
            assertRequiredArgument(stream, 1, 'ReadableStreamBYOBReader');
            assertReadableStream(stream, 'First parameter');
            if (IsReadableStreamLocked(stream)) {
                throw new TypeError('This stream has already been locked for exclusive reading by another reader');
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
                throw new TypeError('Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte ' +
                    'source');
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the reader's lock is released before the stream finishes closing.
         */
        get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
                return promiseRejectedWith(byobReaderBrandCheckException('closed'));
            }
            return this._closedPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link ReadableStream.cancel | stream.cancel(reason)}.
         */
        cancel(reason = undefined) {
            if (!IsReadableStreamBYOBReader(this)) {
                return promiseRejectedWith(byobReaderBrandCheckException('cancel'));
            }
            if (this._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('cancel'));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
        }
        /**
         * Attempts to reads bytes into view, and returns a promise resolved with the result.
         *
         * If reading a chunk causes the queue to become empty, more data will be pulled from the underlying source.
         */
        read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
                return promiseRejectedWith(byobReaderBrandCheckException('read'));
            }
            if (!ArrayBuffer.isView(view)) {
                return promiseRejectedWith(new TypeError('view must be an array buffer view'));
            }
            if (view.byteLength === 0) {
                return promiseRejectedWith(new TypeError('view must have non-zero byteLength'));
            }
            if (view.buffer.byteLength === 0) {
                return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer)) ;
            if (this._ownerReadableStream === undefined) {
                return promiseRejectedWith(readerLockException('read from'));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve, reject) => {
                resolvePromise = resolve;
                rejectPromise = reject;
            });
            const readIntoRequest = {
                _chunkSteps: chunk => resolvePromise({ value: chunk, done: false }),
                _closeSteps: chunk => resolvePromise({ value: chunk, done: true }),
                _errorSteps: e => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
        }
        /**
         * Releases the reader's lock on the corresponding stream. After the lock is released, the reader is no longer active.
         * If the associated stream is errored when the lock is released, the reader will appear errored in the same way
         * from now on; otherwise, the reader will appear closed.
         *
         * A reader's lock cannot be released while it still has a pending read request, i.e., if a promise returned by
         * the reader's {@link ReadableStreamBYOBReader.read | read()} method has not yet been settled. Attempting to
         * do so will throw a `TypeError` and leave the reader locked to the stream.
         */
        releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
                throw byobReaderBrandCheckException('releaseLock');
            }
            if (this._ownerReadableStream === undefined) {
                return;
            }
            if (this._readIntoRequests.length > 0) {
                throw new TypeError('Tried to release a reader lock when that reader has pending read() calls un-settled');
            }
            ReadableStreamReaderGenericRelease(this);
        }
    }
    Object.defineProperties(ReadableStreamBYOBReader.prototype, {
        cancel: { enumerable: true },
        read: { enumerable: true },
        releaseLock: { enumerable: true },
        closed: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableStreamBYOBReader',
            configurable: true
        });
    }
    // Abstract operations for the readers.
    function IsReadableStreamBYOBReader(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_readIntoRequests')) {
            return false;
        }
        return x instanceof ReadableStreamBYOBReader;
    }
    function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
        const stream = reader._ownerReadableStream;
        stream._disturbed = true;
        if (stream._state === 'errored') {
            readIntoRequest._errorSteps(stream._storedError);
        }
        else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
        }
    }
    // Helper functions for the ReadableStreamBYOBReader.
    function byobReaderBrandCheckException(name) {
        return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
    }

    function ExtractHighWaterMark(strategy, defaultHWM) {
        const { highWaterMark } = strategy;
        if (highWaterMark === undefined) {
            return defaultHWM;
        }
        if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError('Invalid highWaterMark');
        }
        return highWaterMark;
    }
    function ExtractSizeAlgorithm(strategy) {
        const { size } = strategy;
        if (!size) {
            return () => 1;
        }
        return size;
    }

    function convertQueuingStrategy(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        const size = init === null || init === void 0 ? void 0 : init.size;
        return {
            highWaterMark: highWaterMark === undefined ? undefined : convertUnrestrictedDouble(highWaterMark),
            size: size === undefined ? undefined : convertQueuingStrategySize(size, `${context} has member 'size' that`)
        };
    }
    function convertQueuingStrategySize(fn, context) {
        assertFunction(fn, context);
        return chunk => convertUnrestrictedDouble(fn(chunk));
    }

    function convertUnderlyingSink(original, context) {
        assertDictionary(original, context);
        const abort = original === null || original === void 0 ? void 0 : original.abort;
        const close = original === null || original === void 0 ? void 0 : original.close;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        const write = original === null || original === void 0 ? void 0 : original.write;
        return {
            abort: abort === undefined ?
                undefined :
                convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === undefined ?
                undefined :
                convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === undefined ?
                undefined :
                convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === undefined ?
                undefined :
                convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
        };
    }
    function convertUnderlyingSinkAbortCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
    }
    function convertUnderlyingSinkCloseCallback(fn, original, context) {
        assertFunction(fn, context);
        return () => promiseCall(fn, original, []);
    }
    function convertUnderlyingSinkStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
    }
    function convertUnderlyingSinkWriteCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
    }

    function assertWritableStream(x, context) {
        if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
        }
    }

    function isAbortSignal(value) {
        if (typeof value !== 'object' || value === null) {
            return false;
        }
        try {
            return typeof value.aborted === 'boolean';
        }
        catch (_a) {
            // AbortSignal.prototype.aborted throws if its brand check fails
            return false;
        }
    }
    const supportsAbortController = typeof AbortController === 'function';
    /**
     * Construct a new AbortController, if supported by the platform.
     *
     * @internal
     */
    function createAbortController() {
        if (supportsAbortController) {
            return new AbortController();
        }
        return undefined;
    }

    /**
     * A writable stream represents a destination for data, into which you can write.
     *
     * @public
     */
    class WritableStream {
        constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === undefined) {
                rawUnderlyingSink = null;
            }
            else {
                assertObject(rawUnderlyingSink, 'First parameter');
            }
            const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, 'First parameter');
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== undefined) {
                throw new RangeError('Invalid type is specified');
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
        }
        /**
         * Returns whether or not the writable stream is locked to a writer.
         */
        get locked() {
            if (!IsWritableStream(this)) {
                throw streamBrandCheckException$2('locked');
            }
            return IsWritableStreamLocked(this);
        }
        /**
         * Aborts the stream, signaling that the producer can no longer successfully write to the stream and it is to be
         * immediately moved to an errored state, with any queued-up writes discarded. This will also execute any abort
         * mechanism of the underlying sink.
         *
         * The returned promise will fulfill if the stream shuts down successfully, or reject if the underlying sink signaled
         * that there was an error doing so. Additionally, it will reject with a `TypeError` (without attempting to cancel
         * the stream) if the stream is currently locked.
         */
        abort(reason = undefined) {
            if (!IsWritableStream(this)) {
                return promiseRejectedWith(streamBrandCheckException$2('abort'));
            }
            if (IsWritableStreamLocked(this)) {
                return promiseRejectedWith(new TypeError('Cannot abort a stream that already has a writer'));
            }
            return WritableStreamAbort(this, reason);
        }
        /**
         * Closes the stream. The underlying sink will finish processing any previously-written chunks, before invoking its
         * close behavior. During this time any further attempts to write will fail (without erroring the stream).
         *
         * The method returns a promise that will fulfill if all remaining chunks are successfully written and the stream
         * successfully closes, or rejects if an error is encountered during this process. Additionally, it will reject with
         * a `TypeError` (without attempting to cancel the stream) if the stream is currently locked.
         */
        close() {
            if (!IsWritableStream(this)) {
                return promiseRejectedWith(streamBrandCheckException$2('close'));
            }
            if (IsWritableStreamLocked(this)) {
                return promiseRejectedWith(new TypeError('Cannot close a stream that already has a writer'));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
                return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
            }
            return WritableStreamClose(this);
        }
        /**
         * Creates a {@link WritableStreamDefaultWriter | writer} and locks the stream to the new writer. While the stream
         * is locked, no other writer can be acquired until this one is released.
         *
         * This functionality is especially useful for creating abstractions that desire the ability to write to a stream
         * without interruption or interleaving. By getting a writer for the stream, you can ensure nobody else can write at
         * the same time, which would cause the resulting written data to be unpredictable and probably useless.
         */
        getWriter() {
            if (!IsWritableStream(this)) {
                throw streamBrandCheckException$2('getWriter');
            }
            return AcquireWritableStreamDefaultWriter(this);
        }
    }
    Object.defineProperties(WritableStream.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        getWriter: { enumerable: true },
        locked: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: 'WritableStream',
            configurable: true
        });
    }
    // Abstract operations for the WritableStream.
    function AcquireWritableStreamDefaultWriter(stream) {
        return new WritableStreamDefaultWriter(stream);
    }
    // Throws if and only if startAlgorithm throws.
    function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(WritableStream.prototype);
        InitializeWritableStream(stream);
        const controller = Object.create(WritableStreamDefaultController.prototype);
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
    }
    function InitializeWritableStream(stream) {
        stream._state = 'writable';
        // The error that will be reported by new method calls once the state becomes errored. Only set when [[state]] is
        // 'erroring' or 'errored'. May be set to an undefined value.
        stream._storedError = undefined;
        stream._writer = undefined;
        // Initialize to undefined first because the constructor of the controller checks this
        // variable to validate the caller.
        stream._writableStreamController = undefined;
        // This queue is placed here instead of the writer class in order to allow for passing a writer to the next data
        // producer without waiting for the queued writes to finish.
        stream._writeRequests = new SimpleQueue();
        // Write requests are removed from _writeRequests when write() is called on the underlying sink. This prevents
        // them from being erroneously rejected on error. If a write() call is in-flight, the request is stored here.
        stream._inFlightWriteRequest = undefined;
        // The promise that was returned from writer.close(). Stored here because it may be fulfilled after the writer
        // has been detached.
        stream._closeRequest = undefined;
        // Close request is removed from _closeRequest when close() is called on the underlying sink. This prevents it
        // from being erroneously rejected on error. If a close() call is in-flight, the request is stored here.
        stream._inFlightCloseRequest = undefined;
        // The promise that was returned from writer.abort(). This may also be fulfilled after the writer has detached.
        stream._pendingAbortRequest = undefined;
        // The backpressure signal set by the controller.
        stream._backpressure = false;
    }
    function IsWritableStream(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_writableStreamController')) {
            return false;
        }
        return x instanceof WritableStream;
    }
    function IsWritableStreamLocked(stream) {
        if (stream._writer === undefined) {
            return false;
        }
        return true;
    }
    function WritableStreamAbort(stream, reason) {
        var _a;
        if (stream._state === 'closed' || stream._state === 'errored') {
            return promiseResolvedWith(undefined);
        }
        stream._writableStreamController._abortReason = reason;
        (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
        // TypeScript narrows the type of `stream._state` down to 'writable' | 'erroring',
        // but it doesn't know that signaling abort runs author code that might have changed the state.
        // Widen the type again by casting to WritableStreamState.
        const state = stream._state;
        if (state === 'closed' || state === 'errored') {
            return promiseResolvedWith(undefined);
        }
        if (stream._pendingAbortRequest !== undefined) {
            return stream._pendingAbortRequest._promise;
        }
        let wasAlreadyErroring = false;
        if (state === 'erroring') {
            wasAlreadyErroring = true;
            // reason will not be used, so don't keep a reference to it.
            reason = undefined;
        }
        const promise = newPromise((resolve, reject) => {
            stream._pendingAbortRequest = {
                _promise: undefined,
                _resolve: resolve,
                _reject: reject,
                _reason: reason,
                _wasAlreadyErroring: wasAlreadyErroring
            };
        });
        stream._pendingAbortRequest._promise = promise;
        if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
        }
        return promise;
    }
    function WritableStreamClose(stream) {
        const state = stream._state;
        if (state === 'closed' || state === 'errored') {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
        }
        const promise = newPromise((resolve, reject) => {
            const closeRequest = {
                _resolve: resolve,
                _reject: reject
            };
            stream._closeRequest = closeRequest;
        });
        const writer = stream._writer;
        if (writer !== undefined && stream._backpressure && state === 'writable') {
            defaultWriterReadyPromiseResolve(writer);
        }
        WritableStreamDefaultControllerClose(stream._writableStreamController);
        return promise;
    }
    // WritableStream API exposed for controllers.
    function WritableStreamAddWriteRequest(stream) {
        const promise = newPromise((resolve, reject) => {
            const writeRequest = {
                _resolve: resolve,
                _reject: reject
            };
            stream._writeRequests.push(writeRequest);
        });
        return promise;
    }
    function WritableStreamDealWithRejection(stream, error) {
        const state = stream._state;
        if (state === 'writable') {
            WritableStreamStartErroring(stream, error);
            return;
        }
        WritableStreamFinishErroring(stream);
    }
    function WritableStreamStartErroring(stream, reason) {
        const controller = stream._writableStreamController;
        stream._state = 'erroring';
        stream._storedError = reason;
        const writer = stream._writer;
        if (writer !== undefined) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
        }
        if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
        }
    }
    function WritableStreamFinishErroring(stream) {
        stream._state = 'errored';
        stream._writableStreamController[ErrorSteps]();
        const storedError = stream._storedError;
        stream._writeRequests.forEach(writeRequest => {
            writeRequest._reject(storedError);
        });
        stream._writeRequests = new SimpleQueue();
        if (stream._pendingAbortRequest === undefined) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
        }
        const abortRequest = stream._pendingAbortRequest;
        stream._pendingAbortRequest = undefined;
        if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
        }
        const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
        uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
        });
    }
    function WritableStreamFinishInFlightWrite(stream) {
        stream._inFlightWriteRequest._resolve(undefined);
        stream._inFlightWriteRequest = undefined;
    }
    function WritableStreamFinishInFlightWriteWithError(stream, error) {
        stream._inFlightWriteRequest._reject(error);
        stream._inFlightWriteRequest = undefined;
        WritableStreamDealWithRejection(stream, error);
    }
    function WritableStreamFinishInFlightClose(stream) {
        stream._inFlightCloseRequest._resolve(undefined);
        stream._inFlightCloseRequest = undefined;
        const state = stream._state;
        if (state === 'erroring') {
            // The error was too late to do anything, so it is ignored.
            stream._storedError = undefined;
            if (stream._pendingAbortRequest !== undefined) {
                stream._pendingAbortRequest._resolve();
                stream._pendingAbortRequest = undefined;
            }
        }
        stream._state = 'closed';
        const writer = stream._writer;
        if (writer !== undefined) {
            defaultWriterClosedPromiseResolve(writer);
        }
    }
    function WritableStreamFinishInFlightCloseWithError(stream, error) {
        stream._inFlightCloseRequest._reject(error);
        stream._inFlightCloseRequest = undefined;
        // Never execute sink abort() after sink close().
        if (stream._pendingAbortRequest !== undefined) {
            stream._pendingAbortRequest._reject(error);
            stream._pendingAbortRequest = undefined;
        }
        WritableStreamDealWithRejection(stream, error);
    }
    // TODO(ricea): Fix alphabetical order.
    function WritableStreamCloseQueuedOrInFlight(stream) {
        if (stream._closeRequest === undefined && stream._inFlightCloseRequest === undefined) {
            return false;
        }
        return true;
    }
    function WritableStreamHasOperationMarkedInFlight(stream) {
        if (stream._inFlightWriteRequest === undefined && stream._inFlightCloseRequest === undefined) {
            return false;
        }
        return true;
    }
    function WritableStreamMarkCloseRequestInFlight(stream) {
        stream._inFlightCloseRequest = stream._closeRequest;
        stream._closeRequest = undefined;
    }
    function WritableStreamMarkFirstWriteRequestInFlight(stream) {
        stream._inFlightWriteRequest = stream._writeRequests.shift();
    }
    function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
        if (stream._closeRequest !== undefined) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = undefined;
        }
        const writer = stream._writer;
        if (writer !== undefined) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
        }
    }
    function WritableStreamUpdateBackpressure(stream, backpressure) {
        const writer = stream._writer;
        if (writer !== undefined && backpressure !== stream._backpressure) {
            if (backpressure) {
                defaultWriterReadyPromiseReset(writer);
            }
            else {
                defaultWriterReadyPromiseResolve(writer);
            }
        }
        stream._backpressure = backpressure;
    }
    /**
     * A default writer vended by a {@link WritableStream}.
     *
     * @public
     */
    class WritableStreamDefaultWriter {
        constructor(stream) {
            assertRequiredArgument(stream, 1, 'WritableStreamDefaultWriter');
            assertWritableStream(stream, 'First parameter');
            if (IsWritableStreamLocked(stream)) {
                throw new TypeError('This stream has already been locked for exclusive writing by another writer');
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === 'writable') {
                if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                    defaultWriterReadyPromiseInitialize(this);
                }
                else {
                    defaultWriterReadyPromiseInitializeAsResolved(this);
                }
                defaultWriterClosedPromiseInitialize(this);
            }
            else if (state === 'erroring') {
                defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
                defaultWriterClosedPromiseInitialize(this);
            }
            else if (state === 'closed') {
                defaultWriterReadyPromiseInitializeAsResolved(this);
                defaultWriterClosedPromiseInitializeAsResolved(this);
            }
            else {
                const storedError = stream._storedError;
                defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
                defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
        }
        /**
         * Returns a promise that will be fulfilled when the stream becomes closed, or rejected if the stream ever errors or
         * the writer???s lock is released before the stream finishes closing.
         */
        get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
                return promiseRejectedWith(defaultWriterBrandCheckException('closed'));
            }
            return this._closedPromise;
        }
        /**
         * Returns the desired size to fill the stream???s internal queue. It can be negative, if the queue is over-full.
         * A producer can use this information to determine the right amount of data to write.
         *
         * It will be `null` if the stream cannot be successfully written to (due to either being errored, or having an abort
         * queued up). It will return zero if the stream is closed. And the getter will throw an exception if invoked when
         * the writer???s lock is released.
         */
        get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
                throw defaultWriterBrandCheckException('desiredSize');
            }
            if (this._ownerWritableStream === undefined) {
                throw defaultWriterLockException('desiredSize');
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
        }
        /**
         * Returns a promise that will be fulfilled when the desired size to fill the stream???s internal queue transitions
         * from non-positive to positive, signaling that it is no longer applying backpressure. Once the desired size dips
         * back to zero or below, the getter will return a new promise that stays pending until the next transition.
         *
         * If the stream becomes errored or aborted, or the writer???s lock is released, the returned promise will become
         * rejected.
         */
        get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
                return promiseRejectedWith(defaultWriterBrandCheckException('ready'));
            }
            return this._readyPromise;
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.abort | stream.abort(reason)}.
         */
        abort(reason = undefined) {
            if (!IsWritableStreamDefaultWriter(this)) {
                return promiseRejectedWith(defaultWriterBrandCheckException('abort'));
            }
            if (this._ownerWritableStream === undefined) {
                return promiseRejectedWith(defaultWriterLockException('abort'));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
        }
        /**
         * If the reader is active, behaves the same as {@link WritableStream.close | stream.close()}.
         */
        close() {
            if (!IsWritableStreamDefaultWriter(this)) {
                return promiseRejectedWith(defaultWriterBrandCheckException('close'));
            }
            const stream = this._ownerWritableStream;
            if (stream === undefined) {
                return promiseRejectedWith(defaultWriterLockException('close'));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
                return promiseRejectedWith(new TypeError('Cannot close an already-closing stream'));
            }
            return WritableStreamDefaultWriterClose(this);
        }
        /**
         * Releases the writer???s lock on the corresponding stream. After the lock is released, the writer is no longer active.
         * If the associated stream is errored when the lock is released, the writer will appear errored in the same way from
         * now on; otherwise, the writer will appear closed.
         *
         * Note that the lock can still be released even if some ongoing writes have not yet finished (i.e. even if the
         * promises returned from previous calls to {@link WritableStreamDefaultWriter.write | write()} have not yet settled).
         * It???s not necessary to hold the lock on the writer for the duration of the write; the lock instead simply prevents
         * other producers from writing in an interleaved manner.
         */
        releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
                throw defaultWriterBrandCheckException('releaseLock');
            }
            const stream = this._ownerWritableStream;
            if (stream === undefined) {
                return;
            }
            WritableStreamDefaultWriterRelease(this);
        }
        write(chunk = undefined) {
            if (!IsWritableStreamDefaultWriter(this)) {
                return promiseRejectedWith(defaultWriterBrandCheckException('write'));
            }
            if (this._ownerWritableStream === undefined) {
                return promiseRejectedWith(defaultWriterLockException('write to'));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
        }
    }
    Object.defineProperties(WritableStreamDefaultWriter.prototype, {
        abort: { enumerable: true },
        close: { enumerable: true },
        releaseLock: { enumerable: true },
        write: { enumerable: true },
        closed: { enumerable: true },
        desiredSize: { enumerable: true },
        ready: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: 'WritableStreamDefaultWriter',
            configurable: true
        });
    }
    // Abstract operations for the WritableStreamDefaultWriter.
    function IsWritableStreamDefaultWriter(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_ownerWritableStream')) {
            return false;
        }
        return x instanceof WritableStreamDefaultWriter;
    }
    // A client of WritableStreamDefaultWriter may use these functions directly to bypass state check.
    function WritableStreamDefaultWriterAbort(writer, reason) {
        const stream = writer._ownerWritableStream;
        return WritableStreamAbort(stream, reason);
    }
    function WritableStreamDefaultWriterClose(writer) {
        const stream = writer._ownerWritableStream;
        return WritableStreamClose(stream);
    }
    function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
            return promiseResolvedWith(undefined);
        }
        if (state === 'errored') {
            return promiseRejectedWith(stream._storedError);
        }
        return WritableStreamDefaultWriterClose(writer);
    }
    function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error) {
        if (writer._closedPromiseState === 'pending') {
            defaultWriterClosedPromiseReject(writer, error);
        }
        else {
            defaultWriterClosedPromiseResetToRejected(writer, error);
        }
    }
    function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error) {
        if (writer._readyPromiseState === 'pending') {
            defaultWriterReadyPromiseReject(writer, error);
        }
        else {
            defaultWriterReadyPromiseResetToRejected(writer, error);
        }
    }
    function WritableStreamDefaultWriterGetDesiredSize(writer) {
        const stream = writer._ownerWritableStream;
        const state = stream._state;
        if (state === 'errored' || state === 'erroring') {
            return null;
        }
        if (state === 'closed') {
            return 0;
        }
        return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
    }
    function WritableStreamDefaultWriterRelease(writer) {
        const stream = writer._ownerWritableStream;
        const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
        WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
        // The state transitions to "errored" before the sink abort() method runs, but the writer.closed promise is not
        // rejected until afterwards. This means that simply testing state will not work.
        WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
        stream._writer = undefined;
        writer._ownerWritableStream = undefined;
    }
    function WritableStreamDefaultWriterWrite(writer, chunk) {
        const stream = writer._ownerWritableStream;
        const controller = stream._writableStreamController;
        const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
        if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException('write to'));
        }
        const state = stream._state;
        if (state === 'errored') {
            return promiseRejectedWith(stream._storedError);
        }
        if (WritableStreamCloseQueuedOrInFlight(stream) || state === 'closed') {
            return promiseRejectedWith(new TypeError('The stream is closing or closed and cannot be written to'));
        }
        if (state === 'erroring') {
            return promiseRejectedWith(stream._storedError);
        }
        const promise = WritableStreamAddWriteRequest(stream);
        WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
        return promise;
    }
    const closeSentinel = {};
    /**
     * Allows control of a {@link WritableStream | writable stream}'s state and internal queue.
     *
     * @public
     */
    class WritableStreamDefaultController {
        constructor() {
            throw new TypeError('Illegal constructor');
        }
        /**
         * The reason which was passed to `WritableStream.abort(reason)` when the stream was aborted.
         *
         * @deprecated
         *  This property has been removed from the specification, see https://github.com/whatwg/streams/pull/1177.
         *  Use {@link WritableStreamDefaultController.signal}'s `reason` instead.
         */
        get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$2('abortReason');
            }
            return this._abortReason;
        }
        /**
         * An `AbortSignal` that can be used to abort the pending write or close operation when the stream is aborted.
         */
        get signal() {
            if (!IsWritableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$2('signal');
            }
            if (this._abortController === undefined) {
                // Older browsers or older Node versions may not support `AbortController` or `AbortSignal`.
                // We don't want to bundle and ship an `AbortController` polyfill together with our polyfill,
                // so instead we only implement support for `signal` if we find a global `AbortController` constructor.
                throw new TypeError('WritableStreamDefaultController.prototype.signal is not supported');
            }
            return this._abortController.signal;
        }
        /**
         * Closes the controlled writable stream, making all future interactions with it fail with the given error `e`.
         *
         * This method is rarely used, since usually it suffices to return a rejected promise from one of the underlying
         * sink's methods. However, it can be useful for suddenly shutting down a stream in response to an event outside the
         * normal lifecycle of interactions with the underlying sink.
         */
        error(e = undefined) {
            if (!IsWritableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$2('error');
            }
            const state = this._controlledWritableStream._state;
            if (state !== 'writable') {
                // The stream is closed, errored or will be soon. The sink can't do anything useful if it gets an error here, so
                // just treat it as a no-op.
                return;
            }
            WritableStreamDefaultControllerError(this, e);
        }
        /** @internal */
        [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
        }
        /** @internal */
        [ErrorSteps]() {
            ResetQueue(this);
        }
    }
    Object.defineProperties(WritableStreamDefaultController.prototype, {
        abortReason: { enumerable: true },
        signal: { enumerable: true },
        error: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: 'WritableStreamDefaultController',
            configurable: true
        });
    }
    // Abstract operations implementing interface required by the WritableStream.
    function IsWritableStreamDefaultController(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_controlledWritableStream')) {
            return false;
        }
        return x instanceof WritableStreamDefaultController;
    }
    function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledWritableStream = stream;
        stream._writableStreamController = controller;
        // Need to set the slots so that the assert doesn't fire. In the spec the slots already exist implicitly.
        controller._queue = undefined;
        controller._queueTotalSize = undefined;
        ResetQueue(controller);
        controller._abortReason = undefined;
        controller._abortController = createAbortController();
        controller._started = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._writeAlgorithm = writeAlgorithm;
        controller._closeAlgorithm = closeAlgorithm;
        controller._abortAlgorithm = abortAlgorithm;
        const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
        WritableStreamUpdateBackpressure(stream, backpressure);
        const startResult = startAlgorithm();
        const startPromise = promiseResolvedWith(startResult);
        uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, r => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
        });
    }
    function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(WritableStreamDefaultController.prototype);
        let startAlgorithm = () => undefined;
        let writeAlgorithm = () => promiseResolvedWith(undefined);
        let closeAlgorithm = () => promiseResolvedWith(undefined);
        let abortAlgorithm = () => promiseResolvedWith(undefined);
        if (underlyingSink.start !== undefined) {
            startAlgorithm = () => underlyingSink.start(controller);
        }
        if (underlyingSink.write !== undefined) {
            writeAlgorithm = chunk => underlyingSink.write(chunk, controller);
        }
        if (underlyingSink.close !== undefined) {
            closeAlgorithm = () => underlyingSink.close();
        }
        if (underlyingSink.abort !== undefined) {
            abortAlgorithm = reason => underlyingSink.abort(reason);
        }
        SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
    }
    // ClearAlgorithms may be called twice. Erroring the same stream in multiple ways will often result in redundant calls.
    function WritableStreamDefaultControllerClearAlgorithms(controller) {
        controller._writeAlgorithm = undefined;
        controller._closeAlgorithm = undefined;
        controller._abortAlgorithm = undefined;
        controller._strategySizeAlgorithm = undefined;
    }
    function WritableStreamDefaultControllerClose(controller) {
        EnqueueValueWithSize(controller, closeSentinel, 0);
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
    }
    function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
        try {
            return controller._strategySizeAlgorithm(chunk);
        }
        catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
        }
    }
    function WritableStreamDefaultControllerGetDesiredSize(controller) {
        return controller._strategyHWM - controller._queueTotalSize;
    }
    function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
        try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
        }
        catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
        }
        const stream = controller._controlledWritableStream;
        if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === 'writable') {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
        }
        WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
    }
    // Abstract operations for the WritableStreamDefaultController.
    function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
        const stream = controller._controlledWritableStream;
        if (!controller._started) {
            return;
        }
        if (stream._inFlightWriteRequest !== undefined) {
            return;
        }
        const state = stream._state;
        if (state === 'erroring') {
            WritableStreamFinishErroring(stream);
            return;
        }
        if (controller._queue.length === 0) {
            return;
        }
        const value = PeekQueueValue(controller);
        if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
        }
        else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
        }
    }
    function WritableStreamDefaultControllerErrorIfNeeded(controller, error) {
        if (controller._controlledWritableStream._state === 'writable') {
            WritableStreamDefaultControllerError(controller, error);
        }
    }
    function WritableStreamDefaultControllerProcessClose(controller) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkCloseRequestInFlight(stream);
        DequeueValue(controller);
        const sinkClosePromise = controller._closeAlgorithm();
        WritableStreamDefaultControllerClearAlgorithms(controller);
        uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
        }, reason => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
        });
    }
    function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
        const stream = controller._controlledWritableStream;
        WritableStreamMarkFirstWriteRequestInFlight(stream);
        const sinkWritePromise = controller._writeAlgorithm(chunk);
        uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === 'writable') {
                const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
                WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }, reason => {
            if (stream._state === 'writable') {
                WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
        });
    }
    function WritableStreamDefaultControllerGetBackpressure(controller) {
        const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
        return desiredSize <= 0;
    }
    // A client of WritableStreamDefaultController may use these functions directly to bypass state check.
    function WritableStreamDefaultControllerError(controller, error) {
        const stream = controller._controlledWritableStream;
        WritableStreamDefaultControllerClearAlgorithms(controller);
        WritableStreamStartErroring(stream, error);
    }
    // Helper functions for the WritableStream.
    function streamBrandCheckException$2(name) {
        return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
    }
    // Helper functions for the WritableStreamDefaultController.
    function defaultControllerBrandCheckException$2(name) {
        return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
    }
    // Helper functions for the WritableStreamDefaultWriter.
    function defaultWriterBrandCheckException(name) {
        return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
    }
    function defaultWriterLockException(name) {
        return new TypeError('Cannot ' + name + ' a stream using a released writer');
    }
    function defaultWriterClosedPromiseInitialize(writer) {
        writer._closedPromise = newPromise((resolve, reject) => {
            writer._closedPromise_resolve = resolve;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = 'pending';
        });
    }
    function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseReject(writer, reason);
    }
    function defaultWriterClosedPromiseInitializeAsResolved(writer) {
        defaultWriterClosedPromiseInitialize(writer);
        defaultWriterClosedPromiseResolve(writer);
    }
    function defaultWriterClosedPromiseReject(writer, reason) {
        if (writer._closedPromise_reject === undefined) {
            return;
        }
        setPromiseIsHandledToTrue(writer._closedPromise);
        writer._closedPromise_reject(reason);
        writer._closedPromise_resolve = undefined;
        writer._closedPromise_reject = undefined;
        writer._closedPromiseState = 'rejected';
    }
    function defaultWriterClosedPromiseResetToRejected(writer, reason) {
        defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
    }
    function defaultWriterClosedPromiseResolve(writer) {
        if (writer._closedPromise_resolve === undefined) {
            return;
        }
        writer._closedPromise_resolve(undefined);
        writer._closedPromise_resolve = undefined;
        writer._closedPromise_reject = undefined;
        writer._closedPromiseState = 'resolved';
    }
    function defaultWriterReadyPromiseInitialize(writer) {
        writer._readyPromise = newPromise((resolve, reject) => {
            writer._readyPromise_resolve = resolve;
            writer._readyPromise_reject = reject;
        });
        writer._readyPromiseState = 'pending';
    }
    function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseReject(writer, reason);
    }
    function defaultWriterReadyPromiseInitializeAsResolved(writer) {
        defaultWriterReadyPromiseInitialize(writer);
        defaultWriterReadyPromiseResolve(writer);
    }
    function defaultWriterReadyPromiseReject(writer, reason) {
        if (writer._readyPromise_reject === undefined) {
            return;
        }
        setPromiseIsHandledToTrue(writer._readyPromise);
        writer._readyPromise_reject(reason);
        writer._readyPromise_resolve = undefined;
        writer._readyPromise_reject = undefined;
        writer._readyPromiseState = 'rejected';
    }
    function defaultWriterReadyPromiseReset(writer) {
        defaultWriterReadyPromiseInitialize(writer);
    }
    function defaultWriterReadyPromiseResetToRejected(writer, reason) {
        defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
    }
    function defaultWriterReadyPromiseResolve(writer) {
        if (writer._readyPromise_resolve === undefined) {
            return;
        }
        writer._readyPromise_resolve(undefined);
        writer._readyPromise_resolve = undefined;
        writer._readyPromise_reject = undefined;
        writer._readyPromiseState = 'fulfilled';
    }

    /// <reference lib="dom" />
    const NativeDOMException = typeof DOMException !== 'undefined' ? DOMException : undefined;

    /// <reference types="node" />
    function isDOMExceptionConstructor(ctor) {
        if (!(typeof ctor === 'function' || typeof ctor === 'object')) {
            return false;
        }
        try {
            new ctor();
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    function createDOMExceptionPolyfill() {
        // eslint-disable-next-line no-shadow
        const ctor = function DOMException(message, name) {
            this.message = message || '';
            this.name = name || 'Error';
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, this.constructor);
            }
        };
        ctor.prototype = Object.create(Error.prototype);
        Object.defineProperty(ctor.prototype, 'constructor', { value: ctor, writable: true, configurable: true });
        return ctor;
    }
    // eslint-disable-next-line no-redeclare
    const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();

    function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
        const reader = AcquireReadableStreamDefaultReader(source);
        const writer = AcquireWritableStreamDefaultWriter(dest);
        source._disturbed = true;
        let shuttingDown = false;
        // This is used to keep track of the spec's requirement that we wait for ongoing writes during shutdown.
        let currentWrite = promiseResolvedWith(undefined);
        return newPromise((resolve, reject) => {
            let abortAlgorithm;
            if (signal !== undefined) {
                abortAlgorithm = () => {
                    const error = new DOMException$1('Aborted', 'AbortError');
                    const actions = [];
                    if (!preventAbort) {
                        actions.push(() => {
                            if (dest._state === 'writable') {
                                return WritableStreamAbort(dest, error);
                            }
                            return promiseResolvedWith(undefined);
                        });
                    }
                    if (!preventCancel) {
                        actions.push(() => {
                            if (source._state === 'readable') {
                                return ReadableStreamCancel(source, error);
                            }
                            return promiseResolvedWith(undefined);
                        });
                    }
                    shutdownWithAction(() => Promise.all(actions.map(action => action())), true, error);
                };
                if (signal.aborted) {
                    abortAlgorithm();
                    return;
                }
                signal.addEventListener('abort', abortAlgorithm);
            }
            // Using reader and writer, read all chunks from this and write them to dest
            // - Backpressure must be enforced
            // - Shutdown must stop all activity
            function pipeLoop() {
                return newPromise((resolveLoop, rejectLoop) => {
                    function next(done) {
                        if (done) {
                            resolveLoop();
                        }
                        else {
                            // Use `PerformPromiseThen` instead of `uponPromise` to avoid
                            // adding unnecessary `.catch(rethrowAssertionErrorRejection)` handlers
                            PerformPromiseThen(pipeStep(), next, rejectLoop);
                        }
                    }
                    next(false);
                });
            }
            function pipeStep() {
                if (shuttingDown) {
                    return promiseResolvedWith(true);
                }
                return PerformPromiseThen(writer._readyPromise, () => {
                    return newPromise((resolveRead, rejectRead) => {
                        ReadableStreamDefaultReaderRead(reader, {
                            _chunkSteps: chunk => {
                                currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), undefined, noop);
                                resolveRead(false);
                            },
                            _closeSteps: () => resolveRead(true),
                            _errorSteps: rejectRead
                        });
                    });
                });
            }
            // Errors must be propagated forward
            isOrBecomesErrored(source, reader._closedPromise, storedError => {
                if (!preventAbort) {
                    shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
                }
                else {
                    shutdown(true, storedError);
                }
            });
            // Errors must be propagated backward
            isOrBecomesErrored(dest, writer._closedPromise, storedError => {
                if (!preventCancel) {
                    shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
                }
                else {
                    shutdown(true, storedError);
                }
            });
            // Closing must be propagated forward
            isOrBecomesClosed(source, reader._closedPromise, () => {
                if (!preventClose) {
                    shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
                }
                else {
                    shutdown();
                }
            });
            // Closing must be propagated backward
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === 'closed') {
                const destClosed = new TypeError('the destination writable stream closed before all data could be piped to it');
                if (!preventCancel) {
                    shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
                }
                else {
                    shutdown(true, destClosed);
                }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
                // Another write may have started while we were waiting on this currentWrite, so we have to be sure to wait
                // for that too.
                const oldCurrentWrite = currentWrite;
                return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : undefined);
            }
            function isOrBecomesErrored(stream, promise, action) {
                if (stream._state === 'errored') {
                    action(stream._storedError);
                }
                else {
                    uponRejection(promise, action);
                }
            }
            function isOrBecomesClosed(stream, promise, action) {
                if (stream._state === 'closed') {
                    action();
                }
                else {
                    uponFulfillment(promise, action);
                }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
                if (shuttingDown) {
                    return;
                }
                shuttingDown = true;
                if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
                    uponFulfillment(waitForWritesToFinish(), doTheRest);
                }
                else {
                    doTheRest();
                }
                function doTheRest() {
                    uponPromise(action(), () => finalize(originalIsError, originalError), newError => finalize(true, newError));
                }
            }
            function shutdown(isError, error) {
                if (shuttingDown) {
                    return;
                }
                shuttingDown = true;
                if (dest._state === 'writable' && !WritableStreamCloseQueuedOrInFlight(dest)) {
                    uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error));
                }
                else {
                    finalize(isError, error);
                }
            }
            function finalize(isError, error) {
                WritableStreamDefaultWriterRelease(writer);
                ReadableStreamReaderGenericRelease(reader);
                if (signal !== undefined) {
                    signal.removeEventListener('abort', abortAlgorithm);
                }
                if (isError) {
                    reject(error);
                }
                else {
                    resolve(undefined);
                }
            }
        });
    }

    /**
     * Allows control of a {@link ReadableStream | readable stream}'s state and internal queue.
     *
     * @public
     */
    class ReadableStreamDefaultController {
        constructor() {
            throw new TypeError('Illegal constructor');
        }
        /**
         * Returns the desired size to fill the controlled stream's internal queue. It can be negative, if the queue is
         * over-full. An underlying source ought to use this information to determine when and how to apply backpressure.
         */
        get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$1('desiredSize');
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
        }
        /**
         * Closes the controlled readable stream. Consumers will still be able to read any previously-enqueued chunks from
         * the stream, but once those are read, the stream will become closed.
         */
        close() {
            if (!IsReadableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$1('close');
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
                throw new TypeError('The stream is not in a state that permits close');
            }
            ReadableStreamDefaultControllerClose(this);
        }
        enqueue(chunk = undefined) {
            if (!IsReadableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$1('enqueue');
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
                throw new TypeError('The stream is not in a state that permits enqueue');
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors the controlled readable stream, making all future interactions with it fail with the given error `e`.
         */
        error(e = undefined) {
            if (!IsReadableStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException$1('error');
            }
            ReadableStreamDefaultControllerError(this, e);
        }
        /** @internal */
        [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
        }
        /** @internal */
        [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
                const chunk = DequeueValue(this);
                if (this._closeRequested && this._queue.length === 0) {
                    ReadableStreamDefaultControllerClearAlgorithms(this);
                    ReadableStreamClose(stream);
                }
                else {
                    ReadableStreamDefaultControllerCallPullIfNeeded(this);
                }
                readRequest._chunkSteps(chunk);
            }
            else {
                ReadableStreamAddReadRequest(stream, readRequest);
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
        }
    }
    Object.defineProperties(ReadableStreamDefaultController.prototype, {
        close: { enumerable: true },
        enqueue: { enumerable: true },
        error: { enumerable: true },
        desiredSize: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableStreamDefaultController',
            configurable: true
        });
    }
    // Abstract operations for the ReadableStreamDefaultController.
    function IsReadableStreamDefaultController(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_controlledReadableStream')) {
            return false;
        }
        return x instanceof ReadableStreamDefaultController;
    }
    function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
        const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
        if (!shouldPull) {
            return;
        }
        if (controller._pulling) {
            controller._pullAgain = true;
            return;
        }
        controller._pulling = true;
        const pullPromise = controller._pullAlgorithm();
        uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
                controller._pullAgain = false;
                ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
        }, e => {
            ReadableStreamDefaultControllerError(controller, e);
        });
    }
    function ReadableStreamDefaultControllerShouldCallPull(controller) {
        const stream = controller._controlledReadableStream;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
        }
        if (!controller._started) {
            return false;
        }
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
        }
        const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
        if (desiredSize > 0) {
            return true;
        }
        return false;
    }
    function ReadableStreamDefaultControllerClearAlgorithms(controller) {
        controller._pullAlgorithm = undefined;
        controller._cancelAlgorithm = undefined;
        controller._strategySizeAlgorithm = undefined;
    }
    // A client of ReadableStreamDefaultController may use these functions directly to bypass state check.
    function ReadableStreamDefaultControllerClose(controller) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
        }
        const stream = controller._controlledReadableStream;
        controller._closeRequested = true;
        if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
        }
    }
    function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
        }
        const stream = controller._controlledReadableStream;
        if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
        }
        else {
            let chunkSize;
            try {
                chunkSize = controller._strategySizeAlgorithm(chunk);
            }
            catch (chunkSizeE) {
                ReadableStreamDefaultControllerError(controller, chunkSizeE);
                throw chunkSizeE;
            }
            try {
                EnqueueValueWithSize(controller, chunk, chunkSize);
            }
            catch (enqueueE) {
                ReadableStreamDefaultControllerError(controller, enqueueE);
                throw enqueueE;
            }
        }
        ReadableStreamDefaultControllerCallPullIfNeeded(controller);
    }
    function ReadableStreamDefaultControllerError(controller, e) {
        const stream = controller._controlledReadableStream;
        if (stream._state !== 'readable') {
            return;
        }
        ResetQueue(controller);
        ReadableStreamDefaultControllerClearAlgorithms(controller);
        ReadableStreamError(stream, e);
    }
    function ReadableStreamDefaultControllerGetDesiredSize(controller) {
        const state = controller._controlledReadableStream._state;
        if (state === 'errored') {
            return null;
        }
        if (state === 'closed') {
            return 0;
        }
        return controller._strategyHWM - controller._queueTotalSize;
    }
    // This is used in the implementation of TransformStream.
    function ReadableStreamDefaultControllerHasBackpressure(controller) {
        if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
        }
        return true;
    }
    function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
        const state = controller._controlledReadableStream._state;
        if (!controller._closeRequested && state === 'readable') {
            return true;
        }
        return false;
    }
    function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
        controller._controlledReadableStream = stream;
        controller._queue = undefined;
        controller._queueTotalSize = undefined;
        ResetQueue(controller);
        controller._started = false;
        controller._closeRequested = false;
        controller._pullAgain = false;
        controller._pulling = false;
        controller._strategySizeAlgorithm = sizeAlgorithm;
        controller._strategyHWM = highWaterMark;
        controller._pullAlgorithm = pullAlgorithm;
        controller._cancelAlgorithm = cancelAlgorithm;
        stream._readableStreamController = controller;
        const startResult = startAlgorithm();
        uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }, r => {
            ReadableStreamDefaultControllerError(controller, r);
        });
    }
    function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        let startAlgorithm = () => undefined;
        let pullAlgorithm = () => promiseResolvedWith(undefined);
        let cancelAlgorithm = () => promiseResolvedWith(undefined);
        if (underlyingSource.start !== undefined) {
            startAlgorithm = () => underlyingSource.start(controller);
        }
        if (underlyingSource.pull !== undefined) {
            pullAlgorithm = () => underlyingSource.pull(controller);
        }
        if (underlyingSource.cancel !== undefined) {
            cancelAlgorithm = reason => underlyingSource.cancel(reason);
        }
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
    }
    // Helper functions for the ReadableStreamDefaultController.
    function defaultControllerBrandCheckException$1(name) {
        return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
    }

    function ReadableStreamTee(stream, cloneForBranch2) {
        if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
        }
        return ReadableStreamDefaultTee(stream);
    }
    function ReadableStreamDefaultTee(stream, cloneForBranch2) {
        const reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgain = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise(resolve => {
            resolveCancelPromise = resolve;
        });
        function pullAlgorithm() {
            if (reading) {
                readAgain = true;
                return promiseResolvedWith(undefined);
            }
            reading = true;
            const readRequest = {
                _chunkSteps: chunk => {
                    // This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
                    // reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
                    // successful synchronously-available reads get ahead of asynchronously-available errors.
                    queueMicrotask(() => {
                        readAgain = false;
                        const chunk1 = chunk;
                        const chunk2 = chunk;
                        // There is no way to access the cloning code right now in the reference implementation.
                        // If we add one then we'll need an implementation for serializable objects.
                        // if (!canceled2 && cloneForBranch2) {
                        //   chunk2 = StructuredDeserialize(StructuredSerialize(chunk2));
                        // }
                        if (!canceled1) {
                            ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                        }
                        if (!canceled2) {
                            ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                        }
                        reading = false;
                        if (readAgain) {
                            pullAlgorithm();
                        }
                    });
                },
                _closeSteps: () => {
                    reading = false;
                    if (!canceled1) {
                        ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                    }
                    if (!canceled2) {
                        ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                    }
                    if (!canceled1 || !canceled2) {
                        resolveCancelPromise(undefined);
                    }
                },
                _errorSteps: () => {
                    reading = false;
                }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(undefined);
        }
        function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
                const compositeReason = CreateArrayFromList([reason1, reason2]);
                const cancelResult = ReadableStreamCancel(stream, compositeReason);
                resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
        }
        function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
                const compositeReason = CreateArrayFromList([reason1, reason2]);
                const cancelResult = ReadableStreamCancel(stream, compositeReason);
                resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
        }
        function startAlgorithm() {
            // do nothing
        }
        branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
        branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
        uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
                resolveCancelPromise(undefined);
            }
        });
        return [branch1, branch2];
    }
    function ReadableByteStreamTee(stream) {
        let reader = AcquireReadableStreamDefaultReader(stream);
        let reading = false;
        let readAgainForBranch1 = false;
        let readAgainForBranch2 = false;
        let canceled1 = false;
        let canceled2 = false;
        let reason1;
        let reason2;
        let branch1;
        let branch2;
        let resolveCancelPromise;
        const cancelPromise = newPromise(resolve => {
            resolveCancelPromise = resolve;
        });
        function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, r => {
                if (thisReader !== reader) {
                    return;
                }
                ReadableByteStreamControllerError(branch1._readableStreamController, r);
                ReadableByteStreamControllerError(branch2._readableStreamController, r);
                if (!canceled1 || !canceled2) {
                    resolveCancelPromise(undefined);
                }
            });
        }
        function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
                ReadableStreamReaderGenericRelease(reader);
                reader = AcquireReadableStreamDefaultReader(stream);
                forwardReaderError(reader);
            }
            const readRequest = {
                _chunkSteps: chunk => {
                    // This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
                    // reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
                    // successful synchronously-available reads get ahead of asynchronously-available errors.
                    queueMicrotask(() => {
                        readAgainForBranch1 = false;
                        readAgainForBranch2 = false;
                        const chunk1 = chunk;
                        let chunk2 = chunk;
                        if (!canceled1 && !canceled2) {
                            try {
                                chunk2 = CloneAsUint8Array(chunk);
                            }
                            catch (cloneE) {
                                ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                                ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                                resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                                return;
                            }
                        }
                        if (!canceled1) {
                            ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                        }
                        if (!canceled2) {
                            ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                        }
                        reading = false;
                        if (readAgainForBranch1) {
                            pull1Algorithm();
                        }
                        else if (readAgainForBranch2) {
                            pull2Algorithm();
                        }
                    });
                },
                _closeSteps: () => {
                    reading = false;
                    if (!canceled1) {
                        ReadableByteStreamControllerClose(branch1._readableStreamController);
                    }
                    if (!canceled2) {
                        ReadableByteStreamControllerClose(branch2._readableStreamController);
                    }
                    if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                        ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                    }
                    if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                        ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                    }
                    if (!canceled1 || !canceled2) {
                        resolveCancelPromise(undefined);
                    }
                },
                _errorSteps: () => {
                    reading = false;
                }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
        }
        function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
                ReadableStreamReaderGenericRelease(reader);
                reader = AcquireReadableStreamBYOBReader(stream);
                forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
                _chunkSteps: chunk => {
                    // This needs to be delayed a microtask because it takes at least a microtask to detect errors (using
                    // reader._closedPromise below), and we want errors in stream to error both branches immediately. We cannot let
                    // successful synchronously-available reads get ahead of asynchronously-available errors.
                    queueMicrotask(() => {
                        readAgainForBranch1 = false;
                        readAgainForBranch2 = false;
                        const byobCanceled = forBranch2 ? canceled2 : canceled1;
                        const otherCanceled = forBranch2 ? canceled1 : canceled2;
                        if (!otherCanceled) {
                            let clonedChunk;
                            try {
                                clonedChunk = CloneAsUint8Array(chunk);
                            }
                            catch (cloneE) {
                                ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                                ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                                resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                                return;
                            }
                            if (!byobCanceled) {
                                ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                            }
                            ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                        }
                        else if (!byobCanceled) {
                            ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                        }
                        reading = false;
                        if (readAgainForBranch1) {
                            pull1Algorithm();
                        }
                        else if (readAgainForBranch2) {
                            pull2Algorithm();
                        }
                    });
                },
                _closeSteps: chunk => {
                    reading = false;
                    const byobCanceled = forBranch2 ? canceled2 : canceled1;
                    const otherCanceled = forBranch2 ? canceled1 : canceled2;
                    if (!byobCanceled) {
                        ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                    }
                    if (!otherCanceled) {
                        ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                    }
                    if (chunk !== undefined) {
                        if (!byobCanceled) {
                            ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                        }
                        if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                            ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                        }
                    }
                    if (!byobCanceled || !otherCanceled) {
                        resolveCancelPromise(undefined);
                    }
                },
                _errorSteps: () => {
                    reading = false;
                }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
        }
        function pull1Algorithm() {
            if (reading) {
                readAgainForBranch1 = true;
                return promiseResolvedWith(undefined);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
                pullWithDefaultReader();
            }
            else {
                pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(undefined);
        }
        function pull2Algorithm() {
            if (reading) {
                readAgainForBranch2 = true;
                return promiseResolvedWith(undefined);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
                pullWithDefaultReader();
            }
            else {
                pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(undefined);
        }
        function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
                const compositeReason = CreateArrayFromList([reason1, reason2]);
                const cancelResult = ReadableStreamCancel(stream, compositeReason);
                resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
        }
        function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
                const compositeReason = CreateArrayFromList([reason1, reason2]);
                const cancelResult = ReadableStreamCancel(stream, compositeReason);
                resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
        }
        function startAlgorithm() {
            return;
        }
        branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
        branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
        forwardReaderError(reader);
        return [branch1, branch2];
    }

    function convertUnderlyingDefaultOrByteSource(source, context) {
        assertDictionary(source, context);
        const original = source;
        const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
        const cancel = original === null || original === void 0 ? void 0 : original.cancel;
        const pull = original === null || original === void 0 ? void 0 : original.pull;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const type = original === null || original === void 0 ? void 0 : original.type;
        return {
            autoAllocateChunkSize: autoAllocateChunkSize === undefined ?
                undefined :
                convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === undefined ?
                undefined :
                convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === undefined ?
                undefined :
                convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === undefined ?
                undefined :
                convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === undefined ? undefined : convertReadableStreamType(type, `${context} has member 'type' that`)
        };
    }
    function convertUnderlyingSourceCancelCallback(fn, original, context) {
        assertFunction(fn, context);
        return (reason) => promiseCall(fn, original, [reason]);
    }
    function convertUnderlyingSourcePullCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
    }
    function convertUnderlyingSourceStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
    }
    function convertReadableStreamType(type, context) {
        type = `${type}`;
        if (type !== 'bytes') {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
        }
        return type;
    }

    function convertReaderOptions(options, context) {
        assertDictionary(options, context);
        const mode = options === null || options === void 0 ? void 0 : options.mode;
        return {
            mode: mode === undefined ? undefined : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
        };
    }
    function convertReadableStreamReaderMode(mode, context) {
        mode = `${mode}`;
        if (mode !== 'byob') {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
        }
        return mode;
    }

    function convertIteratorOptions(options, context) {
        assertDictionary(options, context);
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        return { preventCancel: Boolean(preventCancel) };
    }

    function convertPipeOptions(options, context) {
        assertDictionary(options, context);
        const preventAbort = options === null || options === void 0 ? void 0 : options.preventAbort;
        const preventCancel = options === null || options === void 0 ? void 0 : options.preventCancel;
        const preventClose = options === null || options === void 0 ? void 0 : options.preventClose;
        const signal = options === null || options === void 0 ? void 0 : options.signal;
        if (signal !== undefined) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
        }
        return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
        };
    }
    function assertAbortSignal(signal, context) {
        if (!isAbortSignal(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
        }
    }

    function convertReadableWritablePair(pair, context) {
        assertDictionary(pair, context);
        const readable = pair === null || pair === void 0 ? void 0 : pair.readable;
        assertRequiredField(readable, 'readable', 'ReadableWritablePair');
        assertReadableStream(readable, `${context} has member 'readable' that`);
        const writable = pair === null || pair === void 0 ? void 0 : pair.writable;
        assertRequiredField(writable, 'writable', 'ReadableWritablePair');
        assertWritableStream(writable, `${context} has member 'writable' that`);
        return { readable, writable };
    }

    /**
     * A readable stream represents a source of data, from which you can read.
     *
     * @public
     */
    class ReadableStream {
        constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === undefined) {
                rawUnderlyingSource = null;
            }
            else {
                assertObject(rawUnderlyingSource, 'First parameter');
            }
            const strategy = convertQueuingStrategy(rawStrategy, 'Second parameter');
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, 'First parameter');
            InitializeReadableStream(this);
            if (underlyingSource.type === 'bytes') {
                if (strategy.size !== undefined) {
                    throw new RangeError('The strategy for a byte stream cannot have a size function');
                }
                const highWaterMark = ExtractHighWaterMark(strategy, 0);
                SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            }
            else {
                const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
                const highWaterMark = ExtractHighWaterMark(strategy, 1);
                SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
        }
        /**
         * Whether or not the readable stream is locked to a {@link ReadableStreamDefaultReader | reader}.
         */
        get locked() {
            if (!IsReadableStream(this)) {
                throw streamBrandCheckException$1('locked');
            }
            return IsReadableStreamLocked(this);
        }
        /**
         * Cancels the stream, signaling a loss of interest in the stream by a consumer.
         *
         * The supplied `reason` argument will be given to the underlying source's {@link UnderlyingSource.cancel | cancel()}
         * method, which might or might not use it.
         */
        cancel(reason = undefined) {
            if (!IsReadableStream(this)) {
                return promiseRejectedWith(streamBrandCheckException$1('cancel'));
            }
            if (IsReadableStreamLocked(this)) {
                return promiseRejectedWith(new TypeError('Cannot cancel a stream that already has a reader'));
            }
            return ReadableStreamCancel(this, reason);
        }
        getReader(rawOptions = undefined) {
            if (!IsReadableStream(this)) {
                throw streamBrandCheckException$1('getReader');
            }
            const options = convertReaderOptions(rawOptions, 'First parameter');
            if (options.mode === undefined) {
                return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
        }
        pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
                throw streamBrandCheckException$1('pipeThrough');
            }
            assertRequiredArgument(rawTransform, 1, 'pipeThrough');
            const transform = convertReadableWritablePair(rawTransform, 'First parameter');
            const options = convertPipeOptions(rawOptions, 'Second parameter');
            if (IsReadableStreamLocked(this)) {
                throw new TypeError('ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream');
            }
            if (IsWritableStreamLocked(transform.writable)) {
                throw new TypeError('ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream');
            }
            const promise = ReadableStreamPipeTo(this, transform.writable, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
            setPromiseIsHandledToTrue(promise);
            return transform.readable;
        }
        pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
                return promiseRejectedWith(streamBrandCheckException$1('pipeTo'));
            }
            if (destination === undefined) {
                return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
                return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options;
            try {
                options = convertPipeOptions(rawOptions, 'Second parameter');
            }
            catch (e) {
                return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
                return promiseRejectedWith(new TypeError('ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream'));
            }
            if (IsWritableStreamLocked(destination)) {
                return promiseRejectedWith(new TypeError('ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream'));
            }
            return ReadableStreamPipeTo(this, destination, options.preventClose, options.preventAbort, options.preventCancel, options.signal);
        }
        /**
         * Tees this readable stream, returning a two-element array containing the two resulting branches as
         * new {@link ReadableStream} instances.
         *
         * Teeing a stream will lock it, preventing any other consumer from acquiring a reader.
         * To cancel the stream, cancel both of the resulting branches; a composite cancellation reason will then be
         * propagated to the stream's underlying source.
         *
         * Note that the chunks seen in each branch will be the same object. If the chunks are not immutable,
         * this could allow interference between the two branches.
         */
        tee() {
            if (!IsReadableStream(this)) {
                throw streamBrandCheckException$1('tee');
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
        }
        values(rawOptions = undefined) {
            if (!IsReadableStream(this)) {
                throw streamBrandCheckException$1('values');
            }
            const options = convertIteratorOptions(rawOptions, 'First parameter');
            return AcquireReadableStreamAsyncIterator(this, options.preventCancel);
        }
    }
    Object.defineProperties(ReadableStream.prototype, {
        cancel: { enumerable: true },
        getReader: { enumerable: true },
        pipeThrough: { enumerable: true },
        pipeTo: { enumerable: true },
        tee: { enumerable: true },
        values: { enumerable: true },
        locked: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ReadableStream.prototype, SymbolPolyfill.toStringTag, {
            value: 'ReadableStream',
            configurable: true
        });
    }
    if (typeof SymbolPolyfill.asyncIterator === 'symbol') {
        Object.defineProperty(ReadableStream.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream.prototype.values,
            writable: true,
            configurable: true
        });
    }
    // Abstract operations for the ReadableStream.
    // Throws if and only if startAlgorithm throws.
    function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
        const stream = Object.create(ReadableStream.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableStreamDefaultController.prototype);
        SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        return stream;
    }
    // Throws if and only if startAlgorithm throws.
    function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
        const stream = Object.create(ReadableStream.prototype);
        InitializeReadableStream(stream);
        const controller = Object.create(ReadableByteStreamController.prototype);
        SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, undefined);
        return stream;
    }
    function InitializeReadableStream(stream) {
        stream._state = 'readable';
        stream._reader = undefined;
        stream._storedError = undefined;
        stream._disturbed = false;
    }
    function IsReadableStream(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_readableStreamController')) {
            return false;
        }
        return x instanceof ReadableStream;
    }
    function IsReadableStreamLocked(stream) {
        if (stream._reader === undefined) {
            return false;
        }
        return true;
    }
    // ReadableStream API exposed for controllers.
    function ReadableStreamCancel(stream, reason) {
        stream._disturbed = true;
        if (stream._state === 'closed') {
            return promiseResolvedWith(undefined);
        }
        if (stream._state === 'errored') {
            return promiseRejectedWith(stream._storedError);
        }
        ReadableStreamClose(stream);
        const reader = stream._reader;
        if (reader !== undefined && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach(readIntoRequest => {
                readIntoRequest._closeSteps(undefined);
            });
            reader._readIntoRequests = new SimpleQueue();
        }
        const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
        return transformPromiseWith(sourceCancelPromise, noop);
    }
    function ReadableStreamClose(stream) {
        stream._state = 'closed';
        const reader = stream._reader;
        if (reader === undefined) {
            return;
        }
        defaultReaderClosedPromiseResolve(reader);
        if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach(readRequest => {
                readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
        }
    }
    function ReadableStreamError(stream, e) {
        stream._state = 'errored';
        stream._storedError = e;
        const reader = stream._reader;
        if (reader === undefined) {
            return;
        }
        defaultReaderClosedPromiseReject(reader, e);
        if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach(readRequest => {
                readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
        }
        else {
            reader._readIntoRequests.forEach(readIntoRequest => {
                readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
        }
    }
    // Helper functions for the ReadableStream.
    function streamBrandCheckException$1(name) {
        return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
    }

    function convertQueuingStrategyInit(init, context) {
        assertDictionary(init, context);
        const highWaterMark = init === null || init === void 0 ? void 0 : init.highWaterMark;
        assertRequiredField(highWaterMark, 'highWaterMark', 'QueuingStrategyInit');
        return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
        };
    }

    // The size function must not have a prototype property nor be a constructor
    const byteLengthSizeFunction = (chunk) => {
        return chunk.byteLength;
    };
    try {
        Object.defineProperty(byteLengthSizeFunction, 'name', {
            value: 'size',
            configurable: true
        });
    }
    catch (_a) {
        // This property is non-configurable in older browsers, so ignore if this throws.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#browser_compatibility
    }
    /**
     * A queuing strategy that counts the number of bytes in each chunk.
     *
     * @public
     */
    class ByteLengthQueuingStrategy {
        constructor(options) {
            assertRequiredArgument(options, 1, 'ByteLengthQueuingStrategy');
            options = convertQueuingStrategyInit(options, 'First parameter');
            this._byteLengthQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
                throw byteLengthBrandCheckException('highWaterMark');
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by returning the value of its `byteLength` property.
         */
        get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
                throw byteLengthBrandCheckException('size');
            }
            return byteLengthSizeFunction;
        }
    }
    Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: 'ByteLengthQueuingStrategy',
            configurable: true
        });
    }
    // Helper functions for the ByteLengthQueuingStrategy.
    function byteLengthBrandCheckException(name) {
        return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
    }
    function IsByteLengthQueuingStrategy(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_byteLengthQueuingStrategyHighWaterMark')) {
            return false;
        }
        return x instanceof ByteLengthQueuingStrategy;
    }

    // The size function must not have a prototype property nor be a constructor
    const countSizeFunction = () => {
        return 1;
    };
    try {
        Object.defineProperty(countSizeFunction, 'name', {
            value: 'size',
            configurable: true
        });
    }
    catch (_a) {
        // This property is non-configurable in older browsers, so ignore if this throws.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/name#browser_compatibility
    }
    /**
     * A queuing strategy that counts the number of chunks.
     *
     * @public
     */
    class CountQueuingStrategy {
        constructor(options) {
            assertRequiredArgument(options, 1, 'CountQueuingStrategy');
            options = convertQueuingStrategyInit(options, 'First parameter');
            this._countQueuingStrategyHighWaterMark = options.highWaterMark;
        }
        /**
         * Returns the high water mark provided to the constructor.
         */
        get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
                throw countBrandCheckException('highWaterMark');
            }
            return this._countQueuingStrategyHighWaterMark;
        }
        /**
         * Measures the size of `chunk` by always returning 1.
         * This ensures that the total queue size is a count of the number of chunks in the queue.
         */
        get size() {
            if (!IsCountQueuingStrategy(this)) {
                throw countBrandCheckException('size');
            }
            return countSizeFunction;
        }
    }
    Object.defineProperties(CountQueuingStrategy.prototype, {
        highWaterMark: { enumerable: true },
        size: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: 'CountQueuingStrategy',
            configurable: true
        });
    }
    // Helper functions for the CountQueuingStrategy.
    function countBrandCheckException(name) {
        return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
    }
    function IsCountQueuingStrategy(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_countQueuingStrategyHighWaterMark')) {
            return false;
        }
        return x instanceof CountQueuingStrategy;
    }

    function convertTransformer(original, context) {
        assertDictionary(original, context);
        const flush = original === null || original === void 0 ? void 0 : original.flush;
        const readableType = original === null || original === void 0 ? void 0 : original.readableType;
        const start = original === null || original === void 0 ? void 0 : original.start;
        const transform = original === null || original === void 0 ? void 0 : original.transform;
        const writableType = original === null || original === void 0 ? void 0 : original.writableType;
        return {
            flush: flush === undefined ?
                undefined :
                convertTransformerFlushCallback(flush, original, `${context} has member 'flush' that`),
            readableType,
            start: start === undefined ?
                undefined :
                convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform === undefined ?
                undefined :
                convertTransformerTransformCallback(transform, original, `${context} has member 'transform' that`),
            writableType
        };
    }
    function convertTransformerFlushCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => promiseCall(fn, original, [controller]);
    }
    function convertTransformerStartCallback(fn, original, context) {
        assertFunction(fn, context);
        return (controller) => reflectCall(fn, original, [controller]);
    }
    function convertTransformerTransformCallback(fn, original, context) {
        assertFunction(fn, context);
        return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
    }

    // Class TransformStream
    /**
     * A transform stream consists of a pair of streams: a {@link WritableStream | writable stream},
     * known as its writable side, and a {@link ReadableStream | readable stream}, known as its readable side.
     * In a manner specific to the transform stream in question, writes to the writable side result in new data being
     * made available for reading from the readable side.
     *
     * @public
     */
    class TransformStream {
        constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === undefined) {
                rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, 'Second parameter');
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, 'Third parameter');
            const transformer = convertTransformer(rawTransformer, 'First parameter');
            if (transformer.readableType !== undefined) {
                throw new RangeError('Invalid readableType specified');
            }
            if (transformer.writableType !== undefined) {
                throw new RangeError('Invalid writableType specified');
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise(resolve => {
                startPromise_resolve = resolve;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== undefined) {
                startPromise_resolve(transformer.start(this._transformStreamController));
            }
            else {
                startPromise_resolve(undefined);
            }
        }
        /**
         * The readable side of the transform stream.
         */
        get readable() {
            if (!IsTransformStream(this)) {
                throw streamBrandCheckException('readable');
            }
            return this._readable;
        }
        /**
         * The writable side of the transform stream.
         */
        get writable() {
            if (!IsTransformStream(this)) {
                throw streamBrandCheckException('writable');
            }
            return this._writable;
        }
    }
    Object.defineProperties(TransformStream.prototype, {
        readable: { enumerable: true },
        writable: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: 'TransformStream',
            configurable: true
        });
    }
    function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
        function startAlgorithm() {
            return startPromise;
        }
        function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
        }
        function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
        }
        function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
        }
        stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
        function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
        }
        function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(undefined);
        }
        stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
        // The [[backpressure]] slot is set to undefined so that it can be initialised by TransformStreamSetBackpressure.
        stream._backpressure = undefined;
        stream._backpressureChangePromise = undefined;
        stream._backpressureChangePromise_resolve = undefined;
        TransformStreamSetBackpressure(stream, true);
        stream._transformStreamController = undefined;
    }
    function IsTransformStream(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_transformStreamController')) {
            return false;
        }
        return x instanceof TransformStream;
    }
    // This is a no-op if both sides are already errored.
    function TransformStreamError(stream, e) {
        ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
        TransformStreamErrorWritableAndUnblockWrite(stream, e);
    }
    function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
        TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
        WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
        if (stream._backpressure) {
            // Pretend that pull() was called to permit any pending write() calls to complete. TransformStreamSetBackpressure()
            // cannot be called from enqueue() or pull() once the ReadableStream is errored, so this will will be the final time
            // _backpressure is set.
            TransformStreamSetBackpressure(stream, false);
        }
    }
    function TransformStreamSetBackpressure(stream, backpressure) {
        // Passes also when called during construction.
        if (stream._backpressureChangePromise !== undefined) {
            stream._backpressureChangePromise_resolve();
        }
        stream._backpressureChangePromise = newPromise(resolve => {
            stream._backpressureChangePromise_resolve = resolve;
        });
        stream._backpressure = backpressure;
    }
    // Class TransformStreamDefaultController
    /**
     * Allows control of the {@link ReadableStream} and {@link WritableStream} of the associated {@link TransformStream}.
     *
     * @public
     */
    class TransformStreamDefaultController {
        constructor() {
            throw new TypeError('Illegal constructor');
        }
        /**
         * Returns the desired size to fill the readable side???s internal queue. It can be negative, if the queue is over-full.
         */
        get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException('desiredSize');
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
        }
        enqueue(chunk = undefined) {
            if (!IsTransformStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException('enqueue');
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
        }
        /**
         * Errors both the readable side and the writable side of the controlled transform stream, making all future
         * interactions with it fail with the given error `e`. Any chunks queued for transformation will be discarded.
         */
        error(reason = undefined) {
            if (!IsTransformStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException('error');
            }
            TransformStreamDefaultControllerError(this, reason);
        }
        /**
         * Closes the readable side and errors the writable side of the controlled transform stream. This is useful when the
         * transformer only needs to consume a portion of the chunks written to the writable side.
         */
        terminate() {
            if (!IsTransformStreamDefaultController(this)) {
                throw defaultControllerBrandCheckException('terminate');
            }
            TransformStreamDefaultControllerTerminate(this);
        }
    }
    Object.defineProperties(TransformStreamDefaultController.prototype, {
        enqueue: { enumerable: true },
        error: { enumerable: true },
        terminate: { enumerable: true },
        desiredSize: { enumerable: true }
    });
    if (typeof SymbolPolyfill.toStringTag === 'symbol') {
        Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: 'TransformStreamDefaultController',
            configurable: true
        });
    }
    // Transform Stream Default Controller Abstract Operations
    function IsTransformStreamDefaultController(x) {
        if (!typeIsObject(x)) {
            return false;
        }
        if (!Object.prototype.hasOwnProperty.call(x, '_controlledTransformStream')) {
            return false;
        }
        return x instanceof TransformStreamDefaultController;
    }
    function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
        controller._controlledTransformStream = stream;
        stream._transformStreamController = controller;
        controller._transformAlgorithm = transformAlgorithm;
        controller._flushAlgorithm = flushAlgorithm;
    }
    function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
        const controller = Object.create(TransformStreamDefaultController.prototype);
        let transformAlgorithm = (chunk) => {
            try {
                TransformStreamDefaultControllerEnqueue(controller, chunk);
                return promiseResolvedWith(undefined);
            }
            catch (transformResultE) {
                return promiseRejectedWith(transformResultE);
            }
        };
        let flushAlgorithm = () => promiseResolvedWith(undefined);
        if (transformer.transform !== undefined) {
            transformAlgorithm = chunk => transformer.transform(chunk, controller);
        }
        if (transformer.flush !== undefined) {
            flushAlgorithm = () => transformer.flush(controller);
        }
        SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
    }
    function TransformStreamDefaultControllerClearAlgorithms(controller) {
        controller._transformAlgorithm = undefined;
        controller._flushAlgorithm = undefined;
    }
    function TransformStreamDefaultControllerEnqueue(controller, chunk) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError('Readable side is not in a state that permits enqueue');
        }
        // We throttle transform invocations based on the backpressure of the ReadableStream, but we still
        // accept TransformStreamDefaultControllerEnqueue() calls.
        try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
        }
        catch (e) {
            // This happens when readableStrategy.size() throws.
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
        }
        const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
        if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
        }
    }
    function TransformStreamDefaultControllerError(controller, e) {
        TransformStreamError(controller._controlledTransformStream, e);
    }
    function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
        const transformPromise = controller._transformAlgorithm(chunk);
        return transformPromiseWith(transformPromise, undefined, r => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
        });
    }
    function TransformStreamDefaultControllerTerminate(controller) {
        const stream = controller._controlledTransformStream;
        const readableController = stream._readable._readableStreamController;
        ReadableStreamDefaultControllerClose(readableController);
        const error = new TypeError('TransformStream terminated');
        TransformStreamErrorWritableAndUnblockWrite(stream, error);
    }
    // TransformStreamDefaultSink Algorithms
    function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
        const controller = stream._transformStreamController;
        if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
                const writable = stream._writable;
                const state = writable._state;
                if (state === 'erroring') {
                    throw writable._storedError;
                }
                return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
        }
        return TransformStreamDefaultControllerPerformTransform(controller, chunk);
    }
    function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
        // abort() is not called synchronously, so it is possible for abort() to be called when the stream is already
        // errored.
        TransformStreamError(stream, reason);
        return promiseResolvedWith(undefined);
    }
    function TransformStreamDefaultSinkCloseAlgorithm(stream) {
        // stream._readable cannot change after construction, so caching it across a call to user code is safe.
        const readable = stream._readable;
        const controller = stream._transformStreamController;
        const flushPromise = controller._flushAlgorithm();
        TransformStreamDefaultControllerClearAlgorithms(controller);
        // Return a promise that is fulfilled with undefined on success.
        return transformPromiseWith(flushPromise, () => {
            if (readable._state === 'errored') {
                throw readable._storedError;
            }
            ReadableStreamDefaultControllerClose(readable._readableStreamController);
        }, r => {
            TransformStreamError(stream, r);
            throw readable._storedError;
        });
    }
    // TransformStreamDefaultSource Algorithms
    function TransformStreamDefaultSourcePullAlgorithm(stream) {
        // Invariant. Enforced by the promises returned by start() and pull().
        TransformStreamSetBackpressure(stream, false);
        // Prevent the next pull() call until there is backpressure.
        return stream._backpressureChangePromise;
    }
    // Helper functions for the TransformStreamDefaultController.
    function defaultControllerBrandCheckException(name) {
        return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
    }
    // Helper functions for the TransformStream.
    function streamBrandCheckException(name) {
        return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
    }

    exports.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
    exports.CountQueuingStrategy = CountQueuingStrategy;
    exports.ReadableByteStreamController = ReadableByteStreamController;
    exports.ReadableStream = ReadableStream;
    exports.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
    exports.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
    exports.ReadableStreamDefaultController = ReadableStreamDefaultController;
    exports.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
    exports.TransformStream = TransformStream;
    exports.TransformStreamDefaultController = TransformStreamDefaultController;
    exports.WritableStream = WritableStream;
    exports.WritableStreamDefaultController = WritableStreamDefaultController;
    exports.WritableStreamDefaultWriter = WritableStreamDefaultWriter;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=ponyfill.es2018.js.map


/***/ }),

/***/ "./node_modules/wrappy/wrappy.js":
/*!***************************************!*\
  !*** ./node_modules/wrappy/wrappy.js ***!
  \***************************************/
/***/ ((module) => {

// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}


/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("buffer");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "node:buffer":
/*!******************************!*\
  !*** external "node:buffer" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:buffer");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:http":
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ "node:https":
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:https");

/***/ }),

/***/ "node:net":
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:net");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ }),

/***/ "node:process":
/*!*******************************!*\
  !*** external "node:process" ***!
  \*******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:process");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:stream/web":
/*!**********************************!*\
  !*** external "node:stream/web" ***!
  \**********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream/web");

/***/ }),

/***/ "node:url":
/*!***************************!*\
  !*** external "node:url" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:url");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ "node:zlib":
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:zlib");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

/***/ }),

/***/ "./node_modules/fetch-blob/streams.cjs":
/*!*********************************************!*\
  !*** ./node_modules/fetch-blob/streams.cjs ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

/* c8 ignore start */
// 64 KiB (same size chrome slice theirs blob into Uint8array's)
const POOL_SIZE = 65536

if (!globalThis.ReadableStream) {
  // `node:stream/web` got introduced in v16.5.0 as experimental
  // and it's preferred over the polyfilled version. So we also
  // suppress the warning that gets emitted by NodeJS for using it.
  try {
    const process = __webpack_require__(/*! node:process */ "node:process")
    const { emitWarning } = process
    try {
      process.emitWarning = () => {}
      Object.assign(globalThis, __webpack_require__(/*! node:stream/web */ "node:stream/web"))
      process.emitWarning = emitWarning
    } catch (error) {
      process.emitWarning = emitWarning
      throw error
    }
  } catch (error) {
    // fallback to polyfill implementation
    Object.assign(globalThis, __webpack_require__(/*! web-streams-polyfill/dist/ponyfill.es2018.js */ "./node_modules/web-streams-polyfill/dist/ponyfill.es2018.js"))
  }
}

try {
  // Don't use node: prefix for this, require+node: is not supported until node v14.14
  // Only `import()` can use prefix in 12.20 and later
  const { Blob } = __webpack_require__(/*! buffer */ "buffer")
  if (Blob && !Blob.prototype.stream) {
    Blob.prototype.stream = function name (params) {
      let position = 0
      const blob = this

      return new ReadableStream({
        type: 'bytes',
        async pull (ctrl) {
          const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE))
          const buffer = await chunk.arrayBuffer()
          position += buffer.byteLength
          ctrl.enqueue(new Uint8Array(buffer))

          if (position === blob.size) {
            ctrl.close()
          }
        }
      })
    }
  }
} catch (error) {}
/* c8 ignore end */


/***/ }),

/***/ "./node_modules/data-uri-to-buffer/dist/index.js":
/*!*******************************************************!*\
  !*** ./node_modules/data-uri-to-buffer/dist/index.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "dataUriToBuffer": () => (/* binding */ dataUriToBuffer),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Returns a `Buffer` instance from the given data URI `uri`.
 *
 * @param {String} uri Data URI to turn into a Buffer instance
 * @returns {Buffer} Buffer instance from Data URI
 * @api public
 */
function dataUriToBuffer(uri) {
    if (!/^data:/i.test(uri)) {
        throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
    }
    // strip newlines
    uri = uri.replace(/\r?\n/g, '');
    // split the URI up into the "metadata" and the "data" portions
    const firstComma = uri.indexOf(',');
    if (firstComma === -1 || firstComma <= 4) {
        throw new TypeError('malformed data: URI');
    }
    // remove the "data:" scheme and parse the metadata
    const meta = uri.substring(5, firstComma).split(';');
    let charset = '';
    let base64 = false;
    const type = meta[0] || 'text/plain';
    let typeFull = type;
    for (let i = 1; i < meta.length; i++) {
        if (meta[i] === 'base64') {
            base64 = true;
        }
        else {
            typeFull += `;${meta[i]}`;
            if (meta[i].indexOf('charset=') === 0) {
                charset = meta[i].substring(8);
            }
        }
    }
    // defaults to US-ASCII only if type is not provided
    if (!meta[0] && !charset.length) {
        typeFull += ';charset=US-ASCII';
        charset = 'US-ASCII';
    }
    // get the encoded data portion and decode URI-encoded chars
    const encoding = base64 ? 'base64' : 'ascii';
    const data = unescape(uri.substring(firstComma + 1));
    const buffer = Buffer.from(data, encoding);
    // set `.type` and `.typeFull` properties to MIME type
    buffer.type = type;
    buffer.typeFull = typeFull;
    // set the `.charset` property
    buffer.charset = charset;
    return buffer;
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (dataUriToBuffer);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "./node_modules/fetch-blob/file.js":
/*!*****************************************!*\
  !*** ./node_modules/fetch-blob/file.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "File": () => (/* binding */ File),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./index.js */ "./node_modules/fetch-blob/index.js");


const _File = class File extends _index_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
  #lastModified = 0
  #name = ''

  /**
   * @param {*[]} fileBits
   * @param {string} fileName
   * @param {{lastModified?: number, type?: string}} options
   */// @ts-ignore
  constructor (fileBits, fileName, options = {}) {
    if (arguments.length < 2) {
      throw new TypeError(`Failed to construct 'File': 2 arguments required, but only ${arguments.length} present.`)
    }
    super(fileBits, options)

    if (options === null) options = {}

    // Simulate WebIDL type casting for NaN value in lastModified option.
    const lastModified = options.lastModified === undefined ? Date.now() : Number(options.lastModified)
    if (!Number.isNaN(lastModified)) {
      this.#lastModified = lastModified
    }

    this.#name = String(fileName)
  }

  get name () {
    return this.#name
  }

  get lastModified () {
    return this.#lastModified
  }

  get [Symbol.toStringTag] () {
    return 'File'
  }

  static [Symbol.hasInstance] (object) {
    return !!object && object instanceof _index_js__WEBPACK_IMPORTED_MODULE_0__["default"] &&
      /^(File)$/.test(object[Symbol.toStringTag])
  }
}

/** @type {typeof globalThis.File} */// @ts-ignore
const File = _File
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (File);


/***/ }),

/***/ "./node_modules/fetch-blob/from.js":
/*!*****************************************!*\
  !*** ./node_modules/fetch-blob/from.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Blob": () => (/* reexport safe */ _index_js__WEBPACK_IMPORTED_MODULE_4__["default"]),
/* harmony export */   "File": () => (/* reexport safe */ _file_js__WEBPACK_IMPORTED_MODULE_3__["default"]),
/* harmony export */   "blobFrom": () => (/* binding */ blobFrom),
/* harmony export */   "blobFromSync": () => (/* binding */ blobFromSync),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   "fileFrom": () => (/* binding */ fileFrom),
/* harmony export */   "fileFromSync": () => (/* binding */ fileFromSync)
/* harmony export */ });
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:fs */ "node:fs");
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:path */ "node:path");
/* harmony import */ var node_domexception__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! node-domexception */ "./node_modules/node-domexception/index.js");
/* harmony import */ var _file_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./file.js */ "./node_modules/fetch-blob/file.js");
/* harmony import */ var _index_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./index.js */ "./node_modules/fetch-blob/index.js");







const { stat } = node_fs__WEBPACK_IMPORTED_MODULE_0__.promises

/**
 * @param {string} path filepath on the disk
 * @param {string} [type] mimetype to use
 */
const blobFromSync = (path, type) => fromBlob((0,node_fs__WEBPACK_IMPORTED_MODULE_0__.statSync)(path), path, type)

/**
 * @param {string} path filepath on the disk
 * @param {string} [type] mimetype to use
 * @returns {Promise<Blob>}
 */
const blobFrom = (path, type) => stat(path).then(stat => fromBlob(stat, path, type))

/**
 * @param {string} path filepath on the disk
 * @param {string} [type] mimetype to use
 * @returns {Promise<File>}
 */
const fileFrom = (path, type) => stat(path).then(stat => fromFile(stat, path, type))

/**
 * @param {string} path filepath on the disk
 * @param {string} [type] mimetype to use
 */
const fileFromSync = (path, type) => fromFile((0,node_fs__WEBPACK_IMPORTED_MODULE_0__.statSync)(path), path, type)

// @ts-ignore
const fromBlob = (stat, path, type = '') => new _index_js__WEBPACK_IMPORTED_MODULE_4__["default"]([new BlobDataItem({
  path,
  size: stat.size,
  lastModified: stat.mtimeMs,
  start: 0
})], { type })

// @ts-ignore
const fromFile = (stat, path, type = '') => new _file_js__WEBPACK_IMPORTED_MODULE_3__["default"]([new BlobDataItem({
  path,
  size: stat.size,
  lastModified: stat.mtimeMs,
  start: 0
})], (0,node_path__WEBPACK_IMPORTED_MODULE_1__.basename)(path), { type, lastModified: stat.mtimeMs })

/**
 * This is a blob backed up by a file on the disk
 * with minium requirement. Its wrapped around a Blob as a blobPart
 * so you have no direct access to this.
 *
 * @private
 */
class BlobDataItem {
  #path
  #start

  constructor (options) {
    this.#path = options.path
    this.#start = options.start
    this.size = options.size
    this.lastModified = options.lastModified
  }

  /**
   * Slicing arguments is first validated and formatted
   * to not be out of range by Blob.prototype.slice
   */
  slice (start, end) {
    return new BlobDataItem({
      path: this.#path,
      lastModified: this.lastModified,
      size: end - start,
      start: this.#start + start
    })
  }

  async * stream () {
    const { mtimeMs } = await stat(this.#path)
    if (mtimeMs > this.lastModified) {
      throw new node_domexception__WEBPACK_IMPORTED_MODULE_2__('The requested file could not be read, typically due to permission problems that have occurred after a reference to a file was acquired.', 'NotReadableError')
    }
    yield * (0,node_fs__WEBPACK_IMPORTED_MODULE_0__.createReadStream)(this.#path, {
      start: this.#start,
      end: this.#start + this.size - 1
    })
  }

  get [Symbol.toStringTag] () {
    return 'Blob'
  }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (blobFromSync);



/***/ }),

/***/ "./node_modules/fetch-blob/index.js":
/*!******************************************!*\
  !*** ./node_modules/fetch-blob/index.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Blob": () => (/* binding */ Blob),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _streams_cjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./streams.cjs */ "./node_modules/fetch-blob/streams.cjs");
/*! fetch-blob. MIT License. Jimmy W??rting <https://jimmy.warting.se/opensource> */

// TODO (jimmywarting): in the feature use conditional loading with top level await (requires 14.x)
// Node has recently added whatwg stream into core



// 64 KiB (same size chrome slice theirs blob into Uint8array's)
const POOL_SIZE = 65536

/** @param {(Blob | Uint8Array)[]} parts */
async function * toIterator (parts, clone = true) {
  for (const part of parts) {
    if ('stream' in part) {
      yield * (/** @type {AsyncIterableIterator<Uint8Array>} */ (part.stream()))
    } else if (ArrayBuffer.isView(part)) {
      if (clone) {
        let position = part.byteOffset
        const end = part.byteOffset + part.byteLength
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE)
          const chunk = part.buffer.slice(position, position + size)
          position += chunk.byteLength
          yield new Uint8Array(chunk)
        }
      } else {
        yield part
      }
    /* c8 ignore next 10 */
    } else {
      // For blobs that have arrayBuffer but no stream method (nodes buffer.Blob)
      let position = 0, b = (/** @type {Blob} */ (part))
      while (position !== b.size) {
        const chunk = b.slice(position, Math.min(b.size, position + POOL_SIZE))
        const buffer = await chunk.arrayBuffer()
        position += buffer.byteLength
        yield new Uint8Array(buffer)
      }
    }
  }
}

const _Blob = class Blob {
  /** @type {Array.<(Blob|Uint8Array)>} */
  #parts = []
  #type = ''
  #size = 0
  #endings = 'transparent'

  /**
   * The Blob() constructor returns a new Blob object. The content
   * of the blob consists of the concatenation of the values given
   * in the parameter array.
   *
   * @param {*} blobParts
   * @param {{ type?: string, endings?: string }} [options]
   */
  constructor (blobParts = [], options = {}) {
    if (typeof blobParts !== 'object' || blobParts === null) {
      throw new TypeError('Failed to construct \'Blob\': The provided value cannot be converted to a sequence.')
    }

    if (typeof blobParts[Symbol.iterator] !== 'function') {
      throw new TypeError('Failed to construct \'Blob\': The object must have a callable @@iterator property.')
    }

    if (typeof options !== 'object' && typeof options !== 'function') {
      throw new TypeError('Failed to construct \'Blob\': parameter 2 cannot convert to dictionary.')
    }

    if (options === null) options = {}

    const encoder = new TextEncoder()
    for (const element of blobParts) {
      let part
      if (ArrayBuffer.isView(element)) {
        part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength))
      } else if (element instanceof ArrayBuffer) {
        part = new Uint8Array(element.slice(0))
      } else if (element instanceof Blob) {
        part = element
      } else {
        part = encoder.encode(`${element}`)
      }

      this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size
      this.#parts.push(part)
    }

    this.#endings = `${options.endings === undefined ? 'transparent' : options.endings}`
    const type = options.type === undefined ? '' : String(options.type)
    this.#type = /^[\x20-\x7E]*$/.test(type) ? type : ''
  }

  /**
   * The Blob interface's size property returns the
   * size of the Blob in bytes.
   */
  get size () {
    return this.#size
  }

  /**
   * The type property of a Blob object returns the MIME type of the file.
   */
  get type () {
    return this.#type
  }

  /**
   * The text() method in the Blob interface returns a Promise
   * that resolves with a string containing the contents of
   * the blob, interpreted as UTF-8.
   *
   * @return {Promise<string>}
   */
  async text () {
    // More optimized than using this.arrayBuffer()
    // that requires twice as much ram
    const decoder = new TextDecoder()
    let str = ''
    for await (const part of toIterator(this.#parts, false)) {
      str += decoder.decode(part, { stream: true })
    }
    // Remaining
    str += decoder.decode()
    return str
  }

  /**
   * The arrayBuffer() method in the Blob interface returns a
   * Promise that resolves with the contents of the blob as
   * binary data contained in an ArrayBuffer.
   *
   * @return {Promise<ArrayBuffer>}
   */
  async arrayBuffer () {
    // Easier way... Just a unnecessary overhead
    // const view = new Uint8Array(this.size);
    // await this.stream().getReader({mode: 'byob'}).read(view);
    // return view.buffer;

    const data = new Uint8Array(this.size)
    let offset = 0
    for await (const chunk of toIterator(this.#parts, false)) {
      data.set(chunk, offset)
      offset += chunk.length
    }

    return data.buffer
  }

  stream () {
    const it = toIterator(this.#parts, true)

    return new globalThis.ReadableStream({
      // @ts-ignore
      type: 'bytes',
      async pull (ctrl) {
        const chunk = await it.next()
        chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value)
      },

      async cancel () {
        await it.return()
      }
    })
  }

  /**
   * The Blob interface's slice() method creates and returns a
   * new Blob object which contains data from a subset of the
   * blob on which it's called.
   *
   * @param {number} [start]
   * @param {number} [end]
   * @param {string} [type]
   */
  slice (start = 0, end = this.size, type = '') {
    const { size } = this

    let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size)
    let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size)

    const span = Math.max(relativeEnd - relativeStart, 0)
    const parts = this.#parts
    const blobParts = []
    let added = 0

    for (const part of parts) {
      // don't add the overflow to new blobParts
      if (added >= span) {
        break
      }

      const size = ArrayBuffer.isView(part) ? part.byteLength : part.size
      if (relativeStart && size <= relativeStart) {
        // Skip the beginning and change the relative
        // start & end position as we skip the unwanted parts
        relativeStart -= size
        relativeEnd -= size
      } else {
        let chunk
        if (ArrayBuffer.isView(part)) {
          chunk = part.subarray(relativeStart, Math.min(size, relativeEnd))
          added += chunk.byteLength
        } else {
          chunk = part.slice(relativeStart, Math.min(size, relativeEnd))
          added += chunk.size
        }
        relativeEnd -= size
        blobParts.push(chunk)
        relativeStart = 0 // All next sequential parts should start at 0
      }
    }

    const blob = new Blob([], { type: String(type).toLowerCase() })
    blob.#size = span
    blob.#parts = blobParts

    return blob
  }

  get [Symbol.toStringTag] () {
    return 'Blob'
  }

  static [Symbol.hasInstance] (object) {
    return (
      object &&
      typeof object === 'object' &&
      typeof object.constructor === 'function' &&
      (
        typeof object.stream === 'function' ||
        typeof object.arrayBuffer === 'function'
      ) &&
      /^(Blob|File)$/.test(object[Symbol.toStringTag])
    )
  }
}

Object.defineProperties(_Blob.prototype, {
  size: { enumerable: true },
  type: { enumerable: true },
  slice: { enumerable: true }
})

/** @type {typeof globalThis.Blob} */
const Blob = _Blob
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Blob);


/***/ }),

/***/ "./node_modules/formdata-polyfill/esm.min.js":
/*!***************************************************!*\
  !*** ./node_modules/formdata-polyfill/esm.min.js ***!
  \***************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "File": () => (/* binding */ File),
/* harmony export */   "FormData": () => (/* binding */ FormData),
/* harmony export */   "formDataToBlob": () => (/* binding */ formDataToBlob)
/* harmony export */ });
/* harmony import */ var fetch_blob__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! fetch-blob */ "./node_modules/fetch-blob/index.js");
/* harmony import */ var fetch_blob_file_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! fetch-blob/file.js */ "./node_modules/fetch-blob/file.js");
/*! formdata-polyfill. MIT License. Jimmy W??rting <https://jimmy.warting.se/opensource> */




var {toStringTag:t,iterator:i,hasInstance:h}=Symbol,
r=Math.random,
m='append,set,get,getAll,delete,keys,values,entries,forEach,constructor'.split(','),
f=(a,b,c)=>(a+='',/^(Blob|File)$/.test(b && b[t])?[(c=c!==void 0?c+'':b[t]=='File'?b.name:'blob',a),b.name!==c||b[t]=='blob'?new fetch_blob_file_js__WEBPACK_IMPORTED_MODULE_1__["default"]([b],c,b):b]:[a,b+'']),
e=(c,f)=>(f?c:c.replace(/\r?\n|\r/g,'\r\n')).replace(/\n/g,'%0A').replace(/\r/g,'%0D').replace(/"/g,'%22'),
x=(n, a, e)=>{if(a.length<e){throw new TypeError(`Failed to execute '${n}' on 'FormData': ${e} arguments required, but only ${a.length} present.`)}}

const File = fetch_blob_file_js__WEBPACK_IMPORTED_MODULE_1__["default"]

/** @type {typeof globalThis.FormData} */
const FormData = class FormData {
#d=[];
constructor(...a){if(a.length)throw new TypeError(`Failed to construct 'FormData': parameter 1 is not of type 'HTMLFormElement'.`)}
get [t]() {return 'FormData'}
[i](){return this.entries()}
static [h](o) {return o&&typeof o==='object'&&o[t]==='FormData'&&!m.some(m=>typeof o[m]!='function')}
append(...a){x('append',arguments,2);this.#d.push(f(...a))}
delete(a){x('delete',arguments,1);a+='';this.#d=this.#d.filter(([b])=>b!==a)}
get(a){x('get',arguments,1);a+='';for(var b=this.#d,l=b.length,c=0;c<l;c++)if(b[c][0]===a)return b[c][1];return null}
getAll(a,b){x('getAll',arguments,1);b=[];a+='';this.#d.forEach(c=>c[0]===a&&b.push(c[1]));return b}
has(a){x('has',arguments,1);a+='';return this.#d.some(b=>b[0]===a)}
forEach(a,b){x('forEach',arguments,1);for(var [c,d]of this)a.call(b,d,c,this)}
set(...a){x('set',arguments,2);var b=[],c=!0;a=f(...a);this.#d.forEach(d=>{d[0]===a[0]?c&&(c=!b.push(a)):b.push(d)});c&&b.push(a);this.#d=b}
*entries(){yield*this.#d}
*keys(){for(var[a]of this)yield a}
*values(){for(var[,a]of this)yield a}}

/** @param {FormData} F */
function formDataToBlob (F,B=fetch_blob__WEBPACK_IMPORTED_MODULE_0__["default"]){
var b=`${r()}${r()}`.replace(/\./g, '').slice(-28).padStart(32, '-'),c=[],p=`--${b}\r\nContent-Disposition: form-data; name="`
F.forEach((v,n)=>typeof v=='string'
?c.push(p+e(n)+`"\r\n\r\n${v.replace(/\r(?!\n)|(?<!\r)\n/g, '\r\n')}\r\n`)
:c.push(p+e(n)+`"; filename="${e(v.name, 1)}"\r\nContent-Type: ${v.type||"application/octet-stream"}\r\n\r\n`, v, '\r\n'))
c.push(`--${b}--`)
return new B(c,{type:"multipart/form-data; boundary="+b})}


/***/ }),

/***/ "./node_modules/node-fetch/src/body.js":
/*!*********************************************!*\
  !*** ./node_modules/node-fetch/src/body.js ***!
  \*********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "clone": () => (/* binding */ clone),
/* harmony export */   "default": () => (/* binding */ Body),
/* harmony export */   "extractContentType": () => (/* binding */ extractContentType),
/* harmony export */   "getTotalBytes": () => (/* binding */ getTotalBytes),
/* harmony export */   "writeToStream": () => (/* binding */ writeToStream)
/* harmony export */ });
/* harmony import */ var node_stream__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:stream */ "node:stream");
/* harmony import */ var node_util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:util */ "node:util");
/* harmony import */ var node_buffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! node:buffer */ "node:buffer");
/* harmony import */ var fetch_blob__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! fetch-blob */ "./node_modules/fetch-blob/index.js");
/* harmony import */ var formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! formdata-polyfill/esm.min.js */ "./node_modules/formdata-polyfill/esm.min.js");
/* harmony import */ var _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./errors/fetch-error.js */ "./node_modules/node-fetch/src/errors/fetch-error.js");
/* harmony import */ var _errors_base_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./errors/base.js */ "./node_modules/node-fetch/src/errors/base.js");
/* harmony import */ var _utils_is_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/is.js */ "./node_modules/node-fetch/src/utils/is.js");

/**
 * Body.js
 *
 * Body interface provides common methods for Request and Response
 */












const pipeline = (0,node_util__WEBPACK_IMPORTED_MODULE_1__.promisify)(node_stream__WEBPACK_IMPORTED_MODULE_0__.pipeline);
const INTERNALS = Symbol('Body internals');

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Body {
	constructor(body, {
		size = 0
	} = {}) {
		let boundary = null;

		if (body === null) {
			// Body is undefined or null
			body = null;
		} else if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isURLSearchParameters)(body)) {
			// Body is a URLSearchParams
			body = node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.from(body.toString());
		} else if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isBlob)(body)) {
			// Body is blob
		} else if (node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.isBuffer(body)) {
			// Body is Buffer
		} else if (node_util__WEBPACK_IMPORTED_MODULE_1__.types.isAnyArrayBuffer(body)) {
			// Body is ArrayBuffer
			body = node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.from(body);
		} else if (ArrayBuffer.isView(body)) {
			// Body is ArrayBufferView
			body = node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.from(body.buffer, body.byteOffset, body.byteLength);
		} else if (body instanceof node_stream__WEBPACK_IMPORTED_MODULE_0__) {
			// Body is stream
		} else if (body instanceof formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_4__.FormData) {
			// Body is FormData
			body = (0,formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_4__.formDataToBlob)(body);
			boundary = body.type.split('=')[1];
		} else {
			// None of the above
			// coerce to string then buffer
			body = node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.from(String(body));
		}

		let stream = body;

		if (node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.isBuffer(body)) {
			stream = node_stream__WEBPACK_IMPORTED_MODULE_0__.Readable.from(body);
		} else if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isBlob)(body)) {
			stream = node_stream__WEBPACK_IMPORTED_MODULE_0__.Readable.from(body.stream());
		}

		this[INTERNALS] = {
			body,
			stream,
			boundary,
			disturbed: false,
			error: null
		};
		this.size = size;

		if (body instanceof node_stream__WEBPACK_IMPORTED_MODULE_0__) {
			body.on('error', error_ => {
				const error = error_ instanceof _errors_base_js__WEBPACK_IMPORTED_MODULE_6__.FetchBaseError ?
					error_ :
					new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__.FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, 'system', error_);
				this[INTERNALS].error = error;
			});
		}
	}

	get body() {
		return this[INTERNALS].stream;
	}

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	}

	/**
	 * Decode response as ArrayBuffer
	 *
	 * @return  Promise
	 */
	async arrayBuffer() {
		const {buffer, byteOffset, byteLength} = await consumeBody(this);
		return buffer.slice(byteOffset, byteOffset + byteLength);
	}

	async formData() {
		const ct = this.headers.get('content-type');

		if (ct.startsWith('application/x-www-form-urlencoded')) {
			const formData = new formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_4__.FormData();
			const parameters = new URLSearchParams(await this.text());

			for (const [name, value] of parameters) {
				formData.append(name, value);
			}

			return formData;
		}

		const {toFormData} = await __webpack_require__.e(/*! import() */ "node_modules_node-fetch_src_utils_multipart-parser_js").then(__webpack_require__.bind(__webpack_require__, /*! ./utils/multipart-parser.js */ "./node_modules/node-fetch/src/utils/multipart-parser.js"));
		return toFormData(this.body, ct);
	}

	/**
	 * Return raw response as Blob
	 *
	 * @return Promise
	 */
	async blob() {
		const ct = (this.headers && this.headers.get('content-type')) || (this[INTERNALS].body && this[INTERNALS].body.type) || '';
		const buf = await this.arrayBuffer();

		return new fetch_blob__WEBPACK_IMPORTED_MODULE_3__["default"]([buf], {
			type: ct
		});
	}

	/**
	 * Decode response as json
	 *
	 * @return  Promise
	 */
	async json() {
		const text = await this.text();
		return JSON.parse(text);
	}

	/**
	 * Decode response as text
	 *
	 * @return  Promise
	 */
	async text() {
		const buffer = await consumeBody(this);
		return new TextDecoder().decode(buffer);
	}

	/**
	 * Decode response as buffer (non-spec api)
	 *
	 * @return  Promise
	 */
	buffer() {
		return consumeBody(this);
	}
}

Body.prototype.buffer = (0,node_util__WEBPACK_IMPORTED_MODULE_1__.deprecate)(Body.prototype.buffer, 'Please use \'response.arrayBuffer()\' instead of \'response.buffer()\'', 'node-fetch#buffer');

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: {enumerable: true},
	bodyUsed: {enumerable: true},
	arrayBuffer: {enumerable: true},
	blob: {enumerable: true},
	json: {enumerable: true},
	text: {enumerable: true},
	data: {get: (0,node_util__WEBPACK_IMPORTED_MODULE_1__.deprecate)(() => {},
		'data doesn\'t exist, use json(), text(), arrayBuffer(), or body instead',
		'https://github.com/node-fetch/node-fetch/issues/1000 (response)')}
});

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return Promise
 */
async function consumeBody(data) {
	if (data[INTERNALS].disturbed) {
		throw new TypeError(`body used already for: ${data.url}`);
	}

	data[INTERNALS].disturbed = true;

	if (data[INTERNALS].error) {
		throw data[INTERNALS].error;
	}

	const {body} = data;

	// Body is null
	if (body === null) {
		return node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.alloc(0);
	}

	/* c8 ignore next 3 */
	if (!(body instanceof node_stream__WEBPACK_IMPORTED_MODULE_0__)) {
		return node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.alloc(0);
	}

	// Body is stream
	// get ready to actually consume the body
	const accum = [];
	let accumBytes = 0;

	try {
		for await (const chunk of body) {
			if (data.size > 0 && accumBytes + chunk.length > data.size) {
				const error = new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__.FetchError(`content size at ${data.url} over limit: ${data.size}`, 'max-size');
				body.destroy(error);
				throw error;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		}
	} catch (error) {
		const error_ = error instanceof _errors_base_js__WEBPACK_IMPORTED_MODULE_6__.FetchBaseError ? error : new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__.FetchError(`Invalid response body while trying to fetch ${data.url}: ${error.message}`, 'system', error);
		throw error_;
	}

	if (body.readableEnded === true || body._readableState.ended === true) {
		try {
			if (accum.every(c => typeof c === 'string')) {
				return node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.from(accum.join(''));
			}

			return node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.concat(accum, accumBytes);
		} catch (error) {
			throw new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__.FetchError(`Could not create Buffer from response body for ${data.url}: ${error.message}`, 'system', error);
		}
	} else {
		throw new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_7__.FetchError(`Premature close of server response while trying to fetch ${data.url}`);
	}
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed   instance       Response or Request instance
 * @param   String  highWaterMark  highWaterMark for both PassThrough body streams
 * @return  Mixed
 */
const clone = (instance, highWaterMark) => {
	let p1;
	let p2;
	let {body} = instance[INTERNALS];

	// Don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// Check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if ((body instanceof node_stream__WEBPACK_IMPORTED_MODULE_0__) && (typeof body.getBoundary !== 'function')) {
		// Tee instance body
		p1 = new node_stream__WEBPACK_IMPORTED_MODULE_0__.PassThrough({highWaterMark});
		p2 = new node_stream__WEBPACK_IMPORTED_MODULE_0__.PassThrough({highWaterMark});
		body.pipe(p1);
		body.pipe(p2);
		// Set instance body to teed body and return the other teed body
		instance[INTERNALS].stream = p1;
		body = p2;
	}

	return body;
};

const getNonSpecFormDataBoundary = (0,node_util__WEBPACK_IMPORTED_MODULE_1__.deprecate)(
	body => body.getBoundary(),
	'form-data doesn\'t follow the spec and requires special treatment. Use alternative package',
	'https://github.com/node-fetch/node-fetch/issues/1167'
);

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param {any} body Any options.body input
 * @returns {string | null}
 */
const extractContentType = (body, request) => {
	// Body is null or undefined
	if (body === null) {
		return null;
	}

	// Body is string
	if (typeof body === 'string') {
		return 'text/plain;charset=UTF-8';
	}

	// Body is a URLSearchParams
	if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isURLSearchParameters)(body)) {
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	}

	// Body is blob
	if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isBlob)(body)) {
		return body.type || null;
	}

	// Body is a Buffer (Buffer, ArrayBuffer or ArrayBufferView)
	if (node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.isBuffer(body) || node_util__WEBPACK_IMPORTED_MODULE_1__.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
		return null;
	}

	if (body instanceof formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_4__.FormData) {
		return `multipart/form-data; boundary=${request[INTERNALS].boundary}`;
	}

	// Detect form data input from form-data module
	if (body && typeof body.getBoundary === 'function') {
		return `multipart/form-data;boundary=${getNonSpecFormDataBoundary(body)}`;
	}

	// Body is stream - can't really do much about this
	if (body instanceof node_stream__WEBPACK_IMPORTED_MODULE_0__) {
		return null;
	}

	// Body constructor defaults other things to string
	return 'text/plain;charset=UTF-8';
};

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param {any} obj.body Body object from the Body instance.
 * @returns {number | null}
 */
const getTotalBytes = request => {
	const {body} = request[INTERNALS];

	// Body is null or undefined
	if (body === null) {
		return 0;
	}

	// Body is Blob
	if ((0,_utils_is_js__WEBPACK_IMPORTED_MODULE_5__.isBlob)(body)) {
		return body.size;
	}

	// Body is Buffer
	if (node_buffer__WEBPACK_IMPORTED_MODULE_2__.Buffer.isBuffer(body)) {
		return body.length;
	}

	// Detect form data input from form-data module
	if (body && typeof body.getLengthSync === 'function') {
		return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
	}

	// Body is stream
	return null;
};

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param {Stream.Writable} dest The stream to write to.
 * @param obj.body Body object from the Body instance.
 * @returns {Promise<void>}
 */
const writeToStream = async (dest, {body}) => {
	if (body === null) {
		// Body is null
		dest.end();
	} else {
		// Body is stream
		await pipeline(body, dest);
	}
};


/***/ }),

/***/ "./node_modules/node-fetch/src/errors/abort-error.js":
/*!***********************************************************!*\
  !*** ./node_modules/node-fetch/src/errors/abort-error.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbortError": () => (/* binding */ AbortError)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/node-fetch/src/errors/base.js");


/**
 * AbortError interface for cancelled requests
 */
class AbortError extends _base_js__WEBPACK_IMPORTED_MODULE_0__.FetchBaseError {
	constructor(message, type = 'aborted') {
		super(message, type);
	}
}


/***/ }),

/***/ "./node_modules/node-fetch/src/errors/base.js":
/*!****************************************************!*\
  !*** ./node_modules/node-fetch/src/errors/base.js ***!
  \****************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FetchBaseError": () => (/* binding */ FetchBaseError)
/* harmony export */ });
class FetchBaseError extends Error {
	constructor(message, type) {
		super(message);
		// Hide custom error implementation details from end-users
		Error.captureStackTrace(this, this.constructor);

		this.type = type;
	}

	get name() {
		return this.constructor.name;
	}

	get [Symbol.toStringTag]() {
		return this.constructor.name;
	}
}


/***/ }),

/***/ "./node_modules/node-fetch/src/errors/fetch-error.js":
/*!***********************************************************!*\
  !*** ./node_modules/node-fetch/src/errors/fetch-error.js ***!
  \***********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "FetchError": () => (/* binding */ FetchError)
/* harmony export */ });
/* harmony import */ var _base_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./base.js */ "./node_modules/node-fetch/src/errors/base.js");



/**
 * @typedef {{ address?: string, code: string, dest?: string, errno: number, info?: object, message: string, path?: string, port?: number, syscall: string}} SystemError
*/

/**
 * FetchError interface for operational errors
 */
class FetchError extends _base_js__WEBPACK_IMPORTED_MODULE_0__.FetchBaseError {
	/**
	 * @param  {string} message -      Error message for human
	 * @param  {string} [type] -        Error type for machine
	 * @param  {SystemError} [systemError] - For Node.js system error
	 */
	constructor(message, type, systemError) {
		super(message, type);
		// When err.type is `system`, err.erroredSysCall contains system error and err.code contains system error code
		if (systemError) {
			// eslint-disable-next-line no-multi-assign
			this.code = this.errno = systemError.code;
			this.erroredSysCall = systemError.syscall;
		}
	}
}


/***/ }),

/***/ "./node_modules/node-fetch/src/headers.js":
/*!************************************************!*\
  !*** ./node_modules/node-fetch/src/headers.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Headers),
/* harmony export */   "fromRawHeaders": () => (/* binding */ fromRawHeaders)
/* harmony export */ });
/* harmony import */ var node_util__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:util */ "node:util");
/* harmony import */ var node_http__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:http */ "node:http");
/**
 * Headers.js
 *
 * Headers class offers convenient helpers
 */




/* c8 ignore next 9 */
const validateHeaderName = typeof node_http__WEBPACK_IMPORTED_MODULE_1__.validateHeaderName === 'function' ?
	node_http__WEBPACK_IMPORTED_MODULE_1__.validateHeaderName :
	name => {
		if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
			const error = new TypeError(`Header name must be a valid HTTP token [${name}]`);
			Object.defineProperty(error, 'code', {value: 'ERR_INVALID_HTTP_TOKEN'});
			throw error;
		}
	};

/* c8 ignore next 9 */
const validateHeaderValue = typeof node_http__WEBPACK_IMPORTED_MODULE_1__.validateHeaderValue === 'function' ?
	node_http__WEBPACK_IMPORTED_MODULE_1__.validateHeaderValue :
	(name, value) => {
		if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
			const error = new TypeError(`Invalid character in header content ["${name}"]`);
			Object.defineProperty(error, 'code', {value: 'ERR_INVALID_CHAR'});
			throw error;
		}
	};

/**
 * @typedef {Headers | Record<string, string> | Iterable<readonly [string, string]> | Iterable<Iterable<string>>} HeadersInit
 */

/**
 * This Fetch API interface allows you to perform various actions on HTTP request and response headers.
 * These actions include retrieving, setting, adding to, and removing.
 * A Headers object has an associated header list, which is initially empty and consists of zero or more name and value pairs.
 * You can add to this using methods like append() (see Examples.)
 * In all methods of this interface, header names are matched by case-insensitive byte sequence.
 *
 */
class Headers extends URLSearchParams {
	/**
	 * Headers class
	 *
	 * @constructor
	 * @param {HeadersInit} [init] - Response headers
	 */
	constructor(init) {
		// Validate and normalize init object in [name, value(s)][]
		/** @type {string[][]} */
		let result = [];
		if (init instanceof Headers) {
			const raw = init.raw();
			for (const [name, values] of Object.entries(raw)) {
				result.push(...values.map(value => [name, value]));
			}
		} else if (init == null) { // eslint-disable-line no-eq-null, eqeqeq
			// No op
		} else if (typeof init === 'object' && !node_util__WEBPACK_IMPORTED_MODULE_0__.types.isBoxedPrimitive(init)) {
			const method = init[Symbol.iterator];
			// eslint-disable-next-line no-eq-null, eqeqeq
			if (method == null) {
				// Record<ByteString, ByteString>
				result.push(...Object.entries(init));
			} else {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// Sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				result = [...init]
					.map(pair => {
						if (
							typeof pair !== 'object' || node_util__WEBPACK_IMPORTED_MODULE_0__.types.isBoxedPrimitive(pair)
						) {
							throw new TypeError('Each header pair must be an iterable object');
						}

						return [...pair];
					}).map(pair => {
						if (pair.length !== 2) {
							throw new TypeError('Each header pair must be a name/value tuple');
						}

						return [...pair];
					});
			}
		} else {
			throw new TypeError('Failed to construct \'Headers\': The provided value is not of type \'(sequence<sequence<ByteString>> or record<ByteString, ByteString>)');
		}

		// Validate and lowercase
		result =
			result.length > 0 ?
				result.map(([name, value]) => {
					validateHeaderName(name);
					validateHeaderValue(name, String(value));
					return [String(name).toLowerCase(), String(value)];
				}) :
				undefined;

		super(result);

		// Returning a Proxy that will lowercase key names, validate parameters and sort keys
		// eslint-disable-next-line no-constructor-return
		return new Proxy(this, {
			get(target, p, receiver) {
				switch (p) {
					case 'append':
					case 'set':
						return (name, value) => {
							validateHeaderName(name);
							validateHeaderValue(name, String(value));
							return URLSearchParams.prototype[p].call(
								target,
								String(name).toLowerCase(),
								String(value)
							);
						};

					case 'delete':
					case 'has':
					case 'getAll':
						return name => {
							validateHeaderName(name);
							return URLSearchParams.prototype[p].call(
								target,
								String(name).toLowerCase()
							);
						};

					case 'keys':
						return () => {
							target.sort();
							return new Set(URLSearchParams.prototype.keys.call(target)).keys();
						};

					default:
						return Reflect.get(target, p, receiver);
				}
			}
		});
		/* c8 ignore next */
	}

	get [Symbol.toStringTag]() {
		return this.constructor.name;
	}

	toString() {
		return Object.prototype.toString.call(this);
	}

	get(name) {
		const values = this.getAll(name);
		if (values.length === 0) {
			return null;
		}

		let value = values.join(', ');
		if (/^content-encoding$/i.test(name)) {
			value = value.toLowerCase();
		}

		return value;
	}

	forEach(callback, thisArg = undefined) {
		for (const name of this.keys()) {
			Reflect.apply(callback, thisArg, [this.get(name), name, this]);
		}
	}

	* values() {
		for (const name of this.keys()) {
			yield this.get(name);
		}
	}

	/**
	 * @type {() => IterableIterator<[string, string]>}
	 */
	* entries() {
		for (const name of this.keys()) {
			yield [name, this.get(name)];
		}
	}

	[Symbol.iterator]() {
		return this.entries();
	}

	/**
	 * Node-fetch non-spec method
	 * returning all headers and their values as array
	 * @returns {Record<string, string[]>}
	 */
	raw() {
		return [...this.keys()].reduce((result, key) => {
			result[key] = this.getAll(key);
			return result;
		}, {});
	}

	/**
	 * For better console.log(headers) and also to convert Headers into Node.js Request compatible format
	 */
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return [...this.keys()].reduce((result, key) => {
			const values = this.getAll(key);
			// Http.request() only supports string as Host header.
			// This hack makes specifying custom Host header possible.
			if (key === 'host') {
				result[key] = values[0];
			} else {
				result[key] = values.length > 1 ? values : values[0];
			}

			return result;
		}, {});
	}
}

/**
 * Re-shaping object for Web IDL tests
 * Only need to do it for overridden methods
 */
Object.defineProperties(
	Headers.prototype,
	['get', 'entries', 'forEach', 'values'].reduce((result, property) => {
		result[property] = {enumerable: true};
		return result;
	}, {})
);

/**
 * Create a Headers object from an http.IncomingMessage.rawHeaders, ignoring those that do
 * not conform to HTTP grammar productions.
 * @param {import('http').IncomingMessage['rawHeaders']} headers
 */
function fromRawHeaders(headers = []) {
	return new Headers(
		headers
			// Split into pairs
			.reduce((result, value, index, array) => {
				if (index % 2 === 0) {
					result.push(array.slice(index, index + 2));
				}

				return result;
			}, [])
			.filter(([name, value]) => {
				try {
					validateHeaderName(name);
					validateHeaderValue(name, String(value));
					return true;
				} catch {
					return false;
				}
			})

	);
}


/***/ }),

/***/ "./node_modules/node-fetch/src/index.js":
/*!**********************************************!*\
  !*** ./node_modules/node-fetch/src/index.js ***!
  \**********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "AbortError": () => (/* reexport safe */ _errors_abort_error_js__WEBPACK_IMPORTED_MODULE_12__.AbortError),
/* harmony export */   "Blob": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.Blob),
/* harmony export */   "FetchError": () => (/* reexport safe */ _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError),
/* harmony export */   "File": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.File),
/* harmony export */   "FormData": () => (/* reexport safe */ formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_6__.FormData),
/* harmony export */   "Headers": () => (/* reexport safe */ _headers_js__WEBPACK_IMPORTED_MODULE_8__["default"]),
/* harmony export */   "Request": () => (/* reexport safe */ _request_js__WEBPACK_IMPORTED_MODULE_9__["default"]),
/* harmony export */   "Response": () => (/* reexport safe */ _response_js__WEBPACK_IMPORTED_MODULE_10__["default"]),
/* harmony export */   "blobFrom": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.blobFrom),
/* harmony export */   "blobFromSync": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.blobFromSync),
/* harmony export */   "default": () => (/* binding */ fetch),
/* harmony export */   "fileFrom": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.fileFrom),
/* harmony export */   "fileFromSync": () => (/* reexport safe */ fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__.fileFromSync),
/* harmony export */   "isRedirect": () => (/* reexport safe */ _utils_is_redirect_js__WEBPACK_IMPORTED_MODULE_13__.isRedirect)
/* harmony export */ });
/* harmony import */ var node_http__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:http */ "node:http");
/* harmony import */ var node_https__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:https */ "node:https");
/* harmony import */ var node_zlib__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! node:zlib */ "node:zlib");
/* harmony import */ var node_stream__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! node:stream */ "node:stream");
/* harmony import */ var node_buffer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! node:buffer */ "node:buffer");
/* harmony import */ var data_uri_to_buffer__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! data-uri-to-buffer */ "./node_modules/data-uri-to-buffer/dist/index.js");
/* harmony import */ var _body_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./body.js */ "./node_modules/node-fetch/src/body.js");
/* harmony import */ var _response_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./response.js */ "./node_modules/node-fetch/src/response.js");
/* harmony import */ var _headers_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./headers.js */ "./node_modules/node-fetch/src/headers.js");
/* harmony import */ var _request_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./request.js */ "./node_modules/node-fetch/src/request.js");
/* harmony import */ var _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./errors/fetch-error.js */ "./node_modules/node-fetch/src/errors/fetch-error.js");
/* harmony import */ var _errors_abort_error_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./errors/abort-error.js */ "./node_modules/node-fetch/src/errors/abort-error.js");
/* harmony import */ var _utils_is_redirect_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./utils/is-redirect.js */ "./node_modules/node-fetch/src/utils/is-redirect.js");
/* harmony import */ var formdata_polyfill_esm_min_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! formdata-polyfill/esm.min.js */ "./node_modules/formdata-polyfill/esm.min.js");
/* harmony import */ var _utils_is_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! ./utils/is.js */ "./node_modules/node-fetch/src/utils/is.js");
/* harmony import */ var _utils_referrer_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! ./utils/referrer.js */ "./node_modules/node-fetch/src/utils/referrer.js");
/* harmony import */ var fetch_blob_from_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! fetch-blob/from.js */ "./node_modules/fetch-blob/from.js");
/**
 * Index.js
 *
 * a request API compatible with window.fetch
 *
 * All spec algorithm step numbers are based on https://fetch.spec.whatwg.org/commit-snapshots/ae716822cb3a61843226cd090eefc6589446c1d2/.
 */
























const supportedSchemas = new Set(['data:', 'http:', 'https:']);

/**
 * Fetch function
 *
 * @param   {string | URL | import('./request').default} url - Absolute url or Request instance
 * @param   {*} [options_] - Fetch options
 * @return  {Promise<import('./response').default>}
 */
async function fetch(url, options_) {
	return new Promise((resolve, reject) => {
		// Build request object
		const request = new _request_js__WEBPACK_IMPORTED_MODULE_9__["default"](url, options_);
		const {parsedURL, options} = (0,_request_js__WEBPACK_IMPORTED_MODULE_9__.getNodeRequestOptions)(request);
		if (!supportedSchemas.has(parsedURL.protocol)) {
			throw new TypeError(`node-fetch cannot load ${url}. URL scheme "${parsedURL.protocol.replace(/:$/, '')}" is not supported.`);
		}

		if (parsedURL.protocol === 'data:') {
			const data = (0,data_uri_to_buffer__WEBPACK_IMPORTED_MODULE_5__["default"])(request.url);
			const response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](data, {headers: {'Content-Type': data.typeFull}});
			resolve(response);
			return;
		}

		// Wrap http.request into fetch
		const send = (parsedURL.protocol === 'https:' ? node_https__WEBPACK_IMPORTED_MODULE_1__ : node_http__WEBPACK_IMPORTED_MODULE_0__).request;
		const {signal} = request;
		let response = null;

		const abort = () => {
			const error = new _errors_abort_error_js__WEBPACK_IMPORTED_MODULE_12__.AbortError('The operation was aborted.');
			reject(error);
			if (request.body && request.body instanceof node_stream__WEBPACK_IMPORTED_MODULE_3__.Readable) {
				request.body.destroy(error);
			}

			if (!response || !response.body) {
				return;
			}

			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = () => {
			abort();
			finalize();
		};

		// Send request
		const request_ = send(parsedURL.toString(), options);

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		const finalize = () => {
			request_.abort();
			if (signal) {
				signal.removeEventListener('abort', abortAndFinalize);
			}
		};

		request_.on('error', error => {
			reject(new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError(`request to ${request.url} failed, reason: ${error.message}`, 'system', error));
			finalize();
		});

		fixResponseChunkedTransferBadEnding(request_, error => {
			if (response && response.body) {
				response.body.destroy(error);
			}
		});

		/* c8 ignore next 18 */
		if (process.version < 'v14') {
			// Before Node.js 14, pipeline() does not fully support async iterators and does not always
			// properly handle when the socket close/end events are out of order.
			request_.on('socket', s => {
				let endedWithEventsCount;
				s.prependListener('end', () => {
					endedWithEventsCount = s._eventsCount;
				});
				s.prependListener('close', hadError => {
					// if end happened before close but the socket didn't emit an error, do it now
					if (response && endedWithEventsCount < s._eventsCount && !hadError) {
						const error = new Error('Premature close');
						error.code = 'ERR_STREAM_PREMATURE_CLOSE';
						response.body.emit('error', error);
					}
				});
			});
		}

		request_.on('response', response_ => {
			request_.setTimeout(0);
			const headers = (0,_headers_js__WEBPACK_IMPORTED_MODULE_8__.fromRawHeaders)(response_.rawHeaders);

			// HTTP fetch step 5
			if ((0,_utils_is_redirect_js__WEBPACK_IMPORTED_MODULE_13__.isRedirect)(response_.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				let locationURL = null;
				try {
					locationURL = location === null ? null : new URL(location, request.url);
				} catch {
					// error here can only be invalid URL in Location: header
					// do not throw when options.redirect == manual
					// let the user extract the errorneous redirect URL
					if (request.redirect !== 'manual') {
						reject(new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError(`uri requested responds with an invalid redirect URL: ${location}`, 'invalid-redirect'));
						finalize();
						return;
					}
				}

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// Nothing to do
						break;
					case 'follow': {
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOptions = {
							headers: new _headers_js__WEBPACK_IMPORTED_MODULE_8__["default"](request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: (0,_body_js__WEBPACK_IMPORTED_MODULE_14__.clone)(request),
							signal: request.signal,
							size: request.size,
							referrer: request.referrer,
							referrerPolicy: request.referrerPolicy
						};

						// when forwarding sensitive headers like "Authorization",
						// "WWW-Authenticate", and "Cookie" to untrusted targets,
						// headers will be ignored when following a redirect to a domain
						// that is not a subdomain match or exact match of the initial domain.
						// For example, a redirect from "foo.com" to either "foo.com" or "sub.foo.com"
						// will forward the sensitive headers, but a redirect to "bar.com" will not.
						// headers will also be ignored when following a redirect to a domain using
						// a different protocol. For example, a redirect from "https://foo.com" to "http://foo.com"
						// will not forward the sensitive headers
						if (!(0,_utils_is_js__WEBPACK_IMPORTED_MODULE_15__.isDomainOrSubdomain)(request.url, locationURL) || !(0,_utils_is_js__WEBPACK_IMPORTED_MODULE_15__.isSameProtocol)(request.url, locationURL)) {
							for (const name of ['authorization', 'www-authenticate', 'cookie', 'cookie2']) {
								requestOptions.headers.delete(name);
							}
						}

						// HTTP-redirect fetch step 9
						if (response_.statusCode !== 303 && request.body && options_.body instanceof node_stream__WEBPACK_IMPORTED_MODULE_3__.Readable) {
							reject(new _errors_fetch_error_js__WEBPACK_IMPORTED_MODULE_11__.FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (response_.statusCode === 303 || ((response_.statusCode === 301 || response_.statusCode === 302) && request.method === 'POST')) {
							requestOptions.method = 'GET';
							requestOptions.body = undefined;
							requestOptions.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 14
						const responseReferrerPolicy = (0,_utils_referrer_js__WEBPACK_IMPORTED_MODULE_16__.parseReferrerPolicyFromHeader)(headers);
						if (responseReferrerPolicy) {
							requestOptions.referrerPolicy = responseReferrerPolicy;
						}

						// HTTP-redirect fetch step 15
						resolve(fetch(new _request_js__WEBPACK_IMPORTED_MODULE_9__["default"](locationURL, requestOptions)));
						finalize();
						return;
					}

					default:
						return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
				}
			}

			// Prepare response
			if (signal) {
				response_.once('end', () => {
					signal.removeEventListener('abort', abortAndFinalize);
				});
			}

			let body = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(response_, new node_stream__WEBPACK_IMPORTED_MODULE_3__.PassThrough(), error => {
				if (error) {
					reject(error);
				}
			});
			// see https://github.com/nodejs/node/pull/29376
			/* c8 ignore next 3 */
			if (process.version < 'v12.10') {
				response_.on('aborted', abortAndFinalize);
			}

			const responseOptions = {
				url: request.url,
				status: response_.statusCode,
				statusText: response_.statusMessage,
				headers,
				size: request.size,
				counter: request.counter,
				highWaterMark: request.highWaterMark
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
				response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: node_zlib__WEBPACK_IMPORTED_MODULE_2__.Z_SYNC_FLUSH,
				finishFlush: node_zlib__WEBPACK_IMPORTED_MODULE_2__.Z_SYNC_FLUSH
			};

			// For gzip
			if (codings === 'gzip' || codings === 'x-gzip') {
				body = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(body, node_zlib__WEBPACK_IMPORTED_MODULE_2__.createGunzip(zlibOptions), error => {
					if (error) {
						reject(error);
					}
				});
				response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
				resolve(response);
				return;
			}

			// For deflate
			if (codings === 'deflate' || codings === 'x-deflate') {
				// Handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(response_, new node_stream__WEBPACK_IMPORTED_MODULE_3__.PassThrough(), error => {
					if (error) {
						reject(error);
					}
				});
				raw.once('data', chunk => {
					// See http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(body, node_zlib__WEBPACK_IMPORTED_MODULE_2__.createInflate(), error => {
							if (error) {
								reject(error);
							}
						});
					} else {
						body = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(body, node_zlib__WEBPACK_IMPORTED_MODULE_2__.createInflateRaw(), error => {
							if (error) {
								reject(error);
							}
						});
					}

					response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
					resolve(response);
				});
				raw.once('end', () => {
					// Some old IIS servers return zero-length OK deflate responses, so
					// 'data' is never emitted. See https://github.com/node-fetch/node-fetch/pull/903
					if (!response) {
						response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
						resolve(response);
					}
				});
				return;
			}

			// For br
			if (codings === 'br') {
				body = (0,node_stream__WEBPACK_IMPORTED_MODULE_3__.pipeline)(body, node_zlib__WEBPACK_IMPORTED_MODULE_2__.createBrotliDecompress(), error => {
					if (error) {
						reject(error);
					}
				});
				response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
				resolve(response);
				return;
			}

			// Otherwise, use response as-is
			response = new _response_js__WEBPACK_IMPORTED_MODULE_10__["default"](body, responseOptions);
			resolve(response);
		});

		// eslint-disable-next-line promise/prefer-await-to-then
		(0,_body_js__WEBPACK_IMPORTED_MODULE_14__.writeToStream)(request_, request).catch(reject);
	});
}

function fixResponseChunkedTransferBadEnding(request, errorCallback) {
	const LAST_CHUNK = node_buffer__WEBPACK_IMPORTED_MODULE_4__.Buffer.from('0\r\n\r\n');

	let isChunkedTransfer = false;
	let properLastChunkReceived = false;
	let previousChunk;

	request.on('response', response => {
		const {headers} = response;
		isChunkedTransfer = headers['transfer-encoding'] === 'chunked' && !headers['content-length'];
	});

	request.on('socket', socket => {
		const onSocketClose = () => {
			if (isChunkedTransfer && !properLastChunkReceived) {
				const error = new Error('Premature close');
				error.code = 'ERR_STREAM_PREMATURE_CLOSE';
				errorCallback(error);
			}
		};

		const onData = buf => {
			properLastChunkReceived = node_buffer__WEBPACK_IMPORTED_MODULE_4__.Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;

			// Sometimes final 0-length chunk and end of message code are in separate packets
			if (!properLastChunkReceived && previousChunk) {
				properLastChunkReceived = (
					node_buffer__WEBPACK_IMPORTED_MODULE_4__.Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 &&
					node_buffer__WEBPACK_IMPORTED_MODULE_4__.Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0
				);
			}

			previousChunk = buf;
		};

		socket.prependListener('close', onSocketClose);
		socket.on('data', onData);

		request.on('close', () => {
			socket.removeListener('close', onSocketClose);
			socket.removeListener('data', onData);
		});
	});
}


/***/ }),

/***/ "./node_modules/node-fetch/src/request.js":
/*!************************************************!*\
  !*** ./node_modules/node-fetch/src/request.js ***!
  \************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Request),
/* harmony export */   "getNodeRequestOptions": () => (/* binding */ getNodeRequestOptions)
/* harmony export */ });
/* harmony import */ var node_url__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:url */ "node:url");
/* harmony import */ var node_util__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! node:util */ "node:util");
/* harmony import */ var _headers_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./headers.js */ "./node_modules/node-fetch/src/headers.js");
/* harmony import */ var _body_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./body.js */ "./node_modules/node-fetch/src/body.js");
/* harmony import */ var _utils_is_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils/is.js */ "./node_modules/node-fetch/src/utils/is.js");
/* harmony import */ var _utils_get_search_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./utils/get-search.js */ "./node_modules/node-fetch/src/utils/get-search.js");
/* harmony import */ var _utils_referrer_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./utils/referrer.js */ "./node_modules/node-fetch/src/utils/referrer.js");
/**
 * Request.js
 *
 * Request class contains server only options
 *
 * All spec algorithm step numbers are based on https://fetch.spec.whatwg.org/commit-snapshots/ae716822cb3a61843226cd090eefc6589446c1d2/.
 */









const INTERNALS = Symbol('Request internals');

/**
 * Check if `obj` is an instance of Request.
 *
 * @param  {*} object
 * @return {boolean}
 */
const isRequest = object => {
	return (
		typeof object === 'object' &&
		typeof object[INTERNALS] === 'object'
	);
};

const doBadDataWarn = (0,node_util__WEBPACK_IMPORTED_MODULE_1__.deprecate)(() => {},
	'.data is not a valid RequestInit property, use .body instead',
	'https://github.com/node-fetch/node-fetch/issues/1000 (request)');

/**
 * Request class
 *
 * Ref: https://fetch.spec.whatwg.org/#request-class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request extends _body_js__WEBPACK_IMPORTED_MODULE_2__["default"] {
	constructor(input, init = {}) {
		let parsedURL;

		// Normalize input and force URL to be encoded as UTF-8 (https://github.com/node-fetch/node-fetch/issues/245)
		if (isRequest(input)) {
			parsedURL = new URL(input.url);
		} else {
			parsedURL = new URL(input);
			input = {};
		}

		if (parsedURL.username !== '' || parsedURL.password !== '') {
			throw new TypeError(`${parsedURL} is an url with embedded credentials.`);
		}

		let method = init.method || input.method || 'GET';
		if (/^(delete|get|head|options|post|put)$/i.test(method)) {
			method = method.toUpperCase();
		}

		if (!isRequest(init) && 'data' in init) {
			doBadDataWarn();
		}

		// eslint-disable-next-line no-eq-null, eqeqeq
		if ((init.body != null || (isRequest(input) && input.body !== null)) &&
			(method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		const inputBody = init.body ?
			init.body :
			(isRequest(input) && input.body !== null ?
				(0,_body_js__WEBPACK_IMPORTED_MODULE_2__.clone)(input) :
				null);

		super(inputBody, {
			size: init.size || input.size || 0
		});

		const headers = new _headers_js__WEBPACK_IMPORTED_MODULE_3__["default"](init.headers || input.headers || {});

		if (inputBody !== null && !headers.has('Content-Type')) {
			const contentType = (0,_body_js__WEBPACK_IMPORTED_MODULE_2__.extractContentType)(inputBody, this);
			if (contentType) {
				headers.set('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ?
			input.signal :
			null;
		if ('signal' in init) {
			signal = init.signal;
		}

		// eslint-disable-next-line no-eq-null, eqeqeq
		if (signal != null && !(0,_utils_is_js__WEBPACK_IMPORTED_MODULE_4__.isAbortSignal)(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal or EventTarget');
		}

		// ??5.4, Request constructor steps, step 15.1
		// eslint-disable-next-line no-eq-null, eqeqeq
		let referrer = init.referrer == null ? input.referrer : init.referrer;
		if (referrer === '') {
			// ??5.4, Request constructor steps, step 15.2
			referrer = 'no-referrer';
		} else if (referrer) {
			// ??5.4, Request constructor steps, step 15.3.1, 15.3.2
			const parsedReferrer = new URL(referrer);
			// ??5.4, Request constructor steps, step 15.3.3, 15.3.4
			referrer = /^about:(\/\/)?client$/.test(parsedReferrer) ? 'client' : parsedReferrer;
		} else {
			referrer = undefined;
		}

		this[INTERNALS] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal,
			referrer
		};

		// Node-fetch-only options
		this.follow = init.follow === undefined ? (input.follow === undefined ? 20 : input.follow) : init.follow;
		this.compress = init.compress === undefined ? (input.compress === undefined ? true : input.compress) : init.compress;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
		this.highWaterMark = init.highWaterMark || input.highWaterMark || 16384;
		this.insecureHTTPParser = init.insecureHTTPParser || input.insecureHTTPParser || false;

		// ??5.4, Request constructor steps, step 16.
		// Default is empty string per https://fetch.spec.whatwg.org/#concept-request-referrer-policy
		this.referrerPolicy = init.referrerPolicy || input.referrerPolicy || '';
	}

	/** @returns {string} */
	get method() {
		return this[INTERNALS].method;
	}

	/** @returns {string} */
	get url() {
		return (0,node_url__WEBPACK_IMPORTED_MODULE_0__.format)(this[INTERNALS].parsedURL);
	}

	/** @returns {Headers} */
	get headers() {
		return this[INTERNALS].headers;
	}

	get redirect() {
		return this[INTERNALS].redirect;
	}

	/** @returns {AbortSignal} */
	get signal() {
		return this[INTERNALS].signal;
	}

	// https://fetch.spec.whatwg.org/#dom-request-referrer
	get referrer() {
		if (this[INTERNALS].referrer === 'no-referrer') {
			return '';
		}

		if (this[INTERNALS].referrer === 'client') {
			return 'about:client';
		}

		if (this[INTERNALS].referrer) {
			return this[INTERNALS].referrer.toString();
		}

		return undefined;
	}

	get referrerPolicy() {
		return this[INTERNALS].referrerPolicy;
	}

	set referrerPolicy(referrerPolicy) {
		this[INTERNALS].referrerPolicy = (0,_utils_referrer_js__WEBPACK_IMPORTED_MODULE_5__.validateReferrerPolicy)(referrerPolicy);
	}

	/**
	 * Clone this request
	 *
	 * @return  Request
	 */
	clone() {
		return new Request(this);
	}

	get [Symbol.toStringTag]() {
		return 'Request';
	}
}

Object.defineProperties(Request.prototype, {
	method: {enumerable: true},
	url: {enumerable: true},
	headers: {enumerable: true},
	redirect: {enumerable: true},
	clone: {enumerable: true},
	signal: {enumerable: true},
	referrer: {enumerable: true},
	referrerPolicy: {enumerable: true}
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param {Request} request - A Request instance
 * @return The options object to be passed to http.request
 */
const getNodeRequestOptions = request => {
	const {parsedURL} = request[INTERNALS];
	const headers = new _headers_js__WEBPACK_IMPORTED_MODULE_3__["default"](request[INTERNALS].headers);

	// Fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body === null && /^(post|put)$/i.test(request.method)) {
		contentLengthValue = '0';
	}

	if (request.body !== null) {
		const totalBytes = (0,_body_js__WEBPACK_IMPORTED_MODULE_2__.getTotalBytes)(request);
		// Set Content-Length if totalBytes is a number (that is not NaN)
		if (typeof totalBytes === 'number' && !Number.isNaN(totalBytes)) {
			contentLengthValue = String(totalBytes);
		}
	}

	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// 4.1. Main fetch, step 2.6
	// > If request's referrer policy is the empty string, then set request's referrer policy to the
	// > default referrer policy.
	if (request.referrerPolicy === '') {
		request.referrerPolicy = _utils_referrer_js__WEBPACK_IMPORTED_MODULE_5__.DEFAULT_REFERRER_POLICY;
	}

	// 4.1. Main fetch, step 2.7
	// > If request's referrer is not "no-referrer", set request's referrer to the result of invoking
	// > determine request's referrer.
	if (request.referrer && request.referrer !== 'no-referrer') {
		request[INTERNALS].referrer = (0,_utils_referrer_js__WEBPACK_IMPORTED_MODULE_5__.determineRequestsReferrer)(request);
	} else {
		request[INTERNALS].referrer = 'no-referrer';
	}

	// 4.5. HTTP-network-or-cache fetch, step 6.9
	// > If httpRequest's referrer is a URL, then append `Referer`/httpRequest's referrer, serialized
	// >  and isomorphic encoded, to httpRequest's header list.
	if (request[INTERNALS].referrer instanceof URL) {
		headers.set('Referer', request.referrer);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip, deflate, br');
	}

	let {agent} = request;
	if (typeof agent === 'function') {
		agent = agent(parsedURL);
	}

	if (!headers.has('Connection') && !agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	const search = (0,_utils_get_search_js__WEBPACK_IMPORTED_MODULE_6__.getSearch)(parsedURL);

	// Pass the full URL directly to request(), but overwrite the following
	// options:
	const options = {
		// Overwrite search to retain trailing ? (issue #776)
		path: parsedURL.pathname + search,
		// The following options are not expressed in the URL
		method: request.method,
		headers: headers[Symbol.for('nodejs.util.inspect.custom')](),
		insecureHTTPParser: request.insecureHTTPParser,
		agent
	};

	return {
		/** @type {URL} */
		parsedURL,
		options
	};
};


/***/ }),

/***/ "./node_modules/node-fetch/src/response.js":
/*!*************************************************!*\
  !*** ./node_modules/node-fetch/src/response.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Response)
/* harmony export */ });
/* harmony import */ var _headers_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./headers.js */ "./node_modules/node-fetch/src/headers.js");
/* harmony import */ var _body_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./body.js */ "./node_modules/node-fetch/src/body.js");
/* harmony import */ var _utils_is_redirect_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/is-redirect.js */ "./node_modules/node-fetch/src/utils/is-redirect.js");
/**
 * Response.js
 *
 * Response class provides content decoding
 */





const INTERNALS = Symbol('Response internals');

/**
 * Response class
 *
 * Ref: https://fetch.spec.whatwg.org/#response-class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response extends _body_js__WEBPACK_IMPORTED_MODULE_0__["default"] {
	constructor(body = null, options = {}) {
		super(body, options);

		// eslint-disable-next-line no-eq-null, eqeqeq, no-negated-condition
		const status = options.status != null ? options.status : 200;

		const headers = new _headers_js__WEBPACK_IMPORTED_MODULE_1__["default"](options.headers);

		if (body !== null && !headers.has('Content-Type')) {
			const contentType = (0,_body_js__WEBPACK_IMPORTED_MODULE_0__.extractContentType)(body, this);
			if (contentType) {
				headers.append('Content-Type', contentType);
			}
		}

		this[INTERNALS] = {
			type: 'default',
			url: options.url,
			status,
			statusText: options.statusText || '',
			headers,
			counter: options.counter,
			highWaterMark: options.highWaterMark
		};
	}

	get type() {
		return this[INTERNALS].type;
	}

	get url() {
		return this[INTERNALS].url || '';
	}

	get status() {
		return this[INTERNALS].status;
	}

	/**
	 * Convenience property representing if the request ended normally
	 */
	get ok() {
		return this[INTERNALS].status >= 200 && this[INTERNALS].status < 300;
	}

	get redirected() {
		return this[INTERNALS].counter > 0;
	}

	get statusText() {
		return this[INTERNALS].statusText;
	}

	get headers() {
		return this[INTERNALS].headers;
	}

	get highWaterMark() {
		return this[INTERNALS].highWaterMark;
	}

	/**
	 * Clone this response
	 *
	 * @return  Response
	 */
	clone() {
		return new Response((0,_body_js__WEBPACK_IMPORTED_MODULE_0__.clone)(this, this.highWaterMark), {
			type: this.type,
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok,
			redirected: this.redirected,
			size: this.size,
			highWaterMark: this.highWaterMark
		});
	}

	/**
	 * @param {string} url    The URL that the new response is to originate from.
	 * @param {number} status An optional status code for the response (e.g., 302.)
	 * @returns {Response}    A Response object.
	 */
	static redirect(url, status = 302) {
		if (!(0,_utils_is_redirect_js__WEBPACK_IMPORTED_MODULE_2__.isRedirect)(status)) {
			throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
		}

		return new Response(null, {
			headers: {
				location: new URL(url).toString()
			},
			status
		});
	}

	static error() {
		const response = new Response(null, {status: 0, statusText: ''});
		response[INTERNALS].type = 'error';
		return response;
	}

	get [Symbol.toStringTag]() {
		return 'Response';
	}
}

Object.defineProperties(Response.prototype, {
	type: {enumerable: true},
	url: {enumerable: true},
	status: {enumerable: true},
	ok: {enumerable: true},
	redirected: {enumerable: true},
	statusText: {enumerable: true},
	headers: {enumerable: true},
	clone: {enumerable: true}
});


/***/ }),

/***/ "./node_modules/node-fetch/src/utils/get-search.js":
/*!*********************************************************!*\
  !*** ./node_modules/node-fetch/src/utils/get-search.js ***!
  \*********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getSearch": () => (/* binding */ getSearch)
/* harmony export */ });
const getSearch = parsedURL => {
	if (parsedURL.search) {
		return parsedURL.search;
	}

	const lastOffset = parsedURL.href.length - 1;
	const hash = parsedURL.hash || (parsedURL.href[lastOffset] === '#' ? '#' : '');
	return parsedURL.href[lastOffset - hash.length] === '?' ? '?' : '';
};


/***/ }),

/***/ "./node_modules/node-fetch/src/utils/is-redirect.js":
/*!**********************************************************!*\
  !*** ./node_modules/node-fetch/src/utils/is-redirect.js ***!
  \**********************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isRedirect": () => (/* binding */ isRedirect)
/* harmony export */ });
const redirectStatus = new Set([301, 302, 303, 307, 308]);

/**
 * Redirect code matching
 *
 * @param {number} code - Status code
 * @return {boolean}
 */
const isRedirect = code => {
	return redirectStatus.has(code);
};


/***/ }),

/***/ "./node_modules/node-fetch/src/utils/is.js":
/*!*************************************************!*\
  !*** ./node_modules/node-fetch/src/utils/is.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "isAbortSignal": () => (/* binding */ isAbortSignal),
/* harmony export */   "isBlob": () => (/* binding */ isBlob),
/* harmony export */   "isDomainOrSubdomain": () => (/* binding */ isDomainOrSubdomain),
/* harmony export */   "isSameProtocol": () => (/* binding */ isSameProtocol),
/* harmony export */   "isURLSearchParameters": () => (/* binding */ isURLSearchParameters)
/* harmony export */ });
/**
 * Is.js
 *
 * Object type checks.
 */

const NAME = Symbol.toStringTag;

/**
 * Check if `obj` is a URLSearchParams object
 * ref: https://github.com/node-fetch/node-fetch/issues/296#issuecomment-307598143
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isURLSearchParameters = object => {
	return (
		typeof object === 'object' &&
		typeof object.append === 'function' &&
		typeof object.delete === 'function' &&
		typeof object.get === 'function' &&
		typeof object.getAll === 'function' &&
		typeof object.has === 'function' &&
		typeof object.set === 'function' &&
		typeof object.sort === 'function' &&
		object[NAME] === 'URLSearchParams'
	);
};

/**
 * Check if `object` is a W3C `Blob` object (which `File` inherits from)
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isBlob = object => {
	return (
		object &&
		typeof object === 'object' &&
		typeof object.arrayBuffer === 'function' &&
		typeof object.type === 'string' &&
		typeof object.stream === 'function' &&
		typeof object.constructor === 'function' &&
		/^(Blob|File)$/.test(object[NAME])
	);
};

/**
 * Check if `obj` is an instance of AbortSignal.
 * @param {*} object - Object to check for
 * @return {boolean}
 */
const isAbortSignal = object => {
	return (
		typeof object === 'object' && (
			object[NAME] === 'AbortSignal' ||
			object[NAME] === 'EventTarget'
		)
	);
};

/**
 * isDomainOrSubdomain reports whether sub is a subdomain (or exact match) of
 * the parent domain.
 *
 * Both domains must already be in canonical form.
 * @param {string|URL} original
 * @param {string|URL} destination
 */
const isDomainOrSubdomain = (destination, original) => {
	const orig = new URL(original).hostname;
	const dest = new URL(destination).hostname;

	return orig === dest || orig.endsWith(`.${dest}`);
};

/**
 * isSameProtocol reports whether the two provided URLs use the same protocol.
 *
 * Both domains must already be in canonical form.
 * @param {string|URL} original
 * @param {string|URL} destination
 */
const isSameProtocol = (destination, original) => {
	const orig = new URL(original).protocol;
	const dest = new URL(destination).protocol;

	return orig === dest;
};


/***/ }),

/***/ "./node_modules/node-fetch/src/utils/referrer.js":
/*!*******************************************************!*\
  !*** ./node_modules/node-fetch/src/utils/referrer.js ***!
  \*******************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEFAULT_REFERRER_POLICY": () => (/* binding */ DEFAULT_REFERRER_POLICY),
/* harmony export */   "ReferrerPolicy": () => (/* binding */ ReferrerPolicy),
/* harmony export */   "determineRequestsReferrer": () => (/* binding */ determineRequestsReferrer),
/* harmony export */   "isOriginPotentiallyTrustworthy": () => (/* binding */ isOriginPotentiallyTrustworthy),
/* harmony export */   "isUrlPotentiallyTrustworthy": () => (/* binding */ isUrlPotentiallyTrustworthy),
/* harmony export */   "parseReferrerPolicyFromHeader": () => (/* binding */ parseReferrerPolicyFromHeader),
/* harmony export */   "stripURLForUseAsAReferrer": () => (/* binding */ stripURLForUseAsAReferrer),
/* harmony export */   "validateReferrerPolicy": () => (/* binding */ validateReferrerPolicy)
/* harmony export */ });
/* harmony import */ var node_net__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! node:net */ "node:net");


/**
 * @external URL
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URL|URL}
 */

/**
 * @module utils/referrer
 * @private
 */

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#strip-url|Referrer Policy ??8.4. Strip url for use as a referrer}
 * @param {string} URL
 * @param {boolean} [originOnly=false]
 */
function stripURLForUseAsAReferrer(url, originOnly = false) {
	// 1. If url is null, return no referrer.
	if (url == null) { // eslint-disable-line no-eq-null, eqeqeq
		return 'no-referrer';
	}

	url = new URL(url);

	// 2. If url's scheme is a local scheme, then return no referrer.
	if (/^(about|blob|data):$/.test(url.protocol)) {
		return 'no-referrer';
	}

	// 3. Set url's username to the empty string.
	url.username = '';

	// 4. Set url's password to null.
	// Note: `null` appears to be a mistake as this actually results in the password being `"null"`.
	url.password = '';

	// 5. Set url's fragment to null.
	// Note: `null` appears to be a mistake as this actually results in the fragment being `"#null"`.
	url.hash = '';

	// 6. If the origin-only flag is true, then:
	if (originOnly) {
		// 6.1. Set url's path to null.
		// Note: `null` appears to be a mistake as this actually results in the path being `"/null"`.
		url.pathname = '';

		// 6.2. Set url's query to null.
		// Note: `null` appears to be a mistake as this actually results in the query being `"?null"`.
		url.search = '';
	}

	// 7. Return url.
	return url;
}

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#enumdef-referrerpolicy|enum ReferrerPolicy}
 */
const ReferrerPolicy = new Set([
	'',
	'no-referrer',
	'no-referrer-when-downgrade',
	'same-origin',
	'origin',
	'strict-origin',
	'origin-when-cross-origin',
	'strict-origin-when-cross-origin',
	'unsafe-url'
]);

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#default-referrer-policy|default referrer policy}
 */
const DEFAULT_REFERRER_POLICY = 'strict-origin-when-cross-origin';

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#referrer-policies|Referrer Policy ??3. Referrer Policies}
 * @param {string} referrerPolicy
 * @returns {string} referrerPolicy
 */
function validateReferrerPolicy(referrerPolicy) {
	if (!ReferrerPolicy.has(referrerPolicy)) {
		throw new TypeError(`Invalid referrerPolicy: ${referrerPolicy}`);
	}

	return referrerPolicy;
}

/**
 * @see {@link https://w3c.github.io/webappsec-secure-contexts/#is-origin-trustworthy|Referrer Policy ??3.2. Is origin potentially trustworthy?}
 * @param {external:URL} url
 * @returns `true`: "Potentially Trustworthy", `false`: "Not Trustworthy"
 */
function isOriginPotentiallyTrustworthy(url) {
	// 1. If origin is an opaque origin, return "Not Trustworthy".
	// Not applicable

	// 2. Assert: origin is a tuple origin.
	// Not for implementations

	// 3. If origin's scheme is either "https" or "wss", return "Potentially Trustworthy".
	if (/^(http|ws)s:$/.test(url.protocol)) {
		return true;
	}

	// 4. If origin's host component matches one of the CIDR notations 127.0.0.0/8 or ::1/128 [RFC4632], return "Potentially Trustworthy".
	const hostIp = url.host.replace(/(^\[)|(]$)/g, '');
	const hostIPVersion = (0,node_net__WEBPACK_IMPORTED_MODULE_0__.isIP)(hostIp);

	if (hostIPVersion === 4 && /^127\./.test(hostIp)) {
		return true;
	}

	if (hostIPVersion === 6 && /^(((0+:){7})|(::(0+:){0,6}))0*1$/.test(hostIp)) {
		return true;
	}

	// 5. If origin's host component is "localhost" or falls within ".localhost", and the user agent conforms to the name resolution rules in [let-localhost-be-localhost], return "Potentially Trustworthy".
	// We are returning FALSE here because we cannot ensure conformance to
	// let-localhost-be-loalhost (https://tools.ietf.org/html/draft-west-let-localhost-be-localhost)
	if (url.host === 'localhost' || url.host.endsWith('.localhost')) {
		return false;
	}

	// 6. If origin's scheme component is file, return "Potentially Trustworthy".
	if (url.protocol === 'file:') {
		return true;
	}

	// 7. If origin's scheme component is one which the user agent considers to be authenticated, return "Potentially Trustworthy".
	// Not supported

	// 8. If origin has been configured as a trustworthy origin, return "Potentially Trustworthy".
	// Not supported

	// 9. Return "Not Trustworthy".
	return false;
}

/**
 * @see {@link https://w3c.github.io/webappsec-secure-contexts/#is-url-trustworthy|Referrer Policy ??3.3. Is url potentially trustworthy?}
 * @param {external:URL} url
 * @returns `true`: "Potentially Trustworthy", `false`: "Not Trustworthy"
 */
function isUrlPotentiallyTrustworthy(url) {
	// 1. If url is "about:blank" or "about:srcdoc", return "Potentially Trustworthy".
	if (/^about:(blank|srcdoc)$/.test(url)) {
		return true;
	}

	// 2. If url's scheme is "data", return "Potentially Trustworthy".
	if (url.protocol === 'data:') {
		return true;
	}

	// Note: The origin of blob: and filesystem: URLs is the origin of the context in which they were
	// created. Therefore, blobs created in a trustworthy origin will themselves be potentially
	// trustworthy.
	if (/^(blob|filesystem):$/.test(url.protocol)) {
		return true;
	}

	// 3. Return the result of executing ??3.2 Is origin potentially trustworthy? on url's origin.
	return isOriginPotentiallyTrustworthy(url);
}

/**
 * Modifies the referrerURL to enforce any extra security policy considerations.
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy ??8.3. Determine request's Referrer}, step 7
 * @callback module:utils/referrer~referrerURLCallback
 * @param {external:URL} referrerURL
 * @returns {external:URL} modified referrerURL
 */

/**
 * Modifies the referrerOrigin to enforce any extra security policy considerations.
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy ??8.3. Determine request's Referrer}, step 7
 * @callback module:utils/referrer~referrerOriginCallback
 * @param {external:URL} referrerOrigin
 * @returns {external:URL} modified referrerOrigin
 */

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#determine-requests-referrer|Referrer Policy ??8.3. Determine request's Referrer}
 * @param {Request} request
 * @param {object} o
 * @param {module:utils/referrer~referrerURLCallback} o.referrerURLCallback
 * @param {module:utils/referrer~referrerOriginCallback} o.referrerOriginCallback
 * @returns {external:URL} Request's referrer
 */
function determineRequestsReferrer(request, {referrerURLCallback, referrerOriginCallback} = {}) {
	// There are 2 notes in the specification about invalid pre-conditions.  We return null, here, for
	// these cases:
	// > Note: If request's referrer is "no-referrer", Fetch will not call into this algorithm.
	// > Note: If request's referrer policy is the empty string, Fetch will not call into this
	// > algorithm.
	if (request.referrer === 'no-referrer' || request.referrerPolicy === '') {
		return null;
	}

	// 1. Let policy be request's associated referrer policy.
	const policy = request.referrerPolicy;

	// 2. Let environment be request's client.
	// not applicable to node.js

	// 3. Switch on request's referrer:
	if (request.referrer === 'about:client') {
		return 'no-referrer';
	}

	// "a URL": Let referrerSource be request's referrer.
	const referrerSource = request.referrer;

	// 4. Let request's referrerURL be the result of stripping referrerSource for use as a referrer.
	let referrerURL = stripURLForUseAsAReferrer(referrerSource);

	// 5. Let referrerOrigin be the result of stripping referrerSource for use as a referrer, with the
	//    origin-only flag set to true.
	let referrerOrigin = stripURLForUseAsAReferrer(referrerSource, true);

	// 6. If the result of serializing referrerURL is a string whose length is greater than 4096, set
	//    referrerURL to referrerOrigin.
	if (referrerURL.toString().length > 4096) {
		referrerURL = referrerOrigin;
	}

	// 7. The user agent MAY alter referrerURL or referrerOrigin at this point to enforce arbitrary
	//    policy considerations in the interests of minimizing data leakage. For example, the user
	//    agent could strip the URL down to an origin, modify its host, replace it with an empty
	//    string, etc.
	if (referrerURLCallback) {
		referrerURL = referrerURLCallback(referrerURL);
	}

	if (referrerOriginCallback) {
		referrerOrigin = referrerOriginCallback(referrerOrigin);
	}

	// 8.Execute the statements corresponding to the value of policy:
	const currentURL = new URL(request.url);

	switch (policy) {
		case 'no-referrer':
			return 'no-referrer';

		case 'origin':
			return referrerOrigin;

		case 'unsafe-url':
			return referrerURL;

		case 'strict-origin':
			// 1. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
				return 'no-referrer';
			}

			// 2. Return referrerOrigin.
			return referrerOrigin.toString();

		case 'strict-origin-when-cross-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL;
			}

			// 2. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
				return 'no-referrer';
			}

			// 3. Return referrerOrigin.
			return referrerOrigin;

		case 'same-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL;
			}

			// 2. Return no referrer.
			return 'no-referrer';

		case 'origin-when-cross-origin':
			// 1. If the origin of referrerURL and the origin of request's current URL are the same, then
			//    return referrerURL.
			if (referrerURL.origin === currentURL.origin) {
				return referrerURL;
			}

			// Return referrerOrigin.
			return referrerOrigin;

		case 'no-referrer-when-downgrade':
			// 1. If referrerURL is a potentially trustworthy URL and request's current URL is not a
			//    potentially trustworthy URL, then return no referrer.
			if (isUrlPotentiallyTrustworthy(referrerURL) && !isUrlPotentiallyTrustworthy(currentURL)) {
				return 'no-referrer';
			}

			// 2. Return referrerURL.
			return referrerURL;

		default:
			throw new TypeError(`Invalid referrerPolicy: ${policy}`);
	}
}

/**
 * @see {@link https://w3c.github.io/webappsec-referrer-policy/#parse-referrer-policy-from-header|Referrer Policy ??8.1. Parse a referrer policy from a Referrer-Policy header}
 * @param {Headers} headers Response headers
 * @returns {string} policy
 */
function parseReferrerPolicyFromHeader(headers) {
	// 1. Let policy-tokens be the result of extracting header list values given `Referrer-Policy`
	//    and response???s header list.
	const policyTokens = (headers.get('referrer-policy') || '').split(/[,\s]+/);

	// 2. Let policy be the empty string.
	let policy = '';

	// 3. For each token in policy-tokens, if token is a referrer policy and token is not the empty
	//    string, then set policy to token.
	// Note: This algorithm loops over multiple policy values to allow deployment of new policy
	// values with fallbacks for older user agents, as described in ?? 11.1 Unknown Policy Values.
	for (const token of policyTokens) {
		if (token && ReferrerPolicy.has(token)) {
			policy = token;
		}
	}

	// 4. Return policy.
	return policy;
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".extension.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			"main": 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__webpack_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __webpack_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.ts");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map