// public/app.js - VERSIÓN FINAL CON FIRESTORE INTEGRADO

// --- 1. IMPORTAR FUNCIONES DE FIREBASE ---
import { auth, db, functions } from './firebase-config.js';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import { httpsCallable } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-functions.js";
import { collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// --- 2. ELEMENTOS DEL DOM ---
const loginScreen = document.getElementById('login-screen');
const appPortal = document.getElementById('app-portal');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const userAvatar = document.getElementById('user-avatar');
const moduleTitle = document.getElementById('module-title');
const moduleDescription = document.getElementById('module-description');
const taskDetailModal = document.getElementById('task-detail-modal');
const taskForm = document.getElementById('task-form');
const saveTaskBtn = document.getElementById('save-task-btn');
const commentsSection = document.getElementById('comments-section');

// --- 3. ESTADO GLOBAL DE LA APLICACIÓN ---
let currentUser = null;
let currentUserRole = null;
let currentUserCompanyId = null;
let tasksUnsubscribe = null; // Para detener el "oyente" de Firestore al cerrar sesión

const moduleInfo = {
    'dashboard-kanban': { title: 'Dashboard & Kanban', description: 'Métricas clave y gestión del flujo de trabajo.' },
    'ai-agent': { title: 'Groddy AI', description: 'Transforma tus ideas en soluciones y tareas accionables.' },
    'user-info': { title: 'Mi Perfil', description: 'Información de tu cuenta y configuración.' }
};

// --- 4. MANEJO DE LOGIN CON FIREBASE ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            console.error("Error detallado de Firebase Auth:", error);
            loginError.textContent = "Correo o contraseña incorrectos.";
            loginError.classList.remove('hidden');
        });
});

// --- 5. MANEJO CENTRAL DE AUTENTICACIÓN ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const idTokenResult = await user.getIdTokenResult(true);
        currentUserRole = idTokenResult.claims.role || 'Usuario';
        currentUserCompanyId = idTokenResult.claims.companyId;

        console.log(`¡Login exitoso! Usuario: ${user.email}, Rol: ${currentUserRole}`);

        loginScreen.style.display = 'none';
        appPortal.style.display = 'flex';
        initializeApp();
    } else {
        currentUser = null;
        if (tasksUnsubscribe) {
            tasksUnsubscribe(); // Detiene el "oyente" de tareas
        }
        loginScreen.style.display = 'flex';
        appPortal.style.display = 'none';
    }
});

// --- 6. FUNCIÓN DE LOGOUT ---
window.logout = () => {
    signOut(auth);
};

// --- 7. INICIALIZACIÓN DE LA APLICACIÓN ---
function initializeApp() {
    document.body.classList.remove('admin-view', 'editor-view');
    if (currentUserRole === 'Superuser' || currentUserRole === 'Admin') {
        document.body.classList.add('admin-view', 'editor-view');
    } else {
        document.body.classList.add('editor-view');
    }

    const emailPrefix = currentUser.email.split('@')[0];
    userAvatar.textContent = (emailPrefix[0] + (emailPrefix[1] || '')).toUpperCase();
    
    initializeKanban(); // <-- AHORA USA FIRESTORE
    showModule('dashboard-kanban');
    lucide.createIcons();
}

// --- 8. LÓGICA DEL KANBAN CON FIRESTORE ---

function initializeKanban() {
    if (tasksUnsubscribe) tasksUnsubscribe(); // Detiene cualquier "oyente" anterior

    const tasksCollection = collection(db, 'companies', currentUserCompanyId, 'tasks');
    const q = query(tasksCollection);

    tasksUnsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("Datos de tareas actualizados desde Firestore.");
        document.querySelectorAll('.kanban-column .space-y-4').forEach(col => col.innerHTML = '');
        querySnapshot.forEach((doc) => {
            const task = { id: doc.id, ...doc.data() };
            const columnEl = document.querySelector(`.kanban-column[data-column-id="${task.columnId}"] .space-y-4`);
            if (columnEl) {
                columnEl.innerHTML += createTaskCardHTML(task);
            }
        });
        lucide.createIcons();
    });
}

window.drag = (ev) => {
    ev.dataTransfer.setData("text/plain", ev.target.id);
    ev.target.classList.add('dragging');
}

window.drop = async (ev) => {
    ev.preventDefault();
    const taskId = ev.dataTransfer.getData("text/plain");
    const card = document.getElementById(taskId);
    if (!card) return;
    card.classList.remove('dragging');
    let target = ev.target;
    while (target && !target.classList.contains('kanban-column')) {
        target = target.parentElement;
    }
    if (target) {
        const newColumnId = target.dataset.columnId;
        console.log(`Moviendo tarea ${taskId} a la columna ${newColumnId}`);
        const taskRef = doc(db, 'companies', currentUserCompanyId, 'tasks', taskId);
        try {
            await updateDoc(taskRef, { columnId: newColumnId });
        } catch (error) {
            console.error("Error al actualizar la columna de la tarea:", error);
        }
    }
}

