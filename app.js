/**
 * Japon 2026 – Trip Planner
 * app.js – ES Module, Firebase Firestore sync + localStorage fallback
 */

// ── Firebase imports ──────────────────────────────────────────────────────────
let firebaseApp = null;
let db = null;
let unsubscribe = null;

// ── Category emoji map ────────────────────────────────────────────────────────
const CAT_EMOJI = {
  'transport':   '🚄',
  'attraction':  '🎢',
  'repas':       '🍜',
  'shopping':    '🛍️',
  'visite':      '🏛️',
  'hébergement': '🏨',
  'activité':    '🎭',
  'off':         '😴',
  'photo':       '📸',
  'parc':        '🎡',
};

// ── Day type config ───────────────────────────────────────────────────────────
const DAY_TYPE_CONFIG = {
  arrival:   { label: 'Arrivée',               color: '#1565C0', bg: '#E3F2FD' },
  departure: { label: 'Départ',                color: '#6A1B9A', bg: '#F3E5F5' },
  highlight: { label: '⭐ Activité Principale', color: '#E65100', bg: '#FFF3E0' },
  off:       { label: '😴 Jour OFF',           color: '#424242', bg: '#F5F5F5' },
  travel:    { label: '🚄 Trajet',             color: '#00695C', bg: '#E0F2F1' },
  free:      { label: '📅 Libre',             color: '#558B2F', bg: '#F1F8E9' },
  normal:    { label: null,                    color: null,      bg: null      },
};

