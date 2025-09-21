// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function para asignar un rol y un ID de empresa a un usuario.
 * Solo puede ser llamada por un usuario que ya sea Superuser.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Verifica que el usuario que llama a la función es un Superuser.
  if (context.auth.token.role !== "Superuser") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Solo un Superuser puede ejecutar esta acción.",
    );
  }

  // 2. Valida los datos de entrada.
  const {email, role, companyId} = data;
  if (!email || !role || !companyId) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "La función requiere \"email\", \"role\" y \"companyId\".",
    );
  }

  try {
    // 3. Busca al usuario por su email.
    const user = await admin.auth().getUserByEmail(email);

    // 4. Asigna los roles personalizados (Custom Claims).
    await admin.auth().setCustomUserClaims(user.uid, {
      role: role,
      companyId: companyId,
    });

    console.log(`Rol "${role}" asignado a ${email} 
      para la empresa ${companyId}`);
    return {message: `Éxito! El usuario ${email} 
    ahora tiene el rol de ${role}.`};
  } catch (error) {
    console.error("Error al asignar rol:", error);
    throw new functions.https.HttpsError(
        "internal", "Ocurrió un error al asignar el rol.",
    );
  }
});
