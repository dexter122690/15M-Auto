(function () {
  "use strict";

  var PAYROLL_URL = "https://15-m-autocare-payroll.vercel.app/";

  function redirectToPayroll(event) {
    var button = event.target.closest && event.target.closest("#payrollTabButton");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(PAYROLL_URL);
  }

  function removeEmbeddedPayroll() {
    var payrollPanel = document.getElementById("payroll");
    if (payrollPanel) payrollPanel.remove();
  }

  document.addEventListener("click", redirectToPayroll, true);
  removeEmbeddedPayroll();

  new MutationObserver(removeEmbeddedPayroll).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
