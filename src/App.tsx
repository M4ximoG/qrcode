import React, { useState, useEffect, useRef } from 'react';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType, ErrorCorrectionLevel } from 'qr-code-styling';

export default function App() {
  const [text, setText] = useState('https://example.com');
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isTransparent, setIsTransparent] = useState(false);
  const [errorCorrection, setErrorCorrection] = useState<ErrorCorrectionLevel>('H');
  const [logo, setLogo] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(20);
  const [exportSize, setExportSize] = useState(1024);

  // Novos estados para personalização visual
  const [dotType, setDotType] = useState<DotType>('dots');
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>('extra-rounded');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('dot');

  const ref = useRef<HTMLDivElement>(null);
  const [qrCode] = useState<QRCodeStyling>(
    new QRCodeStyling({
      width: 300,
      height: 300,
      type: 'svg',
    })
  );

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = '';
      qrCode.append(ref.current);
    }
  }, [ref]);

  useEffect(() => {
    qrCode.update({
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
  }, [text, fgColor, bgColor, isTransparent, logo, logoSize, errorCorrection, dotType, cornerSquareType, cornerDotType]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center font-sans">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">QR Code Generator</h1>
      <p className="text-slate-500 mb-6">Gere QR Codes personalizados com formatos e estilo de bolinha</p>

      <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Painel de Controles */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Texto ou URL</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Formato dos Pontos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Formato do Corpo</label>
            <select
              value={dotType}
              onChange={(e) => setDotType(e.target.value as DotType)}
              className="w-full p-2 border rounded-md"
            >
              <option value="dots">Bolinhas (Dots)</option>
              <option value="rounded">Arredondado</option>
              <option value="classy">Classy</option>
              <option value="square">Quadrado Padrão</option>
              <option value="extra-rounded">Extra Arredondado</option>
            </select>
          </div>

          {/* Moldura dos Olhos */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Borda dos Olhos</label>
            <select
              value={cornerSquareType}
              onChange={(e) => setCornerSquareType(e.target.value as CornerSquareType)}
              className="w-full p-2 border rounded-md"
            >
              <option value="extra-rounded">Arredondada</option>
              <option value="dot">Circulo</option>
              <option value="square">Quadrada</option>
            </select>
          </div>

          {/* Cores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cor do Código</label>
              <input
                type="color"
                value={fgColor}
                onChange={(e) => setFgColor(e.target.value)}
                className="w-full h-10 p-1 border rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cor do Fundo</label>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                disabled={isTransparent}
                className="w-full h-10 p-1 border rounded-md cursor-pointer disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="transparent"
              checked={isTransparent}
              onChange={(e) => setIsTransparent(e.target.checked)}
            />
            <label htmlFor="transparent" className="text-sm font-medium text-slate-700">Fundo transparente</label>
          </div>

          {/* Upload de Logo */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Logo Central (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full text-sm" />
          </div>
        </div>

        {/* Visualização e Exportação */}
        <div className="flex flex-col items-center justify-center border-l pl-0 md:pl-8">
          <div
            ref={ref}
            className={`p-4 rounded-lg mb-6 ${isTransparent ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]' : ''}`}
          />

          <div className="flex gap-4 w-full">
            <button
              onClick={() => qrCode.download({ extension: 'png', name: 'qrcode', width: exportSize, height: exportSize })}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-md font-medium hover:bg-indigo-700 transition"
            >
              Baixar PNG
            </button>
            <button
              onClick={() => qrCode.download({ extension: 'svg', name: 'qrcode' })}
              className="flex-1 bg-slate-800 text-white py-2 rounded-md font-medium hover:bg-slate-900 transition"
            >
              Baixar SVG
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
