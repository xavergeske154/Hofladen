import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, './db.json');

const cities = [
  { plz: "53902", city: "Bad Münstereifel", lat: 50.5326569, lng: 6.8049149 },
  { plz: "53879", city: "Euskirchen", lat: 50.6533185, lng: 6.7887652 },
  { plz: "53909", city: "Zülpich", lat: 50.6772512, lng: 6.6449966 },
  { plz: "53894", city: "Mechernich", lat: 50.5950421, lng: 6.6254941 },
  { plz: "53919", city: "Weilerswist", lat: 50.7395791, lng: 6.8293338 },
  { plz: "53925", city: "Kall", lat: 50.5267986, lng: 6.5448019 },
  { plz: "53937", city: "Schleiden", lat: 50.5625794, lng: 6.4628110 },
  { plz: "53945", city: "Blankenheim (Ahr)", lat: 50.4130038, lng: 6.7376022 },
  { plz: "53947", city: "Nettersheim", lat: 50.4990435, lng: 6.6673756 },
  { plz: "53949", city: "Dahlem (Eifel)", lat: 50.3863587, lng: 6.5464093 },
  { plz: "53359", city: "Rheinbach", lat: 50.6071380, lng: 6.9532470 },
  { plz: "53913", city: "Swisttal", lat: 50.6923636, lng: 6.9222034 }
];

const categoryTypes = [
  { id: "hofladen", type: "Hofladen", accent: "green", prefix: "Hofladen", names: ["Eifelblick", "Heidehof", "Lindenhof", "Erlenwiese", "Sonnenberg"] },
  { id: "automat", type: "Automat", accent: "orange", prefix: "Regiomat", names: ["Münstereifel", "Euskirchen", "Rheinland", "Eifeltal", "Veybach"] },
  { id: "milch", type: "Milchstation", accent: "blue", prefix: "Milchtankstelle", names: ["Bauer Becker", "Hof Rheintal", "Kuhglücke", "Frischzapfer", "Milchwiese"] },
  { id: "eier", type: "Eierstation", accent: "brown", prefix: "Eierbox", names: ["Freilandglück", "Hühnermobil", "Nestfrisch", "Wiesenei", "Bodenstolz"] },
  { id: "stand", type: "Verkaufsstand", accent: "yellow", prefix: "Obst & Gemüse Stand", names: ["Waldfrucht", "Eifelgarten", "Erntebox", "Wegesrand", "Frischkiste"] },
  { id: "sb_laden", type: "Selbstbedienungsladen", accent: "purple", prefix: "SB-Hofladen", names: ["Rund um die Uhr", "Eifelliebe", "Dorfkiosk", "Natur-Eck", "Selbstbediener"] }
];

const streets = ["Hauptstraße", "Dorfstraße", "Kirchweg", "Feldstraße", "Am Bach", "Wiesenweg", "Waldweg", "Gartenstraße", "Ringstraße", "Bahnhofstraße", "Hofstraße", "Mühlenweg"];
const hoursOptions = [
  "Täglich 08:00 – 20:00 Uhr",
  "24/7 geöffnet",
  "Mo-Sa 09:00 – 18:00 Uhr",
  "Täglich 07:00 – 22:00 Uhr"
];

function run() {
  if (!fs.existsSync(DB_FILE)) {
    console.error(`Error: db.json not found at ${DB_FILE}`);
    process.exit(1);
  }

  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  
  // Clean up any previously generated test shops to keep idempotency (IDs >= 100)
  db.farm_shops = db.farm_shops.filter(shop => shop.id < 100);

  const generatedShops = [];
  
  // Generate 30 shops: 5 for each of the 6 categories
  for (let i = 0; i < 30; i++) {
    const catIndex = i % 6;
    const cat = categoryTypes[catIndex];
    
    // Choose a random city from Eifel area
    const cityObj = cities[Math.floor(Math.random() * cities.length)];
    
    // Add small random offset (approx. 1-4 km)
    const latOffset = (Math.random() - 0.5) * 0.04;
    const lngOffset = (Math.random() - 0.5) * 0.05;
    
    const id = 100 + i;
    const name = `${cat.prefix} ${cat.names[Math.floor(Math.random() * cat.names.length)]}`;
    const street = streets[Math.floor(Math.random() * streets.length)];
    const streetNumber = Math.floor(Math.random() * 85) + 1;
    const address = `${street} ${streetNumber}, ${cityObj.plz} ${cityObj.city}`;
    
    const lat = cityObj.lat + latOffset;
    const lng = cityObj.lng + lngOffset;
    
    // Automat and milk get 24/7 mostly, others get normal hours
    const hours = (cat.id === 'automat' || cat.id === 'milch') ? "24/7 geöffnet" : hoursOptions[Math.floor(Math.random() * hoursOptions.length)];
    
    const reviews = Math.floor(Math.random() * 120) + 10;
    const rating = (4.0 + Math.random() * 1.0).toFixed(1);
    
    generatedShops.push({
      id,
      name,
      type: cat.type,
      category: cat.id,
      distance: "berechnet...", // will be updated dynamically on client/server
      address,
      lat,
      lng,
      hours,
      status: "Geöffnet",
      rating,
      reviews: String(reviews),
      description: `Test-Eintragung für die Kategorie ${cat.type} in der Region ${cityObj.city}. Frische lokale Produkte direkt vor Ort.`,
      image: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=900&q=80",
      accent: cat.accent,
      approved: true,
      ownerId: "u-bauer"
    });
  }
  
  db.farm_shops = [...db.farm_shops, ...generatedShops];
  
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  console.log(`Successfully seeded ${generatedShops.length} test shops around Euskirchen/Bad Münstereifel in db.json!`);
}

run();
