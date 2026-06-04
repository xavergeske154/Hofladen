import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.resolve(__dirname, './db.json');

// Helper to encrypt passwords in plaintext for MVP structure simplicity
const hashPassword = (password) => Buffer.from(password).toString('base64');

// Default Seed Data
const DEFAULT_DATA = {
  users: [
    { id: "u-admin", email: "admin@hofladen.de", passwordHash: hashPassword("adminpass"), role: "admin", createdAt: new Date().toISOString() },
    { id: "u-kunde", email: "kunde@hofladen.de", passwordHash: hashPassword("kundepass"), role: "customer", createdAt: new Date().toISOString() },
    { id: "u-bauer", email: "bauer@hofladen.de", passwordHash: hashPassword("bauerpass"), role: "vendor", createdAt: new Date().toISOString() },
  ],
  customer_profiles: [
    { userId: "u-kunde", name: "Max Mustermann", location: "80331 München", savedFavorites: [1], readingList: ["b-4"] }
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
      title: "Honig-Herstellung",
      slug: "honig-herstellung",
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
    },
    {
      id: "b-4",
      title: "Hochbeet selber bauen",
      slug: "hochbeet-selber-bauen",
      teaser: "Ein eigenes Hochbeet bauen schont den Rücken, hält Schädlinge fern und steigert den Ertrag. So gelingt das Holz-Projekt.",
      image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=900&q=80",
      category: "DIY",
      publishDate: "2026-06-01",
      content: `Hochbeete liegen im Trend. Sie ermöglichen rückenschonendes Gärtnern und bieten ideale Wachstumsbedingungen für Salat, Kräuter und Gemüse.

Materialien für ein langlebiges Holz-Hochbeet:
- Lärchen- oder Douglasienbretter (ca. 4 cm dick)
- Kanthölzer für die Ecken
- Teichfolie oder Noppenbahn zur Innenauskleidung
- Wühlmausgitter (engmaschiger Draht)
- Schrauben aus Edelstahl

Schritt-für-Schritt-Anleitung:
1. Standort ebnen: Wählen Sie einen sonnigen Platz im Garten und stechen Sie die Grasnarbe ab.
2. Holzrahmen verschrauben: Befestigen Sie die Bretter an den Eck-Kanthölzern, um die Kiste zu formen.
3. Wühlmausschutz montieren: Tackern Sie den feinmaschigen Draht am Boden fest, um Nagetiere auszusperren.
4. Folie auslegen: Kleiden Sie die Innenwände mit Noppenbahn aus, um das Holz vor ständiger Feuchtigkeit aus der Erde zu schützen.
5. Das Schichtsystem befüllen:
   - Unterste Schicht: Grober Holzschnitt, Äste und Zweige (ca. 20 cm) für gute Belüftung.
   - Zweite Schicht: Rasenschnitt, Laub oder feineres Astwerk (ca. 15 cm).
   - Dritte Schicht: Unreifer Kompost oder Stallmist (ca. 20 cm) als Heizung und Nährstoffquelle.
   - Oberste Schicht: Hochwertige Garten- und Hochbeeterde (ca. 25 cm).

Durch das Verrotten der unteren Schichten entsteht Wärme, die das Wachstum beschleunigt. Bereits im zeitigen Frühjahr kann so ausgesät werden!`
    },
    {
      id: "b-5",
      title: "Die Kraft der Kamille",
      slug: "die-kraft-der-kamille",
      teaser: "Die echte Kamille ist ein Wundermittel der Natur. Erfahre alles über Wirkung, Ernte und Anwendung bei uns.",
      image: "https://images.unsplash.com/photo-1600181519808-16147498dbf5?auto=format&fit=crop&w=900&q=80",
      category: "Ratgeber",
      publishDate: "2026-06-02",
      content: `Die echte Kamille (Matricaria chamomilla) gehört zu den ältesten und beliebtesten Heilpflanzen Europas. Ihre Anwendungsbereiche sind extrem vielfältig – ob als Tee, Dampfbad, Tinktur oder Umschlag.

1. Die Heilwirkung:
Die Blüten der Kamille enthalten ätherische Öle (wie Bisabolol und Chamazulen) sowie Flavonoide. Diese Wirkstoffe wirken entzündungshemmend, krampflösend, antibakteriell und beruhigend auf Magen und Darm sowie auf die Haut.

2. Kamille im eigenen Garten ernten:
Kamille wächst hervorragend an sonnigen Standorten auf nährstoffreichen, durchlässigen Böden. Geerntet werden die Blütenköpfe an einem trockenen Vormittag, sobald sie voll erblüht sind. Breiten Sie die Blüten zum Trocknen an einem schattigen, luftigen Ort aus.

3. Einfache Anwendungen:
- Kamillentee: 2 TL getrocknete Blüten mit 250ml kochendem Wasser übergießen, 10 Minuten abgedeckt ziehen lassen. Hilft bei Magen-Darm-Beschwerden oder zum Gurgeln bei Entzündungen im Mundraum.
- Inhalation bei Erkältung: Eine Handvoll Blüten in eine Schüssel mit heißem Wasser geben, den Kopf mit einem Handtuch abdecken und 10 Minuten den heilsamen Dampf einatmen.
- Umschläge: Abgekühlter Kamillensud lindert Hautreizungen und kleine Entzündungen.`
    }
  ],
  events: [
    {
      id: "ev-1",
      farmShopId: 1, // Maier
      title: "Großes Hoffest & Bauernmarkt",
      date: "2026-06-20",
      time: "10:00 - 18:00 Uhr",
      description: "Erleben Sie das Landleben hautnah! Wir laden ein zu unserem jährlichen Hoffest mit Traktorfahrten für Kinder, Verkostungen unserer Wurst- und Käsespezialitäten und Live-Musik im Hofgarten.",
      location: "Dorfstraße 12, 85560 Ebersberg",
      image: "https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=900&q=80",
      category: "hoffest"
    },
    {
      id: "ev-2",
      farmShopId: null, // communal / general event
      title: "Regionaler Wochenmarkt Ebersberg",
      date: "2026-06-25",
      time: "07:30 - 12:30 Uhr",
      description: "Jeden Donnerstagmorgen verwandelt sich der Marktplatz in ein Einkaufsparadies für frische, regionale Lebensmittel. Entdecken Sie Stände mit Gemüse, Fisch, Honig, Brot und Blumen direkt aus der Region.",
      location: "Marienplatz, 85560 Ebersberg",
      image: "https://images.unsplash.com/photo-1488459718432-36a57e6294e1?auto=format&fit=crop&w=900&q=80",
      category: "wochenmarkt"
    },
    {
      id: "ev-3",
      farmShopId: null, // communal / general event
      title: "Zornedinger Bauernmarkt",
      date: "2026-06-27",
      time: "08:00 - 13:00 Uhr",
      description: "Lokale Landwirte präsentieren ihre Erzeugnisse. Kaufen Sie frische Eier, Milch, Fleisch und Saisongemüse direkt von den Bauern aus der Nachbarschaft.",
      location: "Rathausplatz, 85604 Zorneding",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
      category: "wochenmarkt"
    },
    {
      id: "ev-4",
      farmShopId: 3, // Huber
      title: "Hühnerhof Führung für Familien",
      date: "2026-07-05",
      time: "14:00 - 15:30 Uhr",
      description: "Wie leben unsere Hühner im Hühnermobil? Familie Huber führt Sie über die Weiden. Kinder dürfen frisch gelegte Eier aus den Nestern sammeln und die Hühner füttern.",
      location: "Feldweg 2, 85567 Grafing",
      image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?auto=format&fit=crop&w=900&q=80",
      category: "hoffest"
    }
  ],
  pickup_packages: [
    {
      id: "pkg-1",
      farmShopId: 1, // Maier
      title: "Gemüse-Retterbox (Groß)",
      description: "Eine bunte Mischung aus reifem Saisongemüse (z.B. Tomaten, Salat, Zucchini, Karotten), das optische Mängel aufweist, aber absolut frisch und lecker ist.",
      price: 4.50,
      originalValue: 12.00,
      pickupTime: "Heute 17:30 - 18:00 Uhr",
      quantity: 4
    },
    {
      id: "pkg-2",
      farmShopId: 1, // Maier
      title: "Milchprodukte & Käse-Paket",
      description: "Käseecken, Quark oder Joghurt, deren Mindesthaltbarkeitsdatum kurz bevorsteht. Perfekt zum direkten Verzehr geeignet.",
      price: 5.00,
      originalValue: 15.00,
      pickupTime: "Heute 17:30 - 18:00 Uhr",
      quantity: 2
    },
    {
      id: "pkg-3",
      farmShopId: 3, // Huber
      title: "Eier- & Backwarenbeutel",
      description: "Eine Packung Eier aus Freilandhaltung (Größe S/M) sowie hausgemachtes Bauernbrot vom Vortag.",
      price: 3.50,
      originalValue: 8.50,
      pickupTime: "Morgen 18:00 - 19:30 Uhr",
      quantity: 3
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
      const parsed = JSON.parse(raw);
      // Ensure all required fields exist (fallback for manual edits/older DB states)
      if (!parsed.events) parsed.events = DEFAULT_DATA.events;
      if (!parsed.pickup_packages) parsed.pickup_packages = DEFAULT_DATA.pickup_packages;
      return parsed;
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
