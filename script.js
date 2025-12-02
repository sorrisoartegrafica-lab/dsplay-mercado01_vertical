// script.js - Vertical (Baseado no Horizontal Funcional)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
// URL DA API (A mesma que funciona no horizontal)
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// --- URL & API ---
const queryParams = new URLSearchParams(window.location.search);
let video_id = queryParams.get('video_id');
if (!video_id) {
    console.log("Usando ID padrão.");
    video_id = DEFAULT_VIDEO_ID;
}

const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;
const CACHE_KEY = `hortifruti_vert_${video_id}`;

let configCliente = {}, configTemplate = {}, produtos = [];

// --- ELEMENTOS DO DOM (IDs DO VERTICAL) ---
const logoImg = document.getElementById('logo-img');
const logoContainer = document.getElementById('logo-container');
const produtoImg = document.getElementById('produto-img');
const produtoImgGhost = document.getElementById('produto-img-ghost');
const produtoContainer = document.getElementById('produto-container');

// DIFERENÇA 1: No vertical o nome é 'descricao-texto'
const descricaoTexto = document.getElementById('descricao-texto'); 
const descricaoContainer = document.getElementById('descricao-container');

const precoTexto = document.getElementById('preco-texto');
const precoContainer = document.getElementById('preco-container');
const seloImg = document.getElementById('selo-img');
const seloContainer = document.getElementById('selo-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

// DIFERENÇA 2: No vertical o rodapé é 'info-inferior-wrapper'
const footerContainer = document.getElementById('info-inferior-wrapper');
const qrcodeContainer = document.getElementById('qrcode-container');

// Lista de elementos animados
const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer, qrcodeContainer
].filter(el => el !== null); // Proteção extra

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

// --- FUNÇÕES AUXILIARES (Iguais ao Horizontal) ---
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
    // Tenta todas as variações de nomes (Robustez do Horizontal)
    const imgProd = item.Imagem_produto || item.imagem_produto || item.imagem_produto_text;
    if (imgProd) promises.push(preloadSingleImage(imgProd));
    
    const imgSelo = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if (imgSelo) promises.push(preloadSingleImage(imgSelo));
    
    const imgQR = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if (imgQR) promises.push(preloadSingleImage(imgQR));
    
    await Promise.all(promises);
}

// --- CONFIGURAÇÃO (Lógica do Horizontal adaptada) ---
function applyConfig(configC, configT) {
    const r = document.documentElement;
    
    // 1. Cores (Tenta com e sem _text)
    const c01 = configT.cor_01 || configT.cor_01_text;
    if(c01) {
        r.style.setProperty('--cor-fundo-principal', c01);
        r.style.setProperty('--cor-bg-preco', c01);
    }
    
    const c02 = configT.cor_02 || configT.cor_02_text;
    if(c02) {
        r.style.setProperty('--cor-fundo-secundario', c02); // No vertical usa-se essa var?
        r.style.setProperty('--cor-destaque-luz-borda', c02); // E essa
        r.style.setProperty('--cor-seta-qr', c02);
    }
    
    const c03 = configT.cor_03 || configT.cor_03_text;
    if(c03) r.style.setProperty('--cor-faixas', c03);

    // 2. Textos
    const corTxt1 = configT.cor_texto_01 || configT.cor_texto_1 || configT.cor_texto_01_text;
    if(corTxt1) r.style.setProperty('--cor-texto-descricao', corTxt1); // Vertical usa essa var
    
    const corTxt2 = configT.cor_texto_02 || configT.cor_texto_2 || configT.cor_texto_02_text;
    if(corTxt2) {
        r.style.setProperty('--cor-texto-preco', corTxt2);
        r.style.setProperty('--cor-texto-footer', corTxt2);
    }

    // 3. Logo
    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl) {
        logoImg.src = formatURL(logoUrl);
        if(logoContainer) logoContainer.classList.add('fadeIn');
    }
    if(footerContainer) footerContainer.classList.add('fadeIn');
}

// --- CONTEÚDO (Lógica do Horizontal adaptada) ---
function updateContent(item) {
    // 1. Imagem
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto || item.imagem_produto_text);
    produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // 2. Textos (Usando os elementos do Vertical)
    descricaoTexto.textContent = item.nome || item.nome_text;
    precoTexto.textContent = item.valor || item.valor_text;
    
    // 3. Selo
    const seloUrl = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if(seloUrl){
        seloImg.src = formatURL(seloUrl);
        if(seloContainer) seloContainer.style.display = 'flex';
    } else {
        if(seloContainer) seloContainer.style.display = 'none';
    }

    // 4. QR Code
    const qrUrl = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if(qrUrl) qrcodeImg.src = formatURL(qrUrl);
    
    const txtQR = item.Texto_QR || item.texto_qr || item.texto_qr_text;
    qrTexto.textContent = txtQR || "Venha Conferir";
}

// --- ANIMAÇÕES (Mesma lógica, elementos diferentes) ---
async function playEntrance() {
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(produtoContainer) produtoContainer.classList.add('slideInLeft'); // Vertical: SlideInLeft ou Up? Horizontal é Left.
    // Se quiser manter o original do vertical use slideInUp:
    // if(produtoContainer) produtoContainer.classList.add('slideInUp'); 
    
    setTimeout(() => { if(seloContainer) seloContainer.classList.add('stampIn'); }, 200);
    
    if(descricaoContainer) descricaoContainer.classList.add('slideInRight'); // ou slideInLeft
    if(precoContainer) precoContainer.classList.add('elasticUp'); // ou popIn
    if(footerContainer) footerContainer.classList.add('slideInUp');
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    if(produtoContainer) produtoContainer.classList.add('slideOutLeft'); // ou slideOutDown
    if(seloContainer) seloContainer.classList.add('slideOutLeft');
    if(descricaoContainer) descricaoContainer.classList.add('slideOutRight');
    if(precoContainer) precoContainer.classList.add('slideOutRight');
    if(footerContainer) footerContainer.classList.add('slideOutLeft'); // ou slideOutDown
    
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

async function init() {
    let data = null;
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            data = JSON.parse(cached);
            runApp(data);
            fetchData().then(newData => {
                if(newData) localStorage.setItem(CACHE_KEY, JSON.stringify(newData));
            });
        } else {
            data = await fetchData();
            if(data) {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
                runApp(data);
            }
        }
    } catch (e) { console.error("Erro init:", e); }
}

async function fetchData() {
    try {
        const res = await fetch(API_URL_FINAL);
        if(!res.ok) throw new Error("Erro API: " + res.status);
        return await res.json();
    } catch (e) { 
        console.error("Falha no fetch:", e);
        return null; 
    }
}

function runApp(data) {
    if (!data || !data.response) return;
    configCliente = data.response.configCliente;
    configTemplate = data.response.configTemplate;
    produtos = data.response.produtos;

    if(produtos) {
        // A mesma validação robusta do horizontal
        const validos = produtos.filter(p => p && (p.nome || p.nome_text));
        applyConfig(configCliente, configTemplate);
        if(validos.length > 0) {
            startRotation(validos);
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
