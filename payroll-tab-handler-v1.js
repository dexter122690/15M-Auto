(function () {
  "use strict";

  document.addEventListener(
    "click",
    function (event) {
      var tabButton =
        event.target.closest &&
        event.target.closest("#payrollTabButton");
      if (!tabButton) return;

      var payroll = document.getElementById("payroll");
      if (!payroll) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      Array.prototype.forEach.call(
        document.querySelectorAll(".tabs button"),
        function (button) {
          button.classList.remove("active");
        }
      );
      Array.prototype.forEach.call(
        document.querySelectorAll("main > section.tab"),
        function (section) {
          section.classList.remove("active");
        }
      );

      tabButton.classList.add("active");
      payroll.classList.add("active");
    },
    true
  );

  window.__payrollTabHandlerV1 = true;
})();
