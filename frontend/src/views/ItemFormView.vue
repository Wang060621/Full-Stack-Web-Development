<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';
import { deleteDraft, listDrafts, saveDraft } from '../utils/drafts';
import { formatDate, toDateTimeLocal } from '../utils/format';

const route = useRoute();
const router = useRouter();
const editing = computed(() => route.name === 'item-edit');
const form = reactive({ name: '', description: '', starting_bid: 0, end_date: '', category_ids: [] });
const endDateFields = reactive({ date: '', time: '' });
const loading = ref(editing.value);
const submitting = ref(false);
const error = ref('');
const notice = ref('');
const categories = ref([]);
const categoryError = ref('');
const drafts = ref([]);
const activeDraftId = ref('');

function splitEndDate(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return { date: '', time: '' };
  return { date: `${match[3]} / ${match[2]} / ${match[1]}`, time: `${match[4]} : ${match[5]}` };
}

function parseEndDate() {
  const dateMatch = endDateFields.date.match(/^\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})\s*$/);
  const timeMatch = endDateFields.time.match(/^\s*(\d{2})\s*:\s*(\d{2})\s*$/);
  if (!dateMatch || !timeMatch) return Number.NaN;

  const [, dayText, monthText, yearText] = dateMatch;
  const [, hourText, minuteText] = timeMatch;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
    || date.getHours() !== hour
    || date.getMinutes() !== minute
  ) return Number.NaN;
  return date.getTime();
}

function updateEndDateField(field, value) {
  endDateFields[field] = value;
  const timestamp = parseEndDate();
  form.end_date = Number.isFinite(timestamp) ? toDateTimeLocal(timestamp) : '';
}

function setEndDate(value) {
  form.end_date = value || '';
  Object.assign(endDateFields, splitEndDate(form.end_date));
}

function clearForm() {
  Object.assign(form, { name: '', description: '', starting_bid: 0, end_date: '', category_ids: [] });
  Object.assign(endDateFields, { date: '', time: '' });
  activeDraftId.value = '';
  notice.value = '';
  if (!editing.value && route.query.draft) router.replace({ name: 'item-new' });
}

function refreshDrafts() {
  try {
    drafts.value = listDrafts(authStore.state.userId);
  } catch (storageError) {
    drafts.value = [];
    error.value = storageError.message;
  }
}

async function loadCategories() {
  try {
    categories.value = await apiRequest('/categories');
  } catch (requestError) {
    categoryError.value = `${requestError.message} You can still publish without a category.`;
  }
}

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
    setEndDate(toDateTimeLocal(item.end_date));
    form.category_ids = item.categories?.map((category) => category.category_id) || [];
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

function openDraft(draftId) {
  const draft = drafts.value.find((entry) => entry.id === draftId);
  if (!draft) {
    error.value = 'That draft no longer exists on this device.';
    return;
  }
  Object.assign(form, {
    name: draft.name,
    description: draft.description,
    starting_bid: draft.starting_bid,
    end_date: draft.end_date,
    category_ids: [...draft.category_ids]
  });
  setEndDate(draft.end_date);
  activeDraftId.value = draft.id;
  error.value = '';
  notice.value = `Draft “${draft.name || 'Untitled lot'}” is ready to edit.`;
  router.replace({ name: 'item-new', query: { draft: draft.id }, hash: '#lot-editor' });
}

function storeDraft() {
  error.value = '';
  notice.value = '';
  if (!form.name.trim() && !form.description.trim()) {
    error.value = 'Add a name or description before saving a draft.';
    return;
  }
  try {
    const saved = saveDraft(authStore.state.userId, { ...form, id: activeDraftId.value });
    activeDraftId.value = saved.id;
    refreshDrafts();
    notice.value = 'Draft saved in this browser.';
    router.replace({ name: 'item-new', query: { draft: saved.id }, hash: '#lot-editor' });
  } catch {
    error.value = 'This browser could not save the draft. Check that local storage is available and has free space.';
  }
}

function removeDraft(draft) {
  if (!window.confirm(`Delete the draft “${draft.name || 'Untitled lot'}”? This cannot be undone.`)) return;
  try {
    drafts.value = deleteDraft(authStore.state.userId, draft.id);
    if (activeDraftId.value === draft.id) {
      clearForm();
      router.replace({ name: 'item-new' });
    }
    error.value = '';
    notice.value = 'Draft deleted from this browser.';
  } catch {
    error.value = 'This browser could not delete the draft.';
  }
}

function toggleCategory(categoryId, checked) {
  if (checked) {
    if (form.category_ids.length >= 3) {
      error.value = 'Choose no more than three categories.';
      return;
    }
    form.category_ids.push(categoryId);
  } else {
    form.category_ids = form.category_ids.filter((id) => id !== categoryId);
  }
  error.value = '';
}

async function submit() {
  if (submitting.value || editing.value) return;
  error.value = '';
  notice.value = '';
  if (!form.name.trim()) error.value = 'Enter the object name.';
  else if (!form.description.trim()) error.value = 'Enter a description for the object.';
  else if (!Number.isFinite(Number(form.starting_bid)) || Number(form.starting_bid) < 0) {
    error.value = 'Enter a starting bid of zero or more.';
  } else if (!Number.isSafeInteger(Number(form.starting_bid))) {
    error.value = 'Enter a whole-number starting bid.';
  }
  const endTimestamp = parseEndDate();
  if (!error.value && !Number.isFinite(endTimestamp)) {
    error.value = 'Choose a valid auction end date and time.';
  } else if (!error.value && endTimestamp <= Date.now()) {
    error.value = 'Choose an auction end time in the future.';
  }
  if (error.value) return;

  submitting.value = true;
  try {
    const result = await apiRequest('/item', {
      method: 'POST',
      token: authStore.state.token,
      body: {
        name: form.name.trim(),
        description: form.description.trim(),
        starting_bid: Number(form.starting_bid),
        end_date: endTimestamp,
        category_ids: [...form.category_ids]
      }
    });
    if (activeDraftId.value) deleteDraft(authStore.state.userId, activeDraftId.value);
    await router.push(`/items/${result.item_id}`);
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  refreshDrafts();
  await Promise.all([loadItem(), loadCategories()]);
  if (!editing.value && route.query.draft) openDraft(String(route.query.draft));
});

