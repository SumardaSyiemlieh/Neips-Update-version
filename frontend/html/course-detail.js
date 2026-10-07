// Course Detail Page Functionality
document.addEventListener('DOMContentLoaded', function () {
    loadCourseDetail();
});
function loadCourseDetail() {
    // Get course data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course');

    if (!courseId) {
        window.location.href = 'courses.html';
        return;
    }

    // Find course data - handle URL decoding for special characters
    const decodedCourseId = decodeURIComponent(courseId);
    const course = allCourses.find(c =>
        c.title.replace(/\s+/g, '-').toLowerCase() === decodedCourseId.toLowerCase()
    );

    if (!course) {
        window.location.href = 'courses.html';
        return;
    }
        const eligibilitySection = document.createElement('div');
    eligibilitySection.className = 'course-eligibility';
    eligibilitySection.innerHTML = `
        <h3>Eligibility Criteria</h3>
        <div class="eligibility-grid">
            <div class="eligibility-item">
                <i class="fas fa-graduation-cap"></i>
                <div>
                    <h4>Educational Qualification</h4>
                    <p>Class 9 or above</p>
                </div>
            </div>
            <div class="eligibility-item">
                <i class="fas fa-user"></i>
                <div>
                    <h4>Age Requirement</h4>
                    <p>18 years and above</p>
                </div>
            </div>
        </div>
    `;

    // Insert eligibility section after course highlights
    const courseHighlights = document.getElementById('courseHighlights');
    courseHighlights.parentNode.insertBefore(eligibilitySection, courseHighlights.nextSibling);

    // Populate course details
    document.getElementById('courseDetailTitle').textContent = course.title;
    document.getElementById('courseTitleBreadcrumb').textContent = course.title;
    document.getElementById('courseDetailBadge').textContent = course.badge;

    // Use detailImage if available, otherwise fallback to regular image
    const detailImage = course.detailImage || course.image;
    const imgElement = document.getElementById('courseDetailImage');
    imgElement.src = detailImage;
    imgElement.alt = course.title;

    // Add error handling for images
    imgElement.onerror = function () {
        console.error('Failed to load image:', detailImage);
        this.src = '../images/default-course.jpg';
        this.alt = 'Default Course Image';
    };

    document.getElementById('courseDetailDescription').textContent = course.description;

    // Add course highlights
    const highlights = getCourseHighlights(course.title);
    const highlightsList = document.getElementById('courseHighlights');
    highlightsList.innerHTML = highlights.map(highlight =>
        `<li>${highlight}</li>`
    ).join('');

    document.title = `${course.title} - NeIPS`;

    document.querySelector('.enroll-now-btn-large').addEventListener('click', function () {
        window.location.href = 'index.html#contact';
    });
    
}

