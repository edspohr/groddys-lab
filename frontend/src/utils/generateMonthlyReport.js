import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const generateMonthlyReport = (
  tasks,
  metrics,
  companyName = "Cliente",
  userProfile
) => {
  const doc = new jsPDF();
  const today = format(new Date(), "d 'de' MMMM, yyyy", { locale: es });
  const currentMonth = format(new Date(), "MMMM yyyy", { locale: es });

  // --- Header ---
  // Brand Color Strip
  doc.setFillColor(45, 212, 191); // Brand Turquoise
  doc.rect(0, 0, 210, 5, "F");

  doc.setFontSize(22);
  doc.setTextColor(20, 20, 20);
  doc.text("Reporte Mensual de Avance", 14, 25);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${today}`, 14, 32);
  doc.text(`Cliente: ${companyName}`, 14, 37);
  if (userProfile?.displayName) {
    doc.text(`Solicitante: ${userProfile.displayName}`, 14, 42);
  }

  // --- Executive Summary ---
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.text("Resumen Ejecutivo", 14, 55);
  doc.setLineWidth(0.5);
  doc.line(14, 57, 196, 57);

  doc.setFontSize(10);
  doc.setTextColor(60);
  const summaryText = `Durante el mes de ${currentMonth}, se ha trabajado en la estabilización y crecimiento de la plataforma. A continuación se presentan las métricas clave de rendimiento y el detalle de las tareas completadas.`;
  doc.text(summaryText, 14, 65, { maxWidth: 180 });

  // --- Metrics Cards (Simulated) ---
  const startY = 80;

  // Card 1: Active
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, startY, 55, 30, 3, 3, "F");
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.text("TAREAS ACTIVAS", 20, startY + 10);
  doc.setTextColor(45, 212, 191); // Turquoise
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(metrics.active), 20, startY + 22);

  // Card 2: Completed
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(77, startY, 55, 30, 3, 3, "F");
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("COMPLETADAS (HISTÓRICO)", 83, startY + 10);
  doc.setTextColor(34, 197, 94); // Green
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(metrics.completed), 83, startY + 22);

  // Card 3: Hours Saved
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(140, startY, 55, 30, 3, 3, "F");
  doc.setTextColor(100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("HORAS AHORRADAS", 146, startY + 10);
  doc.setTextColor(234, 179, 8); // Yellow
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${metrics.saved}h`, 146, startY + 22);

  // --- Detailed Task Table ---
  doc.setFontSize(14);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text("Detalle de Tareas Completadas", 14, startY + 45);
  doc.setLineWidth(0.5);
  doc.line(14, startY + 47, 196, startY + 47);

  // Filter completed tasks
  const completedTasks = tasks.filter((t) => t.columnId === "done");

  if (completedTasks.length > 0) {
    const tableData = completedTasks.map((t) => [
      t.title,
      t.category || "-",
      t.priority || "Medium",
      `${t.actualHours || 0}h`,
      format(
        t.updatedAt?.toDate ? t.updatedAt.toDate() : new Date(),
        "dd/MM/yyyy"
      ),
    ]);

    autoTable(doc, {
      startY: startY + 55,
      head: [["Tarea", "Categoría", "Prioridad", "Horas", "Fecha"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [66, 66, 66] },
      styles: { fontSize: 9 },
    });
  } else {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(
      "No hay tareas completadas registradas en este período.",
      14,
      startY + 60
    );
  }

  // --- Footer ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text("Groddy's Lab - Informe Confidencial", 14, pageHeight - 10);
  doc.text(`Página 1`, 190, pageHeight - 10);

  doc.save(`Reporte_Mensual_${format(new Date(), "yyyy_MM")}.pdf`);
};
