window.addEventListener('load', () => {
    // --- DOM ELEMENTS ---
    const loginScreen = document.getElementById('login-screen'), appPortal = document.getElementById('app-portal'), loginForm = document.getElementById('login-form'), loginError = document.getElementById('login-error'), clientSelector = document.getElementById('client-selector'), moduleTitle = document.getElementById('module-title'), moduleDescription = document.getElementById('module-description'), userInfoModule = document.getElementById('user-info'), userModal = document.getElementById('user-modal'), userForm = document.getElementById('user-form'), taskDetailModal = document.getElementById('task-detail-modal'), taskForm = document.getElementById('task-form'), kanbanBoard = document.getElementById('kanban-board'), totalHoursSavedEl = document.getElementById('total-hours-saved'), archiveTasksBtn = document.getElementById('archive-tasks-btn'), historyList = document.getElementById('history-list'), notificationsPanel = document.getElementById('notifications-panel'), notificationsList = document.getElementById('notifications-list'), notificationsIndicator = document.getElementById('notifications-indicator'), commentForm = document.getElementById('comment-form'), commentInput = document.getElementById('comment-input'), commentsSection = document.getElementById('comments-section'), saveTaskBtn = document.getElementById('save-task-btn'), aiForm = document.getElementById('ai-form'), aiInput = document.getElementById('ai-input'), chatMessages = document.getElementById('chat-messages');
    
    // --- APP STATE ---
    let currentUser = null, currentClientEmail = '', chatHistory = [];
    let tasksData = {}, historyData = {}, monthlyHoursSaved = {}, notificationsData = {};

    // --- DATA ---
    let sampleUsers = [
        { name: 'Cliente Principal', email: 'cliente@empresa.com', role: 'Editor', avatar: 'CP', company: 'Empresa Alfa', title: 'CEO' },
        { name: 'Ana Gómez', email: 'ana.gomez@empresa.com', role: 'Visualizador', avatar: 'AG', company: 'Tech Solutions', title: 'Project Manager' },
        { name: 'Admin Groddy', email: 'admin@groddys.lab', role: 'Admin', avatar: 'AD', company: "Groddy's Lab", title: 'Consultant' },
        { name: 'Luis Vega', email: 'luis.vega@empresa.com', role: 'Inactivo', avatar: 'LV', company: 'Innovate Co', title: 'Developer' }
    ];
    
    const moduleInfo = {
        'dashboard-kanban': { title: 'Dashboard & Kanban', description: 'Métricas clave y gestión del flujo de trabajo.' },
        'ai-agent': { title: 'Groddy AI', description: 'Transforma tus ideas en soluciones y tareas accionables.' },
        'user-info': { title: 'Mi Perfil', description: 'Información de tu cuenta y configuración.' }
    };

    // --- GEMINI API SETUP ---
    const apiKey = "AIzaSyDHs_dpJXr6au8SqSiYRNih5AEvpKOTQ5w"; 
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    async function callGeminiAPI(history) {
        try {
            const payload = {
                contents: history,
                systemInstruction: {
                    parts: [{ text: `Eres Groddy, un asistente de IA experto en productividad. Tu objetivo es ayudar a los usuarios a convertir ideas vagas en tareas accionables para un tablero Kanban.
                    Cuando un usuario te dé una idea, respóndele amigablemente y propón una solución concreta. Si tu propuesta es una tarea accionable, DEBES incluir un bloque de código JSON al final con la siguiente estructura:
                    \`\`\`json
                    {
                        "title": "Un título conciso para la tarea",
                        "description": "Una descripción detallada de la solución propuesta",
                        "impactHours": <un número entero estimado de horas que se ahorrarán POR USUARIO>,
                        "usersAffected": <un número entero estimado de usuarios que se beneficiarán>,
                        "priority": "<'low', 'medium', o 'high'>",
                        "isRecurring": <true si el ahorro es mensual, false si es de una sola vez>
                    }
                    \`\`\`
                    No incluyas el bloque JSON si la solicitud del usuario no es una idea clara para una tarea (por ejemplo, si es un saludo o una pregunta de seguimiento). Continúa la conversación de forma natural.` }]
                }
            };
            const response = await fetch(geminiApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                console.error('API Error Response:', await response.text());
                throw new Error('La solicitud a la API de Gemini falló.');
            }
            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text || "No pude procesar esa idea. Inténtalo de nuevo.";
        } catch (error) {
            console.error("Error al llamar a la API de Gemini:", error);
            return "Hubo un error al conectar con la IA. Por favor, intenta más tarde.";
        }
    }

    // --- INITIALIZATION ---
    function initializeDB() {
            sampleUsers.filter(u => u.role !== 'Admin' && u.role !== 'Inactivo').forEach(user => {
            tasksData[user.email] = [
                { id: 'task-1', title: `Optimizar Checkout`, description: 'Rediseñar el flujo de pago para reducir el abandono en 3 pasos.', dueDate: '2025-09-15', impactHours: 5, usersAffected: 5, priority: 'high', type: 'recurring', columnId: 'todo', comments: [{author: 'Admin Groddy', text: 'Propuesta inicial enviada.', date: 'hace 2 días'}] },
                { id: 'task-2', title: `Estrategia SEO para Blog`, description: 'Aplicar keywords long-tail en los 5 artículos más recientes.', dueDate: '2025-09-20', impactHours: 8, usersAffected: 1, priority: 'medium', type: 'once', columnId: 'inprogress', comments: [] }
            ];
            historyData[user.email] = [];
            monthlyHoursSaved[user.email] = { '2025-07': 40, '2025-08': 55 };
            notificationsData[user.email] = [
                { text: 'Admin movió "Estrategia SEO" a In Progress.', date: 'hace 3 horas', read: false },
                { text: 'Nueva tarea "Optimizar Checkout" fue creada.', date: 'hace 2 días', read: true }
            ];
        });
    }
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const email = document.getElementById('login-email').value;
        const user = sampleUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
            loginError.textContent = 'Usuario no encontrado.';
            loginError.classList.remove('hidden');
            return;
        }
        if (user.role === 'Inactivo') {
            loginError.textContent = 'Esta cuenta se encuentra inactiva.';
            loginError.classList.remove('hidden');
            return;
        }

        currentUser = user;
        currentClientEmail = currentUser.role === 'Admin' ? sampleUsers.find(u => u.role !== 'Admin' && u.role !== 'Inactivo').email : currentUser.email;
        
        loginScreen.style.display = 'none';
        appPortal.style.display = 'flex';
        initializeApp();
    });

    window.logout = () => {
        appPortal.style.display = 'none';
        loginScreen.style.display = 'flex';
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
    }

    function initializeApp() {
        document.body.classList.remove('admin-view', 'editor-view');
        if (currentUser.role === 'Admin') document.body.classList.add('admin-view', 'editor-view');
        if (currentUser.role === 'Editor') document.body.classList.add('editor-view');

        document.getElementById('user-avatar').textContent = currentUser.avatar;
        
        // Allow AI chat for Visualizador as well
        if (currentUser.role === 'Visualizador' || currentUser.role === 'Editor' || currentUser.role === 'Admin') {
            aiForm.style.display = 'flex';
        } else {
            aiForm.style.display = 'none';
        }
        
        if (currentUser.role === 'Admin') {
            moduleInfo['user-info'].title = 'Admin Panel';
            moduleInfo['user-info'].description = 'Gestiona usuarios y clientes de la plataforma.';
        } else {
                moduleInfo['user-info'].title = 'Mi Perfil';
                moduleInfo['user-info'].description = 'Información de tu cuenta.';
        }
        
        initializeKanban();
        initializeChat();
        renderUserInfo();
        renderNotifications();
        calculateCurrentMonthHours();
        initializeHoursChart();
        showModule('dashboard-kanban');
        lucide.createIcons();
    }

    // --- MODULE NAVIGATION & UI ---
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

    function populateClientSelector() {
        const selector = document.getElementById('client-selector');
        if (!selector) return;
        selector.innerHTML = '';
        sampleUsers.filter(u => u.role !== 'Admin' && u.role !== 'Inactivo').forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.name;
            selector.appendChild(option);
        });
        selector.value = currentClientEmail;
    }

    function handleClientChange(e) { 
        currentClientEmail = e.target.value; 
        initializeKanban(); 
        calculateCurrentMonthHours(); 
        initializeHoursChart(); 
    }

    // --- USER MANAGEMENT (Admin) ---
    window.openUserModal = (email = null) => {
        userForm.reset();
        const isEditing = email !== null;
        document.getElementById('user-modal-title').textContent = isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario';
        const emailInput = document.getElementById('user-email');
        
        if (isEditing) {
            const user = sampleUsers.find(u => u.email === email);
            if (!user) return;
            document.getElementById('user-id').value = user.email;
            emailInput.value = user.email;
            emailInput.readOnly = true;
            document.getElementById('user-name').value = user.name || '';
            document.getElementById('user-company').value = user.company || '';
            document.getElementById('user-title').value = user.title || '';
            document.getElementById('user-role').value = user.role;
        } else {
            document.getElementById('user-id').value = '';
            emailInput.readOnly = false;
        }

        userModal.classList.remove('hidden');
        userModal.classList.add('flex');
    }
    window.closeUserModal = () => userModal.classList.add('hidden');

    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userId = document.getElementById('user-id').value;
        const email = document.getElementById('user-email').value.trim();
        if (!email) {
            alert('El correo electrónico es obligatorio.');
            return;
        }

        const formData = {
            name: document.getElementById('user-name').value.trim(),
            email: email,
            company: document.getElementById('user-company').value.trim(),
            title: document.getElementById('user-title').value.trim(),
            role: document.getElementById('user-role').value,
        };

        if (userId) { // Editing
            const userToUpdate = sampleUsers.find(u => u.email === userId);
            if (userToUpdate) {
                Object.assign(userToUpdate, formData);
                userToUpdate.avatar = userToUpdate.name ? userToUpdate.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            }
        } else { // Creating
            if (sampleUsers.some(u => u.email === email)) {
                alert('El correo electrónico ya existe.');
                return;
            }
            formData.avatar = formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
            sampleUsers.push(formData);
        }
        renderUserInfo();
        closeUserModal();
    });

    // --- NOTIFICATIONS ---
    window.toggleNotifications = () => {
        notificationsPanel.classList.toggle('-translate-x-full');
        if (!notificationsPanel.classList.contains('-translate-x-full')) {
                notificationsIndicator.classList.add('hidden');
                if (notificationsData[currentClientEmail]) {
                notificationsData[currentClientEmail].forEach(n => n.read = true);
                }
                renderNotifications();
        }
    }
    function renderNotifications() {
        notificationsList.innerHTML = '';
        const clientNotifications = notificationsData[currentClientEmail] || [];
        const hasUnread = clientNotifications.some(n => !n.read);
        notificationsIndicator.classList.toggle('hidden', !hasUnread);
        if(clientNotifications.length === 0) {
                notificationsList.innerHTML = `<p class="text-sm text-center text-[var(--brand-text-secondary)]">No hay notificaciones.</p>`;
                return;
        }
        clientNotifications.forEach(n => {
            notificationsList.innerHTML += `<div class="text-sm p-2 rounded-md ${n.read ? 'text-[var(--brand-text-secondary)]' : 'bg-sky-900/50 text-white'}"><p>${n.text}</p><span class="text-xs opacity-70">${n.date}</span></div>`;
        });
    }
    
    // --- KANBAN & TASK LOGIC ---
    window.drag = ev => { ev.dataTransfer.setData("text/plain", ev.target.id); ev.target.classList.add('dragging'); }
    window.drop = ev => {
        ev.preventDefault();
        if (currentUser.role === 'Visualizador') return;
        const cardId = ev.dataTransfer.getData("text/plain");
        const card = document.getElementById(cardId);
        if (!card) return;
        card.classList.remove('dragging');
        let target = ev.target;
        while (target && !target.classList.contains('kanban-column')) target = target.parentElement;
        if (target) {
            target.querySelector('.space-y-4').appendChild(card);
            const newColumnId = target.dataset.columnId;
            const task = findTaskById(cardId);
            if (task) {
                task.columnId = newColumnId;
                calculateCurrentMonthHours();
                initializeHoursChart();
            }
        }
    }
    const findTaskById = taskId => tasksData[currentClientEmail]?.find(t => t.id === taskId);
    function updateTask(taskId, updates) { const task = findTaskById(taskId); if(task) { Object.assign(task, updates); initializeKanban(); } }
    function createTask(taskData) { const newTask = { id: 'task-' + Date.now(), ...taskData, comments: [] }; if(!tasksData[currentClientEmail]) tasksData[currentClientEmail] = []; tasksData[currentClientEmail].push(newTask); return newTask; }
    
    // --- TASK DETAIL MODAL ---
    window.openTaskDetails = (taskId, columnId = null) => {
        taskForm.reset();
        commentForm.reset();
        const isCreating = !taskId;
        document.getElementById('modal-title').textContent = isCreating ? 'Crear Nueva Tarea' : 'Detalles de la Tarea';
        commentsSection.parentElement.style.display = isCreating ? 'none' : 'block';
        commentForm.style.display = isCreating ? 'none' : 'flex';
        
        if (isCreating) {
            taskForm.querySelector('#task-id').value = '';
            taskForm.querySelector('#task-column').value = columnId;
        } else {
            const task = findTaskById(taskId);
            if (!task) { console.error("Task not found!"); return; }
            taskForm.querySelector('#task-id').value = task.id;
            taskForm.querySelector('#task-title').value = task.title;
            taskForm.querySelector('#task-description').value = task.description;
            taskForm.querySelector('#task-priority').value = task.priority;
            taskForm.querySelector('#task-impact').value = task.impactHours;
            taskForm.querySelector('#task-users-affected').value = task.usersAffected;
            taskForm.querySelector('#task-type').value = task.type;
            renderComments(task.comments);
        }
        const isVisualizador = currentUser.role === 'Visualizador';
        taskForm.querySelectorAll('input, select, textarea').forEach(el => el.disabled = isVisualizador);
        commentForm.querySelectorAll('input, button').forEach(el => el.disabled = isVisualizador);
        saveTaskBtn.style.display = isVisualizador ? 'none' : 'inline-flex';
        taskDetailModal.classList.remove('hidden');
        taskDetailModal.classList.add('flex');
    }
    window.closeTaskDetails = () => taskDetailModal.classList.add('hidden');
    saveTaskBtn.addEventListener('click', () => {
        const taskId = taskForm.querySelector('#task-id').value;
        const taskData = {
            title: taskForm.querySelector('#task-title').value,
            description: taskForm.querySelector('#task-description').value,
            priority: taskForm.querySelector('#task-priority').value,
            impactHours: parseInt(taskForm.querySelector('#task-impact').value, 10) || 0,
            usersAffected: parseInt(taskForm.querySelector('#task-users-affected').value, 10) || 1,
            type: taskForm.querySelector('#task-type').value
        };
        if (taskId) {
            updateTask(taskId, taskData);
        } else {
            taskData.columnId = taskForm.querySelector('#task-column').value;
            createTask(taskData);
        }
        initializeKanban();
        calculateCurrentMonthHours();
        initializeHoursChart();
        closeTaskDetails();
    });
    function renderComments(comments) {
        commentsSection.innerHTML = '';
        if (!comments || comments.length === 0) { commentsSection.innerHTML = '<p class="text-center text-sm text-[var(--brand-text-secondary)]">No hay comentarios aún.</p>'; return; }
        comments.forEach(comment => {
            const commentAuthor = sampleUsers.find(u => u.name === comment.author) || {avatar: '?', name: comment.author};
            commentsSection.innerHTML += `<div class="flex items-start gap-3"><div class="w-8 h-8 flex-shrink-0 mt-1 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">${commentAuthor.avatar}</div><div><p class="font-semibold text-white text-sm">${comment.author} <span class="text-xs font-light text-[var(--brand-text-secondary)]">${comment.date}</span></p><p class="text-sm text-[var(--brand-text-secondary)]">${comment.text}</p></div></div>`;
        });
    }
    commentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const taskId = taskForm.querySelector('#task-id').value, commentText = commentInput.value.trim();
        if (!taskId || !commentText) return;
        const task = findTaskById(taskId);
        task.comments.push({ author: currentUser.name, text: commentText, date: 'ahora mismo' });
        renderComments(task.comments);
        commentInput.value = '';
    });

    // --- RENDER FUNCTIONS ---
    function initializeKanban() {
        document.querySelectorAll('.kanban-column .space-y-4').forEach(col => col.innerHTML = '');
        const clientTasks = tasksData[currentClientEmail] || [];
        clientTasks.forEach(task => { document.querySelector(`[data-column-id="${task.columnId}"] .space-y-4`).insertAdjacentHTML('beforeend', createTaskCardHTML(task)); });
        renderHistory();
        lucide.createIcons();
    }
    function renderHistory() {
        historyList.innerHTML = '';
        const clientHistory = historyData[currentClientEmail] || [];
        if (clientHistory.length === 0) { historyList.innerHTML = `<p class="text-center text-[var(--brand-text-secondary)]">Aún no hay tareas archivadas.</p>`; return; }
        clientHistory.forEach(task => { 
            const totalImpact = (task.impactHours || 0) * (task.usersAffected || 1);
            historyList.innerHTML += `<div class="text-sm p-2 bg-gray-800/50 rounded-md flex justify-between items-center"><span>${task.title}</span><span class="font-bold text-[var(--brand-turquoise)]">${totalImpact}h</span></div>`; });
    }
    function createTaskCardHTML(task) {
        const isVisualizador = currentUser.role === 'Visualizador';
        const noDragClass = isVisualizador ? 'no-drag' : '';
        const priorityClasses = { high: 'bg-red-900/50 text-red-300', medium: 'bg-yellow-800/50 text-yellow-300', low: 'bg-sky-900/50 text-sky-300' };
        const recurrenceColor = task.type === 'recurring' ? 'text-[var(--brand-turquoise)]' : 'text-gray-500';
        const totalImpact = (task.impactHours || 0) * (task.usersAffected || 1);

        return `<div onclick="openTaskDetails('${task.id}')" class="k-card bg-[var(--brand-card-bg)] p-4 rounded-lg border border-[var(--brand-border)] ${noDragClass}" draggable="${!isVisualizador}" ondragstart="drag(event)" id="${task.id}">
            <div class="flex justify-between items-start gap-2">
                <p class="font-semibold text-white text-sm">${task.title}</p>
                <span class="text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ${priorityClasses[task.priority]}">${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
            </div>
            <p class="text-sm text-[var(--brand-text-secondary)] mt-2 font-light line-clamp-2">${task.description || ''}</p>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-[var(--brand-border)]">
                <div class="flex items-center gap-3">
                        <span class="text-xs text-[var(--brand-text-secondary)] flex items-center gap-1"><i data-lucide="users" class="w-3 h-3"></i> ${task.usersAffected || 1}</span>
                        <span class="text-xs text-[var(--brand-text-secondary)] flex items-center gap-1"><i data-lucide="message-square" class="w-3 h-3"></i> ${task.comments.length}</span>
                </div>
                <div class="flex items-center gap-3">
                    <span title="Tipo de Impacto" class="${recurrenceColor}"><i data-lucide="repeat" class="w-4 h-4"></i></span>
                    <div class="text-xs font-semibold flex items-center gap-1 text-[var(--brand-turquoise)]" title="Impacto Total: ${task.impactHours}h x ${task.usersAffected} usuarios">
                        <i data-lucide="zap" class="w-3 h-3"></i><span>${totalImpact}h</span>
                    </div>
                </div>
            </div>
        </div>`;
    }
    
    // --- DASHBOARD & HOURS LOGIC ---
    function calculateCurrentMonthHours() {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        let total = 0;
        
        const recurringTasks = (historyData[currentClientEmail] || []).filter(t => t.type === 'recurring');
        total += recurringTasks.reduce((sum, task) => sum + ((task.impactHours || 0) * (task.usersAffected || 1)), 0);
        
        const doneThisMonth = (tasksData[currentClientEmail] || []).filter(t => t.columnId === 'done');
        total += doneThisMonth.reduce((sum, task) => sum + ((task.impactHours || 0) * (task.usersAffected || 1)), 0);

        if (!monthlyHoursSaved[currentClientEmail]) monthlyHoursSaved[currentClientEmail] = {};
        monthlyHoursSaved[currentClientEmail][currentMonthKey] = total;
        totalHoursSavedEl.textContent = `${total}h`;
    }
    function initializeHoursChart() {
        const clientData = monthlyHoursSaved[currentClientEmail] || {};
        const labels = Object.keys(clientData).sort();
        const data = labels.map(label => clientData[label]);
        const hoursCtx = document.getElementById('hoursChart').getContext('2d');
        if (window.hoursChart instanceof Chart) window.hoursChart.destroy();
        window.hoursChart = new Chart(hoursCtx, { type: 'bar', data: { labels, datasets: [{ label: 'Horas Ahorradas', data, backgroundColor: 'rgba(0, 246, 255, 0.5)', borderColor: 'var(--brand-turquoise)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } } });
    }
    
    // --- AI AGENT ---
    function initializeChat() { 
        chatMessages.innerHTML = '';
        chatHistory = [];
        appendChatMessage("Hola, soy Groddy. Describe una idea de mejora y te ayudaré a convertirla en una solución concreta.", 'ai');
    }

    function appendChatMessage(content, sender, isHTML = false, taskProposal = null) {
        if (sender === 'user') {
            chatHistory.push({ role: "user", parts: [{ text: content }] });
        } else if (!isHTML) {
                chatHistory.push({ role: "model", parts: [{ text: content }] });
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-3 ${sender === 'user' ? 'justify-end' : ''}`;
        
        const avatar = sender === 'ai' 
            ? `<div class="w-8 h-8 flex-shrink-0 mt-1 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold border-2 border-[var(--brand-turquoise)]">G</div>`
            : `<div class="w-8 h-8 flex-shrink-0 mt-1 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">${currentUser.avatar}</div>`;

        const messageContentDiv = document.createElement('div');
        messageContentDiv.className = `max-w-xs md:max-w-md p-3 rounded-lg ${sender === 'user' ? 'bg-sky-800' : 'bg-gray-700'}`;
        
        if (isHTML) { messageContentDiv.innerHTML = content; } else { messageContentDiv.textContent = content; }

        if (sender === 'user') {
            messageDiv.appendChild(messageContentDiv);
            messageDiv.innerHTML += avatar;
        } else {
            messageDiv.innerHTML = avatar;
            messageDiv.appendChild(messageContentDiv);
        }
        
        chatMessages.appendChild(messageDiv);
        
        if (taskProposal) {
            const buttonContainer = document.createElement('div');
            buttonContainer.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start ml-11'} -mt-2 mb-4`;
            const addButton = document.createElement('button');
            addButton.className = 'px-3 py-1 text-xs rounded-md bg-sky-800 hover:bg-sky-700 text-sky-300 font-semibold flex items-center gap-1 transition-colors';
            addButton.innerHTML = `<i data-lucide="plus-circle" class="w-3 h-3"></i>Añadir a Kanban`;
            
            addButton.onclick = (event) => {
                const button = event.currentTarget;
                createTask({ ...taskProposal, columnId: 'todo' });
                initializeKanban();
                
                button.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i>Añadido`;
                button.disabled = true;
                button.classList.remove('hover:bg-sky-700');
                button.classList.add('cursor-default', 'bg-green-800', 'text-green-300');
                lucide.createIcons();
            };

            buttonContainer.appendChild(addButton);
            chatMessages.appendChild(buttonContainer);
            lucide.createIcons();
        }

        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    aiForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userInput = aiInput.value.trim();
        if (!userInput) return;

        appendChatMessage(userInput, 'user');
aiInput.value = '';
        appendChatMessage('<div class="gemini-thinking"><div class="shimmer w-24 h-4 rounded-md"></div></div>', 'ai', true);

        const geminiResponse = await callGeminiAPI(chatHistory);
        
        chatMessages.removeChild(chatMessages.lastChild); 

        const jsonMatch = geminiResponse.match(/```json\n([\s\S]*?)\n```/);
        const conversationalPart = geminiResponse.split('```json')[0].trim();

        if (conversationalPart) {
                appendChatMessage(conversationalPart, 'ai');
        }
        
        if (jsonMatch && jsonMatch[1]) {
            try {
                const parsedJson = JSON.parse(jsonMatch[1]);
                const taskProposalData = {
                    title: parsedJson.title,
                    description: parsedJson.description,
                    impactHours: parsedJson.impactHours,
                    usersAffected: parsedJson.usersAffected,
                    priority: parsedJson.priority,
                    type: parsedJson.isRecurring ? 'recurring' : 'once'
                };
                
                const buttonMessageDiv = document.createElement('div');
                const buttonContainer = document.createElement('div');
                buttonContainer.className = `flex justify-start ml-11 -mt-2 mb-4`;
                const addButton = document.createElement('button');
                addButton.className = 'px-3 py-1 text-xs rounded-md bg-sky-800 hover:bg-sky-700 text-sky-300 font-semibold flex items-center gap-1 transition-colors';
                addButton.innerHTML = `<i data-lucide="plus-circle" class="w-3 h-3"></i>Añadir a Kanban`;
                
                addButton.onclick = (event) => {
                    const button = event.currentTarget;
                    createTask({ ...taskProposalData, columnId: 'todo' });
                    initializeKanban();
                    calculateCurrentMonthHours();
                    initializeHoursChart();
                    
                    button.innerHTML = `<i data-lucide="check-circle" class="w-3 h-3"></i>Añadido`;
                    button.disabled = true;
                    button.classList.remove('hover:bg-sky-700');
                    button.classList.add('cursor-default', 'bg-green-800', 'text-green-300');
                    lucide.createIcons();
                };

                buttonContainer.appendChild(addButton);
                buttonMessageDiv.appendChild(buttonContainer);
                chatMessages.appendChild(buttonMessageDiv);
                lucide.createIcons();
                chatMessages.scrollTop = chatMessages.scrollHeight;

            } catch (e) {
                console.error("JSON parsing error:", e, jsonMatch[1]);
                if(!conversationalPart) {
                    appendChatMessage("Tuve problemas para estructurar mi idea. ¿Podrías reformular tu solicitud?", 'ai');
                }
            }
        }
    });

    // --- USER INFO / ADMIN PANEL ---
    function renderUserInfo() {
            userInfoModule.innerHTML = '';
            if (currentUser.role === 'Admin') {
            userInfoModule.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h3 class="text-xl font-semibold text-white">Gestión de Usuarios</h3>
                    <p class="text-[var(--brand-text-secondary)]">Selecciona un cliente para ver su Kanban y métricas.</p>
                </div>
                    <div class="flex items-center gap-4">
                    <select id="client-selector" class="bg-gray-800 border border-[var(--brand-border)] rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-[var(--brand-turquoise)] transition text-sm"></select>
                    <button onclick="openUserModal()" class="bg-[var(--brand-turquoise)] text-black font-semibold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>Crear Usuario
                    </button>
                </div>
            </div>
            <div class="bg-[var(--brand-card-bg)] border border-[var(--brand-border)] rounded-lg overflow-hidden">
                <table class="w-full text-sm text-left">
                    <thead class="bg-gray-800 text-[var(--brand-text-secondary)] uppercase"><tr><th scope="col" class="px-6 py-3">Usuario</th><th scope="col" class="px-6 py-3">Empresa</th><th scope="col" class="px-6 py-3">Rol</th><th scope="col" class="px-6 py-3"></th></tr></thead>
                    <tbody id="user-table-body"></tbody>
                </table>
            </div>`;
            
            populateClientSelector();
            document.getElementById('client-selector').addEventListener('change', handleClientChange);

            const userTableBody = document.getElementById('user-table-body');
            userTableBody.innerHTML = '';
            sampleUsers.forEach(user => {
                const row = document.createElement('tr');
                row.className = 'border-b border-[var(--brand-border)]';
                row.innerHTML = `<td class="px-6 py-4 font-medium flex items-center gap-3"><div class="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center font-bold text-sm">${user.avatar}</div><div><p class="text-white">${user.name || '<i>Sin nombre</i>'}</p><p class="text-xs text-[var(--brand-text-secondary)]">${user.email}</p></div></td><td class="px-6 py-4 text-[var(--brand-text-secondary)]">${user.company || 'N/A'}</td><td class="px-6 py-4 text-[var(--brand-text-secondary)]">${user.role}</td><td class="px-6 py-4 text-right"><button onclick="openUserModal('${user.email}')" class="text-[var(--brand-text-secondary)] hover:text-white"><i data-lucide="edit"></i></button></td>`;
                userTableBody.appendChild(row);
            });
            
            lucide.createIcons();
            } else {
                userInfoModule.innerHTML = `<div class="max-w-xl mx-auto bg-[var(--brand-card-bg)] p-8 rounded-lg border border-[var(--brand-border)]"><div class="flex flex-col items-center"><div id="profile-avatar-display" class="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center font-bold text-4xl text-white ring-4 ring-[var(--brand-turquoise)] mb-4">${currentUser.avatar}</div></div><div class="space-y-4 mt-6"><div><label class="block text-sm font-medium text-[var(--brand-text-secondary)] mb-1">Nombre Completo</label><p class="profile-input w-full rounded-lg py-2 px-3">${currentUser.name}</p></div><div><label class="block text-sm font-medium text-[var(--brand-text-secondary)] mb-1">Correo Electrónico</label><p class="profile-input w-full rounded-lg py-2 px-3">${currentUser.email}</p></div><div><label class="block text-sm font-medium text-[var(--brand-text-secondary)] mb-1">Empresa</label><p class="profile-input w-full rounded-lg py-2 px-3">${currentUser.company || ''}</p></div><div><label class="block text-sm font-medium text-[var(--brand-text-secondary)] mb-1">Cargo</label><p class="profile-input w-full rounded-lg py-2 px-3">${currentUser.title || ''}</p></div></div></div>`;
            }
    }
    
    // --- FINAL SETUP ---
    initializeDB();
});