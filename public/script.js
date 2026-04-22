let currentUser = null;
let token = null;
let selectedUser = null;

async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      token = data.token;
      currentUser = username;
      document.getElementById("login").style.display = "none";
      document.getElementById("container").style.display = "flex";
      
      await loadUsers();
      connectWebSocket();
    } else {
      alert(data.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Error: " + error.message);
  }
}

async function register() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  if (!username || !password) {
    alert("Please enter username and password");
    return;
  }

  try {
    const response = await fetch("/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();
    if (response.ok) {
      alert("Registered successfully. Please login.");
      document.getElementById("username").value = "";
      document.getElementById("password").value = "";
    } else {
      alert(data.error || "Registration failed");
    }
  } catch (error) {
    console.error("Register error:", error);
    alert("Error: " + error.message);
  }
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    currentUser = null;
    token = null;
    selectedUser = null;
    document.getElementById("container").style.display = "none";
    document.getElementById("login").style.display = "flex";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
  }
}

function connectWebSocket() {
  const ws = new WebSocket(`ws://${window.location.host}`);
  const chat = document.getElementById("chat");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "history") {
      chat.innerHTML = "";
      data.data.forEach((msg) => renderMessage(msg, chat));
    }

    if (data.type === "message") {
      renderMessage(data.data, chat);
    }
  };

  window.sendMsg = function() {
    const message = document.getElementById("msg").value;
    
    if (!message.trim()) return;

    ws.send(JSON.stringify({
      user: currentUser,
      message: message
    }));

    document.getElementById("msg").value = "";
  };
  
  // Allow Enter key to send message
  document.getElementById("msg").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMsg();
    }
  });
}

function renderMessage(msg, chat) {
  const div = document.createElement("div");
  div.className = `message ${msg.user === currentUser ? "sent" : "received"}`;
  div.textContent = msg.message;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function loadUsers() {
  try {
    const response = await fetch("/users");
    const users = await response.json();
    
    const contactsDiv = document.getElementById("contacts");
    contactsDiv.innerHTML = "";
    
    users.forEach(user => {
      // Don't show current user in contacts
      if (user.username === currentUser) return;
      
      const contactDiv = document.createElement("div");
      contactDiv.className = "contact";
      
      const icon = document.createElement("div");
      icon.className = "contact-icon";
      icon.textContent = user.username.charAt(0).toUpperCase();
      
      const infoDiv = document.createElement("div");
      infoDiv.className = "contact-info";
      
      const nameDiv = document.createElement("div");
      nameDiv.className = "contact-name";
      nameDiv.textContent = user.username;
      
      const messageDiv = document.createElement("div");
      messageDiv.className = "contact-message";
      messageDiv.textContent = "Click to start chatting";
      
      infoDiv.appendChild(nameDiv);
      infoDiv.appendChild(messageDiv);
      
      const timeDiv = document.createElement("div");
      timeDiv.className = "contact-time";
      timeDiv.textContent = "now";
      
      contactDiv.appendChild(icon);
      contactDiv.appendChild(infoDiv);
      contactDiv.appendChild(timeDiv);
      
      // Add click handler for selecting user
      contactDiv.addEventListener("click", () => {
        selectedUser = user.username;
        
        // Update active state
        document.querySelectorAll(".contact").forEach(c => c.classList.remove("active"));
        contactDiv.classList.add("active");
        
        // Update chat header
        const chatAvatar = document.getElementById("chat-avatar");
        const chatTitle = document.getElementById("chat-title");
        chatAvatar.textContent = user.username.charAt(0).toUpperCase();
        chatAvatar.style.display = "flex";
        chatTitle.textContent = user.username;
        
        // Clear chat and show info message
        const chatDiv = document.getElementById("chat");
        chatDiv.innerHTML = '<div class="info-message"><p>Chat history will appear here</p></div>';
        
        // Close sidebar on mobile
        closeSidebarOnMobile();
      });
      
      contactsDiv.appendChild(contactDiv);
    });
  } catch (error) {
    console.error("Error loading users:", error);
  }
}

// Group Info Panel Functions
function openGroupInfo() {
  const groupInfo = document.getElementById("group-info");
  groupInfo.style.display = "flex";
  
  // Add mobile class for responsive behavior
  if (window.innerWidth <= 768) {
    groupInfo.classList.add("mobile-open");
  }
  
  // Load group members
  loadGroupMembers();
}

function closeGroupInfo() {
  const groupInfo = document.getElementById("group-info");
  groupInfo.style.display = "none";
  groupInfo.classList.remove("mobile-open");
}

// Toggle sidebar on mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("mobile-open");
}

// Close sidebar when clicking on a contact (mobile)
function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) {
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("mobile-open");
  }
}

async function loadGroupMembers() {
  if (!selectedUser) return;
  
  const groupMembersDiv = document.getElementById("group-members");
  groupMembersDiv.innerHTML = "";
  
  // Add current user
  const currentMemberDiv = createMemberElement(currentUser, "Online");
  groupMembersDiv.appendChild(currentMemberDiv);
  
  // Add selected user
  const selectedMemberDiv = createMemberElement(selectedUser, "Online");
  groupMembersDiv.appendChild(selectedMemberDiv);
}

function createMemberElement(username, status) {
  const memberDiv = document.createElement("div");
  memberDiv.className = "group-member";
  
  const icon = document.createElement("div");
  icon.className = "group-member-icon";
  icon.textContent = username.charAt(0).toUpperCase();
  
  const infoDiv = document.createElement("div");
  infoDiv.className = "group-member-info";
  
  const nameDiv = document.createElement("div");
  nameDiv.className = "group-member-name";
  nameDiv.textContent = username;
  
  const statusDiv = document.createElement("div");
  statusDiv.className = "group-member-status";
  statusDiv.textContent = status;
  
  infoDiv.appendChild(nameDiv);
  infoDiv.appendChild(statusDiv);
  
  memberDiv.appendChild(icon);
  memberDiv.appendChild(infoDiv);
  
  return memberDiv;
}

// Search functionality
document.addEventListener("DOMContentLoaded", function() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", function(e) {
      const searchTerm = e.target.value.toLowerCase();
      const contacts = document.querySelectorAll(".contact");
      
      contacts.forEach(contact => {
        const name = contact.querySelector(".contact-name").textContent.toLowerCase();
        if (name.includes(searchTerm)) {
          contact.style.display = "flex";
        } else {
          contact.style.display = "none";
        }
      });
    });
  }
});
