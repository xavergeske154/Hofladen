import React, { useMemo, useState, useEffect } from "react";
import { 
  Search, SlidersHorizontal, Heart, User, MapPin, Clock, Star, Navigation, 
  Home, Milk, Egg, Store, Bell, Menu, Map, ChevronRight, Leaf, LogIn, LogOut,
  Settings, CheckCircle, AlertTriangle, FileText, Plus, Trash2, Globe, Phone, Mail,
  Calendar, BookOpen, Bookmark, ShoppingBag, Book, DollarSign, HeartHandshake, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/utils/api";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

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

// Helper component to change map viewport when center coordinate state updates
function ChangeMapCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  return null;
}

// Category Specific Leaflet Icons
const getMarkerIcon = (category) => {
  let color = "bg-green-800";
  let iconHtml = "";

  if (category === "hofladen") {
    color = "bg-green-800";
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
  } else if (category === "milch") {
    color = "bg-blue-600";
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-milk"><path d="M8 2h8"/><path d="M9 2v2.78c0 .26.11.51.3.7l3.4 3.4c.19.19.3.44.3.7V20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V9.58c0-.26.11-.51.3-.7l3.4-3.4c.19-.19.3-.44.3-.7V2"/><path d="M6 12h12"/><path d="M6 16h12"/></svg>`;
  } else if (category === "eier") {
    color = "bg-amber-800";
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-egg"><path d="M12 22a8 8 0 0 0 8-8c0-5.5-2.7-10-8-10S4 8.5 4 14a8 8 0 0 0 8 8z"/></svg>`;
  } else if (category === "automat") {
    color = "bg-orange-500";
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.4-4c.3-.3.8-.4 1.2-.4h8.8c.4 0 .9.1 1.2.4L22 7"/><path d="M9 12v-2h6v2"/><path d="M12 10v4"/><path d="M12 18H5a2 2 0 0 1-2-2V7h18v9a2 2 0 0 1-2 2h-3"/><path d="M17 18h4"/></svg>`;
  } else {
    color = "bg-green-700";
    iconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store"><path d="m2 7 4.4-4c.3-.3.8-.4 1.2-.4h8.8c.4 0 .9.1 1.2.4L22 7"/><path d="M9 12v-2h6v2"/><path d="M12 10v4"/><path d="M12 18H5a2 2 0 0 1-2-2V7h18v9a2 2 0 0 1-2 2h-3"/><path d="M17 18h4"/></svg>`;
  }

  return L.divIcon({
    html: `<div class="flex h-10 w-10 items-center justify-center rounded-t-full rounded-bl-full ${color} -rotate-45 shadow-md text-white border-2 border-white"><div class="rotate-45">${iconHtml}</div></div>`,
    className: "custom-leaflet-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

export default function HofladenWebAppStartseite() {
  // Navigation State
  const [view, setView] = useState("home"); // home, farm-detail, blog, blog-detail, login, register, dashboard, events, cookbook, affiliates
  const [viewParams, setViewParams] = useState({});

  // Global Session State
  const [user, setUser] = useState(null);
  
  // Data States
  const [places, setPlaces] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [readingList, setReadingList] = useState([]);

  // Postcode Coordinates State to allow centering on searched PLZ even if empty
  const [plzCoordinates, setPlzCoordinates] = useState(null);

  useEffect(() => {
    if (searchPlz) {
      const cleanPlz = searchPlz.trim();
      const lookup = {
        '85560': [48.0779, 11.9715],
        '85604': [48.0827, 11.8267],
        '85567': [48.0478, 11.9664],
        '53909': [50.6904, 6.6508],
      };
      if (lookup[cleanPlz]) {
        setPlzCoordinates(lookup[cleanPlz]);
      } else {
        // Fallback: deterministic offset in Bavaria if it is some other PLZ
        let sum = 0;
        for (let i = 0; i < cleanPlz.length; i++) sum += cleanPlz.charCodeAt(i);
        const latOffset = ((sum % 100) / 1000) - 0.05;
        const lngOffset = (((sum >> 8) % 100) / 1000) - 0.05;
        setPlzCoordinates([48.1371 + latOffset, 11.5754 + lngOffset]);
      }
    } else {
      setPlzCoordinates(null);
    }
  }, [searchPlz]);

  // Auto-center map based on places search results coordinates or searchPlz coordinates
  const mapCenter = useMemo(() => {
    if (plzCoordinates) return plzCoordinates;

    const validPlaces = places.filter(p => p.lat && p.lng);
    if (validPlaces.length > 0) {
      const sumLat = validPlaces.reduce((sum, p) => sum + p.lat, 0);
      const sumLng = validPlaces.reduce((sum, p) => sum + p.lng, 0);
      return [sumLat / validPlaces.length, sumLng / validPlaces.length];
    }
    return [48.0779, 11.9715]; // Default: Ebersberg
  }, [places, plzCoordinates]);

  const handleOpenMapRoute = (address) => {
    const encodedAddress = encodeURIComponent(address);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      const confirmAppleMaps = window.confirm("Möchtest du die Navigation in Apple Maps öffnen? (Abbrechen für Google Maps)");
      if (confirmAppleMaps) {
        window.open(`maps://?daddr=${encodedAddress}`, "_blank");
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank");
      }
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, "_blank");
    }
  };

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchPlz, setSearchPlz] = useState("");
  const [plzInput, setPlzInput] = useState("");
  const [searchRadius, setSearchRadius] = useState("10"); // 2, 5, 10, 25, 50 km
  
  // Form/Auth States
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authRole, setAuthRole] = useState("customer");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Blog States
  const [selectedBlogCat, setSelectedBlogCat] = useState("all");
  const [blogSearch, setBlogSearch] = useState("");

  // Sync guest favorites & reading list from localStorage
  useEffect(() => {
    if (!user) {
      const syncGuestData = async () => {
        try {
          const localFavs = JSON.parse(localStorage.getItem("guest_favorites") || "[]");
          if (localFavs.length > 0) {
            const allShops = await api.getFarmShops();
            const favPlaces = allShops.filter(p => localFavs.includes(p.id));
            setFavorites(favPlaces);
          } else {
            setFavorites([]);
          }
        } catch (err) {
          console.error("Failed to sync guest favorites", err);
        }
        try {
          const localRl = JSON.parse(localStorage.getItem("guest_reading_list") || "[]");
          if (localRl.length > 0) {
            const allBlogs = blogs.length > 0 ? blogs : await api.getBlogs();
            const bookmarkedBlogs = allBlogs.filter(b => localRl.includes(b.id));
            setReadingList(bookmarkedBlogs);
          } else {
            setReadingList([]);
          }
        } catch (err) {
          console.error("Failed to sync guest reading list", err);
        }
      };
      syncGuestData();
    }
  }, [user, blogs]);

  // Events & Calendar States
  const [events, setEvents] = useState([]);
  const [selectedEventCategory, setSelectedEventCategory] = useState("all");
  const [eventTab, setEventTab] = useState("all"); // all, wochenmarkt, hoffest

  // Dropdown & Banner UI State
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [donationBannerDismissed, setDonationBannerDismissed] = useState(() => {
    return localStorage.getItem("donation_dismissed") === "true";
  });

  // Vendor Dashboard Edit State
  const [vendorForm, setVendorForm] = useState({
    name: "", description: "", address: "", hours: "", category: "hofladen",
    phone: "", website: "", whatsapp: "", status: "Geöffnet", image: ""
  });
  const [vendorSuccess, setVendorSuccess] = useState("");

  // Vendor Dashboard Event Upload State
  const [newEventForm, setNewEventForm] = useState({
    title: "", date: "", time: "", description: "", location: "", category: "hoffest"
  });
  const [vendorEventSuccess, setVendorEventSuccess] = useState("");

  // Vendor Dashboard Pickup Package Upload State
  const [newPkgForm, setNewPkgForm] = useState({
    title: "", description: "", price: "", originalValue: "", pickupTime: "", quantity: "3"
  });
  const [vendorPkgSuccess, setVendorPkgSuccess] = useState("");

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
            const rl = await api.getReadingList();
            setReadingList(rl);
          }
        } catch (err) {
          console.error("Token restore failed", err);
          api.logout();
        }
      }
    };
    fetchUser();
  }, []);

  // Handle hash routing for deep linking and back/forward browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#/blog-detail/")) {
        const slug = hash.replace("#/blog-detail/", "");
        setView("blog-detail");
        setViewParams({ slug });
      } else if (hash.startsWith("#/farm-detail/")) {
        const id = parseInt(hash.replace("#/farm-detail/", ""), 10);
        setView("farm-detail");
        setViewParams({ id });
      } else if (hash === "#/blog") {
        setView("blog");
        setViewParams({});
      } else if (hash === "#/events") {
        setView("events");
        setViewParams({});
      } else if (hash === "#/cookbook") {
        setView("cookbook");
        setViewParams({});
      } else if (hash === "#/affiliates") {
        setView("affiliates");
        setViewParams({});
      } else if (hash === "#/dashboard") {
        setView("dashboard");
        setViewParams({});
      } else if (hash === "#/login") {
        setView("login");
        setViewParams({});
      } else if (hash === "#/register") {
        setView("register");
        setViewParams({});
      } else if (hash === "#/" || hash === "") {
        setView("home");
        setViewParams({});
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Run once on initialization

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Fetch Public Farm Shops with Radius PLZ filter & Blogs & Events
  useEffect(() => {
    const loadShops = async () => {
      try {
        const list = await api.getFarmShops({ 
          q: searchQuery, 
          category: selectedCategory, 
          plz: searchPlz, 
          radius: searchRadius 
        });
        setPlaces(list);
      } catch (err) {
        console.error("Failed to load farm shops", err);
      }
    };
    loadShops();
  }, [searchQuery, selectedCategory, searchPlz, searchRadius]);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const list = await api.getBlogs();
        setBlogs(list);
      } catch (err) {
        console.error("Failed to load blogs", err);
      }
    };
    if (view === 'blog' || view === 'blog-detail' || blogs.length === 0) {
      loadBlogs();
    }
  }, [view]);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const list = await api.getEvents({ category: selectedEventCategory });
        setEvents(list);
      } catch (err) {
        console.error("Failed to load events", err);
      }
    };
    loadEvents();
  }, [selectedEventCategory]);

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
    if (newView === "register" && params.role) {
      setAuthRole(params.role);
    }

    // Update window.location.hash for shareable links
    let targetHash = "";
    if (newView === "blog-detail") {
      targetHash = `#/blog-detail/${params.slug}`;
    } else if (newView === "farm-detail") {
      targetHash = `#/farm-detail/${params.id}`;
    } else if (newView === "home") {
      targetHash = `#/`;
    } else {
      targetHash = `#/${newView}`;
    }

    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
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
        const rl = await api.getReadingList();
        setReadingList(rl);
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
    setReadingList([]);
    setProfileDropdownOpen(false);
    navigateTo("home");
  };

  // Customer Actions
  const handleToggleFavorite = async (placeId) => {
    if (!user || user.role !== 'customer') {
      const localFavs = JSON.parse(localStorage.getItem("guest_favorites") || "[]");
      let updatedFavs;
      if (localFavs.includes(placeId)) {
        updatedFavs = localFavs.filter(id => id !== placeId);
      } else {
        updatedFavs = [...localFavs, placeId];
      }
      localStorage.setItem("guest_favorites", JSON.stringify(updatedFavs));
      
      try {
        const allShops = await api.getFarmShops();
        setFavorites(allShops.filter(p => updatedFavs.includes(p.id)));
      } catch (err) {
        console.error("Error updating guest favorites", err);
      }
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

  const handleToggleReadingList = async (blogId) => {
    if (!user || user.role !== 'customer') {
      const localRl = JSON.parse(localStorage.getItem("guest_reading_list") || "[]");
      let updatedRl;
      if (localRl.includes(blogId)) {
        updatedRl = localRl.filter(id => id !== blogId);
      } else {
        updatedRl = [...localRl, blogId];
      }
      localStorage.setItem("guest_reading_list", JSON.stringify(updatedRl));
      
      try {
        const allBlogs = blogs.length > 0 ? blogs : await api.getBlogs();
        setReadingList(allBlogs.filter(b => updatedRl.includes(b.id)));
      } catch (err) {
        console.error("Error updating guest reading list", err);
      }
      return;
    }

    const isBookmarked = readingList.some(r => r.id === blogId);
    try {
      if (isBookmarked) {
        await api.removeReadingList(blogId);
        setReadingList(readingList.filter(r => r.id !== blogId));
      } else {
        await api.addReadingList(blogId);
        const updatedRl = await api.getReadingList();
        setReadingList(updatedRl);
      }
    } catch (err) {
      console.error("Reading list toggle failed", err);
    }
  };

  const handleReservePackage = async (packageId, shopId) => {
    if (!user || user.role !== 'customer') {
      navigateTo("login");
      return;
    }

    try {
      await api.reservePackage(packageId);
      // reload events or pages if necessary
    } catch (err) {
      alert(err.message || "Reservierung fehlgeschlagen");
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

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setVendorEventSuccess("");
    if (!user || !user.farmShop) return;

    try {
      await api.createEvent({
        ...newEventForm,
        farmShopId: user.farmShop.id
      });
      setVendorEventSuccess("Veranstaltung erfolgreich erstellt!");
      setNewEventForm({ title: "", date: "", time: "", description: "", location: "", category: "hoffest" });
      const list = await api.getEvents({ category: selectedEventCategory });
      setEvents(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await api.deleteEvent(eventId);
      const list = await api.getEvents({ category: selectedEventCategory });
      setEvents(list);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePackage = async (e) => {
    e.preventDefault();
    setVendorPkgSuccess("");
    try {
      await api.createPackage(newPkgForm);
      setVendorPkgSuccess("Retter-Tüte erfolgreich eingestellt!");
      setNewPkgForm({ title: "", description: "", price: "", originalValue: "", pickupTime: "", quantity: "3" });
    } catch (err) {
      console.error(err);
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
          <button onClick={() => navigateTo("home")} className={`hover:text-green-800 transition py-1 ${view === 'home' || view === 'farm-detail' ? 'text-green-950 border-b-2 border-green-800' : ''}`}>Entdecken</button>
          <button onClick={() => navigateTo("events")} className={`hover:text-green-800 transition py-1 ${view === 'events' ? 'text-green-950 border-b-2 border-green-800' : ''}`}>Events & Kalender</button>
          <button onClick={() => navigateTo("blog")} className={`hover:text-green-800 transition py-1 ${view === 'blog' || view === 'blog-detail' ? 'text-green-950 border-b-2 border-green-800' : ''}`}>Blog</button>
          <button onClick={() => navigateTo("cookbook")} className={`hover:text-green-800 transition py-1 ${view === 'cookbook' ? 'text-green-950 border-b-2 border-green-800' : ''}`}>Kochbuch</button>
          <button onClick={() => navigateTo("affiliates")} className={`hover:text-green-800 transition py-1 ${view === 'affiliates' ? 'text-green-950 border-b-2 border-green-800' : ''}`}>Garten-Shop</button>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex relative">
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)} 
              className="flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-neutral-200 hover:shadow-sm transition"
            >
              <div className="h-8 w-8 bg-green-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {user ? (user.profile?.name || user.email).charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </div>
              <span className="text-sm font-semibold text-neutral-700 max-w-[120px] truncate">{user ? (user.profile?.name || user.email) : "Mein Bereich"}</span>
              <ChevronDown className="h-4 w-4 text-neutral-500" />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-neutral-200/80 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-neutral-100">
                    <p className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Konto-Modus</p>
                    <p className="text-sm font-bold text-neutral-800 truncate">{user ? user.email : "Gast-Modus"}</p>
                  </div>
                  <button 
                    onClick={() => { setProfileDropdownOpen(false); navigateTo("dashboard"); }} 
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" /> Favoriten
                  </button>
                  <button 
                    onClick={() => { setProfileDropdownOpen(false); navigateTo("dashboard"); }} 
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700 flex items-center gap-2"
                  >
                    <Bookmark className="h-4 w-4 text-blue-500 fill-blue-500" /> Leseliste
                  </button>
                  {user && (
                    <button 
                      onClick={() => { setProfileDropdownOpen(false); handleLogout(); }} 
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-neutral-50 text-red-600 font-semibold flex items-center gap-2 border-t border-neutral-100"
                    >
                      <LogOut className="h-4 w-4" /> Abmelden
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
            <button onClick={() => navigateTo("events")} className="text-left py-2 border-b border-neutral-100">Events & Kalender</button>
            <button onClick={() => navigateTo("blog")} className="text-left py-2 border-b border-neutral-100">Blog</button>
            <button onClick={() => navigateTo("cookbook")} className="text-left py-2 border-b border-neutral-100">Kochbuch</button>
            <button onClick={() => navigateTo("affiliates")} className="text-left py-2 border-b border-neutral-100">Garten-Shop</button>
            <button onClick={() => navigateTo("dashboard")} className="text-left py-2 border-b border-neutral-100">Mein Bereich (Merkliste)</button>
            {user && (
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-neutral-600">{user.email}</span>
                <Button variant="outline" className="rounded-full" onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /> Abmelden</Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );

  // Map Preview Widget (Interactive Leaflet Map)
  const renderMapPreview = () => {
    const validPlaces = places.filter(p => p.lat && p.lng);

    return (
      <div className="relative h-[330px] overflow-hidden rounded-[2rem] border border-neutral-200/80 bg-[#e8f1e5] shadow-sm md:h-[420px] z-10">
        <MapContainer 
          center={mapCenter} 
          zoom={11} 
          scrollWheelZoom={true} 
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <ChangeMapCenter center={mapCenter} />
          {validPlaces.map(place => (
            <Marker 
              key={place.id} 
              position={[place.lat, place.lng]} 
              icon={getMarkerIcon(place.category)}
            >
              <Popup className="custom-popup">
                <div className="p-1 space-y-2 max-w-[200px] text-neutral-800">
                  <h3 className="font-bold text-sm text-neutral-900 leading-tight">{place.name}</h3>
                  <p className="text-xs text-green-800 font-semibold">{place.type}</p>
                  <p className="text-[11px] text-neutral-500 leading-normal">{place.address}</p>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold text-neutral-700">{place.rating}</span>
                    <span className="text-[10px] text-neutral-400">({place.reviews})</span>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-neutral-100 mt-2">
                    <button 
                      className="text-[10px] h-7 px-3 bg-green-800 hover:bg-green-900 rounded-full font-bold text-white transition flex-1 text-center cursor-pointer"
                      onClick={() => navigateTo("farm-detail", { id: place.id })}
                    >
                      Details
                    </button>
                    <button 
                      className="text-[10px] h-7 px-3 rounded-full border border-neutral-300 font-bold hover:bg-neutral-50 transition flex-1 text-center text-neutral-700 cursor-pointer"
                      onClick={() => handleOpenMapRoute(place.address)}
                    >
                      Route
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Floating map search helper */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
          <Button 
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-neutral-800 shadow-md hover:bg-neutral-50 flex items-center gap-1.5 border border-neutral-200"
            onClick={() => { setSearchQuery(searchInput); setSearchPlz(plzInput); }}
          >
            <MapPin className="h-4 w-4 text-green-800" /> In diesem Bereich suchen
          </Button>
        </div>
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
            {(!user || user.role === 'customer') && (
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
          
          <div className="mt-7 flex flex-col md:flex-row gap-3 max-w-2xl rounded-[1.75rem] bg-white p-2.5 shadow-sm ring-1 ring-neutral-200">
            <div className="flex flex-1 items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-neutral-100 pb-2 md:pb-0">
              <Search className="h-5 w-5 text-neutral-400 shrink-0" />
              <input 
                className="min-w-0 flex-1 bg-transparent py-2 outline-none text-sm text-neutral-800" 
                placeholder="Suchbegriff (z.B. Maier, Milch)..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput); setSearchPlz(plzInput); } }}
              />
            </div>
            
            <div className="flex w-full md:w-44 items-center gap-2 px-2 border-b md:border-b-0 md:border-r border-neutral-100 pb-2 md:pb-0">
              <MapPin className="h-5 w-5 text-neutral-400 shrink-0" />
              <input 
                className="w-full bg-transparent py-2 outline-none text-sm text-neutral-800" 
                placeholder="PLZ (z.B. 85560)..." 
                value={plzInput}
                onChange={(e) => setPlzInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearchQuery(searchInput); setSearchPlz(plzInput); } }}
              />
            </div>

            <div className="flex w-full md:w-36 items-center gap-1.5 px-2">
              <span className="text-xs text-neutral-400 uppercase font-bold shrink-0">Radius:</span>
              <select 
                value={searchRadius}
                onChange={(e) => setSearchRadius(e.target.value)}
                className="bg-transparent outline-none text-sm font-semibold text-neutral-700 w-full py-2 cursor-pointer"
              >
                <option value="2">2 km</option>
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>

            <Button 
              className="rounded-full bg-green-800 px-6 py-5 text-sm font-bold hover:bg-green-900 shrink-0"
              onClick={() => { setSearchQuery(searchInput); setSearchPlz(plzInput); }}
            >
              Suchen
            </Button>
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
            {searchQuery || selectedCategory !== 'all' || searchPlz ? (
              <Button 
                variant="ghost" 
                className="rounded-full text-neutral-500" 
                onClick={() => { setSearchInput(""); setSearchQuery(""); setSelectedCategory("all"); setPlzInput(""); setSearchPlz(""); setSearchRadius("10"); }}
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
              <div className="mb-3 text-sm font-semibold text-green-100">Regional & Frisch</div>
              <h3 className="text-2xl font-bold">Hofladen-Finder</h3>
              <p className="mt-4 text-sm leading-relaxed text-green-50">
                Unterstütze die Landwirtschaft in deiner Region! Entdecke frische Milch, Eier, Gemüse und handgemachte Produkte direkt ab Hof. Alle Stationen bieten kurze Transportwege und maximale Frische.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] bg-white border border-green-800/10 shadow-sm">
            <CardContent className="p-6">
              <div className="mb-3 text-sm font-semibold text-green-850">Deine Merkliste</div>
              <h3 className="text-2xl font-bold text-green-950">Favoriten & Leseliste</h3>
              <p className="mt-4 text-sm leading-relaxed text-neutral-700">
                Markiere Hofläden mit dem Herz-Symbol und speichere nützliche Blogartikel mit dem Lesezeichen ab. Sie werden automatisch in deinem Browser gesichert, damit du sie jederzeit wiederfindest.
              </p>
              <Button className="mt-6 w-full rounded-full bg-green-800 py-6 text-white hover:bg-green-900 font-bold" onClick={() => navigateTo("dashboard")}>
                Meine Merkliste öffnen
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
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadShop = async () => {
        try {
          const data = await api.getFarmShop(viewParams.id);
          setShop(data);
          const pkgs = await api.getPackages(viewParams.id);
          setPackages(pkgs);
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
              {(!user || user.role === 'customer') && (
                <button 
                  onClick={() => handleToggleFavorite(shop.id)}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-md hover:scale-105 transition"
                >
                  <Heart className={`h-6 w-6 ${isFav ? 'fill-red-500 text-red-500' : 'text-neutral-800'}`} />
                </button>
              )}
              <Button className="rounded-full bg-green-800 hover:bg-green-900 shadow-md" onClick={() => navigateToMap(shop.address)}>
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
  const renderBlogList = () => {
    const filteredBlogs = blogs.filter(b => {
      const matchesCategory = selectedBlogCat === "all" || b.category.toLowerCase() === selectedBlogCat.toLowerCase();
      const matchesSearch = b.title.toLowerCase().includes(blogSearch.toLowerCase()) || 
                            b.teaser.toLowerCase().includes(blogSearch.toLowerCase()) ||
                            b.content.toLowerCase().includes(blogSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-950">Blog</h1>
          <p className="text-neutral-600 mt-2 max-w-md mx-auto">Hilfreiche DIY-Projekte, Garten-Guides und Wissenswertes über Natur & Imkerei.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-md mx-auto relative rounded-full bg-white shadow-sm ring-1 ring-neutral-200 focus-within:ring-2 focus-within:ring-green-800/20 focus-within:border-green-800 transition p-1 flex items-center gap-2">
          <Search className="h-5 w-5 text-neutral-400 ml-3 shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent py-2.5 pr-4 outline-none text-sm text-neutral-800 placeholder-neutral-400"
            placeholder="Artikel nach Stichworten durchsuchen..."
            value={blogSearch}
            onChange={(e) => setBlogSearch(e.target.value)}
          />
          {blogSearch && (
            <button 
              onClick={() => setBlogSearch("")} 
              className="text-neutral-400 hover:text-neutral-600 text-xs font-semibold px-3 py-1.5 rounded-full hover:bg-neutral-100 transition mr-1"
            >
              Löschen
            </button>
          )}
        </div>

        {/* Blog Categories tabs */}
        <div className="flex gap-2 justify-center border-b border-neutral-200 pb-px">
          {[
            { id: "all", label: "Alle" },
            { id: "diy", label: "DIY-Projekte" },
            { id: "ratgeber", label: "Garten-Guides" },
            { id: "imkerei", label: "Imkerei" },
            { id: "milch", label: "Milch & Geflügel" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedBlogCat(tab.id)}
              className={`py-2.5 px-4 font-bold text-sm border-b-2 transition ${
                selectedBlogCat === tab.id 
                  ? 'border-green-800 text-green-900' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map(post => {
              const isBookmarked = readingList.some(r => r.id === post.id);
              return (
                <Card key={post.id} className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition relative">
                  <div>
                    <div className="h-56 overflow-hidden relative">
                      <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                      {(!user || user.role === 'customer') && (
                        <button 
                          onClick={() => handleToggleReadingList(post.id)}
                          className="absolute right-4 top-4 h-10 w-10 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition"
                        >
                          <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-neutral-700'}`} />
                        </button>
                      )}
                    </div>
                    <div className="p-6 space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-green-800 bg-green-50 px-3 py-1 rounded-full border border-green-700/10">
                        {post.category}
                      </span>
                      <h2 className="text-2xl font-bold text-neutral-955 leading-tight pt-1 cursor-pointer hover:text-green-800" onClick={() => navigateTo("blog-detail", { slug: post.slug })}>{post.title}</h2>
                      <p className="text-neutral-700 text-sm leading-relaxed line-clamp-3">{post.teaser}</p>
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
              );
            })
          ) : (
            <div className="col-span-full text-center py-12 text-neutral-500">
              Keine Blogbeiträge zu diesem Suchbegriff gefunden.
            </div>
          )}
        </div>
      </div>
    );
  };

  // 4. BLOG DETAIL PAGE
  const renderBlogDetail = () => {
    const post = blogs.find(p => p.slug === viewParams.slug);

    if (!post) return <div className="text-center py-20 text-neutral-500">Blogbeitrag wird geladen...</div>;

    const isBookmarked = readingList.some(r => r.id === post.id);

    return (
      <motion.article initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigateTo("blog")} className="mb-4">
          &larr; Zurück zum Blog
        </Button>

        <Card className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white">
          <div className="h-[350px] relative">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            {(!user || user.role === 'customer') && (
              <button 
                onClick={() => handleToggleReadingList(post.id)}
                className="absolute right-6 top-6 h-12 w-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
              >
                <Bookmark className={`h-6 w-6 ${isBookmarked ? 'fill-blue-600 text-blue-600' : 'text-neutral-800'}`} />
              </button>
            )}
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

  // Events & Calendar Page
  const renderEvents = () => {
    const filteredEvents = events.filter(e => {
      if (eventTab === 'wochenmarkt') return e.farmShopId === null;
      if (eventTab === 'hoffest') return e.farmShopId !== null;
      return true;
    });

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-950 flex items-center justify-center gap-2">
            <Calendar className="h-9 w-9 text-green-800" /> Events & Regionaler Kalender
          </h1>
          <p className="text-neutral-600 mt-2 max-w-md mx-auto">Verpasse keine Hoffeste, Wochenmärkte und regionalen Aktionen in deiner Nähe.</p>
        </div>

        {/* Tab filters */}
        <div className="flex gap-2 justify-center border-b border-neutral-200 pb-px">
          {[
            { id: "all", label: "Alle Termine" },
            { id: "wochenmarkt", label: "Wochenmärkte" },
            { id: "hoffest", label: "Hof-Veranstaltungen" }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setEventTab(tab.id)}
              className={`py-2.5 px-4 font-bold text-sm border-b-2 transition ${
                eventTab === tab.id 
                  ? 'border-green-800 text-green-900' 
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid gap-6">
          {filteredEvents.length > 0 ? (
            filteredEvents.map(event => (
              <Card key={event.id} className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white shadow-sm flex flex-col md:flex-row hover:shadow-md transition">
                <div className="h-48 md:h-auto md:w-80 shrink-0 overflow-hidden">
                  <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        event.farmShopId ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.farmShopId ? 'Hof-Event' : 'Kommunal / Markt'}
                      </span>
                      <span className="text-xs text-neutral-500 font-semibold flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {event.time}
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold text-neutral-900 mt-2">{event.title}</h2>
                    
                    <div className="flex items-center gap-1 text-sm text-green-800 font-semibold mt-2">
                      <MapPin className="h-4 w-4" /> {event.location}
                    </div>

                    <p className="text-neutral-700 text-sm leading-relaxed mt-4">{event.description}</p>
                  </div>

                  <div className="flex items-center justify-between border-t border-neutral-100 mt-6 pt-4">
                    <div className="text-sm font-bold text-green-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-green-850" /> {event.date}
                    </div>
                    <div className="flex gap-2">
                      {event.farmShopId && (
                        <Button 
                          variant="outline" 
                          className="rounded-full text-xs"
                          onClick={() => navigateTo("farm-detail", { id: event.farmShopId })}
                        >
                          Hofladen ansehen
                        </Button>
                      )}
                      <Button 
                        className="rounded-full bg-green-800 hover:bg-green-900 text-xs px-4"
                        onClick={() => navigateToMap(event.location)}
                      >
                        Auf Karte anzeigen
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center bg-white rounded-2xl border-neutral-100 text-neutral-500">
              <Calendar className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
              <div className="font-semibold text-lg">Keine Veranstaltungen gefunden</div>
              <p className="text-sm text-neutral-400 mt-1">In dieser Kategorie stehen derzeit keine Termine an.</p>
            </Card>
          )}
        </div>
      </div>
    );
  };

  // Cookbook Print-on-Demand Shop Page
  const renderCookbook = () => {
    const recipes = [
      { name: "Kürbissuppe mit Apfel & Kürbiskernöl", duration: "35 Min" },
      { name: "Knuspriger Entenbraten mit Blaukraut", duration: "120 Min" },
      { name: "Traditioneller Zwetschgen-Datschi", duration: "50 Min" },
      { name: "Frischer Spargelsalat mit Erdbeerdressing", duration: "20 Min" }
    ];

    return (
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-950 flex items-center justify-center gap-2">
            <Book className="h-9 w-9 text-green-800" /> Hofladen-Kochbuch-Reihe
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl mx-auto">Regionale Rezepte direkt von unseren Landwirten. Im hochwertigen Print-on-Demand Verfahren auf Recyclingpapier gedruckt und CO₂-neutral versendet.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Spring/Summer Edition */}
          <Card className="overflow-hidden rounded-[2.5rem] border-neutral-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition">
            <div className="w-full md:w-44 shrink-0 aspect-[3/4] bg-emerald-800 text-white rounded-2xl p-4 flex flex-col justify-between shadow-lg transform rotate-[-2deg]">
              <div className="border border-white/20 p-2 rounded text-center text-xs tracking-wider uppercase font-semibold">Frühling & Sommer</div>
              <div className="text-center">
                <h3 className="text-lg font-bold leading-tight font-serif">Das Hofladen</h3>
                <h2 className="text-2xl font-black font-serif tracking-tight mt-1">KOCHBUCH</h2>
                <div className="h-0.5 bg-white/40 my-2" />
                <p className="text-[10px] italic">Ausgabe I</p>
              </div>
              <div className="text-center text-[10px] uppercase font-semibold">50 Regionale Rezepte</div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-800 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">Print-on-Demand</span>
                <h2 className="text-2xl font-bold text-neutral-900 mt-2">Ausgabe I: Frühling & Sommer</h2>
                <p className="text-neutral-600 text-sm mt-2 leading-relaxed">Spargel, Rhabarber, Erdbeeren und frische Salate. Lerne, wie du mit heimischen Zutaten leichte, gesunde Gerichte zauberst.</p>
                <div className="mt-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-xs text-neutral-500 font-semibold">(4.9/5 bei 42 Bewertungen)</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-2xl font-extrabold text-green-950">12,90 €</span>
                <Button className="rounded-full bg-green-800 hover:bg-green-900 font-bold" onClick={() => alert("Dieses Kochbuch wird per Print-on-Demand direkt für dich gedruckt. Weiterleitung zum Partnershop...")}>Bestellen</Button>
              </div>
            </div>
          </Card>

          {/* Autumn/Winter Edition */}
          <Card className="overflow-hidden rounded-[2.5rem] border-neutral-200 bg-white p-6 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition">
            <div className="w-full md:w-44 shrink-0 aspect-[3/4] bg-amber-900 text-white rounded-2xl p-4 flex flex-col justify-between shadow-lg transform rotate-[2deg]">
              <div className="border border-white/20 p-2 rounded text-center text-xs tracking-wider uppercase font-semibold">Herbst & Winter</div>
              <div className="text-center">
                <h3 className="text-lg font-bold leading-tight font-serif">Das Hofladen</h3>
                <h2 className="text-2xl font-black font-serif tracking-tight mt-1">KOCHBUCH</h2>
                <div className="h-0.5 bg-white/40 my-2" />
                <p className="text-[10px] italic">Ausgabe II</p>
              </div>
              <div className="text-center text-[10px] uppercase font-semibold">50 Deftige Rezepte</div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-green-800 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">Print-on-Demand</span>
                <h2 className="text-2xl font-bold text-neutral-900 mt-2">Ausgabe II: Herbst & Winter</h2>
                <p className="text-neutral-600 text-sm mt-2 leading-relaxed">Kürbisgerichte, wärmende Suppen, Deftiges vom Weiderind und süße Weihnachtsklassiker. Perfekt für die kalte Jahreszeit.</p>
                <div className="mt-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  <span className="text-xs text-neutral-500 font-semibold">(4.8/5 bei 29 Bewertungen)</span>
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-2xl font-extrabold text-green-950">12,90 €</span>
                <Button className="rounded-full bg-green-800 hover:bg-green-900 font-bold" onClick={() => alert("Dieses Kochbuch wird per Print-on-Demand direkt für dich gedruckt. Weiterleitung zum Partnershop...")}>Bestellen</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Recipe Preview Section */}
        <section className="bg-green-50/40 border border-green-150/40 rounded-[2.5rem] p-8 space-y-6">
          <h2 className="text-2xl font-bold text-green-950 text-center">Blick ins Buch: Rezeptbeispiele</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((rec, index) => (
              <div key={index} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-green-100/40 shadow-sm">
                <div className="font-semibold text-neutral-800 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-800" /> {rec.name}
                </div>
                <span className="text-xs font-bold text-green-900 bg-green-50/80 px-3 py-1 rounded-full">{rec.duration}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  };

  // Affiliate Partner Shop Page
  const renderAffiliates = () => {
    const products = [
      {
        id: "ap-1",
        title: "Lärchen-Hochbeet Komplettbausatz",
        description: "120 x 80 x 80 cm, robustes heimisches Lärchenholz (ohne chemische Behandlung). Inklusive Schrauben, Vlies und bebilderter Anleitung.",
        price: 189.00,
        image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=400&q=80",
        rating: "4.7",
        link: "https://amazon.de/s?k=hochbeet+laerche"
      },
      {
        id: "ap-2",
        title: "Bio-Tomaten Saatgut Set (6 Sorten)",
        description: "Alte historische Tomatensamen (u.a. Ochsenherz, Black Cherry, Rote Murmel). Keimschutzverpackt, 100% samenfest, ungebeizt und gentechnikfrei.",
        price: 12.95,
        image: "https://images.unsplash.com/photo-1592841208221-a5808df73658?auto=format&fit=crop&w=400&q=80",
        rating: "4.9",
        link: "https://amazon.de/s?k=bio+tomaten+saatgut"
      },
      {
        id: "ap-3",
        title: "Thermo-Komposter Thermo-King 600L",
        description: "Schnellkompostierung durch optimiertes Belüftungssystem und Wände aus Thermolen. Einfache Befüllung durch zwei große Klappen.",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1584473457406-6240486418e9?auto=format&fit=crop&w=400&q=80",
        rating: "4.6",
        link: "https://amazon.de/s?k=thermo+komposter+600l"
      },
      {
        id: "ap-4",
        title: "Profi-Gartenschere Edelstahl Bypass",
        description: "Ergonomische Griffe mit rutschfester Beschichtung. Gehärtete Edelstahlklingen für saubere, pflanzenschonende Schnitte bis Ø 20mm.",
        price: 24.50,
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=400&q=80",
        rating: "4.8",
        link: "https://amazon.de/s?k=gartenschere+bypass"
      }
    ];

    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-green-950 flex items-center justify-center gap-2">
            <BookOpen className="h-9 w-9 text-green-800" /> Garten- & Selbstversorger-Shop
          </h1>
          <p className="text-neutral-600 mt-2 max-w-xl mx-auto">Ausgewählte Produktempfehlungen rund um das Gärtnern, Kompostieren und Ziehen eigener Gemüsepflanzen. Wir erhalten bei Kauf eine kleine Affiliate-Provision.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {products.map(prod => (
            <Card key={prod.id} className="overflow-hidden rounded-[2rem] border-neutral-200 bg-white p-4 shadow-sm flex gap-4 hover:shadow-md transition">
              <div className="h-32 w-32 shrink-0 rounded-2xl overflow-hidden">
                <img src={prod.image} alt={prod.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-extrabold text-neutral-900 text-lg leading-snug">{prod.title}</h3>
                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{prod.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs font-semibold">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {prod.rating}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-50">
                  <span className="font-extrabold text-green-900">{prod.price.toFixed(2)} €</span>
                  <Button 
                    className="rounded-full bg-green-800 hover:bg-green-900 text-xs font-bold h-9 px-4"
                    onClick={() => {
                      alert("Weiterleitung zu Amazon. Als Affiliate-Partner verdienen wir an qualifizierten Verkäufen.");
                      window.open(prod.link, "_blank");
                    }}
                  >
                    Kaufen &rarr;
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
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
    if (!user) return renderCustomerDashboard();

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
              <h2 className="text-xl font-bold text-neutral-900">{user ? (user.profile?.name || "Kunde") : "Gast-Modus"}</h2>
              <p className="text-xs text-neutral-500">{user ? user.email : "Lokale Merkliste"}</p>
            </div>
            <div className="pt-2 border-t border-neutral-100 flex justify-around text-sm font-semibold">
              <div>
                <div className="text-xl font-extrabold text-green-900">{favorites.length}</div>
                <div className="text-xs text-neutral-500">Favoriten</div>
              </div>
              <div className="border-r border-neutral-100" />
              <div>
                <div className="text-xl font-extrabold text-green-900">{readingList.length}</div>
                <div className="text-xs text-neutral-500">Leseliste</div>
              </div>
            </div>
            {!user && (
              <div className="pt-4 border-t border-neutral-100 space-y-2">
                <p className="text-xs text-neutral-500 leading-normal text-center">
                  Melde dich an, um deine Merkliste dauerhaft zu speichern.
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full rounded-full text-xs py-1"
                  onClick={() => navigateTo("login")}
                >
                  Jetzt anmelden
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </aside>

      {/* Favorites, Reading list & Settings */}
      <main className="space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-green-950">{user ? "Kundenkonto" : "Mein Bereich (Gast)"}</h1>
          <p className="text-neutral-500">{user ? "Verwalte deine Profileinstellungen, favorisierten Einkaufsorte und Leseliste." : "Hier findest du deine lokal gespeicherten Favoriten und Lesezeichen."}</p>
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
                    <Button className="h-10 w-10 p-0 rounded-full bg-green-800 hover:bg-green-900" onClick={() => navigateTo("farm-detail", { id: place.id })}>
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

        {/* Reading List section */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" /> Deine Leseliste
          </h2>
          <div className="grid gap-4">
            {readingList.length > 0 ? (
              readingList.map(post => (
                <Card key={post.id} className="p-4 bg-white border-neutral-200 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <img src={post.image} alt={post.title} className="h-16 w-16 rounded-xl object-cover" />
                    <div>
                      <h3 className="font-bold hover:text-green-800 cursor-pointer" onClick={() => navigateTo("blog-detail", { slug: post.slug })}>{post.title}</h3>
                      <p className="text-xs text-green-800 font-semibold">{post.category}</p>
                      <p className="text-xs text-neutral-500 mt-1">{post.publishDate}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="rounded-full text-red-650 hover:bg-red-50" onClick={() => handleToggleReadingList(post.id)}>
                      Entfernen
                    </Button>
                    <Button className="h-10 w-10 p-0 rounded-full bg-green-800 hover:bg-green-900" onClick={() => navigateTo("blog-detail", { slug: post.slug })}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center bg-white border border-neutral-100 rounded-2xl">
                <Bookmark className="h-12 w-12 text-neutral-300 mx-auto mb-2" />
                <div className="font-semibold text-neutral-600">Deine Leseliste ist noch leer</div>
                <p className="text-neutral-400 text-sm mt-1">Sichere dir DIY-Projekte oder Ratgeber im Blog, um sie später hier abzurufen.</p>
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
    const [vendorTab, setVendorTab] = useState("profile"); // profile, events, tgtg

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

          {/* Status info */}
          <Card className="rounded-[2rem] bg-green-950 text-white p-6 border border-neutral-800">
            <CardContent className="p-0 space-y-4">
              <h3 className="font-bold text-lg">Kostenloser Eintrag</h3>
              <p className="text-xs text-green-100">Dein Hofladen-Profil ist dauerhaft kostenlos geschaltet und für alle Besucher sichtbar.</p>
              
              <div className="bg-white/10 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                <span className="text-sm font-semibold">Premium-Features aktiv</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded font-bold">Gratis</span>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Panel */}
        <main className="space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-green-950">Anbieterbereich</h1>
            <p className="text-neutral-500">Verwalte deinen Hofladen, stelle Retter-Tüten ein oder kündige Hof-Events an.</p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex gap-2 border-b border-neutral-200 pb-px">
            <button 
              onClick={() => setVendorTab("profile")}
              className={`py-3 px-5 font-bold text-sm border-b-2 transition ${vendorTab === 'profile' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
            >
              Hofladen bearbeiten
            </button>
            <button 
              onClick={() => setVendorTab("events")}
              className={`py-3 px-5 font-bold text-sm border-b-2 transition ${vendorTab === 'events' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
            >
              Hof-Events ({events.filter(e => e.farmShopId === user.farmShop?.id).length})
            </button>
            <button 
              onClick={() => setVendorTab("tgtg")}
              className={`py-3 px-5 font-bold text-sm border-b-2 transition ${vendorTab === 'tgtg' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
            >
              Retter-Tüten einstellen
            </button>
          </div>

          <AnimatePresence mode="wait">
            {vendorTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                {vendorSuccess && <div className="p-4 mb-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{vendorSuccess}</div>}
                
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
              </motion.div>
            )}

            {vendorTab === 'events' && (
              <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {vendorEventSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{vendorEventSuccess}</div>}
                
                <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-sm">
                  <h3 className="text-xl font-bold text-neutral-800">Neues Hof-Event eintragen</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Veranstaltungs-Titel</label>
                      <input 
                        type="text" required
                        placeholder="z.B. Hoffest, Konzert, Glühweinstation..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.title}
                        onChange={(e) => setNewEventForm({ ...newEventForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Kategorie</label>
                      <select 
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.category}
                        onChange={(e) => setNewEventForm({ ...newEventForm, category: e.target.value })}
                      >
                        <option value="hoffest">Hoffest / Bauernmarkt</option>
                        <option value="konzert">Konzert / Livemusik</option>
                        <option value="weihnachtsmarkt">Weihnachtsmarkt</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Datum</label>
                      <input 
                        type="date" required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.date}
                        onChange={(e) => setNewEventForm({ ...newEventForm, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Uhrzeit</label>
                      <input 
                        type="text" required
                        placeholder="z.B. 10:00 - 18:00 Uhr"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.time}
                        onChange={(e) => setNewEventForm({ ...newEventForm, time: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Adresse / Veranstaltungsort</label>
                      <input 
                        type="text" required
                        placeholder="Gleiche Adresse wie dein Hofladen"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.location}
                        onChange={(e) => setNewEventForm({ ...newEventForm, location: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Beschreibung</label>
                      <textarea 
                        rows="3" required
                        placeholder="Was erwartet die Besucher?"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newEventForm.description}
                        onChange={(e) => setNewEventForm({ ...newEventForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="rounded-full px-6 py-4">Event veröffentlichen</Button>
                </form>

                {/* Existing events list */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-neutral-800">Deine eingetragenen Termine</h3>
                  <div className="grid gap-4">
                    {events.filter(e => e.farmShopId === user.farmShop?.id).length > 0 ? (
                      events.filter(e => e.farmShopId === user.farmShop?.id).map(e => (
                        <Card key={e.id} className="p-4 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between shadow-sm">
                          <div>
                            <h4 className="font-bold text-neutral-900">{e.title}</h4>
                            <p className="text-xs text-neutral-500 mt-1">{e.date} • {e.time}</p>
                            <p className="text-xs text-neutral-400 mt-1">{e.location}</p>
                          </div>
                          <Button variant="ghost" className="text-red-500 hover:bg-red-50 rounded-full" onClick={() => handleDeleteEvent(e.id)}>
                            Absagen
                          </Button>
                        </Card>
                      ))
                    ) : (
                      <div className="text-sm text-neutral-500 italic p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        Du hast noch keine eigenen Events hochgeladen.
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {vendorTab === 'tgtg' && (
              <motion.div key="tgtg" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                {vendorPkgSuccess && <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-medium">{vendorPkgSuccess}</div>}

                <form onSubmit={handleCreatePackage} className="bg-white p-6 rounded-2xl border border-neutral-200 space-y-4 shadow-sm">
                  <h3 className="text-xl font-bold text-neutral-800">Neue Retter-Tüte einstellen</h3>
                  <p className="text-xs text-neutral-500 -mt-2">Nutze dieses Angebot, um überschüssige, reife Ware vor dem Wegwerfen zu retten. Kunden reservieren online und bezahlen bar bei Abholung.</p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Bezeichnung</label>
                      <input 
                        type="text" required
                        placeholder="z.B. Obst- & Gemüse-Überraschungstüte"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.title}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Anzahl Packungen</label>
                      <input 
                        type="number" required
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.quantity}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, quantity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Retter-Preis (€)</label>
                      <input 
                        type="number" step="0.01" required
                        placeholder="z.B. 3.90"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.price}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, price: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Originalwert (€)</label>
                      <input 
                        type="number" step="0.01" required
                        placeholder="z.B. 12.00"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.originalValue}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, originalValue: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Abholzeitraum</label>
                      <input 
                        type="text" required
                        placeholder="z.B. Heute von 17:00 - 18:00 Uhr"
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.pickupTime}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, pickupTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-neutral-500 uppercase">Inhaltsbeschreibung</label>
                      <textarea 
                        rows="2" required
                        placeholder="z.B. Gemischte reife Gemüsesorten, etwas Brot oder Molkereiprodukte..."
                        className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm outline-none"
                        value={newPkgForm.description}
                        onChange={(e) => setNewPkgForm({ ...newPkgForm, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="rounded-full px-6 py-4">Tüte einstellen</Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
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
      <div className="flex gap-4 border-b border-neutral-200 mb-6">
        <button 
          onClick={() => setAdminTab("approvals")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition ${adminTab === 'approvals' ? 'border-green-800 text-green-900' : 'border-transparent text-neutral-500'}`}
        >
          Freigaben ({adminVendors.filter(v => !v.approved).length})
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

        {/* Wikipedia-style Donation/Tip Banner */}
        {!donationBannerDismissed && (
          <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white py-4 px-6 relative text-center text-sm md:text-base font-semibold shadow-md flex flex-col sm:flex-row items-center justify-center gap-3">
            <span className="flex items-center gap-2">
              <HeartHandshake className="h-5 w-5 text-green-300 shrink-0" />
              <span>Hofladen-Finder ist gemeinnützig & werbefrei. Hilf uns mit einer kleinen jährlichen Spende (z.B. 5 €), die Serverkosten zu decken.</span>
            </span>
            <div className="flex gap-2 shrink-0">
              <Button 
                onClick={() => alert("Vielen Dank für deine Unterstützung! Weiterleitung zu PayPal...")}
                className="bg-white text-green-900 rounded-full h-8 px-4 text-xs font-bold hover:bg-neutral-50 shadow-sm"
              >
                Jetzt Spenden
              </Button>
              <Button 
                onClick={() => {
                  localStorage.setItem("donation_dismissed", "true");
                  setDonationBannerDismissed(true);
                }}
                variant="ghost" 
                className="text-white hover:bg-white/10 rounded-full h-8 px-3 text-xs"
              >
                Schließen
              </Button>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-7xl px-5 pb-28 pt-8">
          <AnimatePresence mode="wait">
            {view === 'home' && renderHome()}
            {view === 'farm-detail' && renderFarmDetail()}
            {view === 'blog' && renderBlogList()}
            {view === 'blog-detail' && renderBlogDetail()}
            {view === 'events' && renderEvents()}
            {view === 'cookbook' && renderCookbook()}
            {view === 'affiliates' && renderAffiliates()}
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
            className={`flex flex-col items-center gap-1 ${view === 'events' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo("events")}
          >
            <Calendar className="h-6 w-6" />Events
          </button>

          <button 
            className="-mt-8 flex flex-col items-center gap-1 text-green-800"
            onClick={() => navigateTo("home")}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-green-800 text-white shadow-lg"><Map className="h-8 w-8" /></span>Karte
          </button>
          
          <button 
            className={`flex flex-col items-center gap-1 ${view === 'blog' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo("blog")}
          >
            <FileText className="h-6 w-6" />Blog
          </button>
          
          <button 
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-green-800 font-bold' : ''}`}
            onClick={() => navigateTo(user ? "dashboard" : "login")}
          >
            <User className="h-6 w-6" />Konto
          </button>
        </div>
      </nav>

      {/* Public Footer */}
      <footer className="border-t border-neutral-200 bg-white/40 py-8">
        <div className="mx-auto max-w-7xl px-5 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-500">
          <div>© 2026 Hofladen-Finder. Alle Rechte vorbehalten.</div>
          <div className="flex gap-4">
            <button onClick={() => navigateTo("home")} className="hover:underline">Entdecken</button>
            <button onClick={() => navigateTo("events")} className="hover:underline">Events</button>
            <button onClick={() => navigateTo("blog")} className="hover:underline">Blog</button>
            <button onClick={() => navigateTo("cookbook")} className="hover:underline">Kochbuch</button>
            <button onClick={() => navigateTo("affiliates")} className="hover:underline">Gartenshop</button>
            <button onClick={() => navigateTo("login")} className="hover:underline">Anbieter-Portal</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
