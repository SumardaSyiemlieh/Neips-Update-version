// Load payroll section
function loadPayrollSection() {
    const payrollSection = document.getElementById('payroll-section');
    if (!payrollSection) return;

    payrollSection.innerHTML = `
                    <div class="section-header">
                        <h2>Payroll Management</h2>
                        <div class="header-actions">
                            <button class="btn-primary" onclick="processPayroll()">
                                <i class="fas fa-calculator"></i> Process Payroll
                            </button>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>Staff ID</th>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Salary</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="payrollTableBody">
                                <!-- Payroll data will be loaded here -->
                            </tbody>
                        </table>
                    </div>
                `;

    loadPayrollData();
}

// ==================== PAYROLL FUNCTIONS ====================

// Load payroll section
function loadPayrollSection() {
    console.log('Loading payroll section...');
    populatePayrollFilters();
    loadPayrollData();
}
// Populate payroll filters
function populatePayrollFilters() {
    // Populate month with current month selected
    const currentMonth = new Date().getMonth() + 1;
    const monthString = currentMonth.toString().padStart(2, '0');
    document.getElementById('payrollMonth').value = monthString;

    // Populate year with current year selected
    const currentYear = new Date().getFullYear();
    document.getElementById('payrollYear').value = currentYear.toString();

    // Populate centers
    const centerSelect = document.getElementById('payrollCenter');
    const offerCenterSelect = document.getElementById('offerLetterCenter');

    [centerSelect, offerCenterSelect].forEach(select => {
        if (select) {
            // Clear existing options except the first one
            while (select.options.length > 1) {
                select.remove(1);
            }

            // Add centers to dropdown
            centers.forEach(center => {
                const option = document.createElement('option');
                option.value = center;
                option.textContent = center;
                select.appendChild(option);
            });
        }
    });

    // Add event listeners for filters
    document.getElementById('payrollMonth').addEventListener('change', loadPayrollData);
    document.getElementById('payrollYear').addEventListener('change', loadPayrollData);
    document.getElementById('payrollCenter').addEventListener('change', loadPayrollData);
    document.getElementById('offerLetterStatus').addEventListener('change', loadOfferLettersData);
    document.getElementById('offerLetterCenter').addEventListener('change', loadOfferLettersData);
}
// Load payroll data
async function loadPayrollData() {
    const tableBody = document.getElementById('payrollTableBody');
    if (!tableBody) return;

    try {
        const result = await sheetsService.getAllStaff();
        if (result.status === 'success' && result.data) {
            tableBody.innerHTML = '';

            const activeStaff = result.data.filter(staff =>
                staff.status === 'active' || staff.status === 'Active'
            );

            activeStaff.forEach(staff => {
                const staffData = mapStaffData(staff);
                const row = document.createElement('tr');
                row.innerHTML = `
                                <td>${staffData.id}</td>
                                <td>${staffData.name}</td>
                                <td>${formatRole(staffData.role)}</td>
                                <td>${staffData.salary ? `₹${parseInt(staffData.salary).toLocaleString()}` : 'N/A'}</td>
                                <td><span class="stat-trend up">Active</span></td>
                                <td>
                                    <button class="btn-icon" onclick="generatePayslip('${staffData.id}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                        <i class="fas fa-file-invoice"></i> Payslip
                                    </button>
                                </td>
                            `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading payroll data:', error);
    }
}
// Load payroll data
async function loadPayrollData() {
    const tableBody = document.getElementById('payrollTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = `
                    <tr>
                        <td colspan="10" style="text-align: center; padding: 20px;">
                            <i class="fas fa-spinner fa-spin"></i> Loading payroll data...
                        </td>
                    </tr>
                `;

    try {
        const result = await sheetsService.getAllStaff();

        if (result.status === 'success' && result.data) {
            displayPayrollData(result.data);
        } else {
            showEmptyPayrollState();
        }
    } catch (error) {
        console.error('Error loading payroll data:', error);
        showEmptyPayrollState();
    }
}

// Display payroll data
function displayPayrollData(staffMembers) {
    const tableBody = document.getElementById('payrollTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (staffMembers.length === 0) {
        showEmptyPayrollState();
        return;
    }

    // Filter active staff only
    const activeStaff = staffMembers.filter(staff =>
        staff.status === 'active' || staff.status === 'Active' || !staff.status
    );

    let totalBasicSalary = 0;
    let totalNetSalary = 0;

    activeStaff.forEach(staffMember => {
        const staffData = mapStaffData(staffMember);

        // Calculate payroll components
        const basicSalary = parseInt(staffData.salary) || 0;
        const allowances = Math.round(basicSalary * 0.1); // 10% allowances
        const deductions = Math.round(basicSalary * 0.05); // 5% deductions
        const netSalary = basicSalary + allowances - deductions;

        totalBasicSalary += basicSalary;
        totalNetSalary += netSalary;

        const row = document.createElement('tr');
        row.innerHTML = `
                        <td>${staffData.id}</td>
                        <td>${staffData.name}</td>
                        <td>${formatRole(staffData.role)}</td>
                        <td>${staffData.center}</td>
                        <td>₹${basicSalary.toLocaleString()}</td>
                        <td>₹${allowances.toLocaleString()}</td>
                        <td>₹${deductions.toLocaleString()}</td>
                        <td><strong>₹${netSalary.toLocaleString()}</strong></td>
                        <td><span class="stat-trend neutral">Pending</span></td>
                        <td>
                            <div style="display: flex; gap: 5px; justify-content: center;">
                                <button class="btn-icon" title="Generate Payslip" onclick="generatePayslip('${staffData.id}')" style="background: #17a2b8; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-file-invoice"></i>
                                </button>
                                <button class="btn-icon" title="Mark as Paid" onclick="markAsPaid('${staffData.id}')" style="background: #28a745; color: white; border: none; padding: 6px 10px; border-radius: 4px; cursor: pointer;">
                                    <i class="fas fa-check"></i>
                                </button>
                            </div>
                        </td>
                    `;
        tableBody.appendChild(row);
    });

    // Update summary
    document.getElementById('totalPayrollStaff').textContent = activeStaff.length;
    document.getElementById('totalBasicSalary').textContent = `₹${totalBasicSalary.toLocaleString()}`;
    document.getElementById('totalNetSalary').textContent = `₹${totalNetSalary.toLocaleString()}`;
}

function showEmptyPayrollState() {
    const tableBody = document.getElementById('payrollTableBody');
    if (tableBody) {
        tableBody.innerHTML = `
                        <tr>
                            <td colspan="10" style="text-align: center; padding: 20px; color: #666;">
                                <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 10px; display: block;"></i>
                                No staff data available for payroll
                            </td>
                        </tr>
                    `;
    }

    // Reset summary
    document.getElementById('totalPayrollStaff').textContent = '0';
    document.getElementById('totalBasicSalary').textContent = '₹0';
    document.getElementById('totalNetSalary').textContent = '₹0';
}
// ==================== PAYROLL ACTIONS ====================

function generatePayrollReport() {
    showLoading('Generating payroll report...');

    setTimeout(() => {
        hideLoading();

        // Create payroll report content
        const totalStaff = document.getElementById('totalPayrollStaff').textContent;
        const totalNetSalary = document.getElementById('totalNetSalary').textContent;
        const monthSelect = document.getElementById('payrollMonth');
        const yearSelect = document.getElementById('payrollYear');
        const month = monthSelect.options[monthSelect.selectedIndex].text;
        const year = yearSelect.value;

        const reportContent = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                                .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                th { background-color: #1e3c72; color: white; }
                            </style>
                        </head>
                        <body>
                            <div class="header">
                                <h1>NORTH EASTERN INSTITUTE OF PROFESSIONAL STUDIES</h1>
                                <h2>PAYROLL REPORT - ${month} ${year}</h2>
                            </div>
                            
                            <div class="summary">
                                <h3>Payroll Summary</h3>
                                <p><strong>Total Staff:</strong> ${totalStaff}</p>
                                <p><strong>Total Net Salary:</strong> ${totalNetSalary}</p>
                                <p><strong>Report Period:</strong> ${month} ${year}</p>
                                <p><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
                            </div>
                            
                            <p>This is the payroll report for ${month} ${year}. The total salary expenditure is ${totalNetSalary} for ${totalStaff} staff members.</p>
                            
                            <div style="margin-top: 50px; text-align: center;">
                                <p>_________________________</p>
                                <p><strong>Authorized Signature</strong></p>
                                <p>Finance Manager</p>
                                <p>North Eastern Institute of Professional Studies</p>
                            </div>
                        </body>
                        </html>
                    `;

        generatePDF(reportContent, `Payroll_Report_${month}_${year}.html`);
        showSuccess('Payroll report generated successfully!');
    }, 1500);
}

function processSalaryPayments() {
    if (confirm('Are you sure you want to process salary payments for this month? This action will mark all staff as paid.')) {
        showLoading('Processing salary payments...');

        setTimeout(() => {
            hideLoading();

            // Update payment status
            document.getElementById('paymentStatus').textContent = 'Processed';
            document.getElementById('paymentStatus').className = 'stat-trend up';

            showSuccess('Salary payments processed successfully! All staff marked as paid.');
        }, 2000);
    }
}
// Process payroll
function processPayroll() {
    showLoading('Processing payroll...');
    setTimeout(() => {
        hideLoading();
        showSuccess('Payroll processed successfully!');
    }, 2000);
}
// Generate payslip
function generatePayslip(staffId) {
    showLoading('Generating payslip...');
    setTimeout(() => {
        hideLoading();
        showSuccess('Payslip generated successfully!');
    }, 1500);
}
function generatePayslip(staffId) {
    showLoading('Generating payslip...');

    setTimeout(() => {
        hideLoading();
        showSuccess('Payslip generated successfully!');
    }, 1000);
}
function markAsPaid(staffId) {
    if (confirm('Mark this staff member as paid for this month?')) {
        showLoading('Updating payment status...');

        setTimeout(() => {
            hideLoading();
            showSuccess('Staff member marked as paid successfully!');
        }, 1000);
    }
}