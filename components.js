// UI Components and utilities
class UIComponents {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeLucideIcons();
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebar = document.getElementById('sidebar');

        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.add('open');
            });
        }

        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('open');
            });
        }

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    initializeLucideIcons() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    async handleLogout() {
        try {
            const result = await SupabaseAPI.signOut();
            if (result.success) {
                this.showToast('Sesión cerrada correctamente', 'success');
                // Redirect to login or reload page
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                this.showToast('Error al cerrar sesión: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Logout error:', error);
            this.showToast('Error al cerrar sesión', 'error');
        }
    }

    // Toast notification system
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = this.getToastIcon(type);
        toast.innerHTML = `
            <div class="flex items-center">
                <i data-lucide="${icon}" class="w-5 h-5 mr-3"></i>
                <span>${message}</span>
                <button class="ml-auto p-1 hover:bg-black hover:bg-opacity-10 rounded" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
        `;

        container.appendChild(toast);

        // Re-initialize icons for the new toast
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    }

    getToastIcon(type) {
        switch (type) {
            case 'success':
                return 'check-circle';
            case 'error':
                return 'x-circle';
            case 'warning':
                return 'alert-triangle';
            case 'info':
            default:
                return 'info';
        }
    }

    // Modal system
    showModal(title, content, actions = []) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal max-w-md w-full mx-4">
                <div class="modal-header">
                    <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    ${actions.map(action => `
                        <button class="btn ${action.class || 'btn-secondary'}" onclick="${action.onclick}">
                            ${action.text}
                        </button>
                    `).join('')}
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">
                        Cancelar
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        return modalOverlay;
    }

    // Form validation
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;
        const errors = [];

        inputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                errors.push(`${input.name || input.id} es requerido`);
                input.classList.add('border-red-500');
            } else {
                input.classList.remove('border-red-500');
            }
        });

        if (!isValid) {
            this.showToast('Por favor complete todos los campos requeridos', 'error');
        }

        return isValid;
    }

    // Loading state
    showLoading(element) {
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span class="ml-2 text-gray-600">Cargando...</span>
                </div>
            `;
        }
    }

    hideLoading(element, content) {
        if (element) {
            element.innerHTML = content || '';
        }
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Format datetime
    formatDateTime(date) {
        return new Date(date).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global functions for modals and actions
window.openClientModal = function(clientId = null) {
    const isEdit = clientId !== null;
    const title = isEdit ? 'Editar Cliente' : 'Nuevo Cliente';
    
    const content = `
        <form id="client-form" class="space-y-4">
            <div class="form-group">
                <label class="form-label" for="client-name">Nombre *</label>
                <input type="text" id="client-name" name="name" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="client-email">Email *</label>
                <input type="email" id="client-email" name="email" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="client-phone">Teléfono</label>
                <input type="tel" id="client-phone" name="phone" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label" for="client-company">Empresa</label>
                <input type="text" id="client-company" name="company" class="form-input">
            </div>
            <div class="form-group">
                <label class="form-label" for="client-address">Dirección</label>
                <textarea id="client-address" name="address" class="form-textarea" rows="3"></textarea>
            </div>
        </form>
    `;

    const actions = [
        {
            text: isEdit ? 'Actualizar' : 'Crear',
            class: 'btn-primary',
            onclick: `saveClient(${clientId || 'null'})`
        }
    ];

    uiComponents.showModal(title, content, actions);

    // Load client data if editing
    if (isEdit) {
        loadClientData(clientId);
    }
};

window.openVehicleModal = function(vehicleId = null) {
    const isEdit = vehicleId !== null;
    const title = isEdit ? 'Editar Vehículo' : 'Nuevo Vehículo';
    
    const content = `
        <form id="vehicle-form" class="space-y-4">
            <div class="form-group">
                <label class="form-label" for="vehicle-brand">Marca *</label>
                <input type="text" id="vehicle-brand" name="brand" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="vehicle-model">Modelo *</label>
                <input type="text" id="vehicle-model" name="model" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="vehicle-year">Año *</label>
                <input type="number" id="vehicle-year" name="year" class="form-input" min="1900" max="2030" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="vehicle-plate">Placa *</label>
                <input type="text" id="vehicle-plate" name="plate" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="vehicle-client">Cliente *</label>
                <select id="vehicle-client" name="client_id" class="form-select" required>
                    <option value="">Seleccionar cliente</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="vehicle-vin">VIN</label>
                <input type="text" id="vehicle-vin" name="vin" class="form-input">
            </div>
        </form>
    `;

    const actions = [
        {
            text: isEdit ? 'Actualizar' : 'Crear',
            class: 'btn-primary',
            onclick: `saveVehicle(${vehicleId || 'null'})`
        }
    ];

    uiComponents.showModal(title, content, actions);

    // Load clients for dropdown
    loadClientsForVehicle();
    
    // Load vehicle data if editing
    if (isEdit) {
        loadVehicleData(vehicleId);
    }
};

window.openTaskModal = function(taskId = null) {
    const isEdit = taskId !== null;
    const title = isEdit ? 'Editar Tarea' : 'Nueva Tarea';
    
    const content = `
        <form id="task-form" class="space-y-4">
            <div class="form-group">
                <label class="form-label" for="task-title">Título *</label>
                <input type="text" id="task-title" name="title" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="task-description">Descripción</label>
                <textarea id="task-description" name="description" class="form-textarea" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label class="form-label" for="task-priority">Prioridad *</label>
                <select id="task-priority" name="priority" class="form-select" required>
                    <option value="">Seleccionar prioridad</option>
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="task-status">Estado *</label>
                <select id="task-status" name="status" class="form-select" required>
                    <option value="">Seleccionar estado</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="task-due-date">Fecha de Vencimiento</label>
                <input type="date" id="task-due-date" name="due_date" class="form-input">
            </div>
        </form>
    `;

    const actions = [
        {
            text: isEdit ? 'Actualizar' : 'Crear',
            class: 'btn-primary',
            onclick: `saveTask(${taskId || 'null'})`
        }
    ];

    uiComponents.showModal(title, content, actions);

    // Load task data if editing
    if (isEdit) {
        loadTaskData(taskId);
    }
};

window.openInvoiceModal = function(invoiceId = null) {
    const isEdit = invoiceId !== null;
    const title = isEdit ? 'Editar Factura' : 'Nueva Factura';
    
    const content = `
        <form id="invoice-form" class="space-y-4">
            <div class="form-group">
                <label class="form-label" for="invoice-number">Número de Factura *</label>
                <input type="text" id="invoice-number" name="number" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="invoice-client">Cliente *</label>
                <select id="invoice-client" name="client_id" class="form-select" required>
                    <option value="">Seleccionar cliente</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="invoice-date">Fecha *</label>
                <input type="date" id="invoice-date" name="date" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="invoice-total">Total *</label>
                <input type="number" id="invoice-total" name="total" class="form-input" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="invoice-status">Estado *</label>
                <select id="invoice-status" name="status" class="form-select" required>
                    <option value="">Seleccionar estado</option>
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviada</option>
                    <option value="paid">Pagada</option>
                    <option value="overdue">Vencida</option>
                    <option value="cancelled">Cancelada</option>
                </select>
            </div>
        </form>
    `;

    const actions = [
        {
            text: isEdit ? 'Actualizar' : 'Crear',
            class: 'btn-primary',
            onclick: `saveInvoice(${invoiceId || 'null'})`
        }
    ];

    uiComponents.showModal(title, content, actions);

    // Load clients for dropdown
    loadClientsForInvoice();
    
    // Load invoice data if editing
    if (isEdit) {
        loadInvoiceData(invoiceId);
    }
};

window.openPaymentModal = function(paymentId = null) {
    const isEdit = paymentId !== null;
    const title = isEdit ? 'Editar Pago' : 'Nuevo Pago';
    
    const content = `
        <form id="payment-form" class="space-y-4">
            <div class="form-group">
                <label class="form-label" for="payment-reference">Referencia *</label>
                <input type="text" id="payment-reference" name="reference" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="payment-client">Cliente *</label>
                <select id="payment-client" name="client_id" class="form-select" required>
                    <option value="">Seleccionar cliente</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="payment-amount">Monto *</label>
                <input type="number" id="payment-amount" name="amount" class="form-input" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="payment-date">Fecha *</label>
                <input type="date" id="payment-date" name="date" class="form-input" required>
            </div>
            <div class="form-group">
                <label class="form-label" for="payment-method">Método de Pago *</label>
                <select id="payment-method" name="method" class="form-select" required>
                    <option value="">Seleccionar método</option>
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta</option>
                    <option value="transfer">Transferencia</option>
                    <option value="check">Cheque</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label" for="payment-status">Estado *</label>
                <select id="payment-status" name="status" class="form-select" required>
                    <option value="">Seleccionar estado</option>
                    <option value="pending">Pendiente</option>
                    <option value="processing">Procesando</option>
                    <option value="completed">Completado</option>
                    <option value="failed">Fallido</option>
                    <option value="cancelled">Cancelado</option>
                </select>
            </div>
        </form>
    `;

    const actions = [
        {
            text: isEdit ? 'Actualizar' : 'Crear',
            class: 'btn-primary',
            onclick: `savePayment(${paymentId || 'null'})`
        }
    ];

    uiComponents.showModal(title, content, actions);

    // Load clients for dropdown
    loadClientsForPayment();
    
    // Load payment data if editing
    if (isEdit) {
        loadPaymentData(paymentId);
    }
};

// Save functions
window.saveClient = async function(clientId) {
    const form = document.getElementById('client-form');
    if (!uiComponents.validateForm(form)) return;

    const formData = new FormData(form);
    const clientData = Object.fromEntries(formData.entries());

    try {
        let result;
        if (clientId) {
            result = await SupabaseAPI.updateClient(clientId, clientData);
        } else {
            result = await SupabaseAPI.createClient(clientData);
        }

        if (result.success) {
            uiComponents.showToast(clientId ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh the current page if it's the clients page
            if (window.router && window.router.currentPage === 'Clientes') {
                window.router.initializeClientes();
            }
        } else {
            uiComponents.showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving client:', error);
        uiComponents.showToast('Error al guardar cliente', 'error');
    }
};

window.saveVehicle = async function(vehicleId) {
    const form = document.getElementById('vehicle-form');
    if (!uiComponents.validateForm(form)) return;

    const formData = new FormData(form);
    const vehicleData = Object.fromEntries(formData.entries());

    try {
        let result;
        if (vehicleId) {
            result = await SupabaseAPI.updateVehicle(vehicleId, vehicleData);
        } else {
            result = await SupabaseAPI.createVehicle(vehicleData);
        }

        if (result.success) {
            uiComponents.showToast(vehicleId ? 'Vehículo actualizado correctamente' : 'Vehículo creado correctamente', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh the current page if it's the vehicles page
            if (window.router && window.router.currentPage === 'Vehiculos') {
                window.router.initializeVehiculos();
            }
        } else {
            uiComponents.showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving vehicle:', error);
        uiComponents.showToast('Error al guardar vehículo', 'error');
    }
};

window.saveTask = async function(taskId) {
    const form = document.getElementById('task-form');
    if (!uiComponents.validateForm(form)) return;

    const formData = new FormData(form);
    const taskData = Object.fromEntries(formData.entries());

    try {
        let result;
        if (taskId) {
            result = await SupabaseAPI.updateTask(taskId, taskData);
        } else {
            result = await SupabaseAPI.createTask(taskData);
        }

        if (result.success) {
            uiComponents.showToast(taskId ? 'Tarea actualizada correctamente' : 'Tarea creada correctamente', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh the current page if it's the tasks page
            if (window.router && window.router.currentPage === 'Tareas') {
                window.router.initializeTareas();
            }
        } else {
            uiComponents.showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving task:', error);
        uiComponents.showToast('Error al guardar tarea', 'error');
    }
};

window.saveInvoice = async function(invoiceId) {
    const form = document.getElementById('invoice-form');
    if (!uiComponents.validateForm(form)) return;

    const formData = new FormData(form);
    const invoiceData = Object.fromEntries(formData.entries());

    try {
        let result;
        if (invoiceId) {
            result = await SupabaseAPI.updateInvoice(invoiceId, invoiceData);
        } else {
            result = await SupabaseAPI.createInvoice(invoiceData);
        }

        if (result.success) {
            uiComponents.showToast(invoiceId ? 'Factura actualizada correctamente' : 'Factura creada correctamente', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh the current page if it's the invoices page
            if (window.router && window.router.currentPage === 'Facturacion') {
                window.router.initializeFacturacion();
            }
        } else {
            uiComponents.showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving invoice:', error);
        uiComponents.showToast('Error al guardar factura', 'error');
    }
};

window.savePayment = async function(paymentId) {
    const form = document.getElementById('payment-form');
    if (!uiComponents.validateForm(form)) return;

    const formData = new FormData(form);
    const paymentData = Object.fromEntries(formData.entries());

    try {
        let result;
        if (paymentId) {
            result = await SupabaseAPI.updatePayment(paymentId, paymentData);
        } else {
            result = await SupabaseAPI.createPayment(paymentData);
        }

        if (result.success) {
            uiComponents.showToast(paymentId ? 'Pago actualizado correctamente' : 'Pago creado correctamente', 'success');
            document.querySelector('.modal-overlay').remove();
            
            // Refresh the current page if it's the payments page
            if (window.router && window.router.currentPage === 'Pagos') {
                window.router.initializePagos();
            }
        } else {
            uiComponents.showToast('Error: ' + result.error, 'error');
        }
    } catch (error) {
        console.error('Error saving payment:', error);
        uiComponents.showToast('Error al guardar pago', 'error');
    }
};

// Edit and delete functions
window.editClient = function(clientId) {
    openClientModal(clientId);
};

window.deleteClient = async function(clientId) {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
        try {
            const result = await SupabaseAPI.deleteClient(clientId);
            if (result.success) {
                uiComponents.showToast('Cliente eliminado correctamente', 'success');
                if (window.router && window.router.currentPage === 'Clientes') {
                    window.router.initializeClientes();
                }
            } else {
                uiComponents.showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting client:', error);
            uiComponents.showToast('Error al eliminar cliente', 'error');
        }
    }
};

window.editVehicle = function(vehicleId) {
    openVehicleModal(vehicleId);
};

window.deleteVehicle = async function(vehicleId) {
    if (confirm('¿Está seguro de que desea eliminar este vehículo?')) {
        try {
            const result = await SupabaseAPI.deleteVehicle(vehicleId);
            if (result.success) {
                uiComponents.showToast('Vehículo eliminado correctamente', 'success');
                if (window.router && window.router.currentPage === 'Vehiculos') {
                    window.router.initializeVehiculos();
                }
            } else {
                uiComponents.showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            uiComponents.showToast('Error al eliminar vehículo', 'error');
        }
    }
};

window.editTask = function(taskId) {
    openTaskModal(taskId);
};

window.deleteTask = async function(taskId) {
    if (confirm('¿Está seguro de que desea eliminar esta tarea?')) {
        try {
            const result = await SupabaseAPI.deleteTask(taskId);
            if (result.success) {
                uiComponents.showToast('Tarea eliminada correctamente', 'success');
                if (window.router && window.router.currentPage === 'Tareas') {
                    window.router.initializeTareas();
                }
            } else {
                uiComponents.showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            uiComponents.showToast('Error al eliminar tarea', 'error');
        }
    }
};

window.editInvoice = function(invoiceId) {
    openInvoiceModal(invoiceId);
};

window.deleteInvoice = async function(invoiceId) {
    if (confirm('¿Está seguro de que desea eliminar esta factura?')) {
        try {
            const result = await SupabaseAPI.deleteInvoice(invoiceId);
            if (result.success) {
                uiComponents.showToast('Factura eliminada correctamente', 'success');
                if (window.router && window.router.currentPage === 'Facturacion') {
                    window.router.initializeFacturacion();
                }
            } else {
                uiComponents.showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting invoice:', error);
            uiComponents.showToast('Error al eliminar factura', 'error');
        }
    }
};

window.editPayment = function(paymentId) {
    openPaymentModal(paymentId);
};

window.deletePayment = async function(paymentId) {
    if (confirm('¿Está seguro de que desea eliminar este pago?')) {
        try {
            const result = await SupabaseAPI.deletePayment(paymentId);
            if (result.success) {
                uiComponents.showToast('Pago eliminado correctamente', 'success');
                if (window.router && window.router.currentPage === 'Pagos') {
                    window.router.initializePagos();
                }
            } else {
                uiComponents.showToast('Error: ' + result.error, 'error');
            }
        } catch (error) {
            console.error('Error deleting payment:', error);
            uiComponents.showToast('Error al eliminar pago', 'error');
        }
    }
};

// Helper functions for loading data
async function loadClientData(clientId) {
    try {
        const result = await SupabaseAPI.getClient(clientId);
        if (result.success && result.data.length > 0) {
            const client = result.data[0];
            document.getElementById('client-name').value = client.name || '';
            document.getElementById('client-email').value = client.email || '';
            document.getElementById('client-phone').value = client.phone || '';
            document.getElementById('client-company').value = client.company || '';
            document.getElementById('client-address').value = client.address || '';
        }
    } catch (error) {
        console.error('Error loading client data:', error);
    }
}

async function loadVehicleData(vehicleId) {
    try {
        const result = await SupabaseAPI.getVehicle(vehicleId);
        if (result.success && result.data.length > 0) {
            const vehicle = result.data[0];
            document.getElementById('vehicle-brand').value = vehicle.brand || '';
            document.getElementById('vehicle-model').value = vehicle.model || '';
            document.getElementById('vehicle-year').value = vehicle.year || '';
            document.getElementById('vehicle-plate').value = vehicle.plate || '';
            document.getElementById('vehicle-client').value = vehicle.client_id || '';
            document.getElementById('vehicle-vin').value = vehicle.vin || '';
        }
    } catch (error) {
        console.error('Error loading vehicle data:', error);
    }
}

async function loadTaskData(taskId) {
    try {
        const result = await SupabaseAPI.getTask(taskId);
        if (result.success && result.data.length > 0) {
            const task = result.data[0];
            document.getElementById('task-title').value = task.title || '';
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-priority').value = task.priority || '';
            document.getElementById('task-status').value = task.status || '';
            document.getElementById('task-due-date').value = task.due_date || '';
        }
    } catch (error) {
        console.error('Error loading task data:', error);
    }
}

async function loadInvoiceData(invoiceId) {
    try {
        const result = await SupabaseAPI.getInvoice(invoiceId);
        if (result.success && result.data.length > 0) {
            const invoice = result.data[0];
            document.getElementById('invoice-number').value = invoice.number || '';
            document.getElementById('invoice-client').value = invoice.client_id || '';
            document.getElementById('invoice-date').value = invoice.date || '';
            document.getElementById('invoice-total').value = invoice.total || '';
            document.getElementById('invoice-status').value = invoice.status || '';
        }
    } catch (error) {
        console.error('Error loading invoice data:', error);
    }
}

async function loadPaymentData(paymentId) {
    try {
        const result = await SupabaseAPI.getPayment(paymentId);
        if (result.success && result.data.length > 0) {
            const payment = result.data[0];
            document.getElementById('payment-reference').value = payment.reference || '';
            document.getElementById('payment-client').value = payment.client_id || '';
            document.getElementById('payment-amount').value = payment.amount || '';
            document.getElementById('payment-date').value = payment.date || '';
            document.getElementById('payment-method').value = payment.method || '';
            document.getElementById('payment-status').value = payment.status || '';
        }
    } catch (error) {
        console.error('Error loading payment data:', error);
    }
}

async function loadClientsForVehicle() {
    try {
        const result = await SupabaseAPI.getClients();
        const select = document.getElementById('vehicle-client');
        if (result.success && select) {
            select.innerHTML = '<option value="">Seleccionar cliente</option>' +
                result.data.map(client => 
                    `<option value="${client.id}">${client.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading clients for vehicle:', error);
    }
}

async function loadClientsForInvoice() {
    try {
        const result = await SupabaseAPI.getClients();
        const select = document.getElementById('invoice-client');
        if (result.success && select) {
            select.innerHTML = '<option value="">Seleccionar cliente</option>' +
                result.data.map(client => 
                    `<option value="${client.id}">${client.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading clients for invoice:', error);
    }
}

async function loadClientsForPayment() {
    try {
        const result = await SupabaseAPI.getClients();
        const select = document.getElementById('payment-client');
        if (result.success && select) {
            select.innerHTML = '<option value="">Seleccionar cliente</option>' +
                result.data.map(client => 
                    `<option value="${client.id}">${client.name}</option>`
                ).join('');
        }
    } catch (error) {
        console.error('Error loading clients for payment:', error);
    }
}

// Initialize UI components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.uiComponents = new UIComponents();
    window.showToast = (message, type) => window.uiComponents.showToast(message, type);
});
