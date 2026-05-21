/**
 * Admin Authentication Module
 * Handles login/logout with Supabase Auth
 * Includes demo mode when Supabase is not configured
 */
(function () {
  "use strict";

  // Demo credentials (works when Supabase is not configured)
  var DEMO_EMAIL = "admin@srtdigitalsolutions.com";
  var DEMO_PASSWORD = "admin@123";

  window.AdminAuth = {
    currentUser: null,
    demoMode: false,

    init: function () {
      var sb = SRT.getSupabase();
      var isConfigured = sb && SRT.SUPABASE_URL && SRT.SUPABASE_URL.indexOf("YOUR_PROJECT_ID") === -1;

      if (isConfigured) {
        // Real Supabase auth
        AdminAuth.demoMode = false;
        sb.auth.getSession().then(function (result) {
          var session = result.data.session;
          if (session && session.user) {
            AdminAuth.currentUser = session.user;
            AdminAuth.showDashboard();
          } else {
            AdminAuth.showLogin();
          }
        });

        sb.auth.onAuthStateChange(function (event, session) {
          if (event === "SIGNED_IN" && session) {
            AdminAuth.currentUser = session.user;
            AdminAuth.showDashboard();
          } else if (event === "SIGNED_OUT") {
            AdminAuth.currentUser = null;
            AdminAuth.showLogin();
          }
        });
      } else {
        // Demo mode - check session
        AdminAuth.demoMode = true;
        var demoSession = sessionStorage.getItem("srt_demo_session");
        if (demoSession) {
          try {
            AdminAuth.currentUser = JSON.parse(demoSession);
            AdminAuth.showDashboard();
          } catch (e) {
            AdminAuth.showLogin();
          }
        } else {
          AdminAuth.showLogin();
        }
      }

      // Bind login form
      var loginForm = document.getElementById("adminLoginForm");
      if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
          e.preventDefault();
          AdminAuth.handleLogin();
        });
      }
    },

    handleLogin: function () {
      var email = document.getElementById("loginEmail").value.trim();
      var password = document.getElementById("loginPassword").value;
      var errorEl = document.getElementById("loginError");
      var btn = document.getElementById("loginBtn");

      if (!email || !password) {
        errorEl.textContent = "Please enter email and password.";
        errorEl.style.display = "block";
        return;
      }

      btn.disabled = true;
      btn.textContent = "Signing in...";
      errorEl.style.display = "none";

      if (AdminAuth.demoMode) {
        // Demo mode authentication
        setTimeout(function () {
          if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
            AdminAuth.currentUser = {
              email: DEMO_EMAIL,
              id: "demo-admin-001",
              role: "admin",
              demo: true,
            };
            sessionStorage.setItem("srt_demo_session", JSON.stringify(AdminAuth.currentUser));
            AdminAuth.showDashboard();
          } else {
            errorEl.textContent = "Invalid credentials. Use demo login.";
            errorEl.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Sign In";
          }
        }, 500);
        return;
      }

      // Real Supabase auth
      var sb = SRT.getSupabase();
      sb.auth
        .signInWithPassword({ email: email, password: password })
        .then(function (result) {
          if (result.error) {
            errorEl.textContent = result.error.message || "Invalid credentials.";
            errorEl.style.display = "block";
            btn.disabled = false;
            btn.textContent = "Sign In";
          }
        })
        .catch(function (err) {
          errorEl.textContent = "Connection error. Please try again.";
          errorEl.style.display = "block";
          btn.disabled = false;
          btn.textContent = "Sign In";
        });
    },

    handleLogout: function () {
      if (AdminAuth.demoMode) {
        sessionStorage.removeItem("srt_demo_session");
        AdminAuth.currentUser = null;
        AdminAuth.showLogin();
        return;
      }

      var sb = SRT.getSupabase();
      sb.auth.signOut().then(function () {
        AdminAuth.currentUser = null;
        AdminAuth.showLogin();
      });
    },

    showLogin: function () {
      document.getElementById("loginScreen").style.display = "flex";
      document.getElementById("adminDashboard").style.display = "none";

      // Show demo hint if in demo mode
      var demoHint = document.getElementById("demoLoginHint");
      if (AdminAuth.demoMode && demoHint) {
        demoHint.style.display = "block";
      }
    },

    showDashboard: function () {
      document.getElementById("loginScreen").style.display = "none";
      document.getElementById("adminDashboard").style.display = "flex";

      // Show demo mode banner
      if (AdminAuth.demoMode) {
        var existing = document.getElementById("demoBanner");
        if (!existing) {
          var banner = document.createElement("div");
          banner.id = "demoBanner";
          banner.style.cssText =
            "background:linear-gradient(90deg,#f59e0b,#d97706);color:#000;text-align:center;" +
            "padding:8px 16px;font-size:13px;font-weight:600;position:fixed;top:0;left:0;right:0;" +
            "z-index:10000;letter-spacing:0.3px;";
          banner.textContent = "DEMO MODE - Supabase not configured. Data is not saved.";
          document.body.appendChild(banner);
          // Push dashboard down
          document.getElementById("adminDashboard").style.marginTop = "36px";
        }
      }

      // Update user display
      var userEl = document.getElementById("adminUserEmail");
      if (userEl && AdminAuth.currentUser) {
        userEl.textContent = AdminAuth.currentUser.email;
      }

      // Initialize admin app
      if (typeof AdminApp !== "undefined" && AdminApp.init) {
        AdminApp.init();
      }
    },

    isAuthenticated: function () {
      return AdminAuth.currentUser !== null;
    },
  };
})();
