// NanoBana JSON Prompt Constructor JavaScript
class NanoBanaConstructor {
    constructor() {
        this.initializeElements();
        this.bindEvents();
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
        this.colorScheme = document.getElementById('colorScheme');
        this.contrast = document.getElementById('contrast');
        this.sharpness = document.getElementById('sharpness');
        this.backgroundBlur = document.getElementById('backgroundBlur');
        
        // Quality
        this.resolution = document.getElementById('resolution');
        this.detailLevel = document.getElementById('detailLevel');
        this.noiseReduction = document.getElementById('noiseReduction');
        this.sharpening = document.getElementById('sharpening');
        
        // Restrictions
        this.preserveFaces = document.getElementById('preserveFaces');
        this.preserveComposition = document.getElementById('preserveComposition');
        this.noObjectAddition = document.getElementById('noObjectAddition');
        this.noBackgroundChange = document.getElementById('noBackgroundChange');
        this.precisePositioning = document.getElementById('precisePositioning');
        
        // Preview elements
        this.jsonOutput = document.getElementById('jsonOutput');
        this.copyBtn = document.getElementById('copyBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        
        // Slider value displays
        this.contrastValue = document.getElementById('contrastValue');
        this.sharpnessValue = document.getElementById('sharpnessValue');

        // Check if all elements are found
        this.validateElements();
    }

    validateElements() {
        const requiredElements = [
            'taskDescription', 'iso', 'aperture', 'shutterSpeed', 'focalLength',
            'lightType', 'lightDirection', 'lightingScheme', 'temperature',
            'framing', 'angle', 'ruleOfThirds', 'colorScheme', 'contrast', 'sharpness',
            'backgroundBlur', 'resolution', 'detailLevel', 'noiseReduction', 'sharpening',
            'preserveFaces', 'preserveComposition', 'noObjectAddition', 
            'noBackgroundChange', 'precisePositioning', 'jsonOutput', 'copyBtn', 'downloadBtn'
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
            this.framing, this.angle, this.colorScheme, this.resolution, this.detailLevel
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

        if (this.downloadBtn) {
            this.downloadBtn.addEventListener('click', () => {
                console.log('Download button clicked');
                this.downloadJSON();
            });
        }
    }

    getSelectedTask() {
        const selectedRadio = document.querySelector('input[name="task"]:checked');
        return selectedRadio ? selectedRadio.value : 'Image Generation';
    }

    generateJSON() {
        const taskValue = this.getSelectedTask();
        const description = this.taskDescription ? this.taskDescription.value.trim() : '';
        const finalTask = description ? `${taskValue}: ${description}` : taskValue;

        const jsonData = {
            task: finalTask,
            camera_settings: {
                iso: this.iso ? this.iso.value : '400',
                aperture: this.aperture ? this.aperture.value : 'f/2.8',
                shutter_speed: this.shutterSpeed ? this.shutterSpeed.value : '1/250',
                focal_length: this.focalLength ? this.focalLength.value : '50mm'
            },
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
            style: {
                color_scheme: this.colorScheme ? this.colorScheme.value : 'Natural',
                contrast: this.contrast ? parseInt(this.contrast.value) : 50,
                sharpness: this.sharpness ? parseInt(this.sharpness.value) : 50,
                background_blur: this.backgroundBlur ? this.backgroundBlur.checked : false
            },
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
            }
        };

        return jsonData;
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
        } catch (error) {
            console.error('Error generating JSON:', error);
            if (this.jsonOutput) {
                this.jsonOutput.value = `Error generating JSON:\n${error.message}`;
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
