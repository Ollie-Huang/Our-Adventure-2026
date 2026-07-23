const SPREADSHEET_ID = "請貼上你目前的試算表ID";
const SHEET_NAME = "RSVP";
const DEADLINE = new Date("2026-10-12T15:59:59Z");

const HEADERS = [
    "送出時間",
    "回覆編號",
    "紀錄狀態",
    "重複判別",
    "姓名",
    "聯絡手機（選填）",
    "與新人關係",
    "婚宴出席",
    "儀式受邀",
    "儀式出席",
    "喜帖形式",
    "數位喜帖 Email",
    "郵遞區號",
    "寄送地址",
    "大人人數",
    "小孩人數",
    "出席總人數",
    "葷食人數",
    "素食人數",
    "兒童餐具",
    "兒童座椅",
    "其他特殊需求",
    "給新人的祝福",
    "表單版本",
    "資料來源",
    "瀏覽器送出時間"
];

function doPost(e) {
    const lock = LockService.getScriptLock();

    try {
        lock.waitLock(10000);

        if (new Date() > DEADLINE) {
            throw new Error("回函填寫期限已截止");
        }

        const data = e && e.parameter ? e.parameter : {};

        if (data.website) {
            return createResponse(true, "ignored");
        }

        const responseId = normalizeResponseId(data.responseId) || Utilities.getUuid().slice(0, 8).toUpperCase();
        const name = cleanValue(data.name, 50);
        const phone = normalizeSubmittedPhone(data.phone);
        const relationship = cleanValue(data.relationship, 20);
        const attendance = cleanValue(data.attendance, 20);
        const ceremonyInvited = cleanValue(data.ceremonyInvited, 10) === "是" ? "是" : "否";
        const ceremonyAttendance = ceremonyInvited === "是"
            ? cleanValue(data.ceremonyAttendance, 20)
            : "";
        const blessing = cleanValue(data.blessing, 500);
        const specialNeeds = cleanValue(data.specialNeeds, 300);

        validateBaseFields({
            name,
            relationship,
            attendance,
            ceremonyInvited,
            ceremonyAttendance
        });

        let invitationType = "";
        let digitalEmail = "";
        let postalCode = "";
        let address = "";
        let adultCount = "";
        let childCount = "";
        let totalCount = "";
        let meatCount = "";
        let vegetarianCount = "";
        let childTableware = "";
        let childChair = "";

        if (attendance === "出席") {
            invitationType = cleanValue(data.invitationType, 20);
            digitalEmail = cleanValue(data.digitalEmail, 120);
            postalCode = cleanValue(data.postalCode, 10);
            address = cleanValue(data.address, 150);
            adultCount = toCount(data.adultCount);
            childCount = toCount(data.childCount);
            vegetarianCount = toCount(data.vegetarianCount);
            childTableware = toCount(data.childTableware);
            childChair = toCount(data.childChair);
            totalCount = Number(adultCount) + Number(childCount);
            meatCount = Number(adultCount) - Number(vegetarianCount);

            validateAttendingFields({
                invitationType,
                digitalEmail,
                postalCode,
                address,
                adultCount,
                childCount,
                totalCount,
                meatCount,
                vegetarianCount,
                childTableware,
                childChair
            });
        }

        const sheet = getPreparedSheet();
        const duplicate = findDuplicate(sheet, name, phone);
        const recordStatus = duplicate.found ? "重複回覆・請確認" : "首次回覆";

        const row = [
            new Date(),
            responseId,
            recordStatus,
            duplicate.description,
            name,
            phone,
            relationship,
            attendance,
            ceremonyInvited,
            ceremonyAttendance,
            invitationType,
            digitalEmail,
            postalCode,
            address,
            adultCount,
            childCount,
            attendance === "出席" ? totalCount : "",
            meatCount,
            vegetarianCount,
            childTableware,
            childChair,
            specialNeeds,
            blessing,
            cleanValue(data.formVersion, 20) || "5.1",
            cleanValue(data.source, 50) || "Wedding RSVP",
            cleanValue(data.clientSubmittedAt, 50)
        ];

        sheet.appendRow(row);
        formatLatestRow(sheet);
        refreshFilter(sheet);

        return createResponse(true, duplicate.found ? "已儲存並標記為重複回覆" : "回覆已儲存");
    } catch (error) {
        return createResponse(false, error.message);
    } finally {
        lock.releaseLock();
    }
}

