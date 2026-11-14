import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface InvoiceData {
  transaction: any;
  branch: any;
  cashierName: string | null;
  generatedVouchers: any[];
}

export class InvoicePdfService {
  /**
   * Generates a branded Nyenyak thermal-style digital receipt PDF and returns Base64 string
   */
  static async generateInvoiceBase64(data: InvoiceData): Promise<string> {
    const pdfBytes = await this.generateInvoiceBytes(data);
    return Buffer.from(pdfBytes).toString("base64");
  }

  /**
   * Generates raw PDF Uint8Array bytes formatted as an elegant digital receipt slip
   */
  static async generateInvoiceBytes(data: InvoiceData): Promise<Uint8Array> {
    const { transaction, branch, cashierName, generatedVouchers } = data;

    const items = transaction.items || [];
    const payments = transaction.payments || [];
    const voucherRedemptions = transaction.voucherRedemptions || [];
    const discountTotal = Number(transaction.discountTotal || 0);
    const subtotal = Number(transaction.subtotal || 0);
    const totalAmount = Number(transaction.totalAmount || 0);
    const paidAmount = Number(transaction.paidAmount || 0);
    const changeAmount = Number(transaction.changeAmount || 0);
    const taxTotal = Number(transaction.taxTotal || 0);

    // 1. Calculate dynamic receipt height
    const slipWidth = 210; // Clean, delicate digital thermal receipt width
    const margin = 14;
    const contentWidth = slipWidth - margin * 2;

    let estHeight = 26; // top & bottom margins
    estHeight += 21 + 9 + 8 + 8; // logo (~21pt), branch, address, phone
    estHeight += 12; // divider
    estHeight += 8.5 * 4; // receipt meta (no struk, date, cashier, customer)
    estHeight += 12; // divider

    for (const item of items) {
      estHeight += 9; // name
      estHeight += 8.5; // qty x price ... subtotal
      if (Number(item.discountAmount) > 0) estHeight += 8;
      estHeight += 2; // item spacing
    }
    estHeight += 12; // divider

    estHeight += 8.5; // subtotal
    if (discountTotal > 0) estHeight += 8.5;
    if (taxTotal > 0) estHeight += 8.5;
    estHeight += 14; // total akhir
    estHeight += Math.max(1, payments.length) * 8.5;
    if (changeAmount > 0) estHeight += 8.5;
    estHeight += 12; // divider

    if (generatedVouchers.length > 0) {
      estHeight += 14 + generatedVouchers.length * 16 + 4;
    }
    if (voucherRedemptions.length > 0) {
      estHeight += 14 + voucherRedemptions.length * 9 + 4;
    }

    estHeight += 26; // footer thank you note & disclaimer

    const slipHeight = Math.ceil(Math.max(220, estHeight));

    const doc = await PDFDocument.create();
    const page = doc.addPage([slipWidth, slipHeight]);

    const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    // Palette (Clean, understated, authentic receipt)
    const primaryDark = rgb(0.14, 0.14, 0.16);
    const textMuted = rgb(0.44, 0.44, 0.48);
    const dividerColor = rgb(0.8, 0.8, 0.83);
    const discountColor = rgb(0.4, 0.4, 0.44);

    let y = slipHeight - 14;

    // Helper: Draw centered text
    const drawCenteredText = (text: string, fontSize: number, isBold: boolean, color: any, extraGap = 2) => {
      const font = isBold ? fontBold : fontRegular;
      const textW = font.widthOfTextAtSize(text, fontSize);
      page.drawText(text, {
        x: (slipWidth - textW) / 2,
        y,
        size: fontSize,
        font,
        color,
      });
      y -= fontSize + extraGap;
    };

    // Helper: Draw 2-column key-value row with automatic collision prevention
    const drawRow = (
      leftText: string,
      rightText: string,
      fontSize = 5.5,
      isBold = false,
      leftColor = textMuted,
      rightColor = primaryDark,
      extraGap = 2.8
    ) => {
      const font = isBold ? fontBold : fontRegular;
      const rightW = font.widthOfTextAtSize(rightText, fontSize);
      const rightX = slipWidth - margin - rightW;

      // Ensure leftText never overlaps with right column
      const maxLeftW = rightX - margin - 5;
      let safeLeft = leftText;
      if (font.widthOfTextAtSize(safeLeft, fontSize) > maxLeftW) {
        while (safeLeft.length > 4 && font.widthOfTextAtSize(safeLeft + "...", fontSize) > maxLeftW) {
          safeLeft = safeLeft.slice(0, -1);
        }
        safeLeft += "...";
      }

      page.drawText(safeLeft, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: leftColor,
      });

      page.drawText(rightText, {
        x: rightX,
        y,
        size: fontSize,
        font,
        color: rightColor,
      });
      y -= fontSize + extraGap;
    };

