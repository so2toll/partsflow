document.addEventListener('DOMContentLoaded', function() {
  // Mobile Navbar Toggle

  const mobileNavToggle = document.querySelector('.mobile-nav-toggle .navbar-toggler');
  
  if (mobileNavToggle) {
    mobileNavToggle.addEventListener('click', function() {
      this.classList.toggle('active');
    });
    
    // Optional: Reset when offcanvas is closed
    const mobileNavbar = document.getElementById('mobileNavbar');
    if (mobileNavbar) {
      mobileNavbar.addEventListener('hidden.bs.offcanvas', function () {
        mobileNavToggle.classList.remove('active');
      });
    }
  }
  
  // Hero Slider Initialization
  const heroSlider = new Swiper('.hero-slider', {
    // Basic Swiper Configuration
    loop: true,
    speed: 1000,
    
    // Autoplay Settings
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
    },
    
    // Navigation
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    
    // Pagination
    pagination: {
        el: '.swiper-pagination',
        clickable: true,
        dynamicBullets: true,
    },
    
    // Transition Effects
    effect: 'slide', // Can be 'slide', 'fade', 'cube', 'coverflow'
    
    // Responsive Breakpoints
    breakpoints: {
        // When window width is >= 320px
        320: {
            slidesPerView: 1,
            spaceBetween: 0
        },
        // When window width is >= 768px
        768: {
            slidesPerView: 1,
            spaceBetween: 0
        },
        // When window width is >= 1024px
        1024: {
            slidesPerView: 1,
            spaceBetween: 0
        }
    },
    
    // Optional Accessibility and A11y
    a11y: {
        enabled: true,
        prevSlideMessage: 'Previous slide',
        nextSlideMessage: 'Next slide',
        firstSlideMessage: 'This is the first slide',
        lastSlideMessage: 'This is the last slide',
    },
    
    // Keyboard Control
    keyboard: {
        enabled: true,
        onlyInViewport: true,
    }
  });
  
  // New Testimonial Slider
  const newTestimonialSwiper = new Swiper('.testimonial-carousel-2', {
    // Swiper options
    slidesPerView: 1,
    spaceBetween: 30,
    centeredSlides: true,
    loop: true,
    
    // Autoplay configuration
    autoplay: {
      delay: 5000, // 5 seconds between slides
      disableOnInteraction: false // continue autoplay after user interaction
    },
    
    // Pause autoplay on hover
    on: {
      mouseenter: function () {
        newTestimonialSwiper.autoplay.stop();
      },
      mouseleave: function () {
        newTestimonialSwiper.autoplay.start();
      }
    },
    
    // Pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
      dynamicBullets: true,
      dynamicMainBullets: 3
    },
    
    breakpoints: {
      // Screens smaller than 768px
      0: {
        slidesPerView: 1,
        spaceBetween: 10,
        centeredSlides: true
      },
      // when window width is >= 768px
      768: {
        slidesPerView: 1,
        spaceBetween: 30,
        centeredSlides: true
      },
      // when window width is >= 992px
      992: {
        slidesPerView: 2,
        spaceBetween: 30,
        centeredSlides: false
      },
      // when window width is >= 1200px
      1200: {
        slidesPerView: 3,
        spaceBetween: 40,
        centeredSlides: false
      }
    }
  });

  // Counter Animation for testimonials
  function startTestimonialCounter(element) {
    const target = parseFloat(element.dataset.target);
    const decimal = parseInt(element.dataset.decimal);
    const duration = 2000; // 2 seconds
    const step = target / (duration / 16); // 60fps
    let current = 0;
    
    function updateCounter() {
      current += step;
      if (current > target) current = target;
      
      // Format number based on decimal places
      const formattedNumber = decimal > 0 ? 
        current.toFixed(decimal) : 
        Math.floor(current).toLocaleString();
      
      // Handle special case for 15000 to show as 15K
      element.textContent = target === 15000 && current === target ? 
        '15K' : formattedNumber;
      
      if (current < target) {
        requestAnimationFrame(updateCounter);
      }
    }
    
    updateCounter();
  }

  // Original counter animation
  function startBasicCounter(counter) {
    const target = parseInt(counter.getAttribute('data-target'));
    const speed = 200;

    const updateCount = () => {
      const count = parseInt(counter.innerText);
      const increment = target / speed;

      if (count < target) {
        counter.innerText = Math.ceil(count + increment);
        setTimeout(updateCount, 1);
      } else {
        counter.innerText = target + '+';
      }
    };
    updateCount();
  }

  // Handle counter scroll for both types
  function handleCounterScroll() {
    // Testimonial counters (with decimal attribute)
    const testimonialCounters = document.querySelectorAll('.counter[data-decimal]:not(.counted)');
    testimonialCounters.forEach(counter => {
      const rect = counter.getBoundingClientRect();
      const isInViewport = rect.top <= window.innerHeight && rect.bottom >= 0;
      
      if (isInViewport) {
        counter.classList.add('counted');
        startTestimonialCounter(counter);
      }
    });

    // Basic counters (without decimal attribute)
    const basicCounters = document.querySelectorAll('.counter:not([data-decimal]):not(.counted)');
    basicCounters.forEach(counter => {
      const rect = counter.getBoundingClientRect();
      const isInViewport = rect.top <= window.innerHeight && rect.bottom >= 0;
      
      if (isInViewport) {
        counter.classList.add('counted');
        startBasicCounter(counter);
      }
    });
  }

  // Listen for scroll events
  window.addEventListener('scroll', handleCounterScroll);
  // Initial check
  document.addEventListener('DOMContentLoaded', handleCounterScroll);

});


