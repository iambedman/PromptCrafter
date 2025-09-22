// NanoBana JSON Prompt Constructor JavaScript
class NanoBanaConstructor {
    constructor() {
        this.initializeElements();
        this.initializePresets();
        this.bindEvents();
        this.setupObjectControls();
        this.handleStyleChange(this.getActiveStyle());
        this.updatePreview();
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
        this.styleGroups = document.querySelectorAll('[data-style-group]');
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
        
        // Slider value displays
        this.contrastValue = document.getElementById('contrastValue');
        this.sharpnessValue = document.getElementById('sharpnessValue');

        // Check if all elements are found
        this.validateElements();
    }

    initializePresets() {
        this.photographyStyles = new Set([
            'professional_photo',
            'cinematic_photo',
            'documentary_photo'
        ]);

        this.defaultValues = {
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

        this.presets = [
            {
                key: 'studio_portrait',
                label: 'Studio Portrait',
                mainStyle: 'professional_photo',
                values: {
                    iso: '200',
                    aperture: 'f/2.8',
                    shutterSpeed: '1/125',
                    focalLength: '85mm',
                    lightType: 'Soft',
                    lightDirection: 'Side',
                    lightingScheme: 'Rembrandt',
                    temperature: 'Warm',
                    framing: 'Portrait',
                    angle: 'Straight',
                    ruleOfThirds: true,
                    colorScheme: 'Natural',
                    contrast: '65',
                    sharpness: '55',
                    backgroundBlur: true,
                    resolution: '2048x2048',
                    detailLevel: 'High',
                    noiseReduction: true,
                    sharpening: false,
                    weatherCondition: 'clear'
                }
            },
            {
                key: 'dramatic_landscape',
                label: 'Dramatic Landscape',
                mainStyle: 'professional_photo',
                values: {
                    iso: '100',
                    aperture: 'f/8',
                    shutterSpeed: '1/60',
                    focalLength: '24mm',
                    lightType: 'Hard',
                    lightDirection: 'Backlight',
                    lightingScheme: 'Split',
                    temperature: 'Cold',
                    framing: 'Landscape',
                    angle: 'From above',
                    ruleOfThirds: true,
                    colorScheme: 'Muted',
                    contrast: '70',
                    sharpness: '60',
                    backgroundBlur: false,
                    resolution: '2048x2048',
                    detailLevel: 'Maximum',
                    noiseReduction: false,
                    sharpening: true,
                    weatherCondition: 'storm',
                    naturalPhenomenon: 'lightning'
                }
            },
            {
                key: 'street_documentary',
                label: 'Street Documentary',
                mainStyle: 'documentary_photo',
                values: {
                    iso: '800',
                    aperture: 'f/4',
                    shutterSpeed: '1/500',
                    focalLength: '35mm',
                    lightType: 'Directional',
                    lightDirection: 'Side',
                    lightingScheme: 'Loop',
                    temperature: 'Neutral',
                    framing: 'Medium shot',
                    angle: 'Straight',
                    ruleOfThirds: true,
                    colorScheme: 'Muted',
                    contrast: '55',
                    sharpness: '50',
                    backgroundBlur: false,
                    resolution: '1536x1024',
                    detailLevel: 'High',
                    noiseReduction: false,
                    sharpening: true,
                    weatherCondition: 'overcast'
                }
            },
            {
                key: 'neon_cinematic',
                label: 'Neon Cinematic',
                mainStyle: 'cinematic_photo',
                values: {
                    iso: '1600',
                    aperture: 'f/1.8',
                    shutterSpeed: '1/60',
                    focalLength: '35mm',
                    lightType: 'Directional',
                    lightDirection: 'Side',
                    lightingScheme: 'Split',
                    temperature: 'Cold',
                    framing: 'Medium shot',
                    angle: 'From below',
                    ruleOfThirds: true,
                    colorScheme: 'Saturated',
                    contrast: '75',
                    sharpness: '60',
                    backgroundBlur: true,
                    resolution: '2048x2048',
                    detailLevel: 'High',
                    noiseReduction: true,
                    sharpening: true,
                    weatherCondition: 'rain',
                    naturalPhenomenon: 'neon_glow'
                }
            },
            {
                key: 'ethereal_fantasy',
                label: 'Ethereal Fantasy',
                mainStyle: 'fantasy_art',
                values: {
                    weatherCondition: 'mist',
                    naturalPhenomenon: 'aurora',
                    atmosphereNotes: 'Soft magical glow, floating particles'
                }
            },
            {
                key: 'cyberpunk_city',
                label: 'Cyberpunk Megacity',
                mainStyle: 'science_fiction',
                values: {
                    weatherCondition: 'rain',
                    naturalPhenomenon: 'neon_glow',
                    atmosphereNotes: 'Dense smog, holographic ads everywhere'
                }
            },
            {
                key: 'noir_mystery',
                label: 'Noir Mystery',
                mainStyle: 'dark_noir',
                values: {
                    weatherCondition: 'fog',
                    naturalPhenomenon: 'lightning',
                    atmosphereNotes: 'High-contrast shadows, cigarette smoke drifts'
                }
            },
            {
                key: 'storybook_watercolor',
                label: 'Storybook Watercolor',
                mainStyle: 'watercolor',
                values: {
                    naturalPhenomenon: 'rainbow',
                    atmosphereNotes: 'Soft bleeding colors, gentle sunbeams'
                }
            },
            {
                key: 'renaissance_oil',
                label: 'Renaissance Oil Painting',
                mainStyle: 'oil_painting',
                values: {
                    weatherCondition: 'clear',
                    atmosphereNotes: 'Warm golden hour lighting, rich textures'
                }
            },
            {
                key: 'retro_pixel',
                label: 'Retro Pixel Scene',
                mainStyle: 'pixel_art',
                values: {
                    weatherCondition: 'clear',
                    naturalPhenomenon: 'shooting_stars',
                    atmosphereNotes: '8-bit aesthetic with limited palette'
                }
            },
            {
                key: 'anime_adventure',
                label: 'Anime Adventure',
                mainStyle: 'anime_style',
                values: {
                    weatherCondition: 'partly_cloudy',
                    naturalPhenomenon: 'shooting_stars',
                    atmosphereNotes: 'Dynamic motion lines, expressive lighting'
                }
            },
            {
                key: 'low_poly_valley',
                label: 'Low-Poly Valley',
                mainStyle: 'low_poly',
                values: {
                    weatherCondition: 'clear',
                    atmosphereNotes: 'Geometric shapes, flat shading'
                }
            },
            {
                key: 'graphite_sketch',
                label: 'Graphite Study',
                mainStyle: 'sketch_graphite',
                values: {
                    weatherCondition: 'overcast',
                    atmosphereNotes: 'Soft pencil strokes, paper texture visible'
                }
            }
        ];

        this.presetsByStyle = this.presets.reduce((acc, preset) => {
            if (!acc[preset.mainStyle]) {
                acc[preset.mainStyle] = [];
            }
            acc[preset.mainStyle].push(preset);
            return acc;
        }, {});

        this.presetMap = this.presets.reduce((acc, preset) => {
            acc[preset.key] = preset;
            return acc;
        }, {});
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
            'jsonOutput', 'promptOutput', 'copyBtn', 'copyPromptBtn', 'downloadBtn'
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

        if (this.styleGroups) {
            this.styleGroups.forEach(group => {
                const isActive = group.dataset.styleGroup === activeStyle;
                group.style.display = isActive ? '' : 'none';
                group.dataset.active = isActive ? 'true' : 'false';

                const controls = group.querySelectorAll('input, select, textarea, button');
                controls.forEach(control => {
                    control.disabled = !isActive;
                });
            });
        }

        this.toggleCameraSection(this.isPhotographyStyle(activeStyle));
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
            if (!this.shouldResetFieldForStyle(id, currentStyle)) return;
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

        // Trigger change events where appropriate to keep listeners informed
        const eventName = (type === 'checkbox' || tagName === 'select') ? 'change' : 'input';
        control.dispatchEvent(new Event(eventName, { bubbles: true }));
    }

    shouldResetFieldForStyle(id, currentStyle) {
        // Only reset fields relevant to the current style context
        if (this.isPhotographyStyle(currentStyle)) {
            return true;
        }

        const photoSpecificFields = new Set([
            'iso',
            'aperture',
            'shutterSpeed',
            'focalLength',
            'lightType',
            'lightDirection',
            'lightingScheme',
            'temperature',
            'colorScheme',
            'contrast',
            'sharpness',
            'backgroundBlur'
        ]);

        if (photoSpecificFields.has(id)) {
            return false;
        }

        return true;
    }

    humanizeValue(value) {
        if (typeof value !== 'string') return value;
        const text = value.replace(/_/g, ' ');
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    getStyleData() {
        const activeStyle = this.getActiveStyle();
        const styleData = {
            main_style: activeStyle,
            settings: {}
        };

        switch (activeStyle) {
            case 'professional_photo':
                styleData.settings = {
                    color_scheme: this.colorScheme ? this.colorScheme.value : 'Natural',
                    contrast: this.contrast ? parseInt(this.contrast.value, 10) : 50,
                    sharpness: this.sharpness ? parseInt(this.sharpness.value, 10) : 50,
                    background_blur: this.backgroundBlur ? this.backgroundBlur.checked : false
                };
                break;
            case 'abstract':
                styleData.settings = {
                    abstract_type: this.abstractType ? this.abstractType.value : 'geometric'
                };
                break;
            case 'cartoon':
                styleData.settings = {
                    cartoon_type: this.cartoonType ? this.cartoonType.value : 'classic'
                };
                break;
            default:
                styleData.settings = {};
        }

        return styleData;
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
            lighting: {
                type: this.lightType ? this.lightType.value : 'Soft',
                direction: this.lightDirection ? this.lightDirection.value : 'Front',
                scheme: this.lightingScheme ? this.lightingScheme.value : 'Butterfly',
                temperature: this.temperature ? this.temperature.value : 'Neutral'
            },
            composition: {
                framing: this.framing ? this.framing.value : 'Medium shot',
                angle: this.angle ? this.angle.value : 'Straight',
                rule_of_thirds: this.ruleOfThirds ? this.ruleOfThirds.checked : false
            },
            style: this.getStyleData(),
            quality: {
                resolution: this.resolution ? this.resolution.value : '1024x1024',
                detail_level: this.detailLevel ? this.detailLevel.value : 'Medium',
                noise_reduction: this.noiseReduction ? this.noiseReduction.checked : false,
                sharpening: this.sharpening ? this.sharpening.checked : false
            },
            restrictions: {
                preserve_faces: this.preserveFaces ? this.preserveFaces.checked : false,
                preserve_composition: this.preserveComposition ? this.preserveComposition.checked : false,
                no_object_addition: this.noObjectAddition ? this.noObjectAddition.checked : false,
                no_background_change: this.noBackgroundChange ? this.noBackgroundChange.checked : false,
                precise_positioning: this.precisePositioning ? this.precisePositioning.checked : false
            },
            additional_objects: this.collectObjects()
        };

        if (includeCamera) {
            jsonData.camera_settings = {
                iso: this.iso ? this.iso.value : '400',
                aperture: this.aperture ? this.aperture.value : 'f/2.8',
                shutter_speed: this.shutterSpeed ? this.shutterSpeed.value : '1/250',
                focal_length: this.focalLength ? this.focalLength.value : '50mm'
            };
        }

        const atmosphere = this.getAtmosphereData();
        if (atmosphere) {
            jsonData.atmosphere = atmosphere;
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

            if (this.promptOutput) {
                const promptText = this.generatePrompt(jsonData);
                this.promptOutput.value = promptText;
            }
        } catch (error) {
            console.error('Error generating JSON:', error);
            if (this.jsonOutput) {
                this.jsonOutput.value = `Error generating JSON:\n${error.message}`;
            }
            if (this.promptOutput) {
                this.promptOutput.value = `Error generating prompt:\n${error.message}`;
            }
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
            const jsonData = this.generateJSON();
            const formattedJSON = JSON.stringify(jsonData, null, 2);
            
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
        setTimeout(() => this.updatePreview(), 100);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing NanoBana Constructor...');
    
    try {
        const constructor = new NanoBanaConstructor();
        
        // Initialize defaults
        constructor.initializeDefaults();
        
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
