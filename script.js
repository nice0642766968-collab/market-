const firebaseConfig = {
    apiKey: "AIzaSyAmbzRxqYFti6IEksy2WunKCVa_v8Gg0F0",
    authDomain: "market-digital-3d10e.firebaseapp.com",
    projectId: "market-digital-3d10e",
    storageBucket: "market-digital-3d10e.firebasestorage.app",
    messagingSenderId: "368580098929",
    appId: "1:368580098929:web:7e005211ceb83b3b9794d0",
    measurementId: "G-Q985QSMDDT"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let isLoginMode = true;
let currentChatId = null;

// --- Authentication Logic ---
function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authSubtitle').innerText = isLoginMode ? "เข้าสู่ระบบเพื่อเริ่มใช้งาน" : "สร้างบัญชีใหม่สำหรับนักศึกษา";
    document.getElementById('toggleBtn').innerText = isLoginMode ? "สมัครสมาชิก" : "เข้าสู่ระบบ";
    document.getElementById('toggleText').innerText = isLoginMode ? "ยังไม่มีบัญชี?" : "มีบัญชีอยู่แล้ว?";
}

async function handleAuth() {
    const email = document.getElementById('emailInp').value;
    const pass = document.getElementById('passInp').value;
    try {
        if (isLoginMode) await auth.signInWithEmailAndPassword(email, pass);
        else await auth.createUserWithEmailAndPassword(email, pass);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
}

auth.onAuthStateChanged(user => {
    if (user) {
        document.getElementById('authView').style.display = 'none';
        document.getElementById('appView').style.display = 'block';
        loadPosts();
    } else {
        document.getElementById('authView').style.display = 'flex';
        document.getElementById('appView').style.display = 'none';
    }
});

function logout() { auth.signOut(); }

// --- Marketplace Logic ---
function doSplit() {
    const total = document.getElementById('pTotal').value || 0;
    const people = document.getElementById('pPeople').value || 1;
    document.getElementById('splitResult').innerText = `ราคาต่อคน: ฿${(total / people).toFixed(2)}`;
}

async function savePost() {
    const postData = {
        title: document.getElementById('pTitle').value,
        category: document.getElementById('pCat').value,
        totalPrice: Number(document.getElementById('pTotal').value),
        splitCount: Number(document.getElementById('pPeople').value),
        description: document.getElementById('pDesc').value,
        owner: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection("market_posts").add(postData);
    closeModal('postModal');
}

function loadPosts() {
    db.collection("market_posts").orderBy("timestamp", "desc").onSnapshot(snap => {
        const grid = document.getElementById('productGrid');
        grid.innerHTML = '';
        snap.forEach(doc => {
            const p = doc.data();
            const pricePerPerson = (p.totalPrice / p.splitCount).toFixed(2);
            grid.innerHTML += `
                <div class="card">
                    <small>${p.category}</small>
                    <h3>${p.title}</h3>
                    <p class="price-tag">฿${pricePerPerson} ${p.splitCount > 1 ? '<span style="font-size:12px;">/คน</span>' : ''}</p>
                    <button class="btn-primary" onclick="openChat('${doc.id}', '${p.title}')">💬 แชทสอบถาม</button>
                </div>
            `;
        });
    });
}

// --- Chat Logic ---
function openChat(id, title) {
    currentChatId = id;
    document.getElementById('chatBox').style.display = 'flex';
    document.getElementById('chatTargetName').innerText = title;
    db.collection("market_posts").doc(id).collection("messages").orderBy("time")
    .onSnapshot(snap => {
        const box = document.getElementById('chatMessages');
        box.innerHTML = '';
        snap.forEach(m => {
            const data = m.data();
            box.innerHTML += `<div><b>${data.user.split('@')[0]}:</b> ${data.text}</div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
}

async function sendMsg() {
    const text = document.getElementById('msgInput').value;
    if (!text) return;
    await db.collection("market_posts").doc(currentChatId).collection("messages").add({
        text, user: auth.currentUser.email, time: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById('msgInput').value = '';
}

// --- Helpers ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function closeChat() { document.getElementById('chatBox').style.display = 'none'; }
