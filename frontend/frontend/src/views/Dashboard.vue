<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h1>RW0860 KIGUFI AI - Child Development Dashboard</h1>
      <button @click="handleLogout" class="btn-logout">Sohoka (Logout)</button>
    </header>

    <main class="dashboard-content">
      <!-- Success / Error Messages -->
      <div v-if="message" :class="['alert', isError ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>

      <div class="dashboard-grid">
        <!-- Form yo Kwandika no Gukosora Umwana -->
        <div class="card">
          <h3>{{ editingId ? "KOSORA AMAKURU Y'UMWANA" : "ANDIKA AMAKURU Y'UMWANA" }}</h3>
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label>Amazina y'Umwana (Full Name)</label>
              <input type="text" v-model="fullName" placeholder="Urugero: Niyonkuru Kevin" required />
            </div>

            <div class="form-group">
              <label>Ishuri cyangwa Icyiciro (Class)</label>
              <input type="text" v-model="studentClass" placeholder="Urugero: Nursery 1 / Primary 3" required />
            </div>

            <!-- Drag and Drop Box y'Ifoto -->
            <div class="form-group">
              <label>Ifoto y'Umwana (Profile Photo)</label>
              <div 
                class="drop-zone" 
                @dragover.prevent="isDragging = true" 
                @dragleave.prevent="isDragging = false" 
                @drop.prevent="handleDrop"
                :class="{ 'dragging': isDragging }"
                @click="triggerFileInput"
              >
                <input 
                  type="file" 
                  ref="fileInput" 
                  class="file-input" 
                  accept="image/*" 
                  @change="handleFileSelect" 
                />
                
                <div v-if="photoUrl" class="image-preview">
                  <img :src="photoUrl" alt="Preview" />
                  <p class="change-text">Kanda cyangwa unyagize hano niba wifuza guhindura ifoto</p>
                </div>
                <div v-else class="drop-prompt">
                  <p>📁 <strong>Kurura ujugunye ifoto hano (Drag & Drop)</strong></p>
                  <span>cyangwa kanda hano uyitore muri kompyuta</span>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>Imyaka (Age)</label>
              <input type="number" v-model="age" placeholder="Urugero: 5" required />
            </div>

            <div class="form-group">
              <label>Uburemere (Weight - kg)</label>
              <input type="number" step="0.1" v-model="weight" placeholder="Urugero: 18.5" required />
            </div>

            <div class="form-group">
              <label>Icyitonderwa cy'Iterambere (Notes)</label>
              <textarea v-model="developmentNotes" placeholder="Andika uko yitwara cyangwa ubuzima bwe..."></textarea>
            </div>

            <div class="btn-group">
              <button type="submit" class="btn-submit" :disabled="loading">
                {{ loading ? 'Birimo kubikwa...' : (editingId ? 'Vugurura Amakuru' : 'Bika Amakuru y\'Umwana') }}
              </button>
              <button v-if="editingId" type="button" class="btn-cancel" @click="resetForm">Hagarika</button>
            </div>
          </form>
        </div>

        <!-- Urutonde rw'Abana Banditswe -->
        <div class="card">
          <h3>Urutonde rw'Abana Banditswe</h3>
          <div v-if="children.length === 0" class="no-data">
            Nta bana barandikwa muri system.
          </div>
          <ul v-else class="children-list">
            <li v-for="child in children" :key="child._id" class="child-item">
              <div class="child-card-header">
                <img 
                  :src="child.photoUrl || 'https://via.placeholder.com/60?text=Child'" 
                  alt="Profile" 
                  class="child-avatar" 
                />
                <div class="child-info">
                  <strong>{{ child.fullName }}</strong>
                  <span class="badge-class">📚 {{ child.studentClass }}</span>
                </div>
                <div class="action-btns">
                  <button @click="startEdit(child)" class="btn-edit">Edit</button>
                  <button @click="deleteChild(child._id)" class="btn-delete">Delete</button>
                </div>
              </div>
              <p>Imyaka: {{ child.age }} | Uburemere: {{ child.weight }} kg</p>
              <p class="notes" v-if="child.developmentNotes">Ubutumwa: {{ child.developmentNotes }}</p>

              <!-- Smart AI Recommendation -->
              <div class="ai-box">
                <p class="ai-title">🤖 KIGUFI AI Recommendation:</p>
                <p class="ai-text">{{ getAiRecommendation(child.age, child.weight) }}</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const fullName = ref('');
const studentClass = ref('');
const photoUrl = ref('');
const age = ref('');
const weight = ref('');
const developmentNotes = ref('');
const message = ref('');
const isError = ref(false);
const loading = ref(false);
const children = ref([]);
const editingId = ref(null);

const fileInput = ref(null);
const isDragging = ref(false);

const userId = localStorage.getItem('userId') || '64a5f2e1b8c9d1a2b3c4d5e6';

// Uburyo bwo guhindura photo file muri Base64 string
const processFile = (file) => {
  if (!file || !file.type.startsWith('image/')) {
    alert('Nyamuneka hitamo fayiri y\'ifoto yonyine!');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    photoUrl.value = e.target.result; // Base64 Data URL
  };
  reader.readAsDataURL(file);
};

const handleDrop = (e) => {
  isDragging.value = false;
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};

