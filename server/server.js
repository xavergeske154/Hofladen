import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Database } from './database.js';

const app = express();
const PORT = 5001;
const JWT_SECRET = 'hofladen_jwt_secret_token_12345!';

// Middleware
app.use(cors());
app.use(express.json());

// Password Hashing Helper
const hashPassword = (password) => Buffer.from(password).toString('base64');

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
      savedFavorites: []
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

app.get('/api/farm-shops', (req, res) => {
  const db = Database.read();
  
  // Only return APPROVED farm shops publicly
  let publicShops = db.farm_shops.filter(f => f.approved === true);

  // Search filter
  const { q, category } = req.query;
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

  res.json(publicShops);
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
  farmShop.address = address !== undefined ? address : farmShop.address;
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

// Start Server
app.listen(PORT, () => {
  console.log(`Hofladen Backend-Server active at http://localhost:${PORT}`);
});
