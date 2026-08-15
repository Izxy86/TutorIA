<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
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

interface StudentReport {
  student: {
    id: string
    name: string
    email: string
  }
  subject: {
    id: string
    name: string
  }
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
}

const router = useRouter()
const auth = useAuthStore()

const subjectId = ref(
  '9f274882-e017-4bb1-9da0-d5668f5beb12',
)

const activityType =
  ref<'LEARNING' | 'PRACTICE'>('LEARNING')

const question = ref('')
const response = ref('')
const source = ref('')
const loading = ref(false)
const error = ref('')

const report = ref<StudentReport | null>(null)

const evaluationAnswer = ref('')
const evaluationResult =
  ref<'correct' | 'incorrect' | ''>('')

const evaluating = ref(false)

const userName = computed(
  () => auth.user?.name ?? 'Estudiante',
)

const averageMastery = computed(
  () => report.value?.summary.averageMastery ?? 0,
)

const currentProgress = computed(
  () => report.value?.progress?.[0] ?? null,
)

const currentTopic = computed(
  () =>
    currentProgress.value?.topic ??
    'Sin actividad registrada',
)

const currentMastery = computed(
  () => currentProgress.value?.masteryLevel ?? 0,
)

const subjectName = computed(
  () => report.value?.subject.name ?? 'Matemática',
)

const loadReport = async () => {
  if (!auth.user?.id) return

  try {
    const { data } = await api.get<StudentReport>(
      `/reports/student/${auth.user.id}/${subjectId.value}`,
    )

    report.value = data
  } catch {
    error.value = 'No pudimos cargar tu progreso.'
  }
}

const askTutor = async () => {
  if (!question.value.trim() || !auth.user?.id) {
    return
  }

  loading.value = true
  error.value = ''
  response.value = ''
  evaluationAnswer.value = ''
  evaluationResult.value = ''

  try {
    const { data } = await api.post('/tutor/ask', {
      userId: auth.user.id,
      subjectId: subjectId.value,
      question: question.value,
      activityType: activityType.value,
    })

    response.value = data.response
    source.value = data.source

    await loadReport()
  } catch {
    error.value =
      'No pudimos procesar tu consulta. Intentá nuevamente.'
  } finally {
    loading.value = false
  }
}

const evaluateAnswer = async () => {
  if (
    !auth.user?.id ||
    !evaluationAnswer.value.trim()
  ) {
    return
  }

  evaluating.value = true
  evaluationResult.value = ''
  error.value = ''

  try {
    const { data } = await api.post('/tutor/evaluate', {
      userId: auth.user.id,
      subjectId: subjectId.value,
      topic: 'Teorema de Pitágoras',
      answer: evaluationAnswer.value,
      expectedAnswer: '5',
    })

    evaluationResult.value = data.correct
      ? 'correct'
      : 'incorrect'

    await loadReport()
  } catch {
    error.value =
      'No pudimos evaluar tu respuesta. Intentá nuevamente.'
  } finally {
    evaluating.value = false
  }
}

const logout = async () => {
  auth.logout()
  await router.push('/login')
}

onMounted(() => {
  loadReport()
})
</script>

