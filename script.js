const csvUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfl8TNh6F4kAOHluwB6HK3WZ1VCYwgH4gQhz0dxM7rXz7rWbqys3WpMG77ctkuFsMxNIhSgqBkzz6q/pub?output=csv";
const scriptAppUrl = "https://script.google.com/macros/s/AKfycbywWAm_yt2GR9ryDfGzkwgAxXgGKzj1UOBZ1i5fjZAr6YSCkq7gLgtIiuK8qSARDN3b/exec";

let allData = [];
let currentSort = { column: null, asc: true };

const loader = document.getElementById("loader");
const infoBar = document.getElementById("infoBar");

// Chargement initial
fetch(csvUrl)
  .then(res => res.text())
  .then(csv => {
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    // On ajoute un ID de ligne original pour chaque item afin de ne pas se tromper lors de la modif
    allData = parsed.data.map((item, index) => ({
      ...item,
      originalRow: index + 2 // +2 car la ligne 1 est l'entête dans Sheets
    }));

    initFilter();
    filterData();
    loader.style.display = "none";
  });

// Affichage de la table
function display(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach((item) => {
    let produitsHTML = "";
    if (item["PRODUITS"]) {
      produitsHTML = item["PRODUITS"]
        .split("\n")
        .map(p => `<span class="badge">${p.trim()}</span>`)
        .join(" ");
    }

    const contact = item["CONTACT INSPECTEUR"]
      ? item["CONTACT INSPECTEUR"].replace(/\n/g, "<br>")
      : "";

    // On stocke l'index de l'élément dans allData pour la fonction edit
    const dataIndex = allData.indexOf(item);

    tbody.innerHTML += `
      <tr>
        <td>${item["COMPAGNIES"] || ""}</td>
        <td>${produitsHTML}</td>
        <td><a href="${item["LIENS"]}" target="_blank" class="btn-link">Accéder</a></td>
        <td>${contact}</td>
        <td>
          <button class="btn-edit" onclick="editProduits(${dataIndex})">Modifier</button>
        </td>
      </tr>
    `;
  });

  infoBar.innerText = `${data.length} résultat(s)`;
}

// Logique de modification
function editProduits(index) {
  const item = allData[index];
  let currentProduits = item["PRODUITS"] || "";

  let updated = prompt(
    "Modifier les produits (séparez par des virgules) :",
    currentProduits.replace(/\n/g, ", ")
  );

  if (updated !== null) {
    // Formater pour remettre en sauts de ligne
    let formatted = updated.split(",").map(p => p.trim()).filter(p => p !== "").join("\n");

    // Mise à jour visuelle immédiate
    allData[index]["PRODUITS"] = formatted;
    filterData();

    // Envoi au Google Sheet
    fetch(scriptAppUrl, {
      method: "POST",
      mode: "no-cors", // Nécessaire pour éviter les blocages CORS avec Google Apps Script
      cache: "no-cache",
      body: JSON.stringify({
        row: item.originalRow,
        produits: formatted
      })
    })
    .then(() => {
      alert("✅ Modification enregistrée !\nNote : Le changement définitif peut mettre 2 à 5 min à apparaître après un rafraîchissement (cache Google).");
    })
    .catch(err => {
      alert("❌ Erreur de connexion au serveur.");
      console.error(err);
    });
  }
}

// Filtres et Recherche
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

// Remplir le menu déroulant des produits
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

// Écouteurs d'événements
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("filterProduit").addEventListener("change", filterData);

// Gestion du tri
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