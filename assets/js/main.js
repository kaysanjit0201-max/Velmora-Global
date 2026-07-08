/**
 * Velmora Global - Core JavaScript Engine
 * Drives Navigation, Mobile menus, Dropdowns, Interactive SVG Map, Calculator, and offline fallback
 */

document.addEventListener("DOMContentLoaded", () => {
    initCleanUrlFallback();
    initStickyHeader();
    initMobileMenu();
    initReachMap();
    initCostCalculator();
    initFaqAccordion();
    initScrollAnimations();
    initAutoplayCarousel();
    initTestimonialsPageSlider();
});

/* -------------------------------------------------------------
 * 1. Clean URL Local Fallback for offline browsing
 * ------------------------------------------------------------- */
function initCleanUrlFallback() {
    const isLocalFile = window.location.protocol === 'file:';
    if (!isLocalFile) return;

    // Intercept navigation links and append .html to make them browseable locally
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
        const href = link.getAttribute('href');
        
        // Skip external, anchors, mailto, tel, whatsapp
        if (
            href.startsWith('http') || 
            href.startsWith('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('https://wa.me')
        ) {
            return;
        }

        // Map clean routes to local files
        if (href === '/') {
            link.setAttribute('href', 'index.html');
        } else if (href.startsWith('/#')) {
            link.setAttribute('href', 'index.html' + href.substring(1));
        } else if (href.startsWith('/')) {
            // e.g. /about -> about.html, /about#team -> about.html#team
            const hashIndex = href.indexOf('#');
            if (hashIndex !== -1) {
                const path = href.substring(1, hashIndex);
                const hash = href.substring(hashIndex);
                link.setAttribute('href', path + '.html' + hash);
            } else {
                link.setAttribute('href', href.substring(1) + '.html');
            }
        }
    });
}

/* -------------------------------------------------------------
 * 2. Sticky Header scroll effects
 * ------------------------------------------------------------- */
function initStickyHeader() {
    const header = document.querySelector('.header-nav');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

/* -------------------------------------------------------------
 * 3. Mobile Hamburger Menu Overlay & Submenu Toggles
 * ------------------------------------------------------------- */
function initMobileMenu() {
    const burger = document.querySelector('.nav-burger');
    const header = document.querySelector('.header-nav');
    
    if (!burger) return;

    // Create the overlay container
    const overlay = document.createElement('div');
    overlay.className = 'nav-menu-overlay';
    
    // Add close button
    const closeBtn = document.createElement('div');
    closeBtn.className = 'nav-close';
    closeBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    overlay.appendChild(closeBtn);

    // Clone the main nav menu
    const originalNav = document.querySelector('.nav-menu');
    if (originalNav) {
        const clonedNav = originalNav.cloneNode(true);
        overlay.appendChild(clonedNav);
    }

    document.body.appendChild(overlay);

    // Event triggers to toggle menu
    burger.addEventListener('click', () => {
        overlay.classList.add('active');
        header.classList.add('mobile-active');
        document.body.style.overflow = 'hidden'; // Stop scrolling
    });

    const closeMenu = () => {
        overlay.classList.remove('active');
        header.classList.remove('mobile-active');
        document.body.style.overflow = 'auto'; // Resume scrolling
    };

    closeBtn.addEventListener('click', closeMenu);

    // Overlay links close overlay upon click
    const overlayLinks = overlay.querySelectorAll('.nav-link:not(.nav-dropdown > a)');
    overlayLinks.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Handle Mobile Collapsible dropdown menu for Services
    const dropdownItem = overlay.querySelector('.nav-dropdown');
    if (dropdownItem) {
        const trigger = dropdownItem.querySelector('.nav-link');
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            dropdownItem.classList.toggle('active');
            
            // Toggle dropdown chevron icon
            const icon = trigger.querySelector('i');
            if (icon) {
                if (dropdownItem.classList.contains('active')) {
                    icon.className = 'fa-solid fa-chevron-up';
                } else {
                    icon.className = 'fa-solid fa-chevron-down';
                }
            }
        });
        
        // Let dropdown items close the menu when clicked
        const submenuLinks = dropdownItem.querySelectorAll('.nav-dropdown-menu a');
        submenuLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    }
}

