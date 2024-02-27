import "../../extensions/CanvasRenderingContext2DExtension"
import ImageLoader from "./ImageLoader";
import LSManager from "./LSManager";
import {PDFDocument} from "pdf-lib";

const {pdfjsLib} = globalThis;

pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdfjs4/pdf.worker.min.mjs';

new Vue({
    el: "#root",
    data: {
        signX: LSManager.signX,
        signY: LSManager.signY,
        signScale: LSManager.signScale,
        selectedSignPath: LSManager.signFilePath
    },

    mounted() {
        this.frames = 0;
        this.playerContext2d = this.$refs.player.getContext("2d");
        this.pdfCanvas = document.createElement("canvas");
        this.pdfCanvas.width = 800;
        this.pdfCanvas.height = 600;
        this.pdfCanvasContext2d = this.pdfCanvas.getContext("2d");
        this.previewSignCanvas = this.$refs.signPreview;
        this.previewSignCanvasContext2d = this.previewSignCanvas.getContext("2d");
        this.signRendererCanvas = document.createElement("canvas");
        this.signRendererCanvasContext2d = this.signRendererCanvas.getContext("2d");

        this.frameLoop();

        this.loadSignFile(this.selectedSignPath);
    },

    methods: {
        btnSignClicked(e) {
            this.signPdf();
        },

        previewRenderResult() {
            this.signRendererCanvas.width = this.pdfCanvas.width;
            this.signRendererCanvas.height = this.pdfCanvas.height;
            this.signRendererCanvasContext2d.clearRect(0, 0, this.signRendererCanvas.width, this.signRendererCanvas.height);
            this.signRendererCanvasContext2d.drawImage(this.pdfCanvas, 0, 0);
            if (this.selectedSign) {
                let dh = this.selectedSign.height * this.signScale;
                this.signRendererCanvasContext2d.drawImage(
                    this.selectedSign, this.signX, this.pdfCanvas.height - dh - this.signY,
                    this.selectedSign.width * this.signScale, dh
                );
            }

            this.playerContext2d.drawImageToCenter(this.signRendererCanvas);
        },

        syncPlayerCanvasSize() {
            let c2d = this.playerContext2d;
            if (c2d.canvas.width !== c2d.canvas.clientWidth) {
                c2d.canvas.width = c2d.canvas.clientWidth;
            }
            if (c2d.canvas.height !== c2d.canvas.clientHeight) {
                c2d.canvas.height = c2d.canvas.clientHeight;
            }
        },

        frameLoop() {

            this.frames++;
            if (this.frames % 10 === 0) {
                this.syncPlayerCanvasSize();
                this.previewRenderResult();
            }

            requestAnimationFrame(this.frameLoop);
        },

        async signPdf() {
            if (this.selectedPdfPath && this.selectedSignPath) {

                let result = await envapi.dialog.showSaveDialog({defaultPath: "signed_" + envapi.node_path.basename(this.selectedPdfPath)});

                if (!result.canceled) {
                    let pdfBytes = await fetch(this.selectedPdfPath).then(res => res.arrayBuffer());
                    let pdfDoc = await PDFDocument.load(pdfBytes);

                    let signImageBytes = await fetch(this.selectedSignPath).then((res) => res.arrayBuffer());
                    let signImage = await pdfDoc.embedPng(signImageBytes);
                    let page = pdfDoc.getPages()[0];

                    let pngDims = signImage.scale(parseFloat(this.signScale));
                    page.drawImage(signImage, {
                        x: parseFloat(this.signX),
                        y: parseFloat(this.signY),
                        width: parseFloat(pngDims.width),
                        height: parseFloat(pngDims.height)
                    });
                    const pdfOutputBytes = await pdfDoc.save();
                    envapi.node_fs.writeFile(result.filePath, pdfOutputBytes, function () {
                    });
                }
            } else {
                alert("请先选择PDF及印鉴");
            }
        },


        async viewPdf(path) {
            let pdf = await pdfjsLib.getDocument(path).promise;
            this.selectedPage = await pdf.getPage(1);
            await this.renderPdfCanvas(this.selectedPage);
        },

        async renderPdfCanvas(page) {
            let viewport = page.getViewport({scale: 1});
            this.pdfCanvas.width = viewport.width;
            this.pdfCanvas.height = viewport.height;
            await page.render({
                canvasContext: this.pdfCanvasContext2d,
                viewport: viewport
            });
        },

        async btnImportClicked(e) {
            let r = await envapi.dialog.showOpenDialog({
                filters: [
                    {name: 'PDF', extensions: ['pdf']},
                ]
            });

            if (r.filePaths && r.filePaths.length) {
                this.selectedPdfPath = r.filePaths[0];
                await this.viewPdf(this.selectedPdfPath);
            }
        },

        previewSign(img) {
            this.previewSignCanvasContext2d.drawImageToCenter(img);
        },

        /**
         * No effects if filePath is undefined
         *
         * @param {*} filePath
         * @returns
         */
        async loadSignFile(filePath) {
            if (!filePath) {
                return;
            }
            this.selectedSign = await ImageLoader.loadImage(filePath);
            this.previewSign(this.selectedSign);
        },

        async btnChooseSignClicked(e) {
            let r = await envapi.dialog.showOpenDialog({
                filters: [
                    {name: 'PNG', extensions: ['png']},
                ]
            });
            if (r.filePaths && r.filePaths.length) {
                this.selectedSignPath = r.filePaths[0];
                await this.loadSignFile(this.selectedSignPath);
            }
        }
    },

    watch: {
        signX(v) {
            LSManager.signX = v;
        },

        signY(v) {
            LSManager.signY = v;
        },

        signScale(v) {
            LSManager.signScale = v;
        },

        selectedSignPath(v) {
            LSManager.signFilePath = v;
        }
    }
});
