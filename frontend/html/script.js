// At the beginning of your slideshow code in script.js
if (typeof window.DISABLE_SLIDESHOW === 'undefined' || !window.DISABLE_SLIDESHOW) {
    // Your slideshow code here
}

// Main application initialization and common utilities
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded - initializing scripts');
    initializeHomeSlideshow();
    // Initialize navigation FIRST
    initializeNavigation();

    // Then initialize other components

    initializeCourseModals();
    initializeEventListeners();

    // Ensure navbar state is correct after all initialization
    setTimeout(initializeNavbarState, 100);

    // Debug: Log mobile menu state
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    console.log('Mobile nav elements on load:', {
        toggle: mobileNavToggle,
        menu: navMenu,
        toggleVisible: mobileNavToggle ? window.getComputedStyle(mobileNavToggle).display : 'not found',
        menuVisible: navMenu ? window.getComputedStyle(navMenu).display : 'not found'
    });

    // Handle page load with hash
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        setTimeout(() => {
            handleSmoothScroll(targetId);
        }, 500);
    }
});

// ========== NAVIGATION FUNCTIONS ==========

// 100% WORKING MOBILE NAVIGATION
// 100% WORKING MOBILE NAVIGATION - SIMPLIFIED
function initializeNavigation() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');

    console.log('🚀 Initializing mobile navigation...');
    console.log('Mobile toggle found:', !!mobileNavToggle);
    console.log('Nav menu found:', !!navMenu);

    if (mobileNavToggle && navMenu) {
        let isMenuOpen = false;

        function toggleMobileMenu() {
            isMenuOpen = !isMenuOpen;

            console.log('Toggling menu. Current state:', isMenuOpen);

            // Toggle hamburger icon
            mobileNavToggle.classList.toggle('active');

            // Toggle mobile menu
            if (isMenuOpen) {
                navMenu.classList.add('mobile-active');
                document.body.classList.add('menu-open');
                console.log('Menu opened - added mobile-active class');
            } else {
                navMenu.classList.remove('mobile-active');
                document.body.classList.remove('menu-open');
                console.log('Menu closed - removed mobile-active class');
            }
        }

        function closeMobileMenu() {
            isMenuOpen = false;
            mobileNavToggle.classList.remove('active');
            navMenu.classList.remove('mobile-active');
            document.body.classList.remove('menu-open');
            console.log('Menu force closed');
        }

        // Click event for mobile toggle
        mobileNavToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Mobile toggle clicked');
            toggleMobileMenu();
        });

        // Close menu when clicking on links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                console.log('Nav link clicked:', this.textContent);
                closeMobileMenu();
            });
        });

        // Close menu when clicking apply button
        const applyButton = navMenu.querySelector('.apply-now-button');
        if (applyButton) {
            applyButton.addEventListener('click', function (e) {
                console.log('Apply button clicked in mobile menu');
                closeMobileMenu();
            });
        }

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (isMenuOpen && !navMenu.contains(e.target) && !mobileNavToggle.contains(e.target)) {
                console.log('Clicked outside - closing menu');
                closeMobileMenu();
            }
        });

        // Close on escape key
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isMenuOpen) {
                console.log('Escape key pressed - closing menu');
                closeMobileMenu();
            }
        });

        // Debug: Check initial state
        console.log('Initial menu classes:', navMenu.classList.toString());
        console.log('Initial mobile toggle classes:', mobileNavToggle.classList.toString());

    } else {
        console.error('❌ Mobile navigation elements not found!');
        console.error('Toggle:', mobileNavToggle);
        console.error('Menu:', navMenu);
    }
}
// Check if current page is home page
function isHomePage() {
    return window.location.pathname.includes('index.html') ||
        window.location.pathname.endsWith('/') ||
        !window.location.pathname.includes('.html');
}

// Initialize navbar based on current page
function initializeNavbarState() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    // If not home page, set black navbar immediately
    if (!isHomePage()) {
        navbar.classList.add('default-black');
    } else {
        // On home page, check scroll position
        handleNavbarScroll();
    }
}

// Enhanced scroll functionality
function handleNavbarScroll() {
    const navbar = document.getElementById('navbar');
    const scrolled = window.scrollY > 100;

    if (navbar) {
        if (scrolled) {
            navbar.classList.add('scrolled');
            navbar.classList.remove('default-black');
        } else {
            // On home page, remove both classes when at top
            if (isHomePage()) {
                navbar.classList.remove('scrolled');
                navbar.classList.remove('default-black');
            } else {
                // On other pages, keep black navbar
                navbar.classList.add('default-black');
            }
        }
    }
}

// Smooth scroll function
function handleSmoothScroll(targetId) {
    console.log('Navigation clicked:', targetId);

    let targetElement;

    if (targetId === 'footer-contact') {
        targetElement = document.querySelector('.footer-section');
    } else {
        targetElement = document.getElementById(targetId);
    }

    if (targetElement) {
        const offsetTop = targetElement.offsetTop - 80;
        window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
        });
    } else {
        console.warn('Target section not found:', targetId);
    }
}

// Handle cross-page navigation
function handleCrossPageNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // Handle internal page navigation with hash
            if (href && href.includes('#')) {
                e.preventDefault();
                const [page, section] = href.split('#');

                // If we're already on the target page, just scroll
                if (window.location.pathname.includes(page) ||
                    (page === 'index.html' && isHomePage())) {
                    handleSmoothScroll(section);
                } else {
                    // Navigate to the page first, then scroll
                    window.location.href = href;
                }
            }
        });
    });
}

// Universal close mobile menu function
function closeMobileMenu() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
    }
}

// Initialize image sliders for each course with staggered timing - IMPROVED VERSION
function initializeCourseSliders() {
    const courseCards = document.querySelectorAll('.course-card');

    courseCards.forEach((card, index) => {
        const sliderTrack = card.querySelector('.slider-track');
        const slides = card.querySelectorAll('.slide');
        const indicators = card.querySelectorAll('.indicator');

        if (slides.length > 1) {
            let currentSlide = 0;
            let slideInterval;

            // Use flexbox layout for slider track
            sliderTrack.style.display = 'flex';
            sliderTrack.style.width = `${slides.length * 100}%`;
            sliderTrack.style.transition = 'transform 0.5s ease-in-out';

            // Set initial position
            updateSlides();

            // Start with different delays for each card
            const startDelay = (index * 500) + 1000;

            setTimeout(() => {
                startAutoSlide();
            }, startDelay);

            function startAutoSlide() {
                slideInterval = setInterval(() => {
                    moveToNextSlide();
                }, 4000);
            }

            function moveToNextSlide() {
                currentSlide = (currentSlide + 1) % slides.length;
                updateSlides();
            }

            function updateSlides() {
                // Use transform for smooth sliding
                sliderTrack.style.transform = `translateX(-${(currentSlide / slides.length) * 100}%)`;

                // Update indicators
                indicators.forEach((indicator, i) => {
                    indicator.classList.toggle('active', i === currentSlide);
                });
            }

            // Pause auto-slide on hover
            card.addEventListener('mouseenter', () => {
                clearInterval(slideInterval);
            });

            card.addEventListener('mouseleave', () => {
                startAutoSlide();
            });

            // Indicator click functionality
            indicators.forEach((indicator, i) => {
                indicator.addEventListener('click', () => {
                    currentSlide = i;
                    updateSlides();
                    clearInterval(slideInterval);
                    startAutoSlide();
                });
            });

        } else if (slides.length === 1) {
            // Ensure single images display properly
            const slide = slides[0];
            const img = slide.querySelector('img');
            if (img) {
                // Make sure single image is visible
                slide.style.position = 'relative';
                slide.style.opacity = '1';
                slide.style.width = '100%';

                // Ensure image loads properly
                if (img.complete) {
                    img.style.opacity = '1';
                } else {
                    img.onload = function () {
                        this.style.opacity = '1';
                    };
                }
            }
        }
    });
}


