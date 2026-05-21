/**
 * Admin Form Submissions Module
 * View, filter, and manage contact form submissions
 */
(function () {
  "use strict";

  window.AdminForms = {
    submissions: [],
    currentFilter: "all",
    currentPage: 1,
    perPage: 15,
    selectedId: null,

    loadSubmissions: function () {
      var container = document.getElementById("formsContainer");
      if (!container) return;

      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var sb = SRT.getSupabase();
      sb.from("form_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .then(function (result) {
          if (result.error) {
            container.innerHTML =
              '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading submissions</h3></div>';
            return;
          }
          AdminForms.submissions = result.data || [];
          AdminForms.render();
        });
    },

    render: function () {
      var container = document.getElementById("formsContainer");
      if (!container) return;

      var filtered = this.getFiltered();
      var totalPages = Math.ceil(filtered.length / this.perPage);
      var start = (this.currentPage - 1) * this.perPage;
      var pageData = filtered.slice(start, start + this.perPage);

      // Stats
      var total = this.submissions.length;
      var newCount = this.submissions.filter(function (s) { return s.status === "new"; }).length;
      var contacted = this.submissions.filter(function (s) { return s.status === "contacted"; }).length;
      var converted = this.submissions.filter(function (s) { return s.status === "converted"; }).length;

      var html =
        '<div class="stat-cards">' +
        '<div class="stat-card"><div class="stat-label">Total Submissions</div><div class="stat-value">' + total + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">New / Unread</div><div class="stat-value" style="color:var(--admin-accent)">' + newCount + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Contacted</div><div class="stat-value" style="color:var(--admin-warning)">' + contacted + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Converted</div><div class="stat-value" style="color:var(--admin-success)">' + converted + "</div></div>" +
        "</div>";

      // Filter bar
      html +=
        '<div class="filter-bar">' +
        '<select id="formStatusFilter" onchange="AdminForms.setFilter(this.value)">' +
        '<option value="all"' + (this.currentFilter === "all" ? " selected" : "") + ">All Status</option>" +
        '<option value="new"' + (this.currentFilter === "new" ? " selected" : "") + ">New</option>" +
        '<option value="contacted"' + (this.currentFilter === "contacted" ? " selected" : "") + ">Contacted</option>" +
        '<option value="converted"' + (this.currentFilter === "converted" ? " selected" : "") + ">Converted</option>" +
        '<option value="archived"' + (this.currentFilter === "archived" ? " selected" : "") + ">Archived</option>" +
        "</select>" +
        '<button class="btn-admin btn-secondary btn-sm" onclick="AdminForms.exportCSV()"><i class="fa-solid fa-download"></i> Export CSV</button>' +
        "</div>";

      // Table
      if (pageData.length === 0) {
        html +=
          '<div class="empty-state"><i class="fa-solid fa-inbox"></i><h3>No submissions found</h3><p>Form submissions will appear here when visitors fill out the contact form.</p></div>';
      } else {
        html +=
          '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
          "<th>Date</th><th>Doctor Name</th><th>Clinic</th><th>Email</th><th>Phone</th><th>Specialty</th><th>Status</th><th>Actions</th>" +
          "</tr></thead><tbody>";

        pageData.forEach(function (s) {
          var date = new Date(s.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          var badgeClass =
            s.status === "new" ? "badge-new" : s.status === "contacted" ? "badge-contacted" : s.status === "converted" ? "badge-converted" : "badge-archived";

          html +=
            "<tr style='cursor:pointer' onclick='AdminForms.showDetail(\"" + s.id + "\")'>" +
            "<td>" + AdminApp.escapeHtml(date) + "</td>" +
            "<td><strong>" + AdminApp.escapeHtml(s.doctor_name || "") + "</strong></td>" +
            "<td>" + AdminApp.escapeHtml(s.clinic_name || "-") + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.email || "") + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.phone || "") + "</td>" +
            "<td>" + AdminApp.escapeHtml(s.specialty || "-") + "</td>" +
            '<td><span class="badge ' + badgeClass + '">' + AdminApp.escapeHtml(s.status) + "</span></td>" +
            '<td><button class="btn-admin btn-sm btn-secondary" onclick="event.stopPropagation();AdminForms.showDetail(\'' + s.id + "')\">" +
            '<i class="fa-solid fa-eye"></i></button></td>' +
            "</tr>";
        });

        html += "</tbody></table></div>";

        // Pagination
        if (totalPages > 1) {
          html += '<div class="admin-pagination">';
          for (var i = 1; i <= totalPages; i++) {
            html +=
              '<button class="' + (i === this.currentPage ? "active" : "") + '" onclick="AdminForms.goToPage(' + i + ')">' + i + "</button>";
          }
          html += "</div>";
        }
      }

      // Detail panel
      html += '<div id="formDetailPanel"></div>';

      container.innerHTML = html;
    },

    getFiltered: function () {
      if (this.currentFilter === "all") return this.submissions;
      return this.submissions.filter(function (s) {
        return s.status === AdminForms.currentFilter;
      });
    },

    setFilter: function (val) {
      this.currentFilter = val;
      this.currentPage = 1;
      this.render();
    },

    goToPage: function (page) {
      this.currentPage = page;
      this.render();
    },

    showDetail: function (id) {
      var s = this.submissions.find(function (sub) { return sub.id === id; });
      if (!s) return;

      this.selectedId = id;
      var panel = document.getElementById("formDetailPanel");
      if (!panel) return;

      var date = new Date(s.created_at).toLocaleString("en-IN");
      panel.innerHTML =
        '<div class="detail-panel">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">' +
        '<h3 style="margin:0;font-size:16px;color:var(--admin-text-heading);">Submission Details</h3>' +
        '<button class="btn-admin btn-sm btn-secondary" onclick="document.getElementById(\'formDetailPanel\').innerHTML=\'\'"><i class="fa-solid fa-xmark"></i></button>' +
        "</div>" +
        '<div class="detail-row"><div class="detail-label">Date</div><div class="detail-value">' + AdminApp.escapeHtml(date) + "</div></div>" +
        '<div class="detail-row"><div class="detail-label">Doctor Name</div><div class="detail-value">' + AdminApp.escapeHtml(s.doctor_name || "-") + "</div></div>" +
        '<div class="detail-row"><div class="detail-label">Clinic Name</div><div class="detail-value">' + AdminApp.escapeHtml(s.clinic_name || "-") + "</div></div>" +
        '<div class="detail-row"><div class="detail-label">Email</div><div class="detail-value"><a href="mailto:' + AdminApp.escapeHtml(s.email || "") + '" style="color:var(--admin-accent)">' + AdminApp.escapeHtml(s.email || "-") + "</a></div></div>" +
        '<div class="detail-row"><div class="detail-label">Phone</div><div class="detail-value"><a href="tel:' + AdminApp.escapeHtml(s.phone || "") + '" style="color:var(--admin-accent)">' + AdminApp.escapeHtml(s.phone || "-") + "</a></div></div>" +
        '<div class="detail-row"><div class="detail-label">Specialty</div><div class="detail-value">' + AdminApp.escapeHtml(s.specialty || "-") + "</div></div>" +
        '<div class="detail-row"><div class="detail-label">Message</div><div class="detail-value">' + AdminApp.escapeHtml(s.message || "No message") + "</div></div>" +
        '<div class="detail-row"><div class="detail-label">Source</div><div class="detail-value">' + AdminApp.escapeHtml(s.source || "-") + "</div></div>" +
        '<div style="margin-top:16px;">' +
        '<label style="font-size:12px;color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Status</label>' +
        '<select id="detailStatus" style="padding:8px 12px;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);color:var(--admin-text);font-size:13px;">' +
        '<option value="new"' + (s.status === "new" ? " selected" : "") + ">New</option>" +
        '<option value="contacted"' + (s.status === "contacted" ? " selected" : "") + ">Contacted</option>" +
        '<option value="converted"' + (s.status === "converted" ? " selected" : "") + ">Converted</option>" +
        '<option value="archived"' + (s.status === "archived" ? " selected" : "") + ">Archived</option>" +
        "</select>" +
        "</div>" +
        '<div style="margin-top:12px;">' +
        '<label style="font-size:12px;color:var(--admin-text-muted);text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:6px;">Admin Notes</label>' +
        '<textarea id="detailNotes" rows="3" style="width:100%;padding:8px 12px;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);color:var(--admin-text);font-size:13px;resize:vertical;">' +
        AdminApp.escapeHtml(s.admin_notes || "") +
        "</textarea>" +
        "</div>" +
        '<div style="margin-top:16px;display:flex;gap:8px;">' +
        '<button class="btn-admin btn-primary btn-sm" onclick="AdminForms.updateSubmission(\'' + s.id + "')\">" +
        '<i class="fa-solid fa-floppy-disk"></i> Save</button>' +
        '<button class="btn-admin btn-danger btn-sm" onclick="AdminForms.deleteSubmission(\'' + s.id + "')\">" +
        '<i class="fa-solid fa-trash"></i> Delete</button>' +
        "</div></div>";

      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    },

    updateSubmission: function (id) {
      var status = document.getElementById("detailStatus").value;
      var notes = document.getElementById("detailNotes").value;

      var sb = SRT.getSupabase();
      sb.from("form_submissions")
        .update({
          status: status,
          admin_notes: notes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Update failed: " + result.error.message, "error");
            return;
          }
          // Update local data
          var s = AdminForms.submissions.find(function (sub) { return sub.id === id; });
          if (s) {
            s.status = status;
            s.admin_notes = notes;
          }
          AdminForms.render();
          AdminApp.toast("Submission updated!", "success");
        });
    },

    deleteSubmission: function (id) {
      if (!confirm("Delete this submission permanently?")) return;

      var sb = SRT.getSupabase();
      sb.from("form_submissions")
        .delete()
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Delete failed: " + result.error.message, "error");
            return;
          }
          AdminForms.submissions = AdminForms.submissions.filter(function (s) { return s.id !== id; });
          AdminForms.render();
          AdminApp.toast("Submission deleted.", "success");
        });
    },

    exportCSV: function () {
      var data = this.getFiltered();
      if (data.length === 0) {
        AdminApp.toast("No data to export.", "info");
        return;
      }

      var headers = ["Date", "Doctor Name", "Clinic", "Email", "Phone", "Specialty", "Message", "Status", "Notes"];
      var rows = data.map(function (s) {
        return [
          new Date(s.created_at).toLocaleDateString("en-IN"),
          s.doctor_name || "",
          s.clinic_name || "",
          s.email || "",
          s.phone || "",
          s.specialty || "",
          (s.message || "").replace(/"/g, '""'),
          s.status || "",
          (s.admin_notes || "").replace(/"/g, '""'),
        ];
      });

      var csv = headers.join(",") + "\n" +
        rows.map(function (r) {
          return r.map(function (v) { return '"' + v + '"'; }).join(",");
        }).join("\n");

      var blob = new Blob([csv], { type: "text/csv" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "srt-submissions-" + new Date().toISOString().split("T")[0] + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      AdminApp.toast("CSV exported!", "success");
    },
  };
})();
