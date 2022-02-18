<template>
  <div class="view chapter-02">
    <h1>Chapter 02</h1>
    <p>This visualization plots 4 numeric data series with 2 different scales as a line chart.</p>

    <d3-sandbox-ch02></d3-sandbox-ch02>

    <p>User interactions:</p>
    <ol>
      <li><label>Add Random Points</label> This adds a data point to the end of each series.
        Values are randomly generated, but respect the existing min/max range of each series.
      </li>
      <li><label>Add Drunkard's Walk Points</label> Also adds a data point to the end of each series
        In this case the values are unbounded, but based on a defined deviation from the value of
        the
        previous point in the series.
      </li>
      <li><label>Remove Random Points</label> Removes a data point from the same location in each
        series, based on a random index. Does nothing when the number of points in each series
        &lt;=4.
      </li>
      <li><label>Start/Stop Drunkard's Walk</label> Invokes the "Add Drunkard's Walk Points"
        functionality above, but using a Javascript interval timer, to simulate data arriving
        from an external source.
      </li>
    </ol>
  </div>
</template>

<script>
import D3SandboxCh02 from "@/components/D3Sandbox-Ch02";

export default {
  name: "Chapter02",
  components: {
    D3SandboxCh02
  }
}
</script>

<style scoped>

</style>
