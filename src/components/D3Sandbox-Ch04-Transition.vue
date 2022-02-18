<template>
  <div class="component d3-sandbox ch04 transition">
    <p>
      <button @click="addPoint">Add Point</button>
      <button @click="removePoint">Remove Point</button>
    </p>
    <svg ref="stage" :width="width" :height="height"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "D3Sandbox-Ch04-Transition",
  data: function () {
    return {
      width: 480,
      height: 200,
      inset: 25,
      svg: undefined,
      lines: undefined,
      lineWidth: dataLength => ((this.width - this.inset * 2) / dataLength) * 0.667,
      scX: undefined,
      scY: undefined,
      data: [2, 1, 3, 5, 7, 8, 9, 9, 9, 8, 7, 5, 3, 1, 2],
      altData: [8, 9, 8, 7, 5, 3, 2, 1, 2, 3, 5, 7, 8, 9, 8],
      colors: ['red', 'dodgerblue'],
      currentDataLength: undefined,
      animationDuration: 500,
      staggerPeriod: 25
    }
  },
  mounted() {
    this.svg = d3.select(this.$refs.stage);
    this.currentDataLength = this.data.length;
    this.plot();
  },
  methods: {
    plot(animCallback) {
      const max = d3.max(this.data);
      this.scX = d3.scaleLinear().domain([0, this.data.length]).range([this.inset, this.width]);
      this.scY = d3.scaleLinear().domain([0, max]).range([this.height, 0]);

      const lineWidth = this.lineWidth(this.data.length);
      this.lines = this.svg.selectAll('line');
      this.lines.data(this.data).join(
          enter => {
            const t = d3.transition('stagger').duration(this.animationDuration).delay(50);
            if (!!animCallback) t.on('end', animCallback)
            enter.append('line')
                .attr('stroke', this.colors[0]).attr('stroke-width', lineWidth)
                .attr('x1', (d, i) => this.scX(i)).attr('y1', this.scY(0))
                .attr('x2', (d, i) => this.scX(i)).attr('y2', (d, i, n) => i === this.currentDataLength ? this.scY(0) : this.scY(d))
                .transition(t)
                .attr('y2', d => this.scY(d));
            this.currentDataLength = this.data.length;
          },
          update => {
            update
                .transition('squeeze').duration(this.animationDuration)
                .attr('stroke-width', lineWidth)
                .attr('x1', (d, i) => this.scX(i)).attr('y1', this.scY(0))
                .attr('x2', (d, i) => this.scX(i)).attr('y2', d => this.scY(d)) //(d, i, n) => i === n.length - 1 ? this.scY(0) : this.scY(d))
          },
          exit => exit.remove()
      )

      const vm = this;
      this.svg.on('click', function () {
        [vm.data, vm.altData] = [vm.altData, vm.data];
        vm.colors.reverse();
        vm.lines = vm.svg.selectAll('line');
        vm.lines.data(vm.data)
            .transition().duration(vm.animationDuration).delay((_, i) => vm.staggerPeriod * i)
            .attr('y2', d => vm.scY(d)).attr('stroke', vm.colors[0]);
      })
    },
    addPoint() {
      const newPointFunc = data => 1 + Math.floor(Math.random() * (d3.max(data) - 1))
      this.data.push(newPointFunc(this.data));
      this.altData.push(newPointFunc(this.altData));
      this.plot();
    },
    removePoint() {
      const newLineWidth = this.lineWidth(this.data.length - 1);
      const redraw = (d, i, n) => {
        if (i < n.length - 1) return;
        this.data.shift();
        this.altData.shift();
        this.scX = d3.scaleLinear().domain([0, this.data.length]).range([this.inset, this.width]);
        this.lines.data(this.data)
            .join(
                enter => enter,
                update => update.attr('y2', d => this.scY(d))
                    .attr('x1', (d, i) => this.scX(i))
                    .attr('x2', (d, i) => this.scX(i)),
                exit => exit.remove()
            )
      }
      // first simultaneously zero the first data point, and redraw the remaining bars to fill the available space
      this.data[0] = 0;
      this.altData[0] = 0;
      this.scX = d3.scaleLinear().domain([1, this.data.length]).range([this.inset, this.width]);
      this.lines = this.svg.selectAll('line');
      this.lines.data(this.data)
          // when all transitions are complete, ACTUALLY remove the first point, and redraw the remaining bars
          .transition().on('end', redraw)
          .attr('stroke-width', newLineWidth)
          .attr('y2', d => this.scY(d))
          .attr('x1', (d, i) => this.scX(i))
          .attr('x2', (d, i) => this.scX(i));
    }
  }
}
</script>

<style scoped>

</style>
