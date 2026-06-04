import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Database } from './database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PLZ_DATA_FILE = path.resolve(__dirname, './plz.json');

let plzDatabase = {};
try {
  if (fs.existsSync(PLZ_DATA_FILE)) {
    plzDatabase = JSON.parse(fs.readFileSync(PLZ_DATA_FILE, 'utf-8'));
    console.log(`Loaded ${Object.keys(plzDatabase).length} PLZ coordinates.`);
  } else {
    console.warn(`PLZ database file not found at ${PLZ_DATA_FILE}`);
  }
} catch (err) {
  console.error('Failed to load PLZ database:', err);
}

const app = express();
const PORT = 5001;
const JWT_SECRET = 'hofladen_jwt_secret_token_12345!';

// Middleware
app.use(cors());
app.use(express.json());

// Password Hashing Helper
const hashPassword = (password) => Buffer.from(password).toString('base64');

// Geocoding Helper to resolve Lat/Lng from address/postcode
const geocodeAddress = (address) => {
  if (!address) return { lat: 48.0779, lng: 11.9715 };
  
  // Extract 5-digit postcode
  const plzMatch = address.match(/\b\d{5}\b/);
  if (plzMatch) {
    const plzStr = plzMatch[0];
    const plzEntry = plzDatabase[plzStr];
    if (plzEntry && plzEntry.lat && plzEntry.lng) {
      // Add a tiny random offset so markers at the exact same postcode don't overlap completely
      return { 
        lat: plzEntry.lat + (Math.random() - 0.5) * 0.005, 
        lng: plzEntry.lng + (Math.random() - 0.5) * 0.005 
      };
    }
  }

  const cleanAddr = address.toLowerCase();
  
  if (cleanAddr.includes("ebersberg") || cleanAddr.includes("85560")) {
    return { lat: 48.0779 + (Math.random() - 0.5) * 0.01, lng: 11.9715 + (Math.random() - 0.5) * 0.01 };
  }
  if (cleanAddr.includes("zorneding") || cleanAddr.includes("85604")) {
    return { lat: 48.0827 + (Math.random() - 0.5) * 0.01, lng: 11.8267 + (Math.random() - 0.5) * 0.01 };
  }
  if (cleanAddr.includes("grafing") || cleanAddr.includes("85567")) {
    return { lat: 48.0478 + (Math.random() - 0.5) * 0.01, lng: 11.9664 + (Math.random() - 0.5) * 0.01 };
  }
  if (cleanAddr.includes("zülpich") || cleanAddr.includes("53909")) {
    return { lat: 50.6923 + (Math.random() - 0.5) * 0.01, lng: 6.6433 + (Math.random() - 0.5) * 0.01 };
  }
  
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = ((hash % 100) / 1000) - 0.05; 
  const lngOffset = (((hash >> 8) % 100) / 1000) - 0.05; 
  
  return {
    lat: 48.1371 + latOffset,
    lng: 11.5754 + lngOffset
  };
};

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Role authorization middleware
function authorizeRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized role access' });
    }
    next();
  };
}

/* ==========================================================================
   AUTHENTICATION ENDPOINTS
   ========================================================================== */

