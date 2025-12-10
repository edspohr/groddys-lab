const admin = require("firebase-admin");
const serviceAccount = require("../serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "groddys-lab",
  });
}

const db = admin.firestore();

async function main() {
  try {
    console.log("🚀 Creando anuncio de Bienvenida...");
    await db.collection("announcements").add({
      message:
        "¡Bienvenido al nuevo Dashboard 2.0! Ahora puedes rastrear tu eficiencia y colaborar mejor con comentarios en tareas.",
      type: "success",
      targetAudience: "all",
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ Anuncio creado exitosamente.");
  } catch (e) {
    console.error("❌ Error:", e);
  }
}

main();
