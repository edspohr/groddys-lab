// scripts/set-superuser.js
// Script para configurar Custom Claims de Firebase
// Ejecutar: node scripts/set-superuser.js

const admin = require("firebase-admin");
const readline = require("readline");

// Inicializar Firebase Admin con credenciales del proyecto
// OPCIÓN 1: Usar archivo de credenciales descargado de Firebase Console
// const serviceAccount = require('../serviceAccountKey.json');
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// OPCIÓN 2: Usar credenciales por defecto (si estás autenticado con gcloud/firebase CLI)
admin.initializeApp({
  projectId: "groddys-lab",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function setCustomClaims(email, claims) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, claims);
    console.log(`\n✅ Claims actualizados para ${email}:`);
    console.log(JSON.stringify(claims, null, 2));
    console.log(
      "\n⚠️  El usuario debe cerrar sesión y volver a entrar para ver los cambios."
    );
    return true;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return false;
  }
}

async function getCurrentClaims(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    const claims = (await admin.auth().getUser(user.uid)).customClaims || {};
    console.log(`\nClaims actuales de ${email}:`);
    console.log(JSON.stringify(claims, null, 2));
    return claims;
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("\n🔧 Firebase Custom Claims Manager\n");
  console.log("Opciones:");
  console.log("  1. Configurar usuario como SUPERUSER");
  console.log("  2. Configurar usuario como ADMIN de empresa");
  console.log("  3. Configurar usuario como PREMIUM");
  console.log("  4. Ver claims actuales de un usuario");
  console.log("  5. Resetear usuario a FREE");
  console.log("  0. Salir\n");

  rl.question("Selecciona opción: ", async (option) => {
    if (option === "0") {
      rl.close();
      process.exit(0);
    }

    rl.question("Email del usuario: ", async (email) => {
      switch (option) {
        case "1": // SUPERUSER
          await setCustomClaims(email, {
            role: "Superuser",
            tier: "premium",
            companyId: "groddys-lab-admin",
          });
          break;

        case "2": // ADMIN
          rl.question(
            "ID de la empresa (ej: acme-corp): ",
            async (companyId) => {
              await setCustomClaims(email, {
                role: "Admin",
                tier: "premium",
                companyId: companyId,
              });
              rl.close();
            }
          );
          return;

        case "3": // PREMIUM Usuario
          rl.question("ID de la empresa: ", async (companyId) => {
            await setCustomClaims(email, {
              role: "Usuario",
              tier: "premium",
              companyId: companyId,
            });
            rl.close();
          });
          return;

        case "4": // Ver claims
          await getCurrentClaims(email);
          break;

        case "5": // RESET a FREE
          await setCustomClaims(email, {
            role: "Usuario",
            tier: "freemium",
            companyId: null,
          });
          break;

        default:
          console.log("Opción no válida");
      }
      rl.close();
    });
  });
}

main();
