// ============================================
// KODNEST PREMIUM BUILD SYSTEM - JOB TRACKER
// ============================================

// State management
let currentFilters = {
    keyword: '',
    location: '',
    mode: '',
    experience: '',
    source: '',
    status: '',
    sort: 'latest'
};

let showOnlyMatches = false;
let selectedJob = null;

// LocalStorage helpers - Saved Jobs
const getSavedJobs = () => {
    const saved = localStorage.getItem('savedJobs');
    return saved ? JSON.parse(saved) : [];
};

const saveJob = (jobId) => {
    const savedJobs = getSavedJobs();
    if (!savedJobs.includes(jobId)) {
        savedJobs.push(jobId);
        localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
    }
};

const unsaveJob = (jobId) => {
    const savedJobs = getSavedJobs();
    const filtered = savedJobs.filter(id => id !== jobId);
    localStorage.setItem('savedJobs', JSON.stringify(filtered));
};

const isJobSaved = (jobId) => {
    return getSavedJobs().includes(jobId);
};

// Preference management
const getPreferences = () => {
    const prefs = localStorage.getItem('jobTrackerPreferences');
    return prefs ? JSON.parse(prefs) : null;
};

const savePreferences = (preferences) => {
    localStorage.setItem('jobTrackerPreferences', JSON.stringify(preferences));
};

const hasPreferences = () => {
    return getPreferences() !== null;
};

// Match scoring engine - EXACT RULES
const calculateMatchScore = (job, preferences) => {
    if (!preferences) return 0;

    let score = 0;

    // +25 if any roleKeyword appears in job.title (case-insensitive)
    if (preferences.roleKeywords && preferences.roleKeywords.length > 0) {
        const titleLower = job.title.toLowerCase();
        const hasKeywordInTitle = preferences.roleKeywords.some(keyword =>
            titleLower.includes(keyword.toLowerCase())
        );
        if (hasKeywordInTitle) score += 25;
    }

    // +15 if any roleKeyword appears in job.description
    if (preferences.roleKeywords && preferences.roleKeywords.length > 0) {
        const descLower = job.description.toLowerCase();
        const hasKeywordInDesc = preferences.roleKeywords.some(keyword =>
            descLower.includes(keyword.toLowerCase())
        );
        if (hasKeywordInDesc) score += 15;
    }

    // +15 if job.location matches preferredLocations
    if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
        const locationMatch = preferences.preferredLocations.some(loc =>
            loc.toLowerCase() === job.location.toLowerCase()
        );
        if (locationMatch) score += 15;
    }

    // +10 if job.mode matches preferredMode
    if (preferences.preferredMode && preferences.preferredMode.length > 0) {
        const modeMatch = preferences.preferredMode.some(mode =>
            mode.toLowerCase() === job.mode.toLowerCase()
        );
        if (modeMatch) score += 10;
    }

    // +10 if job.experience matches experienceLevel
    if (preferences.experienceLevel && preferences.experienceLevel === job.experience) {
        score += 10;
    }

    // +15 if overlap between job.skills and user.skills (any match)
    if (preferences.skills && preferences.skills.length > 0 && job.skills && job.skills.length > 0) {
        const skillsMatch = preferences.skills.some(userSkill =>
            job.skills.some(jobSkill =>
                jobSkill.toLowerCase() === userSkill.toLowerCase()
            )
        );
        if (skillsMatch) score += 15;
    }

    // +5 if postedDaysAgo <= 2
    if (job.postedDaysAgo <= 2) {
        score += 5;
    }

    // +5 if source is LinkedIn
    if (job.source === 'LinkedIn') {
        score += 5;
    }

    // Cap score at 100
    return Math.min(score, 100);
};

// Get match score badge class
const getMatchScoreBadgeClass = (score) => {
    if (score >= 80) return 'kn-match-badge--excellent';
    if (score >= 60) return 'kn-match-badge--good';
    if (score >= 40) return 'kn-match-badge--fair';
    return 'kn-match-badge--low';
};

// Helper functions
const formatPostedDate = (daysAgo) => {
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return '1 day ago';
    return `${daysAgo} days ago`;
};

const getSourceBadgeClass = (source) => {
    const classes = {
        'LinkedIn': 'kn-badge--linkedin',
        'Naukri': 'kn-badge--naukri',
        'Indeed': 'kn-badge--indeed'
    };
    return classes[source] || '';
};

// Filter and sort jobs
const filterAndSortJobs = (jobs) => {
    const preferences = getPreferences();
    let filtered = [...jobs];

    // Calculate match scores for all jobs
    filtered = filtered.map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, preferences)
    }));

    // Match score threshold filter (if toggle enabled)
    if (showOnlyMatches && preferences && preferences.minMatchScore !== undefined) {
        filtered = filtered.filter(job => job.matchScore >= preferences.minMatchScore);
    }

    // Keyword filter (title or company) - AND logic
    if (currentFilters.keyword) {
        const keyword = currentFilters.keyword.toLowerCase();
        filtered = filtered.filter(job =>
            job.title.toLowerCase().includes(keyword) ||
            job.company.toLowerCase().includes(keyword)
        );
    }

    // Location filter - AND logic
    if (currentFilters.location) {
        filtered = filtered.filter(job =>
            job.location.toLowerCase() === currentFilters.location.toLowerCase()
        );
    }

    // Mode filter - AND logic
    if (currentFilters.mode) {
        filtered = filtered.filter(job =>
            job.mode.toLowerCase() === currentFilters.mode.toLowerCase()
        );
    }

    // Experience filter - AND logic
    if (currentFilters.experience) {
        filtered = filtered.filter(job =>
            job.experience.toLowerCase() === currentFilters.experience.toLowerCase()
        );
    }

    // Source filter - AND logic
    if (currentFilters.source) {
        filtered = filtered.filter(job =>
            job.source.toLowerCase() === currentFilters.source.toLowerCase()
        );
    }

    // Status filter - AND logic
    if (currentFilters.status) {
        filtered = filtered.filter(job => {
            const status = getJobStatus(job.id);
            return status === currentFilters.status;
        });
    }

    // Sort
    if (currentFilters.sort === 'latest') {
        filtered.sort((a, b) => a.postedDaysAgo - b.postedDaysAgo);
    } else if (currentFilters.sort === 'oldest') {
        filtered.sort((a, b) => b.postedDaysAgo - a.postedDaysAgo);
    } else if (currentFilters.sort === 'match') {
        filtered.sort((a, b) => b.matchScore - a.matchScore);
    } else if (currentFilters.sort === 'salary') {
        filtered.sort((a, b) => {
            const extractSalary = (salaryStr) => {
                const match = salaryStr.match(/(\d+)/);
                return match ? parseInt(match[1]) : 0;
            };
            return extractSalary(b.salaryRange) - extractSalary(a.salaryRange);
        });
    }

    return filtered;
};

