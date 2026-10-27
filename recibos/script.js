/* =======================================================
   ARQUIVO: script.js (RECIBOS)
   Totalmente Padronizado (Material Icons e UI Unificada)
   ======================================================= */

const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyOZweQZtsb0rJYXDoX7HL0tFG3dO8ZO02pu_yhhS0guV_5d4Q_fIRnPs_Y64GyklrNQA/exec";

// ==========================================
// SISTEMA DE ALERTAS CUSTOMIZADOS
// ==========================================
function mostrarAlerta(msg) { 
    document.getElementById("customAlertMsg").innerText = msg; 
    document.getElementById("customAlert").style.display = "flex"; 
}
function fecharAlerta() { 
    document.getElementById("customAlert").style.display = "none"; 
}

let confirmCallback = null;
function mostrarConfirmacao(msg, callback) { 
    document.getElementById("customConfirmMsg").innerText = msg; 
    confirmCallback = callback; 
    document.getElementById("customConfirm").style.display = "flex"; 
}
function fecharConfirmacao() { 
    document.getElementById("customConfirm").style.display = "none"; 
}
document.getElementById("btnCustomConfirmAcao").addEventListener("click", () => { 
    fecharConfirmacao(); 
    if(confirmCallback) confirmCallback(); 
});

// ==========================================
// VARIÁVEIS GLOBAIS E ESTADOS
// ==========================================
let baseServicosGeral = [];
let historicoImoveis = [];
let historicoVeiculos = [];
let dashState = 'imovel'; 
let filtroHistoricoAtual = 'imoveis'; 
let paginaAtual = 1; 
const itensPorPagina = 10;
let idReciboEmEdicao = null; 
let tipoReciboEdicao = null;
let modalImportacaoContext = 'imovel'; 

// ==========================================
// GERADOR DE BLOCOS HTML (IMÓVEIS)
// ==========================================
const containerImoveis = document.getElementById("blocos-imoveis-container"); 
let htmlBlocos = "";
for(let i=1; i<=5; i++) {
    htmlBlocos += `
    <div class="item-block" id="bloco_item_${i}" style="display: ${i===1?'block':'none'};">
        <div class="item-block-title">
            <div style="display:flex; align-items:center; gap:8px;">
                <span class="badge">${i}</span> Serviço 0${i}
            </div>
            ${i>1 ? `<button type="button" class="close-btn" onclick="fecharItem(${i})"><span class="material-icons" style="font-size:18px;">close</span></button>` : ''}
        </div>
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label class="title-label">Serviço ${i===1?'*':''}</label>
                <select id="item_${i}_servico_select" class="form-input" onchange="toggleOutro('item_${i}_servico')" ${i===1?'required':''}>
                    <option value="">Selecione...</option>
                    <option value="Desinsetização">Desinsetização</option>
                    <option value="Desinsetização e Desratização">Desinsetização e Desratização</option>
                    <option value="Descupinização">Descupinização</option>
                    <option value="Limpeza de Reservatórios">Limpeza de Reservatórios</option>
                    <option value="Outro">Outro...</option>
                </select>
                <input type="text" id="item_${i}_servico_outro" class="form-input" style="display:none; margin-top:8px;" placeholder="Digite o serviço">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="title-label">Data Execução</label>
                <input type="date" id="item_${i}_data" class="form-input">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group" style="flex: 2;">
                <label class="title-label">Local ${i===1?'*':''}</label>
                <input type="text" id="item_${i}_local" class="form-input" ${i===1?'required':''} placeholder="Onde foi executado?">
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="title-label">Garantia</label>
                <select id="item_${i}_garantia_select" class="form-input" onchange="toggleOutro('item_${i}_garantia')">
                    <option value="">Nenhuma</option>
                    <option value="30 dias">30 dias</option>
                    <option value="60 dias">60 dias</option>
                    <option value="90 dias">90 dias</option>
                    <option value="180 dias">180 dias</option>
                    <option value="Outro">Outro...</option>
                </select>
                <input type="text" id="item_${i}_garantia_outro" class="form-input" style="display:none; margin-top:8px;" placeholder="Digite a garantia">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group" style="width:100%;">
                <label class="title-label">Valor Discriminado</label>
                <input type="text" id="item_${i}_valor" class="form-input" placeholder="Opcional">
            </div>
        </div>
    </div>`;
}
containerImoveis.innerHTML = htmlBlocos;

// ==========================================
// INICIALIZAÇÃO E EVENTOS AO ABRIR O SISTEMA
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    const formImovel = document.getElementById('reciboForm');
    if (formImovel) {
        formImovel.addEventListener('input', salvarRascunhoAutomatico);
        formImovel.addEventListener('change', salvarRascunhoAutomatico);
    }
    const formVeiculo = document.getElementById('reciboVeiculoForm');
    if (formVeiculo) {
        formVeiculo.addEventListener('input', salvarRascunhoAutomatico);
        formVeiculo.addEventListener('change', salvarRascunhoAutomatico);
    }

    const d = new Date().toISOString().split("T")[0];
    document.getElementById("data_recibo").value = d; 
    document.getElementById("data_recibo_v").value = d;
    
    carregarDadosBackend();
});

