// Batch Approval System
let pendingBatches = [];
let allApprovalBatches = [];

// Initialize batch approval system
function initializeBatchApproval() {
    console.log('📩 Initializing batch approval system...');
    loadBatchApprovals();
}

// Load batch approvals from Google Sheets
async function loadBatchApprovals() {
    console.log('📋 Loading batch approval requests...');

    try {
        // This will be connected to Google Sheets later
        const result = await getBatchApprovalsFromSheets();

        if (result.success) {
            allApprovalBatches = result.batches || [];
            pendingBatches = allApprovalBatches.filter(batch =>
                batch.approval_status === 'pending'
            );

            updateApprovalBadges();
            displayBatchApprovals();
        } else {
            console.log('No batch approval data found');
            showEmptyApprovalsState();
        }
    } catch (error) {
        console.error('Error loading batch approvals:', error);
        showEmptyApprovalsState();
    }
}
// Get batch approvals from Google Sheets (placeholder)
async function getBatchApprovalsFromSheets() {
    // This will be implemented in next step
    return {
        success: true,
        batches: [] // Empty for now
    };
}
// Update approval badges in sidebar
function updateApprovalBadges() {
    const pendingCount = pendingBatches.length;
    const approvedCount = allApprovalBatches.filter(b => b.approval_status === 'approved').length;
    const rejectedCount = allApprovalBatches.filter(b => b.approval_status === 'rejected').length;

    // Update sidebar badge
    document.getElementById('pendingBatchesCount').textContent = pendingCount;

    // Update header stats
    document.getElementById('pendingCount').textContent = `${pendingCount} Pending`;
    document.getElementById('approvedCount').textContent = `${approvedCount} Approved`;
    document.getElementById('rejectedCount').textContent = `${rejectedCount} Rejected`;
}
// Display batch approvals in the UI
function displayBatchApprovals() {
    const container = document.getElementById('approvalRequests');

    if (allApprovalBatches.length === 0) {
        showEmptyApprovalsState();
        return;
    }

    let html = '';
    allApprovalBatches.forEach(batch => {
        html += createApprovalItemHTML(batch);
    });

    container.innerHTML = html;
}
// Create HTML for a single approval item
// Create HTML for a single approval item - FIXED VERSION
function createApprovalItemHTML(batch) {
    const batchId = batch.batch_id || batch.BatchID || batch.id;
    const center = batch.center || batch.Center || 'Unknown Center';
    const trade = batch.trade || batch.Trade || 'Unknown Trade';
    const faculty = batch.faculty || batch.Faculty || 'Not assigned';
    const status = batch.approval_status || 'draft';

    // Format dates properly
    const createdDate = batch.created_date ? formatDate(batch.created_date) : 'Recently';
    const startDate = batch.start_date ? formatDate(batch.start_date) : 'TBD';
    const endDate = batch.end_date ? formatDate(batch.end_date) : 'TBD';

    // Student count
    const studentCount = batch.student_count || 0;
    const maxCapacity = batch.max_capacity || 30;

    // Determine status display
    let statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
    let statusClass = `status-${status}`;

    // FIXED: Show approve/reject buttons for pending batches
    const showActions = status === 'pending';

    // FIXED: Show approval notes if available
    const approvalNotes = batch.ApprovalNotes || batch.approval_notes || '';

    return `
        <div class="approval-item ${status}">
            <div class="approval-header">
                <div class="approval-batch-info">
                    <h4>${batchId}</h4>
                    <div class="approval-meta">
                        <span class="approval-center">${center}</span>
                        <span>Trade: ${trade}</span>
                        <span>Created: ${createdDate}</span>
                    </div>
                </div>
                <span class="approval-status ${statusClass}">
                    ${statusDisplay}
                </span>
            </div>
            
            <div class="approval-body">
                <div class="approval-details">
                    <div class="detail-item">
                        <span class="detail-label">Faculty</span>
                        <span class="detail-value">${faculty}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Capacity</span>
                        <span class="detail-value">${studentCount}/${maxCapacity} students</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duration</span>
                        <span class="detail-value">${startDate} - ${endDate}</span>
                    </div>
                </div>
                
                ${approvalNotes ? `
                <div class="approval-notes">
                    <strong>Admin Notes:</strong> ${approvalNotes}
                </div>
                ` : ''}
            </div>
            
            ${showActions ? `
            <div class="approval-actions">
                <button class="btn-approve" onclick="approveBatch('${batchId}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn-reject" onclick="rejectBatch('${batchId}')">
                    <i class="fas fa-times"></i> Reject
                </button>
                <button class="btn-view" onclick="viewBatchDetails('${batchId}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
            </div>
            ` : ''}
            
            ${!showActions && (status === 'approved' || status === 'rejected') ? `
            <div class="approval-actions">
                <button class="btn-view" onclick="viewBatchDetails('${batchId}')">
                    <i class="fas fa-eye"></i> View Details
                </button>
                ${status === 'approved' ? `
                <button class="btn-approve" onclick="resendApprovalNotification('${batchId}')">
                    <i class="fas fa-envelope"></i> Resend Notification
                </button>
                ` : ''}
            </div>
            ` : ''}
        </div>
    `;
}
function showEmptyApprovalsState() {
    const container = document.getElementById('approvalRequests');
    container.innerHTML = `
        <div class="empty-approvals">
            <i class="fas fa-envelope-open"></i>
            <h3>No Batch Approval Requests</h3>
            <p>All batch requests are processed and up to date.</p>
            <p>New batch approval requests from staff will appear here automatically.</p>
        </div>
    `;
}
// Placeholder functions for batch actions
function approveBatch(batchId) {
    console.log('Approving batch:', batchId);
    showSuccess(`Batch ${batchId} approved successfully!`);
    // Will be implemented in next step
}
function rejectBatch(batchId) {
    console.log('Rejecting batch:', batchId);
    const reason = prompt('Please enter rejection reason:');
    if (reason) {
        showSuccess(`Batch ${batchId} rejected. Reason: ${reason}`);
        // Will be implemented in next step
    }
}

