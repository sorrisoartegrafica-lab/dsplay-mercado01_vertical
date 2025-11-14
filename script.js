// script.js - ATUALIZADO PARA A NOVA API (get_video_data)

// ##################################################################
//  MUDANÇA: Lendo a nova API com 'video_id'
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
// A API retorna 3 produtos [cite: 4, 7, 10]
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / 3; // 5000ms (5s) por produto

const ANIMATION_DELAY = 1000;
// 1 segundo
const EXIT_ANIMATION_DURATION = 500; // 0.5s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. --- MUDANÇA: Mapeando o novo JSON 'configTemplate' e 'configCliente' ---
function applyConfig(configC, configT) {
    document.documentElement.style.setProperty('--cor-fundo-principal', configT.cor_01_text); [cite: 3]
    document.documentElement.style.setProperty('--cor-fundo-secundario', configT.cor_02_text); [cite: 2]
    document.documentElement.style.setProperty('--cor-texto-descricao', configT.cor_texto_01_text); [cite: 3]
    document.documentElement.style.setProperty('--cor-texto-preco', configT.cor_texto_02_text); [cite: 3]
    document.documentElement.style.setProperty('--cor-seta-qr', configT.cor_03_text || '#00A300'); // cor_03_text é a cor da seta [cite: 3]
    
    const prefixoURL = 'https:';
    if (configC.logo_mercado_url_text) { 
        logoImg.src = prefixoURL + configC.logo_mercado_url_text; [cite: 2]
    }
    
    // Anima a entrada do logo (o único item estático)
    elementosEstaticosAnimados.forEach(el => el.classList.add('slideInUp'));
}

// 2. --- MUDANÇA: Mapeando os 'produtos' do novo JSON ---
function updateContent(item) {
    const prefixoURL = 'https:';
    
    produtoImg.src = prefixoURL + item.imagem_produto_text; [cite: 6]
    descricaoTexto.textContent = item.nome_text; [cite: 4]
    precoTexto.textContent = item.valor_text; [cite: 5]
    seloImg.src = prefixoURL + item.selo_produto_text; [cite: 6]
    qrcodeImg.src = prefixoURL + item.t_qr_produto_text; [cite: 5]
    
    qrTexto.textContent = item.texto_qr_text; [cite: 5]

    // Prepara a animação (removido 'typewriter')
    const precoElement = document.getElementById('preco-texto');
    precoContainer.classList.remove('slideInLeft'); // Remove animação antiga
    void precoContainer.offsetWidth;
    precoContainer.style.animation = 'none'; 
}

// 3. Sincronia da Animação de ENTRADA (Lógica "Crossfade" para evitar "travada")
async function playEntranceAnimation() {
    // 1. Reseta todas as classes
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado';
    });
    
    // 2. Adiciona classes de ENTRADA
    produtoContainer.classList.add('slideInRight');
    seloContainer.classList.add('slideInLeft');
    descricaoContainer.classList.add('slideInLeft');
    precoContainer.classList.add('slideInLeft'); // Preço entra deslizando
    infoInferiorWrapper.classList.add('slideInUp');
    
    // 3. Espera a animação de entrada terminar
    await sleep(ANIMATION_DELAY); 
}

// 4. Animação de SAÍDA (Lógica "Crossfade" para evitar "travada")
async function playExitAnimation() {
    // 1. Adiciona classes de SAÍDA
    produtoContainer.classList.add('slideOutRight'); // Sai para a direita
    seloContainer.classList.add('slideOutLeft'); // Sai para a esquerda
    descricaoContainer.classList.add('slideOutLeft'); // Sai para a esquerda
    precoContainer.classList.add('slideOutLeft'); // Preço sai deslizando
    infoInferiorWrapper.classList.add('slideOutDown'); // Sai para baixo

    // 2. Não espera. Deixa a animação de saída tocar
}
// --- FIM DA MUDANÇA ---


// 5. Roda a "Micro-Rotação" (Lógica "Crossfade" para evitar "travada")
async function runInternalRotation(items) {
    
    let currentIndex = 0;

    async function showNextProduct() {
        // Modulo para caso a API retorne menos de 3 produtos
        const item = items[currentIndex % items.length]; 
        
        // 1. Toca a animação de SAÍDA (dos elements antigos)
        //    (Isso só não acontece na primeira vez)
        if (currentIndex > 0) {
            playExitAnimation(); 
        }
        
        // 2. Atualiza o conteúdo (enquanto está invisível)
        updateContent(item);
        
        // 3. Toca a animação de ENTRADA (dos novos elementos)
        await playEntranceAnimation(); // Espera a entrada terminar

        // 4. Prepara o próximo item
        currentIndex++;
    }

    // 1. Mostra o primeiro item (só ENTRADA)
    showNextProduct();
    
    // 2. Agenda o segundo item (SAÍDA + ENTRADA)
    setTimeout(showNextProduct, DURACAO_POR_PRODUTO);
    
    // 3. Agenda o terceiro item (SAÍDA + ENTRADA)
    setTimeout(showNextProduct, DURACAO_POR_PRODUTO * 2);
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
        // Atualiza em segundo plano
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

        // Pré-carrega imagens [cite: 1]
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
        // --- MUDANÇA: Mapeando a nova estrutura do JSON ---
        configCliente = data.response.configCliente; [cite: 1]
        configTemplate = data.response.configTemplate; [cite: 1]
        produtos = data.response.produtos; [cite: 1]
        
        if (!configCliente || !configTemplate || !produtos || produtos.length === 0) {
             if (!configCliente) console.error("configCliente está nulo ou indefinido.");
             if (!configTemplate) console.error("configTemplate está nulo ou indefinido.");
             if (!produtos) console.error("produtos está nulo ou indefinido.");
             if (produtos && produtos.length === 0) console.error("Nenhum produto nos dados.");
             throw new Error("Dados de config ou produtos estão faltando.");
        }

        // Aplica todos os itens estáticos (Logo, Cores)
        applyConfig(configCliente, configTemplate);
        
        if (produtos && produtos.length > 0) {
            const itemsToShow = produtos.filter(Boolean);
            // Inicia a rotação dos itens dinâmicos
            runInternalRotation(itemsToShow);
        } else {
            // Mostra um aviso se a planilha estiver vazia
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
    
    // Pré-carrega imagens dos produtos (Produto, Selo, QR)
    if (produtosArray) {
        produtosArray.forEach(produto => {
            if (produto.imagem_produto_text) (new Image()).src = prefixoURL + produto.imagem_produto_text; [cite: 6, 9]
            if (produto.selo_produto_text) (new Image()).src = prefixoURL + produto.selo_produto_text; [cite: 6, 8]
            if (produto.t_qr_produto_text) (new Image()).src = prefixoURL + produto.t_qr_produto_text; [cite: 5, 7]
        });
    }
    
    // Pré-carrega imagem da config (Logo)
    if (config && config.logo_mercado_url_text) { 
        (new Image()).src = prefixoURL + config.logo_mercado_url_text; [cite: 2]
    }
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
