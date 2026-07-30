(function () {
  "use strict";

  var PAYROLL_URL = "https://15-m-autocare-payroll.vercel.app/";

  function removeEmbeddedPayroll() {
    var payrollPanel = document.getElementById("payroll");
    if (payrollPanel) payrollPanel.remove();
  }

  function makePayrollTabLink() {
    var oldButton = document.getElementById("payrollTabButton");
    if (!oldButton || oldButton.tagName === "A") return;

    var link = document.createElement("a");
    link.id = "payrollTabButton";
    link.className = "payroll-direct-link";
    link.href = PAYROLL_URL;
    link.textContent = oldButton.textContent || "Payroll";

    oldButton.replaceWith(link);

    if (!document.getElementById("payrollDirectLinkStyle")) {
      var style = document.createElement("style");
      style.id = "payrollDirectLinkStyle";
      style.textContent =
        ".tabs .payroll-direct-link{display:inline-flex;align-items:center;justify-content:center;padding:10px 16px;border:1px solid #ff4b00;border-radius:7px;background:#ff4b00;color:#fff!important;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}";
      document.head.appendChild(style);
    }
  }

  function applyPayrollLink() {
    removeEmbeddedPayroll();
    makePayrollTabLink();
  }

  window.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest("#payrollTabButton");
    if (!link) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.location.assign(PAYROLL_URL);
  }, true);

  applyPayrollLink();
  new MutationObserver(applyPayrollLink).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
