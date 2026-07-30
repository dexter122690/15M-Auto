(function () {
  "use strict";

  var PAYROLL_URL = "https://15-m-autocare-payroll.vercel.app/";

  document.addEventListener(
    "click",
    function (event) {
      var payrollTab =
        event.target.closest &&
        event.target.closest("#payrollTabButton");
      if (!payrollTab) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(PAYROLL_URL);
    },
    true
  );
})();
