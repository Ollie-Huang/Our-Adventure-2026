document.addEventListener("DOMContentLoaded", () => {
    const CEREMONY_TOKEN = "ghc-12dec26-a8f4k9m2";
    const form = document.querySelector("#rsvp-form");
    const attendingPanel = document.querySelector("#attending-questions");
    const paperPanel = document.querySelector("#paper-invitation-fields");
    const digitalPanel = document.querySelector("#digital-invitation-fields");
    const childPanel = document.querySelector("#child-needs-fields");
    const blessingStep = document.querySelector("#blessing-step");
    const ceremonyDetails = document.querySelector("#ceremony-details");
    const ceremonyStep = document.querySelector("#ceremony-response-step");
    const ceremonyInvited = document.querySelector("#ceremony-invited");
    const adultCount = document.querySelector("#adult-count");
    const childCount = document.querySelector("#child-count");
    const vegetarianCount = document.querySelector("#vegetarian-count");
    const mealSummary = document.querySelector("#meal-summary");
    const closedMessage = document.querySelector("#form-closed-message");
    const deadline = new Date("2026-10-12T23:59:59+08:00");
    const isCeremonyInvited = new URLSearchParams(window.location.search).get("ceremony") === CEREMONY_TOKEN;

    window.RSVP_DEADLINE = deadline;
    window.IS_CEREMONY_INVITED = isCeremonyInvited;

    function selectedValue(name) {
        return form.querySelector(`input[name="${name}"]:checked`)?.value || "";
    }

    function setPanelState(panel, shouldShow) {
        panel.hidden = !shouldShow;
        panel.querySelectorAll("input, select, textarea").forEach((field) => {
            field.disabled = !shouldShow;
        });
    }

    function setRequired(selector, shouldRequire) {
        form.querySelectorAll(selector).forEach((field) => {
            field.required = shouldRequire && !field.disabled;
        });
    }

    function configureCeremonyInvitation() {
        ceremonyDetails.hidden = !isCeremonyInvited;
        setPanelState(ceremonyStep, isCeremonyInvited);
        ceremonyInvited.value = isCeremonyInvited ? "是" : "否";
        const firstOption = ceremonyStep.querySelector('input[name="ceremonyAttendance"]');
        firstOption.required = isCeremonyInvited;
    }

    function updateInvitationFields() {
        const isAttending = selectedValue("attendance") === "出席";
        const invitationType = selectedValue("invitationType");
        const needsPaper = invitationType === "紙本喜帖";
        const needsDigital = invitationType === "數位喜帖";

        setPanelState(paperPanel, isAttending && needsPaper);
        setPanelState(digitalPanel, isAttending && needsDigital);
        setRequired("[data-required-when-paper]", isAttending && needsPaper);
        setRequired("[data-required-when-digital]", isAttending && needsDigital);
    }

    function rebuildQuantitySelect(select, maximum, unit) {
        const previous = select.value;
        select.innerHTML = '<option value="">請選擇數量</option>';

        for (let value = 0; value <= maximum; value += 1) {
            const option = document.createElement("option");
            option.value = String(value);
            option.textContent = value === 0 ? "不需要" : `${value} ${unit}`;
            select.appendChild(option);
        }

        if (previous !== "" && Number(previous) <= maximum) {
            select.value = previous;
        }
    }

    function updateChildFields() {
        const isAttending = selectedValue("attendance") === "出席";
        const maximum = Number(childCount.value) || 0;
        const hasChildren = maximum > 0;

        rebuildQuantitySelect(document.querySelector("#child-tableware"), maximum, "副");
        rebuildQuantitySelect(document.querySelector("#child-chair"), maximum, "張");
        setPanelState(childPanel, isAttending && hasChildren);
        setRequired("[data-required-when-children]", isAttending && hasChildren);
    }

    function updateMealFields() {
        const adults = Number(adultCount.value);
        const previous = vegetarianCount.value;
        vegetarianCount.innerHTML = "";

        if (adultCount.value === "") {
            vegetarianCount.innerHTML = '<option value="">請先選擇大人人數</option>';
            vegetarianCount.disabled = true;
            mealSummary.textContent = "小孩不列入葷素人數計算。";
            return;
        }

        vegetarianCount.disabled = false;
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "請選擇素食大人人數";
        vegetarianCount.appendChild(placeholder);

        for (let value = 0; value <= adults; value += 1) {
            const option = document.createElement("option");
            option.value = String(value);
            option.textContent = `${value} 位`;
            vegetarianCount.appendChild(option);
        }

        if (previous !== "" && Number(previous) <= adults) {
            vegetarianCount.value = previous;
        }

        updateMealSummary();
    }

    function updateMealSummary() {
        if (adultCount.value === "" || vegetarianCount.value === "") {
            mealSummary.textContent = "小孩不列入葷素人數計算。";
            return;
        }

        const adults = Number(adultCount.value);
        const vegetarian = Number(vegetarianCount.value);
        mealSummary.textContent = `大人餐點：葷食 ${adults - vegetarian} 位、素食 ${vegetarian} 位；小孩不另計。`;
    }

    function updateAttendanceFields({ moveForward = false } = {}) {
        const attendance = selectedValue("attendance");
        const isAttending = attendance === "出席";

        setPanelState(attendingPanel, isAttending);
        setRequired("[data-required-when-attending]", isAttending);

        if (isAttending) {
            updateInvitationFields();
            updateChildFields();
            updateMealFields();
        } else {
            setPanelState(paperPanel, false);
            setPanelState(digitalPanel, false);
            setPanelState(childPanel, false);
            setRequired("[data-required-when-paper]", false);
            setRequired("[data-required-when-digital]", false);
            setRequired("[data-required-when-children]", false);
        }

        if (attendance === "不出席" && moveForward) {
            const ceremonyAnswered = selectedValue("ceremonyAttendance") !== "";
            const target = isCeremonyInvited && !ceremonyAnswered ? ceremonyStep : blessingStep;
            window.setTimeout(() => {
                target.scrollIntoView({ behavior: "smooth", block: "center" });
                target.querySelector("input:not(:disabled), textarea:not(:disabled)")?.focus({ preventScroll: true });
            }, 120);
        }
    }

    form.querySelectorAll('input[name="attendance"]').forEach((option) => {
        option.addEventListener("change", () => updateAttendanceFields({ moveForward: true }));
    });

    form.querySelectorAll('input[name="invitationType"]').forEach((option) => {
        option.addEventListener("change", updateInvitationFields);
    });

    adultCount.addEventListener("change", updateMealFields);
    vegetarianCount.addEventListener("change", updateMealSummary);
    childCount.addEventListener("change", updateChildFields);

    form.addEventListener("rsvp-form-reset", () => {
        configureCeremonyInvitation();
        updateAttendanceFields();
    });

    configureCeremonyInvitation();

    if (Date.now() > deadline.getTime()) {
        form.hidden = true;
        closedMessage.hidden = false;
        form.querySelectorAll("input, select, textarea, button").forEach((field) => {
            field.disabled = true;
        });
    } else {
        updateAttendanceFields();
    }
});
