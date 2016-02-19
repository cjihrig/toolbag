'use strict';

const FunctionOrigin = require('function-origin');
const Merge = require('lodash.merge');


module.exports = { getActiveRequests };


const CONTEXT_TYPES = {
  unknow: { name: 'unknown' },
  AccessContext: { name: 'access' },
  ChmodContext: { name: 'chmod' },
  ChownContext: { name: 'chown' },
  CloseContext: { name: 'close' },
  ExistsContext: { name: 'exists' },
  FChmodContext: { name: 'fchmod' },
  FChownContext: { name: 'fchown' },
  FDatasyncContext: { name: 'fdatasync' },
  FStatContext: { name: 'fstat' },
  FSyncContext: { name: 'fsync' },
  FTruncateContext: { name: 'ftruncate' },
  FUtimesContext: { name: 'futimes' },
  LinkContext: { name: 'link' },
  LStatContext: { name: 'lstat' },
  MkdirContext: { name: 'mkdir' },
  OpenContext: { name: 'open' },
  ReadContext: { name: 'read' },
  ReaddirContext: { name: 'readdir' },
  ReadFileContext: { name: 'readFile' },
  ReadlinkContext: { name: 'readlink' },
  RmdirContext: { name: 'rmdir' },
  StatContext: { name: 'stat' },
  SymlinkContext: { name: 'symlink' },
  TruncateContext: { name: 'truncate' },
  UnlinkContext: { name: 'unlink' },
  UtimesContext: { name: 'utimes' },
  WriteContext: { name: 'write' }
};


function functionInfo (fn) {
  if (typeof fn !== 'function') {
    return null;
  }

  const location = FunctionOrigin(fn);

  if (location) {
    // V8 uses zero based lines
    location.line++;
  }

  let name;
  let anonymous;

  if (fn.name && fn.name.length) {
    name = fn.name;
    anonymous = false;
  } else if (location &&
             location.inferredName &&
             location.inferredName.length) {
    name = location.inferredName;
    anonymous = false;
  } else {
    name = '__unknown_function_name__';
    anonymous = true;
  }

  return { name, location, anonymous };
}


function getActiveRequests () {
  const activeRequests = process._getActiveRequests();
  const results = new Array(activeRequests.length);

  for (let i = 0; i < activeRequests.length; i++) {
    const req = activeRequests[i];
    const type = req.constructor.name;
    const result = Merge({}, req, { type });
    const context = result.context;

    results[i] = result;

    if (context === null || typeof context !== 'object') {
      continue;
    }

    const contextType = Object.getPrototypeOf(context).constructor.name;
    const contextName = CONTEXT_TYPES[contextType].name;

    result.context = Merge({ api: contextName },
                           functionInfo(context.callback));
  }

  return results;
}
