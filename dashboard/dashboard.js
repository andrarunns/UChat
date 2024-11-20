// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, collection, getDocs, query, where, updateDoc, setDoc, arrayUnion, serverTimestamp, addDoc} from "firebase/firestore"; // Import Firestore functions


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
                await updateNotificationBell();
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
    const user = auth.currentUser; // Get the current logged-in user

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
        const conversations = userData.chats || [];

        if (conversations.length === 0) {
            console.log('No conversations available for this user.');
            return;
        }

        // Get the conversations container in the DOM
        const conversationsContainer = document.getElementById('chatList');
        conversationsContainer.innerHTML = ""; // Clear any existing content

        // Fetch the conversations from Firestore 'chats' collection
        const conversationsRef = collection(db, "chats");
        const querySnapshot = await getDocs(conversationsRef);

        querySnapshot.forEach(async (chatDoc) => {
            if (conversations.includes(chatDoc.id)) {
                const chatData = chatDoc.data();
            
                // Filter out the currently logged-in user from the participants
                const otherUsers = chatData.participants.filter((participant) => participant !== user.uid);
            
                // Display each other user in the chat
                otherUsers.forEach(async (otherUserId) => {
                    try {
                        // Fetch user details from Firestore
                        const userDocRef = doc(db, "users", otherUserId);
                        const userDocSnapshot = await getDoc(userDocRef);
            
                        if (!userDocSnapshot.exists()) {
                            console.log(`User document not found for ID: ${otherUserId}`);
                            return;
                        }
            
                        const otherUserData = userDocSnapshot.data();
                        const fullName = `${otherUserData.firstname} ${otherUserData.lastname }`;
            
                        // Create the list item
                        const listItem = document.createElement('li');
                        listItem.textContent = `${fullName}: ${chatData.lastMessage}`; // Display the full name
                        listItem.className = "chat-item";
                        
                        // Add a click listener to open the chat or navigate
                        listItem.addEventListener('click', () => {
                            alert(`Opening chat with: ${fullName}`);
                            
                            window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
                            
                        });
            
                        conversationsContainer.appendChild(listItem); // Append to the container
                    } catch (error) {
                        console.error(`Error fetching user details for ID: ${otherUserId}`, error);
                    }
                });
            }
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
    }
}

// Helper function to display messages in the chat list container
function displayMessage(message) {
    const conversationsContainer = document.getElementById('chatList');
    conversationsContainer.innerHTML = `<li>${message}</li>`;
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


async function updateNotificationBell() {
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
        const friends = userData.friendRequest || [];

        if (friends.length === 0) {
            console.log('No friends available for this user.');
            notificationDot.style.display = "none";
            return;
        }else {
            console.log(friends.length);
            notificationDot.style.display = "block";
        }

    } catch (error) {
        console.error("Error fetching conversations:", error);
    }
}

// Redirect to notification page when the bell icon is clicked
const notificationBell = document.getElementById("notificationBell");
notificationBell.addEventListener("click", () => {
    window.location.href= "/notifications/notifications.html";
});
// Function to initialize the friends dropdown
async function initializeFriendsDropdown(user) {
    try {
        // Fetch user document from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (!userDocSnapshot.exists()) {
            console.log("User document not found");
            return;
        }

        // Access the friends array
        const userData = userDocSnapshot.data();
        const friends = userData.friends;
        console.log(friends);

        // References
        const newChatButton = document.getElementById('newChat');
        const friendsDropdown = document.getElementById('friendsDropdown');

        // Toggle dropdown visibility
        newChatButton.addEventListener('click', () => {
            friendsDropdown.style.display = friendsDropdown.style.display === 'none' || friendsDropdown.style.display === '' ? 'block' : 'none';
        });

        // Populate friends list
        friends.forEach(async (friend) => {
            // If friend is just an email, fetch the friend's user document to get the uid
            let friendDocRef;
            if (typeof friend === 'string') {
                // Assuming friend is an email
                friendDocRef = await getDoc(doc(db, "users", friend)); // Fetch the friend document by email
            } else {
                friendDocRef = await getDoc(doc(db, "users", friend.uid)); // If friend is an object with uid
            }

            if (friendDocRef.exists()) {
                const friendData = friendDocRef.data();
                const friendWithUid = { email: friendData.email, uid: friendData.uid };

                const listItem = document.createElement('li');
                listItem.textContent = friendWithUid.email; // Display friend's email
                listItem.style.padding = '10px';
                listItem.style.cursor = 'pointer';
                listItem.style.borderBottom = '1px solid #ccc';

                // Add hover effect
                listItem.addEventListener('mouseover', () => {
                    listItem.style.backgroundColor = '#f0f0f0';
                });
                listItem.addEventListener('mouseout', () => {
                    listItem.style.backgroundColor = '';
                });

                // Add click handler to initiate chat
                listItem.addEventListener('click', async () => {
                    const chatId = await createNewChat(user, friendWithUid); // Pass friend as an object with email and uid
                    friendsDropdown.style.display = 'none'; // Hide dropdown after selecting friend
                    
                    if (chatId) {
                        // Redirect to the new chat room using the chatId
                        console.log("aj andrea")
                        //window.location.href = `/chat/${chatId}`;  // Adjust the URL structure based on your routing setup
                        // Redirect the user to the chat page
                        //window.location.href = `/chat.html?chatId=${chatId}`;
                    }
                });

                friendsDropdown.appendChild(listItem);
            } else {
                console.warn("Friend document not found:", friend);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!newChatButton.contains(event.target) && !friendsDropdown.contains(event.target)) {
                friendsDropdown.style.display = 'none';
            }
        });
    } catch (error) {
        console.error("Error fetching user document:", error);
    }
}
// Function to create a new chat room
async function createNewChat(currentUser, friend) {
    try {
        if (!currentUser?.uid || !friend?.uid) {
            console.error("Invalid currentUser or friend");
            return;
        }

        // Generate a new chat ID manually
        const chatId = Math.floor(10000 + Math.random() * 90000).toString();
        const newChatRef = doc(db, "chats", chatId); // Create a reference for the new chat

        const newChatData = {
            participants: [currentUser.uid, friend.uid], // Chat participants
            createdAt: serverTimestamp(), // Chat creation timestamp
            lastMessage: "Hello, how are you?", // Initial last message
            lastMessageAt: serverTimestamp() // Timestamp of the last message
        };

        console.log("New chat data:", newChatData); // Debugging log

        // Use setDoc to create the new chat document
        await setDoc(newChatRef, newChatData);
        console.log("New chat created with ID:", chatId);

        // Update the user's document to include the new chat
        await updateDoc(doc(db, "users", currentUser.uid), {
            chats: arrayUnion(chatId) // Append the chat ID to the user's list of chats
        });

        // Update the friend's document if they exist
        const friendDocRef = doc(db, "users", friend.uid);
        const friendDoc = await getDoc(friendDocRef);
        if (friendDoc.exists()) {
            await updateDoc(friendDocRef, {
                chats: arrayUnion(chatId) // Append the chat ID to the friend's list of chats
            });
        } else {
            console.warn("Friend document does not exist:", friend.uid);
        }

        // // Step 2: Add messages to the messages subcollection
        // const messagesRef = collection(newChatRef, "messages");

        // const message1 = {
        //     sender: currentUser.email,
        //     text: "Hi!",
        //     timestamp: serverTimestamp(),
        //     seenBy: [currentUser.email]
        // };

        // const message2 = {
        //     sender: friend.email,
        //     text: "Hello, how are you?",
        //     timestamp: serverTimestamp(),
        //     seenBy: []
        // };

        // // Add the messages
        // await addDoc(messagesRef, message1);
        // await addDoc(messagesRef, message2);

        console.log("Messages added to subcollection!");

        // Redirect the user to the chat page
        window.location.href = `/chat/chat.html?chatId=${chatId}`;
       
        

    } catch (error) {
        console.error("Error creating new chat:", error.message);
    }
}



// Listen for user authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await initializeFriendsDropdown(user);

    } else {
        console.log('No user is logged in. allegedly');
    }
});
