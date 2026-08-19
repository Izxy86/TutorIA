<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/services/api'

interface ProgressItem {
  id: string
  topic: string
  masteryLevel: number
  attempts: number
  correctAnswers: number
  updatedAt: string
  userId: string
  subjectId: string
}

interface RecentInteraction {
  question: string
  activityType: string
  usedAI: boolean
  createdAt: string
  suspectedEvasion: boolean
  needsHelp: boolean
}

interface StudentReport {
  student: {
    id: string
    name: string
    email: string
  } | null

  subject: {
    id: string
    name: string
  } | null

  summary: {
    totalInteractions: number
    aiInteractions: number
    localInteractions: number
    evasions: number
    helpRequests: number
    averageMastery: number
  }

  alerts: {
    needsAttention: boolean
    reasons: string[]
  }

  progress: ProgressItem[]

  topicsNeedingReinforcement: {
    topic: string
    masteryLevel: number
  }[]

  recentInteractions: RecentInteraction[]
}

const route = useRoute()
const router = useRouter()
const report = ref<StudentReport | null>(null)
const loading = ref(false)
const error = ref('')



const userId = computed(() => route.params.userId as string)
const subjectId = computed(() => route.params.subjectId as string)

const studentName = computed(
  () => report.value?.student?.name ?? 'Alumno',
)

const studentEmail = computed(
  () => report.value?.student?.email ?? '',
)

const subjectName = computed(
  () => report.value?.subject?.name ?? 'Sin Materia',
)

const averageMastery = computed(
  () => report.value?.summary.averageMastery ?? 0,
)

const loadReport = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } = await api.get<StudentReport>(
      `/reports/student/${userId.value}/${subjectId.value}`,
    )

    report.value = data
  } catch {
    error.value = 'No pudimos cargar el detalle del alumno.'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push('/teacher')
}

const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

onMounted(() => {
  loadReport()
})
</script>

