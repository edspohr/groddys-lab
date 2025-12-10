// public/app.js - PROCESS ACADEMY + WORKSPACE

// --- 1. IMPORTAR FUNCIONES DE FIREBASE ---
import { auth, db, functions } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";
import {
  collection,
  onSnapshot,
  query,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  getDocs,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Proveedor de Google
const googleProvider = new GoogleAuthProvider();

// --- 4. ELEMENTOS DEL DOM PARA AUTH ---
const authError = document.getElementById("auth-error");
const authSuccess = document.getElementById("auth-success");
const registerForm = document.getElementById("register-form");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const googleLoginBtn = document.getElementById("google-login-btn");

// --- ELEMENTOS DEL DOM PRINCIPALES ---
const loginScreen = document.getElementById("login-screen");
const appPortal = document.getElementById("app-portal");
const loginForm = document.getElementById("login-form");
const userAvatar = document.getElementById("user-avatar");
const moduleTitle = document.getElementById("module-title");
const moduleDescription = document.getElementById("module-description");
const taskDetailModal = document.getElementById("task-detail-modal");
const taskForm = document.getElementById("task-form");
const saveTaskBtn = document.getElementById("save-task-btn");
const commentsSection = document.getElementById("comments-section");

// --- ESTADO GLOBAL ---
let currentUser = null;
let currentUserRole = null;
let currentUserCompanyId = null;
let currentUserTier = null;
let tasksUnsubscribe = null;

const moduleInfo = {
  "dashboard-kanban": {
    title: "Dashboard & Kanban",
    description: "Métricas clave y gestión del flujo de trabajo.",
  },
  academy: {
    title: "Academy",
    description: "Cursos y recursos para dominar la automatización.",
  },
  "ai-agent": {
    title: "Groddy AI",
    description: "Tu asistente de automatización inteligente.",
  },
  "user-info": {
    title: "Mi Perfil",
    description: "Información de tu cuenta y configuración.",
  },
};

// --- 5. FUNCIONES HELPERS ---
function showAuthError(message) {
  authError.textContent = message;
  authError.classList.remove("hidden");
  authSuccess.classList.add("hidden");
}

function showAuthSuccess(message) {
  authSuccess.textContent = message;
  authSuccess.classList.remove("hidden");
  authError.classList.add("hidden");
}

function hideAuthMessages() {
  authError.classList.add("hidden");
  authSuccess.classList.add("hidden");
}

// Crear perfil de usuario en Firestore (para nuevos usuarios)
async function createUserProfile(user, additionalData = {}) {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      displayName: additionalData.displayName || user.displayName || "",
      photoURL: user.photoURL || "",
      tier: "freemium",
      companyId: null,
      role: "Usuario",
      createdAt: new Date(),
      lastLoginAt: new Date(),
    });
    console.log("Perfil de usuario creado en Firestore");
  } else {
    // Actualizar último login
    await updateDoc(userRef, { lastLoginAt: new Date() });
  }
}

// --- 6. TABS LOGIN/REGISTRO ---
tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("text-white", "border-[var(--brand-turquoise)]");
  tabLogin.classList.remove(
    "text-[var(--brand-text-secondary)]",
    "border-transparent"
  );
  tabRegister.classList.remove("text-white", "border-[var(--brand-turquoise)]");
  tabRegister.classList.add(
    "text-[var(--brand-text-secondary)]",
    "border-transparent"
  );
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");
  hideAuthMessages();
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("text-white", "border-[var(--brand-turquoise)]");
  tabRegister.classList.remove(
    "text-[var(--brand-text-secondary)]",
    "border-transparent"
  );
  tabLogin.classList.remove("text-white", "border-[var(--brand-turquoise)]");
  tabLogin.classList.add(
    "text-[var(--brand-text-secondary)]",
    "border-transparent"
  );
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  hideAuthMessages();
});

// --- 7. LOGIN CON EMAIL ---
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  hideAuthMessages();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  signInWithEmailAndPassword(auth, email, password).catch((error) => {
    console.error("Error de login:", error);
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password"
    ) {
      showAuthError("Correo o contraseña incorrectos.");
    } else if (error.code === "auth/invalid-credential") {
      showAuthError("Credenciales inválidas. Verifica tu correo y contraseña.");
    } else {
      showAuthError("Error al iniciar sesión. Intenta de nuevo.");
    }
  });
});

// --- 8. REGISTRO CON EMAIL ---
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideAuthMessages();

  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const passwordConfirm = document.getElementById(
    "register-password-confirm"
  ).value;

  // Validar que las contraseñas coincidan
  if (password !== passwordConfirm) {
    showAuthError("Las contraseñas no coinciden. Por favor verifica.");
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    // Actualizar el nombre del usuario
    await updateProfile(userCredential.user, { displayName: name });
    // Crear perfil en Firestore
    await createUserProfile(userCredential.user, { displayName: name });
    console.log("Usuario registrado exitosamente:", userCredential.user.email);
  } catch (error) {
    console.error("Error de registro:", error);
    if (error.code === "auth/email-already-in-use") {
      showAuthError("Este correo ya está registrado. Intenta iniciar sesión.");
    } else if (error.code === "auth/weak-password") {
      showAuthError("La contraseña debe tener al menos 6 caracteres.");
    } else {
      showAuthError("Error al crear la cuenta. Intenta de nuevo.");
    }
  }
});

// --- 9. LOGIN CON GOOGLE ---
googleLoginBtn.addEventListener("click", async () => {
  hideAuthMessages();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Crear o actualizar perfil en Firestore
    await createUserProfile(result.user);
    console.log("Login con Google exitoso:", result.user.email);
  } catch (error) {
    console.error("Error de Google Sign-In:", error);
    if (error.code === "auth/popup-closed-by-user") {
      showAuthError("Inicio de sesión cancelado.");
    } else {
      showAuthError("Error al iniciar sesión con Google.");
    }
  }
});

// --- 10. MANEJO CENTRAL DE AUTENTICACIÓN ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const idTokenResult = await user.getIdTokenResult(true);
    currentUserRole = idTokenResult.claims.role || "Usuario";
    currentUserCompanyId = idTokenResult.claims.companyId || null;
    // Determinar tier: Superuser/Admin siempre son premium, sino basado en companyId
    if (currentUserRole === "Superuser" || currentUserRole === "Admin") {
      currentUserTier = "premium";
    } else {
      currentUserTier =
        idTokenResult.claims.tier ||
        (currentUserCompanyId ? "premium" : "freemium");
    }

    console.log(
      `¡Login exitoso! Usuario: ${user.email}, Rol: ${currentUserRole}, Tier: ${currentUserTier}`
    );

    loginScreen.style.display = "none";
    appPortal.style.display = "flex";
    initializeApp();
  } else {
    currentUser = null;
    if (tasksUnsubscribe) {
      tasksUnsubscribe(); // Detiene el "oyente" de tareas
    }
    loginScreen.style.display = "flex";
    appPortal.style.display = "none";
  }
});

// --- 6. FUNCIÓN DE LOGOUT ---
window.logout = () => {
  signOut(auth);
};

// --- 11. INICIALIZACIÓN DE LA APLICACIÓN ---
function initializeApp() {
  // Limpiar clases previas
  document.body.classList.remove(
    "admin-view",
    "editor-view",
    "freemium-view",
    "premium-view"
  );

  // Aplicar clases por rol
  if (currentUserRole === "Superuser" || currentUserRole === "Admin") {
    document.body.classList.add("admin-view", "editor-view");
  } else {
    document.body.classList.add("editor-view");
  }

  // Fix 2: Aplicar clases por tier
  if (currentUserTier === "premium" || currentUserCompanyId) {
    document.body.classList.add("premium-view");
  } else {
    document.body.classList.add("freemium-view");
  }

  // Avatar del usuario
  // Actualizar indicadores visuales de usuario (Avatar y Badges)
  if (typeof updateUserStatusUI === "function") {
    updateUserStatusUI();
  } else {
    // Fallback por si acaso
    const displayName =
      currentUser.displayName || currentUser.email.split("@")[0];
    userAvatar.textContent = displayName.substring(0, 2).toUpperCase();
  }

  // Inicializar Kanban para TODOS los usuarios
  // Free: Kanban individual (tareas en users/{uid}/tasks)
  // Pro/Admin/Superuser: Kanban de empresa (tareas en companies/{companyId}/tasks)
  initializeKanban();
  showModule("dashboard-kanban");

  // Renderizar perfil de usuario
  renderUserProfile();

  lucide.createIcons();
}