// Render job card
const renderJobCard = (job, showRemoveButton = false) => {
    const saved = isJobSaved(job.id);
    const saveButtonText = saved ? 'Saved ✓' : 'Save';
    const saveButtonClass = saved ? 'kn-button--saved' : '';
    const preferences = getPreferences();
    const showMatchScore = preferences !== null;
    const status = getJobStatus(job.id);

    return `
        <div class="kn-job-card" data-job-id="${job.id}">
            <div class="kn-job-card__header">
                <div>
                    <h3 class="kn-job-card__title">${job.title}</h3>
                    <p class="kn-job-card__company">${job.company}</p>
                </div>
                <div class="kn-job-card__badges">
                    ${showMatchScore ? `<span class="kn-match-badge ${getMatchScoreBadgeClass(job.matchScore)}">${job.matchScore}%</span>` : ''}
                    <span class="kn-badge ${getSourceBadgeClass(job.source)}">${job.source}</span>
                </div>
            </div>
            
            <div class="kn-job-card__meta">
                <span class="kn-job-meta">📍 ${job.location} • ${job.mode}</span>
                <span class="kn-job-meta">💼 ${job.experience}</span>
                <span class="kn-job-meta">💰 ${job.salaryRange}</span>
                <span class="kn-job-meta kn-job-meta--posted">🕒 ${formatPostedDate(job.postedDaysAgo)}</span>
            </div>
            
            <div class="kn-job-card__status">
                <label class="kn-label">Status:</label>
                <select 
                    class="kn-status-select" 
                    onchange="setJobStatus(${job.id}, this.value)"
                >
                    <option value="Not Applied" ${status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="Applied" ${status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Rejected" ${status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Selected" ${status === 'Selected' ? 'selected' : ''}>Selected</option>
                </select>
                <span class="kn-status-badge ${getStatusBadgeClass(status)}">${status}</span>
            </div>
            
            <div class="kn-job-card__actions">
                <button class="kn-button kn-button--secondary kn-button--small" onclick="viewJob(${job.id})">View</button>
                ${showRemoveButton ?
            `<button class="kn-button kn-button--secondary kn-button--small" onclick="removeFromSaved(${job.id})">Remove</button>` :
            `<button class="kn-button kn-button--secondary kn-button--small ${saveButtonClass}" onclick="toggleSaveJob(${job.id})">${saveButtonText}</button>`
        }
                <button class="kn-button kn-button--primary kn-button--small" onclick="applyJob('${job.applyUrl}')">Apply</button>
            </div>
        </div>
    `;
};

// Render filter bar
const renderFilterBar = () => {
    return `
        <div class="kn-filter-bar">
            <div class="kn-filter-group">
                <input 
                    type="text" 
                    id="keyword-filter" 
                    class="kn-filter-input" 
                    placeholder="Search by title or company..."
                    value="${currentFilters.keyword}"
                >
            </div>
            
            <div class="kn-filter-group">
                <select id="location-filter" class="kn-filter-select">
                    <option value="">All Locations</option>
                    <option value="Bangalore" ${currentFilters.location === 'Bangalore' ? 'selected' : ''}>Bangalore</option>
                    <option value="Pune" ${currentFilters.location === 'Pune' ? 'selected' : ''}>Pune</option>
                    <option value="Hyderabad" ${currentFilters.location === 'Hyderabad' ? 'selected' : ''}>Hyderabad</option>
                    <option value="Chennai" ${currentFilters.location === 'Chennai' ? 'selected' : ''}>Chennai</option>
                    <option value="Mumbai" ${currentFilters.location === 'Mumbai' ? 'selected' : ''}>Mumbai</option>
                    <option value="Noida" ${currentFilters.location === 'Noida' ? 'selected' : ''}>Noida</option>
                    <option value="Gurgaon" ${currentFilters.location === 'Gurgaon' ? 'selected' : ''}>Gurgaon</option>
                    <option value="Mysore" ${currentFilters.location === 'Mysore' ? 'selected' : ''}>Mysore</option>
                    <option value="Remote" ${currentFilters.location === 'Remote' ? 'selected' : ''}>Remote</option>
                </select>
            </div>
            
            <div class="kn-filter-group">
                <select id="mode-filter" class="kn-filter-select">
                    <option value="">All Modes</option>
                    <option value="Remote" ${currentFilters.mode === 'Remote' ? 'selected' : ''}>Remote</option>
                    <option value="Hybrid" ${currentFilters.mode === 'Hybrid' ? 'selected' : ''}>Hybrid</option>
                    <option value="Onsite" ${currentFilters.mode === 'Onsite' ? 'selected' : ''}>Onsite</option>
                </select>
            </div>
            
            <div class="kn-filter-group">
                <select id="experience-filter" class="kn-filter-select">
                    <option value="">All Experience</option>
                    <option value="Fresher" ${currentFilters.experience === 'Fresher' ? 'selected' : ''}>Fresher</option>
                    <option value="0-1" ${currentFilters.experience === '0-1' ? 'selected' : ''}>0-1 years</option>
                    <option value="1-3" ${currentFilters.experience === '1-3' ? 'selected' : ''}>1-3 years</option>
                </select>
            </div>
            
            <div class="kn-filter-group">
                <select id="source-filter" class="kn-filter-select">
                    <option value="">All Sources</option>
                    <option value="LinkedIn" ${currentFilters.source === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                    <option value="Naukri" ${currentFilters.source === 'Naukri' ? 'selected' : ''}>Naukri</option>
                    <option value="Indeed" ${currentFilters.source === 'Indeed' ? 'selected' : ''}>Indeed</option>
                </select>
            </div>
            
            <div class="kn-filter-group">
                <select id="status-filter" class="kn-filter-select">
                    <option value="">All Status</option>
                    <option value="Not Applied" ${currentFilters.status === 'Not Applied' ? 'selected' : ''}>Not Applied</option>
                    <option value="Applied" ${currentFilters.status === 'Applied' ? 'selected' : ''}>Applied</option>
                    <option value="Rejected" ${currentFilters.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    <option value="Selected" ${currentFilters.status === 'Selected' ? 'selected' : ''}>Selected</option>
                </select>
            </div>
            
            <div class="kn-filter-group">
                <select id="sort-filter" class="kn-filter-select">
                    <option value="latest" ${currentFilters.sort === 'latest' ? 'selected' : ''}>Latest First</option>
                    <option value="match" ${currentFilters.sort === 'match' ? 'selected' : ''}>Match Score</option>
                    <option value="salary" ${currentFilters.sort === 'salary' ? 'selected' : ''}>Salary</option>
                    <option value="oldest" ${currentFilters.sort === 'oldest' ? 'selected' : ''}>Oldest First</option>
                </select>
            </div>
            
            <button class="kn-button kn-button--secondary kn-button--small" onclick="clearFilters()">Clear</button>
        </div>
    `;
};

