<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const user = await auth.login(email.value, password.value)

    if (user.role === 'STUDENT') {
      await router.push('/student')
    } else if (user.role === 'TEACHER') {
      await router.push('/teacher')
    }
  } catch {
    error.value = 'Email o contraseña incorrectos.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-content">
        <div class="logo">T</div>

        <h1>TutorIA</h1>

        <p class="subtitle">
          Tu espacio inteligente para aprender, practicar y avanzar a tu ritmo.
        </p>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">✓</span>
            <span>Aprendizaje personalizado</span>
          </div>

          <div class="feature">
            <span class="feature-icon">✓</span>
            <span>Seguimiento de tu progreso</span>
          </div>

          <div class="feature">
            <span class="feature-icon">✓</span>
            <span>Contenido aprobado por tus docentes</span>
          </div>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-card">
        <div class="welcome">
          <span class="eyebrow">Bienvenido</span>
          <h2>Ingresá a TutorIA</h2>
          <p>
            Usá tu cuenta institucional para continuar.
          </p>
        </div>

        <form @submit.prevent="handleLogin">
          <div class="field">
            <label for="email">Correo electrónico</label>

            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="alumno@tutoria.com"
              autocomplete="email"
              required
            />
          </div>

          <div class="field">
            <label for="password">Contraseña</label>

            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Ingresá tu contraseña"
              autocomplete="current-password"
              required
            />
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <button
            class="login-button"
            type="submit"
            :disabled="loading"
          >
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </button>
        </form>

        <p class="security-message">
          Acceso protegido mediante autenticación institucional.
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  background: #f8f7fc;
  color: #2d2840;
}

.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.brand-panel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 64px;
  overflow: hidden;
  color: white;
  background:
    radial-gradient(
      circle at top left,
      rgba(255, 255, 255, 0.16),
      transparent 34%
    ),
    linear-gradient(
      145deg,
      #6f52c8 0%,
      #8066d6 52%,
      #9b82e1 100%
    );
}

.brand-panel::after {
  content: "";
  position: absolute;
  width: 340px;
  height: 340px;
  right: -130px;
  bottom: -130px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
}

.brand-content {
  position: relative;
  z-index: 1;
  width: min(470px, 100%);
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 28px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: white;
  color: #7053c9;
  font-size: 30px;
  font-weight: 800;
  box-shadow: 0 12px 32px rgba(49, 29, 101, 0.2);
}

.brand-content h1 {
  margin: 0;
  font-size: clamp(42px, 5vw, 62px);
  line-height: 1;
}

.subtitle {
  max-width: 420px;
  margin: 22px 0 38px;
  font-size: 19px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
}

.features {
  display: grid;
  gap: 18px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
}

.feature-icon {
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 28px;
}

.login-card {
  width: min(430px, 100%);
  padding: 42px;
  border: 1px solid #ebe8f4;
  border-radius: 24px;
  background: white;
  box-shadow: 0 20px 60px rgba(73, 54, 120, 0.08);
}

.welcome {
  margin-bottom: 32px;
}

.eyebrow {
  display: inline-block;
  margin-bottom: 8px;
  color: #7658ca;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.welcome h2 {
  margin: 0 0 10px;
  font-size: 30px;
  color: #302947;
}

.welcome p {
  margin: 0;
  color: #777087;
  line-height: 1.5;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: block;
  margin-bottom: 8px;
  color: #4e475d;
  font-size: 14px;
  font-weight: 600;
}

.field input {
  width: 100%;
  min-height: 50px;
  padding: 0 15px;
  border: 1px solid #dad5e7;
  border-radius: 12px;
  outline: none;
  background: #fcfbfe;
  color: #302947;
  font-size: 15px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.field input:focus {
  border-color: #8064cf;
  box-shadow: 0 0 0 4px rgba(128, 100, 207, 0.12);
}

.error-message {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff1f3;
  color: #a73b4c;
  font-size: 14px;
}

.login-button {
  width: 100%;
  min-height: 52px;
  border: 0;
  border-radius: 12px;
  background: #7457c8;
  color: white;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.login-button:hover:not(:disabled) {
  background: #6547bd;
  transform: translateY(-1px);
}

.login-button:disabled {
  opacity: 0.65;
  cursor: wait;
}

.security-message {
  margin: 24px 0 0;
  text-align: center;
  color: #9992a5;
  font-size: 12px;
}

@media (max-width: 850px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: 300px;
    padding: 42px 28px;
  }

  .features {
    display: none;
  }

  .login-panel {
    padding: 36px 20px;
  }

  .login-card {
    padding: 30px 24px;
  }
}
</style>