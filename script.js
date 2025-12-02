// script.js - Vertical Final (Nomes Exatos do JSON)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// --- URL & API ---
const queryParams = new URLSearchParams(window.location.search);
let video_id = queryParams.get('video_id');
if (!video_id) video_id = DEFAULT_VIDEO_ID;

const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;
const CACHE_KEY = `hortifruti_vert_${video_id}`;

// Variáveis Globais
let configCliente = {}, configTemplate = {}, produtos = [];

// Elementos DOM
const logoImg = document.getElementById('logo-img');
const logoContainer = document.getElementById('logo-container');
const produtoImg = document.getElementById('produto-img');
const produtoImgGhost = document.getElementById('produto-img-ghost');
const produtoContainer = document.getElementById('produto-container');
const descricaoTexto = document.getElementById('descricao-texto');
const descricaoContainer = document.getElementById('descricao-container');
const precoTexto = document.getElementById('preco-texto');
const precoContainer = document.getElementById('preco-container');
const seloImg = document.getElementById('selo-img');
const seloContainer = document.getElementById('selo-container');
const footerContainer = document.getElementById('info-inferior-wrapper');
const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer, qrcodeContainer
];

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

// --- FUNÇÕES AUXILIARES ---
function formatURL(url) {
    if (!url) return '';
    url = url.trim();
    if (url.startsWith('http') || url.startsWith('//')) return url.startsWith('//') ? 'https:' + url : url;
    return 'https://' + url;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function preloadSingleImage(url) {
    return new Promise((resolve) => {
        if (!url) { resolve(); return; }
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = formatURL(url);
    });
}

async function preloadImagesForSlide(item) {
    const promises = [];
    // Mapeamento EXATO conforme seu JSON
    if (item.Imagem_produto) promises.push(preloadSingleImage(item.Imagem_produto));
    if (item.Selo_Produto) promises.push(preloadSingleImage(item.Selo_Produto));
    if (item.QR_produto) promises.push(preloadSingleImage(item.QR_produto));
    await Promise.all(promises);
}

// --- APLICAÇÃO DE CORES ---
function applyConfig(configC, configT) {
    const r = document.documentElement;
    console.log("Aplicando Cores:", configT);

    // Cores (Minúsculas no JSON)
    if(configT.cor_01) {
        r.style.setProperty('--cor-fundo-principal', configT.cor_01);
        r.style.setProperty('--cor-bg-preco', configT.cor_01);
    }
    if(configT.cor_03) r.style.setProperty('--cor-faixas', configT.cor_03);
    if(configT.cor_02) {
        r.style.setProperty('--cor-destaque-luz-borda', configT.cor_02);
        r.style.setProperty('--cor-seta-qr', configT.cor_02);
    }

    // Textos (Minúsculas no JSON)
    const txt1 = configT.cor_texto_01 || configT.cor_texto_1;
    if(txt1) r.style.setProperty('--cor-texto-placa', txt1);
    
    const txt2 = configT.cor_texto_02 || configT.cor_texto_2;
    if(txt2) {
        r.style.setProperty('--cor-texto-preco', txt2);
        r.style.setProperty('--cor-texto-footer', txt2);
    }

    // Logo (Maiúsculas no JSON)
    if (configC.LOGO_MERCADO_URL) {
        if(logoImg) logoImg.src = formatURL(configC.LOGO_MERCADO_URL);
    }
    
    if(logoContainer) logoContainer.classList.add('fadeIn');
    if(footerContainer) footerContainer.classList.add('fadeIn'); 
}

// --- ATUALIZA CONTEÚDO ---
function updateContent(item) {
    console.log("Item Atual:", item);

    // Imagem (Maiúsculas no JSON: Imagem_produto)
    const imgUrl = formatURL(item.Imagem_produto);
    if(produtoImg) produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // Texto (Minúsculas no JSON: nome, valor)
    if(descricaoTexto) descricaoTexto.textContent = item.nome;
    if(precoTexto) precoTexto.textContent = item.valor;
    
    // QR Code (Maiúsculas no JSON: QR_produto)
    const qrUrl = item.QR_produto;
    if(qrcodeImg && qrUrl) qrcodeImg.src = formatURL(qrUrl);
    
    // Texto QR (Maiúsculas no JSON: Texto_QR)
    const txtQR = item.Texto_QR;
    if(qrTexto) qrTexto.textContent = txtQR || "Aproveite";

    // Selo (Maiúsculas no JSON: Selo_Produto)
    const seloUrl = item.Selo_Produto;
    if(seloImg && seloUrl){
        seloImg.src = formatURL(seloUrl);
        if(seloContainer) seloContainer.style.display = 'flex';
    } else if(seloContainer) {
        seloContainer.style.display = 'flex'; 
    }
}

// --- ANIMAÇÕES ---
async function playEntrance() {
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(seloContainer) seloContainer.classList.add('slideInDown');
    if(produtoContainer) produtoContainer.classList.add('slideInUp');
    setTimeout(() => { if(descricaoContainer) descricaoContainer.classList.add('slideInLeft'); }, 200);
    setTimeout(() => { if(precoContainer) precoContainer.classList.add('popIn'); }, 400);
    if(footerContainer) footerContainer.classList.add('slideInUp'); 
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(produtoContainer) produtoContainer.classList.add('slideOutDown');
    if(descricaoContainer) descricaoContainer.classList.add('slideOutDown');
    if(precoContainer) precoContainer.classList.add('slideOutDown');
    if(seloContainer) seloContainer.classList.add('slideOutDown'); 
    if(footerContainer) footerContainer.classList.add('slideOutDown');
    
    await sleep(500);
}

async function startRotation(items) {
    if(!items || items.length === 0) return;
    let tempoPorItem = Math.max(5000, TEMPO_SLOT_TOTAL / items.length); 

    for (let i = 0; i < items.length; i++) {
        await preloadImagesForSlide(items[i]);
        updateContent(items[i]);
        await playEntrance();
        await sleep(tempoPorItem - TEMPO_TRANSICAO - 500);
        if (i < items.length) await playExit();
    }
    startRotation(items);
}

// --- INICIALIZAÇÃO ---
async function init() {
    try {
        const res = await fetch(API_URL_FINAL);
        const data = await res.json();
        
        if (data && data.response) {
            configCliente = data.response.configCliente;
            configTemplate = data.response.configTemplate;
            produtos = data.response.produtos;

            if(produtos) {
                // Filtro simplificado: se tiver nome, é válido
                const validos = produtos.filter(p => p.nome);
                
                if(validos.length > 0) {
                    applyConfig(configCliente, configTemplate);
                    startRotation(validos);
                } else {
                    console.warn("Nenhum produto válido encontrado.");
                }
            }
        }
    } catch (e) { console.error("Erro Fatal:", e); }
}

document.addEventListener('DOMContentLoaded', init);
