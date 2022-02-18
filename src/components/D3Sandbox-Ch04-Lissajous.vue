<template>
  <div class="component d3-sandbox lissajous">
    <svg ref="stage" :width="width" :height="height"></svg>
    <div class="controls">
      <p>
        <button @click="startLissajous">Start</button>
        <button @click="stopLissajous">Stop</button>
        <button @click="clearLissajous">Clear</button>
      </p>
      <p>Freq A:</p>
      <simple-slider
          :min="minFreq" :max="maxFreq" :current-value="freqA"
          @valueUpdated="updateFreqA"
      ></simple-slider>
      <p>Freq B:</p>
      <simple-slider
          :min="minFreq" :max="maxFreq" :current-value="freqB"
          @valueUpdated="updateFreqB"
      ></simple-slider>
      <p>Trail Length:</p>
      <simple-slider
          :min="minTrail" :max="maxTrail" :current-value="trailLength"
          :scale-power="4"
          @valueUpdated="updateTrailLength"
      ></simple-slider>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import SimpleSlider from "@/components/SimpleSlider";

export default {
  name: "D3Sandbox-Ch04-Lissajous",
  components: {
    SimpleSlider
  },
  data: function () {
    return {
      width: 320,
      height: 320,
      svg: undefined,
      timer: undefined,
      minFreq: 1.0,
      maxFreq: 10.0,
      freqA: 3.2,
      freqB: 5.9,
      minTrail: 20,
      maxTrail: 99,
      trailLength: 85
    }
  },
  mounted() {
    this.svg = d3.select(this.$refs.stage);
    this.svg.style('min-width', `${this.width}px`);
  },
  methods: {
    startLissajous() {
      console.log(`starting lissajous...`);
      const omega = 2 * Math.PI / 10000;
      let phi;

      const xOrigin = this.width / 2,
          yOrigin = this.height / 2;
      const xSize = this.width / 2 * 0.8, ySize = this.height / 2 * 0.8;
      let crrX = xOrigin + xSize, crrY = yOrigin;
      let prvX = crrX, prvY = crrY;

      const vm = this;
      this.timer = d3.timer(function (t) {
        // if(t % 10 === 0) console.log(`t=${t}`);
        phi = omega * t;
        crrX = xOrigin + xSize * Math.cos(vm.freqA * phi);
        crrY = yOrigin + ySize * Math.sin(vm.freqB * phi);
        const fadeValue = 0.9 + (vm.trailLength / 1000);
        console.log(`fadeValue:`, fadeValue);
        vm.svg.selectAll('line')
            .each(function () {
              this.bogus_opacity *= fadeValue
            })
            .attr('stroke-opacity', function () {
              return this.bogus_opacity;
            })
            .filter(function () {
              return this.bogus_opacity < 0.05
            })
            .remove();
        vm.svg.append('line')
            .each(function () {
              this.bogus_opacity = 1.0
            })
            .attr('x1', prvX).attr('y1', prvY)
            .attr('x2', crrX).attr('y2', crrY)
            .attr('stroke', 'green').attr('stroke-width', 2);

        prvX = crrX;
        prvY = crrY;
      })
    },
    stopLissajous() {
      console.log(`stoppping lissajous...`);
      !!this.timer && this.timer.stop()
    },
    clearLissajous() {
      this.svg.selectAll('line').remove();
    },
    updateFreqA(newVal) {
      this.freqA = newVal;
    },
    updateFreqB(newVal) {
      this.freqB = newVal;
    },
    updateTrailLength(newVal) {
      this.trailLength = newVal;
      // console.log(`new fade:`, newVal / 1000);
    }
  }
}
</script>
