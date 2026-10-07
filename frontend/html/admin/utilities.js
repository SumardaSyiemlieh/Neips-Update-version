// Utility functions
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A' || dateString === 'undefined') return 'N/A';

    try {
        // Handle different date formats
        let date;

        if (typeof dateString === 'string') {
            if (dateString.includes('/')) {
                // Handle DD/MM/YYYY format
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
            } else if (dateString.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateString);
            } else if (dateString.includes('T')) {
                // Handle ISO format
                date = new Date(dateString);
            } else {
                // Try direct parsing
                date = new Date(dateString);
            }
        } else {
            // If it's already a date object or timestamp
            date = new Date(dateString);
        }

        if (isNaN(date.getTime())) {
            console.log('Invalid date:', dateString);
            return 'N/A';
        }

        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        console.log('Date formatting error:', e, 'for date:', dateString);
        return 'N/A';
    }
}

function formatRole(role) {
    const roleMap = {
        'manager': 'Center Manager',
        'trainer': 'Trainer',
        'accountant': 'Accountant',
        'support': 'Support Staff',
        'admin': 'Admin'
    };

    return roleMap[role] || role;
}

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.querySelector('p').textContent = message;
        overlay.style.display = 'flex';
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function showSuccess(message) {
    const notification = document.getElementById('successNotification');
    const messageEl = document.getElementById('successMessage');
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.style.display = 'flex';
        setTimeout(() => {
            hideNotification('success');
        }, 5000);
    }
}

function showError(message) {
    const notification = document.getElementById('errorNotification');
    const messageEl = document.getElementById('errorMessage');
    if (notification && messageEl) {
        messageEl.textContent = message;
        notification.style.display = 'flex';
        setTimeout(() => {
            hideNotification('error');
        }, 5000);
    }
}
function hideNotification(type) {
    const notification = document.getElementById(`${type}Notification`);
    if (notification) {
        notification.style.display = 'none';
    }
}

// Generate PDF from HTML content
// Generate PDF - WORKING VERSION
function generatePDF(htmlContent, filename) {
    // Remove any existing modal first
    const existingModal = document.getElementById('pdfModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create new modal
    const modal = document.createElement('div');
    modal.id = 'pdfModal';
    modal.innerHTML = `
                    <div style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:10000;">
                        <div style="background:white; width:90%; height:90%; margin:2% auto; overflow:auto; border-radius:10px; position:relative;">
                            <div style="position:sticky; top:0; background:#f8f9fa; padding:15px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
                                <h3 style="margin:0;">${filename}</h3>
                                <div>
                                    <button onclick="window.print()" style="background:#28a745; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer; margin-right:10px;">
                                        🖨️ Print
                                    </button>
                                    <button onclick="document.getElementById('pdfModal').remove()" style="background:#dc3545; color:white; border:none; padding:8px 15px; border-radius:5px; cursor:pointer;">
                                        ❌ Close
                                    </button>
                                </div>
                            </div>
                            <div style="padding:20px;">
                                ${htmlContent}
                            </div>
                        </div>
                    </div>
                `;

    document.body.appendChild(modal);


    // Add print function to global scope
    window.printOfferLetter = function () {
        const printContent = document.getElementById('offerLetterContent').innerHTML;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>${filename}</title>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                            </style>
                        </head>
                        <body>${printContent}</body>
                        </html>
                    `);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 500);
    };

    showSuccess('Offer letter opened! Click "Print to PDF" to save.');
}
function initializeRealTimeNotifications() {
    console.log('🚀 Initializing real-time task notifications (DOTS ONLY)...');

    // Wait a bit to ensure everything is loaded
    setTimeout(() => {
        try {
            window.realTimeNotifications = new RealTimeTaskNotification();
            console.log('✅ Real-time notifications initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize real-time notifications:', error);
        }
    }, 2000);
}
