// script.js - Versão FINAL com Lógica de Lote 3-em-3

// ##################################################################
//  COLE A URL DA SUA API (DO GOOGLE APPS SCRIPT) AQUI
// ##################################################################
const API_URL = "https://script.google.com/macros/s/AKfycbwdo-HzLZF1-_cOOJAG9L79y59kNEpaH52fdp2nuVIAGif5A3XX-dWnZ8eXouev1xXYQg/exec"; 
// ##################################################################


// --- Configuração dos Dados (AGORA VAZIOS, VIRÃO DA API) ---
let configMercado = {};
let produtos = [];
// --- Fim da Configuração ---


// Elementos do DOM
const logoContainer = document.getElementById('logo-container');
const produtoContainer = document.getElementById('produto-container');
const descricaoContainer = document.getElementById('descricao-container');
const precoContainer = document.getElementById('preco-container');

const logoImg = document.getElementById('logo-img');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');

const elementosAnimadosProduto = [produtoContainer, descricaoContainer, precoContainer];

// --- NOVAS CONSTANTES DE TEMPO ---
const PRODUTOS_POR_LOTE = 3; // Mostrar 3 produtos
const DURACAO_TOTAL_SLOT = 15000; // 15 segundos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / PRODUTOS_POR_LOTE; // 5000ms (5s) por produto

const ANIMATION_DELAY = 800; // 0.8s
const EXIT_ANIMATION_DURATION = 500; // 0.5s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Função para APLICAR A CONFIGURAÇÃO DO MERCADO (Cores e Logo)
//    (Permanece igual - roda apenas uma vez no início)
function applyConfig(config) {
    document.documentElement.style.setProperty('--cor-fundo-principal', config.COR_FUNDO_PRINCIPAL);
    document.documentElement.style.setProperty('--cor-fundo-secundario', config.COR_FUNDO_SECUNDARIO);
    document.documentElement.style.setProperty('--cor-texto-descricao', config.COR_TEXTO_DESCRICAO);
    document.documentElement.style.setProperty('--cor-texto-preco', config.COR_TEXTO_PRECO);
    logoImg.src = config.LOGO_MERCADO_URL;
    logoContainer.classList.add('slideInUp'); 
}

// 2. Função para ATUALIZAR o conteúdo do PRODUTO (Permanece igual)
function updateContent(item) {
    produtoImg.src = item.IMAGEM_PRODUTO_URL;
    descricaoTexto.textContent = item.NOME_PRODUTO;
    precoTexto.textContent = item.PRECO;

    const precoElement = document.getElementById('preco-texto');
    precoContainer.classList.remove('typewriter');
    void precoContainer.offsetWidth; 
    precoContainer.style.animation = 'none'; 
    
    const steps = (item.PRECO && item.PRECO.length > 0) ? item.PRECO.length : 1;
    const duration = steps * 0.15; 
    
    precoContainer.style.animation = `typewriter ${duration}s steps(${steps}) forwards`;
}

// 3. Função para EXECUTAR a sequência de animação de ENTRADA do PRODUTO (Permanece igual)
async function playEntranceAnimation() {
    elementosAnimadosProduto.forEach(el => el.classList.remove('fadeOut'));
    produtoContainer.classList.add('slideInRight');
    await sleep(ANIMATION_DELAY);
    descricaoContainer.classList.add('slideInLeft');
    await sleep(ANIMATION_DELAY);
    precoContainer.classList.add('typewriter');
}

// 4. Função para EXECUTAR a animação de SAÍDA do PRODUTO (Permanece igual)
async function playExitAnimation() {
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado';
        el.classList.add('fadeOut');
    });
    await sleep(EXIT_ANIMATION_DURATION);
    elementosAnimadosProduto.forEach(el => el.classList.add('hidden'));
}


