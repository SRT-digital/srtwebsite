/**
 * SRT CMS - Dynamic Content Management System
 * Loads content from Supabase and applies it to the website
 * Supports: text fields, images, lists, services, FAQ, portfolio, pricing, specialties
 */
(function () {
  "use strict";

  var CACHE_KEY = "srt_cms_cache";
  var CACHE_TTL = 30 * 1000; // 30 seconds (fast updates for admin changes)

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  /**
   * Apply all content to the page
   */
  function applyContent(allData) {
    if (!allData || typeof allData !== "object") return;

    Object.keys(allData).forEach(function (sectionId) {
      var section = allData[sectionId];
      if (!section) return;

      var content = section.content || section;
      var visible = section.visible !== false && content._visible !== false;

      // Hide entire section if not visible
      if (!visible) {
        var sectionEl = document.getElementById(sectionId);
        if (sectionEl) sectionEl.style.display = "none";
        return;
      }

      // Apply simple text/image fields
      applySimpleFields(sectionId, content);

      // Apply dynamic lists based on section type
      if (sectionId === "services" && content.items) {
        renderServices(content.items);
      }
      if (sectionId === "faq" && content.items) {
        renderFAQ(content.items);
      }
      if (sectionId === "projects" && content.items) {
        renderPortfolio(content.items);
      }
      if (sectionId === "pricing" && content.plans) {
        renderPricing(content.plans);
      }
      if (sectionId === "specialties" && content.items) {
        renderSpecialties(content.items);
      }

      // Re-initialize counter animation after about section loads
      if (sectionId === "about") {
        reinitCounter();
      }
      if (sectionId === "header") {
        applyHeader(content);
      }
      if (sectionId === "footer") {
        applyFooter(content);
      }
      if (sectionId === "contact") {
        applyContact(content);
      }
      if (sectionId === "about" && content.painPoints) {
        renderAboutServices(content.painPoints);
      }
    });
  }

  /**
   * Apply simple text and image fields
   */
  function applySimpleFields(sectionId, content) {
    // Text fields
    document.querySelectorAll('[data-cms-section="' + sectionId + '"]').forEach(function (el) {
      var fieldKey = el.getAttribute("data-cms-field");
      if (!fieldKey || content[fieldKey] === undefined) return;

      var value = content[fieldKey];

      // Skip empty strings - keep original HTML content
      if (value === "" || value === null || value === undefined) return;

      // Skip invalid counter values (must be numeric for .count elements)
      if (el.classList.contains("count")) {
        var numVal = parseFloat(String(value).replace(/[^0-9.]/g, ""));
        if (isNaN(numVal)) return; // Keep original if not a valid number
      }

      if (el.tagName === "IMG") {
        // Image element
        if (value && value !== el.src) {
          el.src = value;
        }
      } else if (el.tagName === "A") {
        // Link element - update text and href
        var linkKey = el.getAttribute("data-cms-link");
        if (linkKey && content[linkKey] && content[linkKey] !== "") {
          el.href = content[linkKey];
        }
        if (typeof value === "string" && value.trim() !== "") {
          el.textContent = value;
        }
      } else {
        // Regular text element
        if (!el.querySelector("[data-cms-field]") && typeof value === "string" && value.trim() !== "") {
          el.textContent = value;
        }
      }
    });

    // Image fields with data-cms-img attribute
    document.querySelectorAll('[data-cms-section="' + sectionId + '"][data-cms-img]').forEach(function (el) {
      var imgKey = el.getAttribute("data-cms-img");
      if (imgKey && content[imgKey]) {
        el.src = content[imgKey];
      }
    });
  }

  /**
   * Apply header content
   */
  function applyHeader(content) {
    // Logo
    if (content.logoUrl) {
      document.querySelectorAll(".logo img, .main-header .logo img").forEach(function (img) {
        img.src = content.logoUrl;
      });
    }
    // CTA button
    if (content.ctaText || content.ctaLink) {
      document.querySelectorAll(".header-cta, .main-header .theme-btn").forEach(function (btn) {
        if (content.ctaText) btn.textContent = content.ctaText;
        if (content.ctaLink) btn.href = content.ctaLink;
      });
    }
  }

  /**
   * Apply footer content
   */
  function applyFooter(content) {
    if (content.email) {
      document.querySelectorAll(".footer-email, footer a[href^='mailto:']").forEach(function (el) {
        if (el.tagName === "A") {
          el.href = "mailto:" + content.email;
          el.textContent = content.email;
        } else {
          el.textContent = content.email;
        }
      });
    }
    if (content.copyright) {
      document.querySelectorAll(".footer-copyright, .copyright-text").forEach(function (el) {
        el.textContent = content.copyright;
      });
    }
  }

  /**
   * Apply contact section content
   */
  function applyContact(content) {
    var fields = {
      phone: '[data-cms-section="contact"][data-cms-field="phone"]',
      email: '[data-cms-section="contact"][data-cms-field="email"]',
      address: '[data-cms-section="contact"][data-cms-field="address"]',
      hours: '[data-cms-section="contact"][data-cms-field="hours"]'
    };

    Object.keys(fields).forEach(function (key) {
      if (content[key]) {
        var el = document.querySelector(fields[key]);
        if (el) el.textContent = content[key];
      }
    });

    // Social links
    if (content.facebookUrl) {
      document.querySelectorAll('a[href*="facebook.com"]').forEach(function (el) {
        el.href = content.facebookUrl;
      });
    }
    if (content.instagramUrl) {
      document.querySelectorAll('a[href*="instagram.com"]').forEach(function (el) {
        el.href = content.instagramUrl;
      });
    }
    if (content.linkedinUrl) {
      document.querySelectorAll('a[href*="linkedin.com"]').forEach(function (el) {
        el.href = content.linkedinUrl;
      });
    }
    // Note: WhatsApp URL is hardcoded per-button (each has unique pre-filled message)
    // Only override if explicitly set AND points to a different number
    if (content.whatsappUrl && content.whatsappUrl.indexOf("919092272805") > -1) {
      document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
        // Preserve the pre-filled message but update only the number
        var oldHref = el.href;
        var match = oldHref.match(/[?&]text=([^&]*)/);
        var text = match ? "?text=" + match[1] : "";
        el.href = "https://wa.me/919092272805" + text;
      });
    }
  }

  /**
   * Render about section services list
   */
  function renderAboutServices(items) {
    var container = document.querySelector('[data-cms-list="about-painPoints"]');
    if (!container || !Array.isArray(items) || items.length === 0) return;

    // Split items into two columns
    var half = Math.ceil(items.length / 2);
    var col1Items = items.slice(0, half);
    var col2Items = items.slice(half);

    var html = '<div class="row"><div class="col-md-6"><ul>';
    col1Items.forEach(function (item, index) {
      var delay = (index * 0.15).toFixed(2);
      html += '<li data-animation="fade" data-animation-direction="bottom" data-animation-delay="' + delay + '" data-animation-offset="40">' +
        '<h6>' + escapeHtml(typeof item === 'string' ? item : item.text || item.name || '') + '</h6></li>';
    });
    html += '</ul></div><div class="col-md-6"><ul>';
    col2Items.forEach(function (item, index) {
      var delay = (index * 0.15).toFixed(2);
      html += '<li data-animation="fade" data-animation-direction="bottom" data-animation-delay="' + delay + '" data-animation-offset="40">' +
        '<h6>' + escapeHtml(typeof item === 'string' ? item : item.text || item.name || '') + '</h6></li>';
    });
    html += '</ul></div></div>';

    container.innerHTML = html;
  }

  /**
   * Render services dynamically
   */
  function renderServices(items) {
    var container = document.querySelector('[data-cms-list="services"]');
    if (!container || !Array.isArray(items) || items.length === 0) return;

    var html = "";
    items.forEach(function (item, index) {
      var delay = (index * 0.1).toFixed(1);
      html +=
        '<div class="col-lg-4 col-md-6">' +
        '<div class="service-item' + (item.modalId ? ' service-modal-trigger" data-modal="' + escapeHtml(item.modalId) : '') + '" ' +
        'data-speed="' + (index % 2 === 0 ? "1" : "0.9") + '" ' +
        'style="cursor: pointer;" data-animation="fade" data-animation-direction="bottom" ' +
        'data-animation-delay="' + delay + '">' +
        '<div class="service-icon">' +
        '<i class="' + escapeHtml(item.icon || "fa-solid fa-star") + '"></i>' +
        '</div>' +
        '<div class="service-text">' +
        '<h3>' + escapeHtml(item.title) + '</h3>' +
        '<p>' + escapeHtml(item.description) + '</p>' +
        '<span class="service-detail-link">View Details <i class="fa-solid fa-arrow-right"></i></span>' +
        '</div>' +
        '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  /**
   * Render FAQ dynamically
   */
  function renderFAQ(items) {
    var container = document.querySelector('[data-cms-list="faq"]');
    if (!container || !Array.isArray(items) || items.length === 0) return;

    var html = "";
    items.forEach(function (item, index) {
      var delay = (index * 0.15).toFixed(2);
      html +=
        '<div class="gray-bg br-20 p-30 mb-20" data-animation="fade" data-animation-direction="bottom" ' +
        'data-animation-delay="' + delay + '">' +
        '<h4 class="mb-10" style="color: #fff;">' + escapeHtml(item.question) + '</h4>' +
        '<p>' + escapeHtml(item.answer) + '</p>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  /**
   * Render portfolio items dynamically
   */
  // Convert old portfolio-detail.html?project=xxx links → portfolio.html#xxx
  function resolvePortfolioLink(link) {
    if (!link) return './portfolio.html';
    var match = link.match(/portfolio-detail\.html\?project=([^&]+)/);
    if (match) return './portfolio.html#' + match[1];
    return link;
  }

  function renderPortfolio(items) {
    var container = document.querySelector('[data-cms-list="portfolio"]');
    if (!container || !Array.isArray(items) || items.length === 0) return;

    var html = "";
    items.forEach(function (item, index) {
      var delay = (index * 0.1).toFixed(1);
      var category = item.category || "social";
      html +=
        '<div class="portfolio-grid-item" data-category="' + escapeHtml(category) + '" ' +
        'data-animation="fade" data-animation-direction="bottom" data-animation-delay="' + delay + '">' +
        '<a href="' + escapeHtml(resolvePortfolioLink(item.link)) + '" class="portfolio-card-v2">' +
        '<div class="portfolio-card-v2-img">' +
        '<img src="' + escapeHtml(item.image || "./img/portfolio/default.jpg") + '" alt="' + escapeHtml(item.title) + '" loading="lazy" decoding="async" />' +
        '<div class="portfolio-card-v2-hover">' +
        '<span class="portfolio-card-v2-btn"><i class="fa-solid fa-arrow-right"></i></span>' +
        '</div>' +
        '</div>' +
        '<div class="portfolio-card-v2-info">' +
        '<span class="work-tag">' + escapeHtml(getCategoryLabel(category)) + '</span>' +
        '<h4>' + escapeHtml(item.title) + '</h4>' +
        '<p>' + escapeHtml(item.description) + '</p>' +
        '</div>' +
        '</a>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  function getCategoryLabel(cat) {
    var labels = {
      social: "Social Media",
      seo: "Google Ranking",
      web: "Web Development",
      webapp: "Web App",
      brand: "Branding"
    };
    return labels[cat] || cat;
  }

  /**
   * Render pricing plans dynamically
   */
  function renderPricing(plans) {
    var container = document.querySelector('[data-cms-list="pricing"]');
    if (!container || !Array.isArray(plans) || plans.length === 0) return;

    var html = "";
    plans.forEach(function (plan, index) {
      var isFeatured = plan.featured;
      var featuresArr = (plan.features || "").split(",").map(function (f) { return f.trim(); }).filter(Boolean);

      html +=
        '<div class="col-lg-4 col-md-6">' +
        '<a href="./pricing.html" class="pricing-teaser-card' + (isFeatured ? ' pricing-teaser-featured' : '') + '" style="text-decoration:none; display:block;">' +
        (isFeatured ? '<div class="pt-popular-badge"><i class="fa-solid fa-star"></i> Most Popular</div>' : '') +
        '<div class="pt-plan-label">' + escapeHtml(plan.name) + '</div>' +
        '<div class="pt-price">&#8377;' + escapeHtml(plan.price) + '<span>/mo</span></div>' +
        '<p class="pt-desc">' + escapeHtml(plan.description) + '</p>' +
        '<div class="pt-tags">';

      featuresArr.slice(0, 3).forEach(function (feat) {
        html += '<span>' + escapeHtml(feat) + '</span>';
      });

      html +=
        '</div>' +
        '<div class="pt-link">View Full Details <i class="fa-solid fa-arrow-right"></i></div>' +
        '</a>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  /**
   * Render specialties dynamically
   */
  function renderSpecialties(items) {
    // Orbit layout
    var orbitContainer = document.querySelector('[data-cms-list="specialties-orbit"]');
    // Ticker layout
    var tickerContainer = document.querySelector('[data-cms-list="specialties-ticker"]');

    if (!Array.isArray(items) || items.length === 0) return;

    // Default icons for specialties (used when no icon specified)
    var defaultIcons = [
      "fa-solid fa-hand-sparkles",
      "fa-solid fa-tooth",
      "fa-solid fa-person-pregnant",
      "fa-solid fa-person-walking",
      "fa-solid fa-baby",
      "fa-solid fa-stethoscope",
      "fa-solid fa-heart-pulse",
      "fa-solid fa-brain",
      "fa-solid fa-eye",
      "fa-solid fa-bone"
    ];

    if (orbitContainer) {
      var orbitHtml = "";
      items.forEach(function (item, index) {
        var posClass = "specialty-pos-" + ((index % 6) + 1);
        var delay = (index * 0.1).toFixed(1);
        var icon = (item.icon && item.icon.trim()) ? item.icon.trim() : defaultIcons[index % defaultIcons.length];
        orbitHtml +=
          '<div class="specialty-item ' + posClass + '" data-animation="fade" data-animation-direction="bottom" ' +
          'data-animation-delay="' + delay + '">' +
          '<div class="specialty-icon"><i class="' + escapeHtml(icon) + '"></i></div>' +
          '<h4>' + escapeHtml(item.name || "") + '</h4>' +
          '<p>' + escapeHtml(item.description || "") + '</p>' +
          '<div class="specialty-line"></div>' +
          '</div>';
      });
      orbitContainer.innerHTML = orbitHtml;
    }

    if (tickerContainer) {
      var tickerHtml = "";
      // Duplicate for seamless scrolling
      for (var i = 0; i < 2; i++) {
        items.forEach(function (item, index) {
          var icon = (item.icon && item.icon.trim()) ? item.icon.trim() : defaultIcons[index % defaultIcons.length];
          tickerHtml += '<div class="ticker-item"><i class="' + escapeHtml(icon) + '"></i> ' + escapeHtml(item.name || "") + '</div>';
        });
      }
      tickerContainer.innerHTML = tickerHtml;
    }
  }

  /**
   * Re-initialize counter after CMS loads value
   * Uses .cms-counter class to avoid conflict with main.js .count animation
   */
  function reinitCounter() {
    var countEl = document.querySelector('.about-counter .cms-counter');
    if (!countEl) return;

    var value = countEl.textContent.trim();
    // Extract numeric part (e.g., "1.5+" -> 1.5)
    var numVal = parseFloat(value.replace(/[^0-9.]/g, ''));
    // Get suffix (e.g., "+")
    var suffix = value.replace(/[0-9.]/g, '');

    // If value is valid, display it properly (no animation needed, just show the value)
    if (!isNaN(numVal)) {
      // Simply display the value - no animation that could cause NaN
      countEl.textContent = numVal + suffix;
    }
  }

  /**
   * Get cached data if valid
   */
  function getCachedData() {
    try {
      var cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      var parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp > CACHE_TTL) {
        return null;
      }
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  /**
   * Save data to cache
   */
  function setCachedData(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        data: data
      }));
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Fetch fresh data from Supabase
   */
  function fetchFreshData() {
    var sb = window.SRT && window.SRT.getSupabase ? window.SRT.getSupabase() : null;
    if (!sb) {
      console.warn("SRT CMS: Supabase not available");
      return;
    }

    sb.from("site_content")
      .select("*")
      .then(function (result) {
        if (result.error) {
          console.warn("SRT CMS: fetch error", result.error);
          return;
        }

        if (result.data) {
          var dataMap = {};
          result.data.forEach(function (row) {
            dataMap[row.id] = row;
          });
          setCachedData(dataMap);
          applyContent(dataMap);
        }
      })
      .catch(function (err) {
        console.warn("SRT CMS: fetch failed", err);
      });
  }

  /**
   * Initialize CMS
   */
  function init() {
    var cachedData = getCachedData();

    if (cachedData) {
      // Apply cached data immediately for fast first paint
      applyContent(cachedData);
    }
    // Always fetch fresh data immediately so admin changes appear live
    fetchFreshData();
  }

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
