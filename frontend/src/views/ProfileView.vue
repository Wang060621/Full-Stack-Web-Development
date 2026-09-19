<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AuctionCard from '../components/AuctionCard.vue';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';
import { formatCurrency, formatDate } from '../utils/format';

const route = useRoute();
const profile = ref(null);
const loading = ref(true);
const error = ref('');
const bidHistory = ref([]);
const bidHistoryLoading = ref(false);
const bidHistoryError = ref('');
const bidQuery = ref('');
const bidStatus = ref('all');

const requestedId = computed(() => Number(route.params.id || authStore.state.userId));
const isOwnProfile = computed(() => requestedId.value === authStore.state.userId);

const bidStatusOptions = [
  { label: 'All records', value: 'all' },
  { label: 'Leading', value: 'leading' },
  { label: 'Outbid', value: 'outbid' },
  { label: 'Closed', value: 'closed' }
];

function getBidState(bid) {
  const ended = Number(bid.end_date) <= Date.now();
  const isHighestBidder = Number(bid.current_bid_holder_id) === requestedId.value;
  if (ended) return isHighestBidder ? 'won' : 'closed';
  return isHighestBidder ? 'leading' : 'outbid';
}

function bidStateLabel(bid) {
  const state = getBidState(bid);
  if (state === 'won') return 'Won';
  if (state === 'leading') return 'Leading';
  if (state === 'outbid') return 'Outbid';
  return 'Closed';
}

const filteredBidHistory = computed(() => {
  const query = bidQuery.value.trim().toLocaleLowerCase();
  return bidHistory.value.filter((bid) => {
    const state = getBidState(bid);
    const statusMatches = bidStatus.value === 'all'
      || (bidStatus.value === 'closed' ? state === 'closed' || state === 'won' : state === bidStatus.value);
    if (!statusMatches) return false;
    if (!query) return true;

    const searchableText = [
      bid.name,
      bid.first_name,
      bid.last_name,
      ...(bid.categories || []).map((category) => category.name)
    ].join(' ').toLocaleLowerCase();
    return searchableText.includes(query);
  });
});

const bidStats = computed(() => {
  const lots = new Set();
  const leadingLots = new Set();
  const closedLots = new Set();
  for (const bid of bidHistory.value) {
    lots.add(bid.item_id);
    const state = getBidState(bid);
    if (state === 'leading') leadingLots.add(bid.item_id);
    if (state === 'closed' || state === 'won') closedLots.add(bid.item_id);
  }
  return {
    records: bidHistory.value.length,
    lots: lots.size,
    leading: leadingLots.size,
    closed: closedLots.size
  };
});

async function loadBidHistory() {
  if (!isOwnProfile.value) return;
  bidHistoryLoading.value = true;
  bidHistoryError.value = '';
  try {
    bidHistory.value = await apiRequest(`/users/${requestedId.value}/bids`, {
      token: authStore.state.token
    });
  } catch (requestError) {
    bidHistoryError.value = requestError.message;
  } finally {
    bidHistoryLoading.value = false;
  }
}

async function loadProfile() {
  loading.value = true;
  error.value = '';
  profile.value = null;
  bidHistory.value = [];
  bidHistoryError.value = '';
  bidQuery.value = '';
  bidStatus.value = 'all';
  if (!Number.isSafeInteger(requestedId.value) || requestedId.value < 1) {
    error.value = 'Choose a valid user profile.';
    loading.value = false;
    return;
  }
  try {
    profile.value = await apiRequest(`/users/${requestedId.value}`);
    if (isOwnProfile.value) {
      authStore.state.profile = profile.value;
      await loadBidHistory();
    }
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
        <RouterLink v-if="isOwnProfile" class="primary-button inline-button" to="/items/new">List an object</RouterLink>
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

      <section v-if="isOwnProfile" class="profile-section bid-archive">
        <div class="section-heading">
          <h2>Bid archive</h2><span>{{ bidStats.records }}</span>
        </div>
        <p class="section-intro">Search every bid you have placed, revisit the lot and see whether you are leading, outbid or finished.</p>

        <div class="bid-archive-stats" aria-label="Bid archive summary">
          <div><strong>{{ bidStats.records }}</strong><span>Bid records</span></div>
          <div><strong>{{ bidStats.lots }}</strong><span>Distinct lots</span></div>
          <div><strong>{{ bidStats.leading }}</strong><span>Currently leading</span></div>
          <div><strong>{{ bidStats.closed }}</strong><span>Closed lots</span></div>
        </div>

        <div class="bid-history-toolbar">
          <label for="bid-history-search">
            <span>Find a past bid</span>
            <input
              id="bid-history-search"
              v-model="bidQuery"
              type="search"
              placeholder="Search lot, seller or category"
              autocomplete="off"
            />
          </label>
          <div class="bid-history-filters" aria-label="Filter bid history">
            <button
              v-for="option in bidStatusOptions"
              :key="option.value"
              type="button"
              :class="{ active: bidStatus === option.value }"
              :aria-pressed="bidStatus === option.value"
              @click="bidStatus = option.value"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <div v-if="bidHistoryLoading" class="bid-history-loading" role="status">Opening the bid ledger…</div>
        <StatusPanel
          v-else-if="bidHistoryError"
          type="error"
          title="Unable to load bid history"
          :message="bidHistoryError"
          action-label="Try again"
          @action="loadBidHistory"
        />
        <div v-else-if="filteredBidHistory.length" class="bid-history-table-wrap">
          <table class="bid-history-table">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Your bid</th>
                <th>Current price</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="bid in filteredBidHistory" :key="bid.bid_id">
                <td data-label="Lot">
                  <RouterLink :to="`/items/${bid.item_id}`">{{ bid.name }}</RouterLink>
                  <small>Lot {{ bid.item_id }} · {{ bid.first_name }} {{ bid.last_name }}</small>
                </td>
                <td data-label="Your bid"><strong>{{ formatCurrency(bid.amount) }}</strong></td>
                <td data-label="Current price">{{ formatCurrency(bid.current_bid) }}</td>
                <td data-label="Status">
                  <span :class="['bid-state', `bid-state-${getBidState(bid)}`]">{{ bidStateLabel(bid) }}</span>
                </td>
                <td data-label="Placed"><time :datetime="new Date(Number(bid.timestamp)).toISOString()">{{ formatDate(bid.timestamp) }}</time></td>
              </tr>
            </tbody>
          </table>
        </div>
        <StatusPanel
          v-else
          :title="bidHistory.length ? 'No matching bid records' : 'No bid history yet'"
          :message="bidHistory.length ? 'Try another search term or status.' : 'Your bids will appear here after you join an auction.'"
        />
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