app.post('/api/auth/register', (req, res) => {
  const { email, password, role, name } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password and role are required' });
  }

  if (!['customer', 'vendor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role selection' });
  }

  const db = Database.read();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (existingUser) {
    return res.status(400).json({ error: 'E-Mail-Adresse bereits registriert' });
  }

  const newUserId = `u-${Math.random().toString(36).substr(2, 9)}`;
  const newUser = {
    id: newUserId,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  if (role === 'customer') {
    db.customer_profiles.push({
      userId: newUserId,
      name: name || 'Kunde',
      location: '',
      savedFavorites: [],
      readingList: []
    });
  } else if (role === 'vendor') {
    const newFarmId = Math.floor(Math.random() * 900000) + 100000;
    
    // Create default blank vendor profile
    db.vendor_profiles.push({
      userId: newUserId,
      name: name || 'Landwirt',
      phone: '',
      website: '',
      whatsapp: ''
    });

    // Create default blank farm shop (needs admin approval)
    db.farm_shops.push({
      id: newFarmId,
      name: name || 'Neuer Hofladen',
      type: 'Hofladen',
      category: 'hofladen',
      distance: '0,0 km',
      address: '',
      lat: 48.0779,
      lng: 11.9715,
      hours: 'Geschlossen',
      status: 'Geschlossen',
      rating: '5.0',
      reviews: '0',
      description: 'Beschreibung Ihres Hofladens...',
      image: 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
      accent: 'green',
      approved: false, // Must be approved by admin
      ownerId: newUserId
    });
  }

  Database.write(db);
  
  const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, role, email: newUser.email });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const db = Database.read();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(400).json({ error: 'Ungültige E-Mail oder Passwort' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role, email: user.email });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const db = Database.read();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) return res.status(404).json({ error: 'User not found' });

  let profile = {};
  let farmShop = null;

  if (user.role === 'customer') {
    profile = db.customer_profiles.find(p => p.userId === user.id) || {};
  } else if (user.role === 'vendor') {
    profile = db.vendor_profiles.find(p => p.userId === user.id) || {};
    farmShop = db.farm_shops.find(f => f.ownerId === user.id) || null;
  }

  res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    profile,
    farmShop
  });
});

/* ==========================================================================
   PUBLIC FINDER & DETAILS ENDPOINTS
   ========================================================================== */

// Haversine Formula for distance in km
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

app.get('/api/farm-shops', (req, res) => {
  const db = Database.read();
  
  // Only return APPROVED farm shops publicly
  let publicShops = db.farm_shops.filter(f => f.approved === true);

  // Search filter
  const { q, category, plz, radius } = req.query;
  if (q) {
    const query = q.toLowerCase();
    publicShops = publicShops.filter(f => 
      f.name.toLowerCase().includes(query) || 
      f.description.toLowerCase().includes(query) ||
      f.address.toLowerCase().includes(query)
    );
  }

  // Category filter
  if (category && category !== 'all') {
    publicShops = publicShops.filter(f => f.category === category);
  }

  // Real Distance / PLZ Search filter using Haversine formula
  if (plz) {
    const query = plz.trim();
    let plzEntry = null;

    // Check if numeric (postcode)
    if (/^\d+$/.test(query)) {
      const cleanPlz = query.padStart(5, '0');
      plzEntry = plzDatabase[cleanPlz];
    } else {
      // Search by city/municipality name in plzDatabase
      const queryLower = query.toLowerCase();
      const keys = Object.keys(plzDatabase);
      
      // Try exact city/district match
      let foundKey = keys.find(k => {
        const entry = plzDatabase[k];
        return (entry.city && entry.city.toLowerCase() === queryLower) ||
               (entry.district && entry.district.toLowerCase() === queryLower);
      });
      
      // Try partial match
      if (!foundKey) {
        foundKey = keys.find(k => {
          const entry = plzDatabase[k];
          return (entry.city && entry.city.toLowerCase().includes(queryLower)) ||
                 (entry.district && entry.district.toLowerCase().includes(queryLower));
        });
      }
      
      if (foundKey) {
        plzEntry = plzDatabase[foundKey];
      }
    }

    const rKm = parseInt(radius) || 10;
    
    if (plzEntry && plzEntry.lat && plzEntry.lng) {
      publicShops = publicShops.map(shop => {
        let distanceNum = 999.0;
        if (shop.lat && shop.lng) {
          distanceNum = calculateDistance(plzEntry.lat, plzEntry.lng, shop.lat, shop.lng);
        }
        return {
          ...shop,
          distanceNum,
          distance: `${distanceNum.toFixed(1)} km`
        };
      });
      // Filter by radius limit
      publicShops = publicShops.filter(shop => shop.distanceNum <= rKm);
    } else {
      // Fallback if postcode coordinates are not found in DB
      publicShops = publicShops.map(shop => {
        let distanceNum = 999.0;
        if (shop.lat && shop.lng) {
          distanceNum = calculateDistance(48.0779, 11.9715, shop.lat, shop.lng);
        }
        return {
          ...shop,
          distanceNum,
          distance: `${distanceNum.toFixed(1)} km`
        };
      });
      // Filter by radius limit
      publicShops = publicShops.filter(shop => shop.distanceNum <= rKm);
    }
  }

  res.json(publicShops);
});

