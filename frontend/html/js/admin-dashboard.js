   // admin-dashboard.js
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected section
    document.getElementById(sectionName + '-section').classList.add('active');

    // Activate selected nav button
    event.target.classList.add('active');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../index.html';
    }
}

// Placeholder functions for demo
function addNewCenter() {
    alert('Add New Center functionality will be implemented here');
}

function addNewStaff() {
    alert('Add New Staff functionality will be implemented here');
}

function generateAppointmentLetter() {
    alert('Generate Appointment Letter functionality will be implemented here');
}

function generateOfferLetter() {
    alert('Generate Offer Letter functionality will be implemented here');
}

function generateIDCard() {
    alert('Generate ID Card functionality will be implemented here');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    console.log('Admin dashboard loaded');
    // Overview section is active by default
});
// admin-dashboard.js - Complete Version

// Sample Data (Replace with API calls later)
const sampleCenters = [
    { id: 'C001', name: 'Shillong Main Center', location: 'Shillong', manager: 'John Doe', students: 150, trainers: 8, status: 'active' },
    { id: 'C002', name: 'Tura Center', location: 'Tura', manager: 'Jane Smith', students: 120, trainers: 6, status: 'active' },
    { id: 'C003', name: 'Jowai Center', location: 'Jowai', manager: 'Mike Johnson', students: 80, trainers: 4, status: 'active' },
    { id: 'C004', name: 'Nongstoin Center', location: 'Nongstoin', manager: 'Sarah Wilson', students: 60, trainers: 3, status: 'inactive' }
];

const sampleStaff = [
    { id: 'S001', name: 'John Doe', center: 'Shillong Main Center', position: 'Center Manager', contact: 'john@neips.edu.in', status: 'active' },
    { id: 'S002', name: 'Jane Smith', center: 'Tura Center', position: 'Admin Staff', contact: 'jane@neips.edu.in', status: 'active' },
    { id: 'S003', name: 'Mike Johnson', center: 'Jowai Center', position: 'Coordinator', contact: 'mike@neips.edu.in', status: 'active' },
    { id: 'S004', name: 'Sarah Wilson', center: 'Nongstoin Center', position: 'Manager', contact: 'sarah@neips.edu.in', status: 'inactive' }
];

const sampleTrainers = [
    { id: 'T001', name: 'Dr. Robert Brown', center: 'Shillong Main Center', course: 'Web Development', experience: '5 years', email: 'robert@neips.edu.in' },
    { id: 'T002', name: 'Prof. Lisa Green', center: 'Tura Center', course: 'Digital Marketing', experience: '3 years', email: 'lisa@neips.edu.in' },
    { id: 'T003', name: 'Mr. David Lee', center: 'Jowai Center', course: 'Soft Skills', experience: '4 years', email: 'david@neips.edu.in' },
    { id: 'T004', name: 'Ms. Emma Davis', center: 'Shillong Main Center', course: 'Web Development', experience: '2 years', email: 'emma@neips.edu.in' }
];

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', function () {
    loadCenters();
    loadStaff();
    loadTrainers();
    populateCenterFilters();
});

// Navigation
function showSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(sectionName + '-section').classList.add('active');
    event.target.classList.add('active');
}