// Course details for modals
const courseDetails = {
    'fashion': {
        title: 'Fashion Designing',
        description: 'Comprehensive fashion design course covering garment construction, pattern making, fashion illustration, and textile knowledge.',
        highlights: [
            'Pattern Making & Draping',
            'Garment Construction',
            'Fashion Illustration',
            'Textile Science',
            'Portfolio Development'
        ]
    },
    'baking': {
        title: 'Craft Baking',
        description: 'Master the art of artisanal baking with hands-on training in bread making, pastries, cakes, and confectionery.',
        highlights: [
            'Artisanal Bread Making',
            'Pastry & Confectionery',
            'Cake Decorating',
            'Food Safety & Hygiene',
            'Bakery Business Basics'
        ]
    },
    'beauty': {
        title: 'Senior Beauty and Spa',
        description: 'Professional beauty therapy, skincare, and spa treatments training.',
        highlights: [
            'Skincare Treatments',
            'Makeup Artistry',
            'Spa Therapies',
            'Beauty Products Knowledge',
            'Client Consultation'
        ]
    },
    'piggery': {
        title: 'IFS Piggery',
        description: 'Integrated farming system focusing on modern pig farming techniques.',
        highlights: [
            'Pig Breeding Techniques',
            'Feed Management',
            'Disease Control',
            'Farm Management',
            'Marketing Strategies'
        ]
    },
    'chef': {
        title: 'Commis Chef',
        description: 'Foundation course in professional culinary arts and kitchen operations.',
        highlights: [
            'Basic Cooking Techniques',
            'Kitchen Safety',
            'Food Preparation',
            'Menu Planning',
            'Kitchen Management'
        ]
    },
    'mobile': {
        title: 'Mobile Repairing',
        description: 'Hardware and software troubleshooting for smartphones and devices.',
        highlights: [
            'Hardware Repair',
            'Software Troubleshooting',
            'Component Replacement',
            'Diagnostic Tools',
            'Customer Service'
        ]
    },
    'mason': {
        title: 'Mason Tiling',
        description: 'Construction skills including tiling, masonry, and finishing works.',
        highlights: [
            'Tile Installation',
            'Masonry Work',
            'Surface Preparation',
            'Finishing Techniques',
            'Tools Handling'
        ]
    },
    'fb-service': {
        title: 'F&B Service Associate',
        description: 'Hospitality training for restaurant and food service operations.',
        highlights: [
            'Customer Service',
            'Table Setting',
            'Order Taking',
            'Beverage Service',
            'Restaurant Operations'
        ]
    },
    'beautician': {
        title: 'Asst. Beautician',
        description: 'Basic beauty treatments, skincare, and salon assistance techniques.',
        highlights: [
            'Basic Beauty Treatments',
            'Skincare Techniques',
            'Salon Assistance',
            'Client Handling',
            'Beauty Tools Usage'
        ]
    },
    'rural-masonry': {
        title: 'Women Empowerment - Rural Masonry',
        description: 'Basic construction skills and masonry techniques for rural development.',
        highlights: [
            'Basic Masonry Skills',
            'Construction Safety',
            'Rural Building Techniques',
            'Tools Operation',
            'Quality Standards'
        ]
    },
    'mushroom': {
        title: 'Mushroom Grower',
        description: 'Mushroom cultivation techniques, harvesting, and preservation methods.',
        highlights: [
            'Mushroom Cultivation',
            'Harvesting Techniques',
            'Preservation Methods',
            'Quality Control',
            'Marketing Skills'
        ]
    },
    'plumber': {
        title: 'Plumber',
        description: 'Pipe fitting, drainage systems, and plumbing installation techniques.',
        highlights: [
            'Pipe Fitting',
            'Drainage Systems',
            'Installation Techniques',
            'Tools Handling',
            'Safety Procedures'
        ]
    },
    'fitter': {
        title: 'Fitter & Fabrication',
        description: 'Metal fitting, welding, and fabrication techniques for industrial applications.',
        highlights: [
            'Metal Fitting',
            'Welding Techniques',
            'Fabrication Skills',
            'Blueprint Reading',
            'Industrial Safety'
        ]
    },
    'field-technician': {
        title: 'Field Technician Services',
        description: 'Equipment maintenance, troubleshooting, and field service operations.',
        highlights: [
            'Equipment Maintenance',
            'Troubleshooting',
            'Field Service',
            'Technical Support',
            'Customer Service'
        ]
    },
    'almirah': {
        title: 'Almirah Making',
        description: 'Woodworking, Steelworking,cabinet making, and furniture construction techniques.',
        highlights: [
            'Woodworking Skills',
            'Cabinet Making',
            'Furniture Construction',
            'Design Techniques',
            'Finishing Methods'
        ]
    },
    'welder': {
        title: 'Welder',
        description: 'Arc welding, gas welding, and metal joining techniques.',
        highlights: [
            'Arc Welding',
            'Gas Welding',
            'Metal Joining',
            'Safety Procedures',
            'Quality Inspection'
        ]
    },
    'sofa-making': {
        title: 'Lead Sofa Making',
        description: 'Upholstery, sofa frame construction, and furniture design techniques.',
        highlights: [
            'Upholstery Techniques',
            'Frame Construction',
            'Furniture Design',
            'Material Selection',
            'Finishing Work'
        ]
    },
    'cosmetology': {
        title: 'Cosmetology',
        description: 'Advanced beauty treatments, makeup artistry, and salon management.',
        highlights: [
            'Advanced Beauty Treatments',
            'Makeup Artistry',
            'Salon Management',
            'Client Consultation',
            'Business Skills'
        ]
    }
};

// Initialize course modals - UPDATED VERSION
function initializeCourseModals() {
    const learnMoreButtons = document.querySelectorAll('.learn-more-btn');
    learnMoreButtons.forEach(button => {
        button.addEventListener('click', function () {
            const courseId = this.getAttribute('data-course');
            showCourseDetails(courseId, courseDetails);

            // Prevent body scroll when modal is open
            document.body.classList.add('modal-open');
        });
    });
}

