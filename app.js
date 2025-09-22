// NanoBana JSON Prompt Constructor JavaScript

class AutoSaveManager {
    constructor(config = {}, callbacks = {}) {
        this.key = config.key || 'nanobana:state';
        this.schemaVersion = config.schemaVersion || 1;
        this.debounceMs = typeof config.autosaveDebounceMs === 'number' ? config.autosaveDebounceMs : 750;
        this.historyLimit = typeof config.historyLimit === 'number' ? config.historyLimit : 5;
        this.callbacks = callbacks;
        this.timer = null;
        this.pendingData = null;
        this.storageAvailable = this.checkStorageAvailability();

        if (!this.storageAvailable) {
            this.notifyError(new Error('Local storage is not available.'));
            this.setStatus('disabled');
        }
    }

    checkStorageAvailability() {
        try {
            if (typeof window === 'undefined' || !window.localStorage) return false;
            const testKey = `${this.key}__test`;
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    setStatus(status, meta) {
        if (typeof this.callbacks.onStatusChange === 'function') {
            this.callbacks.onStatusChange(status, meta);
        }
    }

    notifyError(error) {
        if (typeof this.callbacks.onError === 'function') {
            this.callbacks.onError(error);
        }
    }

    queueSave(snapshot) {
        if (!this.storageAvailable) {
            this.notifyError(new Error('Autosave disabled: storage unavailable.'));
            this.setStatus('disabled');
            return;
        }

        this.pendingData = snapshot;
        this.setStatus('saving');

        if (this.timer) {
            clearTimeout(this.timer);
        }

        this.timer = setTimeout(() => {
            this.persist(this.pendingData);
        }, this.debounceMs);
    }

    persist(data) {
        try {
            const timestamp = new Date().toISOString();
            const existing = this.loadRaw();
            const history = Array.isArray(existing?.history) ? existing.history.slice() : [];

            history.push({ timestamp, data });
            if (this.historyLimit >= 0) {
                while (history.length > this.historyLimit) {
                    history.shift();
                }
            }

            const payload = {
                schemaVersion: this.schemaVersion,
                timestamp,
                data,
                history
            };

            window.localStorage.setItem(this.key, JSON.stringify(payload));
            this.setStatus('saved', { timestamp });
        } catch (error) {
            this.notifyError(error);
            this.setStatus('error', { error });
        }
    }

    loadRaw() {
        if (!this.storageAvailable) return null;
        try {
            const raw = window.localStorage.getItem(this.key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            this.notifyError(error);
            this.setStatus('error', { error });
            return null;
        }
    }

    load() {
        const payload = this.loadRaw();
        if (!payload) return null;

        if (payload.schemaVersion === this.schemaVersion) {
            return {
                data: payload.data || null,
                timestamp: payload.timestamp,
                history: payload.history || []
            };
        }

        if (typeof this.callbacks.onMigrate === 'function') {
            try {
                const migrated = this.callbacks.onMigrate(payload, this.schemaVersion);
                if (migrated && migrated.data) {
                    return migrated;
                }
            } catch (error) {
                this.notifyError(error);
                this.setStatus('error', { error });
            }
        }

        return null;
    }

    clear() {
        if (!this.storageAvailable) return;
        try {
            window.localStorage.removeItem(this.key);
            this.setStatus('idle');
        } catch (error) {
            this.notifyError(error);
            this.setStatus('error', { error });
        }
    }
}

class NanoBanaConstructor {
    constructor() {
        this.config = window.promptConfig || { styles: {}, presets: [] };
        this.hasRestoredState = false;
        this.isRestoring = false;
        this.skipNextAutosave = false;

        this.initializeElements();
        this.initializeFromConfig();
        this.bindEvents();
        this.setupObjectControls();
        this.initializeAutosave();

        if (!this.hasRestoredState) {
            this.handleStyleChange(this.getActiveStyle());
            this.updatePreview();
        }
    }

    initializeElements() {
        // Form elements
        this.taskRadios = document.querySelectorAll('input[name="task"]');
        this.taskDescription = document.getElementById('taskDescription');
        
        // Camera settings
        this.iso = document.getElementById('iso');
        this.aperture = document.getElementById('aperture');
        this.shutterSpeed = document.getElementById('shutterSpeed');
        this.focalLength = document.getElementById('focalLength');
        this.cameraSection = document.querySelector('[data-section="camera"]');
        
        // Lighting
        this.lightType = document.getElementById('lightType');
        this.lightDirection = document.getElementById('lightDirection');
        this.lightingScheme = document.getElementById('lightingScheme');
        this.temperature = document.getElementById('temperature');
        
        // Composition
        this.framing = document.getElementById('framing');
        this.angle = document.getElementById('angle');
        this.ruleOfThirds = document.getElementById('ruleOfThirds');
        
        // Style
        this.mainStyle = document.getElementById('mainStyle');
        this.colorScheme = document.getElementById('colorScheme');
        this.contrast = document.getElementById('contrast');
        this.sharpness = document.getElementById('sharpness');
        this.backgroundBlur = document.getElementById('backgroundBlur');
        this.abstractType = document.getElementById('abstractType');
        this.cartoonType = document.getElementById('cartoonType');
        this.stylePreset = document.getElementById('stylePreset');
        this.resetPresetBtn = document.getElementById('resetPresetBtn');
        
        // Quality
        this.resolution = document.getElementById('resolution');
        this.detailLevel = document.getElementById('detailLevel');
        this.noiseReduction = document.getElementById('noiseReduction');
        this.sharpening = document.getElementById('sharpening');

        // Atmosphere
        this.weatherCondition = document.getElementById('weatherCondition');
        this.naturalPhenomenon = document.getElementById('naturalPhenomenon');
        this.atmosphereNotes = document.getElementById('atmosphereNotes');
        
        // Restrictions
        this.preserveFaces = document.getElementById('preserveFaces');
        this.preserveComposition = document.getElementById('preserveComposition');
        this.noObjectAddition = document.getElementById('noObjectAddition');
        this.noBackgroundChange = document.getElementById('noBackgroundChange');
        this.precisePositioning = document.getElementById('precisePositioning');

        // Additional Objects
        this.objectsContainer = document.getElementById('objectsContainer');
        this.addObjectBtn = document.getElementById('addObjectBtn');
        this.objectTemplate = document.getElementById('objectTemplate');
        
        // Preview elements
        this.jsonOutput = document.getElementById('jsonOutput');
        this.promptOutput = document.getElementById('promptOutput');
        this.copyBtn = document.getElementById('copyBtn');
        this.copyPromptBtn = document.getElementById('copyPromptBtn');
        this.downloadBtn = document.getElementById('downloadBtn');

        // Autosave & state controls
        this.autosaveStatusEl = document.getElementById('autosaveStatus');
        this.importBtn = document.getElementById('importBtn');
        this.importFileInput = document.getElementById('importFileInput');
        this.resetBtn = document.getElementById('resetBtn');

        // Cached defaults
        this.defaultMainStyle = this.mainStyle ? this.mainStyle.value : '';

        // Slider value displays
        this.contrastValue = document.getElementById('contrastValue');
        this.sharpnessValue = document.getElementById('sharpnessValue');

        // Check if all elements are found
        this.validateElements();

        this.sectionMap = Array.from(document.querySelectorAll('[data-section]')).reduce((acc, section) => {
            const key = section.dataset.section;
            if (key) {
                acc[key] = section;
            }
            return acc;
        }, {});

        this.baseSectionDisplay = {};
        Object.entries(this.sectionMap).forEach(([key, element]) => {
            this.baseSectionDisplay[key] = element.style.display || '';
        });

        this.stylePanels = new Map(
            Array.from(document.querySelectorAll('[data-style-panel]')).map(panel => [panel.dataset.stylePanel, panel])
        );

        this.allControls = Array.from(document.querySelectorAll('input[id], select[id], textarea[id]'));
        this.baseDisabledState = new Map();
        this.baseDisplayState = new Map();

        this.allControls.forEach(control => {
            this.baseDisabledState.set(control.id, control.disabled);
            const wrapper = this.getFieldWrapper(control);
            if (wrapper) {
                this.baseDisplayState.set(control.id, wrapper.style.display || '');
            }
        });
    }

    initializeFromConfig() {
        const styles = this.config.styles || {};
        const presets = Array.isArray(this.config.presets) ? this.config.presets : [];

        this.photographyStyles = new Set(
            Object.values(styles)
                .filter(style => style && style.category === 'photography')
                .map(style => style.key)
        );

        this.defaultValues = this.buildBaseDefaults();

        Object.values(styles).forEach(style => {
            if (!style || !style.defaults) return;
            Object.entries(style.defaults).forEach(([field, value]) => {
                if (!(field in this.defaultValues)) {
                    this.defaultValues[field] = value;
                }
            });
        });

        this.presets = presets.map(preset => ({
            ...preset,
            mainStyle: preset.style || preset.mainStyle
        }));

        this.presetsByStyle = this.presets.reduce((acc, preset) => {
            const styleKey = preset.style || preset.mainStyle;
            if (!styleKey) return acc;
            if (!acc[styleKey]) {
                acc[styleKey] = [];
            }
            acc[styleKey].push(preset);
            return acc;
        }, {});

        this.presetMap = this.presets.reduce((acc, preset) => {
            acc[preset.key] = preset;
            return acc;
        }, {});

        this.populateStyleOptions(styles);
    }

    buildBaseDefaults() {
        return {
            iso: '400',
            aperture: 'f/2.8',
            shutterSpeed: '1/250',
            focalLength: '50mm',
            lightType: 'Soft',
            lightDirection: 'Front',
            lightingScheme: 'Butterfly',
            temperature: 'Neutral',
            framing: 'Medium shot',
            angle: 'Straight',
            ruleOfThirds: false,
            colorScheme: 'Natural',
            contrast: '50',
            sharpness: '50',
            backgroundBlur: false,
            abstractType: 'geometric',
            cartoonType: 'classic',
            resolution: '1024x1024',
            detailLevel: 'Medium',
            noiseReduction: false,
            sharpening: false,
            weatherCondition: '',
            naturalPhenomenon: '',
            atmosphereNotes: ''
        };
    }

    populateStyleOptions(styles) {
        if (!this.mainStyle) return;

        const existingValue = this.mainStyle.value;
        this.mainStyle.innerHTML = '';

        const styleEntries = Object.keys(styles).map(key => styles[key]);

        styleEntries.forEach((style, index) => {
            if (!style || !style.key) return;
            const option = document.createElement('option');
            option.value = style.key;
            option.textContent = style.label || style.key;
            if (style.key === existingValue || (!existingValue && index === 0)) {
                option.selected = true;
            }
            this.mainStyle.appendChild(option);
        });

        if (!this.mainStyle.value && styleEntries.length > 0) {
            this.mainStyle.value = styleEntries[0].key;
        }
    }

    initializeAutosave() {
        const storageConfig = this.config.storage || {};

        this.autosaveManager = new AutoSaveManager(storageConfig, {
            onStatusChange: (status, meta) => this.updateAutosaveStatus(status, meta),
            onError: (error) => this.handleAutosaveError(error),
            onMigrate: (payload, targetVersion) => this.migrateAutosavePayload(payload, targetVersion)
        });

        if (!this.autosaveManager || !this.autosaveManager.storageAvailable) {
            this.updateAutosaveStatus('disabled');
            return;
        }

        const restored = this.autosaveManager.load();
        if (restored && restored.data) {
            this.applyFormSnapshot(restored.data);
            this.hasRestoredState = true;
            this.updateAutosaveStatus('restored', { timestamp: restored.timestamp });
            this.skipNextAutosave = true;
        } else {
            this.updateAutosaveStatus('idle');
        }
    }

    migrateAutosavePayload(payload, targetVersion) {
        if (!payload) return null;

        const storageConfig = this.config.storage || {};
        if (typeof storageConfig.migrate === 'function') {
            try {
                return storageConfig.migrate(payload, targetVersion);
            } catch (error) {
                this.handleAutosaveError(error);
            }
        }

        return null;
    }

    updateAutosaveStatus(status, meta = {}) {
        if (!this.autosaveStatusEl) return;

        const normalized = status || 'idle';
        this.autosaveStatusEl.dataset.status = normalized;

        let message = 'Autosave ready';

        if (normalized === 'saving') {
            message = 'Saving…';
        } else if (normalized === 'saved') {
            message = meta.timestamp ? `Saved at ${this.formatTimestamp(meta.timestamp)}` : 'Saved';
        } else if (normalized === 'restored') {
            message = meta.timestamp ? `Restored from ${this.formatTimestamp(meta.timestamp)}` : 'Restored';
        } else if (normalized === 'error') {
            message = meta.error ? `Autosave error: ${meta.error}` : 'Autosave error';
        } else if (normalized === 'disabled') {
            message = 'Autosave unavailable';
        }

        this.autosaveStatusEl.textContent = message;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '';

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    handleAutosaveError(error) {
        console.error('Autosave error:', error);
        const message = error && error.message ? error.message : 'Unknown error';
        this.updateAutosaveStatus('error', { error: message });
    }

    scheduleAutosave(jsonData, promptText) {
        if (!this.autosaveManager || !this.autosaveManager.storageAvailable) {
            return;
        }

        const snapshot = this.buildAutosaveSnapshot(jsonData, promptText);
        this.autosaveManager.queueSave(snapshot);
    }

    buildAutosaveSnapshot(jsonData, promptText) {
        return {
            task: this.getSelectedTask(),
            controls: this.serializeControls(),
            objects: this.collectObjectFormState(),
            json: jsonData,
            prompt: promptText
        };
    }

    serializeControls() {
        const result = {};
        if (!this.allControls) return result;

        this.allControls.forEach(control => {
            if (!control || !control.id) return;

            if (control.type === 'checkbox') {
                result[control.id] = control.checked;
            } else {
                result[control.id] = control.value;
            }
        });

        return result;
    }

    collectObjectFormState() {
        if (!this.objectsContainer) return [];

        return Array.from(this.objectsContainer.querySelectorAll('[data-object-card]')).map(card => {
            const entry = {};
            const fields = card.querySelectorAll('[data-object-field]');

            fields.forEach(field => {
                const key = field.dataset.objectField;
                if (!key) return;

                if (field.type === 'checkbox') {
                    entry[key] = field.checked;
                } else {
                    entry[key] = field.value || '';
                }
            });

            return entry;
        });
    }

    applyFormSnapshot(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return;

        const controls = snapshot.controls || {};
        const targetStyle = controls.mainStyle || this.getActiveStyle();

        this.isRestoring = true;

        try {
            if (controls.mainStyle) {
                this.setControlValue('mainStyle', controls.mainStyle);
            }

            this.handleStyleChange(targetStyle);

            Object.entries(controls).forEach(([id, value]) => {
                if (id === 'mainStyle') return;
                this.setControlValue(id, value);
            });

            if (snapshot.task) {
                this.applyTaskSelection(snapshot.task);
            }

            if (Array.isArray(snapshot.objects)) {
                this.rebuildObjectsFromState(snapshot.objects);
            }
        } finally {
            this.isRestoring = false;
        }

        this.skipNextAutosave = true;
        this.updatePreview();
    }

    applyTaskSelection(taskValue) {
        if (!taskValue || !this.taskRadios) return;

        this.taskRadios.forEach(radio => {
            radio.checked = radio.value === taskValue;
        });
    }

    rebuildObjectsFromState(objectsState) {
        if (!this.objectsContainer) return;

        this.objectsContainer.innerHTML = '';

        if (!Array.isArray(objectsState) || objectsState.length === 0) {
            return;
        }

        objectsState.forEach(entry => {
            if (!entry || typeof entry !== 'object') {
                return;
            }

            const card = this.createObjectCard();
            if (!card) return;

            this.objectsContainer.appendChild(card);

            const fields = card.querySelectorAll('[data-object-field]');
            fields.forEach(field => {
                const key = field.dataset.objectField;
                if (!key) return;

                const value = entry && Object.prototype.hasOwnProperty.call(entry, key) ? entry[key] : '';

                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else {
                    field.value = value || '';
                }
            });
        });
    }

    getStyleDefinition(styleKey) {
        if (!styleKey) return null;
        return this.config.styles ? this.config.styles[styleKey] : null;
    }

    updateStylePanels(styleKey) {
        if (!this.stylePanels) return;
        this.stylePanels.forEach((panel, key) => {
            if (!panel) return;
            const shouldShow = key === styleKey;
            panel.style.display = shouldShow ? '' : 'none';
            panel.dataset.active = shouldShow ? 'true' : 'false';
            panel.querySelectorAll('input, select, textarea, button').forEach(control => {
                control.disabled = !shouldShow;
            });
        });
    }

    resetFieldStates() {
        if (!this.allControls) return;
        this.allControls.forEach(control => {
            if (!control || !control.id) return;
            const baseDisabled = this.baseDisabledState.get(control.id);
            control.disabled = Boolean(baseDisabled);
            const wrapper = this.getFieldWrapper(control);
            if (wrapper) {
                wrapper.style.display = this.baseDisplayState.get(control.id) || '';
            }
        });

        Object.entries(this.sectionMap || {}).forEach(([key, element]) => {
            if (!element) return;
            element.style.display = this.baseSectionDisplay[key] || '';
            delete element.dataset.collapsed;
        });
    }

    applyStyleDependencies(styleDefinition) {
        const dependencies = styleDefinition && styleDefinition.dependencies ? styleDefinition.dependencies : {};
        this.applySectionVisibility(dependencies);

        const disableFields = dependencies.disableFields || [];
        const enableFields = dependencies.enableFields || [];
        const hideFields = dependencies.hideFields || [];
        const autoset = dependencies.autoset || {};

        disableFields.forEach(fieldId => this.setFieldDisabled(fieldId, true));
        enableFields.forEach(fieldId => this.setFieldDisabled(fieldId, false));
        hideFields.forEach(fieldId => this.setFieldVisibility(fieldId, false));

        Object.entries(autoset).forEach(([fieldId, value]) => {
            if (fieldId === 'mainStyle') return;
            this.setControlValue(fieldId, value);
        });
    }

    applySectionVisibility(dependencies) {
        if (!dependencies || !this.sectionMap) return;

        const enabledSections = new Set(dependencies.enableSections || []);
        const collapsedSections = new Set(dependencies.collapseSections || []);

        Object.entries(this.sectionMap).forEach(([sectionKey, element]) => {
            if (!element) return;
            const shouldShow = enabledSections.size === 0 || enabledSections.has(sectionKey);
            element.style.display = shouldShow ? '' : 'none';
            if (shouldShow && collapsedSections.has(sectionKey)) {
                element.dataset.collapsed = 'true';
            } else {
                delete element.dataset.collapsed;
            }
        });
    }

    applyStyleDefaults(styleDefinition) {
        if (!styleDefinition || !styleDefinition.defaults) return;
        Object.entries(styleDefinition.defaults).forEach(([field, value]) => {
            if (field === 'mainStyle') return;
            this.setControlValue(field, value);
        });
    }

    setFieldDisabled(fieldId, disabled) {
        const control = document.getElementById(fieldId);
        if (!control) return;
        control.disabled = Boolean(disabled);
    }

    setFieldVisibility(fieldId, visible) {
        const control = document.getElementById(fieldId);
        if (!control) return;
        const wrapper = this.getFieldWrapper(control);
        if (!wrapper) return;
        wrapper.style.display = visible ? (this.baseDisplayState.get(fieldId) || '') : 'none';
    }

    getFieldWrapper(control) {
        if (!control) return null;
        return control.closest('.form-group') || control.closest('.form-row') || control.parentElement;
    }

    isSectionActive(sectionKey) {
        const section = this.sectionMap ? this.sectionMap[sectionKey] : null;
        if (!section) return true;
        return section.style.display !== 'none';
    }

    toSnakeCase(value) {
        if (!value) return value;
        return String(value)
            .replace(/([A-Z])/g, '_$1')
            .replace(/[-\s]+/g, '_')
            .toLowerCase();
    }

    validateElements() {
        const requiredElements = [
            'taskDescription', 'iso', 'aperture', 'shutterSpeed', 'focalLength',
            'lightType', 'lightDirection', 'lightingScheme', 'temperature',
            'framing', 'angle', 'ruleOfThirds', 'mainStyle', 'stylePreset', 'colorScheme', 'contrast', 'sharpness',
            'backgroundBlur', 'abstractType', 'cartoonType', 'resolution', 'detailLevel', 'noiseReduction', 'sharpening',
            'weatherCondition', 'naturalPhenomenon', 'atmosphereNotes',
            'preserveFaces', 'preserveComposition', 'noObjectAddition', 
            'noBackgroundChange', 'precisePositioning', 'objectsContainer', 'addObjectBtn', 'objectTemplate',
            'jsonOutput', 'promptOutput', 'copyBtn', 'copyPromptBtn', 'downloadBtn',
            'autosaveStatus', 'importBtn', 'importFileInput', 'resetBtn'
        ];

        const missing = requiredElements.filter(id => !document.getElementById(id));
        if (missing.length > 0) {
            console.error('Missing elements:', missing);
        }
    }

    bindEvents() {
        // Task radio buttons
        this.taskRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                console.log('Task changed:', radio.value);
                this.updatePreview();
            });
        });
        
        // Text inputs
        if (this.taskDescription) {
            this.taskDescription.addEventListener('input', () => {
                console.log('Task description changed');
                this.updatePreview();
            });
        }
        
        // Select elements
        const selects = [
            this.iso, this.aperture, this.shutterSpeed, this.focalLength,
            this.lightType, this.lightDirection, this.lightingScheme, this.temperature,
            this.framing, this.angle, this.colorScheme, this.abstractType, this.cartoonType,
            this.resolution, this.detailLevel, this.weatherCondition, this.naturalPhenomenon
        ];

        selects.forEach(select => {
            if (select) {
                select.addEventListener('change', (e) => {
                    console.log(`${select.id} changed to:`, e.target.value);
                    this.updatePreview();
                });
                
                // Also bind click event to ensure dropdown works
                select.addEventListener('click', () => {
                    console.log(`${select.id} clicked`);
                });
            }
        });

        if (this.mainStyle) {
            this.mainStyle.addEventListener('change', (e) => {
                console.log('mainStyle changed to:', e.target.value);
                this.handleStyleChange(e.target.value);
                this.updatePreview();
            });
        }

        if (this.stylePreset) {
            this.stylePreset.addEventListener('change', (e) => {
                const presetKey = e.target.value;
                if (presetKey && this.presetMap && this.presetMap[presetKey]) {
                    console.log('Applying preset:', presetKey);
                    this.applyPreset(presetKey);
                }
            });
        }

        if (this.resetPresetBtn) {
            this.resetPresetBtn.addEventListener('click', () => {
                console.log('Resetting preset to base state');
                this.resetPreset();
            });
        }

        if (this.atmosphereNotes) {
            this.atmosphereNotes.addEventListener('input', () => this.updatePreview());
        }
        
        // Checkboxes
        const checkboxes = [
            this.ruleOfThirds, this.backgroundBlur, this.noiseReduction, this.sharpening,
            this.preserveFaces, this.preserveComposition, this.noObjectAddition, 
            this.noBackgroundChange, this.precisePositioning
        ];

        checkboxes.forEach(checkbox => {
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    console.log(`${checkbox.id} changed to:`, e.target.checked);
                    this.updatePreview();
                });
            }
        });
        
        // Sliders
        if (this.contrast && this.contrastValue) {
            this.contrast.addEventListener('input', (e) => {
                this.contrastValue.textContent = e.target.value;
                console.log('Contrast changed to:', e.target.value);
                this.updatePreview();
            });
        }
        
        if (this.sharpness && this.sharpnessValue) {
            this.sharpness.addEventListener('input', (e) => {
                this.sharpnessValue.textContent = e.target.value;
                console.log('Sharpness changed to:', e.target.value);
                this.updatePreview();
            });
        }
        
        // Buttons
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => {
                console.log('Copy button clicked');
                this.copyToClipboard();
            });
        }

        if (this.copyPromptBtn) {
            this.copyPromptBtn.addEventListener('click', () => {
                console.log('Copy prompt button clicked');
                this.copyPromptToClipboard();
            });
        }

        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => {
                console.log('Download button clicked');
                this.downloadJSON();
            });
        }

        if (this.importBtn && this.importFileInput) {
            this.importBtn.addEventListener('click', () => {
                console.log('Import button clicked');
                this.triggerImportDialog();
            });

            this.importFileInput.addEventListener('change', (event) => {
                console.log('Import file selected');
                this.handleImportFileChange(event);
            });
        }

        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => {
                console.log('Full reset requested');
                this.confirmAndReset();
            });
        }
    }

    setupObjectControls() {
        if (!this.objectsContainer || !this.objectTemplate || !this.addObjectBtn) {
            return;
        }

        // Attach listeners to existing cards (if any)
        this.objectsContainer.querySelectorAll('[data-object-card]').forEach(card => {
            this.attachObjectCardEvents(card);
        });

        this.addObjectBtn.addEventListener('click', () => {
            const newCard = this.createObjectCard();
            this.objectsContainer.appendChild(newCard);
            const descriptionField = newCard.querySelector('[data-object-field="description"]');
            if (descriptionField) descriptionField.focus();
            this.updatePreview();
        });
    }

    createObjectCard() {
        const fragment = this.objectTemplate.content.cloneNode(true);
        const card = fragment.querySelector('[data-object-card]');
        if (!card) {
            console.error('Object template missing card wrapper');
            return document.createElement('div');
        }

        this.attachObjectCardEvents(card);
        return card;
    }

    attachObjectCardEvents(card) {
        const inputs = card.querySelectorAll('[data-object-field]');
        inputs.forEach(input => {
            const eventName = input.tagName.toLowerCase() === 'select' ? 'change' : 'input';
            input.addEventListener(eventName, () => this.updatePreview());
        });

        const removeBtn = card.querySelector('[data-remove-object]');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                card.remove();
                this.updatePreview();
            });
        }
    }

    collectObjects() {
        if (!this.objectsContainer) return [];

        const cards = Array.from(this.objectsContainer.querySelectorAll('[data-object-card]'));
        return cards
            .map(card => {
                const descriptionField = card.querySelector('[data-object-field="description"]');
                const characteristicsField = card.querySelector('[data-object-field="characteristics"]');
                const positionField = card.querySelector('[data-object-field="position"]');
                const scaleField = card.querySelector('[data-object-field="scale"]');
                const styleTagsField = card.querySelector('[data-object-field="styleTags"]');

                const description = descriptionField ? descriptionField.value.trim() : '';
                const characteristicsRaw = characteristicsField ? characteristicsField.value.trim() : '';
                const position = positionField ? positionField.value.trim() : '';
                const scale = scaleField ? scaleField.value : '';
                const styleTagsRaw = styleTagsField ? styleTagsField.value.trim() : '';

                if (!description && !characteristicsRaw && !position && !scale && !styleTagsRaw) {
                    return null;
                }

                const objectData = {};
                if (description) {
                    objectData.description = description;
                }

                if (characteristicsRaw) {
                    const characteristics = characteristicsRaw
                        .split(',')
                        .map(char => char.trim())
                        .filter(Boolean);

                    objectData.characteristics = characteristics;
                }

                if (position) {
                    objectData.position = position;
                }

                if (scale) {
                    objectData.scale = scale;
                }

                if (styleTagsRaw) {
                    const styleTags = styleTagsRaw
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(Boolean);

                    objectData.style_tags = styleTags;
                }

                return objectData;
            })
            .filter(Boolean);
    }

    getAtmosphereData() {
        const weather = this.weatherCondition ? this.weatherCondition.value : '';
        const phenomenon = this.naturalPhenomenon ? this.naturalPhenomenon.value : '';
        const notes = this.atmosphereNotes ? this.atmosphereNotes.value.trim() : '';

        if (!weather && !phenomenon && !notes) {
            return null;
        }

        return {
            weather,
            natural_phenomenon: phenomenon,
            notes
        };
    }

    getActiveStyle() {
        return this.mainStyle ? this.mainStyle.value : 'professional_photo';
    }

    handleStyleChange(styleKey) {
        const activeStyle = styleKey || this.getActiveStyle();
        const styleDefinition = this.getStyleDefinition(activeStyle);

        this.resetFieldStates();
        this.updateStylePanels(activeStyle);
        this.applyStyleDefaults(styleDefinition);
        this.applyStyleDependencies(styleDefinition);

        const shouldEnableCamera = this.isPhotographyStyle(activeStyle);
        this.toggleCameraSection(shouldEnableCamera);
        this.populatePresetOptions(activeStyle);
    }

    isPhotographyStyle(styleKey) {
        return this.photographyStyles.has(styleKey);
    }

    toggleCameraSection(shouldEnable) {
        const cameraControls = [
            this.iso,
            this.aperture,
            this.shutterSpeed,
            this.focalLength
        ];

        cameraControls.forEach(control => {
            if (control) control.disabled = !shouldEnable;
        });

        if (this.cameraSection) {
            this.cameraSection.style.display = shouldEnable ? '' : 'none';
        }
    }

    populatePresetOptions(styleKey) {
        if (!this.stylePreset) return;

        const previousValue = this.stylePreset.value;
        const options = this.presetsByStyle[styleKey] || [];

        // Clear existing options except placeholder
        this.stylePreset.innerHTML = '';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Select preset…';
        this.stylePreset.appendChild(placeholder);

        options.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.key;
            option.textContent = preset.label;
            this.stylePreset.appendChild(option);
        });

        if (!options.find(p => p.key === previousValue)) {
            this.stylePreset.value = '';
        } else {
            this.stylePreset.value = previousValue;
        }
    }

    applyPreset(presetKey) {
        const preset = this.presetMap ? this.presetMap[presetKey] : null;
        if (!preset) return;

        const { mainStyle, values } = preset;
        let targetStyle = mainStyle || this.getActiveStyle();

        if (mainStyle && this.mainStyle && this.mainStyle.value !== mainStyle) {
            this.setControlValue('mainStyle', mainStyle);
            targetStyle = mainStyle;
        }

        if (values && typeof values === 'object') {
            Object.entries(values).forEach(([id, value]) => {
                this.setControlValue(id, value);
            });
        }

        if (this.stylePreset && this.stylePreset.value !== presetKey) {
            this.stylePreset.value = presetKey;
        }

        this.handleStyleChange(targetStyle);
        this.updatePreview();
    }

    resetPreset() {
        const currentStyle = this.getActiveStyle();

        Object.entries(this.defaultValues).forEach(([id, value]) => {
            this.setControlValue(id, value);
        });

        if (this.stylePreset) {
            this.stylePreset.value = '';
        }

        this.handleStyleChange(currentStyle);
        this.updatePreview();
    }

    setControlValue(id, value) {
        const control = document.getElementById(id);
        if (!control) return;

        const tagName = control.tagName.toLowerCase();
        const type = control.type;

        if (value === undefined) {
            return;
        }

        if (type === 'checkbox') {
            control.checked = Boolean(value);
        } else if (type === 'range') {
            control.value = value;
            if (control === this.contrast && this.contrastValue) {
                this.contrastValue.textContent = value;
            }
            if (control === this.sharpness && this.sharpnessValue) {
                this.sharpnessValue.textContent = value;
            }
        } else if (tagName === 'select' || tagName === 'textarea' || tagName === 'input') {
            control.value = value;
        }

        if (!this.isRestoring) {
            // Trigger change events where appropriate to keep listeners informed
            const eventName = (type === 'checkbox' || tagName === 'select') ? 'change' : 'input';
            control.dispatchEvent(new Event(eventName, { bubbles: true }));
        }
    }


    humanizeValue(value) {
        if (typeof value !== 'string') return value;
        const text = value.replace(/_/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    getStyleData() {
        const activeStyle = this.getActiveStyle();
        const styleDefinition = this.getStyleDefinition(activeStyle);
        const settings = {};
        const panel = this.stylePanels ? this.stylePanels.get(activeStyle) : null;

        if (panel) {
            const controls = panel.querySelectorAll('input[id], select[id], textarea[id]');
            controls.forEach(control => {
                const id = control.id;
                const key = this.toSnakeCase(id);
                if (!key) return;

                let value;
                if (control.type === 'checkbox') {
                    value = control.checked;
                } else if (control.type === 'range') {
                    value = parseInt(control.value, 10);
                } else {
                    value = control.value;
                }

                if (value === '' || value === undefined) {
                    return;
                }

                settings[key] = value;
            });
        }

        return {
            main_style: activeStyle,
            category: styleDefinition ? styleDefinition.category : undefined,
            preset: this.stylePreset && this.stylePreset.value ? this.stylePreset.value : undefined,
            settings
        };
    }

    getSelectedTask() {
        const selectedRadio = document.querySelector('input[name="task"]:checked');
        return selectedRadio ? selectedRadio.value : 'Image Generation';
    }

    generateJSON() {
        const taskValue = this.getSelectedTask();
        const description = this.taskDescription ? this.taskDescription.value.trim() : '';
        const finalTask = description ? `${taskValue}: ${description}` : taskValue;
        const activeStyle = this.getActiveStyle();
        const includeCamera = this.isPhotographyStyle(activeStyle);

        const jsonData = {
            task: finalTask,
            style: this.getStyleData()
        };

        if (this.isSectionActive('lighting')) {
            jsonData.lighting = {
                type: this.lightType ? this.lightType.value : 'Soft',
                direction: this.lightDirection ? this.lightDirection.value : 'Front',
                scheme: this.lightingScheme ? this.lightingScheme.value : 'Butterfly',
                temperature: this.temperature ? this.temperature.value : 'Neutral'
            };
        }

        if (this.isSectionActive('composition')) {
            jsonData.composition = {
                framing: this.framing ? this.framing.value : 'Medium shot',
                angle: this.angle ? this.angle.value : 'Straight',
                rule_of_thirds: this.ruleOfThirds ? this.ruleOfThirds.checked : false
            };
        }

        if (this.isSectionActive('quality')) {
            jsonData.quality = {
                resolution: this.resolution ? this.resolution.value : '1024x1024',
                detail_level: this.detailLevel ? this.detailLevel.value : 'Medium',
                noise_reduction: this.noiseReduction ? this.noiseReduction.checked : false,
                sharpening: this.sharpening ? this.sharpening.checked : false
            };
        }

        if (this.isSectionActive('restrictions')) {
            jsonData.restrictions = {
                preserve_faces: this.preserveFaces ? this.preserveFaces.checked : false,
                preserve_composition: this.preserveComposition ? this.preserveComposition.checked : false,
                no_object_addition: this.noObjectAddition ? this.noObjectAddition.checked : false,
                no_background_change: this.noBackgroundChange ? this.noBackgroundChange.checked : false,
                precise_positioning: this.precisePositioning ? this.precisePositioning.checked : false
            };
        }

        if (this.isSectionActive('objects')) {
            const objects = this.collectObjects();
            if (objects.length > 0) {
                jsonData.additional_objects = objects;
            }
        }

        if (includeCamera) {
            jsonData.camera_settings = {
                iso: this.iso ? this.iso.value : '400',
                aperture: this.aperture ? this.aperture.value : 'f/2.8',
                shutter_speed: this.shutterSpeed ? this.shutterSpeed.value : '1/250',
                focal_length: this.focalLength ? this.focalLength.value : '50mm'
            };
        }

        if (this.isSectionActive('atmosphere')) {
            const atmosphere = this.getAtmosphereData();
            if (atmosphere) {
                jsonData.atmosphere = atmosphere;
            }
        }

        return jsonData;
    }

    generatePrompt(jsonData) {
        const data = jsonData || this.generateJSON();
        const promptParts = [];

        if (data.task) {
            promptParts.push(data.task);
        }

        if (data.camera_settings) {
            const camera = data.camera_settings;
            promptParts.push(
                `Camera settings: ISO ${camera.iso || '400'}, aperture ${camera.aperture || 'f/2.8'}, shutter ${camera.shutter_speed || '1/250'}, ${camera.focal_length || '50mm'} lens.`
            );
        }

        if (data.lighting) {
            const lighting = data.lighting;
            const type = lighting.type || 'Soft';
            const direction = lighting.direction ? lighting.direction.toLowerCase() : 'front';
            const scheme = lighting.scheme || 'Standard';
            const temperature = lighting.temperature ? lighting.temperature.toLowerCase() : 'neutral';
            promptParts.push(
                `Lighting: ${type} light from the ${direction} using ${scheme} scheme, ${temperature} temperature.`
            );
        }

        if (data.composition) {
            const composition = data.composition;
            const framing = composition.framing ? composition.framing.toLowerCase() : 'medium shot';
            const angle = composition.angle ? composition.angle.toLowerCase() : 'straight';
            const compositionParts = [`framing ${framing}`, `angle ${angle}`];
            if (composition.rule_of_thirds) {
                compositionParts.push('respecting the rule of thirds');
            }
            promptParts.push(`Composition: ${compositionParts.join(', ')}.`);
        }

        if (data.style) {
            const style = data.style;
            const styleName = this.humanizeValue(style.main_style || this.getActiveStyle() || '');
            const styleDetails = [`Main style: ${styleName}`];
            const settings = style.settings || {};
            Object.entries(settings).forEach(([key, value]) => {
                if (value === '' || value === false) return;
                if (typeof value === 'boolean') {
                    styleDetails.push(`${key.replace(/_/g, ' ')} enabled`);
                } else {
                    styleDetails.push(`${key.replace(/_/g, ' ')} ${this.humanizeValue(value)}`);
                }
            });
            promptParts.push(styleDetails.join(', ') + '.');
        }

        if (data.quality) {
            const quality = data.quality;
            const qualityParts = [`resolution ${quality.resolution}`];
            if (quality.detail_level) qualityParts.push(`detail level ${quality.detail_level.toLowerCase()}`);
            if (quality.noise_reduction) qualityParts.push('noise reduction on');
            if (quality.sharpening) qualityParts.push('sharpening enabled');
            promptParts.push(`Quality: ${qualityParts.join(', ')}.`);
        }

        if (data.atmosphere) {
            const atmosphere = data.atmosphere;
            const atmosphereParts = [];
            if (atmosphere.weather) {
                atmosphereParts.push(`weather ${this.humanizeValue(atmosphere.weather)}`);
            }
            if (atmosphere.natural_phenomenon) {
                atmosphereParts.push(`phenomenon ${this.humanizeValue(atmosphere.natural_phenomenon)}`);
            }
            if (atmosphere.notes) {
                atmosphereParts.push(`notes: ${atmosphere.notes}`);
            }
            if (atmosphereParts.length) {
                promptParts.push(`Atmosphere: ${atmosphereParts.join(', ')}.`);
            }
        }

        if (Array.isArray(data.additional_objects) && data.additional_objects.length > 0) {
            const objectsDescriptions = data.additional_objects.map(obj => {
                const segments = [];
                if (obj.description) segments.push(obj.description);
                if (obj.characteristics && obj.characteristics.length) {
                    segments.push(`characteristics: ${obj.characteristics.join(', ')}`);
                }
                if (obj.position) segments.push(`position: ${obj.position}`);
                if (obj.scale) segments.push(`scale: ${obj.scale}`);
                if (obj.style_tags && obj.style_tags.length) {
                    segments.push(`style tags: ${obj.style_tags.join(', ')}`);
                }
                return segments.join('; ');
            });
            promptParts.push(`Additional objects: ${objectsDescriptions.join(' | ')}.`);
        }

        if (data.restrictions) {
            const restrictions = Object.entries(data.restrictions)
                .filter(([, value]) => value)
                .map(([key]) => key.replace(/_/g, ' '));
            if (restrictions.length) {
                promptParts.push(`Restrictions: ${restrictions.join(', ')}.`);
            }
        }

        return promptParts.join('\n');
    }

    updatePreview() {
        try {
            const jsonData = this.generateJSON();
            const formattedJSON = JSON.stringify(jsonData, null, 2);
            
            if (this.jsonOutput) {
                this.jsonOutput.value = formattedJSON;
                console.log('JSON preview updated');
            } else {
                console.error('JSON output element not found');
            }

            const promptText = this.generatePrompt(jsonData);
            if (this.promptOutput) {
                this.promptOutput.value = promptText;
            }

            if (!this.skipNextAutosave) {
                this.scheduleAutosave(jsonData, promptText);
            } else {
                this.skipNextAutosave = false;
            }
        } catch (error) {
            console.error('Error generating JSON:', error);
            if (this.jsonOutput) {
                this.jsonOutput.value = `Error generating JSON:\n${error.message}`;
            }
            if (this.promptOutput) {
                this.promptOutput.value = `Error generating prompt:\n${error.message}`;
            }
            this.handleAutosaveError(error);
        }
    }

    async copyToClipboard() {
        try {
            if (!this.jsonOutput || !this.jsonOutput.value) {
                throw new Error('No data to copy');
            }

            await navigator.clipboard.writeText(this.jsonOutput.value);
            this.showCopySuccess();
            console.log('JSON copied to clipboard');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.fallbackCopy();
        }
    }

    async copyPromptToClipboard() {
        try {
            if (!this.promptOutput || !this.promptOutput.value) {
                throw new Error('No prompt to copy');
            }

            await navigator.clipboard.writeText(this.promptOutput.value);
            this.showPromptCopySuccess();
            console.log('Prompt copied to clipboard');
        } catch (error) {
            console.error('Failed to copy prompt:', error);
            this.fallbackCopyPrompt();
        }
    }

    fallbackCopy() {
        if (!this.jsonOutput) return;
        
        this.jsonOutput.select();
        this.jsonOutput.setSelectionRange(0, 99999);
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess();
                console.log('JSON copied using fallback method');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (error) {
            console.error('Fallback copy failed:', error);
            alert('Could not copy to clipboard. Please try selecting the text manually.');
        }
    }

    fallbackCopyPrompt() {
        if (!this.promptOutput) return;

        this.promptOutput.select();
        this.promptOutput.setSelectionRange(0, 99999);

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showPromptCopySuccess();
                console.log('Prompt copied using fallback method');
            } else {
                throw new Error('Copy command failed');
            }
        } catch (error) {
            console.error('Fallback prompt copy failed:', error);
            alert('Could not copy prompt. Please try selecting the text manually.');
        }
    }

    showCopySuccess() {
        if (!this.copyBtn) return;
        
        const originalText = this.copyBtn.textContent;
        const originalClass = this.copyBtn.className;
        
        this.copyBtn.textContent = 'Copied!';
        this.copyBtn.className = originalClass + ' btn--success';
        
        setTimeout(() => {
            this.copyBtn.textContent = originalText;
            this.copyBtn.className = originalClass;
        }, 2000);
    }

    showPromptCopySuccess() {
        if (!this.copyPromptBtn) return;

        const originalText = this.copyPromptBtn.textContent;
        const originalClass = this.copyPromptBtn.className;

        this.copyPromptBtn.textContent = 'Copied!';
        this.copyPromptBtn.className = originalClass + ' btn--success';

        setTimeout(() => {
            this.copyPromptBtn.textContent = originalText;
            this.copyPromptBtn.className = originalClass;
        }, 2000);
    }

    downloadJSON() {
        try {
            const exportPayload = this.buildExportPayload();
            const formattedJSON = JSON.stringify(exportPayload, null, 2);
            
            const blob = new Blob([formattedJSON], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `nanobana-prompt-${this.generateTimestamp()}.json`;
            a.style.display = 'none';
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.showDownloadSuccess();
            console.log('JSON file downloaded');
        } catch (error) {
            console.error('Error downloading JSON:', error);
            alert('Error downloading file: ' + error.message);
        }
    }

    buildExportPayload() {
        const jsonData = this.generateJSON();
        const promptText = this.generatePrompt(jsonData);

        return {
            type: 'nanobana-prompt',
            version: this.config.version || '0.1.0',
            schemaVersion: (this.config.storage && this.config.storage.schemaVersion) || 1,
            exportedAt: new Date().toISOString(),
            snapshot: this.buildAutosaveSnapshot(jsonData, promptText),
            data: jsonData,
            prompt: promptText
        };
    }

    showDownloadSuccess() {
        if (!this.downloadBtn) return;
        
        const originalText = this.downloadBtn.textContent;
        const originalClass = this.downloadBtn.className;
        
        this.downloadBtn.textContent = 'Downloaded!';
        this.downloadBtn.classList.add('btn--success');
        
        setTimeout(() => {
            this.downloadBtn.textContent = originalText;
            this.downloadBtn.className = originalClass;
        }, 2000);
    }

    generateTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    }

    // Initialize default values
    initializeDefaults() {
        if (this.stylePreset) this.stylePreset.value = '';

        // Set slider values
        if (this.contrastValue) this.contrastValue.textContent = '50';
        if (this.sharpnessValue) this.sharpnessValue.textContent = '50';

        // Update preview after defaults are set
        this.skipNextAutosave = true;
        setTimeout(() => this.updatePreview(), 100);
    }

    triggerImportDialog() {
        if (!this.importFileInput) return;
        this.importFileInput.value = '';
        this.importFileInput.click();
    }

    async handleImportFileChange(event) {
        const file = event && event.target && event.target.files ? event.target.files[0] : null;
        if (!file) {
            return;
        }

        if (file.type && file.type !== 'application/json') {
            alert('Selected file is not a JSON file. Please choose a valid JSON export.');
            this.resetImportInput();
            return;
        }

        try {
            const fileContents = await this.readFileAsText(file);
            const parsed = this.parseImportedJSON(fileContents);
            const normalized = this.normalizeImportedPayload(parsed);
            const migrated = this.maybeMigrateImportedPayload(normalized);
            await this.applyImportedPayload(migrated);
            this.showImportSuccess(file.name);
        } catch (error) {
            console.error('Import failed:', error);
            this.updateAutosaveStatus('error', { error: error.message || 'Import failed' });
            alert(`Import failed: ${error.message || error}`);
        } finally {
            this.resetImportInput();
        }
    }

    resetImportInput() {
        if (this.importFileInput) {
            this.importFileInput.value = '';
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error('Could not read file'));
            reader.readAsText(file);
        });
    }

    parseImportedJSON(text) {
        if (!text) {
            throw new Error('File is empty.');
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            throw new Error('Invalid JSON format.');
        }
    }

    normalizeImportedPayload(raw) {
        if (!raw || typeof raw !== 'object') {
            throw new Error('Unsupported file structure.');
        }

        // New format with metadata
        if (raw.type === 'nanobana-prompt' || raw.snapshot || raw.data) {
            const snapshot = raw.snapshot || (raw.data && raw.data.controls ? raw.data : null);
            const jsonData = raw.data && raw.data.controls ? raw.data.json : raw.data;
            const promptText = raw.prompt || (raw.data && raw.data.prompt) || null;

            return {
                type: raw.type || 'nanobana-prompt',
                schemaVersion: raw.schemaVersion,
                version: raw.version,
                exportedAt: raw.exportedAt,
                snapshot,
                data: jsonData || null,
                prompt: promptText
            };
        }

        // Autosave payload structure
        if (raw.data && raw.history) {
            return {
                type: 'nanobana-autosave',
                schemaVersion: raw.schemaVersion,
                exportedAt: raw.timestamp,
                snapshot: raw.data || null,
                data: (raw.data && raw.data.json) || null,
                prompt: (raw.data && raw.data.prompt) || null
            };
        }

        // Fallback: assume direct JSON data export
        this.validateImportedData(raw);
        return {
            type: 'legacy-json',
            schemaVersion: undefined,
            snapshot: null,
            data: raw,
            prompt: null
        };
    }

    maybeMigrateImportedPayload(payload) {
        if (!payload) return payload;

        const storageConfig = this.config.storage || {};
        const targetVersion = storageConfig.schemaVersion;

        if (payload.schemaVersion && targetVersion && payload.schemaVersion !== targetVersion) {
            if (typeof storageConfig.migrate === 'function') {
                try {
                    const migrated = storageConfig.migrate(payload, targetVersion, { source: 'import' });
                    if (migrated && typeof migrated === 'object') {
                        return migrated;
                    }
                } catch (error) {
                    console.error('Migration handler failed:', error);
                    throw new Error('Could not migrate imported data.');
                }
            } else {
                throw new Error('Imported file uses an unsupported schema version.');
            }
        }

        return payload;
    }

    async applyImportedPayload(payload) {
        if (!payload) {
            throw new Error('Nothing to import.');
        }

        if (payload.snapshot && payload.snapshot.controls) {
            console.log('Applying snapshot from imported payload');
            this.applyFormSnapshot(payload.snapshot);
        } else if (payload.data) {
            console.log('Applying data from imported payload');
            const snapshot = this.snapshotFromImportedData(payload.data, payload.prompt);
            this.applyFormSnapshot(snapshot);
        } else {
            throw new Error('Imported file does not contain usable data.');
        }

        const timestamp = new Date().toISOString();
        this.updateAutosaveStatus('restored', { timestamp, source: 'import' });

        if (this.autosaveManager && this.autosaveManager.storageAvailable) {
            const jsonData = this.generateJSON();
            const promptText = this.generatePrompt(jsonData);
            this.scheduleAutosave(jsonData, promptText);
        }
    }

    snapshotFromImportedData(data, promptText) {
        this.validateImportedData(data);

        const controls = {};
        const objects = Array.isArray(data.additional_objects)
            ? data.additional_objects.map(obj => this.normalizeImportedObject(obj)).filter(Boolean)
            : [];

        const defaultTask = this.taskRadios && this.taskRadios.length ? this.taskRadios[0].value : 'Image Generation';
        const { task, description } = this.splitTaskDescription(data.task, defaultTask);
        controls.taskDescription = description;
        const taskValues = this.taskRadios && this.taskRadios.length ? Array.from(this.taskRadios).map(radio => radio.value) : [defaultTask];
        const selectedTask = taskValues.includes(task) ? task : taskValues[0];

        const styleData = data.style || {};
        const mainStyle = styleData.main_style || styleData.key;
        if (mainStyle) {
            controls.mainStyle = mainStyle;
        }

        if (styleData.preset) {
            controls.stylePreset = styleData.preset;
        }

        if (styleData.settings && typeof styleData.settings === 'object') {
            Object.entries(styleData.settings).forEach(([key, value]) => {
                const controlId = this.fromSnakeCase(key);
                if (controlId) {
                    controls[controlId] = value;
                }
            });
        }

        this.applySectionDataToControls(data.lighting, controls, {
            type: 'lightType',
            direction: 'lightDirection',
            scheme: 'lightingScheme',
            temperature: 'temperature'
        });

        this.applySectionDataToControls(data.composition, controls, {
            framing: 'framing',
            angle: 'angle',
            rule_of_thirds: 'ruleOfThirds'
        });

        this.applySectionDataToControls(data.quality, controls, {
            resolution: 'resolution',
            detail_level: 'detailLevel',
            noise_reduction: 'noiseReduction',
            sharpening: 'sharpening'
        });

        this.applySectionDataToControls(data.restrictions, controls, {
            preserve_faces: 'preserveFaces',
            preserve_composition: 'preserveComposition',
            no_object_addition: 'noObjectAddition',
            no_background_change: 'noBackgroundChange',
            precise_positioning: 'precisePositioning'
        });

        if (data.camera_settings && typeof data.camera_settings === 'object') {
            this.applySectionDataToControls(data.camera_settings, controls, {
                iso: 'iso',
                aperture: 'aperture',
                shutter_speed: 'shutterSpeed',
                focal_length: 'focalLength'
            });
        }

        if (data.atmosphere && typeof data.atmosphere === 'object') {
            controls.weatherCondition = data.atmosphere.weather || '';
            controls.naturalPhenomenon = data.atmosphere.natural_phenomenon || '';
            controls.atmosphereNotes = data.atmosphere.notes || '';
        }

        const snapshot = {
            task: selectedTask,
            controls,
            objects,
            json: data,
            prompt: promptText || this.generatePrompt(data)
        };

        // task radio buttons are handled separately, no need to keep it in controls
        delete snapshot.controls.task;

        return snapshot;
    }

    splitTaskDescription(taskValue, defaultTask) {
        const fallbackTask = defaultTask || (this.taskRadios && this.taskRadios.length ? this.taskRadios[0].value : 'Image Generation');
        if (typeof taskValue !== 'string' || taskValue.length === 0) {
            return { task: fallbackTask, description: '' };
        }

        const [maybeTask, ...rest] = taskValue.split(':');
        if (rest.length === 0) {
            return { task: taskValue.trim() || fallbackTask, description: '' };
        }

        const task = maybeTask.trim();
        const description = rest.join(':').trim();
        return { task: task || fallbackTask, description };
    }

    applySectionDataToControls(sectionData, controls, mapping) {
        if (!sectionData || typeof sectionData !== 'object') return;
        Object.entries(mapping).forEach(([sourceKey, controlId]) => {
            if (Object.prototype.hasOwnProperty.call(sectionData, sourceKey)) {
                controls[controlId] = sectionData[sourceKey];
            }
        });
    }

    normalizeImportedObject(obj) {
        if (!obj || typeof obj !== 'object') return null;
        const normalized = {};

        if (obj.description) {
            normalized.description = obj.description;
        }

        if (Array.isArray(obj.characteristics)) {
            normalized.characteristics = obj.characteristics.join(', ');
        } else if (typeof obj.characteristics === 'string') {
            normalized.characteristics = obj.characteristics;
        }

        if (obj.position) {
            normalized.position = obj.position;
        }

        if (obj.scale) {
            normalized.scale = obj.scale;
        }

        if (Array.isArray(obj.style_tags)) {
            normalized.styleTags = obj.style_tags.join(', ');
        } else if (Array.isArray(obj.styleTags)) {
            normalized.styleTags = obj.styleTags.join(', ');
        } else if (typeof obj.style_tags === 'string') {
            normalized.styleTags = obj.style_tags;
        } else if (typeof obj.styleTags === 'string') {
            normalized.styleTags = obj.styleTags;
        }

        if (
            !normalized.description &&
            !normalized.characteristics &&
            !normalized.position &&
            !normalized.scale &&
            !normalized.styleTags
        ) {
            return null;
        }

        return normalized;
    }

    fromSnakeCase(value) {
        if (!value) return '';
        const segments = String(value).split('_');
        const [first, ...rest] = segments;
        return [first, ...rest.map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))].join('');
    }

    validateImportedData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Imported JSON must be an object.');
        }

        if (!data.task || !data.style) {
            throw new Error('Imported JSON is missing required fields: task or style.');
        }

        if (!data.style.main_style && !data.style.key) {
            throw new Error('Imported JSON is missing style main_style.');
        }
    }

    showImportSuccess(filename) {
        if (!this.importBtn) return;

        const originalText = this.importBtn.textContent;
        const originalClass = this.importBtn.className;

        this.importBtn.textContent = 'Imported';
        this.importBtn.className = `${originalClass} btn--success`.trim();

        setTimeout(() => {
            this.importBtn.textContent = originalText;
            this.importBtn.className = originalClass;
        }, 2000);

        console.log(`Import completed from file: ${filename}`);
    }

    confirmAndReset() {
        const confirmed = window.confirm('This will clear the form, reset styles, and remove saved data. Continue?');
        if (!confirmed) {
            return;
        }

        this.performFullReset();
    }

    performFullReset() {
        this.isRestoring = true;

        if (this.autosaveManager) {
            this.autosaveManager.clear();
        }

        if (this.objectsContainer) {
            this.objectsContainer.innerHTML = '';
        }

        if (this.taskDescription) {
            this.taskDescription.value = '';
        }

        if (this.taskRadios && this.taskRadios.length) {
            this.taskRadios.forEach((radio, index) => {
                radio.checked = index === 0;
            });
        }

        this.resetFieldStates();

        const baseStyle = this.defaultMainStyle || this.getActiveStyle();
        if (this.mainStyle && baseStyle) {
            this.setControlValue('mainStyle', baseStyle);
        }

        Object.entries(this.defaultValues || {}).forEach(([id, value]) => {
            this.setControlValue(id, value);
        });

        if (this.stylePreset) {
            this.stylePreset.value = '';
        }

        this.isRestoring = false;

        if (baseStyle) {
            this.handleStyleChange(baseStyle);
        }

        this.initializeDefaults();

        this.skipNextAutosave = true;
        this.updatePreview();
        this.updateAutosaveStatus('idle');
        this.showResetSuccess();
    }

    showResetSuccess() {
        if (!this.resetBtn) return;

        const originalText = this.resetBtn.textContent;
        const originalClass = this.resetBtn.className;

        this.resetBtn.textContent = 'Reset done';
        this.resetBtn.className = `${originalClass} btn--success`.trim();

        setTimeout(() => {
            this.resetBtn.textContent = originalText;
            this.resetBtn.className = originalClass;
        }, 2000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NanoBana Constructor...');
    
    try {
        const constructor = new NanoBanaConstructor();

        if (!constructor.hasRestoredState) {
            constructor.initializeDefaults();
        }
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+S or Cmd+S to download
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                constructor.downloadJSON();
            }
            
            // Ctrl+C or Cmd+C when not focused on textarea
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && 
                !document.activeElement.matches('textarea')) {
                e.preventDefault();
                constructor.copyToClipboard();
            }
        });
        
        console.log('🍌 NanoBana JSON Prompt Constructor initialized successfully!');
    } catch (error) {
        console.error('Failed to initialize NanoBana Constructor:', error);
    }
});
