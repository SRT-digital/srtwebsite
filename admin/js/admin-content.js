/**
 * Admin Content Editor Module
 * Handles CRUD operations for all site sections
 */
(function () {
  "use strict";

  // Section definitions - maps section IDs to their editable fields
  var SECTION_FIELDS = {
    header: [
      { key: "logoUrl", label: "Logo Image", type: "image" },
      { key: "ctaText", label: "CTA Button Text", type: "text" },
      { key: "ctaLink", label: "CTA Button Link", type: "text" },
    ],
    hero: [
      { key: "title", label: "Main Title", type: "text" },
      { key: "titleLine2", label: "Title Line 2", type: "text" },
      { key: "titleLine3", label: "Title Line 3 (e.g., 'for Doctors')", type: "text" },
      { key: "subtitle", label: "Subtitle", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "ctaPrimaryText", label: "Primary CTA Text", type: "text" },
      { key: "ctaPrimaryLink", label: "Primary CTA Link", type: "text" },
      { key: "ctaSecondaryText", label: "Secondary CTA Text", type: "text" },
      { key: "ctaSecondaryLink", label: "Secondary CTA Link", type: "text" },
      { key: "heroImage", label: "Hero Image", type: "image" },
    ],
    about: [
      { key: "sectionLabel", label: "Section Label (e.g., 'About Us')", type: "text" },
      { key: "title", label: "Main Title", type: "text" },
      { key: "description", label: "Description Paragraph", type: "textarea" },
      { key: "painPoints", label: "Services List (6 items shown in 2 columns)", type: "list" },
      { key: "ctaText", label: "CTA Button Text", type: "text" },
      { key: "ctaLink", label: "CTA Button Link", type: "text" },
      { key: "counterValue", label: "Counter Number (e.g., '5')", type: "text" },
      { key: "counterLabel", label: "Counter Label (e.g., 'Years Of Experience')", type: "text" },
      { key: "aboutImage1", label: "About Image 1 (Left)", type: "image" },
      { key: "aboutImage2", label: "About Image 2 (Right)", type: "image" },
      { key: "agitationLabel", label: "Why Choose Us - Label", type: "text" },
      { key: "agitationTitle", label: "Why Choose Us - Title", type: "text" },
      { key: "agitationParagraph1", label: "Why Choose Us - Paragraph 1", type: "textarea" },
      { key: "agitationParagraph2", label: "Why Choose Us - Paragraph 2", type: "textarea" },
    ],
    services: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "items", label: "Service Items", type: "services-list" },
    ],
    projects: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "items", label: "Portfolio Items", type: "portfolio-list" },
    ],
    specialties: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "items", label: "Specialty Items", type: "list-objects", fields: ["name", "description", "icon"] },
    ],
    cta: [
      { key: "title", label: "Headline", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "ctaText", label: "Button Text", type: "text" },
      { key: "ctaLink", label: "Button Link", type: "text" },
      { key: "footnote", label: "Footnote Text", type: "text" },
    ],
    pricing: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "plans", label: "Pricing Plans", type: "pricing-plans" },
      { key: "roiTitle", label: "ROI Section Title", type: "text" },
      { key: "roiDescription", label: "ROI Description", type: "textarea" },
      { key: "roiFootnote", label: "ROI Footnote", type: "textarea" },
    ],
    blog: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
    ],
    faq: [
      { key: "sectionLabel", label: "Section Label", type: "text" },
      { key: "title", label: "Title", type: "text" },
      { key: "items", label: "FAQ Items", type: "faq-list" },
    ],
    contact: [
      { key: "title", label: "Section Title", type: "text" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "subDescription", label: "Sub-description", type: "text" },
      { key: "address", label: "Address", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "hours", label: "Working Hours", type: "text" },
      { key: "facebookUrl", label: "Facebook URL", type: "text" },
      { key: "instagramUrl", label: "Instagram URL", type: "text" },
      { key: "linkedinUrl", label: "LinkedIn URL", type: "text" },
      { key: "whatsappUrl", label: "WhatsApp URL", type: "text" },
      { key: "formButtonText", label: "Form Button Text", type: "text" },
    ],
    footer: [
      { key: "title", label: "Footer Headline", type: "text" },
      { key: "email", label: "Email", type: "text" },
      { key: "description", label: "Footer Description", type: "textarea" },
      { key: "servingAreas", label: "Serving Areas", type: "text" },
      { key: "copyright", label: "Copyright Text", type: "text" },
    ],
  };

  window.AdminContent = {
    currentSection: null,
    currentData: null,

    loadSection: function (sectionId) {
      this.currentSection = sectionId;
      var container = document.getElementById("page-content-" + sectionId);
      if (!container) return;

      // Show loading
      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var sb = SRT.getSupabase();
      if (!sb) return;

      sb.from("site_content")
        .select("*")
        .eq("id", sectionId)
        .single()
        .then(function (result) {
          if (result.error && result.error.code !== "PGRST116") {
            container.innerHTML =
              '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading content</h3><p>' +
              AdminApp.escapeHtml(result.error.message) +
              "</p></div>";
            return;
          }

          var data = result.data ? result.data.content : {};
          AdminContent.currentData = data || {};
          AdminContent.renderEditor(sectionId, data || {}, container);
        });
    },

    renderEditor: function (sectionId, data, container) {
      var fields = SECTION_FIELDS[sectionId];
      if (!fields) {
        container.innerHTML =
          '<div class="empty-state"><i class="fa-solid fa-wrench"></i><h3>Editor not configured</h3></div>';
        return;
      }

      var html =
        '<div class="editor-card"><div class="editor-card-header"><h3>' +
        AdminApp.escapeHtml(sectionId.charAt(0).toUpperCase() + sectionId.slice(1)) +
        " Section</h3>" +
        '<div><label style="font-size:12px;color:var(--admin-text-muted);display:flex;align-items:center;gap:6px;">' +
        '<input type="checkbox" id="sectionVisible" ' +
        (data._visible !== false ? "checked" : "") +
        '> Visible</label></div></div>' +
        '<div class="editor-card-body"><form class="admin-form" id="sectionEditorForm">';

      fields.forEach(function (field) {
        html += AdminContent.renderField(field, data[field.key]);
      });

      html +=
        "</form></div>" +
        '<div class="editor-card-footer">' +
        '<button type="button" class="btn-admin btn-secondary" onclick="AdminContent.resetSection()"><i class="fa-solid fa-rotate-left"></i> Reset</button>' +
        '<button type="button" class="btn-admin btn-primary" onclick="AdminContent.saveSection()"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>' +
        "</div></div>";

      container.innerHTML = html;
    },

    renderField: function (field, value) {
      var html = '<div class="form-group">';
      html +=
        '<label for="field-' + field.key + '">' + AdminApp.escapeHtml(field.label) + "</label>";

      switch (field.type) {
        case "text":
          html +=
            '<input type="text" id="field-' +
            field.key +
            '" data-field="' +
            field.key +
            '" value="' +
            AdminApp.escapeHtml(value || "") +
            '">';
          break;

        case "textarea":
          html +=
            '<textarea id="field-' +
            field.key +
            '" data-field="' +
            field.key +
            '" rows="4">' +
            AdminApp.escapeHtml(value || "") +
            "</textarea>";
          break;

        case "image":
          var imgSrc = value || "";
          html +=
            '<div class="img-upload-area ' +
            (imgSrc ? "has-image" : "") +
            '" id="upload-' +
            field.key +
            '">' +
            (imgSrc
              ? '<img src="' + AdminApp.escapeHtml(imgSrc) + '" alt="Preview">'
              : '<div class="upload-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i>Click or drag to upload</div>') +
            '<input type="file" accept="image/*" onchange="AdminContent.handleImageUpload(\'' +
            field.key +
            "', this)\">" +
            "</div>" +
            '<input type="hidden" id="field-' +
            field.key +
            '" data-field="' +
            field.key +
            '" value="' +
            AdminApp.escapeHtml(imgSrc) +
            '">';
          break;

        case "list":
          var items = Array.isArray(value) ? value : [];
          html += '<div id="list-' + field.key + '">';
          items.forEach(function (item, i) {
            html +=
              '<div class="list-editor-item">' +
              '<input type="text" value="' +
              AdminApp.escapeHtml(typeof item === "string" ? item : item.text || "") +
              '" data-list="' +
              field.key +
              '">' +
              '<button type="button" class="btn-remove-item" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>' +
              "</div>";
          });
          html += "</div>";
          html +=
            '<button type="button" class="btn-add-item" onclick="AdminContent.addListItem(\'' +
            field.key +
            "')\">" +
            '<i class="fa-solid fa-plus"></i> Add Item</button>';
          break;

        case "faq-list":
          var faqs = Array.isArray(value) ? value : [];
          html += '<div id="list-' + field.key + '">';
          faqs.forEach(function (faq, i) {
            html += AdminContent.renderFaqItem(field.key, faq, i);
          });
          html += "</div>";
          html +=
            '<button type="button" class="btn-add-item" onclick="AdminContent.addFaqItem(\'' +
            field.key +
            "')\">" +
            '<i class="fa-solid fa-plus"></i> Add FAQ</button>';
          break;

        case "portfolio-list":
          var portfolios = Array.isArray(value) ? value : [];
          var categories = [
            { id: "social", name: "Social Media" },
            { id: "seo", name: "Google Ranking" },
            { id: "web", name: "Web Development" },
            { id: "webapp", name: "Web App" },
            { id: "brand", name: "Branding" }
          ];
          html += '<div id="list-' + field.key + '" class="portfolio-list-editor">';

          // Group items by category
          categories.forEach(function (cat) {
            var catItems = portfolios.filter(function (item) {
              return item.category === cat.id;
            });
            html += '<div class="portfolio-category-section" data-category="' + cat.id + '" style="margin-bottom:24px;border:1px solid var(--admin-border);border-radius:8px;padding:16px;">';
            html += '<h4 style="margin:0 0 12px 0;color:var(--admin-primary);display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-folder"></i> ' + cat.name + ' <span style="font-size:12px;color:var(--admin-text-muted);">(' + catItems.length + ' items)</span></h4>';
            html += '<div class="category-items" data-cat-id="' + cat.id + '">';
            catItems.forEach(function (item, i) {
              html += AdminContent.renderPortfolioItem(field.key, item, i, cat.id);
            });
            html += '</div>';
            html += '<button type="button" class="btn-add-item" onclick="AdminContent.addPortfolioItem(\'' + field.key + '\', \'' + cat.id + '\')" style="margin-top:8px;">' +
              '<i class="fa-solid fa-plus"></i> Add to ' + cat.name + '</button>';
            html += '</div>';
          });

          html += "</div>";
          break;

        case "services-list":
          var services = Array.isArray(value) ? value : [];
          html += '<div id="list-' + field.key + '" class="services-list-editor">';
          services.forEach(function (item, i) {
            html += AdminContent.renderServiceItem(field.key, item, i);
          });
          html += "</div>";
          html +=
            '<button type="button" class="btn-add-item" onclick="AdminContent.addServiceItem(\'' +
            field.key +
            "')\">" +
            '<i class="fa-solid fa-plus"></i> Add Service</button>';
          break;

        case "pricing-plans":
          var plans = Array.isArray(value) ? value : [];
          html += '<div id="list-' + field.key + '" class="pricing-list-editor">';
          plans.forEach(function (plan, i) {
            html += AdminContent.renderPricingPlan(field.key, plan, i);
          });
          html += "</div>";
          html +=
            '<button type="button" class="btn-add-item" onclick="AdminContent.addPricingPlan(\'' +
            field.key +
            "')\">" +
            '<i class="fa-solid fa-plus"></i> Add Pricing Plan</button>';
          break;

        case "list-objects":
          var objItems = Array.isArray(value) ? value : [];
          var objFields = field.fields || ["name", "description"];
          html += '<div id="list-' + field.key + '" class="list-objects-editor">';
          objItems.forEach(function (obj, i) {
            html += AdminContent.renderListObjectItem(field.key, obj, i, objFields);
          });
          html += "</div>";
          // No add button for list-objects (specialties are fixed)
          html += '<p style="font-size:12px;color:var(--admin-text-muted);margin-top:8px;"><i class="fa-solid fa-info-circle"></i> Edit existing items only. Contact developer to add new specialties.</p>';
          break;

        default:
          html +=
            '<input type="text" id="field-' +
            field.key +
            '" data-field="' +
            field.key +
            '" value="' +
            AdminApp.escapeHtml(value || "") +
            '">';
      }

      html += "</div>";
      return html;
    },

    renderFaqItem: function (listKey, faq, index) {
      return (
        '<div class="list-editor-item" style="flex-direction:column;align-items:stretch;padding:12px;">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;">' +
        '<strong style="font-size:12px;color:var(--admin-text-muted);">FAQ #' +
        (index + 1) +
        "</strong>" +
        '<button type="button" class="btn-remove-item" onclick="this.closest(\'.list-editor-item\').remove()"><i class="fa-solid fa-xmark"></i></button>' +
        "</div>" +
        '<input type="text" placeholder="Question" value="' +
        AdminApp.escapeHtml((faq && faq.question) || "") +
        '" data-faq-q="' +
        listKey +
        '" style="margin-bottom:8px;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;">' +
        '<textarea placeholder="Answer" data-faq-a="' +
        listKey +
        '" rows="2" style="background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;width:100%;resize:vertical;">' +
        AdminApp.escapeHtml((faq && faq.answer) || "") +
        "</textarea>" +
        "</div>"
      );
    },

    addListItem: function (key) {
      var list = document.getElementById("list-" + key);
      if (!list) return;
      var item = document.createElement("div");
      item.className = "list-editor-item";
      item.innerHTML =
        '<input type="text" value="" data-list="' +
        key +
        '" placeholder="Enter item...">' +
        '<button type="button" class="btn-remove-item" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>';
      list.appendChild(item);
      item.querySelector("input").focus();
    },

    addFaqItem: function (key) {
      var list = document.getElementById("list-" + key);
      if (!list) return;
      var count = list.querySelectorAll(".list-editor-item").length;
      var div = document.createElement("div");
      div.innerHTML = AdminContent.renderFaqItem(key, null, count);
      list.appendChild(div.firstElementChild);
    },

    renderPortfolioItem: function (listKey, item, index, presetCategory) {
      var categories = [
        { value: "social", label: "Social Media" },
        { value: "seo", label: "Google Ranking" },
        { value: "web", label: "Web Development" },
        { value: "webapp", label: "Web App" },
        { value: "brand", label: "Branding" },
      ];
      var itemCategory = (item && item.category) || presetCategory || "social";
      var categoryOptions = categories.map(function (cat) {
        var selected = cat.value === itemCategory ? " selected" : "";
        return '<option value="' + cat.value + '"' + selected + '>' + cat.label + '</option>';
      }).join("");

      return (
        '<div class="list-editor-item portfolio-item" style="flex-direction:column;align-items:stretch;padding:16px;margin-bottom:12px;background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<strong style="font-size:13px;color:var(--admin-accent);">Portfolio Item #' + (index + 1) + "</strong>" +
        '<button type="button" class="btn-remove-item" onclick="this.closest(\'.portfolio-item\').remove()" style="background:var(--admin-danger);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
        "</div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Title *</label>' +
        '<input type="text" placeholder="Project Title" value="' + AdminApp.escapeHtml((item && item.title) || "") + '" data-portfolio-title="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Category</label>' +
        '<select data-portfolio-category="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        categoryOptions +
        '</select>' +
        '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Description</label>' +
        '<textarea placeholder="Brief description of the project" data-portfolio-desc="' + listKey + '" rows="2" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);resize:vertical;">' + AdminApp.escapeHtml((item && item.description) || "") + '</textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Image URL</label>' +
        '<input type="text" placeholder="./img/portfolio/image.jpg" value="' + AdminApp.escapeHtml((item && item.image) || "") + '" data-portfolio-image="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Link URL</label>' +
        '<input type="text" placeholder="./portfolio-detail.html?project=xxx" value="' + AdminApp.escapeHtml((item && item.link) || "") + '" data-portfolio-link="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '</div>' +
        "</div>"
      );
    },

    addPortfolioItem: function (key, category) {
      // Find the category container
      var catContainer = document.querySelector('[data-cat-id="' + category + '"]');
      if (!catContainer) {
        console.error("Category container not found:", category);
        return;
      }
      var count = catContainer.querySelectorAll(".portfolio-item").length;
      var div = document.createElement("div");
      div.innerHTML = AdminContent.renderPortfolioItem(key, { category: category }, count, category);
      catContainer.appendChild(div.firstElementChild);

      // Update count in header
      var section = catContainer.closest('.portfolio-category-section');
      if (section) {
        var countSpan = section.querySelector('h4 span');
        if (countSpan) {
          var newCount = catContainer.querySelectorAll(".portfolio-item").length;
          countSpan.textContent = '(' + newCount + ' items)';
        }
      }
    },

    renderServiceItem: function (listKey, item, index) {
      return (
        '<div class="list-editor-item service-item" style="flex-direction:column;align-items:stretch;padding:16px;margin-bottom:12px;background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<strong style="font-size:13px;color:var(--admin-accent);">Service #' + (index + 1) + "</strong>" +
        '<button type="button" class="btn-remove-item" onclick="this.closest(\'.service-item\').remove()" style="background:var(--admin-danger);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
        "</div>" +
        '<div style="margin-bottom:12px;">' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Title *</label>' +
        '<input type="text" placeholder="Service Title" value="' + AdminApp.escapeHtml((item && item.title) || "") + '" data-service-title="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Description</label>' +
        '<textarea placeholder="Service description" data-service-desc="' + listKey + '" rows="2" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);resize:vertical;">' + AdminApp.escapeHtml((item && item.description) || "") + '</textarea>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Icon Class (FontAwesome)</label>' +
        '<input type="text" placeholder="fa-solid fa-share-nodes" value="' + AdminApp.escapeHtml((item && item.icon) || "") + '" data-service-icon="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Modal ID (optional)</label>' +
        '<input type="text" placeholder="modal-social-media" value="' + AdminApp.escapeHtml((item && item.modalId) || "") + '" data-service-modal="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '</div>' +
        "</div>"
      );
    },

    addServiceItem: function (key) {
      var list = document.getElementById("list-" + key);
      if (!list) return;
      var count = list.querySelectorAll(".service-item").length;
      var div = document.createElement("div");
      div.innerHTML = AdminContent.renderServiceItem(key, null, count);
      list.appendChild(div.firstElementChild);
    },

    renderPricingPlan: function (listKey, plan, index) {
      return (
        '<div class="list-editor-item pricing-plan" style="flex-direction:column;align-items:stretch;padding:16px;margin-bottom:12px;background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<strong style="font-size:13px;color:var(--admin-accent);">Plan #' + (index + 1) + "</strong>" +
        '<div style="display:flex;gap:8px;align-items:center;">' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pricing-featured="' + listKey + '"' + (plan && plan.featured ? ' checked' : '') + '> Featured</label>' +
        '<button type="button" class="btn-remove-item" onclick="this.closest(\'.pricing-plan\').remove()" style="background:var(--admin-danger);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
        '</div>' +
        "</div>" +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Plan Name *</label>' +
        '<input type="text" placeholder="Growth Partnership" value="' + AdminApp.escapeHtml((plan && plan.name) || "") + '" data-pricing-name="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Price</label>' +
        '<input type="text" placeholder="40,000" value="' + AdminApp.escapeHtml((plan && plan.price) || "") + '" data-pricing-price="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
        '</div>' +
        '</div>' +
        '<div style="margin-bottom:12px;">' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Description</label>' +
        '<textarea placeholder="Plan description" data-pricing-desc="' + listKey + '" rows="2" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);resize:vertical;">' + AdminApp.escapeHtml((plan && plan.description) || "") + '</textarea>' +
        '</div>' +
        '<div>' +
        '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">Features (comma-separated)</label>' +
        '<textarea placeholder="Content, Paid Ads, Local SEO" data-pricing-features="' + listKey + '" rows="2" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);resize:vertical;">' + AdminApp.escapeHtml((plan && plan.features) || "") + '</textarea>' +
        '</div>' +
        "</div>"
      );
    },

    addPricingPlan: function (key) {
      var list = document.getElementById("list-" + key);
      if (!list) return;
      var count = list.querySelectorAll(".pricing-plan").length;
      var div = document.createElement("div");
      div.innerHTML = AdminContent.renderPricingPlan(key, null, count);
      list.appendChild(div.firstElementChild);
    },

    renderListObjectItem: function (listKey, obj, index, fields) {
      var html =
        '<div class="list-editor-item list-object-item" style="flex-direction:column;align-items:stretch;padding:16px;margin-bottom:12px;background:var(--admin-card-bg);border:1px solid var(--admin-border);border-radius:8px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<strong style="font-size:13px;color:var(--admin-accent);">Item #' + (index + 1) + "</strong>" +
        '<button type="button" class="btn-remove-item" onclick="this.closest(\'.list-object-item\').remove()" style="background:var(--admin-danger);color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;"><i class="fa-solid fa-trash"></i></button>' +
        "</div>";

      fields.forEach(function (fieldName) {
        var value = obj ? (obj[fieldName] || "") : "";
        var label = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
        html +=
          '<div style="margin-bottom:12px;">' +
          '<label style="font-size:11px;color:var(--admin-text-muted);display:block;margin-bottom:4px;">' + label + '</label>' +
          '<input type="text" placeholder="' + label + '" value="' + AdminApp.escapeHtml(value) + '" data-listobj-' + fieldName + '="' + listKey + '" style="width:100%;background:var(--admin-input-bg);border:1px solid var(--admin-input-border);border-radius:var(--admin-radius);padding:8px 12px;color:var(--admin-text);">' +
          '</div>';
      });

      html += "</div>";
      return html;
    },

    addListObjectItem: function (key, fields) {
      var list = document.getElementById("list-" + key);
      if (!list) return;
      var count = list.querySelectorAll(".list-object-item").length;
      var div = document.createElement("div");
      div.innerHTML = AdminContent.renderListObjectItem(key, null, count, fields);
      list.appendChild(div.firstElementChild);
    },

    handleImageUpload: function (fieldKey, input) {
      var file = input.files[0];
      if (!file) return;

      // Validate
      if (!file.type.startsWith("image/")) {
        AdminApp.toast("Please select an image file.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        AdminApp.toast("Image must be under 5MB.", "error");
        return;
      }

      var sb = SRT.getSupabase();
      var filePath =
        "images/" + this.currentSection + "/" + Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      // Show uploading state
      var area = document.getElementById("upload-" + fieldKey);
      area.innerHTML =
        '<div class="upload-placeholder"><div class="admin-spinner" style="margin:0 auto 8px;"></div>Uploading...</div>';

      sb.storage
        .from("site-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false })
        .then(function (result) {
          if (result.error) throw result.error;

          // Get public URL
          var urlResult = sb.storage
            .from("site-images")
            .getPublicUrl(filePath);
          var publicUrl = urlResult.data.publicUrl;

          // Update hidden field and preview
          document.getElementById("field-" + fieldKey).value = publicUrl;
          area.className = "img-upload-area has-image";
          area.innerHTML =
            '<img src="' +
            publicUrl +
            '" alt="Preview">' +
            '<input type="file" accept="image/*" onchange="AdminContent.handleImageUpload(\'' +
            fieldKey +
            "', this)\">";
          AdminApp.toast("Image uploaded successfully!", "success");
        })
        .catch(function (err) {
          area.innerHTML =
            '<div class="upload-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i>Upload failed. Click to retry.</div>' +
            '<input type="file" accept="image/*" onchange="AdminContent.handleImageUpload(\'' +
            fieldKey +
            "', this)\">";
          AdminApp.toast("Upload failed: " + (err.message || "Unknown error"), "error");
        });
    },

    saveSection: function () {
      var sectionId = this.currentSection;
      if (!sectionId) return;

      var fields = SECTION_FIELDS[sectionId];
      var data = {};

      // Collect field values
      fields.forEach(function (field) {
        switch (field.type) {
          case "text":
          case "textarea":
          case "image":
            var el = document.getElementById("field-" + field.key);
            if (el) data[field.key] = el.value;
            break;

          case "list":
            var inputs = document.querySelectorAll('[data-list="' + field.key + '"]');
            data[field.key] = [];
            inputs.forEach(function (inp) {
              if (inp.value.trim()) data[field.key].push(inp.value.trim());
            });
            break;

          case "faq-list":
            var questions = document.querySelectorAll('[data-faq-q="' + field.key + '"]');
            var answers = document.querySelectorAll('[data-faq-a="' + field.key + '"]');
            data[field.key] = [];
            questions.forEach(function (q, i) {
              if (q.value.trim()) {
                data[field.key].push({
                  question: q.value.trim(),
                  answer: answers[i] ? answers[i].value.trim() : "",
                });
              }
            });
            break;

          case "portfolio-list":
            var titles = document.querySelectorAll('[data-portfolio-title="' + field.key + '"]');
            var categories = document.querySelectorAll('[data-portfolio-category="' + field.key + '"]');
            var descs = document.querySelectorAll('[data-portfolio-desc="' + field.key + '"]');
            var images = document.querySelectorAll('[data-portfolio-image="' + field.key + '"]');
            var links = document.querySelectorAll('[data-portfolio-link="' + field.key + '"]');
            data[field.key] = [];
            titles.forEach(function (t, i) {
              if (t.value.trim()) {
                data[field.key].push({
                  title: t.value.trim(),
                  category: categories[i] ? categories[i].value : "social",
                  description: descs[i] ? descs[i].value.trim() : "",
                  image: images[i] ? images[i].value.trim() : "",
                  link: links[i] ? links[i].value.trim() : "",
                });
              }
            });
            break;

          case "services-list":
            var svcTitles = document.querySelectorAll('[data-service-title="' + field.key + '"]');
            var svcDescs = document.querySelectorAll('[data-service-desc="' + field.key + '"]');
            var svcIcons = document.querySelectorAll('[data-service-icon="' + field.key + '"]');
            var svcModals = document.querySelectorAll('[data-service-modal="' + field.key + '"]');
            data[field.key] = [];
            svcTitles.forEach(function (t, i) {
              if (t.value.trim()) {
                data[field.key].push({
                  title: t.value.trim(),
                  description: svcDescs[i] ? svcDescs[i].value.trim() : "",
                  icon: svcIcons[i] ? svcIcons[i].value.trim() : "",
                  modalId: svcModals[i] ? svcModals[i].value.trim() : "",
                });
              }
            });
            break;

          case "pricing-plans":
            var planNames = document.querySelectorAll('[data-pricing-name="' + field.key + '"]');
            var planPrices = document.querySelectorAll('[data-pricing-price="' + field.key + '"]');
            var planDescs = document.querySelectorAll('[data-pricing-desc="' + field.key + '"]');
            var planFeatures = document.querySelectorAll('[data-pricing-features="' + field.key + '"]');
            var planFeatured = document.querySelectorAll('[data-pricing-featured="' + field.key + '"]');
            data[field.key] = [];
            planNames.forEach(function (n, i) {
              if (n.value.trim()) {
                data[field.key].push({
                  name: n.value.trim(),
                  price: planPrices[i] ? planPrices[i].value.trim() : "",
                  description: planDescs[i] ? planDescs[i].value.trim() : "",
                  features: planFeatures[i] ? planFeatures[i].value.trim() : "",
                  featured: planFeatured[i] ? planFeatured[i].checked : false,
                });
              }
            });
            break;

          case "list-objects":
            var objFields = field.fields || ["name", "description"];
            var firstFieldInputs = document.querySelectorAll('[data-listobj-' + objFields[0] + '="' + field.key + '"]');
            data[field.key] = [];
            firstFieldInputs.forEach(function (input, i) {
              var obj = {};
              var hasValue = false;
              objFields.forEach(function (fieldName) {
                var fieldInput = document.querySelectorAll('[data-listobj-' + fieldName + '="' + field.key + '"]')[i];
                if (fieldInput && fieldInput.value.trim()) {
                  obj[fieldName] = fieldInput.value.trim();
                  hasValue = true;
                }
              });
              if (hasValue) {
                data[field.key].push(obj);
              }
            });
            break;
        }
      });

      // Visibility
      var visibleEl = document.getElementById("sectionVisible");
      data._visible = visibleEl ? visibleEl.checked : true;

      var sb = SRT.getSupabase();
      sb.from("site_content")
        .upsert({
          id: sectionId,
          content: data,
          visible: data._visible,
          updated_at: new Date().toISOString(),
        })
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Save failed: " + result.error.message, "error");
            return;
          }
          AdminApp.toast("Section saved successfully!", "success");
          // Clear CMS cache so site picks up changes immediately
          try {
            localStorage.removeItem("srt_cms_cache");
          } catch (e) {}
        });
    },

    resetSection: function () {
      if (confirm("Reset this section to the last saved version?")) {
        this.loadSection(this.currentSection);
      }
    },

    // Settings page
    loadSettings: function () {
      var container = document.getElementById("page-settings");
      if (!container) return;

      var sb = SRT.getSupabase();
      sb.from("site_content")
        .select("*")
        .eq("id", "settings")
        .single()
        .then(function (result) {
          var data = result.data ? result.data.content : {};
          var html =
            '<div class="editor-card"><div class="editor-card-header"><h3>Site Settings</h3></div>' +
            '<div class="editor-card-body"><form class="admin-form">' +
            '<div class="form-group"><label>Site Name</label>' +
            '<input type="text" id="setting-siteName" value="' + AdminApp.escapeHtml(data.siteName || "SRT Digital Solutions") + '"></div>' +
            '<div class="form-group"><label>Primary Color</label>' +
            '<input type="color" id="setting-primaryColor" value="' + (data.primaryColor || "#25bbcc") + '"></div>' +
            '<div class="form-row">' +
            '<div class="form-group"><label>WhatsApp Number</label>' +
            '<input type="text" id="setting-whatsappNumber" value="' + AdminApp.escapeHtml(data.whatsappNumber || "") + '" placeholder="919092272805"></div>' +
            '<div class="form-group"><label>Web3Forms Access Key</label>' +
            '<input type="text" id="setting-web3formsKey" value="' + AdminApp.escapeHtml(data.web3formsKey || "") + '" placeholder="Your Web3Forms key"></div>' +
            '</div>' +
            "</form></div>" +
            '<div class="editor-card-footer">' +
            '<button type="button" class="btn-admin btn-primary" onclick="AdminContent.saveSettings()"><i class="fa-solid fa-floppy-disk"></i> Save Settings</button>' +
            "</div></div>";
          container.innerHTML = html;
        });
    },

    saveSettings: function () {
      var data = {
        siteName: document.getElementById("setting-siteName").value,
        primaryColor: document.getElementById("setting-primaryColor").value,
        whatsappNumber: document.getElementById("setting-whatsappNumber").value,
        web3formsKey: document.getElementById("setting-web3formsKey").value,
      };

      var sb = SRT.getSupabase();
      sb.from("site_content")
        .upsert({
          id: "settings",
          content: data,
          updated_at: new Date().toISOString(),
        })
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Save failed: " + result.error.message, "error");
            return;
          }
          AdminApp.toast("Settings saved!", "success");
          try {
            localStorage.removeItem("srt_cms_cache");
          } catch (e) {}
        });
    },
  };
})();
