import React, { useState, useEffect, useRef } from 'react';

type DotType = 'dots' | 'rounded' | 'classy' | 'square' | 'extra-rounded';
type CornerSquareType = 'dot' | 'square' | 'extra-rounded';
type CornerDotType = 'dot' | 'square';
type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

interface HistoryItem {
  id: string;
  text: string;
  fgColor: string;
  bgColor: string;
  isTransparent: boolean;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  date: string;
}

export default function App() {
  const [text, setText] = useState('https://example.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isTransparent, setIsTransparent] = useState(false);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('H');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [exportSize, setExportSize] = useState<number>(1024);

  // Seleção de Formatos (Shape Customization)
  const [dotType, setDotType] = useState<DotType>('dots');
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('dot');

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<any>(null);

  // Inicializa o QR Code Styling dinamicamente
  useEffect(() => {
    import('qr-code-styling').then((module) => {
      const QRCodeStyling = module.default;
      qrCodeRef.current = new QRCodeStyling({
        width: 320,
        height: 320,
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
        color: fgColor,
        type: dotType,
      },
      backgroundOptions: {
        color: isTransparent ? 'transparent' : bgColor,
      },
      cornersSquareOptions: {
        color: fgColor,
        type: cornerSquareType,
      },
      cornersDotOptions: {
        color: fgColor,
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
  }, [text, fgColor, bgColor, isTransparent, logo, logoSize, errorCorrection, dotType, cornerSquareType, cornerDotType]);

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

  const saveToHistory = () => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      text,
      fgColor,
      bgColor,
      isTransparent,
      dotType,
      cornerSquareType,
      cornerDotType,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newItem, ...history.slice(0, 9)];
    setHistory(updated);
    localStorage.setItem('qr-code-history', JSON.stringify(updated));
  };

  const restoreConfig = (item: HistoryItem) => {
    setText(item.text);
    setFgColor(item.fgColor);
    setBgColor(item.bgColor);
    setIsTransparent(item.isTransparent);
    setDotType(item.dotType);
    setCornerSquareType(item.cornerSquareType);
    setCornerDotType(item.cornerDotType);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans p-4 md:p-10">
      {/* Cabeçalho Original */}
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">QR Code Generator</h1>
        <p className="text-slate-500 mt-2 text-lg">Gere QR Codes personalizados com logo, cores e fundo transparente</p>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Painel Esquerdo de Configuração */}
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

          {/* CUSTOMIZE DESIGN (BODY, EYE FRAME, EYE BALL) */}
          <div className="border-t border-slate-100 pt-5 space-y-5">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 uppercase">Personalizar Design</h3>

            {/* Body Shape */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Body Shape (Formato do Corpo)</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'dots', label: '● Bolinhas' },
                  { id: 'rounded', label: 'Arredondado' },
                  { id: 'extra-rounded', label: 'Extra Arr.' },
                  { id: 'classy', label: 'Classy' },
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

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cor do código</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full bg-transparent text-sm font-mono focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Cor do fundo</label>
              <div className={`flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-xl ${isTransparent ? 'opacity-40' : ''}`}>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={isTransparent}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0 bg-transparent"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={isTransparent}
                  className="w-full bg-transparent text-sm font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Switch Fundo Transparente */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-sm font-medium text-slate-700">Fundo transparente</span>
            <input
              type="checkbox"
              checked={isTransparent}
              onChange={(e) => setIsTransparent(e.target.checked)}
              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {/* Resolução */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Resolução do PNG</label>
            <p className="text-xs text-slate-400 mb-2">Tamanho em pixels do arquivo PNG exportado</p>
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
                  {size}
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

        {/* Painel Direito de Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm flex flex-col items-center">
            
            {/* Box Preview */}
            <div
              className={`p-4 rounded-2xl border border-slate-100 shadow-inner mb-6 flex items-center justify-center min-h-[320px] w-full ${
                isTransparent
                  ? 'bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:12px_12px]'
                  : 'bg-slate-50'
              }`}
            >
              <div ref={ref} />
            </div>

            {/* Botões de Ação */}
            <div className="grid grid-cols-2 gap-3 w-full mb-3">
              <button
                onClick={() => handleDownload('png')}
                className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2 text-sm"
              >
                ↓ PNG
              </button>
              <button
                onClick={() => handleDownload('svg')}
                className="py-3 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                ↓ SVG
              </button>
            </div>

            <button
              onClick={saveToHistory}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2 text-sm mb-2"
            >
              💾 Salvar Configuração
            </button>

            <span className="text-xs text-slate-400">
              PNG: {exportSize}×{exportSize}px • SVG: vetorial escalável
            </span>
          </div>

          {/* Histórico salvo */}
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
