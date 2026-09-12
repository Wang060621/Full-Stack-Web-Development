<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import RecordCover from '../components/RecordCover.vue';
import StatusPanel from '../components/StatusPanel.vue';
import { apiRequest } from '../services/api';
import { authStore } from '../stores/auth';
import { formatCurrency, formatDate, timeRemaining } from '../utils/format';

const route = useRoute();
const item = ref(null);
const bids = ref([]);
const questions = ref([]);
const loading = ref(true);
const error = ref('');
const bidAmount = ref(0);
const questionText = ref('');
const answers = reactive({});
const action = reactive({ type: '', error: '', success: '' });

const isSeller = computed(() => item.value?.creator_id === authStore.state.userId);
const auctionClosed = computed(() => item.value ? Number(item.value.end_date) <= Date.now() : false);
const minimumBid = computed(() => Number(item.value?.current_bid || item.value?.starting_bid || 0) + 1);

async function loadItem() {
  loading.value = true;
  error.value = '';
  try {
    const id = route.params.id;
    const [itemResult, bidResult, questionResult] = await Promise.all([
      apiRequest(`/item/${id}`),
      apiRequest(`/item/${id}/bid`),
      apiRequest(`/item/${id}/question`)
    ]);
    item.value = itemResult;
    bids.value = bidResult;
    questions.value = questionResult;
    bidAmount.value = Number(itemResult.current_bid || itemResult.starting_bid) + 1;
  } catch (requestError) {
    error.value = requestError.message;
  } finally {
    loading.value = false;
  }
}

async function submitBid() {
  action.type = 'bid'; action.error = ''; action.success = '';
  try {
    await apiRequest(`/item/${route.params.id}/bid`, {
      method: 'POST', token: authStore.state.token, body: { amount: Number(bidAmount.value) }
    });
    action.success = 'Your bid has been recorded.';
    await loadItem();
  } catch (requestError) {
    action.error = requestError.message;
  } finally {
    action.type = '';
  }
}

async function submitQuestion() {
  action.type = 'question'; action.error = ''; action.success = '';
  try {
    await apiRequest(`/item/${route.params.id}/question`, {
      method: 'POST', token: authStore.state.token, body: { question_text: questionText.value }
    });
    questionText.value = '';
    questions.value = await apiRequest(`/item/${route.params.id}/question`);
    action.success = 'Your question has been posted.';
  } catch (requestError) {
    action.error = requestError.message;
  } finally {
    action.type = '';
  }
}

async function submitAnswer(questionId) {
  action.type = `answer-${questionId}`; action.error = ''; action.success = '';
  try {
    await apiRequest(`/question/${questionId}`, {
      method: 'POST', token: authStore.state.token, body: { answer_text: answers[questionId] }
    });
    answers[questionId] = '';
    questions.value = await apiRequest(`/item/${route.params.id}/question`);
    action.success = 'Your answer has been posted.';
  } catch (requestError) {
    action.error = requestError.message;
  } finally {
    action.type = '';
  }
}

onMounted(loadItem);
watch(() => route.params.id, loadItem);
</script>

