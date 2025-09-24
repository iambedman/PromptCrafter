const promptConfig = {
  version: '0.1.0',
  storage: {
    key: 'nanobana:state:v2',
    schemaVersion: 2,
    autosaveDebounceMs: 750,
    historyLimit: 5,
    migrate: function migrateStoragePayload(payload = {}, targetVersion) {
      if (!payload || typeof payload !== 'object') {
        return null;
      }

      const migrateSnapshot = (snapshot) => {
        if (!snapshot || typeof snapshot !== 'object') return snapshot;
        if (!Array.isArray(snapshot.objects)) return snapshot;

        const ensureArray = (value) => {
          if (Array.isArray(value)) return value;
          if (!value) return [];
          if (typeof value === 'string') {
            return value
              .split(',')
              .map((part) => part.trim())
              .filter(Boolean);
          }
          return [];
        };

        const migratedObjects = snapshot.objects.map((obj, index) => {
          if (!obj || typeof obj !== 'object') return obj;

          // Already in the new format
          if (
            typeof obj.priority === 'string' ||
            typeof obj.weight === 'string' ||
            typeof obj.highlightTags === 'string'
          ) {
            return obj;
          }

          const characteristics = ensureArray(obj.characteristics).join(', ');
          const highlightTags = ensureArray(obj.style_tags || obj.styleTags).join(', ');

          return {
            objectId: obj.objectId || obj.id || `legacy-${index + 1}`,
            description: obj.description || '',
            characteristics,
            priority: 'primary',
            weight: 'balanced',
            scale: obj.scale || 'medium',
            position: obj.position || '',
            importance: '50',
            material: obj.material || '',
            structure: obj.structure || '',
            texture: obj.texture || '',
            highlightTags,
            interactions: '',
            interactionNotes: obj.interactionNotes || '',
            locked: false,
            collapsed: false,
          };
        });

        return { ...snapshot, objects: migratedObjects };
      };

      const migratedPayload = { ...payload };
      if (payload.data) {
        migratedPayload.data = migrateSnapshot(payload.data);
      }

      if (Array.isArray(payload.history)) {
        migratedPayload.history = payload.history.map((item) => {
          if (!item || typeof item !== 'object') return item;
          if (!item.data) return item;
          return { ...item, data: migrateSnapshot(item.data) };
        });
      }

      migratedPayload.schemaVersion = targetVersion || payload.schemaVersion;
      return migratedPayload;
    },
  },
  fieldOrder: [
    'task',
    'style',
    'camera',
    'lighting',
    'composition',
    'quality',
    'atmosphere',
    'objects',
    'restrictions',
    'output',
  ],
  objects: {
    idPrefix: 'obj',
    states: {
      lock: ['locked', 'unlocked'],
      collapse: ['expanded', 'collapsed'],
    },
    defaults: {
      weight: 'balanced',
      priority: 'primary',
      scale: 'medium',
      position: '',
      material: '',
      structure: '',
      texture: '',
      interactions: [],
      highlightTags: [],
      interactionNotes: '',
      importance: 50,
    },
    additionalObjectSettings: [
      {
        key: 'weight',
        type: 'select',
        label: 'Weight / Mass',
        options: ['featherlight', 'light', 'balanced', 'heavy', 'massive'],
        default: 'balanced',
        description:
          'Sets the perceived heaviness of the object so the model understands if it should feel light, grounded or massive.',
      },
      {
        key: 'priority',
        type: 'select',
        label: 'Scene Priority',
        options: ['primary', 'secondary', 'supporting', 'background'],
        default: 'primary',
        description:
          'Controls how important this object is for the composition and telling the story of the scene.',
      },
      {
        key: 'scale',
        type: 'select',
        label: 'Scale',
        options: ['micro', 'small', 'medium', 'large', 'colossal'],
        default: 'medium',
        description:
          'Defines relative size so you can call out miniature props or towering structures.',
      },
      {
        key: 'position',
        type: 'text',
        label: 'Position in Frame',
        placeholder: 'left foreground, upper third, etc.',
        description:
          'Name the placement inside the frame (rule-of-thirds, foreground/background, camera distance).',
      },
      {
        key: 'material',
        type: 'text',
        label: 'Material',
        placeholder: 'wood, chrome, holographic...',
        description:
          'List physical materials to drive reflections and shading (metal, glass, velvet, etc.).',
      },
      {
        key: 'structure',
        type: 'text',
        label: 'Structure',
        placeholder: 'layered, modular, crystalline...',
        description:
          'Describe construction style or geometry so the model understands how the object is built.',
      },
      {
        key: 'texture',
        type: 'text',
        label: 'Texture',
        placeholder: 'matte, glossy, rough...',
        description:
          'Set the surface feel (smooth, grainy, glossy) to control micro detail and specularity.',
      },
      {
        key: 'interactionNotes',
        type: 'textarea',
        label: 'Interaction Notes',
        placeholder: 'How this object interacts with others or environment',
        description:
          'Explain motion, collisions, or relationships with characters and environment cues.',
      },
      {
        key: 'importance',
        type: 'range',
        min: 0,
        max: 100,
        step: 10,
        default: 50,
        label: 'Importance Weight',
        description:
          "Fine-tunes the object's weight in prompt ranking so higher values keep it present in the final output.",
      },
      {
        key: 'highlightTags',
        type: 'tags',
        label: 'Highlight Tags',
        description: 'Comma separated tag:color pairs (e.g. focus:#ffd400)',
      },
      {
        key: 'interactions',
        type: 'tags',
        label: 'Related Objects',
        description: 'Comma separated object IDs to describe relations',
      },
    ],
    dependencies: {
      material: ['texture', 'structure'],
      scale: ['position'],
    },
    highlightTagPalette: [
      { key: 'focus', label: 'Фокус', color: '#FFCF33' },
      { key: 'danger', label: 'Опасность', color: '#FF5F56' },
      { key: 'support', label: 'Поддержка', color: '#4CAF50' },
      { key: 'accent', label: 'Акцент', color: '#8E44AD' },
    ],
  },
  styles: {
    professional_photo: {
      key: 'professional_photo',
      label: 'Professional Photo',
      category: 'photography',
      substyles: [
        { key: 'portrait', label: 'Portrait', defaultPreset: 'studio_portrait' },
        { key: 'editorial', label: 'Editorial Fashion', defaultPreset: 'studio_portrait' },
        { key: 'commercial', label: 'Commercial Product', defaultPreset: 'studio_portrait' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'camera',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['objects', 'restrictions'],
        enableFields: ['backgroundBlur', 'contrast', 'sharpness'],
        hideFields: ['abstractType', 'cartoonType'],
        presetGroups: ['photography'],
      },
      defaults: {
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
        colorScheme: 'Natural',
        contrast: '50',
        sharpness: '50',
        backgroundBlur: false,
      },
      hints: {
        summary:
          'Use for polished photography with controlled lighting and depth of field.',
        taskDescription:
          'Describe subject, mood, and desired camera feel (e.g., lens, aperture).',
        objectGuidance:
          'Keep additional objects minimal and describe distance from camera.',
      },
    },
    cinematic_photo: {
      key: 'cinematic_photo',
      label: 'Cinematic Photography',
      category: 'photography',
      substyles: [
        { key: 'neo_noir', label: 'Neo Noir', defaultPreset: 'neon_cinematic' },
        { key: 'sci_fi', label: 'Sci-Fi Thriller', defaultPreset: 'neon_cinematic' },
        { key: 'period_piece', label: 'Period Drama', defaultPreset: 'neon_cinematic' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'camera',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['objects'],
        enableFields: ['backgroundBlur', 'contrast', 'sharpness', 'noiseReduction'],
        hideFields: ['abstractType', 'cartoonType'],
        presetGroups: ['photography'],
        autoset: { temperature: 'Cold' },
      },
      defaults: {
        iso: '800',
        aperture: 'f/1.8',
        shutterSpeed: '1/125',
        focalLength: '35mm',
        lightType: 'Directional',
        lightingScheme: 'Rembrandt',
        colorScheme: 'Saturated',
        contrast: '70',
        sharpness: '60',
        backgroundBlur: true,
      },
      hints: {
        summary: 'For storytelling frames with dramatic contrast and lighting.',
        atmosphere: 'Pair with rain, fog, or neon glow for genre cues.',
      },
    },
    documentary_photo: {
      key: 'documentary_photo',
      label: 'Documentary Photography',
      category: 'photography',
      substyles: [
        { key: 'street', label: 'Street Life', defaultPreset: 'street_documentary' },
        { key: 'photojournalism', label: 'Photojournalism', defaultPreset: 'street_documentary' },
        { key: 'lifestyle', label: 'Lifestyle Reportage' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'camera',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['objects'],
        disableFields: ['backgroundBlur'],
        hideFields: ['abstractType', 'cartoonType'],
        presetGroups: ['photography'],
      },
      defaults: {
        iso: '800',
        aperture: 'f/4',
        shutterSpeed: '1/500',
        focalLength: '35mm',
        colorScheme: 'Muted',
        contrast: '55',
        sharpness: '50',
      },
      hints: {
        summary: 'Use for natural, unstaged moments with realistic lighting.',
        taskDescription: 'Explain location, subject activity, and atmosphere to capture.',
      },
    },
    fantasy_art: {
      key: 'fantasy_art',
      label: 'Fantasy Illustration',
      category: 'illustration',
      substyles: [
        { key: 'epic', label: 'Epic Fantasy', defaultPreset: 'ethereal_fantasy' },
        { key: 'storybook', label: 'Storybook Tale', defaultPreset: 'ethereal_fantasy' },
        { key: 'dark_fantasy', label: 'Dark Fantasy', defaultPreset: 'ethereal_fantasy' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['camera'],
        disableFields: [
          'backgroundBlur',
          'iso',
          'aperture',
          'shutterSpeed',
          'focalLength',
        ],
        enableFields: ['atmosphereNotes'],
        presetGroups: ['illustration'],
      },
      defaults: {
        temperature: 'Warm',
        colorScheme: 'Saturated',
        detailLevel: 'High',
      },
      hints: {
        summary: 'Story-driven illustrations with rich atmosphere and world-building.',
        objectGuidance:
          'Describe creatures, props, or magical effects with relative positions.',
        atmosphere: 'Consider mist, aurora, or magical particle effects.',
      },
    },
    science_fiction: {
      key: 'science_fiction',
      label: 'Science Fiction',
      category: 'illustration',
      substyles: [
        { key: 'cyberpunk', label: 'Cyberpunk', defaultPreset: 'cyberpunk_city' },
        { key: 'space_opera', label: 'Space Opera' },
        { key: 'retro_future', label: 'Retro Futurism' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['camera'],
        disableFields: ['backgroundBlur'],
        enableFields: ['lightingScheme', 'atmosphereNotes'],
        presetGroups: ['illustration'],
      },
      defaults: {
        temperature: 'Cold',
        colorScheme: 'Saturated',
        detailLevel: 'High',
      },
      hints: {
        summary: 'Futuristic scenes with technological motifs and bold lighting.',
      },
    },
    dark_noir: {
      key: 'dark_noir',
      label: 'Dark Noir',
      category: 'illustration',
      substyles: [
        { key: 'classic_noir', label: 'Classic Noir', defaultPreset: 'noir_mystery' },
        { key: 'neo_noir', label: 'Neo Noir' },
        { key: 'detective', label: 'Detective Mystery' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'restrictions',
          'output',
        ],
        collapseSections: ['camera'],
        disableFields: ['backgroundBlur'],
        enableFields: ['contrast'],
        presetGroups: ['illustration'],
        autoset: { colorScheme: 'Monochrome' },
      },
      defaults: {
        contrast: '75',
        detailLevel: 'High',
      },
      hints: {
        summary: 'High-contrast scenes with dramatic light and shadow play.',
      },
    },
    watercolor: {
      key: 'watercolor',
      label: 'Watercolor Painting',
      category: 'painterly',
      substyles: [
        { key: 'storybook', label: 'Storybook', defaultPreset: 'storybook_watercolor' },
        { key: 'landscape', label: 'Landscape Wash' },
        { key: 'botanical', label: 'Botanical Study' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'quality', 'atmosphere', 'objects', 'output'],
        collapseSections: ['lighting', 'composition', 'restrictions', 'camera'],
        disableFields: ['sharpness', 'backgroundBlur', 'iso', 'aperture'],
        enableFields: ['atmosphereNotes'],
        presetGroups: ['painterly'],
      },
      defaults: {
        detailLevel: 'Medium',
        colorScheme: 'Natural',
      },
      hints: {
        summary:
          'Soft washes and gentle gradients. Emphasize mood instead of technical camera data.',
      },
    },
    oil_painting: {
      key: 'oil_painting',
      label: 'Oil Painting',
      category: 'painterly',
      substyles: [
        { key: 'renaissance', label: 'Renaissance', defaultPreset: 'renaissance_oil' },
        { key: 'baroque', label: 'Baroque' },
        { key: 'impressionist', label: 'Impressionist' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'lighting',
          'composition',
          'quality',
          'atmosphere',
          'objects',
          'output',
        ],
        collapseSections: ['camera', 'restrictions'],
        disableFields: ['backgroundBlur', 'iso', 'aperture'],
        enableFields: ['lightingScheme'],
        presetGroups: ['painterly'],
      },
      defaults: {
        detailLevel: 'High',
        temperature: 'Warm',
      },
      hints: {
        summary:
          'Painterly textures with controlled lighting; suggest brushwork and palette.',
      },
    },
    sketch_graphite: {
      key: 'sketch_graphite',
      label: 'Graphite Sketch',
      category: 'painterly',
      substyles: [
        { key: 'concept_sketch', label: 'Concept Sketch', defaultPreset: 'graphite_sketch' },
        { key: 'architectural', label: 'Architectural Plan' },
        { key: 'figure_study', label: 'Figure Study' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'composition', 'objects', 'output'],
        collapseSections: ['lighting', 'quality', 'atmosphere', 'camera', 'restrictions'],
        disableFields: ['colorScheme', 'sharpness', 'backgroundBlur'],
        presetGroups: ['painterly'],
      },
      defaults: {
        detailLevel: 'Medium',
      },
      hints: {
        summary: 'Line-focused sketches; emphasize materials and reference imagery.',
      },
    },
    abstract: {
      key: 'abstract',
      label: 'Abstractionism',
      category: 'stylized',
      substyles: [
        { key: 'geometric', label: 'Geometric' },
        { key: 'organic', label: 'Organic' },
        { key: 'surreal', label: 'Surreal' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'objects', 'quality', 'output'],
        collapseSections: ['camera', 'lighting', 'composition', 'atmosphere', 'restrictions'],
        disableFields: ['sharpness', 'backgroundBlur', 'iso', 'aperture'],
        presetGroups: ['stylized'],
      },
      defaults: {
        detailLevel: 'High',
      },
      hints: {
        summary: 'Non-representational composition; describe shapes, motion, and palettes.',
      },
    },
    cartoon: {
      key: 'cartoon',
      label: 'Cartoon Style',
      category: 'stylized',
      substyles: [
        { key: 'classic', label: 'Classic Animation', defaultPreset: 'anime_adventure' },
        { key: 'anime', label: 'Anime Inspired', defaultPreset: 'anime_adventure' },
        { key: '3d_render', label: '3D Render', defaultPreset: 'anime_adventure' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'quality', 'objects', 'lighting', 'output'],
        collapseSections: ['camera', 'composition', 'restrictions'],
        disableFields: ['iso', 'aperture', 'shutterSpeed', 'focalLength'],
        enableFields: ['backgroundBlur'],
        presetGroups: ['stylized'],
      },
      defaults: {
        detailLevel: 'High',
        colorScheme: 'Saturated',
      },
      hints: {
        summary: 'Bold shapes and outlines; specify character expressions and color palettes.',
      },
    },
    anime_style: {
      key: 'anime_style',
      label: 'Anime Style',
      category: 'stylized',
      substyles: [
        { key: 'shonen', label: 'Shōnen Action', defaultPreset: 'anime_adventure' },
        { key: 'shojo', label: 'Shōjo Drama' },
        { key: 'cinematic_anime', label: 'Cinematic Anime' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'lighting', 'quality', 'atmosphere', 'objects', 'output'],
        collapseSections: ['camera', 'restrictions'],
        disableFields: ['iso', 'aperture', 'shutterSpeed', 'focalLength'],
        presetGroups: ['stylized'],
      },
      defaults: {
        colorScheme: 'Saturated',
        detailLevel: 'High',
      },
      hints: {
        summary: 'Expressive anime scenes; describe energy, motion, and framing cues.',
      },
    },
    pixel_art: {
      key: 'pixel_art',
      label: 'Pixel Art',
      category: 'stylized',
      substyles: [
        { key: '8bit', label: '8-bit Retro', defaultPreset: 'retro_pixel' },
        { key: '16bit', label: '16-bit SNES' },
        { key: 'temporal_dithered', label: 'Temporal Dithered' },
      ],
      dependencies: {
        enableSections: ['task', 'style', 'objects', 'quality', 'output'],
        collapseSections: [
          'camera',
          'lighting',
          'composition',
          'restrictions',
          'atmosphere',
        ],
        disableFields: ['sharpness', 'backgroundBlur', 'contrast'],
        presetGroups: ['stylized'],
      },
      defaults: {
        resolution: '1024x1024',
        detailLevel: 'Medium',
      },
      hints: {
        summary:
          'Grid-based art; note palette limits and animation cues if needed.',
      },
    },
    low_poly: {
      key: 'low_poly',
      label: 'Low Poly 3D',
      category: 'stylized',
      substyles: [
        { key: 'landscape', label: 'Landscape', defaultPreset: 'low_poly_valley' },
        { key: 'character', label: 'Character Bust' },
        { key: 'isometric', label: 'Isometric Diorama' },
      ],
      dependencies: {
        enableSections: [
          'task',
          'style',
          'lighting',
          'composition',
          'objects',
          'quality',
          'output',
        ],
        collapseSections: ['camera', 'restrictions'],
        disableFields: ['iso', 'aperture', 'shutterSpeed', 'focalLength'],
        presetGroups: ['stylized'],
      },
      defaults: {
        colorScheme: 'Natural',
        detailLevel: 'High',
      },
      hints: {
        summary:
          'Flat-shaded 3D scenes; describe geometry, focal object, and color plane hierarchy.',
      },
    },
  },
  presets: [
    {
      key: 'studio_portrait',
      label: 'Studio Portrait',
      style: 'professional_photo',
      substyles: ['portrait', 'editorial'],
      description: 'Soft studio lighting with shallow depth of field.',
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
        weatherCondition: 'clear',
      },
    },
    {
      key: 'dramatic_landscape',
      label: 'Dramatic Landscape',
      style: 'professional_photo',
      substyles: ['commercial'],
      description: 'High-contrast landscape with storm mood.',
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
        sharpening: true,
        weatherCondition: 'storm',
        naturalPhenomenon: 'lightning',
      },
    },
    {
      key: 'street_documentary',
      label: 'Street Documentary',
      style: 'documentary_photo',
      substyles: ['street', 'photojournalism'],
      description: 'Natural light reportage with muted tones.',
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
        weatherCondition: 'overcast',
      },
    },
    {
      key: 'neon_cinematic',
      label: 'Neon Cinematic',
      style: 'cinematic_photo',
      substyles: ['neo_noir', 'sci_fi'],
      description: 'Night-time urban scene with neon lighting.',
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
        naturalPhenomenon: 'neon_glow',
      },
    },
    {
      key: 'ethereal_fantasy',
      label: 'Ethereal Fantasy',
      style: 'fantasy_art',
      substyles: ['epic', 'storybook'],
      description: 'Dreamy fantasy world with magical ambience.',
      values: {
        weatherCondition: 'mist',
        naturalPhenomenon: 'aurora',
        atmosphereNotes: 'Soft magical glow, floating particles',
        detailLevel: 'High',
      },
    },
    {
      key: 'cyberpunk_city',
      label: 'Cyberpunk Megacity',
      style: 'science_fiction',
      substyles: ['cyberpunk'],
      description: 'Dense neon cityscape with smog.',
      values: {
        weatherCondition: 'rain',
        naturalPhenomenon: 'neon_glow',
        atmosphereNotes: 'Dense smog, holographic ads everywhere',
      },
    },
    {
      key: 'noir_mystery',
      label: 'Noir Mystery',
      style: 'dark_noir',
      substyles: ['classic_noir'],
      description: 'Fog-laden noir scene with lightning accents.',
      values: {
        weatherCondition: 'fog',
        naturalPhenomenon: 'lightning',
        atmosphereNotes: 'High-contrast shadows, cigarette smoke drifts',
        colorScheme: 'Monochrome',
      },
    },
    {
      key: 'storybook_watercolor',
      label: 'Storybook Watercolor',
      style: 'watercolor',
      substyles: ['storybook'],
      description: 'Soft watercolor illustration with gentle palette.',
      values: {
        naturalPhenomenon: 'rainbow',
        atmosphereNotes: 'Soft bleeding colors, gentle sunbeams',
        detailLevel: 'Medium',
      },
    },
    {
      key: 'renaissance_oil',
      label: 'Renaissance Oil Painting',
      style: 'oil_painting',
      substyles: ['renaissance'],
      description: 'Warm golden hour lighting with detailed brushwork.',
      values: {
        weatherCondition: 'clear',
        atmosphereNotes: 'Warm golden hour lighting, rich textures',
        detailLevel: 'High',
      },
    },
    {
      key: 'retro_pixel',
      label: 'Retro Pixel Scene',
      style: 'pixel_art',
      substyles: ['8bit', '16bit'],
      description: 'Retro video game vibe with limited palette.',
      values: {
        weatherCondition: 'clear',
        naturalPhenomenon: 'shooting_stars',
        atmosphereNotes: '8-bit aesthetic with limited palette',
        resolution: '1024x1024',
      },
    },
    {
      key: 'anime_adventure',
      label: 'Anime Adventure',
      style: 'anime_style',
      substyles: ['shonen', 'cinematic_anime'],
      description: 'Dynamic anime scene with expressive lighting.',
      values: {
        weatherCondition: 'partly_cloudy',
        naturalPhenomenon: 'shooting_stars',
        atmosphereNotes: 'Dynamic motion lines, expressive lighting',
        detailLevel: 'High',
      },
    },
    {
      key: 'low_poly_valley',
      label: 'Low-Poly Valley',
      style: 'low_poly',
      substyles: ['landscape'],
      description: 'Geometric valley with flat shading.',
      values: {
        weatherCondition: 'clear',
        atmosphereNotes: 'Geometric shapes, flat shading',
      },
    },
    {
      key: 'graphite_sketch',
      label: 'Graphite Study',
      style: 'sketch_graphite',
      substyles: ['concept_sketch', 'figure_study'],
      description: 'Soft pencil strokes with visible paper texture.',
      values: {
        weatherCondition: 'overcast',
        atmosphereNotes: 'Soft pencil strokes, paper texture visible',
        colorScheme: 'Monochrome',
      },
    },
  ],
  prompt: {
    defaultLocale: 'en',
    formats: ['paragraph', 'bullet', 'markdown'],
    blocks: [
      'task',
      'style',
      'camera',
      'lighting',
      'composition',
      'objects',
      'atmosphere',
      'restrictions',
    ],
    template: [
      '{{task}}',
      '{{style}} style with {{substyle}} nuances',
      '{{#if camera}}{{cameraSettings}}{{/if}}',
      '{{#if lighting}}Lighting: {{lighting}}{{/if}}',
      '{{#if composition}}Composition: {{composition}}{{/if}}',
      '{{#if atmosphere}}Atmosphere: {{atmosphere}}{{/if}}',
      '{{#if objects}}Additional objects: {{objects}}{{/if}}',
      '{{#if restrictions}}Restrictions: {{restrictions}}{{/if}}',
    ].join('\n'),
  },
};

window.promptConfig = promptConfig;
