<template>
<main class="update-savings-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="savings-operation" @click="switchComponent('SavingsOperationComponent')">
                    Add / Deduct
                </button>
            </li>
            <li>
                <button type="button" class="update-savings" @click="switchComponent('UpdateSavingsComponent')">
                    Update Savings
                </button>
            </li>
            <li>
                <button type="button" @click="router.go(-1)">
                    ← Go Back
                </button>
            </li>
        </ul>
    </section>
    <component :is="currentComponent"/>
</main> 
</template>

<script setup>
import UpdateSavingsComponent from '@/components/one-time/savings/UpdateSavingsComponent.vue';
import SavingsOperationComponent from '@/components/one-time/savings/SavingsOperationComponent.vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

// Map component names to actual component objects
const componentMap = {
    SavingsOperationComponent,
    UpdateSavingsComponent
};

// Retrieve stored component or default to SavingsOperationComponent
const storedComponent = localStorage.getItem('selectedSavingsComponent') || 'SavingsOperationComponent';
const currentComponent = ref(componentMap[storedComponent]);

// Function to switch components and store selection
const switchComponent = (componentName) => {
    currentComponent.value = componentMap[componentName];
    localStorage.setItem('selectedSavingsComponent', componentName);
};

// Ensure selected component persists on page reload
onMounted(() => {
    const savedComponent = localStorage.getItem('selectedSavingsComponent');
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
    flex-wrap: wrap;
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