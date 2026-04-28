import gsap from "gsap";
import { TextPlugin } from 'gsap/TextPlugin';


// Register plugins
gsap.registerPlugin(TextPlugin);

const Scenes = {
    initHero() {
        const tl = gsap.timeline({
            defaults: { ease: "power2.inOut", duration: 0.4 }
        });

        // Set initial states
        gsap.set(".hero-text h1", { y: 30, opacity: 0 });
        gsap.set(".hero-text p", { y: 20, opacity: 0 });
        gsap.set(".hero-cta", { scale: 0.9, opacity: 0 });
        gsap.set(".hero-note", { y: 5, opacity: 0 });
        gsap.set(".hero-mockup-scene-container", { scale: 0.95, opacity: 0 });
        gsap.set(".mockup-browser-card.terminal", { y: 15, opacity: 0 });

        // Animation sequence is defined below alongside the glitch sync

        // Create responsive Glitch SVG element for Hero Scene
        const svgNS = "http://www.w3.org/2000/svg";
        const glitchSvg = document.createElementNS(svgNS, "svg");
        glitchSvg.classList.add("hero-glitch-svg");
        glitchSvg.setAttribute("viewBox", "0 0 400 400");
        glitchSvg.setAttribute("preserveAspectRatio", "none");
        Object.assign(glitchSvg.style, {
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
        clipPath.setAttribute("id", "glitchClipPathResponsive");
        clipPath.setAttribute("clipPathUnits", "objectBoundingBox");

        const glitchPath = document.createElementNS(svgNS, "path");
        glitchPath.setAttribute("id", "glitchPathElementResponsive");
        glitchPath.setAttribute("transform", "scale(0.0025, 0.0025)");

        clipPath.appendChild(glitchPath);
        defs.appendChild(clipPath);
        glitchSvg.appendChild(defs);
        document.querySelector(".hero-mockup-scene-container").appendChild(glitchSvg);

        // Create Glitch for Pipeline
        const pipelineGlitchSvg = glitchSvg.cloneNode(true);
        pipelineGlitchSvg.querySelector("clipPath").setAttribute("id", "glitchClipPathPipeline");
        const pipelineGlitchPath = pipelineGlitchSvg.querySelector("path");
        pipelineGlitchPath.setAttribute("id", "glitchPathElementPipeline");
        document.querySelector(".hero-mockup-scene").appendChild(pipelineGlitchSvg);

        // Create Glitch for Logo
        const logoGlitchSvg = glitchSvg.cloneNode(true);
        logoGlitchSvg.querySelector("clipPath").setAttribute("id", "glitchClipPathLogo");
        const logoGlitchPath = logoGlitchSvg.querySelector("path");
        logoGlitchPath.setAttribute("id", "glitchPathElementLogo");
        document.querySelector(".nav-left").appendChild(logoGlitchSvg);

        const glitchPaths = [
            "M400,21.66V10.49h-116.29V0H39.36V54.56H0v36.09H101.25v9.77H.23v5.52H101.25v14.44H22.77v15.29H13.82v39.06H.23v6.79H13.82v15.29h60.63v20.81H10.25v51.17H.23v26.75H61.69v30.57h-29.35v12.1H0v30.57H22.77v31.36H400v-25.41h-31.43v-5.95h31.43v-8.28h-31.43v-15.92h-9.57v-14.65h32.56v-13.38h8.44v-10.83h-8.44v-52.23h-79.37v-21.02h69.78v-7.64h18.03v-24.7h-8.44v-52.58h-22.99v-11.89h31.43v-15.29h-31.43v-36.3h31.43V35.03h-116.29v-13.38h116.29ZM138.57,120.38h15.14v15.29h-15.14v-15.29ZM74.45,386.85v-18.08h39.56v14.01h144.19v4.06H74.45Zm89.32-42.28v-6.37h-34.45v-12.1h48.49v18.47h-14.04Zm56.73-25.48h-5.05v-2.55h5.05v2.55Zm-5.05-13.38v-10.19h5.05v10.19h-5.05Z",
            "M398.2,238.77v-14.06h2.28v-24.74h-2.28v-37.76h-8.45v-4.24H215.93v-3.23h178.76v-61.25H254.7v-3.19h33.11v-11.59h102.55V29.58h-52.25V0H93.75V13.18H0v11.19H39.84v29.77H.48v36.15H39.84v28.22H18.22v6.81h5.04v10.06H14.3v61.25h60.63v2.12H1.05v56.57H29.76v21.71H96.62v3.81h4.79v7.66h-3.83v-6.14H.6v14.67H62.17v13.8H.48v30.62H82.37v3.83h35.94v8.77H15.17v13.3H118.31v8.77H.48v23.84H244.84v-12.97h134.3v-18.11h21.34v-8.29h-21.34v-26.19h19.02v-25.45h-42.19v-26.19h18.5v-1.93h26.01v-10.85h-26.01v-25.51h-71.49v-5.73h95.22Zm-171.06-75.27v14.95h-11.21v-14.95h11.21Zm-88.09-38.17h38.45v-5.25h15.55v15.31h-54.01v-10.06Zm76.88,189.34v-3.83h40.42v14.92h-10.22v-11.09h-30.21Zm-45.94,30.62h7.52v8.77h-7.52v-8.77Zm0,22.07h7.52v8.77h-7.52v-8.77Z",
            "M400.21,112.61v-15.31H234.82v-9.04h52.51v-6.59h112.67V32.54h-33.6V6.06h-95.3V0H69.47V2.36H29.34V13.55h40.13v7.51H32.34v20.87h-12.38v10.18H0v36.15H19.96v49.37h18.2v23.05H13.82v11.8H.23v6.81H13.82v37.96h18.52v22.74H13.14v13.3h19.2v8.96h106.23v4.44H.23v26.8H61.69v30.62h-29.35v14.67H114.47v11.23H17.55v30.62h18.3v17.63h51.68v-17.63h26.94v11.98h143.72v5.65h141.81v-25.45h-114.47v-5.21h101.25v-.75h13.22v-8.29h-13.22v-29.24h-17.58v-10.32h30.72v-10.85h-30.72v-5.11h30.72v-31.26h-16.99v-29.1h17.08v-24.74h-60.14v-6.74h-24.11v-8.11h70.6v-61.25h-20.92v-29.24h34.78Zm-164.97,180.87v-8.94h88.66v12.37h-108.46v-3.43h19.79Zm-50.53-151.63v18.82h-30.76v-23.05h71.6v4.23h-40.84Z"
        ];

        const sceneShake = gsap.to(".hero-mockup-scene", { x: "random(-6, 6)", y: "random(-3, 3)", duration: 0.08, repeat: -1, ease: "none", paused: true });
        const pathGlitch = gsap.to(glitchPath, {
            attr: { d: () => glitchPaths[Math.floor(Math.random() * glitchPaths.length)] },
            duration: 0.08,
            repeat: -1,
            repeatRefresh: true,
            ease: "none",
            paused: true
        });

        // Pipeline Glitch Animations
        const pipelineShake = gsap.to(".pipeline-container", { x: "random(-6, 6)", y: "random(-3, 3)", duration: 0.08, repeat: -1, ease: "none", paused: true });
        const pipelinePathGlitchAnim = gsap.to(pipelineGlitchPath, {
            attr: { d: () => glitchPaths[Math.floor(Math.random() * glitchPaths.length)] },
            duration: 0.08,
            repeat: -1,
            repeatRefresh: true,
            ease: "none",
            paused: true
        });

        // Logo Glitch Animations
        const logoShake = gsap.to(".nav-logo", { x: "random(-3, 3)", y: "random(-2, 2)", duration: 0.08, repeat: -1, ease: "none", paused: true });
        const logoPathGlitchAnim = gsap.to(logoGlitchPath, {
            attr: { d: () => glitchPaths[Math.floor(Math.random() * glitchPaths.length)] },
            duration: 0.08,
            repeat: -1,
            repeatRefresh: true,
            ease: "none",
            paused: true
        });

        // Lottie animations are below-the-fold — loaded lazily in initLottie()

        // Initial state for h1
        const h1Content = document.querySelector('.h1-content');
        const h1HTML = "One flat price.<br><span class=\"green\">No bandwidth bills.</span>";
        h1Content.innerHTML = "";

        // Animation sequence — scene + glitch starts immediately at t=0
        tl.to(".nav", { "--nav-scale": 1, duration: 1, ease: "none" }, 0)
            .to(".hero", { "--hero-line-scale": 1, duration: 1, ease: "none" }, 1.0)
            .to(".nav-logo", { opacity: 1, duration: 0.6, ease: "power2.inOut" }, 0)
            .to(".nav-badge", { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }, 0.1)
            .to(".nav-links", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.2)
            .to(".nav-cta-btn", { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" }, 0.3)
            .to(".hero-mockup-scene-container", { scale: 1, opacity: 1, duration: 0.6, ease: "power2.inOut", overwrite: "auto" }, 0)
            .call(() => {
                document.querySelector('.hero-mockup-scene-container').classList.add('glitch-active');
                document.body.classList.add('glitch-active-logo');
                sceneShake.play();
                pathGlitch.play();
                logoShake.play();
                logoPathGlitchAnim.play();
            }, null, 0)
            .call(() => {
                document.querySelector('.hero-mockup-scene-container').classList.remove('glitch-active');
                document.body.classList.remove('glitch-active-logo');
                sceneShake.pause();
                pathGlitch.pause();
                logoShake.pause();
                logoPathGlitchAnim.pause();
                gsap.set(".hero-mockup-scene", { x: 0, y: 0 });
                gsap.set(".nav-logo", { x: 0, y: 0 });
            }, null, 0.6)
            .to(".hero-text h1", { y: 0, opacity: 1, duration: 0.1, overwrite: "auto" }, 0);

        // Refactored H1 typing with proxy
        const h1Parts = h1HTML.match(/(<[^>]+>|[^<])/g);
        const h1Proxy = { index: 0 };
        const h1TypeSpeed = 0.04;
        const h1TypeDuration = h1Parts.length * h1TypeSpeed;

        tl.to(h1Proxy, {
            index: h1Parts.length,
            duration: h1TypeDuration,
            ease: "none",
            onUpdate: () => {
                const currentIdx = Math.ceil(h1Proxy.index);
                h1Content.innerHTML = h1Parts.slice(0, currentIdx).join("");
            }
        }, 0.2);

        const h1TypeEnd = 0.2 + h1TypeDuration;

        tl.to(".hero-text .subtitle", { y: 0, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd)
            .to(".hero-cta", { scale: 1, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd + 0.1)
            .to(".hero-note", { y: 0, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, h1TypeEnd + 0.2)
            .to(".mockup-browser-card.terminal", { y: 0, opacity: 1, duration: 0.4, ease: "power2.inOut", overwrite: "auto" }, 0.6);

        // Terminal typewriter — starts with a small delay after card slide (t=1.3)
        const lines = [
            { el: ".terminal-text p:nth-child(1)", text: "git add ." },
            { el: ".terminal-text p:nth-child(2)", text: 'git commit -m "Initial commit"' },
            { el: ".terminal-text p:nth-child(3)", text: "git push origin main" },
        ];

        const CHAR_SPEED = 0.025; // seconds per character
        let cursor = 1.3;

        // Phase 1: Typing
        lines.forEach(({ el, text }) => {
            const duration = text.length * CHAR_SPEED;
            tl.to(el, { text: { value: text, delimiter: "" }, duration, ease: "none" }, cursor);
            cursor += duration + 0.15; // small gap between lines
        });

        // Phase 2: Deletion (git commit then git add)
        // We delete in reverse order of how they are in the array (2 then 1)
        const line2 = lines[1];
        const line1 = lines[0];

        const delDuration2 = line2.text.length * CHAR_SPEED;
        tl.to(line2.el, { text: { value: "", delimiter: "", rtl: true }, duration: delDuration2, ease: "none" }, cursor);
        cursor += delDuration2 + 0.1;

        const delDuration1 = line1.text.length * CHAR_SPEED;
        tl.to(line1.el, { text: { value: "", delimiter: "", rtl: true }, duration: delDuration1, ease: "none" }, cursor);
        cursor += delDuration1 + 0.3; // wait a bit before bar collapse

        // Phase 3: Browser bar collapse
        tl.to(".mockup-browser-card.terminal .mockup-browser-bar", {
            height: "0px",
            duration: 0.4,
            ease: "power2.inOut"
        }, cursor);

        // Phase 4: Card resize & Padding
        tl.to(".mockup-browser-card.terminal", {
            height: "72px",
            width: "145px",
            duration: 0.4,
            ease: "power2.inOut"
        }, cursor + 0.4)
            .to(".mockup-browser-card.terminal .mockup-browser-body", {
                paddingTop: "9px",
                paddingLeft: "48px",
                paddingBottom: "5px",
                duration: 0.4,
                ease: "power2.inOut"
            }, cursor + 0.4); // Simultaneous with card resize

        // Phase 5: Label Reveal & Color Blink
        tl.to(".terminal-text-ttl", {
            height: "25px",
            duration: 0.3,
            ease: "power2.inOut"
        }, cursor + 0.8)
            .to(".terminal-text p", {
                color: "rgba(17, 163, 42, 0.8)",
                duration: 0.1,
                ease: "power2.inOut",
                repeat: 4, // 5 segments total: W->G, G->W, W->G, G->W, W->G. Ends on Green.
                yoyo: true
            }, cursor + 0.8)
            .to(".mockup-browser-card.terminal .mockup-browser-body", {
                background: "rgba(10, 11, 16, 0.82)",
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 0.8);

        // Phase 6: Git Icon Reveal
        tl.to(".terminal-git-icon", {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: "power2.inOut"
        }, cursor + 1.1) // Start after Phase 5 (0.8 + 0.3)
            .to(".git-build-icon", {
                scale: 1,
                opacity: 1,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 1.1)
            .to(".git-build-icon svg", {
                rotation: 360,
                duration: 5,
                repeat: -1,
                ease: "none"
            }, cursor + 1.1)
            .fromTo(".git-build-line",
                { background: "linear-gradient(81deg, rgb(17, 163, 42) 0%, rgba(17, 163, 42, 0) 0%)" },
                { background: "linear-gradient(81deg, rgb(17, 163, 42) 0%, rgba(17, 163, 42, 0) 100%)", duration: 0.6, ease: "none" },
                cursor + 1.2
            )
            .to(".git-build-line", {
                background: "linear-gradient(81deg, rgba(17, 163, 42, 0) 0%, rgba(17, 163, 42, 1) 100%)",
                duration: 5,
                repeat: -1,
                yoyo: true,
                ease: "none"
            }, cursor + 1.8)
            .to(".rocketCont", {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.out"
            }, cursor + 1.2)
            .to(".pipeline-container", {
                opacity: 1,
                duration: 0.1
            }, cursor + 1.2)
            // Pipeline Glitch Trigger — Starts at cursor + 1.2
            .call(() => {
                document.querySelector('.hero-mockup-scene-container').classList.add('glitch-active-pipeline');
                pipelineShake.play();
                pipelinePathGlitchAnim.play();
            }, null, cursor + 1.2)
            .call(() => {
                document.querySelector('.hero-mockup-scene-container').classList.remove('glitch-active-pipeline');
                pipelineShake.pause();
                pipelinePathGlitchAnim.pause();
                gsap.set(".pipeline-container", { x: 0, y: 0 });
            }, null, cursor + 1.8)
            .to(".pipeline-container", {
                boxShadow: "0px 0px 20px 0px rgba(19, 236, 236, 0.3)",
                duration: 0.1,
                repeat: 4,
                yoyo: true,
                ease: "power2.inOut"
            }, cursor + 1.8)
            .to(".pipeline-ttl span", {
                y: "0%",
                duration: 0.6,
                ease: "power2.inOut"
            }, cursor + 1.9)
            .to(".pipeline-icon", {
                opacity: 1,
                scale: 1,
                duration: 0.6,
                ease: "power2.inOut"
            }, cursor + 2.0)
            .to(".pipeline-icon svg", {
                rotation: 360,
                duration: 4,
                repeat: -1,
                ease: "none"
            }, cursor + 2.0)
            .to(".pipeline-line", {
                width: "100%",
                duration: 0.6,
                ease: "power2.inOut"
            }, cursor + 2.1)
            .to(".pipline-text", {
                opacity: 1,
                duration: 0.6,
                ease: "power2.inOut"
            }, cursor + 2.2)
            .to(".pipeline-container", {
                boxShadow: "0px 0px 20px 0px rgba(19, 236, 236, 0.2)",
                duration: 2,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            }, cursor + 2.3)
            .to(".mockup-browser-card.browser", {
                opacity: 1,
                y: 0,
                duration: 0.6,
                ease: "power2.inOut"
            }, cursor + 2.3)
            // Lottie Content Sequence
            .to("#lottie-blocks", {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9) // Starts right after card reveal ends
            .to("#lottie-blocks", {
                opacity: 0,
                scale: 0.7,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4) // Wait 4s after show ends
            .to("#build-blocks", {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4) // Show build-blocks as previous hide starts
            .to("#build-blocks", {
                opacity: 0,
                scale: 0.7,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4) // Wait 4s after build show ends
            .to("#deploy-blocks", {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4) // Show deploy-blocks
            .to("#deploy-blocks", {
                opacity: 0,
                scale: 0.7,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4 + 0.3 + 4) // Hide deploy-blocks after 4s stay
            // Deployment Success Sequence
            .to(".success-icon", {
                opacity: 1,
                scale: 1,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4 + 0.3 + 4 + 0.3) // Starts as deploy-blocks hide ends
            .to(".success-ttl span", {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4 + 0.3 + 4 + 0.3 + 0.1) // 0.1s after icon
            .to(".success-subttl span", {
                opacity: 1,
                y: 0,
                duration: 0.3,
                ease: "power2.inOut"
            }, cursor + 2.9 + 0.3 + 4 + 0.3 + 4 + 0.3 + 4 + 0.3 + 0.2); // 0.2s after icon

        // --- Pipline Text Cycling ---
        const piplineText = document.querySelector('.pipline-text');
        const lottieShowStart = cursor + 2.9;
        const buildShowStart  = cursor + 2.9 + 0.3 + 4;        // cursor + 7.2
        const deployShowStart = cursor + 2.9 + 0.3 + 4 + 0.3 + 4; // cursor + 11.5
        const sceneDuration   = 12.9; // lottieShowStart → deploy hide

        // Continuous percentage counter running from 0% to 100% across the whole scene
        let currentStep = 'Register project';
        const scenePct = { value: 0 };
        const pipelineSpan = document.querySelector('.pipeline-line span');
        tl.to(scenePct, {
            value: 100,
            duration: sceneDuration,
            ease: "none",
            onUpdate: () => {
                const pct = Math.round(scenePct.value);
                pipelineSpan.style.width = `${scenePct.value}%`;
                if (pct >= 100) {
                    piplineText.textContent = 'Live .... 100%';
                } else {
                    piplineText.textContent = `${currentStep}... ${pct}%`;
                }
            },
            onComplete: () => {
                pipelineSpan.style.width = '100%';
                piplineText.textContent = 'Live .... 100%';
            }
        }, lottieShowStart);

        // Step label changes via .call() — percentage updates automatically via onUpdate
        tl.call(() => { currentStep = 'Register project'; }, null, lottieShowStart)
          .call(() => { currentStep = 'Provision addons (DB, S3, Redis)'; }, null, lottieShowStart + 1.33)
          .call(() => { currentStep = 'Clone repo'; }, null, lottieShowStart + 2.66)
          .call(() => { currentStep = 'Build Docker image (Kaniko)'; }, null, buildShowStart)
          .call(() => { currentStep = 'Push image to registry'; }, null, deployShowStart)
          .call(() => { currentStep = 'Create namespace'; }, null, deployShowStart + 0.4)
          .call(() => { currentStep = 'Copy registry secret'; }, null, deployShowStart + 0.8)
          .call(() => { currentStep = 'Create addon secrets'; }, null, deployShowStart + 1.2)
          .call(() => { currentStep = 'Create/update Deployment'; }, null, deployShowStart + 1.6)
          .call(() => { currentStep = 'Create/update Service'; }, null, deployShowStart + 2.0)
          .call(() => { currentStep = 'Create/update IngressRoute'; }, null, deployShowStart + 2.4)
          .call(() => { currentStep = 'Live'; }, null, deployShowStart + 2.8);

        // Infinite Fly Animation for Rocket
        gsap.timeline({ yoyo: true, repeat: -1 })
            .to(".rocketCont", 0.4, { y: 5, rotation: -0.5, transformOrigin: "bottom center", ease: "sine.inOut" })
            .to(".rocketCont", 0.4, { y: 2, rotation: 0.25, ease: "sine.inOut" })
            .to(".rocketCont", 0.4, { y: -2.5, rotation: -0.25, ease: "sine.inOut" })
            .to(".rocketCont", 0.4, { y: 6, rotation: 0.5, ease: "sine.inOut" });

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
        const navBadge = document.querySelector(".nav-badge");
        const aiSection = document.getElementById("ai");
        if (!aiSection || !nav) return;

        const NAV_HEIGHT = 64;
        let isDark = false;

        function check() {
            const rect = aiSection.getBoundingClientRect();
            // AI section is behind the nav when its top is above 64px and its bottom is below 64px
            const shouldBeDark = rect.top <= NAV_HEIGHT && rect.bottom >= NAV_HEIGHT;

            if (shouldBeDark && !isDark) {
                isDark = true;
                gsap.to(".nav-links", { color: "rgb(30, 29, 29)", duration: 0.3 });
                gsap.to(nav, { "--burger-color": "rgb(30, 29, 29)", duration: 0.3 });
                gsap.to(navBadge, { color: "rgb(30, 29, 29)", duration: 0.3 });
            } else if (!shouldBeDark && isDark) {
                isDark = false;
                gsap.to(".nav-links", { color: "rgba(255, 255, 255, 0.7)", duration: 0.3 });
                gsap.to(nav, { "--burger-color": "rgb(255, 255, 255)", duration: 0.3 });
                gsap.to(navBadge, { color: "rgb(255, 255, 255)", duration: 0.3 });
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

    init() {
        // Hero scene is above-the-fold critical — init immediately
        this.initHero();
        // Lottie is below-the-fold — load lazily
        this.initLottie();
        // Nav color transition for AI section (uses IntersectionObserver, not scroll animation)
        this.initNavTransition();
        // Footer line animation
        this.initFooter();
    }
};

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    Scenes.init();
});
