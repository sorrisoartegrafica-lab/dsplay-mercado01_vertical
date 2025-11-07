// script.js - Versão COMERCIAL (com Parâmetro de API)

// ##################################################################
//  MUDANÇA CRÍTICA: Lendo a API da URL
// ##################################################################

// 1. Pega os parâmetros da URL da página (ex: ...?api=https://...)
const queryParams = new URLSearchParams(window.location.search);

// 2. Pega a URL da API do parâmetro chamado 'api'
const API_URL = queryParams.get('api');

// ##################################################################


// --- Chave para o Cache ---
// MUDANÇA: O cache agora é baseado na URL da API
const CACHE_KEY = `supermercado_api_cache_${API_URL}`;

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
// NOVO: A caixinha principal
const infoInferiorWrapper = document.getElementById('info-inferior-wrapper');


const logoImg = document.getElementById('logo-img');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');
const seloImg = document.getElementById('selo-img');
// Itens dentro da caixinha
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');


// Itens Estáticos (Só animam 1 vez)
const elementosEstaticosAnimados = [logoContainer]; // SÓ O LOGO
// Itens Rotativos (Animam a cada 5s)
const elementosAnimadosProduto = [
    produtoContainer, 
    descricaoContainer, 
    precoContainer, 
    seloContainer, 
    infoInferiorWrapper // A "CAIXINHA" inteira
];


// --- Constantes de Tempo ---
const PRODUTOS_POR_LOTE = 3; // Mostrar 3 produtos
const DURACAO_TOTAL_SLOT = 15000; // 15 segundos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / PRODUTOS_POR_LOTE; // 5000ms (5s) por produto

const ANIMATION_DELAY = 1000; // 1 segundo (dando mais tempo para a animação do preço)
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
    qrTexto.textContent = config.QR_TEXTO; // O texto é estático
    document.documentElement.style.setProperty('--cor-seta-qr', config.QR_COR_SETA || '#00A300'); // A cor é estática

    // Anima a entrada do logo (o único item estático)
    elementosEstaticosAnimados.forEach(el => el.classList.add('slideInUp'));
}

// 2. Função para ATUALIZAR o conteúdo do PRODUTO (itens que rotacionam)
function updateContent(item) {
    // Atualiza os itens rotativos
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
    // Duração da animação do preço
    const duration = (steps * 0.15 < 1) ? steps * 0.15 : 1; // Máx de 1s
    
    precoContainer.style.animation = `typewriter ${duration}s steps(${steps}) forwards`;
}

// 3. Sincronia da Animação de ENTRADA
async function playEntranceAnimation() {
    // Remove o 'fadeOut' de todos os 5 elementos
    elementosAnimadosProduto.forEach(el => el.classList.remove('fadeOut'));
    
    // Inicia TODAS as animações ao mesmo tempo (em paralelo)
    produtoContainer.classList.add('slideInRight');
    seloContainer.classList.add('slideInLeft');
    descricaoContainer.classList.add('slideInLeft');
    infoInferiorWrapper.classList.add('slideInUp'); // A "Caixinha" inteira
    precoContainer.classList.add('typewriter'); // Preço entra JUNTO
    
    // Apenas espera o tempo da animação mais longa (1s)
    await sleep(ANIMATION_DELAY); 
}

// 4. Função para EXECUTAR a animação de SAÍDA do PRODUTO
async function playExitAnimation() {
    // Todos os 5 itens rotativos saem juntos
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
    
    // --- MUDANÇA: Verificação da API ---
    if (!API_URL) {
        console.error("Erro: URL da API não fornecida na URL da página.");
        console.error("Use: .../index.html?api=SUA_URL_DA_API_AQUI");
        // Mostra um erro na tela do player
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro de Configuração: URL da API não encontrada.</h1><p style="color: white; font-family: Arial;">Adicione <strong>?api=[SUA_URL_DA_API]</strong> ao final da URL no DSPLAY.</p>`;
        return;
    }
    
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
            document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao Carregar API</h1><p style="color: white; font-family: Arial;">Verifique a URL da API e a conexão de rede.<br>API: ${API_URL}</p>`;
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
            // Não pare aqui, apenas mostre um aviso (o cache pode estar vazio)
        }

        // Aplica todos os itens estáticos (Logo, Texto do QR, Cores)
        applyConfig(configMercado);
        
        // Só roda a rotação se tiver produtos
        if (produtos && produtos.length > 0) {
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
        } else {
            // Mostra um aviso se a planilha estiver vazia
            descricaoTexto.textContent = "Nenhum produto cadastrado.";
            descricaoContainer.classList.add('slideInLeft');
        }

    } catch (error) {
        console.error("Erro ao executar o template:", error);
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao ler dados da planilha.</h1><p style="color: white; font-family: Arial;">Verifique se a planilha está formatada corretamente.</p>`;
    }
}

// 9. Pré-carregamento de Imagens
function preloadImages(produtosArray, config) {
    console.log("Iniciando pré-carregamento de imagens...");
    // Pré-carrega imagens dos produtos (Produto, Selo, QR)
    if (produtosArray) {
        produtosArray.forEach(produto => {
            if (produto.IMAGEM_PRODUTO_URL) (new Image()).src = produto.IMAGEM_PRODUTO_URL;
            if (produto.SELO_URL) (new Image()).src = produto.SELO_URL;
            if (produto.QR_CODE_URL) (new Image()).src = produto.QR_CODE_URL;
        });
    }
    
    // Pré-carrega imagem da config (Logo)
    if (config && config.LOGO_MERCADO_URL) (new Image()).src = config.LOGO_MERCADO_URL;
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
