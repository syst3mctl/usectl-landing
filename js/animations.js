import gsap from "gsap";
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';


// Register plugins
gsap.registerPlugin(TextPlugin, ScrollTrigger);

const getUiScale = () => {
    const viewportWidth = window.innerWidth;
    if (viewportWidth >= 1280 && viewportWidth <= 1919) {
        return viewportWidth / 1920;
    }
    return 1;
};

const GLITCH_BTN_SELECTOR = [
    '.nav-start-btn',
    '.steps-cta',
    '.steps-create-btn',
    '.section-agents-cta',
    '.section-price-cta',
    '.compat-btn',
].join(', ');

const createLetterSpans = (text) => {
    return [...text].map((char) => {
        const span = document.createElement('span');
        span.innerHTML = char === ' ' ? '&nbsp;' : char;
        return span;
    });
};

const createGlitchOverlay = (text) => {
    const glitch = document.createElement('div');
    glitch.className = 'glitch';
    glitch.setAttribute('aria-hidden', 'true');

    const letters = document.createElement('span');
    letters.className = 'letters';
    createLetterSpans(text).forEach((span) => letters.appendChild(span));
    glitch.appendChild(letters);
    return glitch;
};

const getButtonLabel = (btn) => {
    const existingSpan = btn.querySelector(':scope > span:not(.letters)');
    if (existingSpan) return existingSpan.textContent.trim();

    const text = [...btn.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join('')
        .trim();

    return text || btn.textContent.trim();
};

const initButtonGlitch = () => {
    document.querySelectorAll(GLITCH_BTN_SELECTOR).forEach((btn) => {
        if (btn.querySelector('.glitch')) return;

        const label = getButtonLabel(btn);
        if (!label) return;

        [...btn.childNodes].forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                btn.removeChild(node);
            }
        });

        let labelSpan = btn.querySelector(':scope > span:not(.letters)');
        if (!labelSpan) {
            labelSpan = document.createElement('span');
            labelSpan.textContent = label;
            const img = btn.querySelector('img');
            if (img) {
                img.after(labelSpan);
            } else {
                btn.prepend(labelSpan);
            }
        } else {
            labelSpan.textContent = label;
        }

        btn.appendChild(createGlitchOverlay(label));
    });
};

