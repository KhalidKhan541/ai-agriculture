// ============================================================================
// AI Agriculture Platform - Pest Detection & Management Service
// Pest identification, severity assessment, treatment recommendations
// ============================================================================

import { generateText, extractJSON, type ChatMessage } from './provider';
import type {
  ProviderName,
  CropType,
  PestDetectionRequest,
  PestDetectionResult,
  PestDetection,
  PestTreatmentPlan,
  TreatmentAction,
  PreventionMeasure,
  EconomicThreshold,
  MonitoringSchedule,
  PestImage,
  PestHistoryEntry,
} from '../../types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

interface PestDetectionConfig {
  defaultProvider: ProviderName;
  fallbackProvider?: ProviderName;
  analysisTimeout: number;
  confidenceThreshold: number;
  maxImageSize: number;
  enableSeverityScoring: boolean;
}

const defaultConfig: PestDetectionConfig = {
  defaultProvider: 'openai',
  analysisTimeout: 60000,
  confidenceThreshold: 0.6,
  maxImageSize: 10 * 1024 * 1024,
  enableSeverityScoring: true,
};

let config: PestDetectionConfig = { ...defaultConfig };

export function configurePestDetection(overrides: Partial<PestDetectionConfig>): void {
  config = { ...config, ...overrides };
}

// ---------------------------------------------------------------------------
// Pest Knowledge Base
// ---------------------------------------------------------------------------

interface PestProfile {
  name: string;
  scientificName: string;
  category: 'insect' | 'mite' | 'nematode' | 'pathogen' | 'weed' | 'rodent';
  commonCrops: CropType[];
  damageTypes: string[];
  lifeStages: string[];
  seasonalActivity: string[];
  identificationFeatures: string[];
  similarSpecies: string[];
  economicThresholds: Record<CropType, number>;
  naturalEnemies: string[];
  chemicalControls: string[];
  biologicalControls: string[];
  culturalControls: string[];
}