<template>
  <div class="student-page">
    <header class="topbar">
      <div class="brand">
        <div class="logo">T</div>

        <div>
          <strong>TutorIA</strong>
          <span>Espacio del estudiante</span>
        </div>
      </div>

      <div class="user-area">
        <div class="user-info">
          <strong>{{ userName }}</strong>
          <span>Estudiante</span>
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
            TU ESPACIO DE APRENDIZAJE
          </span>

          <h1>Hola, {{ userName }}</h1>

          <p>
            Preguntá, practicá y avanzá a tu ritmo.
            TutorIA adapta la ayuda según tu progreso.
          </p>
        </div>

        <div class="progress-card">
          <span>
            Tu progreso en {{ subjectName }}
          </span>

          <div class="progress-value">
            <strong>{{ averageMastery }}%</strong>
            <small>Dominio actual</small>
          </div>

          <div class="progress-bar">
            <div
              class="progress-fill"
              :style="{
                width: `${averageMastery}%`,
              }"
            ></div>
          </div>
        </div>
      </section>

      <section class="workspace">
        <div class="question-card">
          <div class="section-title">
            <div>
              <span class="eyebrow">
                NUEVA CONSULTA
              </span>

              <h2>
                ¿Qué querés aprender hoy?
              </h2>
            </div>
          </div>

          <div class="field">
            <label>Materia</label>

            <select v-model="subjectId">
              <option
                value="9f274882-e017-4bb1-9da0-d5668f5beb12"
              >
                Matemática
              </option>
            </select>
          </div>

          <div class="field">
            <label>
              ¿Cómo querés trabajar?
            </label>

            <div class="activity-options">
              <button
                type="button"
                class="activity-button"
                :class="{
                  active:
                    activityType === 'LEARNING',
                }"
                @click="
                  activityType = 'LEARNING'
                "
              >
                <strong>Aprender</strong>
                <span>
                  Explicame un tema paso a paso
                </span>
              </button>

              <button
                type="button"
                class="activity-button"
                :class="{
                  active:
                    activityType === 'PRACTICE',
                }"
                @click="
                  activityType = 'PRACTICE'
                "
              >
                <strong>Practicar</strong>
                <span>
                  Guiame sin darme la respuesta
                </span>
              </button>
            </div>
          </div>

          <form @submit.prevent="askTutor">
            <div class="field">
              <label for="question">
                Tu pregunta
              </label>

              <textarea
                id="question"
                v-model="question"
                rows="5"
                placeholder="Ej: ¿Cómo funciona el Teorema de Pitágoras?"
                required
              ></textarea>
            </div>

            <button
              class="ask-button"
              type="submit"
              :disabled="
                loading ||
                !question.trim()
              "
            >
              {{
                loading
                  ? 'TutorIA está pensando...'
                  : 'Consultar a TutorIA'
              }}
            </button>
          </form>

          <div
            v-if="error"
            class="error"
          >
            {{ error }}
          </div>
        </div>

        <aside class="side-panel">
          <div class="topic-card">
            <span class="eyebrow">
              PROGRESO
            </span>

            <h3>{{ currentTopic }}</h3>

            <div class="topic-progress">
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width: `${currentMastery}%`,
                  }"
                ></div>
              </div>

              <strong>
                {{ currentMastery }}%
              </strong>
            </div>

            <p
              v-if="currentProgress"
            >
              {{ currentProgress.correctAnswers }}
              respuestas correctas de
              {{ currentProgress.attempts }}
              intentos.
            </p>

            <p v-else>
              Todavía no hay progreso
              registrado en esta materia.
            </p>
          </div>

          <div class="tip-card">
            <span class="tip-icon">
              i
            </span>

            <div>
              <strong>
                TutorIA aprende con vos
              </strong>

              <p>
                Tus actividades y resultados
                ayudan a adaptar las próximas
                explicaciones.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section
        v-if="response"
        class="answer-card"
      >
        <div class="answer-header">
          <div>
            <span class="eyebrow">
              RESPUESTA DE TUTORIA
            </span>

            <h2>
              Sigamos aprendiendo
            </h2>
          </div>

          <span class="source-badge">
            {{
              source === 'LOCAL'
                ? 'Material docente'
                : 'Asistencia IA'
            }}
          </span>
        </div>

        <div class="answer-content">
          {{ response }}
        </div>

        <div
          v-if="
            activityType === 'PRACTICE'
          "
          class="evaluation-box"
        >
          <span class="eyebrow">
            COMPROBÁ TU APRENDIZAJE
          </span>

          <h3>
            Ahora probá vos
          </h3>

          <p>
            Escribí tu respuesta para registrar
            tu progreso.
          </p>

          <div class="evaluation-row">
            <input
              v-model="evaluationAnswer"
              type="text"
              placeholder="Tu respuesta"
              @keyup.enter="evaluateAnswer"
            />

            <button
              type="button"
              :disabled="
                evaluating ||
                !evaluationAnswer.trim()
              "
              @click="evaluateAnswer"
            >
              {{
                evaluating
                  ? 'Evaluando...'
                  : 'Comprobar'
              }}
            </button>
          </div>

          <div
            v-if="
              evaluationResult === 'correct'
            "
            class="evaluation-feedback success"
          >
            Correcto. Tu progreso fue
            actualizado.
          </div>

          <div
            v-if="
              evaluationResult === 'incorrect'
            "
            class="evaluation-feedback incorrect"
          >
            Todavía no. Revisá el procedimiento
            e intentá nuevamente.
          </div>
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

