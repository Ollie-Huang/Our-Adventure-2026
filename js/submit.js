document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#rsvp-form");
    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector(".submit-button");

    form.addEventListener("submit", (event) => {
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

        submitButton.disabled = true;
        submitButton.textContent = "檢查中…";

        window.setTimeout(() => {
            showStatus(
                "資料格式確認完成。下一步接上資料儲存後，才會正式送出回覆。",
                "success"
            );

            submitButton.disabled = false;
            submitButton.textContent = "送出回覆";
        }, 600);
    });

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `form-status-${type}`;
    }
});