/**
 * @param {string} content 
 * @returns {string}
 */
function importFile(content) {
  return "data:text/javascript;base64," + btoa(content);
}
const imports = {
  // BC = backwards compatibility of shaders
  //"playcanvas": "/playcanvas-engine/src/index.js",
  // Backwards compatibility of shaders
  //"playcanvas": "/playcanvas-engine-jsdoc/src/index.js", // BC
  "playcanvas": "./node_modules/playcanvas/build/playcanvas.dbg.mjs/index.js",
  //"playcanvas": "/playcanvas-engine-jsdoc/build/playcanvas.dbg.mjs/index.js", // BC

  // Lacking backwards compatibility of shaders, use/enable when everything is fixed!
  //"playcanvas": "/playcanvas-engine-jsdoc/build/playcanvas.mjs/index.js",
  //"playcanvas": "/playcanvas-engine-jsdoc/build/playcanvas.prf.mjs/index.js",
  //"playcanvas": "/playcanvas-engine-jsdoc/build/playcanvas.min.mjs/index.js",
};
const importmap = document.createElement("script");
importmap.type = "importmap";
importmap.textContent = JSON.stringify({imports});
document.body.appendChild(importmap);
