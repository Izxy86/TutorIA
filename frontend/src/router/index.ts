import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import LoginView from '@/views/LoginView.vue'
import StudentView from '@/views/StudentView.vue'
import TeacherView from '@/views/TeacherView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/student',
      name: 'student',
      component: StudentView,
      meta: {
        requiresAuth: true,
        role: 'STUDENT',
      },
    },
    {
      path: '/teacher',
      name: 'teacher',
      component: TeacherView,
      meta: {
        requiresAuth: true,
        role: 'TEACHER',
      },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.isStudent ? '/student' : '/teacher'
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return auth.isStudent ? '/student' : '/teacher'
  }
})

export default router
