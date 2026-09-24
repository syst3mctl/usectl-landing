// scroll-record.js — scroll ride recorder for capturing video clips.
//
//   window.recordScroll({ to, duration = 3800, hold = 1000, endHold = 1000, settle = 500, loop = true })
//
// One cycle: jump to scrollY 0 → wait `settle` ms (the scene's damped
// rides catch up after the jump home — without this the catch-up ate
// the intro and `hold` never read as a full second of clean hero) →
// park `hold` ms (the 3D scene keeps animating, the page does not
// move) → cubic ease-in-out from 0 to `to` over `duration` ms, one
// window.scrollTo(0, y) per rAF → rest at `to` for `endHold` ms.
// loop: true (the default) starts the same cycle over from the top,
// forever — the infinity ride for a seamless clip. loop: false runs a
// single pass and stops clean at `to`, nothing after.
//
//   window.recordScroll.stop()   — cancels whatever is running.
//   window.sectionTops()         — [[id, offsetTop], ...] for every <section>,
//                                  to find the scroll target quickly.
//
// Plain JS, no dependencies. It drives the REAL page scroll, exactly like
// a user's wheel — every scroll-scrubbed animation on the page (and any
// GSAP/ScrollTrigger rig) just follows it; nothing is patched or faked.
(function () {
  'use strict';

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  var run = 0; // cancel token: bumping it strands any in-flight rAF chain

  function recordScroll(opts) {
    opts = opts || {};
    var to = opts.to || 0;
    var duration = opts.duration == null ? 3800 : opts.duration;
    var hold = (opts.hold == null ? 1000 : opts.hold) + (opts.settle == null ? 500 : opts.settle);
    var endHold = opts.endHold == null ? 1000 : opts.endHold;
    var loop = opts.loop == null ? true : !!opts.loop;
    var token = ++run;

    function cycle() {
      if (token !== run) return;
      window.scrollTo(0, 0); // jump home immediately, no smooth behaviour
      var t0 = null;
      function frame(now) {
        if (token !== run) return;
        if (t0 === null) t0 = now;
        var el = now - t0;
        if (el < hold) { requestAnimationFrame(frame); return; } // parked: scene animates, page still
        var p = Math.min(1, (el - hold) / duration);
        window.scrollTo(0, Math.round(to * ease(p)));
        if (p < 1) { requestAnimationFrame(frame); return; }
        if (!loop) return; // single pass: stopped clean at `to`, do nothing after
        var t1 = now;
        (function rest(n2) {
          if (token !== run) return;
          if (n2 - t1 < endHold) { requestAnimationFrame(rest); return; }
          cycle(); // from the top, same ride again
        })(now);
      }
      requestAnimationFrame(frame);
    }
    cycle();
  }

  recordScroll.stop = function () { run++; };
  window.recordScroll = recordScroll;

  window.sectionTops = function () {
    var out = [];
    var secs = document.querySelectorAll('section');
    for (var i = 0; i < secs.length; i++) {
      var s = secs[i];
      out.push([s.id || '(no id)', Math.round(s.getBoundingClientRect().top + (window.pageYOffset || 0))]);
    }
    return out;
  };
})();
