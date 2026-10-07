// ===== INITIALIZE CHARTS =====
function initializeCharts() {
    // Check if charts already exist
    if (window.dashboardCharts) {
        return; // Charts already initialized
    }

    // Chart 1: Absentees last 7 days
    const ctx1 = document.getElementById('chart7days');
    if (ctx1) {
        const chart7days = new Chart(ctx1, {
            type: 'doughnut',
            data: {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                datasets: [{
                    label: 'Absentees',
                    data: [2, 3, 1, 4, 2, 1, 0],
                    backgroundColor: [
                        '#ff4757', '#ff6b81', '#ff8fa3',
                        '#ffa502', '#ffb142', '#ffcc8a',
                        '#2ed573'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.label}: ${context.raw} absentees`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        // Chart 2: Absentees by Month
        const ctx2 = document.getElementById('chartByMonth');
        if (ctx2) {
            const chartByMonth = new Chart(ctx2, {
                type: 'doughnut',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Absentees',
                        data: [12, 19, 8, 15, 10, 7],
                        backgroundColor: [
                            '#2d6cdf', '#4a90e2', '#6ba8ff',
                            '#ff8b29', '#ff9e43', '#ffb366'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                font: {
                                    size: 11
                                }
                            }
                        }
                    },
                    cutout: '70%'
                }
            });

            // Chart 3: Late Corners last 7 days
            const ctx3 = document.getElementById('chartLate');
            if (ctx3) {
                const chartLate = new Chart(ctx3, {
                    type: 'doughnut',
                    data: {
                        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                        datasets: [{
                            label: 'Late Corners',
                            data: [5, 8, 6, 7, 9, 3, 1],
                            backgroundColor: [
                                '#2ac7e1', '#36d1dc', '#5ce1e6',
                                '#ffa502', '#ffb142', '#ffcc8a',
                                '#3bb54a'
                            ],
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 11
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        return `${context.label}: ${context.raw} late corners`;
                                    }
                                }
                            }
                        },
                        cutout: '70%'
                    }
                });

                // Store charts for later access
                window.dashboardCharts = {
                    chart7days,
                    chartByMonth,
                    chartLate
                };
            }
        }
    }
}



// NEIPS Admin Portal JavaScript
document.addEventListener('DOMContentLoaded', function () {

    // ===== PAGE NAVIGATION =====
    const pageContents = document.querySelectorAll('.page-content');
    const menuItems = document.querySelectorAll('.menu-item, .submenu-item');

    // Function to show a specific page
    function showPage(pageId) {
        // Hide all pages
        pageContents.forEach(page => {
            page.classList.remove('active');
        });

        // Show the selected page
        const activePage = document.getElementById(`${pageId}-content`);
        if (activePage) {
            activePage.classList.add('active');
        } else {
            // Fallback to dashboard
            document.getElementById('dashboard-content').classList.add('active');
        }

        // Update active menu item
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });

        // Update page title
        updatePageTitle(pageId);

        // Initialize charts if on dashboard
        if (pageId === 'dashboard') {
            initializeCharts();
        }
    }

    // ===== MENU ITEM CLICK HANDLER =====
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            const pageId = item.getAttribute('data-page');
            if (pageId) {
                showPage(pageId);

                // Close mobile sidebar if open
                const sidebar = document.querySelector('.sidebar');
                const menuToggle = document.querySelector('.menu-toggle');
                if (window.innerWidth <= 1024 && sidebar.classList.contains('show')) {
                    sidebar.classList.remove('show');
                    if (menuToggle) {
                        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                    }
                }
            }
        });
    });


    // ===== SIDEBAR SUBMENU TOGGLE =====
    const submenuHeaders = document.querySelectorAll('.submenu-header');

    submenuHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const submenu = header.nextElementSibling;
            const icon = header.querySelector('.fa-chevron-down');

            header.classList.toggle('active');

            if (submenu.classList.contains('submenu')) {
                if (submenu.classList.contains('show')) {
                    submenu.classList.remove('show');
                    icon.style.transform = 'rotate(0deg)';
                } else {
                    submenu.classList.add('show');
                    icon.style.transform = 'rotate(180deg)';
                }
            }
        });
    });

    // ===== EXPORT BUTTONS =====
    const exportButtons = document.querySelectorAll('.btn-export');

    exportButtons.forEach(button => {
        button.addEventListener('click', () => {
            const action = button.textContent.trim().toLowerCase();

            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            button.disabled = true;

            setTimeout(() => {
                alert(`${action.toUpperCase()} export completed successfully!`);
                button.innerHTML = originalText;
                button.disabled = false;
            }, 1000);
        });
    });

    // ===== PAGINATION =====
    const paginationButtons = document.querySelectorAll('.pagination button');

    paginationButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.disabled) return;

            paginationButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    // ===== DARK MODE =====
    function initDarkMode() {
        const isDarkMode = localStorage.getItem('neipsDarkMode') === 'true';

        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }

        const darkModeToggle = document.createElement('button');
        darkModeToggle.className = 'btn-dark-mode';
        darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeToggle.title = 'Toggle Dark Mode';

        const headerControls = document.querySelector('.header-controls');
        if (headerControls) {
            headerControls.insertBefore(darkModeToggle, headerControls.querySelector('.btn-logout'));

            darkModeToggle.addEventListener('click', () => {
                const isDark = document.body.classList.toggle('dark-mode');
                localStorage.setItem('neipsDarkMode', isDark);

                darkModeToggle.innerHTML = isDark
                    ? '<i class="fas fa-sun"></i>'
                    : '<i class="fas fa-moon"></i>';

                // Update charts for dark mode
                if (window.dashboardCharts) {
                    Object.values(window.dashboardCharts).forEach(chart => {
                        chart.update();
                    });
                }
            });
        }
    }

    // ===== TABLE FILTERS =====
    function initTableFilters() {
        const searchInput = document.querySelector('input[type="text"][placeholder*="Search"]');

        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const tableRows = document.querySelectorAll('.attendance-table tbody tr');

                tableRows.forEach(row => {
                    const rowText = row.textContent.toLowerCase();
                    row.style.display = rowText.includes(searchTerm) ? '' : 'none';
                });
            });
        }

        const dateInput = document.querySelector('input[type="date"]');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.value = today;
        }

        const statusSelect = document.querySelector('select');
        if (statusSelect) {
            statusSelect.addEventListener('change', () => {
                const selectedStatus = statusSelect.value.toLowerCase();
                const tableRows = document.querySelectorAll('.attendance-table tbody tr');

                tableRows.forEach(row => {
                    const statusCell = row.querySelector('.status-present, .status-absent, .status-late, .status-leave');
                    if (statusCell) {
                        const rowStatus = statusCell.textContent.toLowerCase();
                        row.style.display = (selectedStatus === 'all' || rowStatus.includes(selectedStatus)) ? '' : 'none';
                    }
                });
            });
        }
    }

    // ===== HELPER FUNCTIONS =====
    function updatePageTitle(pageId) {
        const pageTitles = {
            'dashboard': 'Dashboard',
            'attendance': 'Attendance Report',
            'monthly': 'Monthly Attendance',
            'mobile': 'Mobile Punch',
            'field': 'Field Visit',
            'absent': 'Absent Report',
            'late': 'Late Report',
            'working': 'Working Hours Report',
            'leave': 'Leave Report',
            'employees': 'Employee List',
            'department': 'Department',
            'pandemic': 'Pandemic'
        };

        const title = pageTitles[pageId] || 'Dashboard';
        document.title = `${title} - NEIPS Admin Portal`;
    }

    // ===== LOGOUT HANDLER =====
    const logoutButton = document.querySelector('.btn-logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                logoutButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';

                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1000);
            }
        });
    }

    // ===== MOBILE MENU =====
    function initMobileMenu() {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.setAttribute('aria-label', 'Toggle menu');

        const logoTitle = document.querySelector('.logo-title');
        if (logoTitle) {
            logoTitle.appendChild(menuToggle);

            menuToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const sidebar = document.querySelector('.sidebar');
                sidebar.classList.toggle('show');

                menuToggle.innerHTML = sidebar.classList.contains('show')
                    ? '<i class="fas fa-times"></i>'
                    : '<i class="fas fa-bars"></i>';
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.querySelector('.menu-toggle');

            if (window.innerWidth <= 1024 &&
                sidebar.classList.contains('show') &&
                !sidebar.contains(e.target) &&
                e.target !== menuToggle &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('show');
                if (menuToggle) {
                    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
                }
            }
        });
    }

    // ===== INITIALIZATION =====
    function initializeApp() {
        // Show dashboard by default
        showPage('dashboard');

        // Initialize dark mode
        initDarkMode();


        // Initialize table filters
        initTableFilters();

        // Initialize mobile menu for smaller screens
        if (window.innerWidth <= 1024) {
            initMobileMenu();
        }

        // Add resize listener
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 1024) {
                const menuToggle = document.querySelector('.menu-toggle');
                if (!menuToggle) {
                    initMobileMenu();
                }
            }
        });
    }

    // Start the app
    initializeApp();
});
// ===== PDF GENERATION FUNCTION =====
async function generateStaffPDF() {
    try {
        console.log('📊 Starting PDF generation...');

        // Show loading
        const pdfBtn = document.getElementById('generatePdfBtn');
        const originalText = pdfBtn.innerHTML;
        pdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        pdfBtn.disabled = true;

        // Fetch all staff data
        const staffData = await fetchAllStaffData();

        // Fetch attendance data for each staff
        const staffWithAttendance = await fetchStaffAttendanceData(staffData);

        // Generate PDF
        await createPDF(staffWithAttendance);

        // Restore button
        pdfBtn.innerHTML = originalText;
        pdfBtn.disabled = false;

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);

        // Restore button
        const pdfBtn = document.getElementById('generatePdfBtn');
        pdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate Staff Report';
        pdfBtn.disabled = false;
    }
}

// ===== FETCH ALL STAFF DATA =====
// ===== FETCH ALL STAFF DATA (Fixed) =====
async function fetchAllStaffData() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Fetching all staff data...');

      const script = document.createElement('script');
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getStaff&callback=handleStaffData`;

      window.handleStaffData = function (response) {
        console.log('📊 Staff data response:', response);
        
        // Check the response format
        if (response.status === 'success' && response.data && Array.isArray(response.data)) {
          console.log(`✅ Found ${response.data.length} staff members`);
          
          // Transform data to ensure it has staff_id field
          const staffData = response.data.map(staff => {
            // Ensure staff_id exists
            if (!staff.staff_id) {
              // Try to find ID from various fields
              staff.staff_id = staff['Staff ID'] || staff.id || staff.ID || `STAFF${Date.now()}`;
            }
            
            // Ensure name exists
            if (!staff.name) {
              staff.name = staff.Name || 'Unknown Staff';
            }
            
            return staff;
          });
          
          resolve(staffData);
        } else {
          console.log('❌ Invalid response format:', response);
          reject(new Error('Invalid response: ' + JSON.stringify(response)));
        }

        // Clean up
        document.head.removeChild(script);
        delete window.handleStaffData;
      };

      document.head.appendChild(script);

    } catch (error) {
      console.error('❌ Error in fetchAllStaffData:', error);
      reject(error);
    }
  });
}
// ===== FETCH STAFF ATTENDANCE DATA =====
async function fetchStaffAttendanceData(staffData) {
    console.log('📊 Processing attendance for', staffData.length, 'staff members...');

    const staffWithAttendance = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Process each staff member
    for (const staff of staffData) {
        try {
            const staffId = staff.staff_id || staff.id || staff['Staff ID'];
            const staffName = staff.name || staff.Name || 'Unknown';

            console.log(`📝 Processing: ${staffName} (${staffId})`);

            // Fetch attendance for this staff
            const attendanceData = await fetchStaffAttendance(staffId);

            // Calculate summary statistics
            const summary = calculateAttendanceSummary(attendanceData, currentMonth, currentYear);

            staffWithAttendance.push({
                id: staffId,
                name: staffName,
                department: staff.department || staff.Department || 'N/A',
                center: staff.center || staff.Center || 'N/A',
                phone: staff.phone || staff.Phone || 'N/A',
                email: staff.email || staff.Email || 'N/A',
                ...summary
            });

        } catch (error) {
            console.error(`❌ Error processing staff ${staff.id}:`, error);
        }
    }

    console.log(`✅ Processed ${staffWithAttendance.length} staff members`);
    return staffWithAttendance;
}

// ===== FETCH INDIVIDUAL STAFF ATTENDANCE =====
async function fetchStaffAttendance(staffId) {
    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getStaffAttendance&staffId=${staffId}&callback=handleAttendanceData`;

            window.handleAttendanceData = function (response) {
                if (response.success && response.attendance) {
                    resolve(response.attendance);
                } else {
                    resolve([]); // Return empty array if no attendance
                }

                document.head.removeChild(script);
                delete window.handleAttendanceData;
            };

            document.head.appendChild(script);

        } catch (error) {
            reject(error);
        }
    });
}

// ===== CALCULATE ATTENDANCE SUMMARY =====
function calculateAttendanceSummary(attendanceData, month, year) {
    const today = new Date();
    const currentMonthStr = `${year}-${(month + 1).toString().padStart(2, '0')}`;

    let totalDays = 0;
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let leaveDays = 0;
    let avgHours = 0;
    let totalHours = 0;

    // Filter for current month
    const monthAttendance = attendanceData.filter(record => {
        try {
            const recordDate = new Date(record.Date || record.date);
            const recordMonth = recordDate.getMonth();
            const recordYear = recordDate.getFullYear();
            return recordMonth === month && recordYear === year;
        } catch (e) {
            return false;
        }
    });

    // Calculate statistics
    monthAttendance.forEach(record => {
        totalDays++;

        const status = (record.Status || record.status || '').toLowerCase();
        const checkIn = record.CheckIn || record.check_in;
        const checkOut = record.CheckOut || record.check_out;

        // Count days by status
        if (status.includes('present')) presentDays++;
        if (status.includes('absent')) absentDays++;
        if (status.includes('late')) lateDays++;
        if (status.includes('leave')) leaveDays++;

        // Calculate hours if check-in and check-out exist
        if (checkIn && checkOut) {
            try {
                const hours = calculateWorkingHours(checkIn, checkOut);
                totalHours += hours;
            } catch (e) {
                console.log('Error calculating hours:', e);
            }
        }
    });

    // Calculate averages
    avgHours = presentDays > 0 ? (totalHours / presentDays).toFixed(2) : 0;

    // Calculate attendance percentage
    const attendancePercentage = totalDays > 0
        ? Math.round((presentDays / totalDays) * 100)
        : 0;

    return {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        attendancePercentage,
        avgHours: parseFloat(avgHours),
        totalHours: parseFloat(totalHours.toFixed(2))
    };
}

// ===== CALCULATE WORKING HOURS =====
function calculateWorkingHours(checkIn, checkOut) {
    try {
        // Parse times (assuming format: "HH:MM" or "HH:MM AM/PM")
        const parseTime = (timeStr) => {
            let [time, modifier] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;

            return hours + (minutes / 60);
        };

        const start = parseTime(checkIn);
        const end = parseTime(checkOut);

        // Calculate difference (subtract 1 hour for lunch if work > 5 hours)
        let hours = end - start;
        if (hours > 5) hours -= 1; // Lunch break

        return Math.max(0, hours);
    } catch (error) {
        console.log('Error parsing times:', checkIn, checkOut);
        return 0;
    }
}

// ===== CREATE PDF DOCUMENT =====
async function createPDF(staffData) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    // Add logo/title
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text('NEIPS - STAFF ATTENDANCE REPORT', pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const today = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonth = monthNames[today.getMonth()];
    doc.text(`${currentMonth} ${today.getFullYear()} - Staff Attendance Summary`, pageWidth / 2, 28, { align: 'center' });

    // Date generated
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const generatedDate = today.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, 35, { align: 'center' });

    // Prepare table data
    const tableData = staffData.map((staff, index) => [
        index + 1,
        staff.id,
        staff.name,
        staff.department,
        staff.center,
        staff.presentDays,
        staff.absentDays,
        staff.lateDays,
        staff.leaveDays,
        `${staff.attendancePercentage}%`,
        `${staff.avgHours}h`,
        `${staff.totalHours}h`
    ]);

    // Create table
    doc.autoTable({
        startY: 45,
        head: [
            ['#', 'Staff ID', 'Name', 'Department', 'Center',
                'Present', 'Absent', 'Late', 'Leave',
                'Attendance %', 'Avg Hours/Day', 'Total Hours']
        ],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 15 },  // #
            1: { cellWidth: 40 },  // Staff ID
            2: { cellWidth: 50 },  // Name
            3: { cellWidth: 40 },  // Department
            4: { cellWidth: 40 },  // Center
            5: { cellWidth: 25 },  // Present
            6: { cellWidth: 25 },  // Absent
            7: { cellWidth: 25 },  // Late
            8: { cellWidth: 25 },  // Leave
            9: { cellWidth: 30 },  // Attendance %
            10: { cellWidth: 35 }, // Avg Hours
            11: { cellWidth: 30 }  // Total Hours
        },
        margin: { left: 10, right: 10 },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap'
        }
    });

    // Add summary statistics
    const finalY = doc.lastAutoTable.finalY + 10;

    // Calculate totals
    const totalStaff = staffData.length;
    const totalPresent = staffData.reduce((sum, staff) => sum + staff.presentDays, 0);
    const totalAbsent = staffData.reduce((sum, staff) => sum + staff.absentDays, 0);
    const totalLate = staffData.reduce((sum, staff) => sum + staff.lateDays, 0);
    const totalLeave = staffData.reduce((sum, staff) => sum + staff.leaveDays, 0);
    const avgAttendance = staffData.length > 0
        ? Math.round(staffData.reduce((sum, staff) => sum + staff.attendancePercentage, 0) / staffData.length)
        : 0;

    // Summary box
    doc.setFillColor(240, 248, 255);
    doc.rect(10, finalY, pageWidth - 20, 25, 'F');

    doc.setFontSize(11);
    doc.setTextColor(40, 53, 147);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY STATISTICS', 15, finalY + 8);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    doc.text(`Total Staff: ${totalStaff}`, 15, finalY + 16);
    doc.text(`Total Present Days: ${totalPresent}`, 80, finalY + 16);
    doc.text(`Total Absent Days: ${totalAbsent}`, 150, finalY + 16);
    doc.text(`Total Late Days: ${totalLate}`, 220, finalY + 16);
    doc.text(`Total Leave Days: ${totalLeave}`, 15, finalY + 22);
    doc.text(`Average Attendance: ${avgAttendance}%`, 80, finalY + 22);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidential - For CEO Review Only', pageWidth / 2, 200, { align: 'center' });
    doc.text('© 2024 NEIPS - Northeast Institute of Professional Studies', pageWidth / 2, 205, { align: 'center' });

    // Save PDF
    const fileName = `NEIPS_Staff_Report_${currentMonth}_${today.getFullYear()}.pdf`;
    doc.save(fileName);

    console.log(`✅ PDF generated successfully: ${fileName}`);
    alert(`PDF generated successfully!\n\nFile: ${fileName}\n\nTotal Staff: ${totalStaff}\nTotal Present Days: ${totalPresent}`);
}

// ===== INITIALIZE PDF FUNCTIONALITY =====

// ===== MONTHLY ATTENDANCE FUNCTIONS =====
async function loadMonthlyAttendance() {
    try {
        console.log('📅 Loading monthly attendance...');

        const month = document.getElementById('filter-month').value;
        const year = document.getElementById('filter-year').value;

        showLoading('Loading monthly attendance data...');

        // Fetch staff data
        const staffData = await fetchAllStaffData();
        console.log('📊 Total staff:', staffData.length);

        // Fetch attendance for each staff
        const staffWithAttendance = [];
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalLeave = 0;

        for (const staff of staffData) {
            try {
                const staffId = staff.staff_id || staff.id || staff['Staff ID'];
                const staffName = staff.name || staff.Name || 'Unknown';
                const staffRole = staff.role || staff.Role || staff.Member || 'Staff';

                console.log(`📝 Processing: ${staffName} (${staffId})`);

                // Fetch attendance data for this month
                const attendanceData = await fetchMonthlyAttendance(staffId, month, year);

                // Calculate statistics
                const summary = calculateMonthlySummary(attendanceData);

                staffWithAttendance.push({
                    id: staffId,
                    name: staffName,
                    role: staffRole,
                    email: staff.email || staff.Email || '',
                    phone: staff.phone || staff.Phone || '',
                    ...summary
                });

                // Update totals
                totalPresent += summary.presentDays;
                totalAbsent += summary.absentDays;
                totalLate += summary.lateDays;
                totalLeave += summary.leaveDays;

            } catch (error) {
                console.error(`❌ Error processing staff:`, error);
            }
        }

        // Update summary cards
        updateMonthlySummary(staffData.length, totalPresent, totalAbsent, totalLate);

        // Populate table
        populateMonthlyTable(staffWithAttendance);

        // Store data for later use
        window.monthlyAttendanceData = staffWithAttendance;

        hideLoading();

        console.log(`✅ Monthly attendance loaded: ${staffWithAttendance.length} staff`);

    } catch (error) {
        console.error('❌ Error loading monthly attendance:', error);
        hideLoading();
        showNotification('Error loading attendance data', 'error');
    }
}

async function fetchMonthlyAttendance(staffId, month, year) {
    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getMonthlyAttendance&staffId=${staffId}&month=${month}&year=${year}&callback=handleMonthlyAttendanceData`;

            window.handleMonthlyAttendanceData = function (response) {
                if (response.success && response.records) {
                    resolve(response.records);
                } else {
                    resolve([]);
                }

                document.head.removeChild(script);
                delete window.handleMonthlyAttendanceData;
            };

            document.head.appendChild(script);

        } catch (error) {
            reject(error);
        }
    });
}

