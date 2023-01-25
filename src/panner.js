import Effect from './effect.js';

import p5sound from './main';
var ac = p5sound.audiocontext;
var panner;
// Stereo panner
// if there is a stereo panner node use it
if (typeof ac.createStereoPanner !== 'undefined') {
  /**
   * The Panner class allows you to control the stereo
   * panning of a sound source. It uses the [StereoPannerNode](https://developer.mozilla.org/en-US/docs/Web/API/StereoPannerNode),
   * which allows you to adjust the balance between the left and right channels of a sound source.
   *
   * This class extends <a href = "/reference/#/p5.Effect">p5.Effect</a>.
   * Methods <a href = "/reference/#/p5.Effect/amp">amp()</a>, <a href = "/reference/#/p5.Effect/chain">chain()</a>,
   * <a href = "/reference/#/p5.Effect/drywet">drywet()</a>, <a href = "/reference/#/p5.Effect/connect">connect()</a>, and
   * <a href = "/reference/#/p5.Effect/disconnect">disconnect()</a> are available.
   *
   * @class p5.Panner
   * @extends p5.Effect
   */
  class Panner extends Effect {
    constructor() {
      super();
      this.stereoPanner = this.ac.createStereoPanner();

      this.input.connect(this.stereoPanner);
      this.stereoPanner.connect(this.wet);
    }

    /**
     * Set the stereo pan position, a value of -1 means the sound will be fully panned
     * to the left, a value of 0 means the sound will be centered, and a value of 1 means
     * the sound will be fully panned to the right.
     * @method pan
     * @for p5.Panner
     * @param {Number} value  A value between -1 and 1 that sets the pan position.
     *
     * @param {Number} [time] time in seconds that it will take for the panning to change to the specified value.
     */
    pan(val, tFromNow) {
      if (typeof val === 'number') {
        let time = tFromNow || 0;
        this.stereoPanner.pan.linearRampToValueAtTime(
          val,
          this.ac.currentTime + time
        );
      } else if (typeof val !== 'undefined') {
        val.connect(this.stereoPanner.pan);
      }
    }

    /**
     *  Return the current panning value.
     *
     *  @method  getPan
     *  @for p5.Panner
     *  @return {Number} current panning value, number between -1 (left) and 1 (right).
     */
    getPan() {
      return this.stereoPanner.pan.value;
    }

    /**
     *  Get rid of the Panner and free up its resources / memory.
     *
     *  @method  dispose
     *  @for p5.Panner
     */
    dispose() {
      super.dispose();
      if (this.stereoPanner) {
        this.stereoPanner.disconnect();
        delete this.stereoPanner;
      }
    }

    //not implemented because stereopanner
    //node does not require this and will automatically
    //convert single channel or multichannel to stereo.
    //tested with single and stereo, not with (>2) multichannel
    inputChannels() {}
  }

  panner = Panner;
} else {
  // if there is no createStereoPanner object
  // such as in safari 7.1.7 at the time of writing this
  // use this method to create the effect
  class Panner {
    constructor(input, output, numInputChannels) {
      this.input = ac.createGain();
      input.connect(this.input);

      this.panValue = 0;
      this.left = ac.createGain();
      this.right = ac.createGain();
      this.left.channelInterpretation = 'discrete';
      this.right.channelInterpretation = 'discrete';

      // if input is stereo
      if (numInputChannels > 1) {
        this.splitter = ac.createChannelSplitter(2);
        this.input.connect(this.splitter);

        this.splitter.connect(this.left, 1);
        this.splitter.connect(this.right, 0);
      } else {
        this.input.connect(this.left);
        this.input.connect(this.right);
      }

      this.output = ac.createChannelMerger(2);
      this.left.connect(this.output, 0, 1);
      this.right.connect(this.output, 0, 0);
      this.output.connect(output);
    }

    // -1 is left, +1 is right
    pan(val, tFromNow) {
      this.panValue = val;
      var time = tFromNow || 0;
      var t = ac.currentTime + time;
      var v = (val + 1) / 2;
      var rightVal = Math.cos((v * Math.PI) / 2);
      var leftVal = Math.sin((v * Math.PI) / 2);
      this.left.gain.linearRampToValueAtTime(leftVal, t);
      this.right.gain.linearRampToValueAtTime(rightVal, t);
    }

    getPan() {
      return this.panValue;
    }

    inputChannels(numChannels) {
      if (numChannels === 1) {
        this.input.disconnect();
        this.input.connect(this.left);
        this.input.connect(this.right);
      } else if (numChannels === 2) {
        if (typeof this.splitter === 'undefined') {
          this.splitter = ac.createChannelSplitter(2);
        }
        this.input.disconnect();
        this.input.connect(this.splitter);
        this.splitter.connect(this.left, 1);
        this.splitter.connect(this.right, 0);
      }
    }

    connect(obj) {
      this.output.connect(obj);
    }

    disconnect() {
      if (this.output) {
        this.output.disconnect();
      }
    }

    dispose() {
      if (this.input) {
        this.input.disconnect();
        delete this.input;
      }
      if (this.output) {
        this.output.disconnect();
        delete this.output;
      }
      if (this.left) {
        this.left.disconnect();
        delete this.left;
      }
      if (this.right) {
        this.right.disconnect();
        delete this.right;
      }
      if (this.splitter) {
        this.splitter.disconnect();
        delete this.splitter;
      }
    }
  }
  panner = Panner;
}

export default panner;
