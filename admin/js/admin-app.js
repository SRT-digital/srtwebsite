/**
 * Admin App - Main routing and initialization
 * Handles sidebar navigation and page rendering
 */
(function () {
  "use strict";

  var initialized = false;

  window.AdminApp = {
    currentPage: "dashboard",

    init: function () {
      if (initialized) return;
      initialized = true;

      this.bindSidebar();
      this.bindMobileToggle();
      this.navigate("dashboard");
      this.loadDashboardStats();
    },

    // Sidebar navigation
    bindSidebar: function () {
      var navItems = document.querySelectorAll(".admin-sidebar .nav-item[data-page]");
      navItems.forEach(function (item) {
        item.addEventListener("click", function (e) {
          e.preventDefault();
          var page = this.getAttribute("data-page");
          AdminApp.navigate(page);

          // Close mobile sidebar
          document.querySelector(".admin-sidebar").classList.remove("open");
          document.querySelector(".sidebar-overlay").classList.remove("show");
        });
      });

      // Logout
      var logoutBtn = document.getElementById("btnLogout");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", function () {
          AdminAuth.handleLogout();
        });
      }
    },

    bindMobileToggle: function () {
      var toggle = document.getElementById("sidebarToggle");
      var overlay = document.querySelector(".sidebar-overlay");
      var sidebar = document.querySelector(".admin-sidebar");

      if (toggle) {
        toggle.addEventListener("click", function () {
          sidebar.classList.toggle("open");
          overlay.classList.toggle("show");
        });
      }

      if (overlay) {
        overlay.addEventListener("click", function () {
          sidebar.classList.remove("open");
          overlay.classList.remove("show");
        });
      }
    },

    navigate: function (page) {
      this.currentPage = page;

      // Update active nav item
      document.querySelectorAll(".admin-sidebar .nav-item").forEach(function (el) {
        el.classList.remove("active");
      });
      var activeNav = document.querySelector('.nav-item[data-page="' + page + '"]');
      if (activeNav) activeNav.classList.add("active");

      // Hide all pages, show target
      document.querySelectorAll(".admin-page").forEach(function (el) {
        el.style.display = "none";
      });
      var target = document.getElementById("page-" + page);
      if (target) {
        target.style.display = "block";
      }

      // Update topbar title
      var titles = {
        dashboard: "Dashboard",
        "content-header": "Edit Header & Navigation",
        "content-hero": "Edit Hero Section",
        "content-about": "Edit About Section",
        "content-services": "Edit Services",
        "content-projects": "Edit Portfolio",
        "content-specialties": "Edit Specialties",
        "content-cta": "Edit CTA Banner",
        "content-pricing": "Edit Pricing",
        "content-blog": "Edit Blog Cards",
        "content-faq": "Edit FAQ",
        "content-contact": "Edit Contact Section",
        "content-footer": "Edit Footer",
        "blog-manager": "Blog Manager",
        popups: "Popup Manager",
        "popup-editor": "Popup Editor",
        forms: "Form Submissions",
        analytics: "Analytics",
        settings: "Settings",
      };
      var topTitle = document.getElementById("topbarTitle");
      if (topTitle) topTitle.textContent = titles[page] || "Admin Panel";

      // Load page-specific data
      this.loadPageData(page);
    },

    loadPageData: function (page) {
      if (page === "dashboard") {
        this.loadDashboardStats();
      } else if (page === "forms") {
        if (typeof AdminForms !== "undefined") AdminForms.loadSubmissions();
      } else if (page === "analytics") {
        if (typeof AdminAnalytics !== "undefined") AdminAnalytics.loadData();
      } else if (page === "blog-manager") {
        if (typeof AdminBlog !== "undefined") AdminBlog.loadPosts();
      } else if (page === "popups") {
        if (typeof AdminPopups !== "undefined") AdminPopups.loadPopups();
      } else if (page.startsWith("content-")) {
        var section = page.replace("content-", "");
        if (typeof AdminContent !== "undefined") AdminContent.loadSection(section);
      } else if (page === "settings") {
        if (typeof AdminContent !== "undefined") AdminContent.loadSettings();
      }
    },

    loadDashboardStats: function () {
      // Demo mode: show placeholder stats
      if (AdminAuth.demoMode) {
        var pvEl = document.getElementById("statPageViews");
        var newFormsEl = document.getElementById("statNewForms");
        var totalFormsEl = document.getElementById("statTotalForms");
        var popupsEl = document.getElementById("statActivePopups");
        if (pvEl) pvEl.textContent = "1,247";
        if (newFormsEl) newFormsEl.textContent = "8";
        if (totalFormsEl) totalFormsEl.textContent = "34";
        if (popupsEl) popupsEl.textContent = "2";

        var badge = document.getElementById("newFormsBadge");
        if (badge) { badge.textContent = "8"; badge.style.display = "inline"; }

        AdminApp.renderRecentSubmissions([
          { created_at: new Date().toISOString(), doctor_name: "Dr. Rajesh Kumar", clinic_name: "Smile Dental Clinic", phone: "9092272805", status: "new" },
          { created_at: new Date(Date.now() - 86400000).toISOString(), doctor_name: "Dr. Priya Sharma", clinic_name: "HealthFirst Hospital", phone: "9123456789", status: "contacted" },
          { created_at: new Date(Date.now() - 2*86400000).toISOString(), doctor_name: "Dr. Arun Mehta", clinic_name: "City Eye Care", phone: "9988776655", status: "new" },
          { created_at: new Date(Date.now() - 3*86400000).toISOString(), doctor_name: "Dr. Sneha Patel", clinic_name: "Patel Ortho Centre", phone: "9876501234", status: "converted" },
          { created_at: new Date(Date.now() - 5*86400000).toISOString(), doctor_name: "Dr. Vikram Singh", clinic_name: "SkinGlow Dermatology", phone: "9012345678", status: "archived" },
        ]);
        return;
      }

      var sb = SRT.getSupabase();
      if (!sb) return;

      var today = new Date().toISOString().split("T")[0];
      var weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

      // Load stats in parallel
      Promise.all([
        // Today's page views
        sb
          .from("page_views")
          .select("id", { count: "exact", head: true })
          .gte("created_at", today),
        // New form submissions
        sb
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .eq("status", "new"),
        // Total form submissions this month
        sb
          .from("form_submissions")
          .select("id", { count: "exact", head: true })
          .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        // Active popups
        sb
          .from("popups")
          .select("id", { count: "exact", head: true })
          .eq("active", true),
        // Recent submissions
        sb
          .from("form_submissions")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
      ]).then(function (results) {
        // Update stat cards
        var pvEl = document.getElementById("statPageViews");
        var newFormsEl = document.getElementById("statNewForms");
        var totalFormsEl = document.getElementById("statTotalForms");
        var popupsEl = document.getElementById("statActivePopups");

        if (pvEl) pvEl.textContent = (results[0].count || 0).toLocaleString();
        if (newFormsEl) newFormsEl.textContent = results[1].count || 0;
        if (totalFormsEl) totalFormsEl.textContent = results[2].count || 0;
        if (popupsEl) popupsEl.textContent = results[3].count || 0;

        // Update new forms badge in sidebar
        var badge = document.getElementById("newFormsBadge");
        if (badge) {
          var count = results[1].count || 0;
          badge.textContent = count;
          badge.style.display = count > 0 ? "inline" : "none";
        }

        // Render recent submissions
        AdminApp.renderRecentSubmissions(results[4].data || []);
      }).catch(function (err) {
        console.error("Dashboard stats error:", err);
      });
    },

    renderRecentSubmissions: function (submissions) {
      var tbody = document.getElementById("recentSubmissionsBody");
      if (!tbody) return;

      if (submissions.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="5" style="text-align:center;color:var(--admin-text-muted);padding:24px;">No submissions yet</td></tr>';
        return;
      }

      tbody.innerHTML = submissions
        .map(function (s) {
          var date = new Date(s.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
          });
          var badgeClass =
            s.status === "new"
              ? "badge-new"
              : s.status === "contacted"
              ? "badge-contacted"
              : s.status === "converted"
              ? "badge-converted"
              : "badge-archived";
          return (
            "<tr>" +
            "<td>" + AdminApp.escapeHtml(date) + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.doctor_name || "") + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.clinic_name || "") + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.phone || "") + "</td>" +
            '<td><span class="badge ' + badgeClass + '">' + AdminApp.escapeHtml(s.status) + "</span></td>" +
            "</tr>"
          );
        })
        .join("");
    },

    // Utility: Escape HTML to prevent XSS
    escapeHtml: function (str) {
      if (!str) return "";
      var div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    },

    // Toast notifications
    toast: function (message, type) {
      type = type || "success";
      var existing = document.querySelector(".admin-toast");
      if (existing) existing.remove();

      var icons = {
        success: "fa-circle-check",
        error: "fa-circle-xmark",
        info: "fa-circle-info",
      };

      var toast = document.createElement("div");
      toast.className = "admin-toast " + type;
      toast.innerHTML =
        '<i class="fa-solid ' + (icons[type] || icons.info) + '"></i>' +
        '<span>' + AdminApp.escapeHtml(message) + '</span>';
      document.body.appendChild(toast);

      requestAnimationFrame(function () {
        toast.classList.add("show");
      });

      setTimeout(function () {
        toast.classList.remove("show");
        setTimeout(function () {
          toast.remove();
        }, 300);
      }, 3500);
    },
  };
})();
