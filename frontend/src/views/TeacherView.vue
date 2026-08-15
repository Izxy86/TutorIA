<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

interface WeakTopic {
  topic: string
  masteryLevel: number
}

interface StudentSummary {
  student: {
    id: string
    name: string
    email: string
  }
  averageMastery: number
  totalInteractions: number
  evasions: number
  helpRequests: number
  weakTopics: WeakTopic[]
  needsAttention: boolean
}

interface TeacherDashboard {
  subject: {
    id: string
    name: string
  } | null
  summary: {
    totalStudents: number
    studentsNeedingAttention: number
  }
  students: StudentSummary[]
}

const router = useRouter()
const auth = useAuthStore()

const subjectId = ref('9f274882-e017-4bb1-9da0-d5668f5beb12')
const dashboard = ref<TeacherDashboard | null>(null)

const loading = ref(false)
const error = ref('')

const userName = computed(() => auth.user?.name ?? 'Docente')

const totalStudents = computed(
  () => dashboard.value?.summary.totalStudents ?? 0,
)

const studentsNeedingAttention = computed(
  () => dashboard.value?.summary.studentsNeedingAttention ?? 0,
)

const averageCourseMastery = computed(() => {
  const students = dashboard.value?.students ?? []

  if (students.length === 0) return 0

  const total = students.reduce(
    (sum, student) => sum + student.averageMastery,
    0,
  )

  return Math.round(total / students.length)
})

const totalEvasions = computed(() =>
  (dashboard.value?.students ?? []).reduce(
    (sum, student) => sum + student.evasions,
    0,
  ),
)

const loadDashboard = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get<TeacherDashboard>(
      `/reports/teacher/${subjectId.value}`,
    )

    dashboard.value = data
  } catch {
    error.value = 'No pudimos cargar el dashboard docente.'
  } finally {
    loading.value = false
  }
}

const logout = async () => {
  auth.logout()
  await router.push('/login')
}

onMounted(() => {
  loadDashboard()
})
</script>

