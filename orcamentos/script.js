/* =======================================================
   ARQUIVO: script.js (ORÇAMENTOS)
   Lógica de Interface, Integração com Google Apps Script e Quill
   ======================================================= */

const URL_BACKEND = "https://script.google.com/macros/s/AKfycbzGW_NlHX3IXbsmcH_q1jEpm7PHiwuiKJlGDMKtuJU88aSgETrwA9wUJgrIDoO7GUVQ/exec"; 
var quillDetalhamento;

// ESTADOS DA PAGINAÇÃO E DADOS GLOBAIS
let todosOrcamentos = []; 
let paginaAtual = 1;
const itensPorPagina = 10;

// Objeto de Filtros (Cliente -> Código -> Data Inicial / Data Final)
let filtroAtual = { cliente: '', codigo: '', dataInicio: '', dataFim: '' };

window.addEventListener('DOMContentLoaded', () => {
    configurarDataAtual();
    inicializarQuill();
    carregarDashboard(); 
});

// ==========================================================
// SISTEMA DE MODAL CUSTOMIZADO
// ==========================================================
function mostrarModal(mensagem, tipo = 'alerta', callbackConfirmacao = null) {
    const modal = document.getElementById('modal-sistema');
    const texto = document.getElementById('modal-texto');
    const botoes = document.getElementById('modal-botoes');
    
    texto.innerText = mensagem;
    botoes.innerHTML = ''; 
    
    if (tipo === 'alerta') {
        const btnOk = document.createElement('button');
        btnOk.className = 'btn btn-blue btn-novo';
        btnOk.innerText = 'OK';
        btnOk.onclick = () => { 
            modal.style.display = 'none'; 
            if (callbackConfirmacao) callbackConfirmacao();
        };
        botoes.appendChild(btnOk);
    } 
    else if (tipo === 'confirmacao') {
        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'btn btn-white btn-historico';
        btnCancelar.innerText = 'Cancelar';
        btnCancelar.onclick = () => { modal.style.display = 'none'; };
        
        const btnConfirmar = document.createElement('button');
        btnConfirmar.className = 'btn btn-danger';
        btnConfirmar.innerText = 'Sim, Excluir';
        btnConfirmar.onclick = () => {
            modal.style.display = 'none';
            if (callbackConfirmacao) callbackConfirmacao();
        };
        
        botoes.appendChild(btnCancelar);
        botoes.appendChild(btnConfirmar);
    }
    
    modal.style.display = 'flex';
}

// ==========================================================
// LÓGICA DE TELAS (SPA)
// ==========================================================
function alternarTela(telaAlvo) {
    const viewDashboard = document.getElementById('view-dashboard');
    const viewHistorico = document.getElementById('view-historico');
    const viewFormulario = document.getElementById('view-formulario');

    viewDashboard.classList.add('hidden');
    viewHistorico.classList.add('hidden');
    viewFormulario.classList.add('hidden');

    if (telaAlvo === 'dashboard') {
        viewDashboard.classList.remove('hidden');
        carregarDashboard(); 
    } else if (telaAlvo === 'historico') {
        viewHistorico.classList.remove('hidden');
        carregarHistorico(paginaAtual);
    } else if (telaAlvo === 'formulario') {
        viewFormulario.classList.remove('hidden');
    }
}

// ==========================================================
// LÓGICA DE DADOS, FILTROS E PAGINAÇÃO NO SERVIDOR
// ==========================================================
function aplicarFiltros() {
    filtroAtual.cliente = document.getElementById('filtro-cliente').value;
    filtroAtual.codigo = document.getElementById('filtro-codigo').value;
    filtroAtual.dataInicio = document.getElementById('filtro-data-inicio').value;
    filtroAtual.dataFim = document.getElementById('filtro-data-fim').value;
    paginaAtual = 1;
    carregarHistorico(paginaAtual);
}

function limparFiltros() {
    document.getElementById('filtro-cliente').value = '';
    document.getElementById('filtro-codigo').value = '';
    document.getElementById('filtro-data-inicio').value = '';
    document.getElementById('filtro-data-fim').value = '';
    filtroAtual = { cliente: '', codigo: '', dataInicio: '', dataFim: '' };
    paginaAtual = 1;
    carregarHistorico(paginaAtual);
}