/* -------------------------------------------------------------
 * 4. Interactive SVG reach map
 * ------------------------------------------------------------- */
const MAP_HUBS_DATA = {
    delhi: {
        name: "Headquarters (New Delhi, India)",
        desc: "Main operations office, primary regulatory liaison desk, and cargo operations hub near IGI Airport.",
        phone: "+91 7991634187"
    },
    london: {
        name: "London, United Kingdom (Europe Hub)",
        desc: "Coordinates clearances with EU/UK registries, repatriation clearances, and consulate submissions.",
        phone: "+91 7991634187"
    },
    dubai: {
        name: "Dubai, United Arab Emirates (Middle East Hub)",
        desc: "Direct link for Gulf Cooperation Council countries. Handles heavy volume flight cargo links.",
        phone: "+91 7991634187"
    },
    newyork: {
        name: "New York, United States (North America East)",
        desc: "Handles East Coast municipal registration, health department seals, and direct flight cargo coordination.",
        phone: "+91 7991634187"
    },
    toronto: {
        name: "Toronto, Canada Hub",
        desc: "Coordinates municipal death certificate translations and cross-border clearances for Canadian territories.",
        phone: "+91 7991634187"
    },
    riyadh: {
        name: "Riyadh, Saudi Arabia Hub",
        desc: "Liaison hub for Middle East cargo clearing, embassy NOC approvals, and airline casket clearances.",
        phone: "+91 7991634187"
    },
    singapore: {
        name: "Singapore Hub (Southeast Asia)",
        desc: "Primary transit gateway for East Asia. Handles administrative compliance checks and flight logistics.",
        phone: "+91 7991634187"
    },
    sydney: {
        name: "Sydney, Australia (Oceania)",
        desc: "Facilitating repatriation clearances and cargo routes for Oceania. Full administrative and flight coordination.",
        phone: "+91 7991634187"
    }
};

