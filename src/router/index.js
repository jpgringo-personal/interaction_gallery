import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/ch02',
    name: 'Chapter 02',
    // route level code-splitting
    // this generates a separate chunk (ch02.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "ch02" */ '../views/Chapter02')
  },
  {
    path: '/ch03',
    name: 'Chapter 03',
    component: () => import(/* webpackChunkName: "ch03" */ '../views/Chapter03')
  },
  {
    path: '/ch04',
    name: 'Chapter 04',
    component: () => import(/* webpackChunkName: "ch04" */ '../views/Chapter04')
  },
  {
    path: '/extras',
    name: 'Extras',
    component: () => import(/* webpackChunkName: "extras" */ '../views/Extras'),
    children: [
      {
        path: '/extras/animated-vector',
        name: 'Animated Vector',
        component: () => import(/* webpackChunkName: "extras" */ '../components/AnimatedVector')
      },
      {
        path: '/extras/animated-vector-3d',
        name: 'Animated Vector 3D',
        component: () => import(/* webpackChunkName: "extras" */ '../components/AnimatedVector3D')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
