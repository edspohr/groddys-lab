const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "groddys-lab",
  });
}

const db = admin.firestore();

const COMPANY_ID = "demo-corp"; // ID de empresa para pruebas

async function seedAdvancedData() {
  console.log("🚀 Iniciando Seed Avanzado...");

  try {
    // 1. Crear Usuarios Dummy para Asignación
    console.log("👤 Creando usuarios de equipo...");
    const teamMembers = [
      {
        uid: "user_ana",
        email: "ana@democorp.com",
        displayName: "Ana Marketing",
        role: "Pro",
        companyId: COMPANY_ID,
      },
      {
        uid: "user_dev",
        email: "dev@democorp.com",
        displayName: "Dev Dave",
        role: "Pro",
        companyId: COMPANY_ID,
      },
      {
        uid: "user_mgr",
        email: "boss@democorp.com",
        displayName: "Manager Mike",
        role: "Admin",
        companyId: COMPANY_ID,
      },
    ];

    for (const u of teamMembers) {
      await db.collection("users").doc(u.uid).set(u);
    }

    // 2. Crear Tareas Históricas (Completadas para métricas)
    console.log("graph Creando historial de tareas...");
    const pastTasks = [
      {
        title: "Automatización de Reportes Semanales",
        description: "Script de Python para procesar CSVs.",
        columnId: "done",
        priority: "high",
        project: "Operations",
        estimatedHours: 5,
        savingsHours: 10, // Ahorro
        actualHours: 4, // Real (Eficiencia > 1)
        assignedTo: "user_dev",
        createdAt: new Date("2023-10-01"),
        companyId: COMPANY_ID,
      },
      {
        title: "Optimización de Landing Page",
        description: "Mejorar carga de imágenes WebP.",
        columnId: "done",
        priority: "medium",
        project: "Marketing",
        estimatedHours: 3,
        savingsHours: 2, // Ahorro bajo
        actualHours: 3.5, // Ineficiente
        assignedTo: "user_ana",
        createdAt: new Date("2023-10-05"),
        companyId: COMPANY_ID,
      },
      {
        title: "Migración a CRM Cloud",
        description: "Setup inicial de Salesforce.",
        columnId: "done",
        priority: "high",
        project: "Sales",
        estimatedHours: 20,
        savingsHours: 50,
        actualHours: 18,
        assignedTo: "user_mgr",
        createdAt: new Date("2023-10-10"),
        companyId: COMPANY_ID,
      },
    ];

    for (const t of pastTasks) {
      await db
        .collection("companies")
        .doc(COMPANY_ID)
        .collection("tasks")
        .add(t);
    }

    // 3. Crear Tareas Activas con Comentarios
    console.log("⚡ Creando tareas activas con comentarios...");
    const activeTaskRef = await db
      .collection("companies")
      .doc(COMPANY_ID)
      .collection("tasks")
      .add({
        title: "Integración API de Pagos",
        description: "Conectar Stripe con el checkout nuevo.",
        columnId: "inprogress",
        priority: "high",
        project: "Development",
        estimatedHours: 8,
        savingsHours: 12,
        actualHours: 2, // En progreso
        assignedTo: "user_dev",
        createdAt: new Date(),
        companyId: COMPANY_ID,
      });

    // Agregar comentarios a la tarea activa
    await activeTaskRef.collection("comments").add({
      text: "Ya tengo las credenciales de sandbox.",
      authorName: "Dev Dave",
      authorId: "user_dev",
      createdAt: new Date(),
    });

    await activeTaskRef.collection("comments").add({
      text: "Genial, avísame cuando esté listo para pruebas.",
      authorName: "Manager Mike",
      authorId: "user_mgr",
      createdAt: new Date(),
    });

    console.log("✅ Seed Avanzado Completado.");
    console.log(
      `ℹ️ Usa el Company ID '${COMPANY_ID}' en tu usuario para ver estos datos.`
    );
  } catch (e) {
    console.error("❌ Error en seed:", e);
  }
}

seedAdvancedData();
