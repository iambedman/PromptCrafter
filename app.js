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
        this.objectConfig = {};
        this.objectDefaults = {};
        this.objectIdCounter = 0;

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

        this.objectConfig = this.config.objects || {};
        this.objectDefaults = this.buildObjectDefaults();
        this.highlightTagPalette = Array.isArray(this.objectConfig.highlightTagPalette)
            ? this.objectConfig.highlightTagPalette.slice()
            : [];
        this.highlightTagPaletteIndex = this.buildHighlightTagPaletteIndex(this.highlightTagPalette);
        this.objectStateLabels = this.buildObjectStateLabels();
        this.objectFieldMetadata = this.buildObjectFieldMetadata();
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

    buildObjectDefaults() {
        const defaults = {
            objectId: '',
            description: '',
            characteristics: '',
            priority: 'primary',
            weight: 'balanced',
            scale: 'medium',
            position: '',
            importance: '50',
            material: '',
            structure: '',
            texture: '',
            highlightTags: '',
            interactions: '',
            interactionNotes: '',
            locked: false,
            collapsed: false
        };

        const configDefaults = this.objectConfig && this.objectConfig.defaults ? this.objectConfig.defaults : {};
        if (configDefaults) {
            defaults.priority = configDefaults.priority || defaults.priority;
            defaults.weight = configDefaults.weight || defaults.weight;
            defaults.scale = configDefaults.scale || defaults.scale;
            defaults.position = configDefaults.position || defaults.position;
            defaults.material = configDefaults.material || defaults.material;
            defaults.structure = configDefaults.structure || defaults.structure;
            defaults.texture = configDefaults.texture || defaults.texture;
            defaults.interactionNotes = configDefaults.interactionNotes || defaults.interactionNotes;

            if (Array.isArray(configDefaults.highlightTags) && configDefaults.highlightTags.length > 0) {
                defaults.highlightTags = this.formatHighlightTagsForInput(configDefaults.highlightTags);
            }

            if (Array.isArray(configDefaults.interactions) && configDefaults.interactions.length > 0) {
                defaults.interactions = configDefaults.interactions.join(', ');
            }

            if (typeof configDefaults.importance === 'number') {
                defaults.importance = String(configDefaults.importance);
            }
        }

        return defaults;
    }

    buildHighlightTagPaletteIndex(palette) {
        const map = new Map();
        if (!Array.isArray(palette)) {
            return map;
        }

        palette.forEach(entry => {
            if (!entry || typeof entry !== 'object') return;
            const normalized = { ...entry };
            if (typeof normalized.key === 'string') {
                map.set(normalized.key.toLowerCase(), normalized);
            }
            if (typeof normalized.label === 'string') {
                map.set(normalized.label.toLowerCase(), normalized);
            }
        });

        return map;
    }

    resolveHighlightTagPaletteEntry(tagValue) {
        if (!tagValue || typeof tagValue !== 'string') {
            return null;
        }

        const lookupKey = tagValue.toLowerCase();
        if (this.highlightTagPaletteIndex && this.highlightTagPaletteIndex.has(lookupKey)) {
            return this.highlightTagPaletteIndex.get(lookupKey);
        }

        return null;
    }

    buildObjectStateLabels() {
        const stateConfig = (this.objectConfig && this.objectConfig.states) || {};
        const lockStates = Array.isArray(stateConfig.lock) ? stateConfig.lock : [];
        const collapseStates = Array.isArray(stateConfig.collapse) ? stateConfig.collapse : [];

        return {
            locked: this.humanizeValue(lockStates[0] || 'locked'),
            unlocked: this.humanizeValue(lockStates[1] || 'unlocked'),
            collapsed: this.humanizeValue(collapseStates[1] || 'collapsed'),
            expanded: this.humanizeValue(collapseStates[0] || 'expanded')
        };
    }

    getObjectStateLabel(stateKey) {
        if (!stateKey || typeof stateKey !== 'string') {
            return '';
        }

        if (this.objectStateLabels && this.objectStateLabels[stateKey]) {
            return this.objectStateLabels[stateKey];
        }

        return this.humanizeValue(stateKey);
    }

    buildObjectFieldMetadata() {
        const metadata = {};
        const additionalSettings = Array.isArray(this.objectConfig.additionalObjectSettings)
            ? this.objectConfig.additionalObjectSettings
            : [];

        additionalSettings.forEach(setting => {
            if (!setting || typeof setting !== 'object' || !setting.key) return;
            metadata[setting.key] = {
                label: setting.label,
                placeholder: setting.placeholder,
                description: setting.description,
                options: Array.isArray(setting.options) ? setting.options.slice() : undefined,
                default: setting.default,
                min: setting.min,
                max: setting.max,
                step: setting.step,
                type: setting.type
            };
        });

        return metadata;
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

        return Array.from(this.objectsContainer.querySelectorAll('[data-object-card]')).map(card => this.getObjectCardFormValues(card));
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

            const normalized = this.normalizePersistedObject(entry);
            const card = this.createObjectCard(normalized);
            if (!card) return;

            this.objectsContainer.appendChild(card);
        });
    }

    normalizePersistedObject(entry) {
        const base = { ...this.objectDefaults };

        if (!entry || typeof entry !== 'object') {
            return base;
        }

        const normalized = { ...base };

        const objectId = entry.objectId || entry.id;
        if (objectId) {
            normalized.objectId = objectId;
        }

        if (typeof entry.description === 'string') {
            normalized.description = entry.description;
        }

        if (Array.isArray(entry.characteristics)) {
            normalized.characteristics = entry.characteristics.join(', ');
        } else if (typeof entry.characteristics === 'string') {
            normalized.characteristics = entry.characteristics;
        }

        const settings = entry.additional_object_settings || {};

        normalized.priority = settings.priority || entry.priority || normalized.priority;
        normalized.weight = settings.weight || entry.weight || normalized.weight;
        normalized.scale = settings.scale || entry.scale || normalized.scale;
        normalized.position = settings.position || entry.position || normalized.position;
        normalized.material = settings.material || entry.material || normalized.material;
        normalized.structure = settings.structure || entry.structure || normalized.structure;
        normalized.texture = settings.texture || entry.texture || normalized.texture;
        normalized.interactionNotes = settings.interaction_notes || entry.interactionNotes || normalized.interactionNotes;

        if (typeof settings.importance === 'number') {
            normalized.importance = String(settings.importance);
        } else if (typeof entry.importance === 'number' || typeof entry.importance === 'string') {
            normalized.importance = String(entry.importance);
        }

        if (Array.isArray(settings.interactions)) {
            normalized.interactions = settings.interactions.join(', ');
        } else if (entry.relations && Array.isArray(entry.relations.interacts_with)) {
            normalized.interactions = entry.relations.interacts_with.join(', ');
        } else if (typeof entry.interactions === 'string') {
            normalized.interactions = entry.interactions;
        }

        if (Array.isArray(entry.highlightTags)) {
            normalized.highlightTags = this.formatHighlightTagsForInput(entry.highlightTags);
        } else if (Array.isArray(entry.highlight_tags)) {
            normalized.highlightTags = this.formatHighlightTagsForInput(entry.highlight_tags);
        } else if (typeof entry.highlightTags === 'string') {
            normalized.highlightTags = entry.highlightTags;
        } else if (typeof entry.styleTags === 'string') {
            normalized.highlightTags = entry.styleTags;
        }

        if (typeof entry.interactionNotes === 'string' && !normalized.interactionNotes) {
            normalized.interactionNotes = entry.interactionNotes;
        }

        if (typeof entry.position === 'string' && !normalized.position) {
            normalized.position = entry.position;
        }

        const locked = entry.locked ?? entry?.states?.locked ?? entry?.cardState?.locked;
        const collapsed = entry.collapsed ?? entry?.states?.collapsed ?? entry?.cardState?.collapsed;

        normalized.locked = this.toBoolean(locked);
        normalized.collapsed = this.toBoolean(collapsed);

        return normalized;
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
            const initialData = this.getObjectCardFormValues(card);
            this.setObjectCardState(card, {
                locked: initialData.locked,
                collapsed: initialData.collapsed
            });
            this.populateObjectCard(card, { ...this.objectDefaults, ...initialData });
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

    createObjectCard(initialData = null) {
        const fragment = this.objectTemplate.content.cloneNode(true);
        const card = fragment.querySelector('[data-object-card]');
        if (!card) {
            console.error('Object template missing card wrapper');
            return document.createElement('div');
        }

        const data = { ...this.objectDefaults, ...(initialData || {}) };

        if (!data.objectId) {
            data.objectId = this.generateObjectId();
        } else {
            this.registerExistingObjectId(data.objectId);
        }

        this.populateObjectCard(card, data);
        this.setObjectCardState(card, {
            locked: Boolean(data.locked),
            collapsed: Boolean(data.collapsed)
        });
        this.attachObjectCardEvents(card);
        return card;
    }

    applyObjectFieldMetadata(card, data = {}) {
        if (!card || !this.objectFieldMetadata) {
            return;
        }

        const fields = card.querySelectorAll('[data-object-field]');
        fields.forEach(field => {
            const key = field.dataset.objectField;
            if (!key) return;
            const meta = this.objectFieldMetadata[key];
            if (!meta) return;

            const wrapper = this.getFieldWrapper(field);

            if (meta.label && wrapper) {
                const labelEl = wrapper.querySelector('.form-label');
                if (labelEl) {
                    labelEl.textContent = meta.label;
                }
            }

            if (meta.placeholder && 'placeholder' in field) {
                field.placeholder = meta.placeholder;
            }

            if (meta.description) {
                field.title = meta.description;
                if (wrapper) {
                    let hint = wrapper.querySelector('[data-field-hint]');
                    if (!hint) {
                        hint = document.createElement('div');
                        hint.className = 'form-hint';
                        hint.dataset.fieldHint = 'true';
                        wrapper.appendChild(hint);
                    }
                    hint.textContent = meta.description;
                }
            } else if (wrapper) {
                field.removeAttribute('title');
                const hint = wrapper.querySelector('[data-field-hint]');
                if (hint) {
                    hint.remove();
                }
            }

            if (field.tagName.toLowerCase() === 'select' && Array.isArray(meta.options)) {
                const targetValue = data[key] ?? field.value;
                this.syncSelectOptions(field, meta.options, meta.default, targetValue);
            }

            if ((field.type === 'number' || field.type === 'range') && (meta.min !== undefined || meta.max !== undefined || meta.step !== undefined)) {
                if (meta.min !== undefined) {
                    field.min = String(meta.min);
                }
                if (meta.max !== undefined) {
                    field.max = String(meta.max);
                }
                if (meta.step !== undefined) {
                    field.step = String(meta.step);
                }
            }
        });
    }

    syncSelectOptions(selectElement, options, defaultValue, targetValue) {
        const existingValue = typeof targetValue === 'string' && targetValue.length > 0
            ? targetValue
            : selectElement.value;

        const normalizedOptions = options.map(option => {
            if (typeof option === 'string') {
                return {
                    value: option,
                    label: this.humanizeValue(option)
                };
            }
            if (option && typeof option === 'object') {
                return {
                    value: option.value || option.key,
                    label: option.label || this.humanizeValue(option.value || option.key)
                };
            }
            return null;
        }).filter(Boolean);

        if (normalizedOptions.length === 0) {
            return;
        }

        const previousSelection = selectElement.value;
        selectElement.innerHTML = '';

        normalizedOptions.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            selectElement.appendChild(optionEl);
        });

        const desiredValue = normalizedOptions.find(option => option.value === existingValue)
            ? existingValue
            : (defaultValue || normalizedOptions[0].value);

        selectElement.value = desiredValue || previousSelection;
    }

    attachObjectCardEvents(card) {
        const inputs = card.querySelectorAll('[data-object-field]');
        inputs.forEach(input => {
            const eventName = input.tagName.toLowerCase() === 'select' || input.type === 'number' ? 'change' : 'input';
            input.addEventListener(eventName, () => this.updatePreview());

            if (input.dataset.objectField === 'highlightTags') {
                input.addEventListener('input', () => this.renderHighlightTagPreview(card));
            }

            if (input.dataset.objectField === 'objectId') {
                input.addEventListener('blur', () => {
                    const currentValue = input.value ? input.value.trim() : '';
                    if (!currentValue) {
                        const newId = this.generateObjectId();
                        input.value = newId;
                        this.registerExistingObjectId(newId);
                    } else {
                        this.registerExistingObjectId(currentValue);
                    }
                    this.updatePreview();
                });
            }
        });

        const removeBtn = card.querySelector('[data-remove-object]');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                if (card.dataset.locked === 'true') {
                    window.alert('Unlock the object card before removing it.');
                    return;
                }
                card.remove();
                this.updatePreview();
            });
        }

        const duplicateBtn = card.querySelector('[data-object-action="duplicate"]');
        if (duplicateBtn) {
            duplicateBtn.addEventListener('click', () => this.duplicateObjectCard(card));
        }

        const collapseBtn = card.querySelector('[data-object-action="collapse"]');
        if (collapseBtn) {
            collapseBtn.addEventListener('click', () => this.toggleObjectCollapse(card, collapseBtn));
            this.updateCollapseButtonLabel(card, collapseBtn);
        }

        const lockBtn = card.querySelector('[data-object-action="lock"]');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => this.toggleObjectLock(card, lockBtn));
            this.updateLockButtonLabel(card, lockBtn);
        }
    }

    populateObjectCard(card, data) {
        if (!card || !data) return;

        this.applyObjectFieldMetadata(card, data);

        const fields = card.querySelectorAll('[data-object-field]');
        fields.forEach(field => {
            const key = field.dataset.objectField;
            if (!key) return;

            if (key === 'importance') {
                const value = data[key] ?? this.objectDefaults.importance;
                field.value = value !== undefined ? value : '';
                return;
            }

            if (key === 'locked' || key === 'collapsed') {
                field.checked = Boolean(data[key]);
                return;
            }

            const value = data[key];
            if (value === undefined || value === null) {
                field.value = '';
            } else {
                field.value = value;
            }
        });

        card.dataset.locked = String(this.toBoolean(data.locked));
        card.dataset.collapsed = String(this.toBoolean(data.collapsed));

        const collapseBtn = card.querySelector('[data-object-action="collapse"]');
        if (collapseBtn) {
            this.updateCollapseButtonLabel(card, collapseBtn);
        }

        const lockBtn = card.querySelector('[data-object-action="lock"]');
        if (lockBtn) {
            this.updateLockButtonLabel(card, lockBtn);
        }

        this.applyCardLockState(card);
        this.applyCardCollapseState(card);
        this.updateObjectStateIndicators(card);
        this.renderHighlightTagPreview(card, this.parseHighlightTagsInput(data.highlightTags));
    }

    getObjectCardFormValues(card) {
        if (!card) return { ...this.objectDefaults };

        const result = { ...this.objectDefaults };
        const fields = card.querySelectorAll('[data-object-field]');
        fields.forEach(field => {
            const key = field.dataset.objectField;
            if (!key) return;
            if (field.type === 'checkbox') {
                result[key] = field.checked;
            } else {
                result[key] = field.value || '';
            }
        });

        result.locked = card.dataset.locked === 'true';
        result.collapsed = card.dataset.collapsed === 'true';

        return result;
    }

    duplicateObjectCard(card) {
        if (!card) return;
        const rawData = this.getObjectCardFormValues(card);
        const duplicateData = {
            ...rawData,
            objectId: '',
            locked: false,
            collapsed: false
        };

        const newCard = this.createObjectCard(duplicateData);
        this.objectsContainer.appendChild(newCard);
        this.updatePreview();
    }

    toggleObjectCollapse(card, button) {
        if (!card) return;
        const collapsed = card.dataset.collapsed === 'true';
        this.setObjectCardState(card, { collapsed: !collapsed });
        if (button) {
            this.updateCollapseButtonLabel(card, button);
        }
        this.updatePreview();
    }

    toggleObjectLock(card, button) {
        if (!card) return;
        const locked = card.dataset.locked === 'true';
        this.setObjectCardState(card, { locked: !locked });
        if (button) {
            this.updateLockButtonLabel(card, button);
        }
        this.updatePreview();
    }

    setObjectCardState(card, { locked, collapsed }) {
        if (!card) return;
        if (locked !== undefined) {
            card.dataset.locked = String(this.toBoolean(locked));
        }
        if (collapsed !== undefined) {
            card.dataset.collapsed = String(this.toBoolean(collapsed));
        }

        this.applyCardLockState(card);
        this.applyCardCollapseState(card);

        const collapseBtn = card.querySelector('[data-object-action="collapse"]');
        if (collapseBtn) {
            this.updateCollapseButtonLabel(card, collapseBtn);
        }

        const lockBtn = card.querySelector('[data-object-action="lock"]');
        if (lockBtn) {
            this.updateLockButtonLabel(card, lockBtn);
        }

        this.updateObjectStateIndicators(card);
    }

    applyCardLockState(card) {
        if (!card) return;
        const locked = card.dataset.locked === 'true';
        const inputs = card.querySelectorAll('[data-object-field]');
        inputs.forEach(input => {
            if (input.dataset.objectField === 'objectId') {
                if (locked) {
                    input.dataset.lockPrevReadonly = input.readOnly ? 'true' : 'false';
                    input.readOnly = true;
                } else {
                    if (input.dataset.lockPrevReadonly !== undefined) {
                        input.readOnly = input.dataset.lockPrevReadonly === 'true';
                        delete input.dataset.lockPrevReadonly;
                    }
                }
            } else {
                if (locked) {
                    input.dataset.lockPrevDisabled = input.disabled ? 'true' : 'false';
                    input.disabled = true;
                } else {
                    if (input.dataset.lockPrevDisabled !== undefined) {
                        input.disabled = input.dataset.lockPrevDisabled === 'true';
                        delete input.dataset.lockPrevDisabled;
                    }
                }
            }
        });

        const duplicateBtn = card.querySelector('[data-object-action="duplicate"]');
        if (duplicateBtn) {
            duplicateBtn.disabled = false;
        }
    }

    applyCardCollapseState(card) {
        if (!card) return;
        const collapsed = card.dataset.collapsed === 'true';
        const body = card.querySelector('.object-card__body');
        if (body) {
            body.style.display = collapsed ? 'none' : '';
        }
    }

    updateCollapseButtonLabel(card, button) {
        if (!button || !card) return;
        const collapsed = card.dataset.collapsed === 'true';
        button.textContent = collapsed ? 'Expand' : 'Collapse';
    }

    updateLockButtonLabel(card, button) {
        if (!button || !card) return;
        const locked = card.dataset.locked === 'true';
        button.textContent = locked ? 'Unlock' : 'Lock';
    }

    updateObjectStateIndicators(card) {
        if (!card) return;
        const container = card.querySelector('[data-object-state-indicators]');
        if (!container) return;

        const locked = card.dataset.locked === 'true';
        const collapsed = card.dataset.collapsed === 'true';

        container.innerHTML = '';

        const activeStates = [];
        if (locked) {
            activeStates.push('locked');
        }
        if (collapsed) {
            activeStates.push('collapsed');
        }

        if (activeStates.length === 0) {
            container.dataset.empty = 'true';
            container.style.display = 'none';
            return;
        }

        container.dataset.empty = 'false';
        container.style.display = '';

        activeStates.forEach(stateKey => {
            const badge = document.createElement('span');
            badge.className = 'object-state-badge';
            badge.dataset.state = stateKey;
            const label = this.getObjectStateLabel(stateKey);
            badge.textContent = label;
            container.appendChild(badge);
        });
    }

    renderHighlightTagPreview(card, parsedTags = null) {
        if (!card) return;
        const preview = card.querySelector('[data-object-highlight-preview]');
        if (!preview) return;

        let tags = Array.isArray(parsedTags) ? parsedTags : null;
        if (!tags) {
            const input = card.querySelector('[data-object-field="highlightTags"]');
            const value = input && typeof input.value === 'string' ? input.value : '';
            tags = this.parseHighlightTagsInput(value);
        }

        preview.innerHTML = '';

        if (!tags || tags.length === 0) {
            preview.dataset.empty = 'true';
            return;
        }

        preview.dataset.empty = 'false';

        tags.forEach(entry => {
            if (!entry || typeof entry.tag !== 'string') return;
            const chip = document.createElement('span');
            chip.className = 'highlight-tag-chip';

            const paletteEntry = this.resolveHighlightTagPaletteEntry(entry.tag);
            const label = paletteEntry && paletteEntry.label
                ? paletteEntry.label
                : this.humanizeValue(entry.tag);
            chip.textContent = label;

            const color = entry.color || (paletteEntry && paletteEntry.color) || null;
            if (color) {
                chip.style.setProperty('--chip-color', color);
            } else {
                chip.style.removeProperty('--chip-color');
            }

            chip.title = color ? `${entry.tag} (${color})` : entry.tag;
            preview.appendChild(chip);
        });
    }

    generateObjectId() {
        const prefix = (this.objectConfig && this.objectConfig.idPrefix) || 'obj';
        this.objectIdCounter += 1;
        return `${prefix}-${this.objectIdCounter}`;
    }

    registerExistingObjectId(objectId) {
        if (typeof objectId !== 'string') return;
        const prefix = (this.objectConfig && this.objectConfig.idPrefix) || 'obj';
        const match = objectId.match(new RegExp(`^${prefix}-(\\d+)$`));
        if (!match) return;
        const numeric = Number(match[1]);
        if (!Number.isNaN(numeric) && numeric > this.objectIdCounter) {
            this.objectIdCounter = numeric;
        }
    }

    transformObjectFormData(formData) {
        if (!formData) return null;

        const objectId = typeof formData.objectId === 'string' ? formData.objectId.trim() : '';
        if (!objectId) {
            return null;
        }

        const characteristics = this.parseDelimitedList(formData.characteristics);
        const highlightTags = this.parseHighlightTagsInput(formData.highlightTags);
        const interactions = this.parseDelimitedList(formData.interactions);
        const description = typeof formData.description === 'string' ? formData.description.trim() : '';
        const interactionNotes = typeof formData.interactionNotes === 'string' ? formData.interactionNotes.trim() : '';
        const position = typeof formData.position === 'string' ? formData.position.trim() : '';
        const material = typeof formData.material === 'string' ? formData.material.trim() : '';
        const structure = typeof formData.structure === 'string' ? formData.structure.trim() : '';
        const texture = typeof formData.texture === 'string' ? formData.texture.trim() : '';

        const additional = {
            weight: formData.weight || this.objectDefaults.weight,
            priority: formData.priority || this.objectDefaults.priority,
            scale: formData.scale || this.objectDefaults.scale,
            position,
            material,
            structure,
            texture,
            importance: this.parseNumber(formData.importance, Number(this.objectDefaults.importance) || 50),
            interaction_notes: interactionNotes
        };

        const result = {
            id: objectId,
            description,
            characteristics,
            highlight_tags: highlightTags,
            additional_object_settings: additional,
            states: {
                locked: this.toBoolean(formData.locked),
                collapsed: this.toBoolean(formData.collapsed)
            }
        };

        if (interactions.length) {
            result.relations = {
                interacts_with: interactions
            };
        }

        if (!this.hasObjectContent(result)) {
            return null;
        }

        return this.cleanupObjectData(result);
    }

    hasObjectContent(data) {
        if (!data) return false;

        const descriptionFilled = Boolean(data.description);
        const characteristicsFilled = Array.isArray(data.characteristics) && data.characteristics.length > 0;
        const highlightFilled = Array.isArray(data.highlight_tags) && data.highlight_tags.length > 0;
        const additional = data.additional_object_settings || {};
        const additionalFilled = Boolean(
            additional.position ||
            additional.material ||
            additional.structure ||
            additional.texture ||
            additional.interaction_notes
        );

        return descriptionFilled || characteristicsFilled || highlightFilled || additionalFilled;
    }

    cleanupObjectData(data) {
        const cleaned = { ...data };

        if (!cleaned.description) {
            delete cleaned.description;
        }

        if (!Array.isArray(cleaned.characteristics) || cleaned.characteristics.length === 0) {
            delete cleaned.characteristics;
        }

        if (!Array.isArray(cleaned.highlight_tags) || cleaned.highlight_tags.length === 0) {
            delete cleaned.highlight_tags;
        }

        if (cleaned.relations && (!cleaned.relations.interacts_with || cleaned.relations.interacts_with.length === 0)) {
            delete cleaned.relations;
        }

        if (cleaned.states && cleaned.states.locked === false && cleaned.states.collapsed === false) {
            delete cleaned.states;
        }

        const additional = { ...(cleaned.additional_object_settings || {}) };
        if (!additional.position) delete additional.position;
        if (!additional.material) delete additional.material;
        if (!additional.structure) delete additional.structure;
        if (!additional.texture) delete additional.texture;
        if (!additional.interaction_notes) delete additional.interaction_notes;
        if (typeof additional.importance !== 'number' || Number.isNaN(additional.importance)) {
            delete additional.importance;
        }

        cleaned.additional_object_settings = additional;
        if (Object.keys(cleaned.additional_object_settings).length === 0) {
            delete cleaned.additional_object_settings;
        }

        return cleaned;
    }

    formatAdditionalObjectPrompt(obj) {
        if (!obj || typeof obj !== 'object') return '';

        const segments = [];

        if (obj.id) {
            segments.push(`[${obj.id}]`);
        }

        if (obj.description) {
            segments.push(obj.description);
        }

        if (Array.isArray(obj.characteristics) && obj.characteristics.length > 0) {
            segments.push(`traits: ${obj.characteristics.join(', ')}`);
        }

        const additional = obj.additional_object_settings || {};
        if (additional.priority) {
            segments.push(`priority: ${additional.priority}`);
        }
        if (additional.weight) {
            segments.push(`weight: ${additional.weight}`);
        }
        if (additional.scale) {
            segments.push(`scale: ${additional.scale}`);
        }
        if (additional.position) {
            segments.push(`position: ${additional.position}`);
        }
        if (additional.material) {
            segments.push(`material: ${additional.material}`);
        }
        if (additional.structure) {
            segments.push(`structure: ${additional.structure}`);
        }
        if (additional.texture) {
            segments.push(`texture: ${additional.texture}`);
        }
        if (typeof additional.importance === 'number' && !Number.isNaN(additional.importance)) {
            segments.push(`importance: ${additional.importance}`);
        }
        if (additional.interaction_notes) {
            segments.push(`interaction notes: ${additional.interaction_notes}`);
        }

        if (Array.isArray(obj.highlight_tags) && obj.highlight_tags.length > 0) {
            const tags = obj.highlight_tags.map(tag => {
                if (!tag) return null;
                if (typeof tag === 'string') {
                    const paletteMatch = this.resolveHighlightTagPaletteEntry(tag);
                    const label = paletteMatch && paletteMatch.label ? paletteMatch.label : this.humanizeValue(tag);
                    const color = paletteMatch && paletteMatch.color ? paletteMatch.color : null;
                    return color ? `${label} (${color})` : label;
                }
                const rawLabel = tag.tag || tag.key || tag.label || tag.name;
                if (!rawLabel) return null;
                const paletteMatch = this.resolveHighlightTagPaletteEntry(rawLabel);
                const displayLabel = paletteMatch && paletteMatch.label ? paletteMatch.label : this.humanizeValue(rawLabel);
                const color = tag.color || (paletteMatch && paletteMatch.color) || null;
                return color ? `${displayLabel} (${color})` : displayLabel;
            }).filter(Boolean);
            if (tags.length) {
                segments.push(`highlight tags: ${tags.join(', ')}`);
            }
        }

        if (obj.relations && Array.isArray(obj.relations.interacts_with) && obj.relations.interacts_with.length > 0) {
            segments.push(`interacts with: ${obj.relations.interacts_with.join(', ')}`);
        }

        if (obj.states && (obj.states.locked || obj.states.collapsed)) {
            const stateFlags = [];
            if (obj.states.locked) stateFlags.push(this.getObjectStateLabel('locked'));
            if (obj.states.collapsed) stateFlags.push(this.getObjectStateLabel('collapsed'));
            const cleanFlags = stateFlags.filter(Boolean);
            if (cleanFlags.length) {
                segments.push(`state: ${cleanFlags.join(', ')}`);
            }
        }

        return segments.join('; ');
    }

    parseDelimitedList(value) {
        if (!value || typeof value !== 'string') return [];
        return value
            .split(',')
            .map(token => token.trim())
            .filter(Boolean);
    }

    parseHighlightTagsInput(value) {
        if (!value || typeof value !== 'string') return [];
        return value
            .split(',')
            .map(token => token.trim())
            .filter(Boolean)
            .map(entry => {
                const [rawTag, color] = entry.split(':').map(part => part.trim());
                if (!rawTag) return null;
                const paletteMatch = this.resolveHighlightTagPaletteEntry(rawTag);
                const canonicalTag = paletteMatch && paletteMatch.key ? paletteMatch.key : rawTag;
                const resolvedColor = color || (paletteMatch ? paletteMatch.color : undefined);
                return {
                    tag: canonicalTag,
                    color: resolvedColor || undefined
                };
            })
            .filter(Boolean);
    }

    formatHighlightTagsForInput(tags) {
        if (!Array.isArray(tags) || tags.length === 0) return '';
        return tags
            .map(entry => {
                if (!entry) return null;
                if (typeof entry === 'string') {
                    return entry;
                }
                const tag = entry.tag || entry.key || entry.label || entry.name;
                if (!tag) return null;
                return entry.color ? `${tag}:${entry.color}` : tag;
            })
            .filter(Boolean)
            .join(', ');
    }

    parseNumber(value, fallback) {
        const numeric = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(numeric)) {
            return typeof fallback === 'number' && !Number.isNaN(fallback) ? fallback : 0;
        }
        return numeric;
    }

    toBoolean(value) {
        if (typeof value === 'boolean') {
            return value;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim().toLowerCase();
            if (trimmed === 'true') return true;
            if (trimmed === 'false') return false;
        }
        return Boolean(value);
    }

    hasFormObjectContent(formData) {
        if (!formData) return false;

        const descriptionFilled = typeof formData.description === 'string' && formData.description.trim().length > 0;
        const characteristicsFilled = this.parseDelimitedList(formData.characteristics).length > 0;
        const highlightFilled = this.parseDelimitedList(formData.highlightTags).length > 0;
        const interactionsFilled = this.parseDelimitedList(formData.interactions).length > 0;

        const positionFilled = typeof formData.position === 'string' && formData.position.trim().length > 0;
        const materialFilled = typeof formData.material === 'string' && formData.material.trim().length > 0;
        const structureFilled = typeof formData.structure === 'string' && formData.structure.trim().length > 0;
        const textureFilled = typeof formData.texture === 'string' && formData.texture.trim().length > 0;
        const notesFilled = typeof formData.interactionNotes === 'string' && formData.interactionNotes.trim().length > 0;

        return (
            descriptionFilled ||
            characteristicsFilled ||
            highlightFilled ||
            interactionsFilled ||
            positionFilled ||
            materialFilled ||
            structureFilled ||
            textureFilled ||
            notesFilled
        );
    }

    collectObjects() {
        if (!this.objectsContainer) return [];

        const cards = Array.from(this.objectsContainer.querySelectorAll('[data-object-card]'));
        return cards
            .map(card => this.transformObjectFormData(this.getObjectCardFormValues(card)))
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
            const objectsDescriptions = data.additional_objects
                .map(obj => this.formatAdditionalObjectPrompt(obj))
                .filter(Boolean);

            if (objectsDescriptions.length > 0) {
                promptParts.push(`Additional objects: ${objectsDescriptions.join(' | ')}.`);
            }
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
        const normalized = this.normalizePersistedObject(obj);
        if (!this.hasFormObjectContent(normalized)) {
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

        this.objectIdCounter = 0;

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
