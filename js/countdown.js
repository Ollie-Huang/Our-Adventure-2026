document.addEventListener("DOMContentLoaded", () => {
    const weddingDate = new Date("2026-12-12T18:00:00+08:00");
    const fields = {
        days: document.querySelector("#countdown-days"),
        hours: document.querySelector("#countdown-hours"),
        minutes: document.querySelector("#countdown-minutes"),
        seconds: document.querySelector("#countdown-seconds")
    };
    const countdown = document.querySelector(".countdown");
    const finished = document.querySelector("#countdown-finished");

    function pad(value, length = 2) {
        return String(value).padStart(length, "0");
    }

    function updateCountdown() {
        const distance = weddingDate.getTime() - Date.now();

        if (distance <= 0) {
            fields.days.textContent = "000";
            fields.hours.textContent = "00";
            fields.minutes.textContent = "00";
            fields.seconds.textContent = "00";
            countdown.setAttribute("aria-label", "今天就是我們的重要日子");
            finished.hidden = false;
            return false;
        }

        const days = Math.floor(distance / 86400000);
        const hours = Math.floor((distance % 86400000) / 3600000);
        const minutes = Math.floor((distance % 3600000) / 60000);
        const seconds = Math.floor((distance % 60000) / 1000);

        fields.days.textContent = pad(days, 3);
        fields.hours.textContent = pad(hours);
        fields.minutes.textContent = pad(minutes);
        fields.seconds.textContent = pad(seconds);
        countdown.setAttribute("aria-label", `距離婚禮還有 ${days} 天 ${hours} 小時 ${minutes} 分 ${seconds} 秒`);
        return true;
    }

    updateCountdown();
    const timer = window.setInterval(() => {
        if (!updateCountdown()) {
            window.clearInterval(timer);
        }
    }, 1000);
});