// ==========================================
// RASCUNHO AUTOMÁTICO (ANTI-PERDA DE DADOS)
// ==========================================
function salvarRascunhoAutomatico() {
    if (idReciboEmEdicao) return; 
    
    const abaAtiva = document.querySelector('.view-section.active').id;
    
    if (abaAtiva === 'view-form') {
        const rascunho = {
            cliente: document.getElementById('cliente').value,
            cpf_cnpj: document.getElementById('cpf_cnpj').value,
            valor_numerico: document.getElementById('valor_numerico').value,
            incluir_dados_bancarios: document.getElementById('incluir_dados_bancarios').checked
        };
        localStorage.setItem('rascunho_recibo_imovel', JSON.stringify(rascunho));
    } else if (abaAtiva === 'view-form-veiculo') {
        const rascunho = {
            cliente_v: document.getElementById('cliente_v').value,
            cpf_cnpj_v: document.getElementById('cpf_cnpj_v').value,
            valor_numerico_v: document.getElementById('valor_numerico_v').value,
            servico_v: document.getElementById('servico_v').value,
            placa_v: document.getElementById('placa_v').value,
            incluir_dados_bancarios_v: document.getElementById('incluir_dados_bancarios_v').checked
        };
        localStorage.setItem('rascunho_recibo_veiculo', JSON.stringify(rascunho));
    }
}

function recuperarRascunho(abaId) {
    if (idReciboEmEdicao) return;

    if (abaId === 'form') {
        const salvo = localStorage.getItem('rascunho_recibo_imovel');
        if (salvo) {
            try {
                const r = JSON.parse(salvo);
                if (r.cliente) document.getElementById('cliente').value = r.cliente;
                if (r.cpf_cnpj) document.getElementById('cpf_cnpj').value = r.cpf_cnpj;
                if (r.valor_numerico) {
                    document.getElementById('valor_numerico').value = r.valor_numerico;
                    document.getElementById('valor_numerico').dispatchEvent(new Event('input'));
                }
                if (r.incluir_dados_bancarios) document.getElementById('incluir_dados_bancarios').checked = r.incluir_dados_bancarios;
            } catch(e) {}
        }
    } else if (abaId === 'form-veiculo') {
        const salvo = localStorage.getItem('rascunho_recibo_veiculo');
        if (salvo) {
            try {
                const r = JSON.parse(salvo);
                if (r.cliente_v) document.getElementById('cliente_v').value = r.cliente_v;
                if (r.cpf_cnpj_v) document.getElementById('cpf_cnpj_v').value = r.cpf_cnpj_v;
                if (r.valor_numerico_v) {
                    document.getElementById('valor_numerico_v').value = r.valor_numerico_v;
                    document.getElementById('valor_numerico_v').dispatchEvent(new Event('input'));
                }
                if (r.servico_v) document.getElementById('servico_v').value = r.servico_v;
                if (r.placa_v) document.getElementById('placa_v').value = r.placa_v;
                if (r.incluir_dados_bancarios_v) document.getElementById('incluir_dados_bancarios_v').checked = r.incluir_dados_bancarios_v;
            } catch(e) {}
        }
    }
}

function limparRascunho(abaId) {
    if (abaId === 'form') localStorage.removeItem('rascunho_recibo_imovel');
    if (abaId === 'form-veiculo') localStorage.removeItem('rascunho_recibo_veiculo');
}

// ==========================================
// NAVEGAÇÃO E MODAIS
// ==========================================
function abrirModalEscolhaRecibo() { 
    document.getElementById("modalEscolhaRecibo").style.display = "flex"; 
}
function fecharModalEscolhaRecibo() { 
    document.getElementById("modalEscolhaRecibo").style.display = "none"; 
}

function mudarAba(abaId) {
    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    document.getElementById('view-' + abaId).classList.add('active');
    
    if (abaId === 'dashboard' || abaId === 'historico') {
        if(!idReciboEmEdicao) { 
            limparRascunho('form');
            limparRascunho('form-veiculo');
            resetarFormularioBase(); 
            resetarFormularioVeiculo(); 
        }
    }
    window.scrollTo(0,0);
}

function selecionarTipoFormulario(abaId) { 
    fecharModalEscolhaRecibo(); 
    mudarAba(abaId); 
    recuperarRascunho(abaId); 
}

function showLoader(txt = "Aguarde...") { 
    document.getElementById("loader-text").innerText = txt; 
    document.getElementById("loader").style.display = "flex"; 
}
function hideLoader() { 
    document.getElementById("loader").style.display = "none"; 
}

// ==========================================
// LÓGICA DO DASHBOARD DINÂMICO
// ==========================================
function carregarDadosBackend() {
    showLoader("A carregar dados...");
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "dashboard" }), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(r => r.json()).then(d => {
        if(d.status === "sucesso") {
            historicoImoveis = d.historico_imoveis; historicoVeiculos = d.historico_veiculos;
            window.ultimosImoveis = d.ultimos_5_imoveis;
            window.ultimosVeiculos = d.ultimos_5_veiculos;
            
            alternarDashboard(dashState);
            paginaAtual = 1; renderizarHistoricoPaginado();
        }
    }).catch(e => console.error(e)).finally(() => hideLoader());
}

