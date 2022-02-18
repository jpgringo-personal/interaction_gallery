<template>
  <div class="component d3-sandbox ch03">
    <p class="controls">
      <button @click="addData">Add data</button>
      <button @click="shuffle">Shuffle</button>
      <button @click="rotate">Rotate</button>
      <button @click="changeColor">Change Color</button>
      <button @click="removeFirst">Remove First Node</button>
    </p>
    <ul ref="itemList">
      <li>one thing</li>
    </ul>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  name: "D3Sandbox-Ch03",
  data: function () {
    return {
      candidateWords: [],
      data: [
        {id: 1, name: 'walrus', color: 'hotpink'},
        {id: 2, name: 'carpenter', color: 'lime'},
        {id: 3, name: 'oyster', color: 'magenta'},
        {id: 4, name: 'bucket', color: 'firebrick'}
      ],
      idGenerator: undefined,
      colors: ['goldenrod', 'green', 'cyan', 'magenta', 'darkviolet'],
      width: 320,
      height: 240,
      g: undefined
    }
  },
  mounted() {
    this.prepWordList();
    this.createPlot();
    this.plotData();
    this.refreshList();
  },
  methods: {
    createPlot() {
      const startingId = d3.max(this.data, d => d.id) + 1;
      this.idGenerator = (() => {
        function* incrementFunction(index) {
          while (true) {
            yield index;
            index++;
          }
        }

        const iterator = incrementFunction(startingId)
        return () => iterator.next().value;
      })()
      this.g = d3.select(this.$el).append('svg')
          .attr('width', this.width)
          .attr('height', this.height)
          .style('border', 'solid 1px silver')
          .style('background-color', 'ghostwhite')
    },
    plotData() {
      const sel = this.g.selectAll('circle')
          .data(this.data, d => d.id)
          .join(enter => enter.append('circle')
                  .attr('id', d => d.id)
                  // .append('title').text(d => d.name)
                  .transition()
                  .attr('fill', d => d.color ? d.color : 'grey')
                  .attr('r', 5)
                  .attr('cx', 50)
                  .attr('cy', (_, i) => 10 + 20 * i),
              update => update
                  .transition()
                  .attr('cy', (_, i) => 10 + 20 * i)
                  .attr('fill', d => d.color ? d.color : 'grey'),
              exit => exit.remove());
    },
    refreshList() {
      const ul = d3.select(this.$refs.itemList).selectAll('li');
      const lineHeight = 18;
      ul.data(this.data, d => !!d ? d.id : null)
          .join(
              enter => {
                enter.append('li').attr('id', d => d.id).attr('class', d => `item ${d.name}`)
                    .style('top', (_, i) => `${lineHeight * (i - 1)}px`)
                    .style('color', d => d.color).text(d => `${d.id} - ${d.name}`);
              },
              update => {
                update
                    .transition()
                    .style('color', d => d.color)
                    .style('top', (_, i) => `${lineHeight * (i - 1)}px`)

              },
              exit => {
                exit.remove();
              },
          );
    },
    addData() {
      this.data.push({
        id: this.idGenerator(),
        name: this.randomWord()
      });
      this.plotData();
      this.refreshList();
    },
    shuffle() {
      const shuffle = d3.shuffler(d3.randomLcg(Math.random()));
      const shuffledData = shuffle(this.data);
      this.data = shuffledData;
      this.plotData();
      this.refreshList();
    },
    rotate() {
      const elem = this.data.shift();
      this.data.push(elem);
      this.plotData();
      this.refreshList();
    },
    changeColor() {
      this.data[0].color = 'dodgerblue';
      this.plotData();
      this.refreshList();
    },
    removeFirst() {
      this.data.shift();
      this.plotData();
      this.refreshList();
    },
    prepWordList() {
      this.candidateWords = new Set(poem.toLowerCase().split(/\s+/).filter(w => w.length > 3).sort())
    },
    randomWord() {
      const [word] = Array.from(this.candidateWords).splice(Math.floor(Math.random() * this.candidateWords.size), 1);
      this.candidateWords.delete(word);
      return word;
    }
  }
}

const poem = `The Walrus and the Carpenter
Were walking close at hand
They wept like anything to see
Such quantities of sand
If this were only cleared away
They said it would be grand
If seven maids with seven mops
Swept it for half a year
Do you suppose the Walrus said,
That they could get it clear
I doubt it said the Carpenter
And shed a bitter tear
O Oysters, come and walk with us
The Walrus did beseech
A pleasant walk a pleasant talk
Along the briny beach
We cannot do with more than four
To give a hand to each`
</script>

<style scoped lang="scss">
div.ch03 {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  .controls {
    flex: 1 0 100%;
  }

  svg {
    order: 1;
  }

  //ul {
  //  order: 2;
  //  font-weight: bold;
  //}
}
</style>