    // Helper: Draw dashed line divider with comfortable breathing room
    const drawDashedDivider = () => {
      y -= 3; // gap above divider
      page.drawLine({
        start: { x: margin, y },
        end: { x: slipWidth - margin, y },
        thickness: 0.45,
        color: dividerColor,
        dashArray: [2.5, 2],
      });
      y -= 8; // gap below divider before next text
    };

    // 2. Header Section (Tasteful, appropriately sized brand logo)
    try {
      const logoPath = path.join(process.cwd(), "public", "logo-long.png");
      const logoBuffer = await fs.readFile(logoPath);
      const logoImage = await doc.embedPng(logoBuffer);
      const targetWidth = 80; // Delicate proportion
      const targetHeight = targetWidth * (logoImage.height / logoImage.width);
      page.drawImage(logoImage, {
        x: (slipWidth - targetWidth) / 2,
        y: y - targetHeight,
        width: targetWidth,
        height: targetHeight,
      });
      y -= targetHeight + 6;
    } catch {
      try {
        const fallbackPath = path.join(process.cwd(), "public", "logo.png");
        const fbBuffer = await fs.readFile(fallbackPath);
        const fbImage = await doc.embedPng(fbBuffer);
        const targetHeight = 24;
        const targetWidth = targetHeight * (fbImage.width / fbImage.height);
        page.drawImage(fbImage, {
          x: (slipWidth - targetWidth) / 2,
          y: y - targetHeight,
          width: targetWidth,
          height: targetHeight,
        });
        y -= targetHeight + 5;
      } catch {
        drawCenteredText("NYENYAK HEALING POINT", 7.5, true, primaryDark, 2);
      }
    }

    const branchName = branch?.name ? `Cabang ${branch.name}` : "Pusat Operasional";
    drawCenteredText(branchName, 6.5, true, primaryDark, 2);

    if (branch?.address) {
      const addr = branch.address.length > 45 ? branch.address.substring(0, 45) + "..." : branch.address;
      drawCenteredText(addr, 5.5, false, textMuted, 2);
    }
    if (branch?.phone) {
      drawCenteredText(`Telp / WA: ${branch.phone}`, 5.5, false, textMuted, 2.5);
    }

    drawDashedDivider();

    // 3. Receipt Metadata
    const txNum = transaction.transactionNumber || "-";
    const txDate = transaction.createdAt ? new Date(transaction.createdAt) : new Date();
    const dateFormatted = format(txDate, "dd/MM/yyyy HH:mm", { locale: id });
    const cashierDisplay = cashierName || transaction.cashierId || "Kasir";
    const customerName = transaction.customer?.name || "Pelanggan Umum";

    drawRow("No. Struk", txNum, 5.5, false, textMuted, primaryDark, 2.8);
    drawRow("Waktu", dateFormatted, 5.5, false, textMuted, primaryDark, 2.8);
    drawRow("Kasir", cashierDisplay, 5.5, false, textMuted, primaryDark, 2.8);
    drawRow("Pelanggan", customerName, 5.5, false, textMuted, primaryDark, 2.8);

    drawDashedDivider();

    // 4. Itemized Purchases
    for (const item of items) {
      const itemName = item.itemNameSnapshot || "Item Layanan";
      const truncatedName = itemName.length > 32 ? itemName.substring(0, 32) + "..." : itemName;

      // Item Name
      page.drawText(truncatedName, {
        x: margin,
        y,
        size: 6.2,
        font: fontBold,
        color: primaryDark,
      });
      y -= 6.2 + 2.5;

      // Qty x Unit Price (Left) & Subtotal (Right)
      const unitPrice = Number(item.unitPrice ?? item.priceSnapshot ?? 0);
      const itemSubtotal = Number(item.subtotal ?? item.subtotalSnapshot ?? (unitPrice * (item.quantity || 1)));
      const qtyPriceStr = `${item.quantity || 1} x ${this.formatRupiah(unitPrice)}`;
      const itemSubtotalStr = this.formatRupiah(itemSubtotal);
      drawRow(qtyPriceStr, itemSubtotalStr, 5.5, false, textMuted, primaryDark, 2.8);

      // Discount if any
      const itemDisc = Number(item.discountAmount || 0);
      if (itemDisc > 0) {
        drawRow("Diskon", `-${this.formatRupiah(itemDisc)}`, 5.2, false, discountColor, discountColor, 2.5);
      }

      y -= 1.5;
    }

