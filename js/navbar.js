document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".site-nav");
    const links = Array.from(document.querySelectorAll(".nav-links a"));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function scrollToSection(target, updateAddress = true) {
        if (!target) return;

        const navHeight = nav.getBoundingClientRect().height;
        const targetTop = target.getBoundingClientRect().top + window.scrollY;
        const destination = Math.max(0, targetTop - navHeight);

        window.scrollTo({
            top: destination,
            behavior: prefersReducedMotion.matches ? "auto" : "smooth"
        });

        if (updateAddress) {
            history.pushState(null, "", `#${target.id}`);
        }
    }

    links.forEach((link) => {
        link.addEventListener("click", (event) => {
            const target = document.querySelector(link.getAttribute("href"));
            if (!target) return;
            event.preventDefault();
            scrollToSection(target);
        });
    });

    window.addEventListener("popstate", () => {
        if (!location.hash) return;
        scrollToSection(document.querySelector(location.hash), false);
    });

    if (location.hash) {
        window.setTimeout(() => {
            scrollToSection(document.querySelector(location.hash), false);
        }, 80);
    }

    if (!("IntersectionObserver" in window)) return;

    const sections = links
        .map((link) => document.querySelector(link.getAttribute("href")))
        .filter(Boolean);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            links.forEach((link) => {
                link.classList.toggle(
                    "active",
                    link.getAttribute("href") === `#${entry.target.id}`
                );
            });
        });
    }, {
        rootMargin: `-${nav.getBoundingClientRect().height + 16}px 0px -65% 0px`,
        threshold: 0
    });

    sections.forEach((section) => observer.observe(section));
});
