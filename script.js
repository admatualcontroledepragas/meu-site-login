/* =======================================================
   ARQUIVO: script.js (Portal Principal)
   (Lógica de Login, Abas e Tema Personalizado)
   ======================================================= */

// A SUA URL DA API DE LOGIN
const URL_API_LOGIN = "https://script.google.com/macros/s/AKfycbwxCNM7-XWJm2btht000tgZ343KsmCfwFG4gXmCCp8e-48nPDdS3Qw9gfvkJGWGu6ym/exec";

// ==========================================
// INICIALIZAÇÃO
// ==========================================
window.onload = function() {
    carregarTema(); // Verifica logo se há uma cor de fundo favorita guardada
    
    if (sessionStorage.getItem("sessaoAtiva") === "true") {
        liberarPortal(sessionStorage.getItem("nomeUsuario"));
    }
};

// ==========================================
// LÓGICA DE LOGIN E SEGURANÇA
// ==========================================
function toggleSenha() {
    const inputSenha = document.getElementById('loginPass');
    const iconeOlho = document.getElementById('icone-olho');
    
    if (inputSenha.type === 'password') {
        inputSenha.type = 'text';
        iconeOlho.innerText = 'visibility_off'; 
    } else {
        inputSenha.type = 'password';
        iconeOlho.innerText = 'visibility'; 
    }
}

async function fazerLogin(e) {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const err = document.getElementById('login-error');
    
    btn.innerHTML = "Verificando..."; 
    btn.disabled = true;
    err.style.display = "none";

    const payload = {
        acao: "login",
        usuario: document.getElementById('loginUser').value.trim().toLowerCase(),
        senha: document.getElementById('loginPass').value.trim()
    };

    try {
        const req = await fetch(URL_API_LOGIN, { method: 'POST', body: JSON.stringify(payload) });
        const res = await req.json();

        if (res.sucesso) {
            sessionStorage.setItem("sessaoAtiva", "true");
            sessionStorage.setItem("nomeUsuario", res.nome);
            liberarPortal(res.nome);
        } else {
            err.innerText = "⚠️ " + res.mensagem;
            err.style.display = "block";
        }
    } catch (erro) {
        err.innerText = "⚠️ Erro de conexão com o servidor de acessos.";
        err.style.display = "block";
    }
    
    btn.innerHTML = "Entrar"; 
    btn.disabled = false;
}

function liberarPortal(nome) {
    document.getElementById('login-wrapper').style.display = 'none';
    document.getElementById('portal-wrapper').style.display = 'flex';
    document.getElementById('nomeUsuarioDisplay').innerText = nome;
    
    // Força a aba inicial a ser o Dashboard
    mudarAba('dashboard');
}

// O gatilho de saída agora está ligado ao ícone de três traços no topo direito
function sair() {
    sessionStorage.clear();
    
    document.getElementById('portal-wrapper').style.display = 'none';
    document.getElementById('login-wrapper').style.display = 'flex';
    
    // Limpa os campos
    document.getElementById('loginPass').value = "";
    document.getElementById('loginPass').type = "password";
    document.getElementById('icone-olho').innerText = 'visibility';
}

// ==========================================
// LÓGICA DE NAVEGAÇÃO DE ABAS
// ==========================================
function mudarAba(abaId) {
    // 1. Esconde todas as vistas
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.remove('active');
        el.style.display = 'none';
    });
    
    // 2. Remove o estado ativo de todos os botões do menu lateral
    document.querySelectorAll('.menu-item').forEach(el => {
        el.classList.remove('active');
    });

    // 3. Mostra a aba correta e atualiza o título no topo
    if (abaId === 'dashboard') {
        const view = document.getElementById('view-dashboard');
        view.style.display = 'block';
        setTimeout(() => view.classList.add('active'), 10);
        
        document.getElementById('topbar-title').innerText = "Dashboard";
        document.querySelector('.menu-item:nth-child(1)').classList.add('active');
        
    } else if (abaId === 'configuracoes') {
        const view = document.getElementById('view-configuracoes');
        view.style.display = 'block';
        setTimeout(() => view.classList.add('active'), 10);
        
        document.getElementById('topbar-title').innerText = "Configurações";
        document.querySelector('.menu-item:last-child').classList.add('active');
    }
}

// ==========================================
// SISTEMA DE TEMAS E PERSONALIZAÇÃO
// ==========================================
function alterarTema(tema) {
    // Aplica a cor no HTML (O CSS styledesktop.css faz o resto dinamicamente)
    document.body.setAttribute('data-tema', tema);
    
    // Guarda a escolha para a próxima vez
    localStorage.setItem('temaPortalAtual', tema);
}

function carregarTema() {
    const temaSalvo = localStorage.getItem('temaPortalAtual');
    if (temaSalvo) {
        document.body.setAttribute('data-tema', temaSalvo);
    } else {
        document.body.setAttribute('data-tema', 'azul'); // Cor padrão original
    }
}

// ==========================================
// SERVICE WORKER (Mantido para PWA)
// ==========================================
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
