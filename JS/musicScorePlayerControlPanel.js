export class MusicScorePlayerControlPanel {

  pageNumber = 1;

  scale = 1.15;

  scales = [0.25, 0.33, 0.5, 0.67, 0.85, 1, 1.15, 1.5, 2, 3, 4];

  scalesReverted = null;

  isPlaying = false;

  pageTurnIndex = -1;

  pageTurns = null;

  pageTurnsReverted = null;

  musicScorePlayerPdf = null;

  previousPageButton = null;

  pageText = null;

  nextPageButton = null;

  zoomOutButton = null;

  zoomText = null;

  zoomInButton = null;

  playButton = null;

  stopButton = null;

  clockLabel = null;

  durationLabel = null;

  audio = null;

  constructor(controlPanelId, pageTurns, pdfUrl, audioUrl, musicScorePlayerPdf, from) {
    this.pageTurns = pageTurns;
    this.musicScorePlayerPdf = musicScorePlayerPdf;
    this.scalesReverted = [...this.scales].reverse();
    this.pageTurnsReverted = [...this.pageTurns].reverse();
    const controlPanel = document.getElementById(controlPanelId);
    const backLink = controlPanel.querySelector(".backLink");
    if (from != null) backLink.href += '#' + from;
    this.previousPageButton = controlPanel.querySelector('.previousPageButton');
    this.previousPageButton.addEventListener('click', this.previousPageButtonClick);
    this.pageText = controlPanel.querySelector('.pageText');
    this.pageText.addEventListener('input', this.onlyNumeric);
    this.pageText.addEventListener('change', this.pageTextChange);
    this.nextPageButton = controlPanel.querySelector('.nextPageButton');
    this.nextPageButton.addEventListener('click', this.nextPageButtonClick);
    this.zoomOutButton = controlPanel.querySelector('.zoomOutButton');
    this.zoomOutButton.addEventListener('click', this.zoomOutButtonClick);
    this.zoomText = controlPanel.querySelector('.zoomText');
    this.zoomText.addEventListener('input', this.onlyNumeric);
    this.zoomText.addEventListener('change', this.zoomTextChange);
    this.zoomInButton = controlPanel.querySelector('.zoomInButton');
    this.zoomInButton.addEventListener('click', this.zoomInButtonClick);
    this.playButton = controlPanel.querySelector('.playButton');
    this.playButton.addEventListener('click', this.playButtonClick);
    this.stopButton = controlPanel.querySelector('.stopButton');
    this.stopButton.addEventListener('click', this.stopButtonClick);
    this.clockLabel = controlPanel.querySelector('.clockLabel');
    this.durationLabel = controlPanel.querySelector('.durationLabel');
    this.audio = controlPanel.querySelector('.audio');
    this.audio.src = audioUrl;
    if (this.audio.readyState >= 1) this.audioLoadedMetadata();
    else this.audio.addEventListener('loadedmetadata', this.audioLoadedMetadata);
    this.audio.addEventListener('timeupdate', this.audioTimeUpdate);
    this.audio.addEventListener('ended', this.audioEnded);
    window.addEventListener('keydown', this.documentKeydown);
    window.addEventListener('wheel', (event) => { if (event.ctrlKey) { event.preventDefault(); } }, { passive: false });
    var setMargin = () => { document.getElementById(musicScorePlayerPdf.scoreCanvasId).style.marginTop = controlPanel.offsetHeight + "px"; };
    setMargin();
    window.addEventListener("resize", setMargin);
    const pdfLink = controlPanel.querySelector(".pdfLink");
    pdfLink.href = pdfUrl;
    const mp3Link = controlPanel.querySelector(".mp3Link");
    mp3Link.href = audioUrl;
  }

  previousPageButtonClick = () => {
    if (this.pageNumber == 1) return;
    this.pageNumber--;
    this.pageText.value = this.pageNumber;
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  pageTextChange = () => {
    this.pageNumber = Number(this.pageText.value);
    if (this.pageNumber < 1) this.pageNumber = 1;
    if (this.pageNumber > this.musicScorePlayerPdf.pdfjsLibObjects.pdf.numPages) this.pageNumber = this.musicScorePlayerPdf.pdfjsLibObjects.pdf.numPages;
    this.pageText.value = this.pageNumber;
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  nextPageButtonClick = () => {
    if (this.pageNumber == this.musicScorePlayerPdf.pdfjsLibObjects.pdf.numPages) return;
    this.pageNumber++;
    this.pageText.value = this.pageNumber;
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  zoomOutButtonClick = () => {
    const i = this.scalesReverted.findIndex(s => s < this.scale);
    if (i == -1) return;
    this.scale = this.scalesReverted[i];
    this.zoomText.value = Math.round(this.scale * 100);
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  zoomTextChange = () => {
    this.scale = Number(this.zoomText.value) / 100;
    const maxScale = Math.max(...this.scales);
    const minScale = Math.min(...this.scales);
    if (this.scale < minScale) this.scale = minScale;
    if (this.scale > maxScale) this.scale = maxScale;
    this.zoomText.value = Math.round(this.scale * 100);
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  zoomInButtonClick = () => {
    const i = this.scales.findIndex(s => s > this.scale);
    if (i == -1) return;
    this.scale = this.scales[i];
    this.zoomText.value = Math.round(this.scale * 100);
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
  }

  playButtonClick = () => {
    if (!this.isPlaying) {
      if (this.audio.currentTime == 0 && this.musicScorePlayerPdf.renderedPageNumber != 1) {
        this.pageNumber = 1;
        this.pageText.value = 1;
        this.musicScorePlayerPdf.renderPage(1, this.scale);
      }
      this.audio.play();
      this.playButton.textContent = '⏸';
      this.isPlaying = true;
    }
    else {
      this.audio.pause();
      this.playButton.textContent = '▶';
      this.isPlaying = false;
    }
  }

  stopButtonClick = () => {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.playButton.textContent = '▶';
    this.isPlaying = false;
    this.pageTurnIndex = -1;
    this.audioTimeUpdate();
  }

  audioLoadedMetadata = () => {
    this.durationLabel.innerText = this.formatTime(this.audio.duration);
    this.audioTimeUpdate();
  }

  audioTimeUpdate = () => {
    this.clockLabelUpdate(this.audio.currentTime);
    this.turnPage(this.audio.currentTime);
  }

  audioEnded = () => {
    this.audio.currentTime = 0;
    this.playButton.textContent = "▶";
    this.isPlaying = false;
    this.pageTurnIndex = -1;
    this.audioTimeUpdate();
  }

  onlyNumeric = (event) => {
    event.target.value = event.target.value.replace(/[^0-9]/g, '');
  }

  documentKeydown = (event) => {
    if (event.key.toUpperCase() === 'U') { if (event.repeat) return; this.previousPageButtonClick(); }
    else if (event.key.toUpperCase() === 'D') { if (event.repeat) return; this.nextPageButtonClick(); }
    else if (event.key === '+') { if (event.repeat) return; this.zoomInButtonClick(); }
    else if (event.key === '-') { if (event.repeat) return; this.zoomOutButtonClick(); }
    else if (event.key.toUpperCase() === 'P') { if (event.repeat) return; this.playButtonClick(); }
    else if (event.key.toUpperCase() === 'S') { if (event.repeat) return; this.stopButtonClick(); }
    else if (event.key.toUpperCase() === 'F') { if (event.repeat) return; this.playbackSkip(5); }
    else if (event.key.toUpperCase() === 'B') { if (event.repeat) return; this.playbackSkip(-5); }
    else if (event.key.toUpperCase() === 'T') { if (event.repeat) return; this.logCurrentTime(); }
    else return;
    event.preventDefault();
    event.stopPropagation();
  }

  clockLabelUpdate(time) {
    this.clockLabel.innerText = this.formatTime(time);
  }

  turnPage(time) {
    const nextPageTurn = this.pageTurns[this.pageTurnIndex + 1];
    if (!nextPageTurn) return;
    if (time < nextPageTurn.time) return;
    this.pageNumber = nextPageTurn.pageNumber;
    if (this.pageNumber < 1) this.pageNumber = 1;
    if (this.pageNumber > this.musicScorePlayerPdf.pdfjsLibObjects.pdf.numPages) this.pageNumber = this.musicScorePlayerPdf.pdfjsLibObjects.pdf.numPages;
    this.pageText.value = this.pageNumber;
    this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
    this.scrollToTop();
    this.pageTurnIndex++;
  }

  formatTime(time) {
    const timeMinutes = Math.trunc(time / 60);
    const timeSeconds = Math.trunc(time) % 60;
    return `${timeMinutes < 10 ? '0' : ''}${timeMinutes}:${timeSeconds < 10 ? '0' : ''}${timeSeconds}`;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  playbackSkip(seconds) {
    if (!this.isPlaying) return;
    const nextTime = this.audio.currentTime + seconds;
    if (nextTime > this.audio.duration) return;
    if (nextTime < 0) return;
    if (!this.pageTurns || this.pageTurns.length == 0) { this.audio.currentTime = nextTime; return; }
    const i = this.pageTurnsReverted.findIndex(pt => nextTime >= pt.time);
    this.pageTurnIndex = i > -1 ? this.pageTurns.length - 1 - i : -1;
    this.pageNumber = i > -1 ? this.pageTurnsReverted[i].pageNumber : 1;
    this.pageText.value = this.pageNumber;
    this.clockLabelUpdate(nextTime);
    if (this.musicScorePlayerPdf.renderedPageNumber != this.pageNumber) {
      this.musicScorePlayerPdf.renderPage(this.pageNumber, this.scale);
      this.scrollToTop();
    }
    this.audio.currentTime = nextTime;
  }

  logCurrentTime() {
    console.log(this.audio.currentTime);
  }


}