<template>
  <div class="teacher-page">
    <header class="topbar">
      <div class="brand">
        <div class="logo">T</div>

        <div>
          <strong>TutorIA</strong>
          <span>Panel docente</span>
        </div>
      </div>

      <div class="user-area">
        <div class="user-info">
          <strong>{{ userName }}</strong>
          <span>Docente</span>
        </div>

        <button
          class="logout-button"
          @click="logout"
        >
          Salir
        </button>
      </div>
    </header>

    <main class="content">
      <section class="welcome">
        <div>
          <span class="eyebrow">
            SEGUIMIENTO ACADÉMICO
          </span>

          <h1>Hola, {{ userName }}</h1>

          <p>
            Revisá el progreso de tus estudiantes,
            detectá dificultades y priorizá dónde intervenir.
          </p>
        </div>

        <div class="subject-card">
          <span>Materia seleccionada</span>

          <strong>
            {{ dashboard?.subject?.name ?? 'Matemática' }}
          </strong>

          <small>
            Seguimiento actualizado con datos reales
          </small>
        </div>
      </section>

      <section class="metrics">
        <article class="metric-card">
          <span class="metric-label">
            ESTUDIANTES
          </span>

          <strong>{{ totalStudents }}</strong>

          <p>
            Alumnos con actividad registrada.
          </p>
        </article>

        <article class="metric-card warning">
          <span class="metric-label">
            REQUIEREN ATENCIÓN
          </span>

          <strong>
            {{ studentsNeedingAttention }}
          </strong>

          <p>
            Presentan dificultades o señales de riesgo.
          </p>
        </article>

        <article class="metric-card">
          <span class="metric-label">
            DOMINIO PROMEDIO
          </span>

          <strong>
            {{ averageCourseMastery }}%
          </strong>

          <p>
            Promedio académico de la materia.
          </p>
        </article>

        <article class="metric-card">
          <span class="metric-label">
            EVASIONES DETECTADAS
          </span>

          <strong>{{ totalEvasions }}</strong>

          <p>
            Intentos de obtener respuestas directas.
          </p>
        </article>
      </section>

      <section class="dashboard-card">
        <div class="dashboard-header">
          <div>
            <span class="eyebrow">
              ALUMNOS
            </span>

            <h2>
              Estado del curso
            </h2>
          </div>

          <button
            class="refresh-button"
            :disabled="loading"
            @click="loadDashboard"
          >
            {{ loading ? 'Actualizando...' : 'Actualizar' }}
          </button>
        </div>

        <div
          v-if="error"
          class="error"
        >
          {{ error }}
        </div>

        <div
          v-if="!loading && dashboard?.students.length === 0"
          class="empty-state"
        >
          No hay actividad registrada todavía.
        </div>

        <div
          v-else
          class="student-list"
        >
          <article
            v-for="student in dashboard?.students"
            :key="student.student.id"
            class="student-card"
            :class="{
              attention: student.needsAttention,
            }"
          >
            <div class="student-main">
              <div class="avatar">
                {{ student.student.name.charAt(0).toUpperCase() }}
              </div>

              <div>
                <strong>
                  {{ student.student.name }}
                </strong>

                <span>
                  {{ student.student.email }}
                </span>
              </div>
            </div>

            <div class="student-mastery">
              <span>Dominio promedio</span>

              <strong>
                {{ student.averageMastery }}%
              </strong>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${student.averageMastery}%`,
                  }"
                ></div>
              </div>
            </div>

            <div class="student-stats">
              <div>
                <span>Interacciones</span>
                <strong>
                  {{ student.totalInteractions }}
                </strong>
              </div>

              <div>
                <span>Evasiones</span>
                <strong>
                  {{ student.evasions }}
                </strong>
              </div>

              <div>
                <span>Pedidos de ayuda</span>
                <strong>
                  {{ student.helpRequests }}
                </strong>
              </div>
            </div>

            <div class="student-status">
              <span
                v-if="student.needsAttention"
                class="status-badge attention"
              >
                Requiere atención
              </span>

              <span
                v-else
                class="status-badge ok"
              >
                Evolución estable
              </span>
            </div>

            <div
              v-if="student.weakTopics.length > 0"
              class="weak-topics"
            >
              <span class="weak-title">
                Temas a reforzar
              </span>

              <div class="topic-tags">
                <span
                  v-for="topic in student.weakTopics"
                  :key="topic.topic"
                  class="topic-tag"
                >
                  {{ topic.topic }}
                  ·
                  {{ topic.masteryLevel }}%
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="info-panel">
        <div class="info-icon">i</div>

        <div>
          <strong>
            ¿Cómo se generan las alertas?
          </strong>

          <p>
            TutorIA combina progreso académico,
            pedidos reiterados de ayuda y conductas de evasión.
            El objetivo es orientar la intervención docente,
            no reemplazar su criterio.
          </p>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  background: #f7f6fb;
  color: #302947;
  font-family:
    Inter,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.teacher-page {
  min-height: 100vh;
}

.topbar {
  height: 76px;
  padding: 0 7%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-bottom: 1px solid #ebe8f3;
}

.brand,
.user-area,
.student-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: #7658cf;
  color: white;
  font-size: 20px;
  font-weight: 800;
}

.brand strong,
.user-info strong,
.student-main strong {
  display: block;
}

.brand span,
.user-info span,
.student-main span {
  display: block;
  margin-top: 2px;
  color: #8a8497;
  font-size: 12px;
}

.user-info {
  text-align: right;
}

.logout-button,
.refresh-button {
  padding: 9px 15px;
  border-radius: 9px;
  cursor: pointer;
  font-weight: 600;
}

.logout-button {
  border: 1px solid #ddd8e9;
  background: white;
  color: #5e566c;
}

.refresh-button {
  border: 0;
  background: #7658cf;
  color: white;
}

.refresh-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

.content {
  width: min(1180px, 88%);
  margin: 0 auto;
  padding: 52px 0 70px;
}

.welcome {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  margin-bottom: 32px;
}

.eyebrow,
.metric-label,
.weak-title {
  color: #7658cf;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.welcome h1 {
  margin: 8px 0 10px;
  font-size: 38px;
}

.welcome p {
  max-width: 620px;
  margin: 0;
  color: #777083;
  line-height: 1.6;
}

.subject-card {
  width: 300px;
  padding: 20px;
  border-radius: 16px;
  background: #eee9fb;
}

.subject-card span,
.subject-card small,
.student-mastery span,
.student-stats span {
  display: block;
  color: #81798e;
  font-size: 12px;
}

.subject-card strong {
  display: block;
  margin: 8px 0;
  color: #684bc0;
  font-size: 24px;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card,
.dashboard-card,
.info-panel {
  border: 1px solid #ebe8f3;
  background: white;
  box-shadow:
    0 10px 35px
    rgba(74, 54, 119, 0.05);
}

.metric-card {
  padding: 22px;
  border-radius: 16px;
}

.metric-card.warning {
  background: #fffaf0;
  border-color: #f1dfb6;
}

.metric-card strong {
  display: block;
  margin: 10px 0 6px;
  color: #5c43a8;
  font-size: 30px;
}

.metric-card p {
  margin: 0;
  color: #847d8f;
  font-size: 13px;
  line-height: 1.5;
}

.dashboard-card {
  padding: 30px;
  border-radius: 20px;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.dashboard-header h2 {
  margin: 7px 0 0;
  font-size: 26px;
}

.student-list {
  display: grid;
  gap: 14px;
}

.student-card {
  display: grid;
  grid-template-columns:
    minmax(220px, 1.3fr)
    minmax(180px, 1fr)
    minmax(240px, 1fr)
    auto;
  align-items: center;
  gap: 22px;
  padding: 20px;
  border: 1px solid #ebe8f3;
  border-radius: 16px;
  background: #fcfbfe;
}

.student-card.attention {
  border-color: #e6caca;
  background: #fffafa;
}

.avatar {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 13px;
  background: #eee9fb;
  color: #6547bd;
  font-weight: 800;
}

.student-mastery strong {
  display: block;
  margin: 5px 0 8px;
  color: #6047ae;
  font-size: 20px;
}

.progress-bar {
  height: 7px;
  overflow: hidden;
  border-radius: 20px;
  background: #ded8ec;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #7658cf;
}

.student-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.student-stats div {
  padding: 10px;
  border-radius: 10px;
  background: white;
}

.student-stats strong {
  display: block;
  margin-top: 4px;
  color: #4e465b;
}

.status-badge {
  display: inline-block;
  padding: 7px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.status-badge.attention {
  background: #fff0f0;
  color: #a94444;
}

.status-badge.ok {
  background: #edf8f0;
  color: #39744a;
}

.weak-topics {
  grid-column: 1 / -1;
  padding-top: 14px;
  border-top: 1px solid #eeeaf4;
}

.topic-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 9px;
}

.topic-tag {
  padding: 7px 10px;
  border-radius: 20px;
  background: #f0ecfb;
  color: #634ba7;
  font-size: 12px;
}

.info-panel {
  margin-top: 20px;
  padding: 20px 24px;
  display: flex;
  gap: 14px;
  border-radius: 16px;
  background: #f1edfb;
}

.info-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #7658cf;
  color: white;
  font-weight: 800;
}

.info-panel strong {
  color: #54408f;
}

.info-panel p {
  margin: 5px 0 0;
  color: #756e80;
  font-size: 13px;
  line-height: 1.55;
}

.error {
  margin-bottom: 18px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff0f2;
  color: #a83b4c;
}

.empty-state {
  padding: 35px;
  text-align: center;
  color: #888191;
}

@media (max-width: 1050px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .student-card {
    grid-template-columns: 1fr 1fr;
  }

  .student-status {
    text-align: right;
  }
}

@media (max-width: 750px) {
  .topbar {
    padding: 0 5%;
  }

  .content {
    width: 90%;
    padding-top: 35px;
  }

  .welcome {
    display: block;
  }

  .subject-card {
    width: 100%;
    margin-top: 24px;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .student-card {
    grid-template-columns: 1fr;
  }

  .student-status {
    text-align: left;
  }

  .student-stats {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .user-info {
    display: none;
  }
}
</style>