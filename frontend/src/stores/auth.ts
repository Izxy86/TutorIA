import { defineStore } from 'pinia'
import api from '@/services/api'

interface User {
  id: string
  name: string
  email: string
  role: 'STUDENT' | 'TEACHER'
}

interface LoginResponse {
  accessToken: string
  user: User
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('accessToken') as string | null,
    user: JSON.parse(localStorage.getItem('user') || 'null') as User | null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isStudent: (state) => state.user?.role === 'STUDENT',
    isTeacher: (state) => state.user?.role === 'TEACHER',
  },

  actions: {
    async login(email: string, password: string) {
      const { data } = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      })

      this.token = data.accessToken
      this.user = data.user

      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('user', JSON.stringify(data.user))

      return data.user
    },

    logout() {
      this.token = null
      this.user = null

      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
    },
  },
})