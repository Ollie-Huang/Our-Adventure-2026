window.RSVPReceipt = (() => {
    const canvas = document.querySelector("#receipt-canvas");
    const context = canvas.getContext("2d");
    let receiptFile = null;

    function buildRows(data) {
        const rows = [
            ["回覆編號", data.responseId],
            ["姓名", data.name],
            ["與新人關係", data.relationship],
            ["婚宴出席", data.attendance]
        ];

        if (data.ceremonyInvited === "是") {
            rows.push(["證婚儀式", data.ceremonyAttendance]);
        }

        if (data.attendance === "出席") {
            rows.push(["出席人數", `大人 ${data.adultCount} 位・小孩 ${data.childCount} 位`]);
            rows.push(["大人餐點", `葷食 ${data.meatCount} 位・素食 ${data.vegetarianCount} 位`]);
            rows.push(["喜帖形式", data.invitationType]);

            if (Number(data.childCount) > 0) {
                rows.push(["兒童用品", `餐具 ${data.childTableware} 副・座椅 ${data.childChair} 張`]);
            }
        }

        return rows;
    }

    function roundedRect(x, y, width, height, radius) {
        context.beginPath();
        if (typeof context.roundRect === "function") {
            context.roundRect(x, y, width, height, radius);
            return;
        }

        context.moveTo(x + radius, y);
        context.arcTo(x + width, y, x + width, y + height, radius);
        context.arcTo(x + width, y + height, x, y + height, radius);
        context.arcTo(x, y + height, x, y, radius);
        context.arcTo(x, y, x + width, y, radius);
        context.closePath();
    }

    function drawText(text, x, y, font, color, align = "left") {
        context.font = font;
        context.fillStyle = color;
        context.textAlign = align;
        context.fillText(text, x, y);
    }

    function drawReceipt(data) {
        const rows = buildRows(data);
        const rowHeight = 86;
        canvas.width = 1080;
        canvas.height = 690 + rows.length * rowHeight;

        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#fbf8f3");
        gradient.addColorStop(0.55, "#f7f1e8");
        gradient.addColorStop(1, "#eef3f0");
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.strokeStyle = "rgba(212, 163, 115, 0.35)";
        context.lineWidth = 3;
        context.beginPath();
        context.arc(1020, 70, 190, 0, Math.PI * 2);
        context.stroke();
        context.beginPath();
        context.arc(52, canvas.height - 40, 155, 0, Math.PI * 2);
        context.stroke();

        drawText("WEDDING RSVP", 540, 105, '600 28px "Cormorant Garamond"', "#d4a373", "center");
        drawText("李玟慧・黃冠禎", 540, 175, '400 54px "LXGW WenKai TC"', "#52675e", "center");
        drawText("2026.12.12　台南晶英酒店", 540, 225, '400 24px "Noto Serif TC"', "#77706a", "center");

        roundedRect(110, 280, 860, rows.length * rowHeight + 62, 30);
        context.fillStyle = "rgba(255, 255, 255, 0.86)";
        context.shadowColor = "rgba(70, 66, 59, 0.12)";
        context.shadowBlur = 34;
        context.shadowOffsetY = 14;
        context.fill();
        context.shadowColor = "transparent";

        rows.forEach(([label, value], index) => {
            const y = 338 + index * rowHeight;
            drawText(label, 165, y + 30, '500 23px "Noto Serif TC"', "#71877d");
            drawText(String(value || "—"), 915, y + 30, '400 25px "LXGW WenKai TC"', "#474642", "right");

            if (index < rows.length - 1) {
                context.strokeStyle = "rgba(141, 163, 153, 0.22)";
                context.lineWidth = 1;
                context.beginPath();
                context.moveTo(165, y + 60);
                context.lineTo(915, y + 60);
                context.stroke();
            }
        });

        const footerY = 400 + rows.length * rowHeight;
        drawText("回覆已送出，謝謝您的填寫", 540, footerY + 42, '400 28px "LXGW WenKai TC"', "#52675e", "center");
        drawText("此圖片僅供留存，實際內容以新人收到的紀錄為準。", 540, footerY + 88, '400 18px "Noto Serif TC"', "#8a837c", "center");
    }

    async function prepare(data) {
        if (document.fonts?.ready) {
            await document.fonts.ready;
        }

        drawReceipt(data);

        const blob = await new Promise((resolve) => {
            canvas.toBlob(resolve, "image/png", 0.95);
        });

        if (!blob) {
            throw new Error("無法產生回覆圖片");
        }

        const safeName = String(data.name || "賓客").replace(/[\\/:*?"<>|]/g, "");
        receiptFile = new File(
            [blob],
            `婚禮回覆_${safeName}_${data.responseId}.png`,
            { type: "image/png" }
        );

        return receiptFile;
    }

    async function save() {
        if (!receiptFile) {
            throw new Error("回覆圖片尚未準備完成");
        }

        const canShareFile =
            navigator.share &&
            navigator.canShare?.({ files: [receiptFile] }) &&
            window.matchMedia("(pointer: coarse)").matches;

        if (canShareFile) {
            await navigator.share({
                files: [receiptFile],
                title: "婚禮出席回覆",
                text: "儲存我的婚禮出席回覆"
            });
            return;
        }

        const url = URL.createObjectURL(receiptFile);
        const link = document.createElement("a");
        link.href = url;
        link.download = receiptFile.name;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    return { prepare, save };
})();