function getCourseHighlights(courseTitle) {
    const highlightsMap = {
        'SM-Fashion Designing': [
            'Advanced Pattern Making & Draping Techniques',
            'Professional Garment Construction & Stitching',
            'Fashion Illustration & Design Principles',
            'Textile Science & Fabric Knowledge',
            'Portfolio Development & Fashion Presentation',
            'Fashion Merchandising & Retail Management',
            'Sustainable Fashion Practices'
        ],
        'SM-Craft Baking': [
            'Artisanal Bread Making & Fermentation Techniques',
            'Pastry & Confectionery Mastery',
            'Advanced Cake Decorating & Design',
            'Food Safety & Hygiene Standards Certification',
            'Bakery Business Management & Entrepreneurship',
            'International Baking Techniques',
            'Chocolate & Sugar Work Artistry'
        ],
        'SM-Commis Chef': [
            'Fundamental Cooking Techniques & Methods',
            'Professional Kitchen Safety & Sanitation',
            'Food Preparation & Presentation Skills',
            'Menu Planning & Cost Control',
            'Kitchen Equipment Operation & Maintenance',
            'International Cuisine Preparation',
            'Nutrition & Dietary Requirements'
        ],
        'SM-Piggery': [
            'Modern Pig Farming & Breeding Techniques',
            'Animal Health Management & Disease Control',
            'Feed Formulation & Nutrition Management',
            'Breeding & Reproduction Science',
            'Farm Business & Financial Management',
            'Pork Processing & Value Addition',
            'Sustainable Farming Practices'
        ],
        'SM-Food and Beverages Services': [
            'Restaurant Service & Operations Management',
            'Beverage Knowledge & Bar Management',
            'Customer Service Excellence Training',
            'Food & Beverage Cost Control',
            'Menu Engineering & Design',
            'Banquet & Event Management',
            'Hospitality Industry Standards'
        ],
        'SM-Mobile Repairing': [
            'Smartphone Hardware Diagnosis & Repair',
            'Advanced Troubleshooting Techniques',
            'Component-Level Repair & Replacement',
            'Software Installation & Configuration',
            'Diagnostic Tools & Equipment Usage',
            'Data Recovery & Backup Solutions',
            'Customer Service & Workshop Management'
        ],
        'SM-Poultry': [
            'Poultry Farm Establishment & Management',
            'Chicken Rearing & Health Care',
            'Egg Production & Quality Control',
            'Feed Management & Nutrition Planning',
            'Disease Prevention & Biosecurity',
            'Poultry Product Marketing',
            'Modern Poultry Farming Technologies'
        ],
        'SM-Mason Tiling': [
            'Construction Masonry & Tiling Techniques',
            'Flooring & Wall Tiling Installation',
            'Measurement & Layout Planning',
            'Material Estimation & Cost Calculation',
            'Safety Protocols in Construction',
            'Quality Control & Inspection',
            'Advanced Tiling Patterns & Designs'
        ],
        'SM-Senior Beauty and Spa': [
            'Advanced Beauty Therapy Techniques',
            'Professional Skincare & Facial Treatments',
            'Spa & Wellness Therapy Procedures',
            'Makeup Artistry & Application',
            'Client Consultation & Communication',
            'Salon Management & Business Skills',
            'Advanced Hair Care Treatments'
        ],
        'SM-Dairy': [
            'Dairy Farm Management & Operations',
            'Milk Production & Quality Control',
            'Cattle Health & Nutrition Management',
            'Dairy Product Processing Techniques',
            'Breeding & Reproduction Management',
            'Dairy Business Entrepreneurship',
            'Modern Dairy Farming Technologies'
        ],
        'SM-Vermicomposting': [
            'Vermicompost Production Techniques',
            'Organic Waste Management Systems',
            'Worm Farming & Breeding Methods',
            'Compost Quality Assessment',
            'Marketing & Sales of Organic Products',
            'Sustainable Agriculture Practices',
            'Vermicompost Business Setup'
        ],
        'SM-Asst Beautician': [
            'Basic Beauty Treatment Procedures',
            'Skincare & Facial Techniques',
            'Hair Care & Styling Basics',
            'Salon Assistance & Client Service',
            'Beauty Product Knowledge',
            'Sanitation & Hygiene Practices',
            'Professional Grooming Standards'
        ],
        'SM-Women Empowerment-Rural Masonry': [
            'Basic Construction & Masonry Skills',
            'Rural Building Techniques',
            'Women Entrepreneurship Development',
            'Community Development Projects',
            'Leadership & Empowerment Training',
            'Sustainable Construction Practices',
            'Rural Infrastructure Development'
        ],
        'SM-Mushroom Grower': [
            'Mushroom Cultivation Techniques',
            'Spawn Production & Management',
            'Harvesting & Post-Harvest Handling',
            'Mushroom Preservation Methods',
            'Disease & Pest Management',
            'Marketing & Value Addition',
            'Mushroom Farm Business Planning'
        ],
        'SM-Plumber': [
            'Pipe Fitting & Installation Techniques',
            'Drainage System Design & Installation',
            'Water Supply System Management',
            'Plumbing Tools & Equipment Usage',
            'Safety Standards & Regulations',
            'Maintenance & Repair Procedures',
            'Advanced Plumbing Systems'
        ],
        'SM-Fitter&Fabrication': [
            'Metal Fitting & Assembly Techniques',
            'Welding Processes & Applications',
            'Fabrication & Manufacturing Processes',
            'Blueprint Reading & Interpretation',
            'Quality Control & Inspection',
            'Industrial Safety Standards',
            'Advanced Fabrication Technologies'
        ],
        'SM-Field Technician Services': [
            'Equipment Maintenance & Repair',
            'Field Troubleshooting Techniques',
            'Customer Service & Communication',
            'Technical Documentation & Reporting',
            'Preventive Maintenance Procedures',
            'Safety Protocols in Field Service',
            'Advanced Diagnostic Techniques'
        ],
        'SM-Almirah Making': [
            'Woodworking & Cabinet Making',
            'Furniture Design & Construction',
            'Material Selection & Processing',
            'Finishing & Polishing Techniques',
            'Measurement & Cutting Precision',
            'Quality Control in Furniture Making',
            'Custom Furniture Design'
        ],
        'SM-Welder': [
            'Arc Welding Techniques & Applications',
            'Gas Welding & Cutting Processes',
            'Metal Joining & Fabrication',
            'Welding Safety & Equipment Handling',
            'Weld Quality Inspection',
            'Advanced Welding Technologies',
            'Industrial Welding Standards'
        ],
        'SM-Lead Sofa Making': [
            'Sofa Frame Construction Techniques',
            'Upholstery & Padding Methods',
            'Furniture Design & Pattern Making',
            'Material Selection & Costing',
            'Quality Control in Furniture Production',
            'Advanced Upholstery Techniques',
            'Furniture Business Management'
        ],
        'SM-Cosmetology': [
            'Advanced Beauty & Makeup Artistry',
            'Skin Care & Treatment Procedures',
            'Hair Styling & Coloring Techniques',
            'Salon Management & Operations',
            'Client Relationship Management',
            'Advanced Cosmetic Science',
            'Beauty Industry Entrepreneurship'
        ],
        'SM-Fishery': [
            'Fish Farming & Aquaculture Techniques',
            'Water Quality Management',
            'Fish Health & Disease Control',
            'Feed Management & Nutrition',
            'Harvesting & Processing Methods',
            'Fishery Business Management',
            'Sustainable Aquaculture Practices'
        ],
        'default': [
            'Hands-on Practical Training',
            'Industry-Relevant Curriculum',
            'Expert Faculty Guidance',
            'Placement Assistance',
            'Certificate of Completion',
            'Modern Equipment Training',
            'Entrepreneurship Development'
        ]
    };

    return highlightsMap[courseTitle] || highlightsMap.default;
}