const PEST_DATABASE: Record<string, PestProfile> = {
  aphid: {
    name: 'Aphid',
    scientificName: 'Aphidoidea spp.',
    category: 'insect',
    commonCrops: ['wheat', 'corn', 'soybean', 'cotton', 'vegetable', 'fruit'],
    damageTypes: ['leaf', 'stem'],
    lifeStages: ['nymph', 'adult', 'winged'],
    seasonalActivity: ['spring', 'summer'],
    identificationFeatures: [
      'Small (1-3mm) soft-bodied insects',
      'Pear-shaped body',
      'Found in clusters on stems and undersides of leaves',
      'May be green, black, red, or yellow',
      'Often attended by ants',
      'Excrete honeydew',
    ],
    similarSpecies: ['Whitefly', 'Mealybug', 'Psyllid'],
    economicThresholds: {
      wheat: 15,
      corn: 10,
      soybean: 250,
      cotton: 50,
      vegetable: 50,
      fruit: 20,
      tomato: 50,
      potato: 50,
    },
    naturalEnemies: ['Ladybugs', 'Lacewings', 'Parasitic wasps', 'Hoverflies'],
    chemicalControls: ['Imidacloprid', 'Thiamethoxam', 'Pyriproxyfen', 'Neem oil'],
    biologicalControls: ['Aphidius colemani', 'Aphidoletes aphidimyza', 'Beauveria bassiana'],
    culturalControls: [
      'Remove heavily infested plants',
      'Use reflective mulches',
      'Plant trap crops',
      'Avoid excessive nitrogen fertilization',
    ],
  },
  corn_borer: {
    name: 'European Corn Borer',
    scientificName: 'Ostrinia nubilalis',
    category: 'insect',
    commonCrops: ['corn', 'maize', 'sorghum', 'cotton'],
    damageTypes: ['stem', 'fruit'],
    lifeStages: ['larva', 'pupa', 'adult'],
    seasonalActivity: ['summer', 'fall'],
    identificationFeatures: [
      'Larvae: pinkish-white with dark spots along the body',
      'Adults: light brown moths with wavy lines on wings',
      'Bore into stems and ears',
      'Frass (sawdust-like material) visible at entry holes',
      'Wilting or broken stems',
    ],
    similarSpecies: ['Fall armyworm', 'Corn earworm', 'Stalk borer'],
    economicThresholds: {
      corn: 50,
      maize: 50,
      cotton: 10,
    },
    naturalEnemies: ['Trichogramma wasps', 'Cotesia marginiventris', 'Beauveria bassiana'],
    chemicalControls: ['Bt sprays', 'Chlorantraniliprole', 'Indoxacarb', 'Spinosad'],
    biologicalControls: ['Bt (Bacillus thuringiensis)', 'Trichogramma egg parasitoids'],
    culturalControls: [
      'Use Bt corn varieties',
      'Destroy crop residues after harvest',
      'Rotate crops',
      'Monitor with pheromone traps',
    ],
  },
  spider_mite: {
    name: 'Two-Spotted Spider Mite',
    scientificName: 'Tetranychus urticae',
    category: 'mite',
    commonCrops: ['corn', 'soybean', 'vegetable', 'tomato', 'fruit', 'cotton'],
    damageTypes: ['leaf'],
    lifeStages: ['egg', 'larva', 'nymph', 'adult'],
    seasonalActivity: ['summer'],
    identificationFeatures: [
      'Tiny (0.5mm) arachnids',
      'Yellow-green with two dark spots',
      'Fine webbing on leaf undersides',
      'Stippled or bronzed leaf appearance',
      'Leaf yellowing and premature drop',
    ],
    similarSpecies: ['Spider mites (other species)', 'Thrips'],
    economicThresholds: {
      corn: 30,
      soybean: 100,
      vegetable: 50,
      tomato: 30,
      cotton: 50,
      fruit: 30,
    },
    naturalEnemies: ['Predatory mites', 'Ladybugs', 'Lacewings', 'Predatory thrips'],
    chemicalControls: ['Abamectin', 'Bifenazate', 'Etoxazole', 'Hexythiazox'],
    biologicalControls: ['Phytoseiulus persimilis', 'Neoseiulus californicus', 'Stethorus punctillum'],
    culturalControls: [
      'Maintain adequate irrigation',
      'Avoid dust on plants',
      'Use overhead irrigation to wash mites off',
      'Plant cover crops to support predatory mites',
    ],
  },
  armyworm: {
    name: 'Fall Armyworm',
    scientificName: 'Spodoptera frugiperda',
    category: 'insect',
    commonCrops: ['corn', 'maize', 'rice', 'sorghum', 'soybean', 'cotton', 'vegetable'],
    damageTypes: ['leaf', 'fruit'],
    lifeStages: ['larva', 'pupa', 'adult'],
    seasonalActivity: ['summer', 'fall'],
    identificationFeatures: [
      'Larvae: dark green to brown with inverted Y on head',
      'Light-colored stripes along body',
      'Large mandibles for chewing',
      'Can consume entire leaves rapidly',
      'Massive outbreaks possible',
    ],
    similarSpecies: ['Corn earworm', 'Western corn rootworm', 'Cutworm'],
    economicThresholds: {
      corn: 30,
      maize: 30,
      rice: 20,
      soybean: 40,
      cotton: 20,
      vegetable: 20,
    },
    naturalEnemies: ['Trichogramma wasps', 'Spiders', 'Predatory beetles', 'Birds'],
    chemicalControls: ['Chlorantraniliprole', 'Indoxacarb', 'Lambda-cyhalothrin', 'Spinosad'],
    biologicalControls: ['Bt (Bacillus thuringiensis)', 'MNPV virus', 'Metarhizium anisopliae'],
    culturalControls: [
      'Plant early to avoid peak populations',
      'Use resistant varieties',
      'Conserve natural enemies',
      'Monitor with pheromone traps',
    ],
  },
  locust: {
    name: 'Desert Locust',
    scientificName: 'Schistocerca gregaria',
    category: 'insect',
    commonCrops: ['wheat', 'barley', 'corn', 'rice', 'vegetable', 'fruit', 'cotton'],
    damageTypes: ['leaf', 'stem', 'fruit'],
    lifeStages: ['nymph', 'adult'],
    seasonalActivity: ['spring', 'summer'],
    identificationFeatures: [
      'Large (6-9cm) grasshopper-like insects',
      'Green or brown depending on phase',
      'Form massive swarms',
      'Capable of flying long distances',
      'Devour all green vegetation',
    ],
    similarSpecies: ['Grasshoppers', 'Mormon cricket'],
    economicThresholds: {
      wheat: 5,
      barley: 5,
      corn: 5,
      rice: 5,
      vegetable: 5,
      fruit: 5,
      cotton: 5,
    },
    naturalEnemies: ['Birds', 'Flies (waysenii)', 'Frogs', 'Disease organisms'],
    chemicalControls: ['Malathion', 'Diazinon', 'Chlorpyrifos', 'Fipronil'],
    biologicalControls: ['Metarhizium acridum (Green Muscle)', 'Nosema locustae'],
    culturalControls: [
      'Monitor breeding areas',
      'Early warning systems',
      'Community-based monitoring',
      'Habitat management',
    ],
  },
  fruit_fly: {
    name: 'Fruit Fly',
    scientificName: 'Bactrocera dorsalis',
    category: 'insect',
    commonCrops: ['fruit', 'tomato', 'vegetable'],
    damageTypes: ['fruit'],
    lifeStages: ['egg', 'larva', 'pupa', 'adult'],
    seasonalActivity: ['spring', 'summer', 'fall'],
    identificationFeatures: [
      'Small flies (6-8mm)',
      'Yellow-brown body with dark markings',
      'Larvae tunnel into fruit',
      'Premature fruit drop',
      'Oviposition scars on fruit surface',
    ],
    similarSpecies: ['Mediterranean fruit fly', 'Oriental fruit fly', 'Apple maggot'],
    economicThresholds: {
      fruit: 5,
      tomato: 5,
      vegetable: 10,
    },
    naturalEnemies: ['Parasitic wasps', 'Predatory beetles', 'Birds'],
    chemicalControls: ['Malathion bait', 'Spinosad bait', 'Imidacloprid', 'Carbaryl'],
    biologicalControls: ['Fopius arisanus', 'Psyttalia fletcheri', 'Sterile insect technique'],
    culturalControls: [
      'Remove fallen fruit',
      'Bag developing fruit',
      'Use fruit fly traps',
      'Maintain orchard hygiene',
    ],
  },
  rust_fungus: {
    name: 'Wheat Rust',
    scientificName: 'Puccinia spp.',
    category: 'pathogen',
    commonCrops: ['wheat', 'barley', 'corn'],
    damageTypes: ['leaf'],
    lifeStages: ['urediniospore', 'teliospore', 'aeciospore'],
    seasonalActivity: ['spring', 'summer'],
    identificationFeatures: [
      'Orange-red pustules on leaves and stems',
      'Powdery spores when rubbed',
      'Yellowing and premature leaf death',
      'Can spread rapidly in favorable conditions',
    ],
    similarSpecies: ['Leaf rust', 'Stripe rust', 'Stem rust'],
    economicThresholds: {
      wheat: 5,
      barley: 5,
      corn: 10,
    },
    naturalEnemies: ['Resistance genes', 'Hyperparasites'],
    chemicalControls: ['Propiconazole', 'Tebuconazole', 'Azoxystrobin', 'Triadimefon'],
    biologicalControls: ['Trichoderma harzianum', 'Bacillus subtilis'],
    culturalControls: [
      'Plant resistant varieties',
      'Remove volunteer plants',
      'Avoid overhead irrigation',
      'Monitor early and often',
    ],
  },
  blight: {
    name: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    category: 'pathogen',
    commonCrops: ['potato', 'tomato'],
    damageTypes: ['leaf', 'stem', 'fruit'],
    lifeStages: ['zoospore', 'sporangium', 'mycelium'],
    seasonalActivity: ['spring', 'summer', 'fall'],
    identificationFeatures: [
      'Water-soaked lesions on leaves',
      'White fuzzy growth on leaf undersides',
      'Dark brown to black spots on stems',
      'Firm, brown lesions on fruit',
      'Foul smell when tissues rot',
    ],
    similarSpecies: ['Early blight', 'Bacterial spot', 'Septoria leaf spot'],
    economicThresholds: {
      potato: 2,
      tomato: 2,
    },
    naturalEnemies: ['Resistance genes', 'Competitive microorganisms'],
    chemicalControls: ['Chlorothalonil', 'Mancozeb', 'Metalaxyl', 'Dimethomorph'],
    biologicalControls: ['Bacillus subtilis', 'Trichoderma harzianum', 'Ampelomyces quisqualis'],
    culturalControls: [
      'Plant resistant varieties',
      'Ensure good air circulation',
      'Avoid overhead irrigation',
      'Destroy infected plant debris',
    ],
  },
  nematode: {
    name: 'Root-Knot Nematode',
    scientificName: 'Meloidogyne spp.',
    category: 'nematode',
    commonCrops: ['vegetable', 'tomato', 'potato', 'soybean', 'cotton'],
    damageTypes: ['root'],
    lifeStages: ['egg', 'juvenile', 'adult'],
    seasonalActivity: ['spring', 'summer'],
    identificationFeatures: [
      'Galls or knots on roots',
      'Stunted plant growth',
      'Wilting despite adequate moisture',
      'Yellowing of lower leaves',
      'Reduced yield',
    ],
    similarSpecies: ['Other nematode species', 'Fungal root rots'],
    economicThresholds: {
      vegetable: 10,
      tomato: 10,
      potato: 10,
      soybean: 15,
      cotton: 15,
    },
    naturalEnemies: ['Pasteuria penetrans', 'Purpureocillium lilacinum', 'Predatory nematodes'],
    chemicalControls: ['Methyl bromide (restricted)', 'Oxamyl', 'Fenamiphos', 'Fluopyram'],
    biologicalControls: ['Paecilomyces lilacinus', 'Bacillus firmus', 'Myrothecium verrucaria'],
    culturalControls: [
      'Crop rotation with non-hosts',
      'Use resistant varieties',
      'Solarize soil',
      'Add organic matter',
    ],
  },
};

