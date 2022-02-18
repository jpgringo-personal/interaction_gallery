<template>
  <div class="component d3-sandbox ch04">
    <svg ref="brush1" :width="width" :height="height"></svg>
    <svg ref="brush2" :width="width" :height="height"></svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "D3Sandbox-Ch04",
  data: function () {
    return {
      width: 320,
      height: 320,
      cursorRadius: 35,
      innerCursorScale: 0.2,
      graphicContexts: [],
      data: undefined
    }
  },
  mounted() {
    this.g = this.$refs.g;
    this.graphicContexts = [d3.select(this.$refs.brush1), d3.select(this.$refs.brush2)];
    d3.csv('data/dense.csv')
        .then(data => {
          console.log(`loaded 'dense.csv'`);
          this.data = data;
          this.plot();
        })
  },
  methods: {
    plot() {
      const sc1 = d3.scaleLinear().domain([0, this.cursorRadius * this.innerCursorScale, this.cursorRadius])
          .range(['lime', 'yellow', 'red']);
      const sc2 = d3.scaleLinear().domain([0, this.cursorRadius * this.innerCursorScale, this.cursorRadius])
          .range(['lime', 'yellow', 'blue']);
      const cs1 = this.drawCircles(this.graphicContexts[0], this.data, d => d['A'], d => d['B'], sc1),
          cs2 = this.drawCircles(this.graphicContexts[1], this.data, d => d['A'], d => d['C'], sc2);

      this.graphicContexts[0].call(this.installHandlers, this.data, cs1, cs2, sc1, sc2);
    },
    drawCircles(svg, data, accX, accY, sc) {
      const color = sc(Infinity);
      return svg.selectAll('circle')
          .data(data)
          .enter()
          .append('circle')
          .attr('r', 5)
          .attr('cx', accX)
          .attr('cy', accY)
          .attr('fill', color)
          .attr('fill-opacity', 0.5);
    },
    installHandlers(svg, data, cs1, cs2, sc1, sc2) {
      const cursor = svg.append('circle')
          .attr('r', this.cursorRadius)
          .attr('fill', 'none').attr('stroke', 'black')
          .attr('stroke-width', 10).attr('stroke-opacity', 0.1)
          .attr('visibility', 'hidden');

      const hotZone = svg.append('rect').attr('cursor', 'none')
          .attr('x', this.cursorRadius).attr('y', this.cursorRadius)
          .attr('width', this.width - this.cursorRadius * 2).attr('height', this.height - this.cursorRadius * 2)
          .attr('visibility', 'hidden')
          .attr('pointer-events', 'all')
          .on('mouseenter', () => cursor.attr('visibility', 'visible'))
          .on('mousemove', function (evt) {
            const pt = d3.pointer(evt, svg.node());
            cursor.attr('cx', pt[0]).attr('cy', pt[1])
            cs1.attr('fill', function (d, i) {
              const dx = pt[0] - d3.select(this).attr('cx'),
                  dy = pt[1] - d3.select(this).attr('cy'),
                  r = Math.hypot(dx, dy);
              data[i]['r'] = r;
              return sc1(r);
            });
            cs2.attr('fill', (d, i) => sc2(data[i]['r']));

          })
          .on('mouseleave', () => {
            cursor.attr('visibility', 'hidden')
            cs1.attr('fill', sc1(Infinity));
            cs2.attr('fill', sc2(Infinity));
          });
    },
  }
}
</script>

<style scoped lang="scss">
svg {
  border: solid 1px silver;
}
</style>
