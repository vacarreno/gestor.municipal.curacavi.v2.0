// routes/mantencionesPdfRoutes.js
const express = require("express");
const path = require("path");
const PDFDocument = require("pdfkit");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");

const router = express.Router();

/* ============================================================
   ============ GENERAR PDF DE MANTENCIÓN ======================
   ============================================================ */
router.get("/:id/pdf", auth, async (req, res) => {
  const { id } = req.params;

  try {
    /* ================= CONSULTA PRINCIPAL ================= */
    const { rows: mantRows } = await db.query(
      `
      SELECT 
        m.*, 
        v.patente AS vehiculo,
        v.numero_interno,
        u.nombre AS responsable
      FROM mantenciones m
      JOIN vehiculos v ON v.id = m.vehiculo_id
      LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.id = $1
      `,
      [id]
    );

    if (!mantRows.length)
      return res.status(404).send("Mantención no encontrada");

    const data = mantRows[0];

    /* ================= DETALLE DE ÍTEMS ================= */
    const { rows: items } = await db.query(
      `
      SELECT item, tipo, cantidad, costo_unitario,
             cantidad * costo_unitario AS subtotal
      FROM mantencion_items
      WHERE mantencion_id = $1
      `,
      [id]
    );

    /* ================= CONFIG PDF ================= */
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=mantencion_${id}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 35, right: 35 },
      bufferPages: true,
    });

    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo-curacavi.png");

    /* ================= HEADER GLOBAL ================= */
    const drawHeader = (current, total) => {
      const L = doc.page.margins.left;
      const W = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      try {
        const fs = require("fs");
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, L, 25, { width: 60 });
        }
      } catch {}

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("MUNICIPALIDAD DE CURACAVÍ", L + 80, 30)
        .fontSize(10)
        .fillColor("#000")
        .text("Dirección de Operaciones — Departamento de Movilización", L + 80, 45);

      doc
        .moveTo(L, 65)
        .lineTo(L + W, 65)
        .strokeColor("#003366")
        .lineWidth(1)
        .stroke();

      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("INFORME DE MANTENCIÓN VEHICULAR", L, 75);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#666")
        .text(`Página ${current} de ${total}`, L, 95);
    };

    /* ================= CONTENIDO ================= */
    drawHeader(1, 1);

    const L = doc.page.margins.left;

    // DATOS GENERALES
    doc.moveDown(3);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#003366").text("Datos Generales", L);
    doc.font("Helvetica").fontSize(10).fillColor("#000").moveDown(0.7);

    doc.text(`ID Mantención: ${id}`);
    doc.text(`Vehículo: ${data.vehiculo} (${data.numero_interno})`);
    doc.text(`Tipo: ${data.tipo}`);
    doc.text(`Responsable: ${data.responsable || "Sin asignar"}`);
    doc.text(
      `Fecha: ${new Date(data.fecha).toLocaleString("es-CL", {
        dateStyle: "short",
        timeStyle: "short",
      })}`
    );
    doc.text(`Costo total: $${Number(data.costo || 0).toLocaleString("es-CL")}`);

    // OBSERVACIONES
    doc.moveDown(1.5);
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#003366").text("Observaciones", L);
    doc.font("Helvetica").fontSize(10).fillColor("#000").moveDown(0.5);
    doc.text(data.observacion || "Sin observaciones registradas.", {
      width: 480,
    });

    /* ================= TABLA DETALLE ================= */
    doc.moveDown(2);

    if (items.length) {
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#003366")
        .text("Detalle de Tareas y Repuestos", L);

      doc.moveDown(0.7);

      const startX = L;
      const colWidths = [160, 70, 60, 80, 80];
      const headers = [
        "Ítem / Descripción",
        "Tipo",
        "Cantidad",
        "Costo Unitario",
        "Subtotal",
      ];
      const rowHeight = 18;

      let y = doc.y;

      // HEADER TABLA
      doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight)
        .fillAndStroke("#003366", "#003366");

      doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);
      let x = startX;

      headers.forEach((h, i) => {
        doc.text(h, x + 5, y + 4, { width: colWidths[i] - 10 });
        x += colWidths[i];
      });

      y += rowHeight;

      doc.font("Helvetica").fontSize(9).fillColor("#000");

      let total = 0;

      for (let i = 0; i < items.length; i++) {
        const it = items[i];

        // NUEVA PÁGINA SI ES NECESARIO
        if (y > doc.page.height - 120) {
          doc.addPage();
          y = doc.page.margins.top + 20;
          drawHeader(1, 1); // luego será corregido en bufferPages
        }

        const bg = i % 2 === 0 ? "#F9F9F9" : "#FFFFFF";

        doc.rect(startX, y, colWidths.reduce((a, b) => a + b), rowHeight)
          .fillAndStroke(bg, "#CCCCCC");

        let colX = startX;

        doc.text(it.item, colX + 5, y + 4, { width: colWidths[0] - 10 });
        colX += colWidths[0];

        doc.text(it.tipo || "-", colX + 5, y + 4);
        colX += colWidths[1];

        doc.text(it.cantidad || "-", colX + 5, y + 4);
        colX += colWidths[2];

        doc.text(`$${Number(it.costo_unitario).toLocaleString("es-CL")}`,
          colX + 5, y + 4);
        colX += colWidths[3];

        doc.text(`$${Number(it.subtotal).toLocaleString("es-CL")}`,
          colX + 5, y + 4);

        y += rowHeight;
        total += Number(it.subtotal || 0);
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#000")
        .text(`TOTAL: $${total.toLocaleString("es-CL")}`, startX + 290, y + 12);

    } else {
      doc.text("Sin registro de tareas ni repuestos asociados.", L);
    }

    /* ================= FIRMAS ================= */
    doc.moveDown(4);
    doc.text("_____________________________", L);
    doc.text("Firma Responsable", L + 15, doc.y + 12);

    doc.text("_____________________________", L + 250, doc.y - 12);
    doc.text("Supervisor", L + 270, doc.y + 12);

    /* ================= PAGINACIÓN ================= */
    const pages = doc.bufferedPageRange();

    for (let i = pages.start; i < pages.start + pages.count; i++) {
      doc.switchToPage(i);
      drawHeader(i - pages.start + 1, pages.count);
    }

    doc.end();

  } catch (err) {
    console.error("❌ Error generando PDF de mantención:", err);
    res.status(500).send("Error al generar PDF");
  }
});

module.exports = router;
