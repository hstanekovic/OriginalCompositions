import * as pdfjsLib from './pdf.js';

export class MusicScorePlayerPdf {

    pdfjsLibObjects = { pdf: null, page: null, renderTask: null };

    documentUrl = null;

    scoreCanvasId = null;

    renderedPageNumber = null;

    constructor(workerSourceUrl, documentUrl, scoreCanvasId) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSourceUrl;
        this.documentUrl = documentUrl;
        this.scoreCanvasId = scoreCanvasId;
        const loadingTask = pdfjsLib.getDocument(documentUrl);
        loadingTask.promise.then(pdf => {
            this.pdfjsLibObjects.pdf = pdf;
            this.renderPage(1, 1.15);
        });
    }

    renderPage(pageNumber, scale) { 
        const pagePromise = this.pdfjsLibObjects.pdf.getPage(pageNumber);
        pagePromise.then(page => {
            this.pdfjsLibObjects.page = page;
            const viewport = page.getViewport({ scale: scale });
            const canvas = document.getElementById(this.scoreCanvasId);
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const canvasContext = canvas.getContext('2d');
            const renderContext = {
                canvasContext: canvasContext,
                viewport: viewport
            };
            if (this.pdfjsLibObjects.renderTask != null) this.pdfjsLibObjects.renderTask.cancel();
            this.pdfjsLibObjects.renderTask = page.render(renderContext);
            this.pdfjsLibObjects.renderTask.promise.then(() => {
                this.renderedPageNumber = pageNumber;
                this.pdfjsLibObjects.renderTask = null;
            });
        });
    }
}

