document.addEventListener("DOMContentLoaded", () => {
    const player = document.querySelector("#music-player");
    const audio = document.querySelector("#background-music");
    const toggle = document.querySelector("#music-toggle");
    const label = toggle.querySelector(".music-label b");

    audio.volume = 0.32;

    function updateButton(isPlaying) {
        toggle.setAttribute("aria-pressed", String(isPlaying));
        toggle.setAttribute("aria-label", isPlaying ? "暫停背景音樂" : "播放背景音樂");
        label.textContent = isPlaying ? "暫停音樂" : "播放音樂";
    }

    audio.addEventListener("canplay", () => {
        player.hidden = false;
    }, { once: true });

    audio.addEventListener("error", () => {
        player.hidden = true;
    });

    audio.addEventListener("pause", () => updateButton(false));
    audio.addEventListener("play", () => updateButton(true));

    toggle.addEventListener("click", async () => {
        if (audio.paused) {
            try {
                await audio.play();
            } catch (error) {
                updateButton(false);
            }
        } else {
            audio.pause();
        }
    });

    updateButton(false);
    audio.load();
});
