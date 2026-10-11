// Small science vocabulary used to repair common OCR slips in diagram labels
// ("Atriym" -> "Atrium", "ein" -> "Vein") and to recognise multi-line terms
// ("Pulmonary" + "Artery"). Only close, unambiguous matches are changed, and the
// UI shows every correction so the teacher can undo it.

const TERMS = `
abdomen absorption acid adipose air alveolus alveoli amoeba anaphase anther antibody anus aorta aortic apex appendix aqueous
artery arteries ash atmosphere atom atrium auditory axon bacteria basal battery bile bladder blood bone brain branch bronchus bronchi
bud bulb calyx canal capillary carbon cardiac carpel cartilage cell cellulose central centriole centrioles centrosome cerebellum cerebrum
chamber chimney chlorophyll chloroplast choroid chromatin chromosome cilia ciliary circuit cloud cochlea cold condensation cone conjunctiva
connective core cornea cortex crater crown crust cuticle cytoplasm cytoskeleton dendrite dentin dentine dermis diaphragm digestive
duct ear eardrum earth egg electron embryo enamel endoplasmic envelope enzyme epidermis epiglottis erosion esophagus eustachian evaporation
external eye fat fiber fibre filament filaments flagellum flow flower follicle fovea free fumarole gall gland glucose golgi granum gum
hair hammer heart helix humor humour incus inferior inner intermediate intestine iris joint kidney lamella large larynx lava layer leaf
left lens lever ligament lipid liver lobe lumen lung lymph lysosome macula magma main malleus mantle mantle matrix medulla membrane
microtubule microtubules middle mitochondria mitochondrion mitral molecule motor mouth mucus muscle nail nasal nerve nervous neuron neutron
nuclear nucleolus nucleus optic organ organelle outer ovary ovule oxygen pancreas papilla pedicel pelvis pericardium peroxisome petal
pharynx phloem photosynthesis pinna pistil plant plasma plate pollen pore precipitation primary proton pulley pulmonary pulp pupil
receptacle rectum red resistor respiratory retina reticulum ribosome ribosomes right rock rocks root roots rough runoff saliva sclera
secondary secretory semicircular sensory sepal shell skin skull small smooth soil solidified spinal spleen stamen stapes stem stigma
stirrup stomach stomata storage style subcutaneous superior surface sweat tendon thorax thylakoid tissue tongue tooth trachea tricuspid
tube tympanic upper ureter urethra uterus vacuole valve vascular vein veins vena cava ventricle vertebra vesicle vesicles vessel villi
vitreous volcanic volcano water wall xylem zone bomb cone inactive active lithosphere asthenosphere outer inner geyser groundwater
infiltration transpiration ocean sea river lake glacier snow ice sun planet mercury venus mars jupiter saturn uranus neptune moon orbit
gland sebaceous erector pili arrector hypodermis corpuscle meissner pacinian blood vessels root canal periodontal ligament cementum
apparatus actin endothelium cristae intermembrane space outer inner dna rna atp synthase granules
cochlear vestibular tympanic ciliary humour vitreous suspensory hyaloid macula disc uvea choroid perianth corolla microsporangium nectary floral axis
starch grain tonoplast thylakoid plasmodesmata filamentous cytoskeleton membranous amyloplast body particles
posterior anterior auricle lobule malleus semicircular pinna enamel dentin pulp gingiva crown neck periodontium
`.split(/\s+/).filter(Boolean);

export const PHRASES = [
  'superior vena cava', 'inferior vena cava', 'pulmonary artery', 'pulmonary vein', 'pulmonary valve', 'aortic valve',
  'mitral valve', 'tricuspid valve', 'left atrium', 'right atrium', 'left ventricle', 'right ventricle',
  'plasma membrane', 'cell membrane', 'cell wall', 'nuclear envelope', 'nuclear pore', 'rough endoplasmic reticulum',
  'smooth endoplasmic reticulum', 'golgi apparatus', 'golgi vesicles', 'free ribosomes', 'secretory vesicle',
  'intermediate filaments', 'actin filaments', 'central vacuole', 'optic nerve', 'vitreous humor', 'aqueous humor',
  'ear canal', 'auditory nerve', 'eustachian tube', 'semicircular canals', 'magma chamber', 'main chimney', 'secondary cone',
  'lava flow', 'ash layer', 'volcanic bomb', 'volcanic ash cloud', 'inner core', 'outer core', 'upper mantle', 'lower mantle',
  'root canal', 'blood vessels', 'sweat gland', 'hair follicle', 'sebaceous gland', 'starch grain', 'thylakoid membrane',
  'inner membrane', 'outer membrane', 'posterior chamber', 'anterior chamber', 'cell wall', 'golgi body',
];

