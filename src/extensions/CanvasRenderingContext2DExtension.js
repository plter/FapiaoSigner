CanvasRenderingContext2D.prototype.drawImageToCenter = function (imageSource) {
    let dw = this.canvas.width;
    let dh = imageSource.height * dw / imageSource.width;
    if (dh > this.canvas.height) {
        dh = this.canvas.height;
        dw = imageSource.width * dh / imageSource.height;
    }
    let dx = (this.canvas.width - dw) / 2;
    let dy = (this.canvas.height - dh) / 2;
    this.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawImage(imageSource, dx, dy, dw, dh);
};