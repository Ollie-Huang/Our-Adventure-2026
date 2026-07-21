document.addEventListener("DOMContentLoaded", () => {
    const attendanceOptions = document.querySelectorAll(
        'input[name="attendance"]'
    );
    const guestCount = document.querySelector("#guest-count");
    const guestCountGroup = guestCount.closest(".form-group");
    const message = document.querySelector("#message");

    function updateAttendanceFields() {
        const selectedAttendance = document.querySelector(
            'input[name="attendance"]:checked'
        );

        if (!selectedAttendance) {
            guestCountGroup.hidden = false;
            guestCount.disabled = false;
            guestCount.required = false;
            return;
        }

        const willAttend = selectedAttendance.value === "出席";

        guestCountGroup.hidden = !willAttend;
        guestCount.disabled = !willAttend;
        guestCount.required = willAttend;

        if (!willAttend) {
            guestCount.value = "";
            message.placeholder = "想對新人說的話（選填）";
        } else {
            message.placeholder =
                "飲食需求、兒童座椅或其他需要協助的事項";
        }
    }

    attendanceOptions.forEach((option) => {
        option.addEventListener("change", updateAttendanceFields);
    });

    updateAttendanceFields();
    formResetSetup();

function formResetSetup() {
    const form = document.querySelector("#rsvp-form");

    form.addEventListener("rsvp-form-reset", () => {
        updateAttendanceFields();
    });
}
});