function alternarDashboard(tipo) {
    dashState = tipo;
    const tabI = document.getElementById("tab-dash-imovel");
    const tabV = document.getElementById("tab-dash-veiculo");
    const displayTotal = document.getElementById("dash-total-display");
    
    tabI.classList.remove("active"); tabV.classList.remove("active");
    
    if(tipo === 'imovel') {
        tabI.classList.add("active");
        displayTotal.innerText = historicoImoveis.length;
        renderizarTabelaComIcones("tabela-ultimos-dashboard", window.ultimosImoveis || []);
    } else {
        tabV.classList.add("active");
        displayTotal.innerText = historicoVeiculos.length;
        renderizarTabelaComIcones("tabela-ultimos-dashboard", window.ultimosVeiculos || []);
    }
}

function renderizarTabelaComIcones(idTabela, arr) {
    const tbody = document.querySelector(`#${idTabela} tbody`); tbody.innerHTML = "";
    if(arr.length === 0) { tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:20px; color:#6b7280;">Nenhum recibo encontrado.</td></tr>`; return; }
    
    arr.forEach(rec => {
        const tr = document.createElement("tr");
        let l = rec.url_pdf.replace(/\/view.*$/, "/export?format=pdf");
        const obj64 = btoa(unescape(encodeURIComponent(JSON.stringify(rec))));
        
        tr.innerHTML = `
            <td><strong>${rec.cliente}</strong></td>
            <td>${rec.data_extenso}</td>
            <td>R$ ${rec.valor_numerico}</td>
            <td style="text-align: center; color:#1f2937;">${rec.id_recibo}</td>
            <td style="text-align: center;">
                <div class="actions">
                    <button type="button" class="icon-btn icon-pdf" onclick="window.open('${rec.url_pdf}', '_blank')" title="Ver PDF"><span class="material-icons">visibility</span></button>
                    <button type="button" class="icon-btn icon-share" onclick="window.open('${l}', '_blank')" title="Baixar PDF"><span class="material-icons">download</span></button>
                    <button type="button" class="icon-btn icon-edit" onclick="iniciarEdicao('${obj64}')" title="Editar"><span class="material-icons">edit</span></button>
                    <button type="button" class="icon-btn icon-del" onclick="excluirRecibo('${rec.id_recibo}')" title="Apagar"><span class="material-icons">delete</span></button>
                </div>
            </td>`;
        tbody.appendChild(tr);
    });
}

function mudarFiltroHistorico(tipo) {
    filtroHistoricoAtual = tipo;
    document.getElementById("btn-hist-imoveis").classList.remove("active"); document.getElementById("btn-hist-veiculos").classList.remove("active");
    document.getElementById("btn-hist-" + tipo).classList.add("active");
    paginaAtual = 1; renderizarHistoricoPaginado();
}

function renderizarHistoricoPaginado() {
    let listaAtiva = (filtroHistoricoAtual === 'imoveis') ? historicoImoveis : historicoVeiculos;
    const t = Math.ceil(listaAtiva.length / itensPorPagina) || 1;
    document.getElementById("info-page").innerText = `Página ${paginaAtual} de ${t}`;
    document.getElementById("btn-prev-page").disabled = (paginaAtual === 1); document.getElementById("btn-next-page").disabled = (paginaAtual === t);
    const i = (paginaAtual - 1) * itensPorPagina, f = i + itensPorPagina;
    renderizarTabelaComIcones("tabela-historico", listaAtiva.slice(i, f));
}
function mudarPagina(d) { let listaAtiva = (filtroHistoricoAtual === 'imoveis') ? historicoImoveis : historicoVeiculos; const t = Math.ceil(listaAtiva.length / itensPorPagina); paginaAtual += d; if(paginaAtual<1) paginaAtual=1; if(paginaAtual>t) paginaAtual=t; renderizarHistoricoPaginado(); }

function excluirRecibo(id) {
    mostrarConfirmacao(`Apagar definitivamente o recibo ${id}?`, () => {
        showLoader("A apagar...");
        fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "excluir", id_recibo: id }), headers: { "Content-Type": "text/plain;charset=utf-8" } })
        .then(r => r.json()).then(d => { if(d.status === "sucesso") { mostrarAlerta("Apagado com sucesso!"); carregarDadosBackend(); } else mostrarAlerta("Erro: " + d.mensagem); }).catch(e => console.error(e)).finally(() => hideLoader());
    });
}

function reverterDataExtensoParaIso(s) {
    if(!s) return ""; const ms = {"janeiro":"01","fevereiro":"02","março":"03","abril":"04","maio":"05","junho":"06","julho":"07","agosto":"08","setembro":"09","outubro":"10","novembro":"11","dezembro":"12"};
    const m = s.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i); return m ? `${m[3]}-${ms[m[2].toLowerCase()]}-${m[1].padStart(2,'0')}` : "";
}

