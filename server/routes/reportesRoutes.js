const express = require("express");
const { db } = require("../config/db");
const { auth } = require("../middleware/auth");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");

const router = express.Router();

router.get("/inspeccion/:id/pdf", auth, (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT i.*, 
           u.nombre AS conductor, u.rut AS rut_conductor, u.direccion AS direccion_conductor,
           u.telefono AS telefono_conductor, u.licencia AS licencia_conductor,
           v.patente AS vehiculo
    FROM inspecciones i
    JOIN usuarios u ON u.id = i.usuario_id
    JOIN vehiculos v ON v.id = i.vehiculo_id
    WHERE i.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err || !results.length)
      return res.status(404).send("Inspección no encontrada");

    const data = results[0];
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=inspeccion_${id}.pdf`
    );

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 60, bottom: 60, left: 35, right: 35 },
    });
    doc.pipe(res);

    const logoPath = path.join(__dirname, "../public/logo-curacavi.png");
    doc.font("Helvetica");

    // === ENCABEZADO ===
    const drawHeader = () => {
      const L = doc.page.margins.left;
      const usableWidth =
        doc.page.width - doc.page.margins.left - doc.page.margins.right;

      try {
        if (fs.existsSync(logoPath)) doc.image(logoPath, L, 25, { width: 60 });
      } catch {
        console.warn("⚠️ No se encontró public/logo-curacavi.png");
      }

      // Encabezado institucional
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .text("MUNICIPALIDAD DE CURACAVÍ", L + 80, 30)
        .fontSize(10)
        .fillColor("#000")
        .text(
          "Dirección de Operaciones, Departamento de Movilización.",
          L + 80,
          45
        );

      // Línea divisoria
      doc
        .moveTo(L, 65)
        .lineTo(L + usableWidth, 65)
        .strokeColor("#003366")
        .lineWidth(1)
        .stroke();

      // Título del informe (alineado a la izquierda)
      doc.moveDown(1);
      doc
        .font("Helvetica-Bold")
        .fontSize(14)
        .fillColor("#003366")
        .moveDown(0.5)
        .text("INFORME DE INSPECCIÓN VEHICULAR", L + 0, doc.y, {
          align: "left",
          width: usableWidth - 15, // asegura que no corte texto
        })
        .moveDown(0.5);

      doc.font("Helvetica").fillColor("#000").fontSize(10);
    };

    drawHeader();
    doc.on("pageAdded", drawHeader);

    const L = () => doc.page.margins.left;

    // === DATOS DE INSPECCIÓN ===
    doc.moveDown(1.5);
    doc
      .font("Helvetica-Bold")
      .fillColor("#003366")
      .text("Datos de la Inspección", L());
    doc.fillColor("#000").font("Helvetica").fontSize(10);
    doc.text(`ID Inspección: ${id}`);
    doc
      .text("Vehículo:", { continued: true })
      .font("Helvetica-Bold")
      .text(` ${data.vehiculo}`);
    doc.font("Helvetica");
    doc
      .text("Fecha:", { continued: true })
      .font("Helvetica-Bold")
      .text(` ${new Date(data.created_at).toLocaleString("es-CL")}`);
    //doc.text(`Estado General: ${data.estado || "OK"}`);
    doc.moveDown(1);

    // === DATOS DEL CONDUCTOR ===
    doc
      .font("Helvetica-Bold")
      .fillColor("#003366")
      .text("Datos del Conductor", L());
    doc.fillColor("#000").font("Helvetica").fontSize(10);
    doc
      .text("Conductor:", { continued: true })
      .font("Helvetica-Bold")
      .text(` ${data.conductor}`);
    doc.font("Helvetica");
    if (data.rut_conductor)
      doc
        .text("RUT:", { continued: true })
        .font("Helvetica-Bold")
        .text(` ${data.rut_conductor}`);
    doc.font("Helvetica");
    if (data.direccion_conductor)
      doc.text(`Dirección: ${data.direccion_conductor}`);
    if (data.telefono_conductor)
      doc.text(`Teléfono: ${data.telefono_conductor}`);
    if (data.licencia_conductor)
      doc.text(`Clase Licencia: ${data.licencia_conductor}`);
    doc.moveDown(1);

    // === OBSERVACIONES ===
    doc
      .font("Helvetica-Bold")
      .fillColor("#003366")
      .text("Observaciones Generales", L());
    doc.moveDown(0.5);
    doc
      .fillColor("#000")
      .text(data.observacion || "Sin observaciones registradas.");
    doc.moveDown(3);
    doc.moveDown(1);
    // === FOTO CENTRADA ===
    if (data.foto) {
      try {
        const base64Data = data.foto.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        const tempPath = path.join(__dirname, `temp_${id}.jpg`);
        fs.writeFileSync(tempPath, buffer);

        doc
          .font("Helvetica-Bold")
          .fillColor("#003366")
          .text("Evidencia Fotográfica", L());
        doc.moveDown(0.5);

        const imageWidth = 250;
        const imageHeight = 160;
        const pageWidth = doc.page.width;
        const leftMargin = doc.page.margins.left;
        const rightMargin = doc.page.margins.right;
        const usableWidth = pageWidth - leftMargin - rightMargin;
        const x = leftMargin + (usableWidth - imageWidth) / 2;
        const currentY = doc.y;

        doc.image(tempPath, x, currentY, {
          width: imageWidth,
          height: imageHeight,
        });
        doc.y = currentY + imageHeight + 25;
        fs.unlinkSync(tempPath);
      } catch (e) {
        console.error("Error procesando imagen:", e);
      }
    }

    // === ÍTEMS EN TABLA ===
    db.query(
      "SELECT item_key, existe, estado, obs FROM inspeccion_items WHERE inspeccion_id=?",
      [id],
      (err2, items) => {
        if (err2) {
          doc.text("Error al obtener ítems de inspección.");
          doc.end();
          return;
        }

        const baseItems = [
          
  // 1 - SISTEMA DE LUCES
  "Luces de estacionamiento",
  "Luces bajas",
  "Luces altas",
  "Luz de freno (incluye tercera luz)",
  "Luz de marcha atrás",
  "Luz de viraje derecho",
  "Luz de viraje izquierdo",
  "Luz de emergencia",
  "Luz de patente",
  "Baliza",

  // 2 - SISTEMA DE FRENO
  "Freno de mano",
  "Freno de pedal",
  "Freno otros",

  // 3 - NEUMÁTICOS
  "Neumático delantero derecho",
  "Neumático delantero izquierdo",
  "Neumático trasero derecho",
  "Neumático trasero izquierdo",
  "Neumático de repuesto",
  "Neumáticos otros",

  // 4 - NIVELES / MOTOR
  "Aceite de motor",
  "Agua del radiador",
  "Líquido de freno",
  "Correas",
  "Agua de batería",

  // 5 - ACCESORIOS Y DOCUMENTOS
  "Extintor",
  "Botiquín",
  "Gata",
  "Llave de ruedas",
  "Triángulos",
  "Chaleco reflectante",
  "Limpia parabrisas",
  "Herramientas",
  "Cinturón de seguridad",
  "Espejos laterales",
  "Espejo interior",
  "Radiotransmisor",
  "Bocina de retroceso",
  "Antena",
  "Permiso de circulación",
  "Revisión técnica",
  "Seguro obligatorio",

  // 6 - ESTADO GENERAL Y REMOLQUE
  "Techo",
  "Capot",
  "Puertas",
  "Vidrios",
  "Tapabarros",
  "Pick-up",
  "Parachoques",
  "Tubo de escape",
  "Aseo de cabina",
  "Sanitización COVID-19",
];

        const merged = baseItems.map((b) => {
          const f = items?.find((i) => i.item_key === b);
          return {
            item_key: b,
            existe: f?.existe || "SI",
            estado: f?.estado || "Bueno",
            obs: f?.obs || "",
          };
        });

        doc.moveDown(1);
        doc
          .font("Helvetica-Bold")
          .fillColor("#003366")
          .text("Ítems Inspeccionados", L());
        doc.moveDown(0.5);
        doc.fillColor("#000");

        const startX = L();
        let y = doc.y;
        const colWidths = [180, 60, 80, 150];
        const headers = ["Ítem", "Existe", "Estado", "Observaciones"];
        const rowHeight = 18;

        // CABECERA
        doc
          .rect(
            startX,
            y,
            colWidths.reduce((a, b) => a + b),
            rowHeight
          )
          .fillAndStroke("#003366", "#003366");
        doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);
        let x = startX;
        headers.forEach((h, i) => {
          doc.text(h, x + 5, y + 4, {
            width: colWidths[i] - 10,
            align: "left",
          });
          x += colWidths[i];
        });

        // FILAS
        y += rowHeight;
        doc.font("Helvetica").fontSize(9).fillColor("#000");
        merged.forEach((it, index) => {
          if (y > doc.page.height - 120) {
            doc.addPage();
            drawHeader();
            y = doc.y + 20;
            doc
              .rect(
                startX,
                y,
                colWidths.reduce((a, b) => a + b),
                rowHeight
              )
              .fillAndStroke("#003366", "#003366");
            doc.fillColor("#FFF").font("Helvetica-Bold").fontSize(10);
            x = startX;
            headers.forEach((h, i) => {
              doc.text(h, x + 5, y + 4, {
                width: colWidths[i] - 10,
                align: "left",
              });
              x += colWidths[i];
            });
            y += rowHeight;
            doc.font("Helvetica").fontSize(9).fillColor("#000");
          }

          const fillColor = index % 2 === 0 ? "#F9F9F9" : "#FFFFFF";
          doc
            .rect(
              startX,
              y,
              colWidths.reduce((a, b) => a + b),
              rowHeight
            )
            .fillAndStroke(fillColor, "#CCCCCC");

          x = startX;
          doc
            .fillColor("#000")
            .text(it.item_key, x + 5, y + 4, { width: colWidths[0] - 10 });
          x += colWidths[0];
          doc.text(it.existe, x + 5, y + 4, { width: colWidths[1] - 10 });
          x += colWidths[1];
          const estadoColor = it.estado === "Bueno" ? "#008000" : "#CC0000";
          doc
            .fillColor(estadoColor)
            .text(it.estado, x + 5, y + 4, { width: colWidths[2] - 10 });
          x += colWidths[2];
          doc
            .fillColor("#000")
            .text(it.obs || "-", x + 5, y + 4, { width: colWidths[3] - 10 });
          y += rowHeight;
        });

        // Actualizar cursor
        doc.y = y + 20;
        //doc.addPage();

        doc.moveDown(5);
        // === FIRMAS ===
        const availableY = doc.page.height - doc.page.margins.bottom - 80;
        if (doc.y > availableY) doc.addPage();

        const ySign = Math.min(doc.y, availableY);
        doc.font("Helvetica-Bold").fillColor("#000");
        doc.text("_____________________________", L(), ySign);
        doc.text(`Conductor: ${data.conductor}`, L() + 15, ySign + 12);
        if (data.rut_conductor)
          doc.text(`RUT: ${data.rut_conductor}`, L() + 15, ySign + 24);
        doc.text("_____________________________", L() + 260, ySign);
        doc.text("Supervisor:", L() + 270, ySign + 12);

        // PIE DE PÁGINA
        const footerY = doc.page.height - 40;
        doc
          .fontSize(8)
          .fillColor("#666")
          .text(
            "Municipalidad de Curacaví - Departamento de Transporte",
            L(),
            footerY,
            { align: "center" }
          );

        doc.end();
      }
    );
  });
});

module.exports = router;
