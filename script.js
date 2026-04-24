const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQfl8TNh6F4kAOHluwB6HK3WZ1VCYwgH4gQhz0dxM7rXz7rWbqys3WpMG77ctkuFsMxNIhSgqBkzz6q/pub?output=csv";

let allData = [];

fetch(url)
  .then(res => res.text())
  .then(csv => {

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    allData = parsed.data;

    display(allData);
  });

function display(data) {
  const container = document.getElementById("list");
  container.innerHTML = "";

  data.forEach(item => {

    const nom = item["COMPAGNIES"] || "Nom inconnu";
    const produits = item["PRODUITS"]
      ? item["PRODUITS"].replace(/\n/g, "<br>")
      : "Aucun produit";

    const lien = item["LIENS"] || "#";

    const contact = item["CONTACT INSPECTEUR"]
      ? item["CONTACT INSPECTEUR"].replace(/\n/g, "<br>")
      : "";

    container.innerHTML += `
      <div class="card">
        <h3>${nom}</h3>
        <p><b>Produits :</b><br>${produits}</p>
        <p><a href="${lien}" target="_blank">Accéder</a></p>
        <p>${contact}</p>
      </div>
    `;
  });
}

//
// 🔍 RECHERCHE (fonctionnelle)
//
document.getElementById("search").addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  const filtered = allData.filter(item =>
    (item["COMPAGNIES"] || "").toLowerCase().includes(value) ||
    (item["PRODUITS"] || "").toLowerCase().includes(value)
  );

  display(filtered);
});