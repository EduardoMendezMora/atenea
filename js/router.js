// Simple client-side router
class Router {
    constructor() {
        this.routes = {};
        this.currentPage = null;
        this.init();
    }

    init() {
        // Define all routes
        this.routes = {
            '/': 'Dashboard',
            '/Dashboard': 'Dashboard',
            '/Clientes': 'Clientes',
            '/Contratos': 'Contratos',
            '/Facturacion': 'Facturacion',
            '/Pagos': 'Pagos',
            '/NotasCredito': 'NotasCredito',
            '/Vehiculos': 'Vehiculos',
            '/Tareas': 'Tareas',
            '/ClienteDetalle': 'ClienteDetalle',
            '/Inbox': 'Inbox',
            '/Chat': 'Chat',
            '/Usuarios': 'Usuarios',
            '/ConfiguracionVehiculos': 'ConfiguracionVehiculos',
            '/Repuestos': 'Repuestos',
            '/VehiculoDetalle': 'VehiculoDetalle',
            '/Automatizacion': 'Automatizacion',
            '/Bancos': 'Bancos',
            '/RepuestosArchivados': 'RepuestosArchivados',
            '/SolicitudRepuestoDetalle': 'SolicitudRepuestoDetalle',
            '/CatalogoPublico': 'CatalogoPublico',
            '/InspeccionesConfiguracion': 'InspeccionesConfiguracion',
            '/RegistroPublico': 'RegistroPublico',
            '/SeguimientoTramite': 'SeguimientoTramite',
            '/Tramites': 'Tramites',
            '/seguimiento-tramite': 'seguimiento-tramite',
            '/ConfiguracionTramites': 'ConfiguracionTramites',
            '/PortalCliente': 'PortalCliente',
            '/MisContratos': 'MisContratos',
            '/MisFacturas': 'MisFacturas'
        };

        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        
        // Handle initial route
        this.handleRoute();
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/';
        const pageName = this.routes[hash] || 'Dashboard';
        
        if (this.currentPage !== pageName) {
            this.currentPage = pageName;
            this.loadPage(pageName);
            this.updateNavigation(hash);
        }
    }

    loadPage(pageName) {
        const pageContent = document.getElementById('page-content');
        const pageTitle = document.getElementById('page-title');
        const pageDescription = document.getElementById('page-description');

        // Update page title and description
        const pageInfo = this.getPageInfo(pageName);
        pageTitle.textContent = pageInfo.title;
        pageDescription.textContent = pageInfo.description;

        // Load page content
        pageContent.innerHTML = this.getPageContent(pageName);
        
        // Initialize page-specific functionality
        this.initializePage(pageName);
    }

    getPageInfo(pageName) {
        const pageInfo = {
            'Dashboard': {
                title: 'Dashboard',
                description: 'Resumen general del sistema'
            },
            'Clientes': {
                title: 'Clientes',
                description: 'Gestión de clientes y contactos'
            },
            'Contratos': {
                title: 'Contratos',
                description: 'Gestión de contratos y acuerdos'
            },
            'Facturacion': {
                title: 'Facturación',
                description: 'Gestión de facturas y documentos'
            },
            'Pagos': {
                title: 'Pagos',
                description: 'Gestión de pagos y cobros'
            },
            'NotasCredito': {
                title: 'Notas de Crédito',
                description: 'Gestión de notas de crédito'
            },
            'Vehiculos': {
                title: 'Vehículos',
                description: 'Gestión de vehículos y flota'
            },
            'Tareas': {
                title: 'Tareas',
                description: 'Gestión de tareas y actividades'
            },
            'Inbox': {
                title: 'Inbox',
                description: 'Mensajes y comunicaciones'
            },
            'Chat': {
                title: 'Chat',
                description: 'Sistema de chat en tiempo real'
            },
            'Usuarios': {
                title: 'Usuarios',
                description: 'Gestión de usuarios y permisos'
            },
            'Repuestos': {
                title: 'Repuestos',
                description: 'Gestión de repuestos e inventario'
            },
            'Tramites': {
                title: 'Trámites',
                description: 'Gestión de trámites y procesos'
            }
        };

        return pageInfo[pageName] || {
            title: pageName,
            description: 'Página del sistema'
        };
    }