// --- 12. LÓGICA DEL KANBAN CON FIRESTORE ---

// --- 12. LÓGICA DEL KANBAN CON FIRESTORE ---

// Helper para obtener referencia a la colección de tareas correcta
function getTasksCollectionRef() {
  if (currentUserTier === "premium" && currentUserCompanyId) {
    return collection(db, "companies", currentUserCompanyId, "tasks");
  } else {
    // Freemium o sin empresa asignada: Tareas personales
    return collection(db, "users", currentUser.uid, "tasks");
  }
}

// Helper para obtener referencia a un documento de tarea específico
function getTaskDocRef(taskId) {
  if (currentUserTier === "premium" && currentUserCompanyId) {
    return doc(db, "companies", currentUserCompanyId, "tasks", taskId);
  } else {
    return doc(db, "users", currentUser.uid, "tasks", taskId);
  }
}

function initializeKanban() {
  if (tasksUnsubscribe) tasksUnsubscribe();

  const tasksCollection = getTasksCollectionRef();
  // Ordenar por fecha de creación descendente si es posible (requiere index) o client-side
  const q = query(tasksCollection);

  // Inicializar UI de métricas (Overlay Freemium / Contador a 0) inmediatamente
  updateDashboardMetrics([]);

  tasksUnsubscribe = onSnapshot(q, (querySnapshot) => {
    console.log("Datos de tareas actualizados desde Firestore.");
    document
      .querySelectorAll(".kanban-column .space-y-4")
      .forEach((col) => (col.innerHTML = ""));

    const tasks = [];
    querySnapshot.forEach((docSnap) => {
      tasks.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Ordenar tareas por prioridad (High -> Medium -> Low)
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    tasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    tasks.forEach((task) => {
      const columnEl = document.querySelector(
        `.kanban-column[data-column-id="${task.columnId}"] .space-y-4`
      );
      if (columnEl) {
        columnEl.innerHTML += createTaskCardHTML(task);
      }
    });

    updateDashboardMetrics(tasks); // Actualizar métricas con datos reales
    lucide.createIcons();
  });
}

// --- 12. UPDATE DASHBOARD METRICS (2.0) ---
function updateDashboardMetrics(tasks) {
  // 1. Tareas Activas (Todo + InProgress + Review)
  const activeTasks = tasks.filter((t) =>
    ["todo", "inprogress", "review"].includes(t.columnId)
  ).length;
  const activeEl = document.getElementById("metric-active-tasks");
  if (activeEl)
    animateValue(activeEl, parseInt(activeEl.innerText), activeTasks, 1000);

  // 2. Tareas Completadas (Mes Actual)
  // Nota: Para filtrar por mes necesitaríamos 'completedAt', asumiremos todas las 'done' por simplificación o usaremos createdAt si no hay completedAt
  // Mejora: Filtrar por fecha real si tuviéramos ese campo.
  const completedTasks = tasks.filter((t) => t.columnId === "done");
  const completedCount = completedTasks.length;
  const completedEl = document.getElementById("metric-completed-month");
  if (completedEl)
    animateValue(
      completedEl,
      parseInt(completedEl.innerText),
      completedCount,
      1000
    );

  // 3. Horas Ahorradas
  const totalSavings = completedTasks.reduce(
    (acc, task) => acc + (parseFloat(task.savingsHours) || 0),
    0
  );
  const savingsEl = document.getElementById("total-hours-saved");
  if (savingsEl) {
    savingsEl.textContent = totalSavings.toFixed(1) + "h";
  }

  // 4. Eficiencia (Ahorro / Real)
  // Solo consideramos tareas que tengan hours reales registradas > 0
  let totalRealHours = 0;
  let savingsForEfficiency = 0;

  completedTasks.forEach((t) => {
    const real = parseFloat(t.actualHours) || 0;
    const save = parseFloat(t.savingsHours) || 0;
    if (real > 0) {
      totalRealHours += real;
      savingsForEfficiency += save;
    }
  });

  let efficiency = 0;
  if (totalRealHours > 0) {
    efficiency = savingsForEfficiency / totalRealHours;
  } else if (savingsForEfficiency > 0) {
    efficiency = savingsForEfficiency; // Si no hay horas reales pero sí ahorro, es eficiencia infinita teóricamente, ponemos el ahorro como ratio base
  }

  const efficencyEl = document.getElementById("metric-efficiency");
  if (efficencyEl) {
    efficencyEl.textContent = efficiency.toFixed(1) + "x";
    if (efficiency >= 2)
      efficencyEl.className = "text-3xl font-bold mt-2 text-green-400";
    else if (efficiency >= 1)
      efficencyEl.className = "text-3xl font-bold mt-2 text-yellow-400";
    else efficencyEl.className = "text-3xl font-bold mt-2 text-white";
  }
}

// Animación simple de números
function animateValue(obj, start, end, duration) {
  if (start === end) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      obj.innerHTML = end;
    }
  };
  window.requestAnimationFrame(step);
}

// --- 12.1 SISTEMA DE ANUNCIOS ---
async function loadAnnouncements() {
  const container = document.getElementById("announcements-container");
  if (!container) return;

  // Limpiar
  container.innerHTML = "";

  try {
    const q = query(
      collection(db, "announcements"),
      where("isActive", "==", true)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Filtro por audiencia
      // Si targetAudience es 'all', mostrar.
      // Si es 'company', verificar companyId.
      // Si es 'superuser', solo superusers.

      let show = false;
      if (!data.targetAudience || data.targetAudience === "all") show = true;
      else if (
        data.targetAudience === "company" &&
        currentUserCompanyId === data.companyId
      )
        show = true;
      else if (
        data.targetAudience === "superuser" &&
        currentUserRole === "Superuser"
      )
        show = true;

      if (show) {
        const typeColors = {
          info: "bg-blue-900/50 border-blue-500/50 text-blue-200",
          warning: "bg-yellow-900/50 border-yellow-500/50 text-yellow-200",
          success: "bg-green-900/50 border-green-500/50 text-green-200",
          alert: "bg-red-900/50 border-red-500/50 text-red-200",
        };
        const colorClass = typeColors[data.type] || typeColors.info;
        const iconMap = {
          info: "info",
          warning: "alert-triangle",
          success: "check-circle",
          alert: "alert-octagon",
        };
        const icon = iconMap[data.type] || "info";

        const displayDate = data.createdAt
          ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
          : "";

        const el = document.createElement("div");
        el.className = `p-4 rounded-lg border flex items-start gap-3 ${colorClass} animate-fade-in`;
        el.innerHTML = `
                   <i data-lucide="${icon}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                   <div class="flex-grow">
                      <p class="font-medium text-sm">${data.message}</p>
                      ${
                        displayDate
                          ? `<p class="text-[10px] opacity-70 mt-1">${displayDate}</p>`
                          : ""
                      }
                   </div>
                   ${
                     currentUserRole === "Superuser"
                       ? `<button onclick="deleteAnnouncement('${docSnap.id}')" class="text-white/50 hover:text-white"><i data-lucide="x" class="w-4 h-4"></i></button>`
                       : ""
                   }
                `;
        container.appendChild(el);
      }
    });
    lucide.createIcons();
  } catch (e) {
    console.error("Error loading announcements:", e);
  }
}

