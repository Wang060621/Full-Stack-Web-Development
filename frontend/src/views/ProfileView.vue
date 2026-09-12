<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AuctionCard from '../components/AuctionCard.vue';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';

const route = useRoute();
const profile = ref(null);
const loading = ref(true);
const error = ref('');

const requestedId = computed(() => Number(route.params.id || authStore.state.userId));
const isOwnProfile = computed(() => requestedId.value === authStore.state.userId);

async function loadProfile() {
  loading.value = true;
  error.value = '';
  profile.value = null;
  if (!Number.isSafeInteger(requestedId.value) || requestedId.value < 1) {
    error.value = 'Choose a valid user profile.';
    loading.value = false;
    return;
  }
  try {
    profile.value = await apiRequest(`/users/${requestedId.value}`);
    if (isOwnProfile.value) authStore.state.profile = profile.value;
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

onMounted(loadProfile);
watch(requestedId, loadProfile);
</script>

<template>
  <section class="profile-page page-width">
    <div v-if="loading" class="page-loader">Loading profile…</div>
    <StatusPanel v-else-if="error" type="error" title="Unable to load profile" :message="error" />
    <template v-else-if="profile">
      <header class="profile-header">
        <div class="avatar" aria-hidden="true">{{ profile.first_name[0] }}{{ profile.last_name[0] }}</div>
        <div>
          <p class="eyebrow">{{ isOwnProfile ? 'My account' : 'Seller profile' }}</p>
          <h1>{{ profile.first_name }} {{ profile.last_name }}</h1>
          <p>Member #{{ profile.user_id }}</p>
        </div>
        <RouterLink v-if="isOwnProfile" class="primary-button inline-button" to="/items/new">List a record</RouterLink>
      </header>

      <section class="profile-section">
        <div class="section-heading">
          <h2>Currently selling</h2><span>{{ profile.selling.length }}</span>
        </div>
        <div v-if="profile.selling.length" class="auction-grid compact-grid">
          <AuctionCard
            v-for="item in profile.selling"
            :key="item.item_id"
            :item="item"
            :current-user-id="authStore.state.userId"
          />
        </div>
        <StatusPanel v-else title="No active listings" />
      </section>

      <section class="profile-section">
        <div class="section-heading">
          <h2>Active bids</h2><span>{{ profile.bidding_on.length }}</span>
        </div>
        <div v-if="profile.bidding_on.length" class="auction-grid compact-grid">
          <AuctionCard v-for="item in profile.bidding_on" :key="item.item_id" :item="item" />
        </div>
        <StatusPanel v-else title="No active bids" />
      </section>

      <section class="profile-section">
        <div class="section-heading">
          <h2>Ended auctions</h2><span>{{ profile.auctions_ended.length }}</span>
        </div>
        <div v-if="profile.auctions_ended.length" class="auction-grid compact-grid">
          <AuctionCard v-for="item in profile.auctions_ended" :key="item.item_id" :item="item" />
        </div>
        <StatusPanel v-else title="No ended auctions" />
      </section>
    </template>
  </section>
</template>