    drawDashedDivider();

    // 5. Totals & Payment Summary (Clean, minimal, no colored fill box)
    drawRow("Subtotal", this.formatRupiah(subtotal), 5.5, false, textMuted, primaryDark, 2.8);

    if (discountTotal > 0) {
      drawRow("Total Diskon", `-${this.formatRupiah(discountTotal)}`, 5.5, false, discountColor, discountColor, 2.8);
    }

    if (taxTotal > 0) {
      drawRow("Pajak", this.formatRupiah(taxTotal), 5.5, false, textMuted, primaryDark, 2.8);
    }

    // Grand Total (Clean solid bold line, authentic receipt style)
    y -= 1.5;
    drawRow("TOTAL AKHIR", this.formatRupiah(totalAmount), 6.8, true, primaryDark, primaryDark, 3.2);
    y -= 1.5;

    // Payment methods breakdown
    if (payments.length > 0) {
      for (const p of payments) {
        const pmName = p.paymentMethod?.name || p.paymentMethod?.type || "Bayar";
        const refStr = p.referenceNumber ? ` (${p.referenceNumber})` : "";
        drawRow(`Bayar (${pmName}${refStr})`, this.formatRupiah(Number(p.amount)), 5.5, false, textMuted, primaryDark, 2.8);
      }
    } else {
      drawRow("Status Bayar", "Belum Bayar (Pay Later)", 5.5, false, textMuted, textMuted, 2.8);
    }

    if (changeAmount > 0) {
      drawRow("Kembalian", this.formatRupiah(changeAmount), 5.5, false, textMuted, primaryDark, 2.8);
    }

    // 6. Vouchers Section (if any)
    if (generatedVouchers.length > 0) {
      drawDashedDivider();
      page.drawText("VOUCHER DIDAPATKAN:", {
        x: margin,
        y,
        size: 5.8,
        font: fontBold,
        color: primaryDark,
      });
      y -= 8;

      for (const gv of generatedVouchers) {
        const vPacket = gv.voucherPacket?.name || "Voucher";
        const exp = gv.expiresAt ? format(new Date(gv.expiresAt), "dd/MM/yyyy", { locale: id }) : "Tanpa Batas";
        page.drawText(`• ${vPacket}`, {
          x: margin + 3,
          y,
          size: 5.5,
          font: fontBold,
          color: primaryDark,
        });
        y -= 7.5;
        page.drawText(`  Kode: ${gv.code} (s/d: ${exp})`, {
          x: margin + 3,
          y,
          size: 5.2,
          font: fontRegular,
          color: textMuted,
        });
        y -= 8;
      }
    }

    if (voucherRedemptions.length > 0) {
      drawDashedDivider();
      page.drawText("VOUCHER DIGUNAKAN:", {
        x: margin,
        y,
        size: 5.8,
        font: fontBold,
        color: primaryDark,
      });
      y -= 8;

      for (const vr of voucherRedemptions) {
        const vPacket = vr.customerVoucher?.voucherPacket?.name || "Voucher";
        const code = vr.customerVoucher?.code || "-";
        const val = vr.redeemedVisitCount ? "1 Kunjungan" : this.formatRupiah(Number(vr.redeemedAmount || 0));
        drawRow(`• ${vPacket} (${code})`, val, 5.5, false, textMuted, primaryDark, 2.5);
      }
    }

    drawDashedDivider();

    // 7. Footer Thank You & Closing
    drawCenteredText("TERIMA KASIH", 6.2, true, primaryDark, 2);
    drawCenteredText("Kenyamanan & relaksasi Anda prioritas kami.", 5.5, false, textMuted, 1.8);
    drawCenteredText("Simpan struk digital ini sebagai bukti sah.", 5, false, textMuted, 1.8);

    return await doc.save();
  }

  private static formatRupiah(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}