// ==========================================
// MODO DE EDIÇÃO
// ==========================================
function iniciarEdicao(obj64) {
    const rec = JSON.parse(decodeURIComponent(escape(atob(obj64))));
    idReciboEmEdicao = rec.id_recibo;
    
    if (rec.tipo_recibo === 'veiculo') {
        tipoReciboEdicao = 'veiculo'; resetarFormularioVeiculo();
        document.getElementById("spanIdEdicaoVeiculo").innerText = rec.id_recibo; document.getElementById("alertaEdicaoVeiculo").style.display = "flex";
        document.getElementById("titulo-form-veiculo").innerHTML = "Editando Recibo de Veículos"; 
        document.getElementById("btnSubmitVeiculo").innerHTML = "Salvar Alterações";
        document.getElementById("cliente_v").value = rec.cliente; document.getElementById("valor_numerico_v").value = rec.valor_numerico; document.getElementById("valor_por_extenso_v").value = rec.valor_numerico ? numeroParaExtenso(rec.valor_numerico) : "";
        
        if(rec.cpf_cnpj_puro.length > 11) { document.querySelectorAll('input[name="tipo_pessoa_v"]')[1].checked = true; document.getElementById('docLabel_v').innerText = 'CNPJ'; } else { document.querySelectorAll('input[name="tipo_pessoa_v"]')[0].checked = true; document.getElementById('docLabel_v').innerText = 'CPF'; }
        document.getElementById("cpf_cnpj_v").value = rec.cpf_cnpj_puro; document.getElementById("cpf_cnpj_v").dispatchEvent(new Event('input')); 
        const dataP = reverterDataExtensoParaIso(rec.data_extenso); if(dataP) document.getElementById("data_recibo_v").value = dataP;

        document.getElementById("servico_v").value = rec.item_01 || ""; 
        document.getElementById("placa_v").value = rec.item_02 || "";   
        
        if (rec.item_03) {
            const dBr = rec.item_03.split("/"); 
            if (dBr.length === 3) document.getElementById("data_execucao_v").value = `${dBr[2]}-${dBr[1]}-${dBr[0]}`; 
            else document.getElementById("data_execucao_v").value = rec.item_03; 
        }
        
        if (rec.item_04) {
            const garSel = document.getElementById("garantia_select_v"); 
            if (Array.from(garSel.options).map(o=>o.value).includes(rec.item_04)) garSel.value = rec.item_04; 
            else { garSel.value = "Outro"; document.getElementById("garantia_outro_v").value = rec.item_04; } 
            toggleOutroV();
        }
        
        mudarAba('form-veiculo');
    } 
    else {
        tipoReciboEdicao = 'geral'; resetarFormularioBase();
        document.getElementById("spanIdEdicao").innerText = rec.id_recibo; document.getElementById("alertaEdicao").style.display = "flex";
        document.getElementById("titulo-form").innerHTML = "Editando Recibo de Imóveis"; 
        document.getElementById("btnSubmit").innerHTML = "Salvar Alterações";
        document.getElementById("cliente").value = rec.cliente; document.getElementById("valor_numerico").value = rec.valor_numerico; document.getElementById("valor_por_extenso").value = rec.valor_numerico ? numeroParaExtenso(rec.valor_numerico) : "";
        
        if(rec.cpf_cnpj_puro.length > 11) { document.querySelectorAll('input[name="tipo_pessoa"]')[1].checked = true; document.getElementById('docLabel').innerText = 'CNPJ'; } else { document.querySelectorAll('input[name="tipo_pessoa"]')[0].checked = true; document.getElementById('docLabel').innerText = 'CPF'; }
        document.getElementById("cpf_cnpj").value = rec.cpf_cnpj_puro; document.getElementById("cpf_cnpj").dispatchEvent(new Event('input')); 
        const dataP = reverterDataExtensoParaIso(rec.data_extenso); if(dataP) document.getElementById("data_recibo").value = dataP;

        [rec.item_01, rec.item_02, rec.item_03, rec.item_04, rec.item_05].forEach((txt, i) => {
            let n = i + 1; if(!txt) return; let srv="", loc="", dIso="", gar="", val="";
            txt.split('\n').forEach(l => { if(l.startsWith("Serviço: ")) srv = l.replace("Serviço: ", ""); if(l.startsWith("Local: ")) loc = l.replace("Local: ", ""); if(l.startsWith("Executado: ")) dIso = reverterDataExtensoParaIso(l.replace("Executado: ", "")); if(l.startsWith("Garantia: ")) gar = l.replace("Garantia: ", ""); if(l.startsWith("Valor: ")) val = l.replace("Valor: ", ""); });
            if(srv) {
                document.getElementById("bloco_item_"+n).style.display="block"; document.getElementById('item_'+n+'_local').value=loc; document.getElementById('item_'+n+'_data').value=dIso; document.getElementById('item_'+n+'_valor').value=val;
                const ss=document.getElementById('item_'+n+'_servico_select'); if(Array.from(ss.options).map(o=>o.value).includes(srv)) ss.value=srv; else {ss.value="Outro"; document.getElementById('item_'+n+'_servico_outro').value=srv;} toggleOutro('item_'+n+'_servico');
                const gs=document.getElementById('item_'+n+'_garantia_select'); if(Array.from(gs.options).map(o=>o.value).includes(gar)) gs.value=gar; else if(gar) {gs.value="Outro"; document.getElementById('item_'+n+'_garantia_outro').value=gar;} toggleOutro('item_'+n+'_garantia');
            }
        }); 
        mudarAba('form');
    } 
}

