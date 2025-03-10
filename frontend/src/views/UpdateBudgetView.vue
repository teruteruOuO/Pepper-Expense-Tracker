<template>
<main class="update-budget-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="update-budget" @click="switchComponent('UpdateBudgetComponent')">
                    Update Budget
                </button>
            </li>
            <li>
                <button type="button" class="budget-transactions" @click="switchComponent('BudgetTransactionsComponent')">
                    Transactions
                </button>
            </li>
        </ul>
    </section>
    <component :is="currentComponent"/>
</main> 
</template>

<script setup>
import { ref, onMounted } from 'vue';
import UpdateBudgetComponent from '@/components/one-time/budget/UpdateBudgetComponent.vue';
import BudgetTransactionsComponent from '@/components/one-time/budget/BudgetTransactionsComponent.vue';

// Map component names to actual component objects
const componentMap = {
    UpdateBudgetComponent,
    BudgetTransactionsComponent
};

// Retrieve stored component or default to UpdateBudgetComponent
const storedComponent = localStorage.getItem('selectedBudgetComponent') || 'UpdateBudgetComponent';
const currentComponent = ref(componentMap[storedComponent]);

// Function to switch components and store selection
const switchComponent = (componentName) => {
    currentComponent.value = componentMap[componentName];
    localStorage.setItem('selectedBudgetComponent', componentName);
};

// Ensure selected component persists on page reload
onMounted(() => {
    const savedComponent = localStorage.getItem('selectedBudgetComponent');
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