function initReachMap() {
    const mapWrapper = document.querySelector('.map-wrapper');
    const svg = mapWrapper ? mapWrapper.querySelector('svg') : null;
    const legendItems = document.querySelectorAll('.legend-item');
    const tooltip = document.querySelector('.map-tooltip');

    if (!mapWrapper || !svg) return;

    // Mapping from country path ID to our hub key
    const mapping = {
        'IN': 'delhi',
        'GB': 'london',
        'AE': 'dubai',
        'US': 'newyork',
        'SA': 'riyadh',
        'SG': 'singapore',
        'CA': 'toronto',
        'AU': 'sydney'
    };

    const hubs = {}; // To store calculated coordinate centers { key: { x, y, path } }

    // 1. Calculate centers
    Object.keys(mapping).forEach(countryId => {
        const path = svg.getElementById(countryId);
        if (!path) return;

        // Bounding box query
        const bbox = path.getBBox();
        const x = bbox.x + bbox.width / 2;
        const y = bbox.y + bbox.height / 2;
        
        const key = mapping[countryId];
        hubs[key] = { x, y, path };
        
        // Add interactive class to the country path for styling
        path.classList.add('interactive-country-path');
        path.setAttribute('data-hub', key);
    });

    // 2. Draw routes and dots programmatically
    const india = hubs['delhi'];
    if (india) {
        // Draw route lines connecting to Delhi
        Object.keys(hubs).forEach(key => {
            if (key === 'delhi') return;
            const dest = hubs[key];
            
            // Create route path
            const routePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midX = (india.x + dest.x) / 2;
            const midY = ((india.y + dest.y) / 2) - 60; // Curved upwards arc
            
            routePath.setAttribute('d', `M ${india.x} ${india.y} Q ${midX} ${midY} ${dest.x} ${dest.y}`);
            routePath.setAttribute('class', 'map-route');
            routePath.setAttribute('data-hubs', `delhi-${key}`);
            svg.appendChild(routePath);
        });

        // Draw pulsing dots for all hubs
        Object.keys(hubs).forEach(key => {
            const hub = hubs[key];
            const isHQ = (key === 'delhi');

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.setAttribute('class', 'map-hub');
            g.setAttribute('data-hub', key);

            // Ring (glowing pulse)
            const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            ring.setAttribute('class', 'pulse-ring');
            ring.setAttribute('cx', hub.x);
            ring.setAttribute('cy', hub.y);
            ring.setAttribute('r', isHQ ? 12 : 8);
            g.appendChild(ring);

            // Solid inner dot
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', hub.x);
            dot.setAttribute('cy', hub.y);
            dot.setAttribute('r', isHQ ? 6 : 4);
            dot.setAttribute('fill', isHQ ? 'var(--color-gold)' : '#fff');
            g.appendChild(dot);

            svg.appendChild(g);
        });
    }

    // Re-select elements we just created
    const mapHubs = svg.querySelectorAll('.map-hub');
    const mapRoutes = svg.querySelectorAll('.map-route');

    // Show details for a specific hub
    function activateHub(hubId, element) {
        // Deactivate all routes, legends, and country path highlights
        mapRoutes.forEach(r => r.classList.remove('active'));
        legendItems.forEach(l => l.classList.remove('active'));
        Object.keys(hubs).forEach(k => {
            if (hubs[k].path) hubs[k].path.classList.remove('highlighted');
        });

        // Highlight routes originating or ending at this hub
        mapRoutes.forEach(route => {
            const routeHubs = route.getAttribute('data-hubs').split('-');
            if (routeHubs.includes(hubId)) {
                route.classList.add('active');
            }
        });

        // Highlight country path itself
        const hubCountry = hubs[hubId];
        if (hubCountry && hubCountry.path) {
            hubCountry.path.classList.add('highlighted');
        }

        // Highlight legend item
        const legendItem = document.querySelector(`.legend-item[data-hub="${hubId}"]`);
        if (legendItem) legendItem.classList.add('active');

        // Populate and position tooltip
        const data = MAP_HUBS_DATA[hubId];
        if (data && tooltip && element) {
            tooltip.innerHTML = `
                <div class="map-tooltip-title">${data.name}</div>
                <div class="map-tooltip-desc">${data.desc}</div>
                <div class="map-tooltip-desc" style="color: var(--color-gold); font-weight: 500; margin-top: 0.5rem;">
                    Helpline: ${data.phone}
                </div>
            `;
            
            // Positioning tooltip relative to SVG coordinates
            const hubRect = element.getBoundingClientRect();
            const wrapperRect = mapWrapper.getBoundingClientRect();
            
            let top = (hubRect.top - wrapperRect.top) - tooltip.offsetHeight - 12;
            let left = (hubRect.left - wrapperRect.left) + (hubRect.width / 2) - (tooltip.offsetWidth / 2);
            
            if (left < 10) left = 10;
            if (left + tooltip.offsetWidth > wrapperRect.width - 10) {
                left = wrapperRect.width - tooltip.offsetWidth - 10;
            }
            if (top < 10) {
                top = (hubRect.bottom - wrapperRect.top) + 12;
            }
            
            tooltip.style.top = `${top}px`;
            tooltip.style.left = `${left}px`;
            tooltip.classList.add('visible');
        }
    }

    function hideTooltip() {
        if (tooltip) tooltip.classList.remove('visible');
        mapRoutes.forEach(r => r.classList.remove('active'));
        legendItems.forEach(l => l.classList.remove('active'));
        Object.keys(hubs).forEach(k => {
            if (hubs[k].path) hubs[k].path.classList.remove('highlighted');
        });
    }

    // Hover events on SVG dots
    mapHubs.forEach(hub => {
        const hubId = hub.getAttribute('data-hub');
        hub.addEventListener('mouseenter', () => {
            activateHub(hubId, hub);
        });
        hub.addEventListener('mouseleave', hideTooltip);
    });

    // Hover events on country paths directly
    Object.keys(hubs).forEach(key => {
        const countryHub = hubs[key];
        if (countryHub.path) {
            countryHub.path.addEventListener('mouseenter', () => {
                const matchDot = svg.querySelector(`.map-hub[data-hub="${key}"]`);
                if (matchDot) activateHub(key, matchDot);
            });
            countryHub.path.addEventListener('mouseleave', hideTooltip);
        }
    });

    // Hover events on Legends
    legendItems.forEach(item => {
        const hubId = item.getAttribute('data-hub');
        const matchDot = svg.querySelector(`.map-hub[data-hub="${hubId}"]`);
        
        item.addEventListener('mouseenter', () => {
            if (matchDot) activateHub(hubId, matchDot);
        });
        item.addEventListener('mouseleave', hideTooltip);
    });
}

