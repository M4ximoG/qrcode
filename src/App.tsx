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
  const [bodyColor, setBodyColor] = useState('#5900ff');
  const [eyeFrameColor, setEyeFrameColor] = useState('#ff0000');
  const [eyeBallColor, setEyeBallColor] = useState('#00ffbf');
  const [bgColor, setBgColor] = useState('#e27373');
  const [isTransparent, setIsTransparent] = useState(false);
  
  // Customizações de Borda e Margem do Fundo
  const [marginSize, setMarginSize] = useState<number>(10);
  const [borderRadius, setBorderRadius] = useState<number>(20);

  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('H');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [exportSize, setExportSize] = useState<number>(1024);

  // Formatos (Shapes)
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
        color: isTransparent ? 'transparent' : bgColor,
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
  }, [text, bodyColor, eyeFrameColor, eyeBallColor, bgColor, isTransparent, logo, logoSize, errorCorrection, dotType, cornerSquareType, cornerDotType]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (extension: 'png' | 'svg') => {
    if (!qrCodeRef.current) return;
    qrCodeRef.current.download({
      extension,
      name: 'qrcode',
      width: exportSize,
      height: exportSize,
    });
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
    setMarginSize(item.marginSize ?? 10);
    setBorderRadius(item.borderRadius ?? 20);
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

          {/* CUSTOMIZAÇÃO DO CONTAINER DO FUNDO */}
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
                  max="40"
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
                  max="50"
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

        {/* Painel Direito (Preview Sticky / Acompanha Scroll) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col items-center">
            
            {/* Box de Preview com Margem e Border Radius Aplicados */}
            <div
              className={`mb-6 flex items-center justify-center min-h-[320px] w-full transition-all ${
                isTransparent
                  ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px]'
                  : 'shadow-sm'
              }`}
              style={{
                backgroundColor: isTransparent ? 'transparent' : bgColor,
                padding: `${marginSize}px`,
                borderRadius: `${borderRadius}px`,
              }}
            >
              <div ref={ref} className="overflow-hidden flex items-center justify-center" />
            </div>

            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <button
                onClick={() => handleDownload('png')}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition text-sm"
              >
                ↓ PNG
              </button>
              <button
                onClick={() => handleDownload('svg')}
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
