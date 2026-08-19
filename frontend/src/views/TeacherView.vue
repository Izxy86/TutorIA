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

interface KnowledgeItem {
  id: string
  title: string
  content: string
  topic?: string | null
  source: 'TEACHER' | 'AI'
  validated: boolean
  createdAt: string
  updatedAt: string
  subjectId: string
}

interface Subject {
  id: string
  name: string
}

const subjects = ref<Subject[]>([])
const subjectId = ref('')

const router = useRouter()
const auth = useAuthStore()



const dashboard = ref<TeacherDashboard | null>(null)
const knowledgeItems = ref<KnowledgeItem[]>([])

const loading = ref(false)
const knowledgeLoading = ref(false)
const savingMaterial = ref(false)

const error = ref('')
const materialError = ref('')
const materialSuccess = ref('')

const materialTitle = ref('')
const materialTopic = ref('')
const materialContent = ref('')

const loadSubjects = async () => {
  const { data } = await api.get<Subject[]>('/subjects')

  subjects.value = data

  if (data.length > 0 && !subjectId.value) {
    subjectId.value = data[0]!.id
  }
}

const changeSubject = async () => {
  dashboard.value = null
  knowledgeItems.value = []

  await Promise.all([
    loadDashboard(),
    loadKnowledge(),
  ])
}

const userName = computed(
  () => auth.user?.name ?? 'Docente',
)

const totalStudents = computed(
  () =>
    dashboard.value?.summary.totalStudents ??
    0,
)

const studentsNeedingAttention = computed(
  () =>
    dashboard.value?.summary
      .studentsNeedingAttention ?? 0,
)

const averageCourseMastery = computed(() => {
  const students =
    dashboard.value?.students ?? []

  if (students.length === 0) {
    return 0
  }

  const total = students.reduce(
    (sum, student) =>
      sum + student.averageMastery,
    0,
  )

  return Math.round(
    total / students.length,
  )
})

const totalEvasions = computed(() =>
  (dashboard.value?.students ?? []).reduce(
    (sum, student) =>
      sum + student.evasions,
    0,
  ),
)

const teacherMaterials = computed(() =>
  knowledgeItems.value.filter(
    (item) =>
      item.source === 'TEACHER',
  ),
)

const aiMaterials = computed(() =>
  knowledgeItems.value.filter(
    (item) =>
      item.source === 'AI',
  ),
)

const loadDashboard = async () => {
  loading.value = true
  error.value = ''

  try {
    const { data } =
      await api.get<TeacherDashboard>(
        `/reports/teacher/${subjectId.value}`,
      )

    dashboard.value = data
  } catch {
    error.value =
      'No pudimos cargar el dashboard docente.'
  } finally {
    loading.value = false
  }
}

const loadKnowledge = async () => {
  knowledgeLoading.value = true
  materialError.value = ''

  try {
    const { data } =
      await api.get<KnowledgeItem[]>(
        `/knowledge/subject/${subjectId.value}`,
      )

    knowledgeItems.value = data
  } catch {
    materialError.value =
      'No pudimos cargar el material de la materia.'
  } finally {
    knowledgeLoading.value = false
  }
}

const saveMaterial = async () => {
  if (
    !materialTitle.value.trim() ||
    !materialContent.value.trim()
  ) {
    materialError.value =
      'Completá el título y el contenido.'
    return
  }

  savingMaterial.value = true
  materialError.value = ''
  materialSuccess.value = ''

  try {
    await api.post('/knowledge', {
      subjectId: subjectId.value,
      title: materialTitle.value.trim(),
      content:
        materialContent.value.trim(),
      topic:
        materialTopic.value.trim() ||
        undefined,
    })

    materialTitle.value = ''
    materialTopic.value = ''
    materialContent.value = ''

    materialSuccess.value =
      'Material guardado correctamente.'

    await loadKnowledge()
  } catch(err:any) {
    materialError.value =
    err?.response?.data?.message ??
    'No pudimos guardar el material.'
  } finally {
    savingMaterial.value = false
  }
}

const openStudent = (userId: string) => {
  router.push(
    `/teacher/student/${userId}/${subjectId.value}`,
  )
}

const logout = async () => {
  auth.logout()
  await router.push('/login')
}

const formatDate = (
  date: string,
) => {
  return new Intl.DateTimeFormat(
    'es-AR',
    {
      dateStyle: 'short',
    },
  ).format(new Date(date))
}