function calculateMonthlySummary(attendanceData) {
    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let leaveDays = 0;
    let totalHours = 0;
    let workingDays = 0;

    attendanceData.forEach(record => {
        const status = (record.Status || record.status || '').toLowerCase();
        const checkIn = record.CheckIn || record.check_in;
        const checkOut = record.CheckOut || record.check_out;

        if (status.includes('present')) {
            presentDays++;
            workingDays++;

            // Calculate hours
            if (checkIn && checkOut) {
                try {
                    const hours = calculateWorkingHours(checkIn, checkOut);
                    totalHours += hours;
                } catch (e) {
                    console.log('Error calculating hours:', e);
                }
            }
        } else if (status.includes('absent')) {
            absentDays++;
        } else if (status.includes('late')) {
            lateDays++;
            presentDays++;
            workingDays++;
        } else if (status.includes('leave')) {
            leaveDays++;
        }
    });

    const avgHours = workingDays > 0 ? (totalHours / workingDays).toFixed(2) : 0;
    const attendancePercentage = (presentDays + workingDays) > 0 ?
        Math.round((presentDays / (presentDays + absentDays)) * 100) : 0;

    return {
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        totalHours: parseFloat(totalHours.toFixed(2)),
        avgHours: parseFloat(avgHours),
        attendancePercentage,
        workingDays
    };
}

