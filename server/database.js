import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, './db.json');

// Helper to encrypt passwords in plaintext for MVP structure simplicity (or simple base64, or md5/sha256 if needed. Let's keep it simple or use a basic string check since this is a local MVP).
const hashPassword = (password) => Buffer.from(password).toString('base64');

// Default Seed Data
const DEFAULT_DATA = {
  users: [
    { id: "u-admin", email: "admin@hofladen.de", passwordHash: hashPassword("adminpass"), role: "admin", createdAt: new Date().toISOString() },
    { id: "u-kunde", email: "kunde@hofladen.de", passwordHash: hashPassword("kundepass"), role: "customer", createdAt: new Date().toISOString() },
    { id: "u-bauer", email: "bauer@hofladen.de", passwordHash: hashPassword("bauerpass"), role: "vendor", createdAt: new Date().toISOString() },
  ],
  customer_profiles: [
    { userId: "u-kunde", name: "Max Mustermann", location: "80331 München", savedFavorites: [1] }
  ],
  vendor_profiles: [
    { 
      userId: "u-bauer", 
      name: "Bauer Schmid", 
      phone: "+49 89 123456", 
      website: "www.bauer-schmid.de", 
      whatsapp: "https://wa.me/4989123456" 
    }
  ],
  farm_shops: [
    {
      id: 1,
      name: "Hofladen Maier",
      type: "Hofladen",
      category: "hofladen",
      distance: "2,4 km",
      address: "Dorfstraße 12, 85560 Ebersberg",
      hours: "Heute 08:00 – 18:00 Uhr",
      status: "Geöffnet",
      rating: "4,8",
      reviews: "128",
      description: "Regionale Produkte direkt vom Erzeuger. Frisches Gemüse, Obst, Eier und Wurstspezialitäten aus eigener Schlachtung.",
      image: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
      accent: "green",
      approved: true,
      ownerId: "u-bauer"
    },
    {
      id: 2,
      name: "Milchstation Bauer Schmid",
      type: "Milchstation",
      category: "milch",
      distance: "3,1 km",
      address: "Hauptstraße 4, 85604 Zorneding",
      hours: "24/7 geöffnet",
      status: "Geöffnet",
      rating: "4,7",
      reviews: "86",
      description: "Frische Rohmilch rund um die Uhr am Zapfautomaten. Bitte Gefäße mitbringen oder vor Ort Flaschen erwerben.",
      image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=900&q=80",
      accent: "blue",
      approved: true,
      ownerId: "u-bauer"
    },
    {
      id: 3,
      name: "Eierstation Huber",
      type: "Eierstation",
      category: "eier",
      distance: "4,6 km",
      address: "Feldweg 2, 85567 Grafing",
      hours: "Heute bis 20:00 Uhr",
      status: "Geöffnet",
      rating: "4,9",
      reviews: "54",
      description: "Eier aus Freilandhaltung vom Hof. Unser Hühnermobil zieht wöchentlich auf frische Wiesen um.",
      image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=900&q=80",
      accent: "brown",
      approved: true,
      ownerId: "u-bauer"
    }
  ],
  blog_posts: [
    {
      id: "b-1",
      title: "Wie entsteht Honig?",
      slug: "wie-entsteht-honig",
      teaser: "Fleißige Bienen, bunte Blüten und viel Geduld – so entsteht das flüssige Gold unserer heimischen Imker.",
      image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=80",
      category: "Imkerei",
      publishDate: "2026-05-12",
      content: `Honig ist eines der ältesten Naturprodukte der Menschheit. Aber wie genau entsteht der süße Saft eigentlich? 

Alles beginnt bei den Bienen, die von Blüte zu Blüte fliegen, um Nektar und Honigtau zu sammeln. Die Bienen nehmen den Nektar mit ihrem Saugrüssel auf und transportieren ihn in ihrer Honigblase zurück zum Bienenstock. 

Im Bienenstock angekommen, wird der Nektar von Biene zu Biene weitergegeben. Dabei wird er mit körpereigenen Enzymen angereichert und verliert Wasser. Dadurch verdickt der Saft und wird haltbar gemacht. Wenn der Wassergehalt unter 18% sinkt, verschließen die Bienen die Waben mit einer feinen Wachsschicht.

Der Imker entnimmt die Waben, entfernt die Wachsschicht und schleudert den Honig in einer Honigschleuder kalt heraus. Nach dem Filtern ist der Honig bereit für das Glas – pur, regional und naturbelassen.`
    },
    {
      id: "b-2",
      title: "Warum regionale Eier besser nachvollziehbar sind",
      slug: "warum-regionale-eier-besser-sind",
      teaser: "Der Stempel auf dem Ei verrät viel, aber der persönliche Blick auf den Hühnerhof verrät noch mehr.",
      image: "https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=900&q=80",
      category: "Geflügel",
      publishDate: "2026-05-18",
      content: `Wer Eier im Supermarkt kauft, verlässt sich auf Gütesiegel. Beim Kauf am Eierautomaten oder direkt im Hofladen ist das anders: Hier kauft man direkt beim Erzeuger.

Jedes Ei in Deutschland trägt einen Erzeugercode (z.B. 1-DE-0912341). Die erste Zahl verrät das Haltungssystem (0 = Bio, 1 = Freiland, 2 = Bodenhaltung). DE steht für Deutschland, und die restlichen Ziffern identifizieren genau den Betrieb und den Stall.

Bei Eiern von regionalen Stationen sieht man das Hühnermobil meist direkt neben der Verkaufsbox stehen. Man weiß genau, was die Hühner fressen, wie viel Auslauf sie haben und wer der Landwirt hinter dem Produkt ist. Das schafft Vertrauen und spart lange Transportwege.`
    },
    {
      id: "b-3",
      title: "Was ist Rohmilch?",
      slug: "was-ist-rohmilch",
      teaser: "Frische Milch direkt ab Kuh – an Milchstationen tankst du unbehandelte Milch. Das musst du beachten.",
      image: "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?auto=format&fit=crop&w=900&q=80",
      category: "Milch",
      publishDate: "2026-05-20",
      content: `Rohmilch ist Milch in ihrer natürlichsten Form. Sie wird nach dem Melken lediglich gefiltert und gekühlt. Im Gegensatz zur Supermarkt-Milch ist sie weder pasteurisiert (erhitzt) noch homogenisiert (unter Druck zerstäubt).

Das hat Vorteile: Rohmilch behält ihren natürlichen Fettgehalt (meist um die 4%) und alle Vitamine und Enzyme. Der Geschmack ist unvergleichlich cremig und aromatisch.

Da Rohmilch jedoch nicht erhitzt wurde, kann sie natürliche Keime enthalten. Für Schwangere, Kleinkinder und immungeschwächte Personen wird empfohlen, Rohmilch vor dem Verzehr abzukochen. An Milchzapfstellen ist dieser Hinweis gesetzlich vorgeschrieben. Frische Rohmilch hält sich gekühlt etwa 2–3 Tage.`
    }
  ]
};

export class Database {
  static read() {
    try {
      if (!fs.existsSync(DB_FILE)) {
        this.write(DEFAULT_DATA);
        return DEFAULT_DATA;
      }
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error("Database read error, returning default data:", err);
      return DEFAULT_DATA;
    }
  }

  static write(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error("Database write error:", err);
    }
  }
}