function cancelarEdicao() { 
    resetarFormularioBase(); 
    resetarFormularioVeiculo(); 
    mudarAba('dashboard'); 
}

function resetarFormularioBase() { 
    document.getElementById("reciboForm").reset(); 
    for(let i=1; i<=5; i++) { 
        if(i>1) document.getElementById("bloco_item_"+i).style.display="none"; 
        document.getElementById('item_'+i+'_servico_select').value=""; document.getElementById('item_'+i+'_servico_outro').value=""; document.getElementById('item_'+i+'_servico_outro').style.display="none"; document.getElementById('item_'+i+'_data').value=""; document.getElementById('item_'+i+'_local').value=""; document.getElementById('item_'+i+'_garantia_select').value=""; document.getElementById('item_'+i+'_garantia_outro').value=""; document.getElementById('item_'+i+'_garantia_outro').style.display="none"; document.getElementById('item_'+i+'_valor').value=""; 
    } 
    idReciboEmEdicao = null; tipoReciboEdicao = null; document.getElementById("alertaEdicao").style.display = "none"; document.getElementById("titulo-form").innerHTML = "Novo Recibo de Imóveis"; document.getElementById("btnSubmit").innerHTML = "Salvar e Gerar Recibo"; document.getElementById('docLabel').innerText = 'CPF'; document.getElementById("data_recibo").value = new Date().toISOString().split("T")[0]; document.getElementById("btnAddItem").style.display = "block"; 
    
    document.getElementById("incluir_dados_bancarios").checked = false;
}

function resetarFormularioVeiculo() { 
    document.getElementById("reciboVeiculoForm").reset(); 
    idReciboEmEdicao = null; tipoReciboEdicao = null; document.getElementById("alertaEdicaoVeiculo").style.display = "none"; document.getElementById("titulo-form-veiculo").innerHTML = "Novo Recibo de Veículos"; document.getElementById("btnSubmitVeiculo").innerHTML = "Salvar Recibo de Veículo"; document.getElementById('docLabel_v').innerText = 'CPF'; document.getElementById("data_recibo_v").value = new Date().toISOString().split("T")[0]; document.getElementById("garantia_outro_v").style.display = "none"; 
    
    document.getElementById("incluir_dados_bancarios_v").checked = false;
}

// ==========================================
// ENVIOS DOS FORMs PARA O BACKEND
// ==========================================
document.getElementById("reciboForm").addEventListener("submit", function(event) {
    event.preventDefault(); const btn = this.querySelector("button[type=submit]"); btn.innerHTML = "A processar..."; btn.disabled = true;
    let doc = document.getElementById("cpf_cnpj").value.trim();
    let t = document.querySelector('input[name="tipo_pessoa"]:checked').value;
    let p = doc.replace(/\D/g, '');
    let fmt = ""; 
    if(doc) { fmt = (t === 'F') ? "inscrito no CPF sob o nº " + doc : "inscrito no CNPJ sob o nº " + doc; }
    
    const dados = { 
        acao: idReciboEmEdicao ? "editar" : "gerar", 
        tipo_recibo: "geral", 
        id_recibo: idReciboEmEdicao, 
        cliente: document.getElementById("cliente").value, 
        cpf_cnpj_formatado: fmt, 
        cpf_cnpj_puro: p, 
        data_recibo_extenso: dataParaExtenso(document.getElementById("data_recibo").value), 
        valor_numerico: document.getElementById("valor_numerico").value, 
        valor_por_extenso: document.getElementById("valor_por_extenso").value, 
        item_01: montarTextoItem(1), 
        item_02: montarTextoItem(2), 
        item_03: montarTextoItem(3), 
        item_04: montarTextoItem(4), 
        item_05: montarTextoItem(5),
        incluir_dados_bancarios: document.getElementById("incluir_dados_bancarios").checked 
    };
    enviarBackend(dados, btn, resetarFormularioBase, idReciboEmEdicao ? "Salvar Alterações" : "Salvar e Gerar Recibo");
});

document.getElementById("reciboVeiculoForm").addEventListener("submit", function(event) {
    event.preventDefault(); const btn = this.querySelector("button[type=submit]"); btn.innerHTML = "A processar..."; btn.disabled = true;
    let doc = document.getElementById("cpf_cnpj_v").value.trim();
    let t = document.querySelector('input[name="tipo_pessoa_v"]:checked').value;
    let p = doc.replace(/\D/g, '');
    let fmt = ""; 
    if(doc) { fmt = (t === 'F') ? "inscrito no CPF sob o nº " + doc : "inscrito no CNPJ sob o nº " + doc; }

    const dados = { 
        acao: idReciboEmEdicao ? "editar" : "gerar", 
        tipo_recibo: "veiculo", 
        id_recibo: idReciboEmEdicao, 
        cliente: document.getElementById("cliente_v").value, 
        cpf_cnpj_formatado: fmt, 
        cpf_cnpj_puro: p, 
        data_recibo_extenso: dataParaExtenso(document.getElementById("data_recibo_v").value), 
        valor_numerico: document.getElementById("valor_numerico_v").value, 
        valor_por_extenso: document.getElementById("valor_por_extenso_v").value, 
        servico: document.getElementById("servico_v").value, 
        placa: document.getElementById("placa_v").value.toUpperCase(), 
        data_execucao: formatarDataPadrao(document.getElementById("data_execucao_v").value), 
        garantia: document.getElementById("garantia_select_v").value === "Outro" ? document.getElementById("garantia_outro_v").value : document.getElementById("garantia_select_v").value,
        incluir_dados_bancarios: document.getElementById("incluir_dados_bancarios_v").checked 
    };
    enviarBackend(dados, btn, resetarFormularioVeiculo, idReciboEmEdicao ? "Salvar Alterações" : "Salvar Recibo de Veículo");
});

