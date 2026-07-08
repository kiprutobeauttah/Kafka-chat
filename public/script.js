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
      data.data.forEach((msg) => {
        if (!msg.deletedForAll && (!msg.deletedFor || !JSON.parse(msg.deletedFor).includes(currentUser))) {
          renderMessage(msg, chat);
        }
      });
    }

    if (data.type === "message") {
      renderMessage(data.data, chat);
    }
    
    if (data.type === "delete") {
      const msgElement = document.querySelector(`[data-msg-id="${data.data.messageId}"]`);
      if (msgElement) {
        if (data.data.deleteForEveryone) {
          msgElement.remove();
        } else if (data.data.deletedBy === currentUser) {
          msgElement.remove();
        }
      }
    }
  };

  window.deleteMessage = function(messageId, deleteForEveryone) {
    ws.send(JSON.stringify({
      action: "delete",
      messageId: messageId,
      user: currentUser,
      deleteForEveryone: deleteForEveryone
    }));
  };
  
  window.sendMsg = function() {
    const message = document.getElementById("msg").value;
    
    if (!message.trim()) return;

    ws.send(JSON.stringify({
      user: currentUser,
      message: message,
      type: "text"
    }));

    document.getElementById("msg").value = "";
  };
  
  window.sendFile = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileData = {
        user: currentUser,
        type: "file",
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: e.target.result
      };
      ws.send(JSON.stringify(fileData));
    };
    reader.readAsDataURL(file);
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
  div.setAttribute("data-msg-id", msg.id);
  
  if (msg.type === "file") {
    const fileIcon = document.createElement("span");
    fileIcon.textContent = "📎 ";
    
    const fileLink = document.createElement("a");
    fileLink.href = msg.fileData;
    fileLink.download = msg.fileName;
    fileLink.textContent = msg.fileName;
    fileLink.style.color = "inherit";
    fileLink.style.textDecoration = "underline";
    
    const fileSize = document.createElement("span");
    fileSize.textContent = ` (${formatFileSize(msg.fileSize)})`;
    fileSize.style.fontSize = "0.8em";
    fileSize.style.opacity = "0.7";
    
    div.appendChild(fileIcon);
    div.appendChild(fileLink);
    div.appendChild(fileSize);
    div.appendChild(document.createElement("br"));
    
    if (msg.fileType && msg.fileType.startsWith("image/")) {
      const preview = document.createElement("img");
      preview.src = msg.fileData;
      preview.style.maxWidth = "300px";
      preview.style.maxHeight = "300px";
      preview.style.marginTop = "10px";
      preview.style.borderRadius = "8px";
      preview.style.display = "block";
      preview.style.cursor = "pointer";
      preview.onclick = () => window.open(msg.fileData, "_blank");
      div.appendChild(preview);
    } else if (msg.fileType && msg.fileType.startsWith("video/")) {
      const video = document.createElement("video");
      video.src = msg.fileData;
      video.controls = true;
      video.style.maxWidth = "300px";
      video.style.marginTop = "10px";
      video.style.borderRadius = "8px";
      video.style.display = "block";
      div.appendChild(video);
    } else if (msg.fileType && msg.fileType.startsWith("audio/")) {
      const audio = document.createElement("audio");
      audio.src = msg.fileData;
      audio.controls = true;
      audio.style.marginTop = "10px";
      audio.style.width = "300px";
      audio.style.display = "block";
      div.appendChild(audio);
    } else if (msg.fileType === "application/pdf") {
      const pdfEmbed = document.createElement("embed");
      pdfEmbed.src = msg.fileData;
      pdfEmbed.type = "application/pdf";
      pdfEmbed.style.width = "300px";
      pdfEmbed.style.height = "400px";
      pdfEmbed.style.marginTop = "10px";
      pdfEmbed.style.borderRadius = "8px";
      pdfEmbed.style.display = "block";
      div.appendChild(pdfEmbed);
    }
  } else {
    const msgText = document.createElement("span");
    msgText.textContent = msg.message;
    div.appendChild(msgText);
  }
  
  if (msg.user === currentUser) {
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "⋮";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = function(e) {
      e.stopPropagation();
      showDeleteMenu(msg.id, deleteBtn);
    };
    div.appendChild(deleteBtn);
  }
  
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function showDeleteMenu(messageId, button) {
  const existingMenu = document.querySelector(".delete-menu");
  if (existingMenu) existingMenu.remove();
  
  const menu = document.createElement("div");
  menu.className = "delete-menu";
  
  const deleteForMe = document.createElement("div");
  deleteForMe.textContent = "Delete for me";
  deleteForMe.onclick = () => {
    deleteMessage(messageId, false);
    menu.remove();
  };
  
  const deleteForEveryone = document.createElement("div");
  deleteForEveryone.textContent = "Delete for everyone";
  deleteForEveryone.onclick = () => {
    deleteMessage(messageId, true);
    menu.remove();
  };
  
  menu.appendChild(deleteForMe);
  menu.appendChild(deleteForEveryone);
  
  const rect = button.getBoundingClientRect();
  menu.style.position = "fixed";
  menu.style.top = rect.bottom + "px";
  menu.style.left = rect.left - 150 + "px";
  
  document.body.appendChild(menu);
  
  setTimeout(() => {
    document.addEventListener("click", function closeMenu() {
      menu.remove();
      document.removeEventListener("click", closeMenu);
    });
  }, 100);
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
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
  
  const attachBtn = document.querySelector(".attach-btn");
  if (attachBtn) {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.style.display = "none";
    fileInput.addEventListener("change", function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 10 * 1024 * 1024) {
          alert("File size must be less than 10MB");
          return;
        }
        sendFile(file);
      }
      fileInput.value = "";
    });
    
    attachBtn.addEventListener("click", function() {
      fileInput.click();
    });
    
    document.body.appendChild(fileInput);
  }
});
