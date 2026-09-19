import { createRouter, createWebHistory } from 'vue-router';
import MarketplaceView from '../views/MarketplaceView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import WelcomeView from '../views/WelcomeView.vue';
import ProfileView from '../views/ProfileView.vue';
import ItemDetailView from '../views/ItemDetailView.vue';
import ItemFormView from '../views/ItemFormView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import { authStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    { path: '/', name: 'marketplace', component: MarketplaceView, meta: { title: 'Marketplace' } },
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true, title: 'Sign in' } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true, title: 'Create account' } },
    { path: '/welcome', name: 'welcome', component: WelcomeView, meta: { requiresAuth: true, title: 'Welcome' } },
    { path: '/profile/:id?', name: 'profile', component: ProfileView, meta: { title: 'My account' } },
    { path: '/items/new', name: 'item-new', component: ItemFormView, meta: { requiresAuth: true, title: 'List an object' } },
    { path: '/items/:id/edit', name: 'item-edit', component: ItemFormView, meta: { requiresAuth: true, title: 'Review lot' } },
    { path: '/items/:id', name: 'item-detail', component: ItemDetailView, meta: { title: 'Lot details' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView }
  ]
});

router.afterEach((to) => {
  document.title = `${to.meta.title || 'Page not found'} · GrooveGavel`;
  window.requestAnimationFrame(() => document.querySelector('#main-content')?.focus({ preventScroll: true }));
});

router.beforeEach((to) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.name === 'welcome' && !authStore.state.welcomeInvitationPending) {
    return { name: 'marketplace' };
  }
  if (to.name === 'profile' && !to.params.id && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }
  if (to.meta.guestOnly && authStore.isAuthenticated) return { name: 'marketplace' };
  return true;
});

export default router;
