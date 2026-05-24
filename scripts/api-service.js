// =============================================
// API SERVICE — Wrapper para Spring Boot (localhost:8080)
// Substitui o supabase-service.js mantendo a mesma API (window.SupabaseService)
// =============================================

const API_BASE = 'https://ttc-backend-deploy-production.up.railway.app';

async function apiFetch(url, options = {}) {
    const opts = {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        ...options
    };
    if (opts.body && typeof opts.body === 'object') {
        opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch(API_BASE + url, opts);
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || res.statusText);
    }
    if (res.status === 204) return null;
    return res.json();
}

// ============================================
// USUÁRIOS
// ============================================

function normalizeUser(u) {
    if (!u) return u;
    return {
        ...u,
        is_admin: u.isAdmin === true,
        bloqueio_publicacao: u.bloqueioPublicacao === true,
        bloqueio_chat: u.bloqueioChat === true
    };
}

async function getUsers() {
    const lista = await apiFetch('/usuarios');
    return (lista || []).map(normalizeUser);
}

async function findUserByEmail(email) {
    try {
        const u = await apiFetch('/usuarios/email/' + encodeURIComponent(email.toLowerCase()));
        return normalizeUser(u);
    } catch (e) {
        return null;
    }
}

async function findUserByCPF(cpf) {
    const clean = cpf.replace(/\D/g, '');
    const todos = await getUsers();
    return todos.find(u => u.cpf === clean) || null;
}

async function findUserById(userId) {
    try {
        const u = await apiFetch('/usuarios/' + userId);
        return normalizeUser(u);
    } catch (e) {
        if (e.message.includes('nao encontrado') || e.message.includes('não encontrado')) return null;
        throw e;
    }
}

async function saveUser(user) {
    const payload = {
        nome: user.nome,
        cpf: user.cpf.replace(/\D/g, ''),
        nascimento: user.nascimento,
        email: user.email.toLowerCase(),
        senha: user.senha,
        whatsapp: user.whatsapp || null,
        foto: user.foto || null
    };
    return apiFetch('/usuarios/registrar', { method: 'POST', body: payload });
}

async function updateUser(userId, updates) {
    return apiFetch('/usuarios/' + userId, { method: 'PUT', body: updates });
}

// ============================================
// SESSÃO (local — sessionStorage)
// ============================================

function setSession(user) {
    sessionStorage.setItem('eletrolight_session', JSON.stringify({
        id: user.id || null,
        nome: user.nome,
        email: user.email,
        is_admin: user.is_admin || user.isAdmin || false
    }));
}

function getSession() {
    const stored = sessionStorage.getItem('eletrolight_session');
    return stored ? JSON.parse(stored) : null;
}

function clearSession() {
    sessionStorage.removeItem('eletrolight_session');
}

// ============================================
// AUTENTICAÇÃO
// ============================================

async function autenticar(emailOuCpf, senha) {
    const u = await apiFetch('/usuarios/login', {
        method: 'POST',
        body: { emailOuCpf, senha }
    });
    return normalizeUser(u);
}

// ============================================
// ANÚNCIOS
// ============================================

async function getAnuncios() {
    return apiFetch('/anuncios/aprovados');
}

async function getAnunciosByEmail(email) {
    const user = await findUserByEmail(email);
    if (!user || !user.id) return [];
    return apiFetch('/anuncios/usuario/' + user.id);
}

async function adicionarAnuncio(anuncio) {
    const session = getSession();
    const payload = {
        titulo: anuncio.titulo,
        descricao: anuncio.descricao,
        tipo: anuncio.tipo,
        condicao: anuncio.condicao,
        marca: anuncio.marca || null,
        foto: anuncio.foto || null,
        bairro: anuncio.bairro,
        nome: anuncio.nome,
        email: anuncio.email.toLowerCase(),
        whatsapp: anuncio.whatsapp,
        status: 'pendente',
        usuarioId: session ? session.id : null,
        categoriaSlug: anuncio.categoria || null
    };
    return apiFetch('/anuncios', { method: 'POST', body: payload });
}

async function atualizarAnuncio(id, updates) {
    return apiFetch('/anuncios/' + id, { method: 'PUT', body: updates });
}

async function deletarAnuncio(id) {
    return apiFetch('/anuncios/' + id, { method: 'DELETE' });
}

// ============================================
// MENSAGENS
// ============================================

async function getMensagens(anuncioId, emailA, emailB) {
    const url = '/mensagens/conversa?emailA=' + encodeURIComponent(emailA.toLowerCase()) +
                '&emailB=' + encodeURIComponent(emailB.toLowerCase()) +
                (anuncioId ? '&anuncioId=' + anuncioId : '');
    return apiFetch(url);
}

