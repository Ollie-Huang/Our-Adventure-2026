const RSVP_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxaFtOOCdol4IKfQ3kiRi8DR5s4cFlQbTZMn23SZRfJ/dev";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#rsvp-form");
    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector(".submit-button");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        status.textContent = "";
        status.className = "";

        if (!form.checkValidity()) {
            form.reportValidity();
            showStatus("請先完成所有必填欄位。", "error");
            return;
        }

        const formData = new FormData(form);
        const attendance = formData.get("attendance");
        const guestCount = formData.get("guestCount");

        if (attendance === "出席" && !guestCount) {
            showStatus("請選擇出席人數。", "error");
            document.querySelector("#guest-count").focus();
            return;
        }

        if (
            !RSVP_ENDPOINT.startsWith("https://script.google.com/") ||
            !RSVP_ENDPOINT.endsWith("/exec")
        ) {
            showStatus("尚未設定正確的表單接收網址。", "error");
            return;
        }

        setSubmitting(true);

        try {
            await fetch(RSVP_ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                body: formData
            });

            showStatus(
                "謝謝您的回覆，我們已收到您的出席資訊。",
                "success"
            );

            form.reset();
            form.dispatchEvent(
                new CustomEvent("rsvp-form-reset")
            );
        } catch (error) {
            showStatus(
                "目前無法送出，請確認網路連線後再試一次。",
                "error"
            );
        } finally {
            setSubmitting(false);
        }
    });

    function setSubmitting(isSubmitting) {
        submitButton.disabled = isSubmitting;
        submitButton.textContent = isSubmitting
            ? "送出中…"
            : "送出回覆";
    }

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `form-status-${type}`;
    }
});