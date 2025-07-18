document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  const response = await fetch('LINK_DO_SEU_SCRIPT_DO_GOOGLE_APPS', {
    method: 'POST',
    body: JSON.stringify({ username: user, password: pass }),
    headers: { 'Content-Type': 'application/json' }
  });

  const result = await response.json();

  if (result.status === 'success') {
    alert('Login successful!');
    window.location.href = 'admin.html';
  } else {
    alert('Incorrect username or password.');
  }
});
