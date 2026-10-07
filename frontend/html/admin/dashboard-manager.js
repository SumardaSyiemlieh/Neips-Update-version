// Load dashboard statistics with REAL data
async function loadDashboardStats() {
    try {
        // Get real students count
        const studentsResult = await sheetsService.getAllStudents();
        const students = studentsResult.success ? studentsResult.students : [];

        // Get real staff count  
        const staffResult = await sheetsService.getAllStaff();
        const staff = staffResult.status === 'success' ? staffResult.data : [];

        // Update student count
        document.getElementById('totalStudents').textContent = students.length;
        document.getElementById('studentsCount').textContent = students.length;

        // Update staff count
        const activeStaff = staff.filter(s => s.status === 'active' || s.status === 'Active');
        document.getElementById('totalStaff').textContent = activeStaff.length;
        document.getElementById('staffCount').textContent = activeStaff.length;

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        // Fallback to 0 if error
        document.getElementById('totalStudents').textContent = '0';
        document.getElementById('studentsCount').textContent = '0';
        document.getElementById('totalStaff').textContent = '0';
        document.getElementById('staffCount').textContent = '0';
    }
}
// Update your initializeApp function to include centers loading
// Make dashboard stats clickable - FIXED VERSION
function makeDashboardStatsClickable() {
    console.log('🖱️ Setting up clickable dashboard stats...');

    // Wait for DOM to be fully ready
    setTimeout(() => {
        // Students stat card
        const studentsCard = document.querySelector('.stat-card:nth-child(1)');
        if (studentsCard) {
            studentsCard.style.cursor = 'pointer';
            studentsCard.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log('🎯 Clicked Students card');
                showSection('students');
            });
            console.log('✅ Students card clickable');
        }

        // Staff stat card
        const staffCard = document.querySelector('.stat-card:nth-child(2)');
        if (staffCard) {
            staffCard.style.cursor = 'pointer';
            staffCard.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log('🎯 Clicked Staff card');
                showSection('staff');
            });
            console.log('✅ Staff card clickable');
        }

        // Centers stat card
        const centersCard = document.querySelector('.stat-card:nth-child(3)');
        if (centersCard) {
            centersCard.style.cursor = 'pointer';
            centersCard.addEventListener('click', function (e) {
                e.stopPropagation();
                console.log('🎯 Clicked Centers card');
                showSection('centers');
            });
            console.log('✅ Centers card clickable');
        }
    }, 1000);
}