// Show course details modal
// Show course details modal - FIXED VERSION
function showCourseDetails(courseId, courseDetails) {
    const course = courseDetails[courseId];
    if (!course) return;

    // Remove any existing modals first
    const existingModal = document.querySelector('.course-modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'course-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        padding: 20px;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'course-modal-content';
    modalContent.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 15px;
        max-width: 600px;
        width: 100%;
        max-height: 80vh;
        overflow-y: auto;
        position: relative;
        box-shadow: 0 20px 40px rgba(139, 105, 20, 0.3);
        border: 3px solid #f0e68c;
        transform: scale(0.9);
        animation: popIn 0.4s ease forwards;
    `;

    modalContent.innerHTML = `
        <h2 style="color: #8b6914; margin-bottom: 20px; text-align: center;">${course.title}</h2>
        <p style="color: #7d6b3a; margin-bottom: 25px; line-height: 1.6; font-size: 16px;">${course.description}</p>
        
        <div>
            <h3 style="color: #8b6914; margin-bottom: 15px; border-bottom: 2px solid #f0e68c; padding-bottom: 8px;">Course Highlights</h3>
            <ul style="color: #7d6b3a; padding-left: 20px;">
                ${course.highlights.map(highlight => `<li style="margin-bottom: 10px; padding-left: 5px;">${highlight}</li>`).join('')}
            </ul>
        </div>
        
        <button class="enroll-now-btn" style="
            background: linear-gradient(135deg, #8b6914 0%, #daa520 100%);
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            margin-top: 25px;
            width: 100%;
            transition: all 0.3s ease;
        ">Enroll Now</button>
        
        <button class="modal-close-btn" style="
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 30px;
            cursor: pointer;
            color: #8b6914;
            font-weight: bold;
            line-height: 1;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        ">&times;</button>
    `;

    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);

    // Close modal function - FIXED VERSION
    function closeModal() {
        console.log('Closing modal');

        // Add closing animation
        if (modalOverlay) {
            modalOverlay.style.animation = 'fadeOut 0.3s ease forwards';
            modalContent.style.animation = 'popOut 0.3s ease forwards';

            // Remove from DOM after animation
            setTimeout(() => {
                if (modalOverlay && modalOverlay.parentElement) {
                    document.body.removeChild(modalOverlay);
                }
            }, 300);
        }

        // Remove escape key listener
        document.removeEventListener('keydown', handleEscape);
    }

    // Enroll button click - FIXED VERSION
    const enrollButton = modalContent.querySelector('.enroll-now-btn');
    enrollButton.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent event bubbling
        console.log('Enroll Now clicked');

        // Close modal first
        closeModal();

        // Then scroll to registration after a short delay
        setTimeout(() => {
            const contactSection = document.getElementById('contact');
            if (contactSection) {
                contactSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 400); // Wait for modal close animation
    });

    // Close button click - FIXED VERSION
    const closeButton = modalContent.querySelector('.modal-close-btn');
    closeButton.addEventListener('click', function (e) {
        e.stopPropagation(); // Prevent event bubbling
        closeModal();
    });

    // Close when clicking outside - FIXED VERSION
    modalOverlay.addEventListener('click', function (e) {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Close with Escape key - FIXED VERSION
    function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
    document.addEventListener('keydown', handleEscape);


    // Close with Escape key
    document.addEventListener('keydown', function handleEscape(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    });
}
// Smooth scroll to element
function scrollToElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Keep the existing notification function for errors
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        ${type === 'success' ? 'background: #28a745;' : ''}
        ${type === 'error' ? 'background: #dc3545;' : ''}
        ${type === 'info' ? 'background: #17a2b8;' : ''}
    `;

    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 10px;">&times;</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes popIn {
        0% { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .success-popup-overlay {
        animation: fadeIn 0.3s ease;
    }
    
    .success-popup-content {
        animation: popIn 0.4s ease;
    }
    
    .popup-close-btn:hover {
        background: #218838 !important;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// Additional utility functions
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\D/g, ''));
}
// About Section Tab Functionality
document.addEventListener('DOMContentLoaded', function () {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.about-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');

            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
});
// Image loading handler for leadership team
document.addEventListener('DOMContentLoaded', function () {
    // Handle image loading and errors
    const teamImages = document.querySelectorAll('.member-img, .ceo-img');

    teamImages.forEach(img => {
        // Check if image source is valid
        if (img.src && img.complete && img.naturalHeight !== 0) {
            // Image loaded successfully
            img.classList.add('loaded');
        } else if (img.src) {
            // Image might be loading or has error
            img.onload = function () {
                this.classList.add('loaded');
            };
            img.onerror = function () {
                // Hide the broken image and show placeholder
                this.style.display = 'none';
                const placeholder = this.nextElementSibling;
                if (placeholder && placeholder.classList.contains('photo-placeholder')) {
                    placeholder.style.display = 'flex';
                }
            };
        } else {
            // No src attribute, show placeholder
            img.style.display = 'none';
            const placeholder = img.nextElementSibling;
            if (placeholder && placeholder.classList.contains('photo-placeholder')) {
                placeholder.style.display = 'flex';
            }
        }
    });
});
// Success Stories Slideshow
document.addEventListener('DOMContentLoaded', function () {
    const successSlides = document.querySelectorAll('.success-slide');
    const successIndicators = document.querySelectorAll('.success-indicator');
    const prevBtn = document.querySelector('.success-stories-slideshow .prev-btn');
    const nextBtn = document.querySelector('.success-stories-slideshow .next-btn');
    let currentSuccessSlide = 0;

    // Function to show a specific slide
    function showSuccessSlide(index) {
        // Hide all slides
        successSlides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Remove active class from all indicators
        successIndicators.forEach(indicator => {
            indicator.classList.remove('active');
        });

        // Show the selected slide
        successSlides[index].classList.add('active');
        successIndicators[index].classList.add('active');

        currentSuccessSlide = index;
    }

    // Next slide function
    function nextSuccessSlide() {
        let nextIndex = (currentSuccessSlide + 1) % successSlides.length;
        showSuccessSlide(nextIndex);
    }

    // Previous slide function
    function prevSuccessSlide() {
        let prevIndex = (currentSuccessSlide - 1 + successSlides.length) % successSlides.length;
        showSuccessSlide(prevIndex);
    }

    // Event listeners for navigation buttons
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSuccessSlide);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', prevSuccessSlide);
    }

    // Event listeners for indicators
    successIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            showSuccessSlide(index);
        });
    });

    // Auto-advance slides (optional)
    let successSlideInterval = setInterval(nextSuccessSlide, 6000);

    // Pause auto-advance on hover
    const successSlideshow = document.querySelector('.success-stories-slideshow');
    if (successSlideshow) {
        successSlideshow.addEventListener('mouseenter', () => {
            clearInterval(successSlideInterval);
        });

        successSlideshow.addEventListener('mouseleave', () => {
            successSlideInterval = setInterval(nextSuccessSlide, 6000);
        });
    }

    // Video play functionality
    const videoContainers = document.querySelectorAll('.video-container');
    videoContainers.forEach(container => {
        const video = container.querySelector('.success-video');
        const playOverlay = container.querySelector('.play-overlay');

        if (video && playOverlay) {
            playOverlay.addEventListener('click', () => {
                video.play();
                playOverlay.style.display = 'none';
            });

            video.addEventListener('pause', () => {
                playOverlay.style.display = 'flex';
            });

            video.addEventListener('ended', () => {
                playOverlay.style.display = 'flex';
            });
        }
    });
});// Video Slideshow Functionality - Auto Play Only
document.addEventListener('DOMContentLoaded', function () {
    const videoSlides = document.querySelectorAll('.video-slide');
    let currentSlide = 0;

    function showSlide(index) {
        console.log('Showing slide:', index);

        // Hide all slides and pause videos
        videoSlides.forEach(slide => {
            slide.classList.remove('active');
            const video = slide.querySelector('video');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        });

        // Show current slide
        videoSlides[index].classList.add('active');
        currentSlide = index;

        // Setup current video
        const currentVideo = videoSlides[index].querySelector('video');
        if (currentVideo) {
            setupVideo(currentVideo);
        }
    }

    function setupVideo(video) {
        // Reset video
        video.currentTime = 0;
        video.muted = false;
        video.controls = false; // No controls

        // Remove any existing event listeners by cloning
        const newVideo = video.cloneNode(true);
        video.parentNode.replaceChild(newVideo, video);

        const currentVideo = newVideo;

        // Auto-play the video
        setTimeout(() => {
            playVideo(currentVideo);
        }, 500);

        // Auto-next when video ends
        currentVideo.addEventListener('ended', function () {
            console.log('Video ended, going to next slide');
            setTimeout(() => nextSlide(), 1000); // 1 second delay
        });
    }

    function playVideo(video) {
        // Try to play with sound first
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('Video started playing successfully');
            }).catch(error => {
                console.log('Auto-play with sound failed, trying muted:', error);

                // If autoplay with sound fails, try muted
                video.muted = true;
                video.play().then(() => {
                    console.log('Video started playing muted');
                }).catch(error2 => {
                    console.log('Auto-play completely failed:', error2);
                });
            });
        }
    }

    function nextSlide() {
        console.log('Moving to next slide');
        currentSlide = (currentSlide + 1) % videoSlides.length;
        showSlide(currentSlide);
    }

    // Start with first video
    console.log('Initializing auto-play video slideshow...');
    showSlide(0);
});
// Video control functionality
document.addEventListener('DOMContentLoaded', function () {
    // Video play functionality
    const playOverlays = document.querySelectorAll('.play-overlay');
    const videos = document.querySelectorAll('.success-video');

    playOverlays.forEach(overlay => {
        overlay.addEventListener('click', function () {
            const videoContainer = this.closest('.video-container');
            const video = videoContainer.querySelector('.success-video');

            // Play video
            video.play();
            video.setAttribute('controls', 'true');
            videoContainer.classList.add('playing');
        });
    });

    // Reset videos when changing slides
    const slideButtons = document.querySelectorAll('.success-slide-btn');
    const indicators = document.querySelectorAll('.success-indicator');

    function resetVideos() {
        videos.forEach(video => {
            video.pause();
            video.currentTime = 0;
            video.removeAttribute('controls');
            video.closest('.video-container').classList.remove('playing');
        });
    }

    // Add event listeners for slide changes
    slideButtons.forEach(button => {
        button.addEventListener('click', resetVideos);
    });

    indicators.forEach(indicator => {
        indicator.addEventListener('click', resetVideos);
    });
});
// Simple Home Slideshow - Add this at the top of script.js
// ========== SIMPLE, WORKING SLIDESHOW ==========
function initializeHomeSlideshow() {
    console.log('🚀 Initializing Home Slideshow...');

    const slides = document.querySelectorAll('.slideshow-section .slide');
    console.log('Found slides:', slides.length);

    if (slides.length === 0) {
        console.error('❌ No slides found!');
        return;
    }

    let currentSlide = 0;
    const totalSlides = slides.length;

    // Function to show a specific slide
    function showSlide(index) {
        // Remove active class from all slides
        slides.forEach(slide => {
            slide.classList.remove('active');
        });

        // Add active class to current slide
        slides[index].classList.add('active');
        currentSlide = index;

        console.log(`Slide ${index + 1}/${totalSlides} shown`);
    }

    // Function to go to next slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    // Initialize first slide
    showSlide(0);

    // Start auto-slide if more than 1 slide
    if (totalSlides > 1) {
        console.log('Starting auto-slide with 4-second interval');
        setInterval(nextSlide, 4000); // Change slide every 4 seconds
    }


    // Initialize first slide
    showSlide(0);

    // Start slideshow if multiple slides
    if (totalSlides > 1) {
        console.log('Starting slideshow with interval: 3000ms');
        setInterval(nextSlide, 4000);
    }

    console.log('🎯 Slideshow initialized successfully!');
}
document.addEventListener('DOMContentLoaded', function () {
    const marqueeList = document.querySelector('.marquee-item-list');
    const marqueeItems = document.querySelectorAll('.marquee-item-list li');

    // Duplicate the items to create seamless looping
    function duplicateMarqueeItems() {
        // Clone all items and append to the list
        marqueeItems.forEach(item => {
            const clone = item.cloneNode(true);
            marqueeList.appendChild(clone);
        });
    }

    duplicateMarqueeItems();

    // Adjust animation speed based on content width
    function adjustAnimationSpeed() {
        const totalWidth = marqueeList.scrollWidth / 2; // Since we duplicated
        const containerWidth = document.querySelector('.marquee-row').offsetWidth;
        const duration = (totalWidth / containerWidth) * 15; // Base duration calculation

        marqueeList.style.animationDuration = `${duration}s`;
    }

    // Initial adjustment
    adjustAnimationSpeed();

    // Adjust on window resize
    window.addEventListener('resize', adjustAnimationSpeed);
});
document.addEventListener('DOMContentLoaded', function () {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.closest('.slide.active')) {
            img.loading = 'lazy';
        }
    });
});
// Handle cross-page navigation with hash
function handleCrossPageNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            // If it's a link to index.html with hash, handle it
            if (href.includes('index.html#')) {
                e.preventDefault();
                const [page, section] = href.split('#');

                // If we're already on index.html, just scroll
                if (window.location.pathname.includes('index.html') ||
                    window.location.pathname.endsWith('/') ||
                    !window.location.pathname.includes('.html')) {
                    handleSmoothScroll(section);
                } else {
                    // If we're on another page, navigate to index.html first
                    window.location.href = href;
                }
            }
        });
    });
}
// Handle page load with hash
function handlePageLoadHash() {
    if (window.location.hash) {
        const targetId = window.location.hash.substring(1);
        setTimeout(() => {
            handleSmoothScroll(targetId);
        }, 500);
    }
}

// Call this in your DOMContentLoaded
document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM loaded - initializing scripts');

    // Initialize slideshow FIRST
    initializeHomeSlideshow();

    // Then initialize other components
    initializeNavigation();
    initializeCourseModals();

    // Handle page load with hash
    handlePageLoadHash();
});
// Course Filter Functionality
document.addEventListener('DOMContentLoaded', function () {
    // Add filter section to the page
    addFilterSection();

    // Initialize filter functionality
    initCourseFilter();

    // Initialize course image sliders
    initCourseSliders();
});