<template>
  <section class="detail-page page-width">
    <div v-if="loading" class="page-loader">Loading lot…</div>
    <StatusPanel v-else-if="error" type="error" title="Unable to load lot" :message="error" />
    <template v-else-if="item">
      <div class="detail-hero">
        <div class="detail-image-wrap">
          <RecordCover :item-id="item.item_id" :alt="`Cover artwork for ${item.name}`" />
          <span class="lot-number">LOT {{ item.item_id }}</span>
        </div>
        <div class="detail-summary">
          <p class="eyebrow">{{ auctionClosed ? 'Auction ended' : `${timeRemaining(item.end_date)} remaining` }}</p>
          <h1>{{ item.name }}</h1>
          <p class="detail-description">{{ item.description }}</p>
          <dl class="bid-facts">
            <div><dt>Current price</dt><dd>{{ formatCurrency(item.current_bid) }}</dd></div>
            <div><dt>Starting bid</dt><dd>{{ formatCurrency(item.starting_bid) }}</dd></div>
            <div><dt>Ends</dt><dd>{{ formatDate(item.end_date) }}</dd></div>
          </dl>
          <p class="seller-line">
            Seller:
            <RouterLink :to="`/profile/${item.creator_id}`">{{ item.first_name }} {{ item.last_name }}</RouterLink>
          </p>
          <p v-if="item.current_bid_holder" class="holder-line">
            Leading bidder: {{ item.current_bid_holder.first_name }} {{ item.current_bid_holder.last_name }}
          </p>

          <StatusPanel v-if="action.error" type="error" title="Action not completed" :message="action.error" />
          <StatusPanel v-if="action.success" class="bid-accepted" type="success" title="Bid accepted" :message="action.success" />

          <form
            v-if="authStore.isAuthenticated && !isSeller && !auctionClosed"
            class="inline-form bid-form"
            @submit.prevent="submitBid"
          >
            <label for="bid-amount">Your bid (minimum {{ formatCurrency(minimumBid) }})</label>
            <div>
              <input id="bid-amount" v-model.number="bidAmount" type="number" :min="minimumBid" step="1" required />
              <button class="primary-button" type="submit" :disabled="action.type === 'bid'">
                {{ action.type === 'bid' ? 'Submitting…' : 'Place bid' }}
              </button>
            </div>
          </form>
          <StatusPanel v-else-if="isSeller" title="This is your listing" message="Sellers cannot bid on their own lots." />
          <StatusPanel v-else-if="auctionClosed" title="Bidding has ended" message="You can still review the bid history and questions." />
          <StatusPanel v-else title="Sign in to bid">
            <RouterLink class="text-button" :to="{ name: 'login', query: { redirect: route.fullPath } }">Go to sign in</RouterLink>
          </StatusPanel>
        </div>
      </div>

      <div class="detail-columns">
        <section class="detail-panel">
          <div class="section-heading"><h2>Bid history</h2><span>{{ bids.length }}</span></div>
          <div v-if="bids.length" class="table-wrap">
            <table>
              <thead><tr><th>Bidder</th><th>Amount</th><th>Time</th></tr></thead>
              <tbody>
                <tr v-for="bid in bids" :key="`${bid.user_id}-${bid.amount}-${bid.timestamp}`">
                  <td>{{ bid.first_name }} {{ bid.last_name }}</td>
                  <td><strong>{{ formatCurrency(bid.amount) }}</strong></td>
                  <td>{{ formatDate(bid.timestamp) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <StatusPanel v-else title="No bids yet" message="Be the first collector to place a bid." />
        </section>

        <section class="detail-panel">
          <div class="section-heading"><h2>Questions and answers</h2><span>{{ questions.length }}</span></div>
          <form
            v-if="authStore.isAuthenticated && !isSeller"
            class="question-form"
            @submit.prevent="submitQuestion"
          >
            <label for="question-text">Ask the seller a question</label>
            <textarea id="question-text" v-model.trim="questionText" maxlength="500" rows="3" required />
            <button class="secondary-button" type="submit" :disabled="action.type === 'question'">
              {{ action.type === 'question' ? 'Posting…' : 'Post question' }}
            </button>
          </form>
          <p v-else-if="!authStore.isAuthenticated" class="panel-hint">
            <RouterLink :to="{ name: 'login', query: { redirect: route.fullPath } }">Sign in</RouterLink> to ask the seller a question.
          </p>
          <div v-if="questions.length" class="question-list">
            <article v-for="question in questions" :key="question.question_id" class="question-item">
              <h3><span aria-hidden="true">Q</span>{{ question.question_text }}</h3>
              <p v-if="question.answer_text"><strong>Seller's answer</strong>{{ question.answer_text }}</p>
              <form v-else-if="isSeller" class="answer-form" @submit.prevent="submitAnswer(question.question_id)">
                <label :for="`answer-${question.question_id}`">Answer this question</label>
                <div>
                  <input :id="`answer-${question.question_id}`" v-model.trim="answers[question.question_id]" maxlength="1000" required />
                  <button class="secondary-button" type="submit" :disabled="action.type === `answer-${question.question_id}`">Answer</button>
                </div>
              </form>
              <p v-else class="unanswered">Waiting for the seller's answer</p>
            </article>
          </div>
          <StatusPanel v-else title="No questions yet" />
        </section>
      </div>
    </template>
  </section>
</template>
