<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AuctionCard from '../components/AuctionCard.vue';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';

const items = ref([]);
const loading = ref(true);
const error = ref('');
const query = ref('');
const activeStatus = ref('');
const offset = ref(0);
const pageSize = 6;
let controller;

const filters = [
  { label: 'All', value: '' },
  { label: 'Selling', value: 'OPEN', auth: true },
  { label: 'Bidding', value: 'BID', auth: true },
  { label: 'Archive', value: 'ARCHIVE', auth: true }
];

async function loadItems({ reset = false } = {}) {
  if (reset) offset.value = 0;
  controller?.abort();
  const requestController = new AbortController();
  controller = requestController;
  loading.value = true;
  error.value = '';

  const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset.value) });
  if (query.value.trim()) params.set('q', query.value.trim());
  if (activeStatus.value) params.set('status', activeStatus.value);

  try {
    items.value = await apiRequest(`/search?${params}`, {
      token: activeStatus.value ? authStore.state.token : undefined,
      signal: requestController.signal
    });
  } catch (requestError) {
    if (requestError.name !== 'AbortError') {
      if (activeStatus.value && requestError.status === 400 && /valid session/i.test(requestError.message)) {
        authStore.expireSession();
      } else {
        error.value = requestError.message;
      }
    }
  } finally {
    if (controller === requestController && !requestController.signal.aborted) loading.value = false;
  }
}

function chooseFilter(filter) {
  if (filter.auth && !authStore.isAuthenticated) return;
  activeStatus.value = filter.value;
  loadItems({ reset: true });
}

function changePage(delta) {
  offset.value = Math.max(0, offset.value + delta * pageSize);
  loadItems();
}

onMounted(loadItems);
watch(() => authStore.isAuthenticated, (authenticated) => {
  if (!authenticated && activeStatus.value) {
    activeStatus.value = '';
    loadItems({ reset: true });
  }
});
onBeforeUnmount(() => controller?.abort());
</script>

<template>
  <section class="market-page page-width">
    <div class="market-heading">
      <div>
        <p class="eyebrow">Rare pressings · Autumn ’92</p>
        <h1>Records worth keeping.</h1>
      </div>
      <form class="search-bar" role="search" novalidate @submit.prevent="loadItems({ reset: true })">
        <label class="sr-only" for="market-search">Search records</label>
        <input id="market-search" v-model="query" maxlength="100" placeholder="Search by record name" />
        <button type="submit">Search</button>
      </form>
    </div>

    <div class="market-toolbar">
      <p class="catalogue-count"><strong>{{ items.length }}</strong> selected lots</p>
      <div v-if="authStore.isAuthenticated" class="filter-pills" aria-label="Auction filters">
        <button
          v-for="filter in filters"
          :key="filter.value"
          type="button"
          :class="{ active: activeStatus === filter.value }"
          :disabled="filter.auth && !authStore.isAuthenticated"
          :title="filter.auth && !authStore.isAuthenticated ? 'Sign in to use this filter' : ''"
          @click="chooseFilter(filter)"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <StatusPanel v-if="error" type="error" title="Unable to load auctions" :message="error" />
    <div v-else-if="loading" class="loading-grid" role="status" aria-label="Loading auctions">
      <div v-for="index in 3" :key="index" class="skeleton-card" />
    </div>
    <StatusPanel
      v-else-if="items.length === 0"
      title="No matching lots"
      message="Try a different keyword or filter."
    />
    <TransitionGroup v-else name="lot" tag="div" class="auction-grid">
      <AuctionCard
        v-for="(item, index) in items"
        :key="item.item_id"
        :item="item"
        :index="index"
        :current-user-id="authStore.state.userId"
      />
    </TransitionGroup>

    <div v-if="offset > 0 || items.length === pageSize" class="pagination" aria-label="Pagination">
      <button type="button" :disabled="offset === 0 || loading" @click="changePage(-1)">Previous</button>
      <span>Page {{ Math.floor(offset / pageSize) + 1 }}</span>
      <button type="button" :disabled="items.length < pageSize || loading" @click="changePage(1)">Next</button>
    </div>
  </section>
</template>
