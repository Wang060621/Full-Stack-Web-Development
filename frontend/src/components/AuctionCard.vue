<script setup>
import { RouterLink } from 'vue-router';
import RecordCover from './RecordCover.vue';
import { formatCurrency, timeRemaining } from '../utils/format';

defineProps({
  item: { type: Object, required: true },
  currentUserId: { type: Number, default: null },
  index: { type: Number, default: 0 }
});
</script>

<template>
  <article class="auction-card" :style="{ '--card-order': index }">
    <RouterLink
      :to="`/items/${item.item_id}`"
      class="card-image-link"
      :aria-label="`View ${item.name}`"
    >
      <RecordCover :item-id="item.item_id" />
      <span class="lot-stamp">LOT {{ String(item.item_id).padStart(3, '0') }}</span>
      <span class="cover-cue">View lot <span aria-hidden="true">↗</span></span>
    </RouterLink>
    <div class="card-body">
      <p class="card-time">
        {{ timeRemaining(item.end_date) }}
      </p>
      <h2><RouterLink :to="`/items/${item.item_id}`">{{ item.name }}</RouterLink></h2>
      <ul v-if="item.categories?.length" class="category-tags" aria-label="Categories">
        <li v-for="category in item.categories" :key="category.category_id">{{ category.name }}</li>
      </ul>
      <p class="seller">Offered by {{ item.first_name }} {{ item.last_name }}</p>
      <dl class="card-metrics">
        <div>
          <dt>Current price</dt>
          <dd>{{ formatCurrency(item.current_bid ?? item.starting_bid) }}</dd>
        </div>
        <div>
          <dt>Bids</dt>
          <dd>{{ item.bid_count ?? 0 }}</dd>
        </div>
      </dl>
      <span class="card-catalogue-link" aria-hidden="true">
        Open catalogue entry <span>↗</span>
      </span>
      <RouterLink
        v-if="currentUserId === item.creator_id"
        class="edit-link"
        :to="`/items/${item.item_id}/edit`"
      >
        Edit page
      </RouterLink>
    </div>
  </article>
</template>