function viewBatchDetails(batchId) {
    console.log('Viewing batch details:', batchId);
    // Will be implemented in next step
}

function refreshBatchApprovals() {
    loadBatchApprovals();
    showSuccess('Batch approvals refreshed!');
}

function filterBatchApprovals() {
    // Will be implemented in next step
    console.log('Filtering batch approvals...');
}
// Load batch approvals from Google Sheets - REAL IMPLEMENTATION
async function loadBatchApprovals() {
    console.log('📋 Loading batch approval requests from database...');

    const container = document.getElementById('approvalRequests');
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading approval requests...</p>
        </div>
    `;

    try {
        const result = await sheetsService.getBatchApprovals();

        if (result.success && result.batches) {
            allApprovalBatches = result.batches;
            pendingBatches = allApprovalBatches.filter(batch =>
                batch.approval_status === 'pending'
            );

            updateApprovalBadges();
            displayBatchApprovals();

            if (pendingBatches.length > 0) {
                console.log(`🔔 Found ${pendingBatches.length} batches pending approval`);
            }
        } else {
            console.log('No batch approval data found');
            showEmptyApprovalsState();
        }
    } catch (error) {
        console.error('Error loading batch approvals:', error);
        showError('Failed to load batch approvals: ' + error.message);
        showEmptyApprovalsState();
    }
}
// Approve batch - REAL IMPLEMENTATION
async function approveBatch(batchId) {
    if (!confirm('Approve this batch? This will notify the staff and activate the batch.')) {
        return;
    }

    showLoading('Approving batch...');

    try {
        const approvalData = {
            status: 'approved',
            notes: 'Batch approved and activated.'
        };

        const result = await sheetsService.updateBatchApproval(batchId, approvalData);

        if (result.success) {
            showSuccess('Batch approved successfully! Staff has been notified.');
            // Refresh the approvals list
            loadBatchApprovals();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error approving batch:', error);
        showError('Failed to approve batch: ' + error.message);
    }

    hideLoading();
}

// Reject batch - REAL IMPLEMENTATION
async function rejectBatch(batchId) {
    const reason = prompt('Please enter rejection reason for the staff:');
    if (!reason) {
        return;
    }

    if (!confirm(`Reject this batch with reason: "${reason}"?`)) {
        return;
    }

    showLoading('Rejecting batch...');

    try {
        const approvalData = {
            status: 'rejected',
            notes: reason
        };

        const result = await sheetsService.updateBatchApproval(batchId, approvalData);

        if (result.success) {
            showSuccess('Batch rejected! Staff has been notified with your feedback.');
            // Refresh the approvals list
            loadBatchApprovals();
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        console.error('Error rejecting batch:', error);
        showError('Failed to reject batch: ' + error.message);
    }

    hideLoading();
}
function filterBatchApprovals() {
    // Will be implemented in next step
    console.log('Filtering batch approvals...');
}
// Filter batch approvals
function filterBatchApprovals() {
    const statusFilter = document.getElementById('approvalStatusFilter').value;
    const centerFilter = document.getElementById('approvalCenterFilter').value;
    const searchTerm = document.getElementById('approvalSearch').value.toLowerCase();

    let filteredBatches = allApprovalBatches;

    // Filter by status
    if (statusFilter !== 'all') {
        filteredBatches = filteredBatches.filter(batch =>
            batch.approval_status === statusFilter
        );
    }

    // Filter by center
    if (centerFilter) {
        filteredBatches = filteredBatches.filter(batch =>
            batch.center && batch.center.toLowerCase().includes(centerFilter.toLowerCase())
        );
    }

    // Filter by search term
    if (searchTerm) {
        filteredBatches = filteredBatches.filter(batch =>
            (batch.batch_id && batch.batch_id.toLowerCase().includes(searchTerm)) ||
            (batch.trade && batch.trade.toLowerCase().includes(searchTerm)) ||
            (batch.center && batch.center.toLowerCase().includes(searchTerm))
        );
    }

    displayFilteredApprovals(filteredBatches);
}
function displayFilteredApprovals(batches) {
    const container = document.getElementById('approvalRequests');

    if (batches.length === 0) {
        container.innerHTML = `
            <div class="empty-approvals">
                <i class="fas fa-search"></i>
                <h3>No Matching Approval Requests</h3>
                <p>Try adjusting your filters or search terms.</p>
            </div>
        `;
        return;
    }

    let html = '';
    batches.forEach(batch => {
        html += createApprovalItemHTML(batch);
    });

    container.innerHTML = html;
}
// Real-time approval notification polling
let approvalPollingInterval = null;

async function updateApprovalBadgeOnly() {
    try {
        const result = await sheetsService.getBatchApprovals();
        if (result.success && result.batches) {
            const pendingCount = result.batches.filter(b => b.approval_status === 'pending').length;
            document.getElementById('pendingBatchesCount').textContent = pendingCount;
        }
    } catch (error) {
        console.error('Error updating approval badge:', error);
    }
}

// Start polling when admin dashboard loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(startApprovalPolling, 5000);
});

// Start polling when admin dashboard loads
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(startApprovalPolling, 5000);
});