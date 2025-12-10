#!/usr/bin/env node
// Script rápido para configurar Superuser
// Usa las credenciales de Firebase Tools Shell
// Ejecutar: npx firebase-tools auth:export /dev/stdout --project groddys-lab | node scripts/quick-superuser.js

const admin = require("firebase-admin");

// Configurar espohr@gmail.com como Superuser
const TARGET_EMAIL = "espohr@gmail.com";
const CLAIMS = {
  role: "Superuser",
  tier: "premium",
  companyId: "groddys-lab-admin",
};

// Intentar inicializar con Service Account Key
async function main() {
  try {
    const serviceAccount = require("../serviceAccountKey.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "groddys-lab",
    });
    console.log("✅ Firebase Admin inicializado con Service Account Key");
  } catch (e) {
    console.error("❌ Error inicializando:", e.message);
    console.log(
      "\n🔧 Asegúrate de que exists serviceAccountKey.json en el directorio raíz"
    );
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Buscando usuario: ${TARGET_EMAIL}...`);
    const user = await admin.auth().getUserByEmail(TARGET_EMAIL);
    console.log(`✅ Usuario encontrado: ${user.uid}`);

    console.log(`\n🔧 Configurando claims...`);
    await admin.auth().setCustomUserClaims(user.uid, CLAIMS);

    console.log(`\n✅ ¡ÉXITO! ${TARGET_EMAIL} es ahora Superuser.`);
    console.log(`   Claims asignados:`, CLAIMS);
    console.log(`\n⚠️  El usuario debe CERRAR SESIÓN y VOLVER A ENTRAR.`);
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
