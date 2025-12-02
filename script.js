// script.js - Versão Vertical Final (Domínio Corrigido)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
// CORREÇÃO: bluemidia.digital (com i)
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

const queryParams = new URLSearchParams(window.location.search);
let video_id = queryParams.get('video_id') || DEFAULT_VIDEO_ID;
const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;
const CACHE_KEY = `hortifruti_vert_${video_id}`;

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
const footerContainer = document.getElementById('footer-container');
const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');

const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, qrcodeContainer
];

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

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
    const imgProd = item.Imagem_produto || item.imagem_produto;
    if (imgProd) promises.push(preloadSingleImage(imgProd));
    await Promise.all(promises);
}

function applyConfig(configC, configT) {
    const r = document.documentElement;
    
    // Mapeamento de Cores
    const c01 = configT.cor_01 || configT.cor_01_text;
    if(c01) {
        r.style.setProperty('--cor-fundo-principal', c01);
        r.style.setProperty('--cor-bg-preco', c01);
    }

    const c03 = configT.cor_03 || configT.cor_03_text;
    if(c03) r.style.setProperty('--cor-faixas', c03);

    const c02 = configT.cor_02 || configT.cor_02_text;
    if(c02) {
        r.style.setProperty('--cor-destaque-luz-borda', c02);
        r.style.setProperty('--cor-seta-qr', c02);
    }

    const txt1 = configT.cor_texto_01 || configT.cor_texto_1;
    if(txt1) r.style.setProperty('--cor-texto-placa', txt1);
    
    const txt2 = configT.cor_texto_02 || configT.cor_texto_2;
    if(txt2) {
        r.style.setProperty('--cor-texto-preco', txt2);
        r.style.setProperty('--cor-texto-footer', txt2);
    }

    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl) logoImg.src = formatURL(logoUrl);
    
    logoContainer.classList.add('fadeIn');
    footerContainer.classList.add('fadeIn');
}

function updateContent(item) {
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto);
    produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    descricaoTexto.textContent = item.nome || item.nome_text;
    precoTexto.textContent = item.valor || item.valor_text;
    
    const qrUrl = item.QR_produto || item.qr_produto;
    if(qrcodeImg && qrUrl) qrcodeImg.src = formatURL(qrUrl);
    
    const txtQR = item.Texto_QR || item.texto_qr;
    if(qrTexto) qrTexto.textContent = txtQR || "Ofertas";

    const seloUrl = item.Selo_Produto || item.selo_produto;
    if(seloImg && seloUrl){
        seloImg.src = formatURL(seloUrl);
        seloContainer.style.display = 'flex';
    } else {
        seloContainer.style.display = 'flex'; 
    }
}

async function playEntrance() {
    elementosRotativos.forEach(el => el.className = 'elemento-animado');
    seloContainer.classList.add('slideInDown');
    produtoContainer.classList.add('slideInUp');
    setTimeout(() => { descricaoContainer.classList.add('slideInLeft'); }, 200);
    setTimeout(() => { precoContainer.classList.add('popIn'); }, 400);
    qrcodeContainer.classList.add('slideInUp');
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    elementosRotativos.forEach(el => el.className = 'elemento-animado');
    produtoContainer.classList.add('slideOutDown');
    descricaoContainer.classList.add('slideOutDown');
    precoContainer.classList.add('slideOutDown');
    seloContainer.classList.add('slideOutDown'); 
    qrcodeContainer.classList.add('slideOutDown');
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
    try {
        const res = await fetch(API_URL_FINAL);
        const data = await res.json();
        if (data && data.response) {
            const { configCliente, configTemplate, produtos } = data.response;
            const validos = produtos.filter(p => p && (p.nome || p.nome_text));
            applyConfig(configCliente, configTemplate);
            if(validos.length > 0) startRotation(validos);
        }
    } catch (e) { console.error("Erro Fatal:", e); }
}

document.addEventListener('DOMContentLoaded', init);
