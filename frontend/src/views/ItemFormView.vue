<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';
import { toDateTimeLocal } from '../utils/format';

const route = useRoute();
const router = useRouter();
const editing = computed(() => route.name === 'item-edit');
const form = reactive({ name: '', description: '', starting_bid: 0, end_date: '' });
const loading = ref(editing.value);
const submitting = ref(false);
const error = ref('');

async function loadItem() {
  if (!editing.value) return;
  try {
    const item = await apiRequest(`/item/${route.params.id}`);
    if (item.creator_id !== authStore.state.userId) {
      error.value = 'Only the seller can open this edit page.';
      return;
    }
    form.name = item.name;
    form.description = item.description;
    form.starting_bid = item.starting_bid;
    form.end_date = toDateTimeLocal(item.end_date);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (editing.value) return;
  submitting.value = true;
  error.value = '';
  try {
    const result = await apiRequest('/item', {
      method: 'POST',
      token: authStore.state.token,
      body: {
        name: form.name,
        description: form.description,
        starting_bid: Number(form.starting_bid),
        end_date: new Date(form.end_date).getTime()
      }
    });
    await router.push(`/items/${result.item_id}`);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    submitting.value = false;
  }
}

onMounted(loadItem);
</script>

<template>
  <section class="editor-page page-width">
    <div class="editor-intro">
      <p class="eyebrow">{{ editing ? 'Edit page' : 'List a record' }}</p>
      <h1>{{ editing ? 'Review the lot details' : 'Put your next record in motion' }}</h1>
      <p v-if="!editing">Describe the pressing, condition and extras so collectors can bid with confidence.</p>
    </div>
    <div v-if="loading" class="page-loader">Loading lot…</div>
    <form v-else class="form-card editor-form" @submit.prevent="submit">
      <StatusPanel
        v-if="editing"
        type="info"
        title="Edit form ready"
        message="Auctionary 1.0.0 does not define an update endpoint, so this screen is a read-only edit-page skeleton."
      />
      <StatusPanel v-if="error" type="error" title="Unable to continue" :message="error" />
      <label>
        <span>Record name</span>
        <input v-model.trim="form.name" maxlength="100" :disabled="editing" required />
      </label>
      <label>
        <span>Description</span>
        <textarea
          v-model.trim="form.description"
          rows="7"
          maxlength="2000"
          :disabled="editing"
          placeholder="Pressing, year, condition, extras and playback notes"
          required
        />
        <small>{{ form.description.length }} / 2000</small>
      </label>
      <div class="form-row">
        <label>
          <span>Starting bid (GBP)</span>
          <input v-model.number="form.starting_bid" type="number" min="0" step="1" :disabled="editing" required />
        </label>
        <label>
          <span>End date and time</span>
          <input v-model="form.end_date" type="datetime-local" :disabled="editing" required />
        </label>
      </div>
      <button v-if="!editing" class="primary-button" type="submit" :disabled="submitting">
        {{ submitting ? 'Publishing…' : 'Publish lot' }}
      </button>
      <RouterLink v-else class="secondary-button" :to="`/items/${route.params.id}`">Back to lot details</RouterLink>
    </form>
  </section>
</template>