const validateKnowledge = async (id: string) => {
  try {
    await api.patch(`/knowledge/${id}/validate`)
    await loadKnowledge()
  } catch {
    materialError.value =
      'No pudimos validar el contenido.'
  }
}

const deleteKnowledge = async (id: string) => {
  const confirmed = window.confirm(
    '¿Seguro que querés eliminar este contenido?',
  )

  if (!confirmed) return

  try {
    await api.delete(`/knowledge/${id}`)
    await loadKnowledge()
  } catch {
    materialError.value =
      'No pudimos eliminar el contenido.'
  }
}

onMounted(async () => {
  await loadSubjects()

  if (subjectId.value) {
    await Promise.all([
      loadDashboard(),
      loadKnowledge(),
    ])
  }
})
</script>

<template>
  <div class="teacher-page">
    <header class="topbar">
      <div class="brand">
        <div class="logo">
          T
        </div>

        <div>
          <strong>
            TutorIA
          </strong>

          <span>
            Panel docente
          </span>
        </div>
      </div>

      <div class="user-area">
        <div class="user-info">
          <strong>
            {{ userName }}
          </strong>

          <span>
            Docente
          </span>
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
      <!-- BIENVENIDA -->

      <section class="welcome">
        <div>
          <span class="eyebrow">
            SEGUIMIENTO ACADÉMICO
          </span>

          <h1>
            Hola, {{ userName }}
          </h1>

          <p>
            Revisá el progreso de tus
            estudiantes, detectá dificultades
            y priorizá dónde intervenir.
          </p>
        </div>

        <div class="subject-card">
  <span>Materia seleccionada</span>

  <select
    v-model="subjectId"
    class="subject-select"
    @change="changeSubject"
  >
    <option
      v-for="subject in subjects"
      :key="subject.id"
      :value="subject.id"
    >
      {{ subject.name }}
    </option>
  </select>

  <small>
    Seguimiento actualizado con datos reales
  </small>
