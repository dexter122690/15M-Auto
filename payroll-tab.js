(function () {
  "use strict";

  var link = document.querySelector("a");
  if (!link) return;

  link.addEventListener("click", function (event) {
    event.preventDefault();
    window.top.location.href = "https://15-m-auto.vercel.app/#payroll";
  });
})();