// Helper para crear anuncios desde consola (Superuser)
window.createAnnouncement = async (
  message,
  type = "info",
  targetAudience = "all",
  companyId = null
) => {
  if (currentUserRole !== "Superuser") return console.error("Acceso denegado");
  try {
    await addDoc(collection(db, "announcements"), {
      message,
      type, // info, warning, success, alert
      targetAudience, // all, company, superuser
      companyId,
      isActive: true,
      createdAt: new Date(),
      createdBy: currentUser.uid,
    });
    console.log("Anuncio creado");
    loadAnnouncements();
  } catch (e) {
    console.error(e);
  }
};

window.deleteAnnouncement = async (id) => {
  if (!confirm("¿Borrar anuncio?")) return;
  try {
    await deleteDoc(doc(db, "announcements", id));
    loadAnnouncements();
  } catch (e) {
    console.error(e);
  }
};

// --- 13. RENDERIZAR PERFIL DE USUARIO ---
function renderUserProfile() {
  const userInfoModule = document.getElementById("user-info");
  if (!userInfoModule) return;

  const tierBadge =
    currentUserTier === "premium"
      ? '<span class="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-1 rounded-full">Premium</span>'
      : '<span class="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">Freemium</span>';

  const roleBadge =
    currentUserRole === "Superuser"
      ? '<span class="bg-red-900 text-red-100 text-[10px] px-2 py-1 rounded-full ml-2 border border-red-700">Superuser</span>'
      : "";

  userInfoModule.innerHTML = `
    <div class="max-w-2xl mx-auto">
      <div class="bg-[var(--brand-card-bg)] rounded-lg border border-[var(--brand-border)] p-8">
        <div class="flex items-center gap-6 mb-8">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-black">
            ${(currentUser.displayName || currentUser.email)[0].toUpperCase()}
          </div>
          <div>
            <h2 class="text-2xl font-bold text-white mb-1">${
              currentUser.displayName || "Usuario"
            }</h2>
            <p class="text-[var(--brand-text-secondary)] mb-3">${
              currentUser.email
            }</p>
            <div class="flex items-center">${tierBadge}${roleBadge}</div>
          </div>
        </div>
        
        <div class="space-y-6">
          <div class="border-t border-[var(--brand-border)] pt-6">
            <h3 class="font-semibold text-white mb-4 flex items-center gap-2"><i data-lucide="settings" class="w-4 h-4 text-gray-400"></i> Información de Cuenta</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg">
              <div>
                <p class="text-xs text-[var(--brand-text-secondary)] uppercase tracking-wider mb-1">ID de Usuario</p>
                <p class="text-white font-mono text-xs truncate bg-black/30 p-2 rounded">${
                  currentUser.uid
                }</p>
              </div>
              <div>
                <p class="text-xs text-[var(--brand-text-secondary)] uppercase tracking-wider mb-1">Empresa</p>
                <p class="text-white text-sm">${
                  currentUserCompanyId || "Personal / Ninguna"
                }</p>
              </div>
              <div>
                 <p class="text-xs text-[var(--brand-text-secondary)] uppercase tracking-wider mb-1">Miembro desde</p>
                 <p class="text-white text-sm">${new Date(
                   currentUser.metadata.creationTime
                 ).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
           ${
             currentUserTier === "freemium"
               ? `
           <div class="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 p-4 rounded-lg flex items-center justify-between">
              <div>
                 <h4 class="font-bold text-white">Actualiza a Plan Empresa</h4>
                 <p class="text-xs text-gray-300">Desbloquea métricas de equipo, IA avanzada y cursos premium.</p>
              </div>
              <a href="https://calendly.com/espohr/conversemos" target="_blank" class="bg-white text-purple-900 px-4 py-2 rounded font-bold text-sm hover:bg-gray-100 transition">Agendar Demo</a>
           </div>
           `
               : ""
           }

          <div class="pt-4 flex justify-end">
             <button id="logout-btn-profile" class="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded hover:bg-red-900/20 transition">
                <i data-lucide="log-out" class="w-4 h-4"></i> Cerrar Sesión
             </button>
          </div>
        </div>
      </div>
    </div>
  `;

  document
    .getElementById("logout-btn-profile")
    .addEventListener("click", () => {
      signOut(auth).then(() => window.location.reload());
    });
  lucide.createIcons();
}

function updateUserStatusUI() {
  // Determinar el perfil basado en role
  // Perfiles: Free, Pro, Admin, Superuser
  const profileConfig = {
    Superuser: {
      label: "SUPERUSER",
      icon: "crown",
      avatarClasses:
        "bg-gradient-to-br from-yellow-500 to-amber-600 ring-2 ring-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.6)]",
      badgeClasses:
        "bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-[0_0_15px_rgba(251,191,36,0.5)] border border-yellow-400/50",
      dotColor: "bg-yellow-400",
    },
    Admin: {
      label: "ADMIN",
      icon: "shield",
      avatarClasses:
        "bg-gradient-to-br from-purple-600 to-indigo-600 ring-2 ring-purple-400 shadow-[0_0_15px_rgba(147,51,234,0.5)]",
      badgeClasses:
        "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_10px_rgba(147,51,234,0.4)] border border-purple-400/50",
      dotColor: "bg-purple-400",
    },
    Pro: {
      label: "PRO",
      icon: "briefcase",
      avatarClasses:
        "bg-gradient-to-br from-blue-500 to-cyan-500 ring-2 ring-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]",
      badgeClasses:
        "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)] border border-blue-400/50",
      dotColor: "bg-blue-400",
    },
    Free: {
      label: "FREE",
      icon: "user",
      avatarClasses: "bg-gray-700 ring-2 ring-gray-500",
      badgeClasses: "bg-gray-800 text-gray-300 border border-gray-600",
      dotColor: null,
    },
  };

  // Mapear rol actual al perfil
  let profile = "Free";
  if (currentUserRole === "Superuser") {
    profile = "Superuser";
  } else if (currentUserRole === "Admin") {
    profile = "Admin";
  } else if (currentUserTier === "premium" || currentUserCompanyId) {
    profile = "Pro";
  }

  const config = profileConfig[profile];

  // 1. Avatar Sidebar
  const userAvatar = document.getElementById("user-avatar");
  if (userAvatar) {
    userAvatar.className = `w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg text-white cursor-pointer transition-all duration-300 relative ${config.avatarClasses}`;

    const initial = (currentUser.displayName ||
      currentUser.email)[0].toUpperCase();
    const dot = config.dotColor
      ? `<div class="absolute -top-1 -right-1 w-3 h-3 ${config.dotColor} rounded-full border-2 border-[var(--brand-bg)] animate-pulse"></div>`
      : "";
    userAvatar.innerHTML = initial + dot;
  }

  // 2. Header Badge
  const statusContainer = document.getElementById("user-status-container");
  if (statusContainer) {
    statusContainer.innerHTML = `
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full ${config.badgeClasses} text-xs font-bold tracking-wider select-none transition-all duration-300 hover:scale-105">
        <i data-lucide="${config.icon}" class="w-3.5 h-3.5"></i>
        <span>${config.label}</span>
      </div>
    `;
    lucide.createIcons();
  }
}

window.drag = (ev) => {
  ev.dataTransfer.setData("text/plain", ev.target.id);
  ev.target.classList.add("dragging");
};

window.drop = async (ev) => {
  ev.preventDefault();
  const taskId = ev.dataTransfer.getData("text/plain");
  const card = document.getElementById(taskId);
  if (!card) return;
  card.classList.remove("dragging");
  let target = ev.target;
  while (target && !target.classList.contains("kanban-column")) {
    target = target.parentElement;
  }
  if (target) {
    const newColumnId = target.dataset.columnId;
    console.log(`Moviendo tarea ${taskId} a la columna ${newColumnId}`);
    const taskRef = getTaskDocRef(taskId);
    try {
      await updateDoc(taskRef, { columnId: newColumnId });
    } catch (error) {
      console.error("Error al actualizar la columna de la tarea:", error);
    }
  }
};

