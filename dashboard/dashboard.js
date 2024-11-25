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
} from "firebase/firestore"; // Import Firestore functions
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";


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
const storage = getStorage(app);


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


async function fetchUserConversations() {
  const user = auth.currentUser;
  if (!user) {
    console.log("No user is logged in.");
    return;
  }

  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);
    
    if (!userDocSnapshot.exists()) {
      console.log("User document not found");
      return;
    }

    const userData = userDocSnapshot.data();
    const conversations = userData.chats || [];
    
    if (conversations.length === 0) {
      console.log("No conversations available for this user.");
      return;
    }

    const conversationsContainer = document.getElementById("chatList");
    conversationsContainer.innerHTML = "";

    const conversationsRef = collection(db, "chats");
    const querySnapshot = await getDocs(conversationsRef);

    querySnapshot.forEach(async (chatDoc) => {
      if (conversations.includes(chatDoc.id)) {
        const chatData = chatDoc.data();
        const otherUsers = chatData.participants.filter(
          (participant) => participant !== user.uid
        );

        otherUsers.forEach(async (otherUserId) => {
          try {
            const userDocRef = doc(db, "users", otherUserId);
            const userDocSnapshot = await getDoc(userDocRef);
            
            if (!userDocSnapshot.exists()) {
              console.log(`User document not found for ID: ${otherUserId}`);
              return;
            }

            const otherUserData = userDocSnapshot.data();
            const fullName = `${otherUserData.firstname} ${otherUserData.lastname}`;

            // Create the list item with avatar and text
            const listItem = document.createElement("li");
            listItem.className = "chat-item";

            // Create avatar
            const avatar = document.createElement("img");
            avatar.src = otherUserData.profilePicture || "/dist/defaultprofile.png";
            avatar.className = "chat-avatar";

            // Create text container
            const textContainer = document.createElement("div");
            textContainer.className = "chat-text";
            textContainer.textContent = `${fullName}: ${chatData.lastMessage}`;

            // Assemble the elements
            listItem.appendChild(avatar);
            listItem.appendChild(textContainer);

            listItem.addEventListener("click", () => {
              window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
            });

            conversationsContainer.appendChild(listItem);
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
  console.log("Profile button clicked");
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

const addProfileModal = document.getElementById("addProfileModal");
const profilePictureButton = document.getElementById("profilePictureButton");
const closeProfileModal = document.getElementById("closeProfileModal");
const uploadProfilePicture = document.getElementById("uploadProfilePicture");
const profilePictureInput = document.getElementById("profilePictureInput");
const selectImageBtn = document.getElementById("selectImageBtn");
const imagePreview = document.getElementById("imagePreview");

// Show modal
profilePictureButton.addEventListener("click", () => {
    addProfileModal.style.display = "flex";
});

// Close modal
closeProfileModal.addEventListener("click", () => {
    addProfileModal.style.display = "none";
    resetUploadForm();
});

// Close on outside click
window.addEventListener("click", (event) => {
    if (event.target == addProfileModal) {
        addProfileModal.style.display = "none";
        resetUploadForm();
    }
});

// Trigger file input when select button is clicked
selectImageBtn.addEventListener("click", () => {
    profilePictureInput.click();
});

// Handle file selection
profilePictureInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
        uploadProfilePicture.disabled = false;
    }
});

// Handle file upload
uploadProfilePicture.addEventListener("click", async () => {
    const file = profilePictureInput.files[0];
    if (!file) {
        alert("Please select a file first");
        return;
    }

    try {
        // Show loading state
        uploadProfilePicture.disabled = true;
        uploadProfilePicture.textContent = "Uploading...";

        const user = auth.currentUser;
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        
        // Upload file
        await uploadBytes(storageRef, file);
        
        // Get download URL
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user's profile in Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            profilePicture: downloadURL
        });

        alert("Profile picture updated successfully!");
        addProfileModal.style.display = "none";
        resetUploadForm();
    } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error uploading file. Please try again.");
        uploadProfilePicture.disabled = false;
        uploadProfilePicture.textContent = "Upload Picture";
    }
});

