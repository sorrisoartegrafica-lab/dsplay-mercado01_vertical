// script.js - ATUALIZADO PARA A NOVA API (get_video_data)
// CORRIGIDO: Lógica de animação "Sai -> Entra"

// ##################################################################
//  Lendo a API com 'video_id'
// ##################################################################
const queryParams = new URLSearchParams(window.location.search);
const video_id = queryParams.get('video_id'); // Pega o 'video_id' da URL
const API_URL_BASE = "https://bluemdia.bubbleapps.io/version-test/api/1.1/wf/get_video_data";
const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;
// ##################################################################


// --- Chave para o Cache ---
const CACHE_KEY = `supermercado_api_cache_${video_id}`;
// --- Configuração dos Dados (AGORA VAZIOS, VIRÃO DA API OU CACHE) ---
let configCliente = {};
let configTemplate = {};
let produtos = [];
// --- Fim da Configuração ---


// Elementos do DOM
const logoContainer = document.getElementById('logo-container');
const produtoContainer = document.getElementById('produto-container');
const descricaoContainer = document.getElementById('descricao-container');
const precoContainer = document.getElementById('preco-container');
const seloContainer = document.getElementById('selo-container');
const infoInferiorWrapper = document.getElementById('info-inferior-wrapper');


const logoImg = document.getElementById('logo-img');
const produtoImg = document.getElementById('produto-img');
const descricaoTexto = document.getElementById('descricao-texto');
const precoTexto = document.getElementById('preco-texto');
const seloImg = document.getElementById('selo-img');
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
const DURACAO_TOTAL_SLOT = 15000;
// 15 segundos
// A API retorna 3 produtos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / 3; // 5000ms (5s) por produto

const ANIMATION_DELAY = 800; // 0.8s (tempo da animação de entrada)
const EXIT_ANIMATION_DURATION = 500; // 0.5s (tempo da animação de saída)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Mapeando o novo JSON 'configTemplate' e 'configCliente'
function applyConfig(configC, configT) {
    document.documentElement.style.setProperty('--cor-fundo-principal', configT.cor_01_text);
    document.documentElement.style.setProperty('--cor-fundo-secundario', configT.cor_02_text);
    document.documentElement.style.setProperty('--cor-texto-descricao', configT.cor_texto_01_text);
    document.documentElement.style.setProperty('--cor-texto-preco', configT.cor_texto_02_text);
    document.documentElement.style.setProperty('--cor-seta-qr', configT.cor_03_text || '#00A300'); // cor_03_text é a cor da seta
    
    const prefixoURL = 'https:';
    if (configC.logo_mercado_url_text) { 
        logoImg.src = prefixoURL + configC.logo_mercado_url_text;
    }
    
    elementosEstaticosAnimados.forEach(el => el.classList.add('slideInUp'));
}

// 2. Mapeando os 'produtos' do novo JSON
function updateContent(item) {
    const prefixoURL = 'https:';
    
    produtoImg.src = prefixoURL + item.imagem_produto_text;
    descricaoTexto.textContent = item.nome_text;
    precoTexto.textContent = item.valor_text;
    seloImg.src = prefixoURL + item.selo_produto_text;
    qrcodeImg.src = prefixoURL + item.t_qr_produto_text;
    
    qrTexto.textContent = item.texto_qr_text;
}

// 3. Sincronia da Animação de ENTRADA
async function playEntranceAnimation() {
    // 1. Reseta classes de SAÍDA
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado'; // Reseta tudo
    });
    
    // 2. Adiciona classes de ENTRADA
    produtoContainer.classList.add('slideInRight');
    seloContainer.classList.add('slideInLeft');
    descricaoContainer.classList.add('slideInLeft');
    precoContainer.classList.add('slideInLeft');
    infoInferiorWrapper.classList.add('slideInUp');
    
    // 3. Espera a animação de entrada terminar
    await sleep(ANIMATION_DELAY); 
}

// 4. Animação de SAÍDA
async function playExitAnimation() {
    // 1. Reseta classes de ENTRADA
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado'; // Reseta tudo
    });

    // 2. Adiciona classes de SAÍDA
    produtoContainer.classList.add('slideOutRight');
    seloContainer.classList.add('slideOutLeft');
    descricaoContainer.classList.add('slideOutLeft');
    precoContainer.classList.add('slideOutLeft');
    infoInferiorWrapper.classList.add('slideOutDown');

    // 3. ESPERA a animação de saída terminar
    await sleep(EXIT_ANIMATION_DURATION);
}