const handleFileSelect = (e) => {
  const files = e.target.files;
  if (files.length > 0) {
    processFile(files[0]);
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const fetchChildren = async () => {
  try {
    const response = await axios.get(`http://localhost:5000/api/children/${userId}`);
    children.value = response.data;
  } catch (err) {
    console.error('Error fetching children:', err);
  }
};

const handleSubmit = async () => {
  message.value = '';
  isError.value = false;
  loading.value = true;

  try {
    const payload = {
      userId,
      fullName: fullName.value.trim(),
      studentClass: studentClass.value.trim(),
      photoUrl: photoUrl.value,
      age: Number(age.value),
      weight: Number(weight.value),
      developmentNotes: developmentNotes.value.trim(),
    };

    if (editingId.value) {
      const response = await axios.put(`http://localhost:5000/api/children/${editingId.value}`, payload);
      message.value = response.data.message;
    } else {
      const response = await axios.post('http://localhost:5000/api/children', payload);
      message.value = response.data.message;
    }

    resetForm();
    fetchChildren();
  } catch (err) {
    isError.value = true;
    message.value = err.response?.data?.message || 'Hari ikibazo cyabaye!';
  } finally {
    loading.value = false;
  }
};

const startEdit = (child) => {
  editingId.value = child._id;
  fullName.value = child.fullName;
  studentClass.value = child.studentClass || '';
  photoUrl.value = child.photoUrl || '';
  age.value = child.age;
  weight.value = child.weight;
  developmentNotes.value = child.developmentNotes || '';
};

const deleteChild = async (id) => {
  if (!confirm("Ese wizeye ko wifuza gusiba uyu mwana?")) return;

  try {
    const response = await axios.delete(`http://localhost:5000/api/children/${id}`);
    message.value = response.data.message;
    fetchChildren();
  } catch (err) {
    isError.value = true;
    message.value = err.response?.data?.message || 'Ikibazo mu gusiba!';
  }
};

const resetForm = () => {
  editingId.value = null;
  fullName.value = '';
  studentClass.value = '';
  photoUrl.value = '';
  age.value = '';
  weight.value = '';
  developmentNotes.value = '';
};

const getAiRecommendation = (childAge, childWeight) => {
  if (childAge <= 5) {
    if (childWeight < 15) {
      return "Umwana afite uburemere bukeya. Hitamo kumuha indyo yuzuye irimo amata n'imboga.";
    } else {
      return "Ubuzima bw'umwana n'uburemere buri mu cyiciro cyiza. Komeza umwitabire.";
    }
  } else {
    return "Umwana akomeje gukurura neza mu ishuri no mu mikurire. Komeza umufashe mu masomo ye.";
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  router.push('/');
};

onMounted(() => {
  fetchChildren();
});
</script>

<style scoped>
.dashboard-container { min-height: 100vh; background-color: #f4f7f6; font-family: Arial, sans-serif; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; background-color: #2c3e50; color: white; padding: 15px 30px; }
.btn-logout { background-color: #e74c3c; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; }
.dashboard-content { padding: 30px; }
.dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
.card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 4px; color: #34495e; font-weight: bold; font-size: 13px; }
.form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
.form-group textarea { resize: vertical; height: 60px; }

/* Styling y'akazu ka Drag and Drop */
.drop-zone {
  border: 2px dashed #3498db;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  background-color: #f8fbfe;
  cursor: pointer;
  transition: all 0.3s ease;
}
.drop-zone:hover, .drop-zone.dragging {
  background-color: #e3f2fd;
  border-color: #2980b9;
}
.file-input { display: none; }
.drop-prompt p { margin: 0; color: #2c3e50; font-size: 13px; }
.drop-prompt span { color: #7f8c8d; font-size: 11px; }
.image-preview img { width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #27ae60; }
.change-text { font-size: 11px; color: #7f8c8d; margin-top: 4px; }

.btn-group { display: flex; gap: 10px; margin-top: 10px; }
.btn-submit { flex: 1; padding: 10px; background-color: #27ae60; color: white; border: none; border-radius: 5px; font-size: 15px; cursor: pointer; font-weight: bold; }
.btn-cancel { padding: 10px; background-color: #95a5a6; color: white; border: none; border-radius: 5px; cursor: pointer; }
.children-list { list-style: none; padding: 0; }
.child-item { background: #fdfdfd; border: 1px solid #e1e8ed; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
.child-card-header { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
.child-avatar { width: 55px; height: 55px; border-radius: 50%; object-fit: cover; border: 2px solid #3498db; }
.child-info { flex: 1; }
.child-info strong { display: block; color: #2c3e50; font-size: 16px; }
.badge-class { display: inline-block; background: #e8f4fd; color: #2980b9; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-top: 3px; }
.action-btns button { margin-left: 4px; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
.btn-edit { background-color: #f39c12; color: white; }
.btn-delete { background-color: #e74c3c; color: white; }
.notes { font-style: italic; color: #7f8c8d; font-size: 13px; margin: 5px 0; }
.ai-box { background: #eef9fe; border-left: 4px solid #3498db; padding: 8px 12px; margin-top: 10px; border-radius: 4px; }
.ai-title { font-weight: bold; color: #2980b9; margin: 0 0 4px 0; font-size: 12px; }
.ai-text { margin: 0; color: #34495e; font-size: 12px; }
.alert { padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; text-align: center; }
.alert-success { background-color: #d4edda; color: #155724; }
.alert-error { background-color: #f8d7da; color: #721c24; }
</style>