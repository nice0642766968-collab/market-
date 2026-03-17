const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLoginMode = true;
let currentChatId = null;

// --- 1. ระบบ Authentication ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "เข้าสู่ระบบ CRU Market" : "สมัครสมาชิกใหม่";
    document.getElementById('toggleText').innerText = isLoginMode ? "ยังไม่มีบัญชี? สมัครที่นี่" : "มีบัญชีอยู่แล้ว? ล็อกอิน";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const pass = document.getElementById('password').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (err) { alert(err.message); }
}

auth.onAuthStateChanged(user => {
    document.getElementById('authPage').style.display = user ? 'none' : 'flex';
    document.getElementById('mainApp').style.display = user ? 'block' : 'none';
    if (user) loadProducts();
});

function logout() { auth.signOut(); }

// --- 2. ระบบ Marketplace & Split Bill ---
function updateSplit() {
    const price = document.getElementById('pPrice').value || 0;
    const count = document.getElementById('pCount').value || 1;
    document.getElementById('splitDisplay').innerText = `ราคาต่อคน: ฿${(price / count).toFixed(2)}`;
}

async function savePost() {
    const post = {
        title: document.getElementById('pTitle').value,
        price: Number(document.getElementById('pPrice').value),
        count: Number(document.getElementById('pCount').value),
        cat: document.getElementById('pCat').value,
        desc: document.getElementById('pDesc').value,
        user: auth.currentUser.email,
        time: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("posts").add(post);
    hideModal('postModal');
}

function loadProducts() {
    db.collection("posts").orderBy("time", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            grid.innerHTML += `
                <div class="card">
                    <small>${p.cat}</small>
                    <h3>${p.title}</h3>
                    <p>${p.desc}</p>
                    <div class="price-tag">฿${(p.price / p.count).toFixed(2)} ${p.count > 1 ? '<small>/คน</small>' : ''}</div>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${p.title}')">คุยกับผู้ขาย</button>
                </div>
            `;
        });
    });
}

// --- 3. ระบบแชท ---
function openChat(id, title) {
    currentChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatTitle').innerText = title;
    db.collection("posts").doc(id).collection("messages").orderBy("time")
    .onSnapshot(snap => {
        const box = document.getElementById('chatMsgs');
        box.innerHTML = '';
        snap.forEach(m => {
            box.innerHTML += `<div><b>${m.data().user.split('@')[0]}:</b> ${m.data().text}</div>`;
        });
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInput').value;
    if (!text) return;
    await db.collection("posts").doc(currentChatId).collection("messages").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInput').value = '';
}

// Helper Functions
function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }
