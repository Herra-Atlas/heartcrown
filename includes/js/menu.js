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
        // Odotetaan, että DOM on valmis ennen asennusta
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
                this.sidebar = document.getElementById('sidebar-menu');
                this.overlay = document.getElementById('sidebar-overlay');
                this.mobileToggle = document.getElementById('mobile-toggle');
            }
        } catch (error) {
            console.error('Sivupalkin lataus epäonnistui:', error);
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

    // --- PARANNELTU JA LUOTETTAVA JS-LATAUSFUNKTIO ---
    loadJS(src) {
        return new Promise((resolve, reject) => {
            const existingScript = document.querySelector(`script[src="${src}"]`);
            if (existingScript) {
                // Skripti on jo ladattu, joten voimme jatkaa heti.
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            // Kun lataus onnistuu, Promise ratkeaa.
            script.onload = () => resolve();
            // Jos lataus epäonnistuu, Promise hylätään.
            script.onerror = () => reject(new Error(`Virhe ladattaessa skriptiä: ${src}`));
            document.body.appendChild(script);
        });
    }

    // --- PARANNELTU NAVIGOINTIKÄSITTELIJÄ ---
    async handleNavClick(e, item) {
        const href = item.getAttribute('href');
        if (!href || href === '#') {
            e.preventDefault();
            return;
        }

        e.preventDefault();

        try {
            const response = await fetch(href);
            if (!response.ok) {
                throw new Error(`Verkkovastaus ei ollut kunnossa: ${response.statusText}`);
            }
            const html = await response.text();

            const contentDiv = document.getElementById('content');
            if (html.includes('<body')) {
                const temp = document.createElement('html');
                temp.innerHTML = html;
                contentDiv.innerHTML = temp.querySelector('body')?.innerHTML || html;
            } else {
                contentDiv.innerHTML = html;
            }

            // Dynaaminen skriptien ja tyylien lataus (nyt luotettava)
            if (href.endsWith('muistio/muistio.html')) {
                this.loadCSS('sovellukset/sovellus/muistio/muistio.css');
                await this.loadJS('sovellukset/sovellus/muistio/muistio.js');
                if (window.muistioInit) window.muistioInit();

            } else if (href.endsWith('kalenteri/kalenteri.html')) {
                this.loadCSS('sovellukset/sovellus/kalenteri/kalenteri.css');
                await this.loadJS('sovellukset/sovellus/kalenteri/kalenteri.js');
                // Oletus: jos kalenteri.js:ssä on init-funktio
                if (window.initializeCalendar) window.initializeCalendar();

            } else if (href.includes('sovellukset/crypt/')) {
                this.loadCSS('sovellukset/crypt/crypt.css');
                await this.loadJS('sovellukset/crypt/crypt.js');
                if (window.initializeCryptApp) window.initializeCryptApp();

            } else if (href.endsWith('asetukset/asetukset.html')) {
                this.loadCSS('sovellukset/sovellus/asetukset/asetukset.css');
                await this.loadJS('sovellukset/sovellus/asetukset/asetukset.js');
                if (window.initializeSettings) window.initializeSettings();
            }

        } catch (err) {
            console.error('Sivun lataus epäonnistui:', err);
            document.getElementById('content').innerHTML = '<p style="color:red; text-align:center;">Sivun lataus epäonnistui.</p>';
        }
    }

    bindEvents() {
        if (!this.sidebar) return;
        this.mobileToggle?.addEventListener('click', () => this.toggleMobile());
        this.overlay?.addEventListener('click', () => this.closeMobile());
        this.sidebar.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleExpandableClick(e, item));
        });
        this.sidebar.querySelectorAll('.submenu-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleSubmenuClick(e, item));
        });
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    handleExpandableClick(e, item) {
        if (!item.classList.contains('expandable')) {
            this.handleNavClick(e, item);
            this.setActiveItem(item);
            return;
        }

        e.preventDefault();
        const targetId = item.getAttribute('data-target');
        const submenu = document.getElementById(targetId);
        if (!submenu) return;

        const isCurrentlyExpanded = item.classList.contains('expanded');
        this.closeAllSubmenus();

        if (!isCurrentlyExpanded) {
            item.classList.add('expanded');
            submenu.classList.add('expanded');
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            this.setActiveItem(item);
        }
    }

    handleSubmenuClick(e, item) {
        this.setActiveSubmenuItem(item);
        if (this.isMobile && this.isOpen) {
            setTimeout(() => this.closeMobile(), 150);
        }
        this.handleNavClick(e, item);
    }
    
    closeAllSubmenus() {
        this.sidebar.querySelectorAll('.submenu.expanded').forEach(submenu => {
            submenu.classList.remove('expanded');
            submenu.style.maxHeight = '0';
        });
        this.sidebar.querySelectorAll('.nav-item.expanded').forEach(item => {
            item.classList.remove('expanded');
        });
    }

    setActiveItem(item) {
        this.sidebar.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        localStorage.setItem('activeMenuItem', item.getAttribute('data-target') || item.getAttribute('href'));
    }

    setActiveSubmenuItem(item) {
        this.sidebar.querySelectorAll('.submenu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        localStorage.setItem('activeSubmenuItem', item.getAttribute('href'));
    }

    setActiveMenuItem() {
        const activeMenuItemHref = localStorage.getItem('activeMenuItem');
        const activeSubmenuItemHref = localStorage.getItem('activeSubmenuItem');
        
        if (activeMenuItemHref) {
            const item = this.sidebar.querySelector(`.nav-item[data-target="${activeMenuItemHref}"], .nav-item[href="${activeMenuItemHref}"]`);
            if (item) {
                item.classList.add('active');
                if (item.classList.contains('expandable')) {
                    const submenu = document.getElementById(item.getAttribute('data-target'));
                    submenu.classList.add('expanded');
                    submenu.style.maxHeight = submenu.scrollHeight + 'px';
                }
            }
        }
        if (activeSubmenuItemHref) {
            const item = this.sidebar.querySelector(`.submenu-item[href="${activeSubmenuItemHref}"]`);
            item?.classList.add('active');
        }
    }

    toggleMobile() {
        this.isOpen ? this.closeMobile() : this.openMobile();
    }

    openMobile() {
        this.sidebar?.classList.add('mobile-open');
        this.overlay?.classList.add('active');
        this.isOpen = true;
        document.body.style.overflow = 'hidden';
    }

    closeMobile() {
        this.sidebar?.classList.remove('mobile-open');
        this.overlay?.classList.remove('active');
        this.isOpen = false;
        document.body.style.overflow = '';
    }

    handleResize() {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth <= 768;
        if (wasMobile && !this.isMobile && this.isOpen) {
            this.closeMobile();
        }
        const content = document.getElementById('content');
        if (content) {
            content.style.marginLeft = this.isMobile ? '0' : '280px';
        }
    }

    handleKeyboard(e) {
        if (e.key === 'Escape' && this.isMobile && this.isOpen) {
            this.closeMobile();
        }
    }
}

// Käynnistetään sivupalkin valikko
const sidebarMenu = new SidebarMenu();

// Tehdään se globaalisti saatavaksi, jos tarpeen
window.sidebarMenu = sidebarMenu;