function setupRSVPSheet() {
    const sheet = getPreparedSheet();
    formatSheet(sheet);
    return "RSVP 工作表已建立並完成排版";
}

function getPreparedSheet() {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);

    if (sheet && sheet.getLastRow() > 0 && !hasCurrentHeaders(sheet)) {
        const backupName = createBackupName(spreadsheet);
        sheet.setName(backupName);
        sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (!sheet) {
        sheet = spreadsheet.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
        formatSheet(sheet);
    }

    return sheet;
}

function hasCurrentHeaders(sheet) {
    if (sheet.getLastColumn() !== HEADERS.length) return false;
    const values = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    return HEADERS.every((header, index) => values[index] === header);
}

function createBackupName(spreadsheet) {
    const stamp = Utilities.formatDate(new Date(), "Asia/Taipei", "yyyyMMdd-HHmm");
    let name = `RSVP 舊版備份 ${stamp}`;
    let index = 2;

    while (spreadsheet.getSheetByName(name)) {
        name = `RSVP 舊版備份 ${stamp}-${index}`;
        index += 1;
    }

    return name;
}

function formatSheet(sheet) {
    const header = sheet.getRange(1, 1, 1, HEADERS.length);
    header
        .setBackground("#d4a373")
        .setFontColor("#ffffff")
        .setFontWeight("bold")
        .setHorizontalAlignment("center")
        .setVerticalAlignment("middle")
        .setWrap(true);

    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(5);
    sheet.setRowHeight(1, 46);
    sheet.setColumnWidth(1, 145);
    sheet.setColumnWidth(2, 95);
    sheet.setColumnWidth(3, 135);
    sheet.setColumnWidth(4, 190);
    sheet.setColumnWidth(5, 110);
    sheet.setColumnWidth(6, 135);
    sheet.setColumnWidths(7, 5, 105);
    sheet.setColumnWidth(12, 220);
    sheet.setColumnWidth(13, 90);
    sheet.setColumnWidth(14, 280);
    sheet.setColumnWidths(15, 7, 100);
    sheet.setColumnWidth(22, 300);
    sheet.setColumnWidth(23, 320);
    sheet.setColumnWidths(24, 3, 145);
    sheet.getRange("A:A").setNumberFormat("yyyy/mm/dd hh:mm:ss");
    refreshFilter(sheet);
}

function formatLatestRow(sheet) {
    const rowNumber = sheet.getLastRow();
    const range = sheet.getRange(rowNumber, 1, 1, HEADERS.length);
    const isEven = rowNumber % 2 === 0;

    range
        .setBackground(isEven ? "#fbf8f3" : "#ffffff")
        .setVerticalAlignment("middle")
        .setWrap(true);

    sheet.getRange(rowNumber, 1, 1, 21).setHorizontalAlignment("center");
    sheet.getRange(rowNumber, 14).setHorizontalAlignment("left");
    sheet.getRange(rowNumber, 22, 1, 2).setHorizontalAlignment("left");
    sheet.getRange(rowNumber, 1).setNumberFormat("yyyy/mm/dd hh:mm:ss");

    if (sheet.getRange(rowNumber, 3).getDisplayValue().includes("重複")) {
        sheet.getRange(rowNumber, 3, 1, 2)
            .setBackground("#f4dddd")
            .setFontColor("#8b3f3f")
            .setFontWeight("bold");
    }
}

function refreshFilter(sheet) {
    const filter = sheet.getFilter();
    if (filter) filter.remove();
    sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 2), HEADERS.length).createFilter();
}

