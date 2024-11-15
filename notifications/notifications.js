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



// Fetch and display friend requests
async function loadFriendRequests() {
    const user = auth.currentUser;
    if (!user) {
        alert("No user is logged in.");
        return;
    }

    try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (!userDocSnapshot.exists()) {
            console.warn("User document not found.");
            return;
        }

        const friendRequests = userDocSnapshot.data().friendRequest || [];
        const friendRequestsList = document.getElementById("friendRequestsList");
        friendRequestsList.innerHTML = ''; // Clear existing content

        friendRequests.forEach(request => {
            const requestElement = document.createElement("div");
            requestElement.classList.add("friendRequest");

            const requestText = document.createElement("p");
            requestText.textContent = `Friend request from: ${request.email}`; // Assuming 'email' is part of the request data

            const actionButtons = document.createElement("div");
            actionButtons.classList.add("actionButtons");

            const acceptButton = document.createElement("button");
            acceptButton.classList.add("acceptButton");
            acceptButton.textContent = "Accept";
            acceptButton.addEventListener("click", () => acceptRequest(request));

            const declineButton = document.createElement("button");
            declineButton.classList.add("declineButton");
            declineButton.textContent = "Decline";
            declineButton.addEventListener("click", () => declineRequest(request));

            actionButtons.appendChild(acceptButton);
            actionButtons.appendChild(declineButton);

            requestElement.appendChild(requestText);
            requestElement.appendChild(actionButtons);

            friendRequestsList.appendChild(requestElement);
        });
    } catch (error) {
        console.error("Failed to load friend requests:", error);
    }
}

async function acceptRequest(request) {
    // Handle accepting a friend request (this should be based on your data model)
    console.log("Accepted request from:", request.email);
    // Update Firestore or backend accordingly
}

async function declineRequest(request) {
    // Handle declining a friend request (this should be based on your data model)
    console.log("Declined request from:", request.email);
    // Update Firestore or backend accordingly
}

// Load friend requests on page load
window.addEventListener("DOMContentLoaded", loadFriendRequests);
