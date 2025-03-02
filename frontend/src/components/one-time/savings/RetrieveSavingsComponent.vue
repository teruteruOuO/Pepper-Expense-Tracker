<template>
<section class="retrieve-savings-component">
    <h2>Retrieve Savings Component</h2>
    <section class="add-savings-link">
        <RouterLink :to="{ name: 'add-savings' }">Add Savings</RouterLink>
    </section>

    <section class="loader" v-if="isLoading">
    </section>

    <section class="retrieve-fail" v-else-if="retrieveResourcesFail">
        <p>{{ feedbackFromBackend }}</p>
    </section>

    <section class="none" v-else-if="!userSavings">
        <p>You do not have any savings yet. Add one!</p>
    </section>

    <section class="success" v-else>
        <section class="search-engines">
            <ul>
                <li>
                    <label for="search-saving">Search: </label>
                    <input type="text" name="search-saving" id="search-saving" v-model="searchSavings">
                </li>
            </ul>
        </section>
        
        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Current Amount</th>
                    <th>Target Amount</th>
                    <th>Progress</th>
                    <th>Deadline</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="saving in computedSavings" :key="saving.sequence" @click="enterSaving(saving.sequence)">
                    <td>{{ saving.name }}</td>
                    <td>{{ saving.description }}</td>
                    <td>{{ currencySign }}{{ saving.current_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td>{{ currencySign }}{{ saving.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</td>
                    <td><progress :id="`saving-progress-${saving.sequence}`" max="100" :value="saving.progress">{{ saving.progress }}</progress> {{ saving.progress.toFixed(2) }}%</td>
                    <td>{{ saving.deadline }}</td>
                </tr>
            </tbody>
        </table>
    </section>

    
</section>
</template>


<script setup>
import axios from 'axios';
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { RouterLink } from 'vue-router';
import { useRouter } from 'vue-router';

// Initialize variables
const user = useUserStore();
const router = useRouter();
const isLoading = ref(false);
const userSavings = ref([]);
const feedbackFromBackend = ref("");
const retrieveResourcesFail = ref(false);
const currencySign = ref('');
const searchSavings = ref('');

// Retrieve the all of the user's savings
const retrieveSavings = async () => {
    isLoading.value = true;

    try {
        const response = await axios.get(`/api/savings/${user.userInformation.username}/${user.userInformation.currency_code}`);
        console.log(response.data.message);

        // Store currency sign
        currencySign.value = response.data.currency_sign;

        // Store all of the retrieved user savings
        userSavings.value = response.data.savings;

    } catch (err) {
        console.error(`An error occured while retrieving the user's savings in RetrieveSavingsComponent in SavingsView.`);
        console.error(err);
        feedbackFromBackend.value = err.response.data.message;
        retrieveResourcesFail.value = true;
    
    } finally {
        isLoading.value = false;

    }
}

// Search Filter (by name, description, current, or target amount)
const computedSavings = computed(() => {
    return userSavings.value.filter(saving => {
        const searchTerm = searchSavings.value.toLowerCase();

        // Convert deadline to a formatted string
        const formattedDeadline = new Date(saving.deadline).toLocaleDateString('en-US', { 
            month: 'short', day: 'numeric', year: 'numeric' 
        }).toLowerCase();

        return (
            saving.name.toLowerCase().includes(searchTerm) || 
            (saving.description?.toLowerCase() || '').includes(searchTerm) || // Handle optional description
            saving.current_amount.toString().includes(searchTerm) ||
            saving.target_amount.toString().includes(searchTerm) ||
            formattedDeadline.includes(searchTerm) // Search in formatted deadline
        );
    });
});

// Route to update page for each savings
const enterSaving = (sequence) => {
    router.push({ name: 'update-savings', params: { sequence } });
}

// Automatically trigger retrieve savings
onMounted(async () => {
    await retrieveSavings();

});

</script>


<style scoped>
table, th, tr, td {
    border: 1px solid black;
    text-align: left;
}

tbody tr:hover {
    cursor: pointer;
    background-color: pink;
}
</style>