function updateMonthlySummary(totalStaff, present, absent, late) {
    document.getElementById('totalStaff').textContent = totalStaff;
    document.getElementById('presentDays').textContent = present;
    document.getElementById('absentDays').textContent = absent;
    document.getElementById('lateDays').textContent = late;
}

function populateMonthlyTable(staffData) {
    const tableBody = document.getElementById('monthlyTableBody');
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');

    tableBody.innerHTML = '';

    staffData.forEach((staff, index) => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${staff.id}</strong></td>
            <td>${staff.name}</td>
            <td><span class="badge badge-role">${staff.role}</span></td>
            <td><span class="status-present">${staff.presentDays}</span></td>
            <td><span class="status-absent">${staff.absentDays}</span></td>
            <td><span class="status-late">${staff.lateDays}</span></td>
            <td><span class="status-leave">${staff.leaveDays}</span></td>
            <td>${staff.avgHours}h</td>
            <td>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${staff.attendancePercentage}%"></div>
                    <span class="progress-text">${staff.attendancePercentage}%</span>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    showingCount.textContent = staffData.length;
    totalCount.textContent = staffData.length;
}

// ===== PDF GENERATION FOR MONTHLY ATTENDANCE =====
async function generateMonthlyPDF() {
    try {
        console.log('📊 Generating monthly PDF report...');

        const month = document.getElementById('filter-month').value;
        const year = document.getElementById('filter-year').value;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Show staff selection modal
        showStaffListModal();

    } catch (error) {
        console.error('❌ Error generating monthly PDF:', error);
        showNotification('Error generating PDF', 'error');
    }
}

function showStaffListModal() {
    const modal = document.getElementById('staffListModal');
    const closeBtn = modal.querySelector('.close-modal');

    // Load staff list
    loadStaffList();

    // Show modal
    modal.style.display = 'block';

    // Close modal events
    closeBtn.onclick = function () {
        modal.style.display = 'none';
    };

    window.onclick = function (event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

async function loadStaffList() {
    try {
        const staffData = await fetchAllStaffData();
        const tableBody = document.getElementById('staffListBody');

        tableBody.innerHTML = '';

        staffData.forEach((staff, index) => {
            const row = document.createElement('tr');
            const staffId = staff.staff_id || staff.id || staff['Staff ID'];
            const staffName = staff.name || staff.Name || 'Unknown';
            const staffRole = staff.role || staff.Role || staff.Member || 'Staff';
            const email = staff.email || staff.Email || '';
            const phone = staff.phone || staff.Phone || '';

            row.innerHTML = `
                <td><input type="checkbox" class="staff-checkbox" data-staff-id="${staffId}" checked></td>
                <td><strong>${staffId}</strong></td>
                <td>${staffName}</td>
                <td>${staffRole}</td>
                <td>${email}</td>
                <td>${phone}</td>
            `;

            tableBody.appendChild(row);
        });

        // Set up checkbox handlers
        setupCheckboxHandlers();

    } catch (error) {
        console.error('❌ Error loading staff list:', error);
    }
}

function setupCheckboxHandlers() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    const staffCheckboxes = document.querySelectorAll('.staff-checkbox');
    const selectAllBtn = document.getElementById('selectAllStaff');
    const deselectAllBtn = document.getElementById('deselectAllStaff');

    // Select all checkbox
    selectAllCheckbox.onchange = function () {
        staffCheckboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
    };

    // Select all button
    selectAllBtn.onclick = function () {
        staffCheckboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
        selectAllCheckbox.checked = true;
    };

    // Deselect all button
    deselectAllBtn.onclick = function () {
        staffCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        selectAllCheckbox.checked = false;
    };
}

async function generateSelectedStaffPDF() {
    try {
        console.log('📊 Generating PDF for selected staff...');

        const selectedCheckboxes = document.querySelectorAll('.staff-checkbox:checked');
        const selectedStaffIds = Array.from(selectedCheckboxes).map(cb => cb.getAttribute('data-staff-id'));

        if (selectedStaffIds.length === 0) {
            showNotification('Please select at least one staff member', 'warning');
            return;
        }

        // Show loading
        const generateBtn = document.getElementById('generateSelectedPDF');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        generateBtn.disabled = true;

        const month = document.getElementById('filter-month').value;
        const year = document.getElementById('filter-year').value;
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        // Fetch data for selected staff
        const staffWithAttendance = [];

        for (const staffId of selectedStaffIds) {
            try {
                const staffData = await getStaffDataById(staffId);
                const attendanceData = await fetchMonthlyAttendance(staffId, month, year);
                const summary = calculateMonthlySummary(attendanceData);

                staffWithAttendance.push({
                    id: staffId,
                    name: staffData.name || 'Unknown',
                    role: staffData.role || staffData.Role || staffData.Member || 'Staff',
                    email: staffData.email || '',
                    phone: staffData.phone || '',
                    ...summary
                });

            } catch (error) {
                console.error(`❌ Error processing staff ${staffId}:`, error);
            }
        }

        // Generate PDF
        await createMonthlyAttendancePDF(staffWithAttendance, month, year, monthNames[parseInt(month) - 1]);

        // Close modal
        document.getElementById('staffListModal').style.display = 'none';

        // Reset button
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
        showNotification('Error generating PDF', 'error');

        const generateBtn = document.getElementById('generateSelectedPDF');
        generateBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Generate PDF for Selected Staff';
        generateBtn.disabled = false;
    }
}

async function getStaffDataById(staffId) {
    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getStaffById&staffId=${staffId}&callback=handleStaffDataById`;

            window.handleStaffDataById = function (response) {
                if (response.success && response.staff) {
                    resolve(response.staff);
                } else {
                    resolve({});
                }

                document.head.removeChild(script);
                delete window.handleStaffDataById;
            };

            document.head.appendChild(script);

        } catch (error) {
            reject(error);
        }
    });
}

async function createMonthlyAttendancePDF(staffData, month, year, monthName) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');

    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date();

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 53, 147);
    doc.text('NEIPS - MONTHLY ATTENDANCE REPORT', pageWidth / 2, 20, { align: 'center' });

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text(`Report for: ${monthName} ${year}`, pageWidth / 2, 28, { align: 'center' });

    // Date generated
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    const generatedDate = today.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated on: ${generatedDate}`, pageWidth / 2, 35, { align: 'center' });

    // Prepare table data
    const tableData = staffData.map((staff, index) => [
        index + 1,
        staff.id,
        staff.name,
        staff.role,
        staff.presentDays,
        staff.absentDays,
        staff.lateDays,
        staff.leaveDays,
        `${staff.avgHours}h`,
        `${staff.attendancePercentage}%`
    ]);

    // Create table
    doc.autoTable({
        startY: 45,
        head: [
            ['#', 'Staff ID', 'Name', 'Role', 'Present', 'Absent', 'Late', 'Leave', 'Avg Hours', 'Attendance %']
        ],
        body: tableData,
        theme: 'grid',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40 },
            2: { cellWidth: 50 },
            3: { cellWidth: 40 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
            7: { cellWidth: 25 },
            8: { cellWidth: 30 },
            9: { cellWidth: 35 }
        },
        margin: { left: 10, right: 10 },
        styles: {
            overflow: 'linebreak',
            cellWidth: 'wrap'
        }
    });

    // Add summary statistics
    const finalY = doc.lastAutoTable.finalY + 10;

    // Calculate totals
    const totalStaff = staffData.length;
    const totalPresent = staffData.reduce((sum, staff) => sum + staff.presentDays, 0);
    const totalAbsent = staffData.reduce((sum, staff) => sum + staff.absentDays, 0);
    const totalLate = staffData.reduce((sum, staff) => sum + staff.lateDays, 0);
    const totalLeave = staffData.reduce((sum, staff) => sum + staff.leaveDays, 0);

    // Summary box
    doc.setFillColor(240, 248, 255);
    doc.rect(10, finalY, pageWidth - 20, 25, 'F');

    doc.setFontSize(11);
    doc.setTextColor(40, 53, 147);
    doc.setFont(undefined, 'bold');
    doc.text('SUMMARY STATISTICS', 15, finalY + 8);

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');

    doc.text(`Total Staff: ${totalStaff}`, 15, finalY + 16);
    doc.text(`Total Present Days: ${totalPresent}`, 80, finalY + 16);
    doc.text(`Total Absent Days: ${totalAbsent}`, 150, finalY + 16);
    doc.text(`Total Late Days: ${totalLate}`, 220, finalY + 16);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Confidential - For Admin Review Only', pageWidth / 2, 200, { align: 'center' });
    doc.text('© 2024 NEIPS - Northeast Institute of Professional Studies', pageWidth / 2, 205, { align: 'center' });

    // Save PDF
    const fileName = `NEIPS_Monthly_Attendance_${monthName}_${year}.pdf`;
    doc.save(fileName);

    console.log(`✅ Monthly PDF generated successfully: ${fileName}`);
    showNotification(`PDF generated successfully!\nTotal Staff: ${totalStaff}`, 'success');
}