async function getConversasDoAnuncio(anuncioId, ownerEmail) {
    const mensagens = await apiFetch('/mensagens/anuncio/' + anuncioId);
    const pessoas = {};
    mensagens.forEach(m => {
        const outroEmail = m.remetenteEmail === ownerEmail.toLowerCase() ? m.destinatarioEmail : m.remetenteEmail;
        const outroNome  = m.remetenteEmail === ownerEmail.toLowerCase() ? (m.destinatarioNome || outroEmail) : (m.remetenteNome || m.remetenteEmail);
        if (outroEmail !== ownerEmail.toLowerCase()) pessoas[outroEmail] = outroNome;
    });
    return Object.entries(pessoas).map(([email, nome]) => ({ email, nome }));
}

async function enviarMensagem(anuncioId, remetenteEmail, remetenteNome, destinatarioEmail, destinatarioNome, texto) {
    const payload = {
        texto: texto,
        remetenteEmail: remetenteEmail.toLowerCase(),
        remetenteNome: remetenteNome,
        destinatarioEmail: destinatarioEmail.toLowerCase(),
        destinatarioNome: destinatarioNome,
        anuncioId: anuncioId || null
    };
    return apiFetch('/mensagens', { method: 'POST', body: payload });
}

// ============================================
// ADMIN — Anúncios
// ============================================

async function getAnunciosPendentes() {
    return apiFetch('/anuncios/pendentes');
}

async function aprovarAnuncio(id) {
    return apiFetch('/anuncios/' + id + '/aprovar', { method: 'PATCH' });
}

async function rejeitarAnuncio(id) {
    return apiFetch('/anuncios/' + id + '/rejeitar', { method: 'PATCH' });
}

// ============================================
// ADMIN — Denúncias
// ============================================

async function getDenuncias() {
    return apiFetch('/denuncias');
}

async function enviarDenuncia(denuncia) {
    return apiFetch('/denuncias', { method: 'POST', body: denuncia });
}

async function resolverDenuncia(id) {
    return apiFetch('/denuncias/' + id + '/resolver', { method: 'PATCH' });
}

// ============================================
// ADMIN — Conteúdo Educativo
// ============================================

async function getConteudoEducativo() {
    const lista = await apiFetch('/ConteudosEducativos/ativos');
    return (lista || []).map(c => ({
        ...c,
        link_video: c.linkVideo || null
    }));
}

async function adicionarConteudo(conteudo) {
    const payload = { ...conteudo };
    if (payload.link_video !== undefined) {
        payload.linkVideo = payload.link_video;
        delete payload.link_video;
    }
    return apiFetch('/ConteudosEducativos', { method: 'POST', body: payload });
}

async function atualizarConteudo(id, updates) {
    return apiFetch('/ConteudosEducativos/' + id, { method: 'PUT', body: updates });
}

async function deletarConteudo(id) {
    return apiFetch('/ConteudosEducativos/' + id, { method: 'DELETE' });
}

// ============================================
// ADMIN — Punições
// ============================================

async function aplicarPunicao(email, tipo) {
    const user = await findUserByEmail(email);
    if (!user || !user.id) throw new Error('Usuário não encontrado');
    const body = {};
    if (tipo === 'publicacao' || tipo === 'ambos') body.bloqueioPublicacao = true;
    if (tipo === 'chat' || tipo === 'ambos') body.bloqueioChat = true;
    return apiFetch('/usuarios/' + user.id + '/punir', { method: 'PATCH', body });
}

async function removerPunicao(email) {
    const user = await findUserByEmail(email);
    if (!user || !user.id) throw new Error('Usuário não encontrado');
    return apiFetch('/usuarios/' + user.id + '/punir/remover', { method: 'PATCH' });
}

async function excluirConta(email) {
    const user = await findUserByEmail(email);
    if (!user || !user.id) throw new Error('Usuário não encontrado');
    return apiFetch('/usuarios/' + user.id + '/conta', { method: 'DELETE' });
}

async function alterarSenha(id, senhaAtual, senhaNova) {
    return apiFetch('/usuarios/' + id + '/senha', {
        method: 'PATCH',
        body: { senhaAtual, senhaNova }
    });
}

async function getUsuariosBloqueados() {
    const lista = await apiFetch('/usuarios/bloqueados');
    return (lista || []).map(normalizeUser);
}

// ============================================
// EXPORTS (mantém compatibilidade com window.SupabaseService)
// ============================================

window.SupabaseService = {
    getUsers,
    findUserByEmail,
    findUserByCPF,
    findUserById,
    saveUser,
    updateUser,
    alterarSenha,
    setSession,
    getSession,
    clearSession,
    autenticar,
    getAnuncios,
    getAnunciosByEmail,
    adicionarAnuncio,
    atualizarAnuncio,
    deletarAnuncio,
    getMensagens,
    getConversasDoAnuncio,
    enviarMensagem,
    getAnunciosPendentes,
    aprovarAnuncio,
    rejeitarAnuncio,
    getDenuncias,
    enviarDenuncia,
    resolverDenuncia,
    getConteudoEducativo,
    adicionarConteudo,
    atualizarConteudo,
    deletarConteudo,
    aplicarPunicao,
    removerPunicao,
    excluirConta,
    getUsuariosBloqueados
};