/* -------------------------------------------------------------
 * 5. Cost Calculator & Dynamic Documents Required
 * ------------------------------------------------------------- */
const COUNTRY_NAMES = {
    "IN": "India",
    "AE": "United Arab Emirates (UAE)",
    "GB": "United Kingdom (UK)",
    "US": "United States of America (USA)",
    "SA": "Saudi Arabia",
    "SG": "Singapore",
    "CA": "Canada",
    "AU": "Australia"
};

const DOCS_LIST = {
    domestic: [
        "Official Medical Death Certificate stating cause of death (non-infectious).",
        "No Objection Certificate (NOC) from the Local Police jurisdiction.",
        "Embalming Certificate issued by a government-registered embalmer.",
        "Hermetically sealed coffin certificate (certified by embalmer).",
        "Photo ID and passport copy of the deceased relative/Next of Kin.",
        "Airway Bill (AWB) issued by the coordinating cargo carrier.",
        "Authorization letter signed by the next of kin appointing transit agent."
    ],
    inbound: [
        "Death Certificate (translated to English by certified translator if foreign language).",
        "Embalming Certificate and Hermetic Sealing Certificate from foreign undertaker.",
        "No Objection Certificate (NOC) from the nearest Indian Embassy/Consulate.",
        "Passport of the deceased cancelled by the Indian Embassy.",
        "eCARe registration portal filing approval code (Government of India).",
        "Apostille or Embassy certification of cause of death.",
        "Customs clearance NOC on arrival in India from APHO (Airport Health Officer)."
    ],
    outbound: [
        "Municipal Death Certificate issued by Indian Local Registrar.",
        "Embalming certificate and Hermetic packaging logs matching WHO standards.",
        "NOC and Passport Cancellation from the destination country's embassy in India.",
        "Clearance certificate from the Airport Health Officer (APHO) in India.",
        "Police Clearance Certificate (NOC) for transport of remains.",
        "Consignee receiving letter confirming cargo handoff details at airport.",
        "Customs Export Declaration filing form logged at Indian cargo terminal."
    ],
    ashes: [
        "Official Cremation Certificate from registry or crematorium.",
        "Casket/Urn Sealing Certificate confirming content contains only ash remains.",
        "NOC for carrying cremated remains from the local embassy/consulate.",
        "Cancelled passport and photo ID scans of the deceased.",
        "Customs clearance declaration paper matching airline hand baggage rules."
    ]
};

const PRICING_TARIFFS = {
    "GB-IN": { cost: "£2,600 - £3,400", time: "3 - 5 Days", type: "inbound", label: "UK to India Inbound" },
    "AE-IN": { cost: "AED 9,000 - AED 12,500", time: "2 - 3 Days", type: "inbound", label: "UAE to India Inbound" },
    "US-IN": { cost: "$4,200 - $5,800", time: "5 - 7 Days", type: "inbound", label: "USA to India Inbound" },
    "CA-IN": { cost: "CAD 5,800 - CAD 7,500", time: "5 - 7 Days", type: "inbound", label: "Canada to India Inbound" },
    "SA-IN": { cost: "SAR 11,000 - SAR 14,000", time: "3 - 4 Days", type: "inbound", label: "Saudi Arabia to India Inbound" },
    "SG-IN": { cost: "SGD 4,500 - SGD 6,000", time: "2 - 4 Days", type: "inbound", label: "Singapore to India Inbound" },
    "AU-IN": { cost: "AUD 6,500 - AUD 8,500", time: "4 - 6 Days", type: "inbound", label: "Australia to India Inbound" },
    
    "IN-GB": { cost: "₹2,20,000 - ₹2,90,000", time: "4 - 6 Days", type: "outbound", label: "India to UK Outbound" },
    "IN-AE": { cost: "₹1,80,000 - ₹2,40,000", time: "3 - 4 Days", type: "outbound", label: "India to UAE Outbound" },
    "IN-US": { cost: "₹3,50,000 - ₹4,50,000", time: "5 - 8 Days", type: "outbound", label: "India to USA Outbound" },
    "IN-CA": { cost: "₹3,80,000 - ₹4,80,000", time: "5 - 8 Days", type: "outbound", label: "India to Canada Outbound" },
    "IN-SA": { cost: "₹1,90,000 - ₹2,50,000", time: "4 - 5 Days", type: "outbound", label: "India to Saudi Arabia Outbound" },
    "IN-SG": { cost: "₹2,10,000 - ₹2,80,000", time: "3 - 5 Days", type: "outbound", label: "India to Singapore Outbound" },
    "IN-AU": { cost: "₹2,80,000 - ₹3,60,000", time: "5 - 7 Days", type: "outbound", label: "India to Australia Outbound" }
};

