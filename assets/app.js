/* =========================================
   Employee Hub App (GitHub-ready)
   - Admin UI hidden until admin login
   - App hidden until login
   - Safe DOM rendering
   - Dark mode toggle with persistence
   ========================================= */

(() => {
  /* ===== MOCK DATABASE ===== */
  const users = [
    { email: "employee@gmail.com", password: "1234", role: "employee", country: "NZ", department: "Operations" },
    { email: "admin@gmail.com", password: "admin", role: "admin", country: "AU", department: "HR" }
  ];

  let trainingModules = [
    { id: 1, title: "Induction", body: "Welcome to company induction.", countries: ["NZ","AU","SG","BE"], departments:["Operations","HR"], completedBy:[] },
    { id: 2, title: "Health & Safety", body: "Mandatory safety training.", countries:["NZ","AU"], departments:["Operations"], completedBy:[] }
  ];

  let policiesList = [
    { id: 1, title: "Health & Safety Policy", body: "Follow company safety rules." },
    { id: 2, title: "Code of Conduct", body: "Maintain professional behavior." }
  ];

  /* ===== STATE ===== */
  let currentUser = null;
  let modalTarget = null; // id number or null
  let modalType = null;   // 'training' | 'policy' | null

  /* ===== DOM CACHE ===== */
  const $ = (id) => document.getElementById(id);

  const loginScreen       = $("loginScreen");
  const app               = $("app");
  const emailInput        = $("emailInput");
  const passwordInput     = $("passwordInput");
  const loginForm         = $("loginForm");

  const userInfo          = $("userInfo");
  const adminBtn          = $("adminBtn");
  const adminPanel        = $("adminPanel");
  const themeToggleBtn    = $("themeToggle");

  const trainingSection   = $("trainingSection");
  const policiesSection   = $("policiesSection");
  const editTrainingBtn   = $("editTrainingBtn");
  const editPoliciesBtn   = $("editPoliciesBtn");

  const modal             = $("modal");
  const modalTitle        = $("modalTitle");
  const modalInputTitle   = $("modalInputTitle");
  const modalInputBody    = $("modalInputBody");

  /* ===== UTIL ===== */
  const safeText = (text) => (typeof text === "string" ? text : String(text ?? ""));
  const formatUserInfo = (user) => `${user.email} • ${user.country} • ${user.department}`;

  function requireUser() {
    if (!currentUser) {
      alert("Please log in again.");
      app.classList.add("hidden");
      loginScreen.classList.remove("hidden");
      return false;
    }
    return true;
  }

  function confirmAction(message) {
    return window.confirm(message);
  }

  /* ===== LOGIN ===== */
  function login() {
    const email = safeText(emailInput.value).trim();
    const password = safeText(passwordInput.value);

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      alert("Invalid login");
      return;
    }

    currentUser = user;

    // UI visibility: show app, hide login
    loginScreen.classList.add("hidden");
    app.classList.remove("hidden");

    initApp();
  }

  function forgotPassword() {
    alert("Password reset email sent (simulated)");
  }

  /* ===== APP INIT ===== */
  function initApp() {
    if (!requireUser()) return;

    userInfo.textContent = formatUserInfo(currentUser);

    const isAdmin = currentUser.role === "admin";

    // Hide admin UI until admin login
    adminBtn.classList.toggle("hidden", !isAdmin);
    editPoliciesBtn.classList.toggle("hidden", !isAdmin);
    editTrainingBtn.classList.toggle("hidden", !isAdmin);
    adminPanel.classList.add("hidden"); // always start closed

    // Wire admin toggle
    adminBtn.onclick = () => {
      if (!isAdmin) return;
      adminPanel.classList.toggle("hidden");
    };

    renderTraining();
    renderPolicies();

    // Ensure a tab is active
    ensureActiveTab();
  }

  function ensureActiveTab() {
    const active = document.querySelector(".tab.active");
    if (!active) {
      const home = $("home");
      if (home) home.classList.add("active");
    }
  }

  /* ===== TABS ===== */
  function showTab(tabId) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const target = document.getElementById(tabId);
    if (target) target.classList.add("active");
  }

  function logout() {
    currentUser = null;

    // Hide app, show login. Also hide any admin controls.
    app.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    adminBtn.classList.add("hidden");
    editPoliciesBtn.classList.add("hidden");
    editTrainingBtn.classList.add("hidden");
    adminPanel.classList.add("hidden");

    passwordInput.value = "";
  }

  /* ===== TRAINING ===== */
  function renderTraining() {
    if (!requireUser()) return;
    trainingSection.innerHTML = "";

    const visibleModules = trainingModules
      .filter(m => m.countries.includes(currentUser.country) && m.departments.includes(currentUser.department));

    visibleModules.forEach(m => {
      const card = document.createElement("div");
      card.className = "card";

      const h3 = document.createElement("h3");
      h3.textContent = safeText(m.title);

      const p = document.createElement("p");
      p.textContent = safeText(m.body);

      card.append(h3, p);

      const isCompleted = m.completedBy.includes(currentUser.email);
      if (!isCompleted) {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.type = "button";
        btn.textContent = "Mark Completed";
        btn.addEventListener("click", () => completeTraining(m.id));
        card.appendChild(btn);
      } else {
        const done = document.createElement("div");
        done.className = "completed";
        done.textContent = "✔ Completed";
        card.appendChild(done);
      }

      // Admin-only controls
      if (currentUser.role === "admin") {
        const wrap = document.createElement("div");
        wrap.className = "flex-row";

        const editBtn = document.createElement("button");
        editBtn.className = "btn-secondary";
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openModal("training", m.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-admin";
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteTrainingModule(m.id));

        wrap.append(editBtn, deleteBtn);
        card.appendChild(wrap);
      }

      trainingSection.appendChild(card);
    });

    if (trainingSection.children.length === 0) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.textContent = "No training modules available for your location/department.";
      trainingSection.appendChild(empty);
    }
  }

  function completeTraining(id) {
    if (!requireUser()) return;

    const module = trainingModules.find(m => m.id === id);
    if (!module) return;

    if (!module.completedBy.includes(currentUser.email)) {
      module.completedBy.push(currentUser.email);
      notifyHR(module);
    }
    renderTraining();
  }

  function deleteTrainingModule(id) {
    if (currentUser?.role !== "admin") return;
    if (!confirmAction("Delete this training module?")) return;

    trainingModules = trainingModules.filter(m => m.id !== id);
    renderTraining();
  }

  function editTraining() {
    if (currentUser?.role !== "admin") return;
    openModal("training", null);
  }

  /* ===== POLICIES ===== */
  function renderPolicies() {
    if (!requireUser()) return;

    policiesSection.innerHTML = "";

    policiesList.forEach(p => {
      const card = document.createElement("div");
      card.className = "card";

      const h3 = document.createElement("h3");
      h3.textContent = safeText(p.title);

      const body = document.createElement("p");
      body.textContent = safeText(p.body);

      card.append(h3, body);

      if (currentUser.role === "admin") {
        const wrap = document.createElement("div");
        wrap.className = "flex-row";

        const editBtn = document.createElement("button");
        editBtn.className = "btn-secondary";
        editBtn.type = "button";
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => openModal("policy", p.id));

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "btn-admin";
        deleteBtn.type = "button";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deletePolicy(p.id));

        wrap.append(editBtn, deleteBtn);
        card.appendChild(wrap);
      }

      policiesSection.appendChild(card);
    });

    if (policiesSection.children.length === 0) {
      const empty = document.createElement("div");
      empty.className = "card";
      empty.textContent = "No policies available.";
      policiesSection.appendChild(empty);
    }
  }

  function editPolicies() {
    if (currentUser?.role !== "admin") return;
    openModal("policy", null);
  }

  function deletePolicy(id) {
    if (currentUser?.role !== "admin") return;
    if (!confirmAction("Delete this policy?")) return;

    policiesList = policiesList.filter(p => p.id !== id);
    renderPolicies();
  }

  /* ===== MODAL ===== */
  function openModal(type, id) {
    if (currentUser?.role !== "admin") return;

    modalType = type;
    modalTarget = id ?? null;

    modal.classList.remove("hidden");

    modalInputTitle.value = "";
    modalInputBody.value = "";

    if (type === "training") {
      if (id) {
        const item = trainingModules.find(t => t.id === id);
        if (!item) return closeModal();
        modalTitle.textContent = "Edit Training Module";
        modalInputTitle.value = safeText(item.title);
        modalInputBody.value = safeText(item.body);
      } else {
        modalTitle.textContent = "Add Training Module";
      }
    } else if (type === "policy") {
      if (id) {
        const item = policiesList.find(p => p.id === id);
        if (!item) return closeModal();
        modalTitle.textContent = "Edit Policy";
        modalInputTitle.value = safeText(item.title);
        modalInputBody.value = safeText(item.body);
      } else {
        modalTitle.textContent = "Add Policy";
      }
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    modalType = null;
    modalTarget = null;
  }

  function saveModal() {
    if (currentUser?.role !== "admin") return;

    const title = safeText(modalInputTitle.value).trim();
    const body  = safeText(modalInputBody.value).trim();

    if (!title || !body) {
      alert("Please fill out both fields");
      return;
    }

    if (modalType === "training") {
      if (modalTarget) {
        const item = trainingModules.find(t => t.id === modalTarget);
        if (!item) return;
        item.title = title;
        item.body  = body;
      } else {
        trainingModules.push({
          id: Date.now(),
          title,
          body,
          countries: ["NZ","AU","SG","BE"],
          departments: ["Operations","HR"],
          completedBy: []
        });
      }
      renderTraining();
    } else if (modalType === "policy") {
      if (modalTarget) {
        const item = policiesList.find(p => p.id === modalTarget);
        if (!item) return;
        item.title = title;
        item.body  = body;
      } else {
        policiesList.push({ id: Date.now(), title, body });
      }
      renderPolicies();
    }

    closeModal();
  }

  /* ===== ADMIN ===== */
  function addUser() {
    if (currentUser?.role !== "admin") return;
    alert("Admin: add user (future feature)");
  }

  /* ===== HR EMAIL NOTIFICATION (SIMULATED) ===== */
  function notifyHR(module) {
    console.log("HR EMAIL:", {
      employee: currentUser?.email,
      training: module?.title,
      time: new Date().toISOString()
    });
  }

  /* ===== THEME TOGGLE (Dark Mode) ===== */
  (function initThemeToggle() {
    const root = document.documentElement;
    const btn = themeToggleBtn;
    if (!btn) return;

    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      root.classList.add("theme-dark");
      btn.setAttribute("aria-pressed", "true");
    } else if (saved === "light") {
      root.classList.remove("theme-dark");
      btn.setAttribute("aria-pressed", "false");
    }

    btn.addEventListener("click", () => {
      const isDark = root.classList.toggle("theme-dark");
      btn.setAttribute("aria-pressed", String(isDark));
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  })();

  /* ===== FORM LISTENERS ===== */
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      login();
    });
  }

  // Expose functions globally (HTML uses inline handlers)
  window.login = login;
  window.forgotPassword = forgotPassword;
  window.showTab = showTab;
  window.logout = logout;
  window.editTraining = editTraining;
  window.editPolicies = editPolicies;
  window.openModal = openModal;
  window.closeModal = closeModal  window.closeModal = closeModal;
  window.saveModal = saveModal;
  window.addUser = addUser;