// function addFilterSection() {
//     const coursesContainer = document.querySelector('.courses-container');
//     const coursesGrid = document.querySelector('.courses-grid');

//     // Create filter section HTML
//     const filterHTML = `
//         <div class="filter-section">
//             <h3>Filter the courses</h3>
//             <div class="filter-grid">
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-fashion" name="filter" value="fashion">
//                     <label for="filter-fashion">Fashion Designing</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-baking" name="filter" value="baking">
//                     <label for="filter-baking">Craft Baking</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-beauty" name="filter" value="beauty">
//                     <label for="filter-beauty">Beauty & Spa</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-agriculture" name="filter" value="agriculture">
//                     <label for="filter-agriculture">Agriculture</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-culinary" name="filter" value="culinary">
//                     <label for="filter-culinary">Culinary Arts</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-technology" name="filter" value="technology">
//                     <label for="filter-technology">Technology</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-construction" name="filter" value="construction">
//                     <label for="filter-construction">Construction</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-hospitality" name="filter" value="hospitality">
//                     <label for="filter-hospitality">Hospitality</label>
//                 </div>
//                 <div class="filter-item">
//                     <input type="checkbox" id="filter-cosmetology" name="filter" value="cosmetology">
//                     <label for="filter-cosmetology">Cosmetology</label>
//                 </div>
//             </div>
//             <div class="filter-actions">
//                 <div class="filter-results">Showing ${document.querySelectorAll('.course-card').length} of ${document.querySelectorAll('.course-card').length} Courses</div>
//                 <button class="clean-filters">Clean All Filters</button>
//             </div>
//         </div>
//     `;

//     // Insert filter section before courses grid
//     coursesGrid.insertAdjacentHTML('beforebegin', filterHTML);

//     // Add category labels to existing course cards
//     addCategoryLabels();
// }

function addCategoryLabels() {
    const courseCards = document.querySelectorAll('.course-card');

    // Define category mapping based on course titles
    const categoryMap = {
        'Fashion Designing': 'fashion',
        'Craft Baking': 'baking',
        'Senior Beauty and Spa': 'beauty',
        'Piggery': 'agriculture',
        'Fishery': 'agriculture',
        'Vermin Composing': 'agriculture',
        'Diary': 'agriculture',
        'Poultry': 'agriculture',
        'Mushroom Grower': 'agriculture',
        'Commis Chef': 'culinary',
        'F&B Service Associate': 'hospitality',
        'Mobile Repairing': 'technology',
        'Field Technician Services': 'technology',
        'Mason Tiling': 'construction',
        'Rural Masonry': 'construction',
        'Plumber': 'construction',
        'Welder': 'construction',
        'Fitter & Fabrication': 'construction',
        'Almirah Making': 'construction',
        'Lead Sofa Making': 'construction',
        'Asst. Beautician': 'cosmetology',
        'Cosmetology': 'cosmetology'
    };

    courseCards.forEach(card => {
        const title = card.querySelector('h3').textContent.trim();
        const category = categoryMap[title] || 'general';

        // Add data-category attribute
        card.setAttribute('data-category', category);

        // Add category label
        const categoryLabel = document.createElement('span');
        categoryLabel.className = 'course-category';
        categoryLabel.textContent = getCategoryDisplayName(category);

        const courseContent = card.querySelector('.course-content');
        courseContent.insertBefore(categoryLabel, courseContent.querySelector('h3'));
    });
}

function getCategoryDisplayName(category) {
    const displayNames = {
        'fashion': 'Fashion',
        'baking': 'Baking',
        'beauty': 'Beauty & Spa',
        'agriculture': 'Agriculture',
        'culinary': 'Culinary',
        'technology': 'Technology',
        'construction': 'Construction',
        'hospitality': 'Hospitality',
        'cosmetology': 'Cosmetology',
        'general': 'General'
    };

    return displayNames[category] || category;
}

function initCourseFilter() {
    const filterCheckboxes = document.querySelectorAll('input[name="filter"]');
    const courseCards = document.querySelectorAll('.course-card');
    const filterResults = document.querySelector('.filter-results');
    const cleanFiltersBtn = document.querySelector('.clean-filters');
    const coursesGrid = document.querySelector('.courses-grid');

    // Filter courses based on selected categories
    function filterCourses() {
        const selectedCategories = Array.from(filterCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        let visibleCount = 0;

        courseCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');

            if (selectedCategories.length === 0 || selectedCategories.includes(cardCategory)) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update results count
        filterResults.textContent = `Showing ${visibleCount} of ${courseCards.length} Courses`;

        // Add filtering animation
        coursesGrid.classList.add('filtering');
        setTimeout(() => {
            coursesGrid.classList.remove('filtering');
        }, 300);
    }

    // Add event listeners to filter checkboxes
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterCourses);
    });

    // Clean all filters
    cleanFiltersBtn.addEventListener('click', function () {
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        filterCourses();
    });
}

function initCourseSliders() {
    document.querySelectorAll('.course-image-slider').forEach(slider => {
        const track = slider.querySelector('.slider-track');
        const slides = slider.querySelectorAll('.slide');
        const indicators = slider.querySelectorAll('.indicator');
        let currentSlide = 0;
        let slideInterval;

        function goToSlide(index) {
            track.style.transform = `translateX(-${index * 100}%)`;

            // Update indicators
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });

            currentSlide = index;
        }

        // Add click events to indicators
        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                clearInterval(slideInterval);
                goToSlide(index);
                startAutoSlide();
            });
        });

        function startAutoSlide() {
            slideInterval = setInterval(() => {
                const nextSlide = (currentSlide + 1) % slides.length;
                goToSlide(nextSlide);
            }, 5000);
        }

        // Start auto-sliding
        startAutoSlide();

        // Pause on hover
        slider.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });

        slider.addEventListener('mouseleave', () => {
            startAutoSlide();
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // Force black navbar on non-home pages
    const navbar = document.getElementById('navbar');
    if (navbar && !window.location.pathname.includes('index.html') &&
        window.location.pathname !== '/' &&
        window.location.pathname.includes('.html')) {
        navbar.classList.add('default-black');
    }
});
// Course Pagination and Filtering
document.addEventListener('DOMContentLoaded', function () {
    initCoursePagination();
    initCourseFilter();
});

