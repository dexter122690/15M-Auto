(function () {
  "use strict";

  var PAYROLL_URL = "https://15-m-autocare-payroll.vercel.app/";

  function removeEmbeddedPayroll() {
    var payrollPanel = document.getElementById("payroll");
    if (payrollPanel) payrollPanel.remove();
  }

  function makePayrollTabDirect() {
    var oldButton = document.getElementById("payrollTabButton");
    if (!oldButton || oldButton.dataset.directPayroll === "true") return;

    var directButton = oldButton.cloneNode(true);
    directButton.removeAttribute("onclick");
    directButton.dataset.directPayroll = "true";
    directButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.href = PAYROLL_URL;
    });

    oldButton.replaceWith(directButton);
  }

  function applyPayrollRedirect() {
    removeEmbeddedPayroll();
    makePayrollTabDirect();
  }

  applyPayrollRedirect();
  new MutationObserver(applyPayrollRedirect).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
