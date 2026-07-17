// ============================================================
//  data.js – Données statiques du voyage Japon 2026
//  (itinéraire, phrases, voyageurs) – importé par app.js
// ============================================================


// ── Category emoji map ────────────────────────────────────────────────────────
const CAT_EMOJI = {
  'transport':   '🚆',
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
  travel:    { label: '🚆 Trajet',             color: '#00695C', bg: '#E0F2F1' },
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

// City colours used in the calendar grid
const CITY_CAL_COLORS = {
  tokyo1: '#C62828',
  osaka:  '#7B4EA0',
  tokyo2: '#1565C0',
};

// ── Travellers (personal budget) ────────────────────────────────────────────────
// Each person can add their own personal expenses, synced for everyone.
// Names are editable and synced (Firestore "people" collection / localStorage).
const PEOPLE = [
  { id: 'p1', name: 'Joé',       emoji: '🧑',     color: '#C62828' },
  { id: 'p2', name: 'Graziella', emoji: '👩',     color: '#7B4EA0' },
  { id: 'p3', name: 'Gazoux',    emoji: '🧑‍🦱', color: '#1565C0' },
  { id: 'p4', name: 'Thomas',    emoji: '👨',     color: '#2E7D32' },
];

// ── Common Japanese phrases (used in shops, restaurants, etc.) ───────────────────
const PHRASES = [
  {
    title: '🙏 Politesse & Salutations',
    items: [
      { fr: 'Bonjour',                 jp: 'こんにちは',         ro: 'Konnichiwa' },
      { fr: 'Bonjour (le matin)',      jp: 'おはようございます', ro: 'Ohayō gozaimasu' },
      { fr: 'Bonsoir',                 jp: 'こんばんは',         ro: 'Konbanwa' },
      { fr: 'Merci',                   jp: 'ありがとう',         ro: 'Arigatō' },
      { fr: 'Merci beaucoup',          jp: 'ありがとうございます', ro: 'Arigatō gozaimasu' },
      { fr: 'Excusez-moi / Pardon',    jp: 'すみません',         ro: 'Sumimasen' },
      { fr: 'Oui / Non',               jp: 'はい / いいえ',      ro: 'Hai / Iie' },
      { fr: 'Au revoir',               jp: 'さようなら',         ro: 'Sayōnara' },
    ],
  },
  {
    title: '🛍️ Au magasin / Shopping',
    items: [
      { fr: 'Combien ça coûte ?',      jp: 'いくらですか？',     ro: 'Ikura desu ka?' },
      { fr: 'C\'est trop cher',        jp: '高いです',           ro: 'Takai desu' },
      { fr: 'Je prends ça',            jp: 'これをください',     ro: 'Kore o kudasai' },
      { fr: 'Je regarde juste',        jp: '見ているだけです',   ro: 'Mite iru dake desu' },
      { fr: 'Détaxe, s\'il vous plaît', jp: '免税お願いします',  ro: 'Menzei onegaishimasu' },
      { fr: 'Un sac, svp',             jp: '袋をください',       ro: 'Fukuro o kudasai' },
      { fr: 'Je peux payer par carte ?', jp: 'カードで払えますか？', ro: 'Kādo de haraemasu ka?' },
    ],
  },
  {
    title: '🍜 Au restaurant',
    items: [
      { fr: 'Le menu, svp',            jp: 'メニューをください', ro: 'Menyū o kudasai' },
      { fr: 'L\'addition, svp',        jp: 'お会計お願いします', ro: 'Okaikei onegaishimasu' },
      { fr: 'C\'est délicieux !',      jp: 'おいしいです！',     ro: 'Oishii desu!' },
      { fr: 'Bon appétit',             jp: 'いただきます',       ro: 'Itadakimasu' },
      { fr: 'Pour deux personnes',     jp: '二人です',           ro: 'Futari desu' },
      { fr: 'De l\'eau, svp',          jp: 'お水をください',     ro: 'Omizu o kudasai' },
      { fr: 'Sans viande / végétarien', jp: '肉なしで',          ro: 'Niku nashi de' },
    ],
  },
  {
    title: '🚉 Transport & Orientation',
    items: [
      { fr: 'Où est… ?',               jp: '…はどこですか？',    ro: '… wa doko desu ka?' },
      { fr: 'La gare',                 jp: '駅',                 ro: 'Eki' },
      { fr: 'Les toilettes',           jp: 'トイレ',             ro: 'Toire' },
      { fr: 'Un ticket pour…',         jp: '…までの切符',        ro: '… made no kippu' },
      { fr: 'À gauche / À droite',     jp: '左 / 右',            ro: 'Hidari / Migi' },
      { fr: 'Tout droit',              jp: 'まっすぐ',           ro: 'Massugu' },
    ],
  },
  {
    title: '💬 Phrases utiles',
    items: [
      { fr: 'Je ne comprends pas',     jp: 'わかりません',       ro: 'Wakarimasen' },
      { fr: 'Parlez-vous anglais ?',   jp: '英語を話せますか？', ro: 'Eigo o hanasemasu ka?' },
      { fr: 'Un instant, svp',         jp: 'ちょっと待ってください', ro: 'Chotto matte kudasai' },
      { fr: 'Je suis français(e)',     jp: 'フランス人です',     ro: 'Furansu-jin desu' },
      { fr: 'C\'est bon / OK',         jp: '大丈夫です',         ro: 'Daijōbu desu' },
    ],
  },
  {
    title: '🆘 Urgences',
    items: [
      { fr: 'À l\'aide !',             jp: '助けて！',           ro: 'Tasukete!' },
      { fr: 'Appelez la police',       jp: '警察を呼んでください', ro: 'Keisatsu o yonde kudasai' },
      { fr: 'J\'ai besoin d\'un médecin', jp: '医者が必要です',  ro: 'Isha ga hitsuyō desu' },
      { fr: 'Hôpital',                 jp: '病院',               ro: 'Byōin' },
      { fr: 'J\'ai mal ici',           jp: 'ここが痛いです',     ro: 'Koko ga itai desu' },
    ],
  },
];

// ── Programmes détaillés par jour (recaps riches) ────────────────────────────
const DAY_PROGRAMS = {
  'osa-18': {
    emoji: '🎢',
    title: 'Programme détaillé — USJ',
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>USJ – Programme de la journée</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&family=Syne:wght@700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: #0d0d1a;
    font-family: 'Nunito', sans-serif;
    color: #f0eeff;
    min-height: 100vh;
    padding: 24px 16px 40px;
  }

  header {
    text-align: center;
    margin-bottom: 32px;
  }

  header .emoji-title {
    font-size: 2.4rem;
    margin-bottom: 6px;
  }

  header h1 {
    font-family: 'Syne', sans-serif;
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #ffffff;
    text-transform: uppercase;
  }

  header p {
    font-size: 0.85rem;
    color: #9b8fc4;
    margin-top: 4px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: center;
    margin-bottom: 28px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.03em;
  }

  .badge-joe    { background: rgba(99,179,237,0.15); color: #63b3ed; border: 1px solid #63b3ed44; }
  .badge-gaelle { background: rgba(246,135,179,0.15); color: #f687b3; border: 1px solid #f687b344; }
  .badge-tout   { background: rgba(154,215,85,0.15);  color: #9ad755; border: 1px solid #9ad75544; }

  .timeline {
    position: relative;
    max-width: 520px;
    margin: 0 auto;
  }

  .timeline::before {
    content: '';
    position: absolute;
    left: 28px;
    top: 0; bottom: 0;
    width: 2px;
    background: linear-gradient(to bottom, #7c3aed, #ec4899, #f59e0b, #10b981);
    opacity: 0.35;
  }

  .step {
    position: relative;
    padding-left: 68px;
    margin-bottom: 22px;
  }

  .step-num {
    position: absolute;
    left: 0;
    top: 0;
    width: 56px;
    height: 56px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.4rem;
    font-weight: 900;
    line-height: 1;
    z-index: 1;
  }

  .step-num span {
    font-size: 0.62rem;
    font-weight: 700;
    opacity: 0.7;
    letter-spacing: 0.04em;
    margin-top: 1px;
  }

  .card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 14px 16px;
    border: 1px solid rgba(255,255,255,0.07);
    backdrop-filter: blur(6px);
  }

  .card-header {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
  }

  .card-title {
    font-family: 'Syne', sans-serif;
    font-size: 1rem;
    font-weight: 800;
    color: #ffffff;
    flex: 1;
  }

  .zone-label {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .card-body {
    font-size: 0.83rem;
    color: #c4b8e8;
    line-height: 1.55;
  }

  .card-body .who {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .tag {
    font-size: 0.72rem;
    font-weight: 700;
    padding: 2px 9px;
    border-radius: 12px;
  }

  .tag-joe    { background: rgba(99,179,237,0.18); color: #63b3ed; }
  .tag-graziella { background: rgba(129,140,248,0.2); color: #a5b4fc; }
  .tag-gaelle { background: rgba(246,135,179,0.18); color: #f687b3; }
  .tag-thomas { background: rgba(251,191,36,0.18);  color: #fbbf24; }
  .tag-tous   { background: rgba(154,215,85,0.15); color: #9ad755; }

  .alert {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 0.78rem;
    font-weight: 700;
    margin-top: 9px;
    padding: 6px 10px;
    border-radius: 10px;
  }

  .alert-time  { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid #fbbf2430; }
  .alert-fp    { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid #34d39930; }
  .alert-split { background: rgba(236,72,153,0.1);  color: #f9a8d4; border: 1px solid #f9a8d430; }
  .alert-rdv   { background: rgba(99,179,237,0.12); color: #93c5fd; border: 1px solid #93c5fd30; }

  .divider-rdv {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 6px 0 20px;
    padding-left: 68px;
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
  }

  .divider-rdv::before, .divider-rdv::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.1);
  }

  .divider-rdv span {
    font-size: 0.73rem;
    color: #9ad755;
    font-weight: 700;
    white-space: nowrap;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .s1 .step-num { background: rgba(253,186,116,0.15); color: #fdba74; }
  .s1 .zone-label { background: rgba(253,186,116,0.15); color: #fdba74; }
  .s1 .card { border-color: rgba(253,186,116,0.12); }

  .s2 .step-num { background: rgba(167,139,250,0.15); color: #c4b5fd; }
  .s2 .zone-label { background: rgba(167,139,250,0.15); color: #c4b5fd; }
  .s2 .card { border-color: rgba(167,139,250,0.12); }

  .s3 .step-num { background: rgba(254,78,55,0.15); color: #fe4e37; }
  .s3 .zone-label { background: rgba(254,78,55,0.15); color: #fe4e37; }
  .s3 .card { border-color: rgba(254,78,55,0.12); }

  .s4 .step-num { background: rgba(16,185,129,0.15); color: #34d399; }
  .s4 .zone-label { background: rgba(16,185,129,0.15); color: #34d399; }
  .s4 .card { border-color: rgba(16,185,129,0.12); }

  .s5 .step-num { background: rgba(254,78,55,0.15); color: #fe4e37; }
  .s5 .zone-label { background: rgba(254,78,55,0.15); color: #fe4e37; }
  .s5 .card { border-color: rgba(254,78,55,0.12); }

  .s6 .step-num { background: rgba(99,179,237,0.15); color: #63b3ed; }
  .s6 .zone-label { background: rgba(99,179,237,0.15); color: #63b3ed; }
  .s6 .card { border-color: rgba(99,179,237,0.12); }

  footer {
    text-align: center;
    margin-top: 36px;
    font-size: 0.75rem;
    color: #6b5f8a;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
</style>
</head>
<body>

<header>
  <div class="emoji-title">🎢</div>
  <h1>Universal Studios Japan</h1>
  <p>Programme de la journée</p>
</header>

<div class="legend">
  <div class="badge badge-joe">🔵 Joe &amp; Graziella</div>
  <div class="badge badge-gaelle">🩷 Gaëlle &amp; Thomas</div>
  <div class="badge badge-tout">🟢 Tout le groupe</div>
</div>

<div class="timeline">

  <div class="step s1">
    <div class="step-num">🍌<span>01</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Minion Park</div>
        <div class="zone-label">Minion Park</div>
      </div>
      <div class="card-body">
        Première zone du parc — attraction et ambiance Minions pour tout le monde !
        <div class="who">
          <span class="tag tag-tous">👥 Tout le groupe</span>
        </div>
      </div>
    </div>
  </div>

  <div class="step s2">
    <div class="step-num">⚡<span>02</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Harry Potter – Forbidden Journey</div>
        <div class="zone-label">Wizarding World</div>
      </div>
      <div class="card-body">
        L'attraction phare du Wizarding World, puis repas dans la zone Harry Potter.
        <div class="alert alert-time">🍽️ Déjeuner dans Harry Potter</div>
        <div class="alert alert-time">⏰ 12h30 — Flight of the Hippogriff</div>
        <div class="who">
          <span class="tag tag-joe">Joe</span>
          <span class="tag tag-graziella">Graziella</span>
        </div>
      </div>
    </div>
  </div>

  <div class="step s3">
    <div class="step-num">🍄<span>03</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Séparation du groupe</div>
        <div class="zone-label">Super Nintendo World</div>
      </div>
      <div class="card-body">
        <div class="alert alert-split">🔀 Le groupe se sépare</div>
        <br/>
        <strong style="color:#a5b4fc">🍄 Joe &amp; Graziella</strong> → Super Mario World
        <div class="who" style="margin-bottom:12px">
          <span class="tag tag-joe">Joe</span>
          <span class="tag tag-graziella">Graziella</span>
        </div>
        <strong style="color:#f9a8d4">🐰 Gaëlle &amp; Thomas</strong> → Universal Wonderland
        <div class="who">
          <span class="tag tag-gaelle">Gaëlle</span>
          <span class="tag tag-thomas">Thomas</span>
        </div>
      </div>
    </div>
  </div>

  <div class="divider-rdv">
    <span>🎬 Retrouvailles à Hollywood</span>
  </div>

  <div class="step s4">
    <div class="step-num">🦕<span>04</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Jurassic Park</div>
        <div class="zone-label">Jurassic World</div>
      </div>
      <div class="card-body">
        Attraction avec Fast Pass — priorité d'accès !
        <div class="alert alert-fp">⚡ Fast Pass</div>
        <div class="who">
          <span class="tag tag-joe">Joe</span>
          <span class="tag tag-graziella">Graziella</span>
        </div>
      </div>
    </div>
  </div>

  <div class="step s5">
    <div class="step-num">🍄<span>05</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Super Nintendo World</div>
        <div class="zone-label">Super Nintendo World</div>
      </div>
      <div class="card-body">
        Tour de Gaëlle &amp; Thomas dans Mario World.
        <div class="alert alert-time">⏰ 19h00 – 20h00 · TAGJ</div>
        <div class="who">
          <span class="tag tag-gaelle">Gaëlle</span>
          <span class="tag tag-thomas">Thomas</span>
        </div>
      </div>
    </div>
  </div>

  <div class="step s6">
    <div class="step-num">🌟<span>06</span></div>
    <div class="card">
      <div class="card-header">
        <div class="card-title">Amity Village</div>
        <div class="zone-label">Amity Village</div>
      </div>
      <div class="card-body">
        Fin de journée ensemble — dernier tour dans la zone Amity Village !
        <div class="who">
          <span class="tag tag-tous">👥 Tout le groupe</span>
        </div>
      </div>
    </div>
  </div>

</div>

<footer>Universal Studios Japan · Recap journée</footer>

</body>
</html>`,
  },
};

export { CAT_EMOJI, DAY_TYPE_CONFIG, TRIP, ALL_DAYS, SEED_ACTIVITIES, CATEGORIES, CITY_CAL_COLORS, PEOPLE, PHRASES, DAY_PROGRAMS };
