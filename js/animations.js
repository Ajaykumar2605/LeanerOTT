// Ensure Motion One is available globally via CDN (window.Motion)
const { animate, spring, stagger } = window.Motion;

const animations = {
    pageTransition: (containerId) => {
        animate(
            `#${containerId}`,
            { opacity: [0, 1], y: [20, 0] },
            { duration: 0.3, easing: "ease-out" }
        );
    },

    staggerCards: () => {
        const cards = document.querySelectorAll('.ott-card');
        if (cards.length === 0) return;

        // Ensure Motion is loaded
        if (!window.Motion) return console.warn('Motion One not loaded');
        const { animate, spring, stagger } = window.Motion;
        
        try {
            animate(
                Array.from(cards),
                { opacity: [0, 1], scale: [0.9, 1], y: [30, 0] },
                { 
                    duration: 0.5, 
                    delay: stagger ? stagger(0.05) : 0,
                    easing: spring ? spring({ stiffness: 300, damping: 20 }) : "ease-out"
                }
            );
        } catch (err) {
            console.error('Animation failed:', err);
        }
    },

    modalEnter: (modalEl) => {
        modalEl.style.display = 'flex';
        const inner = modalEl.querySelector('.modal');
        animate(
            modalEl,
            { opacity: [0, 1] },
            { duration: 0.3 }
        );
        animate(
            inner,
            { scale: [0.8, 1], y: [50, 0] },
            { duration: 0.3, easing: spring() }
        );
    },

    modalExit: (modalEl) => {
        const inner = modalEl.querySelector('.modal');
        animate(inner, { scale: 0.8, y: 50 }, { duration: 0.2 });
        animate(modalEl, { opacity: 0 }, { duration: 0.2 }).finished.then(() => {
            modalEl.style.display = 'none';
        });
    }
};

window.appAnimations = animations;
