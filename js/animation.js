!function(t) {
  "use strict";

  var winW = window.innerWidth;
  var isMobile = winW <= 991;

  gsap.registerPlugin(ScrollTrigger);

  // Only register ScrollSmoother if available and on desktop
  if (typeof ScrollSmoother !== "undefined") {
    gsap.registerPlugin(ScrollSmoother);
  }

  var animations = {
    init: function() {
      this.smoothScroll();
      this.textAnimation();
      this.imageAnimation();
      this.scrollAnimation();
      this.pinAnimation();
      this.horizontalAnimation();
      this.counterAnimation();

      // Desktop-only effects
      if (!isMobile) {
        this.tiltEffect();
        this.mouseMoveEffect();
      }

      // Dot grid (all screen sizes)
      this.dotGrid();

      // Refresh ScrollTrigger after everything is loaded
      // Critical for mobile where ScrollSmoother is absent
      window.addEventListener("load", function() {
        ScrollTrigger.refresh(true);
        // Dispatch scroll event to trigger animations for elements already in viewport
        window.dispatchEvent(new Event("scroll"));
      });
      // Safety refresh after fonts and images settle
      setTimeout(function() {
        ScrollTrigger.refresh(true);
        window.dispatchEvent(new Event("scroll"));
      }, 1500);
    },

    smoothScroll: function() {
      if (typeof ScrollSmoother !== "undefined") {
        if (winW > 1199) {
          ScrollSmoother.create({
            content: "#scrollsmoother-container",
            smooth: 2,
            normalizeScroll: true,
            ignoreMobileResize: true,
            effects: true
          });
        } else {
          ScrollSmoother.create({
            content: "#scrollsmoother-container",
            smooth: 1,
            normalizeScroll: true,
            ignoreMobileResize: true,
            effects: false
          });
        }
      }
    },

    textAnimation: function() {
      t("[data-text-animation]").each(function() {
        var el = t(this);
        var splitType = el.data("split");
        var animType = el.data("text-animation");
        var delay = Number(el.data("animation-delay")) || 0.15;
        var splitResult;

        // On mobile, reduce delays significantly
        if (isMobile) {
          delay = Math.min(delay, 0.3);
        }

        if (animType === "slide" || animType === "rotate") {
          splitResult = new SplitText(el, {
            type: splitType === "lines" ? "lines" : splitType === "words" ? ["words", "lines"] : ["words", "lines", "chars"],
            linesClass: "lines",
            wordsClass: "words",
            charsClass: "chars"
          });
        }

        if (animType === "slide") {
          gsap.from(splitResult[splitType], {
            y: isMobile ? "40" : "80",
            duration: isMobile ? 0.4 : 0.5,
            stagger: 0.02,
            opacity: 0,
            delay: delay,
            ease: "circ.out",
            scrollTrigger: {
              trigger: el[0],
              start: "top 100%",
              once: true
            }
          });
        } else if (animType === "rotate") {
          gsap.from(splitResult[splitType], {
            rotationX: -80,
            perspective: 400,
            force3D: true,
            transformOrigin: "top center -50",
            opacity: 0,
            duration: isMobile ? 0.6 : 1,
            delay: delay,
            ease: "circ.out",
            stagger: 0.06,
            scrollTrigger: {
              trigger: el[0],
              start: "top 100%",
              once: true
            }
          });
        } else if (animType === "invert") {
          var rgbToHsl = function(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            var max = Math.max(r, g, b);
            var d = max - Math.min(r, g, b);
            var h = d ? (max === r ? (g - b) / d : max === g ? 2 + (b - r) / d : 4 + (r - g) / d) : 0;
            return [
              60 * h < 0 ? 60 * h + 360 : 60 * h,
              100 * (d ? (max <= 0.5 ? d / (2 * max - d) : d / (2 - (2 * max - d))) : 0),
              100 * (2 * max - d) / 2
            ];
          };
          var color = el.css("color").toString().match(/(\d+)/g);
          var hsl = rgbToHsl(color[0], color[1], color[2]);
          el.css("--text-color", hsl[0].toFixed(1) + ", " + hsl[1].toFixed(1) + "%, " + hsl[2].toFixed(1) + "%");
          new SplitText(el, { type: "lines", linesClass: "invert-line" }).lines.forEach(function(line) {
            gsap.to(line, {
              backgroundPositionX: 0,
              ease: "none",
              scrollTrigger: {
                trigger: line,
                scrub: 1,
                start: "top 95%",
                end: "bottom center"
              }
            });
          });
        }
      });
    },

    imageAnimation: function() {
      t("[data-image-animation]").each(function() {
        var animType = t(this).data("image-animation");

        if (animType === "reveal") {
          var ease = "power2.out";
          var el = t(this);
          var direction = el.data("image-animation-direction") || "left";
          el.css({ overflow: "hidden", display: "block", visibility: "hidden", transition: "none" });
          el.each(function() {
            var img = t(this).find("img");
            var tl = gsap.timeline({
              scrollTrigger: { trigger: t(this), start: "top 70%" }
            });
            var from1 = {}, from2 = {};
            switch (direction) {
              case "right": from1.xPercent = 100; from2.xPercent = -100; break;
              case "top": from1.yPercent = -100; from2.yPercent = 100; break;
              case "bottom": from1.yPercent = 100; from2.yPercent = -100; break;
              default: from1.xPercent = -100; from2.xPercent = 100;
            }
            tl.set(t(this), { autoAlpha: 1 })
              .from(t(this), 1.5, Object.assign({}, from1, { ease: ease }))
              .from(img, 1.5, Object.assign({}, from2, { scale: 1.3, ease: ease }), 0);
          });
        } else if (animType === "scale") {
          var img = t(this).find("img");
          var scaleStart = t(this).data("image-scale-animation-start") || 0.7;
          var scaleEnd = t(this).data("image-scale-animation-end") || 1;
          gsap.set(img, { scale: scaleStart });
          gsap.to(img, {
            scale: scaleEnd,
            scrollTrigger: { trigger: t(this), start: "bottom bottom", scrub: true }
          });
          img.parent().css("overflow", "hidden");
        } else if (animType === "stretch") {
          var img = t(this).find("img");
          var wrapper = t(this);
          gsap.timeline({
            scrollTrigger: {
              trigger: wrapper,
              start: "top top",
              pin: true,
              scrub: 1,
              pinSpacing: false,
              end: "bottom bottom+=100"
            }
          }).to(img, { width: "100%", borderRadius: "0px" });
          wrapper.css("transition", "none");
        }
      });
    },

    scrollAnimation: function() {
      t("[data-animation]").each(function() {
        var el = t(this);
        var animType = el.data("animation");
        var useScrollTrigger = el.data("scroll-trigger");
        // Handle string "false" properly
        if (useScrollTrigger === false || useScrollTrigger === "false") {
          useScrollTrigger = false;
        } else {
          useScrollTrigger = true;
        }
        var delay = Number(el.data("animation-delay")) || 0.15;
        var startScale = Number(el.data("animation-start-scale")) || 0.7;
        var offset = Number(el.data("animation-offset")) || 80;
        var duration = Number(el.data("animation-duration")) || 1;

        // On mobile, reduce delays and offsets
        if (isMobile) {
          delay = Math.min(delay, 0.3);
          offset = Math.min(offset, 40);
          duration = Math.min(duration, 0.6);
        }

        var config = {
          opacity: 0,
          ease: "power2.out",
          duration: duration,
          delay: delay
        };

        if (useScrollTrigger) {
          config.scrollTrigger = {
            trigger: this,
            start: "top 100%",
            once: true
          };
        }

        if (animType === "move") {
          gsap.set(el.parent(), { perspective: 400 });
          gsap.from(el, {
            force3D: true,
            rotationX: isMobile ? -40 : -offset,
            opacity: 0,
            duration: duration,
            delay: delay,
            ease: "power2.out",
            transformOrigin: "top center -50",
            scrollTrigger: {
              trigger: el,
              start: "top 95%"
            }
          });
        } else if (animType === "fade") {
          var direction = el.data("animation-direction");
          var xMap = { left: -offset, right: offset };
          var yMap = { top: -offset, bottom: offset };

          if (xMap[direction] !== undefined) {
            config.x = xMap[direction];
          } else if (yMap[direction] !== undefined) {
            config.y = yMap[direction];
          } else {
            config.scale = startScale;
          }

          gsap.from(this, config);
        }
      });
    },

    pinAnimation: function() {
      t("[data-pin]").each(function() {
        var endTrigger = t(this).data("pin-end-trigger");
        var startPos = t(this).data("pin-start") || "top top";
        gsap.to(this, {
          scrollTrigger: {
            trigger: this,
            endTrigger: endTrigger,
            pin: this,
            pinSpacing: false,
            start: startPos,
            delay: 0.5,
            markers: false
          }
        });
        t(this).css("transition", "none");
      });
    },

    horizontalAnimation: function() {
      if (winW > 767) {
        t("[data-horizontal-scroll]").each(function() {
          var items = gsap.utils.toArray("." + t(this).data("horizontal-scroll-class"));
          gsap.to(items, {
            xPercent: -100 * (items.length - 1),
            ease: "none",
            scrollTrigger: {
              trigger: this,
              pin: true,
              scrub: 1,
              snap: 1 / (items.length - 1),
              start: "top top+=30%",
              end: function() { return "+=" + this.offsetWidth; }
            }
          });
        });
      }
    },

    counterAnimation: function() {
      var isMob = winW <= 767;
      var el = ".counter-container-wrapper";

      if (isMob) {
        // Force pill starting state via inline styles — GSAP inline overrides CSS without !important
        gsap.set(el, {
          borderRadius: "20px",
          maxWidth: "calc(100% - 32px)",
          width: "calc(100% - 32px)",
          marginLeft: "16px",
          marginRight: "16px",
          padding: "0px"
        });
      }

      gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: isMob ? "top 80%" : "bottom bottom",
          scrub: 1.5,
          end: function() { return isMob ? "+=300" : "top top+=100"; }
        }
      }).to(el, {
        maxWidth: "100%",
        width: "100%",
        borderRadius: "0px",
        marginLeft: "0px",
        marginRight: "0px",
        padding: "0px",
        overwrite: "auto"
      });
    },

    tiltEffect: function() {
      t("[data-tilt]").each(function() {
        var el = t(this);
        var maxTilt = 25;
        var perspective = 1000;
        var easing = "cubic-bezier(.03,.98,.52,.99)";
        var scale = 1;
        var transitionDuration = 3000;
        el.css({ transition: "all " + transitionDuration + "ms " + easing });
        el.mousemove(function(e) {
          var halfW = window.innerWidth / 2;
          var halfH = window.innerHeight / 2;
          var rotX = (e.clientY - halfH) / halfH * maxTilt;
          var rotY = -(e.clientX - halfW) / halfW * maxTilt;
          el.css({
            transform: "perspective(" + perspective + "px) rotateX(" + rotX + "deg) rotateY(" + rotY + "deg) scale3d(" + scale + "," + scale + "," + scale + ")"
          });
        });
        el.mouseleave(function() {
          el.css({ transform: "" });
        });
      });
    },

    dotGrid: function() {
      var canvases = document.querySelectorAll(".dot-grid-canvas");
      if (!canvases.length) return;

      canvases.forEach(function(canvas) {
      var ctx     = canvas.getContext("2d");
      var section = canvas.closest("section");
      var mouse   = { x: -9999, y: -9999 };
      var dots    = [];
      var ripples = [];
      var isMobile = window.innerWidth < 768;
      var gap     = isMobile ? 28 : 22;   // wider grid on mobile for performance
      var r0      = isMobile ? 1.2 : 1.0; // slightly larger dots on mobile
      var glowR   = 110;  // cursor proximity glow radius
      var time    = 0;
      var lastRipple = 0;

      function resize() {
        canvas.width  = section.offsetWidth;
        canvas.height = section.offsetHeight;
        buildDots();
      }

      function buildDots() {
        dots = [];
        var cols = Math.ceil(canvas.width  / gap) + 1;
        var rows = Math.ceil(canvas.height / gap) + 1;
        for (var row = 0; row < rows; row++) {
          for (var col = 0; col < cols; col++) {
            dots.push({ x: col * gap, y: row * gap, glow: 0 });
          }
        }
      }

      function draw() {
        time += 0.018;

        // Age & cull dead ripples
        for (var k = ripples.length - 1; k >= 0; k--) {
          ripples[k].radius  += 2.8;
          ripples[k].strength *= 0.96;
          if (ripples[k].strength < 0.015) ripples.splice(k, 1);
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (var i = 0; i < dots.length; i++) {
          var d  = dots[i];
          var dx = d.x - mouse.x;
          var dy = d.y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          // 1 · Cursor proximity glow
          var hover = dist < glowR ? Math.pow(1 - dist / glowR, 2) * 0.65 : 0;

          // 2 · Expanding ripple rings
          var rippleG = 0;
          for (var j = 0; j < ripples.length; j++) {
            var rp  = ripples[j];
            var rdx = d.x - rp.x;
            var rdy = d.y - rp.y;
            var rd  = Math.sqrt(rdx * rdx + rdy * rdy);
            var diff = Math.abs(rd - rp.radius);
            if (diff < 18) {
              rippleG += rp.strength * Math.pow(1 - diff / 18, 1.5);
            }
          }

          // 3 · Passive ambient wave (diagonal sine) — stronger on mobile
          var wave = (Math.sin(d.x * 0.025 + d.y * 0.012 + time) * 0.5 + 0.5) * (isMobile ? 0.18 : 0.07);

          var g = Math.min(1, hover + rippleG + wave);
          // Smooth lerp
          d.glow += (g - d.glow) * 0.14;

          var gl    = d.glow;
          var red   = Math.round(28  + (37  - 28)  * gl);
          var green = Math.round(48  + (187 - 48)  * gl);
          var blue  = Math.round(88  + (204 - 88)  * gl);
          var alpha = 0.11 + 0.85 * gl;
          var rad   = r0  + gl * 1.8;

          ctx.beginPath();
          ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + "," + alpha + ")";
          ctx.fill();
        }

        requestAnimationFrame(draw);
      }

      section.addEventListener("mousemove", function(e) {
        var rect = section.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
        // Spawn a ripple every 70 ms as cursor moves
        var now = Date.now();
        if (now - lastRipple > 70) {
          ripples.push({ x: mouse.x, y: mouse.y, radius: 0, strength: 0.9 });
          lastRipple = now;
        }
      });

      section.addEventListener("mouseleave", function() {
        mouse.x = -9999;
        mouse.y = -9999;
      });

      // Touch support for mobile
      section.addEventListener("touchstart", function(e) {
        var rect = section.getBoundingClientRect();
        var t0 = e.touches[0];
        mouse.x = t0.clientX - rect.left;
        mouse.y = t0.clientY - rect.top;
        ripples.push({ x: mouse.x, y: mouse.y, radius: 0, strength: 1.2 });
        lastRipple = Date.now();
      }, { passive: true });

      section.addEventListener("touchmove", function(e) {
        var rect = section.getBoundingClientRect();
        var t0 = e.touches[0];
        mouse.x = t0.clientX - rect.left;
        mouse.y = t0.clientY - rect.top;
        var now = Date.now();
        if (now - lastRipple > 80) {
          ripples.push({ x: mouse.x, y: mouse.y, radius: 0, strength: 0.9 });
          lastRipple = now;
        }
      }, { passive: true });

      section.addEventListener("touchend", function() {
        mouse.x = -9999;
        mouse.y = -9999;
      }, { passive: true });

      resize();
      window.addEventListener("resize", resize);
      draw();
      }); // end canvases.forEach
    },

    mouseMoveEffect: function() {
      t("[data-mouse-move]").each(function() {
        t(this).on("mousemove", function(e) {
          var x = 70 * (e.clientX / window.innerWidth - 0.5);
          var y = 70 * (e.clientY / window.innerHeight - 0.5);
          gsap.to(this, { x: x, y: y, ease: "power3.out", duration: 0.5 });
        });
      });
    }
  };

  t(document).ready(function() {
    animations.init();

    // Auto-close mobile menu when a nav link is clicked
    t(document).on('click', '#mobile-nav a', function() {
      t('.mobile-menu').removeClass('visible');
    });
  });

}(jQuery);
