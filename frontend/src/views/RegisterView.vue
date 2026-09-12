<script setup>
import { reactive, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import StatusPanel from '../components/StatusPanel.vue';
import { authStore } from '../stores/auth';

const router = useRouter();
const form = reactive({ first_name: '', last_name: '', email: '', password: '' });
const submitting = ref(false);
const error = ref('');

async function submit() {
  submitting.value = true;
  error.value = '';
  try {
    await authStore.register(form);
    await router.push(`/profile/${authStore.state.userId}`);
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
      <p class="eyebrow">Join GrooveGavel</p>
      <h1>Help great records find their next collector</h1>
      <p>You will be signed in automatically and can list your first record straight away.</p>
    </div>
    <form class="form-card" @submit.prevent="submit">
      <div class="form-heading">
        <h2>Create account</h2>
        <p>Already registered? <RouterLink to="/login">Sign in</RouterLink></p>
      </div>
      <StatusPanel v-if="error" type="error" title="Registration failed" :message="error" />
      <div class="form-row">
        <label>
          <span>First name</span>
          <input v-model.trim="form.first_name" autocomplete="given-name" maxlength="50" required />
        </label>
        <label>
          <span>Last name</span>
          <input v-model.trim="form.last_name" autocomplete="family-name" maxlength="50" required />
        </label>
      </div>
      <label>
        <span>Email</span>
        <input v-model.trim="form.email" type="email" autocomplete="email" maxlength="254" required />
      </label>
      <label>
        <span>Password</span>
        <input
          v-model="form.password"
          type="password"
          autocomplete="new-password"
          minlength="8"
          maxlength="32"
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,32}"
          aria-describedby="password-help"
          required
        />
        <small id="password-help">Use 8–32 characters with upper and lowercase letters, a number and a special character.</small>
      </label>
      <button class="primary-button" type="submit" :disabled="submitting">
        {{ submitting ? 'Creating account…' : 'Create account and sign in' }}
      </button>
    </form>
  </section>
</template>