<template>
  <div class="detail-page">
    <header class="topbar">
      <div class="brand">
        <div class="logo">T</div>

        <div>
          <strong>TutorIA</strong>
          <span>Detalle del alumno</span>
        </div>
      </div>

      <button
        class="back-button"
        @click="goBack"
      >
        Volver al curso
      </button>
    </header>

    <main class="content">
      <div
        v-if="loading"
        class="loading"
      >
        Cargando información del alumno...
      </div>

      <div
        v-else-if="error"
        class="error"
      >
        {{ error }}
      </div>

      <template v-else-if="report">
        <section class="student-header">
          <div class="student-profile">
            <div class="avatar">
              {{ studentName.charAt(0).toUpperCase() }}
            </div>

            <div>
              <span class="eyebrow">
                SEGUIMIENTO INDIVIDUAL
              </span>

              <h1>{{ studentName }}</h1>

              <p>
                {{ studentEmail }}
                ·
                {{ subjectName }}
              </p>
            </div>
          </div>

          <div
            class="attention-card"
            :class="{
              warning: report.alerts.needsAttention,
            }"
          >
            <span>
              Estado actual
            </span>

            <strong>
              {{
                report.alerts.needsAttention
                  ? 'Requiere atención'
                  : 'Evolución estable'
              }}
            </strong>

            <small>
              {{
                report.alerts.needsAttention
                  ? 'Existen indicadores que conviene revisar.'
                  : 'No se detectan alertas relevantes.'
              }}
            </small>
          </div>
        </section>

        <section class="metrics">
          <article class="metric-card">
            <span class="metric-label">
              DOMINIO PROMEDIO
            </span>

            <strong>
              {{ averageMastery }}%
            </strong>

            <div class="progress-bar">
              <div
                class="progress-fill"
                :style="{
                  width: `${averageMastery}%`,
                }"
              ></div>
            </div>
          </article>

          <article class="metric-card">
            <span class="metric-label">
              INTERACCIONES
            </span>

            <strong>
              {{ report.summary.totalInteractions }}
            </strong>

            <p>
              Actividad total registrada.
            </p>
          </article>

          <article class="metric-card">
            <span class="metric-label">
              EVASIONES
            </span>

            <strong>
              {{ report.summary.evasions }}
            </strong>

            <p>
              Intentos de obtener respuestas directas.
            </p>
          </article>

          <article class="metric-card">
            <span class="metric-label">
              PEDIDOS DE AYUDA
            </span>

            <strong>
              {{ report.summary.helpRequests }}
            </strong>

            <p>
              Consultas que evidencian dificultad.
            </p>
          </article>
        </section>

        <section
          v-if="report.alerts.reasons.length > 0"
          class="alerts-card"
        >
          <span class="eyebrow">
            ALERTAS
          </span>

          <h2>
            ¿Por qué requiere atención?
          </h2>

          <ul>
            <li
              v-for="reason in report.alerts.reasons"
              :key="reason"
            >
              {{ reason }}
            </li>
          </ul>
        </section>

        <section class="grid">
          <article class="panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">
                  PROGRESO
                </span>

                <h2>
                  Dominio por tema
                </h2>
              </div>
            </div>

            <div
              v-if="report.progress.length === 0"
              class="empty"
            >
              No hay progreso registrado.
            </div>

            <div
              v-else
              class="progress-list"
            >
              <div
                v-for="item in report.progress"
                :key="item.id"
                class="progress-item"
              >
                <div class="progress-info">
                  <div>
                    <strong>
                      {{ item.topic }}
                    </strong>

                    <span>
                      {{ item.correctAnswers }}
                      correctas de
                      {{ item.attempts }}
                      intentos
                    </span>
                  </div>

                  <strong class="percentage">
                    {{ item.masteryLevel }}%
                  </strong>
                </div>

                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :style="{
                      width: `${item.masteryLevel}%`,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </article>

          <article class="panel">
            <div class="panel-header">
              <div>
                <span class="eyebrow">
                  TEMAS
                </span>

                <h2>
                  Necesitan refuerzo
                </h2>
              </div>
            </div>

            <div
              v-if="
                report.topicsNeedingReinforcement.length === 0
              "
              class="empty"
            >
              No hay temas críticos registrados.
            </div>

            <div
              v-else
              class="weak-list"
            >
              <div
                v-for="
                  topic in report.topicsNeedingReinforcement
                "
                :key="topic.topic"
                class="weak-item"
              >
                <div>
                  <strong>
                    {{ topic.topic }}
                  </strong>

                  <span>
                    Dominio actual
                  </span>
                </div>

                <strong class="weak-value">
                  {{ topic.masteryLevel }}%
                </strong>
              </div>
            </div>
          </article>
        </section>

        <section class="panel interactions-panel">
          <div class="panel-header">
            <div>
              <span class="eyebrow">
                ACTIVIDAD RECIENTE
              </span>

              <h2>
                Últimas interacciones
              </h2>
            </div>
          </div>

          <div
            v-if="report.recentInteractions.length === 0"
            class="empty"
          >
            No existen interacciones recientes.
          </div>

          <div
            v-else
            class="interaction-list"
          >
            <article
              v-for="
                interaction in report.recentInteractions
              "
              :key="
                interaction.question +
                interaction.createdAt
              "
              class="interaction-item"
            >
              <div class="interaction-main">
                <strong>
                  {{ interaction.question }}
                </strong>

                <span>
                  {{
                    formatDate(
                      interaction.createdAt,
                    )
                  }}
                </span>
              </div>

              <div class="interaction-badges">
                <span class="badge">
                  {{ interaction.activityType }}
                </span>

                <span
                  class="badge"
                  :class="{
                    ai: interaction.usedAI,
                  }"
                >
                  {{
                    interaction.usedAI
                      ? 'IA'
                      : 'Material local'
                  }}
                </span>

                <span
                  v-if="
                    interaction.suspectedEvasion
                  "
                  class="badge danger"
                >
                  Evasión
                </span>

                <span
                  v-if="
                    interaction.needsHelp
                  "
                  class="badge warning"
                >
                  Necesita ayuda
                </span>
              </div>
            </article>
          </div>
        </section>
      </template>
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

