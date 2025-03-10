<template>
<main class="dashboard-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="monthly-summary" @click="switchComponent('MonthlySummaryComponent')">
                    Monthly Summary
                </button>
            </li>
            <li>
                <button type="button" class="deadlines" @click="switchComponent('DeadlineComponent')">
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
import { ref, onMounted } from 'vue';

// Map component names to actual component objects
const componentMap = {
    MonthlySummaryComponent,
    DeadlineComponent
};

// Retrieve stored component or default to MonthlySummaryComponent
const storedComponent = localStorage.getItem('selectedDashboardComponent') || 'MonthlySummaryComponent';
const currentComponent = ref(componentMap[storedComponent]);

// Function to switch components and store selection
const switchComponent = (componentName) => {
    currentComponent.value = componentMap[componentName];
    localStorage.setItem('selectedDashboardComponent', componentName);
};

// Ensure selected component persists on page reload
onMounted(() => {
    const savedComponent = localStorage.getItem('selectedDashboardComponent');
    if (savedComponent && componentMap[savedComponent]) {
        currentComponent.value = componentMap[savedComponent];
    }
});
</script>


<style scoped>
.buttons, li {
    display: contents;
}

ul {
    display: flex;
    justify-content: center;
    align-content: center;
    margin-block-start: 20px;
    column-gap: 10px;
    row-gap: 10px;
}

button {
    border: 1px solid black;
    border-radius: 20px;
    inline-size: 170px;
    block-size: 30px;
    padding-inline: 10px;
    border: 1px solid black;
    background-color: #FFD0D8;
}

button:focus, button:hover {
    background-color: rgb(255, 225, 230);
    color: rgb(59, 59, 59);
    border-color: rgb(59, 59, 59);
}

button:active {
    background-color: rgb(255, 240, 243);
    color: rgb(102, 101, 101);
    border-color: rgb(117, 117, 117);
    cursor: not-allowed;
}
</style>