// ---------------------------------------------------------------------------
// Season & Location Mapping
// ---------------------------------------------------------------------------

function getSeasonalPests(
  season: string,
  cropType: CropType,
  region?: string
): string[] {
  const seasonLower = season.toLowerCase();
  return Object.entries(PEST_DATABASE)
    .filter(([, profile]) => {
      const cropMatch = profile.commonCrops.includes(cropType) || profile.commonCrops.length > 5;
      const seasonMatch = profile.seasonalActivity.includes(seasonLower);
      return cropMatch && seasonMatch;
    })
    .map(([key]) => key);
}

// ---------------------------------------------------------------------------
// AI-Powered Pest Identification
// ---------------------------------------------------------------------------

const PEST_IDENTIFICATION_SYSTEM_PROMPT = `You are an expert agricultural entomologist and plant pathologist specializing in pest identification.
You analyze crop images and field data to identify pests, assess severity, and recommend treatments.
Always provide structured JSON responses with detailed identification, severity assessment, and treatment plans.
Be specific about species identification and consider regional pest patterns.`;

interface PestAnalysisInput {
  imageData?: string;
  cropType: CropType;
  location: { latitude: number; longitude: number };
  season: string;
  previousPestHistory: PestHistoryEntry[];
  neighboringCrops: CropType[];
  soilType?: string;
  weatherConditions?: string;
  observedSymptoms: string[];
}

