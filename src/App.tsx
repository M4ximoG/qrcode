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

export default function App() {
  const [text, setText] = useState('https://example.com');
  
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

  // Download com suavização de vetor ativada (Anti-aliasing de Alta Qualidade)
  const handleDownloadPNG = async () => {
    const module = await import('qr-code-styling');
    const QRCodeStyling = module.default;

    // Gera a instância na resolução nativa escolhida
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

      // Ativa suavização suave de curva para eliminar bordas de escada/pixeladas nas bolinhas
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scaleMargin = (marginSize / 300) * exportSize;
      const radiusScale = (borderRadius / 300) * exportSize;

      // Desenha fundo com bordas arredondadas
      if (!isTransparent) {
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(0, 0, exportSize, exportSize, radiusScale);
        ctx.fill();
      }

      // Desenha o código com curvas perfeitamente lisas
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-10">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">QR Code Generator</h1>
        <p className="text-slate-500 mt-2 text-lg">Gere QR Codes personalizados com formatos e cores individuais</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel Esquerdo */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          
          {/* Texto / URL */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Texto ou URL</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
              placeholder="https://example.com"
            />
          </div>

          {/* CUSTOMIZE DESIGN */}
          <div className="border-t border-slate-100 pt-5 space-y-5">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">1. Formatos (Shapes)</h3>

            {/* Body Shape */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Body Shape (Corpo)</label>
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eye Frame Shape */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Eye Frame Shape (Moldura do Olho)</label>
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Eye Ball Shape */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Eye Ball Shape (Centro do Olho)</label>
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
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600 font-bold shadow-sm'
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
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">2. Cores Individuais</h3>
              <button
                type="button"
                onClick={syncEyeColorsToBody}
                className="text-xs text-indigo-600 hover:underline font-medium"
              >
                Copiar cor do corpo para os olhos
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Cor do Corpo</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Moldura do Olho</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">Centro do Olho</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">Cor do Fundo</label>
              <div className={`flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl max-w-xs ${isTransparent ? 'opacity-40' : ''}`}>
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

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-sm font-medium text-slate-700">Fundo transparente</span>
              <input
                type="checkbox"
                checked={isTransparent}
                onChange={(e) => setIsTransparent(e.target.checked)}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* MARGEM E BORDAS DO FUNDO */}
          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">3. Margem e Bordas do Fundo</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                <label className="block text-xs font-semibold text-slate-600 mb-1">
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
          <div className="border-t border-slate-100 pt-5">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Resolução do PNG</label>
            <div className="grid grid-cols-4 gap-2">
              {[512, 1024, 2048, 4096].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setExportSize(size)}
                  className={`py-2 text-xs font-semibold rounded-xl border transition ${
                    exportSize === size
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Logo (opcional)</label>
            <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center block cursor-pointer hover:border-indigo-400 bg-slate-50/50 transition">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <span className="text-sm text-slate-500 font-medium">Clique para enviar uma imagem</span>
            </label>
          </div>
        </div>

        {/* Painel Direito (Preview Sticky) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col items-center">
            
            <div className="w-full flex items-center justify-center p-2 mb-6">
              <div
                className="transition-all flex items-center justify-center aspect-square max-w-[320px] w-full"
                style={{
                  backgroundColor: isTransparent ? 'transparent' : bgColor,
                  padding: `${marginSize}px`,
                  borderRadius: `${borderRadius}px`,
                  backgroundImage: isTransparent ? 'radial-gradient(#e2e8f0 1px, transparent 1px)' : 'none',
                  backgroundSize: '12px 12px'
                }}
              >
                <div ref={ref} className="flex items-center justify-center w-full h-full [&>canvas]:max-w-full [&>canvas]:h-auto" />
              </div>
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
                className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition text-sm"
              >
                ↓ SVG
              </button>
            </div>

            <button
              onClick={saveToHistory}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition text-sm mb-2"
            >
              💾 Salvar Configuração
            </button>
          </div>

          {history.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Histórico Salvo</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => restoreConfig(item)}
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-100 rounded-xl cursor-pointer transition text-xs"
                  >
                    <span className="font-medium text-slate-700 truncate max-w-[180px]">{item.text}</span>
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
