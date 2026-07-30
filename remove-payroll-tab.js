(function () {
  function removePayrollTab() {
    var payrollButton = document.getElementById("payrollTabButton");
    var payrollPanel = document.getElementById("payroll");

    if (payrollButton) payrollButton.remove();
    if (payrollPanel) payrollPanel.remove();

    if (location.hash === "#payroll") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  removePayrollTab();
  new MutationObserver(removePayrollTab).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