function enviarBackend(dados, btn, fReset, txtBotaoBase) {
    showLoader("A gerar e a guardar PDF..."); 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify(dados), headers: { "Content-Type": "text/plain;charset=utf-8" } })
    .then(r => r.json())
    .then(data => { 
        if(data.status === "sucesso") { 
            limparRascunho(dados.tipo_recibo === 'veiculo' ? 'form-veiculo' : 'form'); 
            mostrarAlerta(`Sucesso! Recibo ${data.acao_realizada === 'editar'?'atualizado':'gerado'}:\n${data.id_recibo}`); 
            fReset(); 
            carregarDadosBackend(); 
            mudarAba('dashboard'); 
            window.open(data.url_pdf, '_blank'); 
        } else {
            mostrarAlerta("Erro: " + data.mensagem); 
        }
    })
    .catch(() => mostrarAlerta("Erro de ligação."))
    .finally(() => { 
        btn.innerHTML = txtBotaoBase; 
        btn.disabled = false; 
        hideLoader(); 
    });
}

// ==========================================
// UTILITÁRIOS E FORMATAÇÕES
// ==========================================
function toggleOutro(p) { const s = document.getElementById(p+"_select"), o = document.getElementById(p+"_outro"); if(s.value==="Outro") o.style.display="block"; else { o.style.display="none"; o.value=""; } }
function toggleOutroV() { const s = document.getElementById("garantia_select_v"), o = document.getElementById("garantia_outro_v"); if(s.value==="Outro") o.style.display="block"; else { o.style.display="none"; o.value=""; } }
document.getElementById("btnAddItem").addEventListener("click", function() { for(let i=2; i<=5; i++) { let b=document.getElementById("bloco_item_"+i); if(b.style.display==="none") { b.style.display="block"; break; } } let vis=true; for(let i=2; i<=5; i++) if(document.getElementById("bloco_item_"+i).style.display==="none") vis=false; if(vis) this.style.display="none"; });
function fecharItem(n) { document.getElementById("bloco_item_"+n).style.display="none"; document.getElementById('item_'+n+'_servico_select').value=""; document.getElementById('item_'+n+'_servico_outro').value=""; document.getElementById('item_'+n+'_servico_outro').style.display="none"; document.getElementById('item_'+n+'_data').value=""; document.getElementById('item_'+n+'_local').value=""; document.getElementById('item_'+n+'_garantia_select').value=""; document.getElementById('item_'+n+'_garantia_outro').value=""; document.getElementById('item_'+n+'_garantia_outro').style.display="none"; document.getElementById('item_'+n+'_valor').value=""; document.getElementById("btnAddItem").style.display="block"; }

