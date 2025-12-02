// script.js - Versão Vertical Final (Correção QR Code Definitiva)

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
    const imgProd = item.Imagem_produto || item.imagem_produto || item.imagem_produto_text;
    if (imgProd) promises.push(preloadSingleImage(imgProd));
    
    const imgSelo = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if (imgSelo) promises.push(preloadSingleImage(imgSelo));
    
    // Tenta todas as variações de QR
    const imgQR = item.QR_produto || item.qr_produto || item.t_qr_produto_text || item.t_qr_produto;
    if (imgQR) promises.push(preloadSingleImage(imgQR));
    
    await Promise.all(promises);
}

// --- APLICAÇÃO DE CORES ---
function applyConfig(configC, configT) {
    const r = document.documentElement;
    
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

    const corTxt1 = configT.cor_texto_01 || configT.cor_texto_1 || configT.cor_texto_01_text;
    if(corTxt1) r.style.setProperty('--cor-texto-placa', corTxt1);
    
    const corTxt2 = configT.cor_texto_02 || configT.cor_texto_2 || configT.cor_texto_02_text;
    if(corTxt2) {
        r.style.setProperty('--cor-texto-preco', corTxt2);
        r.style.setProperty('--cor-texto-footer', corTxt2);
    }

    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl && logoImg) {
        logoImg.src = formatURL(logoUrl);
    }
    
    if(logoContainer) logoContainer.classList.add('fadeIn');
    if(footerContainer) footerContainer.classList.add('fadeIn');
}

// --- ATUALIZA CONTEÚDO (CORREÇÃO DO QR CODE AQUI) ---
function updateContent(item) {
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto || item.imagem_produto_text);
    if(produtoImg) produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    if(descricaoTexto) descricaoTexto.textContent = item.nome || item.nome_text;
    if(precoTexto) precoTexto.textContent = item.valor || item.valor_text;
    
    // --- CORREÇÃO QR CODE: Tenta TODAS as variações ---
    const qrUrl = item.QR_produto || item.qr_produto || item.t_qr_produto_text || item.t_qr_produto;
    
    if (qrUrl) {
        console.log("QR Code encontrado:", qrUrl); // DEBUG
        if(qrcodeImg) qrcodeImg.src = formatURL(qrUrl);
        if(qrcodeContainer) qrcodeContainer.style.display = 'flex'; // Garante que aparece
    } else {
        console.warn("QR Code não encontrado para este item.");
        // Opcional: Esconder se não tiver
        // if(qrcodeContainer) qrcodeContainer.style.display = 'none';
    }
    
    const txtQR = item.Texto_QR || item.texto_qr || item.texto_qr_text;
    if(qrTexto) qrTexto.textContent = txtQR || "Aproveite as ofertas";

    const seloUrl = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
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
    let data = null;
    try {
        console.log("Iniciando Vertical. Buscando:", API_URL_FINAL);
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
    } catch (e) { console.error("Erro Fatal:", e); }
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
    if (!data || !data.response) {
        console.error("Dados inválidos:", data);
        return;
    }
    configCliente = data.response.configCliente;
    configTemplate = data.response.configTemplate;
    produtos = data.response.produtos;

    if(produtos) {
        const validos = produtos.filter(p => p && (p.nome || p.nome_text));
        if(validos.length > 0) {
            applyConfig(configCliente, configTemplate);
            startRotation(validos);
        } else {
            console.warn("Nenhum produto válido encontrado.");
        }
    }
}

document.addEventListener('DOMContentLoaded', init);