function initCostCalculator() {
    const calcSource = document.getElementById("calc-source");
    const calcDest = document.getElementById("calc-dest");
    const calcType = document.getElementById("calc-type");
    const btnCalculate = document.getElementById("btn-calculate");
    const placeholder = document.getElementById("results-placeholder");
    const display = document.getElementById("results-display");
    
    if (!calcSource || !calcDest) return;

    function runCalculator() {
        const sourceVal = calcSource.value;
        const destVal = calcDest.value;
        const typeVal = calcType ? calcType.value : "remains";

        if (!sourceVal || !destVal) {
            placeholder.style.display = "block";
            display.style.display = "none";
            return;
        }

        // Determine Route Key
        let routeKey = `${sourceVal}-${destVal}`;
        let tariff = PRICING_TARIFFS[routeKey];
        let documentType = "domestic"; // Fallback

        // Check if domestic
        if (sourceVal === "IN" && destVal === "IN") {
            tariff = {
                cost: "₹65,000 - ₹1,20,000",
                time: "1 - 2 Days",
                type: "domestic",
                label: "Domestic Repatriation (Within India)"
            };
            documentType = "domestic";
        } else if (typeVal === "ashes") {
            // Urn/Ashes overrides standard remains costs
            documentType = "ashes";
            if (tariff) {
                // Ashes is generally cheaper than human remains cargo
                tariff = {
                    cost: sourceVal === "IN" ? "₹85,000 - ₹1,40,000" : "USD 1,200 - USD 2,200",
                    time: tariff.time,
                    type: "ashes",
                    label: tariff.label.replace("Inbound", "Ashes").replace("Outbound", "Ashes")
                };
            } else {
                tariff = {
                    cost: "USD 1,500 - USD 2,500",
                    time: "3 - 5 Days",
                    type: "ashes",
                    label: `Custom Ashes Lane (${COUNTRY_NAMES[sourceVal]} to ${COUNTRY_NAMES[destVal]})`
                };
            }
        } else if (tariff) {
            documentType = tariff.type;
        } else {
            // General custom international lane
            const isOutbound = (sourceVal === "IN");
            tariff = {
                cost: isOutbound ? "₹2,50,000 - ₹3,80,000" : "USD 3,500 - USD 5,200",
                time: "4 - 7 Days",
                type: isOutbound ? "outbound" : "inbound",
                label: `International Lane (${COUNTRY_NAMES[sourceVal]} to ${COUNTRY_NAMES[destVal]})`
            };
            documentType = tariff.type;
        }

        // Update display DOM using CORRECT IDs
        const resRoute = document.getElementById("res-route");
        const resBadge = document.getElementById("res-badge");
        const resPrice = document.getElementById("res-price");
        const resTime = document.getElementById("res-time");
        const resDocsList = document.getElementById("res-docs-list");

        if (resRoute) resRoute.innerText = tariff.label;
        if (resBadge) resBadge.innerText = tariff.type.toUpperCase() + " SERVICE";
        if (resPrice) resPrice.innerText = tariff.cost;
        if (resTime) resTime.innerText = tariff.time;

        // Load document items
        if (resDocsList) {
            resDocsList.innerHTML = "";
            const docs = DOCS_LIST[documentType];
            if (docs) {
                docs.forEach(docText => {
                    const li = document.createElement("li");
                    li.className = "docs-item";
                    li.innerHTML = `<span class="docs-check-icon"><i class="fa-solid fa-file-shield"></i></span><span>${docText}</span>`;
                    resDocsList.appendChild(li);
                });
            }
        }

        // Dynamic WhatsApp query text
        const resWaLink = document.getElementById("res-wa-link");
        if (resWaLink) {
            const waMessage = encodeURIComponent(`Hello Velmora Global, I need information regarding human remains transport for lane: ${tariff.label}. Please guide me.`);
            resWaLink.href = `https://wa.me/917991634187?text=${waMessage}`;
        }

        // Display results
        placeholder.style.display = "none";
        display.style.display = "flex";
    }

    if (btnCalculate) btnCalculate.addEventListener("click", runCalculator);
    calcSource.addEventListener("change", runCalculator);
    calcDest.addEventListener("change", runCalculator);
    if (calcType) calcType.addEventListener("change", runCalculator);
}

