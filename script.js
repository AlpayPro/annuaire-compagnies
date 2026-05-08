const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfl8TNh6F4kAOHluwB6HK3WZ1VCYwgH4gQhz0dxM7rXz7rWbqys3WpMG77ctkuFsMxNIhSgqBkzz6q/pub?output=csv";

let allData = [];
let currentSort = { column: null, asc: true };

const loader = document.getElementById("loader");
const infoBar = document.getElementById("infoBar");

// 1. Chargement initial des données depuis Google Sheets
fetch(csvUrl)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    allData = parsed.data;

    initFilter();
    filterData();
    loader.style.display = "none";
  });

// 2. Fonction d'affichage principale (avec logos agrandis et gestion des noms de fichiers)
function display(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    // Gestion des badges pour les produits
    let produitsHTML = "";
    if (item["PRODUITS"]) {
      produitsHTML = item["PRODUITS"]
        .split("\n")
        .map(p => `<span class="badge">${p.trim()}</span>`)
        .join(" ");
    }

    // Gestion du formatage des contacts
    const contact = item["CONTACT INSPECTEUR"]
      ? item["CONTACT INSPECTEUR"].replace(/\n/g, "<br>")
      : "";

    // --- LOGIQUE DES LOGOS ---
    const companyName = item["COMPAGNIES"] || "";
    
    // On transforme "ADD VALUE" en "add_value.png" pour correspondre à tes fichiers
    const logoFileName = companyName.toLowerCase().trim().replace(/\s+/g, '_') + ".png";
    const logoPath = `logos/${logoFileName}`;

    tbody.innerHTML += `
      <tr>
        <td style="display: flex; align-items: center; gap: 20px; padding: 15px 10px;">
          <div style="width: 65px; height: 65px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; border: 1px solid #eee; flex-shrink: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
            <img src="${logoPath}" 
                 alt="" 
                 style="width: 60px; height: 60px; object-fit: contain;"
                 onerror="this.parentElement.style.display='none'">
          </div>
          <strong style="font-size: 16px; color: #333;">${companyName}</strong>
        </td>
        <td>${produitsHTML}</td>
        <td><a href="${item["LIENS"]}" target="_blank" class="btn-link">Accéder</a></td>
        <td>${contact}</td>
      </tr>
    `;
  });

  infoBar.innerText = `${data.length} résultat(s)`;
}

// 3. Filtres et Recherche
function filterData() {
  const searchValue = document.getElementById("search").value.toLowerCase();
  const produitValue = document.getElementById("filterProduit").value;

  let filtered = allData.filter(item => {
    const nom = (item["COMPAGNIES"] || "").toLowerCase();
    const produits = (item["PRODUITS"] || "").toLowerCase();

    const matchSearch = nom.includes(searchValue) || produits.includes(searchValue);
    const matchProduit = !produitValue || (item["PRODUITS"] && item["PRODUITS"].includes(produitValue));

    return matchSearch && matchProduit;
  });

  // Gestion du tri
  if (currentSort.column) {
    filtered.sort((a, b) => {
      let valA = a[currentSort.column] || "";
      let valB = b[currentSort.column] || "";
      return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  display(filtered);
}

// 4. Initialisation du menu déroulant des produits
function initFilter() {
  const select = document.getElementById("filterProduit");
  let produitsSet = new Set();

  allData.forEach(item => {
    if (item["PRODUITS"]) {
      item["PRODUITS"].split("\n").forEach(p => {
        if(p.trim()) produitsSet.add(p.trim());
      });
    }
  });

  const sortedProduits = Array.from(produitsSet).sort();
  sortedProduits.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p;
    opt.textContent = p;
    select.appendChild(opt);
  });
}

// 5. Écouteurs d'événements
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("filterProduit").addEventListener("change", filterData);

// 6. Gestion du tri des colonnes
document.querySelectorAll("th").forEach(th => {
  th.addEventListener("click", () => {
    const col = th.dataset.col;
    if (!col) return;

    if (currentSort.column === col) {
      currentSort.asc = !currentSort.asc;
    } else {
      currentSort.column = col;
      currentSort.asc = true;
    }
    updateSortUI();
    filterData();
  });
});

// 7. Mise à jour visuelle des flèches de tri
function updateSortUI() {
  document.querySelectorAll("th").forEach(th => {
    if (!th.dataset.col) return;
    th.innerHTML = th.dataset.col === "CONTACT INSPECTEUR" ? "CONTACT ⬍" : th.dataset.col + " ⬍";
    if (th.dataset.col === "LIENS") th.innerHTML = "LIEN ⬍";
    if (th.dataset.col === "COMPAGNIES") th.innerHTML = "NOM ⬍";
  });

  const activeTh = document.querySelector(`th[data-col="${currentSort.column}"]`);
  if (activeTh) {
    activeTh.innerHTML = activeTh.innerHTML.replace(" ⬍", currentSort.asc ? " ↑" : " ↓");
  }
}