watch(() => route.query.draft, (draftId) => {
  if (!editing.value && draftId && draftId !== activeDraftId.value) openDraft(String(draftId));
});
</script>

<template>
  <section class="editor-page page-width">
    <div class="editor-intro">
      <p class="eyebrow">{{ editing ? 'Edit page' : 'List an object' }}</p>
      <h1>{{ editing ? 'Review the lot details' : 'Open a new cabinet entry' }}</h1>
      <p v-if="!editing">Describe its period, materials, condition and provenance so collectors can bid with confidence.</p>
    </div>
    <div v-if="loading" class="page-loader">Loading lot…</div>
    <div v-else class="editor-layout">
      <form id="lot-editor" class="form-card editor-form" novalidate @submit.prevent="submit">
        <StatusPanel
          v-if="editing"
          type="info"
          title="Listing review"
          message="Published Auctionary listings are read-only because the base API does not define an update endpoint."
        />
        <StatusPanel v-if="error" type="error" title="Unable to continue" :message="error" />
        <StatusPanel v-if="notice" type="success" title="Draft updated" :message="notice" />
        <label>
          <span>Object name</span>
          <input v-model="form.name" maxlength="100" :disabled="editing" required />
        </label>
        <label>
          <span>Description</span>
          <textarea
            v-model="form.description"
            rows="7"
            maxlength="2000"
            :disabled="editing"
            placeholder="Period, maker, materials, condition and provenance"
            required
          />
          <small>{{ form.description.length }} / 2000</small>
        </label>
        <fieldset v-if="categories.length" class="category-fieldset" :disabled="editing">
          <legend>Categories <small>Choose up to three</small></legend>
          <label v-for="category in categories" :key="category.category_id" class="category-choice">
            <input
              type="checkbox"
              :checked="form.category_ids.includes(category.category_id)"
              :disabled="editing || (!form.category_ids.includes(category.category_id) && form.category_ids.length >= 3)"
              @change="toggleCategory(category.category_id, $event.target.checked)"
            />
            <span>{{ category.name }}</span>
          </label>
        </fieldset>
        <StatusPanel v-if="categoryError" type="error" title="Categories unavailable" :message="categoryError" />
        <div class="form-row">
          <label>
            <span>Starting bid (GBP)</span>
            <input v-model.number="form.starting_bid" type="number" min="0" step="1" :disabled="editing" required />
          </label>
          <label class="end-date-field">
            <span>End date and time</span>
            <span class="end-date-control">
              <span class="end-date-segment">
                <small>Date</small>
                <input
                  :value="endDateFields.date"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  maxlength="14"
                  placeholder="DD / MM / YYYY"
                  aria-label="Auction end date, day month year"
                  :disabled="editing"
                  required
                  @input="updateEndDateField('date', $event.target.value)"
                />
              </span>
              <span class="end-date-segment end-time-segment">
                <small>Time</small>
                <input
                  :value="endDateFields.time"
                  type="text"
                  inputmode="numeric"
                  autocomplete="off"
                  maxlength="7"
                  placeholder="HH : MM"
                  aria-label="Auction end time, 24 hour clock"
                  :disabled="editing"
                  required
                  @input="updateEndDateField('time', $event.target.value)"
                />
              </span>
            </span>
            <small class="field-note">UK format · 24-hour clock · local time</small>
          </label>
        </div>
        <div v-if="!editing" class="editor-actions">
          <button class="primary-button" type="submit" :disabled="submitting">
            {{ submitting ? 'Publishing…' : 'Publish lot' }}
          </button>
          <button class="secondary-button" type="button" :disabled="submitting" @click="storeDraft">
            {{ activeDraftId ? 'Update draft' : 'Save draft' }}
          </button>
          <button v-if="activeDraftId" class="text-button" type="button" @click="clearForm">Start a new draft</button>
        </div>
        <RouterLink v-else class="secondary-button" :to="`/items/${route.params.id}`">Back to lot details</RouterLink>
      </form>

      <aside v-if="!editing" id="drafts" class="draft-panel" aria-labelledby="draft-heading">
        <div class="section-heading"><h2 id="draft-heading">Saved drafts</h2><span>{{ drafts.length }}</span></div>
        <p class="panel-hint">Drafts stay in this browser and are visible only to this signed-in account.</p>
        <ul v-if="drafts.length" class="draft-list">
          <li v-for="draft in drafts" :key="draft.id" :class="{ active: draft.id === activeDraftId }">
            <div>
              <strong>{{ draft.name || 'Untitled lot' }}</strong>
              <small>Updated {{ formatDate(draft.updated_at) }}</small>
            </div>
            <div class="draft-actions">
              <button type="button" class="text-button" @click="openDraft(draft.id)">Edit</button>
              <button type="button" class="text-button danger-button" @click="removeDraft(draft)">Delete</button>
            </div>
          </li>
        </ul>
        <StatusPanel v-else title="No saved drafts" message="Start a listing, then choose Save draft." />
      </aside>
    </div>
  </section>
</template>
