// ===== CONFIGURATION =====
const CONFIG = {
  produitsJson: 'produits.json',
  whatsappNumbers: {
    primary: '+22793033158',
    secondary: '+22789631595'
  },
  currency: 'FCFA',
  formspreeId: 'mdkdblzw',
  redirectUrl: 'merci.html'
};

// ===== ÉTAT GLOBAL =====
let produits = [];
let panier = JSON.parse(localStorage.getItem('panier')) || [];

// ===== INITIALISATION =====
document.addEventListener('DOMContentLoaded', function() {
  // Initialiser selon la page
  const page = document.body.dataset.page;
  
  if (page === 'produits' || page === 'index') {
    chargerProduits();
  }
  
  if (page === 'panier') {
    initialiserPanier();
  }
  
  if (page === 'produit-detail') {
    chargerProduitDetail();
  }
  
  // Initialiser les composants communs
  initialiserNavigation();
  initialiserSlider();
  mettreAJourCompteurPanier();
});

// ===== CHARGEMENT DES PRODUITS =====
async function chargerProduits() {
  try {
    const response = await fetch(CONFIG.produitsJson);
    const data = await response.json();
    produits = data.produits;
    
    if (document.body.dataset.page === 'index') {
      afficherProduitsEnVedette();
    } else {
      afficherTousLesProduits();
      initialiserFiltres();
    }
  } catch (error) {
    console.error('Erreur chargement produits:', error);
    afficherMessageErreur();
  }
}

function afficherProduitsEnVedette() {
  const container = document.getElementById('produits-vedette');
  if (!container) return;
  
  const produitsVedette = produits.filter(p => p.nouveau || p.stock > 0).slice(0, 6);
  
  container.innerHTML = produitsVedette.map(produit => `
    <div class="produit-card fade-in">
      ${produit.nouveau ? '<span class="produit-badge nouveau">Nouveau</span>' : ''}
      ${produit.stock < 5 && produit.stock > 0 ? '<span class="produit-badge">Stock limité</span>' : ''}
      ${produit.stock === 0 ? '<span class="produit-badge rupture">Rupture</span>' : ''}
      
      <img src="${produit.images[0]}" alt="${produit.nom}" class="produit-image" loading="lazy">
      
      <div class="produit-info">
        <span class="produit-category">${getCategoryName(produit.categorie)}</span>
        <h3 class="produit-title">${produit.nom}</h3>
        <p class="produit-description">${produit.description}</p>
        
        <div class="produit-price">${formatPrix(produit.prix)} ${produit.devise}</div>
        
        <div class="produit-actions">
          <button class="btn btn-primary btn-sm" onclick="ajouterAuPanier('${produit.id}')">
            <i class="fas fa-cart-plus"></i> Ajouter
          </button>
          <a href="produit.html?id=${produit.id}" class="btn btn-outline btn-sm">
            <i class="fas fa-eye"></i> Détails
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

function afficherTousLesProduits() {
  const container = document.getElementById('produits-container');
  if (!container) return;
  
  container.innerHTML = produits.map(produit => `
    <div class="produit-card fade-in" data-category="${produit.categorie}" data-id="${produit.id}">
      ${produit.nouveau ? '<span class="produit-badge nouveau">Nouveau</span>' : ''}
      ${produit.stock < 5 && produit.stock > 0 ? '<span class="produit-badge">Stock limité</span>' : ''}
      ${produit.stock === 0 ? '<span class="produit-badge rupture">Rupture</span>' : ''}
      
      <img src="${produit.images[0]}" alt="${produit.nom}" class="produit-image" loading="lazy">
      
      <div class="produit-info">
        <span class="produit-category">${getCategoryName(produit.categorie)}</span>
        <h3 class="produit-title">${produit.nom}</h3>
        <p class="produit-description">${produit.description}</p>
        
        <div class="produit-price">${formatPrix(produit.prix)} ${produit.devise}</div>
        
        <div class="produit-actions">
          <button class="btn btn-primary btn-sm" onclick="ajouterAuPanier('${produit.id}')" 
                  ${produit.stock === 0 ? 'disabled' : ''}>
            <i class="fas fa-cart-plus"></i> ${produit.stock === 0 ? 'Rupture' : 'Ajouter'}
          </button>
          <button class="btn btn-outline btn-sm" onclick="commanderWhatsApp('${produit.id}', 'primary')">
            <i class="fab fa-whatsapp"></i> Commander
          </button>
          <a href="produit.html?id=${produit.id}" class="btn btn-outline btn-sm">
            <i class="fas fa-eye"></i>
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== FILTRES ET RECHERCHE =====
function initialiserFiltres() {
  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      filtrerProduits(e.target.value);
    });
  }
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const category = this.dataset.category;
      
      // Activer/désactiver le bouton
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      
      // Filtrer les produits
      if (category === 'all') {
        afficherTousLesProduits();
      } else {
        filtrerParCategorie(category);
      }
    });
  });
}

