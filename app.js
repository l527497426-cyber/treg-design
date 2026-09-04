const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const agents = [
  { id: "openclaw", name: "OpenClaw", mark: "O", icon: "./assets/figma/openclaw.svg" },
  { id: "grokbot", name: "Grok Bot", mark: "G", plugin: true },
  { id: "hermes", name: "Hermes Agent", mark: "H" },
  { id: "claude-ai", name: "Claude.ai", mark: "A" },
  { id: "claude-code", name: "Claude Code", mark: "C" },
  { id: "codex", name: "Codex", mark: "▣" },
  { id: "opencode", name: "opencode", mark: "O" },
  { id: "pi", name: "pi", mark: "π" },
  { id: "cursor", name: "Cursor", mark: "↗" },
  { id: "gemini", name: "Gemini CLI", mark: "✦" },
  { id: "other", name: "Other", mark: "✳" },
];

const oauthGroups = [
  {
    label: "Post on social",
    items: [
      ["x", "X (Twitter)"],
      ["youtube", "YouTube"],
      ["tiktok", "TikTok"],
      ["linkedin", "LinkedIn"],
      ["facebook", "Facebook Pages"],
      ["instagram", "Instagram"],
    ],
  },
  {
    label: "Manage ad campaigns",
    items: [["google-ads", "Google Ads"], ["meta-ads", "Meta Ads"]],
  },
  {
    label: "SEO on your own site",
    items: [
      ["google-analytics", "Google Analytics"],
      ["google-search-console", "Search Console"],
      ["google-business-profile", "Business Profile"],
    ],
  },
];

const oauthIcons = {
  x: "./assets/figma/oauth-x.svg",
  youtube: "./assets/figma/oauth-youtube.svg",
  tiktok: "./assets/figma/oauth-tiktok.svg",
  linkedin: "./assets/figma/oauth-linkedin.svg",
  facebook: "./assets/figma/oauth-facebook.svg",
  instagram: "./assets/figma/oauth-instagram.svg",
  "google-ads": "./assets/figma/oauth-google-ads.svg",
  "meta-ads": "./assets/figma/oauth-meta-ads.svg",
  "google-analytics": "./assets/figma/oauth-google-analytics.svg",
  "google-search-console": "./assets/figma/oauth-search-console.svg",
  "google-business-profile": "./assets/figma/oauth-business-profile.svg",
};

const state = {
  route: "start",
  agent: "openclaw",
  tokenVisible: false,
  platforms: [],
  providers: [],
  catalogTab: "all",
  providerCategory: "all",
  query: "",
  expandedGroups: new Set(),
  catalogLoaded: false,
  toastTimer: null,
};

const categoryOrder = [
  "Enrichment",
  "SEO/AEO",
  "Social",
  "Advertising",
  "E-commerce",
  "Reviews & Apps",
  "Community",
];

const categoryHints = {
  "Enrichment": "people and company records, resolved from an email or a domain",
  "SEO/AEO": "rankings, keywords and backlinks — what search engines know, and what the answer engines say",
  "Social": "posts, profiles and comments, straight from the feeds",
  "Advertising": "ad libraries and creator marketplaces — what is being promoted, and for how much",
  "E-commerce": "listings, prices and sellers across the marketplaces",
  "Reviews & Apps": "app stores and review sites — what people rate, and what they say",
  "Community": "forums and chat, where people answer each other",
};

const freePlatforms = new Set([
  "google",
  "search-console",
  "google-analytics",
  "google-business",
  "tiktok",
  "instagram",
  "youtube",
  "linkedin",
  "google-ads",
  "meta-ads",
  "google-tag-manager",
  "slack",
]);

function showToast(message) {
  const toast = $("[data-toast]");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  if (button) {
    const label = button.matches(".try-card") ? $(".copy-state", button) : button;
    const original = label.innerHTML;
    button.classList.add("copied");
    label.textContent = "✓ copied";
    setTimeout(() => {
      button.classList.remove("copied");
      label.innerHTML = original;
    }, 1400);
  }
  showToast("Copied to clipboard");
}