const SET = new Set(TERMS);
const STOP = new Set(`of the and or with in on to a an by for at from into its is new north south east west northern southern
eastern western mature young old australia wales queensland victoria tasmania territory capital map state states area region
city town country line point side top bottom front back high low long short big little first second third main other part parts
total direction light heat energy force forces mass weight load effort fulcrum distance time speed sound wave waves current voltage
switch bulb wire wires positive negative earth's planet's`.split(/\s+/));

function lev(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function matchCase(src, word) {
  if (src === src.toUpperCase() && src.length > 1) return word.toUpperCase();
  if (src[0] === src[0].toUpperCase()) return word[0].toUpperCase() + word.slice(1);
  return word;
}

// Returns { text, changed } with close OCR misspellings replaced. `conf` (0-100) is
// Tesseract's word confidence: confident words are never changed.
export function correctWord(tok, conf = 0) {
  if (conf < 90) return correctLabel(tok).text;
  // Even confident reads get a one-letter fix ("Leff" -> "Left") for longer unknown words.
  const w = tok.replace(/[^A-Za-z]/g, '').toLowerCase();
  if (w.length < 4 || SET.has(w) || STOP.has(w)) return tok;
  const out = correctLabel(tok).text;
  return lev(out.replace(/[^A-Za-z]/g, '').toLowerCase(), w, 1) <= 1 ? out : tok;
}

export function correctLabel(text) {
  let changed = false;
  const out = text.split(/(\s+)/).map((tok) => {
    const m = tok.match(/^([^A-Za-z]*)([A-Za-z]+)([^A-Za-z]*)$/);
    if (!m) return tok;
    const [, pre, word, post] = m;
    const w = word.toLowerCase();
    if (SET.has(w) || STOP.has(w) || w.length < 3) return tok;
    const max = w.length <= 5 ? 1 : 2;
    let best = null, bestD = max + 1, tie = false;
    for (const t of SET) {
      const d = lev(w, t, max);
      if (d < bestD) { best = t; bestD = d; tie = false; } else if (d === bestD && t !== best) tie = true;
    }
    if (!best || bestD > max || tie) return tok;
    changed = true;
    return pre + matchCase(word, best) + post;
  }).join('');
  return { text: out, changed };
}

// A line that is already a complete science term on its own ("Nucleus", "Nuclear pore").
export function isKnownLabel(text) {
  const t = text.toLowerCase().replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!t) return false;
  if (PHRASES.includes(t)) return true;
  const words = t.split(' ');
  // A lone modifier ("Left", "Pulmonary") is the first half of a two-line label, not a label.
  // A lone generic noun ("body", "membrane") is the second half of a two-line label.
  const MODIFIERS = ['left', 'right', 'superior', 'inferior', 'upper', 'lower', 'inner', 'outer', 'main', 'free', 'smooth', 'rough',
    'secondary', 'primary', 'pulmonary', 'nuclear', 'volcanic', 'mitral', 'aortic', 'tricuspid', 'ciliary', 'vitreous', 'aqueous',
    'tympanic', 'semicircular', 'cochlear', 'vestibular', 'auditory', 'external', 'internal', 'posterior', 'anterior', 'suspensory',
    'optic', 'central', 'cell', 'plasma', 'blood', 'sweat', 'hair', 'root', 'golgi', 'endoplasmic', 'secretory', 'intermediate', 'magma', 'ash', 'lava'];
  const GENERIC = ['body', 'canal', 'nerve', 'membrane', 'chamber', 'humour', 'humor', 'layer', 'cone', 'tube', 'gland', 'vessel', 'vessels',
    'wall', 'cavity', 'window', 'duct', 'fiber', 'fibre', 'plate', 'cloud', 'flow', 'reticulum', 'filaments', 'vesicle', 'vesicles', 'apparatus', 'disc', 'space'];
  if (words.length === 1 && (MODIFIERS.includes(words[0]) || GENERIC.includes(words[0]))) return false;
  return words.length <= 4 && words.every((w) => SET.has(w));
}

// Whole-label repair against known multi-word terms ("Leff Atrium" -> "Left Atrium"),
// where a single word is ambiguous ("Leff" is one letter from both "left" and "leaf").
export function correctPhrase(text) {
  const t = text.toLowerCase().replace(/\s+/g, ' ').trim();
  if (PHRASES.includes(t)) return text;
  let best = null, bestD = 99, tie = false;
  for (const ph of PHRASES) {
    const max = ph.length <= 12 ? 1 : 2;
    const d = lev(t, ph, max);
    if (d > max) continue;
    if (d < bestD) { best = ph; bestD = d; tie = false; } else if (d === bestD && ph !== best) tie = true;
  }
  if (!best || tie) return text;
  // Keep the original's capitalisation style word by word.
  const src = text.trim().split(/\s+/), out = best.split(' ');
  if (src.length !== out.length) return text;
  return out.map((w, i) => matchCase(src[i], w)).join(' ');
}

export function isPhrase(text) {
  return PHRASES.includes(text.toLowerCase().replace(/\s+/g, ' ').trim());
}
