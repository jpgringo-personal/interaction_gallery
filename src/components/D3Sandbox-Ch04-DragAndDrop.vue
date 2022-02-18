<template>
  <div class="component d3-sandbox ch04 drag-and-drop">
    <svg ref="draganddrop" width="600" height="200">
      <circle cx="100" cy="100" r="20" fill="red"/>
      <circle cx="300" cy="100" r="20" fill="green"/>
      <circle cx="500" cy="100" r="20" fill="blue"/>
    </svg>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "D3Sandbox-Ch04-DragAndDrop",
  data: function () {
    return {
      svg: undefined,
      data: ['walrus', 'carpenter', 'oyster'],
      cards: undefined,
      cardWidth: 72,
      cardHeight: 96,
      cardSpacing: 12,
      cardFontSize: 11
    }
  },
  mounted() {
    this.svg = d3.select(this.$refs.draganddrop);
    this.plot();
    this.addDragAndDropToExistingCircles();
  },
  methods: {
    plot() {
      this.cards = this.svg.selectAll('circle')
          .data(this.data, d => d)
          .enter()
          .insert('g')
          .attr('id', d => d)
          .attr('transform',
              (_d, i) => `translate(${this.cardSpacing
              + i * this.cardWidth
              + i * this.cardSpacing}, 10)`);

      this.cards.append('rect').attr('width', this.cardWidth).attr('height', this.cardHeight)
          .attr('fill', 'antiquewhite');
      const lineOffset = this.cardFontSize * 2;
      this.cards.append('line').attr('x1', 0).attr('y1', lineOffset)
      .attr('x2', this.cardWidth).attr('y2', lineOffset)
      .attr('stroke', 'black')
      this.cards
          .append('text')
          .text(d => d)
          .attr('text-anchor', 'middle')
          .attr('transform', `translate(${this.cardWidth / 2}, ${this.cardFontSize * 1.4})`)
          .attr('font-size', this.cardFontSize);

      this.addDragAndDrop(this.cards);
    },
    moveToFront(elem) {
      elem.raise();
    },
    addDragAndDrop(sel) {
      let widget = undefined, color = undefined;
      let startPt, startTransform;
      const vm = this;
      sel.call(
          d3.drag()
              .on('start', function (evt) {
                color = d3.select(this).attr('fill');
                widget = d3.select(this)
                    .attr('opacity', 0.5)
                // .attr('fill', 'lime');
                vm.moveToFront(widget);
                startPt = d3.pointer(evt, d3.select(vm.svg).node());
                startTransform = (/translate[^\d]+([\d\.]+)[^\d]+([\d\.]+)/)
                    .exec(widget.attr('transform'))
                    .slice(1)
                    .map(n => parseFloat(n));
              })
              .on('drag', function (evt) {
                const pt = d3.pointer(evt, d3.select(vm.svg).node());
                const delta = [pt[0] - startPt[0], pt[1] - startPt[1]];
                widget.attr('transform', `translate(${startTransform[0] + delta[0]}, ${startTransform[1] + delta[1]})`);
              })
              .on('end', function () {
                // widget.attr('fill', color);
                widget.attr('opacity', 1)
                widget = undefined;
              }))
    },
    addDragAndDropToExistingCircles() {
      let widget = undefined, color = undefined;
      const vm = this;
      this.svg.selectAll('circle')
          .call(
              d3.drag()
                  .on('start', function () {
                    color = d3.select(this).attr('fill');
                    widget = d3.select(this).attr('fill', 'lime');
                    vm.moveToFront(widget);
                  })
                  .on('drag', function (evt) {
                    const pt = d3.pointer(evt, d3.select(this).node());
                    widget.attr('cx', pt[0]).attr('cy', pt[1]);
                  })
                  .on('end', function () {
                    widget.attr('fill', color);
                    widget = undefined;
                  }));

    }
  }
}
</script>

<style scoped>

</style>
