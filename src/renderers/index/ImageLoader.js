const ImageLoader = {
    loadImage(src) {
        return new Promise((resolve, reject) => {
            let i = new Image();
            i.onload = () => {
                resolve(i);
            };
            i.onerror = reject;
            i.src = src;
        });
    }
};

export default ImageLoader;