function createTaskCardHTML(task) {
  const priorityColors = {
    high: "border-l-4 border-l-red-500",
    medium: "border-l-4 border-l-yellow-500",
    low: "border-l-4 border-l-blue-500",
  };

  const estimated = task.estimatedHours ? `${task.estimatedHours}h Est.` : "";
  const savings = task.savingsHours ? `${task.savingsHours}h Ahorro` : "";
  const project =
    task.project !== "General"
      ? `<span class="bg-gray-700 px-1.5 py-0.5 rounded text-[10px]">${task.project}</span>`
      : "";

  return `<div onclick="openTaskDetails('${task.id}')" 
      class="k-card bg-[var(--brand-card-bg)] p-3 rounded-lg border border-[var(--brand-border)] ${
        priorityColors[task.priority] || ""
      } hover:border-[var(--brand-turquoise)] transition group" 
      draggable="true" ondragstart="drag(event)" id="${task.id}">
        
        <div class="flex justify-between items-start mb-1">
          ${project}
          ${
            task.aiAnalysis
              ? '<i data-lucide="sparkles" class="w-3 h-3 text-[var(--brand-turquoise)]"></i>'
              : ""
          }
        </div>

        <p class="font-medium text-white text-sm leading-tight mb-2">${
          task.title
        }</p>
        
        ${
          task.description
            ? `<p class="text-xs text-[var(--brand-text-secondary)] mb-3 line-clamp-2">${task.description}</p>`
            : ""
        }
        
        <div class="flex items-center justify-between text-xs text-[var(--brand-text-secondary)] border-t border-[var(--brand-border)] pt-2 mt-2">
             <div class="flex gap-2">
                 ${
                   estimated
                     ? `<span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${task.estimatedHours}h</span>`
                     : ""
                 }
             </div>
             ${
               savings
                 ? `<span class="font-bold text-green-400 flex items-center gap-1"><i data-lucide="trending-up" class="w-3 h-3"></i> ${task.savingsHours}h</span>`
                 : ""
             }
        </div>
    </div>`;
}

// --- 9. MODAL DE TAREAS CON FIRESTORE ---

// --- 9. MODAL DE TAREAS Y AI LOGIC ---

window.openTaskDetails = async (taskId, columnId = null) => {
  taskForm.reset();
  const isCreating = !taskId;
  document.getElementById("modal-title").innerHTML = isCreating
    ? 'Crear Tarea <span class="text-sm font-normal text-gray-400 ml-2">Optimizer</span>'
    : "Detalles y Optimización";

  // Cargar usuarios para asignación si corresponde
  const assignSelect = document.getElementById("task-assigned-to");
  const assignmentContainer = document.getElementById(
    "task-assignment-container"
  );

  if (currentUserCompanyId) {
    assignmentContainer.classList.remove("hidden");
    // Cargar lista de usuarios de la empresa
    // Nota: Idealmente cachear esto o cargarlo una vez
    if (assignSelect.options.length <= 1) {
      try {
        // Query simple: usuarios con companyId == currentUserCompanyId
        // Requiere index compuesto probablemente
        const qUsers = query(
          collection(db, "users"),
          where("companyId", "==", currentUserCompanyId)
        );
        const snaps = await getDocs(qUsers);
        snaps.forEach((doc) => {
          const u = doc.data();
          const opt = document.createElement("option");
          opt.value = doc.id; // uid
          opt.text = u.displayName || u.email;
          assignSelect.appendChild(opt);
        });
      } catch (e) {
        console.error("Error loading users for assign:", e);
      }
    }
  } else {
    assignmentContainer.classList.add("hidden");
  }

  if (isCreating) {
    taskForm.querySelector("#task-id").value = "";
    taskForm.querySelector("#task-column").value = columnId;
    document.getElementById("task-ai-analysis").value = "";
    document.getElementById("comments-section").innerHTML =
      "<p class='text-gray-500 text-sm'>Guarda la tarea para agregar comentarios.</p>";
    document.getElementById("comment-form").style.display = "none";
  } else {
    const taskRef = getTaskDocRef(taskId);
    const taskSnap = await getDoc(taskRef);
    if (taskSnap.exists()) {
      const task = taskSnap.data();
      document.getElementById("modal-title").innerText =
        "Detalles y Optimización"; // Reset title

      taskForm.querySelector("#task-id").value = taskId;
      taskForm.querySelector("#task-title").value = task.title;
      taskForm.querySelector("#task-description").value = task.description;
      taskForm.querySelector("#task-column").value = task.columnId;
      taskForm.querySelector("#task-project").value = task.project || "General";
      taskForm.querySelector("#task-priority").value =
        task.priority || "medium";

      // Asignación
      if (assignSelect) assignSelect.value = task.assignedTo || "";

      // Nuevos campos
      taskForm.querySelector("#task-estimated").value =
        task.estimatedHours || "";
      taskForm.querySelector("#task-savings").value = task.savingsHours || "";
      taskForm.querySelector("#task-actual").value = task.actualHours || "";
      taskForm.querySelector("#task-ai-analysis").value = task.aiAnalysis || "";

      // Cargar comentarios
      document.getElementById("comment-form").style.display = "flex";
      loadComments(taskId);
    }
  }
  taskDetailModal.classList.remove("hidden");
  taskDetailModal.classList.add("flex");
};

window.closeTaskDetails = () => taskDetailModal.classList.add("hidden");

// Listener Magic Estimate
document.getElementById("magic-estimate-btn").addEventListener("click", () => {
  const title = document.getElementById("task-title").value;
  const description = document.getElementById("task-description").value;

  if (!title) {
    alert("Por favor escribe un título para la tarea primero.");
    return;
  }

  // Simulación de "Thinking..."
  const btn = document.getElementById("magic-estimate-btn");
  const originalText = btn.innerHTML;
  btn.innerHTML =
    '<i data-lucide="loader" class="animate-spin w-3 h-3"></i> Pensando...';

  setTimeout(() => {
    // Lógica Simulada de IA
    const estimated = Math.floor(Math.random() * 4) + 1; // 1 a 5 horas
    let savings = (estimated * 1.5).toFixed(1);
    let analysis = "";

    // Heurística simple basada en keywords
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("reporte") || lowerTitle.includes("excel")) {
      analysis =
        "💡 Tip IA: Puedes automatizar la recolección de datos con Power Query o un script simple. Ahorro potencial alto.";
      savings = (estimated * 3).toFixed(1);
    } else if (lowerTitle.includes("mail") || lowerTitle.includes("correo")) {
      analysis =
        "💡 Tip IA: Usa plantillas o reglas de auto-respuesta. Considera una herramienta de mailing masivo.";
      savings = (estimated * 2).toFixed(1);
    } else if (
      lowerTitle.includes("reunion") ||
      lowerTitle.includes("meeting")
    ) {
      analysis =
        "💡 Tip IA: Asegura tener una agenda clara y time-boxing de 30min para máxima eficiencia.";
      savings = (estimated * 0.2).toFixed(1);
    } else {
      analysis =
        "💡 Tip IA: Define claramente el 'Definition of Done' para evitar re-trabajos.";
    }

    document.getElementById("task-estimated").value = estimated;
    document.getElementById("task-savings").value = savings;
    document.getElementById("task-ai-analysis").value = analysis;

    btn.innerHTML = originalText;
    lucide.createIcons();
  }, 1200);
});

