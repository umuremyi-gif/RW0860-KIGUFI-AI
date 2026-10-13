<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>RW0860 KIGUFI AI Platform</h2>
      <p class="subtitle">{{ isLogin ? 'Injira muri System' : 'Wiyandikisheho' }}</p>

      <div v-if="message" :class="['alert', isError ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div v-if="!isLogin" class="form-group">
          <label>Amazina (Name)</label>
          <input type="text" v-model="name" placeholder="Andika amazina yawe" required />
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" v-model="email" placeholder="Andika email yawe" required />
        </div>

        <div class="form-group">
          <label>Ijambo ry'ibanga (Password)</label>
          <input type="password" v-model="password" placeholder="Andika password" required />
        </div>

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? 'Birimo koherezwa...' : (isLogin ? 'Injira (Login)' : 'Iyandikishe (Register)') }}
        </button>
      </form>

      <p class="switch-text" @click="isLogin = !isLogin">
        {{ isLogin ? "Nta konti ufite? Iyandikishe hano" : "Ufite konti? Injira hano" }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLogin = ref(true);
const name = ref('');
const email = ref('');
const password = ref('');
const message = ref('');
const isError = ref(false);
const loading = ref(false);

const handleSubmit = async () => {
  message.value = '';
  isError.value = false;
  loading.value = true;

  try {
    const endpoint = isLogin.value 
      ? 'http://localhost:5000/api/auth/login' 
      : 'http://localhost:5000/api/auth/register';
    
    const payload = isLogin.value 
      ? { email: email.value.trim(), password: password.value }
      : { name: name.value.trim(), email: email.value.trim(), password: password.value };

    const response = await axios.post(endpoint, payload);

    message.value = response.data.message || 'Igikorwa cyagenze neza!';
    
    if (isLogin.value && response.data.token) {
      localStorage.setItem('token', response.data.token);
      setTimeout(() => {
        router.push('/dashboard'); // Kujyana umukoresha kuri Dashboard amaze kwinjira
      }, 1000);
    }
  } catch (err) {
    isError.value = true;
    message.value = err.response?.data?.message || 'Hari ikibazo cyabaye, ongera ugerageze!';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* Isura ya Login Form */
.auth-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f4f7f6; }
.auth-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; }
h2 { text-align: center; color: #2c3e50; margin-bottom: 5px; }
.subtitle { text-align: center; color: #7f8c8d; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; margin-bottom: 5px; color: #34495e; font-weight: bold; font-size: 14px; }
.form-group input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; box-sizing: border-box; }
.btn-submit { width: 100%; padding: 10px; background-color: #27ae60; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: bold; margin-top: 10px; }
.btn-submit:hover { background-color: #219653; }
.switch-text { text-align: center; margin-top: 15px; color: #2980b9; cursor: pointer; font-size: 14px; }
.switch-text:hover { text-decoration: underline; }
.alert { padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; text-align: center; }
.alert-success { background-color: #d4edda; color: #155724; }
.alert-error { background-color: #f8d7da; color: #721c24; }
</style>