function findDuplicate(sheet, name, phone) {
    if (sheet.getLastRow() < 2) {
        return { found: false, description: "" };
    }

    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getDisplayValues();
    const normalizedName = normalize(name);
    const normalizedPhone = normalizePhone(phone);

    for (let index = values.length - 1; index >= 0; index -= 1) {
        const row = values[index];
        const sameName = normalize(row[4]) === normalizedName;
        if (!sameName) continue;

        const previousId = row[1] || `第 ${index + 2} 列`;
        const samePhone = normalizedPhone && normalizePhone(row[5]) === normalizedPhone;
        return {
            found: true,
            description: samePhone
                ? `同姓名與手機；前次編號 ${previousId}`
                : `同姓名；前次編號 ${previousId}，請人工確認`
        };
    }

    return { found: false, description: "" };
}

function validateBaseFields(fields) {
    if (!fields.name) throw new Error("姓名不可空白");
    if (!["男方親友", "女方親友"].includes(fields.relationship)) {
        throw new Error("與新人的關係格式錯誤");
    }
    if (!["出席", "不出席"].includes(fields.attendance)) {
        throw new Error("出席意願格式錯誤");
    }
    if (fields.ceremonyInvited === "是" && !["參加儀式", "不參加儀式"].includes(fields.ceremonyAttendance)) {
        throw new Error("請填寫證婚儀式出席意願");
    }
}

function validateAttendingFields(fields) {
    if (!["紙本喜帖", "數位喜帖"].includes(fields.invitationType)) {
        throw new Error("喜帖形式格式錯誤");
    }
    if (fields.invitationType === "紙本喜帖" && (!fields.postalCode || !fields.address)) {
        throw new Error("紙本喜帖需要郵遞區號與寄送地址");
    }
    if (fields.invitationType === "數位喜帖" && !isValidEmail(fields.digitalEmail)) {
        throw new Error("請填寫正確的數位喜帖 Email");
    }
    if (fields.totalCount < 1) {
        throw new Error("出席總人數至少需要 1 位");
    }
    if (fields.adultCount === "" || fields.childCount === "" || fields.vegetarianCount === "") {
        throw new Error("請完整填寫大人、小孩與素食人數");
    }
    if (Number(fields.vegetarianCount) > Number(fields.adultCount)) {
        throw new Error("素食人數不能大於大人人數");
    }
    if (Number(fields.meatCount) < 0) {
        throw new Error("大人餐點人數格式錯誤");
    }
    if (fields.childCount > 0 && (fields.childTableware === "" || fields.childChair === "")) {
        throw new Error("請填寫兒童餐具與座椅數量");
    }
    if (
        Number(fields.childTableware || 0) > Number(fields.childCount) ||
        Number(fields.childChair || 0) > Number(fields.childCount)
    ) {
        throw new Error("兒童餐具與座椅數量不能大於小孩人數");
    }
}

function toCount(value) {
    if (value === undefined || value === null || value === "") return "";
    const number = Number(value);
    if (!Number.isInteger(number) || number < 0 || number > 6) {
        throw new Error("人數或數量格式錯誤");
    }
    return number;
}

function cleanValue(value, maxLength) {
    const text = String(value || "").trim().slice(0, maxLength || 1000);
    return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function normalizeSubmittedPhone(value) {
    let phone = String(value || "").trim().replace(/[\s-]/g, "");
    if (!phone) return "";
    if (!/^(?:09\d{8}|\+8869\d{8})$/.test(phone)) {
        throw new Error("聯絡手機格式錯誤");
    }
    if (phone.startsWith("+886")) phone = `0${phone.slice(4)}`;
    return phone;
}

function normalizeResponseId(value) {
    const id = String(value || "").trim().toUpperCase();
    return /^[A-Z0-9]{8}$/.test(id) ? id : "";
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function normalize(value) {
    return String(value || "").replace(/^'/, "").replace(/\s+/g, "").toLowerCase();
}

function normalizePhone(value) {
    return String(value || "").replace(/\D/g, "");
}

function createResponse(success, message) {
    return ContentService
        .createTextOutput(JSON.stringify({ success, message }))
        .setMimeType(ContentService.MimeType.JSON);
}