.student-page {
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
.user-area {
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
.user-info strong {
  display: block;
}

.brand span,
.user-info span {
  display: block;
  margin-top: 2px;
  color: #8a8497;
  font-size: 12px;
}

.user-info {
  text-align: right;
}

.logout-button {
  padding: 9px 15px;
  border: 1px solid #ddd8e9;
  border-radius: 9px;
  background: white;
  color: #5e566c;
  cursor: pointer;
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
  margin-bottom: 38px;
}

.eyebrow {
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
  max-width: 590px;
  margin: 0;
  color: #777083;
  line-height: 1.6;
}

.progress-card {
  width: 300px;
  padding: 20px;
  border-radius: 16px;
  background: #eee9fb;
}

.progress-card > span {
  color: #685e78;
  font-size: 13px;
}

.progress-value {
  margin: 12px 0;
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.progress-value strong {
  color: #684bc0;
  font-size: 30px;
}

.progress-value small {
  color: #898194;
}

.progress-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 20px;
  background: #ddd6ee;
}

.progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #7658cf;
  transition: width 0.35s ease;
}

.workspace {
  display: grid;
  grid-template-columns:
    minmax(0, 2fr)
    minmax(260px, 1fr);
  gap: 24px;
}

.question-card,
.topic-card,
.tip-card,
.answer-card {
  border: 1px solid #ebe8f3;
  background: white;
  box-shadow:
    0 10px 35px
    rgba(74, 54, 119, 0.05);
}

.question-card {
  padding: 32px;
  border-radius: 20px;
}

.section-title h2,
.answer-header h2 {
  margin: 7px 0 26px;
  font-size: 25px;
}

.field {
  margin-bottom: 23px;
}

.field label {
  display: block;
  margin-bottom: 9px;
  color: #51495f;
  font-size: 14px;
  font-weight: 700;
}

select,
textarea {
  width: 100%;
  border: 1px solid #dcd7e8;
  border-radius: 11px;
  outline: none;
  background: #fcfbfe;
  color: #302947;
  font: inherit;
}

select {
  min-height: 48px;
  padding: 0 14px;
}

textarea {
  padding: 14px;
  resize: vertical;
  line-height: 1.5;
}

select:focus,
textarea:focus {
  border-color: #8064cf;
  box-shadow:
    0 0 0 4px
    rgba(128, 100, 207, 0.1);
}

.activity-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.activity-button {
  padding: 16px;
  text-align: left;
  border: 1px solid #ddd8e9;
  border-radius: 12px;
  background: white;
  color: #4e475d;
  cursor: pointer;
}

.activity-button strong,
.activity-button span {
  display: block;
}

.activity-button span {
  margin-top: 5px;
  color: #8a8495;
  font-size: 12px;
}

.activity-button.active {
  border-color: #7658cf;
  background: #f2eefc;
  color: #6648bd;
}

.ask-button {
  width: 100%;
  min-height: 50px;
  border: 0;
  border-radius: 11px;
  background: #7658cf;
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.ask-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.side-panel {
  display: grid;
  align-content: start;
  gap: 18px;
}

.topic-card,
.tip-card {
  padding: 24px;
  border-radius: 18px;
}

.topic-card h3 {
  margin: 9px 0 20px;
}

.topic-progress {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
}

.topic-progress strong {
  color: #684bc0;
}

.topic-card p,
.tip-card p {
  margin: 15px 0 0;
  color: #81798c;
  font-size: 13px;
  line-height: 1.55;
}

.tip-card {
  display: flex;
  gap: 13px;
  background: #f0ecfb;
}

.tip-icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: #7658cf;
  color: white;
  font-weight: 700;
}

.tip-card strong {
  color: #594498;
}

.answer-card {
  margin-top: 24px;
  padding: 32px;
  border-radius: 20px;
}

.answer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.source-badge {
  padding: 7px 11px;
  border-radius: 20px;
  background: #eee9fb;
  color: #684bc0;
  font-size: 12px;
  font-weight: 700;
}

.answer-content {
  padding: 22px;
  border-radius: 14px;
  background: #faf9fd;
  color: #51495f;
  line-height: 1.75;
  white-space: pre-wrap;
}

.evaluation-box {
  margin-top: 24px;
  padding: 22px;
  border-radius: 14px;
  background: #f3effc;
}

.evaluation-box h3 {
  margin: 8px 0;
  color: #4f3a91;
  font-size: 20px;
}

.evaluation-box p {
  margin: 0 0 16px;
  color: #756d80;
  font-size: 14px;
}

.evaluation-row {
  display: flex;
  gap: 10px;
}

.evaluation-row input {
  flex: 1;
  min-height: 44px;
  padding: 0 13px;
  border: 1px solid #d8d2e7;
  border-radius: 10px;
  outline: none;
  background: white;
  color: #302947;
  font: inherit;
}

.evaluation-row input:focus {
  border-color: #8064cf;
  box-shadow:
    0 0 0 4px
    rgba(128, 100, 207, 0.1);
}

.evaluation-row button {
  min-width: 120px;
  padding: 0 18px;
  border: 0;
  border-radius: 10px;
  background: #7658cf;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.evaluation-row button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.evaluation-feedback {
  margin-top: 14px;
  padding: 11px 13px;
  border-radius: 9px;
  font-size: 14px;
}

.evaluation-feedback.success {
  background: #edf8f0;
  color: #2f7341;
}

.evaluation-feedback.incorrect {
  background: #fff2f2;
  color: #a44444;
}

.error {
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: #fff0f2;
  color: #a83b4c;
}

@media (max-width: 850px) {
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

  .progress-card {
    width: 100%;
    margin-top: 25px;
  }

  .workspace {
    grid-template-columns: 1fr;
  }

  .activity-options {
    grid-template-columns: 1fr;
  }

  .evaluation-row {
    flex-direction: column;
  }

  .evaluation-row button {
    min-height: 44px;
  }

  .user-info {
    display: none;
  }
}
</style>