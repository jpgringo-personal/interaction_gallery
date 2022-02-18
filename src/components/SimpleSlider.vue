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
    scalePower: {type: Number, default: 1}
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
    console.log(`width:`, this.$refs.stage.clientWidth)
    this.setDimensions();
    window.onresize = this.setDimensions;
    this.svg = d3.select(this.$refs.stage);
    this.valueDisplay = d3.select(this.$refs.value);
    this.updateValueDisplay(this.currentValue);
    this.drawSlider();
  },
  methods: {
    setDimensions() {
      this.width = this.$refs.stage.clientWidth;
      this.height = this.$refs.stage.clientHeight;
      this.scX = d3.scalePow().exponent(this.scalePower).domain([this.min, this.max]).range([this.inset, this.width - this.inset]);
    },
    drawSlider() {
      this.bar = this.svg
          .append('g')
          .attr('id', 'chrome')
          .append('line');
      this.bar.attr('x1', this.inset)
          .attr('x2', this.width - this.inset * 2)
          .attr('y1', this.height / 2)
          .attr('y2', this.height / 2)
          .attr('stroke', 'silver')
          .attr('stroke-width', 1);

      const startValue = Math.min(Math.max(this.currentValue, this.min), this.max);
      this.thumb = this.svg.append('g')
          .attr('id', 'thumb')
          .append('circle');
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
                console.log(`starting drag...`);
                widget = d3.select(this);
              })
              .on('drag', function (evt) {
                const pt = d3.pointer(evt, svg);
                // console.log(`dragging...`, Math.max(pt[0], 0));

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
                console.log(`finished dragging. endPos=${endPos}`);
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
      this.valueDisplay.text(newValue.toFixed(1));
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
  }

  .value {
    display: block;
    flex: 0 0 1.5rem;
    text-align: right;
    font-size: 0.65rem;
  }
}

</style>