// ===== HELPER FUNCTIONS =====
function showLoading(message = 'Loading...') {
    // Create or show loading overlay
    let loadingOverlay = document.getElementById('loadingOverlay');
    if (!loadingOverlay) {
        loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'loadingOverlay';
        loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;
        loadingOverlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
                <i class="fas fa-spinner fa-spin fa-2x" style="color: #4a86e8;"></i>
                <p style="margin-top: 15px; font-size: 16px;">${message}</p>
            </div>
        `;
        document.body.appendChild(loadingOverlay);
    } else {
        loadingOverlay.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').onclick = function () {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    };
}

// ===== INITIALIZE MONTHLY ATTENDANCE FUNCTIONALITY =====
// ===== INITIALIZE MONTHLY ATTENDANCE FUNCTIONALITY =====
function initMonthlyAttendance() {
    // Set current month and year
    const now = new Date();
    const monthSelect = document.getElementById('filter-month');
    const yearSelect = document.getElementById('filter-year');
    
    if (monthSelect) {
        monthSelect.value = (now.getMonth() + 1).toString().padStart(2, '0');
    }
    
    if (yearSelect) {
        yearSelect.value = now.getFullYear();
    }

    // Load button
    const loadBtn = document.getElementById('loadMonthlyData');
    if (loadBtn) {
        loadBtn.addEventListener('click', loadMonthlyAttendance);
    }

    // PDF download button
    const pdfBtn = document.getElementById('downloadMonthlyPDF');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', generateMonthlyPDF);
    }

    // Export CSV button
    const exportBtn = document.getElementById('exportMonthlyCSV');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportMonthlyCSV);
    }

    // Search functionality
    const searchInput = document.getElementById('searchMonthly');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#monthlyTableBody tr');

            let visibleCount = 0;
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                if (rowText.includes(searchTerm)) {
                    row.style.display = '';
                    visibleCount++;
                } else {
                    row.style.display = 'none';
                }
            });

            // Update showing count
            document.getElementById('showingCount').textContent = visibleCount;
        });
    }

    // Initialize modal close buttons
    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = document.getElementById('staffListModal');
            modal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('staffListModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Generate PDF for selected staff
    const generateBtn = document.getElementById('generateSelectedPDF');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSelectedStaffPDF);
    }

    // Select all/deselect all buttons
    const selectAllBtn = document.getElementById('selectAllStaff');
    const deselectAllBtn = document.getElementById('deselectAllStaff');
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.staff-checkbox');
            checkboxes.forEach(cb => cb.checked = true);
            if (selectAllCheckbox) selectAllCheckbox.checked = true;
        });
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.staff-checkbox');
            checkboxes.forEach(cb => cb.checked = false);
            if (selectAllCheckbox) selectAllCheckbox.checked = false;
        });
    }

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.staff-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    }

    // Search in staff list modal
    const searchStaffInput = document.getElementById('searchStaffList');
    if (searchStaffInput) {
        searchStaffInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#staffListBody tr');
            
            rows.forEach(row => {
                const rowText = row.textContent.toLowerCase();
                row.style.display = rowText.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Load monthly data on page load if we're on the monthly page
    const monthlyPage = document.getElementById('monthly-content');
    if (monthlyPage && monthlyPage.classList.contains('active')) {
        setTimeout(() => {
            loadMonthlyAttendance();
        }, 500);
    }
}
// ===== SHOW LOADING =====
function showLoading(message = 'Loading...') {
    let loading = document.getElementById('loadingOverlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <i class="fas fa-spinner"></i>
            <p>${message}</p>
        `;
        document.body.appendChild(loading);
    }
    loading.style.display = 'flex';
}

