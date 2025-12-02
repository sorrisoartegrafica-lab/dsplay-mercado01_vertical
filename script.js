// script.js - Vertical Final (CSS Corrigido e QR Code Ajustado)

const DEFAULT_VIDEO_ID = "1764628151406x909721458907021300"; 
const API_URL_BASE = "https://bluemidia.digital/version-test/api/1.1/wf/get_video_data";

const queryParams = new URLSearchParams(window.location.search);
const video_id = queryParams.get('video_id') || DEFAULT_VIDEO_ID;
const API_URL_FINAL = `${API_URL_BASE}?video_id=${video_id}`;

// Elementos
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
    produtoContainer, seloContainer, descricaoContainer, precoContainer, footerContainer
].filter(el => el !== null);

const TEMPO_SLOT_TOTAL = 15000;
const TEMPO_TRANSICAO = 800;

function formatURL(url) {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (!url.startsWith('http')) return 'https://' + url;
    return url;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function preloadImagesForSlide(item) {
    const promises = [];
    if (item.Imagem_produto) promises.push(preloadImage(item.Imagem_produto));
    if (item.Selo_Produto) promises.push(preloadImage(item.Selo_Produto));
    if (item.t_qr_produto_text) promises.push(preloadImage(item.t_qr_produto_text));
    await Promise.all(promises);
}

function preloadImage(url) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = formatURL(url);
    });
}

function applyConfig(configC, configT) {
    const r = document.documentElement;
    
    // Cores
    if(configT.cor_01) {
        r.style.setProperty('--cor-fundo-principal', configT.cor_01);
        r.style.setProperty('--cor-bg-preco', configT.cor_01);
    }
    if(configT.cor_02) {
        r.style.setProperty('--cor-fundo-secundario', configT.cor_02);
        r.style.setProperty('--cor-seta-qr', configT.cor_02);
    }
    if(configT.cor_03) r.style.setProperty('--cor-faixas', configT.cor_03);

    // Textos
    if(configT.cor_texto_01) r.style.setProperty('--cor-texto-descricao', configT.cor_texto_01);
    if(configT.cor_texto_02) r.style.setProperty('--cor-texto-preco', configT.cor_texto_02);

    // Logo
    if (configC.LOGO_MERCADO_URL) {
        logoImg.src = formatURL(configC.LOGO_MERCADO_URL);
        logoContainer.classList.add('fadeIn');
    }
}

function updateContent(item) {
    // Imagem
    const imgUrl = formatURL(item.Imagem_produto);
    produtoImg.src = imgUrl;
    if(produtoImgGhost) produtoImgGhost.src = imgUrl;

    // Textos
    descricaoTexto.textContent = item.nome;
    precoTexto.textContent = item.valor;

    // QR Code (Prioridade para t_qr_produto_text que vi no seu vídeo)
    const qrUrl = item.t_qr_produto_text || item.QR_produto || item.qr_produto;
    if(qrUrl && qrcodeImg) {
        qrcodeImg.src = formatURL(qrUrl);
        qrcodeContainer.style.display = 'flex';
    } else if(qrcodeContainer) {
        qrcodeContainer.style.display = 'none';
    }

    // Selo
    if(item.Selo_Produto && seloImg) {
        seloImg.src = formatURL(item.Selo_Produto);
        seloContainer.style.display = 'flex';
    } else if(seloContainer) {
        seloContainer.style.display = 'none';
    }
}

async function playEntrance() {
    elementosRotativos.forEach(el => el.className = 'elemento-animado');
    
    if(seloContainer.style.display !== 'none') seloContainer.classList.add('slideInDown');
    produtoContainer.classList.add('slideInUp');
    
    setTimeout(() => descricaoContainer.classList.add('slideInLeft'), 200);
    setTimeout(() => precoContainer.classList.add('popIn'), 400);
    
    if(footerContainer) footerContainer.classList.add('slideInUp');
    
    await sleep(TEMPO_TRANSICAO);
}

async function playExit() {
    elementosRotativos.forEach(el => {
        el.classList.remove('slideInUp', 'slideInDown', 'slideInLeft', 'popIn', 'fadeIn');
        el.classList.add('slideOutDown');
    });
    await sleep(500);
}

async function startRotation(items) {
    let index = 0;
    while(true) {
        const item = items[index];
        await preloadImagesForSlide(item);
        updateContent(item);
        await playEntrance();
        
        // Tempo de exibição
        await sleep(5000); // 5 segundos por produto
        
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
            const validos = produtos.filter(p => p.nome); // Filtra produtos válidos
            
            if(validos.length > 0) {
                applyConfig(configCliente, configTemplate);
                startRotation(validos);
            }
        }
    } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', init);