function getCareerOpportunities(courseTitle) {
    const careerMap = {
        'SM-Fashion Designing': [
            { title: 'Fashion Designer', description: 'Create original clothing collections and designs' },
            { title: 'Pattern Maker', description: 'Develop patterns for garment manufacturing' },
            { title: 'Fashion Illustrator', description: 'Create visual representations of fashion concepts' }
        ],
        'SM-Craft Baking': [
            { title: 'Pastry Chef', description: 'Specialize in desserts and baked goods creation' },
            { title: 'Bakery Manager', description: 'Oversee bakery operations and staff management' },
            { title: 'Cake Decorator', description: 'Create artistic and decorative cake designs' }
        ],
        'SM-Commis Chef': [
            { title: 'Commis Chef', description: 'Entry-level position in professional kitchen' },
            { title: 'Line Cook', description: 'Prepare specific sections of kitchen menu' },
            { title: 'Kitchen Assistant', description: 'Support kitchen operations and food prep' }
        ],
        'SM-Piggery': [
            { title: 'Pig Farm Manager', description: 'Manage overall pig farming operations' },
            { title: 'Animal Health Technician', description: 'Monitor and maintain animal health' },
            { title: 'Feed Manager', description: 'Oversee animal nutrition and feeding programs' }
        ],
        'SM-Food and Beverages Services': [
            { title: 'Restaurant Manager', description: 'Manage restaurant operations and staff' },
            { title: 'Food Service Supervisor', description: 'Oversee food service operations' },
            { title: 'Bar Manager', description: 'Manage beverage service and bar operations' }
        ],
        'SM-Mobile Repairing': [
            { title: 'Mobile Technician', description: 'Repair and maintain mobile devices' },
            { title: 'Service Center Manager', description: 'Manage mobile repair workshop' },
            { title: 'Technical Support', description: 'Provide customer technical assistance' }
        ],
        'SM-Poultry': [
            { title: 'Poultry Farm Manager', description: 'Manage poultry farming operations' },
            { title: 'Egg Production Supervisor', description: 'Oversee egg production processes' },
            { title: 'Poultry Health Worker', description: 'Monitor bird health and welfare' }
        ],
        'SM-Mason Tiling': [
            { title: 'Mason', description: 'Specialize in construction masonry work' },
            { title: 'Tile Installer', description: 'Install tiles for floors and walls' },
            { title: 'Construction Supervisor', description: 'Oversee construction projects' }
        ],
        'SM-Senior Beauty and Spa': [
            { title: 'Beauty Therapist', description: 'Provide professional beauty treatments' },
            { title: 'Spa Manager', description: 'Manage spa operations and services' },
            { title: 'Makeup Artist', description: 'Specialize in professional makeup application' }
        ],
        'SM-Dairy': [
            { title: 'Dairy Farm Manager', description: 'Manage dairy farming operations' },
            { title: 'Milk Processing Technician', description: 'Handle milk processing operations' },
            { title: 'Cattle Supervisor', description: 'Oversee cattle health and management' }
        ],
        'SM-Vermicomposting': [
            { title: 'Vermicompost Producer', description: 'Produce and sell vermicompost' },
            { title: 'Organic Farm Consultant', description: 'Advise on organic farming practices' },
            { title: 'Waste Management Officer', description: 'Manage organic waste processing' }
        ],
        'SM-Asst Beautician': [
            { title: 'Beauty Assistant', description: 'Support senior beauticians in salon' },
            { title: 'Salon Receptionist', description: 'Manage salon appointments and clients' },
            { title: 'Beauty Product Advisor', description: 'Advise customers on beauty products' }
        ],
        'SM-Women Empowerment-Rural Masonry': [
            { title: 'Rural Mason', description: 'Perform masonry work in rural areas' },
            { title: 'Construction Worker', description: 'Work on rural construction projects' },
            { title: 'Women Entrepreneur', description: 'Start construction-related business' }
        ],
        'SM-Mushroom Grower': [
            { title: 'Mushroom Farmer', description: 'Cultivate and harvest mushrooms' },
            { title: 'Mushroom Processing Technician', description: 'Process and package mushrooms' },
            { title: 'Agri-Entrepreneur', description: 'Start mushroom farming business' }
        ],
        'SM-Plumber': [
            { title: 'Plumber', description: 'Install and maintain plumbing systems' },
            { title: 'Pipe Fitter', description: 'Specialize in pipe installation' },
            { title: 'Maintenance Technician', description: 'Handle building maintenance' }
        ],
        'SM-Fitter&Fabrication': [
            { title: 'Fitter', description: 'Assemble and fit metal components' },
            { title: 'Fabricator', description: 'Fabricate metal structures and products' },
            { title: 'Welding Technician', description: 'Specialize in welding operations' }
        ],
        'SM-Field Technician Services': [
            { title: 'Field Service Technician', description: 'Provide on-site technical services' },
            { title: 'Maintenance Engineer', description: 'Maintain and repair equipment' },
            { title: 'Service Coordinator', description: 'Coordinate field service operations' }
        ],
        'SM-Almirah Making': [
            { title: 'Furniture Maker', description: 'Create custom furniture pieces' },
            { title: 'Cabinet Maker', description: 'Specialize in cabinet construction' },
            { title: 'Woodworking Artist', description: 'Create artistic wood products' }
        ],
        'SM-Welder': [
            { title: 'Welder', description: 'Perform welding and metal joining' },
            { title: 'Fabrication Welder', description: 'Weld metal fabrications' },
            { title: 'Pipeline Welder', description: 'Specialize in pipeline welding' }
        ],
        'SM-Lead Sofa Making': [
            { title: 'Sofa Maker', description: 'Design and construct sofas' },
            { title: 'Upholsterer', description: 'Specialize in furniture upholstery' },
            { title: 'Furniture Designer', description: 'Design custom furniture pieces' }
        ],
        'SM-Cosmetology': [
            { title: 'Cosmetologist', description: 'Provide advanced beauty services' },
            { title: 'Salon Owner', description: 'Manage own beauty salon business' },
            { title: 'Beauty Educator', description: 'Train aspiring beauty professionals' }
        ],
        'SM-Fishery': [
            { title: 'Fish Farmer', description: 'Manage fish farming operations' },
            { title: 'Aquaculture Technician', description: 'Handle technical aspects of fish farming' },
            { title: 'Fishery Manager', description: 'Oversee fishery operations' }
        ],
        'default': [
            { title: 'Industry Professional', description: 'Work in relevant industry sector' },
            { title: 'Entrepreneur', description: 'Start your own business venture' },
            { title: 'Skilled Technician', description: 'Apply specialized technical skills' }
        ]
    };

    return careerMap[courseTitle] || careerMap.default;
}

