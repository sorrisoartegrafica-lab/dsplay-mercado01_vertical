// script.js - Layout Final com FRASE FIXA

// ##################################################################
//  COLE A URL DA SUA API (DO GOOGLE APPS SCRIPT) AQUI
// ##################################################################
const API_URL = "https://script.google.com/macros/s/AKfycbwdo-HzLZF1-_cOOJAG9L79y59kNEpaH52fdp2nuVIAGif5A3XX-dWnZ8eXouev1xXYQg/exec"; 
// ##################################################################

// --- Chave para o Cache ---
const CACHE_KEY = 'supermercado_api_cache';

// --- Configuração dos Dados (AGORA VAZIOS, VIRÃO DA API OU CACHE) ---
let configMercado = {};
let produtos = [];
// --- Fim da Configuração ---


// Elementos do DOM
const logoContainer = document.getElementById('logo-container');
const produtoContainer = document.getElementById('produto-container');
const descricaoContainer = document.getElementById('descricao-container');
const precoContainer = document.getElementById('preco-container');
const seloContainer = document.getElementById('selo-container');
const qrcodeContainer = document.getElementById('qrcode-container');
const qrTextoContainer = document.getElementById('qr-texto-container');


const logoImg = document.getElementById('logo-img');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');
const seloImg = document.getElementById('selo-img');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');


// --- MUDANÇA NA LÓGICA DE ANIMAÇÃO (Frase Fixa) ---
// Itens Estáticos (Só animam 1 vez)
const elementosEstaticosAnimados = [logoContainer, qrTextoContainer]; // Logo e Frase da Seta
// Itens Rotativos (Animam a cada 5s)
const elementosAnimadosProduto = [
    produtoContainer, 
    descricaoContainer, 
    precoContainer, 
    seloContainer, 
    qrcodeContainer // Caixa da Seta REMOVIDA daqui
];
// --- FIM DA MUDANÇA ---


// --- Constantes de Tempo ---
const PRODUTOS_POR_LOTE = 3; // Mostrar 3 produtos
const DURACAO_TOTAL_SLOT = 15000; // 15 segundos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / PRODUTOS_POR_LOTE; // 5000ms (5s) por produto

const ANIMATION_DELAY = 800; // 0.8s
const EXIT_ANIMATION_DURATION = 500; // 0.5s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Função para APLICAR A CONFIGURAÇÃO DO MERCADO (Itens Estáticos)
function applyConfig(config) {
    // Aplica Cores Globais
    document.documentElement.style.setProperty('--cor-fundo-principal', config.COR_FUNDO_PRINCIPAL);
    document.documentElement.style.setProperty('--cor-fundo-secundario', config.COR_FUNDO_SECUNDARIO);
    document.documentElement.style.setProperty('--cor-texto-descricao', config.COR_TEXTO_DESCRICAO);
    document.documentElement.style.setProperty('--cor-texto-preco', config.COR_TEXTO_PRECO);
    
    // Aplica Itens Estáticos (Logo, Texto da Seta, Cor da Seta)
    logoImg.src = config.LOGO_MERCADO_URL;
    qrTexto.textContent = config.QR_TEXTO;
    document.documentElement.style.setProperty('--cor-seta-qr', config.QR_COR_SETA || '#00A300');

    // --- MUDANÇA ---
    // Anima a entrada dos elementos estáticos (Logo e Frase da Seta)
    elementosEstaticosAnimados.forEach(el => el.classList.add('slideInUp'));
}

// 2. Função para ATUALIZAR o conteúdo do PRODUTO (itens que rotacionam)
function updateContent(item) {
    // Atualiza os itens rotativos (Selo, QR, etc)
    produtoImg.src = item.IMAGEM_PRODUTO_URL;
    descricaoTexto.textContent = item.NOME_PRODUTO;
    precoTexto.textContent = item.PRECO;
    seloImg.src = item.SELO_URL;
    qrcodeImg.src = item.QR_CODE_URL;

    // Prepara a animação de máquina de escrever
    const precoElement = document.getElementById('preco-texto');
    precoContainer.classList.remove('typewriter');
    void precoContainer.offsetWidth; 
    precoContainer.style.animation = 'none'; 
    
    const steps = (item.PRECO && item.PRECO.length > 0) ? item.PRECO.length : 1;
    const duration = steps * 0.15; 
    
    precoContainer.style.animation = `typewriter ${duration}s steps(${steps}) forwards`;
}