function filtrerProduits(searchTerm) {
  const produitsCards = document.querySelectorAll('.produit-card');
  const term = searchTerm.toLowerCase();
  
  produitsCards.forEach(card => {
    const title = card.querySelector('.produit-title').textContent.toLowerCase();
    const description = card.querySelector('.produit-description').textContent.toLowerCase();
    
    if (title.includes(term) || description.includes(term)) {
      card.style.display = 'block';
      setTimeout(() => card.classList.add('fade-in'), 10);
    } else {
      card.classList.remove('fade-in');
      card.style.display = 'none';
    }
  });
}

function filtrerParCategorie(category) {
  const produitsCards = document.querySelectorAll('.produit-card');
  
  produitsCards.forEach(card => {
    if (category === 'all' || card.dataset.category === category) {
      card.style.display = 'block';
      setTimeout(() => card.classList.add('fade-in'), 10);
    } else {
      card.classList.remove('fade-in');
      card.style.display = 'none';
    }
  });
}

// ===== PANIER =====
function ajouterAuPanier(productId, quantity = 1) {
  const produit = produits.find(p => p.id === productId);
  
  if (!produit) {
    showNotification('Produit non trouvé', 'error');
    return;
  }
  
  if (produit.stock === 0) {
    showNotification('Produit en rupture de stock', 'error');
    return;
  }
  
  const existingItem = panier.find(item => item.id === productId);
  
  if (existingItem) {
    if (existingItem.quantity + quantity > produit.stock) {
      showNotification('Stock insuffisant', 'error');
      return;
    }
    existingItem.quantity += quantity;
  } else {
    panier.push({
      id: produit.id,
      nom: produit.nom,
      prix: produit.prix,
      image: produit.images[0],
      quantity: quantity,
      maxStock: produit.stock
    });
  }
  
  sauvegarderPanier();
  mettreAJourCompteurPanier();
  showNotification(`${produit.nom} ajouté au panier`, 'success');
}

function supprimerDuPanier(productId) {
  panier = panier.filter(item => item.id !== productId);
  sauvegarderPanier();
  mettreAJourCompteurPanier();
  
  if (document.body.dataset.page === 'panier') {
    afficherPanier();
  }
  
  showNotification('Produit retiré du panier', 'warning');
}

function mettreAJourQuantite(productId, newQuantity) {
  const item = panier.find(item => item.id === productId);
  const produit = produits.find(p => p.id === productId);
  
  if (!item || !produit) return;
  
  if (newQuantity < 1) {
    supprimerDuPanier(productId);
    return;
  }
  
  if (newQuantity > produit.stock) {
    showNotification(`Quantité maximale: ${produit.stock}`, 'error');
    return;
  }
  
  item.quantity = newQuantity;
  sauvegarderPanier();
  
  if (document.body.dataset.page === 'panier') {
    afficherPanier();
  }
}

function sauvegarderPanier() {
  localStorage.setItem('panier', JSON.stringify(panier));
}

function getPanierTotal() {
  return panier.reduce((total, item) => total + (item.prix * item.quantity), 0);
}