// 5. NOVA FUNÇÃO: Roda a "Micro-Rotação" (os 3 produtos)
function runInternalRotation(items) {
    
    // Função que mostra o próximo produto (a cada 5s)
    async function showNextProduct(subIndex) {
        // Pega o item (com loop). Ex: 3 produtos, item 0, 1, 2.
        // Se a planilha só tiver 2 produtos, o índice 2 (2 % 2) vira 0.
        // Isso garante que ele mostre 1-2-1.
        const item = items[subIndex % items.length];
        
        // Animação de Saída (só não roda no primeiro item, pois a tela está limpa)
        if (subIndex > 0) {
            await playExitAnimation();
        }

        // Atualiza conteúdo
        updateContent(item);
        
        // Animação de Entrada
        await playEntranceAnimation();
    }

    // 1. Mostra o item 0 do lote (e.g., prod 4) IMEDIATAMENTE
    showNextProduct(0);
    
    // 2. Agenda o item 1 do lote (e.g., prod 5) para 5s
    setTimeout(() => showNextProduct(1), DURACAO_POR_PRODUTO);
    
    // 3. Agenda o item 2 do lote (e.g., prod 6) para 10s
    setTimeout(() => showNextProduct(2), DURACAO_POR_PRODUTO * 2);

    // Aos 15s, o player DSPLAY vai matar este template e seguir a grade.
}


// 6. FUNÇÃO DE INICIALIZAÇÃO (Totalmente Modificada para Lotes)
async function init() {
    try {
        // --- ETAPA DE CARREGAMENTO DA API (Igual) ---
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Falha ao carregar dados da API: ' + response.statusText);
        }
        const data = await response.json();
        
        configMercado = data.configMercado;
        produtos = data.produtos;
        
        if (!produtos || produtos.length === 0) {
            console.error("Nenhum produto encontrado na API.");
            descricaoTexto.textContent = "Erro: Nenhum produto na planilha.";
            return;
        }
        // --- FIM DA ETAPA DE CARREGAMENTO ---

        
        // --- NOVA LÓGICA DE ROTAÇÃO DE LOTE ---

        // 1. Aplica as cores e o logo do mercado (só roda 1 vez)
        applyConfig(configMercado);
        
        // 2. Calcula quantos lotes de 3 nós temos. (Ex: 10 produtos = 4 lotes)
        const totalBatches = Math.ceil(produtos.length / PRODUTOS_POR_LOTE);

        // 3. Pega o índice do ÚLTIMO LOTE salvo no player.
        //    Usamos 'ultimo_lote_promo' para não conflitar com a lógica antiga.
        const savedBatchIndex = parseInt(localStorage.getItem('ultimo_lote_promo') || 0);
        
        // 4. Garante que o índice é válido (se mudou a lista, ele reseta)
        const currentBatchIndex = savedBatchIndex % totalBatches;

        // 5. Calcula qual é o PRÓXIMO lote para a PRÓXIMA vez que o player rodar
        const nextBatchIndex = (currentBatchIndex + 1) % totalBatches;
        
        // 6. SALVA O PRÓXIMO LOTE IMEDIATAMENTE!
        //    O player "lembra" que da próxima vez deve mostrar o lote 'nextBatchIndex'.
        localStorage.setItem('ultimo_lote_promo', nextBatchIndex);

        // 7. Pega os 3 produtos para AGORA (o lote atual)
        const startIndex = currentBatchIndex * PRODUTOS_POR_LOTE;
        
        const itemsToShow = [
            produtos[startIndex], 
            produtos[startIndex + 1], 
            produtos[startIndex + 2]
        ].filter(Boolean); // '.filter(Boolean)' remove 'undefined' se o lote for incompleto

        // --- FIM DA LÓGICA DE LOTE ---

        // 8. Inicia a micro-rotação (5s, 5s, 5s) com os produtos que separamos
        runInternalRotation(itemsToShow);

    } catch (error) {
        console.error("Erro no init():", error);
        descricaoTexto.textContent = "Erro ao carregar API. Verifique o console.";
    }
}

// Inicia tudo
window.onload = init;