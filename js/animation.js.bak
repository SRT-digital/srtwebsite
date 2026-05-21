/**
 *	Ashik Personal Portfolio HTML Template
 *	Author: CodeeFly
 *	Author URL: http://themeforest.net/user/codeefly
 *	Copyright © by codeefly. All Rights Reserved.
 **/

(function ($) {
  "use strict";

  let innerWidth = window.innerWidth;
  var isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Nokia|Opera Mini/i.test(
      navigator.userAgent
    )
      ? true
      : false;

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);
  var ashik = {
    init() {
      this.smoothScroll();
      this.textAnimation();
      this.imageAnimation();
      this.scrollAnimation();
      this.pinAnimation();
      this.horizontalAnimation();
      this.counterAnimation();
      this.tiltEffect();
      this.mouseMoveEffect();
    },

    smoothScroll() {
      if (innerWidth > 1199) {
        const smoother = ScrollSmoother.create({
          content: "#scrollsmoother-container",
          smooth: 2,
          normalizeScroll: true,
          ignoreMobileResize: true,
          effects: true,
        });
      }
    },

    textAnimation() {
      const textAnimation = $("[data-text-animation]");
      textAnimation.each(function () {
        const text = $(this),
          split = text.data("split"),
          type = text.data("text-animation"),
          d = Number(text.data("animation-delay")) || 0.15;
        let charSplit;
        if (type === "slide" || type === "rotate") {
          charSplit = new SplitText(text, {
            type:
              split === "lines"
                ? "lines"
                : split === "words"
                ? ["words", "lines"]
                : ["words", "lines", "chars"],
            linesClass: "lines",
            wordsClass: "words",
            charsClass: "chars",
          });
        }
        if (type === "slide") {
          gsap.from(charSplit[split], {
            y: "80",
            duration: 0.5,
            stagger: 0.02,
            opacity: 0,
            delay: d,
            ease: "circ.out",
            scrollTrigger: {
              trigger: text[0],
              start: "top 85%",
            },
          });
        } else if (type === "rotate") {
          gsap.from(charSplit[split], {
            rotationX: -80,
            perspective: 400,
            force3D: true,
            transformOrigin: "top center -50",
            stagger: 0.02,
            opacity: 0,
            duration: 1,
            delay: d,
            ease: "circ.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: text[0],
              start: "top center",
            },
          });
        } else if (type === "invert") {
          const RGBToHSL = (r, g, b) => {
            r /= 255;
            g /= 255;
            b /= 255;
            const l = Math.max(r, g, b);
            const s = l - Math.min(r, g, b);
            const h = s
              ? l === r
                ? (g - b) / s
                : l === g
                ? 2 + (b - r) / s
                : 4 + (r - g) / s
              : 0;
            return [
              60 * h < 0 ? 60 * h + 360 : 60 * h,
              100 *
                (s ? (l <= 0.5 ? s / (2 * l - s) : s / (2 - (2 * l - s))) : 0),
              (100 * (2 * l - s)) / 2,
            ];
          };

          let color = text.css("color");
          color = color.toString();
          color = color.match(/(\d+)/g);
          color = RGBToHSL(color[0], color[1], color[2]);
          color = `${color[0].toFixed(1)}, ${color[1].toFixed(
            1
          )}%, ${color[2].toFixed(1)}%`;
          text.css("--text-color", color);

          new SplitText(text, {
            type: "lines",
            linesClass: "invert-line",
          }).lines.forEach(function (t) {
            gsap.to(t, {
              backgroundPositionX: 0,
              ease: "none",
              scrollTrigger: {
                trigger: t,
                scrub: 1,
                start: "top 85%",
                end: "bottom center",
              },
            });
          });
        }
      });
    },

    imageAnimation() {
      const imageAnimation = $("[data-image-animation]");
      imageAnimation.each(function () {
        const type = $(this).data("image-animation");
        if (type === "reveal") {
          const ease = "power2.out",
            wrap = $(this),
            direction = wrap.data("image-animation-direction") || "left";
          wrap.css({
            overflow: "hidden",
            display: "block",
            visibility: "hidden",
            transition: "none",
          });

          wrap.each(function () {
            const image = $(this).find("img");
            const tl = gsap.timeline({
              scrollTrigger: { trigger: $(this), start: "top 50%" },
            });
            const wrapperFrom = {},
              imageFrom = {};

            switch (direction) {
              case "left":
                wrapperFrom.xPercent = -100;
                imageFrom.xPercent = 100;
                break;
              case "right":
                wrapperFrom.xPercent = 100;
                imageFrom.xPercent = -100;
                break;
              case "top":
                wrapperFrom.yPercent = -100;
                imageFrom.yPercent = 100;
                break;
              case "bottom":
                wrapperFrom.yPercent = 100;
                imageFrom.yPercent = -100;
                break;
              default:
                wrapperFrom.xPercent = -100;
                imageFrom.xPercent = 100;
            }

            tl.set($(this), { autoAlpha: 1 })
              .from($(this), 1.5, { ...wrapperFrom, ease })
              .from(image, 1.5, { ...imageFrom, scale: 1.3, ease }, 0);
          });
        } else if (type === "scale") {
          const image = $(this).find("img"),
            startScale = $(this).data("image-scale-animation-start") || 0.7,
            endScale = $(this).data("image-scale-animation-end") || 1;
          gsap.set(image, { scale: startScale });
          gsap.to(image, {
            scale: endScale,
            scrollTrigger: {
              trigger: $(this),
              start: "bottom bottom",
              scrub: true,
            },
          });
          image.parent().css("overflow", "hidden");
        } else if (type === "stretch") {
          const image = $(this).find("img"),
            wrap = $(this);
          gsap
            .timeline({
              scrollTrigger: {
                trigger: wrap,
                start: "top top",
                pin: true,
                scrub: 1,
                pinSpacing: false,
                end: "bottom bottom+=100",
              },
            })
            .to(image, { width: "100%", borderRadius: "0px" });
          wrap.css("transition", "none");
        }
      });
    },

    scrollAnimation() {
      const scrollAnimation = $("[data-animation]");
      scrollAnimation.each(function () {
        const a = $(this),
          ty = a.data("animation"),
          st = a.data("scroll-trigger") || true,
          d = Number(a.data("animation-delay")) || 0.15,
          ss = Number(a.data("animation-start-scale")) || 0.7,
          offset = Number(a.data("animation-offset")) || 80,
          du = Number(a.data("animation-duration")) || 1;

        let config = {
          opacity: 0,
          ease: "power2.out",
          duration: du,
          delay: d,
        };
        if (st) {
          config.scrollTrigger = {
            trigger: this,
            start: "top 90%",
          };
        }
        if (ty === "move") {
          gsap.set(a.parent(), { perspective: 400 });
          gsap.from(a, {
            force3D: true,
            rotationX: -offset,
            opacity: 0,
            duration: du,
            delay: d,
            ease: "power2.out",
            transformOrigin: "top center -50",
            scrollTrigger: { trigger: a, start: "top 85%" },
          });
        } else if (ty === "fade") {
          const dir = a.data("animation-direction"),
            x = { left: -offset, right: offset },
            y = { top: -offset, bottom: offset };
          config = {
            ...config,
            [x[dir] !== undefined ? "x" : y[dir] !== undefined ? "y" : "scale"]:
              x[dir] || y[dir] || ss,
          };

          gsap.from(this, config);
        }
      });
    },

    pinAnimation() {
      if (innerWidth > 1199) {
        const pin = $("[data-pin]");
        pin.each(function () {
          var endTrigger = $(this).data("pin-end-trigger"),
            start = $(this).data("pin-start") || "top top";
          gsap.to(this, {
            scrollTrigger: {
              trigger: this,
              endTrigger,
              pin: this,
              pinSpacing: !1,
              start,
              delay: 0.5,
              markers: !1,
            },
          }),
            $(this).css("transition", "none");
        });
      }
    },

    horizontalAnimation() {
      if (innerWidth > 767) {
        const horizontal = $("[data-horizontal-scroll]");
        horizontal.each(function () {
          let sections = gsap.utils.toArray(
            `.${$(this).data("horizontal-scroll-class")}`
          );
          gsap.to(sections, {
            xPercent: -100 * (sections.length - 1),
            ease: "none",
            scrollTrigger: {
              trigger: this,
              pin: true,
              scrub: 1,
              snap: 1 / (sections.length - 1),
              start: "top top+=30%",
              end: () => "+=" + this.offsetWidth,
            },
          });
        });
      }
    },

    counterAnimation() {
      if (innerWidth > 767) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ".counter-container-wrapper",
            start: "bottom bottom",
            scrub: true,
            end: () => "top top+=100",
          },
        });
        tl.to(".counter-container-wrapper", {
          maxWidth: "100%",
          borderRadius: "0px",
          padding: "0px",
        });
      }
    },

    tiltEffect() {
      const tilt = $("[data-tilt]");
      tilt.each(function () {
        const el = $(this);
        const settings = {
          maxTilt: 25,
          perspective: 1000,
          easing: "cubic-bezier(.03,.98,.52,.99)",
          scale: 1,
          speed: 3000,
          reset: true,
        };

        el.css({ transition: `all ${settings.speed}ms ${settings.easing}` });

        el.mousemove((e) => {
          const cx = window.innerWidth / 2,
            cy = window.innerHeight / 2;
          const tiltx = ((e.clientY - cy) / cy) * settings.maxTilt,
            tilty = -((e.clientX - cx) / cx) * settings.maxTilt;
          el.css({
            transform: `perspective(${settings.perspective}px) rotateX(${tiltx}deg) rotateY(${tilty}deg) scale3d(${settings.scale},${settings.scale},${settings.scale})`,
          });
        });

        if (settings.reset) el.mouseleave(() => el.css({ transform: "" }));
      });
    },

    mouseMoveEffect() {
      const mouse_move = $("[data-mouse-move]");
      mouse_move.each(function () {
        $(this).on("mousemove", (e) => {
          const moveX = 70,
            moveY = 70,
            duration = 0.5;
          const x = (e.clientX / window.innerWidth - 0.5) * moveX;
          const y = (e.clientY / window.innerHeight - 0.5) * moveY;
          gsap.to(this, { x, y, ease: "power3.out", duration });
        });
      });
    },
  };

  $(document).ready(function () {
    ashik.init();
  });
})(jQuery);