function construirUrlQuery(pagina, limite) {
    const base = `${URL_BACKEND}?pagina=${pagina}&limite=${limite}`;
    const pCliente = filtroAtual.cliente ? `&cliente=${encodeURIComponent(filtroAtual.cliente)}` : '';
    const pCodigo = filtroAtual.codigo ? `&codigo=${encodeURIComponent(filtroAtual.codigo)}` : '';
    const pDataInicio = filtroAtual.dataInicio ? `&dataInicio=${encodeURIComponent(filtroAtual.dataInicio)}` : '';
    const pDataFim = filtroAtual.dataFim ? `&dataFim=${encodeURIComponent(filtroAtual.dataFim)}` : '';
    return base + pCliente + pCodigo + pDataInicio + pDataFim;
}

async function carregarDashboard() {
    const tabelaDashboard = document.getElementById('tabela-dashboard');
    const totalRegistradoTexto = document.getElementById('total-registrado');
    tabelaDashboard.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando dados... <i class="fas fa-spinner fa-spin"></i></td></tr>';
    
    try {
        const resposta = await fetch(`${URL_BACKEND}?pagina=1&limite=5`);
        const resultado = await resposta.json();
        
        if (resultado.sucesso) {
            const arrayDados = resultado.dados.orcamentos; 
            totalRegistradoTexto.innerText = resultado.dados.total;
            
            tabelaDashboard.innerHTML = '';
            if (arrayDados.length === 0) {
                tabelaDashboard.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum orçamento registrado.</td></tr>';
            } else {
                arrayDados.forEach(orcamento => {
                    tabelaDashboard.appendChild(criarLinhaTabela(orcamento));
                });
            }
        } else {
            tabelaDashboard.innerHTML = `<tr><td colspan="5" style="color: var(--error-color); text-align: center;">Erro: ${resultado.erro}</td></tr>`;
        }
    } catch (erro) {
        console.error(erro);
        tabelaDashboard.innerHTML = `<tr><td colspan="5" style="color: var(--error-color); text-align: center;">Erro de conexão.</td></tr>`;
    }
}

async function carregarHistorico(pagina) {
    const tabelaHistorico = document.getElementById('tabela-historico');
    tabelaHistorico.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando dados... <i class="fas fa-spinner fa-spin"></i></td></tr>';
    
    try {
        const resposta = await fetch(construirUrlQuery(pagina, itensPorPagina));
        const resultado = await resposta.json();
        
        if (resultado.sucesso) {
            todosOrcamentos = resultado.dados.orcamentos; 
            paginaAtual = resultado.dados.paginaAtual;
            const totalPaginas = resultado.dados.totalPaginas;
            
            tabelaHistorico.innerHTML = '';
            if (todosOrcamentos.length === 0) {
                tabelaHistorico.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum orçamento encontrado.</td></tr>';
            } else {
                todosOrcamentos.forEach(orcamento => {
                    tabelaHistorico.appendChild(criarLinhaTabela(orcamento));
                });
            }

            document.getElementById('pagina-info').innerText = `Página ${paginaAtual} de ${totalPaginas}`;
            document.getElementById('btn-prev').disabled = (paginaAtual <= 1);
            document.getElementById('btn-next').disabled = (paginaAtual >= totalPaginas);
        } else {
            tabelaHistorico.innerHTML = `<tr><td colspan="5" style="color: var(--error-color); text-align: center;">Erro: ${resultado.erro}</td></tr>`;
        }
    } catch (erro) {
        console.error(erro);
        tabelaHistorico.innerHTML = `<tr><td colspan="5" style="color: var(--error-color); text-align: center;">Erro de conexão.</td></tr>`;
    }
}

