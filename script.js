// =========================================
// 1. SMOOTH SCROLLING
// =========================================
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const section = document.querySelector(this.getAttribute('href'));
    if(section){
      section.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// =========================================
// 2. MODAL LOGIC (Glassmorphism)
// =========================================
const modal = document.getElementById('authModal');
const loginBox = document.getElementById('login-box');
const registerBox = document.getElementById('register-box');

// Open Modal
function openModal(view) {
  if (!modal) return;
  
  modal.classList.add('show'); // Triggers CSS fade-in
  switchView(view);
  
  // Prevent background scrolling while modal is open
  document.body.style.overflow = 'hidden';
}

// Close Modal
function closeModal() {
  if (!modal) return;

  modal.classList.remove('show');
  
  // Restore background scrolling
  document.body.style.overflow = '';
}

// Switch between Login and Signup views inside the modal
function switchView(viewName) {
  // Ensure elements exist before accessing style
  if (!loginBox || !registerBox) return;

  if (viewName === 'login') {
    loginBox.style.display = 'block';
    registerBox.style.display = 'none';
  } else {
    loginBox.style.display = 'none';
    registerBox.style.display = 'block';
  }
}

// Close modal if user clicks outside content (on the dark overlay)
window.onclick = function(event) {
  if (event.target == modal) {
    closeModal();
  }
}

// =========================================
// 3. AUTHENTICATION LOGIC (Mock)
// =========================================

// Handle Login Submission
function handleLogin(event) {
  event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  
  const email = emailInput ? emailInput.value : '';
  const pass = passInput ? passInput.value : '';

  if (email && pass) {
    console.log("Logging in with:", email);
    
    // UI Feedback
    const btn = event.target.querySelector('.input-submit');
    if(btn) {
        const originalText = btn.value;
        btn.value = "Logging in...";
    }
    
    // Simulate Network Request
    setTimeout(() => {
      alert("Welcome back!");
      window.location.href = "dashboard.html"; // Redirect to Dashboard
    }, 1000);
  } else {
    alert("Please fill in all fields.");
  }
}

// Handle Signup Submission
function handleSignup(event) {
  event.preventDefault();
  const nameInput = document.getElementById('signupName');
  const emailInput = document.getElementById('signupEmail');
  const passInput = document.getElementById('signupPassword');

  const name = nameInput ? nameInput.value : '';
  const email = emailInput ? emailInput.value : '';
  const pass = passInput ? passInput.value : '';

  if (name && email && pass) {
    console.log("Signing up:", name, email);

    // UI Feedback
    const btn = event.target.querySelector('.input-submit');
    if(btn) {
        const originalText = btn.value;
        btn.value = "Creating Account...";
    }

    // Simulate Network Request
    setTimeout(() => {
      alert("Account created successfully! Redirecting...");
      window.location.href = "dashboard.html"; // Redirect to Dashboard
    }, 1500);
  } else {
    alert("Please fill in all fields.");
  }
}