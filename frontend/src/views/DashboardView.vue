<template>
<main class="dashboard-view">
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

const currentComponent = shallowRef(MonthlySummaryComponent);
const switchComponent = (component) => {
    if (component == MonthlySummaryComponent) {
        currentComponent.value = MonthlySummaryComponent
    } else {
        currentComponent.value = DeadlineComponent
    }
}
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