class ZenMediaController {
  _currentMediaController = null;
  _currentBrowser = null;
  _mediaUpdateInterval = null;

  mediaTitle = null;
  mediaArtist = null;
  mediaControlBar = null;
  mediaServiceIcon = null;
  mediaServiceTitle = null;
  mediaProgressBar = null;
  mediaCurrentTime = null;
  mediaDuration = null;
  mediaFocusButton = null;
  mediaProgressBarContainer = null;

  supportedKeys = ['playpause', 'previoustrack', 'nexttrack'];

  init() {
    this.mediaTitle = document.querySelector('#zen-media-title');
    this.mediaArtist = document.querySelector('#zen-media-artist');
    this.mediaControlBar = document.querySelector('#zen-media-controls-toolbar');
    this.mediaServiceIcon = document.querySelector('#zen-media-service-button > image');
    this.mediaServiceTitle = document.querySelector('#zen-media-service-title');
    this.mediaProgressBar = document.querySelector('#zen-media-progress-bar');
    this.mediaCurrentTime = document.querySelector('#zen-media-current-time');
    this.mediaDuration = document.querySelector('#zen-media-duration');
    this.mediaFocusButton = document.querySelector('#zen-media-focus-button');
    this.mediaProgressBarContainer = document.querySelector('#zen-media-progress-hbox');
  }

  /**
   * Deinitializes a media controller, removing all event listeners and resetting state.
   * @param {Object} mediaController - The media controller to deinitialize.
   */
  deinitMediaController(mediaController) {
    if (!mediaController) return;

    mediaController.onpositionstatechange = null;
    mediaController.onplaybackstatechange = null;
    mediaController.onsupportedkeyschange = null;
    mediaController.onmetadatachange = null;
    mediaController.ondeactivated = null;

    this._currentMediaController = null;
    this._currentBrowser = null;

    if (this._mediaUpdateInterval) {
      clearInterval(this._mediaUpdateInterval);
      this._mediaUpdateInterval = null;
    }

    this.mediaControlBar.setAttribute('hidden', 'true');
    this.mediaControlBar.removeAttribute('muted');
    this.mediaControlBar.classList.remove('playing');

    gZenUIManager.updateTabsToolbar();
  }

  /**
   * Sets up the media control UI with metadata and position state.
   * @param {Object} metadata - The media metadata (title, artist, etc.).
   * @param {Object} positionState - The position state (position, duration).
   */
  setupMediaControl(metadata, positionState) {
    if (!this.mediaControlBar.classList.contains('playing')) {
      this.mediaControlBar.classList.add('playing');
    }

    // Have it displayed as e.g. <white>youtube</white><grey>.com</grey>
    let host = this._currentBrowser._originalURI.displayHost;
    if (host.startsWith('www.')) host = host.slice(4);
    // note: we might have subdomains, so we need to split the host
    const [service, ...tld] = host.split('.');
    this.mediaServiceTitle.querySelector('.service').textContent = service;
    this.mediaServiceTitle.querySelector('.tld').textContent = '.' + tld.join('.');

    this.mediaServiceIcon.src = this._currentBrowser.mIconURL;
    this.mediaFocusButton.style.listStyleImage = `url(${this._currentBrowser.mIconURL})`;

    this.mediaControlBar.removeAttribute('hidden');
    this.mediaTitle.textContent = metadata.title || '';
    this.mediaArtist.textContent = metadata.artist || '';

    gZenUIManager.updateTabsToolbar();

    this._currentPosition = positionState.position;
    this._currentDuration = positionState.duration;
    this.updateMediaPosition();

    for (const key of this.supportedKeys) {
      const button = this.mediaControlBar.querySelector(`#zen-media-${key}-button`);
      button.disabled = !this._currentMediaController.supportedKeys.includes(key);
    }
  }

  /**
   * @param {Object} mediaController - The media controller to activate.
   * @param {Object} browser - The browser associated with the media controller.
   */
  activateMediaControls(mediaController, browser) {
    if (this._currentBrowser?.browserId === browser.browserId) return;
    else this._currentBrowser = browser;

    mediaController.onpositionstatechange = this.onPositionstateChange.bind(this);
    mediaController.onplaybackstatechange = this.onPlaybackstateChange.bind(this);
    mediaController.onsupportedkeyschange = this.onSupportedKeysChange.bind(this);
    mediaController.onmetadatachange = this.onMetadataChange.bind(this);
    mediaController.ondeactivated = this.onDeactivated.bind(this);

    if (this._currentMediaController === mediaController) return;
    else this.deinitMediaController(this._currentMediaController);

    this._currentMediaController = mediaController;

    const metadata = mediaController.getMetadata();
    const positionState = mediaController.getPositionState();

    this.setupMediaControl(metadata, positionState);
  }

