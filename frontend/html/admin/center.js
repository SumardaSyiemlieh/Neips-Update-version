// Populate centers in all dropdowns
function populateCentersDropdowns() {
    const centerDropdowns = [
        document.getElementById('centerFilter'),
        document.getElementById('staffCenterFilter'),
        document.getElementById('staffCenter')
    ];

    centerDropdowns.forEach(dropdown => {
        if (dropdown) {
            // Clear existing options except the first one
            while (dropdown.options.length > 1) {
                dropdown.remove(1);
            }

            // Add centers to dropdown
            centers.forEach(center => {
                const option = document.createElement('option');
                option.value = center;
                option.textContent = center;
                dropdown.appendChild(option);
            });
        }
    });
}
// Populate courses dropdown
function populateCoursesDropdown() {
    const courseFilter = document.getElementById('courseFilter');

    if (courseFilter) {
        // Clear existing options except the first one
        while (courseFilter.options.length > 1) {
            courseFilter.remove(1);
        }

        // Add courses to dropdown
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course;
            option.textContent = course;
            courseFilter.appendChild(option);
        });
    }
}
// Update your loadCentersData function
// ==================== FIXED LOAD CENTERS DATA ====================
async function loadCentersData() {
    const centersGrid = document.getElementById('centersGrid');
    if (!centersGrid) {
        console.log('❌ Centers grid not found');
        return;
    }

    try {
        console.log('🔄 Loading centers data with simplified display...');

        // Show loading state
        centersGrid.innerHTML = `
            <div class="loading-center">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading centers data...</p>
            </div>
        `;

        // Get real data
        const [studentsResult, staffResult, taskResult] = await Promise.all([
            sheetsService.getAllStudents(),
            sheetsService.getAllStaff(),
            fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getAllTasks`).then(r => r.json()).catch(e => ({ success: false, tasks: [] }))
        ]);

        console.log('📊 Real data loaded for centers:', {
            students: studentsResult.students?.length || 0,
            staff: staffResult.data?.length || 0,
            tasks: taskResult.tasks?.length || 0
        });

        // Use real data to calculate centers
        const centers = await calculateCenterStats(studentsResult, staffResult, taskResult);

        // Display simplified centers
        displayCenters(centers);

    } catch (error) {
        console.error('❌ Error loading centers data:', error);
        centersGrid.innerHTML = `
            <div class="error-center">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Error loading centers data</p>
                <button onclick="loadCentersData()" class="btn-primary" style="margin-top: 10px;">Retry</button>
            </div>
        `;
    }
}// Get task data from your existing task system
// Update calculateCenterStats function
// ==================== FIXED CENTER STATS CALCULATION ====================
async function calculateCenterStats(studentsResult, staffResult, taskData) {
    const centers = [
        { id: 1, code: "NEIPS001", name: "NeIPS Nongstoin", location: "Nongstoin", status: "active" },
        { id: 2, code: "NEIPS002", name: "NeIPS Shillong", location: "Shillong", status: "active" },
        { id: 3, code: "NEIPS003", name: "NeIPS Mihmyntdu", location: "Mihmyntdu", status: "active" },
        { id: 4, code: "NEIPS004", name: "NeIPS Mairang", location: "Mairang", status: "active" },
        { id: 5, code: "NEIPS005", name: "NeIPS Pormawthaw", location: "Pormawthaw", status: "active" },
        { id: 6, code: "NEIPS006", name: "NeIPS Ri Bhoi", location: "Ri Bhoi", status: "active" },
        { id: 7, code: "NEIPS007", name: "NeIPS Tura", location: "Tura", status: "active" },
        { id: 8, code: "NEIPS008", name: "NeIPS Mawkyrwat", location: "Mawkyrwat", status: "active" },
        { id: 9, code: "NEIPS009", name: "NeIPS South Garo Hills", location: "South Garo Hills", status: "active" },
        { id: 10, code: "NEIPS010", name: "NeIPS Damas", location: "Damas", status: "active" },
        { id: 11, code: "NEIPS011", name: "NeIPS Khliehriat", location: "Khliehriat", status: "active" },
        { id: 12, code: "NEIPS012", name: "NeIPS Ampati", location: "Ampati", status: "active" },
        { id: 13, code: "NEIPS013", name: "NeIPS Williamnagar", location: "Williamnagar", status: "active" },
        { id: 14, code: "NEIPS014", name: "NeIPS Pynursla", location: "Pynursla", status: "active" },
        { id: 15, code: "NEIPS015", name: "NeIPS Damas North Garo Hills", location: "North Garo Hills", status: "active" },
        { id: 16, code: "NEIPS016", name: "NeIPS East Garo Hills", location: "East Garo Hills", status: "active" },
        { id: 17, code: "NEIPS017", name: "NeIPS Dhanketi", location: "Dhanketi", status: "active" },
        { id: 18, code: "NEIPS018", name: "NeIPS Jowai", location: "Jowai", status: "active" }
    ];

    // Initialize counts
    centers.forEach(center => {
        center.students = 0;
        center.staff = 0;
        center.tasks = 0;
        center.taskStatus = null;
    });

    console.log('🔍 Counting students per center...');

    // Count students per center - FIXED VERSION
    if (studentsResult.success && studentsResult.students) {
        studentsResult.students.forEach(student => {
            // Check multiple possible column names for center/address
            const studentCenter = student['Address'] || student['Center'] || student['address'] || student['center'] || student['Training Center'] || '';

            if (studentCenter) {
                // Find matching center (case insensitive and partial matching)
                const center = centers.find(c => {
                    const centerName = c.name.toLowerCase();
                    const studentCenterLower = studentCenter.toLowerCase();

                    // Check if student center contains center name or vice versa
                    return studentCenterLower.includes(centerName) ||
                        centerName.includes(studentCenterLower) ||
                        studentCenterLower.includes(c.location.toLowerCase()) ||
                        c.location.toLowerCase().includes(studentCenterLower);
                });

                if (center) {
                    center.students++;
                    console.log(`✅ Student assigned to ${center.name}: ${student['Name'] || 'Unknown'}`);
                } else {
                    console.log(`❌ No center found for student address: "${studentCenter}"`);
                }
            } else {
                console.log('❌ Student has no center/address data:', student['Name'] || 'Unknown');
            }
        });
    } else {
        console.log('❌ No students data found in result');
    }

    // Count staff per center
    if (staffResult.status === 'success' && staffResult.data) {
        staffResult.data.forEach(staff => {
            const staffCenter = staff.center || staff['Center'] || staff['address'] || '';
            if (staffCenter) {
                const center = centers.find(c => {
                    const centerName = c.name.toLowerCase();
                    const staffCenterLower = staffCenter.toLowerCase();
                    return staffCenterLower.includes(centerName) ||
                        centerName.includes(staffCenterLower);
                });
                if (center) {
                    center.staff++;
                }
            }
        });
    }

    // Calculate task status for each center
    // ==================== REAL TASK COUNTING - UPDATED ====================
    // Calculate task status for each center
    if (taskData && taskData.success && taskData.tasks) {
        centers.forEach(center => {
            center.taskStatus = calculateTaskStatusForCenter(center.name, taskData.tasks);

            // Count total tasks - IMPROVED MATCHING
            const centerTasks = taskData.tasks.filter(task => {
                const taskCenter = task.Center || task.center || task.assignedTo || '';
                if (!taskCenter) return false;

                const taskCenterLower = taskCenter.toLowerCase().trim();
                const centerNameLower = center.name.toLowerCase().trim();

                // Better matching: check if task center contains center name or vice versa
                return taskCenterLower.includes(centerNameLower) ||
                    centerNameLower.includes(taskCenterLower) ||
                    taskCenterLower.includes(center.location.toLowerCase()) ||
                    center.location.toLowerCase().includes(taskCenterLower);
            });

            center.tasks = centerTasks.length;
            console.log(`📍 ${center.name}: ${center.tasks} real tasks from database`);
        });
    } else {
        console.log('⚠️ No task data available');
        centers.forEach(center => center.tasks = 0);
    }

    // Log final counts for debugging
    console.log('📊 FINAL CENTER COUNTS:');
    centers.forEach(center => {
        console.log(`   ${center.name}: ${center.students} students, ${center.staff} staff`);
    });

    return centers;
}
// Calculate task status for each center
// ==================== DOT-BASED TASK STATUS CALCULATION ====================
// ==================== FIXED TASK STATUS CALCULATION ====================
// ==================== MULTIPLE DOTS TASK STATUS CALCULATION ====================
// ==================== IMPROVED TASK STATUS CALCULATION ====================
// ==================== ENHANCED TASK STATUS CALCULATION ====================
function calculateTaskStatusForCenter(centerName, tasks) {
    if (!tasks || tasks.length === 0) return null;

    const centerTasks = tasks.filter(task => {
        const taskCenter = task.Center || task.center || task.assignedTo;
        return taskCenter && (
            taskCenter.includes(centerName) ||
            centerName.includes(taskCenter)
        );
    });

    if (centerTasks.length === 0) return null;

    const now = new Date();
    let completed = 0, overdue = 0, pending = 0;

    centerTasks.forEach(task => {
        const dueDate = new Date(task.DueDate || task.dueDate);
        const taskStatus = task.Status || task.status;
        const isCompleted = taskStatus === 'completed' || taskStatus === 'Completed';
        const isOverdue = !isCompleted && dueDate < now;

        if (isCompleted) {
            completed++;
        } else if (isOverdue) {
            overdue++;
        } else {
            pending++;
        }
    });

    console.log(`📊 ${centerName} - Completed: ${completed}, Overdue: ${overdue}, Pending: ${pending}`);

    return {
        completed: {
            count: completed,
            tooltip: `✅ ${completed} task${completed > 1 ? 's' : ''} completed`,
            displayNumber: completed
        },
        overdue: {
            count: overdue,
            tooltip: `🚨 ${overdue} task${overdue > 1 ? 's' : ''} overdue!`,
            displayNumber: overdue
        },
        pending: {
            count: pending,
            tooltip: `⏳ ${pending} task${pending > 1 ? 's' : ''} pending`,
            displayNumber: pending
        },
        totalTasks: centerTasks.length
    };
}
function viewCenterDetails(centerId, centerName) {
    console.log(`🎯 Opening center details for: ${centerName}`);

    showLoading(`Loading ${centerName} details...`);

    // In the future, this will show student, staff, and task details
    // For now, show a simple modal with basic info
    setTimeout(() => {
        hideLoading();

        // Create center details modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 3000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="color: #1e3c72; margin: 0;">${centerName}</h2>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">&times;</button>
                </div>
                
                <div style="margin-bottom: 25px;">
                    <h3 style="color: #1e3c72; margin-bottom: 15px;">Center Overview</h3>
                    <p>Detailed student, staff, and task information will be displayed here.</p>
                    <p><strong>Coming Soon:</strong></p>
                    <ul style="margin-left: 20px;">
                        <li>Student enrollment details</li>
                        <li>Staff management</li>
                        <li>Task progress tracking</li>
                        <li>Performance analytics</li>
                    </ul>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="assignTaskToCenter('${centerName}')" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        <i class="fas fa-tasks"></i> Assign Task
                    </button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }, 1000);
}
function viewCenterDetails(centerId, centerName) {
    console.log(`🎯 Opening staff dashboard for: ${centerName}`);

    // Store center information in localStorage for the staff dashboard
    localStorage.setItem('currentCenter', centerName);
    localStorage.setItem('centerCode', centerId);

    // Navigate to staff dashboard in the staff folder - SAME TAB
    const staffDashboardURL = `staff/staff-dashboard.html?center=${encodeURIComponent(centerName)}`;

    console.log('🔗 Opening staff dashboard in same tab:', staffDashboardURL);
    window.location.href = staffDashboardURL; // Opens in same tab
}
// View center reports
function viewCenterReports(centerName) {
    showLoading(`Generating report for ${centerName}...`);

    setTimeout(() => {
        hideLoading();
        showSuccess(`Report generated for ${centerName}!`);

        // You can implement PDF generation or detailed reporting here
        const reportContent = `
                <h2>Center Report: ${centerName}</h2>
                <p>Report Date: ${new Date().toLocaleDateString()}</p>
                <p>This is a sample report for ${centerName}.</p>
                <p>Detailed analytics and reports will be implemented here.</p>
            `;

        generatePDF(reportContent, `Center_Report_${centerName.replace(/\s+/g, '_')}.pdf`);
    }, 1500);
}
// Export centers data
function exportCentersData() {
    showLoading('Exporting centers data...');

    setTimeout(() => {
        hideLoading();
        showSuccess('Centers data exported successfully!');

        // Create CSV content
        let csvContent = "Center Code,Center Name,Location,Students,Staff,Status\n";

        centersData.forEach(center => {
            csvContent += `"${center.code}","${center.name}","${center.location}",${center.students},${center.staff},"${center.status}"\n`;
        });

        // Create and download CSV file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `NEIPS_Centers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }, 1000);
}
// NEW FUNCTION: Navigate to staff dashboard in staff folder - SAME TAB
function navigateToStaffDashboard(centerName) {
    // Store center information
    localStorage.setItem('currentCenter', centerName);

    // Navigate to staff dashboard in the staff folder - SAME TAB
    const staffDashboardURL = `staff/staff-dashboard.html?center=${encodeURIComponent(centerName)}`;

    console.log('🔗 Opening staff dashboard in same tab:', staffDashboardURL);
    window.location.href = staffDashboardURL; // Same tab navigation
}
function addSimplifiedCenterStyles() {
    const styleId = 'simplified-center-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
        .center-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            border: 2px solid #e9ecef;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        .center-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            border-color: #1e3c72;
        }

        .center-card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }

        .center-code {
            background: #1e3c72;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
        }

        .center-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3c72;
            margin-bottom: 10px;
            line-height: 1.3;
        }

        .center-status-container {
            position: absolute;
            top: 15px;
            right: 15px;
        }

        .dots-row {
            display: flex;
            gap: 5px;
        }

        .center-status-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }

        .center-status-dot:hover {
            transform: scale(1.3);
        }

        .center-status-dot.overdue {
            background: #dc3545;
            color: white;
        }

        .center-status-dot.pending {
            background: #ffc107;
            color: black;
        }

        .center-status-dot.completed {
            background: #28a745;
            color: white;
        }

        .status-dot-tooltip {
            display: none;
            position: absolute;
            background: #333;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 5px;
        }

        .center-status-dot:hover .status-dot-tooltip {
            display: block;
        }

        /* Loading and empty states */
        .loading-center, .error-center {
            text-align: center;
            padding: 40px 20px;
            color: #666;
        }

        .loading-center i, .error-center i {
            font-size: 48px;
            margin-bottom: 10px;
            display: block;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
// ==================== UPDATED DISPLAY CENTERS WITH MULTIPLE DOTS ====================
// ==================== UPDATED DISPLAY CENTERS WITH DOT NAMES AND CLICK HANDLERS ====================
// ==================== UPDATED DISPLAY CENTERS - DOTS AT TOP RIGHT ====================
// ==================== SIMPLIFIED CENTER DISPLAY ====================
// ==================== ENHANCED DISPLAY CENTERS WITH NUMBERED DOTS AND NAMES ====================
// ==================== CLEAN CENTER DISPLAY WITH FIXED SIZE DOTS ====================
function displayCenters(centers) {
    const centersGrid = document.getElementById('centersGrid');
    if (!centersGrid) return;

    centersGrid.innerHTML = '';

    if (!centers || centers.length === 0) {
        centersGrid.innerHTML = `
            <div class="loading-center">
                <i class="fas fa-building" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p>No centers found in database</p>
            </div>
        `;
        return;
    }

    console.log('🏢 Displaying clean center cards:', centers);

    centers.forEach(center => {
        const centerCard = document.createElement('div');
        centerCard.className = 'center-card';
        centerCard.onclick = () => viewCenterDetails(center.id, center.name);

        // Create status container with dots and labels together
        let statusHTML = '';

        if (center.taskStatus) {
            const overdueCount = center.taskStatus.overdue.count;
            const pendingCount = center.taskStatus.pending.count;
            const completedCount = center.taskStatus.completed.count;

            // Only show if there are tasks
            if (overdueCount > 0 || pendingCount > 0 || completedCount > 0) {
                statusHTML = `
                    <div class="center-status-container">
                        <div class="center-status-dots">
                            ${overdueCount > 0 ? `
                            <div class="center-status-dot overdue" 
                                 onclick="event.stopPropagation(); showTasksByStatus('${center.name}', 'overdue')"
                                 title="${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}">
                                ${overdueCount}
                                <div class="status-dot-tooltip">${overdueCount} overdue task${overdueCount > 1 ? 's' : ''}</div>
                            </div>
                            ` : ''}
                            
                            ${pendingCount > 0 ? `
                            <div class="center-status-dot pending" 
                                 onclick="event.stopPropagation(); showTasksByStatus('${center.name}', 'pending')"
                                 title="${pendingCount} pending task${pendingCount > 1 ? 's' : ''}">
                                ${pendingCount}
                                <div class="status-dot-tooltip">${pendingCount} pending task${pendingCount > 1 ? 's' : ''}</div>
                            </div>
                            ` : ''}
                            
                            ${completedCount > 0 ? `
                            <div class="center-status-dot completed" 
                                 onclick="event.stopPropagation(); showTasksByStatus('${center.name}', 'completed')"
                                 title="${completedCount} completed task${completedCount > 1 ? 's' : ''}">
                                ${completedCount}
                                <div class="status-dot-tooltip">${completedCount} completed task${completedCount > 1 ? 's' : ''}</div>
                            </div>
                            ` : ''}
                        </div>
                        <div class="status-labels">
                            ${overdueCount > 0 ? '<div class="status-label overdue">Overdue</div>' : ''}
                            ${pendingCount > 0 ? '<div class="status-label pending">Pending</div>' : ''}
                            ${completedCount > 0 ? '<div class="status-label completed">Done</div>' : ''}
                        </div>
                    </div>
                `;
            }
        }

        centerCard.innerHTML = `
            ${statusHTML}
            
            <div class="center-card-header">
                <div class="center-code">${center.code}</div>
            </div>
            
            <div class="center-name">${center.name}</div>
            <div class="center-location">${center.location}</div>
            
            <div class="center-stats">
                <div class="stat-item">
                    <span class="stat-number">${center.students}</span>
                    <span class="stat-label">Students</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${center.staff}</span>
                    <span class="stat-label">Staff</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${center.tasks}</span>
                    <span class="stat-label">Tasks</span>
                </div>
            </div>
            
            <div class="center-actions">
                <button class="center-action-btn task" onclick="event.stopPropagation(); assignTaskToCenter('${center.name}')">
                    <i class="fas fa-tasks"></i> Assign Task
                </button>
                <button class="center-action-btn report" onclick="event.stopPropagation(); viewCenterReports('${center.name}')">
                    <i class="fas fa-chart-bar"></i> Reports
                </button>
            </div>
        `;

        centersGrid.appendChild(centerCard);
    });
}
// ==================== GET REAL TASK COUNTS FROM DATABASE ====================
async function getRealTaskCounts() {
    try {
        console.log('📋 Fetching REAL task counts from database...');
        const response = await fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getTasks`);
        const result = await response.json();

        if (result.success && result.tasks && Array.isArray(result.tasks)) {
            console.log(`✅ Found ${result.tasks.length} real tasks in database`);

            // Count tasks by center
            const taskCounts = {};
            result.tasks.forEach(task => {
                const center = task.Center || task.center || task.assignedTo || 'Unknown';
                if (!taskCounts[center]) taskCounts[center] = 0;
                taskCounts[center]++;
            });

            console.log('📊 REAL TASK COUNTS BY CENTER:', taskCounts);
            return taskCounts;
        } else {
            console.log('⚠️ No tasks found in database');
            return {};
        }
    } catch (error) {
        console.log('❌ Error fetching task counts:', error);
        return {};
    }
}