class GoogleSheetsService {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzM6o9zAF7DYnaTHQBNPgBabByNu0j4E7cC8Xf02Kwx0TYFbwTBiR5VgI8Byu9M1zYl/exec';
    }

    // ==================== STUDENT MANAGEMENT ====================

    async getAllStudents() {
        try {
            console.log('📊 Fetching students from Google Sheets...');
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getStudents`);
            const result = await response.json();
            console.log('📊 Students API Response:', result);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch all error:', error);
            throw new Error('Failed to fetch students: ' + error.message);
        }
    }

    async getStudentByEmail(email) {
        try {
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getStudentByEmail&email=${encodeURIComponent(email)}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch error:', error);
            throw new Error('Failed to fetch student data: ' + error.message);
        }
    }

    async submitForm(formData) {
        try {
            console.log('📨 Sending student registration to Google Apps Script:', formData);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'student_registration',
                    ...formData
                })
            });

            const result = await response.json();
            console.log('✅ Apps Script response:', result);
            return result;

        } catch (error) {
            console.error('❌ Google Apps Script submission error:', error);
            throw new Error('Failed to save registration: ' + error.message);
        }
    }

    async updateStudentStatus(studentId, updates) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateStatus',
                    studentId: studentId,
                    ...updates
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script update error:', error);
            throw new Error('Failed to update student: ' + error.message);
        }
    }

    async approveStudent(studentId, project) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'approveStudent',
                    studentId: studentId,
                    project: project
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script approve error:', error);
            throw new Error('Failed to approve student: ' + error.message);
        }
    }

    async rejectStudent(studentId, rejectionReason) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'rejectStudent',
                    studentId: studentId,
                    rejectionReason: rejectionReason
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script reject error:', error);
            throw new Error('Failed to reject student: ' + error.message);
        }
    }

    async updateProject(studentId, project) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateProject',
                    studentId: studentId,
                    project: project
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script project update error:', error);
            throw new Error('Failed to update project: ' + error.message);
        }
    }

    // ==================== STAFF MANAGEMENT ====================

    async getAllStaff() {
        try {
            console.log('👥 Fetching staff from Google Sheets...');
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getStaff`);
            const result = await response.json();
            console.log('👥 Staff API Response:', result);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch staff error:', error);
            throw new Error('Failed to fetch staff: ' + error.message);
        }
    }

    async addStaffMember(staffData) {
        try {
            console.log('➕ Adding staff member:', staffData.name);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'addStaff',
                    ...staffData
                })
            });

            const result = await response.json();
            console.log('✅ Staff addition response:', result);
            return result;

        } catch (error) {
            console.error('❌ Google Apps Script add staff error:', error);
            throw new Error('Failed to add staff: ' + error.message);
        }
    }

    async updateStaffMember(staffId, updates) {
        try {
            console.log('✏️ Updating staff member:', staffId);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'updateStaff',
                    staffId: staffId,
                    ...updates
                })
            });

            const result = await response.json();
            console.log('✅ Staff update response:', result);
            return result;

        } catch (error) {
            console.error('❌ Google Apps Script update staff error:', error);
            throw new Error('Failed to update staff: ' + error.message);
        }
    }
    async deleteStaffMember(staffId) {
        try {
            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'deleteStaff',
                    staffId: staffId
                })
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script delete staff error:', error);
            throw new Error('Failed to delete staff: ' + error.message);
        }
    }

    // ==================== USER AUTHENTICATION ====================

    async registerUser(userData) {
        try {
            console.log('📨 Registering user via Apps Script:', userData.email);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'registerUser',
                    ...userData
                })
            });

            const result = await response.json();
            console.log('✅ User registration response:', result);
            return result;

        } catch (error) {
            console.error('❌ User registration error:', error);
            throw new Error('Failed to register user: ' + error.message);
        }
    }

    async verifyUser(credentials) {
        try {
            console.log('🔐 Verifying user:', credentials.email);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'loginUser',
                    ...credentials
                })
            });

            const result = await response.json();
            console.log('✅ User verification response:', result);
            return result;

        } catch (error) {
            console.error('❌ User verification error:', error);
            throw new Error('Failed to verify user: ' + error.message);
        }
    }

    // ==================== CENTER MANAGEMENT ====================

    async getAllCenters() {
        try {
            console.log('🏢 Fetching all centers...');

            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getCenters`);
            const result = await response.json();

            console.log('✅ Centers fetched:', result.centers?.length || 0);
            return result;

        } catch (error) {
            console.error('❌ Error getting centers:', error);
            throw new Error('Failed to get centers: ' + error.message);
        }
    }

    async getUsersByCenter(center) {
        try {
            console.log('👥 Fetching users for center:', center);

            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getUsersByCenter&center=${encodeURIComponent(center)}`);
            const result = await response.json();

            console.log('✅ Users fetched for center:', result.users?.length || 0);
            return result;

        } catch (error) {
            console.error('❌ Error getting users:', error);
            throw new Error('Failed to get users: ' + error.message);
        }
    }

    // ==================== REPORTS & EXPORTS ====================

    async generateReport(reportType, filters = {}) {
        try {
            console.log('📊 Generating report:', reportType);

            const params = new URLSearchParams({
                action: 'generateReport',
                reportType: reportType,
                ...filters
            });

            const response = await fetch(`${this.APPS_SCRIPT_URL}?${params}`);
            const result = await response.json();

            console.log('✅ Report generated:', result);
            return result;

        } catch (error) {
            console.error('❌ Report generation error:', error);
            throw new Error('Failed to generate report: ' + error.message);
        }
    }

    async exportData(exportType, filters = {}) {
        try {
            console.log('📤 Exporting data:', exportType);

            const params = new URLSearchParams({
                action: 'exportData',
                exportType: exportType,
                ...filters
            });

            const response = await fetch(`${this.APPS_SCRIPT_URL}?${params}`);
            const result = await response.json();

            console.log('✅ Data exported:', result);
            return result;

        } catch (error) {
            console.error('❌ Data export error:', error);
            throw new Error('Failed to export data: ' + error.message);
        }
    }

    // ==================== PAYROLL MANAGEMENT ====================

    async getPayrollData(month, year) {
        try {
            console.log('💰 Fetching payroll data for:', month, year);

            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getPayroll&month=${month}&year=${year}`);
            const result = await response.json();

            console.log('✅ Payroll data fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Payroll data fetch error:', error);
            throw new Error('Failed to fetch payroll data: ' + error.message);
        }
    }

    async processPayroll(payrollData) {
        try {
            console.log('🔄 Processing payroll...');

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'processPayroll',
                    ...payrollData
                })
            });

            const result = await response.json();
            console.log('✅ Payroll processed:', result);
            return result;

        } catch (error) {
            console.error('❌ Payroll processing error:', error);
            throw new Error('Failed to process payroll: ' + error.message);
        }
    }

    // ==================== ID CARD GENERATION ====================

    async generateIDCard(studentId) {
        try {
            console.log('🪪 Generating ID card for student:', studentId);

            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=generateIDCard&studentId=${studentId}`);
            const result = await response.json();

            console.log('✅ ID Card generated:', result);
            return result;

        } catch (error) {
            console.error('❌ ID Card generation error:', error);
            throw new Error('Failed to generate ID card: ' + error.message);
        }
    }

    async sendIDCardEmail(studentId, email) {
        try {
            console.log('📧 Sending ID card to:', email);

            const response = await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'sendIDCardEmail',
                    studentId: studentId,
                    email: email
                })
            });

            const result = await response.json();
            console.log('✅ ID Card email sent:', result);
            return result;

        } catch (error) {
            console.error('❌ ID Card email error:', error);
            throw new Error('Failed to send ID card email: ' + error.message);
        }
    }

    // ==================== UTILITY METHODS ====================

    async getDashboardStats() {
        try {
            console.log('📈 Fetching dashboard statistics...');

            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getDashboardStats`);
            const result = await response.json();

            console.log('✅ Dashboard stats fetched:', result);
            return result;

        } catch (error) {
            console.error('❌ Dashboard stats error:', error);
            throw new Error('Failed to fetch dashboard statistics: ' + error.message);
        }
    }

    async searchData(searchType, query, filters = {}) {
        try {
            console.log('🔍 Searching:', searchType, query);

            const params = new URLSearchParams({
                action: 'searchData',
                searchType: searchType,
                query: query,
                ...filters
            });

            const response = await fetch(`${this.APPS_SCRIPT_URL}?${params}`);
            const result = await response.json();

            console.log('✅ Search results:', result);
            return result;

        } catch (error) {
            console.error('❌ Search error:', error);
            throw new Error('Failed to search data: ' + error.message);
        }
    }
}

// For Node.js environment (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GoogleSheetsService;
}

// For browser environment
if (typeof window !== 'undefined') {
    window.GoogleSheetsService = GoogleSheetsService;
}