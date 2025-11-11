// script.js - ATUALIZADO PARA API INTELIGENTE (video_mercado)
// Mapeando os nomes exatos do JSON do Bubble.io

// ##################################################################
//  Lendo a API e o Lote (Batch) da URL
// ##################################################################
const queryParams = new URLSearchParams(window.location.search);
const API_URL_BASE = queryParams.get('api'); // URL da API (só com client_id)
const loteManual = queryParams.get('videos'); // O grupo de vídeo (ex: 1, 2, 3...)
// ##################################################################


// --- Chave para o Cache ---
// O cache agora depende do lote, para não misturar os vídeos
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
const elementosEstaticosAnimados = [logoContainer];
// SÓ O LOGO
// Itens Rotativos (Animam a cada 5s)
const elementosAnimadosProduto = [
    produtoContainer, 
    descricaoContainer, 
    precoContainer, 
    seloContainer, 
    infoInferiorWrapper // A "CAIXINHA" inteira
];
// --- Constantes de Tempo ---
// const PRODUTOS_POR_LOTE = 3; // Não é mais necessário, a API define isso
const DURACAO_TOTAL_SLOT = 15000;
// 15 segundos
// ATENÇÃO: Esta lógica agora assume que a API *sempre* retorna 3 produtos
const DURACAO_POR_PRODUTO = DURACAO_TOTAL_SLOT / 3; // 5000ms (5s) por produto

const ANIMATION_DELAY = 1000;
// 1 segundo
const EXIT_ANIMATION_DURATION = 500; // 0.5s

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 1. Função para APLICAR A CONFIGURAÇÃO DO MERCADO (Itens Estáticos)
function applyConfig(config) {
    // Mapeando os nomes do seu DB (ex: "cor_fundo_text") para os nomes que o CSS espera.
    document.documentElement.style.setProperty('--cor-fundo-principal', config.cor_fundo_text);
    document.documentElement.style.setProperty('--cor-fundo-secundario', config.cor_2_text);
    document.documentElement.style.setProperty('--cor-texto-descricao', config.cor_texto_1_text);
    document.documentElement.style.setProperty('--cor-texto-preco', config.cor_texto_2_text);
    
    // CORREÇÃO: Usando os nomes em MINÚSCULAS que a API envia.
    const prefixoURL = 'https:';
    if (config.logo_mercado_url_text) { 
        logoImg.src = prefixoURL + config.logo_mercado_url_text; 
    }
    
    document.documentElement.style.setProperty('--cor-seta-qr', config.qr_cor_seta_text || '#00A300'); 
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

    // Prepara a animação de máquina de escrever
    const precoElement = document.getElementById('preco-texto');
    precoContainer.classList.remove('typewriter');
    void precoContainer.offsetWidth;
    precoContainer.style.animation = 'none'; 
    
    const steps = (item.valor_text && item.valor_text.length > 0) ? item.valor_text.length : 1;
    const duration = (steps * 0.15 < 1) ? steps * 0.15 : 1;
    
    precoContainer.style.animation = `typewriter ${duration}s steps(${steps}) forwards`;
}

// 3. Sincronia da Animação de ENTRADA
async function playEntranceAnimation() {
    elementosAnimadosProduto.forEach(el => el.classList.remove('fadeOut'));
    
    produtoContainer.classList.add('slideInRight');
    seloContainer.classList.add('slideInLeft');
    descricaoContainer.classList.add('slideInLeft');
    infoInferiorWrapper.classList.add('slideInUp');
    precoContainer.classList.add('typewriter'); 
    
    await sleep(ANIMATION_DELAY);
}

// 4. Função para EXECUTAR a animação de SAÍDA do PRODUTO
async function playExitAnimation() {
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
        // A lógica de fatiamento foi removida.
        // A API agora entrega *exatamente* os 3 itens (ou menos) que queremos.
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
    
    if (!API_URL_BASE) {
        console.error("Erro: URL da API não fornecida na URL da página.");
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro de Configuração: URL da API não encontrada.</h1><p style="color: white; font-family: Arial;">Adicione <strong>?api=[SUA_URL_DA_API]</strong> ao final da URL no DSPLAY.</p>`;
        return;
    }

    // ############ MUDANÇA BUBBLE.IO (Lógica Inteligente) ############
    // O parâmetro 'videos' é OBRIGATÓRIO para esta lógica funcionar
    if (!loteManual) {
        console.error("Erro: Parâmetro 'videos' (ex: &videos=1) não encontrado na URL.");
        document.body.innerHTML = `<h1 style="color: red; font-family: Arial;">Erro de Configuração: Lote de vídeo não encontrado.</h1><p style="color: white; font-family: Arial;">Adicione <strong>&videos=[NUMERO_DO_GRUPO]</strong> ao final da URL.</p>`;
        return;
    }
    // ############ FIM DA MUDANÇA ############
    
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
        // ############ MUDANÇA BUBBLE.IO (Lógica Inteligente) ############
        // Anexa o parâmetro &videos=X (lido de loteManual) à URL da API
        const finalApiUrl = `${API_URL_BASE}&videos=${loteManual}`;
        console.log("Buscando dados da API: ", finalApiUrl);
        // ############ FIM DA MUDANÇA ############

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

// 8. --- MUDANÇA CRÍTICA: Lógica de Lote (Híbrida) ---
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
            
            // ############ MUDANÇA BUBBLE.IO (Lógica Inteligente) ############
            // A lógica de "fatiamento" (slice) foi REMOVIDA.
            // A API já entrega os 3 produtos corretos (ou menos).
            const itemsToShow = produtos.filter(Boolean);
            // ############ FIM DA MUDANÇA ############

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
// --- FIM DA MUDANÇA ---


// 9. Pré-carregamento de Imagens
function preloadImages(produtosArray, config) {
    console.log("Iniciando pré-carregamento de imagens...");
    const prefixoURL = 'https:'; 
    
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
