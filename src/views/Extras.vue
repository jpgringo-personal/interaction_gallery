<template>
  <div class="view chapter-04">
    <h1>Extras</h1>
    <p>Exercises that aren't from the book, but inspired by
      examples/techniques that are…</p>
    <div ref="menu" v-if="showMenu">
      <ul>
        <li><router-link to="/extras/animated-vector">Animated Vector</router-link></li>
        <li><router-link to="/extras/animated-vector-3d">Animated Vector 3D</router-link></li>
      </ul>
    </div>
    <div ref="back-link" v-else>
      <router-link to="/extras">Menu</router-link>
    </div>
    <h2 ref="subtitle" v-if="!showMenu">{{this.$route.name}}</h2>
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: "Extras",
  components: {
  },
  computed: {
    showMenu() {
      return this.$route.matched.length === 1;
    }
  },
  mounted() {
    console.log(`route`, this.$route);
    if(this.$route.matched.length > 1) {
      console.log(`this is a subpage!`);
    }
  }
}
</script>

<style scoped>

</style>
