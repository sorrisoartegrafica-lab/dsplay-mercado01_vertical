// script.js - Versão com Animação CORRIGIDA (Sai -> Entra)

// ##################################################################
//  Lendo a API e o Lote (Batch) da URL
// ##################################################################
const queryParams = new URLSearchParams(window.location.search);
const API_URL_BASE = queryParams.get('api'); // URL da API (só com client_id)
const loteManual = queryParams.get('videos'); // O grupo de vídeo (ex: 1, 2, 3...)
// ##################################################################


// --- Chave para o Cache ---
const CACHE_KEY = `supermercado_api_cache_${API_URL_BASE}_lote_${loteManual || 'auto'}`;
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
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / 3; // 5000ms (5s) por produto
const ANIMATION_DELAY = 800; // 0.8s (tempo da animação de entrada)
const EXIT_ANIMATION_DURATION = 500; // 0.5s (tempo da animação de saída)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Função para APLICAR A CONFIGURAÇÃO DO MERCADO (Itens Estáticos)
function applyConfig(config) {
    document.documentElement.style.setProperty('--cor-fundo-principal', config.cor_fundo_text);
    document.documentElement.style.setProperty('--cor-fundo-secundario', config.cor_2_text);
    document.documentElement.style.setProperty('--cor-texto-descricao', config.cor_texto_1_text);
    document.documentElement.style.setProperty('--cor-texto-preco', config.cor_texto_2_text);
    
    const prefixoURL = 'https:';
    if (config.logo_mercado_url_text) { 
        logoImg.src = prefixoURL + config.logo_mercado_url_text; 
    }
    
    document.documentElement.style.setProperty('--cor-seta-qr', config.qr_cor_seta_text || '#00A300'); 

    elementosEstaticosAnimados.forEach(el => el.classList.add('slideInUp'));
}

// 2. Função para ATUALIZAR o conteúdo do PRODUTO (itens que rotacionam)
function updateContent(item) {
    const prefixoURL = 'https:';
    
    produtoImg.src = prefixoURL + item.imagem_produto_text;
    descricaoTexto.textContent = item.nome_text;
    precoTexto.textContent = item.valor_text;
    seloImg.src = prefixoURL + item.selo_produto_text;
    qrcodeImg.src = prefixoURL + item.t_qr_produto_text;
    
    qrTexto.textContent = item.texto_qr_text; 
}

// 3. --- MUDANÇA: LÓGICA DE ANIMAÇÃO DE ENTRADA CORRIGIDA ---
async function playEntranceAnimation() {
    // 1. Reseta classes de SAÍDA (as únicas que poderiam estar lá)
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

// 4. --- MUDANÇA: LÓGICA DE ANIMAÇÃO DE SAÍDA CORRIGIDA ---
async function playExitAnimation() {
    // 1. Reseta classes de ENTRADA (as únicas que poderiam estar lá)
    elementosAnimadosProduto.forEach(el => {
        el.className = 'elemento-animado'; // Reseta tudo
    });

    // 2. Adiciona classes de SAÍDA
    produtoContainer.classList.add('slideOutRight'); // Sai para a direita
    seloContainer.classList.add('slideOutLeft'); // Sai para a esquerda
    descricaoContainer.classList.add('slideOutLeft'); // Sai para a esquerda
    precoContainer.classList.add('slideOutLeft'); // Preço sai deslizando
    infoInferiorWrapper.classList.add('slideOutDown'); // Sai para baixo

    // 3. ESPERA a animação de saída terminar
    await sleep(EXIT_ANIMATION_DURATION);
}
// --- FIM DA MUDANÇA ---


// 5. --- MUDANÇA CRÍTICA: Roda a "Micro-Rotação" (com lógica 'await' correta) ---
async function runInternalRotation(items) {
    
    // 1. Mostra o primeiro item (só ENTRADA)
    updateContent(items[0]);
    await playEntranceAnimation(); // Espera 0.8s
    // Espera o resto do tempo (5s - 0.8s = 4.2s)
    await sleep(DURACAO_POR_PRODUTO - ANIMATION_DELAY); 

    // 2. Mostra o segundo item
    await playExitAnimation(); // Espera 0.5s
    updateContent(items[1 % items.length]); // Modulo para caso só tenha 1 ou 2 itens
    await playEntranceAnimation(); // Espera 0.8s
    // Espera o resto do tempo (5s - 0.5s - 0.8s = 3.7s)
    await sleep(DURACAO_POR_PRODUTO - EXIT_ANIMATION_DURATION - ANIMATION_DELAY);

    // 3. Mostra o terceiro item
    await playExitAnimation(); // Espera 0.5s
    updateContent(items[2 % items.length]);
    await playEntranceAnimation(); // Espera 0.8s
    // Não precisa de mais 'sleep', o player DSPLAY vai cortar aqui.
}
// --- FIM DA MUDANÇA ---


// 6. FUNÇÃO DE INICIALIZAÇÃO (Lógica de Cache)
async function init() {
    
    if (!API_URL_BASE) {
        console.error("Erro: URL da API não fornecida na URL da página.");
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro de Configuração: URL da API não encontrada.</h1><p style="color: white; font-family: Arial;">Adicione <strong>?api=[SUA_URL_DA_API]</strong> ao final da URL no DSPLAY.</p>`;
        return;
    }

    if (!loteManual) {
        console.warn("Aviso: Parâmetro 'videos' (ex: &videos=1) não encontrado na URL.");
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
            document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao Carregar API</h1><p style="color: white; font-family: Arial;">Verifique a URL da API e a conexão de rede.<br>API: ${API_URL_BASE}</p>`;
        }
    }
}

