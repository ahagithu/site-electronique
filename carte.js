// Gestion spécifique de la page panier
function initialiserPanier() {
  afficherPanier();
  initialiserFormulaireDevis();
}

function afficherPanier() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  
  if (!container || !summary) return;
  
  if (panier.length === 0) {
    container.innerHTML = `
      <div class="empty-cart">
        <i class="fas fa-shopping-cart"></i>
        <h3>Votre panier est vide</h3>
        <p>Ajoutez des produits pour commencer vos achats</p>
        <a href="produits.html" class="btn btn-primary">
          <i class="fas fa-shopping-bag"></i> Voir les produits
        </a>
      </div>
    `;
    
    summary.innerHTML = '';
    return;
  }
  
  // Afficher les articles
  container.innerHTML = panier.map(item => `
    <div class="cart-item fade-in">
      <img src="${item.image}" alt="${item.nom}" class="cart-item-image">
      
      <div class="cart-item-info">
        <h4 class="cart-item-title">${item.nom}</h4>
        <div class="cart-item-price">${formatPrix(item.prix)} ${CONFIG.currency}</div>
      </div>
      
      <div class="quantity-control">
        <button class="quantity-btn" onclick="mettreAJourQuantite('${item.id}', ${item.quantity - 1})">-</button>
        <input type="number" class="quantity-input" value="${item.quantity}" min="1" max="${item.maxStock}"
               onchange="mettreAJourQuantite('${item.id}', parseInt(this.value))">
        <button class="quantity-btn" onclick="mettreAJourQuantite('${item.id}', ${item.quantity + 1})">+</button>
      </div>
      
      <div class="cart-item-total">
        ${formatPrix(item.prix * item.quantity)} ${CONFIG.currency}
      </div>
      
      <button class="remove-item" onclick="supprimerDuPanier('${item.id}')" title="Supprimer">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `).join('');
  
  // Calculer le résumé
  const subtotal = getPanierTotal();
  const livraison = subtotal > 50000 ? 0 : 3000; // Livraison gratuite au-dessus de 50,000 FCFA
  const total = subtotal + livraison;
  
  summary.innerHTML = `
    <h3>Résumé de la commande</h3>
    
    <div class="summary-row">
      <span>Sous-total</span>
      <span>${formatPrix(subtotal)} ${CONFIG.currency}</span>
    </div>
    
    <div class="summary-row">
      <span>Livraison</span>
      <span>${livraison === 0 ? 'Gratuite' : formatPrix(livraison) + ' ' + CONFIG.currency}</span>
    </div>
    
    ${livraison > 0 ? `
      <div class="summary-row" style="font-size: 0.875rem; color: var(--green);">
        <span>✓ Livraison gratuite à partir de 50,000 FCFA</span>
        <span></span>
      </div>
    ` : ''}
    
    <div class="summary-row total">
      <span>Total</span>
      <span>${formatPrix(total)} ${CONFIG.currency}</span>
    </div>
    
    <button onclick="commanderToutPanier()" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
      <i class="fab fa-whatsapp"></i> Commander sur WhatsApp
    </button>
    
    <button onclick="genererDevis()" class="btn btn-secondary" style="width: 100%; margin-top: 0.5rem;">
      <i class="fas fa-file-invoice"></i> Générer un devis
    </button>
    
    <a href="produits.html" class="btn btn-outline" style="width: 100%; margin-top: 0.5rem;">
      <i class="fas fa-arrow-left"></i> Continuer mes achats
    </a>
  `;
}

function initialiserFormulaireDevis() {
  const form = document.getElementById('devis-form');
  if (!form) return;
  
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Ajouter les produits du panier
    data.produits = panier;
    data.total = getPanierTotal();
    data.date = new Date().toISOString();
    
    // Générer le PDF du devis (simulation)
    genererPDFDevis(data);
    
    // Envoyer par email via Formspree
    envoyerDevisParEmail(data);
  });
}

function genererDevis() {
  if (panier.length === 0) {
    showNotification('Ajoutez des produits au panier pour générer un devis', 'error');
    return;
  }
  
  // Ouvrir la page devis avec les données du panier
  const devisData = {
    produits: panier,
    total: getPanierTotal(),
    date: new Date().toLocaleDateString('fr-FR'),
    numero: 'DEV-' + Date.now().toString().slice(-8)
  };
  
  localStorage.setItem('devisData', JSON.stringify(devisData));
  window.open('devis.html', '_blank');
}

function envoyerDevisParEmail(data) {
  // Utiliser Formspree pour envoyer le devis
  fetch('https://formspree.io/f/' + CONFIG.formspreeId, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ...data,
      _subject: `Devis ${data.numero} - Boutique Électronique`
    })
  })
  .then(response => {
    if (response.ok) {
      showNotification('Devis envoyé avec succès', 'success');
      // Vider le panier après envoi
      panier = [];
      sauvegarderPanier();
      afficherPanier();
    } else {
      throw new Error('Erreur lors de l\'envoi');
    }
  })
  .catch(error => {
    console.error('Erreur:', error);
    showNotification('Erreur lors de l\'envoi du devis', 'error');
  });
}

// Fonction pour générer un PDF (simulée)
function genererPDFDevis(data) {
  // En production, utiliser une bibliothèque comme jsPDF
  console.log('Génération du devis PDF:', data);
  
  // Pour l'instant, on affiche une prévisualisation
  const preview = `
    <div class="devis-preview">
      <h2>Devis ${data.numero}</h2>
      <p>Date: ${data.date}</p>
      <p>Client: ${data.nom} ${data.prenom}</p>
      <p>Email: ${data.email}</p>
      <p>Téléphone: ${data.telephone}</p>
      
      <h3>Détails des produits:</h3>
      <table>
        <thead>
          <tr>
            <th>Produit</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${data.produits.map(item => `
            <tr>
              <td>${item.nom}</td>
              <td>${item.quantity}</td>
              <td>${formatPrix(item.prix)} ${CONFIG.currency}</td>
              <td>${formatPrix(item.prix * item.quantity)} ${CONFIG.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h3>Total: ${formatPrix(data.total)} ${CONFIG.currency}</h3>
    </div>
  `;
  
  // Afficher la prévisualisation
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      ${preview}
      <div class="modal-actions">
        <button onclick="imprimerDevis()" class="btn btn-primary">
          <i class="fas fa-print"></i> Imprimer
        </button>
        <button onclick="téléchargerDevis()" class="btn btn-secondary">
          <i class="fas fa-download"></i> Télécharger
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fermer la modal
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
}

function imprimerDevis() {
  window.print();
}

function téléchargerDevis() {
  // Simuler le téléchargement
  const link = document.createElement('a');
  link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Devis détaillé');
  link.download = 'devis-boutique-electronique.txt';
  link.click();
}