import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs } from "firebase/firestore"; // Import Firestore functions
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
    authDomain: "uchat-d9392.firebaseapp.com",
    projectId: "uchat-d9392",
    storageBucket: "uchat-d9392.appspot.com",
    messagingSenderId: "397312451749",
    appId: "1:397312451749:web:6128f84f311b045f9d194c"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore
// Automatically fetch user conversations when the page loads
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("User is logged in:", user);
            try {
                await fetchUserConversations(); // Call the function if user is logged in
            } catch (error) {
                console.error('Error calling fetchUserConversations:', error);
            }
        } else {
            console.log('No user is logged in.');
        }
    });
});
// Function to get the current user's conversations
async function fetchUserConversations() {
    const user = auth.currentUser;  // Get the current logged-in user
    if (!user) {
        console.log('No user is logged in.');
        return;
    }
    try {
        // Access the current user's document in Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        if (!userDocSnapshot.exists()) {
            console.log("User document not found");
            return;
        }
        // Access the conversations array
        const userData = userDocSnapshot.data();
        const conversations = userData.conversations || [];
        if (conversations.length === 0) {
            console.log('No conversations available for this user.');
            return;
        }
        // If there are conversations, fetch them from the Firestore 'conversations' collection
        const conversationsRef = collection(db, "conversations");
        const querySnapshot = await getDocs(conversationsRef);
        querySnapshot.forEach((doc) => {
            if (conversations.includes(doc.id)) {
                console.log("Conversation ID: " + doc.id);
                // You could append these to the DOM or display them in any way you want
            }
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
    }
}
// Sign Out Functionality
const signOutButton = document.getElementById("signOutButton");
if (signOutButton) {
    signOutButton.addEventListener("click", function() {
        signOut(auth).then(() => {
            console.log("Signed out successfully.");
            location.href="../dist/login.html";
            alert("Signed out successfully.");
        }).catch((error) => {
            console.error("Sign out error:", error);
        });
    });
}