function buildPestIdentificationPrompt(input: PestAnalysisInput): string {
  const parts = [
    'Analyze the following data to identify pests affecting the crop:',
    '',
    `**Crop Type:** ${input.cropType}`,
    `**Location:** ${input.location.latitude}, ${input.location.longitude}`,
    `**Season:** ${input.season}`,
    `**Neighboring Crops:** ${input.neighboringCrops.join(', ') || 'none specified'}`,
    `**Observed Symptoms:** ${input.observedSymptoms.join(', ') || 'none specified'}`,
  ];

  if (input.soilType) parts.push(`**Soil Type:** ${input.soilType}`);
  if (input.weatherConditions) parts.push(`**Recent Weather:** ${input.weatherConditions}`);

  if (input.previousPestHistory.length > 0) {
    parts.push('', '**Previous Pest History:**');
    for (const entry of input.previousPestHistory.slice(-5)) {
      parts.push(
        `- ${entry.pestName} on ${new Date(entry.date).toISOString().split('T')[0]} (${entry.severity})${entry.treatment ? `, treated with ${entry.treatment}` : ''}`
      );
    }
  }

  const seasonalPests = getSeasonalPests(input.season, input.cropType);
  if (seasonalPests.length > 0) {
    parts.push('', `**Seasonal Pests to Consider:** ${seasonalPests.join(', ')}`);
  }

  parts.push(
    '',
    'Provide identification results in the following JSON format:',
    '```json',
    JSON.stringify(
      {
        detections: [
          {
            pestName: 'common name',
            scientificName: 'scientific name',
            category: 'insect|mite|nematode|pathogen|weed|rodent',
            severity: 'mild|moderate|severe|critical',
            confidence: 'number (0-1)',
            affectedAreaPercentage: 'number (0-100)',
            lifeStage: 'current life stage',
            damageType: 'leaf|root|stem|fruit|seed|vascular',
            description: 'detailed description',
            identificationFeatures: ['feature1', 'feature2'],
            similarSpecies: ['similar1', 'similar2'],
          },
        ],
        overallRisk: 'low|medium|high|critical',
        immediateActionRequired: 'boolean',
        economicImpact: 'estimated economic impact description',
        treatmentPlan: {
          immediateActions: [
            {
              name: 'action name',
              description: 'detailed description',
              type: 'chemical|biological|cultural|organic|mechanical',
              timing: 'when to apply',
              applicationRate: 'dosage',
              cost: 'number',
              effectiveness: 'number (0-1)',
              environmentalImpact: 'low|medium|high',
              safetyPrecautions: ['precaution1'],
              withholdPeriod: 'period if applicable',
            },
          ],
          shortTermActions: ['...'],
          longTermActions: ['...'],
        },
        preventionMeasures: [
          {
            measure: 'prevention measure',
            timing: 'when to implement',
            frequency: 'how often',
            effectiveness: 'number (0-1)',
            cost: 'number',
            description: 'detailed description',
          },
        ],
        monitoringSchedule: [
          {
            date: 'ISO date',
            method: 'monitoring method',
            focus: 'what to look for',
            notes: 'additional notes',
          },
        ],
        confidence: 'overall confidence (0-1)',
      },
      null,
      2
    ),
    '```',
  );

  return parts.join('\n');
}

