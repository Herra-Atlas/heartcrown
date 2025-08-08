// =========================================================
// KOKO JA TOIMIVA muistio.js - Korvaa vanha tiedosto tällä
// =========================================================
window.muistioInit = function() {
    // === ELEMENTTIEN HAKU ===
    const addNoteButton = document.getElementById('add-note-button');
    const muistotGrid = document.getElementById('muistot-grid');
    const searchInput = document.getElementById('search-input');
    const modal = document.getElementById('note-modal');
    const closeModalButton = document.querySelector('.close-button');
    const modalImageContainer = document.getElementById('modal-image-container');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content-text');
    const modalTimestamp = document.getElementById('modal-timestamp');
    const editButton = document.getElementById('edit-button');
    const saveButton = document.getElementById('save-button');

    let notesData = [];
    let currentNoteId = null;

    // === TIEDOSTOJEN KÄSITTELY (ELECTRON API) ===
    async function fetchNotes() {
        try {
            notesData = await window.electronAPI.loadNotes();
            displayNotes(notesData);
        } catch (error) {
            console.error("Virhe muistioiden lataamisessa:", error);
            muistotGrid.innerHTML = '<p>Muistioiden lataaminen epäonnistui.</p>';
        }
    }

    async function saveNotesToFile() {
        try {
            const result = await window.electronAPI.saveNotes(notesData);
            if (result.success) {
                console.log('Muistot tallennettu onnistuneesti tiedostoon.');
            } else {
                console.error('Tallennus epäonnistui:', result.error);
                alert(`Tallennus epäonnistui: ${result.error}`);
            }
        } catch (error) {
            console.error('Virhe IPC-kutsussa (saveNotes):', error);
            alert(`Vakava virhe tallennuksessa: ${error.message}`);
        }
    }

    // === MUISTIOIDEN NÄYTTÄMINEN JA SUODATUS ===
    function displayNotes(notes) {
        muistotGrid.innerHTML = '';
        if (notes.length === 0) {
            muistotGrid.innerHTML = '<p>Ei hakutuloksia tai muistioita.</p>';
            return;
        }
        notes.forEach((note, index) => {
            const noteCard = document.createElement('div');
            noteCard.classList.add('note-card');
            noteCard.dataset.id = note.id;
            noteCard.style.animationDelay = `${index * 75}ms`;

            const timestamp = note.modified ? `Muokattu: ${new Date(note.modified).toLocaleString('fi-FI')}` : `Luotu: ${new Date(note.created).toLocaleString('fi-FI')}`;
            noteCard.innerHTML = `
                <img src="${note.img}" class="note-card-image" alt="Muiston kuva">
                <div class="note-card-content">
                    <h3>${note.title}</h3>
                    <span class="timestamp">${timestamp}</span>
                </div>`;
            noteCard.addEventListener('click', () => openModal(note.id));
            muistotGrid.appendChild(noteCard);
        });
    }

    function getFilteredNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) return notesData;
        return notesData.filter(note => {
            const titleMatch = note.title.toLowerCase().includes(searchTerm);
            const tagMatch = note.tags.some(tag => tag.toLowerCase().includes(searchTerm));
            return titleMatch || tagMatch;
        });
    }

    // === TAPAHTUMANKUUNTELIJAT ===

    // HAKUKENTÄN KUUNTELIJA
    searchInput.addEventListener('input', () => {
        displayNotes(getFilteredNotes());
    });

    // TÄMÄ ON KRIITTINEN KOHTA: "LUO UUSI MUISTIO" -PAINIKKEEN KUUNTELIJA
    if (addNoteButton) {
        addNoteButton.addEventListener('click', () => {
            console.log("Luo uusi muistio -painiketta painettu."); // Debug-viesti
            currentNoteId = 'new';
            const defaultImage = "https://via.placeholder.com/600x400.png?text=Uusi+Muistio";
            modalImageContainer.style.backgroundImage = `url('${defaultImage}')`;
            modalTitle.textContent = "Anna uusi otsikko";
            modalContent.textContent = "Kirjoita muistiosi sisältö tähän...";
            modalTimestamp.textContent = "Tallennetaan automaattisesti luontiajankohta.";
            
            // Aseta muokkaustila päälle
            modalTitle.contentEditable = true;
            modalContent.contentEditable = true;
            editButton.style.display = 'none';
            saveButton.style.display = 'inline-flex';
            
            // Näytä modal
            modal.style.display = 'block';
            modalTitle.focus();
        });
    } else {
        console.error("Virhe: 'Luo uusi muistio' -painiketta ei löydetty. Tarkista HTML-tiedoston id.");
    }

    // TALLENNA-PAINIKKEEN KUUNTELIJA
    saveButton.addEventListener('click', async () => {
        if (currentNoteId === 'new') {
            const newId = notesData.length > 0 ? Math.max(...notesData.map(n => n.id)) + 1 : 1;
            const newNote = {
                id: newId,
                title: modalTitle.textContent.trim(),
                content: modalContent.textContent.trim(),
                tags: [],
                created: new Date().toISOString(),
                modified: null,
                img: "https://via.placeholder.com/600x400.png?text=Uusi+Muistio" // Oletuskuva
            };
            notesData.push(newNote);
        } else {
            const noteIndex = notesData.findIndex(n => n.id === currentNoteId);
            if (noteIndex > -1) {
                notesData[noteIndex].title = modalTitle.textContent.trim();
                notesData[noteIndex].content = modalContent.textContent.trim();
                notesData[noteIndex].modified = new Date().toISOString();
            }
        }
        await saveNotesToFile();
        displayNotes(getFilteredNotes());
        closeModal();
    });

    // === MODALIN TOIMINNOT ===
    function openModal(id) {
        const note = notesData.find(n => n.id === id);
        if (!note) return;
        currentNoteId = id;
        modalImageContainer.style.backgroundImage = `url('${note.img}')`;
        modalTitle.textContent = note.title;
        modalContent.textContent = note.content;
        const timestampText = note.modified ? `Viimeksi muokattu: ${new Date(note.modified).toLocaleString('fi-FI')}` : `Luotu: ${new Date(note.created).toLocaleString('fi-FI')}`;
        modalTimestamp.textContent = timestampText;
        resetToViewMode();
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        currentNoteId = null;
    }

    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

    editButton.addEventListener('click', () => {
        modalTitle.contentEditable = true;
        modalContent.contentEditable = true;
        editButton.style.display = 'none';
        saveButton.style.display = 'inline-flex';
        modalTitle.focus();
    });

    function resetToViewMode() {
        modalTitle.contentEditable = false;
        modalContent.contentEditable = false;
        editButton.style.display = 'inline-flex';
        saveButton.style.display = 'none';
    }

    // === SOVELLUKSEN KÄYNNISTYS ===
    fetchNotes();
};