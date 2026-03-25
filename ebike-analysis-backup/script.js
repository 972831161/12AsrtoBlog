document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll Reveal Animation using Intersection Observer
    const revealElements = document.querySelectorAll('.reveal-up');
    
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            
            // Add active class to trigger CSS animation
            entry.target.classList.add('active');
            
            // If it's the bar chart, trigger the bar width animation
            const bars = entry.target.querySelectorAll('.bar-fill');
            if (bars.length > 0) {
                setTimeout(() => {
                    bars.forEach(bar => {
                        const targetWidth = bar.getAttribute('data-width');
                        bar.style.width = targetWidth;
                    });
                }, 300); // slight delay after panel appears
            }
            
            observer.unobserve(entry.target);
        });
    }, revealOptions);
    
    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // 2. Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Account for fixed header offset
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // 3. Dynamic background parallax
    const glow1 = document.querySelector('.glow-1');
    const glow2 = document.querySelector('.glow-2');
    
    window.addEventListener('mousemove', (e) => {
        const x = window.innerWidth / 2 - e.clientX;
        const y = window.innerHeight / 2 - e.clientY;
        
        // Very subtle parallax
        if (glow1 && glow2) {
            glow1.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
            glow2.style.transform = `translate(${x * -0.05}px, ${y * -0.05}px)`;
        }
    });

    // Run bar animations if they are already in viewport on load
    setTimeout(() => {
        const preBars = document.querySelectorAll('.active .bar-fill');
        preBars.forEach(bar => {
            const targetWidth = bar.getAttribute('data-width');
            bar.style.width = targetWidth;
        });
    }, 500);
});