export async function identifyPest(
  input: PestAnalysisInput,
  provider?: ProviderName
): Promise<PestDetectionResult> {
  const providerName = provider || config.defaultProvider;

  const messages: ChatMessage[] = [
    { role: 'system', content: PEST_IDENTIFICATION_SYSTEM_PROMPT },
    { role: 'user', content: buildPestIdentificationPrompt(input) },
  ];

  const response = await generateText(providerName, messages, {
    temperature: 0.2,
    maxTokens: 4096,
  });

  const result = extractJSON<Partial<PestDetectionResult>>(response);

  const detections: PestDetection[] = (result.detections || []).map((d) => ({
    pestName: d.pestName,
    commonName: d.pestName,
    scientificName: d.scientificName || '',
    category: d.category || 'insect',
    severity: d.severity || 'mild',
    confidence: d.confidence || 0.5,
    affectedAreaPercentage: d.affectedAreaPercentage || 0,
    lifeStage: d.lifeStage || 'adult',
    damageType: d.damageType || 'leaf',
    description: d.description || '',
    identificationFeatures: d.identificationFeatures || [],
    similarSpecies: d.similarSpecies || [],
  }));

  const overallRisk = determineOverallRisk(detections);
  const immediateActionRequired = detections.some(
    (d) => d.severity === 'critical' || d.severity === 'severe'
  );

  const treatmentPlan = result.treatmentPlan
    ? buildTreatmentPlan(result.treatmentPlan)
    : generateDefaultTreatmentPlan(detections, input.cropType);

  const preventionMeasures = result.preventionMeasures || generateDefaultPreventionMeasures(input.cropType);
  const monitoringSchedule = result.monitoringSchedule || generateDefaultMonitoringSchedule(input.cropType);

  const economicThreshold = calculateEconomicThreshold(detections, input.cropType);

  return {
    detections,
    overallRisk,
    immediateActionRequired,
    treatmentPlan,
    preventionMeasures,
    economicThreshold,
    generatedAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Risk Assessment Helpers
// ---------------------------------------------------------------------------

function determineOverallRisk(detections: PestDetection[]): 'low' | 'medium' | 'high' | 'critical' {
  if (detections.length === 0) return 'low';

  const hasCritical = detections.some((d) => d.severity === 'critical');
  if (hasCritical) return 'critical';

  const hasSevere = detections.some((d) => d.severity === 'severe');
  if (hasSevere) return 'high';

  const hasModerate = detections.some((d) => d.severity === 'moderate');
  if (hasModerate) return 'medium';

  return 'low';
}

function calculateEconomicThreshold(
  detections: PestDetection[],
  cropType: CropType
): EconomicThreshold {
  if (detections.length === 0) {
    return {
      pestDensity: 0,
      unit: 'per plant',
      cropValue: 0,
      treatmentCost: 0,
      actionThreshold: 'below',
      recommendation: 'No pest pressure detected. Continue monitoring.',
    };
  }

  const primaryPest = detections[0];
  const threshold = PEST_DATABASE[primaryPest.pestName.toLowerCase().replace(/\s+/g, '_')];
  const thresholdValue = threshold?.economicThresholds[cropType] || 50;

  const currentDensity = primaryPest.affectedAreaPercentage;
  const actionThreshold: EconomicThreshold['actionThreshold'] =
    currentDensity >= thresholdValue ? 'above' : currentDensity >= thresholdValue * 0.8 ? 'at' : 'below';

  return {
    pestDensity: currentDensity,
    unit: 'percent affected',
    cropValue: 0,
    treatmentCost: 0,
    actionThreshold,
    recommendation:
      actionThreshold === 'above'
        ? 'Treatment threshold exceeded. Immediate action recommended.'
        : actionThreshold === 'at'
          ? 'Approaching treatment threshold. Prepare for intervention.'
          : 'Below treatment threshold. Continue monitoring.',
  };
}

// ---------------------------------------------------------------------------
// Treatment Plan Builder
// ---------------------------------------------------------------------------

interface RawTreatmentPlan {
  immediateActions?: any[];
  shortTermActions?: any[];
  longTermActions?: any[];
  organicOptions?: any[];
  chemicalOptions?: any[];
  biologicalControls?: any[];
  estimatedTotalCost?: number;
  expectedRecoveryTime?: string;
  monitoringSchedule?: any[];
}

function buildTreatmentPlan(raw: RawTreatmentPlan): PestTreatmentPlan {
  const mapAction = (a: any): TreatmentAction => ({
    name: a.name || 'Unknown action',
    description: a.description || '',
    type: a.type || 'cultural',
    timing: a.timing || 'As needed',
    applicationRate: a.applicationRate,
    cost: typeof a.cost === 'number' ? a.cost : parseFloat(String(a.cost)) || 0,
    effectiveness: typeof a.effectiveness === 'number' ? a.effectiveness : 0.5,
    environmentalImpact: a.environmentalImpact || 'medium',
    safetyPrecautions: a.safetyPrecautions || [],
    withholdPeriod: a.withholdPeriod,
  });

  return {
    immediateActions: (raw.immediateActions || []).map(mapAction),
    shortTermActions: (raw.shortTermActions || []).map(mapAction),
    longTermActions: (raw.longTermActions || []).map(mapAction),
    organicOptions: (raw.organicOptions || []).map(mapAction),
    chemicalOptions: (raw.chemicalOptions || []).map(mapAction),
    biologicalControls: (raw.biologicalControls || []).map(mapAction),
    estimatedTotalCost: raw.estimatedTotalCost || 0,
    expectedRecoveryTime: raw.expectedRecoveryTime || '2-4 weeks',
    monitoringSchedule: raw.monitoringSchedule || [],
  };
}

function generateDefaultTreatmentPlan(
  detections: PestDetection[],
  cropType: CropType
): PestTreatmentPlan {
  const immediateActions: TreatmentAction[] = [];
  const shortTermActions: TreatmentAction[] = [];
  const longTermActions: TreatmentAction[] = [];

  for (const detection of detections) {
    const profile = PEST_DATABASE[detection.pestName.toLowerCase().replace(/\s+/g, '_')];

    if (detection.severity === 'critical' || detection.severity === 'severe') {
      immediateActions.push({
        name: `Apply targeted treatment for ${detection.commonName}`,
        description: `Apply recommended insecticide or fungicide to control ${detection.commonName} infestation`,
        type: 'chemical',
        timing: 'Immediately',
        applicationRate: 'Follow label instructions',
        cost: 150,
        effectiveness: 0.8,
        environmentalImpact: 'medium',
        safetyPrecautions: ['Wear protective equipment', 'Follow re-entry intervals', 'Avoid application during bloom'],
      });
    }

    if (profile) {
      for (const bio of profile.biologicalControls.slice(0, 2)) {
        shortTermActions.push({
          name: `Introduce ${bio}`,
          description: `Release or apply ${bio} as biological control agent`,
          type: 'biological',
          timing: 'Within 1-2 weeks',
          cost: 75,
          effectiveness: 0.6,
          environmentalImpact: 'low',
          safetyPrecautions: ['Store biologicals properly', 'Apply during optimal conditions'],
        });
      }

      for (const cultural of profile.culturalControls.slice(0, 2)) {
        longTermActions.push({
          name: cultural,
          description: cultural,
          type: 'cultural',
          timing: 'Ongoing / next season',
          cost: 50,
          effectiveness: 0.5,
          environmentalImpact: 'low',
          safetyPrecautions: [],
        });
      }
    }
  }

  return {
    immediateActions,
    shortTermActions,
    longTermActions,
    organicOptions: [
      {
        name: 'Neem Oil Application',
        description: 'Apply neem oil spray as organic pest control',
        type: 'organic',
        timing: 'Every 7-14 days',
        applicationRate: '2-5 ml/L water',
        cost: 30,
        effectiveness: 0.5,
        environmentalImpact: 'low',
        safetyPrecautions: ['Avoid application in direct sunlight', 'Test on small area first'],
      },
    ],
    chemicalOptions: immediateActions.filter((a) => a.type === 'chemical'),
    biologicalControls: shortTermActions.filter((a) => a.type === 'biological'),
    estimatedTotalCost: immediateActions.reduce((s, a) => s + a.cost, 0) +
      shortTermActions.reduce((s, a) => s + a.cost, 0),
    expectedRecoveryTime: '2-4 weeks',
    monitoringSchedule: generateDefaultMonitoringSchedule(cropType),
  };
}

function generateDefaultPreventionMeasures(cropType: CropType): PreventionMeasure[] {
  return [
    {
      measure: 'Regular field scouting',
      timing: 'Weekly during growing season',
      frequency: 'Weekly',
      effectiveness: 0.7,
      cost: 20,
      description: 'Walk fields systematically to detect pest populations early',
    },
    {
      measure: 'Pheromone trap monitoring',
      timing: 'From early season',
      frequency: 'Weekly check',
      effectiveness: 0.8,
      cost: 50,
      description: 'Deploy species-specific pheromone traps to monitor adult populations',
    },
    {
      measure: 'Crop rotation',
      timing: 'Annual planning',
      frequency: 'Annually',
      effectiveness: 0.6,
      cost: 0,
      description: 'Rotate crops to break pest life cycles and reduce soil-borne pathogens',
    },
    {
      measure: 'Sanitation and debris removal',
      timing: 'Post-harvest and pre-planting',
      frequency: 'Twice per season',
      effectiveness: 0.5,
      cost: 30,
      description: 'Remove crop residues and weeds that harbor pests',
    },
  ];
}

function generateDefaultMonitoringSchedule(cropType: CropType): MonitoringSchedule[] {
  const now = new Date();
  return [
    {
      date: new Date(now.getTime() + 7 * 86400000),
      method: 'Visual field inspection',
      focus: 'Check for new pest activity and damage signs',
      notes: 'Focus on field edges and irrigated areas',
    },
    {
      date: new Date(now.getTime() + 14 * 86400000),
      method: 'Sticky trap inspection',
      focus: 'Count and identify trapped insects',
      notes: 'Record species and numbers per trap',
    },
    {
      date: new Date(now.getTime() + 21 * 86400000),
      method: 'Comprehensive field survey',
      focus: 'Assess pest population trends and crop damage',
      notes: 'Document with photos and GPS coordinates',
    },
    {
      date: new Date(now.getTime() + 28 * 86400000),
      method: 'Treatment effectiveness evaluation',
      focus: 'Evaluate control measures and adjust if needed',
      notes: 'Compare pre- and post-treatment populations',
    },
  ];
}

// ---------------------------------------------------------------------------
// Multi-Image Batch Analysis
// ---------------------------------------------------------------------------

export async function batchDetectPests(
  requests: PestDetectionRequest[],
  concurrency: number = 3,
  provider?: ProviderName
): Promise<{ requestIndex: number; result: PestDetectionResult; error?: string }[]> {
  const results: { requestIndex: number; result: PestDetectionResult; error?: string }[] = [];
  const queue = requests.map((r, i) => ({ request: r, index: i }));

  async function processNext(): Promise<void> {
    while (queue.length > 0) {
      const item = queue.shift()!;
      try {
        const result = await identifyPest(
          {
            cropType: item.request.cropType,
            location: item.request.location,
            season: item.request.season,
            previousPestHistory: item.request.previousPestHistory || [],
            neighboringCrops: item.request.neighboringCrops || [],
            observedSymptoms: [],
          },
          provider
        );
        results.push({ requestIndex: item.index, result });
      } catch (err) {
        results.push({
          requestIndex: item.index,
          error: (err as Error).message,
          result: {
            detections: [],
            overallRisk: 'low',
            immediateActionRequired: false,
            treatmentPlan: {
              immediateActions: [],
              shortTermActions: [],
              longTermActions: [],
              organicOptions: [],
              chemicalOptions: [],
              biologicalControls: [],
              estimatedTotalCost: 0,
              expectedRecoveryTime: 'N/A',
              monitoringSchedule: [],
            },
            preventionMeasures: [],
            economicThreshold: {
              pestDensity: 0,
              unit: '',
              cropValue: 0,
              treatmentCost: 0,
              actionThreshold: 'below',
              recommendation: 'Analysis failed',
            },
            generatedAt: new Date(),
          },
        });
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, requests.length) }, () =>
    processNext()
  );
  await Promise.all(workers);

  return results.sort((a, b) => a.requestIndex - b.requestIndex);
}

// ---------------------------------------------------------------------------
// Pest Trend Analysis
// ---------------------------------------------------------------------------

export interface PestTrendAnalysis {
  pestName: string;
  trend: 'increasing' | 'stable' | 'decreasing';
  seasonality: string[];
  currentRisk: 'low' | 'medium' | 'high' | 'critical';
  historicalFrequency: number;
  prediction: {
    nextMonth: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
  };
  recommendations: string[];
}

export function analyzePestTrends(
  history: PestHistoryEntry[],
  currentSeason: string,
  cropType: CropType
): PestTrendAnalysis[] {
  const pestGroups = new Map<string, PestHistoryEntry[]>();
  for (const entry of history) {
    const existing = pestGroups.get(entry.pestName) || [];
    existing.push(entry);
    pestGroups.set(entry.pestName, existing);
  }

  const analyses: PestTrendAnalysis[] = [];

  for (const [pestName, entries] of pestGroups) {
    const sorted = [...entries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recentCount = sorted.filter(
      (e) => new Date(e.date).getTime() > Date.now() - 365 * 86400000
    ).length;

    const olderCount = sorted.filter(
      (e) =>
        new Date(e.date).getTime() <= Date.now() - 365 * 86400000 &&
        new Date(e.date).getTime() > Date.now() - 730 * 86400000
    ).length;

    let trend: PestTrendAnalysis['trend'] = 'stable';
    if (recentCount > olderCount * 1.2) trend = 'increasing';
    else if (recentCount < olderCount * 0.8) trend = 'decreasing';

    const latestSeverity = sorted[0]?.severity || 'mild';
    const currentRisk: PestTrendAnalysis['currentRisk'] =
      latestSeverity === 'severe' ? 'high' : latestSeverity === 'moderate' ? 'medium' : 'low';

    analyses.push({
      pestName,
      trend,
      seasonality: PEST_DATABASE[pestName.toLowerCase().replace(/\s+/g, '_')]?.seasonalActivity || [],
      currentRisk,
      historicalFrequency: recentCount,
      prediction: {
        nextMonth:
          trend === 'increasing' && currentRisk !== 'low' ? 'high' : currentRisk === 'high' ? 'medium' : 'low',
        confidence: Math.min(0.5 + recentCount * 0.05, 0.9),
      },
      recommendations:
        trend === 'increasing'
          ? [
              `Increase monitoring frequency for ${pestName}`,
              'Prepare treatment options proactively',
              'Check neighboring fields for source populations',
            ]
          : [
              `Continue standard monitoring for ${pestName}`,
              'Maintain current prevention measures',
            ],
    });
  }

  return analyses;
}

// ---------------------------------------------------------------------------
// Cost-Benefit Analysis
// ---------------------------------------------------------------------------

export interface CostBenefitAnalysis {
  treatmentCost: number;
  preventedLoss: number;
  netBenefit: number;
  roi: number;
  breakevenPoint: string;
  recommendation: 'treat' | 'monitor' | 'no_action';
  alternativeOptions: { name: string; cost: number; effectiveness: number; roi: number }[];
}

export function analyzeCostBenefit(
  detection: PestDetection,
  cropType: CropType,
  fieldArea: number,
  estimatedYieldValue: number
): CostBenefitAnalysis {
  const profile = PEST_DATABASE[detection.pestName.toLowerCase().replace(/\s+/g, '_')];
  const affectedValue = estimatedYieldValue * (detection.affectedAreaPercentage / 100);

  const treatmentCost = fieldArea * 75;
  const preventedLoss = affectedValue * 0.7;
  const netBenefit = preventedLoss - treatmentCost;
  const roi = treatmentCost > 0 ? netBenefit / treatmentCost : 0;

  let recommendation: CostBenefitAnalysis['recommendation'] = 'no_action';
  if (netBenefit > 0 && detection.severity !== 'mild') recommendation = 'treat';
  else if (detection.severity === 'moderate') recommendation = 'monitor';

  const alternativeOptions = [
    {
      name: 'Chemical Control',
      cost: fieldArea * 100,
      effectiveness: 0.85,
      roi: (affectedValue * 0.85 - fieldArea * 100) / (fieldArea * 100),
    },
    {
      name: 'Biological Control',
      cost: fieldArea * 60,
      effectiveness: 0.6,
      roi: (affectedValue * 0.6 - fieldArea * 60) / (fieldArea * 60),
    },
    {
      name: 'Cultural Control',
      cost: fieldArea * 30,
      effectiveness: 0.4,
      roi: (affectedValue * 0.4 - fieldArea * 30) / (fieldArea * 30),
    },
  ];

  return {
    treatmentCost,
    preventedLoss: Math.round(preventedLoss),
    netBenefit: Math.round(netBenefit),
    roi: Math.round(roi * 100) / 100,
    breakevenPoint: `${Math.ceil(treatmentCost / (affectedValue * 0.1))} days`,
    recommendation,
    alternativeOptions,
  };
}
