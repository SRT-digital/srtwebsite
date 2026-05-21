/**
 * Admin Analytics Dashboard Module
 * Displays page views, visitors, and traffic data using Chart.js
 */
(function () {
  "use strict";

  var charts = {};

  window.AdminAnalytics = {
    range: 7, // days
    data: [],

    loadData: function () {
      var container = document.getElementById("analyticsContainer");
      if (!container) return;

      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var sb = SRT.getSupabase();
      var since = new Date(Date.now() - this.range * 86400000).toISOString();

      sb.from("page_views")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .then(function (result) {
          if (result.error) {
            container.innerHTML =
              '<div class="empty-state"><i class="fa-solid fa-chart-line"></i><h3>Error loading analytics</h3></div>';
            return;
          }
          AdminAnalytics.data = result.data || [];
          AdminAnalytics.render();
        });
    },

    render: function () {
      var container = document.getElementById("analyticsContainer");
      if (!container) return;

      var data = this.data;
      // Use ip_hash as visitor identifier (from actual DB schema)
      var uniqueVisitors = new Set(data.map(function (d) { return d.ip_hash || d.visitor_id; })).size;
      var uniqueSessions = uniqueVisitors; // Approximate sessions as visitors
      var avgTime = data.length > 0 ? Math.round(data.reduce(function (s, d) { return s + (d.time_on_page || 0); }, 0) / data.length) : 0;
      var avgScroll = data.length > 0 ? Math.round(data.reduce(function (s, d) { return s + (d.scroll_depth || 0); }, 0) / data.length) : 0;

      var html =
        // Range selector
        '<div class="filter-bar" style="margin-bottom:20px;">' +
        '<button class="btn-admin btn-sm ' + (this.range === 7 ? "btn-primary" : "btn-secondary") + '" onclick="AdminAnalytics.setRange(7)">7 Days</button>' +
        '<button class="btn-admin btn-sm ' + (this.range === 14 ? "btn-primary" : "btn-secondary") + '" onclick="AdminAnalytics.setRange(14)">14 Days</button>' +
        '<button class="btn-admin btn-sm ' + (this.range === 30 ? "btn-primary" : "btn-secondary") + '" onclick="AdminAnalytics.setRange(30)">30 Days</button>' +
        "</div>" +

        // Stats cards
        '<div class="stat-cards">' +
        '<div class="stat-card"><div class="stat-label">Page Views</div><div class="stat-value">' + data.length.toLocaleString() + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Unique Visitors</div><div class="stat-value">' + uniqueVisitors.toLocaleString() + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Avg Time on Page</div><div class="stat-value">' + AdminAnalytics.formatTime(avgTime) + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Avg Scroll Depth</div><div class="stat-value">' + avgScroll + "%</div></div>" +
        "</div>" +

        // Charts
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
        '<div class="chart-card" style="grid-column:1/3"><h4>Page Views Over Time</h4><canvas id="chartViews"></canvas></div>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
        '<div class="chart-card"><h4>Top Pages</h4><canvas id="chartPages"></canvas></div>' +
        '<div class="chart-card"><h4>Device Breakdown</h4><canvas id="chartDevices"></canvas></div>' +
        "</div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;">' +
        '<div class="chart-card"><h4>Browser Breakdown</h4><canvas id="chartBrowsers"></canvas></div>' +
        '<div class="chart-card"><h4>Top Referrers</h4><canvas id="chartReferrers"></canvas></div>' +
        "</div>" +

        // Visitor table
        '<div class="admin-table-wrap"><div class="admin-table-header"><h3>Recent Visitors</h3></div>' +
        '<table class="admin-table"><thead><tr>' +
        "<th>Date</th><th>Page</th><th>Device</th><th>Browser</th><th>Referrer</th><th>Time</th><th>Scroll</th>" +
        "</tr></thead><tbody>";

      var recent = data.slice(0, 50);
      if (recent.length === 0) {
        html += '<tr><td colspan="7" style="text-align:center;color:var(--admin-text-muted);padding:24px;">No data yet</td></tr>';
      } else {
        recent.forEach(function (d) {
          var date = new Date(d.created_at).toLocaleString("en-IN", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          });
          // Parse user_agent for device/browser info
          var ua = d.user_agent || "";
          var device = /Mobile|Android|iPhone/i.test(ua) ? "Mobile" : "Desktop";
          var browser = AdminAnalytics.parseBrowser(ua);
          html +=
            "<tr>" +
            "<td>" + AdminApp.escapeHtml(date) + "</td>" +
            "<td>" + AdminApp.escapeHtml(d.page_url || d.page || "/") + "</td>" +
            "<td>" + AdminApp.escapeHtml(d.device || device) + "</td>" +
            "<td>" + AdminApp.escapeHtml(d.browser || browser) + "</td>" +
            "<td>" + AdminApp.escapeHtml(AdminAnalytics.shortenUrl(d.referrer)) + "</td>" +
            "<td>" + AdminAnalytics.formatTime(d.time_on_page || 0) + "</td>" +
            "<td>" + (d.scroll_depth || 0) + "%</td>" +
            "</tr>";
        });
      }

      html += "</tbody></table></div>";
      container.innerHTML = html;

      // Render charts
      this.renderCharts(data);
    },

    renderCharts: function (data) {
      // Destroy existing charts
      Object.keys(charts).forEach(function (k) {
        if (charts[k]) charts[k].destroy();
      });

      if (typeof Chart === "undefined") return;

      var chartColors = {
        accent: "#25bbcc",
        accentAlpha: "rgba(37, 187, 204, 0.2)",
        text: "#8899aa",
        grid: "rgba(255,255,255,0.05)",
        palette: ["#25bbcc", "#2ecc71", "#f39c12", "#e74c3c", "#9b59b6", "#3498db", "#1abc9c", "#e67e22"],
      };

      var defaults = {
        color: chartColors.text,
        borderColor: chartColors.grid,
      };
      Chart.defaults.color = chartColors.text;
      Chart.defaults.borderColor = chartColors.grid;

      // Views over time
      var dailyCounts = {};
      for (var i = this.range - 1; i >= 0; i--) {
        var d = new Date(Date.now() - i * 86400000);
        var key = d.toISOString().split("T")[0];
        dailyCounts[key] = 0;
      }
      data.forEach(function (d) {
        var key = new Date(d.created_at).toISOString().split("T")[0];
        if (dailyCounts[key] !== undefined) dailyCounts[key]++;
      });

      var viewLabels = Object.keys(dailyCounts).map(function (k) {
        return new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      });
      var viewData = Object.values(dailyCounts);

      var viewsCtx = document.getElementById("chartViews");
      if (viewsCtx) {
        charts.views = new Chart(viewsCtx, {
          type: "line",
          data: {
            labels: viewLabels,
            datasets: [{
              label: "Page Views",
              data: viewData,
              borderColor: chartColors.accent,
              backgroundColor: chartColors.accentAlpha,
              fill: true,
              tension: 0.4,
              pointRadius: 3,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      }

      // Top pages
      var pageCounts = {};
      data.forEach(function (d) {
        var page = d.page_url || d.page || "/";
        pageCounts[page] = (pageCounts[page] || 0) + 1;
      });
      var sortedPages = Object.entries(pageCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);

      var pagesCtx = document.getElementById("chartPages");
      if (pagesCtx) {
        charts.pages = new Chart(pagesCtx, {
          type: "bar",
          data: {
            labels: sortedPages.map(function (p) { return p[0].replace("/", "") || "Home"; }),
            datasets: [{
              data: sortedPages.map(function (p) { return p[1]; }),
              backgroundColor: chartColors.palette.slice(0, sortedPages.length),
            }],
          },
          options: {
            responsive: true,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      }

      // Device breakdown (parse from user_agent if device not available)
      var deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
      data.forEach(function (d) {
        var dev = d.device;
        if (!dev && d.user_agent) {
          var ua = d.user_agent;
          if (/iPad|Tablet/i.test(ua)) dev = "tablet";
          else if (/Mobile|Android|iPhone/i.test(ua)) dev = "mobile";
          else dev = "desktop";
        }
        dev = (dev || "desktop").toLowerCase();
        if (deviceCounts[dev] !== undefined) deviceCounts[dev]++;
        else deviceCounts.desktop++;
      });

      var devicesCtx = document.getElementById("chartDevices");
      if (devicesCtx) {
        charts.devices = new Chart(devicesCtx, {
          type: "doughnut",
          data: {
            labels: ["Desktop", "Mobile", "Tablet"],
            datasets: [{
              data: [deviceCounts.desktop, deviceCounts.mobile, deviceCounts.tablet],
              backgroundColor: [chartColors.palette[0], chartColors.palette[1], chartColors.palette[2]],
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          },
        });
      }

      // Browser breakdown (parse from user_agent if browser not available)
      var browserCounts = {};
      data.forEach(function (d) {
        var b = d.browser || AdminAnalytics.parseBrowser(d.user_agent) || "Unknown";
        browserCounts[b] = (browserCounts[b] || 0) + 1;
      });
      var sortedBrowsers = Object.entries(browserCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);

      var browsersCtx = document.getElementById("chartBrowsers");
      if (browsersCtx) {
        charts.browsers = new Chart(browsersCtx, {
          type: "doughnut",
          data: {
            labels: sortedBrowsers.map(function (b) { return b[0]; }),
            datasets: [{
              data: sortedBrowsers.map(function (b) { return b[1]; }),
              backgroundColor: chartColors.palette.slice(0, sortedBrowsers.length),
              borderWidth: 0,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { position: "bottom" } },
          },
        });
      }

      // Referrers
      var refCounts = {};
      data.forEach(function (d) {
        var ref = AdminAnalytics.shortenUrl(d.referrer) || "Direct";
        refCounts[ref] = (refCounts[ref] || 0) + 1;
      });
      var sortedRefs = Object.entries(refCounts).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);

      var refsCtx = document.getElementById("chartReferrers");
      if (refsCtx) {
        charts.referrers = new Chart(refsCtx, {
          type: "bar",
          data: {
            labels: sortedRefs.map(function (r) { return r[0]; }),
            datasets: [{
              data: sortedRefs.map(function (r) { return r[1]; }),
              backgroundColor: chartColors.palette.slice(0, sortedRefs.length),
            }],
          },
          options: {
            responsive: true,
            indexAxis: "y",
            plugins: { legend: { display: false } },
            scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
          },
        });
      }
    },

    setRange: function (days) {
      this.range = days;
      this.loadData();
    },

    formatTime: function (seconds) {
      if (seconds < 60) return seconds + "s";
      var m = Math.floor(seconds / 60);
      var s = seconds % 60;
      return m + "m " + s + "s";
    },

    shortenUrl: function (url) {
      if (!url) return "Direct";
      try {
        return new URL(url).hostname.replace("www.", "");
      } catch (e) {
        return url.substring(0, 30);
      }
    },

    parseBrowser: function (ua) {
      if (!ua) return "-";
      if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) return "Chrome";
      if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) return "Safari";
      if (ua.indexOf("Firefox") > -1) return "Firefox";
      if (ua.indexOf("Edg") > -1) return "Edge";
      if (ua.indexOf("MSIE") > -1 || ua.indexOf("Trident") > -1) return "IE";
      return "Other";
    },
  };
})();