    getPageContent(pageName) {
        // This will be replaced with actual page content
        switch (pageName) {
            case 'Dashboard':
                return this.getDashboardContent();
            case 'Clientes':
                return this.getClientesContent();
            case 'Vehiculos':
                return this.getVehiculosContent();
            case 'Tareas':
                return this.getTareasContent();
            case 'Facturacion':
                return this.getFacturacionContent();
            case 'Pagos':
                return this.getPagosContent();
            default:
                return this.getDefaultContent(pageName);
        }
    }

    getDashboardContent() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-2 bg-blue-100 rounded-lg">
                            <i data-lucide="users" class="w-6 h-6 text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Clientes</p>
                            <p class="text-2xl font-bold text-gray-900" id="total-clients">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-2 bg-green-100 rounded-lg">
                            <i data-lucide="truck" class="w-6 h-6 text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Total Vehículos</p>
                            <p class="text-2xl font-bold text-gray-900" id="total-vehicles">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-2 bg-yellow-100 rounded-lg">
                            <i data-lucide="wrench" class="w-6 h-6 text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Tareas Pendientes</p>
                            <p class="text-2xl font-bold text-gray-900" id="pending-tasks">0</p>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="flex items-center">
                        <div class="p-2 bg-purple-100 rounded-lg">
                            <i data-lucide="receipt" class="w-6 h-6 text-purple-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-600">Facturas del Mes</p>
                            <p class="text-2xl font-bold text-gray-900" id="monthly-invoices">0</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Actividad Reciente</h3>
                    </div>
                    <div id="recent-activity">
                        <p class="text-gray-500 text-center py-4">Cargando actividad reciente...</p>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Tareas Urgentes</h3>
                    </div>
                    <div id="urgent-tasks">
                        <p class="text-gray-500 text-center py-4">Cargando tareas urgentes...</p>
                    </div>
                </div>
            </div>
        `;
    }

    getClientesContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">Lista de Clientes</h3>
                        <button class="btn btn-primary" onclick="openClientModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Nuevo Cliente
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Teléfono</th>
                                <th>Empresa</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="clients-table-body">
                            <tr>
                                <td colspan="5" class="text-center py-4 text-gray-500">
                                    Cargando clientes...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getVehiculosContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">Lista de Vehículos</h3>
                        <button class="btn btn-primary" onclick="openVehicleModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Nuevo Vehículo
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Marca</th>
                                <th>Modelo</th>
                                <th>Año</th>
                                <th>Placa</th>
                                <th>Cliente</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="vehicles-table-body">
                            <tr>
                                <td colspan="6" class="text-center py-4 text-gray-500">
                                    Cargando vehículos...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getTareasContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">Lista de Tareas</h3>
                        <button class="btn btn-primary" onclick="openTaskModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Nueva Tarea
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Descripción</th>
                                <th>Estado</th>
                                <th>Prioridad</th>
                                <th>Fecha</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tasks-table-body">
                            <tr>
                                <td colspan="6" class="text-center py-4 text-gray-500">
                                    Cargando tareas...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getFacturacionContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">Facturación</h3>
                        <button class="btn btn-primary" onclick="openInvoiceModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Nueva Factura
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Fecha</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="invoices-table-body">
                            <tr>
                                <td colspan="6" class="text-center py-4 text-gray-500">
                                    Cargando facturas...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getPagosContent() {
        return `
            <div class="card">
                <div class="card-header">
                    <div class="flex justify-between items-center">
                        <h3 class="card-title">Pagos</h3>
                        <button class="btn btn-primary" onclick="openPaymentModal()">
                            <i data-lucide="plus" class="w-4 h-4 mr-2"></i>
                            Nuevo Pago
                        </button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Referencia</th>
                                <th>Cliente</th>
                                <th>Monto</th>
                                <th>Fecha</th>
                                <th>Método</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="payments-table-body">
                            <tr>
                                <td colspan="7" class="text-center py-4 text-gray-500">
                                    Cargando pagos...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    getDefaultContent(pageName) {
        return `
            <div class="card">
                <div class="text-center py-12">
                    <i data-lucide="construction" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">Página en Construcción</h3>
                    <p class="text-gray-500">La página "${pageName}" está siendo desarrollada.</p>
                </div>
            </div>
        `;
    }

