// script.js - Vertical Final (Correções: Cor QR, Texto CTA, Selo)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

// --- URL & API ---
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
const footerContainer = document.getElementById('info-inferior-wrapper'); 
const qrcodeContainer = document.getElementById('qrcode-container');
const qrcodeImg = document.getElementById('qrcode-img');
const qrTexto = document.getElementById('qr-texto');
const qrTextoContainer = document.getElementById('qr-texto-container'); // NOVO

const elementosRotativos = [
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer, qrcodeContainer
].filter(el => el !== null);

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
    
    const imgQR = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if (imgQR) promises.push(preloadSingleImage(imgQR));
    
    await Promise.all(promises);
}

// --- APLICAÇÃO DE CORES ---
function applyConfig(configC, configT) {
    const r = document.documentElement;
    console.log("🎨 Cores:", configT);

    // 1. Fundo Principal
    const c01 = configT.cor_01 || configT.cor_01_text;
    if(c01) {
        r.style.setProperty('--cor-fundo-principal', c01);
        r.style.setProperty('--cor-bg-preco', c01);
    }

    // 2. Amarelo (Fundo Secundário)
    const c02 = configT.cor_02 || configT.cor_02_text;
    if(c02) {
        r.style.setProperty('--cor-fundo-secundario', c02);
        r.style.setProperty('--cor-destaque-luz-borda', c02);
    }

    // 3. Verde/Destaque (Seta QR e Faixas) - AQUI ESTAVA O PROBLEMA PROVÁVEL
    const c03 = configT.cor_03 || configT.cor_03_text;
    if(c03) {
        r.style.setProperty('--cor-seta-qr', c03); // Define a cor da seta/caixa
        r.style.setProperty('--cor-faixas', c03);
        // Força a cor diretamente no elemento se o CSS não pegar
        if(qrTextoContainer) qrTextoContainer.style.backgroundColor = c03;
    }

    // Textos
    const txt1 = configT.cor_texto_01 || configT.cor_texto_1 || configT.cor_texto_01_text;
    if(txt1) r.style.setProperty('--cor-texto-placa', txt1);
    
    const txt2 = configT.cor_texto_02 || configT.cor_texto_2 || configT.cor_texto_02_text;
    if(txt2) {
        r.style.setProperty('--cor-texto-preco', txt2);
        r.style.setProperty('--cor-texto-footer', txt2);
    }

    // Logo
    const logoUrl = configC.LOGO_MERCADO_URL || configC.logo_mercado_url_text;
    if (logoUrl && logoImg) {
        logoImg.src = formatURL(logoUrl);
    }
    
    if(logoContainer) logoContainer.classList.add('fadeIn');
    if(footerContainer) footerContainer.classList.add('fadeIn');
}

// --- ATUALIZA CONTEÚDO ---
function updateContent(item) {
    console.log("🔄 Item:", item.nome);

    // Imagem
    const imgUrl = formatURL(item.Imagem_produto || item.imagem_produto || item.imagem_produto_text);
    if(produtoImg) produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // Textos
    if(descricaoTexto) descricaoTexto.textContent = item.nome || item.nome_text;
    if(precoTexto) precoTexto.textContent = item.valor || item.valor_text;

    // QR Code
    const qrUrl = item.QR_produto || item.qr_produto || item.t_qr_produto_text;
    if(qrUrl && qrcodeImg) {
        qrcodeImg.src = formatURL(qrUrl);
        if(qrcodeContainer) qrcodeContainer.style.display = 'flex';
    } else if(qrcodeContainer) {
        // Se não tiver QR, esconde a caixa branca
        qrcodeContainer.style.display = 'none';
    }
    
    // Texto do QR (CTA)
    // Prioridade: Texto do Banco > "APROVEITE!"
    const txtQR = item.Texto_QR || item.texto_qr || item.texto_qr_text;
    if(qrTexto) {
        qrTexto.textContent = txtQR || "APROVEITE!";
        // Força maiúsculas via JS também
        qrTexto.style.textTransform = "uppercase";
    }

    // Selo (Correção de visibilidade)
    const seloUrl = item.Selo_Produto || item.selo_produto || item.selo_produto_text;
    if(seloImg && seloUrl) {
        console.log("✅ Selo encontrado:", seloUrl);
        seloImg.src = formatURL(seloUrl);
        if(seloContainer) seloContainer.style.display = 'flex';
    } else if(seloContainer) {
        console.warn("⚠️ Selo não encontrado para este item");
        seloContainer.style.display = 'none'; // Esconde se vazio
    }
}

// --- ANIMAÇÕES ---
async function playEntrance() {
    elementosRotativos.forEach(el => { if(el) el.className = 'elemento-animado'; });
    
    // Só anima se estiver visível (display != none)
    if(seloContainer && seloContainer.style.display !== 'none') seloContainer.classList.add('slideInDown');
    
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
    let index = 0;
    while(true) {
        const item = items[index];
        await preloadImagesForSlide(item);
        updateContent(item);
        await playEntrance();
        await sleep(5000); 
        await playExit();
        index = (index + 1) % items.length;
    }
}

async function init() {
    try {
        const res = await fetch(API_URL_FINAL);
        const data = await res.json();
        
        if(data && data.response) {
            const { configCliente, configTemplate, produtos } = data.response;
            const validos = produtos.filter(p => p.nome || p.nome_text);
            
            if(validos.length > 0) {
                applyConfig(configCliente, configTemplate);
                startRotation(validos);
            }
        }
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', init);
