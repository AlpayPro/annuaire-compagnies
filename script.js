const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSmAt-CpDtBs68A3I_D9V2OMkFgTlXKM75uSNmI1X7XaDAgZzDVuPTRczMwVz2wdiM5TFL3N3JNAU0/pub?output=csv";

let allData = [];
let currentSort = { column: null, asc: true };

const loader = document.getElementById("loader");
const infoBar = document.getElementById("infoBar");

// 1. Chargement initial des données
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

// 2. Affichage du tableau avec logos MAXI format
function display(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    // Badges produits
    let produitsHTML = "";
    if (item["PRODUITS"]) {
      produitsHTML = item["PRODUITS"]
        .split("\n")
        .map(p => `<span class="badge">${p.trim()}</span>`)
        .join(" ");
    }

    // Contacts
    const contact = item["CONTACT INSPECTEUR"]
      ? item["CONTACT INSPECTEUR"].replace(/\n/g, "<br>")
      : "";

    // Préparation du logo
    const companyName = item["COMPAGNIES"] || "";
    // On remplace les espaces par des underscores pour correspondre à tes fichiers (ex: add_value.png)
    const logoFileName = companyName.toLowerCase().trim().replace(/\s+/g, '_') + ".png";
    const logoPath = `logos/${logoFileName}`;

    tbody.innerHTML += `
      <tr>
        <td style="display: flex; align-items: center; gap: 15px; padding: 12px 8px;">
          <div style="width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; background: white; border-radius: 8px; border: 1px solid #eee; flex-shrink: 0; padding: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
            <img src="${logoPath}" 
                 alt="" 
                 style="max-width: 100%; max-height: 100%; object-fit: contain;"
                 onerror="this.parentElement.style.display='none'">
          </div>
          <strong style="font-size: 15px; color: #333;">${companyName}</strong>
        </td>
        <td>${produitsHTML}</td>
        <td><a href="${item["LIENS"]}" target="_blank" class="btn-link">Accéder</a></td>
        <td><div style="font-size: 13px;">${contact}</div></td>
      </tr>
    `;
  });

  infoBar.innerText = `${data.length} résultat(s)`;
}

// 3. Recherche et Filtres
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

  if (currentSort.column) {
    filtered.sort((a, b) => {
      let valA = a[currentSort.column] || "";
      let valB = b[currentSort.column] || "";
      return currentSort.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }

  display(filtered);
}

// 4. Liste déroulante des produits
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

// 5. Tri et Événements
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("filterProduit").addEventListener("change", filterData);

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