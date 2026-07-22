const RSVP_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzY9P-BEl9MaDTNGeGl-qD9VzNXYXXLEz2N9kkQscPwtIMs16rCUuKn4W7vpyUDFecdOw/exec";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#rsvp-form");
    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector(".submit-button");
    const successOverlay = document.querySelector("#submit-success");
    let submissionInProgress = false;
    let successTimer;

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `form-status-${type}`;
    }

    function setSubmitting(isSubmitting) {
        submissionInProgress = isSubmitting;
        submitButton.disabled = isSubmitting;
        submitButton.innerHTML = isSubmitting
            ? "送出中… <span>SENDING</span>"
            : "送出回覆 <span>SUBMIT RSVP</span>";
    }

    function showSuccessAnimation() {
        window.clearTimeout(successTimer);
        successOverlay.classList.add("is-visible");
        successOverlay.setAttribute("aria-hidden", "false");

        successTimer = window.setTimeout(() => {
            successOverlay.classList.remove("is-visible");
            successOverlay.setAttribute("aria-hidden", "true");
        }, 3200);
    }

    window.addEventListener("beforeunload", (event) => {
        if (!submissionInProgress) return;
        event.preventDefault();
        event.returnValue = "";
    });

    function focusFirstInvalid() {
        const invalidField = form.querySelector(":invalid");
        if (!invalidField) return;
        invalidField.setAttribute("aria-invalid", "true");
        invalidField.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => invalidField.focus({ preventScroll: true }), 250);
    }

    form.addEventListener("input", (event) => {
        event.target.removeAttribute("aria-invalid");
    });

    form.addEventListener("change", (event) => {
        event.target.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        status.textContent = "";
        status.className = "";

        if (Date.now() > window.RSVP_DEADLINE.getTime()) {
            showStatus("回函填寫期限已截止，如需協助請直接聯絡新人。", "error");
            return;
        }

        if (!form.checkValidity()) {
            form.reportValidity();
            showStatus("請完成所有標示為必填的欄位。", "error");
            focusFirstInvalid();
            return;
        }

        const formData = new FormData(form);
        const attendance = formData.get("attendance");
        let phone = String(formData.get("phone") || "").replace(/[\s-]/g, "");

        if (phone && !/^(?:09\d{8}|\+8869\d{8})$/.test(phone)) {
            const phoneField = document.querySelector("#phone");
            phoneField.setAttribute("aria-invalid", "true");
            phoneField.focus();
            showStatus("請輸入正確的台灣手機號碼；若不想提供可將此欄留空。", "error");
            return;
        }

        if (phone.startsWith("+886")) {
            phone = `0${phone.slice(4)}`;
        }

        if (attendance === "出席") {
            const adults = Number(formData.get("adultCount") || 0);
            const children = Number(formData.get("childCount") || 0);
            const tableware = Number(formData.get("childTableware") || 0);
            const chairs = Number(formData.get("childChair") || 0);

            if (adults + children < 1) {
                document.querySelector("#adult-count").focus();
                showStatus("出席的大人與小孩總人數至少需要 1 位。", "error");
                return;
            }

            if (tableware > children || chairs > children) {
                showStatus("兒童餐具與座椅數量不能大於小孩人數。", "error");
                document.querySelector("#child-tableware").focus();
                return;
            }
        }

        if (
            !RSVP_ENDPOINT.startsWith("https://script.google.com/") ||
            !RSVP_ENDPOINT.endsWith("/exec")
        ) {
            showStatus("尚未設定正確的表單接收網址。", "error");
            return;
        }

        formData.set("phone", phone);
        formData.append("clientSubmittedAt", new Date().toISOString());
        formData.append("formVersion", "2.0");
        formData.append("source", "GitHub Pages");

        setSubmitting(true);

        try {
            await fetch(RSVP_ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                body: formData,
                keepalive: true
            });

            showStatus("謝謝您的回覆，我們已收到您的出席資訊。", "success");
            showSuccessAnimation();
            form.reset();
            form.dispatchEvent(new CustomEvent("rsvp-form-reset"));
        } catch (error) {
            showStatus("目前無法送出，請確認網路連線後再試一次。", "error");
        } finally {
            setSubmitting(false);
        }
    });
});