saveTaskBtn.addEventListener("click", async () => {
  const taskId = taskForm.querySelector("#task-id").value;
  const taskData = {
    title: taskForm.querySelector("#task-title").value,
    description: taskForm.querySelector("#task-description").value,
    project: taskForm.querySelector("#task-project").value,
    priority: taskForm.querySelector("#task-priority").value,
    // Nuevos campos
    estimatedHours:
      parseFloat(taskForm.querySelector("#task-estimated").value) || 0,
    savingsHours:
      parseFloat(taskForm.querySelector("#task-savings").value) || 0,
    actualHours: parseFloat(taskForm.querySelector("#task-actual").value) || 0,
    aiAnalysis: taskForm.querySelector("#task-ai-analysis").value,
    assignedTo: taskForm.querySelector("#task-assigned-to")
      ? taskForm.querySelector("#task-assigned-to").value
      : null,
  };

  try {
    if (taskId) {
      // Actualizar tarea existente
      const taskRef = getTaskDocRef(taskId);
      await updateDoc(taskRef, taskData);
      console.log("Tarea actualizada con éxito.");
    } else {
      // Crear nueva tarea
      const tasksCollection = getTasksCollectionRef();
      taskData.columnId = taskForm.querySelector("#task-column").value;
      taskData.createdBy = currentUser.uid;
      taskData.createdAt = new Date();
      await addDoc(tasksCollection, taskData);
      console.log("Tarea creada con éxito.");
    }
    closeTaskDetails();
  } catch (error) {
    console.error("Error al guardar la tarea:", error);
    alert("Error al guardar: " + error.message);
  }
});

// --- COMENTARIOS LOGIC ---
async function loadComments(taskId) {
  const container = document.getElementById("comments-section");
  container.innerHTML =
    '<div class="text-center py-4"><i data-lucide="loader" class="animate-spin w-5 h-5 mx-auto"></i></div>';
  lucide.createIcons();

  try {
    // Referencia a subcolección 'comments' dentro de la tarea
    // Nota: getTaskDocRef devuelve la referencia del doc, usamos collection() sobre ella.
    // IMPORTANTE: Firestore Web SDK V9 modular: collection(docRef, "comments")
    const taskRef = getTaskDocRef(taskId);
    const commentsRef = collection(taskRef, "comments");
    const q = query(commentsRef, orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
      container.innerHTML = "";
      if (snapshot.empty) {
        container.innerHTML =
          "<p class='text-gray-500 text-sm italic'>No hay comentarios aún.</p>";
        return;
      }

      snapshot.forEach((doc) => {
        const c = doc.data();
        const date = c.createdAt
          ? new Date(c.createdAt.seconds * 1000).toLocaleString()
          : "";
        const div = document.createElement("div");
        div.className =
          "bg-gray-800 p-3 rounded-lg border border-gray-700 text-sm";
        div.innerHTML = `
                  <div class="flex justify-between items-start mb-1">
                     <span class="font-bold text-[var(--brand-turquoise)]">${c.authorName}</span>
                     <span class="text-xs text-gray-500">${date}</span>
                  </div>
                  <p class="text-gray-300 break-words">${c.text}</p>
               `;
        container.appendChild(div);
      });
    });
  } catch (e) {
    console.error("Error loading comments:", e);
    container.innerHTML =
      "<p class='text-red-400 text-sm'>Error cargando comentarios.</p>";
  }
}

// Event listener para form de comentarios
document
  .getElementById("comment-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = document.getElementById("comment-input");
    const text = input.value.trim();
    if (!text) return;

    const taskId = document.getElementById("task-id").value;
    if (!taskId) return; // No debería pasar si el form está visible

    try {
      const taskRef = getTaskDocRef(taskId);
      await addDoc(collection(taskRef, "comments"), {
        text: text,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email,
        createdAt: new Date(),
      });
      input.value = "";
    } catch (e) {
      console.error("Error posting comment:", e);
      alert("Error al enviar comentario.");
    }
  });

// --- 10. OTRAS FUNCIONES DE LA INTERFAZ ---

window.showModule = (moduleId) => {
  document
    .querySelectorAll(".module")
    .forEach((m) => m.classList.remove("active"));
  document.getElementById(moduleId).classList.add("active");
  document.querySelectorAll(".sidebar-icon").forEach((icon) => {
    icon.classList.remove("active");
    if (icon.getAttribute("onclick").includes(moduleId))
      icon.classList.add("active");
  });
  moduleTitle.textContent = moduleInfo[moduleId].title;
  moduleDescription.textContent = moduleInfo[moduleId].description;

  if (moduleId === "academy") {
    // Cargar cursos si la función existe
    if (window.loadCourses) window.loadCourses();
  }
};

console.log("app.js cargado. Listo para iniciar sesión.");

// --- 14. LÓGICA DE ACADEMY ---

let currentCourseId = null;
let currentLessons = [];

// Función para poblar datos de prueba (Solo Superuser debería ejecutar esto en consola: await window.seedAcademy())
window.seedAcademy = async () => {
  if (currentUserRole !== "Superuser") {
    return alert("Solo Superusers pueden ejecutar el seed.");
  }

  const coursesData = [
    {
      title: "Introducción a la Automatización",
      description:
        "Conceptos básicos para comenzar a automatizar procesos repetitivos y liberar tiempo.",
      tier: "freemium",
      duration: "45 min",
      moduleCount: 5,
      icon: "zap",
      color: "blue",
    },
    {
      title: "Google Sheets para Negocios",
      description:
        "Domina las hojas de cálculo para gestionar tu negocio de forma eficiente.",
      tier: "freemium",
      duration: "60 min",
      moduleCount: 8,
      icon: "file-spreadsheet",
      color: "green",
    },
    {
      title: "IA para Procesos Empresariales",
      description:
        "Implementa IA generativa en tu organización de forma práctica y segura.",
      tier: "premium",
      duration: "90 min",
      moduleCount: 12,
      icon: "bot",
      color: "orange",
    },
  ];

  try {
    for (const course of coursesData) {
      const courseRef = await addDoc(collection(db, "courses"), course);
      console.log(`Curso creado: ${course.title} (${courseRef.id})`);

      // Crear lecciones dummy
      for (let i = 1; i <= course.moduleCount; i++) {
        await addDoc(collection(db, "courses", courseRef.id, "lessons"), {
          title: `Lección ${i}: Fundamentos Parte ${i}`,
          content: `Contenido de prueba para la lección ${i} del curso ${course.title}. Aquí iría el video y el texto explicativo.`,
          order: i,
          duration: "10:00",
          accessTier: course.tier, // Heredar tier
        });
      }
    }
    alert("Academy Seed Completado!");
    loadCourses(); // Recargar UI
  } catch (e) {
    console.error("Error seeding academy:", e);
    alert("Error seeding: " + e.message);
  }
};

window.loadCourses = async () => {
  const grid = document.getElementById("courses-grid");
  if (!grid) return;

  // Limpiar grid (o mostrar loading si ya lo tiene el HTML)
  grid.innerHTML =
    '<div class="col-span-2 text-center py-12"><i data-lucide="loader" class="animate-spin w-8 h-8 text-[var(--brand-turquoise)] mx-auto mb-2"></i><p class="text-[var(--brand-text-secondary)]">Cargando cursos...</p></div>';

  try {
    const q = query(collection(db, "courses")); // Podría agregar orderBy('title')
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      grid.innerHTML =
        '<div class="col-span-2 text-center py-12"><p class="text-[var(--brand-text-secondary)]">No hay cursos disponibles aún. (Ejecuta seedAcademy() en consola si eres Superuser)</p></div>';
      return;
    }

    grid.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const course = { id: docSnap.id, ...docSnap.data() };
      grid.innerHTML += createCourseCardHTML(course);
    });

    lucide.createIcons();
  } catch (e) {
    console.error("Error loading courses:", e);
    grid.innerHTML =
      '<div class="col-span-2 text-center text-red-400 py-12">Error al cargar cursos.</div>';
  }
};

