<template>
<section class="update-savings-component">
    <h2>Update Savings Component</h2>
    <section class="loading">
        <p>Retrieving the savings...</p>
    </section>

    <section class="failed">
        <p>Cannot retrieve the savings information for you... Please try again later</p>
    </section>

    <section class="success">
        <form @submit.prevent="">
            <h3>Update Savings information</h3>
            <ul>
                <li>
                    <label for="savings-name-update">Name: </label>
                    <input type="text" name="savings-name-update" id="savings-name-update" required>
                </li>
                <li>
                    <label for="savings-description-update">Description: </label><br>
                    <textarea id="savings-description-update" placeholder="Enter description...">
                    </textarea>
                </li>
                <li>
                    <label for="savings-deadline-update">Deadline: </label>
                    <input type="date" name="savings-deadline-update" id="savings-deadline-update" required>
                </li>
                <li>
                    <label for="savings-current-amount-update">Current Amount: </label>
                    <input type="number" name="savings-current-amount-update" id="savings-current-amount-update" step="0.01">
                </li>
                <li>
                    <label for="savings-target-amount-update">Target Amount: </label>
                    <input type="number" name="savings-target-amount-update" id="savings-target-amount-update" step="0.01" required>
                </li>
                <li>
                    <button type="submit">
                        <span>Update</span>
                        <span>Updating...</span>
                    </button>
                </li>
                <li>
                    <button type="click">
                        <span>Delete</span>
                        <span>Deleting...</span>
                    </button>
                </li>
            </ul>
        </form>
    </section>
</section>
</template>

<script setup>
import axios from 'axios';
import { ref, reactive, onMounted, computed } from 'vue';
import { useUserStore } from '@/stores/user';

// Initialize variables
const isLoadingAdd = ref(false);
const isLoadingSubtract = ref(false);
const user = useUserStore();

</script>