const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfl8TNh6F4kAOHluwB6HK3WZ1VCYwgH4gQhz0dxM7rXz7rWbqys3WpMG77ctkuFsMxNIhSgqBkzz6q/pub?output=csv";

let allData = [];
let currentSort = { column: null, asc: true };

const loader = document.getElementById("loader");
const infoBar = document.getElementById("infoBar");

loader.style.display = "block";

fetch(url)
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

function display(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  data.forEach(item => {

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

    tbody.innerHTML += `
      <tr>
        <td>${item["COMPAGNIES"] || ""}</td>
        <td>${produitsHTML}</td>
        <td><a href="${item["LIENS"]}" target="_blank">Accéder</a></td>
        <td>${contact}</td>
      </tr>
    `;
  });

  // 📈 compteur
  infoBar.innerText = `${data.length} résultat(s)`;
}

//
// 🔍 FILTRE GLOBAL
//
function filterData() {
  const searchValue = document.getElementById("search").value.toLowerCase();
  const produitValue = document.getElementById("filterProduit").value;

  let filtered = allData.filter(item => {

    const nom = (item["COMPAGNIES"] || "").toLowerCase();
    const produits = (item["PRODUITS"] || "").toLowerCase();

    const matchSearch =
      nom.includes(searchValue) ||
      produits.includes(searchValue);

    const matchProduit =
      !produitValue ||
      (item["PRODUITS"] && item["PRODUITS"].includes(produitValue));

    return matchSearch && matchProduit;
  });

  // 📊 TRI
  if (currentSort.column) {
    filtered.sort((a, b) => {
      let valA = a[currentSort.column] || "";
      let valB = b[currentSort.column] || "";

      return currentSort.asc
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });
  }

  display(filtered);
}

//
// 🎯 FILTRE PRODUIT
//
function initFilter() {
  const select = document.getElementById("filterProduit");

  let produitsSet = new Set();

  allData.forEach(item => {
    if (item["PRODUITS"]) {
      item["PRODUITS"].split("\n").forEach(p => {
        produitsSet.add(p.trim());
      });
    }
  });

  produitsSet.forEach(p => {
    if (p) {
      select.innerHTML += `<option value="${p}">${p}</option>`;
    }
  });
}

//
// 🔍 EVENTS
//
document.getElementById("search").addEventListener("input", filterData);
document.getElementById("filterProduit").addEventListener("change", filterData);

//
// 📊 TRI + FLÈCHES
//
document.querySelectorAll("th").forEach(th => {
  th.addEventListener("click", () => {

    const col = th.dataset.col;

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
    th.classList.remove("active");
    th.innerHTML = th.innerHTML.replace(" ↑", "").replace(" ↓", "").replace(" ⬍", "");
    th.innerHTML += " ⬍";
  });

  const activeTh = document.querySelector(`th[data-col="${currentSort.column}"]`);

  if (activeTh) {
    activeTh.classList.add("active");
    activeTh.innerHTML = activeTh.innerHTML.replace(" ⬍", "") +
      (currentSort.asc ? " ↑" : " ↓");
  }
}