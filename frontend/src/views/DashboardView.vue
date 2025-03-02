<template>
<main class="dashboard-view">
    <h1>Dashboard Page</h1>
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="monthly-summary" @click="switchComponent(MonthlySummaryComponent)">
                    Monthly Summary
                </button>
            </li>
            <li>
                <button type="button" class="deadlines" @click="switchComponent(DeadlineComponent)">
                    Deadlines
                </button>
            </li>
        </ul>
    </section>
    <component :is="currentComponent"/>
</main>
</template>

<script setup>
import MonthlySummaryComponent from '@/components/one-time/dashboard/monthly-summary/MonthlySummaryComponent.vue';
import DeadlineComponent from '@/components/one-time/dashboard/deadlines/DeadlineComponent.vue';
import { shallowRef  } from 'vue';

const currentComponent = shallowRef (MonthlySummaryComponent);
const switchComponent = (component) => {
    if (component == MonthlySummaryComponent) {
        currentComponent.value = MonthlySummaryComponent
    } else {
        currentComponent.value = DeadlineComponent
    }
}
</script>