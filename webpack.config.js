const path = require("path");

module.exports = {
    entry: path.join(__dirname, "src", "renderers", "index", "Main.js"),
    output: {
        path: path.join(__dirname, "outputs"),
        filename: "renderer.js"
    }
};