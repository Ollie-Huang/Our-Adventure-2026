const RSVP_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbzY9P-BEl9MaDTNGeGl-qD9VzNXYXXLEz2N9kkQscPwtIMs16rCUuKn4W7vpyUDFecdOw/exec";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#rsvp-form");
    const status = document.querySelector("#form-status");
    const submitButton = form.querySelector(".submit-button");
    const loadingOverlay = document.querySelector("#submit-loading");
    const successOverlay = document.querySelector("#submit-success");
    const closeSuccessButton = document.querySelector("#close-success");
    const saveReceiptButton = document.querySelector("#save-receipt");
    const receiptNote = document.querySelector(".receipt-note");
    let submissionInProgress = false;

    function showStatus(message, type) {
        status.textContent = message;
        status.className = `form-status-${type}`;
    }

    function setSubmitting(isSubmitting) {
        submissionInProgress = isSubmitting;
        submitButton.disabled = isSubmitting;
        loadingOverlay.classList.toggle("is-visible", isSubmitting);
        loadingOverlay.setAttribute("aria-hidden", String(!isSubmitting));
        submitButton.innerHTML = isSubmitting
            ? "送出中… <span>SENDING</span>"
            : "送出回覆 <span>SUBMIT RSVP</span>";
    }

    function showSuccessAnimation(receiptReady) {
        saveReceiptButton.disabled = !receiptReady;
        receiptNote.textContent = receiptReady
            ? "行動裝置將開啟分享選單，請選擇儲存影像。"
            : "回覆已送出，但目前無法產生儲存圖片。";
        successOverlay.classList.add("is-visible");
        successOverlay.setAttribute("aria-hidden", "false");
        window.setTimeout(() => closeSuccessButton.focus(), 180);
    }

    function closeSuccessAnimation() {
        successOverlay.classList.remove("is-visible");
        successOverlay.setAttribute("aria-hidden", "true");
    }

    function createResponseId() {
        if (window.crypto?.randomUUID) {
            return window.crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
        }

        return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`
            .slice(0, 8)
            .toUpperCase();
    }

    closeSuccessButton.addEventListener("click", closeSuccessAnimation);

    successOverlay.addEventListener("click", (event) => {
        if (event.target === successOverlay) closeSuccessAnimation();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && successOverlay.classList.contains("is-visible")) {
            closeSuccessAnimation();
        }
    });

    saveReceiptButton.addEventListener("click", async () => {
        const originalContent = saveReceiptButton.innerHTML;
        saveReceiptButton.disabled = true;
        saveReceiptButton.textContent = "準備圖片中…";

        try {
            await window.RSVPReceipt.save();
            receiptNote.textContent = "回覆圖片已準備完成，請依裝置提示儲存。";
        } catch (error) {
            if (error?.name !== "AbortError") {
                receiptNote.textContent = "圖片儲存失敗，請再試一次或直接截圖留存。";
            }
        } finally {
            saveReceiptButton.innerHTML = originalContent;
            saveReceiptButton.disabled = false;
        }
    });

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

        let meatCount = "";

        if (attendance === "出席") {
            const adults = Number(formData.get("adultCount") || 0);
            const children = Number(formData.get("childCount") || 0);
            const vegetarian = Number(formData.get("vegetarianCount") || 0);
            const tableware = Number(formData.get("childTableware") || 0);
            const chairs = Number(formData.get("childChair") || 0);

            if (adults + children < 1) {
                document.querySelector("#adult-count").focus();
                showStatus("出席的大人與小孩總人數至少需要 1 位。", "error");
                return;
            }

            if (vegetarian > adults) {
                document.querySelector("#vegetarian-count").focus();
                showStatus("素食人數不能大於大人人數。", "error");
                return;
            }

            if (tableware > children || chairs > children) {
                showStatus("兒童餐具與座椅數量不能大於小孩人數。", "error");
                document.querySelector("#child-tableware").focus();
                return;
            }

            meatCount = adults - vegetarian;
        }

        if (
            !RSVP_ENDPOINT.startsWith("https://script.google.com/") ||
            !RSVP_ENDPOINT.endsWith("/exec")
        ) {
            showStatus("尚未設定正確的表單接收網址。", "error");
            return;
        }

        const responseId = createResponseId();
        formData.set("phone", phone);
        formData.set("responseId", responseId);
        formData.set("meatCount", String(meatCount));
        formData.set("clientSubmittedAt", new Date().toISOString());
        formData.set("formVersion", "5.5");
        formData.set("source", "GitHub Pages");

        /*
         * 收據直接讀取畫面上的喜帖欄位。
         * 不依賴欄位是否曾被進階問題切換為 disabled，
         * 避免紙本＋數位時 FormData 漏掉地址或 Email。
         */
        const invitationType =
            form.querySelector('input[name="invitationType"]:checked')?.value || "";
        const wantsPaperReceipt = invitationType.includes("紙本");
        const wantsDigitalReceipt = invitationType.includes("數位");
        const receiptData = {
            ...Object.fromEntries(formData.entries()),
            invitationType,
            postalCode: wantsPaperReceipt
                ? String(document.querySelector("#postal-code")?.value || "").trim()
                : "",
            address: wantsPaperReceipt
                ? String(document.querySelector("#address")?.value || "").trim()
                : "",
            digitalEmail: wantsDigitalReceipt
                ? String(document.querySelector("#digital-email")?.value || "").trim()
                : ""
        };
        setSubmitting(true);

        try {
            await fetch(RSVP_ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                body: formData,
                keepalive: true
            });

            let receiptReady = false;

            try {
                await window.RSVPReceipt.prepare(receiptData);
                receiptReady = true;
            } catch (receiptError) {
                receiptReady = false;
            }

            showStatus("謝謝您的回覆，我們已收到您的出席資訊。", "success");
            showSuccessAnimation(receiptReady);
            form.reset();
            form.dispatchEvent(new CustomEvent("rsvp-form-reset"));
        } catch (error) {
            showStatus("目前無法送出，請確認網路連線後再試一次。", "error");
        } finally {
            setSubmitting(false);
        }
    });
});