// Endpoint for geocoding / looking up coordinates of any German postcode or city
app.get('/api/plz/:query', (req, res) => {
  const queryParam = req.params.query.trim().toLowerCase();
  
  if (/^\d+$/.test(queryParam)) {
    const plzParam = queryParam.padStart(5, '0');
    const plzEntry = plzDatabase[plzParam];
    if (plzEntry) {
      return res.json({
        plz: plzParam,
        city: plzEntry.city || plzEntry.district || plzEntry.state,
        lat: plzEntry.lat,
        lng: plzEntry.lng,
        state: plzEntry.state,
        district: plzEntry.district,
        type: plzEntry.type
      });
    }
  } else {
    const keys = Object.keys(plzDatabase);
    
    // Exact match
    for (const key of keys) {
      const entry = plzDatabase[key];
      const matchCity = entry.city && entry.city.toLowerCase() === queryParam;
      const matchDistrict = entry.district && entry.district.toLowerCase() === queryParam;
      
      if (matchCity || matchDistrict) {
        return res.json({
          plz: key,
          city: entry.city || entry.district,
          lat: entry.lat,
          lng: entry.lng,
          state: entry.state,
          district: entry.district,
          type: entry.type
        });
      }
    }
    
    // Partial match
    for (const key of keys) {
      const entry = plzDatabase[key];
      const matchCity = entry.city && entry.city.toLowerCase().includes(queryParam);
      const matchDistrict = entry.district && entry.district.toLowerCase().includes(queryParam);
      
      if (matchCity || matchDistrict) {
        return res.json({
          plz: key,
          city: entry.city || entry.district,
          lat: entry.lat,
          lng: entry.lng,
          state: entry.state,
          district: entry.district,
          type: entry.type
        });
      }
    }
  }
  
  res.status(404).json({ error: 'Postleitzahl oder Ort nicht gefunden' });
});

app.get('/api/farm-shops/:id', (req, res) => {
  const db = Database.read();
  const shop = db.farm_shops.find(f => f.id === parseInt(req.params.id));

  if (!shop) return res.status(404).json({ error: 'Hofladen nicht gefunden' });
  
  // Fetch owner profile to append contact links
  const vendorProfile = db.vendor_profiles.find(v => v.userId === shop.ownerId) || {};

  res.json({
    ...shop,
    contact: {
      phone: vendorProfile.phone || '',
      website: vendorProfile.website || '',
      whatsapp: vendorProfile.whatsapp || '',
      email: db.users.find(u => u.id === shop.ownerId)?.email || ''
    }
  });
});

app.get('/api/blogs', (req, res) => {
  const db = Database.read();
  res.json(db.blog_posts);
});

app.get('/api/blogs/:slug', (req, res) => {
  const db = Database.read();
  const post = db.blog_posts.find(p => p.slug === req.params.slug);

  if (!post) return res.status(404).json({ error: 'Blogbeitrag nicht gefunden' });
  res.json(post);
});

/* ==========================================================================
   CUSTOMER ENDPOINTS (Favorites & profile)
   ========================================================================== */

app.get('/api/customer/favorites', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);
  
  if (!profile) return res.json([]);
  
  const favoriteShops = db.farm_shops.filter(f => profile.savedFavorites.includes(f.id));
  res.json(favoriteShops);
});

