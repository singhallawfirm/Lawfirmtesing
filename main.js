/**
 * main.js
 * This script handles:
 * - Theme toggling and search bar
 * - Content modals (Article, News, Video)
 * - Loading media from localStorage for media.html and home.html
 * - Pagination on media.html
 * - Activating modals from URL parameters on media.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. GLOBAL SETUP & COMMON ELEMENTS ---
    const mediaData = JSON.parse(localStorage.getItem('mediaContent')) || [];

    // --- 2. THEME & SEARCH FUNCTIONALITY (Common to all pages) ---
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        const themeIcon = themeToggleButton.querySelector('i');
        const body = document.body;
        // Apply saved theme on load
        if (localStorage.getItem('theme') === 'dark') {
            body.classList.add('dark-theme');
            themeIcon.className = 'fa-solid fa-moon';
        }
        // Theme toggle event
        themeToggleButton.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            localStorage.setItem('theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
            themeIcon.className = body.classList.contains('dark-theme') ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
        });
    }

    const searchToggle = document.getElementById('search-toggle');
    const searchInput = document.getElementById('search-input');
    if(searchToggle && searchInput) {
        searchToggle.addEventListener('click', () => {
            searchInput.classList.toggle('active');
            if (searchInput.classList.contains('active')) {
                searchInput.focus();
            }
        });
    }

    // --- 3. HOME PAGE SPECIFIC LOGIC ---
    const updatesGrid = document.querySelector('.updates-grid');
    if (updatesGrid) {
        const latestArticles = mediaData.filter(item => item.type === 'article').slice(0, 2);
        const latestNews = mediaData.filter(item => item.type === 'news').slice(0, 2);
        const latestUpdates = [...latestArticles, ...latestNews];

        if (latestUpdates.length > 0) {
            latestUpdates.forEach(item => {
                const category = item.type.charAt(0).toUpperCase() + item.type.slice(1);
                const link = `media.html?tab=${item.type}s&open_id=${item.id}`;

                const cardHTML = `
                    <div class="media-card" data-link="${link}">
                        <div class="media-card-thumbnail">
                            <img src="${item.thumbnailUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Error';">
                        </div>
                        <div class="media-card-content">
                            <span class="card-category">${category}</span>
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            <div class="media-card-footer">
                                <span class="date">${new Date(item.date).toLocaleDateString()}</span>
                                <span class="read-more-btn">&rarr;</span>
                            </div>
                        </div>
                    </div>`;
                updatesGrid.innerHTML += cardHTML;
            });

            updatesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.media-card');
                if (card && card.dataset.link) {
                    window.location.href = card.dataset.link;
                }
            });

        } else {
            updatesGrid.innerHTML = '<p class="no-content-message">No updates have been posted yet.</p>';
        }
    }
    
    // --- 4. MEDIA PAGE SPECIFIC LOGIC ---
    const mediaPageContainer = document.querySelector('.media-section');
    if (mediaPageContainer) {

        // --- MODAL SETUP ---
        const mainContent = document.getElementById('main-content');
        const modals = {
            article: {
                overlay: document.getElementById('article-modal'),
                body: document.getElementById('article-modal-body'),
                closeBtn: document.getElementById('close-article-btn'),
                prevBtn: document.getElementById('prev-article'),
                nextBtn: document.getElementById('next-article'),
                keys: mediaData.filter(i => i.type === 'article').map(i => i.id),
                currentId: null
            },
            news: {
                overlay: document.getElementById('news-modal'),
                body: document.getElementById('news-modal-body'),
                closeBtn: document.getElementById('close-news-btn'),
                prevBtn: document.getElementById('prev-news'),
                nextBtn: document.getElementById('next-news'),
                keys: mediaData.filter(i => i.type === 'news').map(i => i.id),
                currentId: null
            },
            video: {
                overlay: document.getElementById('video-modal'),
                body: document.getElementById('video-modal-body'),
                closeBtn: document.getElementById('close-video-btn')
            }
        };

        const openModal = (modal) => {
            if (!modal || !modal.overlay) return;
            modal.overlay.classList.add('active');
            mainContent.style.filter = 'blur(5px)';
            document.body.style.overflow = 'hidden';
            if(modal.keys && modal.keys.length > 1) {
                if (modal.prevBtn) modal.prevBtn.classList.add('visible');
                if (modal.nextBtn) modal.nextBtn.classList.add('visible');
            }
        };
        
        const closeModal = (modal) => {
            if (!modal || !modal.overlay) return;
            modal.overlay.classList.remove('active');
            mainContent.style.filter = 'none';
            document.body.style.overflow = '';
            if (modal.body) modal.body.innerHTML = ''; // Clear content
            if (modal.prevBtn) modal.prevBtn.classList.remove('visible');
            if (modal.nextBtn) modal.nextBtn.classList.remove('visible');
        };
        
        const loadContent = (type, itemId) => {
            const item = mediaData.find(i => i.id === itemId);
            const modal = modals[type];
            if (!item || !modal) return;
        
            if (type === 'video') {
                const videoId = (item.videoUrl.match(/[?&]v=([^&]+)/) || [])[1];
                modal.body.innerHTML = videoId 
                    ? `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`
                    : '<p>Invalid video URL.</p>';
            } else {
                modal.body.innerHTML = `
                    <h1>${item.title}</h1>
                    <p class="article-meta">${item.meta || new Date(item.date).toLocaleDateString()}</p>
                    <img src="${item.mainImageUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='https://placehold.co/800x400/cccccc/ffffff?text=Image+Error';">
                    ${item.content}
                `;
            }
            modal.currentId = itemId;
            openModal(modal);
        };
        
        const navigateContent = (type, direction) => {
            const modal = modals[type];
            if (!modal || !modal.keys || modal.keys.length === 0) return;
            const currentIndex = modal.keys.indexOf(modal.currentId);
            let nextIndex = direction === 'next' 
                ? (currentIndex + 1) % modal.keys.length
                : (currentIndex - 1 + modal.keys.length) % modal.keys.length;
            loadContent(type, modal.keys[nextIndex]);
        };
        
        Object.keys(modals).forEach(type => {
            const modal = modals[type];
            if (modal.closeBtn) modal.closeBtn.addEventListener('click', () => closeModal(modal));
            if (modal.overlay) modal.overlay.addEventListener('click', (e) => e.target === modal.overlay && closeModal(modal));
            if (modal.prevBtn) modal.prevBtn.addEventListener('click', () => navigateContent(type, 'prev'));
            if (modal.nextBtn) modal.nextBtn.addEventListener('click', () => navigateContent(type, 'next'));
        });

        // --- PAGINATION & TABS ---
        const ITEMS_PER_PAGE = 24;
        const setupPagination = (items, gridContainerId) => {
            const gridContainer = document.getElementById(gridContainerId);
            const paginationContainer = document.getElementById(gridContainerId.replace('-grid', '-pagination'));
            if (!gridContainer) return;
        
            const displayItems = (page) => {
                gridContainer.innerHTML = '';
                const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
        
                if (paginatedItems.length === 0) {
                    gridContainer.innerHTML = `<p class="no-content-message">No content posted yet.</p>`;
                } else {
                    paginatedItems.forEach(item => {
                        let buttonText = item.type === 'article' ? 'Read More' : (item.type === 'video' ? 'Watch Now' : 'View');
                        gridContainer.innerHTML += `
                            <div class="media-card clickable" data-id="${item.id}" data-type="${item.type}">
                                <div class="media-card-thumbnail">
                                    <img src="${item.thumbnailUrl}" alt="${item.title}" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Error';">
                                    ${item.type === 'video' ? '<div class="video-overlay"><i class="fa-solid fa-play"></i></div>' : ''}
                                </div>
                                <div class="media-card-content">
                                    <h3>${item.title}</h3>
                                    <p>${item.description}</p>
                                    <div class="media-card-footer">
                                        <span class="date">${new Date(item.date).toLocaleDateString()}</span>
                                        <a href="#" class="read-more-btn">${buttonText} &rarr;</a>
                                    </div>
                                </div>
                            </div>`;
                    });
                }
                renderPaginationControls(page, Math.ceil(items.length / ITEMS_PER_PAGE));
            };
        
            const renderPaginationControls = (currentPage, totalPages) => {
                if (!paginationContainer) return;
                paginationContainer.innerHTML = '';
                if (totalPages <= 1) return;
                let paginationHTML = '<div class="pagination-nav">';
                paginationHTML += `<a href="#" class="first-last ${currentPage === 1 ? 'disabled' : ''}" data-page="1">First</a>`;
                let startPage = Math.max(1, currentPage - 2);
                let endPage = Math.min(totalPages, currentPage + 2);
                if (startPage > 1) paginationHTML += `...`;
                for (let i = startPage; i <= endPage; i++) {
                    paginationHTML += `<a href="#" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</a>`;
                }
                if (endPage < totalPages) paginationHTML += `...`;
                paginationHTML += `<a href="#" class="first-last ${currentPage === totalPages ? 'disabled' : ''}" data-page="${totalPages}">Last</a>`;
                paginationHTML += '</div>';
                paginationContainer.innerHTML = paginationHTML;
            };

            gridContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.media-card.clickable');
                if (card) {
                    e.preventDefault();
                    loadContent(card.dataset.type, card.dataset.id);
                }
            });

            if (paginationContainer) {
                paginationContainer.addEventListener('click', (e) => {
                    e.preventDefault();
                    const target = e.target.closest('a');
                    if (target && !target.classList.contains('disabled')) displayItems(parseInt(target.dataset.page));
                });
            }

            displayItems(1);
        };

        const tabLinks = document.querySelectorAll('.tab-link');
        const tabContents = document.querySelectorAll('.tab-content');

        const setupTabContent = (tabId) => {
            let filterType;
            if (tabId === 'articles') filterType = 'article';
            else if (tabId === 'news') filterType = 'news';
            else if (tabId === 'videos') filterType = 'video';
            else return;

            const items = mediaData.filter(item => item.type === filterType);
            setupPagination(items, `${tabId}-grid`);
        };

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;
                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                tabContents.forEach(c => c.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                setupTabContent(tabId);
            });
        });

        const urlParams = new URLSearchParams(window.location.search);
        let tabToActivate = urlParams.get('tab');
        const openId = urlParams.get('open_id');
        
        if (!tabToActivate && openId) {
            const item = mediaData.find(i => i.id === openId);
            if (item) tabToActivate = `${item.type}s`;
        }
        
        let linkToActivate = document.querySelector(`.tab-link[data-tab="${tabToActivate}"]`);
        if (!linkToActivate) {
            linkToActivate = document.querySelector('.tab-link');
        }

        if (linkToActivate) {
            linkToActivate.click();
        }

        if (openId) {
            const itemToOpen = mediaData.find(i => i.id === openId);
            if (itemToOpen) {
                setTimeout(() => loadContent(itemToOpen.type, itemToOpen.id), 150);
            }
        }
    }

     // --- 5. FAQ Section Logic (Common) ---
    const faqItems = document.querySelectorAll('.faq-item');
    if(faqItems) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            question.addEventListener('click', () => {
                const wasActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));
                if (!wasActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // --- 6. Partner Modal Logic (Firm Page) ---
    const partnerGrid = document.querySelector('.partners-grid');
    if (partnerGrid) {
        const partnerModal = document.getElementById('partner-modal');
        const modalBody = partnerModal.querySelector('.partner-modal-body');
        const closeModalBtn = partnerModal.querySelector('.close-modal-btn');

        partnerGrid.addEventListener('click', (e) => {
            const card = e.target.closest('.partner-card');
            if (card) {
                const detailsSource = card.querySelector('.partner-full-details');
                if (detailsSource) {
                    // Get the raw HTML from the hidden div
                    const detailsHTML = detailsSource.innerHTML;

                    // Set the modal body's content
                    modalBody.innerHTML = detailsHTML;
                    
                    // The CSS grid for the modal body expects an image and a details div.
                    // The source HTML needs to be restructured to fit this layout.
                    const image = modalBody.querySelector('img');
                    const detailsContainer = document.createElement('div');
                    detailsContainer.classList.add('partner-modal-details');

                    // Move all elements that are not the image into the new details container
                    while (image && image.nextSibling) {
                        detailsContainer.appendChild(image.nextSibling);
                    }
                    
                    // Clear the modal body and append the correctly structured elements
                    modalBody.innerHTML = '';
                    if(image) {
                        image.classList.add('partner-image');
                        modalBody.appendChild(image);
                    }
                    modalBody.appendChild(detailsContainer);

                    // Display the modal
                    partnerModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            }
        });

        const closePartnerModal = () => {
            partnerModal.classList.remove('active');
            document.body.style.overflow = '';
            modalBody.innerHTML = ''; // Clear content on close
        };

        closeModalBtn.addEventListener('click', closePartnerModal);

        partnerModal.addEventListener('click', (e) => {
            // Close if the click is on the overlay background
            if (e.target === partnerModal) {
                closePartnerModal();
            }
        });
    }

    // --- 7. Practice Area Modal Logic (Practices Page) ---
    const servicesGrid = document.querySelector('.services-grid');
    if (servicesGrid) {
        const practiceModal = document.getElementById('practice-modal');
        if (practiceModal) {
            const practiceModalContent = practiceModal.querySelector('.practice-modal-content');
            
            const closePracticeModal = () => {
                practiceModal.classList.remove('active');
                document.body.style.overflow = '';
            };

            servicesGrid.addEventListener('click', (e) => {
                const card = e.target.closest('.service-card.expandable');
                if (card) {
                    const bannerImage = card.getAttribute('data-image');
                    const iconHTML = card.querySelector('.icon').innerHTML;
                    const titleText = card.querySelector('h3').innerText;
                    const detailsHTML = card.querySelector('.practice-details').innerHTML;
                    
                    practiceModalContent.innerHTML = `
                        <button class="close-modal-btn">&times;</button>
                        <img src="${bannerImage}" alt="${titleText} Banner" class="practice-modal-banner" onerror="this.onerror=null;this.src='https://placehold.co/800x300/cccccc/ffffff?text=Image+Error';">
                        <div class="practice-modal-body">
                            <div class="icon">${iconHTML}</div>
                            <h2>${titleText}</h2>
                            ${detailsHTML}
                        </div>
                    `;
                    
                    practiceModalContent.querySelector('.close-modal-btn').addEventListener('click', closePracticeModal);
                    practiceModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });

            practiceModal.addEventListener('click', (e) => {
                if (e.target === practiceModal) {
                    closePracticeModal();
                }
            });
        }
    }

    // --- 8. Contact Form Submission Logic ---
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        const formStatus = document.getElementById('form-status');
        const submitButton = contactForm.querySelector('button[type="submit"]');
        // !!! IMPORTANT !!! 
        // Replace this placeholder with your actual Google Apps Script Web App URL.
        // See instructions.md for details on how to get this URL.
        const googleAppScriptURL = 'https://script.google.com/macros/s/AKfycbwDFF8DouTmkX1iaxCPkxnT11vdbWEkfVO1lqYce-e9V2R3sHQO3g1FO4irE_9gurvM/exec';

        if (googleAppScriptURL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
            console.warn('Google Apps Script URL is not set in main.js. Form submissions will be simulated.');
        }

        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            formStatus.className = '';
            formStatus.textContent = '';

            // Simulate submission if URL is not set, for demonstration purposes.
            if (googleAppScriptURL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
                setTimeout(() => {
                    formStatus.textContent = 'This is a simulation. Set your Google Apps Script URL in main.js to enable live submissions.';
                    formStatus.className = 'success';
                    submitButton.disabled = false;
                    submitButton.innerHTML = 'Send Message';
                    contactForm.reset();
                }, 1500);
                return;
            }

            // Real submission to Google Apps Script
            fetch(googleAppScriptURL, {
                method: 'POST',
                body: new FormData(contactForm),
            })
            .then(response => response.json())
            .then(data => {
                if (data.result === 'success') {
                    formStatus.textContent = 'Thank you! Your message has been sent successfully.';
                    formStatus.className = 'success';
                    contactForm.reset();
                } else {
                    // Handle errors returned by the script
                    throw new Error(data.error || 'An unknown error occurred.');
                }
            })
            .catch(error => {
                formStatus.textContent = 'An error occurred while sending your message. Please try again later.';
                formStatus.className = 'error';
                console.error('Error:', error);
            })
            .finally(() => {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Send Message';
            });
        });
    }
});


