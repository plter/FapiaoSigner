/**
 * The preload script runs before `index.html` is loaded
 * in the renderer. It has access to web APIs as well as
 * Electron's renderer process modules and some polyfilled
 * Node.js functions.
 *
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */

const electron = require("electron");
const node_fs = require("fs");
const node_path = require("path");

electron.contextBridge.exposeInMainWorld("envapi", {
    node_fs,
    node_path,
    dialog: {
        async showSaveDialog(options) {
            return await electron.ipcRenderer.invoke("showSaveDialog", options);
        },

        async showOpenDialog(options) {
            return await electron.ipcRenderer.invoke("showOpenDialog", options);
        }
    }
})