app.post('/api/customer/favorites/:id', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const shopId = parseInt(req.params.id);
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Kundenprofil nicht gefunden' });

  if (!profile.savedFavorites.includes(shopId)) {
    profile.savedFavorites.push(shopId);
    Database.write(db);
  }
  res.json({ success: true, savedFavorites: profile.savedFavorites });
});

app.delete('/api/customer/favorites/:id', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const shopId = parseInt(req.params.id);
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Kundenprofil nicht gefunden' });

  profile.savedFavorites = profile.savedFavorites.filter(id => id !== shopId);
  Database.write(db);
  res.json({ success: true, savedFavorites: profile.savedFavorites });
});

app.put('/api/customer/profile', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const { name, location } = req.body;
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Profil nicht gefunden' });

  profile.name = name || profile.name;
  profile.location = location || profile.location;

  Database.write(db);
  res.json(profile);
});

/* ==========================================================================
   VENDOR ENDPOINTS (Profile, Farm editing, Subscriptions)
   ========================================================================== */

app.get('/api/vendor/profile', authenticateToken, authorizeRole(['vendor']), (req, res) => {
  const db = Database.read();
  const profile = db.vendor_profiles.find(v => v.userId === req.user.id);
  const farmShop = db.farm_shops.find(f => f.ownerId === req.user.id);

  res.json({ profile, farmShop });
});

app.put('/api/vendor/profile', authenticateToken, authorizeRole(['vendor']), (req, res) => {
  const { name, description, address, hours, category, phone, website, whatsapp, status, image } = req.body;
  const db = Database.read();
  
  const profile = db.vendor_profiles.find(v => v.userId === req.user.id);
  const farmShop = db.farm_shops.find(f => f.ownerId === req.user.id);

  if (!profile || !farmShop) return res.status(404).json({ error: 'Profile structures not found' });

  // Update profile
  profile.phone = phone !== undefined ? phone : profile.phone;
  profile.website = website !== undefined ? website : profile.website;
  profile.whatsapp = whatsapp !== undefined ? whatsapp : profile.whatsapp;

  // Update Farm Shop
  farmShop.name = name || farmShop.name;
  farmShop.description = description !== undefined ? description : farmShop.description;
  if (address !== undefined && address !== farmShop.address) {
    farmShop.address = address;
    const coords = geocodeAddress(address);
    farmShop.lat = coords.lat;
    farmShop.lng = coords.lng;
  }
  farmShop.hours = hours !== undefined ? hours : farmShop.hours;
  farmShop.category = category || farmShop.category;
  farmShop.status = status || farmShop.status;
  farmShop.image = image || farmShop.image;
  
  // Set type label based on category mapping
  const categoryLabels = {
    hofladen: 'Hofladen',
    milch: 'Milchstation',
    eier: 'Eierstation',
    automat: 'Verkaufsautomat'
  };
  if (categoryLabels[farmShop.category]) {
    farmShop.type = categoryLabels[farmShop.category];
  }

  Database.write(db);
  res.json({ profile, farmShop });
});

app.post('/api/vendor/subscription', authenticateToken, authorizeRole(['vendor']), (req, res) => {
  const { active } = req.body;
  const db = Database.read();
  const profile = db.vendor_profiles.find(v => v.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  profile.subscriptionActive = !!active;
  Database.write(db);
  res.json({ success: true, subscriptionActive: profile.subscriptionActive });
});

/* ==========================================================================
   ADMIN ENDPOINTS (Moderation, Approvals, Blogs)
   ========================================================================== */

app.get('/api/admin/users', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const db = Database.read();
  // Return users with their profiles mapped
  const userList = db.users.map(u => {
    let details = {};
    if (u.role === 'customer') {
      details = db.customer_profiles.find(p => p.userId === u.id) || {};
    } else if (u.role === 'vendor') {
      details = db.vendor_profiles.find(p => p.userId === u.id) || {};
    }
    return {
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      details
    };
  });
  res.json(userList);
});

