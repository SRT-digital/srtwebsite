/**
 * Admin Popup Manager Module
 * Create, edit, and manage promotional popups
 */
(function () {
  "use strict";

  window.AdminPopups = {
    popups: [],
    editingId: null,

    loadPopups: function () {
      var container = document.getElementById("popupsContainer");
      if (!container) return;

      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var sb = SRT.getSupabase();
      sb.from("popups")
        .select("*")
        .order("created_at", { ascending: false })
        .then(function (result) {
          AdminPopups.popups = result.data || [];
          AdminPopups.renderList();
        });
    },

    renderList: function () {
      var container = document.getElementById("popupsContainer");
      if (!container) return;

      var html =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
        '<h3 style="margin:0;color:var(--admin-text-heading);font-size:16px;">All Popups</h3>' +
        '<button class="btn-admin btn-primary" onclick="AdminPopups.showEditor(null)"><i class="fa-solid fa-plus"></i> Create Popup</button>' +
        "</div>";

      if (this.popups.length === 0) {
        html +=
          '<div class="empty-state"><i class="fa-solid fa-window-maximize"></i>' +
          '<h3>No popups yet</h3><p>Create your first promotional popup to engage visitors.</p></div>';
      } else {
        html += '<div style="display:grid;gap:12px;">';
        this.popups.forEach(function (p) {
          var content = p.content || {};
          html +=
            '<div class="editor-card" style="margin:0;">' +
            '<div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">' +
            "<div>" +
            '<strong style="color:var(--admin-text-heading);">' + AdminApp.escapeHtml(p.name) + "</strong>" +
            '<span class="badge ' + (p.active ? "badge-active" : "badge-inactive") + '" style="margin-left:10px;">' +
            (p.active ? "Active" : "Inactive") + "</span>" +
            '<div style="font-size:12px;color:var(--admin-text-muted);margin-top:4px;">' +
            AdminApp.escapeHtml(p.template || "centered-modal") + " | " +
            AdminApp.escapeHtml(p.type || "promo") +
            " | Views: " + (p.impressions || 0) + " | Clicks: " + (p.clicks || 0) +
            "</div></div>" +
            "<div>" +
            '<button class="btn-admin btn-sm btn-secondary" onclick="AdminPopups.toggleActive(\'' + p.id + "')\" style='margin-right:6px;'>" +
            '<i class="fa-solid fa-' + (p.active ? "eye-slash" : "eye") + '"></i></button>' +
            '<button class="btn-admin btn-sm btn-secondary" onclick="AdminPopups.showEditor(\'' + p.id + "')\" style='margin-right:6px;'>" +
            '<i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-admin btn-sm btn-danger" onclick="AdminPopups.deletePopup(\'' + p.id + "')\">" +
            '<i class="fa-solid fa-trash"></i></button>' +
            "</div></div></div>";
        });
        html += "</div>";
      }

      container.innerHTML = html;
    },

    // Pre-made design templates
    designTemplates: [
      {
        id: "consultation-offer",
        name: "Free Consultation",
        preview: "linear-gradient(135deg, #0a1a2e 0%, #1a2a3e 100%)",
        icon: "fa-calendar-check",
        data: {
          type: "promo",
          template: "centered-modal",
          content: {
            title: "Book Your Free Consultation",
            subtitle: "Limited Spots Available",
            description: "Get a personalized strategy session with our experts. No obligations, just actionable insights for your clinic's growth.",
            ctaPrimaryText: "Book Now - It's Free",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Maybe Later",
            bgColor: "#0a1a2e",
            textColor: "#ffffff",
            accentColor: "#25bbcc",
            overlayOpacity: 70
          },
          display_rules: { trigger: "delay", delaySeconds: 8, frequency: "once-per-session" }
        }
      },
      {
        id: "special-discount",
        name: "Special Discount",
        preview: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        icon: "fa-percent",
        data: {
          type: "offer",
          template: "centered-modal",
          content: {
            title: "20% Off This Month",
            subtitle: "Exclusive Offer for New Clients",
            description: "Start your digital growth journey with our special introductory pricing. Valid for the first 3 months.",
            ctaPrimaryText: "Claim Your Discount",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "No Thanks",
            bgColor: "#1e1b4b",
            textColor: "#ffffff",
            accentColor: "#a78bfa",
            overlayOpacity: 75
          },
          display_rules: { trigger: "scroll", scrollPercentage: 50, frequency: "once" }
        }
      },
      {
        id: "newsletter-signup",
        name: "Newsletter Signup",
        preview: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
        icon: "fa-envelope",
        data: {
          type: "newsletter",
          template: "slide-in-right",
          content: {
            title: "Get Weekly Growth Tips",
            subtitle: "Join 500+ Doctors",
            description: "Receive actionable digital marketing insights tailored for healthcare professionals. Unsubscribe anytime.",
            ctaPrimaryText: "Subscribe Free",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "",
            bgColor: "#064e3b",
            textColor: "#ffffff",
            accentColor: "#34d399",
            overlayOpacity: 50
          },
          display_rules: { trigger: "delay", delaySeconds: 15, frequency: "once" }
        }
      },
      {
        id: "exit-intent",
        name: "Exit Intent",
        preview: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
        icon: "fa-door-open",
        data: {
          type: "promo",
          template: "centered-modal",
          content: {
            title: "Wait! Don't Leave Yet",
            subtitle: "Special Offer Just For You",
            description: "Before you go, grab our free clinic growth checklist - a proven framework used by top doctors in Coimbatore.",
            ctaPrimaryText: "Get Free Checklist",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "No, I'm Good",
            bgColor: "#1c1917",
            textColor: "#ffffff",
            accentColor: "#f97316",
            overlayOpacity: 80
          },
          display_rules: { trigger: "exit-intent", frequency: "once-per-session" }
        }
      },
      {
        id: "announcement-bar",
        name: "Announcement Bar",
        preview: "linear-gradient(90deg, #25bbcc 0%, #0ea5e9 100%)",
        icon: "fa-bullhorn",
        data: {
          type: "announcement",
          template: "bottom-bar",
          content: {
            title: "New Service Launch!",
            subtitle: "",
            description: "Introducing AI-powered content creation for healthcare. Limited early-bird pricing available.",
            ctaPrimaryText: "Learn More",
            ctaPrimaryLink: "#services",
            ctaSecondaryText: "",
            bgColor: "#0c4a6e",
            textColor: "#ffffff",
            accentColor: "#38bdf8",
            overlayOpacity: 0
          },
          display_rules: { trigger: "page-load", frequency: "every-visit" }
        }
      },
      {
        id: "limited-time",
        name: "Limited Time Deal",
        preview: "linear-gradient(135deg, #be185d 0%, #ec4899 100%)",
        icon: "fa-clock",
        data: {
          type: "offer",
          template: "centered-modal",
          content: {
            title: "48 Hours Left!",
            subtitle: "Flash Sale Ending Soon",
            description: "Our biggest discount of the year is almost over. Lock in your special rate before it expires.",
            ctaPrimaryText: "Grab This Deal",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Remind Me Later",
            bgColor: "#500724",
            textColor: "#ffffff",
            accentColor: "#f472b6",
            overlayOpacity: 75
          },
          display_rules: { trigger: "delay", delaySeconds: 5, frequency: "once-per-session" }
        }
      },
      {
        id: "welcome-new-visitor",
        name: "Welcome Message",
        preview: "linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)",
        icon: "fa-hand-wave",
        data: {
          type: "promo",
          template: "slide-in-right",
          content: {
            title: "Welcome to SRT Digital!",
            subtitle: "Healthcare Marketing Experts",
            description: "We help doctors and clinics in Coimbatore build their digital presence. Let's discuss how we can help you grow.",
            ctaPrimaryText: "Let's Talk",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Browse Services",
            bgColor: "#134e4a",
            textColor: "#ffffff",
            accentColor: "#2dd4bf",
            overlayOpacity: 50
          },
          display_rules: { trigger: "delay", delaySeconds: 3, frequency: "once" }
        }
      },
      {
        id: "case-study",
        name: "Case Study",
        preview: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
        icon: "fa-chart-line",
        data: {
          type: "promo",
          template: "centered-modal",
          content: {
            title: "See How We Helped Dr. Sharma",
            subtitle: "300% Increase in Patient Inquiries",
            description: "Download our free case study to learn how we transformed a dental clinic's digital presence in just 90 days.",
            ctaPrimaryText: "Download Case Study",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Not Now",
            bgColor: "#1e3a8a",
            textColor: "#ffffff",
            accentColor: "#60a5fa",
            overlayOpacity: 75
          },
          display_rules: { trigger: "scroll", scrollPercentage: 60, frequency: "once" }
        }
      },
      {
        id: "webinar-invite",
        name: "Webinar Invite",
        preview: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
        icon: "fa-video",
        data: {
          type: "announcement",
          template: "centered-modal",
          content: {
            title: "Free Live Webinar",
            subtitle: "Digital Marketing for Doctors 101",
            description: "Join us this Saturday at 11 AM for a free masterclass on growing your clinic's online presence. Limited seats!",
            ctaPrimaryText: "Reserve My Spot",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Send Me Recording",
            bgColor: "#4c1d95",
            textColor: "#ffffff",
            accentColor: "#c4b5fd",
            overlayOpacity: 80
          },
          display_rules: { trigger: "delay", delaySeconds: 10, frequency: "once" }
        }
      },
      {
        id: "social-proof",
        name: "Social Proof",
        preview: "linear-gradient(135deg, #ca8a04 0%, #facc15 100%)",
        icon: "fa-star",
        data: {
          type: "promo",
          template: "bottom-bar",
          content: {
            title: "Trusted by 50+ Doctors in Coimbatore",
            subtitle: "",
            description: "Join the growing community of healthcare professionals who trust SRT Digital for their online growth.",
            ctaPrimaryText: "See Success Stories",
            ctaPrimaryLink: "#projects",
            ctaSecondaryText: "",
            bgColor: "#713f12",
            textColor: "#ffffff",
            accentColor: "#fde047",
            overlayOpacity: 0
          },
          display_rules: { trigger: "scroll", scrollPercentage: 30, frequency: "once-per-session" }
        }
      },
      {
        id: "holiday-special",
        name: "Holiday Special",
        preview: "linear-gradient(135deg, #dc2626 0%, #16a34a 100%)",
        icon: "fa-gift",
        data: {
          type: "offer",
          template: "centered-modal",
          content: {
            title: "Holiday Season Offer!",
            subtitle: "Start 2026 Strong",
            description: "Get 2 months FREE when you sign up for our annual plan. Offer valid until December 31st.",
            ctaPrimaryText: "Claim Holiday Offer",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Learn More First",
            bgColor: "#14532d",
            textColor: "#ffffff",
            accentColor: "#4ade80",
            overlayOpacity: 75
          },
          display_rules: { trigger: "delay", delaySeconds: 7, frequency: "once-per-session" }
        }
      },
      {
        id: "whatsapp-chat",
        name: "WhatsApp Chat",
        preview: "linear-gradient(135deg, #16a34a 0%, #22c55e 100%)",
        icon: "fa-brands fa-whatsapp",
        data: {
          type: "promo",
          template: "slide-in-right",
          content: {
            title: "Chat With Us on WhatsApp",
            subtitle: "Quick Response Guaranteed",
            description: "Have questions? Our team is online and ready to help. Get instant answers on WhatsApp.",
            ctaPrimaryText: "Start WhatsApp Chat",
            ctaPrimaryLink: "https://wa.me/919092272805",
            ctaSecondaryText: "Maybe Later",
            bgColor: "#14532d",
            textColor: "#ffffff",
            accentColor: "#4ade80",
            overlayOpacity: 60
          },
          display_rules: { trigger: "scroll", scrollPercentage: 70, frequency: "once-per-session" }
        }
      },
      {
        id: "feedback-request",
        name: "Feedback Request",
        preview: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
        icon: "fa-comments",
        data: {
          type: "newsletter",
          template: "slide-in-right",
          content: {
            title: "We Value Your Opinion",
            subtitle: "Quick 2-Minute Survey",
            description: "Help us improve! Share your thoughts and get a chance to win a free digital audit worth Rs.10,000.",
            ctaPrimaryText: "Take Survey",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Skip",
            bgColor: "#164e63",
            textColor: "#ffffff",
            accentColor: "#22d3ee",
            overlayOpacity: 60
          },
          display_rules: { trigger: "exit-intent", frequency: "once" }
        }
      },
      {
        id: "referral-program",
        name: "Referral Program",
        preview: "linear-gradient(135deg, #db2777 0%, #f472b6 100%)",
        icon: "fa-users",
        data: {
          type: "offer",
          template: "centered-modal",
          content: {
            title: "Refer a Doctor, Earn Rewards!",
            subtitle: "Our Referral Program",
            description: "Know a doctor who needs digital help? Refer them and get 1 month FREE service when they sign up!",
            ctaPrimaryText: "Start Referring",
            ctaPrimaryLink: "#contact",
            ctaSecondaryText: "Tell Me More",
            bgColor: "#831843",
            textColor: "#ffffff",
            accentColor: "#f9a8d4",
            overlayOpacity: 75
          },
          display_rules: { trigger: "delay", delaySeconds: 20, frequency: "once" }
        }
      },
      {
        id: "cookie-notice",
        name: "Cookie Notice",
        preview: "linear-gradient(135deg, #374151 0%, #6b7280 100%)",
        icon: "fa-cookie-bite",
        data: {
          type: "announcement",
          template: "bottom-bar",
          content: {
            title: "We Use Cookies",
            subtitle: "",
            description: "This website uses cookies to enhance your experience. By continuing, you agree to our privacy policy.",
            ctaPrimaryText: "Accept All",
            ctaPrimaryLink: "#",
            ctaSecondaryText: "Customize",
            bgColor: "#1f2937",
            textColor: "#ffffff",
            accentColor: "#9ca3af",
            overlayOpacity: 0
          },
          display_rules: { trigger: "page-load", frequency: "once" }
        }
      }
    ],

    showEditor: function (id) {
      this.editingId = id;
      var popup = id ? this.popups.find(function (p) { return p.id === id; }) : null;
      var content = popup ? popup.content || {} : {};
      var rules = popup ? popup.display_rules || {} : {};

      // Navigate to editor page
      var container = document.getElementById("popupsContainer");
      if (!container) return;

      // Build templates gallery HTML
      var templatesHtml = '<div style="margin-bottom:24px;"><h4 style="margin:0 0 12px;font-size:14px;color:var(--admin-text-heading);">Quick Start Templates</h4>' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">';
      this.designTemplates.forEach(function (t) {
        templatesHtml +=
          '<div onclick="AdminPopups.applyTemplate(\'' + t.id + '\')" style="cursor:pointer;background:' + t.preview + ';border-radius:8px;padding:16px 12px;text-align:center;transition:transform 0.2s,box-shadow 0.2s;" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 4px 12px rgba(0,0,0,0.3)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">' +
          '<i class="fa-solid ' + t.icon + '" style="font-size:20px;color:#fff;margin-bottom:8px;display:block;"></i>' +
          '<span style="font-size:11px;color:#fff;font-weight:500;">' + t.name + '</span>' +
          '</div>';
      });
      templatesHtml += '</div></div>';

      var html =
        '<div style="margin-bottom:16px;">' +
        '<button class="btn-admin btn-secondary btn-sm" onclick="AdminPopups.loadPopups()"><i class="fa-solid fa-arrow-left"></i> Back to List</button>' +
        "</div>" +
        (id ? '' : templatesHtml) + // Only show templates for new popups
        '<div class="editor-card">' +
        '<div class="editor-card-header"><h3>' + (id ? "Edit" : "Create") + " Popup</h3></div>" +
        '<div class="editor-card-body">' +

        // Tabs
        '<div class="admin-tabs">' +
        '<button class="admin-tab active" onclick="AdminPopups.switchTab(\'content\', this)">Content</button>' +
        '<button class="admin-tab" onclick="AdminPopups.switchTab(\'design\', this)">Design</button>' +
        '<button class="admin-tab" onclick="AdminPopups.switchTab(\'rules\', this)">Display Rules</button>' +
        "</div>" +

        // Tab: Content
        '<div class="tab-content active" id="popupTabContent"><form class="admin-form">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Popup Name</label><input type="text" id="popupName" value="' + AdminApp.escapeHtml(popup ? popup.name : "") + '" placeholder="e.g., Summer Offer 2026"></div>' +
        '<div class="form-group"><label>Type</label><select id="popupType">' +
        '<option value="promo"' + ((popup && popup.type === "promo") || !popup ? " selected" : "") + '>Promo</option>' +
        '<option value="offer"' + (popup && popup.type === "offer" ? " selected" : "") + '>Offer</option>' +
        '<option value="newsletter"' + (popup && popup.type === "newsletter" ? " selected" : "") + '>Newsletter</option>' +
        '<option value="announcement"' + (popup && popup.type === "announcement" ? " selected" : "") + '>Announcement</option>' +
        "</select></div></div>" +
        '<div class="form-group"><label>Template</label><select id="popupTemplate">' +
        '<option value="centered-modal"' + (popup && popup.template === "centered-modal" || !popup ? " selected" : "") + '>Centered Modal</option>' +
        '<option value="bottom-bar"' + (popup && popup.template === "bottom-bar" ? " selected" : "") + '>Bottom Bar</option>' +
        '<option value="slide-in-right"' + (popup && popup.template === "slide-in-right" ? " selected" : "") + '>Slide-in Right</option>' +
        '<option value="full-screen"' + (popup && popup.template === "full-screen" ? " selected" : "") + '>Full Screen</option>' +
        "</select></div>" +
        '<div class="form-group"><label>Title</label><input type="text" id="popupTitle" value="' + AdminApp.escapeHtml(content.title || "") + '"></div>' +
        '<div class="form-group"><label>Subtitle</label><input type="text" id="popupSubtitle" value="' + AdminApp.escapeHtml(content.subtitle || "") + '"></div>' +
        '<div class="form-group"><label>Description</label><textarea id="popupDescription" rows="3">' + AdminApp.escapeHtml(content.description || "") + "</textarea></div>" +
        '<div class="form-row">' +
        '<div class="form-group"><label>Primary Button Text</label><input type="text" id="popupCtaText" value="' + AdminApp.escapeHtml(content.ctaPrimaryText || "") + '"></div>' +
        '<div class="form-group"><label>Primary Button Link</label><input type="text" id="popupCtaLink" value="' + AdminApp.escapeHtml(content.ctaPrimaryLink || "#contact") + '"></div>' +
        "</div>" +
        '<div class="form-group"><label>Secondary Button Text (optional)</label><input type="text" id="popupCtaSecondary" value="' + AdminApp.escapeHtml(content.ctaSecondaryText || "") + '"></div>' +
        "</form></div>" +

        // Tab: Design
        '<div class="tab-content" id="popupTabDesign"><form class="admin-form">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Background Color</label><input type="color" id="popupBgColor" value="' + (content.bgColor || "#1a1a2e") + '"></div>' +
        '<div class="form-group"><label>Text Color</label><input type="color" id="popupTextColor" value="' + (content.textColor || "#ffffff") + '"></div>' +
        "</div>" +
        '<div class="form-row">' +
        '<div class="form-group"><label>Accent Color</label><input type="color" id="popupAccentColor" value="' + (content.accentColor || "#25bbcc") + '"></div>' +
        '<div class="form-group"><label>Overlay Opacity (0-100)</label><input type="number" id="popupOverlay" min="0" max="100" value="' + (content.overlayOpacity || 60) + '"></div>' +
        "</div>" +
        '<div class="form-group"><label>Custom CSS (Advanced)</label><textarea id="popupCustomCSS" rows="4" placeholder=".srt-popup-content { border-radius: 16px; }">' + AdminApp.escapeHtml(content.customCSS || "") + "</textarea></div>" +
        '<div class="form-group"><label>Preview</label><div class="popup-preview-frame" id="popupPreview"></div></div>' +
        "</form></div>" +

        // Tab: Display Rules
        '<div class="tab-content" id="popupTabRules"><form class="admin-form">' +
        '<div class="form-row">' +
        '<div class="form-group"><label>Trigger</label><select id="popupTrigger">' +
        '<option value="delay"' + (rules.trigger === "delay" || !rules.trigger ? " selected" : "") + '>After Delay</option>' +
        '<option value="scroll"' + (rules.trigger === "scroll" ? " selected" : "") + '>On Scroll %</option>' +
        '<option value="exit-intent"' + (rules.trigger === "exit-intent" ? " selected" : "") + '>Exit Intent</option>' +
        '<option value="page-load"' + (rules.trigger === "page-load" ? " selected" : "") + '>On Page Load</option>' +
        "</select></div>" +
        '<div class="form-group"><label>Delay (seconds)</label><input type="number" id="popupDelay" min="0" value="' + (rules.delaySeconds || 5) + '"></div>' +
        "</div>" +
        '<div class="form-row">' +
        '<div class="form-group"><label>Scroll Percentage</label><input type="number" id="popupScroll" min="0" max="100" value="' + (rules.scrollPercentage || 50) + '"></div>' +
        '<div class="form-group"><label>Frequency</label><select id="popupFrequency">' +
        '<option value="once"' + (rules.frequency === "once" ? " selected" : "") + ">Once per visitor</option>" +
        '<option value="once-per-session"' + (rules.frequency === "once-per-session" || !rules.frequency ? " selected" : "") + ">Once per session</option>" +
        '<option value="every-visit"' + (rules.frequency === "every-visit" ? " selected" : "") + ">Every visit</option>" +
        "</select></div></div>" +
        '<div class="form-row">' +
        '<div class="form-group"><label>Start Date (optional)</label><input type="date" id="popupStartDate" value="' + (rules.startDate || "") + '"></div>' +
        '<div class="form-group"><label>End Date (optional)</label><input type="date" id="popupEndDate" value="' + (rules.endDate || "") + '"></div>' +
        "</div>" +
        '<div class="form-row">' +
        '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;">' +
        '<input type="checkbox" id="popupShowDesktop" ' + (rules.showOnDesktop !== false ? "checked" : "") + '> Show on Desktop</label></div>' +
        '<div class="form-group"><label style="display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;">' +
        '<input type="checkbox" id="popupShowMobile" ' + (rules.showOnMobile !== false ? "checked" : "") + '> Show on Mobile</label></div>' +
        "</div>" +
        "</form></div>" +

        "</div>" + // editor-card-body end
        '<div class="editor-card-footer">' +
        '<button class="btn-admin btn-secondary" onclick="AdminPopups.loadPopups()">Cancel</button>' +
        '<button class="btn-admin btn-primary" onclick="AdminPopups.savePopup()"><i class="fa-solid fa-floppy-disk"></i> Save Popup</button>' +
        "</div></div>";

      container.innerHTML = html;
    },

    switchTab: function (tab, btn) {
      document.querySelectorAll("#popupsContainer .admin-tab").forEach(function (t) { t.classList.remove("active"); });
      document.querySelectorAll("#popupsContainer .tab-content").forEach(function (c) { c.classList.remove("active"); });
      btn.classList.add("active");
      var tabEl = document.getElementById("popupTab" + tab.charAt(0).toUpperCase() + tab.slice(1));
      if (tabEl) tabEl.classList.add("active");

      if (tab === "design") this.updatePreview();
    },

    updatePreview: function () {
      var frame = document.getElementById("popupPreview");
      if (!frame) return;

      var title = document.getElementById("popupTitle").value || "Your Headline";
      var subtitle = document.getElementById("popupSubtitle").value || "";
      var desc = document.getElementById("popupDescription").value || "Your description here.";
      var bgColor = document.getElementById("popupBgColor").value;
      var textColor = document.getElementById("popupTextColor").value;
      var accentColor = document.getElementById("popupAccentColor").value;
      var ctaText = document.getElementById("popupCtaText").value || "Click Here";

      frame.innerHTML =
        '<div style="background:' + bgColor + ';color:' + textColor + ';padding:30px;border-radius:8px;text-align:center;max-width:360px;">' +
        '<h3 style="margin:0 0 6px;font-size:18px;">' + AdminApp.escapeHtml(title) + "</h3>" +
        (subtitle ? '<p style="opacity:0.7;font-size:13px;margin:0 0 10px;">' + AdminApp.escapeHtml(subtitle) + "</p>" : "") +
        '<p style="font-size:13px;margin:0 0 16px;opacity:0.8;">' + AdminApp.escapeHtml(desc) + "</p>" +
        '<button style="background:' + accentColor + ';color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:14px;cursor:pointer;">' +
        AdminApp.escapeHtml(ctaText) + "</button></div>";
    },

    savePopup: function () {
      var name = document.getElementById("popupName").value.trim();
      if (!name) {
        AdminApp.toast("Please enter a popup name.", "error");
        return;
      }

      var data = {
        name: name,
        type: document.getElementById("popupType").value,
        template: document.getElementById("popupTemplate").value,
        active: false,
        content: {
          title: document.getElementById("popupTitle").value,
          subtitle: document.getElementById("popupSubtitle").value,
          description: document.getElementById("popupDescription").value,
          ctaPrimaryText: document.getElementById("popupCtaText").value,
          ctaPrimaryLink: document.getElementById("popupCtaLink").value,
          ctaSecondaryText: document.getElementById("popupCtaSecondary").value,
          bgColor: document.getElementById("popupBgColor").value,
          textColor: document.getElementById("popupTextColor").value,
          accentColor: document.getElementById("popupAccentColor").value,
          overlayOpacity: parseInt(document.getElementById("popupOverlay").value) || 60,
          customCSS: document.getElementById("popupCustomCSS").value,
        },
        display_rules: {
          trigger: document.getElementById("popupTrigger").value,
          delaySeconds: parseInt(document.getElementById("popupDelay").value) || 5,
          scrollPercentage: parseInt(document.getElementById("popupScroll").value) || 50,
          frequency: document.getElementById("popupFrequency").value,
          startDate: document.getElementById("popupStartDate").value || null,
          endDate: document.getElementById("popupEndDate").value || null,
          showOnDesktop: document.getElementById("popupShowDesktop").checked,
          showOnMobile: document.getElementById("popupShowMobile").checked,
        },
        updated_at: new Date().toISOString(),
      };

      var sb = SRT.getSupabase();

      if (this.editingId) {
        // Update existing
        sb.from("popups")
          .update(data)
          .eq("id", this.editingId)
          .then(function (result) {
            if (result.error) {
              AdminApp.toast("Save failed: " + result.error.message, "error");
              return;
            }
            AdminApp.toast("Popup updated!", "success");
            AdminPopups.loadPopups();
          });
      } else {
        // Create new
        data.active = false;
        data.impressions = 0;
        data.clicks = 0;
        data.closes = 0;
        data.created_at = new Date().toISOString();

        sb.from("popups")
          .insert(data)
          .then(function (result) {
            if (result.error) {
              AdminApp.toast("Create failed: " + result.error.message, "error");
              return;
            }
            AdminApp.toast("Popup created!", "success");
            AdminPopups.loadPopups();
          });
      }
    },

    toggleActive: function (id) {
      var popup = this.popups.find(function (p) { return p.id === id; });
      if (!popup) return;

      var newState = !popup.active;
      var sb = SRT.getSupabase();
      sb.from("popups")
        .update({ active: newState, updated_at: new Date().toISOString() })
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Update failed.", "error");
            return;
          }
          popup.active = newState;
          AdminPopups.renderList();
          AdminApp.toast("Popup " + (newState ? "activated" : "deactivated") + "!", "success");
        });
    },

    deletePopup: function (id) {
      if (!confirm("Delete this popup permanently?")) return;

      var sb = SRT.getSupabase();
      sb.from("popups")
        .delete()
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Delete failed.", "error");
            return;
          }
          AdminPopups.popups = AdminPopups.popups.filter(function (p) { return p.id !== id; });
          AdminPopups.renderList();
          AdminApp.toast("Popup deleted.", "success");
        });
    },

    applyTemplate: function (templateId) {
      var template = this.designTemplates.find(function (t) { return t.id === templateId; });
      if (!template) return;

      var data = template.data;
      var content = data.content || {};
      var rules = data.display_rules || {};

      // Apply to form fields
      var nameField = document.getElementById("popupName");
      if (nameField && !nameField.value) {
        nameField.value = template.name + " - " + new Date().toLocaleDateString();
      }

      // Type & Template
      document.getElementById("popupType").value = data.type || "promo";
      document.getElementById("popupTemplate").value = data.template || "centered-modal";

      // Content
      document.getElementById("popupTitle").value = content.title || "";
      document.getElementById("popupSubtitle").value = content.subtitle || "";
      document.getElementById("popupDescription").value = content.description || "";
      document.getElementById("popupCtaText").value = content.ctaPrimaryText || "";
      document.getElementById("popupCtaLink").value = content.ctaPrimaryLink || "#contact";
      document.getElementById("popupCtaSecondary").value = content.ctaSecondaryText || "";

      // Design
      document.getElementById("popupBgColor").value = content.bgColor || "#1a1a2e";
      document.getElementById("popupTextColor").value = content.textColor || "#ffffff";
      document.getElementById("popupAccentColor").value = content.accentColor || "#25bbcc";
      document.getElementById("popupOverlay").value = content.overlayOpacity || 60;

      // Display Rules
      document.getElementById("popupTrigger").value = rules.trigger || "delay";
      document.getElementById("popupDelay").value = rules.delaySeconds || 5;
      document.getElementById("popupScroll").value = rules.scrollPercentage || 50;
      document.getElementById("popupFrequency").value = rules.frequency || "once-per-session";

      AdminApp.toast("Template applied! Customize and save.", "success");
    },
  };
})();
