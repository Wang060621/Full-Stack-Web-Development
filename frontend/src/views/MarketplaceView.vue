<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AuctionCard from '../components/AuctionCard.vue';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';
import curioCabinetHeroLarge from '../assets/curio-cabinet-hero-1536.webp';
import curioCabinetHeroSmall from '../assets/curio-cabinet-hero-768.webp';

const items = ref([]);
const loading = ref(true);
const error = ref('');
const query = ref('');
const activeStatus = ref('');
const activeCategory = ref('');
const categories = ref([]);
const categoryError = ref('');
const offset = ref(0);
const totalItems = ref(0);
const pageInput = ref('1');
const pageError = ref('');
const pageSize = 6;
let controller;

const hasActiveFilters = computed(() => Boolean(query.value.trim() || activeStatus.value || activeCategory.value));
const currentPage = computed(() => Math.floor(offset.value / pageSize) + 1);
const totalPages = computed(() => Math.max(1, Math.ceil(totalItems.value / pageSize)));

const filters = [
  { label: 'All', value: '' },
  { label: 'Selling', value: 'OPEN', auth: true },
  { label: 'Bidding', value: 'BID', auth: true },
  { label: 'Archive', value: 'ARCHIVE', auth: true }
];

async function loadItems({ reset = false } = {}) {
  if (reset) {
    offset.value = 0;
    pageInput.value = '1';
    pageError.value = '';
  }
  controller?.abort();
  const requestController = new AbortController();
  controller = requestController;
  loading.value = true;
  error.value = '';

  const params = new URLSearchParams({ limit: String(pageSize), offset: String(offset.value) });
  if (query.value.trim()) params.set('q', query.value.trim());
  if (activeStatus.value) params.set('status', activeStatus.value);
  if (activeCategory.value) params.set('category_id', activeCategory.value);

  try {
    const result = await apiRequest(`/search?${params}`, {
      token: activeStatus.value ? authStore.state.token : undefined,
      signal: requestController.signal,
      includeResponse: true
    });
    items.value = result.data;
    totalItems.value = Number(result.response.headers.get('X-Total-Count')) || result.data.length;
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
  pageInput.value = String(currentPage.value);
  pageError.value = '';
  loadItems();
}

function goToPage() {
  const targetPage = Number(pageInput.value);
  if (!Number.isSafeInteger(targetPage) || targetPage < 1 || targetPage > totalPages.value) {
    pageError.value = `Choose a whole page number between 1 and ${totalPages.value}.`;
    return;
  }

  pageError.value = '';
  offset.value = (targetPage - 1) * pageSize;
  loadItems();
}

function clearFilters() {
  query.value = '';
  activeStatus.value = '';
  activeCategory.value = '';
  loadItems({ reset: true });
}

async function loadCategories() {
  try {
    categories.value = await apiRequest('/categories');
  } catch (requestError) {
    categoryError.value = requestError.message;
  }
}

onMounted(() => {
  loadItems();
  loadCategories();
});
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
    <div class="catalogue-meta" aria-label="Catalogue edition">
      <span>The Collector’s Cabinet · No. 09</span>
      <span>London · Autumn 1992</span>
      <span>Sound · Time · Memory</span>
    </div>
    <div class="market-heading">
      <span class="hero-edition-mark" aria-hidden="true">ARCHIVE</span>
      <div class="market-copy">
        <p class="eyebrow">The collector’s cabinet · Autumn ’92</p>
        <h1>Every object keeps a story.</h1>
        <p class="market-deck">A private catalogue of sound, time and memory—kept for those who notice the beauty of things made to last.</p>
      </div>
      <figure class="curio-still-life" aria-label="A collection of vintage objects including a record and pocket watch">
        <picture>
          <source media="(max-width: 760px)" :srcset="curioCabinetHeroSmall" />
          <img
            :src="curioCabinetHeroLarge"
            alt="Vintage record, pocket watch, opera glasses, books, fountain pen and old key"
            width="1536"
            height="1024"
            fetchpriority="high"
            decoding="async"
          />
        </picture>
        <figcaption><span>Cabinet study</span><strong>No. 09</strong></figcaption>
      </figure>
      <div class="catalogue-search">
        <span class="catalogue-search-label">Search the cabinet</span>
        <form class="search-bar" role="search" novalidate @submit.prevent="loadItems({ reset: true })">
          <label class="sr-only" for="market-search">Search objects</label>
          <input id="market-search" v-model="query" maxlength="100" placeholder="Object, maker or period" />
          <label class="sr-only" for="category-filter">Filter by category</label>
          <select id="category-filter" v-model="activeCategory" @change="loadItems({ reset: true })">
            <option value="">All categories</option>
            <option v-for="category in categories" :key="category.category_id" :value="String(category.category_id)">
              {{ category.name }}
            </option>
          </select>
          <button type="submit" :disabled="loading">{{ loading ? 'Searching' : 'Search' }}</button>
        </form>
        <div class="catalogue-search-footer">
          <span class="catalogue-search-note">Browse the current house collection</span>
          <button v-if="hasActiveFilters" class="catalogue-clear" type="button" @click="clearFilters">Clear filters</button>
        </div>
      </div>
    </div>

    <div class="market-toolbar">
      <p class="catalogue-count" aria-live="polite"><strong>{{ totalItems }}</strong> selected lots</p>
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

    <StatusPanel
      v-if="categoryError"
      type="error"
      title="Category filter unavailable"
      :message="categoryError"
      action-label="Try again"
      @action="loadCategories"
    />
    <StatusPanel
      v-if="error"
      type="error"
      title="Unable to load auctions"
      :message="error"
      action-label="Try again"
      @action="loadItems"
    />
    <div v-else-if="loading" class="loading-grid" role="status" aria-label="Loading auctions">
      <article v-for="index in 6" :key="index" class="skeleton-card" aria-hidden="true">
        <span class="skeleton-image" />
        <span class="skeleton-line skeleton-line-short" />
        <span class="skeleton-line skeleton-line-title" />
        <span class="skeleton-line" />
      </article>
    </div>
    <StatusPanel
      v-else-if="items.length === 0"
      title="No matching lots"
      message="Try a different keyword or filter."
      :action-label="hasActiveFilters ? 'Clear filters' : ''"
      @action="clearFilters"
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

    <nav v-if="totalPages > 1" class="pagination-shell" aria-label="Catalogue pagination">
      <div class="pagination">
        <button
          class="pagination-direction pagination-previous"
          type="button"
          :disabled="currentPage === 1 || loading"
          @click="changePage(-1)"
        >
          <span aria-hidden="true">←</span>
          Previous
        </button>
        <p class="pagination-folio" aria-current="page">
          <small>Catalogue page</small>
          <span><strong>{{ currentPage }}</strong><i>of {{ totalPages }}</i></span>
        </p>
        <button
          class="pagination-direction pagination-next"
          type="button"
          :disabled="currentPage === totalPages || loading"
          @click="changePage(1)"
        >
          Next
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <form class="pagination-jump" novalidate @submit.prevent="goToPage">
        <label for="page-jump">
          <strong>Jump to a page</strong>
          <span>Enter a number from 1 to {{ totalPages }}</span>
        </label>
        <input
          id="page-jump"
          v-model="pageInput"
          type="text"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          :aria-invalid="Boolean(pageError)"
          :aria-describedby="pageError ? 'page-jump-error' : undefined"
        />
        <button type="submit" :disabled="loading">
          View page
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p v-if="pageError" id="page-jump-error" class="pagination-error" role="alert">{{ pageError }}</p>
    </nav>
  </section>
</template>