.detail-page {
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

.brand {
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
.brand span {
  display: block;
}

.brand span {
  margin-top: 2px;
  color: #8a8497;
  font-size: 12px;
}

.back-button {
  padding: 9px 15px;
  border: 1px solid #ddd8e9;
  border-radius: 9px;
  background: white;
  color: #5e566c;
  cursor: pointer;
  font-weight: 600;
}

.content {
  width: min(1180px, 88%);
  margin: 0 auto;
  padding: 52px 0 70px;
}

.student-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  margin-bottom: 30px;
}

.student-profile {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: #eee9fb;
  color: #684bc0;
  font-size: 28px;
  font-weight: 800;
}

.eyebrow,
.metric-label {
  color: #7658cf;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.student-header h1 {
  margin: 6px 0;
  font-size: 36px;
}

.student-header p {
  margin: 0;
  color: #81798c;
}

.attention-card {
  width: 280px;
  padding: 20px;
  border-radius: 16px;
  background: #edf8f0;
}

.attention-card.warning {
  background: #fff0f0;
}

.attention-card span,
.attention-card strong,
.attention-card small {
  display: block;
}

.attention-card span {
  color: #81798c;
  font-size: 12px;
}

.attention-card strong {
  margin: 7px 0;
  color: #39744a;
  font-size: 20px;
}

.attention-card.warning strong {
  color: #a94444;
}

.attention-card small {
  color: #81798c;
  line-height: 1.4;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metric-card,
.panel,
.alerts-card {
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

.metric-card > strong {
  display: block;
  margin: 10px 0 7px;
  color: #6047ae;
  font-size: 30px;
}

.metric-card p {
  margin: 0;
  color: #81798c;
  font-size: 13px;
}

.progress-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 20px;
  background: #ded8ec;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #7658cf;
}

.alerts-card {
  margin-bottom: 24px;
  padding: 24px;
  border-radius: 18px;
  background: #fffafa;
  border-color: #e8cccc;
}

.alerts-card h2 {
  margin: 7px 0 14px;
}

.alerts-card ul {
  margin: 0;
  padding-left: 20px;
  color: #7c5f62;
}

.alerts-card li + li {
  margin-top: 8px;
}

.grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.panel {
  padding: 28px;
  border-radius: 20px;
}

.panel-header h2 {
  margin: 7px 0 22px;
  font-size: 24px;
}

.progress-list,
.weak-list,
.interaction-list {
  display: grid;
  gap: 14px;
}

.progress-item,
.weak-item,
.interaction-item {
  padding: 17px;
  border: 1px solid #eeeaf4;
  border-radius: 13px;
  background: #fcfbfe;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 10px;
}

.progress-info strong,
.progress-info span {
  display: block;
}

.progress-info span {
  margin-top: 4px;
  color: #8a8495;
  font-size: 12px;
}

.percentage {
  color: #684bc0;
}

.weak-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.weak-item strong,
.weak-item span {
  display: block;
}

.weak-item span {
  margin-top: 4px;
  color: #8a8495;
  font-size: 12px;
}

.weak-value {
  color: #a45a5a;
  font-size: 20px;
}

.interactions-panel {
  margin-top: 0;
}

.interaction-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.interaction-main strong,
.interaction-main span {
  display: block;
}

.interaction-main {
  min-width: 0;
}

.interaction-main strong {
  color: #4c4458;
}

.interaction-main span {
  margin-top: 6px;
  color: #918a9b;
  font-size: 11px;
}

.interaction-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.badge {
  padding: 6px 9px;
  border-radius: 20px;
  background: #eee9fb;
  color: #684bc0;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.badge.ai {
  background: #eaf0ff;
  color: #4964a6;
}

.badge.danger {
  background: #fff0f0;
  color: #a94444;
}

.badge.warning {
  background: #fff6df;
  color: #927020;
}

.empty,
.loading,
.error {
  padding: 30px;
  text-align: center;
  border-radius: 14px;
}

.empty {
  color: #8c8496;
  background: #faf9fc;
}

.loading {
  color: #684bc0;
  background: white;
}

.error {
  background: #fff0f2;
  color: #a83b4c;
}

@media (max-width: 950px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .topbar {
    padding: 0 5%;
  }

  .content {
    width: 90%;
    padding-top: 35px;
  }

  .student-header {
    display: block;
  }

  .attention-card {
    width: 100%;
    margin-top: 20px;
  }

  .metrics {
    grid-template-columns: 1fr;
  }

  .interaction-item {
    display: block;
  }

  .interaction-badges {
    justify-content: flex-start;
    margin-top: 12px;
  }
}
</style>