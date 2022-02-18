<template>
  <div class="component simple-slider">
    <svg ref="stage" height="24" width="100%"></svg>
    <span ref="value" class="value"></span>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "SimpleSlider",
  props: {
    min: {type: Number, default: 0.0},
    max: {type: Number, default: 1.0},
    currentValue: {type: Number, default: 0.0},
    continuousOutput: {type: Boolean, default: false},
    scalePower: {type: Number, default: 1},
    precision: {type: Number, default: 2}
  },
  emits: ['valueUpdated'],
  data: function () {
    return {
      width: 0,
      height: 0,
      thumbRadius: 8,
      inset: 8,
      svg: undefined,
      bar: undefined,
      thumb: undefined,
      scX: undefined,
      valueDisplay: undefined
    }
  },
  mounted() {
    this.svg = d3.select(this.$refs.stage);
    this.setDimensions();
    // window.onresize = this.setDimensions;
    window.addEventListener('resize', this.setDimensions)
    this.valueDisplay = d3.select(this.$refs.value);
    this.updateValueDisplay(this.currentValue);
    this.drawSlider();
  },
  unmounted() {
    window.removeEventListener('resize', this.setDimensions);
  },
  methods: {
    setDimensions() {
      this.width = this.$refs.stage.clientWidth;
      this.height = this.$refs.stage.clientHeight;
      this.scX = d3.scalePow().exponent(this.scalePower).domain([this.min, this.max]).range([this.inset, this.width - this.inset]);
      this.drawSlider()
    },
    drawSlider() {
      if(typeof this.bar === 'undefined') {
        this.bar = this.svg
            .append('g')
            .attr('id', 'chrome')
            .append('line');
      }
      this.bar.attr('x1', this.inset)
          .attr('x2', this.width - this.inset * 2)
          .attr('y1', this.height / 2)
          .attr('y2', this.height / 2)
          .attr('stroke', 'silver')
          .attr('stroke-width', 1);

      const startValue = Math.min(Math.max(this.currentValue, this.min), this.max);
      if(typeof this.thumb === 'undefined') {
        this.thumb = this.svg.append('g')
            .attr('id', 'thumb')
            .append('circle');
      }
      this.thumb.attr('fill', 'dodgerblue')
          .attr('r', this.thumbRadius)
          .attr('cx', this.scX(startValue)/*this.inset*/)
          .attr('cy', this.height / 2);
      this.addDragAndDrop(this.thumb);
    },
    addDragAndDrop(sel) {
      const vm = this;
      const svg = this.svg.node();
      const bar = this.bar.node();
      let widget;
      sel.call(
          d3.drag()
              .on('start', function (evt) {
                widget = d3.select(this);
              })
              .on('drag', function (evt) {
                const pt = d3.pointer(evt, svg);

                const newPos = Math.min(Math.max(
                    pt[0],
                    vm.inset
                ), vm.width - vm.inset);
                widget.attr('cx', newPos);
                (vm.continuousOutput ? vm.updateValue : vm.updateValueDisplay)
                    .call(vm, vm.calculateScaledValue(newPos - vm.scX.range()[0]));
              })
              .on('end', function () {
                const endPos = widget.attr('cx') - vm.scX.range()[0];
                widget = undefined;
                vm.updateValue(vm.calculateScaledValue(endPos))
              })
      )
    },
    calculateScaledValue(position) {
      const range = this.scX.range()[1] - this.scX.range()[0]
      const rawValue = position / range;
      return rawValue * (this.max - this.min) + this.min;
    },
    updateValue(newValue) {
      this.$emit('valueUpdated', newValue);
      this.updateValueDisplay(newValue);
    },
    updateValueDisplay(newValue) {
      this.valueDisplay.text(newValue.toFixed(this.precision));
    }
  }
}
</script>

<style scoped lang="scss">
.simple-slider {
  //border:solid 1px lime;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;

  svg {
    //border: solid 1px magenta;
    order:2;
  }

  .value {
    display: block;
    flex: 0 0 1.5rem;
    text-align: left;
    font-size: 0.65rem;
    min-width: 2rem;
    max-width: 2rem;
    order:1;
  }
}

</style>
