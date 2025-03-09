<template>
<main class="update-savings-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" class="savings-operation" @click="switchComponent(SavingsOperationComponent)">
                    Add / Deduct
                </button>
            </li>
            <li>
                <button type="button" class="update-savings" @click="switchComponent(UpdateSavingsComponent)">
                    Update Savings
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
import { shallowRef  } from 'vue';

const currentComponent = shallowRef(SavingsOperationComponent);
// Function to switch components dynamically
const switchComponent = (component) => currentComponent.value = component;
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