function mettreAJourCompteurPanier() {
  const countElements = document.querySelectorAll('.cart-count');
  const totalItems = panier.reduce((sum, item) => sum + item.quantity, 0);
  
  countElements.forEach(el => {
    el.textContent = totalItems;
    el.style.display = totalItems > 0 ? 'block' : 'none';
  });
}

// ===== COMMANDES WHATSAPP =====
function commanderWhatsApp(productId, numberType = 'primary') {
  const produit = produits.find(p => p.id === productId);
  if (!produit) return;
  
  const phoneNumber = CONFIG.whatsappNumbers[numberType];
  const message = encodeURIComponent(
    `Bonjour, je souhaite commander:\n` +
    `Produit: ${produit.nom}\n` +
    `Prix: ${formatPrix(produit.prix)} ${produit.devise}\n` +
    `Quantité: 1\n\n` +
    `Merci de me contacter pour finaliser la commande.`
  );
  
  window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

function commanderToutPanier() {
  if (panier.length === 0) {
    showNotification('Votre panier est vide', 'error');
    return;
  }
  
  const phoneNumber = CONFIG.whatsappNumbers.primary;
  let message = `Bonjour, je souhaite commander les produits suivants:\n\n`;
  
  panier.forEach((item, index) => {
    message += `${index + 1}. ${item.nom} - ${formatPrix(item.prix)} ${CONFIG.currency} x ${item.quantity}\n`;
  });
  
  message += `\nTotal: ${formatPrix(getPanierTotal())} ${CONFIG.currency}\n\n`;
  message += `Merci de me contacter pour finaliser la commande.`;
  
  window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// ===== UTILITAIRES =====
function formatPrix(prix) {
  return new Intl.NumberFormat('fr-FR').format(prix);
}

function getCategoryName(categoryId) {
  // À implémenter avec les catégories du JSON
  const categories = {
    'microcontroleurs': 'Microcontrôleurs',
    'communication': 'Communication',
    'moteurs': 'Moteurs',
    'capteurs': 'Capteurs',
    'alimentation': 'Alimentation',
    'accessoires': 'Accessoires'
  };
  
  return categories[categoryId] || categoryId;
}

function showNotification(message, type = 'info') {
  // Créer une notification temporaire
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
    <span>${message}</span>
  `;
  
  document.body.appendChild(notification);
  
  // Animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Supprimer après 3 secondes
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ===== NAVIGATION RESPONSIVE =====
function initialiserNavigation() {
  const menuToggle = document.querySelector('.menu-toggle');
  const siteNav = document.querySelector('.site-nav');
  
  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      siteNav.classList.toggle('active');
      menuToggle.innerHTML = siteNav.classList.contains('active') ? '✕' : '☰';
    });
    
    // Fermer le menu en cliquant sur un lien
    siteNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('active');
        menuToggle.innerHTML = '☰';
      });
    });
  }
}

// ===== SLIDER HERO =====
function initialiserSlider() {
  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.slider-dot');
  let currentSlide = 0;
  
  if (slides.length === 0) return;
  
  function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    currentSlide = (n + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }
  
  // Événements pour les dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => showSlide(index));
  });
  
  // Auto-slide
  setInterval(() => {
    showSlide(currentSlide + 1);
  }, 5000);
}

// ===== GESTION DES ERREURS =====
function afficherMessageErreur() {
  const container = document.getElementById('produits-container') || 
                    document.getElementById('produits-vedette');
  
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>Impossible de charger les produits. Veuillez réessayer plus tard.</p>
        <button onclick="location.reload()" class="btn btn-primary">
          <i class="fas fa-redo"></i> Réessayer
        </button>
      </div>
    `;
  }
}

// ===== EXPORT DES FONCTIONS GLOBALES =====
window.ajouterAuPanier = ajouterAuPanier;
window.supprimerDuPanier = supprimerDuPanier;
window.mettreAJourQuantite = mettreAJourQuantite;
window.commanderWhatsApp = commanderWhatsApp;
window.commanderToutPanier = commanderToutPanier;