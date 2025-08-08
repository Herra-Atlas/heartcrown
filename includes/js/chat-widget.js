
import { GoogleGenAI } from "https://esm.run/@google/genai";

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      --primary-color: #007bff;
      --text-color: #333;
      --bg-light: #fff;
      --bg-medium: #f8f9fa;
      --border-color: #dee2e6;
      --timestamp-color: #6c757d;
      --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }

    .chat-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 1000;
    }

    .chat-button {
      background-color: var(--primary-color);
      color: white;
      border: none;
      border-radius: 50%;
      width: 60px;
      height: 60px;
      font-size: 28px;
      cursor: pointer;
      box-shadow: 0 4px 10px rgba(0,0,0,0.2);
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .chat-button:hover {
      box-shadow: 0 6px 15px rgba(0,0,0,0.3);
      transform: scale(1.05);
    }

    .chat-modal {
      position: absolute;
      bottom: 85px;
      right: 0;
      width: 370px;
      height: 550px;
      min-width: 300px;
      min-height: 400px;
      max-width: calc(100vw - 40px);
      max-height: calc(100vh - 120px);
      background: var(--bg-light);
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0);
      opacity: 0;
      transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease;
      font-family: var(--font-family);
    }
    
    .resize-handle {
      position: absolute;
      top: 0;
      left: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      z-index: 10;
    }

    .chat-modal.open {
      transform: scale(1);
      opacity: 1;
    }

    .modal-header {
      background: linear-gradient(to right, #007bff, #0056b3);
      color: white;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
    }
    
    .modal-header h3 {
      margin: 0;
      font-size: 1.1rem;
    }
    
    .header-buttons {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-button {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0;
      opacity: 0.8;
      transition: opacity 0.2s;
    }

    .header-button:hover {
      opacity: 1;
    }

    .chat-body {
      flex-grow: 1;
      padding: 1rem;
      overflow-y: auto;
      background-color: var(--bg-medium);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .chat-body::-webkit-scrollbar {
      width: 6px;
    }
    .chat-body::-webkit-scrollbar-thumb {
      background-color: #ccc;
      border-radius: 3px;
    }
    .chat-body::-webkit-scrollbar-track {
      background-color: var(--bg-medium);
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .message {
      padding: 0.75rem 1rem;
      border-radius: 18px;
      max-width: 85%;
      line-height: 1.4;
      animation: fadeIn 0.3s ease-out;
      display: flex;
      flex-direction: column;
    }

    .user-message {
      background-color: var(--primary-color);
      color: white;
      border-bottom-right-radius: 4px;
      margin-left: auto;
      align-items: flex-end;
    }

    .ai-message {
      background-color: var(--bg-light);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-bottom-left-radius: 4px;
      margin-right: auto;
      align-items: flex-start;
    }
    
    .message-content {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    
    .timestamp {
      font-size: 0.7rem;
      color: var(--timestamp-color);
      margin-top: 5px;
    }
    
    .user-message .timestamp {
      color: rgba(255, 255, 255, 0.7);
    }
    
    .typing-indicator {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
    }

    .typing-indicator span {
        height: 8px;
        width: 8px;
        margin: 0 2px;
        background-color: #9E9E9E;
        border-radius: 50%;
        display: inline-block;
        animation: bob 1.4s infinite ease-in-out both;
    }

    .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
    .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bob {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1.0); }
    }

    .modal-footer {
      padding: 0.75rem;
      border-top: 1px solid var(--border-color);
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .chat-input {
      flex-grow: 1;
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 0.5rem 1rem;
      font-size: 1rem;
    }

    .chat-input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
    
    .chat-input:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
    }

    .send-button {
      background: var(--primary-color);
      border: none;
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      font-size: 1.2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
      transition: background-color 0.2s;
    }
    
    .send-button:disabled {
        background-color: #a0c7ff;
        cursor: not-allowed;
    }

    /* Settings Modal Styles */
    .settings-modal-overlay {
      position: fixed; /* Changed to fixed */
      inset: 0; /* Changed to inset */
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1100; /* Higher z-index */
      padding: 20px;
    }
    
    .settings-modal {
      background: var(--bg-light);
      padding: 1.5rem 2rem;
      border-radius: 8px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      width: 100%;
      max-width: 450px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .settings-modal h3 {
      margin: 0 0 0.5rem 0;
      color: var(--text-color);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
    }
    
    .setting {
      display: flex;
      flex-direction: column;
    }
    
    .setting label {
      font-weight: bold;
      display: block;
      margin-bottom: 0.5rem;
      color: var(--text-color);
    }
    
    .setting p {
      font-size: 0.85rem;
      color: var(--timestamp-color);
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }
    
    .setting textarea, .setting input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      font-family: inherit;
      font-size: 1rem;
      resize: vertical;
      box-sizing: border-box;
    }
    
    .setting textarea:focus, .setting input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }

    .settings-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      margin-top: 1rem;
    }
    
    .settings-footer button {
      padding: 0.5rem 1rem;
      border-radius: 5px;
      border: none;
      cursor: pointer;
      font-weight: bold;
      transition: background-color 0.2s, filter 0.2s;
    }
    
    .settings-cancel-button {
      background: #eee;
      color: #333;
    }

    .settings-cancel-button:hover {
        background: #ddd;
    }
    
    .settings-save-button {
      background: var(--primary-color);
      color: white;
    }

    .settings-save-button:hover {
        filter: brightness(1.1);
    }

  </style>

  <div class="chat-container">
    <div class="chat-modal">
      <div class="resize-handle"></div>
      <div class="modal-header">
        <h3>AI-avustaja</h3>
        <div class="header-buttons">
            <button class="header-button settings-button" aria-label="Asetukset">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311a1.464 1.464 0 0 1 .872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1-.872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1-.872-2.105l.34-.1c1.4-.413-1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1 .872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872l-.1-.34zM8 10.93a2.929 2.929 0 1 1 0-5.858 2.929 2.929 0 0 1 0 5.858z"/>
                </svg>
            </button>
            <button class="header-button clear-button" aria-label="Tyhjennä keskustelu">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
            </button>
            <button class="header-button close-button" aria-label="Sulje keskustelu">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
                </svg>
            </button>
        </div>
      </div>
      <div class="chat-body" aria-live="polite">
         <!-- Messages will be added here -->
      </div>
      <div class="modal-footer">
        <input type="text" class="chat-input" placeholder="Kysy jotain...">
        <button class="send-button" aria-label="Lähetä viesti">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z"/>
            </svg>
        </button>
      </div>
    </div>
    <div class="settings-modal-overlay" style="display: none;">
      <div class="settings-modal">
        <h3>Asetukset</h3>
        <div class="setting">
          <label for="api-key">Gemini API-avain</label>
          <p>Syötä Gemini API-avaimesi tähän. Avain tallennetaan selaimesi paikalliseen muistiin.</p>
          <input type="text" class="api-key-input" id="api-key" placeholder="Syötä API-avaimesi...">
        </div>
        <div class="setting">
          <label for="system-instruction">AI:n ohjeistus</label>
          <p>Määrittele, miten tekoälyn tulisi käyttäytyä. Esim: "Olet sarkastinen merirosvo."</p>
          <textarea class="system-instruction-input" id="system-instruction" rows="4"></textarea>
        </div>
        <div class="settings-footer">
          <button class="settings-cancel-button">Peruuta</button>
          <button class="settings-save-button">Tallenna</button>
        </div>
      </div>
    </div>
    <button class="chat-button" aria-label="Avaa keskustelu">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.506 7-5.5S11.996 3 8 3 1 5.506 1 8.5c0 .642.07 1.253.189 1.826a1 1 0 0 1 .344.934zm.832-1.211c-.08-.16-.15-.315-.2-.47a1 1 0 0 1 .29-.95c.2-.17.43-.345.695-.515a1 1 0 0 1 .865-.073A6.06 6.06 0 0 1 8 12c2.67 0 4.5-1.79 4.5-4s-1.83-4-4.5-4-4.5 1.79-4.5 4c0 .666.12 1.29.333 1.864a1 1 0 0 1-.22.95l-.333.25c-.25.19-.42.39-.51.566z"/>
        </svg>
    </button>
  </div>
`;

class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.chat = null;
    this.isSending = false;
    this.isResizing = false;
    
    this.onResizeMouseMove = this.onResizeMouseMove.bind(this);
    this.onResizeMouseUp = this.onResizeMouseUp.bind(this);
  }

  connectedCallback() {
    this.modal = this.shadowRoot.querySelector('.chat-modal');
    this.chatButton = this.shadowRoot.querySelector('.chat-button');
    this.closeButton = this.shadowRoot.querySelector('.close-button');
    this.clearButton = this.shadowRoot.querySelector('.clear-button');
    this.sendButton = this.shadowRoot.querySelector('.send-button');
    this.input = this.shadowRoot.querySelector('.chat-input');
    this.chatBody = this.shadowRoot.querySelector('.chat-body');
    
    // Resize elements
    this.resizeHandle = this.shadowRoot.querySelector('.resize-handle');

    // Settings elements
    this.settingsButton = this.shadowRoot.querySelector('.settings-button');
    this.settingsOverlay = this.shadowRoot.querySelector('.settings-modal-overlay');
    this.settingsSaveButton = this.shadowRoot.querySelector('.settings-save-button');
    this.settingsCancelButton = this.shadowRoot.querySelector('.settings-cancel-button');
    this.systemInstructionInput = this.shadowRoot.querySelector('.system-instruction-input');
    this.apiKeyInput = this.shadowRoot.querySelector('.api-key-input');
    
    this.addEventListeners();
    this.loadState();
    this.initChat();
  }
  
  addEventListeners() {
    this.chatButton.addEventListener('click', () => this.toggleModal());
    this.closeButton.addEventListener('click', () => this.toggleModal());
    this.clearButton.addEventListener('click', () => this.initChat());
    this.sendButton.addEventListener('click', () => this.sendMessage());
    this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !this.isSending) {
            e.preventDefault();
            this.sendMessage();
        }
    });

    this.resizeHandle.addEventListener('mousedown', this.onResizeMouseDown.bind(this));
    this.settingsButton.addEventListener('click', () => this.openSettings());
    this.settingsCancelButton.addEventListener('click', () => this.closeSettings());
    this.settingsSaveButton.addEventListener('click', () => this.saveSettings());
  }

  loadState() {
    try {
        const size = JSON.parse(localStorage.getItem('chatWidgetSize'));
        if (size && size.width && size.height) {
            this.modal.style.width = size.width;
            this.modal.style.height = size.height;
        }
    } catch (e) {
        console.error("Could not load widget size from localStorage", e);
    }
  }

  initChat() {
    this.chatBody.innerHTML = '';
    const apiKey = localStorage.getItem('geminiApiKey');
    
    if (!apiKey) {
        this.handleApiError("API-avain puuttuu. Lisää se avustajan asetuksista.");
        return;
    }

    try {
        const systemInstruction = localStorage.getItem('chatSystemInstruction') || "You are a friendly and helpful AI assistant. Keep your answers concise and helpful.";
        const ai = new GoogleGenAI({ apiKey: apiKey });
        this.chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            }
        });
        this.input.disabled = false;
        this.sendButton.disabled = false;
        this.input.placeholder = "Kysy jotain...";
        this.addWelcomeMessage();
    } catch (error) {
        console.error("Failed to initialize Gemini API:", error);
        this.handleApiError("Tekoälyn alustaminen epäonnistui. Tarkista API-avain asetuksista.");
    }
  }

  handleApiError(message) {
    this.chat = null;
    this.addMessage(message, "ai-message");
    this.input.disabled = true;
    this.sendButton.disabled = true;
    this.input.placeholder = "Tekoäly ei ole käytettävissä";
  }

  addWelcomeMessage() {
      this.addMessage("Moi, kuinka voisin auttaa sinua tänään?", "ai-message");
  }
  
  toggleModal() {
    const isOpen = this.modal.classList.toggle('open');
    if (isOpen) {
      this.input.focus();
    } else {
      this.chatButton.focus();
    }
  }

  async sendMessage() {
    const messageText = this.input.value.trim();
    if (!messageText || this.isSending || !this.chat) return;

    this.isSending = true;
    this.sendButton.disabled = true;
    this.addMessage(messageText, 'user-message');
    this.input.value = '';
    this.showTypingIndicator();
    this.chatBody.scrollTop = this.chatBody.scrollHeight;

    try {
        const responseStream = await this.chat.sendMessageStream({ message: messageText });
        this.hideTypingIndicator();
        const aiMessageElement = this.addMessage("", 'ai-message');
        const contentElement = aiMessageElement.querySelector('.message-content');
        let fullResponse = "";
        
        for await (const chunk of responseStream) {
          fullResponse += chunk.text;
          contentElement.textContent = fullResponse;
          this.chatBody.scrollTop = this.chatBody.scrollHeight;
        }

        if(contentElement.textContent.trim() === '') {
            contentElement.textContent = "Sain tyhjän vastauksen. Yritä uudelleen.";
        }
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        this.hideTypingIndicator();
        this.addMessage("Pahoittelut, vastausta ei saatu. Yritä uudelleen.", 'ai-message');
    } finally {
        this.isSending = false;
        this.sendButton.disabled = false;
        this.input.focus();
    }
  }
  
  getCurrentTime() {
    return new Date().toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' });
  }

  addMessage(text, className) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', className);
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = text;
    
    const timestampElement = document.createElement('span');
    timestampElement.classList.add('timestamp');
    timestampElement.textContent = this.getCurrentTime();
    
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    this.chatBody.appendChild(messageElement);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
    return messageElement;
  }
  
  showTypingIndicator() {
    if (this.shadowRoot.querySelector('.typing-indicator')) return;
    const indicator = document.createElement('div');
    indicator.className = 'message typing-indicator';
    indicator.innerHTML = `<span></span><span></span><span></span>`;
    this.chatBody.appendChild(indicator);
    this.chatBody.scrollTop = this.chatBody.scrollHeight;
  }
  
  hideTypingIndicator() {
      const indicator = this.shadowRoot.querySelector('.typing-indicator');
      if (indicator) {
          indicator.remove();
      }
  }
  
  // Resizing logic
  onResizeMouseDown(e) {
    e.preventDefault();
    this.isResizing = true;
    this.initialX = e.clientX;
    this.initialY = e.clientY;
    this.initialWidth = this.modal.offsetWidth;
    this.initialHeight = this.modal.offsetHeight;
    
    document.addEventListener('mousemove', this.onResizeMouseMove);
    document.addEventListener('mouseup', this.onResizeMouseUp);
  }

  onResizeMouseMove(e) {
    if (!this.isResizing) return;
    const dx = e.clientX - this.initialX;
    const dy = e.clientY - this.initialY;
    this.modal.style.width = `${this.initialWidth - dx}px`;
    this.modal.style.height = `${this.initialHeight - dy}px`;
  }
  
  onResizeMouseUp() {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.onResizeMouseMove);
    document.removeEventListener('mouseup', this.onResizeMouseUp);
    
    try {
      localStorage.setItem('chatWidgetSize', JSON.stringify({
          width: this.modal.style.width,
          height: this.modal.style.height
      }));
    } catch(e) {
      console.error("Could not save widget size to localStorage", e);
    }
  }

  // Settings logic
  openSettings() {
    this.apiKeyInput.value = localStorage.getItem('geminiApiKey') || '';
    this.systemInstructionInput.value = localStorage.getItem('chatSystemInstruction') || "You are a friendly and helpful AI assistant. Keep your answers concise and helpful.";
    this.settingsOverlay.style.display = 'flex';
  }

  closeSettings() {
    this.settingsOverlay.style.display = 'none';
  }

  saveSettings() {
    const newApiKey = this.apiKeyInput.value.trim();
    const newInstruction = this.systemInstructionInput.value.trim();

    if (newApiKey) {
        localStorage.setItem('geminiApiKey', newApiKey);
    }
    
    if (newInstruction) {
        localStorage.setItem('chatSystemInstruction', newInstruction);
    }
    
    this.closeSettings();
    this.initChat(); // Re-initialize chat with new settings
  }
}

customElements.define('chat-widget', ChatWidget);
