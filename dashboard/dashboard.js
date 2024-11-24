// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  setDoc,
  arrayUnion,
  serverTimestamp,
  addDoc,
  writeBatch
} from "firebase/firestore"; // Import Firestore functions

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

// Automatically fetch user conversations when the page loads
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user);
      try {
        await fetchUserConversations(); // Call the function if user is logged in
        await updateNotificationBell();
      } catch (error) {
        console.error("Error calling fetchUserConversations:", error);
      }
    } else {
      console.log("No user is logged in.");
    }
  });
});

// Function to get the current user's conversations
async function fetchUserConversations() {
  const user = auth.currentUser; // Get the current logged-in user

  if (!user) {
    console.log("No user is logged in.");
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
      console.log("No conversations available for this user.");
      return;
    }
    // Get the conversations container in the DOM
    const conversationsContainer = document.getElementById("chatList");
    conversationsContainer.innerHTML = ""; // Clear any existing content

    // Fetch the conversations from Firestore 'chats' collection
    const conversationsRef = collection(db, "chats");
    const querySnapshot = await getDocs(conversationsRef);
      console.log(conversations);
      querySnapshot.forEach((chatDoc) => {
        console.log("Chat ID:", chatDoc.id);
    });  

    querySnapshot.forEach(async (chatDoc) => {
      if (conversations.includes(chatDoc.id)) {
        const chatData = chatDoc.data();
        console.log(chatData);
        // Check if it's a group chat
        if (chatData.name) {
          console.log("entra");
          // It's a group chat
          const groupName = chatData.name;
          
          // Create the list item
          const listItem = document.createElement("li");
          listItem.textContent = `${groupName}: ${chatData.lastMessage}`; // Display group name and last message
          listItem.className = "chat-item";
    
          // Add a click listener to open the chat or navigate
          listItem.addEventListener("click", () => {
            window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
          });
    
          conversationsContainer.appendChild(listItem); // Append to the container
        } else {
          // It's an individual chat
          const otherUsers = chatData.participants.filter(
            (participant) => participant !== user.uid
          );
    
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
              const fullName = `${otherUserData.firstname} ${otherUserData.lastname}`;
    
              // Create the list item
              const listItem = document.createElement("li");
              listItem.textContent = `${fullName}: ${chatData.lastMessage}`; // Display the full name and last message
              listItem.className = "chat-item";
    
              // Add a click listener to open the chat or navigate
              listItem.addEventListener("click", () => {
                window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
              });
    
              conversationsContainer.appendChild(listItem); // Append to the container
            } catch (error) {
              console.error(
                `Error fetching user details for ID: ${otherUserId}`,
                error
              );
            }
          });
        }
      }
    });    
  } catch (error) {
    console.error("Error fetching conversations:", error);
  }
}

// Helper function to display messages in the chat list container
function displayMessage(message) {
  const conversationsContainer = document.getElementById("chatList");
  conversationsContainer.innerHTML = `<li>${message}</li>`;
}

