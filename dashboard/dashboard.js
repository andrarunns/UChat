// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore"; // Import Firestore functions

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

const addFriendModal = document.getElementById("addFriendModal");
const addFriendButton = document.getElementById("addFriendButton");
const closeModal = document.getElementById("closeModal");

// Show modal on "Add Friend" button click
addFriendButton.addEventListener("click", () => {
    addFriendModal.style.display = "flex";
});

// Close modal when clicking the close button
closeModal.addEventListener("click", () => {
    addFriendModal.style.display = "none";
});

// Optional: Close modal when clicking outside of the modal content
window.addEventListener("click", (event) => {
    if (event.target == addFriendModal) {
        addFriendModal.style.display = "none";
    }
});
// Function to search for the user's email in Firestore and send a friend request
async function searchForUserEmail() {
    const emailInput = document.getElementById("friendEmail").value.trim(); // Get email from the correct input
    const currentUser = auth.currentUser; // Get the currently logged-in user

    if (!emailInput) {
        alert("Please enter an email address.");
        return;
    }

    if (!currentUser) {
        alert("You must be logged in to send a friend request.");
        return;
    }

    try {
        // Query Firestore for a document in the 'users' collection that matches the email
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", emailInput));
        const querySnapshot = await getDocs(emailQuery);

        if (!querySnapshot.empty) {
            // Get the first matching document (assuming emails are unique)
            const userDoc = querySnapshot.docs[0];
            const userDocRef = doc(db, "users", userDoc.id);
            const userData = userDoc.data();

            // Check if the friendRequest array exists; if not, initialize it
            const friendRequests = userData.friendRequest || [];

            if (friendRequests.includes(currentUser.uid)) {
                alert("Friend request already sent.");
                return;
            }

            // Add the current user's UID to the friendRequest array
            friendRequests.push(currentUser.uid);

            // Update the user's document with the new friendRequest array
            await updateDoc(userDocRef, { friendRequest: friendRequests });

            alert("Friend request sent successfully!");
        } else {
            alert("User does not exist.");
        }
    } catch (error) {
        console.error("Error searching for user:", error);
        alert("An error occurred. Please try again later.");
    }
}

document.getElementById("sendFriendRequest").addEventListener("click", searchForUserEmail);