const Scenes = {
    initHero() {
        const heroInner = document.querySelector(".hero-inner");
        const h1Content = document.querySelector(".h1-content");

        if (heroInner) {
            heroInner.style.minHeight = `${heroInner.offsetHeight}px`;
        }

        if (h1Content) {
            h1Content.style.minHeight = `${h1Content.offsetHeight}px`;
        }

        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut", duration: 0.4 }
        });

        gsap.set("#hero-h1", { y: 30, opacity: 0 });
        gsap.set(".hero .subtitle", { y: 20, opacity: 0 });
        gsap.set(".hero-cta-row", { scale: 0.9, opacity: 0 });
        gsap.set(".hero-note", { y: 5, opacity: 0 });
        gsap.set(".hero-visual", { scale: 0.95, opacity: 0 });
        gsap.set(".hero-bubble", { y: 10, opacity: 0 });

        const heroCloud = document.querySelector(".hero-cloud");
        const heroRobo = document.querySelector(".hero-robo");
        const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const uiScale = getUiScale();

        if (heroCloud && heroRobo) {
            if (prefersReducedMotion) {
                gsap.set(heroCloud, { opacity: 0.85, x: 0, y: 0, scaleY: 1 });
                gsap.set(heroRobo, { y: 0 });
            } else {
                gsap.set(heroCloud, {
                    opacity: 0,
                    x: 28 * uiScale,
                    y: 12 * uiScale,
                    scaleY: 1,
                    transformOrigin: "50% 0%"
                });
                gsap.set(heroRobo, {
                    y: -150 * uiScale,
                    transformOrigin: "50% 100%"
                });
            }
        }

        const svgNS = "http://www.w3.org/2000/svg";
        const logoGlitchSvg = document.createElementNS(svgNS, "svg");
        logoGlitchSvg.classList.add("hero-glitch-svg");
        logoGlitchSvg.setAttribute("viewBox", "0 0 400 400");
        logoGlitchSvg.setAttribute("preserveAspectRatio", "none");
        Object.assign(logoGlitchSvg.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "10"
        });

        const defs = document.createElementNS(svgNS, "defs");
        const clipPath = document.createElementNS(svgNS, "clipPath");
        clipPath.setAttribute("id", "glitchClipPathLogo");
        clipPath.setAttribute("clipPathUnits", "objectBoundingBox");

        const logoGlitchPath = document.createElementNS(svgNS, "path");
        logoGlitchPath.setAttribute("id", "glitchPathElementLogo");
        logoGlitchPath.setAttribute("transform", "scale(0.0025, 0.0025)");

        clipPath.appendChild(logoGlitchPath);
        defs.appendChild(clipPath);
        logoGlitchSvg.appendChild(defs);
        document.querySelector(".nav-left")?.appendChild(logoGlitchSvg);

        const glitchPaths = [
            "M400,21.66V10.49h-116.29V0H39.36V54.56H0v36.09H101.25v9.77H.23v5.52H101.25v14.44H22.77v15.29H13.82v39.06H.23v6.79H13.82v15.29h60.63v20.81H10.25v51.17H.23v26.75H61.69v30.57h-29.35v12.1H0v30.57H22.77v31.36H400v-25.41h-31.43v-5.95h31.43v-8.28h-31.43v-15.92h-9.57v-14.65h32.56v-13.38h8.44v-10.83h-8.44v-52.23h-79.37v-21.02h69.78v-7.64h18.03v-24.7h-8.44v-52.58h-22.99v-11.89h31.43v-15.29h-31.43v-36.3h31.43V35.03h-116.29v-13.38h116.29ZM138.57,120.38h15.14v15.29h-15.14v-15.29ZM74.45,386.85v-18.08h39.56v14.01h144.19v4.06H74.45Zm89.32-42.28v-6.37h-34.45v-12.1h48.49v18.47h-14.04Zm56.73-25.48h-5.05v-2.55h5.05v2.55Zm-5.05-13.38v-10.19h5.05v10.19h-5.05Z",
            "M398.2,238.77v-14.06h2.28v-24.74h-2.28v-37.76h-8.45v-4.24H215.93v-3.23h178.76v-61.25H254.7v-3.19h33.11v-11.59h102.55V29.58h-52.25V0H93.75V13.18H0v11.19H39.84v29.77H.48v36.15H39.84v28.22H18.22v6.81h5.04v10.06H14.3v61.25h60.63v2.12H1.05v56.57H29.76v21.71H96.62v3.81h4.79v7.66h-3.83v-6.14H.6v14.67H62.17v13.8H.48v30.62H82.37v3.83h35.94v8.77H15.17v13.3H118.31v8.77H.48v23.84H244.84v-12.97h134.3v-18.11h21.34v-8.29h-21.34v-26.19h19.02v-25.45h-42.19v-26.19h18.5v-1.93h26.01v-10.85h-26.01v-25.51h-71.49v-5.73h95.22Zm-171.06-75.27v14.95h-11.21v-14.95h11.21Zm-88.09-38.17h38.45v-5.25h15.55v15.31h-54.01v-10.06Zm76.88,189.34v-3.83h40.42v14.92h-10.22v-11.09h-30.21Zm-45.94,30.62h7.52v8.77h-7.52v-8.77Zm0,22.07h7.52v8.77h-7.52v-8.77Z",
            "M400.21,112.61v-15.31H234.82v-9.04h52.51v-6.59h112.67V32.54h-33.6V6.06h-95.3V0H69.47V2.36H29.34V13.55h40.13v7.51H32.34v20.87h-12.38v10.18H0v36.15H19.96v49.37h18.2v23.05H13.82v11.8H.23v6.81H13.82v37.96h18.52v22.74H13.14v13.3h19.2v8.96h106.23v4.44H.23v26.8H61.69v30.62h-29.35v14.67H114.47v11.23H17.55v30.62h18.3v17.63h51.68v-17.63h26.94v11.98h143.72v5.65h141.81v-25.45h-114.47v-5.21h101.25v-.75h13.22v-8.29h-13.22v-29.24h-17.58v-10.32h30.72v-10.85h-30.72v-5.11h30.72v-31.26h-16.99v-29.1h17.08v-24.74h-60.14v-6.74h-24.11v-8.11h70.6v-61.25h-20.92v-29.24h34.78Zm-164.97,180.87v-8.94h88.66v12.37h-108.46v-3.43h19.79Zm-50.53-151.63v18.82h-30.76v-23.05h71.6v4.23h-40.84Z"
        ];

        const logoShake = gsap.to(".nav-logo-text", { x: "random(-3, 3)", y: "random(-2, 2)", duration: 0.08, repeat: -1, ease: "none", paused: true });
        const logoPathGlitchAnim = gsap.to(logoGlitchPath, {
            attr: { d: () => glitchPaths[Math.floor(Math.random() * glitchPaths.length)] },
            duration: 0.08,
            repeat: -1,
            repeatRefresh: true,
            ease: "none",
            paused: true
        });

        const h1HTML = 'Your own machine<br>in the <span class="hero-cloud-line">cloud.<img src="icons/line.svg" alt="" aria-hidden="true" class="underline-deco"><span id="h1-cursor"></span></span>';
        if (h1Content) h1Content.innerHTML = "";

        tl.to(".nav", { "--nav-scale": 1, duration: 1, ease: "none" }, 0)
            .to(".nav-links", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.1)
            .to(".hero-visual", { scale: 1, opacity: 1, duration: 0.6, ease: "power2.inOut", overwrite: "auto" }, 0)
            .call(() => {
                document.body.classList.add('glitch-active-logo');
                logoShake.play();
                logoPathGlitchAnim.play();
            }, null, 0)
            .call(() => {
                document.body.classList.remove('glitch-active-logo');
                logoShake.pause();
                logoPathGlitchAnim.pause();
                gsap.set(".nav-logo-text", { x: 0, y: 0 });
            }, null, 0.6)
            .to("#hero-h1", { y: 0, opacity: 1, duration: 0.1, overwrite: "auto" }, 0);

        if (heroCloud && heroRobo && !prefersReducedMotion) {
            const stackStart = 0.22;

            tl.to(heroCloud, {
                opacity: 0.85,
                x: 0,
                y: 0,
                duration: 0.42,
                ease: "power3.out"
            }, stackStart)
            .to(heroRobo, {
                y: 0,
                duration: 0.34,
                ease: "power4.in"
            }, stackStart + 0.36)
            .to(heroCloud, {
                scaleY: 0.88,
                y: 3 * uiScale,
                duration: 0.07,
                ease: "power2.in"
            }, stackStart + 0.68)
            .to(heroRobo, {
                y: 5 * uiScale,
                duration: 0.07,
                ease: "power2.in"
            }, stackStart + 0.68)
            .to(heroCloud, {
                scaleY: 1,
                y: 0,
                duration: 0.28,
                ease: "power2.out"
            }, stackStart + 0.75)
            .to(heroRobo, {
                y: -2 * uiScale,
                duration: 0.12,
                ease: "power2.out"
            }, stackStart + 0.75)
            .to(heroRobo, {
                y: 0,
                duration: 0.18,
                ease: "power2.inOut"
            }, stackStart + 0.87)
            .call(() => {
                gsap.set(heroCloud, { clearProps: "transform" });
                gsap.set(heroRobo, { clearProps: "transform" });
            }, null, stackStart + 1.05);
        }

        const h1Parts = h1HTML.match(/(<[^>]+>|[^<])/g) || [];
        const h1Proxy = { index: 0 };
        const h1TypeSpeed = 0.04;
        const h1TypeDuration = h1Parts.length * h1TypeSpeed;

        tl.call(() => {
            if (h1Content) h1Content.style.visibility = "visible";
        }, null, 0.2);

        tl.to(h1Proxy, {
            index: h1Parts.length,
            duration: h1TypeDuration,
            ease: "none",
            onUpdate: () => {
                if (!h1Content) return;
                const currentIdx = Math.ceil(h1Proxy.index);
                h1Content.innerHTML = h1Parts.slice(0, currentIdx).join("");
            }
        }, 0.2);

        const h1TypeEnd = 0.2 + h1TypeDuration;

        tl.to(".hero .subtitle", { y: 0, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd)
            .to(".hero-cta-row", { scale: 1, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd + 0.1)
            .to(".hero-note", { y: 0, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd + 0.15)
            .to(".hero-bubble", { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, h1TypeEnd + 0.25);
    },

    initLottie() {
        const firstContainer = document.getElementById('lottie-blocks');
        if (!firstContainer) return;

        const observer = new IntersectionObserver((entries, obs) => {
            if (!entries[0].isIntersecting) return;
            obs.disconnect();

            Promise.all([
                import('lottie-web/build/player/lottie_light'),
                import('./lottie/blocks.json'),
                import('./lottie/build.json'),
                import('./lottie/upload.json'),
            ]).then(([{ default: lottie }, { default: blocksAnimation }, { default: buildAnimation }, { default: uploadAnimation }]) => {
                lottie.loadAnimation({ container: document.getElementById('lottie-blocks'), renderer: 'svg', loop: true, autoplay: true, animationData: blocksAnimation });
                lottie.loadAnimation({ container: document.getElementById('build-blocks'),  renderer: 'svg', loop: true, autoplay: true, animationData: buildAnimation });
                lottie.loadAnimation({ container: document.getElementById('deploy-blocks'), renderer: 'svg', loop: true, autoplay: true, animationData: uploadAnimation });
            });
        }, { rootMargin: '200px' });

        observer.observe(firstContainer);
    },

    initNavTransition() {
        const nav = document.querySelector(".nav");
        const aiSection = document.getElementById("ai");
        if (!aiSection || !nav) return;

        const NAV_HEIGHT = 64;
        let isDark = false;

        function check() {
            const rect = aiSection.getBoundingClientRect();
            const shouldBeDark = rect.top <= NAV_HEIGHT && rect.bottom >= NAV_HEIGHT;

            if (shouldBeDark && !isDark) {
                isDark = true;
                gsap.to(".nav-links", { color: "rgb(30, 29, 29)", duration: 0.3 });
                gsap.to(nav, { "--burger-color": "rgb(30, 29, 29)", duration: 0.3 });
            } else if (!shouldBeDark && isDark) {
                isDark = false;
                gsap.to(".nav-links", { color: "rgba(255, 255, 255, 0.7)", duration: 0.3 });
                gsap.to(nav, { "--burger-color": "rgb(255, 255, 255)", duration: 0.3 });
            }
        }

        window.addEventListener("scroll", check, { passive: true });
        check();
    },

    initFooter() {
        const footer = document.querySelector(".footer");
        if (!footer) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    gsap.to(".footer", {
                        "--footer-line-scale": 1,
                        duration: 1.5,
                        ease: "power2.inOut"
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(footer);
    },

    initStepsScroll() {
        const stepsSection = document.getElementById('steps');
        const pinWrap = document.querySelector('.steps-pin-wrap');
        if (!stepsSection || !pinWrap) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.matchMedia('(max-width: 1024px)').matches;

        if (prefersReducedMotion || isMobile) {
            stepsSection.classList.add('steps-static');
            return;
        }

        const stepsInner = document.querySelector('.steps-inner');
        const copyViewport = document.querySelector('.steps-copy-viewport');
        const copyTrack = document.querySelector('.steps-copy-track');
        const visualViewport = document.querySelector('.steps-visual-viewport');
        const visualTrack = document.querySelector('.steps-visual-track');
        const slides = gsap.utils.toArray('.steps-slide');
        const panels = gsap.utils.toArray('.steps-panel');
        const progress = document.querySelector('.steps-divider-progress');
        const panel0 = panels[0];

        if (!stepsInner || !copyViewport || !copyTrack || !visualViewport || !visualTrack || !slides.length || !panels.length) return;

        document.querySelectorAll('.pin-spacer').forEach((spacer) => {
            const pinned = spacer.querySelector('.steps-inner');
            if (pinned) spacer.replaceWith(pinned);
        });

        const syncStepsContentHeight = () => {
            const scale = window.innerWidth >= 1280 && window.innerWidth <= 1919
                ? window.innerWidth / 1920
                : 1;
            stepsInner.style.setProperty('--steps-content-h', `${545 * scale}px`);
            stepsInner.style.setProperty('--steps-visual-w', `${542 * scale}px`);
        };

        const getTrackStep = (items) => {
            if (items.length < 2) return 0;
            return items[1].offsetTop - items[0].offsetTop;
        };

        syncStepsContentHeight();

        const getCopyStep = () => getTrackStep(slides);
        const getVisualStep = () => getTrackStep(panels);

        gsap.set(copyTrack, { y: 0 });
        gsap.set(visualTrack, { y: 0 });

        if (progress) {
            gsap.set(progress, { y: 0 });
        }

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: stepsInner,
                start: 'center center',
                endTrigger: pinWrap,
                end: 'bottom bottom',
                scrub: true,
                onUpdate: (self) => {
                    stepsSection.classList.toggle('is-inner-scrolling', self.progress > 0);

                    if (panel0) {
                        panel0.style.pointerEvents = self.progress < 0.34 ? 'auto' : 'none';
                    }
                },
            },
        });

        if (progress) {
            tl.to(progress, {
                y: () => {
                    const divider = document.querySelector('.steps-divider');
                    const thumb = progress;
                    if (!divider || !thumb) return 0;
                    return divider.offsetHeight - thumb.offsetHeight;
                },
                ease: 'none',
                duration: 1,
            }, 0);
        }

        tl.to(copyTrack, {
            y: () => -getCopyStep() * (slides.length - 1),
            ease: 'none',
            duration: 1,
        }, 0);

        tl.to(visualTrack, {
            y: () => -getVisualStep() * (panels.length - 1),
            ease: 'none',
            duration: 1,
        }, 0);

        const handleResize = () => {
            const nowMobile = window.matchMedia('(max-width: 1024px)').matches;
            if (nowMobile && !stepsSection.classList.contains('steps-static')) {
                ScrollTrigger.getAll().forEach((st) => {
                    if (st.trigger === stepsInner) st.kill();
                });
                tl.kill();
                stepsSection.classList.remove('is-inner-scrolling');
                stepsSection.classList.add('steps-static');
                gsap.set(copyTrack, { clearProps: 'all' });
                gsap.set(visualTrack, { clearProps: 'all' });
                if (progress) gsap.set(progress, { clearProps: 'all' });
                return;
            }

            syncStepsContentHeight();
            ScrollTrigger.refresh(true);
        };

        window.addEventListener('resize', handleResize);

        window.addEventListener('load', () => {
            syncStepsContentHeight();
            ScrollTrigger.refresh();
        });

        ScrollTrigger.refresh();
    },

    init() {
        initButtonGlitch();
        // Hero scene is above-the-fold critical — init immediately
        this.initHero();
        // Lottie is below-the-fold — load lazily
        this.initLottie();
        // Nav color transition for AI section (uses IntersectionObserver, not scroll animation)
        this.initNavTransition();
        // Footer line animation
        this.initFooter();
        // Steps sticky scroll
        this.initStepsScroll();
    }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    Scenes.init();
});
