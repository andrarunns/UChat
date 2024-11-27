// Import the necessary Firebase functions
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,
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
  setDoc,
  arrayUnion,
  serverTimestamp,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onSnapshot } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBgkWWt1NZL_QWAhsUyxAuF91i5V0P2JHc",
  authDomain: "uchat-d9392.firebaseapp.com",
  databaseURL: "https://uchat-d9392-default-rtdb.firebaseio.com",
  projectId: "uchat-d9392",
  storageBucket: "uchat-d9392.firebasestorage.app",
  messagingSenderId: "397312451749",
  appId: "1:397312451749:web:6128f84f311b045f9d194c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Automatically fetch user conversations when the page loads
document.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log("User is logged in:", user);
      try {
        await fetchUserConversations();
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
  const user = auth.currentUser;

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
    conversationsContainer.innerHTML = "";

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
          listItem.textContent = `${groupName}: ${chatData.lastMessage}`;
          listItem.className = "chat-item";

          // Add a click listener to open the chat or navigate
          listItem.addEventListener("click", () => {
            window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
          });

          conversationsContainer.appendChild(listItem);
        } else {
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

              const listItem = document.createElement("li");
              listItem.className = "chat-item";

              // Create avatar image element
              const avatar = document.createElement("img");

              // Check if the user has a profilePicUrl
              if (otherUserData.profilePicUrl) {
                avatar.src = otherUserData.profilePicUrl;
              } else {
                avatar.src = "/dist/defaultprofile.png";
              }

              avatar.className = "chat-avatar";

              // Create text container for the full name and last message
              const textContainer = document.createElement("div");
              textContainer.className = "chat-text";
              textContainer.textContent = `${fullName}: ${chatData.lastMessage}`;

              // Create status indicator
              const statusDot = document.createElement("div");
              statusDot.className = "status-indicator";
              if (otherUserData.lastSeen) {
                const lastSeenTime = otherUserData.lastSeen.toDate();
                const timeDiff = Date.now() - lastSeenTime;
                // Consider user online if last seen within last 2 minutes
                if (timeDiff < 120000) {
                  statusDot.classList.add("online");
                }
              }

              // Assemble the elements
              listItem.appendChild(avatar);
              listItem.appendChild(textContainer);
              listItem.appendChild(statusDot);

              // Add a click listener to open the chat or navigate
              listItem.addEventListener("click", () => {
                window.location.href = `/chat/chat.html?chatId=${chatDoc.id}`;
              });

              // Append the list item to the conversations container
              conversationsContainer.appendChild(listItem);
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

addFriendButton.addEventListener("click", () => {
  addFriendModal.style.display = "flex";
});

closeModal.addEventListener("click", () => {
  addFriendModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target == addFriendModal) {
    addFriendModal.style.display = "none";
  }
});
// Function to search for the user's email in Firestore and send a friend request
async function searchForUserEmail() {
  const emailInput = document.getElementById("friendEmail").value.trim();
  const currentUser = auth.currentUser;

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
  const user = auth.currentUser;

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
async function initializeFriendsDropdown(user) {
  try {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnapshot = await getDoc(userDocRef);

    if (!userDocSnapshot.exists()) {
      console.log("User document not found");
      return;
    }

    const userData = userDocSnapshot.data();
    const friends = userData.friends || [];

    const newChatButton = document.getElementById("newChat");
    const friendsDropdown = document.getElementById("friendsDropdown");

    newChatButton.addEventListener("click", () => {
      friendsDropdown.style.display =
        friendsDropdown.style.display === "none" ||
          !friendsDropdown.style.display
          ? "block"
          : "none";
    });

    friendsDropdown.innerHTML = "";

    for (const friendId of friends) {
      try {
        const friendDocRef = doc(db, "users", friendId);
        const friendDocSnapshot = await getDoc(friendDocRef);

        if (friendDocSnapshot.exists()) {
          const friendData = friendDocSnapshot.data();

          const listItem = document.createElement("li");
          listItem.className = "dropdown-item";

          // Create profile picture
          const avatar = document.createElement("img");
          avatar.src = friendData.profilePicUrl || "/dist/defaultprofile.png";
          avatar.className = "friend-avatar";

          // Create text container
          const textContainer = document.createElement("div");
          textContainer.className = "friend-info";

          // Add name
          const nameDiv = document.createElement("div");
          nameDiv.className = "friend-name";
          nameDiv.textContent = `${friendData.firstname} ${friendData.lastname}`;

          // Assemble elements
          textContainer.appendChild(nameDiv);
          listItem.appendChild(avatar);
          listItem.appendChild(textContainer);

          listItem.addEventListener("click", async () => {
            const chatId = await createNewChat(user, {
              email: friendData.email,
              uid: friendId,
              firstname: friendData.firstname,
              lastname: friendData.lastname,
            });
            friendsDropdown.style.display = "none";

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
    const newChatRef = doc(db, "chats", chatId);

    const newChatData = {
      participants: [currentUser.uid, friend.uid],
      createdAt: serverTimestamp(),
      lastMessage: "Hello, how are you?",
      lastMessageAt: serverTimestamp(),
    };

    console.log("New chat data:", newChatData);

    // Use setDoc to create the new chat document
    await setDoc(newChatRef, newChatData);
    console.log("New chat created with ID:", chatId);

    await updateDoc(doc(db, "users", currentUser.uid), {
      chats: arrayUnion(chatId),
    });

    const friendDocRef = doc(db, "users", friend.uid);
    const friendDoc = await getDoc(friendDocRef);
    if (friendDoc.exists()) {
      await updateDoc(friendDocRef, {
        chats: arrayUnion(chatId),
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
const closeNewGroupChatModal = document.getElementById(
  "closeNewGroupChatModal"
);
const friendsListContainer = document.getElementById("friendsList");

// Fetch friends' details (names) from Firestore
async function fetchFriends() {
  const user = auth.currentUser;

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
    const friendsList = userData.friends || [];
    console.log("friends list (IDs):", friendsList);

    // Fetch each friend's details (name) based on their ID
    const friendsData = await Promise.all(
      friendsList.map(async (friendId) => {
        const friendDocRef = doc(db, "users", friendId);
        const friendDocSnapshot = await getDoc(friendDocRef);
        if (friendDocSnapshot.exists()) {
          return friendDocSnapshot.data();
        } else {
          return null;
        }
      })
    );

    const validFriends = friendsData.filter((friend) => friend !== null);
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
  friendsListContainer.innerHTML = "";

  if (friends.length === 0) {
    friendsListContainer.innerHTML = "<li>No friends found</li>";
  } else {
    friends.forEach((friend) => {
      const fullName = `${friend.firstname} ${friend.lastname}`;
      const li = document.createElement("li");
      li.textContent = fullName;
      li.dataset.uid = friend.uid;
      li.addEventListener("click", () => toggleSelection(li));
      friendsListContainer.appendChild(li);
    });
  }
}

// Toggle selection of a friend in the list
function toggleSelection(listItem) {
  listItem.classList.toggle("selected");
}

newGroupChatButton.addEventListener("click", () => {
  newGroupChatModal.style.display = "block";
  fetchFriends();
});

closeNewGroupChatModal.addEventListener("click", () => {
  newGroupChatModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === newGroupChatModal) {
    newGroupChatModal.style.display = "none";
  }
});

// Handle creating the group chat
document
  .getElementById("createGroupChatButton")
  .addEventListener("click", () => {
    const selectedFriends = [];
    const selectedItems = document.querySelectorAll("#friendsList .selected");
    selectedItems.forEach((item) => {
      selectedFriends.push(item.dataset.uid);
    });

    const groupName = document.getElementById("groupChatName").value;
    if (groupName && selectedFriends.length > 0) {
      console.log(`Creating group chat: ${groupName}`);
      console.log(`With friends: ${selectedFriends.join(", ")}`);

      // Call your API or Firestore logic to create the group chat here
      createGroupChat(groupName, selectedFriends);

      newGroupChatModal.style.display = "none";
    } else {
      alert("Please provide a group name and select at least one friend.");
    }
  });

// Create group chat function
async function createGroupChat(groupName, userIds) {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    const usersSnapshot = await getDocs(
      query(collection(db, "users"), where("uid", "in", userIds))
    );

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
    usersSnapshot.forEach((userDoc) => {
      users.push(userDoc.data());
    });
    console.log(users);
    // Check if all users exist
    if (users.length !== userIds.length + 1) {
      throw new Error("Some users not found");
    }

    const groupChatData = {
      participants: userIds,
      name: groupName,
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdBy: users[0].uid,
    };

    const chatRef = await addDoc(collection(db, "chats"), groupChatData);

    const batch = writeBatch(db);

    userIds.forEach((userId) => {
      const userRef = doc(db, "users", userId);
      batch.update(userRef, {
        chats: arrayUnion(chatRef.id),
      });
    });
    const userRef = doc(db, "users", currentUserInfo.uid);
    batch.update(userRef, {
      chats: arrayUnion(chatRef.id),
    });

    await batch.commit();
    console.log("Group chat created and users updated successfully!");
  } catch (error) {
    console.error("Error creating group chat or updating users:", error);
  }
}

const addProfileModal = document.getElementById("addProfileModal");
const profilePictureButton = document.getElementById("profilePictureButton");
const closeProfileModal = document.getElementById("closeProfileModal");
const uploadProfilePicture = document.getElementById("uploadProfilePicture");
const profilePictureInput = document.getElementById("profilePictureInput");
const selectImageBtn = document.getElementById("selectImageBtn");
const imagePreview = document.getElementById("imagePreview");

profilePictureButton.addEventListener("click", () => {
  addProfileModal.style.display = "flex";
});

closeProfileModal.addEventListener("click", () => {
  addProfileModal.style.display = "none";
  resetUploadForm();
});

window.addEventListener("click", (event) => {
  if (event.target == addProfileModal) {
    addProfileModal.style.display = "none";
    resetUploadForm();
  }
});

selectImageBtn.addEventListener("click", () => {
  profilePictureInput.click();
});

profilePictureInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
    uploadProfilePicture.disabled = false;
  }
});

// Handle file upload to Firebase Storage and update Firestore
uploadProfilePicture.addEventListener("click", async () => {
  const file = profilePictureInput.files[0];
  if (!file) {
    alert("Please select a file first.");
    return;
  }

  try {
    // Show loading state
    uploadProfilePicture.disabled = true;
    uploadProfilePicture.textContent = "Uploading...";

    const user = auth.currentUser;
    if (!user) {
      alert("No user is logged in.");
      return;
    }
    // Create a storage reference for the profile picture
    const storageRef = ref(storage, `pfp_files/${user.uid}`);
    // Upload the file to Firebase Storage
    const fileSnapshot = await uploadBytes(storageRef, file);
    const fileURL = await getDownloadURL(fileSnapshot.ref);
    L;
    await updateDoc(doc(db, "users", user.uid), {
      profilePicUrl: fileURL,
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

// Reset form helper to clear input fields and preview
function resetUploadForm() {
  imagePreview.src = "/dist/default-avatar.png";
  profilePictureInput.value = "";
  uploadProfilePicture.disabled = true;
  uploadProfilePicture.textContent = "Upload Picture";
}

// Update your password reset event listener
document.getElementById("resetPasswordButton").addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) {
    alert("You must be logged in to reset your password.");
    return;
  }

  try {
    // Pass both the auth instance and the email
    await sendPasswordResetEmail(auth, user.email);
    alert("Password reset email sent! Please check your inbox.");

    // Optionally close any open modals/dropdowns
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.style.display = "none";
    }
  } catch (error) {
    console.error("Error resetting password:", error);
    // Provide more specific error messages based on the error code
    switch (error.code) {
      case 'auth/invalid-email':
        alert("Invalid email address.");
        break;
      case 'auth/user-not-found':
        alert("No user found with this email address.");
        break;
      case 'auth/too-many-requests':
        alert("Too many requests. Please try again later.");
        break;
      default:
        alert("Error resetting password. Please try again.");
    }
  }
});
// update user's status
async function updateOnlineStatus() {
  const user = auth.currentUser;
  if (user) {
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, {
      lastSeen: serverTimestamp(),
    });
  }
}

setInterval(updateOnlineStatus, 60000);
document.addEventListener("DOMContentLoaded", updateOnlineStatus);
window.addEventListener("beforeunload", updateOnlineStatus);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener(
  "input",
  debounce(async (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const searchResults = document.getElementById("searchResults");

    if (!searchTerm) {
      searchResults.style.display = "none";
      return;
    }

    const user = auth.currentUser;
    if (!user) return;

    try {
      // Get user's chats
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnapshot = await getDoc(userDocRef);
      const conversations = userDocSnapshot.data().chats || [];

      const results = [];

      // Fetch and filter conversations
      for (const chatId of conversations) {
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (chatDoc.exists()) {
          const chatData = chatDoc.data();

          // Get all messages from this chat
          const messagesRef = collection(db, "chats", chatId, "messages");
          const messagesSnapshot = await getDocs(messagesRef);

          let matchFound = false;
          let matchingMessage = "";

          // Search through all messages
          messagesSnapshot.forEach((messageDoc) => {
            const messageData = messageDoc.data();
            if (
              messageData.text &&
              messageData.text.toLowerCase().includes(searchTerm)
            ) {
              matchFound = true;
              matchingMessage = messageData.text;
            }
          });

          if (matchFound) {
            if (chatData.name) {
              results.push({
                id: chatId,
                name: chatData.name,
                message: matchingMessage,
              });
            } else {
              // Individual chat
              const otherUserId = chatData.participants.find(
                (id) => id !== user.uid
              );
              const otherUserDoc = await getDoc(doc(db, "users", otherUserId));

              if (otherUserDoc.exists()) {
                const otherUserData = otherUserDoc.data();
                results.push({
                  id: chatId,
                  name: `${otherUserData.firstname} ${otherUserData.lastname}`,
                  message: matchingMessage,
                  profilePic:
                    otherUserData.profilePicUrl || "/dist/defaultprofile.png",
                });
              }
            }
          }
        }
      }

      // Display results
      displaySearchResults(results, searchTerm);
    } catch (error) {
      console.error("Error searching:", error);
    }
  }, 300)
);

// Function to display results
function displaySearchResults(results, searchTerm) {
  const searchResults = document.getElementById("searchResults");
  searchResults.innerHTML = "";

  if (results.length === 0) {
    searchResults.style.display = "none";
    return;
  }

  results.forEach((result) => {
    const resultItem = document.createElement("div");
    resultItem.className = "search-result-item";

    // Highlight matching text
    const highlightedMessage = result.message.replace(
      new RegExp(searchTerm, "gi"),
      (match) => `<span class="highlight">${match}</span>`
    );

    resultItem.innerHTML = `
            <img src="${result.profilePic || "/dist/defaultprofile.png"
      }" class="result-avatar" />
            <div class="result-content">
                <div class="result-name">${result.name}</div>
                <div class="result-message">${highlightedMessage}</div>
            </div>
        `;

    resultItem.addEventListener("click", () => {
      window.location.href = `/chat/chat.html?chatId=${result.id}`;
    });

    searchResults.appendChild(resultItem);
  });

  searchResults.style.display = "block";
}

// Close search results when clicking outside
document.addEventListener("click", (e) => {
  const searchResults = document.getElementById("searchResults");
  const searchContainer = document.querySelector(".searchContainer");

  if (!searchContainer.contains(e.target)) {
    searchResults.style.display = "none";
  }
});

