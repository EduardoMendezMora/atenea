// Supabase configuration and client setup
const SUPABASE_CONFIG = {
    url: 'https://sovraqexnkjggbklmbrp.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdnJhcWV4bmtqZ2dia2xtYnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODkzNTQsImV4cCI6MjA3MjE2NTM1NH0.dwGBbr5HFgtyQS2Jsvsihp06AjIFGILUIPM8fdX5oXM',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvdnJhcWV4bmtqZ2dia2xtYnJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjU4OTM1NCwiZXhwIjoyMDcyMTY1MzU0fQ.OS6A06i4usR4esV38BoLagT_27FI6RHodWpONITHDq8'
};

// Initialize Supabase client
let supabase;

// Initialize Supabase when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('Supabase client initialized');
    } else {
        console.error('Supabase library not loaded');
    }
});

// Supabase API functions
const SupabaseAPI = {
    // Get Supabase client
    getClient() {
        if (!supabase) {
            supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        }
        return supabase;
    },

    // Authentication functions
    async signIn(email, password) {
        try {
            const { data, error } = await this.getClient().auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    },

    async signOut() {
        try {
            const { error } = await this.getClient().auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    },

    async getCurrentUser() {
        try {
            const { data: { user }, error } = await this.getClient().auth.getUser();
            if (error) throw error;
            return { success: true, user };
        } catch (error) {
            console.error('Get user error:', error);
            return { success: false, error: error.message };
        }
    },

    // Generic CRUD operations
    async select(table, options = {}) {
        try {
            let query = this.getClient().from(table).select(options.select || '*');
            
            if (options.filter) {
                query = query.eq(options.filter.column, options.filter.value);
            }
            
            if (options.orderBy) {
                query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false });
            }
            
            if (options.limit) {
                query = query.limit(options.limit);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            return { success: true, data };
        } catch (error) {
            console.error(`Select error for table ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    async insert(table, data) {
        try {
            const { data: result, error } = await this.getClient()
                .from(table)
                .insert(data)
                .select();
            
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`Insert error for table ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    async update(table, id, data) {
        try {
            const { data: result, error } = await this.getClient()
                .from(table)
                .update(data)
                .eq('id', id)
                .select();
            
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`Update error for table ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    async delete(table, id) {
        try {
            const { error } = await this.getClient()
                .from(table)
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error(`Delete error for table ${table}:`, error);
            return { success: false, error: error.message };
        }
    },

    // Specific entity functions (based on the original entities.js)
    async getClients() {
        return await this.select('clients', {
            orderBy: { column: 'created_at', ascending: false }
        });
    },

    async getClient(id) {
        return await this.select('clients', {
            filter: { column: 'id', value: id }
        });
    },

    async createClient(clientData) {
        return await this.insert('clients', clientData);
    },

    async updateClient(id, clientData) {
        return await this.update('clients', id, clientData);
    },

    async deleteClient(id) {
        return await this.delete('clients', id);
    },

    async getVehicles() {
        return await this.select('vehicles', {
            orderBy: { column: 'created_at', ascending: false }
        });
    },

    async getVehicle(id) {
        return await this.select('vehicles', {
            filter: { column: 'id', value: id }
        });
    },

    async createVehicle(vehicleData) {
        return await this.insert('vehicles', vehicleData);
    },

    async updateVehicle(id, vehicleData) {
        return await this.update('vehicles', id, vehicleData);
    },

    async deleteVehicle(id) {
        return await this.delete('vehicles', id);
    },

    async getTasks() {
        return await this.select('tasks', {
            orderBy: { column: 'created_at', ascending: false }
        });
    },

    async getTask(id) {
        return await this.select('tasks', {
            filter: { column: 'id', value: id }
        });
    },

    async createTask(taskData) {
        return await this.insert('tasks', taskData);
    },

    async updateTask(id, taskData) {
        return await this.update('tasks', id, taskData);
    },

    async deleteTask(id) {
        return await this.delete('tasks', id);
    },

    async getInvoices() {
        return await this.select('invoices', {
            orderBy: { column: 'created_at', ascending: false }
        });
    },

    async getInvoice(id) {
        return await this.select('invoices', {
            filter: { column: 'id', value: id }
        });
    },

    async createInvoice(invoiceData) {
        return await this.insert('invoices', invoiceData);
    },

    async updateInvoice(id, invoiceData) {
        return await this.update('invoices', id, invoiceData);
    },

    async deleteInvoice(id) {
        return await this.delete('invoices', id);
    },

    async getPayments() {
        return await this.select('payments', {
            orderBy: { column: 'created_at', ascending: false }
        });
    },

    async getPayment(id) {
        return await this.select('payments', {
            filter: { column: 'id', value: id }
        });
    },

    async createPayment(paymentData) {
        return await this.insert('payments', paymentData);
    },

    async updatePayment(id, paymentData) {
        return await this.update('payments', id, paymentData);
    },

    async deletePayment(id) {
        return await this.delete('payments', id);
    }
};

// Make SupabaseAPI available globally
window.SupabaseAPI = SupabaseAPI;
