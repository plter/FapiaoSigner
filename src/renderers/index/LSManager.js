const LSManager = {
    set signX(v) {
        localStorage.setItem("signX", v + "");
    },

    get signX() {
        return parseFloat(localStorage.getItem("signX")) || 0;
    },

    set signY(v) {
        localStorage.setItem("signY", v + "");
    },

    get signY() {
        return parseFloat(localStorage.getItem("signY")) || 0;
    },

    set signScale(v) {
        localStorage.setItem("signScale", v + "");
    },

    get signScale() {
        return parseFloat(localStorage.getItem("signScale")) || 1;
    },

    set signFilePath(v) {
        localStorage.setItem("signFilePath", v);
    },

    get signFilePath() {
        return localStorage.getItem("signFilePath") || "";
    }
};

export default LSManager;