</div>
      </section>

      <!-- MÉTRICAS -->

      <section class="metrics">
        <article class="metric-card">
          <span class="metric-label">
            ESTUDIANTES
          </span>

          <strong>
            {{ totalStudents }}
          </strong>

          <p>
            Alumnos con actividad registrada.
          </p>
        </article>

        <article
          class="metric-card warning"
        >
          <span class="metric-label">
            REQUIEREN ATENCIÓN
          </span>

          <strong>
            {{ studentsNeedingAttention }}
          </strong>

          <p>
            Presentan dificultades o señales
            de riesgo.
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

          <strong>
            {{ totalEvasions }}
          </strong>

          <p>
            Intentos de obtener respuestas
            directas.
          </p>
        </article>
      </section>

      <!-- ALUMNOS -->

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
            {{
              loading
                ? 'Actualizando...'
                : 'Actualizar'
            }}
          </button>
        </div>

        <div
          v-if="error"
          class="error"
        >
          {{ error }}
        </div>

        <div
          v-if="
            !loading &&
            dashboard?.students.length ===
              0
          "
          class="empty-state"
        >
          No hay actividad registrada todavía.
        </div>

        <div
          v-else
          class="student-list"
        >
          <article
            v-for="
              student in dashboard?.students
            "
            :key="student.student.id"
            class="student-card"
            :class="{
              attention:
                student.needsAttention,
            }"
            @click="
              openStudent(
                student.student.id,
              )
            "
          >
            <div class="student-main">
              <div class="avatar">
                {{
                  student.student.name
                    .charAt(0)
                    .toUpperCase()
                }}
              </div>

              <div>
                <strong>
                  {{
                    student.student.name
                  }}
                </strong>

                <span>
                  {{
                    student.student.email
                  }}
                </span>
              </div>
            </div>

            <div class="student-mastery">
              <span>
                Dominio promedio
              </span>

              <strong>
                {{
                  student.averageMastery
                }}%
              </strong>

              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{
                    width:
                      `${student.averageMastery}%`,
                  }"
                ></div>
              </div>
            </div>

            <div class="student-stats">
              <div>
                <span>
                  Interacciones
                </span>

                <strong>
                  {{
                    student.totalInteractions
                  }}
                </strong>
              </div>

              <div>
                <span>
                  Evasiones
                </span>

                <strong>
                  {{ student.evasions }}
                </strong>
              </div>

              <div>
                <span>
                  Pedidos de ayuda
                </span>

                <strong>
                  {{
                    student.helpRequests
                  }}
                </strong>
              </div>
            </div>

            <div class="student-status">
              <span
                v-if="
                  student.needsAttention
                "
                class="
                  status-badge
                  attention
                "
              >
                Requiere atención
              </span>

              <span
                v-else
                class="
                  status-badge
                  ok
                "
              >
                Evolución estable
              </span>
            </div>

            <div
              v-if="
                student.weakTopics
                  .length > 0
              "
              class="weak-topics"
            >
              <span class="weak-title">
                Temas a reforzar
              </span>

              <div class="topic-tags">
                <span
                  v-for="
                    topic in
                    student.weakTopics
                  "
                  :key="topic.topic"
                  class="topic-tag"
                >
                  {{ topic.topic }}
                  ·
                  {{
                    topic.masteryLevel
                  }}%
                </span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- MATERIAL DOCENTE -->

      <section class="knowledge-section">
        <div class="knowledge-header">
          <div>
            <span class="eyebrow">
              BASE DE CONOCIMIENTO
            </span>

            <h2>
              Material de la materia
            </h2>

            <p>
              Cargá contenido institucional
              para que TutorIA lo consulte antes
              de utilizar inteligencia artificial.
            </p>
          </div>

          <div class="knowledge-counters">
            <div>
              <strong>
                {{ teacherMaterials.length }}
              </strong>

              <span>
                Docente
              </span>
            </div>

            <div>
              <strong>
                {{ aiMaterials.length }}
              </strong>

              <span>
                IA reutilizada
              </span>
            </div>
          </div>
        </div>

        <div class="knowledge-grid">
          <!-- FORMULARIO -->

          <article class="material-form-card">
            <span class="eyebrow">
              NUEVO MATERIAL
            </span>

            <h3>
              Agregar contenido
            </h3>
            <div class="material-field">
              <label for="materialSubject">
                Materia
              </label>

              <select
                id="materialSubject"
                v-model="subjectId"
                @change="changeSubject"
              >
                <option
                  v-for="subject in subjects"
                  :key="subject.id"
                  :value="subject.id"
                >
                  {{ subject.name }}
                </option>
              </select>
            </div>
            <div class="material-field">
              <label for="materialTitle">
                Título
              </label>

              <input
                id="materialTitle"
                v-model="materialTitle"
                type="text"
                placeholder="Ej: Ecuaciones de primer grado"
              />
            </div>

            <div class="material-field">
              <label for="materialTopic">
                Tema
              </label>

              <input
                id="materialTopic"
                v-model="materialTopic"
                type="text"
                placeholder="Ej: Álgebra"
              />
            </div>

            <div class="material-field">
              <label for="materialContent">
                Contenido
              </label>

              <textarea
                id="materialContent"
                v-model="materialContent"
                rows="7"
                placeholder="Escribí el contenido aprobado que TutorIA puede utilizar..."
              ></textarea>
            </div>

            <div
              v-if="materialError"
              class="material-message error"
            >
              {{ materialError }}
            </div>

            <div
              v-if="materialSuccess"
              class="
                material-message
                success
              "
            >
              {{ materialSuccess }}
            </div>

            <button
              class="save-material-button"
              type="button"
              :disabled="savingMaterial"
              @click="saveMaterial"
            >
              {{
                savingMaterial
                  ? 'Guardando...'
                  : 'Guardar material'
              }}
            </button>
          </article>

          <!-- LISTADO -->

          <article class="material-list-card">
            <div class="material-list-header">
              <div>
                <span class="eyebrow">
                  CONTENIDO DISPONIBLE
                </span>

                <h3>
                  Base actual
                </h3>
              </div>

              <button
                class="secondary-button"
                :disabled="knowledgeLoading"
                @click="loadKnowledge"
              >
                {{
                  knowledgeLoading
                    ? 'Actualizando...'
                    : 'Actualizar'
                }}
              </button>
            </div>

            <div
              v-if="
                !knowledgeLoading &&
                knowledgeItems.length === 0
              "
              class="empty-state"
            >
              Todavía no hay material cargado.
            </div>

            <div
              v-else
              class="knowledge-list"
            >
              <article
                v-for="
                  item in knowledgeItems
                "
                :key="item.id"
                class="knowledge-item"
              >
                <div class="knowledge-item-header">
                  <div>
                    <strong>
                      {{ item.title }}
                    </strong>

                    <span>
                      {{
                        item.topic ||
                        'Sin tema'
                      }}
                    </span>
                  </div>

                  <span
                    class="source-tag"
                    :class="{
                      ai:
                        item.source ===
                        'AI',
                    }"
                  >
                    {{
                      item.source ===
                      'TEACHER'
                        ? 'Docente'
                        : 'IA'
                    }}
                  </span>
                </div>

                <p>
                  {{ item.content }}
                </p>

                <div class="knowledge-footer">
                  <span>
                    {{
                      formatDate(
                        item.createdAt,
                      )
                    }}
                  </span>

                  <span
                    class="validation-tag"
                    :class="{
                      validated:
                        item.validated,
                    }"
                  >
                    {{
                      item.validated
                        ? 'Validado'
                        : 'Pendiente'
                    }}
                  </span>
                </div>
                <div class="knowledge-actions">
                  <button
                    v-if="!item.validated"
                    class="validate-button"
                    type="button"
                    @click="validateKnowledge(item.id)"
                  >
                    Validar
                  </button>

                  <button
                    class="delete-button"
                    type="button"
                    @click="deleteKnowledge(item.id)"
                  >
                    Eliminar
                  </button>
                </div>
              </article>
            </div>
          </article>
        </div>
      </section>

      <!-- INFORMACIÓN -->

      <section class="info-panel">
        <div class="info-icon">
          i
        </div>

        <div>
          <strong>
            ¿Cómo se generan las alertas?
          </strong>

          <p>
            TutorIA combina progreso académico,
            pedidos reiterados de ayuda y
            conductas de evasión. El objetivo
            es orientar la intervención docente,
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

