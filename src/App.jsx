import React, { useMemo, useState, useEffect } from "react";
import { 
  Search, SlidersHorizontal, Heart, User, MapPin, Clock, Star, Navigation, 
  Home, Milk, Egg, Store, Bell, Menu, Map, ChevronRight, Leaf, LogIn, LogOut,
  Settings, CheckCircle, AlertTriangle, FileText, Plus, Trash2, Globe, Phone, Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

const categories = [
  { id: "all", label: "Alle", icon: Store },
  { id: "hofladen", label: "Hofladen", icon: Home },
  { id: "milch", label: "Milchstation", icon: Milk },
  { id: "eier", label: "Eierstation", icon: Egg },
  { id: "automat", label: "Automaten", icon: Store },
];

function Logo({ onClick }) {
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onClick}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-green-700/30 bg-green-50 shadow-sm">
        <Leaf className="h-7 w-7 text-green-800" />
      </div>
      <div>
        <div className="text-3xl font-bold leading-7 text-green-900 tracking-tight">Hofladen</div>
        <div className="text-sm italic text-green-700">regional entdecken</div>
      </div>
    </div>
  );
}

export default function HofladenWebAppStartseite() {
  // Navigation State
  const [view, setView] = useState("home"); // home, farm-detail, blog, blog-detail, login, register, dashboard
  const [viewParams, setViewParams] = useState({});

  // Global Session State
  const [user, setUser] = useState(null);
  
  // Data States
  const [places, setPlaces] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  
  // Form/Auth States
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("customer");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Customer Favorites State
  const [favorites, setFavorites] = useState([]);

  // Vendor Dashboard Edit State
  const [vendorForm, setVendorForm] = useState({
    name: "", description: "", address: "", hours: "", category: "hofladen",
    phone: "", website: "", whatsapp: "", status: "Geöffnet", image: ""
  });
  const [vendorSuccess, setVendorSuccess] = useState("");

  // Admin Dashboard State
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminVendors, setAdminVendors] = useState([]);
  const [newBlogForm, setNewBlogForm] = useState({
    title: "", teaser: "", category: "Allgemein", content: "", image: ""
  });
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminTab, setAdminTab] = useState("approvals"); // approvals, users, blogs

  // Mobile navigation drawer
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and Fetch User Session
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const me = await api.me();
          setUser(me);
          if (me.role === 'customer') {
            const favs = await api.getFavorites();
            setFavorites(favs);
          }
        } catch (err) {
          console.error("Token restore failed", err);
          api.logout();
        }
      }
    };
    fetchUser();
  }, []);

  // Fetch Public Farm Shops & Blogs
  useEffect(() => {
    const loadShops = async () => {
      try {
        const list = await api.getFarmShops({ q: searchQuery, category: selectedCategory });
        setPlaces(list);
      } catch (err) {
        console.error("Failed to load farm shops", err);
      }
    };
    loadShops();
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const list = await api.getBlogs();
        setBlogs(list);
      } catch (err) {
        console.error("Failed to load blogs", err);
      }
    };
    loadBlogs();
  }, []);

  // Sync Vendor details when profile is fetched/active
  useEffect(() => {
    if (user && user.role === 'vendor' && user.farmShop) {
      setVendorForm({
        name: user.farmShop.name || "",
        description: user.farmShop.description || "",
        address: user.farmShop.address || "",
        hours: user.farmShop.hours || "",
        category: user.farmShop.category || "hofladen",
        status: user.farmShop.status || "Geöffnet",
        image: user.farmShop.image || "",
        phone: user.profile.phone || "",
        website: user.profile.website || "",
        whatsapp: user.profile.whatsapp || "",
      });
    }
  }, [user]);

  // Load Admin Data when entering admin portal
  const loadAdminData = async () => {
    if (user && user.role === 'admin') {
      try {
        const users = await api.adminGetUsers();
        const vendors = await api.adminGetVendors();
        setAdminUsers(users);
        setAdminVendors(vendors);
      } catch (err) {
        console.error("Admin load error", err);
      }
    }
  };

  useEffect(() => {
    if (view === 'dashboard' && user && user.role === 'admin') {
      loadAdminData();
    }
  }, [view, user]);

  // Navigation handlers
  const navigateTo = (newView, params = {}) => {
    setView(newView);
    setViewParams(params);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  // Auth Submit Actions
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      const data = await api.login(authEmail, authPassword);
      const me = await api.me();
      setUser(me);
      setAuthSuccess("Erfolgreich eingeloggt!");
      setAuthEmail("");
      setAuthPassword("");
      
      if (me.role === 'customer') {
        const favs = await api.getFavorites();
        setFavorites(favs);
      }
      setTimeout(() => navigateTo("dashboard"), 800);
    } catch (err) {
      setAuthError(err.message || "Anmeldefehler");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      await api.register(authEmail, authPassword, authRole, authName);
      const me = await api.me();
      setUser(me);
      setAuthSuccess("Registrierung erfolgreich!");
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setTimeout(() => navigateTo("dashboard"), 800);
    } catch (err) {
      setAuthError(err.message || "Registrierungsfehler");
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setFavorites([]);
    navigateTo("home");
  };

  // Customer Actions
  const handleToggleFavorite = async (placeId) => {
    if (!user || user.role !== 'customer') {
      navigateTo("login");
      return;
    }
    
    const isFav = favorites.some(f => f.id === placeId);
    try {
      if (isFav) {
        await api.removeFavorite(placeId);
        setFavorites(favorites.filter(f => f.id !== placeId));
      } else {
        await api.addFavorite(placeId);
        const updatedFavs = await api.getFavorites();
        setFavorites(updatedFavs);
      }
    } catch (err) {
      console.error("Favorite toggle failed", err);
    }
  };

  // Vendor Actions
  const handleUpdateVendorProfile = async (e) => {
    e.preventDefault();
    setVendorSuccess("");
    try {
      const updated = await api.updateVendorProfile(vendorForm);
      setUser({
        ...user,
        profile: updated.profile,
        farmShop: updated.farmShop
      });
      setVendorSuccess("Profildetails erfolgreich aktualisiert!");
    } catch (err) {
      console.error("Vendor profile update failed", err);
    }
  };

  const handleToggleSubscription = async (currentActive) => {
    try {
      await api.updateVendorSubscription(!currentActive);
      const me = await api.me();
      setUser(me);
    } catch (err) {
      console.error("Subscription update failed", err);
    }
  };

  // Admin Actions
  const handleApproveVendor = async (shopId) => {
    try {
      await api.adminApproveVendor(shopId);
      setAdminSuccess("Hofladen erfolgreich freigeschaltet!");
      loadAdminData();
      // Reload public shops list
      const list = await api.getFarmShops({ q: searchQuery, category: selectedCategory });
      setPlaces(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBlockVendor = async (shopId) => {
    try {
      await api.adminBlockVendor(shopId);
      setAdminSuccess("Hofladen erfolgreich gesperrt!");
      loadAdminData();
      const list = await api.getFarmShops({ q: searchQuery, category: selectedCategory });
      setPlaces(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateBlog = async (e) => {
    e.preventDefault();
    setAdminSuccess("");
    try {
      await api.adminCreateBlog(newBlogForm);
      setAdminSuccess("Blogbeitrag erfolgreich veröffentlicht!");
      setNewBlogForm({ title: "", teaser: "", category: "Allgemein", content: "", image: "" });
      const loadBlogs = await api.getBlogs();
      setBlogs(loadBlogs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlog = async (blogId) => {
    try {
      await api.adminDeleteBlog(blogId);
      setAdminSuccess("Blogbeitrag gelöscht!");
      const loadBlogs = await api.getBlogs();
      setBlogs(loadBlogs);
    } catch (err) {
      console.error(err);
    }
  };

  // Maps Redirect
  const navigateToMap = (address) => {
    const query = encodeURIComponent(address);
    window.open(`https://maps.google.com/?q=${query}`, '_blank');
  };

  // Render Helpers
  const renderHeader = () => (
    <header className="sticky top-0 z-30 border-b border-neutral-200/70 bg-[#faf8f2]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Logo onClick={() => navigateTo("home")} />
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 font-semibold text-neutral-700 md:flex">
          <button onClick={() => navigateTo("home")} className={`hover:text-green-800 ${view === 'home' ? 'text-green-900 border-b-2 border-green-800' : ''}`}>Entdecken</button>
          <button onClick={() => navigateTo("blog")} className={`hover:text-green-800 ${view === 'blog' || view === 'blog-detail' ? 'text-green-900 border-b-2 border-green-800' : ''}`}>Blog</button>
          {user && (
            <button onClick={() => navigateTo("dashboard")} className={`hover:text-green-800 ${view === 'dashboard' ? 'text-green-900 border-b-2 border-green-800' : ''}`}>
              Mein Bereich ({user.role === 'admin' ? 'Admin' : user.role === 'vendor' ? 'Anbieter' : 'Kunde'})
            </button>
          )}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-600 font-medium">Hallo, {user.profile?.name || user.email}</span>
              <Button variant="outline" className="rounded-full bg-white hover:bg-neutral-50" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Abmelden
              </Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" className="rounded-full" onClick={() => navigateTo("login")}><Heart className="mr-2 h-4 w-4" /> Favoriten</Button>
              <Button variant="outline" className="rounded-full bg-white" onClick={() => navigateTo("login")}><LogIn className="mr-2 h-4 w-4" /> Login</Button>
            </>
          )}
        </div>

        {/* Mobile Nav Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="block p-2 text-neutral-700 md:hidden" aria-label="Navigationsmenü umschalten">
          <Menu className="h-7 w-7" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-neutral-200 bg-[#faf8f2] px-5 py-4 md:hidden flex flex-col gap-4 font-semibold text-neutral-700"
          >
            <button onClick={() => navigateTo("home")} className="text-left py-2 border-b border-neutral-100">Entdecken</button>
            <button onClick={() => navigateTo("blog")} className="text-left py-2 border-b border-neutral-100">Blog</button>
            {user ? (
              <>
                <button onClick={() => navigateTo("dashboard")} className="text-left py-2 border-b border-neutral-100">Mein Bereich</button>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-neutral-600">{user.email}</span>
                  <Button variant="outline" className="rounded-full" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Abmelden</Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="outline" className="rounded-full bg-white w-full" onClick={() => navigateTo("login")}><LogIn className="mr-2 h-4 w-4" /> Anmelden</Button>
                <Button variant="ghost" className="rounded-full w-full" onClick={() => navigateTo("register")}><User className="mr-2 h-4 w-4" /> Registrieren</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );

  // Map Preview Widget
  const renderMapPreview = () => {
    const pins = [
      { top: "18%", left: "23%", color: "bg-green-800", icon: Store },
      { top: "34%", left: "14%", color: "bg-amber-800", icon: Egg },
      { top: "25%", left: "70%", color: "bg-blue-600", icon: Milk },
      { top: "52%", left: "78%", color: "bg-green-700", icon: Store },
      { top: "60%", left: "26%", color: "bg-green-800", icon: Store },
      { top: "67%", left: "68%", color: "bg-orange-500", icon: Store },
    ];

    return (
      <div className="relative h-[330px] overflow-hidden rounded-[2rem] bg-[#e8f1e5] shadow-inner md:h-[420px]">
        <div className="absolute inset-0 opacity-80" style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(88,129,87,.18) 0 12%, transparent 13%), radial-gradient(circle at 78% 25%, rgba(68,137,185,.15) 0 10%, transparent 11%), radial-gradient(circle at 60% 70%, rgba(234,145,42,.14) 0 12%, transparent 13%), linear-gradient(35deg, transparent 0 22%, rgba(255,255,255,.55) 23% 24%, transparent 25% 46%, rgba(255,255,255,.45) 47% 48%, transparent 49%)"
        }} />
        <div className="absolute left-[8%] top-[72%] h-2 w-[86%] rotate-[-8deg] rounded-full bg-white/70" />
        <div className="absolute left-[10%] top-[40%] h-2 w-[88%] rotate-[16deg] rounded-full bg-white/70" />
        <div className="absolute left-[50%] top-[48%] flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-blue-500/15">
          <div className="h-5 w-5 rounded-full border-4 border-white bg-blue-500 shadow-lg" />
        </div>
        {pins.map((pin, index) => {
          const Icon = pin.icon;
          return (
            <motion.div
              key={index}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.08 }}
              className={`absolute flex h-12 w-12 items-center justify-center rounded-t-full rounded-bl-full ${pin.color} -rotate-45 shadow-lg`}
              style={{ top: pin.top, left: pin.left }}
            >
              <Icon className="h-6 w-6 rotate-45 text-white" />
            </motion.div>
          );
        })}
        <Button className="absolute bottom-6 right-6 rounded-full bg-white px-5 py-6 text-neutral-800 shadow-lg hover:bg-white">
          <MapPin className="mr-2 h-5 w-5" /> In diesem Bereich suchen
        </Button>
      </div>
    );
  };

  // Place Card Widget
  const renderPlaceCard = (place) => {
    const isFav = favorites.some(f => f.id === place.id);
    return (
      <Card key={place.id} className="overflow-hidden rounded-[1.75rem] border-neutral-200 bg-white/95 shadow-sm transition hover:shadow-md">
        <CardContent className="grid gap-4 p-3 sm:grid-cols-[220px_1fr]">
          <div className="relative h-48 overflow-hidden rounded-[1.35rem] sm:h-full cursor-pointer" onClick={() => navigateTo("farm-detail", { id: place.id })}>
            <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
            <div className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-sm font-semibold text-green-800 shadow-sm">
              {place.status || 'Aktiv'}
            </div>
            {user && user.role === 'customer' && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleToggleFavorite(place.id); }} 
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm hover:scale-105 active:scale-95 transition"
              >
                <Heart className={`h-5 w-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-800'}`} />
              </button>
            )}
          </div>
          <div className="flex flex-col justify-between p-2">
            <div>
              <div 
                className="text-2xl font-bold leading-tight text-neutral-950 hover:text-green-800 cursor-pointer"
                onClick={() => navigateTo("farm-detail", { id: place.id })}
              >
                {place.name}
              </div>
              <div className="mt-1 font-semibold text-green-800">{place.type}</div>
              <div className="mt-4 space-y-2 text-sm text-neutral-700">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-green-800" /> {place.address || 'Keine Adresse hinterlegt'}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-green-800" /> {place.hours}</div>
              </div>
              <p className="mt-4 max-w-md text-neutral-800 line-clamp-2">{place.description}</p>
            </div>
            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-1 font-semibold">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /> {place.rating || '5.0'} 
                <span className="text-neutral-500">({place.reviews || '0'})</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  className="h-12 rounded-full px-5 border-neutral-300"
                  onClick={() => navigateTo("farm-detail", { id: place.id })}
                >
                  Details
                </Button>
                <Button 
                  className="h-12 w-12 rounded-full bg-green-800 p-0 hover:bg-green-900"
                  onClick={() => navigateToMap(place.address)}
                >
                  <Navigation className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  /* ==========================================================================
     PAGES RENDERING
     ========================================================================== */

  // 1. HOME / FINDER PAGE
  const renderHome = () => (
    <div>
      <section className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="mb-5 inline-flex rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-900">Regional einkaufen. Direkt hinfahren.</div>
          <h1 className="text-5xl font-bold tracking-tight text-green-950 md:text-7xl">Finde Hofläden in deiner Nähe.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-neutral-700">Entdecke Hofläden, Milchstationen, Eierstationen und regionale Automaten. Mit Öffnungszeiten, Bildern und direkter Navigation.</p>
          
          <div className="mt-7 flex max-w-2xl items-center gap-3 rounded-full bg-white p-2 shadow-sm ring-1 ring-neutral-200">
            <Search className="ml-3 h-6 w-6 text-neutral-400" />
            <input 
              className="min-w-0 flex-1 bg-transparent py-3 outline-none" 
              placeholder="Suche nach Hofläden, Milchstationen, Eierstationen..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') setSearchQuery(searchInput); }}
            />
            <Button className="rounded-full bg-green-800 px-6 hover:bg-green-900" onClick={() => setSearchQuery(searchInput)}>Suchen</Button>
          </div>
          
          <div className="mt-5 flex flex-wrap gap-3 text-sm text-neutral-600">
            <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-neutral-100">Jetzt geöffnet</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-neutral-100">24/7 Automaten</span>
            <span className="rounded-full bg-white px-4 py-2 shadow-sm border border-neutral-100">Favoriten speichern</span>
          </div>
        </motion.div>
        {renderMapPreview()}
      </section>

      {/* Categories Bar */}
      <section id="entdecken" className="mt-12">
        <div className="flex gap-4 overflow-x-auto pb-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;
            return (
              <button 
                key={category.id} 
                onClick={() => setSelectedCategory(category.id)} 
                className={`min-w-[118px] rounded-[1.5rem] p-4 text-center shadow-sm transition cursor-pointer ${isActive ? "bg-green-100 text-green-900 border-2 border-green-800/20" : "bg-white text-neutral-700 hover:bg-neutral-50"}`}
              >
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70"><Icon className="h-7 w-7 text-green-800" /></div>
                <div className="font-semibold">{category.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Grid: Listings + Side Banner */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-green-950">In deiner Nähe</h2>
            {searchQuery || selectedCategory !== 'all' ? (
              <Button 
                variant="ghost" 
                className="rounded-full text-neutral-500" 
                onClick={() => { setSearchInput(""); setSearchQuery(""); setSelectedCategory("all"); }}
              >
                Filter zurücksetzen
              </Button>
            ) : null}
          </div>
          <div className="space-y-6">
            {places.length > 0 ? (
              places.map((place) => renderPlaceCard(place))
            ) : (
              <Card className="p-8 text-center bg-white rounded-2xl border-neutral-200">
                <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-3" />
                <div className="text-xl font-bold">Keine Hofläden gefunden</div>
                <p className="text-neutral-500 mt-2">Versuche es mit einem anderen Suchbegriff oder passe die Kategorie an.</p>
              </Card>
            )}
          </div>
        </div>

        <aside id="anbieter" className="space-y-4">
          <Card className="rounded-[2rem] border-green-100 bg-green-900 text-white shadow-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="mb-3 text-sm font-semibold text-green-100">Für Hofläden & Stationen</div>
              <h3 className="text-3xl font-bold">Mehr Besucher aus deiner Region.</h3>
              <p className="mt-4 leading-7 text-green-50">Erstelle dein Profil mit Bildern, Öffnungszeiten, Produkten und direkter Navigation. Ideal für Hofläden, Eierstationen, Milchautomaten und Verkaufsautomaten.</p>
              <div id="preise" className="mt-6 rounded-2xl bg-white/10 p-4 border border-white/5">
                <div className="text-sm text-green-100">Anbieter-Abo</div>
                <div className="mt-1 text-4xl font-bold">5,99 € <span className="text-base font-medium text-green-100">/ Monat</span></div>
              </div>
              <Button className="mt-6 w-full rounded-full bg-white py-6 text-green-900 hover:bg-green-50" onClick={() => navigateTo(user ? "dashboard" : "register")}>
                Hofladen eintragen
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-white border border-neutral-200/60 shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold text-neutral-900">Kundenkonto</h3>
              <p className="mt-2 text-neutral-700">Speichere Lieblingsorte, markiere Hofläden und finde sie jederzeit wieder.</p>
              <Button variant="outline" className="mt-5 w-full rounded-full py-6" onClick={() => navigateTo("register")}>
                <User className="mr-2 h-4 w-4" /> Kostenlos anmelden
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </div>
  );

  // 2. DETAILED FARM SHOP PAGE
  const renderFarmDetail = () => {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadShop = async () => {
        try {
          const data = await api.getFarmShop(viewParams.id);
          setShop(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      loadShop();
    }, [viewParams.id]);

    if (loading) return <div className="text-center py-20 text-neutral-500">Lade Hofladen-Details...</div>;
    if (!shop) return <div className="text-center py-20 text-red-500">Hofladen nicht gefunden.</div>;

    const isFav = favorites.some(f => f.id === shop.id);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigateTo("home")} className="mb-4">
          &larr; Zurück zur Übersicht
        </Button>

        <Card className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white">
          <div className="relative h-96 w-full">
            <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            
            {/* Corner tags */}
            <div className="absolute bottom-6 left-6 text-white">
              <div className="text-sm font-semibold uppercase tracking-wider text-green-300">{shop.type}</div>
              <h1 className="text-4xl font-extrabold mt-1">{shop.name}</h1>
            </div>

            <div className="absolute top-6 right-6 flex gap-3">
              {user && user.role === 'customer' && (
                <button 
                  onClick={() => handleToggleFavorite(shop.id)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-md hover:scale-105 transition"
                >
                  <Heart className={`h-6 w-6 ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-800'}`} />
                </button>
              )}
              <Button className="rounded-full bg-green-800 hover:bg-green-900" onClick={() => navigateToMap(shop.address)}>
                <Navigation className="mr-2 h-5 w-5" /> Wegbeschreibung
              </Button>
            </div>
          </div>

          <CardContent className="p-8 grid gap-8 md:grid-cols-[1fr_280px]">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">Über uns</h2>
                <p className="text-neutral-700 mt-3 leading-8">{shop.description}</p>
              </div>

              <div className="border-t border-neutral-100 pt-6">
                <h3 className="font-bold text-lg">Kontaktmöglichkeiten</h3>
                <div className="grid gap-3 mt-4 text-sm text-neutral-800">
                  {shop.contact?.phone && <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-green-800" /> {shop.contact.phone}</div>}
                  {shop.contact?.email && <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-green-800" /> {shop.contact.email}</div>}
                  {shop.contact?.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-green-800" /> 
                      <a href={`https://${shop.contact.website}`} target="_blank" rel="noreferrer" className="underline text-green-800 hover:text-green-900">
                        {shop.contact.website}
                      </a>
                    </div>
                  )}
                  {shop.contact?.whatsapp && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-green-800" /> 
                      <a href={shop.contact.whatsapp} target="_blank" rel="noreferrer" className="underline text-green-800 hover:text-green-900 font-semibold">
                        WhatsApp Chat starten
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6 bg-neutral-50/50 p-6 rounded-2xl border border-neutral-100">
              <div>
                <h3 className="font-bold text-neutral-900">Öffnungszeiten</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-green-600 animate-pulse" />
                  <span className="font-semibold text-green-800">{shop.status}</span>
                </div>
                <p className="text-sm text-neutral-700 mt-3">{shop.hours}</p>
              </div>

              <div className="border-t border-neutral-200/60 pt-4">
                <h3 className="font-bold text-neutral-900">Standort</h3>
                <div className="flex items-start gap-2 mt-2 text-sm text-neutral-600">
                  <MapPin className="h-5 w-5 text-green-800 shrink-0 mt-0.5" />
                  <span>{shop.address}</span>
                </div>
              </div>

              <div className="border-t border-neutral-200/60 pt-4">
                <h3 className="font-bold text-neutral-900">Bewertungen</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-lg">{shop.rating}</span>
                  <span className="text-neutral-500 text-sm">({shop.reviews} Bewertungen)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // 3. BLOG LIST PAGE
  const renderBlogList = () => (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-green-950">Unser Landleben-Blog</h1>
        <p className="text-neutral-600 mt-2 max-w-md mx-auto">Interessante Artikel rund um heimische Landwirtschaft, Imkerei und gesunde Ernährung.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {blogs.map(post => (
          <Card key={post.id} className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition">
            <div>
              <div className="h-56 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-700/10">
                  {post.category}
                </span>
                <h2 className="text-2xl font-bold text-neutral-950 leading-tight pt-1">{post.title}</h2>
                <p className="text-neutral-700 text-sm leading-relaxed">{post.teaser}</p>
              </div>
            </div>
            <div className="p-6 pt-0 flex items-center justify-between border-t border-neutral-50 mt-4">
              <span className="text-xs text-neutral-500">{post.publishDate}</span>
              <Button 
                variant="ghost" 
                className="text-green-800 font-semibold"
                onClick={() => navigateTo("blog-detail", { slug: post.slug })}
              >
                Weiterlesen &rarr;
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  // 4. BLOG DETAIL PAGE
  const renderBlogDetail = () => {
    const post = blogs.find(p => p.slug === viewParams.slug);

    if (!post) return <div className="text-center py-20 text-neutral-500">Blogbeitrag wird geladen...</div>;

    return (
      <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigateTo("blog")} className="mb-4">
          &larr; Zurück zum Blog
        </Button>

        <Card className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white">
          <div className="h-[350px]">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-700/10">
                {post.category}
              </span>
              <span className="text-sm text-neutral-500">{post.publishDate}</span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-neutral-950 leading-tight">{post.title}</h1>
            
            <p className="text-lg font-medium text-neutral-700 border-l-4 border-green-800 pl-4 py-1 leading-relaxed">
              {post.teaser}
            </p>

            <div className="text-neutral-800 leading-8 space-y-6 pt-4 whitespace-pre-line text-base">
              {post.content}
            </div>
          </CardContent>
        </Card>
      </motion.article>
    );
  };

  // 5. LOGIN PAGE
  const renderLogin = () => (
    <div className="max-w-md mx-auto">
      <Card className="rounded-[2.5rem] border-neutral-200 bg-white p-8">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-green-950">Willkommen zurück</h1>
            <p className="text-neutral-500 mt-2 text-sm">Melde dich an, um Favoriten zu sichern oder deinen Hofladen zu verwalten.</p>
          </div>

          {authError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">{authError}</div>}
          {authSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{authSuccess}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">E-Mail-Adresse</label>
              <input 
                type="email" 
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                placeholder="z.B. name@beispiel.de"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Passwort</label>
              <input 
                type="password" 
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                placeholder="Dein Passwort"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full rounded-full py-6 mt-4">Einloggen</Button>
          </form>

          <div className="text-center text-sm pt-4 border-t border-neutral-100">
            Noch kein Konto?{" "}
            <button onClick={() => navigateTo("register")} className="text-green-800 font-bold hover:underline">
              Jetzt registrieren
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 6. REGISTER PAGE
  const renderRegister = () => (
    <div className="max-w-md mx-auto">
      <Card className="rounded-[2.5rem] border-neutral-200 bg-white p-8">
        <CardContent className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-green-950">Konto erstellen</h1>
            <p className="text-neutral-500 mt-2 text-sm">Erstelle dein Konto, um Hofläden zu finden oder anzubieten.</p>
          </div>

          {authError && <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">{authError}</div>}
          {authSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{authSuccess}</div>}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setAuthRole("customer")}
              className={`py-3 rounded-xl text-sm font-bold transition ${authRole === 'customer' ? 'bg-white text-green-900 shadow-sm' : 'text-neutral-600'}`}
            >
              Ich bin Kunde
            </button>
            <button 
              onClick={() => setAuthRole("vendor")}
              className={`py-3 rounded-xl text-sm font-bold transition ${authRole === 'vendor' ? 'bg-white text-green-900 shadow-sm' : 'text-neutral-600'}`}
            >
              Ich bin Anbieter
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Name</label>
              <input 
                type="text" 
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                placeholder={authRole === 'customer' ? "z.B. Max Mustermann" : "z.B. Biohof Maier"}
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">E-Mail-Adresse</label>
              <input 
                type="email" 
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                placeholder="z.B. name@beispiel.de"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Passwort</label>
              <input 
                type="password" 
                required
                className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20 focus:border-green-800"
                placeholder="Mindestens 6 Zeichen"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full rounded-full py-6 mt-4">Konto erstellen</Button>
          </form>

          <div className="text-center text-sm pt-4 border-t border-neutral-100">
            Bereits ein Konto?{" "}
            <button onClick={() => navigateTo("login")} className="text-green-800 font-bold hover:underline">
              Anmelden
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // 7. PORTAL DASHBOARDS ROUTER
  const renderDashboard = () => {
    if (!user) return <div className="text-center py-20 text-neutral-500">Bitte melde dich an.</div>;

    if (user.role === 'customer') return renderCustomerDashboard();
    if (user.role === 'vendor') return renderVendorDashboard();
    if (user.role === 'admin') return renderAdminDashboard();

    return null;
  };

  // CUSTOMER DASHBOARD
  const renderCustomerDashboard = () => (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      {/* Side Profile Card */}
      <aside className="space-y-4">
        <Card className="rounded-[2rem] bg-white border border-neutral-200/60 p-6 text-center">
          <CardContent className="space-y-4 p-0">
            <div className="h-20 w-20 bg-green-50 rounded-full border border-green-800/10 flex items-center justify-center mx-auto">
              <User className="h-10 w-10 text-green-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">{user.profile?.name}</h2>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
            <div className="pt-2 border-t border-neutral-100 flex justify-around text-sm font-semibold">
              <div>
                <div className="text-xl font-extrabold text-green-900">{favorites.length}</div>
                <div className="text-xs text-neutral-500">Favoriten</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>

      {/* Favorites & Settings */}
      <main className="space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-green-950">Kundenkonto</h1>
          <p className="text-neutral-500">Verwalte deine Profileinstellungen und favorisierten Einkaufsorte.</p>
        </div>

        {/* Favorite shops list */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" /> Deine Favoritenliste
          </h2>
          <div className="grid gap-4">
            {favorites.length > 0 ? (
              favorites.map(place => (
                <Card key={place.id} className="p-4 bg-white border-neutral-200 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={place.image} alt={place.name} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold hover:text-green-800 cursor-pointer" onClick={() => navigateTo("farm-detail", { id: place.id })}>{place.name}</h3>
                      <p className="text-xs text-green-800 font-semibold">{place.type}</p>
                      <p className="text-xs text-neutral-500 mt-1">{place.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-full text-red-600 hover:bg-red-50" onClick={() => handleToggleFavorite(place.id)}>
                      Entfernen
                    </Button>
                    <Button className="h-10 w-10 p-0 rounded-full bg-green-800" onClick={() => navigateTo("farm-detail", { id: place.id })}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center bg-white border border-neutral-100 rounded-2xl">
                <Heart className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                <div className="font-semibold text-neutral-600">Noch keine Favoriten gespeichert</div>
                <p className="text-neutral-400 text-sm mt-1">Durchstöbere die Karte und klicke auf das Herz, um Orte hier zu sichern.</p>
              </Card>
            )}
          </div>
        </section>
      </main>
    </div>
  );

  // VENDOR DASHBOARD
  const renderVendorDashboard = () => {
    const isSubscribed = user.profile?.subscriptionActive;
    const isApproved = user.farmShop?.approved;

    return (
      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        {/* Vendor Side Panel */}
        <aside className="space-y-4">
          <Card className="rounded-[2rem] bg-white border border-neutral-200/60 p-6 text-center">
            <CardContent className="space-y-4 p-0">
              <div className="h-20 w-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                <Store className="h-10 w-10 text-green-800" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-neutral-900">{user.farmShop?.name || 'Dein Hofladen'}</h2>
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${isApproved ? 'bg-green-50 text-green-800 border border-green-700/10' : 'bg-yellow-50 text-yellow-800 border border-yellow-700/10'}`}>
                  {isApproved ? 'Verifiziert & Sichtbar' : 'Wartet auf Admin-Freigabe'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Manager (Stripe placeholder) */}
          <Card className="rounded-[2rem] bg-green-900 text-white p-6">
            <CardContent className="p-0 space-y-4">
              <h3 className="font-bold text-lg">Abo-Status</h3>
              <p className="text-xs text-green-100">Für 5,99 €/Monat erhältst du Premium-Präsenz in deiner Region.</p>
              
              <div className="bg-white/10 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold">{isSubscribed ? 'Premium Aktiv' : 'Basis-Modell'}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">EUR 5,99</span>
              </div>

              <Button 
                className="w-full bg-white text-green-900 hover:bg-neutral-50 rounded-full"
                onClick={() => handleToggleSubscription(isSubscribed)}
              >
                {isSubscribed ? 'Abonnement kündigen' : 'Jetzt freischalten (Stripe)'}
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Editor Form */}
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-green-950">Anbieterbereich</h1>
            <p className="text-neutral-500">Bearbeite deine Profildetails und halte deine Verkaufszeiten aktuell.</p>
          </div>

          {vendorSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{vendorSuccess}</div>}

          <form onSubmit={handleUpdateVendorProfile} className="bg-white p-8 rounded-[2rem] border border-neutral-200/60 space-y-6 shadow-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Hofladen Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.name}
                  onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Kategorie</label>
                <select 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.category}
                  onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                >
                  <option value="hofladen">Hofladen</option>
                  <option value="milch">Milchstation</option>
                  <option value="eier">Eierstation</option>
                  <option value="automat">Verkaufsautomat</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Beschreibung</label>
                <textarea 
                  rows="3"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.description}
                  onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Adresse</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  placeholder="z.B. Dorfstraße 5, 80331 München"
                  value={vendorForm.address}
                  onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Öffnungszeiten</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  placeholder="z.B. Mo-Fr 08:00 - 18:00 Uhr"
                  value={vendorForm.hours}
                  onChange={(e) => setVendorForm({ ...vendorForm, hours: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Bilder-URL</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.image}
                  onChange={(e) => setVendorForm({ ...vendorForm, image: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Status (Aktuell)</label>
                <select 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.status}
                  onChange={(e) => setVendorForm({ ...vendorForm, status: e.target.value })}
                >
                  <option value="Geöffnet">Geöffnet</option>
                  <option value="Geschlossen">Geschlossen</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Telefonnummer</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  value={vendorForm.phone}
                  onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">Website URL</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  placeholder="www.deinhofladen.de"
                  value={vendorForm.website}
                  onChange={(e) => setVendorForm({ ...vendorForm, website: e.target.value })}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-bold text-neutral-600 uppercase tracking-wider">WhatsApp-Link</label>
                <input 
                  type="text" 
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-green-800/20"
                  placeholder="https://wa.me/49..."
                  value={vendorForm.whatsapp}
                  onChange={(e) => setVendorForm({ ...vendorForm, whatsapp: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="rounded-full px-8 py-5">Änderungen speichern</Button>
          </form>
        </main>
      </div>
    );
  };

  // ADMIN DASHBOARD
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-green-950">Betreiber-Adminbereich</h1>
        <p className="text-neutral-500">Freigaben verwalten, Benutzerkonten einsehen und Blogartikel verfassen.</p>
      </div>

      {adminSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{adminSuccess}</div>}

      {/* Admin tabs */}
      <div className="flex gap-2 border-b border-neutral-200 pb-px">
        <button 
          onClick={() => setAdminTab("approvals")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition ${adminTab === 'approvals' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
        >
          Hofladen-Freigaben ({adminVendors.filter(v => !v.approved).length})
        </button>
        <button 
          onClick={() => setAdminTab("users")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition ${adminTab === 'users' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
        >
          Benutzerverwaltung ({adminUsers.length})
        </button>
        <button 
          onClick={() => setAdminTab("blogs")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition ${adminTab === 'blogs' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
        >
          Blog-Management
        </button>
      </div>

      <AnimatePresence mode="wait">
        {adminTab === 'approvals' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="text-xl font-bold text-neutral-800">Ausstehende Freigaben</h2>
            {adminVendors.filter(v => !v.approved).length > 0 ? (
              adminVendors.filter(v => !v.approved).map(shop => (
                <Card key={shop.id} className="p-5 bg-white border-neutral-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="font-extrabold text-lg">{shop.name}</h3>
                    <p className="text-xs text-green-800 font-semibold">{shop.type}</p>
                    <p className="text-sm text-neutral-600 mt-2"><strong>Adresse:</strong> {shop.address || 'Keine Angabe'}</p>
                    <p className="text-sm text-neutral-600 mt-1"><strong>Beschreibung:</strong> {shop.description}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button className="rounded-full bg-green-800 px-5" onClick={() => handleApproveVendor(shop.id)}>Freischalten</Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center bg-white border border-neutral-100 rounded-2xl text-neutral-500">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-2" />
                <span>Alle Hofläden sind aktuell freigegeben und verifiziert!</span>
              </Card>
            )}

            <h2 className="text-xl font-bold text-neutral-800 pt-6">Freigegebene Hofläden</h2>
            {adminVendors.filter(v => v.approved).map(shop => (
              <Card key={shop.id} className="p-5 bg-white border-neutral-200 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <h3 className="font-extrabold text-lg text-neutral-700">{shop.name}</h3>
                  <p className="text-xs text-green-800 font-semibold">{shop.type}</p>
                  <p className="text-xs text-neutral-500">{shop.address}</p>
                </div>
                <Button variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => handleBlockVendor(shop.id)}>Sperren</Button>
              </Card>
            ))}
          </motion.div>
        )}

        {adminTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl border border-neutral-200 overflow-hidden text-sm text-left">
              <thead className="bg-neutral-50 text-xs font-semibold text-neutral-500 uppercase">
                <tr>
                  <th className="p-4">Benutzer ID</th>
                  <th className="p-4">E-Mail-Adresse</th>
                  <th className="p-4">Rolle</th>
                  <th className="p-4">Erstellt am</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {adminUsers.map(u => (
                  <tr key={u.id}>
                    <td className="p-4 font-mono text-neutral-500">{u.id}</td>
                    <td className="p-4 font-semibold">{u.email}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-800' : u.role === 'vendor' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-neutral-500">{u.createdAt?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {adminTab === 'blogs' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-8 md:grid-cols-[1fr_360px]">
            {/* Create Blog Form */}
            <form onSubmit={handleCreateBlog} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4">
              <h2 className="text-xl font-bold text-neutral-800">Neuen Artikel erstellen</h2>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-500 uppercase">Titel</label>
                <input 
                  type="text" required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                  value={newBlogForm.title}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-500 uppercase">Teaser</label>
                <input 
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                  value={newBlogForm.teaser}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, teaser: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Kategorie</label>
                  <input 
                    type="text" required
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                    value={newBlogForm.category}
                    onChange={(e) => setNewBlogForm({ ...newBlogForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-500 uppercase">Bild URL</label>
                  <input 
                    type="text"
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                    value={newBlogForm.image}
                    onChange={(e) => setNewBlogForm({ ...newBlogForm, image: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-500 uppercase">Inhalt</label>
                <textarea 
                  rows="6" required
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                  value={newBlogForm.content}
                  onChange={(e) => setNewBlogForm({ ...newBlogForm, content: e.target.value })}
                />
              </div>
              <Button type="submit" className="rounded-full px-6 py-4">Veröffentlichen</Button>
            </form>

            {/* Existing blogs list */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-neutral-800">Veröffentlichte Artikel</h2>
              <div className="space-y-2">
                {blogs.map(b => (
                  <Card key={b.id} className="p-4 bg-white border border-neutral-200 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-neutral-800 line-clamp-1">{b.title}</h4>
                      <span className="text-xs text-neutral-400">{b.publishDate}</span>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDeleteBlog(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf8f2] text-neutral-950 flex flex-col justify-between">
      <div>
        {renderHeader()}
        <main className="mx-auto max-w-7xl px-5 pb-28 pt-8">
          <AnimatePresence mode="wait">
            {view === 'home' && renderHome()}
            {view === 'farm-detail' && renderFarmDetail()}
            {view === 'blog' && renderBlogList()}
            {view === 'blog-detail' && renderBlogDetail()}
            {view === 'login' && renderLogin()}
            {view === 'register' && renderRegister()}
            {view === 'dashboard' && renderDashboard()}
          </AnimatePresence>
        </main>
      </div>

      {/* Footer Navigation (Mobile Only) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 px-5 py-3 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 text-xs font-semibold text-neutral-500">
          <button 
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo("home")}
          >
            <Home className="h-6 w-6" />Entdecken
          </button>
          
          <button 
            className={`flex flex-col items-center gap-1 ${view === 'blog' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo("blog")}
          >
            <FileText className="h-6 w-6" />Blog
          </button>

          <button 
            className="-mt-8 flex flex-col items-center gap-1 text-green-800"
            onClick={() => navigateTo("home")}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-800 text-white shadow-lg"><Map className="h-8 w-8" /></span>Karte
          </button>
          
          <button 
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo(user ? "dashboard" : "login")}
          >
            <User className="h-6 w-6" />Konto
          </button>
          
          {user ? (
            <button 
              className="flex flex-col items-center gap-1"
              onClick={handleLogout}
            >
              <LogOut className="h-6 w-6" />Abmelden
            </button>
          ) : (
            <button 
              className="flex flex-col items-center gap-1"
              onClick={() => navigateTo("login")}
            >
              <LogIn className="h-6 w-6" />Login
            </button>
          )}
        </div>
      </nav>

      {/* Public Footer */}
      <footer className="border-t border-neutral-200 bg-white/40 py-8">
        <div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
          <div>© 2026 Hofladen-Finder. Alle Rechte vorbehalten.</div>
          <div className="flex gap-4">
            <button onClick={() => navigateTo("home")} className="hover:underline">Entdecken</button>
            <button onClick={() => navigateTo("blog")} className="hover:underline">Blog</button>
            <button onClick={() => navigateTo("login")} className="hover:underline">Anbieter-Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
