// Main application initialization
class AteneaApp {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.init();
    }

    async init() {
        try {
            // Show loading
            this.showLoading();

            // Initialize Supabase
            await this.initializeSupabase();

            // Check authentication
            await this.checkAuthentication();

            // Initialize UI components
            this.initializeUI();

            // Hide loading and show app
            this.hideLoading();

            this.isInitialized = true;
            console.log('Atenea App initialized successfully');

        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Error al inicializar la aplicación');
        }
    }

    showLoading() {
        const loading = document.getElementById('loading');
        const app = document.getElementById('app');
        
        if (loading) loading.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        const app = document.getElementById('app');
        
        if (loading) loading.classList.add('hidden');
        if (app) app.classList.remove('hidden');
    }

    async initializeSupabase() {
        // Wait for Supabase to be available
        let attempts = 0;
        const maxAttempts = 10;
        
        while (typeof window.supabase === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabase library not loaded');
        }

        // Initialize Supabase client
        if (window.SupabaseAPI) {
            window.SupabaseAPI.getClient();
        }
    }

    async checkAuthentication() {
        try {
            const result = await SupabaseAPI.getCurrentUser();
            if (result.success && result.user) {
                this.currentUser = result.user;
                this.updateUserInfo(result.user);
            } else {
                // No user logged in, show login form or redirect
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
            this.showLoginForm();
        }
    }

    updateUserInfo(user) {
        const userNameElement = document.getElementById('user-name');
        const userInitialsElement = document.getElementById('user-initials');
        const userRoleElement = document.getElementById('user-role');

        if (userNameElement) {
            userNameElement.textContent = user.user_metadata?.full_name || user.email || 'Usuario';
        }

        if (userInitialsElement) {
            const name = user.user_metadata?.full_name || user.email || 'U';
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            userInitialsElement.textContent = initials;
        }

        if (userRoleElement) {
            userRoleElement.textContent = user.user_metadata?.role || 'Usuario';
        }
    }

    showLoginForm() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-8">
                    <div>
                        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                            Iniciar Sesión
                        </h2>
                        <p class="mt-2 text-center text-sm text-gray-600">
                            Sistema de Gestión Atenea
                        </p>
                    </div>
                    <form class="mt-8 space-y-6" id="login-form">
                        <div class="rounded-md shadow-sm -space-y-px">
                            <div>
                                <label for="email" class="sr-only">Email</label>
                                <input id="email" name="email" type="email" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                       placeholder="Email">
                            </div>
                            <div>
                                <label for="password" class="sr-only">Contraseña</label>
                                <input id="password" name="password" type="password" required 
                                       class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm" 
                                       placeholder="Contraseña">
                            </div>
                        </div>

                        <div>
                            <button type="submit" 
                                    class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                Iniciar Sesión
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Add login form event listener
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const result = await SupabaseAPI.signIn(email, password);
            if (result.success) {
                this.currentUser = result.data.user;
                this.updateUserInfo(result.data.user);
                
                // Reload the current page to show the app
                window.location.reload();
            } else {
                this.showError('Error de autenticación: ' + result.error);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Error al iniciar sesión');
        }
    }

    initializeUI() {
        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Set up responsive behavior
        this.setupResponsiveBehavior();

        // Initialize search functionality
        this.initializeSearch();

        // Set up keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupResponsiveBehavior() {
        // Handle window resize
        window.addEventListener('resize', () => {
            const sidebar = document.getElementById('sidebar');
            if (window.innerWidth >= 1024) {
                sidebar.classList.remove('open');
            }
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth < 1024) {
                const sidebar = document.getElementById('sidebar');
                const sidebarToggle = document.getElementById('sidebar-toggle');
                
                if (sidebar && sidebarToggle && 
                    !sidebar.contains(e.target) && 
                    !sidebarToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    initializeSearch() {
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                this.performSearch(query);
            });
        }
    }

    performSearch(query) {
        if (!query.trim()) return;

        // Simple search implementation
        // This could be enhanced to search across different entities
        console.log('Searching for:', query);
        
        // For now, just show a toast
        if (window.showToast) {
            window.showToast(`Buscando: ${query}`, 'info');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[type="search"]');
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to close modals
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal-overlay');
                if (modal) {
                    modal.remove();
                }
            }
        });
    }

    showError(message) {
        console.error(message);
        if (window.showToast) {
            window.showToast(message, 'error');
        } else {
            alert(message);
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatDateTime(date) {
        return new Date(date).toLocaleString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Export data methods
    exportToCSV(data, filename) {
        if (!data || data.length === 0) {
            this.showError('No hay datos para exportar');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Print functionality
    printPage() {
        window.print();
    }

    // Theme toggle (for future dark mode support)
    toggleTheme() {
        const body = document.body;
        const isDark = body.classList.contains('dark');
        
        if (isDark) {
            body.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        }
    }

    // Load saved theme
    loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    }
}

// Global app instance
let app;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    app = new AteneaApp();
    
    // Make app available globally
    window.app = app;
    
    // Load saved theme
    app.loadTheme();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden
        console.log('Page hidden');
    } else {
        // Page is visible
        console.log('Page visible');
        
        // Refresh data if needed
        if (app && app.isInitialized && window.router) {
            // Refresh current page data
            const currentPage = window.router.currentPage;
            if (currentPage && window.router[`initialize${currentPage}`]) {
                window.router[`initialize${currentPage}`]();
            }
        }
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    if (window.showToast) {
        window.showToast('Conexión restaurada', 'success');
    }
});

window.addEventListener('offline', function() {
    if (window.showToast) {
        window.showToast('Sin conexión a internet', 'warning');
    }
});

// Service Worker registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