function createTaskCardHTML(task) {
    const priorityClasses = { high: 'bg-red-900/50 text-red-300', medium: 'bg-yellow-800/50 text-yellow-300', low: 'bg-sky-900/50 text-sky-300' };
    const recurrenceColor = task.type === 'recurring' ? 'text-[var(--brand-turquoise)]' : 'text-gray-500';
    const totalImpact = (task.impactHours || 0) * (task.usersAffected || 1);
    const commentsCount = task.comments ? task.comments.length : 0;

    return `<div onclick="openTaskDetails('${task.id}')" class="k-card bg-[var(--brand-card-bg)] p-4 rounded-lg border border-[var(--brand-border)]" draggable="true" ondragstart="drag(event)" id="${task.id}">
        <p class="font-semibold text-white text-sm">${task.title}</p>
        <p class="text-sm text-[var(--brand-text-secondary)] mt-2 font-light line-clamp-2">${task.description || ''}</p>
        <div class="flex items-center justify-between mt-4 pt-3 border-t border-[var(--brand-border)]">
             <div class="flex items-center gap-3">
                 <span class="text-xs text-[var(--brand-text-secondary)] flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${task.usersAffected || 1}</span>
                 <span class="text-xs text-[var(--brand-text-secondary)] flex items-center gap-1"><i data-lucide="message-square" class="w-3 h-3"></i> ${commentsCount}</span>
            </div>
            <div class="text-xs font-semibold flex items-center gap-1 text-[var(--brand-turquoise)]">
               <i data-lucide="zap" class="w-3 h-3"></i><span>${totalImpact}h</span>
            </div>
        </div>
    </div>`;
}

// --- 9. MODAL DE TAREAS CON FIRESTORE ---

window.openTaskDetails = async (taskId, columnId = null) => {
    taskForm.reset();
    const isCreating = !taskId;
    document.getElementById('modal-title').textContent = isCreating ? 'Crear Nueva Tarea' : 'Detalles de la Tarea';
    
    if (isCreating) {
        taskForm.querySelector('#task-id').value = '';
        taskForm.querySelector('#task-column').value = columnId;
    } else {
        const taskRef = doc(db, 'companies', currentUserCompanyId, 'tasks', taskId);
        const taskSnap = await getDoc(taskRef);
        if (taskSnap.exists()) {
            const task = taskSnap.data();
            taskForm.querySelector('#task-id').value = taskId;
            taskForm.querySelector('#task-title').value = task.title;
            taskForm.querySelector('#task-description').value = task.description;
            taskForm.querySelector('#task-priority').value = task.priority;
            taskForm.querySelector('#task-impact').value = task.impactHours;
            taskForm.querySelector('#task-users-affected').value = task.usersAffected;
            taskForm.querySelector('#task-type').value = task.type;
        }
    }
    taskDetailModal.classList.remove('hidden');
    taskDetailModal.classList.add('flex');
}

window.closeTaskDetails = () => taskDetailModal.classList.add('hidden');

saveTaskBtn.addEventListener('click', async () => {
    const taskId = taskForm.querySelector('#task-id').value;
    const taskData = {
        title: taskForm.querySelector('#task-title').value,
        description: taskForm.querySelector('#task-description').value,
        priority: taskForm.querySelector('#task-priority').value,
        impactHours: parseInt(taskForm.querySelector('#task-impact').value, 10) || 0,
        usersAffected: parseInt(taskForm.querySelector('#task-users-affected').value, 10) || 1,
        type: taskForm.querySelector('#task-type').value
    };

    try {
        if (taskId) { // Actualizar tarea existente
            const taskRef = doc(db, 'companies', currentUserCompanyId, 'tasks', taskId);
            await updateDoc(taskRef, taskData);
            console.log("Tarea actualizada con éxito.");
        } else { // Crear nueva tarea
            const tasksCollection = collection(db, 'companies', currentUserCompanyId, 'tasks');
            taskData.columnId = taskForm.querySelector('#task-column').value;
            taskData.createdBy = currentUser.uid;
            taskData.createdAt = new Date();
            await addDoc(tasksCollection, taskData);
            console.log("Tarea creada con éxito.");
        }
        closeTaskDetails();
    } catch (error) {
        console.error("Error al guardar la tarea:", error);
    }
});


// --- 10. OTRAS FUNCIONES DE LA INTERFAZ ---

window.showModule = (moduleId) => {
    document.querySelectorAll('.module').forEach(m => m.classList.remove('active'));
    document.getElementById(moduleId).classList.add('active');
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
        icon.classList.remove('active');
        if (icon.getAttribute('onclick').includes(moduleId)) icon.classList.add('active');
    });
    moduleTitle.textContent = moduleInfo[moduleId].title;
    moduleDescription.textContent = moduleInfo[moduleId].description;
};

console.log("app.js cargado. Listo para iniciar sesión.");