function criarLinhaTabela(orcamento) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="cliente-nome"><strong>${orcamento.cliente}</strong></td>
        <td>${orcamento.dataEmissao}</td>
        <td>${orcamento.valor}</td>
        <td><strong>${orcamento.codigo}</strong></td>
        <td>
            <div class="acoes actions">
                <button type="button" class="icon-btn icon-share" onclick="window.open('${orcamento.urlPdf}', '_blank')" title="Abrir PDF"><span class="material-icons">visibility</span></button>
                <button type="button" class="icon-btn icon-edit" onclick="editarOrcamento('${orcamento.codigo}')" title="Editar Orçamento"><span class="material-icons">edit</span></button>
                <button type="button" class="icon-btn icon-del" onclick="excluirArquivoDoDrive('${orcamento.urlPdf}')" title="Excluir Arquivo"><span class="material-icons">delete</span></button>
            </div>
        </td>
    `;
    return tr;
}

function mudarPagina(direcao) {
    carregarHistorico(paginaAtual + direcao);
}

// ==========================================================
// LÓGICA DE EXCLUSÃO DE ARQUIVO
// ==========================================================
function excluirArquivoDoDrive(urlPdf) {
    mostrarModal("Tem certeza que deseja apagar este orçamento?", "confirmacao", async () => {
        mostrarModal("Enviando comando de exclusão... Por favor, aguarde.", "aviso");

        try {
            const dados = { acao: "excluir_arquivo", urlArquivo: urlPdf };
            const resposta = await fetch(URL_BACKEND, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(dados)
            });
            const resultado = await resposta.json();

            if (resultado.sucesso) {
                mostrarModal("✅ " + resultado.mensagem, "alerta", () => {
                    if (!document.getElementById('view-dashboard').classList.contains('hidden')) {
                        carregarDashboard();
                    } else {
                        carregarHistorico(paginaAtual);
                    }
                });
            } else {
                mostrarModal("❌ Erro ao excluir: " + resultado.erro, "alerta");
            }
        } catch (erro) {
            mostrarModal("❌ Erro de conexão ao tentar excluir.", "alerta");
        }
    });
}

// ==========================================================
// LÓGICA DE EDIÇÃO DE ORÇAMENTO 
// ==========================================================
async function editarOrcamento(codigo) {
    mostrarModal("Carregando dados do orçamento...", "aviso");
    
    try {
        const resposta = await fetch(`${URL_BACKEND}?pagina=1&limite=1&codigo=${codigo}`);
        const res = await resposta.json();
        
        if(res.sucesso && res.dados.orcamentos.length > 0) {
            document.getElementById('modal-sistema').style.display = 'none';
            const orcamento = res.dados.orcamentos[0];

            document.getElementById('form-orcamento').reset();
            alternarTela('formulario');

            document.getElementById('cliente').value = orcamento.cliente || '';
            document.getElementById('endereco').value = orcamento.endereco || '';
            document.getElementById('garantia').value = orcamento.garantia || '';
            
            if (typeof quillDetalhamento !== 'undefined') {
                quillDetalhamento.root.innerHTML = orcamento.detalhamento || '';
            }
            
            if (orcamento.valor) {
                let valorLimpo = orcamento.valor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
                document.getElementById('valor').value = parseFloat(valorLimpo).toFixed(2);
            }

            if (orcamento.dataEmissao && orcamento.dataEmissao.includes('/')) {
                const partes = orcamento.dataEmissao.split('/');
                document.getElementById('dataEmissao').value = `${partes[2]}-${partes[1]}-${partes[0]}`;
            }

            if (orcamento.configuracaoJson && orcamento.configuracaoJson !== "{}") {
                const config = JSON.parse(orcamento.configuracaoJson);
                
                for (const [id, valor] of Object.entries(config)) {
                    const elemento = document.getElementById(id);
                    if (elemento) {
                        if (elemento.type === 'checkbox') {
                            elemento.checked = valor;
                        } else {
                            elemento.value = valor;
                        }
                    }
                }

                acaoDesinsetizacao(document.getElementById('master-desinsetizacao').checked, true);
                toggleSecao('sec-descupinizacao', document.getElementById('master-descupinizacao').checked);
                toggleOutros();

                mostrarModal("Dados restaurados! Revise e clique em Gerar.", "alerta");
            }
        } else {
            mostrarModal("❌ Não foi possível carregar os dados para edição.", "alerta");
        }
    } catch(e) {
        mostrarModal("❌ Erro de conexão ao tentar editar.", "alerta");
    }
}

// ==========================================================
// FORMULÁRIO: LÓGICA E REGRAS DE NEGÓCIO
// ==========================================================
function configurarDataAtual() {
    const dataEmissaoInput = document.getElementById('dataEmissao');
    const d = new Date();
    dataEmissaoInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function inicializarQuill() {
    quillDetalhamento = new Quill('#editor-detalhamento', {
        theme: 'snow',
        modules: { toolbar: [['bold', 'italic', 'underline'], [{'list': 'ordered'}, {'list': 'bullet'}], [{'align': []}], ['clean']] },
        placeholder: 'Descreva os detalhes do serviço usando formatação...'
    });
}

function acaoDesinsetizacao(isChecked, eEdicao = false) {
    toggleSecao('sec-desinsetizacao', isChecked);
    atualizarGarantia();
    sincronizarServicoParaPraga('desinsetizacao', isChecked);
    
    if (!eEdicao) {
        document.getElementById('b1-pulverizacao').checked = isChecked;
        document.getElementById('b1-gel').checked = isChecked;
        document.getElementById('b1-polvilhamento').checked = isChecked;
        document.getElementById('b1-spray').checked = isChecked;
    }
}

function sincronizarServicoParaPraga(servico, isChecked) {
    if (servico === 'desinsetizacao') { ['baratas', 'formigas', 'aranhas'].forEach(id => { const cb = document.getElementById('praga-' + id); if(cb) cb.checked = isChecked; }); }
    else if (servico === 'descupinizacao') { const cb = document.getElementById('praga-cupins'); if(cb) cb.checked = isChecked; }
    else if (servico === 'desratizacao') { const cb = document.getElementById('praga-roedores'); if(cb) cb.checked = isChecked; }
    else if (servico === 'caramujos') { const cb = document.getElementById('praga-caramujos'); if(cb) cb.checked = isChecked; }
}

function sincronizarPragaParaServico(praga, isChecked) {
    if (praga === 'cupins') { document.getElementById('master-descupinizacao').checked = isChecked; toggleSecao('sec-descupinizacao', isChecked); atualizarGarantia(); }
    else if (praga === 'roedores') { document.getElementById('master-desratizacao').checked = isChecked; atualizarGarantia(); }
    else if (praga === 'caramujos') { document.getElementById('master-caramujos').checked = isChecked; atualizarGarantia(); }
}

function toggleOutros() {
    const cb = document.getElementById('praga-outros'), input = document.getElementById('praga-outros-texto');
    input.style.display = cb.checked ? 'block' : 'none'; input.required = cb.checked;
    if(!cb.checked) input.value = '';
}

function toggleSecao(idSecao, mostrar) { document.getElementById(idSecao).style.display = mostrar ? 'block' : 'none'; }

function atualizarGarantia() {
    const gar = [];
    const d1 = document.getElementById('master-desinsetizacao').checked, d2 = document.getElementById('master-desratizacao').checked;
    if (d1 && d2) gar.push("Os serviços de Desinsetização e Desratização possuem garantia de 90 dias.");
    else { if (d1) gar.push("O serviço de Desinsetização possui garantia de 90 dias."); if (d2) gar.push("O serviço de Desratização possui garantia de 90 dias."); }
    if (document.getElementById('master-descupinizacao').checked) gar.push("O serviço de Descupinização possui garantia de 180 dias.");
    if (document.getElementById('master-caramujos').checked) gar.push("O serviço de Controle de Caramujos possui garantia de 90 dias.");
    if (document.getElementById('master-reservatorios').checked) gar.push("O serviço de Limpeza e Desinfecção de Reservatórios possui garantia de 180 dias.");
    if (document.getElementById('master-capina').checked) gar.push("O serviço de Capina Química possui garantia técnica de 180 dias.");
    document.getElementById('garantia').value = gar.join('\n');
}

function formatarValorSimples(valor) {
    if (!valor) return "";
    return parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataSimples(iso) {
    if (!iso) return ""; 
    const p = iso.split('-'); 
    if (p.length !== 3) return iso;
    return `${p[2]}/${p[1]}/${p[0]}`;
}

async function enviarFormulario() {
    const btn = document.getElementById('btn-gerar');
    const cli = document.getElementById('cliente').value, end = document.getElementById('endereco').value, dt = document.getElementById('dataEmissao').value, vl = document.getElementById('valor').value;
    let det = quillDetalhamento.root.innerHTML; if(det === '<p><br></p>') det = '';

    if(!cli || !end || !dt || !vl) { 
        mostrarModal("❌ Preencha Cliente, Endereço, Data e Valor.", "alerta"); 
        return; 
    }

    const md1 = document.getElementById('master-desinsetizacao').checked, md2 = document.getElementById('master-desratizacao').checked, mc = document.getElementById('master-caramujos').checked, md3 = document.getElementById('master-descupinizacao').checked, mr = document.getElementById('master-reservatorios').checked, mq = document.getElementById('master-capina').checked;
    if (!md1 && !md2 && !mc && !md3 && !mr && !mq) { 
        mostrarModal("❌ Selecione ao menos um serviço.", "alerta"); 
        return; 
    }

    let prg = Array.from(document.querySelectorAll('input[name="praga"]:checked')).map(cb => cb.value);
    if (document.getElementById('praga-outros').checked) { const tx = document.getElementById('praga-outros-texto').value.trim(); if (tx) prg.push(tx); }
    if (prg.length === 0) { 
        mostrarModal("❌ Selecione pelo menos uma praga.", "alerta"); 
        return; 
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando Orçamento...'; 
    btn.disabled = true; 
    
    mostrarModal("Enviando dados e montando PDF. Por favor, aguarde...", "aviso");

    const configuracaoFormulario = {};
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        if (cb.id) configuracaoFormulario[cb.id] = cb.checked;
    });
    configuracaoFormulario['praga-outros-texto'] = document.getElementById('praga-outros-texto').value;

    const dados = {
        cliente: cli, endereco: end, dataEmissaoBruta: dt, dataEmissaoExtenso: formatarDataSimples(dt), pragasAlvo: prg.join(', '), valorFinal: formatarValorSimples(vl), garantia: document.getElementById('garantia').value, detalhamento: det, configuracaoJson: JSON.stringify(configuracaoFormulario), 
        opcoes: {
            b1_pulverizacao: md1 && document.getElementById('b1-pulverizacao').checked, b1_gel: md1 && document.getElementById('b1-gel').checked, b1_polvilhamento: md1 && document.getElementById('b1-polvilhamento').checked, b1_spray: md1 && document.getElementById('b1-spray').checked, b2_pulverizacao_repouso: md1 && document.getElementById('b2-pulverizacao-repouso').checked, b2_pulverizacao_focos: md1 && document.getElementById('b2-pulverizacao-focos').checked, b2_atomizacao: md1 && document.getElementById('b2-atomizacao').checked, b2_termonebulizacao: md1 && document.getElementById('b2-termonebulizacao').checked, b2_armadilhas: md1 && document.getElementById('b2-armadilhas').checked, b3_iscagem: md2, b4_caramujos: mc, b6_limpeza: mr, b7_capina: mq,
            b5_injecao: md3 && document.getElementById('b5-injecao').checked, b5_pincelamento: md3 && document.getElementById('b5-pincelamento').checked, b5_barreira: md3 && document.getElementById('b5-barreira').checked, b5_cobertura_livre: md3 && document.getElementById('b5-cobertura-livre').checked, b5_cobertura_forrada: md3 && document.getElementById('b5-cobertura-forrada').checked,
            b8_certificado: document.getElementById('b8-certificado').checked, b8_cronograma: document.getElementById('b8-cronograma').checked, b8_fds: document.getElementById('b8-fds').checked, b8_mapeamento: document.getElementById('b8-mapeamento').checked, b8_relatorio_inspecao: document.getElementById('b8-relatorio-inspecao').checked, b8_relatorio_quantitativo: document.getElementById('b8-relatorio-quantitativo').checked, b8_relatorio_naoconformidade: document.getElementById('b8-relatorio-naoconformidade').checked
        }
    };

    try {
        const r = await fetch(URL_BACKEND, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(dados) });
        const res = await r.json();
        
        if (res.sucesso) { 
            mostrarModal(`✅ Orçamento gerado com sucesso!\nCódigo: ${res.codigo}`, "alerta", () => {
                document.getElementById('form-orcamento').reset(); 
                quillDetalhamento.root.innerHTML = ''; 
                
                toggleSecao('sec-desinsetizacao', false);
                toggleSecao('sec-descupinizacao', false);
                
                alternarTela('dashboard');
            });
        } 
        else { 
            mostrarModal("❌ Erro: " + res.erro, "alerta"); 
        }
    } catch (e) { 
        mostrarModal("❌ Erro de conexão ao tentar gerar.", "alerta"); 
    } 
    finally { 
        btn.innerHTML = '<i class="fas fa-file-invoice"></i> Gerar Orçamento'; 
        btn.disabled = false; 
    }
}
