export interface KBArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string[];
  keyTakeaways?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface KBCategory {
  id: string;
  name: string;
  description: string;
  iconName: string;
  articles: KBArticle[];
}

export const KNOWLEDGE_BASE_DATA: KBCategory[] = [
  {
    id: 'architecture',
    name: 'Platform & AI Architecture',
    description: 'Core intelligence engine, Gemini model orchestration, server proxy and cloud security.',
    iconName: 'Sparkles',
    articles: [
      {
        id: 'gemini-orchestration',
        category: 'Platform & AI Architecture',
        title: 'Dual-Engine Intelligence & Gemini Model Routing',
        summary: 'How JewelMind AI routes multi-modal requests between Google Gemini 2.5 Pro and Gemini 2.5 Flash.',
        content: [
          'JewelMind AI utilizes a tiered AI architecture powered by the Google GenAI SDK (@google/genai). Client queries are classified by complexity, intent, and modality before execution.',
          '1. Gemini 2.5 Flash: Serves fast interactive recommendations, quick style matching, occasion pairing, and conversational inquiries requiring sub-second response times.',
          '2. Gemini 2.5 Pro: Engaged for deep bespoke gemstone analysis, complex metallurgical assessments, custom jewelry design generation, and multi-variable estate valuation reports.',
          'All requests are proxied securely through the Express server at /api/ai-run. This prevents client-side exposure of API keys and enforces strict payload validation with Zod schemas.'
        ],
        keyTakeaways: [
          'Sub-second responses powered by Gemini 2.5 Flash for browsing and live chat.',
          'Deep gemological reasoning powered by Gemini 2.5 Pro for custom commissions.',
          'Server-side proxy guarantees zero client-side credential exposure.',
          'Audit trail logged automatically to Firestore ai_runs table.'
        ],
        tableData: {
          headers: ['Capability', 'Primary Model', 'Target Latency', 'Typical Use Case'],
          rows: [
            ['Style Recommendations', 'gemini-2.5-flash', '< 800ms', 'Occasion pairing, quiz matching'],
            ['Bespoke CAD & Design', 'gemini-2.5-pro', '< 2.5s', 'Custom bridal setting, 3D descriptions'],
            ['Optical Analysis', 'gemini-2.5-pro', '< 3.0s', 'Light return, fire, inclusion mapping'],
            ['Conversational Concierge', 'gemini-2.5-flash', '< 600ms', 'Client care, care instructions']
          ]
        }
      },
      {
        id: 'security-rls',
        category: 'Platform & AI Architecture',
        title: 'Data Privacy, RLS & Firestore Vault Architecture',
        summary: 'Enterprise-grade user data separation and cryptographic cloud persistence.',
        content: [
          'Client collections, custom wishlists, private AI consultations, and style profiles are stored in Google Cloud Firestore with Row Level Security (RLS).',
          'Every document in the jewellery_records and ai_runs collections is strictly keyed and validated against the authenticated user UID (request.auth.uid == resource.data.userId).',
          'Even in multi-tenant environments, no client or unauthorized party can query or inspect records belonging to another connoisseur.',
          'Sessions are cached locally in protected storage for seamless offline and low-connectivity luxury boutique experiences.'
        ],
        keyTakeaways: [
          'Strict Firestore security rules enforce per-user document isolation.',
          'Zero shared data between luxury collectors.',
          'Audit logging records all generated advisory queries.',
          'Instant synchronization across desktop, tablet, and mobile devices.'
        ]
      }
    ]
  },
  {
    id: 'gemology',
    name: 'Diamond & Gemstone Science',
    description: 'The 4Cs, optical physics, refractive indexes, and laboratory vs natural certifications.',
    iconName: 'Diamond',
    articles: [
      {
        id: 'diamond-4cs',
        category: 'Diamond & Gemstone Science',
        title: 'The Master Guide to the 4Cs of Diamonds',
        summary: 'Scientific breakdown of Cut, Color, Clarity, and Carat Weight.',
        content: [
          'Cut: The most critical C for brilliance. Cut determines how efficiently light enters the diamond, reflects between internal facets, and returns to the observer as white light (brilliance) and rainbow flashes (fire). Graded from Excellent to Poor.',
          'Color: Graded on the GIA D-to-Z scale. D, E, and F represent colorless diamonds with zero tint. G through J offer exceptional value with near-invisible warmth. Beyond Z, stones enter the Fancy Colored classification (Canary Yellow, Pink, Blue).',
          'Clarity: Measures internal characteristics (inclusions like crystals and feathers) and surface blemishes. FL/IF diamonds are internally flawless under 10x magnification. VVS1-VVS2 and VS1-VS2 are eye-clean, offering peerless optical purity.',
          'Carat: A unit of metric mass equal to 200 milligrams (0.20 grams). Carat weight should always be balanced against cut proportions; a shallow or deep cut can look smaller than its actual carat rating.'
        ],
        keyTakeaways: [
          'Prioritize Cut over Carat weight for maximum fire and sparkle.',
          'VS1 and VS2 diamonds provide indistinguishable visual beauty from Flawless stones at substantial value.',
          'Always inspect the Certificate from internationally recognized laboratories (GIA, IGI, AGS).'
        ],
        tableData: {
          headers: ['Grade Category', 'Color (GIA)', 'Clarity (GIA)', 'Visual Characteristics'],
          rows: [
            ['Flawless Collection', 'D - E', 'FL - VVS1', 'Museum grade, 100% optical perfection'],
            ['Connoisseur Choice', 'F - G', 'VVS2 - VS1', 'Completely eye-clean, radiant light return'],
            ['Smart Luxury', 'H - I', 'VS2 - SI1', 'Exceptional brilliance, optimal value point'],
            ['Vintage / Warm', 'J - M', 'SI2', 'Noticeable warm tone, suited for Yellow Gold']
          ]
        }
      },
      {
        id: 'colored-gemstones',
        category: 'Diamond & Gemstone Science',
        title: 'Colored Gemstone Physics & Optical Properties',
        summary: 'Comparative analysis of Sapphires, Emeralds, Rubies, and Tanzanite.',
        content: [
          'Colored gemstones are judged by the three dimensions of color: Hue (the base color), Tone (the lightness or darkness), and Saturation (the vividness or purity of color).',
          'Corundum (Sapphire & Ruby): Rated 9.0 on the Mohs scale, second only to diamond. Characterized by high durability, vitreous luster, and refractive index of 1.762-1.770.',
          'Beryl (Emerald): Rated 7.5-8.0 on the Mohs scale. Emeralds naturally host complex internal patterns known as "jardin" (garden). Colombian and Zambian origins produce vivid chromium and vanadium hues.',
          'Pleochroism & Optical Phenomena: Stones like Tanzanite and Alexandrite exhibit distinct colors when viewed from different crystallographic axes under shifting light temperatures.'
        ],
        keyTakeaways: [
          'Color saturation and hue purity account for up to 70% of a colored gemstone value.',
          'Untreated (unheated) natural sapphires and rubies command significant investment premiums.',
          'Emeralds require protective bezel or micro-prong settings due to inherent crystalline inclusions.'
        ]
      }
    ]
  },
  {
    id: 'metallurgy',
    name: 'Precious Metals & Hallmarking',
    description: 'Gold alloy formulations, Platinum density, durability, and skin compatibility.',
    iconName: 'ShieldCheck',
    articles: [
      {
        id: 'gold-platinum-alloys',
        category: 'Precious Metals & Hallmarking',
        title: 'Gold Alloys, Platinum 950 & Fine Metallurgy',
        summary: 'Compositional ratios, tensile strength, and finishing techniques for fine jewelry.',
        content: [
          '18k Gold (750 Fine): Consists of 75% pure gold alloyed with 25% complementary metals to ensure scratch resistance and structural durability while retaining rich luster.',
          '18k Yellow Gold: 75% Fine Gold, 12.5% Fine Silver, 12.5% Copper. Provides the timeless, royal warm golden luster.',
          '18k Rose Gold (Crown Gold): 75% Fine Gold, 20% Copper, 5% Fine Silver. The heightened copper ratio creates the coveted blush pink tone.',
          '18k White Gold: 75% Fine Gold alloyed with Palladium, Nickel, or Silver, finished with micro-plated Rhodium for an ultra-reflective mirror sheen.',
          '950 Platinum: 95% pure platinum alloyed with 5% Ruthenium or Cobalt. 60% denser than 14k gold, naturally hypoallergenic, and develops a prestigious satin patina over decades without wearing away.'
        ],
        keyTakeaways: [
          '18k gold offers the optimal balance of purity and daily durability.',
          '950 Platinum never changes color and holds gemstones with maximum structural tenacity.',
          'Rhodium plating on white gold should be refreshed every 18-24 months for optimal mirror shine.'
        ],
        tableData: {
          headers: ['Metal Type', 'Purity', 'Density (g/cm³)', 'Hypoallergenic', 'Recommended Occasion'],
          rows: [
            ['18k Yellow Gold', '75.0%', '15.5', 'High', 'Weddings, Heritage, Daily Luxury'],
            ['18k Rose Gold', '75.0%', '15.2', 'High', 'Contemporary, Romantic Gifts'],
            ['18k White Gold', '75.0%', '15.4', 'Medium-High', 'Solitaire Rings, Diamond Pave'],
            ['950 Platinum', '95.0%', '21.4', '100% Inert', 'Bridal Sets, Investment Heirloom']
          ]
        }
      }
    ]
  },
  {
    id: 'tryon',
    name: 'Virtual Try-On & Computer Vision',
    description: 'AR landmark estimation, focal length compensation, and perspective mapping.',
    iconName: 'Eye',
    articles: [
      {
        id: 'vto-landmarks',
        category: 'Virtual Try-On & Computer Vision',
        title: 'Virtual Try-On Studio (VTO) Calibration Guide',
        summary: 'How landmark detection and canvas perspective engines render jewellery on live models.',
        content: [
          'JewelMind AI features an interactive Virtual Try-On Studio powered by HTML5 Canvas and responsive viewport calibration.',
          'Key landmark anchors: Chest/collarbone vectoring for pendant suspension, earlobe baseline coordinates for drop earrings, finger joint scaling for rings, and wrist circumference calibration for tennis bracelets.',
          'Ambient Light Blending: The studio applies subtle highlights and shadows relative to the user uploaded reference portrait, ensuring the gemstone facets appear naturally integrated rather than digitally pasted.',
          'Calibration controls allow collectors to adjust scaling, X/Y offset, and rotation angle to match exact posture and physique.'
        ],
        keyTakeaways: [
          'Best results achieved with clean, well-lit portrait photos facing forward.',
          'Use the zoom and rotation slider controls to fine-tune placement on neckline or earlobes.',
          'Instant side-by-side comparison across yellow gold, platinum, and rose gold variants.'
        ]
      }
    ]
  },
  {
    id: 'styling',
    name: 'Occasions & Curated Styling Rules',
    description: 'High jewelry etiquette, bridal layering, gala accessorizing, and quiet luxury.',
    iconName: 'Compass',
    articles: [
      {
        id: 'occasion-matrix',
        category: 'Occasions & Curated Styling Rules',
        title: 'High Jewellery Dress Codes & Etiquette',
        summary: 'Curating the ideal jewellery suite for Galas, Weddings, Cocktails, and Daily Elegance.',
        content: [
          'Black Tie & Royal Gala: Call for a focal statement piece—either an architectural necklace or high-impact chandelier earrings—paired with subdued secondary accents to avoid optical competition.',
          'Bridal & Ceremony: The jewellery should complement the gown neckline. V-necklines pair harmoniously with drop pendants; strapless or sweetheart gowns shine with collar necklaces or statement drops.',
          'Cocktail Soirée: Perfect for daring color combinations, fancy-cut gemstones (emerald cut, marquise, pear), and stacked diamond tennis bracelets.',
          'Quiet Luxury (Daily Wear): Focus on impeccable craftsmanship in miniature scale: solitaire diamond pendants, slim eternity bands, and huggie earrings in 18k yellow gold.'
        ],
        keyTakeaways: [
          'Never pair oversized chandelier earrings with a chunky collar necklace—choose one hero piece.',
          'Mix metals intentionally: pair warm gold with rose gold, or keep white gold and platinum consistent.',
          'Match gemstone color palette to gown undertones for cohesive photographic brilliance.'
        ]
      }
    ]
  }
];
