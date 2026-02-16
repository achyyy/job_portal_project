// ============================================
// KODNEST PREMIUM BUILD SYSTEM - ROUTING
// ============================================

// Route definitions
const routes = {
    '/': 'dashboard',
    '/dashboard': 'dashboard',
    '/saved': 'saved',
    '/digest': 'digest',
    '/settings': 'settings',
    '/proof': 'proof'
};

// Page templates
const pages = {
    dashboard: {
        title: 'Dashboard',
        subtitle: 'This section will be built in the next step.'
    },
    saved: {
        title: 'Saved',
        subtitle: 'This section will be built in the next step.'
    },
    digest: {
        title: 'Digest',
        subtitle: 'This section will be built in the next step.'
    },
    settings: {
        title: 'Settings',
        subtitle: 'This section will be built in the next step.'
    },
    proof: {
        title: 'Proof',
        subtitle: 'This section will be built in the next step.'
    }
};

// Render page content
function renderPage(pageName) {
    const page = pages[pageName];
    const mainContent = document.getElementById('mainContent');

    if (!page) {
        mainContent.innerHTML = `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Page Not Found</h1>
                    <p class="kn-page__subtitle">The requested page does not exist.</p>
                </div>
            </div>
        `;
        return;
    }

    mainContent.innerHTML = `
        <div class="kn-page">
            <div class="kn-page__header">
                <h1 class="kn-page__title">${page.title}</h1>
                <p class="kn-page__subtitle">${page.subtitle}</p>
            </div>
        </div>
    `;
}

// Update active navigation link
function updateActiveLink(pageName) {
    const links = document.querySelectorAll('.kn-nav__link');
    links.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.route === pageName) {
            link.classList.add('active');
        }
    });
}

// Handle navigation
function navigate(hash) {
    const path = hash || '/dashboard';
    const pageName = routes[path] || 'dashboard';

    renderPage(pageName);
    updateActiveLink(pageName);

    // Close mobile menu if open
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');
}

// Handle hash change
window.addEventListener('hashchange', () => {
    navigate(window.location.hash.replace('#', '/'));
});

// Handle navigation clicks
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('kn-nav__link')) {
        e.preventDefault();
        const route = e.target.dataset.route;
        window.location.hash = route;
    }
});

// Hamburger menu toggle
document.getElementById('hamburger').addEventListener('click', () => {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const nav = document.querySelector('.kn-nav');

    if (!nav.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const initialHash = window.location.hash.replace('#', '/') || '/dashboard';
    navigate(initialHash);
});