function initCoursePagination() {
    const courseCards = document.querySelectorAll('.course-card');
    const itemsPerPage = 6;
    let currentPage = 1;

    function showPage(page) {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        courseCards.forEach((card, index) => {
            if (index >= startIndex && index < endIndex && card.style.display !== 'none') {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        updatePagination();
    }

    function updatePagination() {
        const visibleCards = Array.from(courseCards).filter(card => card.style.display !== 'none');
        const totalPages = Math.ceil(visibleCards.length / itemsPerPage);

        // Update pagination numbers
        const paginationNumbers = document.querySelector('.pagination-numbers');
        paginationNumbers.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('button');
            pageNumber.className = `pagination-number ${i === currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => {
                currentPage = i;
                showPage(currentPage);
            });
            paginationNumbers.appendChild(pageNumber);
        }

        // Update button states
        document.querySelector('.prev-page').disabled = currentPage === 1;
        document.querySelector('.next-page').disabled = currentPage === totalPages;

        // Update results count
        const startItem = ((currentPage - 1) * itemsPerPage) + 1;
        const endItem = Math.min(currentPage * itemsPerPage, visibleCards.length);
        document.querySelector('.filter-results').textContent = `Showing ${startItem}-${endItem} of ${visibleCards.length} Courses`;
    }

    // Event listeners for pagination buttons
    document.querySelector('.prev-page').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            showPage(currentPage);
        }
    });

    document.querySelector('.next-page').addEventListener('click', () => {
        const visibleCards = Array.from(courseCards).filter(card => card.style.display !== 'none');
        const totalPages = Math.ceil(visibleCards.length / itemsPerPage);

        if (currentPage < totalPages) {
            currentPage++;
            showPage(currentPage);
        }
    });

    // Initialize first page
    showPage(1);
}
// ========== FIX LOGO CLICK TO HOME ==========
document.addEventListener('DOMContentLoaded', function () {
    // Make logo clickable to go to home
    const logo = document.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', function (e) {
            e.preventDefault();
            // Go to home page
            window.location.href = 'index.html';
        });

        // Add cursor pointer to indicate it's clickable
        logo.style.cursor = 'pointer';
    }
});

// ========== FIX REGISTER BUTTON TO SCROLL TO REGISTRATION ==========
document.addEventListener('DOMContentLoaded', function () {
    // Get all "Register yourself" buttons
    const registerButtons = document.querySelectorAll('.apply-now-button');

    registerButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();

            // Find the registration section (id="contact")
            const registrationSection = document.getElementById('contact');

            if (registrationSection) {
                // Smooth scroll to registration section
                registrationSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                // If not found, just scroll to bottom
                window.scrollTo({
                    top: document.body.scrollHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
});

function initCourseFilter() {
    const filterCheckboxes = document.querySelectorAll('input[name="filter"]');
    const courseCards = document.querySelectorAll('.course-card');
    const cleanFiltersBtn = document.querySelector('.clean-filters');

    function filterCourses() {
        const selectedCategories = Array.from(filterCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => checkbox.value);

        courseCards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');

            if (selectedCategories.length === 0 || selectedCategories.includes(cardCategory)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });

        // Reset to first page after filtering
        initCoursePagination();
    }

    // Add event listeners to filter checkboxes
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', filterCourses);
    });

    // Clean all filters
    cleanFiltersBtn.addEventListener('click', function () {
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        filterCourses();
    });
}
// Navigation functionality
document.addEventListener('DOMContentLoaded', function () {
    const navbar = document.getElementById('navbar');
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Check if we're on about.html or courses.html
    const isBlackNavPage = currentPage === 'about.html' || currentPage === 'courses.html';

    // Mobile navigation toggle
    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', function () {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }

    // Navbar scroll effect - only apply to home page
    if (!isBlackNavPage) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    } else {
        // For about and courses pages, always ensure black navbar
        navbar.classList.add('default-black');
        // Remove any scrolled class that might interfere
        navbar.classList.remove('scrolled');
    }

    // Close mobile menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (mobileNavToggle && navMenu) {
                mobileNavToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        if (navMenu && mobileNavToggle) {
            const isClickInsideNav = navbar.contains(event.target);
            if (!isClickInsideNav && navMenu.classList.contains('active')) {
                mobileNavToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        }
    });

    // Apply now button functionality
    const applyButtons = document.querySelectorAll('.apply-now-button');
    applyButtons.forEach(button => {
        button.addEventListener('click', function () {
            window.location.href = 'index.html#apply';
        });
    });
});
// Pagination functionality
document.addEventListener('DOMContentLoaded', function () {
    const coursesPerPage = 4;
    const coursesList = document.getElementById('coursesList');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const paginationNumbers = document.getElementById('paginationNumbers');
    const resultsCount = document.querySelector('.results-count');

    // Sample course data - replace with your actual courses
    const allCourses = [
        // Add all 22 of your courses here in this format:
        {
            image: '../images/fashion designing1.jpg',
            badge: 'Fashion Designing',
            title: 'SM-Fashion Designing',
            description: 'Learn garment construction, pattern making, and fashion illustration techniques.'
        },
        {
            image: '../images/craftbaking1.jpg',
            badge: 'Craft Baking',
            title: 'SM-Craft Baking',
            description: 'Master the art of artisanal breads, pastries, and confectionery products.'
        },
        {
            image: '../images/commis chef2a.jpg',
            badge: 'Commis Chef',
            title: 'SM-Commis Chef',
            description: 'Foundation course in professional culinary arts and kitchen operations.'
        },
        {
            image: '../images/ifs piggery-Photoroom1.png',
            badge: 'Piggery',
            title: 'SM-Piggery',
            description: 'Modern pig farming techniques, animal husbandry, and farm management.'
        },
        {
            image: '../images/fb1.jpg',
            badge: 'Food and Beverages',
            title: 'SM-Food and Beverages Services',
            description: 'Hospitality training for restaurant and food service operations.'
        },
        {
            image: '../images/mobile1.jpg',
            badge: 'Mobile Repairing',
            title: 'SM-Mobile Repairing',
            description: 'Hardware and software troubleshooting for smartphones and devices.'
        },
        {
            image: '../images/poultry2a.jpg"',
            badge: 'Poultry',
            title: 'SM-Poultry',
            description: 'Poultry farming, chicken rearing, and egg production management techniques.'
        },
        {
            image: '../images/mason1.jpg',
            badge: 'Mason Tiling',
            title: 'SM-Mason Tiling',
            description: 'Construction skills including tiling, masonry, and finishing works.'
        },
        {
            image: '../images/beauty and spa.jpg',
            badge: 'Beauty and Spa',
            title: 'SM-Senior Beauty and Spa',
            description: 'Professional beauty therapy, skincare, and spa treatments training.'
        },
        {
            image: '../images/diaryfarmin1a.jpg',
            badge: 'Dairy',
            title: 'SM-Dairy',
            description: 'Dairy farming, milk production, and cattle management techniques.'
        },
        {
            image: '../images/vermin1a.jpg',
            badge: 'Vermicomposting',
            title: 'SM-Vermicomposting',
            description: 'Organic waste management and vermicompost production techniques.'
        },
        {
            image: '../images/asst beautician1.jpg',
            badge: 'Beautician',
            title: 'SM-Asst Beautician',
            description: 'Basic beauty treatments, skincare, and salon assistance techniques.'
        },
        {
            image: '../images/women empowerment new.jpg',
            badge: 'Rural Masonry',
            title: 'SM-Women Empowerment-Rural Masonry',
            description: 'Basic construction skills and masonry techniques for rural development.'
        },
        {
            image: '../images/mushroom grower1.jpg',
            badge: 'Mushroom Grower',
            title: 'SM-Mushroom Grower',
            description: 'Mushroom cultivation techniques, harvesting, and preservation methods.'
        },
        {
            image: '../images/plum1.jpg',
            badge: 'Plumber',
            title: 'SM-Plumber',
            description: 'Pipe fitting, drainage systems, and plumbing installation techniques.'
        },
        {
            image: '../images/fitfabri1.jpg',
            badge: 'Fitter & Fabrication',
            title: 'SM-Fitter&Fabrication',
            description: 'Metal fitting, welding, and fabrication techniques for industrial applications.'
        },
        {
            image: '../images/field1.jpg',
            badge: 'Field Technician',
            title: 'SM-Field Technician Services',
            description: 'Equipment maintenance, troubleshooting, and field service operations.'
        },
        {
            image: '../images/wooden almirah making.jpg',
            badge: 'Almirah Making',
            title: 'SM-Almirah Making',
            description: 'Woodworking, cabinet making, and furniture construction techniques.'
        },
        {
            image: '../images/welding1.jpg',
            badge: 'Welder',
            title: 'SM-Welder',
            description: 'Arc welding, gas welding, and metal joining techniques.'
        },
        {
            image: '../images/sofa1.jpg',
            badge: 'Sofa Making',
            title: 'SM-Lead Sofa Making',
            description: 'Upholstery, sofa frame construction, and furniture design techniques.'
        },
        {
            image: '../images/cosmetology1.jpg',
            badge: 'Cosmetology',
            title: 'SM-Cosmetology',
            description: 'Advanced beauty treatments, makeup artistry, and salon management.'
        },
        {
            image: '../images/fishery1a.jpg',
            badge: 'Fishery',
            title: 'SM-Fishery',
            description: 'Fish farming, aquaculture techniques, and fishery management.'
        }

        // Add 20 more courses...
    ];

    let currentPage = 1;
    const totalPages = Math.ceil(allCourses.length / coursesPerPage);

    // Initialize pagination
    function initPagination() {
        updatePaginationNumbers();
        showPage(currentPage);
        updatePaginationButtons();
    }

    // Show courses for specific page
    function showPage(page) {
        const startIndex = (page - 1) * coursesPerPage;
        const endIndex = startIndex + coursesPerPage;
        const coursesToShow = allCourses.slice(startIndex, endIndex);

        coursesList.innerHTML = '';

        coursesToShow.forEach(course => {
            const courseCard = createCourseCard(course);
            coursesList.appendChild(courseCard);
        });

        // Update results count
        const startCourse = startIndex + 1;
        const endCourse = Math.min(endIndex, allCourses.length);
        resultsCount.textContent = `Showing ${startCourse}-${endCourse} of ${allCourses.length} Courses`;
    }

    // Create course card HTML
    function createCourseCard(course) {
        const card = document.createElement('div');
        card.className = 'course-card';
        card.innerHTML = `
            <div class="course-card-content">
                <div class="course-image">
                    <img src="${course.image}" alt="${course.title}">
                </div>
                <div class="course-text-content">
                    <div class="course-badge">${course.badge}</div>
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-description">${course.description}</p>
                    <div class="course-actions">
                        <button class="details-btn">More Details</button>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    // Update pagination numbers
    function updatePaginationNumbers() {
        paginationNumbers.innerHTML = '';

        for (let i = 1; i <= totalPages; i++) {
            const pageNumber = document.createElement('span');
            pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageNumber.textContent = i;
            pageNumber.addEventListener('click', () => goToPage(i));
            paginationNumbers.appendChild(pageNumber);
        }
    }

    // Update pagination buttons state
    function updatePaginationButtons() {
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = currentPage === totalPages;
    }

    // Go to specific page
    function goToPage(page) {
        currentPage = page;
        showPage(currentPage);
        updatePaginationNumbers();
        updatePaginationButtons();
    }

    // Event listeners
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        }
    });

    // Initialize
    initPagination();
});
// Course Filter Functionality
document.addEventListener('DOMContentLoaded', function () {
    initializeCourseFilter();
});

