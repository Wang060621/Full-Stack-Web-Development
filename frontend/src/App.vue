<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import StatusPanel from './components/StatusPanel.vue';
import { authStore } from './stores/auth';

const router = useRouter();
const menuOpen = ref(false);
const loggingOut = ref(false);
const logoutNotice = ref('');
const showIntro = ref(false);
const introStage = ref('sealed');
const invitationCard = ref(null);
const invitationSeal = ref(null);
let introTimer;

const starlight = Array.from({ length: 72 }, (_, index) => {
  const angle = (index / 72) * Math.PI * 2 + (index % 5) * .09;
  const distance = 58 + (index % 7) * 4;
  const travelX = Math.cos(angle) * distance;
  const travelY = Math.sin(angle) * distance;

  return {
    '--star-x': `${7 + ((index * 37) % 86)}%`,
    '--star-y': `${7 + ((index * 53) % 86)}%`,
    '--star-dx': `${travelX}vmax`,
    '--star-dy': `${travelY}vmax`,
    '--star-mid-x': `${travelX * .3}vmax`,
    '--star-mid-y': `${travelY * .3}vmax`,
    '--star-delay': `${(index % 12) * 25}ms`,
    '--star-size': `${2 + (index % 5)}px`,
  };
});

watch(() => authStore.state.welcomeInvitationPending, (pending) => {
  if (!pending) return;

  window.clearTimeout(introTimer);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    showIntro.value = false;
    authStore.consumeWelcomeInvitation();
    router.replace({ name: 'marketplace' });
    return;
  }

  introStage.value = 'arriving';
  showIntro.value = true;
  introTimer = window.setTimeout(() => {
    introStage.value = 'sealed';
    nextTick(() => invitationSeal.value?.focus());
  }, 900);
});

watch(() => authStore.state.sessionExpired, (expired) => {
  if (!expired || !router.currentRoute.value.meta.requiresAuth) return;
  authStore.dismissSessionExpired();
  router.replace({
    name: 'login',
    query: { redirect: router.currentRoute.value.fullPath, expired: '1' }
  });
});

function openInvitation() {
  if (introStage.value !== 'sealed') return;
  introStage.value = 'opening';
  introTimer = window.setTimeout(() => {
    introStage.value = 'ready';
    nextTick(() => invitationCard.value?.focus());
  }, 4000);
}

function keepIntroFocus() {
  if (introStage.value === 'ready') invitationCard.value?.focus();
  else if (introStage.value === 'sealed') invitationSeal.value?.focus();
}

function enterSite() {
  if (introStage.value !== 'ready') return;
  introStage.value = 'dispersing';
  router.replace({ name: 'marketplace' });
  introTimer = window.setTimeout(() => {
    showIntro.value = false;
    authStore.consumeWelcomeInvitation();
  }, 2600);
}

onBeforeUnmount(() => window.clearTimeout(introTimer));

async function logout() {
  loggingOut.value = true;
  logoutNotice.value = '';
  try {
    await authStore.logout();
  } catch (error) {
    logoutNotice.value = `${error.message} You have still been signed out on this device.`;
  } finally {
    menuOpen.value = false;
    await router.push({ name: 'marketplace' });
    loggingOut.value = false;
  }
}
</script>

<template>
  <div class="app-shell">
      <div
        v-if="showIntro"
        :class="['invitation-intro', `intro-${introStage}`]"
        role="dialog"
        aria-modal="true"
        aria-label="Private invitation"
        @keydown.tab.prevent="keepIntroFocus"
      >
        <div class="invitation-scene">
          <div class="envelope-shell">
            <span class="envelope-back" />
            <button
              ref="invitationCard"
              class="invitation-card"
              type="button"
              :disabled="introStage !== 'ready'"
              aria-label="Enter GrooveGavel"
              @click="enterSite"
            >
              <span class="invitation-kicker">Private invitation</span>
              <span class="invitation-ornament">G</span>
              <strong>Welcome to a<br /><em>Cabinet of Curious Things</em></strong>
              <span class="invitation-rule" />
              <small>GrooveGavel · Private collection · 1992</small>
            </button>
            <span class="envelope-pocket" />
            <span class="envelope-flap" />
            <button
              ref="invitationSeal"
              class="wax-seal"
              type="button"
              :disabled="introStage !== 'sealed'"
              aria-label="Open invitation"
              @click="openInvitation"
            >
              <span class="wax-seal-half wax-seal-left" />
              <span class="wax-seal-half wax-seal-right" />
              <span class="wax-seal-letter">G</span>
            </button>
          </div>
          <span class="invitation-prompt">
            {{ introStage === 'ready' ? 'Click the invitation to enter' : 'Click the seal to open' }}
          </span>
          <span class="starlight-dust" aria-hidden="true">
            <i v-for="(star, index) in starlight" :key="index" :style="star" />
          </span>
        </div>
      </div>
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="GrooveGavel home" @click="menuOpen = false">
        <span class="brand-mark" aria-hidden="true">G</span>
        <span>
          <strong>GrooveGavel</strong>
          <small>COLLECTORS’ AUCTION HOUSE</small>
        </span>
      </RouterLink>

      <button
        class="menu-button"
        type="button"
        :aria-expanded="menuOpen"
        aria-controls="main-navigation"
        @click="menuOpen = !menuOpen"
      >
        Menu
      </button>

      <nav id="main-navigation" :class="{ open: menuOpen }" aria-label="Main navigation">
        <RouterLink to="/" @click="menuOpen = false">Marketplace</RouterLink>
        <template v-if="authStore.isAuthenticated">
          <RouterLink to="/items/new" @click="menuOpen = false">List an object</RouterLink>
          <RouterLink :to="`/profile/${authStore.state.userId}`" @click="menuOpen = false">Profile</RouterLink>
          <button class="nav-button" type="button" :disabled="loggingOut" @click="logout">
            {{ loggingOut ? 'Signing out…' : 'Sign out' }}
          </button>
        </template>
        <template v-else>
          <RouterLink to="/login" @click="menuOpen = false">Sign in</RouterLink>
          <RouterLink class="nav-cta" to="/register" @click="menuOpen = false">Create account</RouterLink>
        </template>
      </nav>
    </header>

    <StatusPanel
      v-if="logoutNotice"
      class="global-notice page-width"
      type="error"
      title="Sign-out warning"
      :message="logoutNotice"
    />

    <div v-if="authStore.state.sessionExpired" class="session-alert" role="alert">
      <span>Your session has expired. Please sign in again to continue.</span>
      <RouterLink to="/login" @click="authStore.dismissSessionExpired()">Sign in</RouterLink>
      <button type="button" aria-label="Dismiss session message" @click="authStore.dismissSessionExpired()">Dismiss</button>
    </div>

    <main id="main-content" tabindex="-1">
      <RouterView v-slot="{ Component, route }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </RouterView>
    </main>

    <footer class="site-footer">
      <p class="footer-brand"><strong>GrooveGavel</strong><span>Old things. New stories.</span></p>
      <span class="footer-edition">Catalogue No. 09 · The collector’s edition · 1992</span>
      <RouterLink to="/">Back to marketplace</RouterLink>
    </footer>
  </div>
</template>