// ===== HIDE LOADING =====
function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.style.display = 'none';
    }
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                       type === 'error' ? 'fa-exclamation-circle' : 
                       type === 'warning' ? 'fa-exclamation-triangle' : 
                       'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Auto remove after 5 seconds
    const autoRemove = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', function() {
        clearTimeout(autoRemove);
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// ===== EXPORT MONTHLY CSV =====
function exportMonthlyCSV() {
    const table = document.getElementById('monthlyAttendanceTable');
    const rows = table.querySelectorAll('tr');
    const csv = [];
    
    rows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('th, td');
        cells.forEach(cell => {
            let text = cell.textContent.trim();
            // Escape quotes and wrap in quotes if contains comma
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                text = '"' + text.replace(/"/g, '""') + '"';
            }
            rowData.push(text);
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = csv.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const month = document.getElementById('filter-month').value;
    const year = document.getElementById('filter-year').value;
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    
    link.href = url;
    link.download = `NEIPS_Monthly_Attendance_${monthNames[parseInt(month)-1]}_${year}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('CSV exported successfully!', 'success');
}
// ===== UPDATE INITIALIZEAPP FUNCTION =====
// ===== INITIALIZE APP =====
// ===== INITIALIZE APP =====
function initializeApp() {
    // Show dashboard by default
    showPage('dashboard');

    // Load dashboard data immediately
    console.log('🚀 Initializing dashboard data...');
    loadDashboardData();

    // Initialize dark mode
    initDarkMode();

    // Initialize table filters
    initTableFilters();

    // Initialize monthly attendance
    initMonthlyAttendance();

    // Initialize mobile menu for smaller screens
    if (window.innerWidth <= 1024) {
        initMobileMenu();
    }

    // Add resize listener
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            const menuToggle = document.querySelector('.menu-toggle');
            if (!menuToggle) {
                initMobileMenu();
            }
        }
    });
}
// Add these functions to your admin.js file

// ===== LOAD DASHBOARD DATA =====
// ===== LOAD DASHBOARD DATA =====
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');

        // Show loading
        const cards = document.querySelectorAll('.summary-card h2');
        cards.forEach(card => card.textContent = '⌛');

        // Fetch today's attendance summary
        const summary = await fetchTodayAttendanceSummary();

        // Update dashboard cards
        if (summary && summary.success) {
            const data = summary.summary;

            // Update card values
            const employeeCard = document.querySelector('.summary-card:nth-child(1) h2');
            const presentCard = document.querySelector('.summary-card:nth-child(2) h2');
            const absentCard = document.querySelector('.summary-card:nth-child(3) h2');
            const lateCard = document.querySelector('.summary-card:nth-child(4) h2');

            if (employeeCard) employeeCard.textContent = data.totalEmployees || 0;
            if (presentCard) presentCard.textContent = data.present || 0;
            if (absentCard) absentCard.textContent = data.absent || 0;
            if (lateCard) lateCard.textContent = data.late || 0;

            console.log('✅ Dashboard data loaded:', data);
        }

        // Initialize charts - ONLY IF IT EXISTS
        if (typeof initializeCharts === 'function') {
            setTimeout(() => {
                initializeCharts();
            }, 100); // Small delay to ensure DOM is ready
        } else {
            console.warn('⚠️ initializeCharts function not available');
        }

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);

        // Show error on cards
        const cards = document.querySelectorAll('.summary-card h2');
        cards.forEach(card => card.textContent = '❌');
    }
}
// ===== FETCH TODAY'S ATTENDANCE SUMMARY =====
// ===== FETCH TODAY'S ATTENDANCE SUMMARY =====
// ===== FETCH TODAY'S ATTENDANCE SUMMARY =====
async function fetchTodayAttendanceSummary() {
    return new Promise((resolve, reject) => {
        try {
            console.log('🔍 Fetching today\'s summary...');

            // Create a unique callback name
            const callbackName = 'handleTodaySummary_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            // Define the callback function
            window[callbackName] = function (response) {
                console.log('📊 Today\'s summary received:', response);

                // Clean up
                document.head.removeChild(script);
                delete window[callbackName];

                resolve(response);
            };

            // Create script element
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getTodaySummary&callback=${callbackName}`;

            // Error handling
            script.onerror = function (error) {
                console.error('❌ Script load error:', error);
                reject(new Error('Failed to load data from server'));
            };

            // Add timeout
            setTimeout(() => {
                if (script.parentNode) {
                    console.warn('⚠️ Request timeout');
                    reject(new Error('Request timeout'));
                }
            }, 10000);

            document.head.appendChild(script);

        } catch (error) {
            console.error('❌ Error fetching today\'s summary:', error);
            reject(error);
        }
    });
}
// ===== FETCH ALL STAFF DATA (Updated) =====
async function fetchAllStaffData() {
    return new Promise((resolve, reject) => {
        try {
            const script = document.createElement('script');
            script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getAllStaff&callback=handleAllStaffData`;

            window.handleAllStaffData = function (response) {
                console.log('📊 All staff data received:', response);

                if (response.status === 'success' && response.data) {
                    resolve(response.data);
                } else {
                    reject(new Error(response.message || 'Failed to fetch staff data'));
                }

                document.head.removeChild(script);
                delete window.handleAllStaffData;
            };

            document.head.appendChild(script);

        } catch (error) {
            reject(error);
        }
    });
}

// ===== FETCH STAFF ATTENDANCE (Updated) =====
// ===== FETCH STAFF ATTENDANCE =====
async function fetchStaffAttendance(staffId, month, year) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`📅 Fetching attendance for ${staffId}, ${month}/${year}`);
      
      const script = document.createElement('script');
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getMonthlyAttendance&staffId=${staffId}&month=${month}&year=${year}&callback=handleStaffAttendanceData`;

      window.handleStaffAttendanceData = function (response) {
        console.log(`📊 Attendance response for ${staffId}:`, response);
        
        if (response.success && response.records) {
          console.log(`✅ Found ${response.records.length} records for ${staffId}`);
          resolve(response.records);
        } else {
          console.log(`⚠️ No records found for ${staffId}`, response.message);
          resolve([]); // Return empty array if no attendance
        }

        document.head.removeChild(script);
        delete window.handleStaffAttendanceData;
      };

      document.head.appendChild(script);

      // Timeout after 10 seconds
      setTimeout(() => {
        if (script.parentNode) {
          console.log(`⏰ Timeout fetching attendance for ${staffId}`);
          resolve([]);
        }
      }, 10000);

    } catch (error) {
      console.error(`❌ Error fetching attendance for ${staffId}:`, error);
      reject(error);
    }
  });
}// ===== UPDATE DASHBOARD WHEN PAGE CHANGES =====
// ===== PAGE NAVIGATION =====
function showPage(pageId) {
    // Hide all pages
    pageContents.forEach(page => {
        page.classList.remove('active');
    });

    // Show the selected page
    const activePage = document.getElementById(`${pageId}-content`);
    if (activePage) {
        activePage.classList.add('active');

        // Load data for specific pages
        if (pageId === 'dashboard') {
            console.log('🚀 Loading dashboard data...');
            loadDashboardData();
            if (typeof initializeCharts === 'function') {
                setTimeout(() => initializeCharts(), 100);
            }
        } else if (pageId === 'monthly') {
            console.log('📅 Loading monthly attendance...');
            setTimeout(() => {
                loadMonthlyAttendance();
            }, 100);
        }

    } else {
        // Fallback to dashboard
        document.getElementById('dashboard-content').classList.add('active');
        loadDashboardData();
    }

    // Update active menu item
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('active');
        }
    });

    // Update page title
    updatePageTitle(pageId);
}
// ===== UPDATE INITIALIZE APP FUNCTION =====
function initializeApp() {
    // Show dashboard by default
    showPage('dashboard');

    // Initialize dark mode
    initDarkMode();

    // Initialize table filters
    initTableFilters();

    // Initialize monthly attendance
    initMonthlyAttendance();

    // Initialize mobile menu for smaller screens
    if (window.innerWidth <= 1024) {
        initMobileMenu();
    }

    // Add resize listener
    window.addEventListener('resize', () => {
        if (window.innerWidth <= 1024) {
            const menuToggle = document.querySelector('.menu-toggle');
            if (!menuToggle) {
                initMobileMenu();
            }
        }
    });
}

