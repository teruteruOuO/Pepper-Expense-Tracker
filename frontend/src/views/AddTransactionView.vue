<template>
<main class="add-transaction-view">
    <section class="buttons">
        <ul>
            <li>
                <button type="button" @click="router.go(-1)">
                    ← Go Back
                </button>
            </li>
        </ul>
    </section>
    <AddTransactionComponent />
</main>
</template>

<script setup>
import AddTransactionComponent from '@/components/one-time/transaction/AddTransactionComponent.vue';
import { useRouter } from 'vue-router';
const router = useRouter();
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