  /**
   * @param {Event} event - The deactivation event.
   */
  onDeactivated(event) {
    if (event.target === this._currentMediaController) {
      this.deinitMediaController(event.target);
    }
  }

  /**
   * Updates playback state and UI based on changes.
   * @param {Event} event - The playback state change event.
   */
  onPlaybackstateChange(event) {
    this.mediaControlBar.classList.toggle('playing', event.target.isPlaying);
  }

  /**
   * Updates supported keys in the UI.
   * @param {Event} event - The supported keys change event.
   */
  onSupportedKeysChange(event) {
    for (const key of this.supportedKeys) {
      const button = this.mediaControlBar.querySelector(`#zen-media-${key}-button`);
      button.disabled = !event.target.supportedKeys.includes(key);
    }
  }

  /**
   * Updates position state and UI when the media position changes.
   * @param {Event} event - The position state change event.
   */
  onPositionstateChange(event) {
    if (event.target !== this._currentMediaController) return;

    this._currentPosition = event.position;
    this._currentDuration = event.duration;
    this.updateMediaPosition();
  }

  /**
   * Updates the media progress bar and time display.
   */
  updateMediaPosition() {
    if (this._mediaUpdateInterval) {
      clearInterval(this._mediaUpdateInterval);
      this._mediaUpdateInterval = null;
    }

    if (this._currentDuration >= 900_000) return this.mediaProgressBarContainer.setAttribute('hidden', 'true');
    else this.mediaProgressBarContainer.removeAttribute('hidden');

    this.mediaCurrentTime.textContent = this.formatSecondsToTime(this._currentPosition);
    this.mediaDuration.textContent = this.formatSecondsToTime(this._currentDuration);
    this.mediaProgressBar.value = (this._currentPosition / this._currentDuration) * 100;

    if (this._currentMediaController?.isPlaying) {
      this._mediaUpdateInterval = setInterval(() => {
        if (this._currentMediaController?.isPlaying) {
          this._currentPosition += 1;
          if (this._currentPosition > this._currentDuration) {
            this._currentPosition = this._currentDuration;
          }
          this.mediaCurrentTime.textContent = this.formatSecondsToTime(this._currentPosition);
          this.mediaProgressBar.value = (this._currentPosition / this._currentDuration) * 100;
        } else {
          clearInterval(this._mediaUpdateInterval);
          this._mediaUpdateInterval = null;
        }
      }, 1000);
    }
  }

  /**
   * Formats seconds into a hours:minutes:seconds string.
   * @param {number} seconds - The time in seconds.
   * @returns {string} Formatted time string.
   */
  formatSecondsToTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';

    const totalSeconds = Math.max(0, Math.ceil(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString();
    const secs = (totalSeconds % 60).toString();

    if (hours > 0) {
      return `${hours}:${minutes.padStart(2, '0')}:${secs.padStart(2, '0')}`;
    }

    return `${minutes}:${secs.padStart(2, '0')}`;
  }

  /**
   * Updates metadata in the UI.
   * @param {Event} event - The metadata change event.
   */
  onMetadataChange(event) {
    const metadata = event.target.getMetadata();
    this.mediaTitle.textContent = metadata.title || '';
    this.mediaArtist.textContent = metadata.artist || '';
  }

  onMediaPlayPrev() {
    if (this._currentMediaController?.supportedKeys.includes('previoustrack')) {
      this._currentMediaController.prevTrack();
    }
  }

  onMediaPlayNext() {
    if (this._currentMediaController?.supportedKeys.includes('nexttrack')) {
      this._currentMediaController.nextTrack();
    }
  }

  onMediaSeekDrag(event) {
    this._currentMediaController?.pause();
    const newTime = (event.target.value / 100) * this._currentDuration;
    this.mediaCurrentTime.textContent = this.formatSecondsToTime(newTime);
  }

  onMediaSeekComplete(event) {
    const newPosition = (event.target.value / 100) * this._currentDuration;
    if (this._currentMediaController?.supportedKeys.includes('seekto')) {
      this._currentMediaController.seekTo(newPosition);
      this._currentMediaController.play();
    }
  }

  onMediaFocus() {
    this._currentMediaController?.focus();
  }

  onMediaMute() {
    if (!this.mediaControlBar.hasAttribute('muted')) {
      this._currentBrowser.mute();
      this.mediaControlBar.setAttribute('muted', '');
    } else {
      this._currentBrowser.unmute();
      this.mediaControlBar.removeAttribute('muted');
    }
  }

  onMediaToggle() {
    if (this.mediaControlBar.classList.contains('playing')) {
      this._currentMediaController?.pause();
    } else {
      this._currentMediaController?.play();
    }
  }
}

window.gZenMediaController = new ZenMediaController();