// 3. Função para EXECUTAR a sequência de animação de ENTRADA do PRODUTO
async function playEntranceAnimation() {
    elementosAnimadosProduto.forEach(el => el.classList.remove('fadeOut'));
    
    // Animação em paralelo para economizar tempo
    produtoContainer.classList.add('slideInRight');
    seloContainer.classList.add('slideInLeft');
    descricaoContainer.classList.add('slideInLeft');
    qrcodeContainer.classList.add('slideInUp'); // QR entra de baixo
    // --- MUDANÇA: 'qrTextoContainer' removido desta animação ---
    
    await sleep(ANIMATION_DELAY); // Espera a animação principal

    // Preço entra por último
    precoContainer.classList.add('typewriter');
}

// 4. Função para EXECUTAR a animação de SAÍDA do PRODUTO
async function playExitAnimation() {
    // --- MUDANÇA: Apenas os 5 itens rotativos saem ---
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado';
        el.classList.add('fadeOut');
    });
    await sleep(EXIT_ANIMATION_DURATION);
    elementosAnimadosProduto.forEach(el => el.classList.add('hidden'));
}

// 5. Roda a "Micro-Rotação" (os 3 produtos)
function runInternalRotation(items) {
    async function showNextProduct(subIndex) {
        const item = items[subIndex % items.length];
        if (subIndex > 0) {
            await playExitAnimation();
        }
        updateContent(item);
        await playEntranceAnimation();
    }
    showNextProduct(0);
    setTimeout(() => showNextProduct(1), DURACAO_POR_PRODUTO);
    setTimeout(() => showNextProduct(2), DURACAO_POR_PRODUTO * 2);
}


// 6. FUNÇÃO DE INICIALIZAÇÃO (Lógica de Cache)
async function init() {
    let cachedData = null;
    try {
        const cachedString = localStorage.getItem(CACHE_KEY);
        if (cachedString) {
            cachedData = JSON.parse(cachedString);
            console.log("Template carregado do cache.");
        }
    } catch (e) {
        console.error("Erro ao ler cache", e);
        cachedData = null;
    }

    if (cachedData) {
        runTemplate(cachedData);
        fetchFromNetwork(); // Atualiza em segundo plano
    } else {
        console.log("Cache vazio. Buscando da rede...");
        try {
            const newData = await fetchFromNetwork(); 
            if(newData) {
                runTemplate(newData); 
            } else {
                throw new Error("Falha ao buscar dados da rede");
            }
        } catch (error) {
            console.error("Erro no init() sem cache:", error);
            descricaoTexto.textContent = "Erro ao carregar API.";
        }
    }
}

// 7. Busca dados da rede e salva no cache
async function fetchFromNetwork() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Resposta da rede não foi OK');
        const data = await response.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log("Cache atualizado com novos dados da rede.");

        if (data.produtos) {
            preloadImages(data.produtos, data.configMercado);
        }
        
        return data;
    } catch (error) {
        console.error("Falha ao buscar dados da rede:", error);
        return null; 
    }
}

// 8. Lógica de exibição
function runTemplate(data) {
    try {
        configMercado = data.configMercado;
        produtos = data.produtos;
        
        if (!produtos || produtos.length === 0) {
            console.error("Nenhum produto nos dados.");
            descricaoTexto.textContent = "Erro: Nenhum produto na planilha.";
            return;
        }

        // Aplica todos os itens estáticos (Logo, Texto do QR, Cores)
        applyConfig(configMercado);
        
        const totalBatches = Math.ceil(produtos.length / PRODUTOS_POR_LOTE);
        const savedBatchIndex = parseInt(localStorage.getItem('ultimo_lote_promo') || 0);
        const currentBatchIndex = savedBatchIndex % totalBatches;
        const nextBatchIndex = (currentBatchIndex + 1) % totalBatches;
        localStorage.setItem('ultimo_lote_promo', nextBatchIndex);

        const startIndex = currentBatchIndex * PRODUTOS_POR_LOTE;
        const itemsToShow = [
            produtos[startIndex], 
            produtos[startIndex + 1], 
            produtos[startIndex + 2]
        ].filter(Boolean); 

        // Inicia a rotação dos itens dinâmicos
        runInternalRotation(itemsToShow);

    } catch (error) {
        console.error("Erro ao executar o template:", error);
        descricaoTexto.textContent = "Erro ao exibir dados.";
    }
}

// 9. Pré-carregamento de Imagens
function preloadImages(produtosArray, config) {
    console.log("Iniciando pré-carregamento de imagens...");
    // Pré-carrega imagens dos produtos (Produto, Selo, QR)
    produtosArray.forEach(produto => {
        if (produto.IMAGEM_PRODUTO_URL) (new Image()).src = produto.IMAGEM_PRODUTO_URL;
        if (produto.SELO_URL) (new Image()).src = produto.SELO_URL;
        if (produto.QR_CODE_URL) (new Image()).src = produto.QR_CODE_URL;
    });
    
    // Pré-carrega imagem da config (Logo)
    if (config.LOGO_MERCADO_URL) (new Image()).src = config.LOGO_MERCADO_URL;
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