    updateNavigation(currentHash) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current nav item
        const currentNavItem = document.querySelector(`[href="#${currentHash}"]`);
        if (currentNavItem) {
            currentNavItem.classList.add('active');
        }
    }

    initializePage(pageName) {
        // Initialize page-specific functionality
        switch (pageName) {
            case 'Dashboard':
                this.initializeDashboard();
                break;
            case 'Clientes':
                this.initializeClientes();
                break;
            case 'Vehiculos':
                this.initializeVehiculos();
                break;
            case 'Tareas':
                this.initializeTareas();
                break;
            case 'Facturacion':
                this.initializeFacturacion();
                break;
            case 'Pagos':
                this.initializePagos();
                break;
        }
    }

    async initializeDashboard() {
        try {
            // Load dashboard data
            const [clientsResult, vehiclesResult, tasksResult, invoicesResult] = await Promise.all([
                SupabaseAPI.getClients(),
                SupabaseAPI.getVehicles(),
                SupabaseAPI.getTasks(),
                SupabaseAPI.getInvoices()
            ]);

            // Update counters
            document.getElementById('total-clients').textContent = clientsResult.success ? clientsResult.data.length : 0;
            document.getElementById('total-vehicles').textContent = vehiclesResult.success ? vehiclesResult.data.length : 0;
            document.getElementById('pending-tasks').textContent = tasksResult.success ? 
                tasksResult.data.filter(task => task.status === 'pending').length : 0;
            document.getElementById('monthly-invoices').textContent = invoicesResult.success ? 
                invoicesResult.data.filter(invoice => {
                    const invoiceDate = new Date(invoice.created_at);
                    const currentDate = new Date();
                    return invoiceDate.getMonth() === currentDate.getMonth() && 
                           invoiceDate.getFullYear() === currentDate.getFullYear();
                }).length : 0;

            // Load recent activity
            this.loadRecentActivity();
            this.loadUrgentTasks();

        } catch (error) {
            console.error('Error initializing dashboard:', error);
        }
    }

    async initializeClientes() {
        try {
            const result = await SupabaseAPI.getClients();
            if (result.success) {
                this.renderClientsTable(result.data);
            } else {
                this.showError('Error al cargar clientes: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
            this.showError('Error al cargar clientes');
        }
    }

    async initializeVehiculos() {
        try {
            const result = await SupabaseAPI.getVehicles();
            if (result.success) {
                this.renderVehiclesTable(result.data);
            } else {
                this.showError('Error al cargar vehículos: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading vehicles:', error);
            this.showError('Error al cargar vehículos');
        }
    }

    async initializeTareas() {
        try {
            const result = await SupabaseAPI.getTasks();
            if (result.success) {
                this.renderTasksTable(result.data);
            } else {
                this.showError('Error al cargar tareas: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.showError('Error al cargar tareas');
        }
    }

    async initializeFacturacion() {
        try {
            const result = await SupabaseAPI.getInvoices();
            if (result.success) {
                this.renderInvoicesTable(result.data);
            } else {
                this.showError('Error al cargar facturas: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading invoices:', error);
            this.showError('Error al cargar facturas');
        }
    }

    async initializePagos() {
        try {
            const result = await SupabaseAPI.getPayments();
            if (result.success) {
                this.renderPaymentsTable(result.data);
            } else {
                this.showError('Error al cargar pagos: ' + result.error);
            }
        } catch (error) {
            console.error('Error loading payments:', error);
            this.showError('Error al cargar pagos');
        }
    }

    renderClientsTable(clients) {
        const tbody = document.getElementById('clients-table-body');
        if (!tbody) return;

        if (clients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-gray-500">
                        No hay clientes registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = clients.map(client => `
            <tr>
                <td class="font-medium">${client.name || 'N/A'}</td>
                <td>${client.email || 'N/A'}</td>
                <td>${client.phone || 'N/A'}</td>
                <td>${client.company || 'N/A'}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-2" onclick="editClient(${client.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteClient(${client.id})">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderVehiclesTable(vehicles) {
        const tbody = document.getElementById('vehicles-table-body');
        if (!tbody) return;

        if (vehicles.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No hay vehículos registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = vehicles.map(vehicle => `
            <tr>
                <td class="font-medium">${vehicle.brand || 'N/A'}</td>
                <td>${vehicle.model || 'N/A'}</td>
                <td>${vehicle.year || 'N/A'}</td>
                <td>${vehicle.plate || 'N/A'}</td>
                <td>${vehicle.client_name || 'N/A'}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-2" onclick="editVehicle(${vehicle.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteVehicle(${vehicle.id})">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderTasksTable(tasks) {
        const tbody = document.getElementById('tasks-table-body');
        if (!tbody) return;

        if (tasks.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No hay tareas registradas
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = tasks.map(task => `
            <tr>
                <td class="font-medium">${task.title || 'N/A'}</td>
                <td>${task.description ? task.description.substring(0, 50) + '...' : 'N/A'}</td>
                <td><span class="badge badge-${this.getStatusBadgeClass(task.status)}">${task.status || 'N/A'}</span></td>
                <td><span class="badge badge-${this.getPriorityBadgeClass(task.priority)}">${task.priority || 'N/A'}</span></td>
                <td>${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}</td>
                <td>
                    <button class="btn btn-outline btn-sm mr-2" onclick="editTask(${task.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteTask(${task.id})">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderInvoicesTable(invoices) {
        const tbody = document.getElementById('invoices-table-body');
        if (!tbody) return;

        if (invoices.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4 text-gray-500">
                        No hay facturas registradas
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = invoices.map(invoice => `
            <tr>
                <td class="font-medium">${invoice.number || 'N/A'}</td>
                <td>${invoice.client_name || 'N/A'}</td>
                <td>${invoice.date ? new Date(invoice.date).toLocaleDateString() : 'N/A'}</td>
                <td>$${invoice.total || '0.00'}</td>
                <td><span class="badge badge-${this.getStatusBadgeClass(invoice.status)}">${invoice.status || 'N/A'}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm mr-2" onclick="editInvoice(${invoice.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deleteInvoice(${invoice.id})">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderPaymentsTable(payments) {
        const tbody = document.getElementById('payments-table-body');
        if (!tbody) return;

        if (payments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-4 text-gray-500">
                        No hay pagos registrados
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = payments.map(payment => `
            <tr>
                <td class="font-medium">${payment.reference || 'N/A'}</td>
                <td>${payment.client_name || 'N/A'}</td>
                <td>$${payment.amount || '0.00'}</td>
                <td>${payment.date ? new Date(payment.date).toLocaleDateString() : 'N/A'}</td>
                <td>${payment.method || 'N/A'}</td>
                <td><span class="badge badge-${this.getStatusBadgeClass(payment.status)}">${payment.status || 'N/A'}</span></td>
                <td>
                    <button class="btn btn-outline btn-sm mr-2" onclick="editPayment(${payment.id})">
                        <i data-lucide="edit" class="w-4 h-4"></i>
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="deletePayment(${payment.id})">
                        <i data-lucide="trash" class="w-4 h-4"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getStatusBadgeClass(status) {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'paid':
            case 'active':
                return 'success';
            case 'pending':
            case 'processing':
                return 'warning';
            case 'cancelled':
            case 'failed':
            case 'inactive':
                return 'error';
            default:
                return 'info';
        }
    }

    getPriorityBadgeClass(priority) {
        switch (priority?.toLowerCase()) {
            case 'high':
            case 'urgent':
                return 'error';
            case 'medium':
                return 'warning';
            case 'low':
                return 'success';
            default:
                return 'info';
        }
    }

    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center text-sm">
                    <div class="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span class="text-gray-600">Nuevo cliente registrado</span>
                    <span class="ml-auto text-gray-400">Hace 2 horas</span>
                </div>
                <div class="flex items-center text-sm">
                    <div class="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span class="text-gray-600">Tarea completada</span>
                    <span class="ml-auto text-gray-400">Hace 4 horas</span>
                </div>
                <div class="flex items-center text-sm">
                    <div class="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                    <span class="text-gray-600">Pago procesado</span>
                    <span class="ml-auto text-gray-400">Hace 6 horas</span>
                </div>
            </div>
        `;
    }

    loadUrgentTasks() {
        const container = document.getElementById('urgent-tasks');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                        <p class="font-medium text-red-900">Revisión de vehículo</p>
                        <p class="text-sm text-red-600">Vencimiento: Hoy</p>
                    </div>
                    <span class="badge badge-error">Urgente</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                        <p class="font-medium text-yellow-900">Actualizar datos</p>
                        <p class="text-sm text-yellow-600">Vencimiento: Mañana</p>
                    </div>
                    <span class="badge badge-warning">Alta</span>
                </div>
            </div>
        `;
    }

    showError(message) {
        // This will be implemented in the components.js file
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            console.error(message);
        }
    }
}

// Initialize router when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.router = new Router();
});