// Sign Out Functionality
const signOutButton = document.getElementById("signOutButton");
if (signOutButton) {
  signOutButton.addEventListener("click", function () {
    signOut(auth)
      .then(() => {
        console.log("Signed out successfully.");
        location.href = "../dist/login.html";
        alert("Signed out successfully.");
      })
      .catch((error) => {
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

document
  .getElementById("sendFriendRequest")
  .addEventListener("click", searchForUserEmail);

async function updateNotificationBell() {
  const user = auth.currentUser; // Get the current logged-in user

  if (!user) {
    console.log("No user is logged in.");
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
      console.log("No friends available for this user.");
      notificationDot.style.display = "none";
      return;
    } else {
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
  window.location.href = "/notifications/notifications.html";
});
// Function to initialize the friends dropdown
async function initializeFriendsDropdown(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);

    if (!userDocSnapshot.exists()) {
      console.log("User document not found");
      return;
    }

    const userData = userDocSnapshot.data();
    const friends = userData.friends || []; // Use an empty array if no friends

    const newChatButton = document.getElementById("newChat");
    const friendsDropdown = document.getElementById("friendsDropdown");

    // Toggle dropdown visibility
    newChatButton.addEventListener("click", () => {
      // Toggle visibility
      friendsDropdown.style.display =
        friendsDropdown.style.display === "none" || !friendsDropdown.style.display
          ? "block"
          : "none";
    });

    // Clear existing dropdown items
    friendsDropdown.innerHTML = "";

    // Populate friends list
    for (const friendId of friends) {
      try {
        const friendDocRef = doc(db, "users", friendId);
        const friendDocSnapshot = await getDoc(friendDocRef);

        if (friendDocSnapshot.exists()) {
          const friendData = friendDocSnapshot.data();
          const friendEmail = friendData.email;

          // Create list item for the dropdown
          const listItem = document.createElement("li");
          listItem.textContent = friendEmail;
          listItem.className = "dropdown-item";

          // Add click listener to initiate a chat
          listItem.addEventListener("click", async () => {
            const chatId = await createNewChat(user, { email: friendEmail, uid: friendId });
            friendsDropdown.style.display = "none"; // Hide dropdown after selection

            if (chatId) {
              window.location.href = `/chat/chat.html?chatId=${chatId}`;
            }
          });

          friendsDropdown.appendChild(listItem);
        } else {
          console.warn("Friend document not found:", friendId);
        }
      } catch (error) {
        console.error("Error fetching friend data:", error);
      }
    }

    // Close dropdown when clicking outside
    document.addEventListener("click", (event) => {
      if (
        !newChatButton.contains(event.target) &&
        !friendsDropdown.contains(event.target)
      ) {
        friendsDropdown.style.display = "none";
      }
    });
  } catch (error) {
    console.error("Error initializing friends dropdown:", error);
  }
}

// Function to create a new chat room
async function createNewChat(currentUser, friend) {
  try {
    if (!currentUser?.uid || !friend?.uid) {
      console.error("Invalid currentUser or friend");
      return;
    }

    // Query to check if a chat already exists between these two users
    const chatsQuery = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    );
    const chatsSnapshot = await getDocs(chatsQuery);

    // Check if any of the chats include the friend
    let existingChatId = null;
    chatsSnapshot.forEach((doc) => {
      const chatData = doc.data();
      if (chatData.participants.includes(friend.uid)) {
        existingChatId = doc.id;
      }
    });

    if (existingChatId) {
      alert("Chat already exists!");
      // Redirect the user to the existing chat page
      window.location.href = `/chat/chat.html?chatId=${existingChatId}`;
      return;
    }

    // Generate a new chat ID manually
    const chatId = Math.floor(10000 + Math.random() * 90000).toString();
    const newChatRef = doc(db, "chats", chatId); // Create a reference for the new chat

    const newChatData = {
      participants: [currentUser.uid, friend.uid], // Chat participants
      createdAt: serverTimestamp(), // Chat creation timestamp
      lastMessage: "Hello, how are you?", // Initial last message
      lastMessageAt: serverTimestamp(), // Timestamp of the last message
    };

    console.log("New chat data:", newChatData); // Debugging log

    // Use setDoc to create the new chat document
    await setDoc(newChatRef, newChatData);
    console.log("New chat created with ID:", chatId);

    // Update the user's document to include the new chat
    await updateDoc(doc(db, "users", currentUser.uid), {
      chats: arrayUnion(chatId), // Append the chat ID to the user's list of chats
    });

    // Update the friend's document if they exist
    const friendDocRef = doc(db, "users", friend.uid);
    const friendDoc = await getDoc(friendDocRef);
    if (friendDoc.exists()) {
      await updateDoc(friendDocRef, {
        chats: arrayUnion(chatId), // Append the chat ID to the friend's list of chats
      });
    } else {
      console.warn("Friend document does not exist:", friend.uid);
    }

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
    console.log("No user is logged in. allegedly");
  }
});
// Get references to the modal and button
const newGroupChatButton = document.getElementById("newGroupChatButton");
const newGroupChatModal = document.getElementById("newGroupChatModal");
const closeNewGroupChatModal = document.getElementById("closeNewGroupChatModal");
const friendsListContainer = document.getElementById("friendsList");

// Fetch friends' details (names) from Firestore
async function fetchFriends() {
  const user = auth.currentUser; // Get the current logged-in user

  if (!user) {
    alert("You must be logged in to create a group chat.");
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

    const userData = userDocSnapshot.data();
    const friendsList = userData.friends || []; // Fetch the list of friend IDs from Firestore
    console.log("friends list (IDs):", friendsList);

    // Fetch each friend's details (name) based on their ID
    const friendsData = await Promise.all(friendsList.map(async (friendId) => {
      const friendDocRef = doc(db, "users", friendId);
      const friendDocSnapshot = await getDoc(friendDocRef);
      if (friendDocSnapshot.exists()) {
        return friendDocSnapshot.data(); // Return friend's data (including name)
      } else {
        return null; // In case the friend's data is not found
      }
    }));

    // Filter out any null values (for cases where a friend's data is missing)
    const validFriends = friendsData.filter(friend => friend !== null);
    console.log("friends data (names):", validFriends);

    // Pass the list of friends' names to populate the list
    populateFriendsList(validFriends);
  } catch (error) {
    console.error("Error fetching friends:", error);
  }
}

// Populate the friends list dynamically from Firestore
function populateFriendsList(friends) {
  const friendsListContainer = document.getElementById("friendsList");
  friendsListContainer.innerHTML = ""; // Clear existing list

  if (friends.length === 0) {
    friendsListContainer.innerHTML = "<li>No friends found</li>";
  } else {
    friends.forEach(friend => {
      const fullName = `${friend.firstname} ${friend.lastname}`;
      const li = document.createElement("li");
      li.textContent = fullName; // Display friend's name
      li.dataset.uid = friend.uid; // Store friend's ID in data attribute (optional)
      li.addEventListener("click", () => toggleSelection(li)); // Add event listener
      friendsListContainer.appendChild(li);
    });
  }
}

// Toggle selection of a friend in the list
function toggleSelection(listItem) {
  listItem.classList.toggle("selected");
}


// Open the "New Group Chat" modal when the button is clicked
newGroupChatButton.addEventListener("click", () => {
  newGroupChatModal.style.display = "block";
  fetchFriends(); // Fetch and populate friends when modal is opened
});

// Close the modal when the close button is clicked
closeNewGroupChatModal.addEventListener("click", () => {
  newGroupChatModal.style.display = "none";
});

// Close the modal if the user clicks outside of it
window.addEventListener("click", (event) => {
  if (event.target === newGroupChatModal) {
    newGroupChatModal.style.display = "none";
  }
});

// Handle creating the group chat
document.getElementById("createGroupChatButton").addEventListener("click", () => {
  const selectedFriends = [];
  const selectedItems = document.querySelectorAll("#friendsList .selected");
  selectedItems.forEach(item => {
    selectedFriends.push(item.dataset.uid); // Collect selected friend names
  });
  
  const groupName = document.getElementById("groupChatName").value;
  if (groupName && selectedFriends.length > 0) {
    console.log(`Creating group chat: ${groupName}`);
    console.log(`With friends: ${selectedFriends.join(", ")}`);
    
    // Call your API or Firestore logic to create the group chat here
    createGroupChat(groupName, selectedFriends); // Function to handle creating the group chat
    
    newGroupChatModal.style.display = "none"; // Close modal after action
  } else {
    alert("Please provide a group name and select at least one friend.");
  }
});

// Create group chat function
async function createGroupChat(groupName, userIds) {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    // Step 1: Get user data for each userId (you can customize what data you need)
    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('uid', 'in', userIds)));
    
    // Prepare the list of users and check if they exist
    const users = [];
    const currentUserInfo = {
      uid: currentUser.uid,
      email: currentUser.email,
      firstname: currentUser.firstname,
      lastname: currentUser.lastname,
      chats: currentUser.chats,
      friendRequest: currentUser.friendRequest,
      friends: currentUser.friends,
    };
    users.push(currentUserInfo);
    usersSnapshot.forEach(userDoc => {
      users.push(userDoc.data());
    });
    console.log(users);
    // Check if all users exist
    if (users.length !== userIds.length+1) {
      throw new Error('Some users not found');
    }

    // Step 2: Create the chat document in the 'chats' collection
    const groupChatData = {
      participants: userIds,
      name: groupName,
      createdAt: serverTimestamp(),  // Timestamp for when the group was created
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdBy: users[0].uid, // Assuming the first user is the creator
    };

    const chatRef = await addDoc(collection(db, 'chats'), groupChatData);

    // Step 3: Prepare batch update for users' chats field
    const batch = writeBatch(db);

    userIds.forEach(userId => {
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, {
        chats: arrayUnion(chatRef.id) // Add chat ID to the user's chats array
      });
    });
    const userRef = doc(db, 'users', currentUserInfo.uid);
    batch.update(userRef, {
      chats: arrayUnion(chatRef.id)
    });

    // Step 4: Commit the batch update
    await batch.commit();
    console.log('Group chat created and users updated successfully!');
  } catch (error) {
    console.error('Error creating group chat or updating users:', error);
  }
}