// ===== UPDATE MONTHLY ATTENDANCE FUNCTIONS =====
async function loadMonthlyAttendance() {
    try {
        console.log('📅 Loading monthly attendance...');

        const month = document.getElementById('filter-month').value;
        const year = document.getElementById('filter-year').value;

        showLoading('Loading monthly attendance data...');

        // Fetch staff data
        const staffData = await fetchAllStaffData();
        console.log('📊 Total staff:', staffData.length);

        // Update total staff count
        document.getElementById('totalStaff').textContent = staffData.length;

        // Fetch attendance for each staff
        const staffWithAttendance = [];
        let totalPresent = 0;
        let totalAbsent = 0;
        let totalLate = 0;
        let totalLeave = 0;

        // Process first 10 staff for quick display (you can remove this limit)
        const staffToProcess = staffData.slice(0, 10);

        for (const staff of staffToProcess) {
            try {
                const staffId = staff.staff_id;
                const staffName = staff.name || 'Unknown';
                const staffRole = staff.role || 'Staff';

                console.log(`📝 Processing: ${staffName} (${staffId})`);

                // Fetch attendance data for this month
                const attendanceData = await fetchStaffAttendance(staffId, month, year);

                // Calculate statistics
                const summary = calculateMonthlySummary(attendanceData);

                staffWithAttendance.push({
                    id: staffId,
                    name: staffName,
                    role: staffRole,
                    email: staff.email || '',
                    phone: staff.phone || '',
                    ...summary
                });

                // Update totals
                totalPresent += summary.presentDays;
                totalAbsent += summary.absentDays;
                totalLate += summary.lateDays;
                totalLeave += summary.leaveDays;

            } catch (error) {
                console.error(`❌ Error processing staff:`, error);
            }
        }

        // Update summary cards
        updateMonthlySummary(staffData.length, totalPresent, totalAbsent, totalLate);

        // Populate table
        populateMonthlyTable(staffWithAttendance);

        // Store data for later use
        window.monthlyAttendanceData = staffWithAttendance;

        hideLoading();

        console.log(`✅ Monthly attendance loaded: ${staffWithAttendance.length} staff`);

    } catch (error) {
        console.error('❌ Error loading monthly attendance:', error);
        hideLoading();
        showNotification('Error loading attendance data', 'error');
    }
}