app.get('/api/admin/vendors', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const db = Database.read();
  // Return all farm shops including unapproved ones
  res.json(db.farm_shops);
});

app.post('/api/admin/vendors/:id/approve', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const shopId = parseInt(req.params.id);
  const db = Database.read();
  const shop = db.farm_shops.find(f => f.id === shopId);

  if (!shop) return res.status(404).json({ error: 'Hofladen nicht gefunden' });

  shop.approved = true;
  Database.write(db);
  res.json({ success: true, shop });
});

app.post('/api/admin/vendors/:id/block', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const shopId = parseInt(req.params.id);
  const db = Database.read();
  const shop = db.farm_shops.find(f => f.id === shopId);

  if (!shop) return res.status(404).json({ error: 'Hofladen nicht gefunden' });

  shop.approved = false;
  Database.write(db);
  res.json({ success: true, shop });
});

app.post('/api/admin/blogs', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const { title, teaser, content, image, category } = req.body;

  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Titel, Inhalt und Kategorie sind erforderlich' });
  }

  const db = Database.read();
  const newPostId = `b-${Math.random().toString(36).substr(2, 9)}`;
  const slug = title.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();

  const newPost = {
    id: newPostId,
    title,
    slug,
    teaser: teaser || title,
    image: image || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80',
    category,
    publishDate: new Date().toISOString().split('T')[0],
    content
  };

  db.blog_posts.unshift(newPost);
  Database.write(db);

  res.status(201).json(newPost);
});

app.delete('/api/admin/blogs/:id', authenticateToken, authorizeRole(['admin']), (req, res) => {
  const db = Database.read();
  const initialLength = db.blog_posts.length;
  db.blog_posts = db.blog_posts.filter(p => p.id !== req.params.id);

  if (db.blog_posts.length === initialLength) {
    return res.status(404).json({ error: 'Blogbeitrag nicht gefunden' });
  }

  Database.write(db);
  res.json({ success: true });
});

/* ==========================================================================
   EVENTS ENDPOINTS
   ========================================================================== */

app.get('/api/events', (req, res) => {
  const db = Database.read();
  const { farmShopId, category } = req.query;
  let list = db.events || [];

  if (farmShopId) {
    list = list.filter(e => e.farmShopId === parseInt(farmShopId));
  }
  if (category && category !== 'all') {
    list = list.filter(e => e.category === category);
  }
  res.json(list);
});

app.post('/api/events', authenticateToken, authorizeRole(['vendor', 'admin']), (req, res) => {
  const { title, date, time, description, location, category, farmShopId } = req.body;

  if (!title || !date || !time || !description || !location || !category) {
    return res.status(400).json({ error: 'Alle Felder außer Hofladen-ID sind Pflichtfelder' });
  }

  const db = Database.read();
  
  // If vendor is creating, verify they own the farm shop
  if (req.user.role === 'vendor') {
    const shop = db.farm_shops.find(f => f.ownerId === req.user.id);
    if (!shop || shop.id !== parseInt(farmShopId)) {
      return res.status(403).json({ error: 'Unbefugte Hofladen-Zuweisung' });
    }
  }

  const newEvent = {
    id: `ev-${Math.random().toString(36).substr(2, 9)}`,
    farmShopId: farmShopId ? parseInt(farmShopId) : null,
    title,
    date,
    time,
    description,
    location,
    image: category === 'wochenmarkt' 
      ? 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80'
      : 'https://images.unsplash.com/photo-1530026405186-ed1ea0ac7a63?auto=format&fit=crop&w=900&q=80',
    category
  };

  db.events = db.events || [];
  db.events.push(newEvent);
  Database.write(db);

  res.status(201).json(newEvent);
});

