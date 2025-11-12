// Debug script untuk cek session issue
// Jalankan ini di browser console saat sudah login

console.log('=== SESSION DEBUG ===');

// 1. Cek cookies
console.log('\n1. NextAuth Cookies:');
const cookies = document.cookie.split(';').filter(c => c.includes('next-auth'));
cookies.forEach(c => console.log('   -', c.trim()));

// 2. Fetch session dari API
console.log('\n2. Fetching session from API...');
fetch('/api/auth/session')
  .then(r => r.json())
  .then(session => {
    console.log('   Session data:', session);
    if (session?.user) {
      console.log('   ✅ User found:', {
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        id: session.user.id || '❌ NO ID'
      });
    } else {
      console.log('   ❌ No user in session');
    }
  })
  .catch(err => {
    console.error('   ❌ Error fetching session:', err);
  });

// 3. Test profile API
console.log('\n3. Testing profile API...');
fetch('/api/users/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Test',
    email: 'test@test.com'
  })
})
  .then(r => r.json())
  .then(data => {
    console.log('   Profile API response:', data);
  })
  .catch(err => {
    console.error('   ❌ Error:', err);
  });

console.log('\n=== END DEBUG ===');