// ===== ADD CSS FOR BETTER DISPLAY =====
// Add this to your admin.css file
const additionalCSS = `
/* Dashboard Cards */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.summary-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.summary-card:hover {
    transform: translateY(-5px);
}

.summary-card .icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    font-size: 24px;
    color: white;
}

.summary-card .icon.blue {
    background: linear-gradient(135deg, #4a86e8, #2d6cdf);
}
.summary-card .icon.green {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
}
.summary-card .icon.orange {
    background: linear-gradient(135deg, #e67e22, #d35400);
}
.summary-card .icon.red {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
}
.summary-card .icon.cyan {
    background: linear-gradient(135deg, #2ac7e1, #36d1dc);
}

.summary-card .content h2 {
    font-size: 32px;
    margin: 0 0 5px 0;
    color: #333;
}

.summary-card .content p {
    margin: 0;
    color: #666;
    font-size: 14px;
}

/* Charts Section */
.chart-section {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.chart-card {
    background: white;
    border-radius: 10px;
    padding: 20px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.chart-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #333;
    font-size: 16px;
    text-align: center;
}

.chart-card canvas {
    width: 100% !important;
    height: 250px !important;
}

/* Monthly Attendance Table */
.table-section {
    background: white;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    margin-bottom: 30px;
}

.table-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.table-header h3 {
    margin: 0;
    color: #333;
}

.table-actions {
    display: flex;
    gap: 10px;
}

.search-input {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 5px;
    width: 200px;
}

.btn-export-small {
    background: #4a86e8;
    color: white;
    border: none;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 14px;
}

.table-container {
    overflow-x: auto;
}

.attendance-table {
    width: 100%;
    border-collapse: collapse;
}

.attendance-table th {
    background: #f8f9fa;
    padding: 15px;
    text-align: left;
    font-weight: 600;
    color: #333;
    border-bottom: 2px solid #dee2e6;
}

.attendance-table td {
    padding: 15px;
    border-bottom: 1px solid #eee;
}

.attendance-table tr:hover {
    background-color: #f8f9fa;
}

/* Status badges */
.status-present {
    color: #27ae60;
    font-weight: 600;
}

.status-absent {
    color: #e74c3c;
    font-weight: 600;
}

.status-late {
    color: #f39c12;
    font-weight: 600;
}

.status-leave {
    color: #3498db;
    font-weight: 600;
}

.badge-role {
    background: #e3f2fd;
    color: #1976d2;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}

/* Progress bar */
.progress-container {
    width: 100px;
    height: 20px;
    background: #eee;
    border-radius: 10px;
    position: relative;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: linear-gradient(to right, #4a86e8, #2d6cdf);
    border-radius: 10px;
    transition: width 0.3s ease;
}

.progress-text {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    color: #333;
}

/* Table footer */
.table-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
}

.table-info {
    color: #666;
    font-size: 14px;
}

.pagination {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-prev, .btn-next {
    background: white;
    border: 1px solid #ddd;
    width: 32px;
    height: 32px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #333;
}

.btn-prev:disabled, .btn-next:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-info {
    font-size: 14px;
    color: #666;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
}

.modal-content {
    background-color: white;
    margin: 5% auto;
    padding: 0;
    width: 80%;
    max-width: 900px;
    border-radius: 10px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.2);
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.close-modal {
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.close-modal:hover {
    color: #333;
}

.modal-body {
    padding: 20px;
    max-height: 60vh;
    overflow-y: auto;
}

.staff-list-actions {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.btn-select-all, .btn-deselect-all {
    padding: 8px 15px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

.btn-select-all:hover {
    background: #e3f2fd;
    border-color: #4a86e8;
}

.btn-deselect-all:hover {
    background: #fff5f5;
    border-color: #e74c3c;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.btn-cancel {
    padding: 10px 20px;
    border: 1px solid #ddd;
    background: white;
    border-radius: 5px;
    cursor: pointer;
}

.btn-generate {
    background: #4a86e8;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 5px;
}

/* Notifications */
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 15px 20px;
    border-radius: 5px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 10px;
    transform: translateX(120%);
    transition: transform 0.3s ease;
    z-index: 10000;
}

.notification.show {
    transform: translateX(0);
}

.notification-success {
    border-left: 4px solid #27ae60;
}

.notification-error {
    border-left: 4px solid #e74c3c;
}

.notification-info {
    border-left: 4px solid #3498db;
}

.notification-warning {
    border-left: 4px solid #f39c12;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #999;
    margin-left: auto;
}

/* Loading overlay */
#loadingOverlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    flex-direction: column;
}

#loadingOverlay i {
    font-size: 48px;
    color: #4a86e8;
    margin-bottom: 20px;
}

#loadingOverlay p {
    font-size: 16px;
    color: #333;
}

/* Responsive */
@media (max-width: 768px) {
    .summary-grid {
        grid-template-columns: 1fr;
    }
    
    .chart-section {
        grid-template-columns: 1fr;
    }
    
    .table-header {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
    }
    
    .table-actions {
        flex-direction: column;
    }
    
    .search-input {
        width: 100%;
    }
    
    .modal-content {
        width: 95%;
        margin: 10% auto;
    }
}
`;

