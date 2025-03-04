import { defineStore } from 'pinia';
import { ref, computed, onMounted, onUnmounted } from 'vue';

export const useWindowStore = defineStore('windowStore', () => {
    const windowWidth = ref(window.innerWidth);

    const updateWidth = () => {
        windowWidth.value = window.innerWidth;
    };

    // Computed property for visibility based on width range
    const isPhone = computed(() => windowWidth.value <= 576);

    // Attach event listener when store is initialized
    onMounted(() => {
        window.addEventListener('resize', updateWidth);
    });

    onUnmounted(() => {
        window.removeEventListener('resize', updateWidth);
    });

    return { windowWidth, isPhone };
});