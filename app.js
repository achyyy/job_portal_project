// ============================================
// KODNEST PREMIUM BUILD SYSTEM - ROUTING
// ============================================

// Route definitions
const routes = {
    '/': 'landing',
    '/dashboard': 'dashboard',
    '/saved': 'saved',
    '/digest': 'digest',
    '/settings': 'settings',
    '/proof': 'proof'
};

// Page templates
const pages = {
    landing: {
        render: () => `
            <div class="kn-landing">
                <div class="kn-landing__hero">
                    <h1 class="kn-landing__headline">Stop Missing The Right Jobs.</h1>
                    <p class="kn-landing__subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                    <a href="#settings" class="kn-button kn-button--primary kn-button--large">Start Tracking</a>
                </div>
            </div>
        `
    },

    dashboard: {
        render: () => `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Dashboard</h1>
                    <p class="kn-page__subtitle">Your personalized job feed</p>
                </div>
                <div class="kn-empty-state">
                    <div class="kn-empty-state__icon">📊</div>
                    <h2 class="kn-empty-state__title">No jobs yet</h2>
                    <p class="kn-empty-state__text">In the next step, you will load a realistic dataset.</p>
                </div>
            </div>
        `
    },

    settings: {
        render: () => `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Settings</h1>
                    <p class="kn-page__subtitle">Configure your job preferences</p>
                </div>
                
                <div class="kn-settings">
                    <div class="kn-card">
                        <h2 class="kn-heading-secondary">Job Preferences</h2>
                        
                        <div class="kn-form-group">
                            <label for="role-keywords" class="kn-label">Role Keywords</label>
                            <input 
                                type="text" 
                                id="role-keywords" 
                                class="kn-input" 
                                placeholder="e.g., Frontend Developer, React Engineer"
                            >
                            <span class="kn-help-text">Enter keywords separated by commas</span>
                        </div>
                        
                        <div class="kn-form-group">
                            <label for="locations" class="kn-label">Preferred Locations</label>
                            <input 
                                type="text" 
                                id="locations" 
                                class="kn-input" 
                                placeholder="e.g., San Francisco, New York, Remote"
                            >
                            <span class="kn-help-text">Enter locations separated by commas</span>
                        </div>
                        
                        <div class="kn-form-group">
                            <label class="kn-label">Work Mode</label>
                            <div class="kn-radio-group">
                                <label class="kn-radio-item">
                                    <input type="radio" name="mode" value="remote" class="kn-radio">
                                    <span class="kn-radio-label">Remote</span>
                                </label>
                                <label class="kn-radio-item">
                                    <input type="radio" name="mode" value="hybrid" class="kn-radio">
                                    <span class="kn-radio-label">Hybrid</span>
                                </label>
                                <label class="kn-radio-item">
                                    <input type="radio" name="mode" value="onsite" class="kn-radio">
                                    <span class="kn-radio-label">Onsite</span>
                                </label>
                                <label class="kn-radio-item">
                                    <input type="radio" name="mode" value="any" class="kn-radio" checked>
                                    <span class="kn-radio-label">Any</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="kn-form-group">
                            <label for="experience" class="kn-label">Experience Level</label>
                            <select id="experience" class="kn-select">
                                <option value="">Select experience level</option>
                                <option value="entry">Entry Level (0-2 years)</option>
                                <option value="mid">Mid Level (3-5 years)</option>
                                <option value="senior">Senior (6-10 years)</option>
                                <option value="lead">Lead/Principal (10+ years)</option>
                            </select>
                        </div>
                        
                        <div class="kn-form-actions">
                            <button class="kn-button kn-button--primary">Save Preferences</button>
                            <button class="kn-button kn-button--secondary">Reset</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    },

    saved: {
        render: () => `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Saved</h1>
                    <p class="kn-page__subtitle">Jobs you've bookmarked for later</p>
                </div>
                <div class="kn-empty-state">
                    <div class="kn-empty-state__icon">🔖</div>
                    <h2 class="kn-empty-state__title">No saved jobs</h2>
                    <p class="kn-empty-state__text">Jobs you save will appear here for easy access.</p>
                    <a href="#dashboard" class="kn-button kn-button--secondary">Browse Jobs</a>
                </div>
            </div>
        `
    },

    digest: {
        render: () => `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Digest</h1>
                    <p class="kn-page__subtitle">Your daily job summary delivered at 9AM</p>
                </div>
                <div class="kn-empty-state">
                    <div class="kn-empty-state__icon">📧</div>
                    <h2 class="kn-empty-state__title">No digest available</h2>
                    <p class="kn-empty-state__text">Your personalized digest will be generated daily based on your preferences.</p>
                    <a href="#settings" class="kn-button kn-button--secondary">Configure Preferences</a>
                </div>
            </div>
        `
    },

    proof: {
        render: () => `
            <div class="kn-page">
                <div class="kn-page__header">
                    <h1 class="kn-page__title">Proof</h1>
                    <p class="kn-page__subtitle">Track your job search progress</p>
                </div>
                <div class="kn-empty-state">
                    <div class="kn-empty-state__icon">✓</div>
                    <h2 class="kn-empty-state__title">Artifact collection placeholder</h2>
                    <p class="kn-empty-state__text">This section will track your applications, interviews, and outcomes.</p>
                </div>
            </div>
        `
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

    mainContent.innerHTML = page.render();
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

// Show/hide navigation based on route
function updateNavigation(pageName) {
    const nav = document.querySelector('.kn-nav');
    if (pageName === 'landing') {
        nav.style.display = 'none';
    } else {
        nav.style.display = 'flex';
    }
}

// Handle navigation
function navigate(hash) {
    const path = hash || '/';
    const pageName = routes[path] || 'landing';

    renderPage(pageName);
    updateActiveLink(pageName);
    updateNavigation(pageName);

    // Close mobile menu if open
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.remove('active');
    hamburger.classList.remove('active');

    // Scroll to top
    window.scrollTo(0, 0);
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
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const navLinks = document.getElementById('navLinks');
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    const nav = document.querySelector('.kn-nav');

    if (nav && !nav.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const initialHash = window.location.hash.replace('#', '/') || '/';
    navigate(initialHash);
});
