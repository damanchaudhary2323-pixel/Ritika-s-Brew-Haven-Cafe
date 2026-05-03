/**
 * Ritika's Brew Haven Cafe — Main Script
 * Handles: preloader, scroll progress, navbar, cart (localStorage),
 * menu filters, stat counters, gallery lightbox, review slider,
 * contact form validation, scroll reveal, and back-to-top.
 */
document.addEventListener('DOMContentLoaded', () => {

  // ======================== PRELOADER ========================
  window.addEventListener('load', () => {
    setTimeout(() => {
      document.getElementById('preloader').classList.add('hidden');
    }, 1000);
  });

  // ======================== SCROLL PROGRESS + NAVBAR + BACK-TOP ========================
  const navbar = document.getElementById('navbar');
  const scrollProgress = document.getElementById('scrollProgress');
  const backTop = document.getElementById('backTop');

  const onScroll = () => {
    const scrollY = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    // Scroll progress bar
    if (docHeight > 0) {
      scrollProgress.style.width = `${(scrollY / docHeight) * 100}%`;
    }
    // Navbar shrink on scroll
    navbar.classList.toggle('scrolled', scrollY > 60);
    // Back to top visibility
    backTop.classList.toggle('visible', scrollY > 400);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ======================== MOBILE NAV ========================
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', navMenu.classList.contains('open'));
  });

  // Close mobile nav when a link is clicked
  navMenu.querySelectorAll('.navbar__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // ======================== CART (localStorage) ========================
  let cart = JSON.parse(localStorage.getItem('rbh_cart')) || [];

  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartItemsEl = document.getElementById('cartItems');
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');

  const openCart = () => {
    cartDrawer.classList.add('open');
    cartOverlay.classList.add('open');
  };

  const closeCart = () => {
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
  };

  document.getElementById('cartToggle').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  const saveCart = () => localStorage.setItem('rbh_cart', JSON.stringify(cart));

  const renderCart = () => {
    let totalPrice = 0;
    let totalCount = 0;

    cartItemsEl.innerHTML = '';
    cart.forEach((item, index) => {
      totalPrice += item.price * item.qty;
      totalCount += item.qty;

      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="cart-item__info">
          <h4>${item.name}</h4>
          <p>₹${item.price}</p>
        </div>
        <div class="cart-item__actions">
          <div class="cart-item__qty">
            <button data-action="dec" data-index="${index}" aria-label="Decrease quantity">−</button>
            <span>${item.qty}</span>
            <button data-action="inc" data-index="${index}" aria-label="Increase quantity">+</button>
          </div>
          <button class="cart-item__remove" data-index="${index}">✕</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });

    cartCountEl.textContent = totalCount;
    cartTotalEl.textContent = totalPrice.toFixed(2);
    saveCart();
  };

  // Event delegation for cart actions
  cartItemsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = parseInt(btn.dataset.index);
    if (btn.dataset.action === 'inc') {
      cart[idx].qty++;
    } else if (btn.dataset.action === 'dec') {
      cart[idx].qty--;
      if (cart[idx].qty <= 0) cart.splice(idx, 1);
    } else if (btn.classList.contains('cart-item__remove')) {
      cart.splice(idx, 1);
    }
    renderCart();
  });

  // Add to cart buttons
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', () => {
      const { id, name, price } = btn.dataset;
      const existing = cart.find(item => item.id === id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ id, name, price: parseFloat(price), qty: 1 });
      }
      renderCart();
      // Visual feedback — flash cart button
      cartCountEl.style.transform = 'scale(1.5)';
      setTimeout(() => { cartCountEl.style.transform = ''; }, 300);
    });
  });

  renderCart(); // Initial render

  // ======================== MENU FILTERS ========================
  const filterBtns = document.querySelectorAll('.filter-btn');
  const menuCards = document.querySelectorAll('.menu-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      menuCards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;
        if (match) {
          card.classList.remove('hidden');
          card.style.animation = `fadeSlideIn 0.4s ${i * 0.05}s var(--ease) both`;
        } else {
          card.classList.add('hidden');
          card.style.animation = '';
        }
      });
    });
  });

  // ======================== ANIMATED STAT COUNTERS ========================
  let statsAnimated = false;

  const animateCounters = () => {
    if (statsAnimated) return;
    statsAnimated = true;
    document.querySelectorAll('.counter').forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const duration = 2000; // ms
      const startTime = performance.now();

      const update = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out quad
        const eased = 1 - (1 - progress) * (1 - progress);
        counter.textContent = Math.floor(target * eased).toLocaleString();
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          counter.textContent = target.toLocaleString() + '+';
        }
      };
      requestAnimationFrame(update);
    });
  };

  // ======================== SCROLL REVEAL (IntersectionObserver) ========================
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        // Trigger stat counters if the about stats section is revealed
        if (entry.target.classList.contains('about__stats')) {
          animateCounters();
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -50px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ======================== GALLERY LIGHTBOX ========================
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');

  document.querySelectorAll('.gallery__item').forEach(item => {
    item.addEventListener('click', () => {
      // Copy the gradient background to the lightbox content
      lightboxContent.style.background = item.style.background;
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
    });

    // Keyboard support
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
  };

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });

  // ======================== REVIEW SLIDER ========================
  const reviewTrack = document.getElementById('reviewTrack');
  const slides = reviewTrack.querySelectorAll('.review-slide');
  const dotsContainer = document.getElementById('reviewDots');
  let currentSlide = 0;
  let autoplayTimer;

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = `review-dot${i === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Go to review ${i + 1}`);
    dot.addEventListener('click', () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });

  const dots = dotsContainer.querySelectorAll('.review-dot');

  const goToSlide = (index) => {
    currentSlide = ((index % slides.length) + slides.length) % slides.length;
    reviewTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  };

  document.getElementById('prevSlide').addEventListener('click', () => {
    goToSlide(currentSlide - 1);
    resetAutoplay();
  });

  document.getElementById('nextSlide').addEventListener('click', () => {
    goToSlide(currentSlide + 1);
    resetAutoplay();
  });

  // Autoplay
  const startAutoplay = () => {
    autoplayTimer = setInterval(() => goToSlide(currentSlide + 1), 5000);
  };
  const resetAutoplay = () => {
    clearInterval(autoplayTimer);
    startAutoplay();
  };
  startAutoplay();

  // ======================== CONTACT FORM VALIDATION ========================
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    const nameInput = document.getElementById('formName');
    const emailInput = document.getElementById('formEmail');
    const msgInput = document.getElementById('formMsg');

    // Clear previous errors
    contactForm.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));

    // Validate name
    if (nameInput.value.trim().length < 2) {
      nameInput.closest('.form-group').classList.add('error');
      valid = false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      emailInput.closest('.form-group').classList.add('error');
      valid = false;
    }

    // Validate message
    if (msgInput.value.trim().length < 5) {
      msgInput.closest('.form-group').classList.add('error');
      valid = false;
    }

    if (valid) {
      // Simulate sending
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.textContent = 'SENDING...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = 'SEND IT';
        submitBtn.disabled = false;
        contactForm.reset();
        formSuccess.classList.add('show');
        setTimeout(() => formSuccess.classList.remove('show'), 4000);
      }, 1500);
    }
  });

  // Clear error on input
  contactForm.querySelectorAll('.form-group__input').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.form-group').classList.remove('error');
    });
  });

}); // end DOMContentLoaded