// ── Trip Data ─────────────────────────────────────────────────────────────────
const TRIP = {
  tokyo1: {
    label: 'Tokyo I',
    emoji: '🗼',
    dates: '10–17 Juillet',
    days: [
      {
        id: 'tok1-10',
        date: '2026-07-10',
        label: 'Vendredi 10 juillet',
        city: 'tokyo1',
        type: 'arrival',
        notes: 'Arrivée à Tokyo ! Atterrissage, récupération des bagages, transport vers l\'hôtel. Premier contact avec le Japon – jetlag à prévoir.',
        activities: [
          { id: 'a001', name: 'Vol & Arrivée Tokyo', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: true, note: 'Jour 0 – Installation' },
        ],
      },
      {
        id: 'tok1-11',
        date: '2026-07-11',
        label: 'Samedi 11 juillet',
        city: 'tokyo1',
        type: 'normal',
        notes: 'Découverte du quartier, check-in à l\'hôtel en après-midi. Premier konbini !\nSnacks 7-Eleven et exploration de Tokyo Solamachi le soir.',
        activities: [
          { id: 'a002', name: 'Check-in Hôtel', priceEur: 0, priceJpy: 0, category: 'hébergement', isPaid: false, note: '15h00' },
          { id: 'a003', name: 'Tokyo Solamachi', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: '17h00 – Centre commercial au pied de la Skytree' },
          { id: 'a004', name: 'Snacks 7-Eleven', priceEur: 5, priceJpy: 800, category: 'repas', isPaid: false, note: 'Onigiri, sando, matcha…' },
        ],
      },
      {
        id: 'tok1-12',
        date: '2026-07-12',
        label: 'Dimanche 12 juillet',
        city: 'tokyo1',
        type: 'normal',
        notes: 'Journée chargée ! Pokémon Centre le matin (7min à pied), puis Tour de Tokyo, temple Zojo-ji et Shiba Park. Shopping chez Don Quijote le soir.',
        activities: [
          { id: 'a005', name: 'Pokémon Centre', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: '7 min à pied de l\'hôtel' },
          { id: 'a006', name: 'Tour de Tokyo', priceEur: 12, priceJpy: 1800, category: 'attraction', isPaid: false, note: 'Vue panoramique sur la ville' },
          { id: 'a007', name: 'Temple Zojo-ji', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Temple bouddhiste historique' },
          { id: 'a008', name: 'Shiba Park & Maple Valley', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Parc pittoresque près de la tour' },
          { id: 'a009', name: 'Don Quijote', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Grand magasin discount – incontournable' },
        ],
      },
      {
        id: 'tok1-13',
        date: '2026-07-13',
        label: 'Lundi 13 juillet',
        city: 'tokyo1',
        type: 'highlight',
        notes: 'DisneySea ! Départ tôt pour profiter de toute la journée. Fast pass inclus dans le billet. Repas dans le parc. 48€ + 7500¥ par personne.',
        activities: [
          { id: 'a010', name: 'DisneySea Tokyo', priceEur: 90, priceJpy: 12000, category: 'parc', isPaid: true, note: '90€/pers – Fast Pass inclus – PAYÉ' },
          { id: 'a011', name: 'Repas dans le parc', priceEur: 20, priceJpy: 3000, category: 'repas', isPaid: false, note: 'Prévoir budget nourriture parc' },
        ],
      },
      {
        id: 'tok1-14',
        date: '2026-07-14',
        label: 'Mardi 14 juillet',
        city: 'tokyo1',
        type: 'normal',
        notes: 'Asakusa & culture japonaise. Temple Sensoji, street food dans la rue Nakamise (~15€). Boutiques spécialisées : couteaux japonais, épées samouraï. Location de kimono l\'après-midi. Tokyo Skytree en fin de journée (450ème étage !).',
        activities: [
          { id: 'a012', name: 'Temple Sensoji', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Asakusa – temple bouddhiste le plus visité de Tokyo' },
          { id: 'a013', name: 'Street Food Asakusa', priceEur: 15, priceJpy: 2000, category: 'repas', isPaid: false, note: 'Rue Nakamise – ningyo-yaki, ningyo…' },
          { id: 'a014', name: 'Boutique Couteaux', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Couteaux artisanaux japonais' },
          { id: 'a015', name: 'Boutique Épées Samouraï', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Répliques et authentiques' },
          { id: 'a016', name: 'Location Kimono', priceEur: 26, priceJpy: 3500, category: 'activité', isPaid: false, note: '26€+ – habillage complet inclus' },
          { id: 'a017', name: 'Tokyo Skytree', priceEur: 68, priceJpy: 9000, category: 'attraction', isPaid: false, note: '450ème étage – panorama à 450m – réserver à l\'avance' },
        ],
      },
      {
        id: 'tok1-15',
        date: '2026-07-15',
        label: 'Mercredi 15 juillet',
        city: 'tokyo1',
        type: 'highlight',
        notes: 'Excursion journée au Mont Fuji ! Départ à 8h, ramener son repas. Vue sur le Fuji-san depuis les 5ème station. Paysages inoubliables.',
        activities: [
          { id: 'a018', name: 'Excursion Mont Fuji', priceEur: 50, priceJpy: 7000, category: 'activité', isPaid: false, note: '50€/pers – départ 8h – journée complète – ramener repas' },
          { id: 'a019', name: 'Repas / Pique-nique', priceEur: 8, priceJpy: 1000, category: 'repas', isPaid: false, note: 'À préparer avant le départ' },
        ],
      },
      {
        id: 'tok1-16',
        date: '2026-07-16',
        label: 'Jeudi 16 juillet',
        city: 'tokyo1',
        type: 'off',
        notes: 'Jour OFF bien mérité ! Repos le matin. Le soir, Taito Game Station à Akihabara pour les jeux d\'arcade rétro et modernes.',
        activities: [
          { id: 'a020', name: 'Repos / Journée libre', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Récupération après le Fuji' },
          { id: 'a021', name: 'Taito Game Station Akihabara', priceEur: 10, priceJpy: 1500, category: 'activité', isPaid: false, note: 'Le soir – arcade multi-niveaux' },
          { id: 'a022', name: 'Ramen / Dîner Akihabara', priceEur: 10, priceJpy: 1200, category: 'repas', isPaid: false, note: 'Nombreux restaurants dans le quartier' },
        ],
      },
      {
        id: 'tok1-17',
        date: '2026-07-17',
        label: 'Vendredi 17 juillet',
        city: 'tokyo1',
        type: 'departure',
        notes: 'Dernier jour à Tokyo avant Osaka ! Préparation des bagages, check-out hôtel. Trajet Tokyo → Osaka en Shinkansen ou bus.',
        activities: [
          { id: 'a023', name: 'Check-out Hôtel', priceEur: 0, priceJpy: 0, category: 'hébergement', isPaid: false, note: 'Avant 11h généralement' },
          { id: 'a024', name: 'Trajet Tokyo → Osaka', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: false, note: 'Shinkansen ~2h30 ou bus nuit' },
        ],
      },
    ],
  },

  osaka: {
    label: 'Osaka',
    emoji: '🏯',
    dates: '17–23 Juillet',
    days: [
      {
        id: 'osa-17',
        date: '2026-07-17',
        label: 'Vendredi 17 juillet',
        city: 'osaka',
        type: 'arrival',
        notes: 'Arrivée à Osaka ! Installation dans l\'hôtel, découverte du quartier. Première soirée dans la ville du street food.',
        activities: [
          { id: 'a025', name: 'Arrivée Osaka', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: false, note: 'Depuis Tokyo' },
          { id: 'a026', name: 'Check-in Hôtel Osaka', priceEur: 0, priceJpy: 0, category: 'hébergement', isPaid: false, note: 'Installation' },
        ],
      },
      {
        id: 'osa-18',
        date: '2026-07-18',
        label: 'Samedi 18 juillet',
        city: 'osaka',
        type: 'highlight',
        notes: 'Universal Studios Japan ! Pass 2 jours (16300¥ = ~99€). Monde de Harry Potter, Super Nintendo World, Jurassic Park… Journée épique !',
        activities: [
          { id: 'a027', name: 'Universal Studios Japan', priceEur: 99, priceJpy: 16300, category: 'parc', isPaid: true, note: 'Pass 2 jours – 99€/16300¥ – PAYÉ' },
          { id: 'a028', name: 'Repas USJ', priceEur: 25, priceJpy: 3500, category: 'repas', isPaid: false, note: 'Nourriture dans le parc' },
        ],
      },
      {
        id: 'osa-19',
        date: '2026-07-19',
        label: 'Dimanche 19 juillet',
        city: 'osaka',
        type: 'normal',
        notes: 'Nara le matin pour voir les biches en liberté (bus 250¥). Aquarium Tempozan l\'après-midi. Legoland Discovery Center en option.',
        activities: [
          { id: 'a029', name: 'Nara – Biches en liberté', priceEur: 8, priceJpy: 730, category: 'visite', isPaid: false, note: '8€ entrée + bus 250¥ – biscuits pour biches en vente sur place' },
          { id: 'a030', name: 'Aquarium Tempozan', priceEur: 15, priceJpy: 2400, category: 'attraction', isPaid: false, note: 'Un des plus grands aquariums du Japon' },
          { id: 'a031', name: 'Legoland Discovery Center', priceEur: 12, priceJpy: 1800, category: 'attraction', isPaid: false, note: 'Optionnel – près de l\'aquarium' },
          { id: 'a032', name: 'Repas Nara / Osaka', priceEur: 12, priceJpy: 1600, category: 'repas', isPaid: false, note: 'Restauration sur place' },
        ],
      },
      {
        id: 'osa-20',
        date: '2026-07-20',
        label: 'Lundi 20 juillet',
        city: 'osaka',
        type: 'normal',
        notes: 'Journée shopping et street food ! Shinsaibashi rue commerçante, Dotonbori (bruits, néons, street food ~20€). Koromunishiba market, Pokémon Centre Daimaru, America Mura pour les friperies.',
        activities: [
          { id: 'a033', name: 'Shinsaibashi', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Grande rue commerçante couverte' },
          { id: 'a034', name: 'Dotonbori Street Food', priceEur: 20, priceJpy: 2800, category: 'repas', isPaid: false, note: 'Takoyaki, okonomiyaki, glaces mochi…' },
          { id: 'a035', name: 'Koromunishiba Market', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Marché tendance' },
          { id: 'a036', name: 'Pokémon Centre Daimaru', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Dans le grand magasin Daimaru' },
          { id: 'a037', name: 'America Mura – Friperies', priceEur: 0, priceJpy: 0, category: 'shopping', isPaid: false, note: 'Quartier vintage et streetwear' },
        ],
      },
      {
        id: 'osa-21',
        date: '2026-07-21',
        label: 'Mardi 21 juillet',
        city: 'osaka',
        type: 'highlight',
        notes: 'Direction Kyoto ! Fushimi Inari Shrine (les fameux torii rouges), Higashiyama, Kiyomizu-dera (3€), forêt de bambous d\'Arashiyama, quartier Gion geishas.',
        activities: [
          { id: 'a038', name: 'Transport Osaka → Kyoto', priceEur: 5, priceJpy: 600, category: 'transport', isPaid: false, note: 'Train JR 15 min' },
          { id: 'a039', name: 'Fushimi Inari Shrine', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: '10 000 torii rouges – départ tôt recommandé' },
          { id: 'a040', name: 'Higashiyama District', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Rues pavées historiques' },
          { id: 'a041', name: 'Kiyomizu-dera', priceEur: 3, priceJpy: 400, category: 'visite', isPaid: false, note: 'Temple sur pilotis – vue panoramique' },
          { id: 'a042', name: 'Arashiyama – Forêt Bamboo', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Bambouseraie impressionnante' },
          { id: 'a043', name: 'Quartier Gion', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Quartier des geishas – maisons de thé' },
          { id: 'a044', name: 'Repas Kyoto', priceEur: 15, priceJpy: 2000, category: 'repas', isPaid: false, note: 'Cuisine kaiseki ou ramen' },
        ],
      },
      {
        id: 'osa-22',
        date: '2026-07-22',
        label: 'Mercredi 22 juillet',
        city: 'osaka',
        type: 'off',
        notes: 'Jour OFF et séance photo Oiran ! Habillage en oiran (courtisane de l\'époque Edo) avec maquillage traditionnel. Séance 2h. Moment unique et inoubliable.',
        activities: [
          { id: 'a045', name: 'Séance Photo Oiran', priceEur: 60, priceJpy: 8000, category: 'photo', isPaid: false, note: '2h – habillage, coiffure, maquillage traditionnel inclus' },
          { id: 'a046', name: 'Journée libre Osaka', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Repos / Shopping libre' },
        ],
      },
      {
        id: 'osa-23',
        date: '2026-07-23',
        label: 'Jeudi 23 juillet',
        city: 'osaka',
        type: 'departure',
        notes: 'Dernière matinée à Osaka. Retour à Tokyo en Shinkansen pour la deuxième partie du voyage !',
        activities: [
          { id: 'a047', name: 'Check-out Hôtel Osaka', priceEur: 0, priceJpy: 0, category: 'hébergement', isPaid: false, note: 'Avant 11h' },
          { id: 'a048', name: 'Retour Tokyo (Shinkansen)', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: false, note: '~2h30 – spectaculaire le long du Fuji' },
        ],
      },
    ],
  },

  tokyo2: {
    label: 'Tokyo II',
    emoji: '🗼',
    dates: '23–30 Juillet',
    days: [
      {
        id: 'tok2-23',
        date: '2026-07-23',
        label: 'Jeudi 23 juillet',
        city: 'tokyo2',
        type: 'arrival',
        notes: 'Retour à Tokyo pour la deuxième partie ! Check-in hôtel, repos après le voyage. La ville sous un nouvel œil.',
        activities: [
          { id: 'a049', name: 'Arrivée Tokyo (retour)', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: false, note: 'Depuis Osaka' },
          { id: 'a050', name: 'Check-in Hôtel Tokyo 2', priceEur: 0, priceJpy: 0, category: 'hébergement', isPaid: false, note: 'Installation' },
        ],
      },
      {
        id: 'tok2-24',
        date: '2026-07-24',
        label: 'Vendredi 24 juillet',
        city: 'tokyo2',
        type: 'highlight',
        notes: 'Journée culturelle pop et insolite ! Temple du Chat (Gotokuji), le Godzilla de Shinjuku, Chat 3D de Shinjuku. Takeshita Street à Harajuku (fashion bizarre et kawaii). Shibuya Sky de nuit pour une vue époustouflante.',
        activities: [
          { id: 'a051', name: 'Temple du Chat (Gotokuji)', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Temple avec des centaines de chats porte-bonheur Maneki-neko' },
          { id: 'a052', name: 'Godzilla Shinjuku', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Statue Godzilla sur le toit du Toho Cinema' },
          { id: 'a053', name: 'Chat 3D Géant Shinjuku', priceEur: 0, priceJpy: 0, category: 'visite', isPaid: false, note: 'Écran 3D géant avec chat holographique' },
          { id: 'a054', name: 'Takeshita Street – Harajuku', priceEur: 10, priceJpy: 1500, category: 'shopping', isPaid: false, note: 'Mode alternative, crepe, fashion kawaii' },
          { id: 'a055', name: 'Repas Harajuku', priceEur: 12, priceJpy: 1600, category: 'repas', isPaid: false, note: 'Crepes japonaises ou ramen' },
          { id: 'a056', name: 'Shibuya Sky (de nuit)', priceEur: 18, priceJpy: 2500, category: 'attraction', isPaid: false, note: 'Toit de Shibuya Scramble Square – 230m' },
        ],
      },
      {
        id: 'tok2-25',
        date: '2026-07-25',
        label: 'Samedi 25 juillet',
        city: 'tokyo2',
        type: 'free',
        notes: 'Journée libre à planifier ! Idées : Odaiba (quartier futuriste), Teamlab Borderless, Shinjuku Omoide Yokocho (ruelle de yakitori), Kabukicho, shopping Ginza.',
        activities: [
          { id: 'a057', name: 'Journée Libre – À planifier', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Odaiba ? Teamlab ? Shinjuku ?' },
        ],
      },
      {
        id: 'tok2-26',
        date: '2026-07-26',
        label: 'Dimanche 26 juillet',
        city: 'tokyo2',
        type: 'free',
        notes: 'Journée libre. Idées : Shibuya crossing, Meiji Jingu (forêt sacrée), Daikanyama (quartier bobo), Nakameguro (canal romantique), retour à Akihabara.',
        activities: [
          { id: 'a058', name: 'Journée Libre – À planifier', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Meiji Jingu ? Nakameguro ?' },
        ],
      },
      {
        id: 'tok2-27',
        date: '2026-07-27',
        label: 'Lundi 27 juillet',
        city: 'tokyo2',
        type: 'free',
        notes: 'Journée libre. Idées : Yanaka (vieux Tokyo préservé), Ueno (musées et parc), Ikebukuro (Sunshine City, Animate, Pokémon Café), onsen public.',
        activities: [
          { id: 'a059', name: 'Journée Libre – À planifier', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Ikebukuro ? Yanaka ? Ueno ?' },
        ],
      },
      {
        id: 'tok2-28',
        date: '2026-07-28',
        label: 'Mardi 28 juillet',
        city: 'tokyo2',
        type: 'free',
        notes: 'Journée libre. Idées : Koishikawa Korakuen (jardin japonais), Tokyo Dome City, Shimokitazawa (musique live, vintage), Kapabashi (rue des ustensiles de cuisine).',
        activities: [
          { id: 'a060', name: 'Journée Libre – À planifier', priceEur: 0, priceJpy: 0, category: 'off', isPaid: false, note: 'Shimokitazawa ? Jardins ? Onsen ?' },
        ],
      },
      {
        id: 'tok2-29',
        date: '2026-07-29',
        label: 'Mercredi 29 juillet',
        city: 'tokyo2',
        type: 'free',
        notes: 'Avant-dernière journée ! Emplettes de cadeaux souvenirs, dernière visite. Dîner de clôture dans un restaurant spécial.',
        activities: [
          { id: 'a061', name: 'Shopping Souvenirs / Dernières Emplettes', priceEur: 50, priceJpy: 7000, category: 'shopping', isPaid: false, note: 'Thé, mochi, tenugui, gadgets…' },
          { id: 'a062', name: 'Dîner de clôture', priceEur: 30, priceJpy: 4000, category: 'repas', isPaid: false, note: 'Restaurant yakiniku ou kaiseki' },
        ],
      },
      {
        id: 'tok2-30',
        date: '2026-07-30',
        label: 'Jeudi 30 juillet',
        city: 'tokyo2',
        type: 'departure',
        notes: 'Dernier jour… Retour en France. Arigatou gozaimashita, Japon ! まだ来ます。',
        activities: [
          { id: 'a063', name: 'Check-out & Départ Aéroport', priceEur: 0, priceJpy: 0, category: 'transport', isPaid: false, note: 'Narita ou Haneda – prévoir 3h avant' },
        ],
      },
    ],
  },
};

// Build a flat list of all days across all cities in order
const ALL_DAYS = [
  ...TRIP.tokyo1.days,
  ...TRIP.osaka.days,
  ...TRIP.tokyo2.days,
];

// ── Build the SEED list of activities (full records) from the static TRIP ──────
// Each activity is now a self-contained record carrying its dayId so it can be
// created / deleted dynamically and synced for everyone via Firestore.
const SEED_ACTIVITIES = [];
ALL_DAYS.forEach(day => {
  day.activities.forEach((act, i) => {
    SEED_ACTIVITIES.push({
      id: act.id,
      dayId: day.id,
      name: act.name,
      priceEur: act.priceEur || 0,
      priceJpy: act.priceJpy || 0,
      category: act.category || 'visite',
      isPaid: act.isPaid === true,
      note: act.note || '',
      checked: false,
      custom: false,
      order: i,
    });
  });
});

// Valid categories for the "add" form
const CATEGORIES = ['transport', 'attraction', 'repas', 'shopping', 'visite', 'hébergement', 'activité', 'parc', 'photo', 'off'];

// ── App State ─────────────────────────────────────────────────────────────────
const state = {
  currentCity: 'tokyo1',
  currentDayIndex: 0,    // index within TRIP[currentCity].days
  activities: {},        // activityId → full activity record (single source of truth)
  isOnline: false,
  isTipsPage: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAllDaysFlat() {
  return ALL_DAYS;
}

function getCurrentDay() {
  if (state.isTipsPage) return null;
  const cityDays = TRIP[state.currentCity].days;
  return cityDays[state.currentDayIndex] || cityDays[0];
}

function getGlobalDayIndex(day) {
  return ALL_DAYS.findIndex(d => d.id === day.id);
}

function getCityForDay(day) {
  return TRIP[day.city];
}

function isActivityChecked(actId) {
  return state.activities[actId]?.checked === true;
}

// Return the activities for a given day, sorted by order then creation time
function getDayActivities(dayId) {
  return Object.values(state.activities)
    .filter(a => a && a.dayId === dayId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.createdAt ?? 0) - (b.createdAt ?? 0));
}

// Build the default state.activities map from the seed (used offline / first run)
function buildSeedState() {
  const map = {};
  SEED_ACTIVITIES.forEach(act => { map[act.id] = { ...act }; });
  return map;
}

// Strip undefined and keep only persistable fields for Firestore
function toRecord(act) {
  return {
    dayId: act.dayId,
    name: act.name,
    priceEur: act.priceEur || 0,
    priceJpy: act.priceJpy || 0,
    category: act.category || 'visite',
    isPaid: act.isPaid === true,
    note: act.note || '',
    checked: act.checked === true,
    custom: act.custom === true,
    order: act.order ?? 0,
    createdAt: act.createdAt ?? 0,
  };
}

// ── LocalStorage Persistence ──────────────────────────────────────────────────
// Stores the FULL activities map so that added / deleted activities persist
// locally when Firebase is not configured.
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('japon2026_activities_v2');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        state.activities = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }
  // No saved data → start from the seed
  state.activities = buildSeedState();
}

function saveToLocalStorage() {
  try {
    localStorage.setItem('japon2026_activities_v2', JSON.stringify(state.activities));
  } catch (e) {
    console.warn('LocalStorage write error:', e);
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Sync Status ───────────────────────────────────────────────────────────────
function updateSyncStatus(status) {
  const dot = document.getElementById('syncDot');
  const label = document.getElementById('syncLabel');
  if (!dot || !label) return;
  dot.className = 'sync-dot ' + status;
  const labels = {
    online: 'Synchronisé',
    offline: 'Hors-ligne',
    connecting: 'Connexion…',
  };
  label.textContent = labels[status] || 'Hors-ligne';
  state.isOnline = status === 'online';
}

// ── Sakura Petals ─────────────────────────────────────────────────────────────
function spawnSakura() {
  const container = document.getElementById('sakuraBg');
  if (!container) return;
  const count = window.innerWidth < 600 ? 10 : 20;
  for (let i = 0; i < count; i++) {
    const petal = document.createElement('div');
    petal.className = 'sakura-petal';
    petal.style.left = Math.random() * 100 + 'vw';
    petal.style.top = '-20px';
    const size = 6 + Math.random() * 8;
    petal.style.width = size + 'px';
    petal.style.height = size + 'px';
    const duration = 6 + Math.random() * 10;
    const delay = Math.random() * 10;
    petal.style.animationDuration = duration + 's';
    petal.style.animationDelay = delay + 's';
    const pink = Math.floor(180 + Math.random() * 60);
    petal.style.background = `rgb(255, ${pink}, ${pink})`;
    petal.style.opacity = (0.4 + Math.random() * 0.6).toString();
    container.appendChild(petal);
  }
}

// ── Budget Rendering ──────────────────────────────────────────────────────────
function renderBudget() {
  let budPaid = 0;
  let budDone = 0;
  let budTotal = 0;

  Object.values(state.activities).forEach(act => {
    if (!act) return;
    const price = act.priceEur || 0;
    budTotal += price;
    if (act.isPaid) {
      budPaid += price;
    } else if (act.checked === true) {
      budDone += price;
    }
  });

  const fmt = (n) => n > 0 ? n + ' €' : '0 €';
  const elPaid  = document.getElementById('budPaid');
  const elDone  = document.getElementById('budDone');
  const elTotal = document.getElementById('budTotal');
  if (elPaid)  elPaid.textContent  = fmt(budPaid);
  if (elDone)  elDone.textContent  = fmt(budDone);
  if (elTotal) elTotal.textContent = fmt(budTotal);
}

// ── Activity Toggle (check / uncheck) ───────────────────────────────────────────
async function toggleActivity(actId, currentValue) {
  const act = state.activities[actId];
  if (!act) return;
  const newValue = !currentValue;

  // Optimistic UI update
  act.checked = newValue;

  const checkbox = document.querySelector(`[data-act-id="${actId}"]`);
  const item = document.querySelector(`[data-activity-item="${actId}"]`);
  if (checkbox) checkbox.classList.toggle('checked', newValue);
  if (item) item.classList.toggle('done', newValue);

  renderBudget();
  renderProgressOnly();
  showToast(newValue ? '✓ Marqué comme fait !' : '↩ Marqué comme à faire');

  await persistActivity(actId, act);
}

// ── Add an activity ─────────────────────────────────────────────────────────────
async function addActivity(dayId, data) {
  const id = 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  const siblings = getDayActivities(dayId);
  const maxOrder = siblings.reduce((m, a) => Math.max(m, a.order ?? 0), 0);

  const record = {
    id,
    dayId,
    name: data.name,
    priceEur: Number(data.priceEur) || 0,
    priceJpy: Number(data.priceJpy) || 0,
    category: data.category || 'visite',
    isPaid: data.isPaid === true,
    note: data.note || '',
    checked: false,
    custom: true,
    order: maxOrder + 1,
    createdAt: Date.now(),
  };

  state.activities[id] = record;
  renderBook();
  renderBudget();
  showToast('➕ Activité ajoutée !');

  await persistActivity(id, record);
}

// ── Delete an activity ──────────────────────────────────────────────────────────
async function deleteActivity(actId) {
  const act = state.activities[actId];
  if (!act) return;
  if (!confirm(`Supprimer « ${act.name} » ?\nCette suppression sera visible par tout le groupe.`)) return;

  delete state.activities[actId];
  renderBook();
  renderBudget();
  showToast('🗑️ Activité supprimée');

  // Persist deletion
  if (db) {
    try {
      const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await deleteDoc(doc(db, 'activities', actId));
    } catch (e) {
      console.error('Firestore delete error:', e);
      saveToLocalStorage();
    }
  } else {
    saveToLocalStorage();
  }
}

// ── Persist a single activity (Firestore or localStorage) ───────────────────────
async function persistActivity(actId, act) {
  if (db) {
    try {
      const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
      await setDoc(doc(db, 'activities', actId), toRecord(act));
    } catch (e) {
      console.error('Firestore write error:', e);
      saveToLocalStorage();
    }
  } else {
    saveToLocalStorage();
  }
}

// Update just the progress bar on the left page (after a check toggle)
function renderProgressOnly() {
  if (state.isTipsPage) return;
  const day = getCurrentDay();
  if (day) renderLeftPage(day);
}

// ── Left Page Render ──────────────────────────────────────────────────────────
function renderLeftPage(day) {
  const city = TRIP[day.city];
  const typeConfig = DAY_TYPE_CONFIG[day.type] || DAY_TYPE_CONFIG.normal;

  // Progress: checked activities vs total (uses the dynamic, synced list)
  const dayActs  = getDayActivities(day.id);
  const totalActs = dayActs.length;
  const doneActs  = dayActs.filter(a => a.checked === true).length;
  const pct = totalActs > 0 ? Math.round((doneActs / totalActs) * 100) : 0;

  // Trip day number
  const globalIdx = getGlobalDayIndex(day);
  const tripDay = globalIdx + 1;
  const totalDays = ALL_DAYS.length;

  let html = `
    <div class="day-header">
      <div class="day-weekday">${day.label.split(' ').slice(0, 2).join(' ')}</div>
      <div class="day-date">${day.label.split(' ').slice(2).join(' ')}</div>
      <span class="city-badge">${city.emoji} ${city.label}</span>
    </div>
  `;

  if (typeConfig.label) {
    html += `
      <div class="day-type-banner day-type-${day.type}" style="background:${typeConfig.bg};color:${typeConfig.color};">
        ${typeConfig.label}
      </div>
    `;
  }

  if (day.notes) {
    html += `<div class="day-notes">${day.notes.replace(/\n/g, '<br>')}</div>`;
  }

  html += `
    <div class="progress-bar-wrap">
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="progress-label">${doneActs} / ${totalActs} activités • Jour ${tripDay}/${totalDays}</div>
    </div>
  `;

  const el = document.getElementById('leftContent');
  if (el) el.innerHTML = html;
}

// ── Right Page Render ─────────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderRightPage(day) {
  const acts = getDayActivities(day.id);
  let html = `<div class="activities-header">Programme du jour</div>`;

  if (acts.length === 0) {
    html += `<p class="no-activity">Aucune activité planifiée. Ajoutez-en une ci-dessous !</p>`;
  } else {
    html += `<ul class="activity-list">`;
    acts.forEach(act => {
      const checked = act.checked === true;
      const priceStr = act.priceEur > 0
        ? `<span class="act-price">${act.priceEur} €${act.priceJpy > 0 ? ' / ' + act.priceJpy.toLocaleString() + ' ¥' : ''}</span>`
        : '';
      const catEmoji = CAT_EMOJI[act.category] || '📌';
      const catStr = `<span class="act-cat">${catEmoji} ${escapeHtml(act.category)}</span>`;
      const paidStr = act.isPaid ? `<span class="act-paid-badge">✓ PAYÉ</span>` : '';
      const customStr = act.custom ? `<span class="act-custom-badge">ajouté</span>` : '';
      const noteStr = act.note ? `<div class="act-note">${escapeHtml(act.note)}</div>` : '';

      html += `
        <li class="activity-item${checked ? ' done' : ''}" data-activity-item="${act.id}">
          <div class="act-checkbox${checked ? ' checked' : ''}"
               data-act-id="${act.id}"
               role="checkbox"
               aria-checked="${checked}"
               tabindex="0"
               aria-label="Marquer : ${escapeHtml(act.name)}"></div>
          <div class="act-body">
            <div class="act-name">${escapeHtml(act.name)}</div>
            <div class="act-meta">
              ${priceStr}
              ${catStr}
              ${paidStr}
              ${customStr}
            </div>
            ${noteStr}
          </div>
          <button class="act-delete-btn" data-del-id="${act.id}" title="Supprimer" aria-label="Supprimer : ${escapeHtml(act.name)}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </li>
      `;
    });
    html += `</ul>`;
  }

  // "Add activity" button
  html += `
    <button class="add-activity-btn" data-add-day="${day.id}">
      <span class="add-icon">＋</span> Ajouter une activité
    </button>
  `;

  const el = document.getElementById('rightContent');
  if (el) el.innerHTML = html;

  // Checkbox listeners
  document.querySelectorAll('.act-checkbox[data-act-id]').forEach(cb => {
    const actId = cb.dataset.actId;
    const handler = (e) => {
      e.preventDefault();
      toggleActivity(actId, cb.classList.contains('checked'));
    };
    cb.addEventListener('click', handler);
    cb.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') handler(e);
    });
  });

  // Delete listeners
  document.querySelectorAll('.act-delete-btn[data-del-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteActivity(btn.dataset.delId);
    });
  });

  // Add-activity listener
  const addBtn = document.querySelector('.add-activity-btn[data-add-day]');
  if (addBtn) {
    addBtn.addEventListener('click', () => openAddModal(addBtn.dataset.addDay));
  }
}

// ── Tips Page Render ──────────────────────────────────────────────────────────
function renderTipsPage() {
  // Render in left content only; right content gets second column
  const leftEl  = document.getElementById('leftContent');
  const rightEl = document.getElementById('rightContent');
  if (!leftEl || !rightEl) return;

  const leftHtml = `
    <div style="font-family:'Noto Serif JP',serif;font-size:1.4rem;color:var(--red-dark);text-align:center;padding:8px 0 12px;border-bottom:2px solid var(--gold);margin-bottom:12px;">
      💡 Conseils Pratiques
      <div style="font-family:'Poppins',sans-serif;font-size:0.7rem;color:var(--ink-light);margin-top:4px;">Infos essentielles pour le Japon</div>
    </div>

    <div class="tips-section">
      <div class="tips-section-title">🎌 Coutumes & Étiquette</div>
      <ul class="tips-list">
        <li>Retirer ses chaussures avant d'entrer dans un ryokan, temple, ou maison</li>
        <li>Ne pas manger en marchant (sauf street food désignée)</li>
        <li>Se tenir à gauche dans les escalators (sauf à Osaka : à droite !)</li>
        <li>Pas de pourboire – c'est considéré comme impoli</li>
        <li>Parler doucement dans les transports en commun</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🛒 Magasins Incontournables</div>
      <ul class="tips-list">
        <li><strong>Book-Off</strong> – Livres, manga, jeux d'occasion à prix mini</li>
        <li><strong>Daiso / 100¥ Shop</strong> – Tout à 100¥, qualité surprenante</li>
        <li><strong>Penguins Shop</strong> – Accessoires et gadgets japonais</li>
        <li><strong>Boutiques thématiques Akihabara</strong> – Anime, figures, cartes</li>
        <li><strong>Uniqlo Ginza</strong> – 12 étages, collaborations exclusives</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">📦 Exonération de Taxe (Tax-Free)</div>
      <div style="font-size:0.82rem;color:var(--ink);line-height:1.6;">
        Montrez votre <strong>passeport</strong> en caisse pour obtenir l'exonération de taxe (<strong>TVA 10%</strong>) pour tout achat de <strong>plus de 5 000 ¥</strong> dans les magasins éligibles. Chercher le logo <em>Tax-Free</em>.
      </div>
    </div>
  `;

  const rightHtml = `
    <div style="font-family:'Caveat',cursive;font-size:1.6rem;color:var(--ink);border-bottom:1px solid var(--cream-dark);padding-bottom:8px;margin-bottom:12px;">Souvenirs & Anime</div>

    <div class="tips-section">
      <div class="tips-section-title">🎴 Souvenirs Animé</div>
      <ul class="tips-list">
        <li><strong>Tamashii Store</strong> – Figurines haut de gamme S.H.Figuarts, Bandai</li>
        <li><strong>Animate</strong> – Chaîne nationale manga/anime/jeux</li>
        <li><strong>Akihabara Radio Kaikan</strong> – Figurines, cartes, cosplay</li>
        <li><strong>Jump Shop</strong> – Produits dérivés Shonen Jump officiels</li>
        <li><strong>Nakamura-ya (Asakusa)</strong> – Yukata et vêtements traditionnels</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🗺️ Quartiers à Connaître</div>
      <ul class="tips-list">
        <li><strong>Akihabara</strong> – Électronique, anime, jeux, cosplay</li>
        <li><strong>Harajuku</strong> – Mode alternative, Takeshita Street</li>
        <li><strong>Shimokitazawa</strong> – Friperies, musique live, ambiance bobo</li>
        <li><strong>Shinjuku Kabukicho</strong> – Néons, vie nocturne</li>
        <li><strong>Yanaka</strong> – Vieux Tokyo authentique, cimetière, chats</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">🍜 Street Food à Goûter</div>
      <ul class="tips-list">
        <li><strong>Takoyaki</strong> – Billes de poulpe (Osaka spécialité)</li>
        <li><strong>Onigiri konbini</strong> – Riz farci, 7-Eleven / Lawson</li>
        <li><strong>Yakitori</strong> – Brochettes grillées en ruelle</li>
        <li><strong>Taiyaki</strong> – Poisson fourré à la crème / anko</li>
        <li><strong>Crepe Harajuku</strong> – Roulé avec topping insolite</li>
      </ul>
    </div>

    <div class="tips-section" style="margin-top:12px;">
      <div class="tips-section-title">💴 Paiement & Pratique</div>
      <ul class="tips-list">
        <li>Retrait au <strong>7-Eleven / Japan Post ATM</strong> – acceptent les cartes étrangères</li>
        <li>Beaucoup de petits commerces = <strong>cash uniquement</strong></li>
        <li><strong>IC Card</strong> (Suica/Pasmo) pour les transports – recharge partout</li>
        <li>Wifi : louer un <strong>pocket wifi</strong> ou eSIM depuis la France</li>
        <li>Télécharger <strong>Google Maps offline</strong> et <strong>Google Translate</strong> (appareil photo)</li>
      </ul>
    </div>
  `;

  leftEl.innerHTML  = leftHtml;
  rightEl.innerHTML = rightHtml;
}

// ── Book Render ───────────────────────────────────────────────────────────────
function renderBook() {
  if (state.isTipsPage) {
    renderTipsPage();
    document.getElementById('navDay').textContent  = 'Conseils';
    document.getElementById('navPage').textContent = 'Infos pratiques';
    return;
  }

  const day = getCurrentDay();
  if (!day) return;

  renderLeftPage(day);
  renderRightPage(day);

  const globalIdx = getGlobalDayIndex(day);
  document.getElementById('navDay').textContent  = day.label;
  document.getElementById('navPage').textContent = `Page ${globalIdx + 1} / ${ALL_DAYS.length}`;

  // Update city nav active state
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.city === state.currentCity);
  });
}

// ── Page Animation ────────────────────────────────────────────────────────────
function animatePages(direction) {
  const leftPage  = document.getElementById('leftPage');
  const rightPage = document.getElementById('rightPage');
  if (!leftPage || !rightPage) return;

  const inClass = direction === 'forward' ? 'slide-in-forward' : 'slide-in-backward';

  // Remove any existing animation classes
  leftPage.classList.remove('slide-in-forward', 'slide-in-backward');
  rightPage.classList.remove('slide-in-forward', 'slide-in-backward');

  // Force reflow
  void leftPage.offsetWidth;
  void rightPage.offsetWidth;

  leftPage.classList.add(inClass);
  rightPage.classList.add(inClass);

  setTimeout(() => {
    leftPage.classList.remove(inClass);
    rightPage.classList.remove(inClass);
  }, 400);
}

// ── Navigation ────────────────────────────────────────────────────────────────
function navigate(direction) {
  if (state.isTipsPage) {
    // From tips, go back to last day
    state.isTipsPage = false;
    animatePages(direction === 'prev' ? 'backward' : 'forward');
    renderBook();
    return;
  }

  const cityDays = TRIP[state.currentCity].days;
  const newIndex = state.currentDayIndex + (direction === 'next' ? 1 : -1);

  if (direction === 'next') {
    if (newIndex >= cityDays.length) {
      // Move to next city
      const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
      const cityIdx = cityKeys.indexOf(state.currentCity);
      if (cityIdx < cityKeys.length - 1) {
        state.currentCity = cityKeys[cityIdx + 1];
        state.currentDayIndex = 0;
        animatePages('forward');
        renderBook();
      }
    } else {
      state.currentDayIndex = newIndex;
      animatePages('forward');
      renderBook();
    }
  } else {
    if (newIndex < 0) {
      // Move to previous city
      const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
      const cityIdx = cityKeys.indexOf(state.currentCity);
      if (cityIdx > 0) {
        state.currentCity = cityKeys[cityIdx - 1];
        state.currentDayIndex = TRIP[state.currentCity].days.length - 1;
        animatePages('backward');
        renderBook();
      }
    } else {
      state.currentDayIndex = newIndex;
      animatePages('backward');
      renderBook();
    }
  }

  updateNavButtons();
}

function updateNavButtons() {
  if (state.isTipsPage) return;
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (!prevBtn || !nextBtn) return;

  const cityKeys = ['tokyo1', 'osaka', 'tokyo2'];
  const cityIdx  = cityKeys.indexOf(state.currentCity);

  const isFirst = cityIdx === 0 && state.currentDayIndex === 0;
  const lastCity = TRIP[cityKeys[cityKeys.length - 1]];
  const isLast  = cityIdx === cityKeys.length - 1 && state.currentDayIndex === lastCity.days.length - 1;

  prevBtn.disabled = isFirst;
  nextBtn.disabled = isLast;
}

function setCity(cityId) {
  if (cityId === 'tips') {
    state.isTipsPage = true;
    state.currentCity = 'tokyo1'; // reset for when we return
    document.querySelectorAll('.city-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.city === 'tips');
    });
    animatePages('forward');
    renderTipsPage();
    document.getElementById('navDay').textContent  = 'Conseils';
    document.getElementById('navPage').textContent = 'Infos pratiques';
  } else {
    state.isTipsPage = false;
    state.currentCity = cityId;
    state.currentDayIndex = 0;
    document.querySelectorAll('.city-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.city === cityId);
    });
    animatePages('forward');
    renderBook();
    updateNavButtons();
  }
}

// ── Add-Activity Modal ──────────────────────────────────────────────────────────
function injectModal() {
  if (document.getElementById('addModal')) return;
  const catOptions = CATEGORIES
    .map(c => `<option value="${c}">${CAT_EMOJI[c] || '📌'} ${c}</option>`)
    .join('');

  const modal = document.createElement('div');
  modal.className = 'add-modal';
  modal.id = 'addModal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="add-modal-backdrop" data-close-modal></div>
    <div class="add-modal-box" role="dialog" aria-modal="true" aria-label="Ajouter une activité">
      <button class="add-modal-close" data-close-modal aria-label="Fermer">✕</button>
      <h3 class="add-modal-title">➕ Nouvelle activité</h3>
      <form id="addForm" class="add-form" novalidate>
        <input type="hidden" id="addDayId" />
        <label class="add-label">Nom de l'activité *
          <input type="text" id="addName" class="add-input" required maxlength="80" placeholder="Ex : Musée Ghibli" />
        </label>
        <div class="add-row">
          <label class="add-label">Prix (€)
            <input type="number" id="addPriceEur" class="add-input" min="0" step="0.5" placeholder="0" />
          </label>
          <label class="add-label">Prix (¥)
            <input type="number" id="addPriceJpy" class="add-input" min="0" step="100" placeholder="0" />
          </label>
        </div>
        <label class="add-label">Catégorie
          <select id="addCategory" class="add-input">${catOptions}</select>
        </label>
        <label class="add-label">Note (optionnel)
          <input type="text" id="addNote" class="add-input" maxlength="120" placeholder="Horaire, adresse, détail…" />
        </label>
        <label class="add-checkbox-row">
          <input type="checkbox" id="addPaid" /> Déjà payé / réservé
        </label>
        <div class="add-actions">
          <button type="button" class="add-cancel" data-close-modal>Annuler</button>
          <button type="submit" class="add-submit">Ajouter</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Close handlers
  modal.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeAddModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeAddModal();
  });

  // Submit handler
  const form = modal.querySelector('#addForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const dayId = document.getElementById('addDayId').value;
    const name = document.getElementById('addName').value.trim();
    if (!name) {
      document.getElementById('addName').focus();
      return;
    }
    addActivity(dayId, {
      name,
      priceEur: document.getElementById('addPriceEur').value,
      priceJpy: document.getElementById('addPriceJpy').value,
      category: document.getElementById('addCategory').value,
      note: document.getElementById('addNote').value.trim(),
      isPaid: document.getElementById('addPaid').checked,
    });
    closeAddModal();
  });
}

function openAddModal(dayId) {
  const modal = document.getElementById('addModal');
  if (!modal) return;
  document.getElementById('addForm').reset();
  document.getElementById('addDayId').value = dayId;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add('show'));
  setTimeout(() => document.getElementById('addName')?.focus(), 50);
}

function closeAddModal() {
  const modal = document.getElementById('addModal');
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => { modal.hidden = true; }, 200);
}

// ── Firebase Setup ────────────────────────────────────────────────────────────
async function setupFirebase(config) {
  updateSyncStatus('connecting');
  try {
    const { initializeApp }  = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js');
    const { getFirestore, collection, doc, onSnapshot, setDoc, getDocs, writeBatch }
      = await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');

    firebaseApp = initializeApp(config);
    db = getFirestore(firebaseApp);

    // Seed if empty
    await seedDatabase(db, getDocs, collection, doc, writeBatch, setDoc);

    // Subscribe to realtime updates
    subscribeToUpdates(db, collection, onSnapshot);

    updateSyncStatus('online');
    showToast('🔥 Synchronisation Firebase active');
  } catch (e) {
    console.error('Firebase setup error:', e);
    updateSyncStatus('offline');
    db = null;
  }
}

async function seedDatabase(db, getDocs, collection, doc, writeBatch, setDoc) {
  try {
    const snap = await getDocs(collection(db, 'activities'));
    if (!snap.empty) return; // Already seeded – the cloud is the source of truth

    const batch = writeBatch(db);
    SEED_ACTIVITIES.forEach(act => {
      const ref = doc(db, 'activities', act.id);
      batch.set(ref, toRecord(act));
    });
    await batch.commit();
    console.log('Database seeded with', SEED_ACTIVITIES.length, 'activities');
  } catch (e) {
    console.error('Seed error:', e);
  }
}

function subscribeToUpdates(db, collection, onSnapshot) {
  if (unsubscribe) unsubscribe();

  unsubscribe = onSnapshot(
    collection(db, 'activities'),
    (snap) => {
      // Rebuild the whole activities map from the cloud (handles add + delete)
      const fresh = {};
      snap.forEach(docSnap => {
        fresh[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
      });
      state.activities = fresh;

      // Mirror to localStorage as an offline cache
      saveToLocalStorage();

      // Full re-render so added / deleted activities appear for everyone
      renderBudget();
      if (state.isTipsPage) {
        renderTipsPage();
      } else {
        renderBook();
      }
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      updateSyncStatus('offline');
      db = null;
    }
  );
}

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Load local state first for instant UI
  loadFromLocalStorage();

  // Setup event listeners
  document.querySelectorAll('.city-btn').forEach(btn => {
    btn.addEventListener('click', () => setCity(btn.dataset.city));
  });

  document.getElementById('prevBtn')?.addEventListener('click', () => navigate('prev'));
  document.getElementById('nextBtn')?.addEventListener('click', () => navigate('next'));

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate('next');
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate('prev');
  });

  // Spawn sakura
  spawnSakura();

  // Inject the add-activity modal
  injectModal();

  // Initial render
  renderBook();
  renderBudget();
  updateNavButtons();

  // Try Firebase
  try {
    const configModule = await import('./firebase-config.js');
    if (configModule.IS_CONFIGURED && configModule.firebaseConfig) {
      await setupFirebase(configModule.firebaseConfig);
    } else {
      updateSyncStatus('offline');
      showToast('Mode hors-ligne – configurez Firebase pour la sync');
      // Show setup overlay after a delay
      setTimeout(() => {
        const overlay = document.getElementById('setupOverlay');
        if (overlay) overlay.hidden = false;
      }, 2000);
    }
  } catch (e) {
    // firebase-config.js not found → offline mode
    updateSyncStatus('offline');
    console.info('firebase-config.js not found – running in offline mode');
    // Optionally show setup overlay
    // setTimeout(() => { document.getElementById('setupOverlay').hidden = false; }, 1500);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