function renderAgentMenu() {
  const menu = $("[data-agent-menu]");
  menu.innerHTML = agents.map((agent) => `
    <button class="agent-option" type="button" role="option" aria-selected="${agent.id === state.agent}" data-agent="${agent.id}">
      <span class="agent-symbol ${agent.icon ? "has-icon" : ""}">${agent.icon ? `<img src="${agent.icon}" alt="" />` : agent.mark}</span>
      <span>${agent.name}</span>
      ${agent.id === state.agent ? '<span class="check">✓</span>' : ""}
    </button>
  `).join("");
}

function selectAgent(id) {
  state.agent = id;
  const agent = agents.find((item) => item.id === id) || agents[0];
  $("[data-agent-name]").textContent = agent.name;
  $("[data-agent-symbol]").innerHTML = agent.icon ? `<img src="${agent.icon}" alt="" data-agent-icon />` : agent.mark;
  $("[data-agent-context-name]").textContent = agent.name;
  $("[data-agent-instruction]").textContent = agent.plugin ? "Then, in your Bot's chat, send:" : "In your agent's chat, send:";
  $("[data-plugin-slot]").innerHTML = agent.plugin ? `
    <div class="plugin-note">
      <p>First, install the treg plugin:</p>
      <button class="button" type="button" data-demo-label="Install plugin in Grok Bot">
        <span class="agent-symbol small">G</span> Install plugin in Grok Bot ↗
      </button>
    </div>
  ` : "";
  renderAgentMenu();
  localStorage.setItem("treg-reference-agent", agent.id);
}