/* -------------------------------------------------------------
 * 6. FAQ Accordion Logic
 * ------------------------------------------------------------- */
function initFaqAccordion() {
    const triggers = document.querySelectorAll(".faq-trigger");

    triggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            const item = trigger.closest(".faq-item");
            const panel = item.querySelector(".faq-panel");
            const isActive = item.classList.contains("active");

            // Close all other FAQs
            document.querySelectorAll(".faq-item").forEach(otherItem => {
                otherItem.classList.remove("active");
                const otherPanel = otherItem.querySelector(".faq-panel");
                if (otherPanel) otherPanel.style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add("active");
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
}

/* -------------------------------------------------------------
 * 7. Scroll Fade & Slide-up Animations (Intersection Observer)
 * ------------------------------------------------------------- */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    if (animatedElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target); // Animate once
            }
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px"
    });

    animatedElements.forEach(el => observer.observe(el));
}

/* -------------------------------------------------------------
 * 8. Autoplay Testimonials Carousel
 * ------------------------------------------------------------- */
function initAutoplayCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    if (slides.length === 0) return;

    let currentSlide = 0;
    let timer = null;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    function nextSlide() {
        let next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    function startTimer() {
        timer = setInterval(nextSlide, 5000); // Transitions every 5 seconds
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            showSlide(idx);
            resetTimer();
        });
    });

    startTimer();
}

/* -------------------------------------------------------------
 * 9. Testimonials Page Auto-Slider (Movable by 1, Set of 3)
 * ------------------------------------------------------------- */
function initTestimonialsPageSlider() {
    const track = document.querySelector('.testimonials-slider-track');
    if (!track) return;
    
    const cards = track.querySelectorAll('.resource-card');
    if (cards.length === 0) return;

    let index = 0;
    let timer = null;

    function getVisibleCount() {
        if (window.innerWidth <= 768) return 1;
        if (window.innerWidth <= 1024) return 2;
        return 3;
    }

    function slideTo(idx) {
        const cardWidth = cards[0].offsetWidth;
        const gap = 32; // 2rem matches 32px gap in CSS
        const maxIdx = cards.length - getVisibleCount();
        
        if (idx > maxIdx) {
            idx = 0; // Loop back to start
        }
        if (idx < 0) {
            idx = maxIdx;
        }
        
        const offset = idx * (cardWidth + gap);
        track.style.transform = `translateX(-${offset}px)`;
        index = idx;
    }

    function nextSlide() {
        slideTo(index + 1);
    }

    function startTimer() {
        timer = setInterval(nextSlide, 4500); // Auto-slides every 4.5 seconds
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    // Touch support (swipe)
    let startX = 0;
    let endX = 0;
    
    track.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        clearInterval(timer);
    }, { passive: true });
    
    track.addEventListener('touchend', e => {
        endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (diff > 50) {
            // Swipe Left -> Next
            slideTo(index + 1);
        } else if (diff < -50) {
            // Swipe Right -> Prev
            slideTo(index - 1);
        }
        startTimer();
    }, { passive: true });

    startTimer();

    // Adjust position on resize
    window.addEventListener('resize', () => {
        clearInterval(timer);
        slideTo(index);
        startTimer();
    });
}