// Reset form helper
function resetUploadForm() {
    imagePreview.src = "/dist/default-avatar.png";
    profilePictureInput.value = "";
    uploadProfilePicture.disabled = true;
    uploadProfilePicture.textContent = "Upload Picture";
}




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
    const newChatButton = document.getElementById("newChat");
    const friendsDropdown = document.getElementById("friendsDropdown");

    // Clear existing content
    friendsDropdown.innerHTML = '';
    
    // Add header
    const header = document.createElement("div");
    header.textContent = "Select a friend to chat with";
    header.style.padding = "12px 16px";
    header.style.fontWeight = "600";
    header.style.borderBottom = "1px solid #eeeeee";
    header.style.backgroundColor = "#f8f8f8";
    friendsDropdown.appendChild(header);

    // Toggle dropdown visibility
    newChatButton.addEventListener("click", () => {
      friendsDropdown.style.display =
        friendsDropdown.style.display === "none" ||
        friendsDropdown.style.display === ""
          ? "block"
          : "none";
    });

    // Populate friends list
    friends.forEach(async (friend) => {
      // If friend is just an email, fetch the friend's user document to get the uid
      let friendDocRef;
      if (typeof friend === "string") {
        // Assuming friend is an email
        friendDocRef = await getDoc(doc(db, "users", friend));
      } else {
        friendDocRef = await getDoc(doc(db, "users", friend.uid));
      }

      if (friendDocRef.exists()) {
        const friendData = friendDocRef.data();
        const friendWithUid = { 
          email: friendData.email, 
          uid: friendData.uid,
          firstname: friendData.firstname || '',
          lastname: friendData.lastname || '',
          profilePicture: friendData.profilePicture
        };

        const listItem = document.createElement("li");
        listItem.style.padding = "12px 16px";
        listItem.style.cursor = "pointer";
        listItem.style.borderBottom = "1px solid #eeeeee";
        listItem.style.transition = "all 0.2s ease";

        // Create content container
        const contentDiv = document.createElement("div");
        contentDiv.style.display = "flex";
        contentDiv.style.alignItems = "center";
        contentDiv.style.gap = "12px";

        // Add avatar
        const avatar = document.createElement("img");
        avatar.src = friendData.profilePicture || "/dist/defaultprofile.png";
        avatar.style.width = "40px";
        avatar.style.height = "40px";
        avatar.style.borderRadius = "50%";
        avatar.style.objectFit = "cover";
        avatar.style.border = "2px solid #ffffff";
        avatar.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

        // Add text container
        const textDiv = document.createElement("div");
        
        // Add name if available
        if (friendData.firstname || friendData.lastname) {
          const nameDiv = document.createElement("div");
          nameDiv.textContent = `${friendData.firstname || ''} ${friendData.lastname || ''}`;
          nameDiv.style.fontWeight = "600";
          nameDiv.style.color = "#333333";
          textDiv.appendChild(nameDiv);
        }

        // Add email
        const emailDiv = document.createElement("div");
        emailDiv.textContent = friendWithUid.email;
        emailDiv.style.fontSize = "0.85rem";
        emailDiv.style.color = "#666666";
        textDiv.appendChild(emailDiv);

        // Assemble the elements
        contentDiv.appendChild(avatar);
        contentDiv.appendChild(textDiv);
        listItem.appendChild(contentDiv);

        // Add hover effect
        listItem.addEventListener("mouseover", () => {
          listItem.style.backgroundColor = "#f8f8f8";
          listItem.style.transform = "translateX(5px)";
        });
        listItem.addEventListener("mouseout", () => {
          listItem.style.backgroundColor = "";
          listItem.style.transform = "translateX(0)";
        });

        // Add click handler to initiate chat
        listItem.addEventListener("click", async () => {
          const chatId = await createNewChat(user, friendWithUid);
          friendsDropdown.style.display = "none";
        });

        friendsDropdown.appendChild(listItem);
      } else {
        console.warn("Friend document not found:", friend);
      }
    });

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