// 5. Roda a "Micro-Rotação" (com lógica 'await' correta)
async function runInternalRotation(items) {
    
    // 1. Mostra o primeiro item (só ENTRADA)
    updateContent(items[0]);
    await playEntranceAnimation(); // Espera 0.8s
    await sleep(DURACAO_POR_PRODUTO - ANIMATION_DELAY); 

    // 2. Mostra o segundo item
    await playExitAnimation(); // Espera 0.5s
    updateContent(items[1 % items.length]); // Modulo para caso só tenha 1 ou 2 itens
    await playEntranceAnimation(); // Espera 0.8s
    await sleep(DURACAO_POR_PRODUTO - EXIT_ANIMATION_DURATION - ANIMATION_DELAY);

    // 3. Mostra o terceiro item
    await playExitAnimation(); // Espera 0.5s
    updateContent(items[2 % items.length]);
    await playEntranceAnimation(); // Espera 0.8s
    // Não precisa de mais 'sleep', o player DSPLAY vai cortar aqui.
}


// 6. FUNÇÃO DE INICIALIZAÇÃO (Lógica de Cache)
async function init() {
    
    if (!video_id) {
        console.error("Erro: 'video_id' não fornecido na URL da página.");
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro de Configuração: video_id não encontrado.</h1><p style="color: white; font-family: Arial;">Adicione <strong>?video_id=[ID_DO_VIDEO]</strong> ao final da URL no DSPLAY.</p>`;
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
        fetchFromNetwork();
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
            document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao Carregar API</h1><p style="color: white; font-family: Arial;">Verifique a URL da API e a conexão de rede.<br>API: ${API_URL_FINAL}</p>`;
        }
    }
}

// 7. Busca dados da rede e salva no cache
async function fetchFromNetwork() {
    try {
        console.log("Buscando dados da API: ", API_URL_FINAL);

        const response = await fetch(API_URL_FINAL); // Chama a URL final
        if (!response.ok) throw new Error('Resposta da rede não foi OK');
        const data = await response.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log("Cache atualizado com novos dados da rede.");

        // Pré-carrega imagens
        if (data.response && data.response.produtos) {
            preloadImages(data.response.produtos, data.response.configCliente);
        }
        
        return data;
    } catch (error) {
        console.error("Falha ao buscar dados da rede:", error);
        return null;
    }
}

// 8. Lógica de Lote
function runTemplate(data) {
    try {
        configCliente = data.response.configCliente;
        configTemplate = data.response.configTemplate;
        produtos = data.response.produtos;
        
        if (!configCliente || !configTemplate || !produtos || produtos.length === 0) {
             if (!configCliente) console.error("configCliente está nulo ou indefinido.");
             if (!configTemplate) console.error("configTemplate está nulo ou indefinido.");
             if (!produtos) console.error("produtos está nulo ou indefinido.");
             if (produtos && produtos.length === 0) console.error("Nenhum produto nos dados.");
             throw new Error("Dados de config ou produtos estão faltando.");
        }

        applyConfig(configCliente, configTemplate);
        
        if (produtos && produtos.length > 0) {
            const itemsToShow = produtos.filter(Boolean);
            runInternalRotation(itemsToShow);
        } else {
            descricaoTexto.textContent = "Nenhum produto cadastrado.";
            descricaoContainer.classList.add('slideInLeft');
        }

    } catch (error) {
        console.error("Erro ao executar o template:", error);
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao ler dados da API.</h1><p style="color: white; font-family: Arial;">Verifique se os dados no Bubble.io estão corretos.</p>`;
    }
}


// 9. Pré-carregamento de Imagens
function preloadImages(produtosArray, config) {
    console.log("Iniciando pré-carregamento de imagens...");
    const prefixoURL = 'https:'; 
    
    if (produtosArray) {
        produtosArray.forEach(produto => {
            if (produto.imagem_produto_text) (new Image()).src = prefixoURL + produto.imagem_produto_text;
            if (produto.selo_produto_text) (new Image()).src = prefixoURL + produto.selo_produto_text;
            if (produto.t_qr_produto_text) (new Image()).src = prefixoURL + produto.t_qr_produto_text;
        });
    }
    
    if (config && config.logo_mercado_url_text) { 
        (new Image()).src = prefixoURL + config.logo_mercado_url_text;
    }
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
