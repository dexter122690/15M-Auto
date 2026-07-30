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
  setTimeout(removePayrollTab, 0);
  setTimeout(removePayrollTab, 500);
})();