function initializeCourseFilter() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox input');
    const clearFiltersBtn = document.querySelector('.clear-filters-btn');

    // Course data mapping
    const courseCategories = {
        'Fashion Designing': 'SM-Fashion Designing',
        'Craft Baking': 'SM-Craft Baking',
        'Commis Chef': 'SM-Commis Chef',
        'Food and Beverages Services': 'SM-Food and Beverages Services',
        'Mobile Repairing': 'SM-Mobile Repairing',
        'Mason Tiling': 'SM-Mason Tiling',
        'Senior Beauty and Spa': 'SM-Senior Beauty and Spa',
        'IFS (Integrated Farming System)': ['SM-Piggery', 'SM-Poultry', 'SM-Dairy', 'SM-Vermicomposting', 'SM-Fishery'],
        'Asst Beautician': 'SM-Asst Beautician',
        'Women Empowerment-Rural Masonry': 'SM-Women Empowerment-Rural Masonry',
        'Mushroom Grower': 'SM-Mushroom Grower',
        'Plumber': 'SM-Plumber',
        'Fitter & Fabrication': 'SM-Fitter&Fabrication',
        'Field Technician Services': 'SM-Field Technician Services',
        'Almirah Making': 'SM-Almirah Making',
        'Welder': 'SM-Welder',
        'Lead Sofa Making': 'SM-Lead Sofa Making',
        'Cosmetology': 'SM-Cosmetology'
    };

    // Store original course data
    let originalCourses = [...allCourses];

    // Add event listeners to filter checkboxes
    filterCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            filterCourses();
        });
    });

    // Clear all filters
    clearFiltersBtn.addEventListener('click', function () {
        filterCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        // Reset to original courses
        allCourses = [...originalCourses];
        filterCourses();
    });

    function filterCourses() {
        const selectedCategories = Array.from(filterCheckboxes)
            .filter(checkbox => checkbox.checked)
            .map(checkbox => {
                const label = checkbox.parentElement.textContent.trim();
                return courseCategories[label];
            });

        // Flatten the array to handle IFS which has multiple courses
        const selectedCourseTitles = selectedCategories.flat();

        if (selectedCourseTitles.length === 0) {
            // Show all courses if no filters selected
            allCourses = [...originalCourses];
        } else {
            // Filter courses based on selected categories
            allCourses = originalCourses.filter(course =>
                selectedCourseTitles.includes(course.title)
            );
        }

        // Reset to first page and update display
        currentPage = 1;
        updatePaginationNumbers();
        updatePaginationButtons();
        showPage(currentPage);
    }
}

// Global variables for pagination
let currentPage = 1;
const coursesPerPage = 4;
let allCourses = [
    {
        image: '../images/fashion designing1.jpg',
        badge: 'Fashion Designing',
        title: 'SM-Fashion Designing',
        description: 'Learn garment construction, pattern making, and fashion illustration techniques.'
    },
    {
        image: '../images/craftbaking1.jpg',
        badge: 'Craft Baking',
        title: 'SM-Craft Baking',
        description: 'Master the art of artisanal breads, pastries, and confectionery products.'
    },
    {
        image: '../images/commis chef2a.jpg',
        badge: 'Commis Chef',
        title: 'SM-Commis Chef',
        description: 'Foundation course in professional culinary arts and kitchen operations.'
    },
    {
        image: '../images/ifs piggery-Photoroom1.png',
        badge: 'Piggery',
        title: 'SM-Piggery',
        description: 'Modern pig farming techniques, animal husbandry, and farm management.'
    },
    {
        image: '../images/fb1.jpg',
        badge: 'Food and Beverages',
        title: 'SM-Food and Beverages Services',
        description: 'Hospitality training for restaurant and food service operations.'
    },
    {
        image: '../images/mobile1.jpg',
        badge: 'Mobile Repairing',
        title: 'SM-Mobile Repairing',
        description: 'Hardware and software troubleshooting for smartphones and devices.'
    },
    {
        image: '../images/poultry1a.jpg',
        badge: 'Poultry',
        title: 'SM-Poultry',
        description: 'Poultry farming, chicken rearing, and egg production management techniques.'
    },
    {
        image: '../images/mason1.jpg',
        badge: 'Mason Tiling',
        title: 'SM-Mason Tiling',
        description: 'Construction skills including tiling, masonry, and finishing works.'
    },
    {
        image: '../images/beauty and spa.jpg',
        badge: 'Beauty and Spa',
        title: 'SM-Senior Beauty and Spa',
        description: 'Professional beauty therapy, skincare, and spa treatments training.'
    },
    {
        image: '../images/diaryfarmin1a.jpg',
        badge: 'Dairy',
        title: 'SM-Dairy',
        description: 'Dairy farming, milk production, and cattle management techniques.'
    },
    {
        image: '../images/vermin1a.jpg',
        badge: 'Vermicomposting',
        title: 'SM-Vermicomposting',
        description: 'Organic waste management and vermicompost production techniques.'
    },
    {
        image: '../images/asst beautician1.jpg',
        badge: 'Beautician',
        title: 'SM-Asst Beautician',
        description: 'Basic beauty treatments, skincare, and salon assistance techniques.'
    },
    {
        image: '../images/women empowerment new.jpg',
        badge: 'Rural Masonry',
        title: 'SM-Women Empowerment-Rural Masonry',
        description: 'Basic construction skills and masonry techniques for rural development.'
    },
    {
        image: '../images/mushroom grower1.jpg',
        badge: 'Mushroom Grower',
        title: 'SM-Mushroom Grower',
        description: 'Mushroom cultivation techniques, harvesting, and preservation methods.'
    },
    {
        image: '../images/plum1.jpg',
        badge: 'Plumber',
        title: 'SM-Plumber',
        description: 'Pipe fitting, drainage systems, and plumbing installation techniques.'
    },
    {
        image: '../images/fitfabri1.jpg',
        badge: 'Fitter & Fabrication',
        title: 'SM-Fitter&Fabrication',
        description: 'Metal fitting, welding, and fabrication techniques for industrial applications.'
    },
    {
        image: '../images/field1.jpg',
        badge: 'Field Technician',
        title: 'SM-Field Technician Services',
        description: 'Equipment maintenance, troubleshooting, and field service operations.'
    },
    {
        image: '../images/wooden almirah making.jpg',
        badge: 'Almirah Making',
        title: 'SM-Almirah Making',
        description: 'Woodworking, cabinet making, and furniture construction techniques.'
    },
    {
        image: '../images/welding1.jpg',
        badge: 'Welder',
        title: 'SM-Welder',
        description: 'Arc welding, gas welding, and metal joining techniques.'
    },
    {
        image: '../images/sofa1.jpg',
        badge: 'Sofa Making',
        title: 'SM-Lead Sofa Making',
        description: 'Upholstery, sofa frame construction, and furniture design techniques.'
    },
    {
        image: '../images/cosmetology1.jpg',
        badge: 'Cosmetology',
        title: 'SM-Cosmetology',
        description: 'Advanced beauty treatments, makeup artistry, and salon management.'
    },
    {
        image: '../images/fishery1a.jpg',
        badge: 'Fishery',
        title: 'SM-Fishery',
        description: 'Fish farming, aquaculture techniques, and fishery management.'
    }
];

// Initialize pagination when page loads
document.addEventListener('DOMContentLoaded', function () {
    initPagination();
});

function initPagination() {
    updatePaginationNumbers();
    showPage(currentPage);
    updatePaginationButtons();
}

function showPage(page) {
    const coursesList = document.getElementById('coursesList');
    const resultsCount = document.querySelector('.results-count');

    const startIndex = (page - 1) * coursesPerPage;
    const endIndex = startIndex + coursesPerPage;
    const coursesToShow = allCourses.slice(startIndex, endIndex);

    coursesList.innerHTML = '';

    coursesToShow.forEach(course => {
        const courseCard = createCourseCard(course);
        coursesList.appendChild(courseCard);
    });

    // Update results count
    const startCourse = startIndex + 1;
    const endCourse = Math.min(endIndex, allCourses.length);
    resultsCount.textContent = `Showing ${startCourse}-${endCourse} of ${allCourses.length} Courses`;
}

function createCourseCard(course) {
    const card = document.createElement('div');
    card.className = 'course-card';

    // Create URL-friendly course ID
    const courseId = course.title.replace(/\s+/g, '-').toLowerCase();

    card.innerHTML = `
        <div class="course-card-content">
            <div class="course-image">
                <img src="${course.image}" alt="${course.title}">
            </div>
            <div class="course-text-content">
                <div class="course-badge">${course.badge}</div>
                <h3 class="course-title">${course.title}</h3>
                <p class="course-description">${course.description}</p>
                <div class="course-actions">
                    <button class="details-btn" onclick="viewCourseDetail('${courseId}')">More Details</button>
                </div>
            </div>
        </div>
    `;
    return card;
}

// Function to navigate to course detail page
function viewCourseDetail(courseId) {
    window.location.href = `course-detail.html?course=${courseId}`;
}

function updatePaginationNumbers() {
    const paginationNumbers = document.getElementById('paginationNumbers');
    const totalPages = Math.ceil(allCourses.length / coursesPerPage);

    paginationNumbers.innerHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        const pageNumber = document.createElement('span');
        pageNumber.className = `page-number ${i === currentPage ? 'active' : ''}`;
        pageNumber.textContent = i;
        pageNumber.addEventListener('click', () => goToPage(i));
        paginationNumbers.appendChild(pageNumber);
    }
}

function updatePaginationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const totalPages = Math.ceil(allCourses.length / coursesPerPage);

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function goToPage(page) {
    currentPage = page;
    showPage(currentPage);
    updatePaginationNumbers();
    updatePaginationButtons();
}
/// Mobile Navigation Toggle - SINGLE, CLEAN VERSION
// ========== MAIN NAVIGATION - SINGLE SOURCE OF TRUTH ==========
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Initializing navigation...');

    // Get elements
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');

    if (!mobileNavToggle || !navMenu) {
        console.error('❌ Navigation elements not found!');
        return;
    }

    console.log('✅ Found:', { mobileNavToggle, navMenu });

    // SINGLE TOGGLE FUNCTION
    function toggleMobileMenu() {
        console.log('Toggling menu...');

        // Toggle hamburger icon
        mobileNavToggle.classList.toggle('active');

        // Toggle mobile menu - USING 'mobile-active' (matches CSS)
        navMenu.classList.toggle('mobile-active');

        // Toggle body scroll lock
        document.body.classList.toggle('menu-open');

        // Debug
        console.log('Menu state:', navMenu.classList.contains('mobile-active') ? 'OPEN' : 'CLOSED');
        console.log('Hamburger state:', mobileNavToggle.classList.contains('active') ? 'X' : 'HAMBURGER');
    }

    // CLOSE FUNCTION
    function closeMobileMenu() {
        console.log('Closing menu...');
        mobileNavToggle.classList.remove('active');
        navMenu.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
    }

    // ========== EVENT LISTENERS ==========

    // 1. Hamburger click
    mobileNavToggle.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Hamburger clicked');
        toggleMobileMenu();
    });

    // 2. Nav links click
    const navLinks = navMenu.querySelectorAll('.nav-link, .apply-now-button');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            console.log('Nav link clicked, closing menu');
            closeMobileMenu();
        });
    });

    // 3. Close when clicking outside
    document.addEventListener('click', function (e) {
        const isClickInsideMenu = navMenu.contains(e.target);
        const isClickOnToggle = mobileNavToggle.contains(e.target);

        if (!isClickInsideMenu && !isClickOnToggle && navMenu.classList.contains('mobile-active')) {
            console.log('Clicked outside, closing menu');
            closeMobileMenu();
        }
    });

    // 4. Close on escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navMenu.classList.contains('mobile-active')) {
            console.log('Escape pressed, closing menu');
            closeMobileMenu();
        }
    });

    // 5. Close on window resize (for desktop)
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768 && navMenu.classList.contains('mobile-active')) {
            console.log('Resized to desktop, closing menu');
            closeMobileMenu();
        }
    });

    console.log('✅ Navigation initialized successfully!');

    // Initialize other components
    initializeHomeSlideshow();
    initializeCourseModals();

    // Debug: Check initial state
    console.log('Initial classes:');
    console.log('- mobileNavToggle:', mobileNavToggle.classList.toString());
    console.log('- navMenu:', navMenu.classList.toString());
    console.log('- body:', document.body.classList.toString());
});

// Keep your other functions but remove duplicate navigation code:
// KEEP THESE:
function initializeHomeSlideshow() { /* your existing code */ }
function initializeCourseModals() { /* your existing code */ }
function showCourseDetails() { /* your existing code */ }

// REMOVE OR COMMENT OUT:
// 1. The duplicate initializeNavigation() function at the top
// 2. The "Mobile Navigation Toggle - SINGLE, CLEAN VERSION" section at the bottom

document.addEventListener('DOMContentLoaded', function () {
    console.log('NEIPS Website Script Loaded');

    // ========== MOBILE NAVIGATION ==========
    // ========== FIXED MOBILE NAVIGATION ==========
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', function () {
            // Hamburger animation: toggle 'active' class
            mobileNavToggle.classList.toggle('active');

            // Menu display: toggle 'mobile-active' class (matches your CSS)
            navMenu.classList.toggle('mobile-active');

            // Body scroll lock: toggle 'menu-open' class (matches your CSS)
            document.body.classList.toggle('menu-open');

            console.log('Fixed navigation clicked');
            console.log('Hamburger has "active":', mobileNavToggle.classList.contains('active'));
            console.log('Menu has "mobile-active":', navMenu.classList.contains('mobile-active'));
        });

        // Close menu when clicking links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                mobileNavToggle.classList.remove('active');
                navMenu.classList.remove('mobile-active');
                document.body.classList.remove('menu-open');
            });
        });
    }

    // ========== "VIEW MORE" BUTTONS - UPDATED PATHS ==========
    const viewMoreLinksBtn = document.getElementById('viewMoreLinksBtn');
    const viewMoreNewsBtn = document.getElementById('viewMoreNewsBtn');

    // Important Links button - CORRECTED PATH
    if (viewMoreLinksBtn) {
        console.log('Important Links button found');
        viewMoreLinksBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Navigating to viewmore/important-links.html');
            window.location.href = 'viewmore/important-links.html';
        });
    } else {
        console.log('Important Links button NOT found');
    }

    // News & Media button - CORRECTED PATH
    if (viewMoreNewsBtn) {
        console.log('News & Media button found');
        viewMoreNewsBtn.addEventListener('click', function (e) {
            e.preventDefault();
            console.log('Navigating to viewmore/new-media.html');
            window.location.href = 'viewmore/new-media.html';
        });
    } else {
        console.log('News & Media button NOT found');
    }

    // ========== MARQUEE SCROLLING ==========
    const scrollContents = document.querySelectorAll('.scroll-content');

    if (scrollContents.length > 0) {
        // Pause on hover
        scrollContents.forEach(content => {
            content.addEventListener('mouseenter', function () {
                this.style.animationPlayState = 'paused';
            });

            content.addEventListener('mouseleave', function () {
                this.style.animationPlayState = 'running';
            });
        });

        // Adjust speed
        scrollContents.forEach(content => {
            const items = content.querySelectorAll('.link-item, .news-item');
            if (items.length > 0) {
                const speed = items.length * 2;
                content.style.animationDuration = `${speed}s`;
            }
        });
    }

    // ========== LINK CLICK HANDLERS ==========
    // ========== LINK CLICK HANDLERS ==========
    const linkContents = document.querySelectorAll('.link-content');
    linkContents.forEach(link => {
        link.addEventListener('click', function (e) {
            const text = this.querySelector('.link-text').textContent;

            // Only prevent default for these specific links
            if (text.includes('meghicc.com') ||
                text.includes('Ministry of Commerce') ||
                text.includes('Department for Promotion') ||
                text.includes('Commerce and Industries Department') ||
                text.includes('Invest Meghalaya') ||
                text.includes('Meghalaya Tourism')) {

                e.preventDefault();

                // Open external links
                if (text.includes('meghicc.com')) {
                    window.open('https://www.meghicc.com', '_blank');
                } else if (text.includes('Ministry of Commerce')) {
                    window.open('https://commerce.gov.in', '_blank');
                } else if (text.includes('Department for Promotion')) {
                    window.open('https://dpiit.gov.in', '_blank');
                } else if (text.includes('Commerce and Industries Department')) {
                    window.open('https://megindustry.gov.in', '_blank');
                } else if (text.includes('Invest Meghalaya')) {
                    window.open('https://investmeghalaya.gov.in', '_blank');
                } else if (text.includes('Meghalaya Tourism')) {
                    window.open('https://meghalayatourism.gov.in', '_blank');
                }
            }
            // For all other links (PDFs, external links), let them work normally
        });
    });
    // FIX FOR IMPORTANT LINKS PANEL
    document.addEventListener('DOMContentLoaded', function () {
        // Remove the click event listeners that prevent default
        const linkContents = document.querySelectorAll('.important-links .link-content');

        linkContents.forEach(link => {
            // Clone the link to remove all event listeners
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
        });

        console.log('Important links panel fixed - links should work now');
    });

    document.addEventListener('DOMContentLoaded', function () {
        // Create duplicate items for seamless infinite scrolling
        const marqueeTrack = document.querySelector('.marquee-track');
        const originalItems = marqueeTrack.innerHTML;

        // Create a duplicate set for seamless scrolling
        const duplicateTrack = document.createElement('div');
        duplicateTrack.className = 'marquee-track-duplicate';
        duplicateTrack.innerHTML = originalItems;

        // Append the duplicate content
        marqueeTrack.innerHTML += originalItems;

        // Marquee click handler
        const marqueeLinks = document.querySelectorAll('.marquee-link');
        const districtSelect = document.getElementById('apply-address');
        const tradeSelect = document.getElementById('apply-trade');

        marqueeLinks.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();

                // Get district and trade from data attributes
                const marqueeItem = this.closest('.marquee-item');
                const district = marqueeItem.dataset.district;
                const trade = marqueeItem.dataset.trade;

                // Scroll to registration form
                const registrationForm = document.getElementById('registrationForm');
                if (registrationForm) {
                    registrationForm.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });

                    // Add a visual feedback
                    this.style.background = 'rgba(255, 255, 255, 0.3)';
                    setTimeout(() => {
                        this.style.background = '';
                    }, 500);

                    // Set district if it exists in the dropdown
                    if (districtSelect) {
                        districtSelect.value = district;

                        // Trigger change event to load trades
                        const event = new Event('change');
                        districtSelect.dispatchEvent(event);

                        // Set trade after a small delay to allow trades to load
                        setTimeout(() => {
                            if (tradeSelect) {
                                // Try to find and select the trade
                                for (let option of tradeSelect.options) {
                                    if (option.text.includes(trade) || option.value.includes(trade)) {
                                        tradeSelect.value = option.value;
                                        break;
                                    }
                                }
                            }
                        }, 500);
                    }
                }
            });
        });

        // Ensure marquee never stops
        const marqueeContent = document.querySelector('.marquee-content');
        marqueeContent.addEventListener('mouseenter', function () {
            // NO PAUSE - keep it moving
        });

        marqueeContent.addEventListener('mouseleave', function () {
            // NO RESUME needed since it never stopped
        });
    });

    // ========== REGISTER BUTTON ==========
    const applyButton = document.querySelector('.apply-now-button');
    if (applyButton) {
        applyButton.addEventListener('click', function (e) {
            e.preventDefault();
            const applySection = document.querySelector('.apply-section');
            if (applySection) {
                applySection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // ========== STICKY NAVBAR ==========
    window.addEventListener('scroll', function () {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('sticky');
            } else {
                navbar.classList.remove('sticky');
            }
        }
    });

    // ========== LINK HOVER EFFECTS ==========
    const allLinks = document.querySelectorAll('.link-content, .news-link');
    allLinks.forEach(link => {
        link.addEventListener('mouseenter', function () {
            const textElement = this.querySelector('.link-text, .news-title');
            if (textElement) {
                textElement.style.textDecoration = 'underline';
            }
        });

        link.addEventListener('mouseleave', function () {
            const textElement = this.querySelector('.link-text, .news-title');
            if (textElement) {
                textElement.style.textDecoration = 'none';
            }
        });
    });

    console.log('All scripts initialized successfully');
});
// Force auto-scroll to work on mobile
document.addEventListener('DOMContentLoaded', function () {
    function fixMobileAnimation() {
        const scrollContents = document.querySelectorAll('.scroll-content');
        const isMobile = window.innerWidth <= 991;

        scrollContents.forEach(content => {
            // Remove and re-add animation to force it to work
            if (isMobile) {
                // Save current animation
                const currentAnimation = content.style.animation;

                // Remove animation
                content.style.animation = 'none';
                content.style.webkitAnimation = 'none';

                // Force reflow
                void content.offsetWidth;

                // Re-add animation with mobile settings
                if (window.innerWidth <= 480) {
                    content.style.animation = 'scrollUp 20s linear infinite';
                    content.style.webkitAnimation = 'scrollUp 20s linear infinite';
                } else if (window.innerWidth <= 991) {
                    content.style.animation = 'scrollUp 25s linear infinite';
                    content.style.webkitAnimation = 'scrollUp 25s linear infinite';
                }

                // Ensure it's running
                content.style.animationPlayState = 'running';
                content.style.webkitAnimationPlayState = 'running';
            }
        });
    }

    // Run on load
    setTimeout(fixMobileAnimation, 100);

    // Run on resize
    window.addEventListener('resize', fixMobileAnimation);

    // Also trigger after images load
    window.addEventListener('load', fixMobileAnimation);
});