function createCourseCardHTML(course) {
  // Soportar tanto tier como accessTier para compatibilidad
  const tier = course.accessTier || course.tier || "freemium";
  const lessonsCount = course.lessonsCount || course.moduleCount || 0;

  const isLocked = tier === "premium" && currentUserTier === "freemium";
  const lockOverlay = isLocked
    ? `
    <div class="absolute inset-0 bg-black/80 z-10 flex items-center justify-center backdrop-blur-sm">
      <div class="text-center">
        <i data-lucide="lock" class="w-8 h-8 text-yellow-500 mx-auto mb-2"></i>
        <span class="text-white text-sm font-bold">Solo Premium</span>
        <button onclick="event.stopPropagation(); window.open('https://calendly.com/espohr/conversemos', '_blank')" class="mt-3 block bg-[var(--brand-turquoise)] text-black text-xs px-3 py-1 rounded font-bold hover:opacity-90">Mejorar Plan</button>
      </div>
    </div>`
    : "";

  // Usar thumbnail si existe, sino gradiente
  const thumbnail = course.thumbnail
    ? `<img src="${course.thumbnail}" alt="${course.title}" class="w-full h-full object-cover">`
    : `<div class="w-full h-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
        <i data-lucide="graduation-cap" class="w-12 h-12 text-white/80"></i>
       </div>`;

  const tierBadge =
    tier === "premium"
      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
      : "bg-gradient-to-r from-green-600 to-emerald-600 text-white";

  return `
    <div onclick="${isLocked ? "" : `openCourse('${course.id}')`}" 
         class="bg-[var(--brand-card-bg)] border border-[var(--brand-border)] rounded-xl overflow-hidden hover:border-[var(--brand-turquoise)] transition-all duration-300 cursor-pointer relative group hover:shadow-lg hover:shadow-[var(--brand-turquoise)]/10">
      ${lockOverlay}
      <div class="h-40 overflow-hidden">
        ${thumbnail}
      </div>
      <div class="p-5">
        <div class="flex items-center gap-2 mb-3">
          <span class="${tierBadge} text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">${
    tier === "premium" ? "Premium" : "Gratis"
  }</span>
          ${
            course.instructor
              ? `<span class="text-xs text-gray-400">· ${course.instructor}</span>`
              : ""
          }
        </div>
        <h4 class="font-bold text-white text-lg leading-tight mb-2 line-clamp-2 group-hover:text-[var(--brand-turquoise)] transition">${
          course.title
        }</h4>
        <p class="text-sm text-[var(--brand-text-secondary)] line-clamp-2 mb-4">${
          course.description
        }</p>
        <div class="flex items-center gap-4 text-xs text-[var(--brand-text-secondary)] border-t border-[var(--brand-border)] pt-4">
          <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3.5 h-3.5"></i> ${
            course.duration
          }</span>
          <span class="flex items-center gap-1"><i data-lucide="book-open" class="w-3.5 h-3.5"></i> ${lessonsCount} lecciones</span>
        </div>
      </div>
    </div>
  `;
}

window.openCourse = async (courseId) => {
  currentCourseId = courseId;
  document.getElementById("academy-catalog").classList.add("hidden");
  document.getElementById("academy-viewer").classList.remove("hidden");

  // Reset UI
  document.getElementById("lesson-title").innerText = "Cargando curso...";
  document.getElementById("lesson-description").innerText = "";
  document.getElementById("lessons-list").innerHTML =
    '<div class="p-4 text-center"><i data-lucide="loader" class="animate-spin w-4 h-4 mx-auto"></i></div>';
  lucide.createIcons();

  try {
    // Cargar info del curso
    const courseDoc = await getDoc(doc(db, "courses", courseId));
    if (courseDoc.exists()) {
      document.getElementById("course-title").innerText =
        courseDoc.data().title;
    }

    // Cargar lecciones ordenadas
    const q = query(
      collection(db, "courses", courseId, "lessons"),
      orderBy("order", "asc")
    );
    const snapshot = await getDocs(q);
    currentLessons = [];
    snapshot.forEach((doc) =>
      currentLessons.push({ id: doc.id, ...doc.data() })
    );

    renderLessonsList();

    // Cargar primera lección por defecto
    if (currentLessons.length > 0) {
      loadLesson(currentLessons[0].id);
    } else {
      document.getElementById("lesson-player").innerHTML =
        '<div class="p-8 text-center text-gray-500">Este curso aún no tiene contenido.</div>';
    }
  } catch (e) {
    console.error("Error opening course:", e);
    alert("Error al abrir curso: " + e.message);
  }
};

window.closeCourseViewer = () => {
  document.getElementById("academy-viewer").classList.add("hidden");
  document.getElementById("academy-catalog").classList.remove("hidden");
  currentCourseId = null;
};

function renderLessonsList() {
  const list = document.getElementById("lessons-list");
  list.innerHTML = "";

  currentLessons.forEach((lesson, index) => {
    // Verificar acceso a lección individual si fuera necesario (por ahora hereda de curso)
    list.innerHTML += `
            <div onclick="loadLesson('${lesson.id}')" id="lesson-item-${
      lesson.id
    }" class="p-3 border-b border-[var(--brand-border)] hover:bg-gray-800 cursor-pointer transition flex items-start gap-3 group">
                <div class="w-6 h-6 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-xs text-gray-400 group-hover:border-[var(--brand-turquoise)] group-hover:text-[var(--brand-turquoise)] shrink-0">
                    ${index + 1}
                </div>
                <div>
                    <h5 class="text-sm text-gray-300 font-medium group-hover:text-white transition line-clamp-2">${
                      lesson.title
                    }</h5>
                    <span class="text-[10px] text-gray-500">${
                      lesson.duration
                    }</span>
                </div>
                <i data-lucide="play-circle" class="w-4 h-4 text-gray-600 ml-auto mt-1 group-hover:text-[var(--brand-turquoise)] opacity-0 group-hover:opacity-100 transition"></i>
            </div>
        `;
  });
  lucide.createIcons();
}

window.loadLesson = (lessonId) => {
  const lesson = currentLessons.find((l) => l.id === lessonId);
  if (!lesson) return;

  // Update active state in list
  document.querySelectorAll("[id^=lesson-item-]").forEach((el) => {
    el.classList.remove(
      "bg-gray-800",
      "border-l-4",
      "border-l-[var(--brand-turquoise)]"
    );
    el.classList.add("border-b");
  });
  const activeItem = document.getElementById(`lesson-item-${lessonId}`);
  if (activeItem) {
    activeItem.classList.add(
      "bg-gray-800",
      "border-l-4",
      "border-l-[var(--brand-turquoise)]"
    );
  }

  // Render content
  document.getElementById("lesson-title").innerText = lesson.title;
  document.getElementById(
    "lesson-description"
  ).innerHTML = `<p>${lesson.content}</p>`;

  // Simulador de Video Player
  const player = document.getElementById("lesson-player");
  player.innerHTML = `
        <div class="relative w-full h-full bg-black flex items-center justify-center group cursor-pointer" style="min-height: 400px;">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <i data-lucide="play" class="w-20 h-20 text-white opacity-80 group-hover:scale-110 transition transform duration-300"></i>
            <p class="absolute bottom-6 left-6 text-white font-bold text-lg">${lesson.title}</p>
        </div>
    `;
  lucide.createIcons();
};

// --- 15. FUNCIONES DE ADMINISTRACIÓN ---
// Ejecutar en consola: await window.becomeSuperuser()
window.becomeSuperuser = async () => {
  if (!currentUser) {
    console.error("❌ No hay usuario logueado.");
    return alert("Debes iniciar sesión primero.");
  }

  console.log("📧 Usuario actual:", currentUser.email);

  // Forzar refresh del token ANTES de llamar la función
  try {
    const token = await currentUser.getIdToken(true);
    console.log(
      "🔑 Token obtenido (primeros 20 chars):",
      token.substring(0, 20) + "..."
    );
  } catch (tokenError) {
    console.error("❌ Error obteniendo token:", tokenError);
    return alert("Error de autenticación: " + tokenError.message);
  }

  const SECRET_CODE = "GRODDY-SUPER-2024";
  console.log("🔐 Código secreto:", SECRET_CODE);

  try {
    console.log("🔄 Llamando a bootstrapSuperuser...");
    const bootstrapFn = httpsCallable(functions, "bootstrapSuperuser");
    const result = await bootstrapFn({ secretCode: SECRET_CODE });
    console.log("✅ Resultado:", result.data);
    alert(result.data.message);
    // Refresh token para obtener nuevos claims
    await currentUser.getIdToken(true);
    window.location.reload();
  } catch (error) {
    console.error("❌ Error completo:", error);
    console.error("❌ Código:", error.code);
    console.error("❌ Mensaje:", error.message);
    console.error("❌ Detalles:", error.details);
    alert("Error: " + error.message);
  }
};

