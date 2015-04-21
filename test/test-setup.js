jasmine.getFixtures().fixturesPath = "test";

// see: http://stackoverflow.com/a/17789929/88513
if (window._phantom) {
  // Patch since PhantomJS does not implement click() on HTMLElement. In some 
  // cases we need to execute the native click on an element. However, jQuery's 
  // $.fn.click() does not dispatch to the native function on <a> elements, so we
  // can't use it in our implementations: $el[0].click() to correctly dispatch.
  if (!HTMLElement.prototype.click) {
    HTMLElement.prototype.click = function() {
      var ev = document.createEvent('MouseEvent');
      ev.initMouseEvent(
          'click',
          /*bubble*/true, /*cancelable*/true,
          window, null,
          0, 0, 0, 0, /*coordinates*/
          false, false, false, false, /*modifier keys*/
          0/*button=left*/, null
      );
      this.dispatchEvent(ev);
    };
  }
}

requirejs.config({
    baseUrl: "test",
    paths: {
    }
});

// for saucelabs testing
jasmine.getEnv().addReporter(new jasmine.JSReporter2());

(function () {
   var oldFunc = window.jasmine.getJSReport;
   window.jasmine.getJSReport = function () {
      var results = oldFunc();
      if (results) {
         return {
            durationSec: results.durationSec,
            suites: removePassingTests(results.suites),
            passed: results.passed
         };
      } else {
         return null;
      }
   };

   function removePassingTests(suites) {
      return $.map($.grep(suites, grepFailed), mapSuite);
   }

   function mapSuite(suite) {
      return $.extend({}, suite, {
         specs: $.grep(suite.specs, grepFailed),
         suites: removePassingTests(suite.suites)
      });
   }

   function grepFailed(item) {
      return !item.passed;
   }
})();

