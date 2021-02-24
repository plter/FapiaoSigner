import ImageLoader from "./ImageLoader";
import "../../extensions/CanvasRenderingContext2DExtension"

pdfjsLib.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.js';


const Main = {


    async renderPdfCanvas(page) {
        let viewport = page.getViewport({scale: 1});
        this.pdfCanvas.width = viewport.width;
        this.pdfCanvas.height = viewport.height;
        await page.render({
            canvasContext: this.pdfCanvasContext2d,
            viewport: viewport
        });
    },

    async viewPdf(path) {
        let pdf = await pdfjsLib.getDocument(path).promise;
        this.selectedPage = await pdf.getPage(1);
        await this.renderPdfCanvas(this.selectedPage, this.selectedSign);
    },

    addListeners() {
        jQuery("#btn-import").click(async () => {
            let r = await electron.remote.dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
                filters: [
                    {name: 'PDF', extensions: ['pdf']},
                ]
            });
            if (r.filePaths && r.filePaths.length) {
                this.selectedPdfPath = r.filePaths[0];
                await this.viewPdf(this.selectedPdfPath);
            }
        });
        jQuery("#btn-choose-sign").click(async () => {
            let r = await electron.remote.dialog.showOpenDialog(electron.remote.getCurrentWindow(), {
                filters: [
                    {name: 'PNG', extensions: ['png']},
                ]
            });
            if (r.filePaths && r.filePaths.length) {
                this.selectedSignPath = r.filePaths[0];

                this.selectedSign = await ImageLoader.loadImage(this.selectedSignPath);
                this.previewSign(this.selectedSign);
            }
        });
    },

    previewSign(img) {
        this.previewSignCanvasContext2d.drawImageToCenter(img);
    },

    initVue() {
        this.vueapp = new Vue({
            el: "#root",
            data: {
                signX: 0,
                signY: 0,
                signScale: 1
            },
            methods: {
                btnSignClicked() {
                    Main.signPdf();
                }
            }
        });
    },

    initProperties() {
        this.initVue();

        this.frames = 0;
        this.playerContext2d = document.getElementById("player").getContext("2d");
        this.pdfCanvas = document.createElement("canvas");
        this.pdfCanvasContext2d = this.pdfCanvas.getContext("2d");
        this.previewSignCanvas = document.getElementById("sign-preview");
        this.previewSignCanvasContext2d = this.previewSignCanvas.getContext("2d");
        this.signRendererCanvas = document.createElement("canvas");
        this.signRendererCanvasContext2d = this.signRendererCanvas.getContext("2d");
    },

    previewRenderResult() {
        this.signRendererCanvas.width = this.pdfCanvas.width;
        this.signRendererCanvas.height = this.pdfCanvas.height;
        this.signRendererCanvasContext2d.clearRect(0, 0, this.signRendererCanvas.width, this.signRendererCanvas.height);
        this.signRendererCanvasContext2d.drawImage(this.pdfCanvas, 0, 0);
        if (this.selectedSign) {
            let dh = this.selectedSign.height * this.vueapp.signScale;
            this.signRendererCanvasContext2d.drawImage(
                this.selectedSign, this.vueapp.signX, this.pdfCanvas.height - dh - this.vueapp.signY,
                this.selectedSign.width * this.vueapp.signScale, dh
            );
        }

        this.playerContext2d.drawImageToCenter(this.signRendererCanvas);
    },

    syncPlayerCanvasSize() {
        let c2d = Main.playerContext2d;
        if (c2d.canvas.width !== c2d.canvas.clientWidth) {
            c2d.canvas.width = c2d.canvas.clientWidth;
        }
        if (c2d.canvas.height !== c2d.canvas.clientHeight) {
            c2d.canvas.height = c2d.canvas.clientHeight;
        }
    },

    async signPdf() {
        if (this.selectedPdfPath && this.selectedSignPath) {

            let result = await electron.remote.dialog.showSaveDialog(electron.remote.getCurrentWindow(), {defaultPath: "signed_" + node_path.basename(this.selectedPdfPath)});

            if (!result.canceled) {
                let pdfBytes = await fetch(this.selectedPdfPath).then(res => res.arrayBuffer());
                let pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

                let signImageBytes = await fetch(this.selectedSignPath).then((res) => res.arrayBuffer());
                let signImage = await pdfDoc.embedPng(signImageBytes);
                let page = pdfDoc.getPages()[0];

                let pngDims = signImage.scale(parseFloat(this.vueapp.signScale));
                page.drawImage(signImage, {
                    x: parseFloat(this.vueapp.signX),
                    y: parseFloat(this.vueapp.signY),
                    width: parseFloat(pngDims.width),
                    height: parseFloat(pngDims.height)
                });
                const pdfOutputBytes = await pdfDoc.save();
                node_fs.writeFile(result.filePath, pdfOutputBytes, function () {
                });
            }
        } else {
            alert("请先选择PDF及印鉴");
        }
    },

    frameLoop() {
        requestAnimationFrame(Main.frameLoop);

        Main.frames++;
        if (Main.frames % 10 === 0) {
            Main.syncPlayerCanvasSize();
            Main.previewRenderResult();
        }
    },

    init() {
        this.initProperties();
        this.addListeners();
        this.frameLoop();
    }
};


Main.init();

