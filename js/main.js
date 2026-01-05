/* ==========================================================================
   Main JavaScript - Thomas H. Costello
   Interactions, animations, and whimsical touches
   ========================================================================== */

(function() {
  'use strict';

  // ==========================================================================
  // Quotes Database - Random epigraph on each page load
  // Add more quotes to this array as desired
  // ==========================================================================

  const quotes = [
    { text: "The test of a first-rate intelligence is the ability to hold two opposed ideas in the mind at the same time, and still retain the ability to function.", author: "F. Scott Fitzgerald" },
    { text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle" },
    { text: "The whole problem with the world is that fools and fanatics are always so certain of themselves, and wiser people so full of doubts.", author: "Bertrand Russell" },
    { text: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman" },
    { text: "The eye sees only what the mind is prepared to comprehend.", author: "Robertson Davies" },
    { text: "We are all apprentices in a craft where no one ever becomes a master.", author: "Ernest Hemingway" },
    { text: "The only true wisdom is in knowing you know nothing.", author: "Socrates" },
    { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { text: "There is nothing either good or bad, but thinking makes it so.", author: "William Shakespeare" },
    { text: "The unexamined life is not worth living.", author: "Socrates" },
    { text: "Reality is merely an illusion, albeit a very persistent one.", author: "Albert Einstein" },
    { text: "The greatest enemy of knowledge is not ignorance, it is the illusion of knowledge.", author: "Daniel J. Boorstin" },
    { text: "What we observe is not nature itself, but nature exposed to our method of questioning.", author: "Werner Heisenberg" },
    { text: "The most incomprehensible thing about the world is that it is comprehensible.", author: "Albert Einstein" },
    { text: "We don't see things as they are, we see them as we are.", author: "Anaïs Nin" },
    { text: "To understand is to perceive patterns.", author: "Isaiah Berlin" },
    { text: "The measure of intelligence is the ability to change.", author: "Albert Einstein" },
    { text: "Doubt is not a pleasant condition, but certainty is absurd.", author: "Voltaire" },
    { text: "A man who carries a cat by the tail learns something he can learn in no other way.", author: "Mark Twain" }
  ];

  // ==========================================================================
  // Random Quote Display
  // ==========================================================================

  function displayRandomQuote() {
    const quoteElements = document.querySelectorAll('[data-random-quote]');

    quoteElements.forEach(el => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      const textEl = el.querySelector('p') || el.querySelector('.epigraph__text');
      const citeEl = el.querySelector('cite');

      if (textEl) {
        textEl.textContent = `"${randomQuote.text}"`;
      }
      if (citeEl) {
        citeEl.textContent = randomQuote.author;
      }
    });
  }

  displayRandomQuote();

  // ==========================================================================
  // Navigation
  // ==========================================================================

  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');

  // Scroll behavior for nav
  let lastScroll = 0;

  if (nav) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      // Add scrolled class for styling
      if (currentScroll > 50) {
        nav.classList.add('nav--scrolled');
      } else {
        nav.classList.remove('nav--scrolled');
      }

      lastScroll = currentScroll;
    });
  }

  // Mobile menu toggle with accessibility
  if (navToggle) {
    navToggle.setAttribute('aria-controls', 'nav-links');
    navToggle.setAttribute('aria-expanded', 'false');

    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav__links--open');
      navToggle.classList.toggle('nav__toggle--active');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Close mobile menu on link click
  document.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks) navLinks.classList.remove('nav__links--open');
      if (navToggle) {
        navToggle.classList.remove('nav__toggle--active');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // ==========================================================================
  // Scroll Animations (Intersection Observer)
  // ==========================================================================

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -50px 0px',
    threshold: 0.1
  };

  const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');

        // If it's a stagger container, animate children
        if (entry.target.hasAttribute('data-stagger')) {
          const children = entry.target.children;
          Array.from(children).forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('is-visible');
            }, index * 100);
          });
        }
      }
    });
  }, observerOptions);

  // Observe all elements with data-animate attribute
  document.querySelectorAll('[data-animate]').forEach(el => {
    animateOnScroll.observe(el);
  });

  // Observe stagger containers
  document.querySelectorAll('[data-stagger]').forEach(el => {
    animateOnScroll.observe(el);
  });

  // ==========================================================================
  // Smooth Scroll for Anchor Links
  // ==========================================================================

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#') return;

      e.preventDefault();
      const target = document.querySelector(href);

      if (target && nav) {
        const navHeight = nav.offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==========================================================================
  // Active Navigation Link
  // ==========================================================================

  function setActiveNavLink() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';

    document.querySelectorAll('.nav__link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath) {
        link.classList.add('nav__link--active');
      } else {
        link.classList.remove('nav__link--active');
      }
    });
  }

  setActiveNavLink();

  // ==========================================================================
  // Parallax Effect for Hero Shapes
  // ==========================================================================

  const heroShapes = document.querySelectorAll('.hero__shape');

  if (heroShapes.length > 0) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;

      heroShapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.1;
        shape.style.transform = `translateY(${scrolled * speed}px)`;
      });
    });
  }

  // ==========================================================================
  // Whimsical Touch: Cursor trail on hero (subtle)
  // ==========================================================================

  const hero = document.querySelector('.hero');

  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const decoration = document.querySelector('.hero__decoration');
      if (!decoration) return;

      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      // Subtle movement of decoration based on cursor
      const moveX = (x - 0.5) * 20;
      const moveY = (y - 0.5) * 20;

      decoration.style.transform = `translateY(-50%) translate(${moveX}px, ${moveY}px)`;
    });

    hero.addEventListener('mouseleave', () => {
      const decoration = document.querySelector('.hero__decoration');
      if (decoration) {
        decoration.style.transform = 'translateY(-50%)';
      }
    });
  }

  // ==========================================================================
  // Publication Filter (for research page)
  // ==========================================================================

  const filterButtons = document.querySelectorAll('[data-filter]');
  const publications = document.querySelectorAll('.publication[data-category]');

  if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');

        // Update active button
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter publications
        publications.forEach(pub => {
          if (filter === 'all' || pub.getAttribute('data-category') === filter) {
            pub.style.display = 'block';
            setTimeout(() => pub.classList.add('is-visible'), 10);
          } else {
            pub.classList.remove('is-visible');
            setTimeout(() => pub.style.display = 'none', 300);
          }
        });
      });
    });
  }

  // ==========================================================================
  // Copy Email to Clipboard
  // ==========================================================================

  const emailLinks = document.querySelectorAll('[data-copy-email]');

  emailLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const email = this.getAttribute('data-copy-email');

      navigator.clipboard.writeText(email).then(() => {
        const originalText = this.textContent;
        this.textContent = 'Copied!';
        setTimeout(() => {
          this.textContent = originalText;
        }, 2000);
      });
    });
  });

  // ==========================================================================
  // Page Load Animation
  // ==========================================================================

  document.body.classList.add('page-transition');

  // ==========================================================================
  // Console Easter Egg
  // ==========================================================================

  console.log('%cHello, curious one.', 'font-size: 14px; font-weight: 500; color: #8b7355;');
  console.log('%cInterested in how this site was built, or in my research?', 'font-size: 12px; color: #666;');
  console.log('%cReach out: thcostello1@gmail.com', 'font-size: 12px; color: #666;');

})();
