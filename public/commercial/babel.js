// babel-standalone replaced by a pass-through: the two commercial .jsx files
// are pre-compiled to plain JS at build time (same filenames), so the
// dc-runtime's Babel.transform call has nothing left to do. this shim keeps
// its API surface and saves ~3MB of download plus the main-thread transform.
// originals preserved in the project history / scratchpad backups.
(function (root) {
  root.Babel = {
    transform: function (src) { return { code: src }; },
    version: 'precompiled-passthrough'
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