// Alternative: Use requestAnimationFrame for smooth scrolling
if (window.innerWidth <= 991) {
    function manualScroll() {
        const scrollContents = document.querySelectorAll('.scroll-content');

        scrollContents.forEach(content => {
            // Get current position
            let currentTop = parseFloat(content.style.top || 0);

            // Move up by 1px
            currentTop -= 0.5;

            // Reset when scrolled enough
            if (currentTop < -content.scrollHeight / 2) {
                currentTop = 0;
            }

            // Apply new position
            content.style.top = currentTop + 'px';
        });

        // Continue animation
        requestAnimationFrame(manualScroll);
    }

    // Start manual scrolling on mobile as fallback
    if (window.innerWidth <= 991) {
        setTimeout(() => {
            // Check if CSS animation is working
            const testElement = document.querySelector('.scroll-content');
            const computedStyle = window.getComputedStyle(testElement);
            const animationName = computedStyle.animationName;

            if (animationName === 'none' || animationName === '') {
                // CSS animation not working, use manual scroll
                manualScroll();
            }
        }, 1000);
    }
}
function initializeHomeSlideshow() {
    console.log('Testing simple slideshow...');
    
    const slides = document.querySelectorAll('.slideshow-section .slide');
    let current = 0;
    
    // Make sure all slides are hidden except first
    slides.forEach((slide, index) => {
        slide.style.opacity = index === 0 ? '1' : '0';
        slide.style.position = 'absolute';
        slide.style.width = '100%';
        slide.style.height = '100%';
        slide.style.transition = 'opacity 1s';
    });
    
    // Auto rotate
    if (slides.length > 1) {
        setInterval(() => {
            slides[current].style.opacity = '0';
            current = (current + 1) % slides.length;
            slides[current].style.opacity = '1';
            console.log(`Changed to slide ${current + 1}`);
        }, 4000);
    }
}// ========== MOBILE AUTH LOGO FUNCTIONALITY ==========
document.addEventListener('DOMContentLoaded', function() {
    // Mobile auth logo functionality
    const mobileAuthLogo = document.getElementById('mobileAuthLogo');
    const mobileAuthDropdown = document.getElementById('mobileAuthDropdown');
    const mobileAuthIcon = document.querySelector('.mobile-auth-icon');
    
    if (mobileAuthLogo && mobileAuthDropdown && mobileAuthIcon) {
        let isMobileAuthOpen = false;
        
        function toggleMobileAuthDropdown() {
            isMobileAuthOpen = !isMobileAuthOpen;
            
            if (isMobileAuthOpen) {
                mobileAuthLogo.classList.add('active');
                mobileAuthDropdown.classList.add('show');
                console.log('Mobile auth dropdown opened');
            } else {
                mobileAuthLogo.classList.remove('active');
                mobileAuthDropdown.classList.remove('show');
                console.log('Mobile auth dropdown closed');
            }
        }
        
        function closeMobileAuthDropdown() {
            isMobileAuthOpen = false;
            mobileAuthLogo.classList.remove('active');
            mobileAuthDropdown.classList.remove('show');
        }
        
        // Toggle dropdown ONLY on logo icon click (not on the whole container)
        mobileAuthIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Mobile auth icon clicked');
            toggleMobileAuthDropdown();
        });
        
        // Also allow clicking the whole logo container (but don't prevent default)
        mobileAuthLogo.addEventListener('click', function(e) {
            // Only handle clicks on the logo itself, not on dropdown items
            if (e.target.closest('.mobile-auth-icon') || e.target === mobileAuthLogo) {
                e.stopPropagation();
                console.log('Mobile auth logo container clicked');
                toggleMobileAuthDropdown();
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (isMobileAuthOpen && 
                !mobileAuthLogo.contains(e.target) && 
                !mobileAuthDropdown.contains(e.target)) {
                closeMobileAuthDropdown();
            }
        });
        
        // Close on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isMobileAuthOpen) {
                closeMobileAuthDropdown();
            }
        });
        
        // Register button functionality
        const mobileRegisterBtn = document.querySelector('.mobile-auth-btn.register-btn');
        if (mobileRegisterBtn) {
            mobileRegisterBtn.addEventListener('click', function(e) {
                console.log('Mobile register button clicked');
                closeMobileAuthDropdown();
                
                // Open the register type modal
                const registerModal = document.getElementById('registerTypeModal');
                if (registerModal) {
                    registerModal.style.display = 'flex';
                    console.log('Register modal opened');
                }
                
                // Don't prevent default for this button
                // Let the modal handle the rest
            });
        }
        
        // Login button functionality - let it work normally
        const mobileLoginBtn = document.querySelector('.mobile-auth-btn.login-btn');
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', function(e) {
                console.log('Mobile login button clicked');
                closeMobileAuthDropdown();
                // Let the href work normally
            });
        }
        
        // Close mobile auth dropdown when opening hamburger menu
        const mobileNavToggle = document.getElementById('mobileNavToggle');
        if (mobileNavToggle) {
            mobileNavToggle.addEventListener('click', function() {
                if (isMobileAuthOpen) {
                    closeMobileAuthDropdown();
                }
            });
        }
        
        // Close mobile auth dropdown when clicking menu links
        const navMenu = document.getElementById('navMenu');
        if (navMenu) {
            const navLinks = navMenu.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', function() {
                    if (isMobileAuthOpen) {
                        closeMobileAuthDropdown();
                    }
                });
            });
        }
    }
    
    // Update your existing register/apply button functionality
    function setupRegisterButtons() {
        // Desktop register button
        const desktopRegisterBtn = document.querySelector('.apply-now-button');
        if (desktopRegisterBtn) {
            desktopRegisterBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const registerModal = document.getElementById('registerTypeModal');
                if (registerModal) {
                    registerModal.style.display = 'flex';
                }
            });
        }
    }
    
    // Initialize register buttons
    setupRegisterButtons();
});

// Also update your existing toggleMobileMenu function to close mobile auth dropdown:
function toggleMobileMenu() {
    const mobileNavToggle = document.getElementById('mobileNavToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (!mobileNavToggle || !navMenu) return;
    
    let isMenuOpen = mobileNavToggle.classList.contains('active');
    isMenuOpen = !isMenuOpen;
    
    // Toggle hamburger icon
    mobileNavToggle.classList.toggle('active');
    
    // Close mobile auth dropdown if open
    const mobileAuthLogo = document.getElementById('mobileAuthLogo');
    const mobileAuthDropdown = document.getElementById('mobileAuthDropdown');
    
    if (mobileAuthLogo && mobileAuthDropdown) {
        mobileAuthLogo.classList.remove('active');
        mobileAuthDropdown.classList.remove('show');
    }
    
    // Toggle mobile menu
    if (isMenuOpen) {
        navMenu.classList.add('mobile-active');
        document.body.classList.add('menu-open');
        console.log('Menu opened - added mobile-active class');
    } else {
        navMenu.classList.remove('mobile-active');
        document.body.classList.remove('menu-open');
        console.log('Menu closed - removed mobile-active class');
    }
}