// 7. Busca dados da rede e salva no cache
async function fetchFromNetwork() {
    try {
        const finalApiUrl = `${API_URL_BASE}&videos=${loteManual}`;
        console.log("Buscando dados da API: ", finalApiUrl);

        const response = await fetch(finalApiUrl); // Chama a URL final
        if (!response.ok) throw new Error('Resposta da rede não foi OK');
        const data = await response.json();
        
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        console.log("Cache atualizado com novos dados da rede.");

        if (data.response && data.response.produtos) {
            preloadImages(data.response.produtos, data.response.configMercado);
        }
        
        return data;
    } catch (error) {
        console.error("Falha ao buscar dados da rede:", error);
        return null;
    }
}

// 8. Lógica de Lote (Híbrida)
function runTemplate(data) {
    try {
        configMercado = data.response.configMercado;
        produtos = data.response.produtos;
        
        if (!configMercado || !produtos || produtos.length === 0) {
             if (!configMercado) console.error("configMercado está nulo ou indefinido.");
             if (!produtos) console.error("produtos está nulo ou indefinido.");
             if (produtos && produtos.length === 0) console.error("Nenhum produto nos dados.");
             throw new Error("Dados de config ou produtos estão faltando.");
        }

        // Aplica todos os itens estáticos (Logo, Texto do QR, Cores)
        applyConfig(configMercado);
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
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro ao ler dados da planilha.</h1><p style="color: white; font-family: Arial;">Verifique se a planilha está formatada corretamente.</p>`;
    }
}


// 9. Pré-carregamento de Imagens
function preloadImages(produtosArray, config) {
    console.log("Iniciando pré-carregamento de imagens...");
    const prefixoURL = 'https:'; // Adicionado prefixo aqui
    
    // Pré-carrega imagens dos produtos (Produto, Selo, QR)
    if (produtosArray) {
        produtosArray.forEach(produto => {
            if (produto.imagem_produto_text) (new Image()).src = prefixoURL + produto.imagem_produto_text;
            if (produto.selo_produto_text) (new Image()).src = prefixoURL + produto.selo_produto_text;
            if (produto.t_qr_produto_text) (new Image()).src = prefixoURL + produto.t_qr_produto_text;
        });
    }
    
    // Pré-carrega imagem da config (Logo)
    if (config && config.logo_mercado_url_text) { 
        (new Image()).src = prefixoURL + config.logo_mercado_url_text; 
    }
}

// Inicia tudo
document.addEventListener('DOMContentLoaded', init);