app.delete('/api/events/:id', authenticateToken, authorizeRole(['vendor', 'admin']), (req, res) => {
  const db = Database.read();
  const eventIndex = db.events.findIndex(e => e.id === req.params.id);

  if (eventIndex === -1) {
    return res.status(404).json({ error: 'Event nicht gefunden' });
  }

  const event = db.events[eventIndex];

  // If vendor, check ownership
  if (req.user.role === 'vendor') {
    const shop = db.farm_shops.find(f => f.ownerId === req.user.id);
    if (!shop || shop.id !== event.farmShopId) {
      return res.status(403).json({ error: 'Nicht befugt, dieses Event zu löschen' });
    }
  }

  db.events.splice(eventIndex, 1);
  Database.write(db);

  res.json({ success: true });
});

/* ==========================================================================
   CUSTOMER READING LIST ENDPOINTS
   ========================================================================== */

app.get('/api/customer/reading-list', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Kundenprofil nicht gefunden' });

  const rl = profile.readingList || [];
  const posts = db.blog_posts.filter(p => rl.includes(p.id));
  res.json(posts);
});

app.post('/api/customer/reading-list/:blogId', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const { blogId } = req.params;
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Kundenprofil nicht gefunden' });

  profile.readingList = profile.readingList || [];
  if (!profile.readingList.includes(blogId)) {
    profile.readingList.push(blogId);
    Database.write(db);
  }
  res.json({ success: true, readingList: profile.readingList });
});

app.delete('/api/customer/reading-list/:blogId', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const { blogId } = req.params;
  const db = Database.read();
  const profile = db.customer_profiles.find(p => p.userId === req.user.id);

  if (!profile) return res.status(404).json({ error: 'Kundenprofil nicht gefunden' });

  profile.readingList = profile.readingList || [];
  profile.readingList = profile.readingList.filter(id => id !== blogId);
  Database.write(db);
  res.json({ success: true, readingList: profile.readingList });
});

/* ==========================================================================
   PICKUP PACKAGES ENDPOINTS (Too Good To Go Model)
   ========================================================================== */

app.get('/api/farm-shops/:id/packages', (req, res) => {
  const db = Database.read();
  const pkgs = db.pickup_packages || [];
  const shopPkgs = pkgs.filter(p => p.farmShopId === parseInt(req.params.id));
  res.json(shopPkgs);
});

app.post('/api/vendor/packages', authenticateToken, authorizeRole(['vendor']), (req, res) => {
  const { title, description, price, originalValue, pickupTime, quantity } = req.body;

  if (!title || !price || !originalValue || !pickupTime || quantity === undefined) {
    return res.status(400).json({ error: 'Bitte füllen Sie alle erforderlichen Felder aus.' });
  }

  const db = Database.read();
  const shop = db.farm_shops.find(f => f.ownerId === req.user.id);

  if (!shop) {
    return res.status(404).json({ error: 'Kein Hofladen diesem Anbieter zugeordnet.' });
  }

  const newPkg = {
    id: `pkg-${Math.random().toString(36).substr(2, 9)}`,
    farmShopId: shop.id,
    title,
    description: description || '',
    price: parseFloat(price),
    originalValue: parseFloat(originalValue),
    pickupTime,
    quantity: parseInt(quantity)
  };

  db.pickup_packages = db.pickup_packages || [];
  db.pickup_packages.push(newPkg);
  Database.write(db);

  res.status(201).json(newPkg);
});

app.post('/api/customer/packages/:id/reserve', authenticateToken, authorizeRole(['customer']), (req, res) => {
  const db = Database.read();
  const pkg = db.pickup_packages.find(p => p.id === req.params.id);

  if (!pkg) {
    return res.status(404).json({ error: 'Retter-Tüte nicht gefunden.' });
  }

  if (pkg.quantity <= 0) {
    return res.status(400).json({ error: 'Dieses Angebot ist leider bereits ausverkauft.' });
  }

  pkg.quantity -= 1;
  Database.write(db);

  res.json({ success: true, quantity: pkg.quantity });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Hofladen Backend-Server active at http://localhost:${PORT}`);
});
