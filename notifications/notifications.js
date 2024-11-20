// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import {
    getAuth,
    onAuthStateChanged,
    setPersistence,
    browserLocalPersistence,
    signOut
} from "firebase/auth";
import {
    getFirestore,
    doc,
    getDoc,
    collection,
    getDocs,
    query,
    where,
    updateDoc,
} from "firebase/firestore"; // Import Firestore functions

import { arrayUnion, arrayRemove } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
    authDomain: "uchat-d9392.firebaseapp.com",
    projectId: "uchat-d9392",
    storageBucket: "uchat-d9392.appspot.com",
    messagingSenderId: "397312451749",
    appId: "1:397312451749:web:6128f84f311b045f9d194c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Ensure authentication persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => {
        console.log("Auth persistence set to local.");
    })
    .catch((error) => {
        console.error("Error setting auth persistence:", error);
    });

// Wait for the DOM to load and then set up the auth state listener
window.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.uid);
            loadfriendRequest(user); // Pass the user object to the function
        } else {
            alert("No user is logged in.");
        }
    });
});

async function loadfriendRequest() {
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

        const friendRequest = userDocSnapshot.data().friendRequest || [];
        const currUser = userDocSnapshot.data().firstname;
        console.log(currUser)
        console.log("Friend Requests Array:", friendRequest);

        // Filter out invalid entries in the friendRequest array
        const validRequests = friendRequest.filter((uid) => uid && typeof uid === "string");
        if (validRequests.length !== friendRequest.length) {
            console.warn("Filtered out invalid friend requests.");
        }

        displayNotification(validRequests);
    } catch (error) {
        console.error("Failed to load friend requests:", error);
    }
}


// Function to display friend requests in the notifications table
async function displayNotification(friendRequest) {
    const table = document.getElementById("notificationsTable");
    console.log("Displaying notifications...");

    // Clear existing rows, keeping the header intact
    while (table.rows.length > 1) {
        table.deleteRow(1);
    }

    // Fetch and display each friend's details
    for (const uid of friendRequest) {
        try {
            // Fetch user details by UID from Firestore
            const userDocRef = doc(db, "users", uid);
            const userDocSnapshot = await getDoc(userDocRef);

            if (!userDocSnapshot.exists()) {
                console.warn(`No user found for UID: ${uid}`);
                continue;
            }

            const userData = userDocSnapshot.data();
            const firstName = userData.firstname || "Unknown";
            const lastName = userData.lastname || "Unknown";

            // Add a row for this friend request
            let row = table.insertRow(-1); // Add a row at the end of the table
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2); // Action buttons

            // Display the request message with first and last name
            cell2.innerHTML = `Friend request from: ${firstName} ${lastName}`;

            // Add action buttons for accepting or declining the request
            const acceptButton = document.createElement("button");
            acceptButton.textContent = "Accept";
            acceptButton.addEventListener("click", () => acceptFriendRequest(uid));

            const declineButton = document.createElement("button");
            declineButton.textContent = "Decline";
            declineButton.addEventListener("click", () => declineFriendRequest(uid));

            cell3.appendChild(acceptButton);
            cell3.appendChild(declineButton);
        } catch (error) {
            console.error(`Failed to fetch details for UID: ${uid}`, error);
        }
    }
}


async function acceptFriendRequest(uid) {
    if (!uid) {
        console.error("Invalid UID received:", uid);
        return;
    }

    try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error("No user is currently logged in.");
            return;
        }

        const currentUserDocRef = doc(db, "users", currentUser.uid);
        const senderUserDocRef = doc(db, "users", uid); // Reference to sender's document

        // Perform both updates in Firestore
        await Promise.all([
            updateDoc(currentUserDocRef, {
                friends: arrayUnion(uid),
                friendRequest: arrayRemove(uid),
            }),
            updateDoc(senderUserDocRef, {
                friends: arrayUnion(currentUser.uid),
            }),
        ]);

        console.log(`Successfully updated friends for ${currentUser.uid} and ${uid}.`);
        alert("Friend request accepted!");
        loadfriendRequest();
    } catch (error) {
        console.error("Error accepting friend request:", error);
        alert("Failed to accept friend request. Please try again.");
    }
}


// Function to handle declining a friend request
async function declineFriendRequest(uid) {
    try {
        // Get the currently logged-in user
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.error("No user is currently logged in.");
            return;
        }

        const currentUserDocRef = doc(db, "users", currentUser.uid);

        // Remove the UID from the 'friendRequest' array
        await updateDoc(currentUserDocRef, {
            friendRequest: arrayRemove(uid), // Remove from friend requests
        });

        console.log(`Removed UID ${uid} from friend requests.`);
        alert("Friend request declined!");

        // Optionally, reload friend requests
        loadfriendRequest();
    } catch (error) {
        console.error("Error declining friend request:", error);
        alert("Failed to decline friend request. Please try again.");
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