function renderOauthGroups() {
  $("[data-oauth-groups]").innerHTML = oauthGroups.map((group) => `
    <div class="oauth-group">
      <div class="oauth-group-title">${group.label}</div>
      <div class="provider-row">
        ${group.items.map(([slug, name]) => `
          <button class="provider-chip" type="button" data-demo-label="Connect ${name}">
            <img src="${oauthIcons[slug]}" alt="" />
            ${name}
          </button>
        `).join("")}
      </div>
    </div>
  `).join("");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function shortPlatformName(label = "") {
  return label.split(" (")[0].split(" — ")[0];
}

function orderedPlatformGroups(items = state.platforms) {
  const grouped = new Map();
  items.forEach((platform) => {
    const category = platform.category || "Other";
    if (category === "Other") return;
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(platform);
  });
  const extras = [...grouped.keys()].filter((category) => !categoryOrder.includes(category)).sort();
  return [...categoryOrder.filter((category) => grouped.has(category)), ...extras]
    .map((category) => ({ category, items: grouped.get(category) }));
}

function formatUsd(value) {
  if (!Number.isFinite(value)) return "";
  let digits = 3;
  if (value < 0.000001) digits = 8;
  else if (value < 0.001) digits = 5;
  else if (value < 0.01) digits = 4;
  const fixed = value.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
  return `$${fixed}`;
}

function platformPrice(platform) {
  if (freePlatforms.has(platform.slug) || !platform.price_from) {
    return { label: "free with your account", free: true };
  }
  const price = platform.price_from;
  const unit = price.type === "per_result" ? "result" : price.type === "per_success" ? "success" : "call";
  return { label: `from ${formatUsd(Number(price.usd))}/${unit}`, free: false };
}

function logoMarkup(platform, mini = false) {
  const className = mini ? "mini-logo" : "platform-logo";
  return `<span class="${className}" data-logo-wrap data-fallback="${escapeHtml(shortPlatformName(platform.label).charAt(0).toUpperCase())}">
    <img src="https://treg.to/logos/platforms/${encodeURIComponent(platform.slug)}.svg" alt="" loading="lazy" data-logo />
  </span>`;
}

function attachLogoFallbacks(root = document) {
  $$('[data-logo]', root).forEach((image) => {
    const showFallback = () => {
      const wrap = image.closest("[data-logo-wrap]");
      if (!wrap || wrap.classList.contains("fallback")) return;
      wrap.classList.add("fallback");
      wrap.style.setProperty("--fallback-color", `hsl(${[...image.src].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360} 26% 46%)`);
      wrap.textContent = wrap.dataset.fallback || "•";
    };
    image.addEventListener("error", showFallback, { once: true });
    if (image.complete && image.naturalWidth === 0) showFallback();
  });
}

function renderCatalogTabs() {
  const groups = orderedPlatformGroups();
  const tabs = [
    { key: "all", label: "All", count: groups.reduce((total, group) => total + group.items.length, 0) },
    ...groups.map((group) => ({ key: group.category, label: group.category, count: group.items.length })),
    { key: "platform", label: "Platform", count: state.providers.length },
  ];
  $("[data-catalog-tabs]").innerHTML = tabs.map((tab) => `
    <button class="catalog-tab ${state.catalogTab === tab.key ? "active" : ""}" type="button" role="tab"
      aria-selected="${state.catalogTab === tab.key}" data-catalog-tab="${escapeHtml(tab.key)}">
      ${escapeHtml(tab.label)} <span>${tab.count}</span>
    </button>
  `).join("");
}

function visiblePlatformGroups() {
  const query = state.query.trim().toLowerCase();
  const groups = orderedPlatformGroups();
  const selected = state.catalogTab === "all" ? groups : groups.filter((group) => group.category === state.catalogTab);

  return selected.map((group) => {
    let items = [...group.items];
    if (query) {
      items = items.filter((platform) => [
        platform.label,
        platform.slug,
        platform.summary,
        ...(platform.providers || []),
      ].join(" ").toLowerCase().includes(query));
      items.sort((a, b) => (b.endpoints || 0) - (a.endpoints || 0));
      return { ...group, shown: items, rest: [], total: items.length };
    }

    items.sort((a, b) => {
      const aRank = a.featured == null ? Number.MAX_SAFE_INTEGER : a.featured;
      const bRank = b.featured == null ? Number.MAX_SAFE_INTEGER : b.featured;
      return aRank - bRank || (b.endpoints || 0) - (a.endpoints || 0);
    });
    const featured = items.filter((platform) => platform.featured != null);
    if (items.length <= 8 || !featured.length || state.expandedGroups.has(group.category)) {
      return { ...group, shown: items, rest: [], total: items.length };
    }
    return {
      ...group,
      shown: featured,
      rest: items.filter((platform) => platform.featured == null),
      total: items.length,
    };
  }).filter((group) => group.shown.length);
}

function platformCardMarkup(platform) {
  const price = platformPrice(platform);
  return `
    <button class="platform-card" type="button" data-platform="${escapeHtml(platform.slug)}" title="${escapeHtml(`${platform.label} — ${platform.summary || ""}`)}">
      <span class="platform-card-top">
        ${logoMarkup(platform)}
        <span class="platform-card-copy">
          <span class="platform-name">${escapeHtml(shortPlatformName(platform.label))}</span>
          <span class="platform-category">${escapeHtml(platform.category || "Other")}</span>
        </span>
        <span class="platform-state">not connected</span>
      </span>
      <span class="platform-card-foot">
        <span class="endpoint-count">${Number(platform.endpoints || 0).toLocaleString()} endpoint${platform.endpoints === 1 ? "" : "s"}</span>
        <span class="platform-price ${price.free ? "free" : ""}"><strong>${escapeHtml(price.label)}</strong></span>
      </span>
    </button>
  `;
}

function showMoreMarkup(group) {
  const examples = group.rest.slice(0, 2).map((platform) => shortPlatformName(platform.label));
  const remaining = Math.max(0, group.rest.length - examples.length);
  const label = examples.length > 1
    ? `See ${examples[0]}, ${examples[1]}${remaining ? `, and ${remaining} more` : ""}`
    : `See ${examples[0] || group.category} and ${remaining} more`;
  return `
    <button class="show-more-row" type="button" data-show-more="${escapeHtml(group.category)}">
      <span class="show-more-logos">${group.rest.slice(0, 7).map((platform) => logoMarkup(platform, true)).join("")}</span>
      <span>${escapeHtml(label)}</span>
      <span class="show-more-arrow" aria-hidden="true">→</span>
    </button>
  `;
}

function renderPlatformCatalog() {
  const groups = visiblePlatformGroups();
  const container = $("[data-catalog-groups]");
  const matchCount = groups.reduce((total, group) => total + group.total, 0);
  $("[data-catalog-status]").textContent = state.query ? `${matchCount} matching platform${matchCount === 1 ? "" : "s"}` : `${state.platforms.length} platforms loaded`;
  container.innerHTML = groups.length ? groups.map((group) => `
    <section class="catalog-group" aria-labelledby="catalog-${group.category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}">
      <header class="catalog-section-head">
        <h2 class="catalog-section-title" id="catalog-${group.category.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}">
          <strong>${escapeHtml(group.category)}</strong><span class="catalog-count">${group.total}</span>
        </h2>
        ${categoryHints[group.category] ? `<span class="catalog-hint">${escapeHtml(categoryHints[group.category])}</span>` : ""}
      </header>
      <div class="platform-grid">${group.shown.map(platformCardMarkup).join("")}</div>
      ${group.rest.length ? showMoreMarkup(group) : ""}
    </section>
  `).join("") : `<div class="empty-catalog">Nothing in the catalog matches “${escapeHtml(state.query)}”. Try a platform, provider, or category.</div>`;
  attachLogoFallbacks(container);
}

function providerAuthLabel(provider) {
  if (provider.auth_kind === "oauth") return "one-click";
  if (provider.auth_kind === "token") return "your own bot";
  return "API key";
}

function providerActionLabel(provider) {
  return provider.auth_kind === "oauth" ? "Connect" : "Add key";
}

function renderProviderCatalog() {
  const query = state.query.trim().toLowerCase();
  const categoryOrder = ["SEO", "Advertising", "Social media", "Enrichment", "Market data", "Community"];
  const byCategory = new Map();
  state.providers.forEach((provider) => {
    const category = provider.category || "Other";
    if (!byCategory.has(category)) byCategory.set(category, []);
    byCategory.get(category).push(provider);
  });
  const categories = [...categoryOrder.filter((category) => byCategory.has(category)), ...[...byCategory.keys()].filter((category) => !categoryOrder.includes(category)).sort()];
  const filteredGroups = categories.map((category) => ({
    category,
    items: byCategory.get(category).filter((provider) => {
      if (state.providerCategory !== "all" && state.providerCategory !== category) return false;
      return !query || [provider.display_name, provider.service, provider.summary, category].join(" ").toLowerCase().includes(query);
    }),
  })).filter((group) => group.items.length);

  const count = filteredGroups.reduce((total, group) => total + group.items.length, 0);
  $("[data-catalog-status]").textContent = state.query ? `${count} matching provider${count === 1 ? "" : "s"}` : `${state.providers.length} providers loaded`;

  const filters = `
    <div class="provider-filters" aria-label="Provider categories">
      <button class="filter-chip ${state.providerCategory === "all" ? "active" : ""}" type="button" data-provider-filter="all">All <span>${state.providers.length}</span></button>
      ${categories.map((category) => `<button class="filter-chip ${state.providerCategory === category ? "active" : ""}" type="button" data-provider-filter="${escapeHtml(category)}">${escapeHtml(category)} <span>${byCategory.get(category).length}</span></button>`).join("")}
    </div>`;

  const lists = filteredGroups.length ? filteredGroups.map((group) => `
    <section class="provider-group">
      <h2 class="provider-group-title">${escapeHtml(group.category)} <span class="catalog-count">${group.items.length}</span></h2>
      <div class="provider-table-wrap">
        <table class="provider-table">
          <tbody>
            ${group.items.map((provider) => `
              <tr data-demo-label="Open ${escapeHtml(provider.display_name)}">
                <td>
                  <span class="provider-main">
                    <span class="provider-logo" data-logo-wrap data-fallback="${escapeHtml(provider.display_name.charAt(0).toUpperCase())}"><img src="https://treg.to/logos/${encodeURIComponent(provider.service)}.svg" alt="" loading="lazy" data-logo /></span>
                    <span>
                      <span class="provider-name">${escapeHtml(provider.display_name)}</span>
                      <span class="provider-summary">${escapeHtml(provider.summary || "")}</span>
                    </span>
                  </span>
                </td>
                <td class="provider-auth">${providerAuthLabel(provider)}</td>
                <td class="provider-status">not connected</td>
                <td class="provider-action"><button class="small-button ${provider.auth_kind === "oauth" ? "primary" : ""}" type="button" data-demo-label="${providerActionLabel(provider)} ${escapeHtml(provider.display_name)}">${providerActionLabel(provider)}</button></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `).join("") : `<div class="empty-catalog">No providers match this filter.</div>`;

  const container = $("[data-provider-catalog]");
  container.innerHTML = filters + lists;
  attachLogoFallbacks(container);
}

function renderCatalog() {
  if (!state.catalogLoaded) return;
  renderCatalogTabs();
  const platformMode = state.catalogTab !== "platform";
  $("[data-catalog-groups]").hidden = !platformMode;
  $("[data-provider-catalog]").hidden = platformMode;
  if (platformMode) renderPlatformCatalog();
  else renderProviderCatalog();
}

async function loadCatalogData() {
  try {
    const [platformResponse, providerResponse] = await Promise.all([
      fetch("./data/platforms.json"),
      fetch("./data/providers.json"),
    ]);
    if (!platformResponse.ok || !providerResponse.ok) throw new Error("Catalog data request failed");
    const [platformData, providerData] = await Promise.all([platformResponse.json(), providerResponse.json()]);
    state.platforms = platformData.platforms || [];
    state.providers = Array.isArray(providerData) ? providerData : providerData.providers || [];
    state.catalogLoaded = true;
    renderCatalog();
  } catch (error) {
    $("[data-catalog-status]").classList.remove("sr-only");
    $("[data-catalog-status]").textContent = "The local catalog snapshot could not be loaded. Start this prototype with npm run dev.";
    $("[data-catalog-groups]").innerHTML = '<div class="empty-catalog">Catalog data unavailable.</div>';
    console.error(error);
  }
}

function openPlatformDialog(slug) {
  const platform = state.platforms.find((item) => item.slug === slug);
  if (!platform) return;
  const price = platformPrice(platform);
  $("[data-dialog-title]").innerHTML = `
    ${logoMarkup(platform)}
    <span><h2>${escapeHtml(platform.label)}</h2><span class="platform-category">${escapeHtml(platform.category)}</span></span>
  `;
  $("[data-dialog-body]").innerHTML = `
    <p class="dialog-summary">${escapeHtml(platform.summary || "No summary available for this platform.")}</p>
    <div class="dialog-stats">
      <div class="dialog-stat"><span>Endpoints</span><strong>${Number(platform.endpoints || 0).toLocaleString()}</strong></div>
      <div class="dialog-stat"><span>Capabilities</span><strong>${Number(platform.capabilities || 0).toLocaleString()}</strong></div>
      <div class="dialog-stat"><span>Starting price</span><strong>${escapeHtml(price.label.replace("from ", ""))}</strong></div>
    </div>
    <p class="dialog-label">Served by</p>
    <div class="dialog-provider-list">
      ${(platform.providers || []).map((provider) => `<span class="filter-chip">${escapeHtml(provider)}</span>`).join("")}
    </div>
    <div class="dialog-note">This quick view is included for redesign review. The original product opens a full endpoint ledger for this platform.</div>
  `;
  attachLogoFallbacks($("[data-platform-dialog]"));
  $("[data-platform-dialog]").showModal();
}

function normalizeRoute(hash = location.hash) {
  const requestedView = new URLSearchParams(location.search).get("view");
  if (requestedView === "start" || requestedView === "catalog") return requestedView;
  const value = hash.replace(/^#\/?/, "").split("/")[0];
  if (value === "connections") return "catalog";
  return value === "catalog" ? "catalog" : "start";
}

function setRoute(route, updateHash = true) {
  state.route = route;
  if (updateHash && location.hash !== `#${route}`) history.pushState(null, "", `#${route}`);

  $$('[data-view]').forEach((view) => {
    const active = view.dataset.view === route;
    view.hidden = !active;
    view.classList.toggle("active", active);
  });
  $$('[data-route]').forEach((button) => button.classList.toggle("active", button.dataset.route === route));
  const search = $(".global-search");
  if (search) search.hidden = route !== "catalog";
  if (route === "catalog" && state.catalogLoaded) renderCatalog();
  closeMobileNav();
  closeAccountMenu();
  window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  document.title = route === "catalog" ? "Catalog · treg redesign reference" : "Getting started · treg redesign reference";
}

function openMobileNav() {
  $("[data-sidebar]")?.classList.add("mobile-open");
  $("[data-mobile-backdrop]")?.classList.add("mobile-open");
  $("[data-mobile-menu]")?.setAttribute("aria-expanded", "true");
}

function closeMobileNav() {
  $("[data-sidebar]")?.classList.remove("mobile-open");
  $("[data-mobile-backdrop]")?.classList.remove("mobile-open");
  $("[data-mobile-menu]")?.setAttribute("aria-expanded", "false");
}

function closeAccountMenu() {
  const menu = $("[data-account-menu]");
  const trigger = $("[data-account-trigger]");
  if (!menu || !trigger) return;
  menu.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
}

function toggleAccountMenu() {
  const menu = $("[data-account-menu]");
  const trigger = $("[data-account-trigger]");
  if (!menu || !trigger) return;
  const willOpen = menu.hidden;
  menu.hidden = !willOpen;
  trigger.setAttribute("aria-expanded", String(willOpen));
}

function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const button = $("[data-theme-toggle]");
  const dark = theme === "dark";
  if (button) {
    button.textContent = dark ? "◐" : "◑";
    button.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
  }
  $$('[data-set-theme]').forEach((choice) => {
    const active = choice.dataset.setTheme === theme;
    choice.classList.toggle("active", active);
    choice.setAttribute("aria-pressed", String(active));
  });
  localStorage.setItem("treg-reference-theme", theme);
}

function setupEvents() {
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".account-menu-wrap")) closeAccountMenu();

    const routeButton = event.target.closest("[data-route]");
    if (routeButton) {
      setRoute(routeButton.dataset.route);
      return;
    }

    const startSearch = event.target.closest("[data-start-search]");
    if (startSearch) {
      setRoute("catalog");
      requestAnimationFrame(() => $("[data-search]")?.focus());
      return;
    }

    const accountTrigger = event.target.closest("[data-account-trigger]");
    if (accountTrigger) {
      toggleAccountMenu();
      return;
    }

    const themeChoice = event.target.closest("[data-set-theme]");
    if (themeChoice) {
      setTheme(themeChoice.dataset.setTheme);
      return;
    }

    const accountAction = event.target.closest("[data-account-action]");
    if (accountAction) {
      const messages = {
        vault: "Your vault is outside this two-page prototype",
        referral: "Referral flow is ready for the next redesign pass",
        logout: "Log out is disabled in this local prototype",
      };
      showToast(messages[accountAction.dataset.accountAction]);
      closeAccountMenu();
      return;
    }

    const copyButton = event.target.closest("[data-copy]");
    if (copyButton) {
      copyText(copyButton.dataset.copy, copyButton);
      return;
    }

    const catalogTab = event.target.closest("[data-catalog-tab]");
    if (catalogTab) {
      state.catalogTab = catalogTab.dataset.catalogTab;
      if (state.catalogTab !== "platform") state.providerCategory = "all";
      renderCatalog();
      return;
    }

    const showMoreButton = event.target.closest("[data-show-more]");
    if (showMoreButton) {
      state.expandedGroups.add(showMoreButton.dataset.showMore);
      renderPlatformCatalog();
      return;
    }

    const platformCard = event.target.closest("[data-platform]");
    if (platformCard) {
      openPlatformDialog(platformCard.dataset.platform);
      return;
    }

    const providerFilter = event.target.closest("[data-provider-filter]");
    if (providerFilter) {
      state.providerCategory = providerFilter.dataset.providerFilter;
      renderProviderCatalog();
      return;
    }

    const bringKeyButton = event.target.closest("[data-byok]");
    if (bringKeyButton) {
      state.catalogTab = "platform";
      state.providerCategory = "all";
      state.query = "";
      const searchInput = $("[data-search]");
      if (searchInput) searchInput.value = "";
      renderCatalog();
      showToast("Choose a provider to bring your own key");
      return;
    }

    const dialogClose = event.target.closest("[data-dialog-close]");
    if (dialogClose) {
      $("[data-platform-dialog]").close();
      return;
    }

    const demoButton = event.target.closest("[data-demo-label]");
    if (demoButton) {
      showToast(`${demoButton.dataset.demoLabel} is outside this two-page prototype`);
      return;
    }

    const agentOption = event.target.closest("[data-agent]");
    if (agentOption) {
      selectAgent(agentOption.dataset.agent);
      $("[data-agent-menu]").hidden = true;
      $("[data-agent-select]").setAttribute("aria-expanded", "false");
      return;
    }

    const select = event.target.closest("[data-agent-select]");
    if (select) {
      const menu = $("[data-agent-menu]");
      menu.hidden = !menu.hidden;
      select.setAttribute("aria-expanded", String(!menu.hidden));
      return;
    }

    if (!event.target.closest(".agent-picker")) {
      $("[data-agent-menu]").hidden = true;
      $("[data-agent-select]").setAttribute("aria-expanded", "false");
    }

    const buildTab = event.target.closest("[data-build-tab]");
    if (buildTab) {
      $$('[data-build-tab]').forEach((button) => {
        const active = button === buildTab;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
      });
      $$('[data-build-panel]').forEach((panel) => panel.hidden = panel.dataset.buildPanel !== buildTab.dataset.buildTab);
    }
  });

  $("[data-copy-token]").addEventListener("click", (event) => copyText("treg_demo_7f91_local_preview_only", event.currentTarget));
  $("[data-token-toggle]").addEventListener("click", (event) => {
    state.tokenVisible = !state.tokenVisible;
    $("[data-token]").textContent = state.tokenVisible ? "treg_demo_7f91_local_preview_only" : "treg_demo_7f91••••••••••••••••";
    $("[data-token-eye]").src = state.tokenVisible ? "./assets/figma/eye-open.svg" : "./assets/figma/eye-closed.svg";
    event.currentTarget.classList.toggle("active", state.tokenVisible);
    event.currentTarget.setAttribute("aria-label", state.tokenVisible ? "Hide key" : "Show key");
  });

  $("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  });
  $("[data-mobile-menu]")?.addEventListener("click", openMobileNav);
  $("[data-mobile-close]")?.addEventListener("click", closeMobileNav);
  $("[data-mobile-backdrop]")?.addEventListener("click", closeMobileNav);
  $("[data-search]")?.addEventListener("input", (event) => {
    state.query = event.currentTarget.value;
    renderCatalog();
  });
  $("[data-platform-dialog]").addEventListener("click", (event) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  });

  addEventListener("hashchange", () => setRoute(normalizeRoute(), false));
  addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && state.route === "catalog") {
      event.preventDefault();
      $("[data-search]")?.focus();
    }
    if (event.key === "Escape") {
      const dialog = $("[data-platform-dialog]");
      if (dialog.open) dialog.close();
      $("[data-agent-menu]").hidden = true;
      $("[data-agent-select]").setAttribute("aria-expanded", "false");
      closeAccountMenu();
      closeMobileNav();
    }
  });
}

function init() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $(".ascii-background")?.pause();
  }
  renderAgentMenu();
  renderOauthGroups();
  selectAgent(localStorage.getItem("treg-reference-agent") || "openclaw");
  setTheme(localStorage.getItem("treg-reference-theme") === "dark" ? "dark" : "light");
  setupEvents();
  setRoute(normalizeRoute(), false);
  loadCatalogData();
}

init();
