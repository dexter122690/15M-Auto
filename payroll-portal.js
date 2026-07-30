(function () {
  "use strict";

  var PAYROLL_URL =
    "https://autocare-15m-payroll.dexterbsanagustin.chatgpt.site/";

  function activatePayrollTab(payroll, tabButton) {
    activateWebsiteTab("payroll", tabButton);
  }

  function activateWebsiteTab(sectionId, tabButton) {
    var section = document.getElementById(sectionId);
    if (!section) return;

    if (location.hash === "#payroll" && sectionId !== "payroll") {
      history.replaceState(null, "", location.pathname + location.search);
    }

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

    if (tabButton) tabButton.classList.add("active");
    section.classList.add("active");
  }

  function getSectionIdFromButton(tabButton) {
    var inlineHandler = tabButton.getAttribute("onclick") || "";
    var match = inlineHandler.match(/tab\(['"]([^'"]+)['"]/);
    return match ? match[1] : null;
  }

  function installTabFallback() {
    window.tab = function (sectionId, tabButton) {
      activateWebsiteTab(sectionId, tabButton);
    };

    Array.prototype.forEach.call(
      document.querySelectorAll(".tabs button"),
      function (tabButton) {
        var sectionId = getSectionIdFromButton(tabButton);
        if (!sectionId || tabButton.dataset.tabFallbackBound === "true") return;

        tabButton.dataset.tabFallbackBound = "true";
        tabButton.addEventListener("click", function (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
          activateWebsiteTab(sectionId, tabButton);
        });
      }
    );

    if (window.__15mTabFallbackInstalled) return;
    window.__15mTabFallbackInstalled = true;

    document.addEventListener("click", function (event) {
      var tabButton =
        event.target.closest && event.target.closest(".tabs button");
      if (!tabButton) return;

      var sectionId = getSectionIdFromButton(tabButton);
      if (!sectionId) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      activateWebsiteTab(sectionId, tabButton);
    }, true);
  }

  installTabFallback();
  setTimeout(installTabFallback, 0);
  setTimeout(installTabFallback, 500);

  function addStyles() {
    if (document.getElementById("payrollPortalStyles")) return;

    var style = document.createElement("style");
    style.id = "payrollPortalStyles";
    style.textContent =
      "header,.tabs{position:relative;z-index:20}" +
      "main{position:relative;z-index:1}" +
      "#payroll.payroll-portal-tab{padding:0!important;max-width:none!important;background:#0a0a0a}" +
      "#payroll .payroll-portal-shell{min-height:calc(100vh - 150px);background:#0a0a0a;border-top:3px solid #ff4b00}" +
      "#payroll .payroll-portal-bar{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:14px max(18px,3vw);background:#0a0a0a;color:#fff;border-bottom:1px solid #292929}" +
      "#payroll .payroll-portal-brand{display:flex;align-items:center;gap:12px;min-width:0}" +
      "#payroll .payroll-portal-logo{width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #ff4b00}" +
      "#payroll .payroll-portal-title{font-size:18px;font-weight:800;letter-spacing:.3px;line-height:1.15}" +
      "#payroll .payroll-portal-subtitle{margin-top:4px;color:#bcbcbc;font-size:12px}" +
      "#payroll .payroll-portal-open{display:inline-flex;align-items:center;justify-content:center;white-space:nowrap;padding:11px 16px;border-radius:8px;background:#ff4b00;color:#fff!important;text-decoration:none;font-weight:800;border:1px solid #ff4b00}" +
      "#payroll .payroll-portal-open:hover{background:#e94300}" +
      "#payroll .payroll-portal-frame{display:block;width:100%;height:calc(100vh - 232px);min-height:650px;border:0;background:#fff}" +
      "@media(max-width:700px){#payroll .payroll-portal-bar{align-items:flex-start;flex-direction:column}#payroll .payroll-portal-open{width:100%}#payroll .payroll-portal-frame{height:calc(100vh - 280px);min-height:620px}}";
    document.head.appendChild(style);
  }

  function installPortal() {
    var payroll = document.getElementById("payroll");
    if (!payroll || payroll.dataset.portalInstalled === "true") return false;

    addStyles();

    Array.prototype.forEach.call(payroll.children, function (child) {
      child.hidden = true;
      child.setAttribute("aria-hidden", "true");
    });

    var shell = document.createElement("div");
    shell.className = "payroll-portal-shell";
    shell.innerHTML =
      '<div class="payroll-portal-bar">' +
      '<div class="payroll-portal-brand">' +
      '<img class="payroll-portal-logo" src="new logo 15m.png" alt="15M Autocare Services logo">' +
      "<div>" +
      '<div class="payroll-portal-title">15M AUTOCARE</div>' +
      '<div class="payroll-portal-subtitle">PAYROLL SYSTEM</div>' +
      "</div>" +
      "</div>" +
      '<a class="payroll-portal-open" href="' +
      PAYROLL_URL +
      '" target="_blank" rel="noopener noreferrer">Open Payroll System</a>' +
      '<a class="payroll-portal-open" href="#">Back to Dashboard</a>' +
      "</div>" +
      '<iframe class="payroll-portal-frame" src="' +
      PAYROLL_URL +
      '" title="15M Autocare Payroll System" allow="camera; geolocation" referrerpolicy="strict-origin-when-cross-origin"></iframe>';

    payroll.appendChild(shell);
    payroll.classList.add("payroll-portal-tab");
    payroll.dataset.portalInstalled = "true";
    payroll.dataset.portalVersion = "tab-fallback-v1";

    var tabButton = document.getElementById("payrollTabButton");
    if (location.hash === "#payroll" && tabButton) {
      activatePayrollTab(payroll, tabButton);
    }

    return true;
  }

  if (!installPortal()) {
    var observer = new MutationObserver(function () {
      if (installPortal()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();

function removePayrollNavigation() {
  var button = document.getElementById("payrollTabButton");
  var panel = document.getElementById("payroll");
  if (button) button.remove();
  if (panel) panel.remove();
  if (location.hash === "#payroll") {
    history.replaceState(null, "", location.pathname + location.search);
  }
}
removePayrollNavigation();
new MutationObserver(removePayrollNavigation).observe(document.documentElement, {
  childList: true,
  subtree: true
});