// Make allCourses available globally for the detail page
const allCourses = [
    {
        image: '../images/fashion designing2.jpg',
        detailImage: '../images/fashion designing2.jpg',
        badge: 'Fashion Designing',
        title: 'SM-Fashion Designing',
        description: 'Our comprehensive Fashion Designing program offers extensive training in garment construction, pattern making, fashion illustration, and textile science. Students learn advanced draping techniques, fashion merchandising, and portfolio development under the guidance of industry experts. The course covers sustainable fashion practices, retail management, and provides hands-on experience with modern fashion design tools and technologies to prepare students for successful careers in the dynamic fashion industry.'
    },
    {
        image: '../images/craftbaking2.jpg',
        detailImage: '../images/craftbaking2.jpg',
        badge: 'Craft Baking',
        title: 'SM-Craft Baking',
        description: 'Master the art of artisanal baking with our comprehensive Craft Baking program. This extensive course covers traditional and modern baking techniques, including bread fermentation, pastry creation, cake decoration, and confectionery arts. Students receive hands-on training in food safety standards, bakery management, and entrepreneurship. Learn international baking methods, chocolate work, and sugar artistry while developing the skills needed to establish successful bakery businesses or pursue careers in premium patisseries and hospitality establishments.'
    },
    {
        image: '../images/commis chef2.jpg',
        detailImage: '../images/commis chef2.jpg',
        badge: 'Commis Chef',
        title: 'SM-Commis Chef',
        description: 'Begin your culinary journey with our foundational Commis Chef program designed to build essential kitchen skills and professional culinary knowledge. This comprehensive training covers fundamental cooking techniques, kitchen safety protocols, food preparation methods, and menu planning. Students gain practical experience in international cuisine preparation, nutrition management, and kitchen equipment operation. The program emphasizes professional standards, teamwork, and prepares students for entry-level positions in hotels, restaurants, and catering services worldwide.'
    },
    {
        image: '../images/ifs piggery-Photoroom1.png',
        detailImage: '../images/ifs piggery-Photoroom1.png',
        badge: 'Piggery',
        title: 'SM-Piggery',
        description: 'Transform modern pig farming practices with our intensive Piggery management program. This comprehensive course covers advanced breeding techniques, animal health management, feed formulation, and farm business operations. Students learn sustainable farming practices, disease control measures, and pork processing techniques. The training includes hands-on experience in farm management, financial planning, and value addition processes. Graduates are equipped to establish profitable pig farming enterprises or manage large-scale commercial piggery operations effectively.'
    },
    {
        image: '../images/fb1.jpg',
        detailImage: '../images/fb1.jpg',
        badge: 'Food and Beverages',
        title: 'SM-Food and Beverages Services',
        description: 'Excel in the dynamic hospitality industry with our comprehensive Food and Beverage Services program. This extensive training covers restaurant operations, beverage management, customer service excellence, and banquet management. Students learn menu engineering, cost control, and hospitality standards while developing practical skills in food service, bar operations, and event management. The program prepares graduates for supervisory roles in hotels, restaurants, catering services, and entertainment venues with a focus on international service standards and customer satisfaction.'
    },
    {
        image: '../images/mobile2a.jpg',
        detailImage: '../images/mobile2a.jpg',
        badge: 'Mobile Repairing',
        title: 'SM-Mobile Repairing',
        description: 'Become a skilled mobile technician with our comprehensive Mobile Repairing program that covers both hardware and software aspects of smartphone maintenance. This extensive course provides hands-on training in device diagnosis, component-level repair, software troubleshooting, and data recovery. Students learn to use advanced diagnostic tools, understand mobile architecture, and provide professional customer service. The program includes practical workshops on various smartphone brands and models, preparing graduates for careers in service centers, retail outlets, or entrepreneurship in mobile repair business.'
    },
    {
        image: '../images/poultry2a.jpg',
        detailImage: '../images/poultry2a.jpg',
        badge: 'Poultry',
        title: 'SM-Poultry',
        description: 'Master modern poultry farming techniques with our comprehensive Poultry management program designed for aspiring farmers and industry professionals. This extensive course covers chicken rearing, egg production management, feed formulation, and disease control measures. Students learn about biosecurity protocols, poultry product marketing, and modern farming technologies. The training includes practical sessions on farm management, quality control, and business planning, equipping graduates to establish successful poultry enterprises or manage commercial poultry operations efficiently.'
    },
    {
        image: '../images/mason1.jpg',
        detailImage: '../images/mason1.jpg',
        badge: 'Mason Tiling',
        title: 'SM-Mason Tiling',
        description: 'Develop expert construction skills with our Mason Tiling program that combines traditional masonry techniques with modern construction practices. This comprehensive training covers flooring and wall tiling installation, measurement precision, material estimation, and safety protocols. Students learn advanced tiling patterns, quality control methods, and construction supervision. The program includes hands-on workshops with various materials and tools, preparing graduates for careers in construction companies, interior design firms, or entrepreneurship in building services.'
    },
    {
        image: '../images/beauty and spa.jpg',
        detailImage: '../images/beauty and spa.jpg',
        badge: 'Beauty and Spa',
        title: 'SM-Senior Beauty and Spa',
        description: 'Achieve professional excellence in beauty and wellness with our comprehensive Senior Beauty and Spa program. This advanced training covers sophisticated beauty therapies, advanced skincare treatments, spa wellness procedures, and professional makeup artistry. Students learn client consultation techniques, salon management skills, and advanced hair care treatments. The program emphasizes international beauty standards, business development, and prepares graduates for leadership roles in premium spas, beauty clinics, or entrepreneurship in the growing wellness industry.'
    },
    {
        image: '../images/diaryfarmin1.jpg',
        detailImage: '../images/diaryfarmin1.jpg',
        badge: 'Dairy',
        title: 'SM-Dairy',
        description: 'Excel in dairy farming and management with our comprehensive Dairy program designed for modern agricultural practices. This extensive course covers milk production techniques, cattle health management, dairy product processing, and farm business operations. Students learn about breeding management, quality control, and sustainable farming technologies. The training includes practical sessions on farm management, product value addition, and entrepreneurship development, preparing graduates to establish profitable dairy enterprises or manage large-scale dairy operations effectively.'
    },
    {
        image: '../images/vermi.jpg',
        detailImage: '../images/vermi.jpg',
        badge: 'Vermicomposting',
        title: 'SM-Vermicomposting',
        description: 'Master organic waste management and sustainable agriculture with our comprehensive Vermicomposting program. This specialized course covers worm farming techniques, compost production methods, organic waste processing, and quality assessment. Students learn about sustainable agriculture practices, marketing strategies for organic products, and business setup for vermicompost production. The program includes practical training in large-scale compost production, preparing graduates for careers in organic farming, waste management companies, or entrepreneurship in eco-friendly products.'
    },
    {
        image: '../images/asst beautician1.jpg',
        detailImage: '../images/asst beautician1.jpg',
        badge: 'Beautician',
        title: 'SM-Asst Beautician',
        description: 'Begin your beauty career with our foundational Assistant Beautician program designed to build essential salon skills and professional knowledge. This comprehensive training covers basic beauty treatments, skincare techniques, hair care fundamentals, and client service protocols. Students learn about beauty product knowledge, sanitation practices, and professional grooming standards. The program provides hands-on experience in salon operations, preparing graduates for entry-level positions in beauty salons, spas, or as stepping stones to advanced beauty therapy careers.'
    },
    {
        image: '../images/women empowerement 2.jpg',
        detailImage: '../images/women empowerement 2.jpg',
        badge: 'Rural Masonry',
        title: 'SM-Women Empowerment-Rural Masonry',
        description: 'Empower women through construction skills with our unique Women Empowerment-Rural Masonry program that combines technical training with entrepreneurship development. This comprehensive course covers basic construction techniques, rural building methods, and community development projects. Students learn leadership skills, sustainable construction practices, and business management. The program focuses on women\'s economic empowerment through skill development, preparing graduates to participate in rural infrastructure projects, start construction-related businesses, or lead community development initiatives.'
    },
    {
        image: '../images/mushroom grower2a.jpg',
        detailImage: '../images/mushroom grower2a.jpg',
        badge: 'Mushroom Grower',
        title: 'SM-Mushroom Grower',
        description: 'Cultivate success in mushroom farming with our comprehensive Mushroom Grower program designed for agricultural entrepreneurs. This extensive course covers mushroom cultivation techniques, spawn production, harvesting methods, and preservation technologies. Students learn about disease management, marketing strategies, and value addition processes. The training includes practical sessions on different mushroom varieties and commercial production methods, preparing graduates to establish profitable mushroom farms, work in agricultural companies, or pursue careers in food processing industries.'
    },
    {
        image: '../images/plum2a.jpg',
        detailImage: '../images/plum2a.jpg',
        badge: 'Plumber',
        title: 'SM-Plumber',
        description: 'Master professional plumbing skills with our comprehensive Plumber program that covers residential, commercial, and industrial plumbing systems. This extensive training includes pipe fitting techniques, drainage system design, water supply management, and maintenance procedures. Students learn about plumbing tools, safety standards, and advanced system installations. The program provides hands-on experience with modern plumbing technologies, preparing graduates for careers in construction companies, maintenance services, or entrepreneurship in plumbing business with proper certification and technical expertise.'
    },
    {
        image: '../images/fitfabri1.jpg',
        detailImage: '../images/fitfabri1.jpg',
        badge: 'Fitter & Fabrication',
        title: 'SM-Fitter&Fabrication', // ✅ CORRECT - matches the other courses
        description: 'Excel in industrial manufacturing with our comprehensive Fitter & Fabrication program designed for precision engineering and metal works. This extensive course covers metal fitting techniques, welding processes, fabrication methods, and quality control standards. Students learn blueprint reading, industrial safety protocols, and advanced manufacturing technologies. The training includes practical workshops on various metals and fabrication processes, preparing graduates for careers in manufacturing industries, construction companies, or technical roles in engineering firms with specialized fitting skills.'
    },
    {
        image: '../images/field1.jpg',
        detailImage: '../images/field1.jpg',
        badge: 'Field Technician',
        title: 'SM-Field Technician Services',
        description: 'Become a skilled field service professional with our comprehensive Field Technician Services program that combines technical expertise with customer service skills. This extensive training covers equipment maintenance, troubleshooting techniques, preventive maintenance procedures, and field service operations. Students learn technical documentation, safety protocols, and advanced diagnostic methods. The program prepares graduates for careers in various industries including telecommunications, manufacturing, and service companies as field technicians, maintenance engineers, or service coordinators.'
    },
    {
        image: '../images/wooden almirah making.jpg',
        detailImage: '../images/wooden almirah making.jpg',
        badge: 'Almirah Making',
        title: 'SM-Almirah Making',
        description: 'Master the art of furniture making with our comprehensive Almirah Making program focused on woodworking and cabinet construction. This extensive course covers furniture design, material selection, precision cutting, and finishing techniques. Students learn about custom furniture creation, quality control, and woodworking artistry. The training includes hands-on workshops with various wood types and tools, preparing graduates for careers in furniture manufacturing, interior design companies, or entrepreneurship in custom furniture business with specialized cabinet-making skills.'
    },
    {
        image: '../images/welding1.jpg',
        detailImage: '../images/welding1.jpg',
        badge: 'Welder',
        title: 'SM-Welder',
        description: 'Develop expert welding skills with our comprehensive Welder program that covers various welding techniques and industrial applications. This extensive training includes arc welding, gas welding, metal joining processes, and fabrication welding. Students learn about welding safety, quality inspection, and advanced welding technologies. The program provides hands-on experience with different metals and welding equipment, preparing graduates for careers in manufacturing, construction, automotive industries, or specialized welding services with proper certification and technical expertise.'
    },
    {
        image: '../images/sofa2a.jpg',
        detailImage: '../images/sofa2a.jpg',
        badge: 'Sofa Making',
        title: 'SM-Lead Sofa Making',
        description: 'Excel in furniture craftsmanship with our comprehensive Lead Sofa Making program focused on advanced upholstery and furniture construction. This extensive course covers sofa frame design, upholstery techniques, pattern making, and furniture finishing. Students learn about material selection, quality control, and custom furniture design. The training includes practical workshops on various styles and materials, preparing graduates for careers in furniture manufacturing, interior design firms, or entrepreneurship in premium furniture business with specialized sofa-making expertise.'
    },
    {
        image: '../images/cosmetology1.jpg',
        detailImage: '../images/cosmetology1.jpg',
        badge: 'Cosmetology',
        title: 'SM-Cosmetology',
        description: 'Achieve professional mastery in beauty sciences with our comprehensive Cosmetology program designed for advanced beauty professionals. This extensive training covers advanced makeup artistry, sophisticated skincare treatments, hair coloring techniques, and salon management. Students learn cosmetic science, client relationship management, and beauty industry entrepreneurship. The program emphasizes international beauty standards and business development, preparing graduates for leadership roles in premium beauty establishments, cosmetology education, or successful entrepreneurship in the beauty industry.'
    },
    {
        image: '../images/fishery1a.jpg',
        detailImage: '../images/fishery1a.jpg',
        badge: 'Fishery',
        title: 'SM-Fishery',
        description: 'Master modern aquaculture techniques with our comprehensive Fishery program designed for sustainable fish farming and management. This extensive course covers fish farming methods, water quality management, fish health care, and feed management. Students learn about harvesting techniques, processing methods, and fishery business operations. The training includes practical sessions on different fish species and sustainable practices, preparing graduates to establish profitable fish farms, work in aquaculture companies, or manage fishery operations with technical expertise and business acumen.'
    }
];