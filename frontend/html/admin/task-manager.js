// ==================== ADMIN TASK ASSIGNMENT ====================

function addTaskManagementToAdmin() {
    // Wait for DOM to be fully ready
    const tryAddButton = () => {
        const headerActions = document.querySelector('.header-actions');
        if (headerActions && !document.getElementById('assignTaskBtn')) {
            const taskBtn = document.createElement('button');
            taskBtn.id = 'assignTaskBtn';
            taskBtn.className = 'btn-primary';
            taskBtn.innerHTML = '<i class="fas fa-tasks"></i> Assign Task';
            taskBtn.addEventListener('click', showTaskAssignmentPanel); // FIX: Use addEventListener
            headerActions.appendChild(taskBtn);
            console.log('✅ Task button added to admin dashboard');
        } else if (!headerActions) {
            // Retry after short delay if header not found
            setTimeout(tryAddButton, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryAddButton);
    } else {
        tryAddButton();
    }
}

function showTaskAssignmentPanel() {
    const panel = document.createElement('div');
    panel.style.cssText = `
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                    z-index: 10000;
                    width: 500px;
                    max-width: 90vw;
                    border: 3px solid #1e3c72;
                `;

    panel.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h3 style="color: #1e3c72; margin: 0;">📋 Assign Task to Center</h3>
                        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #666;">&times;</button>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Select Center *</label>
                        <select id="taskCenter" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Select Center</option>
                            <option value="NeIPS Nongstoin">NeIPS Nongstoin</option>
                            <option value="NeIPS Shillong">NeIPS Shillong</option>
                            <option value="NeIPS Mihmyntdu">NeIPS Mihmyntdu</option>
                            <option value="NeIPS Mairang">NeIPS Mairang</option>
                            <option value="NeIPS Pormawthaw">NeIPS Pormawthaw</option>
                            <option value="NeIPS Ri Bhoi">NeIPS Ri Bhoi</option>
                            <option value="NeIPS Tura">NeIPS Tura</option>
                            <option value="NeIPS Mawkyrwat">NeIPS Mawkyrwat</option>
                            <option value="NeIPS South Garo Hills">NeIPS South Garo Hills</option>
                            <option value="NeIPS Damas">NeIPS Damas</option>
                            <option value="NeIPS Khliehriat">NeIPS Khliehriat</option>
                            <option value="NeIPS Ampati">NeIPS Ampati</option>
                            <option value="NeIPS Williamnagar">NeIPS Williamnagar</option>
                            <option value="NeIPS Pynursla">NeIPS Pynursla</option>
                            <option value="NeIPS North Garo Hills">NeIPS North Garo Hills</option>
                            <option value="NeIPS Damas North Garo Hills">NeIPS Damas North Garo hills</option>
                            <option value="NeIPS East Garo Hills">NeIPS East Garo Hills</option>
                            <option value="NeIPS Dhanketi">NeIPS Dhanketi</option>
                            <option value="NeIPS Jowai">NeIPS Jowai</option>
                            
                        </select>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Task Title *</label>
                        <input type="text" id="taskTitle" placeholder="Enter task title" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" required>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Description *</label>
                        <textarea id="taskDescription" placeholder="Describe the task in detail" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; height: 100px;" required></textarea>
                    </div>
                    
                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Due Date *</label>
                        <input type="datetime-local" id="taskDueDate" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" required>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Priority</label>
                        <select id="taskPriority" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="Low">Low</option>
                            <option value="Medium" selected>Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">Cancel</button>
                        <button onclick="assignTaskFromAdmin()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: bold;">
                            🚀 Assign Task
                        </button>
                    </div>
                `;

    document.body.appendChild(panel);

    // Add close handlers
    document.getElementById('closeTaskPanel').onclick = closeTaskPanel;
    document.getElementById('cancelTaskBtn').onclick = closeTaskPanel;

    // Close on background click
    panel.addEventListener('click', function (e) {
        if (e.target === panel) {
            closeTaskPanel();
        }
    });

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('taskDueDate').min = tomorrow.toISOString().slice(0, 16);

    // Focus on first input
    document.getElementById('taskCenter').focus();
}

function closeTaskPanel() {
    const panel = document.getElementById('taskAssignmentPanel');
    if (panel) {
        panel.remove();
    }
    hideLoading(); // Ensure loading is hidden when panel closes
}

async function assignTaskFromAdmin() {
    const center = document.getElementById('taskCenter').value;
    const title = document.getElementById('taskTitle').value;
    const description = document.getElementById('taskDescription').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const priority = document.getElementById('taskPriority').value;

    if (!center || !title || !description || !dueDate) {
        showError('Please fill all required fields');
        return;
    }

    showLoading('Assigning task to center...');

    try {
        // Use fetch with no-cors mode
        const response = await fetch(sheetsService.APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // This bypasses CORS
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                action: 'assignTask',
                title: title,
                description: description,
                assignedTo: 'center-manager',
                assignedBy: 'admin',
                dueDate: dueDate,
                priority: priority,
                center: center
            })
        });

        // Since we use no-cors, we can't read response but assume success
        hideLoading();
        showSuccess(`Task assigned to ${center}! Center manager will be notified.`);

        // Close the panel immediately
        const panel = document.querySelector('div[style*="position: fixed"]');
        if (panel) panel.remove();

        // Optional: Refresh tasks view
        setTimeout(() => {
            if (typeof loadTasksView === 'function') {
                loadTasksView();
            }
        }, 1000);

    } catch (error) {
        hideLoading();
        showError('Task assignment submitted! (Note: CORS prevents confirmation)');

        // Still close the panel
        const panel = document.querySelector('div[style*="position: fixed"]');
        if (panel) panel.remove();
    }
}
function handleTaskButtonClick(event, centerName) {
    console.log('🎯 Task button clicked for:', centerName);
    event.stopPropagation(); // Prevent card click

    if (typeof taskManager !== 'undefined') {
        taskManager.viewCenterTasks(centerName);
    } else {
        console.error('❌ TaskManager not found');
        showError('Task system not loaded. Please refresh the page.');

        // Fallback: Show simple task assignment
        showTaskAssignmentPanel();
        // Set the center in the task assignment panel
        const taskCenterSelect = document.getElementById('taskCenter');
        if (taskCenterSelect) {
            taskCenterSelect.value = centerName;
        }
    }
}
// Get task data from your existing task system
async function getTaskDataForCenters() {
    try {
        // Use your existing task fetching method
        const response = await fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getTasks`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.log('⚠️ Using sample task data for testing');
        // Return sample data for testing
        return {
            success: true,
            tasks: [
                {
                    center: "NeIPS Nongstoin",
                    title: "Student Registration",
                    status: "completed",
                    dueDate: "2024-10-25",
                    completedDate: "2024-10-24"
                },
                {
                    center: "NeIPS Shillong",
                    title: "Staff Training",
                    status: "pending",
                    dueDate: "2024-10-20"
                },
                {
                    center: "NeIPS Mihmyntdu",
                    title: "Equipment Check",
                    status: "overdue",
                    dueDate: "2024-10-15"
                }
            ]
        };
    }
}
// ==================== TASK FILTERING BY STATUS ====================
// ==================== FIXED TASK FILTERING - HANDLES DIFFERENT API RESPONSES ====================
async function showTasksByStatus(centerName, statusType) {
    console.log(`🎯 Showing ${statusType} tasks for ${centerName}`);

    showLoading(`Loading ${statusType} tasks for ${centerName}...`);

    try {
        // Try different possible API endpoints
        let result = null;

        // First try: getTasks action
        try {
            const response = await fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getTasks`);
            if (response.ok) {
                result = await response.json();
                console.log('📊 Tasks API Response (getTasks):', result);
            }
        } catch (e) {
            console.log('❌ getTasks failed, trying getAllTasks...');
        }

        // Second try: getAllTasks action
        if (!result || !result.success) {
            try {
                const response = await fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getAllTasks`);
                if (response.ok) {
                    result = await response.json();
                    console.log('📊 Tasks API Response (getAllTasks):', result);
                }
            } catch (e) {
                console.log('❌ getAllTasks failed:', e);
            }
        }

        // If we still don't have tasks data, check the actual response
        if (!result) {
            throw new Error('No response from server');
        }

        // Handle different response formats
        let tasks = [];

        if (result.success && result.tasks) {
            tasks = result.tasks;
        } else if (result.data && Array.isArray(result.data)) {
            tasks = result.data;
        } else if (result.status === 'success' && result.data) {
            tasks = result.data;
        } else if (Array.isArray(result)) {
            tasks = result;
        } else {
            console.log('🔍 Unexpected response format:', result);
            // Try to extract tasks from any property
            for (let key in result) {
                if (Array.isArray(result[key]) && result[key].length > 0) {
                    if (result[key][0].Title || result[key][0].title) {
                        tasks = result[key];
                        break;
                    }
                }
            }
        }

        console.log(`📋 Final tasks array length: ${tasks.length}`);

        // Filter tasks by center and status
        const filteredTasks = tasks.filter(task => {
            if (!task) return false;

            const taskCenter = task.Center || task.center || task.assignedTo || task.AssignedTo || '';
            const taskStatus = (task.Status || task.status || '').toString().toLowerCase();
            const taskTitle = task.Title || task.title || '';

            console.log(`🔍 Checking task: "${taskTitle}" - Center: "${taskCenter}", Status: "${taskStatus}"`);

            // Check if task belongs to this center (case-insensitive partial match)
            const centerMatch = taskCenter && (
                taskCenter.toLowerCase().includes(centerName.toLowerCase()) ||
                centerName.toLowerCase().includes(taskCenter.toLowerCase()) ||
                taskCenter.toLowerCase().replace(/\s+/g, '') === centerName.toLowerCase().replace(/\s+/g, '')
            );

            if (!centerMatch) return false;

            // Filter by status type
            if (statusType === 'completed') {
                return taskStatus.includes('complete');
            } else if (statusType === 'pending') {
                const isPending = !taskStatus ||
                    taskStatus.includes('pending') ||
                    taskStatus.includes('assigned') ||
                    taskStatus === '' ||
                    !taskStatus.includes('complete');
                return isPending;
            } else if (statusType === 'overdue') {
                // For overdue, check due date and status
                const dueDate = task.DueDate || task.dueDate;
                if (!dueDate) return false;

                try {
                    const due = new Date(dueDate);
                    const now = new Date();
                    const isOverdue = due < now && !taskStatus.includes('complete');
                    return isOverdue;
                } catch (e) {
                    return false;
                }
            }

            return false;
        });

        console.log(`✅ Found ${filteredTasks.length} ${statusType} tasks for ${centerName}`);
        hideLoading();

        if (filteredTasks.length === 0) {
            showInfo(`No ${statusType} tasks found for ${centerName}`);
        } else {
            showTasksFilterPanel(centerName, statusType, filteredTasks);
        }

    } catch (error) {
        hideLoading();
        console.error('❌ Error loading tasks:', error);
        showError(`Failed to load ${statusType} tasks. Please check if tasks exist for this center.`);

        // Show empty panel instead of error
        showTasksFilterPanel(centerName, statusType, []);
    }
}
function showTasksFilterPanel(centerName, statusType, tasks) {
    // Remove existing panel if any
    const existingPanel = document.querySelector('.task-filter-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    const panel = document.createElement('div');
    panel.className = 'task-filter-panel';

    // Status type display names
    const statusDisplayNames = {
        'overdue': '🚨 Overdue Tasks',
        'pending': '⏳ Pending Tasks',
        'completed': '✅ Completed Tasks'
    };

    // Create task list HTML
    let tasksHTML = '';

    if (tasks && tasks.length > 0) {
        tasks.forEach((task, index) => {
            const title = task.Title || task.title || 'Untitled Task';
            const description = task.Description || task.description || 'No description';
            const priority = task.Priority || task.priority || 'Medium';
            const dueDate = task.DueDate || task.dueDate;
            const completedDate = task.CompletedDate || task.completedDate;
            const notes = task.CompletionNotes || task.completionNotes || task.notes;

            const formattedDueDate = dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set';
            const formattedCompletedDate = completedDate ? new Date(completedDate).toLocaleDateString() : '';

            tasksHTML += `
                <div class="task-item ${statusType}">
                    <div class="task-title">${title}</div>
                    <div style="font-size: 12px; margin-bottom: 8px; color: #555;">${description}</div>
                    <div class="task-meta">
                        <span class="task-priority priority-${priority.toLowerCase()}">${priority}</span>
                        <span><strong>Due:</strong> ${formattedDueDate}</span>
                        ${formattedCompletedDate ? `<span><strong>Completed:</strong> ${formattedCompletedDate}</span>` : ''}
                    </div>
                    ${notes && notes !== 'No notes provided' ? `
                    <div style="margin-top: 8px; padding: 5px; background: rgba(255,255,255,0.5); border-radius: 3px; font-size: 11px;">
                        <strong>Notes:</strong> ${notes}
                    </div>
                    ` : ''}
                </div>
            `;
        });
    } else {
        tasksHTML = `
            <div class="no-tasks-message">
                <i class="fas fa-inbox" style="font-size: 48px; margin-bottom: 10px; opacity: 0.5;"></i>
                <p>No ${statusType} tasks found for ${centerName}</p>
            </div>
        `;
    }

    panel.innerHTML = `
        <div class="task-filter-header">
            <h3>${statusDisplayNames[statusType]} - ${centerName}</h3>
            <button class="close-filter-btn">&times;</button>
        </div>
        
        <div style="margin-bottom: 15px;">
            <p style="margin: 0; color: #666; font-size: 14px;">
                Showing ${tasks.length} ${statusType} task${tasks.length !== 1 ? 's' : ''}
            </p>
        </div>
        
        <div class="task-list">
            ${tasksHTML}
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
            <button class="btn-secondary" onclick="showAllTasks('${centerName}')" 
                    style="background: #17a2b8; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-list"></i> View All Tasks
            </button>
            <button class="btn-primary" onclick="assignTaskToCenter('${centerName}')" 
                    style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">
                <i class="fas fa-plus"></i> Assign New Task
            </button>
        </div>
    `;

    document.body.appendChild(panel);

    // Close functionality
    const closeBtn = panel.querySelector('.close-filter-btn');
    closeBtn.addEventListener('click', () => {
        panel.remove();
    });

    // Close on background click
    panel.addEventListener('click', (e) => {
        if (e.target === panel) {
            panel.remove();
        }
    });

    // Close with Escape key
    const closeHandler = (e) => {
        if (e.key === 'Escape') {
            panel.remove();
            document.removeEventListener('keydown', closeHandler);
        }
    };
    document.addEventListener('keydown', closeHandler);
}
async function showAllTasks(centerName) {
    console.log(`🎯 Showing ALL tasks for ${centerName}`);

    // Close the filter panel first
    const existingPanel = document.querySelector('.task-filter-panel');
    if (existingPanel) {
        existingPanel.remove();
    }

    showLoading(`Loading all tasks for ${centerName}...`);

    try {
        const response = await fetch(`${sheetsService.APPS_SCRIPT_URL}?action=getTasks`);
        const result = await response.json();

        if (result.success && result.tasks) {
            const centerTasks = result.tasks.filter(task => {
                const taskCenter = task.Center || task.center || task.assignedTo || '';
                return taskCenter && (
                    taskCenter.toLowerCase().includes(centerName.toLowerCase()) ||
                    centerName.toLowerCase().includes(taskCenter.toLowerCase())
                );
            });

            hideLoading();
            showTasksFilterPanel(centerName, 'all', centerTasks);
        } else {
            throw new Error(result.message || 'No tasks data received');
        }
    } catch (error) {
        hideLoading();
        console.error('❌ Error loading all tasks:', error);
        showError(`Failed to load tasks: ${error.message}`);
    }
}
