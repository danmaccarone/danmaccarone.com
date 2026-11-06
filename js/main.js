// Mobile nav toggle
var toggle = document.querySelector(".nav__toggle");
var menu = document.querySelector(".nav__menu");
if (toggle && menu) {
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// Footer year
var year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();
