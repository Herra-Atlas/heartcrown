class SidebarMenu {
    constructor() {
        this.sidebar = null;
        this.overlay = null;
        this.mobileToggle = null;
        this.isMobile = window.innerWidth <= 768;
        this.isOpen = false;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.loadSidebar().then(() => {
            this.bindEvents();
            this.handleResize();
            this.setActiveMenuItem();
        });
    }

    async loadSidebar() {
        try {
            const data = await window.menuAPI.getHeaderHTML();

            const container = document.getElementById('sidebar-container');
            if (container) {
                container.innerHTML = data;

                // Elementtien viittaukset
                this.sidebar = document.getElementById('sidebar-menu');
                this.overlay = document.getElementById('sidebar-overlay');
                this.mobileToggle = document.getElementById('mobile-toggle');
            }
            return Promise.resolve();
        } catch (error) {
            console.error('Error loading sidebar:', error);
            return Promise.reject(error);
        }
    }

    loadCSS(href) {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
        }
    }
    loadJS(src) {
        if (!document.querySelector(`script[src="${src}"]`)) {
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            document.body.appendChild(script);
        }
    }

    // ...existing code...
    handleNavClick(e, item) {
        const href = item.getAttribute('href');
        if (href && href !== '#') {
            e.preventDefault();
            fetch(href)
                .then(res => res.text())
                .then(html => {
                    if (html.includes('<body')) {
                        const temp = document.createElement('html');
                        temp.innerHTML = html;
                        const bodyContent = temp.querySelector('body')?.innerHTML || html;
                        document.getElementById('content').innerHTML = bodyContent;
                    } else {
                        document.getElementById('content').innerHTML = html;
                    }
                    // Lataa muistio.css ja muistio.js jos muistio.html ladattiin
                    if (href.endsWith('muistio/muistio.html')) {
                        this.loadCSS('sovellukset/sovellus/muistio/muistio.css');
                        this.loadJS('sovellukset/sovellus/muistio/muistio.js');
                        setTimeout(() => {
                            if (window.muistioInit) window.muistioInit();
                        }, 100);
                    } else if (href.endsWith('sovellukset/sovellus/kalenteri/kalenteri.html')) {
                        this.loadCSS('sovellukset/sovellus/kalenteri/kalenteri.css');
                        this.loadJS('sovellukset/sovellus/kalenteri/kalenteri.js');
                    // ...existing code...
                     } else if (href.endsWith('sovellukset/crypt/salaa.html') ||
                        href.endsWith('sovellukset/crypt/purku.html') ||
                        href.endsWith('sovellukset/crypt/asetukset.html')) {
                        this.loadCSS('sovellukset/crypt/crypt.css');
                        this.loadJS('sovellukset/crypt/crypt.js');
                        setTimeout(() => {
                          if (window.initializeCryptApp) window.initializeCryptApp();
                        }, 100);
                    }
                })
                .catch(err => {
                    document.getElementById('content').innerHTML = '<p style="color:red">Sivua ei löytynyt.</p>';
                });
        } else {
            e.preventDefault();
        }
    }

    bindEvents() {
        if (!this.sidebar) return;

        // Mobile toggle button
        if (this.mobileToggle) {
            this.mobileToggle.addEventListener('click', () => this.toggleMobile());
        }

        // Overlay click to close
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMobile());
        }

        // Expandable menu items
        const expandableItems = this.sidebar.querySelectorAll('.nav-item.expandable');
        expandableItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleExpandableClick(e, item));
        });

        // Regular navigation items
        const navItems = this.sidebar.querySelectorAll('.nav-item:not(.expandable)');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleNavClick(e, item));
        });

        // Submenu items
        const submenuItems = this.sidebar.querySelectorAll('.submenu-item');
        submenuItems.forEach(item => {
            item.addEventListener('click', (e) => this.handleSubmenuClick(e, item));
        });

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleExpandableClick(e, item) {
        e.preventDefault();
        
        const targetId = item.getAttribute('data-target');
        const submenu = document.getElementById(targetId);
        const arrow = item.querySelector('.nav-arrow');
        
        if (submenu) {
            const isExpanded = submenu.classList.contains('expanded');
            
            // Close all other submenus
            this.closeAllSubmenus();
            
            if (!isExpanded) {
                // Open this submenu
                submenu.classList.add('expanded');
                item.classList.add('expanded');
                
                // Animate the expansion
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
                
                // Add active state
                this.setActiveItem(item);
            } else {
                // Close this submenu
                submenu.classList.remove('expanded');
                item.classList.remove('expanded');
                submenu.style.maxHeight = '0';
            }
        }
        
        // Close mobile menu if open
        if (this.isMobile && this.isOpen) {
            setTimeout(() => this.closeMobile(), 300);
        }
    }

    handleSubmenuClick(e, item) {
        const href = item.getAttribute('href');
        if (href && href !== '#') {
            // Set active state for submenu item
            this.setActiveSubmenuItem(item);

            // Close mobile menu if open
            if (this.isMobile && this.isOpen) {
                setTimeout(() => this.closeMobile(), 100);
            }

            // *** TÄRKEÄ MUUTOS: Lataa sisältö kuten handleNavClick ***
            this.handleNavClick(e, item);
        } else {
            e.preventDefault();
        }
    }

    navigateToPage(href) {
        // Add loading state
        this.showLoadingState();
        
        // Simulate page navigation (replace with actual navigation logic)
        console.log('Navigating to:', href);
        
        // You can implement actual page loading here
        // For example: window.location.href = href;
        
        // Remove loading state after a delay
        setTimeout(() => this.hideLoadingState(), 500);
    }

    showLoadingState() {
        const content = document.getElementById('content');
        if (content) {
            content.style.opacity = '0.6';
            content.style.pointerEvents = 'none';
        }
    }

    hideLoadingState() {
        const content = document.getElementById('content');
        if (content) {
            content.style.opacity = '1';
            content.style.pointerEvents = 'auto';
        }
    }

    closeAllSubmenus() {
        const expandedSubmenus = this.sidebar.querySelectorAll('.submenu.expanded');
        const expandedItems = this.sidebar.querySelectorAll('.nav-item.expanded');
        
        expandedSubmenus.forEach(submenu => {
            submenu.classList.remove('expanded');
            submenu.style.maxHeight = '0';
        });
        
        expandedItems.forEach(item => {
            item.classList.remove('expanded');
        });
    }

    setActiveItem(item) {
        // Remove active class from all nav items
        const allNavItems = this.sidebar.querySelectorAll('.nav-item');
        allNavItems.forEach(navItem => navItem.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Store active item in localStorage
        const itemText = item.querySelector('.nav-text')?.textContent;
        if (itemText) {
            localStorage.setItem('activeMenuItem', itemText);
        }
    }

    setActiveSubmenuItem(item) {
        // Remove active class from all submenu items
        const allSubmenuItems = this.sidebar.querySelectorAll('.submenu-item');
        allSubmenuItems.forEach(submenuItem => submenuItem.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Store active submenu item in localStorage
        const itemText = item.querySelector('.submenu-text')?.textContent;
        if (itemText) {
            localStorage.setItem('activeSubmenuItem', itemText);
        }
    }

    setActiveMenuItem() {
        // Restore active states from localStorage
        const activeMenuItem = localStorage.getItem('activeMenuItem');
        const activeSubmenuItem = localStorage.getItem('activeSubmenuItem');
        
        if (activeMenuItem) {
            const navItems = this.sidebar.querySelectorAll('.nav-item .nav-text');
            navItems.forEach(textElement => {
                if (textElement.textContent === activeMenuItem) {
                    textElement.closest('.nav-item').classList.add('active');
                }
            });
        }
        
        if (activeSubmenuItem) {
            const submenuItems = this.sidebar.querySelectorAll('.submenu-item .submenu-text');
            submenuItems.forEach(textElement => {
                if (textElement.textContent === activeSubmenuItem) {
                    const submenuItem = textElement.closest('.submenu-item');
                    submenuItem.classList.add('active');
                    
                    // Also expand the parent submenu
                    const submenu = submenuItem.closest('.submenu');
                    if (submenu) {
                        submenu.classList.add('expanded');
                        submenu.style.maxHeight = submenu.scrollHeight + 'px';
                        
                        // Find and expand the parent nav item
                        const targetId = submenu.id;
                        const parentNavItem = this.sidebar.querySelector(`[data-target="${targetId}"]`);
                        if (parentNavItem) {
                            parentNavItem.classList.add('expanded');
                        }
                    }
                }
            });
        }
    }

    toggleMobile() {
        if (this.isOpen) {
            this.closeMobile();
        } else {
            this.openMobile();
        }
    }

    openMobile() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.add('mobile-open');
            this.overlay.classList.add('active');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
        }
    }

    closeMobile() {
        if (this.sidebar && this.overlay) {
            this.sidebar.classList.remove('mobile-open');
            this.overlay.classList.remove('active');
            this.isOpen = false;
            document.body.style.overflow = '';
        }
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        
        // If switching from mobile to desktop, close mobile menu
        if (wasMobile && !this.isMobile && this.isOpen) {
            this.closeMobile();
        }
        
        // Adjust content margin
        const content = document.getElementById('content');
        if (content) {
            if (this.isMobile) {
                content.style.marginLeft = '0';
            } else {
                content.style.marginLeft = '280px';
            }
        }
    }

    handleKeyboard(e) {
        // ESC key to close mobile menu
        if (e.key === 'Escape' && this.isMobile && this.isOpen) {
            this.closeMobile();
        }
    }

    // Public methods for external use
    expandSubmenu(targetId) {
        const submenu = document.getElementById(targetId);
        const parentItem = this.sidebar.querySelector(`[data-target="${targetId}"]`);
        
        if (submenu && parentItem) {
            submenu.classList.add('expanded');
            parentItem.classList.add('expanded');
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
        }
    }

    collapseSubmenu(targetId) {
        const submenu = document.getElementById(targetId);
        const parentItem = this.sidebar.querySelector(`[data-target="${targetId}"]`);
        
        if (submenu && parentItem) {
            submenu.classList.remove('expanded');
            parentItem.classList.remove('expanded');
            submenu.style.maxHeight = '0';
        }
    }

    setActiveByText(text, isSubmenu = false) {
        if (isSubmenu) {
            const submenuItems = this.sidebar.querySelectorAll('.submenu-item .submenu-text');
            submenuItems.forEach(textElement => {
                if (textElement.textContent === text) {
                    this.setActiveSubmenuItem(textElement.closest('.submenu-item'));
                }
            });
        } else {
            const navItems = this.sidebar.querySelectorAll('.nav-item .nav-text');
            navItems.forEach(textElement => {
                if (textElement.textContent === text) {
                    this.setActiveItem(textElement.closest('.nav-item'));
                }
            });
        }
    }
}

// Initialize the sidebar menu
const sidebarMenu = new SidebarMenu();

// Make it globally available
window.sidebarMenu = sidebarMenu;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SidebarMenu;
}