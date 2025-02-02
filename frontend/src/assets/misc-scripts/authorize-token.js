import axios from "axios";
import { useUserStore } from "@/stores/user";

// Determine a user's authority for accessing each webpage before they can continue
export const authorizeToken = async () => {
    const user = useUserStore();

    try {
        const response = await axios.get('/api/page/verify-token');
        console.log("Successfully entered a secured webpage: ", response.data.message.toLowerCase());
        return true;

    } catch (err) {
        console.error("An error occured in assets/misc/authorizeToken");
        console.error(err);

        // Automatically log out the user if there's an authorization issue (ex: expired token)
        if (err.response && err.response.status === 401) {
            console.error(err.response.data.message);
            user.resetUserStore();
        }

        return false;
    }
}