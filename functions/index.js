// functions/index.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * BOOTSTRAP: Función especial para configurar el primer Superuser.
 * Solo funciona UNA VEZ y requiere un código secreto.
 * BORRAR DESPUÉS DE USAR.
 */
exports.bootstrapSuperuser = functions.https.onCall(async (data, context) => {
  const SECRET_CODE = "GRODDY-SUPER-2024"; // Código temporal
  // Emails permitidos para bootstrap
  const ALLOWED_EMAILS = ["espohr@gmail.com", "edmundo@spohr.cl"];

  // Debug log
  const callerEmail =
    context.auth && context.auth.token ? context.auth.token.email : null;
  console.log("Bootstrap attempt:", {
    hasAuth: !!context.auth,
    email: callerEmail,
    secretProvided: !!data.secretCode,
  });

  // Verificar código secreto
  if (data.secretCode !== SECRET_CODE) {
    console.log("❌ Código secreto incorrecto");
    throw new functions.https.HttpsError(
        "permission-denied",
        "Código secreto incorrecto.",
    );
  }

  // Verificar que el llamador es uno de los usuarios permitidos
  if (!context.auth || !ALLOWED_EMAILS.includes(callerEmail)) {
    console.log("❌ Email no autorizado:", callerEmail);
    throw new functions.https.HttpsError(
        "permission-denied",
        "Email " + callerEmail + " no autorizado para bootstrap.",
    );
  }

  try {
    // Asignar claims de Superuser
    await admin.auth().setCustomUserClaims(context.auth.uid, {
      role: "Superuser",
      tier: "premium",
      companyId: "groddys-lab-admin",
    });

    console.log("✅ Superuser configurado: " + callerEmail);
    return {
      success: true,
      message: "¡Éxito! Eres Superuser. Cierra sesión y vuelve a entrar.",
    };
  } catch (error) {
    console.error("Error en bootstrap:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function para asignar un rol y un ID de empresa a un usuario.
 * Solo puede ser llamada por un usuario que ya sea Superuser.
 */
exports.setUserRole = functions.https.onCall(async (data, context) => {
  // 1. Verifica que el usuario que llama a la función es un Superuser.
  if (!context.auth || context.auth.token.role !== "Superuser") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Solo un Superuser puede ejecutar esta acción.",
    );
  }

  // 2. Valida los datos de entrada.
  const {email, role, companyId, tier} = data;
  if (!email || !role) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "La función requiere al menos 'email' y 'role'.",
    );
  }

  try {
    // 3. Busca al usuario por su email.
    const user = await admin.auth().getUserByEmail(email);

    // 4. Asigna los roles personalizados (Custom Claims).
    await admin.auth().setCustomUserClaims(user.uid, {
      role: role,
      tier: tier || (companyId ? "premium" : "freemium"),
      companyId: companyId || null,
    });

    console.log(`Rol "${role}" asignado a ${email}`);
    return {
      message: `Éxito! El usuario ${email} ahora tiene el rol de ${role}.`,
    };
  } catch (error) {
    console.error("Error al asignar rol:", error);
    throw new functions.https.HttpsError(
        "internal",
        "Ocurrió un error al asignar el rol.",
    );
  }
});