// Add the CSS to the document
document.addEventListener('DOMContentLoaded', function () {
    const style = document.createElement('style');
    style.textContent = additionalCSS;
    document.head.appendChild(style);
});
// Force load dashboard on page load
window.addEventListener('load', function () {
    console.log('📈 Page fully loaded - forcing dashboard load');

    // Check if we're on dashboard page
    const dashboardPage = document.getElementById('dashboard-content');
    if (dashboardPage && dashboardPage.classList.contains('active')) {
        console.log('✅ Dashboard is active - loading data');
        loadDashboardData();
    }
});

// ===== TEST MONTHLY ATTENDANCE CONNECTION =====
async function testMonthlyAttendanceConnection() {
  try {
    console.log('🔍 Testing monthly attendance connection...');
    
    // Get first staff member for testing
    const staffData = await fetchAllStaffData();
    if (!staffData || staffData.length === 0) {
      console.log('❌ No staff data found');
      return;
    }
    
    const testStaff = staffData[0];
    const staffId = testStaff.staff_id || testStaff.id;
    
    console.log(`🧪 Testing with staff: ${testStaff.name} (${staffId})`);
    
    // Create test script element
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = 'testMonthlyCallback_' + Date.now();
      
      window[callbackName] = function(response) {
        console.log('📊 Monthly attendance test response:', response);
        
        // Clean up
        document.head.removeChild(script);
        delete window[callbackName];
        
        resolve(response);
      };
      
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();
      
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getMonthlyAttendance&staffId=${staffId}&month=${month}&year=${year}&callback=${callbackName}`;
      
      document.head.appendChild(script);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (script.parentNode) {
          reject(new Error('Test timeout'));
        }
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}
// ===== FETCH ALL STAFF DATA (Updated) =====
async function fetchAllStaffData() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Fetching all staff data...');

      const script = document.createElement('script');
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getStaff&callback=handleStaffData`;

      window.handleStaffData = function (response) {
        console.log('📊 Staff data response:', response);
        
        // Handle both response formats
        if (response.status === 'success' && response.data) {
          console.log(`✅ Found ${response.data.length} staff members`);
          resolve(response.data);
        } 
        // Also handle the getStaff() function format
        else if (response.data && Array.isArray(response.data)) {
          console.log(`✅ Found ${response.data.length} staff members (alternative format)`);
          resolve(response.data);
        }
        else {
          console.log('❌ Invalid response format:', response);
          reject(new Error('Invalid response format: ' + JSON.stringify(response)));
        }

        // Clean up
        document.head.removeChild(script);
        delete window.handleStaffData;
      };

      document.head.appendChild(script);

    } catch (error) {
      console.error('❌ Error in fetchAllStaffData:', error);
      reject(error);
    }
  });
}
// ===== DEBUG: CHECK STAFF SHEET STRUCTURE =====
function debugStaffSheetStructure() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Debugging Staff sheet structure...');
      
      const script = document.createElement('script');
      const callbackName = 'debugSheetCallback_' + Date.now();
      
      window[callbackName] = function(response) {
        console.log('📊 Sheet debug response:', response);
        
        // Clean up
        document.head.removeChild(script);
        delete window[callbackName];
        
        resolve(response);
      };
      
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=debugStaffSheet&callback=${callbackName}`;
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error('❌ Debug error:', error);
      reject(error);
    }
  });
}
// Test monthly attendance with actual staff ID
async function testMonthlyAttendanceWithRealId() {
  try {
    // First get sample staff IDs
    const sampleIds = await getSampleStaffIds();
    
    if (!sampleIds || sampleIds.length === 0) {
      console.log('❌ No staff IDs found');
      return;
    }
    
    // Use the first staff ID
    const staffId = sampleIds[0];
    console.log(`🧪 Testing monthly attendance for: ${staffId}`);
    
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const callbackName = 'monthlyTestCallback_' + Date.now();
      
      window[callbackName] = function(response) {
        console.log('📊 Monthly attendance response:', response);
        
        // Clean up
        document.head.removeChild(script);
        delete window[callbackName];
        
        resolve(response);
      };
      
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=getMonthlyAttendance&staffId=${staffId}&month=${month}&year=${year}&callback=${callbackName}`;
      
      script.onerror = function(error) {
        console.error('❌ Script error:', error);
        reject(error);
      };
      
      document.head.appendChild(script);
      
      // Timeout
      setTimeout(() => {
        if (script.parentNode) {
          reject(new Error('Timeout'));
        }
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testMonthlyAttendanceWithRealId().then(response => {
  if (response.success) {
    console.log(`✅ SUCCESS! Found ${response.count} attendance records`);
    if (response.records && response.records.length > 0) {
      console.log('Sample record:', response.records[0]);
    }
  } else {
    console.log('❌ FAILED:', response.message);
    if (response.debug) {
      console.log('Debug info:', response.debug);
    }
  }
}).catch(console.error);
// Debug Staff_Attendance sheet
function debugStaffAttendanceSheet() {
  return new Promise((resolve, reject) => {
    try {
      console.log('🔍 Debugging Staff_Attendance sheet...');
      
      const script = document.createElement('script');
      const callbackName = 'debugAttendanceCallback_' + Date.now();
      
      window[callbackName] = function(response) {
        console.log('📊 Staff_Attendance debug:', response);
        
        // Clean up
        document.head.removeChild(script);
        delete window[callbackName];
        
        resolve(response);
      };
      
      script.src = `https://script.google.com/macros/s/AKfycbzNgv7rzKaADN8cX8VUbdqR85cbWi_17KWc-34GasGAP7QOiAm0LlzcR3kd3Qi0sAIt/exec?action=debugStaffAttendanceSheet&callback=${callbackName}`;
      
      document.head.appendChild(script);
      
    } catch (error) {
      console.error('❌ Error:', error);
      reject(error);
    }
  });
}