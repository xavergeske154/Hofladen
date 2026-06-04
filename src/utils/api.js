// API Helper to communicate with the Backend

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Server error occurred');
  }
  return data;
};

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
    }
    return data;
  },

  async register(email, password, role, name) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password, role, name }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
    }
    return data;
  },

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  },

  async me() {
    const res = await fetch('/api/auth/me', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Public Farm Shops
  async getFarmShops(filters = {}) {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    
    const res = await fetch(`/api/farm-shops?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getFarmShop(id) {
    const res = await fetch(`/api/farm-shops/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Public Blogs
  async getBlogs() {
    const res = await fetch('/api/blogs', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async getBlog(slug) {
    const res = await fetch(`/api/blogs/${slug}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Customer Dashboards
  async getFavorites() {
    const res = await fetch('/api/customer/favorites', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async addFavorite(id) {
    const res = await fetch(`/api/customer/favorites/${id}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async removeFavorite(id) {
    const res = await fetch(`/api/customer/favorites/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateCustomerProfile(name, location) {
    const res = await fetch('/api/customer/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ name, location }),
    });
    return handleResponse(res);
  },

  // Vendor Dashboards
  async getVendorProfile() {
    const res = await fetch('/api/vendor/profile', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async updateVendorProfile(data) {
    const res = await fetch('/api/vendor/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async updateVendorSubscription(active) {
    const res = await fetch('/api/vendor/subscription', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ active }),
    });
    return handleResponse(res);
  },

  // Admin Dashboards
  async adminGetUsers() {
    const res = await fetch('/api/admin/users', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminGetVendors() {
    const res = await fetch('/api/admin/vendors', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminApproveVendor(id) {
    const res = await fetch(`/api/admin/vendors/${id}/approve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminBlockVendor(id) {
    const res = await fetch(`/api/admin/vendors/${id}/block`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async adminCreateBlog(data) {
    const res = await fetch('/api/admin/blogs', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async adminDeleteBlog(id) {
    const res = await fetch(`/api/admin/blogs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Events API
  async getEvents(filters = {}) {
    const params = new URLSearchParams();
    if (filters.farmShopId) params.append('farmShopId', filters.farmShopId);
    if (filters.category) params.append('category', filters.category);
    const res = await fetch(`/api/events?${params.toString()}`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createEvent(data) {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async deleteEvent(id) {
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Reading List API
  async getReadingList() {
    const res = await fetch('/api/customer/reading-list', {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async addReadingList(blogId) {
    const res = await fetch(`/api/customer/reading-list/${blogId}`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async removeReadingList(blogId) {
    const res = await fetch(`/api/customer/reading-list/${blogId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  // Pickup Packages (Too Good To Go Model) API
  async getPackages(shopId) {
    const res = await fetch(`/api/farm-shops/${shopId}/packages`, {
      headers: getHeaders(),
    });
    return handleResponse(res);
  },

  async createPackage(data) {
    const res = await fetch('/api/vendor/packages', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async reservePackage(packageId) {
    const res = await fetch(`/api/customer/packages/${packageId}/reserve`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse(res);
  }
};
