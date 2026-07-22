document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("#rsvp-form");
    const attendingPanel = document.querySelector("#attending-questions");
    const paperPanel = document.querySelector("#paper-invitation-fields");
    const childPanel = document.querySelector("#child-needs-fields");
    const blessingStep = document.querySelector("#blessing-step");
    const childCount = document.querySelector("#child-count");
    const closedMessage = document.querySelector("#form-closed-message");
    const deadline = new Date("2026-10-12T23:59:59+08:00");

    window.RSVP_DEADLINE = deadline;

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

    function updatePaperFields() {
        const isAttending = selectedValue("attendance") === "出席";
        const needsPaper = selectedValue("invitationType") === "紙本喜帖";
        setPanelState(paperPanel, isAttending && needsPaper);
        setRequired("[data-required-when-paper]", isAttending && needsPaper);
    }

    function updateChildFields() {
        const isAttending = selectedValue("attendance") === "出席";
        const hasChildren = Number(childCount.value) > 0;
        const maximum = Number(childCount.value) || 0;

        ["#child-tableware", "#child-chair"].forEach((selector) => {
            const select = document.querySelector(selector);
            Array.from(select.options).forEach((option) => {
                if (option.value === "") return;
                option.disabled = Number(option.value) > maximum;
            });

            if (Number(select.value) > maximum) {
                select.value = "";
            }
        });

        setPanelState(childPanel, isAttending && hasChildren);
        setRequired("[data-required-when-children]", isAttending && hasChildren);
    }

    function updateAttendanceFields({ moveToBlessing = false } = {}) {
        const attendance = selectedValue("attendance");
        const isAttending = attendance === "出席";

        setPanelState(attendingPanel, isAttending);
        setRequired("[data-required-when-attending]", isAttending);

        if (isAttending) {
            updatePaperFields();
            updateChildFields();
        } else {
            setPanelState(paperPanel, false);
            setPanelState(childPanel, false);
            setRequired("[data-required-when-paper]", false);
            setRequired("[data-required-when-children]", false);
        }

        if (attendance === "不出席" && moveToBlessing) {
            window.setTimeout(() => {
                blessingStep.scrollIntoView({ behavior: "smooth", block: "center" });
                document.querySelector("#blessing").focus({ preventScroll: true });
            }, 120);
        }
    }

    form.querySelectorAll('input[name="attendance"]').forEach((option) => {
        option.addEventListener("change", () => {
            updateAttendanceFields({ moveToBlessing: true });
        });
    });

    form.querySelectorAll('input[name="invitationType"]').forEach((option) => {
        option.addEventListener("change", updatePaperFields);
    });

    childCount.addEventListener("change", updateChildFields);

    form.addEventListener("rsvp-form-reset", () => {
        updateAttendanceFields();
    });

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