/* HEADER */

.topbar {
  height: 76px;
  padding: 0 7%;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: white;

  border-bottom:
    1px solid #ebe8f3;
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
.refresh-button,
.secondary-button {
  padding: 9px 15px;

  border-radius: 9px;

  cursor: pointer;
  font-weight: 600;
}

.logout-button,
.secondary-button {
  border:
    1px solid #ddd8e9;

  background: white;
  color: #5e566c;
}

.refresh-button {
  border: 0;

  background: #7658cf;
  color: white;
}

.refresh-button:disabled,
.secondary-button:disabled {
  opacity: 0.55;
  cursor: wait;
}

/* CONTENT */

.content {
  width: min(1180px, 88%);

  margin: 0 auto;

  padding: 52px 0 70px;
}

/* WELCOME */

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

/* MÉTRICAS */

.metrics {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 16px;

  margin-bottom: 24px;
}

.metric-card,
.dashboard-card,
.knowledge-section,
.info-panel {
  border:
    1px solid #ebe8f3;

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

/* DASHBOARD */

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

/* STUDENTS */

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

  border:
    1px solid #ebe8f3;

  border-radius: 16px;

  background: #fcfbfe;

  cursor: pointer;

  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.student-card:hover {
  transform:
    translateY(-2px);

  box-shadow:
    0 10px 28px
    rgba(74, 54, 119, 0.1);
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

  grid-template-columns:
    repeat(3, 1fr);

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

  border-top:
    1px solid #eeeaf4;
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

/* MATERIAL */

.knowledge-section {
  margin-top: 24px;

  padding: 30px;

  border-radius: 20px;
}

.knowledge-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 30px;

  margin-bottom: 26px;
}

.knowledge-header h2 {
  margin: 7px 0 7px;

  font-size: 26px;
}

.knowledge-header p {
  max-width: 620px;

  margin: 0;

  color: #81798d;

  font-size: 14px;

  line-height: 1.55;
}

.knowledge-counters {
  display: flex;

  gap: 10px;
}

.knowledge-counters div {
  min-width: 100px;

  padding: 13px;

  text-align: center;

  border-radius: 12px;

  background: #f2eefb;
}

.knowledge-counters strong,
.knowledge-counters span {
  display: block;
}

.knowledge-counters strong {
  color: #684bc0;

  font-size: 22px;
}

.knowledge-counters span {
  margin-top: 3px;

  color: #81798d;

  font-size: 11px;
}

.knowledge-grid {
  display: grid;

  grid-template-columns:
    minmax(300px, 0.9fr)
    minmax(0, 1.6fr);

  gap: 20px;
}

.material-form-card,
.material-list-card {
  padding: 24px;

  border:
    1px solid #ebe8f3;

  border-radius: 16px;

  background: #fcfbfe;
}

.material-form-card h3,
.material-list-card h3 {
  margin: 7px 0 20px;

  font-size: 21px;
}

.material-field input,
.material-field textarea,
.material-field select {
  width: 100%;
  padding: 11px 13px;
  border: 1px solid #dcd7e8;
  border-radius: 10px;
  outline: none;
  background: white;
  color: #302947;
  font: inherit;
}

.material-field {
  margin-bottom: 16px;
}

.material-field label {
  display: block;

  margin-bottom: 7px;

  color: #51495f;

  font-size: 13px;
  font-weight: 700;
}

.material-field input,
.material-field textarea {
  width: 100%;

  padding: 11px 13px;

  border:
    1px solid #dcd7e8;

  border-radius: 10px;

  outline: none;

  background: white;

  color: #302947;

  font: inherit;
}

.material-field textarea {
  resize: vertical;

  line-height: 1.5;
}

.material-field input:focus,
.material-field textarea:focus {
  border-color: #8064cf;

  box-shadow:
    0 0 0 4px
    rgba(128, 100, 207, 0.1);
}

.save-material-button {
  width: 100%;

  min-height: 46px;

  border: 0;

  border-radius: 10px;

  background: #7658cf;

  color: white;

  font-weight: 700;

  cursor: pointer;
}

.save-material-button:disabled {
  opacity: 0.55;

  cursor: wait;
}

.material-list-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 16px;
}

.knowledge-list {
  display: grid;

  gap: 12px;

  max-height: 580px;

  overflow-y: auto;

  padding-right: 4px;
}

.knowledge-item {
  padding: 17px;

  border:
    1px solid #ebe8f3;

  border-radius: 13px;

  background: white;
}

.knowledge-item-header {
  display: flex;

  align-items: flex-start;
  justify-content: space-between;

  gap: 15px;
}

.knowledge-item-header strong,
.knowledge-item-header span {
  display: block;
}

.knowledge-item-header span:not(
  .source-tag
) {
  margin-top: 4px;

  color: #91899a;

  font-size: 11px;
}

.knowledge-item p {
  display: -webkit-box;

  overflow: hidden;

  margin: 14px 0;

  color: #696171;

  font-size: 13px;

  line-height: 1.55;

  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}

.knowledge-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.validate-button,
.delete-button {
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.validate-button {
  border: 1px solid #cfdcca;
  background: #edf8f0;
  color: #39744a;
}

.delete-button {
  border: 1px solid #ebcccc;
  background: #fff2f2;
  color: #a94444;
}

.source-tag,
.validation-tag {
  padding: 6px 9px;

  border-radius: 20px;

  font-size: 10px;
  font-weight: 700;

  white-space: nowrap;
}

.source-tag {
  background: #eee9fb;

  color: #684bc0;
}

.source-tag.ai {
  background: #eaf0ff;

  color: #4964a6;
}

.knowledge-footer {
  display: flex;

  justify-content: space-between;

  gap: 10px;

  color: #99929f;

  font-size: 10px;
}

.validation-tag {
  background: #f3f1f5;

  color: #81798c;
}

.validation-tag.validated {
  background: #edf8f0;

  color: #39744a;
}

.material-message {
  margin-bottom: 14px;

  padding: 10px 12px;

  border-radius: 9px;

  font-size: 12px;
}

.material-message.success {
  background: #edf8f0;

  color: #39744a;
}

/* INFO */

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

/* RESPONSIVE */

@media (max-width: 1050px) {
  .metrics {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .student-card {
    grid-template-columns:
      1fr 1fr;
  }

  .student-status {
    text-align: right;
  }

  .knowledge-grid {
    grid-template-columns: 1fr;
  }
}

.subject-select {
  width: 100%;
  margin: 8px 0;
  padding: 10px 12px;
  border: 1px solid #d8d1ea;
  border-radius: 9px;
  background: white;
  color: #684bc0;
  font: inherit;
  font-weight: 700;
  outline: none;
  cursor: pointer;
}

@media (max-width: 750px) {
  .topbar {
    padding: 0 5%;
  }

  .content {
    width: 90%;

    padding-top: 35px;
  }

  .welcome,
  .knowledge-header {
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
    grid-template-columns:
      1fr 1fr 1fr;
  }

  .knowledge-counters {
    margin-top: 18px;
  }

  .user-info {
    display: none;
  }
}
</style>