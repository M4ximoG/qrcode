import React, { useState, useEffect, useRef } from 'react';

type DotType = 'dots' | 'rounded' | 'classy' | 'classy-rounded' | 'square' | 'extra-rounded';
type CornerSquareType = 'dot' | 'square' | 'extra-rounded';
type CornerDotType = 'dot' | 'square';
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface HistoryItem {
  id: string;
  text: string;
  bodyColor: string;
  eyeFrameColor: string;
  eyeBallColor: string;
  bgColor: string;
  isTransparent: boolean;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  marginSize: number;
  borderRadius: number;
  date: string;
}

// Helper: Converte Hex para Luminância Relativa (WCAG 2.1)
function getLuminance(hex: string): number {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

// Helper: Razão de Contraste
function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

export default function App() {
  const [text, setText] = useState('https://example.com');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Cores
  const [bodyColor, setBodyColor] = useState('#0a203f');
  const [eyeFrameColor, setEyeFrameColor] = useState('#0a203f');
  const [eyeBallColor, setEyeBallColor] = useState('#0a203f');
  const [bgColor, setBgColor] = useState('#c9f360');
  const [isTransparent, setIsTransparent] = useState(false);
  
  // Bordas e Margens
  const [marginSize, setMarginSize] = useState<number>(20);
  const [borderRadius, setBorderRadius] = useState<number>(40);

  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('H');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [exportSize, setExportSize] = useState<number>(1024);

  // Formatos
  const [dotType, setDotType] = useState<DotType>('dots');
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('dot');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  // CÁLCULO DE CONTRASTE GLOBAL
  const effectiveBgColor = isTransparent ? '#ffffff' : bgColor;
  const bodyContrast = getContrastRatio(bodyColor, effectiveBgColor);
  const eyeFrameContrast = getContrastRatio(eyeFrameColor, effectiveBgColor);
  const eyeBallContrast = getContrastRatio(eyeBallColor, effectiveBgColor);

  const worstContrast = Math.min(bodyContrast, eyeFrameContrast, eyeBallContrast);

  const getProblemArea = () => {
    if (worstContrast === eyeFrameContrast && eyeFrameContrast < 4.5) return 'na moldura dos olhos';
    if (worstContrast === eyeBallContrast && eyeBallContrast < 4.5) return 'no centro dos olhos';
    if (worstContrast === bodyContrast && bodyContrast < 4.5) return 'no corpo do QR code';
    return '';
  };

  const idealRadius = cornerSquareType === 'square' ? 0 : cornerSquareType === 'dot' ? Math.min(80, marginSize + 55) : Math.min(80, marginSize + 25);
  const isAlignedWithEye = Math.abs(borderRadius - idealRadius) <= 2;

  useEffect(() => {
    import('qr-code-styling').then((module) => {
      const QRCodeStyling = module.default;
      qrCodeRef.current = new QRCodeStyling({
        width: 300,
        height: 300,
        type: 'canvas',
      });

      if (ref.current) {
        ref.current.innerHTML = '';
        qrCodeRef.current.append(ref.current);
        updateQR();
      }
    });

    const saved = localStorage.getItem('qr-code-history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateQR = () => {
    if (!qrCodeRef.current) return;

    qrCodeRef.current.update({
      data: text || 'https://example.com',
      image: logo || undefined,
      dotsOptions: {
        color: bodyColor,
        type: dotType,
      },
      backgroundOptions: {
        color: 'transparent',
      },
      cornersSquareOptions: {
        color: eyeFrameColor,
        type: cornerSquareType,
      },
      cornersDotOptions: {
        color: eyeBallColor,
        type: cornerDotType,
      },
      qrOptions: {
        errorCorrectionLevel: errorCorrection,
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: logoSize / 100,
        margin: 2,
      },
    });
  };

  useEffect(() => {
    updateQR();
  }, [text, bodyColor, eyeFrameColor, eyeBallColor, isTransparent, logo, logoSize, errorCorrection, dotType, cornerSquareType, cornerDotType]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadPNG = async () => {
    const module = await import('qr-code-styling');
    const QRCodeStyling = module.default;

    const exportInstance = new QRCodeStyling({
      width: exportSize,
      height: exportSize,
      type: 'canvas',
      data: text || 'https://example.com',
      image: logo || undefined,
      dotsOptions: {
        color: bodyColor,
        type: dotType,
      },
      backgroundOptions: {
        color: 'transparent',
      },
      cornersSquareOptions: {
        color: eyeFrameColor,
        type: cornerSquareType,
      },
      cornersDotOptions: {
        color: eyeBallColor,
        type: cornerDotType,
      },
      qrOptions: {
        errorCorrectionLevel: errorCorrection,
      },
      imageOptions: {
        hideBackgroundDots: true,
        imageSize: logoSize / 100,
        margin: 2,
      },
    });

    const rawData = await exportInstance.getRawData('png');
    if (!rawData) return;

    const img = new Image();
    const url = URL.createObjectURL(rawData);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = exportSize;
      canvas.height = exportSize;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scaleMargin = (marginSize / 300) * exportSize;
      const radiusScale = (borderRadius / 300) * exportSize;

      if (!isTransparent) {
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, exportSize, exportSize, radiusScale);
        ctx.fill();
      }

      const qrDrawSize = exportSize - (scaleMargin * 2);
      ctx.drawImage(img, scaleMargin, scaleMargin, qrDrawSize, qrDrawSize);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `qrcode_${exportSize}x${exportSize}.png`;
      a.click();

      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const syncEyeColorsToBody = () => {
    setEyeFrameColor(bodyColor);
    setEyeBallColor(bodyColor);
  };

  const syncBorderWithEye = () => {
    setBorderRadius(idealRadius);
  };

  const saveToHistory = () => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text,
      bodyColor,
      eyeFrameColor,
      eyeBallColor,
      bgColor,
      isTransparent,
      dotType,
      cornerSquareType,
      cornerDotType,
      marginSize,
      borderRadius,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newItem, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem('qr-code-history', JSON.stringify(updated));
  };

  const restoreConfig = (item: HistoryItem) => {
    setText(item.text);
    setBodyColor(item.bodyColor);
    setEyeFrameColor(item.eyeFrameColor || item.bodyColor);
    setEyeBallColor(item.eyeBallColor || item.bodyColor);
    setBgColor(item.bgColor);
    setIsTransparent(item.isTransparent);
    setDotType(item.dotType);
    setCornerSquareType(item.cornerSquareType);
    setCornerDotType(item.cornerDotType);
    setMarginSize(item.marginSize ?? 20);
    setBorderRadius(item.borderRadius ?? 40);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans p-4 md:p-10 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-4xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>QR Code Generator</h1>
          <p className={`mt-1 text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Gere QR Codes personalizados com alta legibilidade e estilo</p>
        </div>

        {/* Botão Tema Escuro/Claro */}
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-3 rounded-2xl border transition shadow-sm font-semibold text-sm flex items-center gap-2 ${
            isDarkMode 
              ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-amber-400' 
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          {isDarkMode ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
        </button>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel Esquerdo */}
        <div className={`lg:col-span-7 border rounded-2xl p-6 shadow-sm space-y-6 transition-colors ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          
          {/* Texto / URL */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Texto ou URL</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition ${
                isDarkMode 
                  ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
              placeholder="https://example.com"
            />
          </div>

          {/* CUSTOMIZE DESIGN */}
          <div className={`border-t pt-5 space-y-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">1. Formatos (Shapes)</h3>

            <div>
              <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Body Shape (Corpo)</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { id: 'dots', label: '● Bolinhas' },
                  { id: 'rounded', label: 'Arredondado' },
                  { id: 'extra-rounded', label: 'Extra Arr.' },
                  { id: 'classy', label: 'Classy' },
                  { id: 'classy-rounded', label: 'Classy Arr.' },
                  { id: 'square', label: '■ Quadrado' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDotType(item.id as DotType)}
                    className={`p-2 text-xs font-medium rounded-lg border flex flex-col items-center justify-center h-12 transition ${
                      dotType === item.id
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-500 font-bold shadow-sm'
                        : isDarkMode
                        ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Eye Frame Shape (Moldura do Olho)</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'extra-rounded', label: '▢ Arredondado' },
                  { id: 'dot', label: '◯ Círculo' },
                  { id: 'square', label: '☐ Quadrado' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCornerSquareType(item.id as CornerSquareType)}
                    className={`p-2 text-xs font-medium rounded-lg border flex items-center justify-center h-10 transition ${
                      cornerSquareType === item.id
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-500 font-bold shadow-sm'
                        : isDarkMode
                        ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Eye Ball Shape (Centro do Olho)</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'dot', label: '● Círculo' },
                  { id: 'square', label: '■ Quadrado' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCornerDotType(item.id as CornerDotType)}
                    className={`p-2 text-xs font-medium rounded-lg border flex items-center justify-center h-10 transition ${
                      cornerDotType === item.id
                        ? 'border-indigo-600 bg-indigo-600/10 text-indigo-500 font-bold shadow-sm'
                        : isDarkMode
                        ? 'border-slate-800 hover:bg-slate-800/60 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SET COLORS */}
          <div className={`border-t pt-5 space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">2. Cores Individuais</h3>
              <button
                type="button"
                onClick={syncEyeColorsToBody}
                className="text-xs text-indigo-500 hover:underline font-medium"
              >
                Copiar cor do corpo para os olhos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Cor do Corpo</label>
                <div className={`flex items-center gap-2 border p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="color"
                    value={bodyColor}
                    onChange={(e) => setBodyColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={bodyColor}
                    onChange={(e) => setBodyColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Moldura do Olho</label>
                <div className={`flex items-center gap-2 border p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="color"
                    value={eyeFrameColor}
                    onChange={(e) => setEyeFrameColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={eyeFrameColor}
                    onChange={(e) => setEyeFrameColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Centro do Olho</label>
                <div className={`flex items-center gap-2 border p-1.5 rounded-xl ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="color"
                    value={eyeBallColor}
                    onChange={(e) => setEyeBallColor(e.target.value)}
                    className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={eyeBallColor}
                    onChange={(e) => setEyeBallColor(e.target.value)}
                    className="w-full bg-transparent text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Cor do Fundo</label>
              <div className={`flex items-center gap-2 border p-1.5 rounded-xl max-w-xs ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} ${isTransparent ? 'opacity-30 cursor-not-allowed' : ''}`}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={isTransparent}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={isTransparent}
                  className="w-full bg-transparent text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            <div className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200/60'}`}>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Fundo transparente</span>
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* MARGEM E BORDAS DO FUNDO */}
          <div className={`border-t pt-5 space-y-4 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">3. Margem e Bordas do Fundo</h3>
              {isAlignedWithEye ? (
                <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  ✨ Curvatura Alinhada com o Olho
                </span>
              ) : (
                <button
                  type="button"
                  onClick={syncBorderWithEye}
                  className="text-xs font-semibold text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg border border-indigo-500/30 transition"
                >
                  🎯 Alinhar Borda com o Olho ({idealRadius}px)
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Distância da Borda (Margem: {marginSize}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="60"
                  value={marginSize}
                  onChange={(e) => setMarginSize(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Arredondamento da Borda ({borderRadius}px)
                </label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Resolução */}
          <div className={`border-t pt-5 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Resolução do PNG</label>
            <div className="grid grid-cols-4 gap-2">
              {[512, 1024, 2048, 4096].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setExportSize(size)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    exportSize === size
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : isDarkMode
                      ? 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>

          {/* Upload Logo */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Logo (opcional)</label>
            <label className={`border-2 border-dashed rounded-xl p-6 text-center block cursor-pointer transition ${
              isDarkMode ? 'border-slate-800 hover:border-indigo-500 bg-slate-950/50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50'
            }`}>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <span className="text-sm text-slate-500 font-medium">Clique para enviar uma imagem</span>
            </label>
          </div>
        </div>

        {/* Painel Direito (Preview Sticky com Fundo Xadrez + Sombra Suave) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className={`border rounded-2xl p-6 shadow-sm flex flex-col items-center transition-colors ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
          }`}>
            
            {/* CONTAINER DE PREVIEW */}
            <div className="w-full flex items-center justify-center p-2 mb-4">
              <div
                className="transition-all flex items-center justify-center aspect-square max-w-[320px] w-full relative"
                style={{
                  backgroundColor: isTransparent ? 'transparent' : bgColor,
                  padding: `${marginSize}px`,
                  borderRadius: `${borderRadius}px`,
                  // Padrão Xadrez Profissional para Transparência
                  backgroundImage: isTransparent
                    ? 'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)'
                    : 'none',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
                }}
              >
                {/* Sombra suave caso seja branco com fundo transparente para nunca sumir */}
                <div
                  ref={ref}
                  className={`flex items-center justify-center w-full h-full [&>canvas]:max-w-full [&>canvas]:h-auto transition-all ${
                    isTransparent ? 'drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]' : ''
                  }`}
                />
              </div>
            </div>

            {/* DIAGNÓSTICO DE CONTRASTE */}
            <div className="w-full mb-5">
              {isTransparent ? (
                <div className={`p-3 border rounded-xl flex items-start gap-2.5 ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  <span className="text-base">✨</span>
                  <div>
                    <div className="text-xs font-bold">Fundo Transparente Ativo</div>
                    <div className="text-[11px] opacity-80">
                      O contraste dependerá da superfície onde você colar o QR Code.
                    </div>
                  </div>
                </div>
              ) : worstContrast >= 4.5 ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-2.5 text-emerald-600 dark:text-emerald-400">
                  <span className="text-base">✅</span>
                  <div>
                    <div className="text-xs font-bold">Excelente leitura ({worstContrast.toFixed(1)}:1)</div>
                    <div className="text-[11px] opacity-90">Ótimo contraste em todas as partes. Qualquer aplicativo conseguirá ler este código.</div>
                  </div>
                </div>
              ) : worstContrast >= 3.0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-amber-600 dark:text-amber-400">
                  <span className="text-base">⚠️</span>
                  <div>
                    <div className="text-xs font-bold">Atenção ao contraste ({worstContrast.toFixed(1)}:1)</div>
                    <div className="text-[11px] opacity-90">
                      O contraste está baixo {getProblemArea()}. Pode haver dificuldade de leitura em ambientes escuros.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-rose-600 dark:text-rose-400">
                  <span className="text-base">🚨</span>
                  <div>
                    <div className="text-xs font-bold">Risco alto de falha ({worstContrast.toFixed(1)}:1)</div>
                    <div className="text-[11px] opacity-90">
                      O contraste está crítico {getProblemArea()}. A maioria dos celulares não vai conseguir escanear.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <button
                onClick={handleDownloadPNG}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition text-sm"
              >
                ↓ PNG ({exportSize}px)
              </button>
              <button
                onClick={() => qrCodeRef.current?.download({ extension: 'svg', name: 'qrcode' })}
                className={`py-3 px-4 border font-semibold rounded-xl transition text-sm ${
                  isDarkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                ↓ SVG
              </button>
            </div>

            <button
              onClick={saveToHistory}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition text-sm"
            >
              💾 Salvar Configuração
            </button>
          </div>

          {history.length > 0 && (
            <div className={`border rounded-2xl p-6 shadow-sm transition-colors ${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'
            }`}>
              <h4 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Histórico Salvo</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreConfig(item)}
                    className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition text-xs ${
                      isDarkMode
                        ? 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                        : 'bg-slate-50 border-slate-100 hover:bg-indigo-50/50 text-slate-700'
                    }`}
                  >
                    <span className="font-medium truncate max-w-[180px]">{item.text}</span>
                    <span className="text-slate-400">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
