/**
 * @param {string} content 
 * @returns {string}
 */
function importFile(content) {
  return "data:text/javascript;base64," + btoa(content);
}
const imports = {
  "playcanvas": "/playcanvas-engine/src/index.js",
};
const importmap = document.createElement("script");
importmap.type = "importmap";
importmap.textContent = JSON.stringify({imports});
document.body.appendChild(importmap);
