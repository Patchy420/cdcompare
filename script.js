// ========= SUPABASE CONFIG =========
// REPLACE these two values with your real data:
const SUPABASE_URL = "https://gzjdgjmyhpgnembbtwfp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6amRnam15aHBnbmVtYmJ0d2ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5Nzk5MzAsImV4cCI6MjA3ODU1NTkzMH0.rBWIQ891Z_iaSCZCDQUQfytN8P9ss346OYffYwWcFd8";

// ========= DOM ELEMENTS =========
const gamesListEl = document.getElementById("gamesList");
const searchInput = document.getElementById("searchInput");
const platformSelect = document.getElementById("platformSelect");
const searchBtn = document.getElementById("searchBtn");

let gamesData = [];

// Load games + offers from Supabase REST API
async function loadGames() {
  gamesListEl.innerHTML = "<p>Loading games from backend...</p>";

  const url =
    `${SUPABASE_URL}/rest/v1/games` +
    `?select=id,title,platform,region,cover,description,` +
    `offers:offers(store,price,currency,region,url)` +
    `&order=title`;

  try {
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Supabase error ${res.status}`);
    }

    const data = await res.json();

    gamesData = data.map((g) => ({
      ...g,
      offers: g.offers || [],
    }));

    renderGames();
  } catch (err) {
    console.error("Failed to load games:", err);
    gamesListEl.innerHTML =
      "<p>Failed to load games from Supabase. Check URL / key.</p>";
  }
}

function renderGames() {
  const q = searchInput.value.trim().toLowerCase();
  const platform = platformSelect.value;

  const filtered = gamesData.filter((g) => {
    const matchesQuery =
      !q ||
      g.title.toLowerCase().includes(q) ||
      (g.description && g.description.toLowerCase().includes(q));

    const matchesPlatform = !platform || g.platform === platform;

    return matchesQuery && matchesPlatform;
  });

  if (!filtered.length) {
    gamesListEl.innerHTML =
      "<p>No games found. Add more games in Supabase or change your search.</p>";
    return;
  }

  const cards = filtered.map((g) => gameToCardHtml(g)).join("");
  gamesListEl.innerHTML = cards;
}

function gameToCardHtml(game) {
  const offers = game.offers || [];
  const sortedOffers = offers.slice().sort((a, b) => a.price - b.price);
  const best = sortedOffers[0];

  const offersHtml = sortedOffers
    .map(
      (o) => `
      <div class="offer-row">
        <div class="offer-left">
          <span class="offer-store">${o.store}</span>
          <span class="offer-region">${o.region || "Global"}</span>
        </div>
        <div class="offer-actions">
          <span style="margin-right:0.4rem;">${o.price.toFixed(2)} ${
        o.currency || ""
      }</span>
          <a href="${o.url}" target="_blank" rel="noopener noreferrer">
            Go to store
          </a>
        </div>
      </div>
    `
    )
    .join("");

  return `
    <article class="game-card">
      <div class="game-cover">
        ${
          game.cover
            ? `<img src="${game.cover}" alt="${game.title} cover" />`
            : ""
        }
      </div>
      <div class="game-body">
        <h2 class="game-title">${game.title}</h2>
        <div class="game-meta">
          ${game.platform || ""} · ${game.region || "Global"}
        </div>
        ${
          best
            ? `<div class="best-offer">From <span>${best.price.toFixed(
                2
              )} ${best.currency || ""}</span> at ${best.store}</div>`
            : `<div class="best-offer">No offers yet</div>`
        }
        <div class="offers-list">
          ${offersHtml || "<small>No offers in database yet.</small>"}
        </div>
      </div>
    </article>
  `;
}

// Events
searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  renderGames();
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    renderGames();
  }
});

platformSelect.addEventListener("change", () => {
  renderGames();
});

// Initial load
loadGames();
