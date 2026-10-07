

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the system
    initAttendanceSystem();
    
    // Event listeners
    setupEventListeners();
    
    // Load initial data
    loadAttendanceData();
});

function initAttendanceSystem() {
    console.log('Attendance Report System initialized');
    
    // Set current date in date inputs
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
    
    // Highlight current page in sidebar
    highlightCurrentPage();
}

function setupEventListeners() {
    // Apply button
    const applyBtn = document.querySelector('.btn-apply');
    if (applyBtn) {
        applyBtn.addEventListener('click', function() {
            const fromDate = document.querySelector('.date-range input:first-child').value;
            const toDate = document.querySelector('.date-range input:last-child').value;
            applyDateFilter(fromDate, toDate);
        });
    }
    
    // Export buttons
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', function() {
            const format = this.textContent.includes('Excel') ? 'excel' : 'pdf';
            exportReport(format);
        });
    });
    
    // Print button
    const printBtn = document.querySelector('.btn-print');
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    // Logout button
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', confirmLogout);
    }
    
    // Submenu toggle
    const submenuHeaders = document.querySelectorAll('.submenu-header');
    submenuHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const submenu = this.nextElementSibling;
            const icon = this.querySelector('.fa-chevron-down');
            
            if (submenu.style.display === 'block') {
                submenu.style.display = 'none';
                icon.style.transform = 'rotate(0deg)';
            } else {
                submenu.style.display = 'block';
                icon.style.transform = 'rotate(180deg)';
            }
        });
    });
    
    // Menu item clicks
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
            }
            
            // Remove active class from all menu items
            document.querySelectorAll('.menu-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
        });
    });
}

function highlightCurrentPage() {
    const currentPath = window.location.hash || '#attendance-report';
    const menuItem = document.querySelector(`.menu-item[href="${currentPath}"]`);
    
    if (menuItem) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        menuItem.classList.add('active');
        
        // Open parent submenu if needed
        const submenu = menuItem.closest('.submenu');
        if (submenu) {
            submenu.style.display = 'block';
            const header = submenu.previousElementSibling;
            const icon = header.querySelector('.fa-chevron-down');
            if (icon) {
                icon.style.transform = 'rotate(180deg)';
            }
        }
    }
}

function applyDateFilter(fromDate, toDate) {
    if (!fromDate || !toDate) {
        showNotification('Please select both dates', 'error');
        return;
    }
    
    if (new Date(fromDate) > new Date(toDate)) {
        showNotification('End date must be after start date', 'error');
        return;
    }
    
    // Show loading
    showLoading(true);
    
    // Simulate API call
    setTimeout(() => {
        // Update report title
        const fromFormatted = formatDate(fromDate);
        const toFormatted = formatDate(toDate);
        
        document.querySelector('.report-subtitle p:first-child').innerHTML = 
            `<strong>Detailed Attendance Report of ${fromFormatted} to ${toFormatted}</strong>`;
        
        document.querySelector('.report-subtitle .secondary').textContent = 
            `Second Employee by Marvario | ${fromFormatted} - ${toFormatted}`;
        
        // Update footer with generation time
        const now = new Date();
        const timestamp = now.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.querySelector('.attendance-footer p').textContent = 
            `© ${now.getFullYear()} NEIPS Admin Portal | Attendance Report System | Generated on ${timestamp}`;
        
        // Reload attendance data
        loadAttendanceData(fromDate, toDate);
        
        showLoading(false);
        showNotification('Date filter applied successfully', 'success');
    }, 1000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function loadAttendanceData(fromDate = null, toDate = null) {
    // Show loading state
    const tableBody = document.querySelector('.attendance-table tbody');
    if (!tableBody) return;
    
    // Simulate loading data
    // In a real application, this would be an API call
    
    // Update summary stats
    updateSummaryStats();
}

function updateSummaryStats() {
    // Calculate stats from table data
    const rows = document.querySelectorAll('.attendance-table tbody tr');
    
    let totalEmployees = rows.length;
    let presentCount = 0;
    let absentCount = 0;
    let totalHours = 0;
    
    rows.forEach(row => {
        const presentCell = row.cells[8]; // Present column
        const absentCell = row.cells[9];  // Absent column
        const actualHoursCell = row.cells[13]; // Actual hours column
        
        if (presentCell && parseInt(presentCell.textContent) > 0) {
            presentCount++;
        }
        
        if (absentCell && parseInt(absentCell.textContent) > 0) {
            absentCount++;
        }
        
        if (actualHoursCell) {
            const hours = parseFloat(actualHoursCell.textContent) || 0;
            totalHours += hours;
        }
    });
    
    const averageHours = totalEmployees > 0 ? (totalHours / totalEmployees).toFixed(1) + 'h' : '0h';
    
    // Update summary cards
    document.querySelectorAll('.summary-card')[0].querySelector('.summary-value').textContent = totalEmployees;
    document.querySelectorAll('.summary-card')[1].querySelector('.summary-value').textContent = presentCount;
    document.querySelectorAll('.summary-card')[2].querySelector('.summary-value').textContent = absentCount;
    document.querySelectorAll('.summary-card')[3].querySelector('.summary-value').textContent = averageHours;
}

function exportReport(format) {
    showLoading(true);
    
    // Simulate export process
    setTimeout(() => {
        const fromDate = document.querySelector('.date-range input:first-child').value;
        const toDate = document.querySelector('.date-range input:last-child').value;
        const filename = `Attendance_Report_${fromDate}_to_${toDate}.${format}`;
        
        if (format === 'excel') {
            // In real implementation, generate Excel file
            console.log(`Exporting to Excel: ${filename}`);
            showNotification('Excel file generated successfully', 'success');
        } else {
            // In real implementation, generate PDF file
            console.log(`Exporting to PDF: ${filename}`);
            showNotification('PDF file generated successfully', 'success');
        }
        
        showLoading(false);
    }, 1500);
}

function printReport() {
    window.print();
}

function confirmLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // In real implementation, call logout API
        console.log('Logging out...');
        window.location.href = '/login.html';
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        max-width: 400px;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border-left: 4px solid ${type === 'success' ? '#28a745' : '#dc3545'};
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function showLoading(show) {
    if (show) {
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;
        
        overlay.innerHTML = `
            <div style="background: white; padding: 2rem; border-radius: 8px; text-align: center;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: #1e3c72; margin-bottom: 1rem;"></i>
                <p>Loading...</p>
            </div>
        `;
        
        document.body.appendChild(overlay);
    } else {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .fa-spin {
        animation: fa-spin 1s linear infinite;
    }
    
    @keyframes fa-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Make functions available globally
window.applyDateFilter = applyDateFilter;
window.exportReport = exportReport;
window.printReport = printReport;
window.showNotification = showNotification;