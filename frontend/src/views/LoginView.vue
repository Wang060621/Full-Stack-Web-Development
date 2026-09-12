<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import StatusPanel from '../components/StatusPanel.vue';
import { authStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const form = reactive({ email: String(route.query.email || ''), password: '' });
const submitting = ref(false);
const error = ref('');
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function submit() {
  error.value = '';
  if (!form.email) error.value = 'Enter your email address.';
  else if (!emailPattern.test(form.email)) error.value = 'Enter a valid email address.';
  else if (!form.password) error.value = 'Enter your password.';
  if (error.value) return;

  submitting.value = true;
  try {
    await authStore.login(form);
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/';
    await router.push(redirect);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section class="auth-page page-width">
    <div class="auth-intro">
      <p class="eyebrow">Welcome back</p>
      <h1>Continue your collecting journey</h1>
      <p>Sign in to list records, place bids, ask questions and track your auctions.</p>
    </div>
    <form class="form-card" novalidate @submit.prevent="submit">
      <div class="form-heading">
        <h2>Sign in</h2>
        <p>New here? <RouterLink to="/register">Create an account</RouterLink></p>
      </div>
      <StatusPanel v-if="error" type="error" title="Sign-in failed" :message="error" />
      <label>
        <span>Email</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" maxlength="254" required />
      </label>
      <label>
        <span>Password</span>
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>
      <button class="primary-button" type="submit" :disabled="submitting">
        {{ submitting ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  </section>
</template>
