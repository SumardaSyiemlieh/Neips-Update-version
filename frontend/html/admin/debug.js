// DEBUG FUNCTION - Check why messages aren't showing
function debugTaskMessages() {
    console.log('🔍 DEBUGGING TASK MESSAGES...');

    const centersGrid = document.getElementById('centersGrid');
    console.log('Centers grid exists:', !!centersGrid);

    if (centersGrid) {
        const centerCards = centersGrid.querySelectorAll('.center-card');
        console.log('Center cards found:', centerCards.length);

        centerCards.forEach((card, index) => {
            const statusMessage = card.querySelector('.center-task-status');
            console.log(`Card ${index + 1} - Status message:`, !!statusMessage);
            if (statusMessage) {
                console.log(`Card ${index + 1} - Message:`, statusMessage.textContent);
            }
        });
    }

    // Check CSS
    const style = document.querySelector('style');
    console.log('CSS loaded:', !!style);
}
// DEBUG YOUR REAL TASK DATA
// Debug function to test centers display
function debugCentersDisplay() {
    console.log('🔍 DEBUGGING CENTERS DISPLAY...');

    // Force reload centers data
    loadCentersData();

    // Test with sample data after 2 seconds
    setTimeout(() => {
        const centersGrid = document.getElementById('centersGrid');
        if (centersGrid) {
            const centerCards = centersGrid.querySelectorAll('.center-card');
            console.log(`🎯 Found ${centerCards.length} center cards`);

            centerCards.forEach((card, index) => {
                const statusMessage = card.querySelector('.center-task-status');
                console.log(`Card ${index + 1}: ${statusMessage ? 'HAS STATUS' : 'NO STATUS'}`);
                if (statusMessage) {
                    console.log(`   Message: ${statusMessage.textContent}`);
                }
            });
        }
    }, 2000);
}
// Test function to manually load and display centers
function testCentersSection() {
    console.log('🧪 TESTING CENTERS SECTION...');

    // First, make sure we're in the centers section
    showSection('centers');

    // Wait a bit for section to load, then load centers data
    setTimeout(() => {
        console.log('🔄 Loading centers data after section change...');
        loadCentersData();

        // Check again after loading
        setTimeout(() => {
            const centersGrid = document.getElementById('centersGrid');
            if (centersGrid) {
                const centerCards = centersGrid.querySelectorAll('.center-card');
                console.log(`🎯 Found ${centerCards.length} center cards after loading`);

                if (centerCards.length === 0) {
                    console.log('❌ Still no center cards. Checking HTML...');
                    console.log('📋 Centers grid content:', centersGrid.innerHTML);
                }
            }
        }, 2000);
    }, 500);
}

// Add this to your initializeApp to debug
async function initializeApp() {
    console.log('🚀 Initializing app...');

    // Your existing initialization code...
    populateCentersDropdowns();
    populateCoursesDropdown();
    await loadDashboardStats();
    await loadStudentsTable();
    await loadStaffTable();
    loadCentersData(); // This should show messages

    // Debug after a delay
    setTimeout(() => {
        debugTaskMessages();
    }, 2000);

    setupEventListeners();
    showSection('dashboard');
    addTaskManagementToAdmin();
    makeDashboardStatsClickable();
}