function setupMascaraPessoa(nomeRadios, idDoc, idLabel) { document.querySelectorAll(`input[name="${nomeRadios}"]`).forEach(r => r.addEventListener('change', (e) => { let d = document.getElementById(idDoc); if(e.target.value === 'F') { document.getElementById(idLabel).innerText = 'CPF'; d.placeholder = '000.000.000-00'; } else { document.getElementById(idLabel).innerText = 'CNPJ'; d.placeholder = '00.000.000/0001-00'; } d.value = ''; })); document.getElementById(idDoc).addEventListener('input', function(e) { let t = document.querySelector(`input[name="${nomeRadios}"]:checked`).value, v = e.target.value.replace(/\D/g, ''); if (t === 'F') { if(v.length>11)v=v.substring(0,11); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d{1,2})$/,"$1-$2"); } else { if(v.length>14)v=v.substring(0,14); v=v.replace(/(\d{2})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1.$2"); v=v.replace(/(\d{3})(\d)/,"$1/$2"); v=v.replace(/(\d{4})(\d{1,2})$/,"$1-$2"); } e.target.value = v; }); }
setupMascaraPessoa('tipo_pessoa', 'cpf_cnpj', 'docLabel'); setupMascaraPessoa('tipo_pessoa_v', 'cpf_cnpj_v', 'docLabel_v');
function setupMascaraValor(idValor, idExtenso) { document.getElementById(idValor).addEventListener('input', function(e) { let v = e.target.value.replace(/\D/g, ''); if (v === '') { e.target.value = ''; document.getElementById(idExtenso).value = ''; return; } v = (parseInt(v, 10)/100).toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.'); e.target.value = v; document.getElementById(idExtenso).value = numeroParaExtenso(v); }); }
setupMascaraValor('valor_numerico', 'valor_por_extenso'); setupMascaraValor('valor_numerico_v', 'valor_por_extenso_v');
function dataParaExtenso(d) { if(!d) return ""; const p=d.split('-'), m=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"]; return `${parseInt(p[2], 10)} de ${m[parseInt(p[1], 10)-1]} de ${p[0]}`; }
function formatarDataPadrao(d) { if(!d) return "-"; const p=d.split("-"); return p.length===3 ? `${p[2]}/${p[1]}/${p[0]}` : d; }
function numeroParaExtenso(v) { if(!v||v==="0,00")return ""; const un=['','um','dois','três','quatro','cinco','seis','sete','oito','nove'], dz=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'], dz10=['dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'], cn=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos']; function cv(n){ let r=[],c=Math.floor(n/100),d=Math.floor((n%100)/10),u=n%10; if(c>0)r.push(c===1&&d===0&&u===0?'cem':cn[c]); if(d===1)r.push(dz10[u]);else{if(d>1)r.push(dz[d]);if(u>0)r.push(un[u]);} return r.join(' e '); } let num=v.replace(/\./g,"").split(","), r=parseInt(num[0],10)||0, c=parseInt(num[1]||"0",10), rs=""; if(r>0){ let mi=Math.floor(r/1000000), mr=r%1000000, ms=mi>0?(cv(mi)+(mi===1?' milhão':' milhões')):'', ml=Math.floor(mr/1000), mlr=mr%1000, mls=ml>0?(cv(ml)+' mil'):'', us=mlr>0?cv(mlr):'', p=[]; if(ms)p.push(ms);if(mls)p.push(mls);if(us){if(p.length>0&&mlr<100)p.push('e '+us);else p.push(us);} rs=p.join(', ').replace(/, e /g,' e ')+(r===1?' real':' reais'); } let cs=c>0?cv(c)+(c===1?' centavo':' centavos'):""; return (r>0&&c>0) ? rs+' e '+cs : (r>0?rs:cs); }
function montarTextoItem(n) { const b = document.getElementById("bloco_item_" + n); if (n > 1 && (b.style.display === "none")) return ""; let sel = document.getElementById('item_'+n+'_servico_select').value, srv = sel === 'Outro' ? document.getElementById('item_'+n+'_servico_outro').value.trim() : sel; let loc = document.getElementById('item_'+n+'_local').value.trim(), dIso = document.getElementById('item_'+n+'_data').value; let gSel = document.getElementById('item_'+n+'_garantia_select').value, gar = gSel === 'Outro' ? document.getElementById('item_'+n+'_garantia_outro').value.trim() : gSel; let val = document.getElementById('item_'+n+'_valor').value.trim(); if (!srv) return ""; let txt = "Serviço: " + srv + "\nLocal: " + (loc || "Não informado"); if (dIso) txt += "\nExecutado: " + dataParaExtenso(dIso); if (gar) txt += "\nGarantia: " + gar; if (val) txt += "\nValor: " + val; return txt; }

// ==========================================
// SISTEMA DE IMPORTAÇÃO (IMÓVEIS E VEÍCULOS)
// ==========================================
document.getElementById("btnAbrirImportacao").addEventListener("click", function() { 
    modalImportacaoContext = 'imovel'; document.getElementById("thServicoPlaca").innerText = "Serviço";
    const btn = this; btn.innerHTML = "A buscar..."; btn.disabled = true; 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "importar", tipo_recibo: "geral" }) })
    .then(r=>r.json()).then(d=>{ if (d.status === "sucesso") { baseServicosGeral = d.dados; document.getElementById("modalImportacao").style.display = "flex"; document.getElementById("buscaModal").value = ""; renderizarTabelaModal(baseServicosGeral.slice(0, 10)); atualizarContadorModal(); } else mostrarAlerta("Erro: " + d.mensagem); }).finally(() => { btn.innerHTML = `<span class="material-icons" style="font-size:18px;">cloud_download</span> Importar`; btn.disabled = false; }); 
});

document.getElementById("btnAbrirImportacaoVeiculo").addEventListener("click", function() { 
    modalImportacaoContext = 'veiculo'; document.getElementById("thServicoPlaca").innerText = "Placa";
    const btn = this; btn.innerHTML = "A buscar..."; btn.disabled = true; 
    fetch(URL_APPS_SCRIPT, { method: "POST", body: JSON.stringify({ acao: "importar", tipo_recibo: "veiculo" }) })
    .then(r=>r.json()).then(d=>{ if (d.status === "sucesso") { baseServicosGeral = d.dados; document.getElementById("modalImportacao").style.display = "flex"; document.getElementById("buscaModal").value = ""; renderizarTabelaModal(baseServicosGeral.slice(0, 10)); atualizarContadorModal(); } else mostrarAlerta("Erro: " + d.mensagem); }).finally(() => { btn.innerHTML = `<span class="material-icons" style="font-size:18px;">cloud_download</span> Importar`; btn.disabled = false; }); 
});

// AQUI ESTAVA O ERRO (BOTÃO INEXISTENTE NO HTML). Corrigido abaixo!
function fecharModalImportacao() { document.getElementById("modalImportacao").style.display = "none"; } 
// Removi a linha que chamava o 'btnFecharModalTop' que não existia.
document.getElementById("btnCancelarModal").addEventListener("click", fecharModalImportacao); 

document.getElementById("buscaModal").addEventListener("input", function(e) { 
    const t = e.target.value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); 
    if (t === "") renderizarTabelaModal(baseServicosGeral.slice(0, 10)); 
    else { renderizarTabelaModal(baseServicosGeral.filter(s => s.cliente.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(t))); } 
});

function renderizarTabelaModal(lista) { 
    const tbody = document.querySelector("#tabelaServicos tbody"); tbody.innerHTML = ""; 
    if (lista.length === 0) { tbody.innerHTML = `<tr><td colspan="4" align="center" style="padding:15px; color:#6b7280;">Nenhum registo encontrado.</td></tr>`; return; } 
    lista.forEach(srv => { 
        const tr = document.createElement("tr"); 
        let infoEspecífica = modalImportacaoContext === 'veiculo' ? srv.placa : srv.servico;
        tr.innerHTML = `<td align="center"><input type="checkbox" class="chk-linha" style="width:16px; height:16px; accent-color:#004481; cursor:pointer;" value="${encodeURIComponent(JSON.stringify(srv))}" onchange="atualizarContadorModal()"></td><td><strong>${srv.cliente}</strong></td><td>${infoEspecífica}</td><td>${formatarDataPadrao(srv.data)}</td>`; 
        tbody.appendChild(tr); 
    }); 
}

function atualizarContadorModal() { 
    const q = document.querySelectorAll(".chk-linha:checked").length; 
    const limite = modalImportacaoContext === 'veiculo' ? 1 : 5;
    const ctr = document.getElementById("contadorSelecao"); 
    ctr.innerText = `${q}/${limite} selecionados`; 
    ctr.style.color = q > limite ? "red" : "#6b7280"; 
}

document.getElementById("btnConfirmarModal").addEventListener("click", function() { 
    const chks = document.querySelectorAll(".chk-linha:checked"); 
    const limite = modalImportacaoContext === 'veiculo' ? 1 : 5;
    if (chks.length === 0) return mostrarAlerta("Selecione pelo menos um item."); 
    if (chks.length > limite) return mostrarAlerta(`Máximo de ${limite} item(ns) permitido(s).`); 
    
    const sel = Array.from(chks).map(c => JSON.parse(decodeURIComponent(c.value))); 
    if (modalImportacaoContext === 'veiculo') {
        document.getElementById("cliente_v").value = sel[0].cliente; 
        document.getElementById("placa_v").value = sel[0].placa || ""; 
        if (sel[0].data) document.getElementById("data_execucao_v").value = sel[0].data;
        const gSelect = document.getElementById("garantia_select_v"); 
        if (Array.from(gSelect.options).map(o=>o.value).includes(sel[0].garantia)) { gSelect.value = sel[0].garantia; } else if (sel[0].garantia) { gSelect.value = "Outro"; document.getElementById("garantia_outro_v").value = sel[0].garantia; } 
        toggleOutroV();
    } else {
        document.getElementById("cliente").value = sel[0].cliente; 
        for(let i=1; i<=5; i++) { if(i>1) document.getElementById("bloco_item_"+i).style.display="none"; document.getElementById('item_'+i+'_servico_select').value=""; document.getElementById('item_'+i+'_servico_outro').value=""; document.getElementById('item_'+i+'_servico_outro').style.display="none"; document.getElementById('item_'+i+'_data').value=""; document.getElementById('item_'+i+'_local').value=""; document.getElementById('item_'+i+'_garantia_select').value=""; document.getElementById('item_'+i+'_garantia_outro').value=""; document.getElementById('item_'+i+'_garantia_outro').style.display="none"; document.getElementById('item_'+i+'_valor').value=""; } 
        sel.forEach((srv, idx) => { 
            const n = idx + 1; document.getElementById("bloco_item_" + n).style.display = "block"; document.getElementById('item_' + n + '_local').value = srv.local; document.getElementById('item_' + n + '_data').value = srv.data; const sSelect = document.getElementById('item_' + n + '_servico_select'); 
            if (Array.from(sSelect.options).map(o=>o.value).includes(srv.servico)) sSelect.value = srv.servico; else if (srv.servico) { sSelect.value = "Outro"; document.getElementById('item_' + n + '_servico_outro').value = srv.servico; } toggleOutro('item_' + n + '_servico'); const gSelect = document.getElementById('item_' + n + '_garantia_select'); 
            if (Array.from(gSelect.options).map(o=>o.value).includes(srv.garantia)) gSelect.value = srv.garantia; else if (srv.garantia) { gSelect.value = "Outro"; document.getElementById('item_' + n + '_garantia_outro').value = srv.garantia; } toggleOutro('item_' + n + '_garantia'); 
        }); document.getElementById("btnAddItem").style.display = sel.length >= 5 ? "none" : "block"; 
    } fecharModalImportacao(); 
});