// Render match toggle
const renderMatchToggle = () => {
    const preferences = getPreferences();
    if (!preferences) return '';

    return `
        <div class="kn-match-toggle">
            <label class="kn-toggle-label">
                <input 
                    type="checkbox" 
                    id="match-toggle" 
                    class="kn-toggle-input"
                    ${showOnlyMatches ? 'checked' : ''}
                    onchange="toggleMatchFilter()"
                >
                <span class="kn-toggle-slider"></span>
                <span class="kn-toggle-text">Show only jobs above ${preferences.minMatchScore}% match</span>
            </label>
        </div>
    `;
};

// Render no preferences banner
const renderNoPreferencesBanner = () => {
    return `
        <div class="kn-banner kn-banner--info">
            <div class="kn-banner__content">
                <strong>Set your preferences to activate intelligent matching.</strong>
                <p>Configure your job preferences to see personalized match scores and get better recommendations.</p>
            </div>
            <a href="#settings" class="kn-button kn-button--primary kn-button--small">Go to Settings</a>
        </div>
    `;
};

// Render job modal
const renderJobModal = (job) => {
    const saved = isJobSaved(job.id);
    const saveButtonText = saved ? 'Saved ✓' : 'Save Job';
    const saveButtonClass = saved ? 'kn-button--saved' : '';
    const preferences = getPreferences();
    const showMatchScore = preferences !== null;

    return `
        <div class="kn-modal" id="jobModal" onclick="closeModalOnBackdrop(event)">
            <div class="kn-modal__content">
                <div class="kn-modal__header">
                    <div>
                        <h2 class="kn-modal__title">${job.title}</h2>
                        <p class="kn-modal__company">${job.company}</p>
                    </div>
                    <button class="kn-modal__close" onclick="closeModal()">&times;</button>
                </div>
                
                <div class="kn-modal__body">
                    <div class="kn-job-detail">
                        <div class="kn-job-detail__meta">
                            ${showMatchScore ? `
                            <div class="kn-job-detail__item">
                                <strong>Match Score:</strong> <span class="kn-match-badge ${getMatchScoreBadgeClass(job.matchScore)}">${job.matchScore}%</span>
                            </div>
                            ` : ''}
                            <div class="kn-job-detail__item">
                                <strong>Location:</strong> ${job.location}
                            </div>
                            <div class="kn-job-detail__item">
                                <strong>Mode:</strong> ${job.mode}
                            </div>
                            <div class="kn-job-detail__item">
                                <strong>Experience:</strong> ${job.experience}
                            </div>
                            <div class="kn-job-detail__item">
                                <strong>Salary:</strong> ${job.salaryRange}
                            </div>
                            <div class="kn-job-detail__item">
                                <strong>Source:</strong> <span class="kn-badge ${getSourceBadgeClass(job.source)}">${job.source}</span>
                            </div>
                            <div class="kn-job-detail__item">
                                <strong>Posted:</strong> ${formatPostedDate(job.postedDaysAgo)}
                            </div>
                        </div>
                        
                        <div class="kn-job-detail__section">
                            <h3 class="kn-job-detail__heading">Description</h3>
                            <p class="kn-job-detail__text">${job.description}</p>
                        </div>
                        
                        <div class="kn-job-detail__section">
                            <h3 class="kn-job-detail__heading">Required Skills</h3>
                            <div class="kn-skills">
                                ${job.skills.map(skill => `<span class="kn-skill-tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="kn-modal__footer">
                    <button class="kn-button kn-button--secondary ${saveButtonClass}" onclick="toggleSaveJob(${job.id})">${saveButtonText}</button>
                    <button class="kn-button kn-button--primary" onclick="applyJob('${job.applyUrl}')">Apply Now</button>
                </div>
            </div>
        </div>
    `;
};

// Global functions for onclick handlers
window.viewJob = (jobId) => {
    const job = jobsData.find(j => j.id === jobId);
    if (job) {
        // Calculate match score for modal
        const preferences = getPreferences();
        selectedJob = {
            ...job,
            matchScore: calculateMatchScore(job, preferences)
        };
        document.body.insertAdjacentHTML('beforeend', renderJobModal(selectedJob));
        document.body.style.overflow = 'hidden';
    }
};

window.closeModal = () => {
    const modal = document.getElementById('jobModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
};

window.closeModalOnBackdrop = (event) => {
    if (event.target.classList.contains('kn-modal')) {
        closeModal();
    }
};

window.toggleSaveJob = (jobId) => {
    if (isJobSaved(jobId)) {
        unsaveJob(jobId);
    } else {
        saveJob(jobId);
    }

    // Refresh current page
    const currentRoute = window.location.hash.replace('#', '/') || '/';
    const pageName = routes[currentRoute] || 'landing';
    renderPage(pageName);

    // Update modal if open
    const modal = document.getElementById('jobModal');
    if (modal && selectedJob && selectedJob.id === jobId) {
        closeModal();
        viewJob(jobId);
    }
};

window.removeFromSaved = (jobId) => {
    unsaveJob(jobId);
    renderPage('saved');
};

window.applyJob = (url) => {
    window.open(url, '_blank');
};

window.clearFilters = () => {
    currentFilters = {
        keyword: '',
        location: '',
        mode: '',
        experience: '',
        source: '',
        sort: 'latest'
    };
    renderPage('dashboard');
};

window.toggleMatchFilter = () => {
    showOnlyMatches = !showOnlyMatches;
    renderPage('dashboard');
};

window.saveUserPreferences = () => {
    // Get form values
    const roleKeywordsInput = document.getElementById('role-keywords').value;
    const skillsInput = document.getElementById('skills').value;
    const experienceLevel = document.getElementById('experience-level').value;
    const minMatchScore = parseInt(document.getElementById('min-match-score').value);

    // Get selected modes
    const modeCheckboxes = document.querySelectorAll('input[name="mode"]:checked');
    const preferredMode = Array.from(modeCheckboxes).map(cb => cb.value);

    // Get selected locations
    const locationSelect = document.getElementById('location-select');
    const selectedOptions = Array.from(locationSelect.selectedOptions);
    const preferredLocations = selectedOptions.map(opt => opt.value);

    // Parse comma-separated values
    const roleKeywords = roleKeywordsInput ? roleKeywordsInput.split(',').map(k => k.trim()).filter(k => k) : [];
    const skills = skillsInput ? skillsInput.split(',').map(s => s.trim()).filter(s => s) : [];

    // Create preferences object
    const preferences = {
        roleKeywords,
        preferredLocations,
        preferredMode,
        experienceLevel,
        skills,
        minMatchScore
    };

    // Save to localStorage
    savePreferences(preferences);

    // Show success message
    alert('Preferences saved successfully!');

    // Refresh page to show changes
    renderPage('settings');
};

window.resetPreferences = () => {
    if (confirm('Are you sure you want to reset all preferences?')) {
        localStorage.removeItem('jobTrackerPreferences');
        renderPage('settings');
    }
};

// Digest management functions
const getTodayDateKey = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getFormattedDate = (dateKey) => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(year, parseInt(month) - 1, day);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

const getDigest = (dateKey) => {
    const digest = localStorage.getItem(`jobTrackerDigest_${dateKey}`);
    return digest ? JSON.parse(digest) : null;
};

const saveDigest = (dateKey, jobs) => {
    localStorage.setItem(`jobTrackerDigest_${dateKey}`, JSON.stringify(jobs));
};

window.generateTodayDigest = () => {
    const preferences = getPreferences();
    if (!preferences) {
        alert('Please set your preferences first!');
        window.location.hash = 'settings';
        return;
    }

    // Get all jobs with match scores
    let allJobs = jobsData.map(job => ({
        ...job,
        matchScore: calculateMatchScore(job, preferences)
    }));

    // Sort by match score (desc), then by posted days (asc)
    allJobs.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        return a.postedDaysAgo - b.postedDaysAgo;
    });

    // Take top 10
    const top10 = allJobs.slice(0, 10);

    // Save to localStorage
    const todayKey = getTodayDateKey();
    saveDigest(todayKey, top10);

    // Re-render page
    renderPage('digest');
};

const formatDigestAsText = (digestJobs, dateKey) => {
    const formattedDate = getFormattedDate(dateKey);
    let text = `TOP 10 JOBS FOR YOU — 9AM DIGEST\n${formattedDate}\n\n`;

    digestJobs.forEach((job, index) => {
        text += `${index + 1}. ${job.title}\n`;
        text += `   ${job.company} • ${job.location}\n`;
        text += `   ${job.experience} • ${job.matchScore}% match\n`;
        text += `   Apply: ${job.applyUrl}\n\n`;
    });

    text += '---\n';
    text += 'This digest was generated based on your preferences.\n';

    return text;
};

window.copyDigestToClipboard = (dateKey) => {
    const digestJobs = getDigest(dateKey);
    if (!digestJobs) return;

    const text = formatDigestAsText(digestJobs, dateKey);

    navigator.clipboard.writeText(text).then(() => {
        alert('Digest copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard. Please try again.');
    });
};

window.createEmailDraft = (dateKey) => {
    const digestJobs = getDigest(dateKey);
    if (!digestJobs) return;

    const subject = 'My 9AM Job Digest';
    const body = formatDigestAsText(digestJobs, dateKey);
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
};

// Job Status Management
const getJobStatus = (jobId) => {
    const statuses = localStorage.getItem('jobTrackerStatus');
    if (!statuses) return 'Not Applied';
    const parsed = JSON.parse(statuses);
    return parsed[jobId] || 'Not Applied';
};

window.setJobStatus = (jobId, status) => {
    const statuses = JSON.parse(localStorage.getItem('jobTrackerStatus') || '{}');
    statuses[jobId] = status;

    // Store status change history
    const history = JSON.parse(localStorage.getItem('jobTrackerStatusHistory') || '[]');
    const job = jobsData.find(j => j.id === jobId);

    history.unshift({
        jobId,
        jobTitle: job ? job.title : 'Unknown',
        jobCompany: job ? job.company : 'Unknown',
        status,
        timestamp: new Date().toISOString()
    });

    localStorage.setItem('jobTrackerStatus', JSON.stringify(statuses));
    localStorage.setItem('jobTrackerStatusHistory', JSON.stringify(history.slice(0, 20)));

    showToast(`Status updated: ${status}`);

    // Re-render current page
    const currentHash = window.location.hash.slice(1) || 'dashboard';
    renderPage(currentHash);
};

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'Applied': return 'kn-status-badge--applied';
        case 'Rejected': return 'kn-status-badge--rejected';
        case 'Selected': return 'kn-status-badge--selected';
        default: return 'kn-status-badge--not-applied';
    }
};

const showToast = (message) => {
    const toast = document.createElement('div');
    toast.className = 'kn-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('kn-toast--show'), 100);
    setTimeout(() => {
        toast.classList.remove('kn-toast--show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const getRecentStatusUpdates = () => {
    const history = JSON.parse(localStorage.getItem('jobTrackerStatusHistory') || '[]');
    return history.slice(0, 10);
};

// Test Checklist Management
const testItems = [
    { id: 'test1', label: 'Preferences persist after refresh', tooltip: 'Set preferences, refresh page, verify they remain' },
    { id: 'test2', label: 'Match score calculates correctly', tooltip: 'Check jobs have correct match % based on preferences' },
    { id: 'test3', label: '"Show only matches" toggle works', tooltip: 'Toggle on/off, verify filtering behavior' },
    { id: 'test4', label: 'Save job persists after refresh', tooltip: 'Save a job, refresh, check it remains saved' },
    { id: 'test5', label: 'Apply opens in new tab', tooltip: 'Click Apply, verify new tab opens' },
    { id: 'test6', label: 'Status update persists after refresh', tooltip: 'Change status, refresh, verify it remains' },
    { id: 'test7', label: 'Status filter works correctly', tooltip: 'Filter by status, verify correct jobs show' },
    { id: 'test8', label: 'Digest generates top 10 by score', tooltip: 'Generate digest, verify top 10 jobs by match score' },
    { id: 'test9', label: 'Digest persists for the day', tooltip: 'Generate digest, refresh, verify same digest loads' },
    { id: 'test10', label: 'No console errors on main pages', tooltip: 'Open console, navigate pages, check for errors' }
];

const getTestChecklist = () => {
    const saved = localStorage.getItem('jobTrackerTestChecklist');
    if (!saved) {
        return {
            test1: false, test2: false, test3: false, test4: false, test5: false,
            test6: false, test7: false, test8: false, test9: false, test10: false
        };
    }
    return JSON.parse(saved);
};

window.toggleTestItem = (testId) => {
    const checklist = getTestChecklist();
    checklist[testId] = !checklist[testId];
    localStorage.setItem('jobTrackerTestChecklist', JSON.stringify(checklist));
    renderPage('jt/07-test');
};

window.resetTestChecklist = () => {
    if (confirm('Are you sure you want to reset all test statuses?')) {
        localStorage.removeItem('jobTrackerTestChecklist');
        renderPage('jt/07-test');
    }
};

const isAllTestsPassed = () => {
    const checklist = getTestChecklist();
    return Object.values(checklist).every(v => v === true);
};

const renderTestItems = (checklist) => {
    return testItems.map(item => `
        <div class="kn-test-item">
            <label class="kn-test-item__label">
                <input 
                    type="checkbox" 
                    class="kn-checkbox" 
                    ${checklist[item.id] ? 'checked' : ''}
                    onchange="toggleTestItem('${item.id}')"
                >
                <span class="kn-test-item__text">${item.label}</span>
            </label>
            <span class="kn-test-item__tooltip" title="${item.tooltip}">?</span>
        </div>
    `).join('');
};

// Proof & Submission Management
const getProofLinks = () => {
    const saved = localStorage.getItem('jobTrackerProofLinks');
    if (!saved) {
        return { lovable: '', github: '', deployed: '' };
    }
    return JSON.parse(saved);
};

const getProjectStatus = () => {
    return localStorage.getItem('jobTrackerProjectStatus') || 'not-started';
};

const getStatusLabel = (status) => {
    const labels = {
        'not-started': 'Not Started',
        'in-progress': 'In Progress',
        'shipped': 'Shipped'
    };
    return labels[status] || 'Not Started';
};

const renderStepSummary = (allTestsPassed, allLinksProvided) => {
    const steps = [
        { label: 'Set up preferences', completed: true },
        { label: 'Configure match scoring', completed: true },
        { label: 'Generate daily digest', completed: true },
        { label: 'Implement status tracking', completed: true },
        { label: 'Add status filters', completed: true },
        { label: 'Complete test checklist', completed: allTestsPassed },
        { label: 'Provide artifact links', completed: allLinksProvided },
        { label: 'Ship project', completed: getProjectStatus() === 'shipped' }
    ];

    return steps.map((step, index) => `
        <div class="kn-proof-step">
            <span class="kn-proof-step__number">${index + 1}</span>
            <span class="kn-proof-step__label">${step.label}</span>
            <span class="kn-proof-step__status">${step.completed ? '✓' : '⏳'}</span>
        </div>
    `).join('');
};

window.saveProofLinks = () => {
    const lovable = document.getElementById('lovable-link').value.trim();
    const github = document.getElementById('github-link').value.trim();
    const deployed = document.getElementById('deployed-link').value.trim();

    // Validate URLs
    const urlPattern = /^https?:\/\/.+/;

    if (lovable && !urlPattern.test(lovable)) {
        alert('Please enter a valid Lovable project URL');
        return;
    }

    if (github && !urlPattern.test(github)) {
        alert('Please enter a valid GitHub repository URL');
        return;
    }

    if (deployed && !urlPattern.test(deployed)) {
        alert('Please enter a valid deployed URL');
        return;
    }

    const links = { lovable, github, deployed };
    localStorage.setItem('jobTrackerProofLinks', JSON.stringify(links));

    // Update status to in-progress if any link is provided
    if ((lovable || github || deployed) && getProjectStatus() === 'not-started') {
        localStorage.setItem('jobTrackerProjectStatus', 'in-progress');
    }

    showToast('Links saved successfully');
    renderPage('proof');
};

window.copySubmission = () => {
    const links = getProofLinks();

    const submission = `------------------------------------------
Job Notification Tracker — Final Submission

Lovable Project:
${links.lovable}

GitHub Repository:
${links.github}

Live Deployment:
${links.deployed}

Core Features:
- Intelligent match scoring
- Daily digest simulation
- Status tracking
- Test checklist enforced
------------------------------------------`;

    navigator.clipboard.writeText(submission).then(() => {
        showToast('Submission copied to clipboard');
    }).catch(() => {
        alert('Failed to copy. Please copy manually:\n\n' + submission);
    });
};

window.markAsShipped = () => {
    const allTestsPassed = isAllTestsPassed();
    const links = getProofLinks();
    const allLinksProvided = links.lovable && links.github && links.deployed;

    if (!allTestsPassed) {
        alert('Please complete all 10 test checklist items before shipping.');
        return;
    }

    if (!allLinksProvided) {
        alert('Please provide all 3 artifact links before shipping.');
        return;
    }

    if (confirm('Mark Project 1 as shipped?')) {
        localStorage.setItem('jobTrackerProjectStatus', 'shipped');
        renderPage('proof');
    }
};

// Attach filter listeners
const attachFilterListeners = () => {
    const keywordInput = document.getElementById('keyword-filter');
    const locationSelect = document.getElementById('location-filter');
    const modeSelect = document.getElementById('mode-filter');
    const experienceSelect = document.getElementById('experience-filter');
    const sourceSelect = document.getElementById('source-filter');
    const sortSelect = document.getElementById('sort-filter');

    if (keywordInput) {
        keywordInput.addEventListener('input', (e) => {
            currentFilters.keyword = e.target.value;
            renderPage('dashboard');
        });
    }

    if (locationSelect) {
        locationSelect.addEventListener('change', (e) => {
            currentFilters.location = e.target.value;
            renderPage('dashboard');
        });
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            currentFilters.mode = e.target.value;
            renderPage('dashboard');
        });
    }

    if (experienceSelect) {
        experienceSelect.addEventListener('change', (e) => {
            currentFilters.experience = e.target.value;
            renderPage('dashboard');
        });
    }

    if (sourceSelect) {
        sourceSelect.addEventListener('change', (e) => {
            currentFilters.source = e.target.value;
            renderPage('dashboard');
        });
    }

    const statusSelect = document.getElementById('status-filter');
    if (statusSelect) {
        statusSelect.addEventListener('change', (e) => {
            currentFilters.status = e.target.value;
            renderPage('dashboard');
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentFilters.sort = e.target.value;
            renderPage('dashboard');
        });
    }
};

// Attach settings listeners
const attachSettingsListeners = () => {
    const saveButton = document.getElementById('save-preferences-btn');
    const resetButton = document.getElementById('reset-preferences-btn');
    const slider = document.getElementById('min-match-score');
    const sliderValue = document.getElementById('slider-value');

    if (saveButton) {
        saveButton.addEventListener('click', saveUserPreferences);
    }

    if (resetButton) {
        resetButton.addEventListener('click', resetPreferences);
    }

    if (slider && sliderValue) {
        slider.addEventListener('input', (e) => {
            sliderValue.textContent = e.target.value;
        });
    }
};

// Route definitions
const routes = {
    '/': 'landing',
    '/dashboard': 'dashboard',
    '/saved': 'saved',
    '/digest': 'digest',
    '/settings': 'settings',
    '/proof': 'proof',
    '/jt/07-test': 'jt/07-test',
    '/jt/08-ship': 'jt/08-ship'
};

// Page templates
const pages = {
    landing: {
        render: () => `
            <div class="kn-landing">
                <div class="kn-landing__hero">
                    <h1 class="kn-landing__headline">Stop Missing The Right Jobs.</h1>
                    <p class="kn-landing__subtext">Precision-matched job discovery delivered daily at 9AM.</p>
                    <a href="#dashboard" class="kn-button kn-button--primary kn-button--large">Start Tracking</a>
                </div>
            </div>
        `
    },

    dashboard: {
        render: () => {
            const filteredJobs = filterAndSortJobs(jobsData);
            const preferences = getPreferences();

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Dashboard</h1>
                        <p class="kn-page__subtitle">Your personalized job feed • ${filteredJobs.length} jobs found</p>
                    </div>
                    
                    ${!preferences ? renderNoPreferencesBanner() : ''}
                    ${preferences ? renderMatchToggle() : ''}
                    ${renderFilterBar()}
                    
                    <div class="kn-jobs-grid">
                        ${filteredJobs.map(job => renderJobCard(job)).join('')}
                    </div>
                    
                    ${filteredJobs.length === 0 ? `
                        <div class="kn-empty-state">
                            <div class="kn-empty-state__icon">🔍</div>
                            <h2 class="kn-empty-state__title">No jobs found</h2>
                            <p class="kn-empty-state__text">${showOnlyMatches ? 'No roles match your criteria. Adjust filters or lower your match threshold in settings.' : 'Try adjusting your filters to see more results.'}</p>
                            ${showOnlyMatches ? '<a href="#settings" class="kn-button kn-button--secondary">Adjust Threshold</a>' : '<button class="kn-button kn-button--secondary" onclick="clearFilters()">Clear Filters</button>'}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    settings: {
        render: () => {
            const preferences = getPreferences();
            const roleKeywords = preferences?.roleKeywords?.join(', ') || '';
            const skills = preferences?.skills?.join(', ') || '';
            const minMatchScore = preferences?.minMatchScore || 40;

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Settings</h1>
                        <p class="kn-page__subtitle">Configure your job preferences for intelligent matching</p>
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
                                    placeholder="e.g., React, Frontend, Developer"
                                    value="${roleKeywords}"
                                >
                                <span class="kn-help-text">Enter keywords separated by commas (+25 for title match, +15 for description)</span>
                            </div>
                            
                            <div class="kn-form-group">
                                <label for="location-select" class="kn-label">Preferred Locations</label>
                                <select id="location-select" class="kn-select" multiple size="5">
                                    <option value="Bangalore" ${preferences?.preferredLocations?.includes('Bangalore') ? 'selected' : ''}>Bangalore</option>
                                    <option value="Pune" ${preferences?.preferredLocations?.includes('Pune') ? 'selected' : ''}>Pune</option>
                                    <option value="Hyderabad" ${preferences?.preferredLocations?.includes('Hyderabad') ? 'selected' : ''}>Hyderabad</option>
                                    <option value="Chennai" ${preferences?.preferredLocations?.includes('Chennai') ? 'selected' : ''}>Chennai</option>
                                    <option value="Mumbai" ${preferences?.preferredLocations?.includes('Mumbai') ? 'selected' : ''}>Mumbai</option>
                                    <option value="Noida" ${preferences?.preferredLocations?.includes('Noida') ? 'selected' : ''}>Noida</option>
                                    <option value="Gurgaon" ${preferences?.preferredLocations?.includes('Gurgaon') ? 'selected' : ''}>Gurgaon</option>
                                    <option value="Remote" ${preferences?.preferredLocations?.includes('Remote') ? 'selected' : ''}>Remote</option>
                                </select>
                                <span class="kn-help-text">Hold Ctrl/Cmd to select multiple (+15 for match)</span>
                            </div>
                            
                            <div class="kn-form-group">
                                <label class="kn-label">Preferred Mode</label>
                                <div class="kn-checkbox-group">
                                    <label class="kn-checkbox-item">
                                        <input type="checkbox" name="mode" value="Remote" class="kn-checkbox" ${preferences?.preferredMode?.includes('Remote') ? 'checked' : ''}>
                                        <span class="kn-checkbox-label">Remote</span>
                                    </label>
                                    <label class="kn-checkbox-item">
                                        <input type="checkbox" name="mode" value="Hybrid" class="kn-checkbox" ${preferences?.preferredMode?.includes('Hybrid') ? 'checked' : ''}>
                                        <span class="kn-checkbox-label">Hybrid</span>
                                    </label>
                                    <label class="kn-checkbox-item">
                                        <input type="checkbox" name="mode" value="Onsite" class="kn-checkbox" ${preferences?.preferredMode?.includes('Onsite') ? 'checked' : ''}>
                                        <span class="kn-checkbox-label">Onsite</span>
                                    </label>
                                </div>
                                <span class="kn-help-text">Select all that apply (+10 for match)</span>
                            </div>
                            
                            <div class="kn-form-group">
                                <label for="experience-level" class="kn-label">Experience Level</label>
                                <select id="experience-level" class="kn-select">
                                    <option value="">Select experience level</option>
                                    <option value="Fresher" ${preferences?.experienceLevel === 'Fresher' ? 'selected' : ''}>Fresher</option>
                                    <option value="0-1" ${preferences?.experienceLevel === '0-1' ? 'selected' : ''}>0-1 years</option>
                                    <option value="1-3" ${preferences?.experienceLevel === '1-3' ? 'selected' : ''}>1-3 years</option>
                                </select>
                                <span class="kn-help-text">Your experience level (+10 for match)</span>
                            </div>
                            
                            <div class="kn-form-group">
                                <label for="skills" class="kn-label">Skills</label>
                                <input 
                                    type="text" 
                                    id="skills" 
                                    class="kn-input" 
                                    placeholder="e.g., React, JavaScript, Node.js"
                                    value="${skills}"
                                >
                                <span class="kn-help-text">Enter skills separated by commas (+15 for any overlap)</span>
                            </div>
                            
                            <div class="kn-form-group">
                                <label for="min-match-score" class="kn-label">Minimum Match Score: <span id="slider-value">${minMatchScore}</span>%</label>
                                <input 
                                    type="range" 
                                    id="min-match-score" 
                                    class="kn-slider" 
                                    min="0" 
                                    max="100" 
                                    value="${minMatchScore}"
                                    step="5"
                                >
                                <span class="kn-help-text">Jobs below this score can be filtered out</span>
                            </div>
                            
                            <div class="kn-form-actions">
                                <button id="save-preferences-btn" class="kn-button kn-button--primary">Save Preferences</button>
                                <button id="reset-preferences-btn" class="kn-button kn-button--secondary">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },

    saved: {
        render: () => {
            const savedJobIds = getSavedJobs();
            const preferences = getPreferences();
            let savedJobs = jobsData.filter(job => savedJobIds.includes(job.id));

            // Add match scores
            savedJobs = savedJobs.map(job => ({
                ...job,
                matchScore: calculateMatchScore(job, preferences)
            }));

            if (savedJobs.length === 0) {
                return `
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
                `;
            }

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Saved</h1>
                        <p class="kn-page__subtitle">${savedJobs.length} saved jobs</p>
                    </div>
                    
                    <div class="kn-jobs-grid">
                        ${savedJobs.map(job => renderJobCard(job, true)).join('')}
                    </div>
                </div>
            `;
        }
    },

    digest: {
        render: () => {
            const preferences = getPreferences();
            const todayKey = getTodayDateKey();
            const formattedDate = getFormattedDate(todayKey);
            const digestJobs = getDigest(todayKey);

            // No preferences: blocking message
            if (!preferences) {
                return `
                    <div class="kn-page">
                        <div class="kn-page__header">
                            <h1 class="kn-page__title">Digest</h1>
                            <p class="kn-page__subtitle">Your daily job summary delivered at 9AM</p>
                        </div>
                        <div class="kn-empty-state">
                            <div class="kn-empty-state__icon">📧</div>
                            <h2 class="kn-empty-state__title">Set preferences to generate a personalized digest</h2>
                            <p class="kn-empty-state__text">Configure your job preferences to receive a daily digest of the top 10 matching jobs.</p>
                            <a href="#settings" class="kn-button kn-button--primary">Go to Settings</a>
                        </div>
                    </div>
                `;
            }

            // No digest yet: show generate button
            if (!digestJobs) {
                return `
                    <div class="kn-page">
                        <div class="kn-page__header">
                            <h1 class="kn-page__title">Digest</h1>
                            <p class="kn-page__subtitle">Your daily job summary delivered at 9AM</p>
                        </div>
                        <div class="kn-digest-container">
                            <div class="kn-empty-state">
                                <div class="kn-empty-state__icon">📧</div>
                                <h2 class="kn-empty-state__title">No digest generated yet</h2>
                                <p class="kn-empty-state__text">Generate your personalized digest of the top 10 matching jobs.</p>
                                <button class="kn-button kn-button--primary kn-button--large" onclick="generateTodayDigest()">
                                    Generate Today's 9AM Digest (Simulated)
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }

            // Digest exists: show email-style layout
            if (digestJobs.length === 0) {
                return `
                    <div class="kn-page">
                        <div class="kn-page__header">
                            <h1 class="kn-page__title">Digest</h1>
                            <p class="kn-page__subtitle">Your daily job summary delivered at 9AM</p>
                        </div>
                        <div class="kn-digest-container">
                            <div class="kn-empty-state">
                                <div class="kn-empty-state__icon">📧</div>
                                <h2 class="kn-empty-state__title">No matching roles today</h2>
                                <p class="kn-empty-state__text">Check again tomorrow or adjust your preferences.</p>
                                <a href="#settings" class="kn-button kn-button--secondary">Adjust Preferences</a>
                            </div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Digest</h1>
                        <p class="kn-page__subtitle">Your daily job summary delivered at 9AM</p>
                    </div>
                    
                    <div class="kn-digest-container">
                        <div class="kn-digest-email">
                            <!-- Header -->
                            <div class="kn-digest-header">
                                <h2 class="kn-digest-title">Top ${digestJobs.length} Jobs For You — 9AM Digest</h2>
                                <p class="kn-digest-date">${formattedDate}</p>
                            </div>
                            
                            <!-- Job List -->
                            <div class="kn-digest-jobs">
                                ${digestJobs.map((job, index) => `
                                    <div class="kn-digest-job">
                                        <div class="kn-digest-job__number">${index + 1}.</div>
                                        <div class="kn-digest-job__content">
                                            <h3 class="kn-digest-job__title">${job.title}</h3>
                                            <p class="kn-digest-job__meta">
                                                ${job.company} • ${job.location}
                                            </p>
                                            <p class="kn-digest-job__meta">
                                                ${job.experience} • <span class="kn-match-badge ${getMatchScoreBadgeClass(job.matchScore)}">${job.matchScore}% match</span>
                                            </p>
                                            <button class="kn-button kn-button--primary kn-button--small" onclick="applyJob('${job.applyUrl}')">Apply</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <!-- Footer -->
                            <div class="kn-digest-footer">
                                <p class="kn-digest-footer__text">This digest was generated based on your preferences.</p>
                                
                                <div class="kn-digest-actions">
                                    <button class="kn-button kn-button--secondary" onclick="copyDigestToClipboard('${todayKey}')">
                                        Copy to Clipboard
                                    </button>
                                    <button class="kn-button kn-button--secondary" onclick="createEmailDraft('${todayKey}')">
                                        Create Email Draft
                                    </button>
                                </div>
                                
                                <p class="kn-digest-note">Demo Mode: Daily 9AM trigger simulated manually.</p>
                            </div>
                        </div>
                        
                        <!-- Recent Status Updates -->
                        <div class="kn-status-updates-section">
                            <h3 class="kn-heading-secondary">Recent Status Updates</h3>
                            ${(() => {
                    const updates = getRecentStatusUpdates();
                    if (updates.length === 0) {
                        return '<p class="kn-text-secondary">No recent status updates.</p>';
                    }
                    return `
                                    <div class="kn-status-updates">
                                        ${updates.map(update => {
                        const date = new Date(update.timestamp);
                        const formattedDate = date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        return `
                                                <div class="kn-status-update">
                                                    <div class="kn-status-update__content">
                                                        <h4 class="kn-status-update__title">${update.jobTitle}</h4>
                                                        <p class="kn-status-update__company">${update.jobCompany}</p>
                                                    </div>
                                                    <div class="kn-status-update__badge">
                                                        <span class="kn-status-badge ${getStatusBadgeClass(update.status)}">${update.status}</span>
                                                        <span class="kn-status-update__date">${formattedDate}</span>
                                                    </div>
                                                </div>
                                            `;
                    }).join('')}
                                    </div>
                                `;
                })()}
                        </div>
                    </div>
                </div>
            `;
        }
    },

    proof: {
        render: () => {
            const proofLinks = getProofLinks();
            const projectStatus = getProjectStatus();
            const allTestsPassed = isAllTestsPassed();
            const allLinksProvided = proofLinks.lovable && proofLinks.github && proofLinks.deployed;
            const canShip = allTestsPassed && allLinksProvided;

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Proof & Submission</h1>
                        <p class="kn-page__subtitle">Project 1 — Job Notification Tracker</p>
                    </div>
                    
                    <!-- Status Badge -->
                    <div class="kn-proof-status">
                        <span class="kn-status-badge kn-status-badge--${projectStatus}">
                            ${getStatusLabel(projectStatus)}
                        </span>
                    </div>
                    
                    <!-- Step Completion Summary -->
                    <div class="kn-proof-section">
                        <h2 class="kn-heading-secondary">Step Completion Summary</h2>
                        <div class="kn-proof-steps">
                            ${renderStepSummary(allTestsPassed, allLinksProvided)}
                        </div>
                    </div>
                    
                    <!-- Artifact Collection -->
                    <div class="kn-proof-section">
                        <h2 class="kn-heading-secondary">Artifact Collection</h2>
                        <div class="kn-proof-inputs">
                            <div class="kn-form-group">
                                <label class="kn-label">Lovable Project Link *</label>
                                <input 
                                    type="url" 
                                    id="lovable-link" 
                                    class="kn-input" 
                                    placeholder="https://lovable.dev/projects/..."
                                    value="${proofLinks.lovable || ''}"
                                >
                            </div>
                            
                            <div class="kn-form-group">
                                <label class="kn-label">GitHub Repository Link *</label>
                                <input 
                                    type="url" 
                                    id="github-link" 
                                    class="kn-input" 
                                    placeholder="https://github.com/username/repo"
                                    value="${proofLinks.github || ''}"
                                >
                            </div>
                            
                            <div class="kn-form-group">
                                <label class="kn-label">Deployed URL *</label>
                                <input 
                                    type="url" 
                                    id="deployed-link" 
                                    class="kn-input" 
                                    placeholder="https://your-project.vercel.app"
                                    value="${proofLinks.deployed || ''}"
                                >
                            </div>
                            
                            <button class="kn-button kn-button--primary" onclick="saveProofLinks()">
                                Save Links
                            </button>
                        </div>
                    </div>
                    
                    <!-- Submission Export -->
                    ${allLinksProvided ? `
                        <div class="kn-proof-section">
                            <h2 class="kn-heading-secondary">Final Submission</h2>
                            <button class="kn-button kn-button--secondary" onclick="copySubmission()">
                                Copy Final Submission
                            </button>
                        </div>
                    ` : ''}
                    
                    <!-- Ship Validation -->
                    ${canShip && projectStatus !== 'shipped' ? `
                        <div class="kn-proof-section">
                            <button class="kn-button kn-button--primary" onclick="markAsShipped()">
                                Mark as Shipped
                            </button>
                        </div>
                    ` : ''}
                    
                    <!-- Shipped Message -->
                    ${projectStatus === 'shipped' ? `
                        <div class="kn-proof-shipped">
                            <div class="kn-proof-shipped__icon">✓</div>
                            <h3>Project 1 Shipped Successfully.</h3>
                        </div>
                    ` : ''}
                    
                    <!-- Validation Messages -->
                    ${!allTestsPassed ? `
                        <div class="kn-proof-warning">
                            ⚠️ Complete all 10 test checklist items before shipping.
                            <a href="#jt/07-test">Go to Test Checklist</a>
                        </div>
                    ` : ''}
                    
                    ${!allLinksProvided ? `
                        <div class="kn-proof-warning">
                            ⚠️ Provide all 3 artifact links before shipping.
                        </div>
                    ` : ''}
                </div>
            `;
        }
    },

    'jt/07-test': {
        render: () => {
            const checklist = getTestChecklist();
            const passedCount = Object.values(checklist).filter(v => v).length;
            const allPassed = passedCount === 10;

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">Test Checklist</h1>
                        <p class="kn-page__subtitle">Verify all features before shipping</p>
                    </div>
                    
                    <!-- Test Summary -->
                    <div class="kn-test-summary ${allPassed ? 'kn-test-summary--pass' : 'kn-test-summary--warn'}">
                        <h2>Tests Passed: ${passedCount} / 10</h2>
                        ${!allPassed ? '<p class="kn-warning-text">⚠️ Resolve all issues before shipping.</p>' : '<p class="kn-success-text">✓ All tests passed! Ready to ship.</p>'}
                    </div>
                    
                    <!-- Checklist -->
                    <div class="kn-test-checklist">
                        ${renderTestItems(checklist)}
                    </div>
                    
                    <!-- Reset Button -->
                    <div class="kn-test-actions">
                        <button class="kn-button kn-button--secondary" onclick="resetTestChecklist()">
                            Reset Test Status
                        </button>
                    </div>
                </div>
            `;
        }
    },

    'jt/08-ship': {
        render: () => {
            const allPassed = isAllTestsPassed();

            if (!allPassed) {
                return `
                    <div class="kn-page">
                        <div class="kn-page__header">
                            <h1 class="kn-page__title">🔒 Ship Locked</h1>
                            <p class="kn-page__subtitle">Complete all tests before shipping</p>
                        </div>
                        
                        <div class="kn-ship-locked">
                            <div class="kn-ship-locked__icon">🔒</div>
                            <h2>Cannot Ship Yet</h2>
                            <p>You must pass all 10 tests in the Test Checklist before you can ship this project.</p>
                            <a href="#jt/07-test" class="kn-button kn-button--primary">Go to Test Checklist</a>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="kn-page">
                    <div class="kn-page__header">
                        <h1 class="kn-page__title">🚀 Ready to Ship</h1>
                        <p class="kn-page__subtitle">All tests passed!</p>
                    </div>
                    
                    <div class="kn-ship-ready">
                        <div class="kn-ship-ready__icon">✓</div>
                        <h2>All Tests Passed</h2>
                        <p>Your Job Notification Tracker is ready to ship!</p>
                        <div class="kn-ship-summary">
                            <h3>What's Included:</h3>
                            <ul>
                                <li>✓ Preference-based job matching</li>
                                <li>✓ Daily digest engine</li>
                                <li>✓ Job status tracking</li>
                                <li>✓ Advanced filtering and sorting</li>
                                <li>✓ Persistent storage</li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }
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

    // Attach filter listeners for dashboard
    if (pageName === 'dashboard') {
        attachFilterListeners();
    }

    // Attach settings listeners for settings page
    if (pageName === 'settings') {
        attachSettingsListeners();
    }
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
    if (navLinks && hamburger) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }

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

    if (nav && navLinks && hamburger && !nav.contains(e.target) && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
        hamburger.classList.remove('active');
    }
});

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const initialHash = window.location.hash.replace('#', '/') || '/';
    navigate(initialHash);
});