// Centers Management
function loadCenters() {
    const container = document.getElementById('centersContainer');
    container.innerHTML = '';

    sampleCenters.forEach(center => {
        const centerCard = `
            <div class="center-card" data-status="${center.status}">
                <div class="center-header">
                    <h3>${center.name}</h3>
                    <div class="center-id">${center.id}</div>
                </div>
                <div class="center-body">
                    <div class="center-info">
                        <p><i class="fas fa-map-marker-alt"></i> ${center.location}</p>
                        <p><i class="fas fa-user-tie"></i> ${center.manager}</p>
                    </div>
                    <div class="center-stats">
                        <div class="stat">
                            <div class="number">${center.students}</div>
                            <div class="label">Students</div>
                        </div>
                        <div class="stat">
                            <div class="number">${center.trainers}</div>
                            <div class="label">Trainers</div>
                        </div>
                        <div class="stat">
                            <div class="number ${center.status}">${center.status.toUpperCase()}</div>
                            <div class="label">Status</div>
                        </div>
                    </div>
                    <div class="center-actions">
                        <button class="action-btn edit-btn" onclick="editCenter('${center.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn view-btn" onclick="viewCenter('${center.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteCenter('${center.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += centerCard;
    });
}

function filterCenters() {
    const searchTerm = document.getElementById('centerSearch').value.toLowerCase();
    const statusFilter = document.getElementById('centerFilter').value;

    document.querySelectorAll('.center-card').forEach(card => {
        const centerName = card.querySelector('h3').textContent.toLowerCase();
        const centerStatus = card.getAttribute('data-status');

        const matchesSearch = centerName.includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || centerStatus === statusFilter;

        card.style.display = (matchesSearch && matchesStatus) ? 'block' : 'none';
    });
}

// Staff Management
function loadStaff() {
    const tbody = document.getElementById('staffTableBody');
    tbody.innerHTML = '';

    sampleStaff.forEach(staff => {
        const row = `
            <tr>
                <td>${staff.id}</td>
                <td>${staff.name}</td>
                <td>${staff.center}</td>
                <td>${staff.position}</td>
                <td>${staff.contact}</td>
                <td><span class="status-badge status-${staff.status}">${staff.status.toUpperCase()}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="table-btn edit-btn" onclick="editStaff('${staff.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="table-btn delete-btn" onclick="deleteStaff('${staff.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function filterStaff() {
    const searchTerm = document.getElementById('staffSearch').value.toLowerCase();
    const centerFilter = document.getElementById('centerSelect').value;

    document.querySelectorAll('#staffTableBody tr').forEach(row => {
        const staffName = row.cells[1].textContent.toLowerCase();
        const staffCenter = row.cells[2].textContent;

        const matchesSearch = staffName.includes(searchTerm);
        const matchesCenter = centerFilter === 'all' || staffCenter === centerFilter;

        row.style.display = (matchesSearch && matchesCenter) ? '' : 'none';
    });
}

// Trainers Management
function loadTrainers() {
    const container = document.getElementById('trainersContainer');
    container.innerHTML = '';

    sampleTrainers.forEach(trainer => {
        const trainerCard = `
            <div class="trainer-card grid-view">
                <div class="trainer-avatar">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div class="trainer-info">
                    <h4>${trainer.name}</h4>
                    <p><i class="fas fa-building"></i> ${trainer.center}</p>
                    <p><i class="fas fa-envelope"></i> ${trainer.email}</p>
                    <p><i class="fas fa-clock"></i> ${trainer.experience}</p>
                </div>
                <div class="trainer-courses">
                    <span class="course-tag">${trainer.course}</span>
                </div>
            </div>
        `;
        container.innerHTML += trainerCard;
    });
}

function changeTrainerView(viewType) {
    const container = document.getElementById('trainersContainer');
    const cards = container.querySelectorAll('.trainer-card');
    const viewBtns = document.querySelectorAll('.view-btn');

    viewBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    container.className = `trainers-container ${viewType}-view`;
    cards.forEach(card => card.className = `trainer-card ${viewType}-view`);
}

function filterTrainers() {
    const searchTerm = document.getElementById('trainerSearch').value.toLowerCase();
    const centerFilter = document.getElementById('trainerCenterFilter').value;
    const courseFilter = document.getElementById('trainerCourseFilter').value;

    document.querySelectorAll('.trainer-card').forEach(card => {
        const trainerName = card.querySelector('h4').textContent.toLowerCase();
        const trainerCenter = card.querySelector('p:nth-child(2)').textContent;
        const trainerCourse = card.querySelector('.course-tag').textContent;

        const matchesSearch = trainerName.includes(searchTerm);
        const matchesCenter = centerFilter === 'all' || trainerCenter.includes(centerFilter);
        const matchesCourse = courseFilter === 'all' || trainerCourse === courseFilter;

        card.style.display = (matchesSearch && matchesCenter && matchesCourse) ? 'block' : 'none';
    });
}

// Utility Functions
function populateCenterFilters() {
    const centerSelect = document.getElementById('centerSelect');
    const trainerCenterFilter = document.getElementById('trainerCenterFilter');

    const centers = [...new Set(sampleCenters.map(center => center.name))];

    centers.forEach(center => {
        centerSelect.innerHTML += `<option value="${center}">${center}</option>`;
        trainerCenterFilter.innerHTML += `<option value="${center}">${center}</option>`;
    });
}

// Modal Functions
function addNewCenter() {
    alert('Add New Center Modal will open here');
    // Implement modal for adding new center
}

function addNewStaff() {
    alert('Add New Staff Modal will open here');
    // Implement modal for adding new staff
}

// Placeholder functions for actions
function editCenter(centerId) {
    alert(`Edit Center: ${centerId}`);
}

function viewCenter(centerId) {
    alert(`View Center: ${centerId}`);
}

function deleteCenter(centerId) {
    if (confirm(`Are you sure you want to delete center ${centerId}?`)) {
        alert(`Center ${centerId} deleted`);
    }
}

function editStaff(staffId) {
    alert(`Edit Staff: ${staffId}`);
}

function deleteStaff(staffId) {
    if (confirm(`Are you sure you want to delete staff ${staffId}?`)) {
        alert(`Staff ${staffId} deleted`);
    }
}

// Document Generation
function generateAppointmentLetter() {
    alert('Appointment Letter Generation - This will open a form to select staff and generate letter');
}

function generateOfferLetter() {
    alert('Offer Letter Generation - This will open a form to select student and generate letter');
}

function generateIDCard() {
    alert('ID Card Generation - This will open a form to select student and generate ID card');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../index.html';
    }
}