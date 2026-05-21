/**
 * Admin Blog Manager Module
 * CRUD operations for blog posts with rich text editor
 * Uses Quill.js for rich text editing
 */
(function () {
  "use strict";

  var QUILL_CDN_CSS = "https://cdn.jsdelivr.net/npm/quill@2/dist/quill.snow.css";
  var QUILL_CDN_JS = "https://cdn.jsdelivr.net/npm/quill@2/dist/quill.js";

  // Categories for blog posts
  var CATEGORIES = [
    "Social Media Marketing",
    "Local SEO",
    "Google Business Profile",
    "Personal Branding",
    "Digital Marketing Trends",
    "Patient Acquisition",
    "GEO & AI Search",
    "Clinic Growth",
    "Healthcare Marketing",
    "Web Design",
    "Other",
  ];

  var quillEditor = null;
  var quillLoaded = false;

  // Load Quill.js dynamically
  function loadQuill(cb) {
    if (quillLoaded) return cb();

    // Load CSS
    if (!document.querySelector('link[href*="quill"]')) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = QUILL_CDN_CSS;
      document.head.appendChild(link);
    }

    // Load JS
    if (typeof Quill !== "undefined") {
      quillLoaded = true;
      return cb();
    }

    var script = document.createElement("script");
    script.src = QUILL_CDN_JS;
    script.onload = function () {
      quillLoaded = true;
      cb();
    };
    script.onerror = function () {
      AdminApp.toast("Failed to load rich text editor", "error");
    };
    document.head.appendChild(script);
  }

  window.AdminBlog = {
    posts: [],
    currentPost: null,
    filterStatus: "all",

    loadPosts: function () {
      var container = document.getElementById("blogContainer");
      if (!container) return;

      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var sb = SRT.getSupabase();
      if (!sb) return;

      sb.from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .then(function (result) {
          if (result.error) {
            container.innerHTML =
              '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading posts</h3><p>' +
              AdminApp.escapeHtml(result.error.message) + "</p></div>";
            return;
          }
          AdminBlog.posts = result.data || [];
          AdminBlog.render();
        });
    },

    render: function () {
      var container = document.getElementById("blogContainer");
      if (!container) return;

      var posts = this.posts;

      // Filter
      if (this.filterStatus !== "all") {
        posts = posts.filter(function (p) { return p.status === AdminBlog.filterStatus; });
      }

      // Stats
      var totalPosts = this.posts.length;
      var publishedCount = this.posts.filter(function (p) { return p.status === "published"; }).length;
      var draftCount = this.posts.filter(function (p) { return p.status === "draft"; }).length;

      var html =
        '<div class="stat-cards" style="margin-bottom:24px;">' +
        '<div class="stat-card"><div class="stat-label">Total Posts</div><div class="stat-value">' + totalPosts + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Published</div><div class="stat-value" style="color:#2ecc71">' + publishedCount + "</div></div>" +
        '<div class="stat-card"><div class="stat-label">Drafts</div><div class="stat-value" style="color:#f39c12">' + draftCount + "</div></div>" +
        "</div>";

      // Toolbar
      html +=
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
        '<button class="btn-admin btn-sm ' + (this.filterStatus === "all" ? "btn-primary" : "btn-secondary") + '" onclick="AdminBlog.setFilter(\'all\')">All</button>' +
        '<button class="btn-admin btn-sm ' + (this.filterStatus === "published" ? "btn-primary" : "btn-secondary") + '" onclick="AdminBlog.setFilter(\'published\')">Published</button>' +
        '<button class="btn-admin btn-sm ' + (this.filterStatus === "draft" ? "btn-primary" : "btn-secondary") + '" onclick="AdminBlog.setFilter(\'draft\')">Drafts</button>' +
        "</div>" +
        '<button class="btn-admin btn-primary" onclick="AdminBlog.showEditor(null)">' +
        '<i class="fa-solid fa-plus"></i> New Post</button>' +
        "</div>";

      // Post list
      if (posts.length === 0) {
        html +=
          '<div class="empty-state"><i class="fa-solid fa-pen-nib"></i><h3>No blog posts yet</h3>' +
          '<p>Create your first blog post to get started.</p></div>';
      } else {
        html += '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
          "<th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th>" +
          "</tr></thead><tbody>";

        posts.forEach(function (post) {
          var date = new Date(post.published_at || post.created_at).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
          });
          var badgeClass = post.status === "published" ? "badge-active" : "badge-inactive";

          html += "<tr>" +
            "<td><strong>" + AdminApp.escapeHtml(post.title || "Untitled") + "</strong></td>" +
            "<td>" + AdminApp.escapeHtml(post.category || "-") + "</td>" +
            '<td><span class="badge ' + badgeClass + '">' + AdminApp.escapeHtml(post.status) + "</span></td>" +
            "<td>" + date + "</td>" +
            '<td><div style="display:flex;gap:6px;">' +
            '<button class="btn-admin btn-sm btn-secondary" onclick="AdminBlog.showEditor(\'' + post.id + '\')" title="Edit"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-admin btn-sm btn-secondary" onclick="AdminBlog.toggleStatus(\'' + post.id + '\')" title="' + (post.status === "published" ? "Unpublish" : "Publish") + '">' +
            '<i class="fa-solid ' + (post.status === "published" ? "fa-eye-slash" : "fa-eye") + '"></i></button>' +
            (post.status === "published" ? '<a class="btn-admin btn-sm btn-secondary" href="./blog-post.html?slug=' + encodeURIComponent(post.slug) + '" target="_blank" title="View"><i class="fa-solid fa-external-link"></i></a>' : "") +
            '<button class="btn-admin btn-sm btn-secondary" onclick="AdminBlog.deletePost(\'' + post.id + '\')" title="Delete" style="color:#e74c3c;"><i class="fa-solid fa-trash"></i></button>' +
            "</div></td></tr>";
        });

        html += "</tbody></table></div>";
      }

      container.innerHTML = html;
    },

    setFilter: function (status) {
      this.filterStatus = status;
      this.render();
    },

    showEditor: function (postId) {
      var container = document.getElementById("blogContainer");
      if (!container) return;

      // Show loading while Quill loads
      container.innerHTML =
        '<div class="admin-loading"><div class="admin-spinner"></div></div>';

      var post = null;
      if (postId) {
        post = this.posts.find(function (p) { return p.id === postId; });
      }
      this.currentPost = post;

      loadQuill(function () {
        AdminBlog.renderEditorUI(post, container);
      });
    },

    renderEditorUI: function (post, container) {
      var isNew = !post;
      var title = isNew ? "" : (post.title || "");
      var slug = isNew ? "" : (post.slug || "");
      var excerpt = isNew ? "" : (post.excerpt || "");
      var category = isNew ? "" : (post.category || "");
      var tags = isNew ? "" : (post.tags || []).join(", ");
      var featuredImage = isNew ? "" : (post.featured_image || "");
      var metaTitle = isNew ? "" : (post.meta_title || "");
      var metaDesc = isNew ? "" : (post.meta_description || "");
      var status = isNew ? "draft" : (post.status || "draft");
      var readTime = isNew ? "" : (post.read_time || "");

      var html =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:10px;">' +
        '<button class="btn-admin btn-secondary" onclick="AdminBlog.loadPosts()">' +
        '<i class="fa-solid fa-arrow-left"></i> Back to Posts</button>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn-admin btn-secondary" onclick="AdminBlog.savePost(\'draft\')"><i class="fa-solid fa-floppy-disk"></i> Save Draft</button>' +
        '<button class="btn-admin btn-primary" onclick="AdminBlog.savePost(\'published\')"><i class="fa-solid fa-paper-plane"></i> ' +
        (status === "published" ? "Update & Publish" : "Publish") + "</button>" +
        "</div></div>";

      // Editor layout: 2 columns
      html +=
        '<div style="display:grid;grid-template-columns:1fr 320px;gap:20px;">' +
        // LEFT: Main content
        '<div>' +
        '<div class="editor-card"><div class="editor-card-header"><h3>' + (isNew ? "New Blog Post" : "Edit Post") + "</h3></div>" +
        '<div class="editor-card-body"><form class="admin-form" id="blogEditorForm">' +
        '<div class="form-group"><label>Post Title *</label>' +
        '<input type="text" id="blogTitle" value="' + AdminApp.escapeHtml(title) + '" placeholder="Enter post title..." oninput="AdminBlog.autoSlug()">' +
        "</div>" +
        '<div class="form-group"><label>URL Slug</label>' +
        '<input type="text" id="blogSlug" value="' + AdminApp.escapeHtml(slug) + '" placeholder="auto-generated-from-title">' +
        "</div>" +
        '<div class="form-group"><label>Content *</label>' +
        '<div id="blogEditorToolbar"></div>' +
        '<div id="blogEditorContent" style="min-height:400px;background:var(--admin-input-bg);color:var(--admin-text);border:1px solid var(--admin-input-border);border-top:none;border-radius:0 0 var(--admin-radius) var(--admin-radius);"></div>' +
        "</div>" +
        "</form></div></div></div>" +

        // RIGHT: Sidebar settings
        '<div>' +
        // Status & Category
        '<div class="editor-card"><div class="editor-card-header"><h3>Post Settings</h3></div>' +
        '<div class="editor-card-body"><form class="admin-form">' +
        '<div class="form-group"><label>Category</label>' +
        '<select id="blogCategory">';
      html += '<option value="">Select Category</option>';
      CATEGORIES.forEach(function (cat) {
        html += '<option value="' + AdminApp.escapeHtml(cat) + '"' + (category === cat ? " selected" : "") + ">" + AdminApp.escapeHtml(cat) + "</option>";
      });
      html += "</select></div>" +
        '<div class="form-group"><label>Tags (comma separated)</label>' +
        '<input type="text" id="blogTags" value="' + AdminApp.escapeHtml(tags) + '" placeholder="SEO, Marketing, Doctors">' +
        "</div>" +
        '<div class="form-group"><label>Read Time</label>' +
        '<input type="text" id="blogReadTime" value="' + AdminApp.escapeHtml(readTime) + '" placeholder="e.g., 10 min read">' +
        "</div>" +
        "</form></div></div>" +

        // Featured Image
        '<div class="editor-card" style="margin-top:16px;"><div class="editor-card-header"><h3>Featured Image</h3></div>' +
        '<div class="editor-card-body"><form class="admin-form">' +
        '<div class="img-upload-area ' + (featuredImage ? "has-image" : "") + '" id="upload-blogFeaturedImage">' +
        (featuredImage
          ? '<img src="' + AdminApp.escapeHtml(featuredImage) + '" alt="Featured">'
          : '<div class="upload-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i>Click to upload</div>') +
        '<input type="file" accept="image/*" onchange="AdminBlog.handleImageUpload(this)">' +
        "</div>" +
        '<input type="hidden" id="blogFeaturedImage" value="' + AdminApp.escapeHtml(featuredImage) + '">' +
        "</form></div></div>" +

        // Excerpt
        '<div class="editor-card" style="margin-top:16px;"><div class="editor-card-header"><h3>Excerpt</h3></div>' +
        '<div class="editor-card-body"><form class="admin-form">' +
        '<div class="form-group"><label>Short Description (for blog listing)</label>' +
        '<textarea id="blogExcerpt" rows="3" placeholder="Brief summary of the post...">' + AdminApp.escapeHtml(excerpt) + "</textarea>" +
        "</div></form></div></div>" +

        // SEO Settings
        '<div class="editor-card" style="margin-top:16px;"><div class="editor-card-header"><h3>SEO</h3></div>' +
        '<div class="editor-card-body"><form class="admin-form">' +
        '<div class="form-group"><label>Meta Title</label>' +
        '<input type="text" id="blogMetaTitle" value="' + AdminApp.escapeHtml(metaTitle) + '" placeholder="SEO title (defaults to post title)">' +
        "</div>" +
        '<div class="form-group"><label>Meta Description</label>' +
        '<textarea id="blogMetaDesc" rows="2" placeholder="SEO description (defaults to excerpt)">' + AdminApp.escapeHtml(metaDesc) + "</textarea>" +
        "</div></form></div></div>" +

        "</div></div>"; // end grid

      container.innerHTML = html;

      // Initialize Quill editor
      setTimeout(function () {
        quillEditor = new Quill("#blogEditorContent", {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["blockquote", "code-block"],
              ["link", "image"],
              [{ align: [] }],
              ["clean"],
            ],
          },
          placeholder: "Write your blog post content here...",
        });

        // Set existing content
        if (post && post.body) {
          quillEditor.root.innerHTML = post.body;
        }

        // Style Quill for dark theme
        var qlToolbar = container.querySelector(".ql-toolbar");
        if (qlToolbar) {
          qlToolbar.style.cssText = "background:var(--admin-card);border-color:var(--admin-input-border);";
        }
        var qlContainer = container.querySelector(".ql-container");
        if (qlContainer) {
          qlContainer.style.cssText = "border-color:var(--admin-input-border);font-size:15px;";
        }
        var qlEditor = container.querySelector(".ql-editor");
        if (qlEditor) {
          qlEditor.style.cssText = "color:var(--admin-text);min-height:400px;";
        }
      }, 100);
    },

    autoSlug: function () {
      var titleEl = document.getElementById("blogTitle");
      var slugEl = document.getElementById("blogSlug");
      if (!titleEl || !slugEl) return;

      // Only auto-generate if slug is empty or user hasn't manually edited it
      if (!this.currentPost || !this.currentPost.slug) {
        slugEl.value = titleEl.value
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 80);
      }
    },

    handleImageUpload: function (input) {
      var file = input.files[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        AdminApp.toast("Please select an image file.", "error");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        AdminApp.toast("Image must be under 5MB.", "error");
        return;
      }

      var sb = SRT.getSupabase();
      var filePath = "blog/" + Date.now() + "_" + file.name.replace(/[^a-zA-Z0-9.-]/g, "_");

      var area = document.getElementById("upload-blogFeaturedImage");
      area.innerHTML =
        '<div class="upload-placeholder"><div class="admin-spinner" style="margin:0 auto 8px;"></div>Uploading...</div>';

      sb.storage
        .from("site-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false })
        .then(function (result) {
          if (result.error) throw result.error;

          var urlResult = sb.storage.from("site-images").getPublicUrl(filePath);
          var publicUrl = urlResult.data.publicUrl;

          document.getElementById("blogFeaturedImage").value = publicUrl;
          area.className = "img-upload-area has-image";
          area.innerHTML =
            '<img src="' + publicUrl + '" alt="Featured">' +
            '<input type="file" accept="image/*" onchange="AdminBlog.handleImageUpload(this)">';
          AdminApp.toast("Image uploaded!", "success");
        })
        .catch(function (err) {
          area.innerHTML =
            '<div class="upload-placeholder"><i class="fa-solid fa-cloud-arrow-up"></i>Upload failed. Click to retry.</div>' +
            '<input type="file" accept="image/*" onchange="AdminBlog.handleImageUpload(this)">';
          AdminApp.toast("Upload failed: " + (err.message || "Unknown error"), "error");
        });
    },

    savePost: function (status) {
      var title = (document.getElementById("blogTitle").value || "").trim();
      var slug = (document.getElementById("blogSlug").value || "").trim();
      var body = quillEditor ? quillEditor.root.innerHTML : "";
      var excerpt = (document.getElementById("blogExcerpt").value || "").trim();
      var category = document.getElementById("blogCategory").value;
      var tagsStr = (document.getElementById("blogTags").value || "").trim();
      var readTime = (document.getElementById("blogReadTime").value || "").trim();
      var featuredImage = document.getElementById("blogFeaturedImage").value;
      var metaTitle = (document.getElementById("blogMetaTitle").value || "").trim();
      var metaDesc = (document.getElementById("blogMetaDesc").value || "").trim();

      // Validation
      if (!title) {
        AdminApp.toast("Please enter a post title.", "error");
        return;
      }
      if (!body || body === "<p><br></p>") {
        AdminApp.toast("Please write some content.", "error");
        return;
      }
      if (!slug) {
        slug = title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .substring(0, 80);
      }

      // Auto-generate excerpt if empty
      if (!excerpt) {
        var tempDiv = document.createElement("div");
        tempDiv.innerHTML = body;
        excerpt = (tempDiv.textContent || "").substring(0, 200).trim();
        if (excerpt.length >= 200) excerpt += "...";
      }

      // Auto-estimate read time
      if (!readTime) {
        var tempDiv2 = document.createElement("div");
        tempDiv2.innerHTML = body;
        var wordCount = (tempDiv2.textContent || "").split(/\s+/).length;
        var minutes = Math.max(1, Math.ceil(wordCount / 200));
        readTime = minutes + " min read";
      }

      var tags = tagsStr
        ? tagsStr.split(",").map(function (t) { return t.trim(); }).filter(Boolean)
        : [];

      var postData = {
        title: title,
        slug: slug,
        body: body,
        excerpt: excerpt,
        category: category,
        tags: tags,
        read_time: readTime,
        featured_image: featuredImage,
        meta_title: metaTitle || title,
        meta_description: metaDesc || excerpt,
        status: status,
        updated_at: new Date().toISOString(),
      };

      // Set published_at only when first publishing
      if (status === "published" && (!this.currentPost || this.currentPost.status !== "published")) {
        postData.published_at = new Date().toISOString();
      }

      var sb = SRT.getSupabase();
      var isUpdate = this.currentPost && this.currentPost.id;

      var promise;
      if (isUpdate) {
        promise = sb.from("blog_posts").update(postData).eq("id", this.currentPost.id);
      } else {
        promise = sb.from("blog_posts").insert(postData);
      }

      promise.then(function (result) {
        if (result.error) {
          if (result.error.message && result.error.message.indexOf("duplicate") > -1) {
            AdminApp.toast("A post with this slug already exists. Please change the URL slug.", "error");
          } else {
            AdminApp.toast("Save failed: " + result.error.message, "error");
          }
          return;
        }
        AdminApp.toast(
          status === "published" ? "Post published successfully!" : "Draft saved!",
          "success"
        );
        AdminBlog.loadPosts();
      });
    },

    toggleStatus: function (id) {
      var post = this.posts.find(function (p) { return p.id === id; });
      if (!post) return;

      var newStatus = post.status === "published" ? "draft" : "published";
      var update = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === "published" && !post.published_at) {
        update.published_at = new Date().toISOString();
      }

      var sb = SRT.getSupabase();
      sb.from("blog_posts")
        .update(update)
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Update failed: " + result.error.message, "error");
            return;
          }
          AdminApp.toast(
            newStatus === "published" ? "Post published!" : "Post unpublished.",
            "success"
          );
          AdminBlog.loadPosts();
        });
    },

    deletePost: function (id) {
      if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) return;

      var sb = SRT.getSupabase();
      sb.from("blog_posts")
        .delete()
        .eq("id", id)
        .then(function (result) {
          if (result.error) {
            AdminApp.toast("Delete failed: " + result.error.message, "error");
            return;
          }
          AdminApp.toast("Post deleted.", "success");
          AdminBlog.loadPosts();
        });
    },
  };
})();
