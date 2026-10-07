// Google Sheets Service
class GoogleSheetsService {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFml0BcyagXy_ZU3ISZCdz1wP0qG_geyaucj9GtSeNJ3U2A3-bMEFH4RDHXH4bSuXZ/exec';
    }
    // Batch Approval Methods for Google Sheets
    // In your GoogleSheetsService class in admin.js:

    // Batch Approval Methods for Google Sheets
    async getBatchApprovals() {
        try {
            console.log('📋 Fetching batch approvals from Google Sheets...');
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getBatchApprovals`);
            const result = await response.json();
            console.log('📊 Batch approvals API response:', result);
            return result;
        } catch (error) {
            console.error('❌ Error fetching batch approvals:', error);
            throw new Error('Failed to fetch batch approvals: ' + error.message);
        }
    }

    async updateBatchApproval(batchId, approvalData) {
        try {
            console.log('✅ Updating batch approval:', batchId, approvalData);

            const params = new URLSearchParams({
                action: 'updateBatchApproval',
                batchId: batchId,
                approvalStatus: approvalData.status,
                approvedBy: 'admin',
                approvedDate: new Date().toISOString()
            });

            if (approvalData.notes) {
                params.append('approvalNotes', approvalData.notes);
            }

            const response = await fetch(`${this.APPS_SCRIPT_URL}?${params.toString()}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('❌ Error updating batch approval:', error);
            throw new Error('Failed to update batch approval: ' + error.message);
        }
    }

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

    async getAllStaff() {
        try {
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getStaff`);
            const result = await response.json();
            console.log('🔍 RAW STAFF DATA FROM GOOGLE SHEETS:', result);
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script fetch staff error:', error);
            throw new Error('Failed to fetch staff: ' + error.message);
        }
    }

    async addStaffMember(staffData) {
        try {
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
            return result;
        } catch (error) {
            console.error('❌ Google Apps Script add staff error:', error);
            throw new Error('Failed to add staff: ' + error.message);
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
}


// ==================== FIXED ADMIN NOTIFICATION SYSTEM ====================
class AdminNotificationSystem {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFml0BcyagXy_ZU3ISZCdz1wP0qG_geyaucj9GtSeNJ3U2A3-bMEFH4RDHXH4bSuXZ/exec';
        this.polling = null;
        this.processedCompletions = new Set();
        this.init();
    }

    init() {
        this.ensureNotificationStyles();
        this.startCompletionPolling();
        console.log('🔔 Fixed Admin notification system started');
    }

    ensureNotificationStyles() {
        if (!document.getElementById('admin-notification-styles')) {
            const styles = `
                            .admin-completion-notification {
                                position: fixed;
                                top: 20px;
                                right: 20px;
                                background: linear-gradient(135deg, #28a745, #20c997);
                                color: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                                border-left: 5px solid #ffd700;
                                z-index: 10000;
                                max-width: 400px;
                                animation: slideInRight 0.5s ease-out;
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            }
                            
                            .admin-completion-notification.fade-out {
                                animation: slideOutRight 0.5s ease-in forwards;
                            }
                            
                            @keyframes slideInRight {
                                from {
                                    transform: translateX(100%);
                                    opacity: 0;
                                }
                                to {
                                    transform: translateX(0);
                                    opacity: 1;
                                }
                            }
                            
                            @keyframes slideOutRight {
                                from {
                                    transform: translateX(0);
                                    opacity: 1;
                                }
                                to {
                                    transform: translateX(100%);
                                    opacity: 0;
                                }
                            }
                        `;
            const styleSheet = document.createElement('style');
            styleSheet.id = 'admin-notification-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    startCompletionPolling() {
        // Check every 5 seconds
        this.polling = setInterval(() => {
            this.checkForCompletedTasks();
        }, 5000);

        console.log('🔄 Admin completion polling started (5s interval)');
        this.checkForCompletedTasks(); // Check immediately
    }
    // In AdminNotificationSystem class - update this method
    async checkForCompletedTasks() {
        try {
            console.log('🔔 ADMIN: Checking for completed tasks...');

            // Add timestamp to prevent caching
            const timestamp = Date.now();
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getCompletedTasksForAdmin&timestamp=${timestamp}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            console.log('📊 ADMIN: Completed tasks response:', result);

            if (result.success && result.completedTasks && result.completedTasks.length > 0) {
                console.log(`🎯 ADMIN: Found ${result.completedTasks.length} completed tasks`);

                // Process each completed task
                result.completedTasks.forEach(task => {
                    const taskId = task.TaskID || task.taskId;

                    if (taskId && !this.processedCompletions.has(taskId)) {
                        console.log('🆕 NEW completion for admin:', task);
                        this.showCompletionPopup(task);
                        this.processedCompletions.add(taskId);

                        // Mark as seen in database (optional)
                        this.markCompletionAsSeen(taskId);
                    }
                });
            } else {
                console.log('📭 ADMIN: No new completed tasks found');
                if (result.debugInfo) {
                    console.log('🔍 Debug info:', result.debugInfo);
                }
            }

        } catch (error) {
            console.error('❌ ADMIN: Error checking completions:', error);
        }
    }

    // Add this method to mark completions as seen
    markCompletionAsSeen(taskId) {
        try {
            // Optional: Send to Google Sheets to mark as seen
            fetch(`${this.APPS_SCRIPT_URL}?action=updateCompletionSeenStatus&taskId=${taskId}`, {
                method: 'POST'
            }).catch(e => console.log('Mark seen failed:', e));
        } catch (error) {
            console.log('Error marking completion as seen:', error);
        }
    }

    showCompletionPopup(task) {
        const taskId = task.TaskID || task.taskId;

        // Check if notification already exists
        if (document.getElementById(`admin-completion-${taskId}`)) {
            return;
        }

        console.log('🎉 CREATING ADMIN POPUP FOR:', task.Title || task.title);

        const notification = document.createElement('div');
        notification.id = `admin-completion-${taskId}`;
        notification.className = 'admin-completion-notification';

        const title = this.escapeHtml(task.Title || task.title || 'Untitled Task');
        const description = this.escapeHtml(task.Description || task.description || 'No description');
        const center = task.Center || task.center || 'Unknown Center';
        const priority = task.Priority || task.priority || 'Medium';
        const notes = task.CompletionNotes || task.completionNotes || task.notes;
        const completedDate = task.CompletedDate ? new Date(task.CompletedDate).toLocaleString() : 'Just now';

        notification.innerHTML = `
                        <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <div style="background: rgba(255,255,255,0.3); padding: 10px; border-radius: 50%; margin-right: 12px;">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <strong style="font-size: 16px;">✅ Task Completed!</strong>
                        </div>
                        <div style="font-size: 14px; line-height: 1.5;">
                            <div style="font-weight: bold; margin-bottom: 8px; font-size: 16px;">${title}</div>
                            <div style="margin: 8px 0; opacity: 0.9;">${description}</div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px; font-size: 12px;">
                                <div><strong>Completed by:</strong> ${center}</div>
                                <div><strong>Priority:</strong> <span style="color: #ffdd59;">${priority}</span></div>
                                <div><strong>Completed at:</strong> ${completedDate}</div>
                            </div>
                            ${notes && notes !== 'No notes provided' ? `
                            <div style="margin-top: 8px; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 4px; font-size: 12px;">
                                <strong>Completion Notes:</strong> ${this.escapeHtml(notes)}
                            </div>
                            ` : ''}
                        </div>
                        <div style="margin-top: 15px; display: flex; justify-content: flex-end;">
                            <button onclick="this.closest('.admin-completion-notification').remove()" 
                                    style="background: rgba(255,255,255,0.3); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: bold;">
                                ❌ Dismiss
                            </button>
                        </div>
                    `;

        document.body.appendChild(notification);
        console.log('✅ ADMIN POPUP ADDED TO BODY');

        // Auto-remove after 15 seconds
        setTimeout(() => {
            const existingNotification = document.getElementById(`admin-completion-${taskId}`);
            if (existingNotification) {
                existingNotification.classList.add('fade-out');
                setTimeout(() => {
                    if (existingNotification.parentNode) {
                        existingNotification.remove();
                    }
                }, 500);
            }
        }, 15000);

        this.playNotificationSound();
    }

    playNotificationSound() {
        try {
            // Create a simple notification sound
            const audio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");
            audio.play().catch(e => console.log('Audio play failed:', e));
        } catch (e) {
            console.log('Notification sound not supported');
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize admin notifications when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM Content Loaded - Initializing fixed admin notifications...');

    // Wait a bit to ensure everything is loaded
    setTimeout(() => {
        try {
            window.adminNotifications = new AdminNotificationSystem();
            console.log('✅ Fixed admin notifications initialized successfully');

            // Test function - you can remove this later
            window.testAdminNotification = function () {
                const testTask = {
                    TaskID: 'TEST_' + Date.now(),
                    Title: 'TEST TASK COMPLETED - ' + new Date().toLocaleTimeString(),
                    Description: 'This is a test completed task from staff',
                    Center: 'NeIPS Nongstoin',
                    Priority: 'High',
                    CompletionNotes: 'Test completion notes from staff member',
                    CompletedDate: new Date().toISOString()
                };

                window.adminNotifications.showCompletionPopup(testTask);
                console.log('✅ Test notification shown in admin!');
            };

        } catch (error) {
            console.error('❌ Failed to initialize admin notifications:', error);
        }
    }, 2000);
});// Test function
window.testAdminNotification = function () {
    if (window.adminNotifications) {
        const testTask = {
            TaskID: 'TEST_' + Date.now(),
            Title: 'TEST TASK COMPLETED',
            Description: 'This is a test completed task from staff',
            Center: 'NeIPS Nongstoin',
            Priority: 'High',
            CompletionNotes: 'Test completion notes from staff member',
            CompletedDate: new Date().toISOString()
        };

        window.adminNotifications.showCompletionPopup(testTask);
        console.log('✅ Test notification shown in admin!');
    } else {
        console.log('❌ Admin notifications not initialized yet');
    }
};
// ==================== REAL-TIME TASK NOTIFICATION SYSTEM ====================
class RealTimeTaskNotification {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyg5nMA_o71GB0McoKkWO29pvpYHxbikw0czlpIvJXh-rA50YWmc08Jyp1TGEJcCbsa/exec';
        this.pollingInterval = null;
        this.processedTasks = new Set();
        this.init();
    }

    init() {
        this.startRealTimePolling();
        console.log('🔄 Real-time task notification system started (DOTS ONLY)');
    }

    startRealTimePolling() {
        // Check every 3 seconds for new completions
        this.pollingInterval = setInterval(() => {
            this.checkForNewCompletions();
        }, 3000);

        // Check immediately
        setTimeout(() => {
            this.checkForNewCompletions();
        }, 1000);

        console.log('🔄 Real-time polling started (3s interval)');
    }

    async checkForNewCompletions() {
        try {
            const timestamp = Date.now();
            const response = await fetch(
                `${this.APPS_SCRIPT_URL}?action=getCompletedTasksForAdmin&timestamp=${timestamp}`
            );

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const result = await response.json();

            if (result.success && result.completedTasks && result.completedTasks.length > 0) {
                console.log(`🆕 Found ${result.completedTasks.length} completed tasks`);

                // Process new completions
                result.completedTasks.forEach(task => {
                    const taskId = task.TaskID || task.taskId;

                    if (taskId && !this.processedTasks.has(taskId)) {
                        console.log('🎯 NEW TASK COMPLETION:', task);
                        this.updateCenterCard(task);
                        this.processedTasks.add(taskId);
                    }
                });
            }
        } catch (error) {
            console.error('❌ Error checking new completions:', error);
        }
    }

    updateCenterCard(task) {
        const centerName = task.Center || task.center;
        if (!centerName) return;

        // Find the center card for this center
        const centerCards = document.querySelectorAll('.center-card');
        centerCards.forEach(card => {
            const cardCenterElement = card.querySelector('.center-name');
            if (cardCenterElement && cardCenterElement.textContent.includes(centerName)) {
                this.highlightCenterCard(card, centerName);
            }
        });
    }

    // ==================== UPDATED REAL-TIME CARD HIGHLIGHT ====================
    // ==================== UPDATED REAL-TIME CARD HIGHLIGHT WITH NUMBERS ====================
    // ==================== UPDATED REAL-TIME NOTIFICATION WITH FIXED DOT SIZES ====================
    highlightCenterCard(card, centerName, taskStatus = 'completed') {
        // Add animation for new completion
        if (taskStatus === 'completed') {
            card.classList.add('center-card-new-completion');
        }

        // Find or create dots container
        let dotsContainer = card.querySelector('.center-status-dots');
        if (!dotsContainer) {
            dotsContainer = document.createElement('div');
            dotsContainer.className = 'center-status-dots';
            card.appendChild(dotsContainer);
        }

        // Find or create the specific status dot
        let statusDot = dotsContainer.querySelector(`.center-status-dot.${taskStatus}`);

        if (!statusDot) {
            // Create new dot
            statusDot = document.createElement('div');
            statusDot.className = `center-status-dot ${taskStatus}`;
            statusDot.onclick = (event) => {
                event.stopPropagation();
                showTasksByStatus(centerName, taskStatus);
            };
            statusDot.innerHTML = `
            1
            <div class="status-dot-tooltip">1 ${taskStatus} task</div>
        `;
            dotsContainer.appendChild(statusDot);

            // Add status label if it doesn't exist
            this.addStatusLabel(card, taskStatus);
        } else {
            // Update existing dot number only
            const currentNumber = parseInt(statusDot.textContent) || 1;
            const newNumber = currentNumber + 1;

            statusDot.innerHTML = `
            ${newNumber}
            <div class="status-dot-tooltip">${newNumber} ${taskStatus} task${newNumber > 1 ? 's' : ''}</div>
        `;
        }

        // Remove animation after 2 seconds
        setTimeout(() => {
            card.classList.remove('center-card-new-completion');
        }, 2000);
    }

    // Helper to add status labels
    addStatusLabel(card, statusType) {
        let labelsContainer = card.querySelector('.status-labels');
        if (!labelsContainer) {
            labelsContainer = document.createElement('div');
            labelsContainer.className = 'status-labels';

            // Insert before actions
            const actions = card.querySelector('.center-actions');
            if (actions) {
                card.insertBefore(labelsContainer, actions);
            } else {
                card.appendChild(labelsContainer);
            }
        }

        const labelName = this.getStatusDisplayName(statusType);
        const existingLabel = labelsContainer.querySelector(`.status-label.${statusType}`);

        if (!existingLabel) {
            const label = document.createElement('div');
            label.className = `status-label ${statusType}`;
            label.textContent = labelName;
            labelsContainer.appendChild(label);
        }
    }

    getStatusDisplayName(statusType) {
        const displayNames = {
            'overdue': 'Overdue',
            'pending': 'Pending',
            'completed': 'Done'
        };
        return displayNames[statusType] || statusType;
    }
}
// Task Status Management System
class TaskStatusSystem {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyxUsrDaqJK3GKvZj0ifKiAoF7zFYviA_tZouPiWvrBAJGWsy4JLq_187JxxLU_UXs7/exec';
    }

    // Get task status for all centers
    async getCenterTaskStatus() {
        try {
            console.log('📋 Fetching task status for centers...');
            const response = await fetch(`${this.APPS_SCRIPT_URL}?action=getCenterTasksStatus`);
            const result = await response.json();
            console.log('📊 Task status response:', result);
            return result;
        } catch (error) {
            console.error('❌ Error fetching task status:', error);
            return { success: false, tasks: [] };
        }
    }

    // Calculate task status for each center
    calculateTaskStatus(tasks, centerName) {
        const centerTasks = tasks.filter(task =>
            task.center === centerName || task.assignedTo === centerName
        );

        if (centerTasks.length === 0) {
            return null; // No tasks for this center
        }

        const now = new Date();
        let hasOverdue = false;
        let hasCompleted = false;
        let latestTask = null;

        centerTasks.forEach(task => {
            const dueDate = new Date(task.dueDate);
            const isCompleted = task.status === 'completed' || task.status === 'Completed';
            const isOverdue = !isCompleted && dueDate < now;

            if (isCompleted) {
                hasCompleted = true;
            } else if (isOverdue) {
                hasOverdue = true;
            }

            // Track the most recent task
            if (!latestTask || new Date(task.createdAt) > new Date(latestTask.createdAt)) {
                latestTask = task;
            }
        });

        // Priority: Overdue > Completed > Pending
        if (hasOverdue) {
            const overdueTasks = centerTasks.filter(task => {
                const dueDate = new Date(task.dueDate);
                const isCompleted = task.status === 'completed' || task.status === 'Completed';
                return !isCompleted && dueDate < now;
            });
            return {
                type: 'overdue',
                message: `🚨 ${overdueTasks.length} task${overdueTasks.length > 1 ? 's' : ''} overdue!`,
                count: overdueTasks.length
            };
        } else if (hasCompleted) {
            const completedTasks = centerTasks.filter(task =>
                task.status === 'completed' || task.status === 'Completed'
            );
            return {
                type: 'completed',
                message: `✅ ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} completed!`,
                count: completedTasks.length
            };
        } else {
            const pendingTasks = centerTasks.filter(task =>
                !(task.status === 'completed' || task.status === 'Completed')
            );
            return {
                type: 'pending',
                message: `⏳ ${pendingTasks.length} task${pendingTasks.length > 1 ? 's' : ''} pending`,
                count: pendingTasks.length
            };
        }
    }
}

const taskStatusSystem = new TaskStatusSystem();