import { createRouter, createWebHistory } from "vue-router";
import LoginView from '../views/LoginView.vue';
import { authorizeToken } from "@/assets/misc-scripts/authorize-token";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: LoginView
        },
        {
            path: '/sign-up',
            name: 'sign-up',
            component: () => import('../views/SignupView.vue')
        },
        {
            path: '/forgot-password',
            name: 'forgot-password',
            component: () => import('../views/ForgotPasswordView.vue')
        },
        {
            path: '/',
            name: 'dashboard',
            meta: { requiresAuth: true },
            component: () => import('../views/DashboardView.vue')
        },
        {
            path: '/account',
            name: 'account',
            meta: { requiresAuth: true },
            component: () => import('../views/AccountView.vue')
        },
        {
            path: '/transaction',
            name: 'transaction',
            meta: { requiresAuth: true },
            component: () => import('../views/TransactionView.vue')
        },
        {
            path: '/transaction/add',
            name: 'add-transaction',
            meta: { requiresAuth: true },
            component: () => import('../views/AddTransactionView.vue')
        },
        {
            path: '/transaction/:sequence',
            name: 'update-transaction',
            meta: { requiresAuth: true },
            component: () => import('../views/UpdateTransactionView.vue')
        },
        {
            path: '/savings',
            name: 'savings',
            meta: { requiresAuth: true },
            component: () => import('../views/SavingsView.vue')
        },
        {
            path: '/savings/add',
            name: 'add-savings',
            meta: { requiresAuth: true },
            component: () => import('../views/AddSavingsView.vue')
        },
        {
            path: '/savings/:sequence',
            name: 'update-savings',
            meta: { requiresAuth: true },
            component: () => import('../views/UpdateSavingsView.vue')
        },
        {
            path: '/budget',
            name: 'budget',
            meta: { requiresAuth: true },
            component: () => import('../views/BudgetView.vue')
        },
        {
            path: '/budget/add',
            name: 'add-budget',
            meta: { requiresAuth: true },
            component: () => import('../views/AddBudgetView.vue')
        },
        {
            path: '/budget/:budget_id',
            name: 'update-budget',
            meta: { requiresAuth: true },
            component: () => import('../views/UpdateBudgetView.vue')
        },
        {
            path: '/:pathMatch(.*)*',
            redirect: { name: 'dashboard' }
        }
    ]
});

// This is triggered each time a user navigates from page to page
router.beforeEach(async (to, from, next) => {
    const isLoggedIn = await authorizeToken();

    // Redirect to home when accessing login or sign up pages when user is already logged in
    if ((to.name === 'login' || to.name === 'sign-up' || to.name === "forgot-password") && isLoggedIn) {
        next({ name: 'dashboard' });
    }

    // Redirect if trying to access a protected route without being logged in
    else if (to.meta.requiresAuth && !isLoggedIn) {
        next({ name: 'login' });
    } 

    // Allow navigation if no redirects are needed
    else {
        next();
    }
});


export default router
