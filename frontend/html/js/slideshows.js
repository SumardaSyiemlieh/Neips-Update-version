// Slideshow functionality for gallery, events, and about sections
document.addEventListener('DOMContentLoaded', function () {
    initGallerySlideshow();
    initEventsSlideshow();
    initAboutSlideshow();
});

function initGallerySlideshow() {
    const slides = document.querySelectorAll('.gallery-slideshow .slide');
    const dots = document.querySelectorAll('.gallery-slideshow .dot');
    if (slides.length === 0) return;

    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[n].classList.add('active');
        dots[n].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % totalSlides;
        showSlide(currentSlide);
    }

    let slideInterval = setInterval(nextSlide, 3000);
    const slideshowContainer = document.querySelector('.gallery-slideshow');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', () => clearInterval(slideInterval));
        slideshowContainer.addEventListener('mouseleave', () => slideInterval = setInterval(nextSlide, 3000));
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            clearInterval(slideInterval);
            currentSlide = index;
            showSlide(currentSlide);
            slideInterval = setInterval(nextSlide, 3000);
        });
    });
}

function initEventsSlideshow() {
    const eventSlides = document.querySelectorAll('.events-slide');
    const indicators = document.querySelectorAll('.indicator');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (eventSlides.length === 0) return;

    let currentEventSlide = 0;
    const totalEventSlides = eventSlides.length;

    function showEventSlide(n) {
        eventSlides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        eventSlides[n].classList.add('active');
        indicators[n].classList.add('active');
        currentEventSlide = n;
    }

    function nextEventSlide() {
        currentEventSlide = (currentEventSlide + 1) % totalEventSlides;
        showEventSlide(currentEventSlide);
    }

    let eventSlideInterval = setInterval(nextEventSlide, 5000);

    if (nextBtn) nextBtn.addEventListener('click', () => {
        clearInterval(eventSlideInterval);
        nextEventSlide();
        eventSlideInterval = setInterval(nextEventSlide, 5000);
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        clearInterval(eventSlideInterval);
        currentEventSlide = (currentEventSlide - 1 + totalEventSlides) % totalEventSlides;
        showEventSlide(currentEventSlide);
        eventSlideInterval = setInterval(nextEventSlide, 5000);
    });

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            clearInterval(eventSlideInterval);
            showEventSlide(index);
            eventSlideInterval = setInterval(nextEventSlide, 5000);
        });
    });
}

function initAboutSlideshow() {
    const aboutSlides = document.querySelectorAll('.about-slide');
    const aboutIndicators = document.querySelectorAll('.about-indicator');
    const aboutPrevBtn = document.querySelector('.about-prev-btn');
    const aboutNextBtn = document.querySelector('.about-next-btn');
    if (aboutSlides.length === 0) return;

    let currentAboutSlide = 0;
    const totalAboutSlides = aboutSlides.length;

    function showAboutSlide(n) {
        aboutSlides.forEach(slide => slide.classList.remove('active'));
        aboutIndicators.forEach(indicator => indicator.classList.remove('active'));
        aboutSlides[n].classList.add('active');
        aboutIndicators[n].classList.add('active');
        currentAboutSlide = n;
    }

    function nextAboutSlide() {
        currentAboutSlide = (currentAboutSlide + 1) % totalAboutSlides;
        showAboutSlide(currentAboutSlide);
    }

    let aboutSlideInterval = setInterval(nextAboutSlide, 3000);

    if (aboutNextBtn) aboutNextBtn.addEventListener('click', () => {
        clearInterval(aboutSlideInterval);
        nextAboutSlide();
        aboutSlideInterval = setInterval(nextAboutSlide, 3000);
    });

    if (aboutPrevBtn) aboutPrevBtn.addEventListener('click', () => {
        clearInterval(aboutSlideInterval);
        currentAboutSlide = (currentAboutSlide - 1 + totalAboutSlides) % totalAboutSlides;
        showAboutSlide(currentAboutSlide);
        aboutSlideInterval = setInterval(nextAboutSlide, 3000);
    });

    aboutIndicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            clearInterval(aboutSlideInterval);
            showAboutSlide(index);
            aboutSlideInterval = setInterval(nextAboutSlide, 3000);
        });
    });
}