// --- 16. PANEL DE ADMINISTRACIÓN DE USUARIOS (SUPERUSER) ---

window.openUserAdminPanel = async () => {
  if (currentUserRole !== "Superuser") {
    alert("Acceso denegado. Solo Superuser puede acceder a esta función.");
    return;
  }

  const modal = document.getElementById("user-admin-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  lucide.createIcons();

  await loadUsersForAdmin();
};

window.closeUserAdminPanel = () => {
  const modal = document.getElementById("user-admin-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.getElementById("user-edit-form").classList.add("hidden");
};

async function loadUsersForAdmin() {
  const container = document.getElementById("users-table-container");

  try {
    // Cargar usuarios desde Firestore
    const usersQuery = query(collection(db, "users"));
    const snapshot = await getDocs(usersQuery);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <i data-lucide="users" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
          <p>No hay usuarios registrados</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }

    let tableHTML = `
      <div class="overflow-x-auto rounded-xl border border-[var(--brand-border)]">
        <table class="w-full text-sm">
          <thead class="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
            <tr>
              <th class="px-4 py-3 text-left">Usuario</th>
              <th class="px-4 py-3 text-left">Rol Actual</th>
              <th class="px-4 py-3 text-left">Empresa</th>
              <th class="px-4 py-3 text-left">Registro</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--brand-border)]">
    `;

    snapshot.forEach((docSnap) => {
      const user = { uid: docSnap.id, ...docSnap.data() };
      const roleClass = getRoleBadgeClass(user.role || "Usuario");
      const roleLabel = user.role || "Free";
      const companyId = user.companyId || "-";
      const createdAt = user.createdAt?.toDate
        ? new Date(user.createdAt.toDate()).toLocaleDateString()
        : "-";

      tableHTML += `
        <tr class="hover:bg-white/5 transition">
          <td class="px-4 py-3">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs">
                ${(user.email || "U")[0].toUpperCase()}
              </div>
              <div>
                <p class="font-medium text-white text-xs">${
                  user.displayName || "Sin nombre"
                }</p>
                <p class="text-gray-400 text-xs">${user.email}</p>
              </div>
            </div>
          </td>
          <td class="px-4 py-3">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${roleClass}">${roleLabel}</span>
          </td>
          <td class="px-4 py-3 text-gray-300 text-xs font-mono">${companyId}</td>
          <td class="px-4 py-3 text-gray-400 text-xs">${createdAt}</td>
          <td class="px-4 py-3 text-center">
            <button onclick="editUser('${user.uid}', '${
        user.email
      }', '${roleLabel}', '${companyId}')" 
                    class="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition">
              <i data-lucide="pencil" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableHTML += `</tbody></table></div>`;
    container.innerHTML = tableHTML;
    lucide.createIcons();
  } catch (error) {
    console.error("Error cargando usuarios:", error);
    container.innerHTML = `
      <div class="text-center py-12 text-red-400">
        <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4"></i>
        <p>Error cargando usuarios: ${error.message}</p>
      </div>
    `;
    lucide.createIcons();
  }
}

function getRoleBadgeClass(role) {
  const classes = {
    Superuser: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50",
    Admin: "bg-purple-500/20 text-purple-400 border border-purple-500/50",
    Pro: "bg-blue-500/20 text-blue-400 border border-blue-500/50",
    Free: "bg-gray-700 text-gray-300 border border-gray-600",
    Usuario: "bg-gray-700 text-gray-300 border border-gray-600",
  };
  return classes[role] || classes.Free;
}

window.editUser = (uid, email, role, companyId) => {
  document.getElementById("user-edit-form").classList.remove("hidden");
  document.getElementById("edit-user-uid").value = uid;
  document.getElementById("edit-user-email").value = email;
  document.getElementById("edit-user-role").value =
    role === "Usuario" ? "Free" : role;
  document.getElementById("edit-user-company").value =
    companyId === "-" ? "" : companyId;
};

window.cancelEditUser = () => {
  document.getElementById("user-edit-form").classList.add("hidden");
};

window.saveUserRole = async () => {
  const uid = document.getElementById("edit-user-uid").value;
  const email = document.getElementById("edit-user-email").value;
  const newRole = document.getElementById("edit-user-role").value;
  const companyId =
    document.getElementById("edit-user-company").value.trim() || null;

  // Determinar tier basado en rol
  let tier = "freemium";
  if (newRole === "Pro" || newRole === "Admin" || newRole === "Superuser") {
    tier = "premium";
  }

  // Mapear rol a formato de claims
  const roleForClaims = newRole === "Free" ? "Usuario" : newRole;

  try {
    console.log("🔄 Actualizando rol de", email, "a", newRole);

    const setUserRoleFn = httpsCallable(functions, "setUserRole");
    const result = await setUserRoleFn({
      email: email,
      role: roleForClaims,
      tier: tier,
      companyId: companyId,
    });

    console.log("✅", result.data.message);
    alert(result.data.message);

    // Recargar lista de usuarios
    await loadUsersForAdmin();
    document.getElementById("user-edit-form").classList.add("hidden");
  } catch (error) {
    console.error("❌ Error actualizando rol:", error);
    alert("Error: " + error.message);
  }
};

// --- 17. DATOS DE DEMO ---
// Ejecutar en consola: await window.seedDemoData()
window.seedDemoData = async () => {
  if (!currentUser) {
    console.error("❌ Debes iniciar sesión primero");
    return;
  }

  console.log("🌱 Creando datos de demo...");

  const demoTasks = [
    // Columna: To Do
    {
      title: "Preparar reporte mensual de ventas",
      description: "Consolidar datos de CRM y crear presentación ejecutiva",
      columnId: "todo",
      priority: "high",
      estimatedHours: 3,
      savingsHours: 4.5,
      aiAnalysis:
        "💡 Tip IA: Automatiza con Power Query para reducir 75% del tiempo manual.",
    },
    {
      title: "Revisar propuesta comercial cliente ABC",
      description: "Validar términos y condiciones antes de enviar",
      columnId: "todo",
      priority: "medium",
      estimatedHours: 1,
      savingsHours: 0.5,
      aiAnalysis:
        "💡 Tip IA: Usa plantillas pre-aprobadas para acelerar el proceso.",
    },
    {
      title: "Actualizar documentación de procesos",
      description: "Incluir nuevos flujos de aprobación",
      columnId: "todo",
      priority: "low",
      estimatedHours: 2,
      savingsHours: 1,
      aiAnalysis:
        "💡 Tip IA: Considera usar Notion o Confluence para documentación colaborativa.",
    },
    // Columna: In Progress
    {
      title: "Implementar nuevo dashboard de métricas",
      description: "Conectar con API de analytics y crear visualizaciones",
      columnId: "progress",
      priority: "high",
      estimatedHours: 8,
      savingsHours: 12,
      aiAnalysis:
        "💡 Tip IA: Looker Studio puede automatizar la actualización de datos.",
    },
    {
      title: "Reunión de seguimiento con equipo",
      description: "Review semanal de OKRs y blockers",
      columnId: "progress",
      priority: "medium",
      estimatedHours: 1,
      savingsHours: 0.2,
      aiAnalysis:
        "💡 Tip IA: Limita a 30 min con agenda clara para máxima eficiencia.",
    },
    // Columna: Review
    {
      title: "Validar migración de base de datos",
      description: "QA de integridad de datos post-migración",
      columnId: "review",
      priority: "high",
      estimatedHours: 4,
      savingsHours: 6,
      aiAnalysis:
        "💡 Tip IA: Scripts de validación automatizada pueden reducir errores humanos.",
    },
    // Columna: Done
    {
      title: "Configurar integraciones con CRM",
      description: "Conectar Salesforce con herramientas internas",
      columnId: "done",
      priority: "high",
      estimatedHours: 6,
      savingsHours: 15,
      aiAnalysis: "💡 Tip IA: Zapier puede mantener sincronización automática.",
    },
    {
      title: "Capacitación equipo nueva herramienta",
      description: "Sesión de 2 horas con team comercial",
      columnId: "done",
      priority: "medium",
      estimatedHours: 2,
      savingsHours: 8,
      aiAnalysis:
        "💡 Tip IA: Graba la sesión para futuras referencias y onboarding.",
    },
  ];

  const tasksRef = getTasksCollectionRef();
  let created = 0;

  for (const task of demoTasks) {
    try {
      await addDoc(tasksRef, {
        ...task,
        createdBy: currentUser.uid,
        createdAt: new Date(),
        tags: [],
      });
      created++;
      console.log(`✅ Tarea creada: ${task.title}`);
    } catch (error) {
      console.error(`❌ Error creando tarea: ${task.title}`, error);
    }
  }

  console.log(`\n🎉 ${created} tareas de demo creadas exitosamente!`);
  alert(
    `¡${created} tareas de demo creadas! El Kanban se actualizará automáticamente.`
  );
};

// --- 18. LIMPIAR DATOS DE DEMO ---
// Ejecutar en consola: await window.clearDemoData()
window.clearDemoData = async () => {
  if (!currentUser) {
    console.error("❌ Debes iniciar sesión primero");
    return;
  }

  if (!confirm("¿Estás seguro de que quieres eliminar TODAS las tareas?")) {
    return;
  }

  console.log("🗑️ Eliminando tareas...");

  const tasksRef = getTasksCollectionRef();
  const q = query(tasksRef);
  const snapshot = await getDocs(q);

  let deleted = 0;
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, docSnap.ref.path));
    deleted++;
  }

  console.log(`✅ ${deleted} tareas eliminadas`);
  alert(
    `${deleted} tareas eliminadas. El Kanban se actualizará automáticamente.`
  );
};

// --- 19. SEED ACADEMY ---
// Ejecutar en consola: await window.seedAcademy()
window.seedAcademy = async () => {
  if (currentUserRole !== "Superuser") {
    console.error("❌ Solo Superuser puede ejecutar seedAcademy");
    return alert("Acceso denegado. Solo Superuser puede crear cursos.");
  }

  console.log("🎓 Creando cursos de demo para Academy...");

  const coursesData = [
    {
      id: "optimizacion-procesos",
      title: "Optimización de Procesos con IA",
      description:
        "Aprende a identificar y automatizar procesos repetitivos usando herramientas de inteligencia artificial.",
      thumbnail:
        "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400",
      duration: "3 horas",
      accessTier: "freemium",
      instructor: "Edmundo Spohr",
      lessonsCount: 4,
      lessons: [
        {
          title: "Introducción a la automatización",
          duration: "15 min",
          type: "video",
          accessTier: "freemium",
          content:
            "En esta lección aprenderás los fundamentos de la automatización de procesos...",
        },
        {
          title: "Identificando procesos automatizables",
          duration: "20 min",
          type: "video",
          accessTier: "freemium",
          content:
            "Cómo identificar qué tareas pueden ser automatizadas en tu día a día...",
        },
        {
          title: "Herramientas de IA para optimización",
          duration: "25 min",
          type: "video",
          accessTier: "premium",
          content:
            "Exploraremos Zapier, Make, Power Automate y otras herramientas...",
        },
        {
          title: "Caso práctico: Automatiza tu flujo de emails",
          duration: "30 min",
          type: "video",
          accessTier: "premium",
          content: "Implementación paso a paso de un flujo automatizado...",
        },
      ],
    },
    {
      id: "excel-avanzado",
      title: "Excel Avanzado para Consultoría",
      description:
        "Domina las funciones avanzadas de Excel para análisis de datos y reportería ejecutiva.",
      thumbnail:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
      duration: "5 horas",
      accessTier: "premium",
      instructor: "Edmundo Spohr",
      lessonsCount: 5,
      lessons: [
        {
          title: "Power Query: Limpieza de datos",
          duration: "30 min",
          type: "video",
          accessTier: "freemium",
          content: "Aprende a transformar y limpiar datos automáticamente...",
        },
        {
          title: "Tablas dinámicas avanzadas",
          duration: "25 min",
          type: "video",
          accessTier: "premium",
          content: "Técnicas avanzadas para análisis multidimensional...",
        },
        {
          title: "Dashboards interactivos",
          duration: "35 min",
          type: "video",
          accessTier: "premium",
          content: "Crea paneles de control profesionales...",
        },
        {
          title: "Fórmulas matriciales y LAMBDA",
          duration: "40 min",
          type: "video",
          accessTier: "premium",
          content: "Funciones avanzadas para cálculos complejos...",
        },
        {
          title: "Integración con Power BI",
          duration: "30 min",
          type: "video",
          accessTier: "premium",
          content: "Conecta Excel con herramientas de BI...",
        },
      ],
    },
    {
      id: "productividad-personal",
      title: "Productividad Personal con Metodologías Ágiles",
      description:
        "Aplica frameworks ágiles a tu vida personal y profesional para maximizar resultados.",
      thumbnail:
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400",
      duration: "2 horas",
      accessTier: "freemium",
      instructor: "Edmundo Spohr",
      lessonsCount: 3,
      lessons: [
        {
          title: "Kanban personal: Visualiza tu trabajo",
          duration: "20 min",
          type: "video",
          accessTier: "freemium",
          content: "Cómo usar un tablero Kanban para gestionar tareas...",
        },
        {
          title: "Time-boxing y Pomodoro avanzado",
          duration: "15 min",
          type: "video",
          accessTier: "freemium",
          content: "Técnicas de gestión del tiempo...",
        },
        {
          title: "OKRs personales: Define y mide objetivos",
          duration: "25 min",
          type: "video",
          accessTier: "premium",
          content: "Implementa objetivos medibles en tu vida...",
        },
      ],
    },
  ];

  let coursesCreated = 0;
  let lessonsCreated = 0;

  for (const courseData of coursesData) {
    try {
      const { lessons, ...course } = courseData;

      // Crear curso
      const courseRef = doc(db, "courses", course.id);
      await setDoc(courseRef, {
        ...course,
        createdAt: new Date(),
        createdBy: currentUser.uid,
      });
      coursesCreated++;
      console.log(`✅ Curso creado: ${course.title}`);

      // Crear lecciones
      for (let i = 0; i < lessons.length; i++) {
        const lesson = lessons[i];
        const lessonRef = doc(
          db,
          "courses",
          course.id,
          "lessons",
          `lesson-${i + 1}`
        );
        await setDoc(lessonRef, {
          ...lesson,
          order: i + 1,
          courseId: course.id,
          createdAt: new Date(),
        });
        lessonsCreated++;
      }
      console.log(`  ↳ ${lessons.length} lecciones creadas`);
    } catch (error) {
      console.error(`❌ Error creando curso ${courseData.title}:`, error);
    }
  }

  console.log(`\n🎉 Academy Seed Completado!`);
  console.log(`   ${coursesCreated} cursos creados`);
  console.log(`   ${lessonsCreated} lecciones creadas`);
  alert(
    `¡Academy poblada! ${coursesCreated} cursos y ${lessonsCreated} lecciones creadas.`
  );
};
