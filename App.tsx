
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// --- Internal Components to ensure build stability and prevent 404s ---

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ label, value, subtext, trend, color = 'blue' }) => {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-500/30 text-blue-400',
    emerald: 'border-emerald-500/30 text-emerald-400',
    rose: 'border-rose-500/30 text-rose-400',
    amber: 'border-amber-500/30 text-amber-400',
    zinc: 'border-zinc-700 text-zinc-400',
  };

  return (
    <div className={`bg-zinc-900/50 border rounded-xl p-5 flex flex-col justify-between ${colorMap[color] || colorMap.zinc}`}>
      <div>
        <p className="text-xs uppercase tracking-wider font-semibold text-zinc-500 mb-1">{label}</p>
        <h3 className="text-2xl font-bold mono text-zinc-100">{value}</h3>
      </div>
      {subtext && (
        <div className="mt-3 flex items-center gap-2">
          {trend === 'up' && <span className="text-emerald-500 text-xs">▲</span>}
          {trend === 'down' && <span className="text-rose-500 text-xs">▼</span>}
          <span className="text-xs text-zinc-500 font-medium">{subtext}</span>
        </div>
      )}
    </div>
  );
};

interface InputFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  type?: 'currency' | 'percent' | 'number';
  step?: number;
  min?: number;
  tooltip?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = 'number', step = 1, min = 0, tooltip }) => {
  const prefix = type === 'currency' ? '£' : '';
  const suffix = type === 'percent' ? '%' : '';
  const displayValue = value === 0 ? '' : value;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(0);
    } else {
      const parsed = parseFloat(val);
      onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-zinc-400">{label}</label>
        {tooltip && (
          <div className="group relative">
            <span className="cursor-help text-zinc-600 text-[10px] border border-zinc-700 rounded-full w-4 h-4 flex items-center justify-center">?</span>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block w-48 p-2 bg-zinc-800 text-[11px] text-zinc-300 rounded shadow-xl border border-zinc-700 z-50">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative group">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{prefix}</span>}
        <input
          type="number"
          value={displayValue}
          step={step}
          min={min}
          onChange={handleChange}
          className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 text-zinc-100 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm">{suffix}</span>}
      </div>
    </div>
  );
};

// --- Power Options ---
const POWER_OPTIONS = [
  { id: '16s', name: '16amp single phase', price: 431.62 },
  { id: '32s', name: '32amp single phase', price: 821.45 },
  { id: '64s', name: '64amp single phase', price: 1502.02 },
  { id: '32t', name: '32amp three phase', price: 2117.71 },
  { id: '64t', name: '64amp three phase', price: 3160.96 },
  { id: '125t', name: '125amp three phase', price: 4422.67 },
];

// --- Main Application ---

const INITIAL_CONFIG = {
  menuItems: [
    { id: '3', name: 'Entry Item', price: 5.00, unitsSold: 1000, unitRatio: 1000, costPerPortion: 1.50 },
    { id: '1', name: 'Standard Item', price: 12.50, unitsSold: 2000, unitRatio: 2000, costPerPortion: 3.50 },
    { id: '2', name: 'Premium Item', price: 17.50, unitsSold: 750, unitRatio: 750, costPerPortion: 5.00 }
  ],
  totalVisitors: 60000,
  commissionRate: 25,
  mileage: 150,
  costPerMile: 0.45,
  vanRental: 350,
  staffCount: 5,
  staffDayRate: 150,
  eventDays: 3,
  accommodationCost: 0,
  fuelCost: 150,
  selectedPowerIds: [] as string[],
  potentialLeads: 100,
  leadValue: 25,
  brandMediaValue: 1250,
};

const App: React.FC = () => {
  const [config, setConfig] = useState(INITIAL_CONFIG);
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Sync units sold when total visitors change
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => ({
        ...item,
        unitsSold: Math.round((item.unitRatio || 0) * (prev.totalVisitors / 60000))
      }))
    }));
  }, [config.totalVisitors]);

  const analysis = useMemo(() => {
    const directRevenue = config.menuItems.reduce((acc, item) => acc + (item.price * item.unitsSold), 0);
    const totalIngredientsCost = config.menuItems.reduce((acc, item) => acc + (item.costPerPortion * item.unitsSold), 0);
    const totalTransactions = config.menuItems.reduce((acc, item) => acc + item.unitsSold, 0);
    const penetrationRate = (totalTransactions / config.totalVisitors) * 100;
    
    // Pitch Fee using editable commission rate
    const pitchFee = directRevenue * (config.commissionRate / 100);
    
    // Staffing
    const staffTotal = (config.staffCount || 0) * (config.staffDayRate || 0) * (config.eventDays || 0);
    
    // Logistics
    const logisticsTotal = ((config.mileage || 0) * (config.costPerMile || 0)) + (config.vanRental || 0);
    
    // Power Costs
    const powerCosts = config.selectedPowerIds.reduce((sum, id) => {
      const option = POWER_OPTIONS.find(opt => opt.id === id);
      return sum + (option?.price || 0);
    }, 0);

    const totalOperatingCosts = staffTotal + logisticsTotal + pitchFee + (config.accommodationCost || 0) + totalIngredientsCost + (config.fuelCost || 0) + powerCosts;
    const totalPipelineValue = (config.potentialLeads || 0) * (config.leadValue || 0);
    const netProfit = directRevenue - totalOperatingCosts;
    const totalAssetValue = netProfit + totalPipelineValue + (config.brandMediaValue || 0);
    const roiPercentage = totalOperatingCosts > 0 ? (netProfit / totalOperatingCosts) * 100 : 0;

    return {
      directRevenue,
      totalTransactions,
      penetrationRate,
      pitchFee,
      powerCosts,
      totalIngredientsCost,
      totalOperatingCosts,
      netProfit,
      totalAssetValue,
      totalPipelineValue,
      roiPercentage,
      revenueBreakdown: config.menuItems.map(item => ({
        name: `${item.name} (£${item.price})`,
        value: item.price * item.unitsSold
      })),
      costBreakdown: [
        { name: `Pitch Fee (${config.commissionRate}%)`, value: pitchFee },
        { name: 'Staffing', value: staffTotal },
        { name: 'Ingredients', value: totalIngredientsCost },
        { name: 'Logistics/Van', value: logisticsTotal + (config.accommodationCost || 0) },
        { name: 'Power/Fuel', value: (config.fuelCost || 0) + powerCosts },
      ]
    };
  }, [config]);

  const addMenuItem = () => {
    const newItem = {
      id: Date.now().toString(),
      name: `Menu Item ${config.menuItems.length + 1}`,
      price: 0,
      unitsSold: 0,
      unitRatio: 0,
      costPerPortion: 0
    };
    setConfig(prev => ({ ...prev, menuItems: [...prev.menuItems, newItem] }));
  };

  const updateMenuItem = (id: string, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      menuItems: prev.menuItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'unitsSold') {
            updated.unitRatio = value / (config.totalVisitors / 60000);
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const removeMenuItem = (id: string) => {
    setConfig(prev => ({ ...prev, menuItems: prev.menuItems.filter(item => item.id !== id) }));
  };

  const togglePower = (id: string) => {
    setConfig(prev => {
      const isSelected = prev.selectedPowerIds.includes(id);
      return {
        ...prev,
        selectedPowerIds: isSelected 
          ? prev.selectedPowerIds.filter(pid => pid !== id)
          : [...prev.selectedPowerIds, id]
      };
    });
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(reportRef.current!, { scale: 2, useCORS: true, backgroundColor: '#0a0a0b' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        pdf.save('FUME-Trader-ROI-Analysis.pdf');
      } catch (e) { console.error(e); } finally { setIsExporting(false); }
    }, 100);
  };

  const COLORS = ['#f97316', '#fb923c', '#fdba74', '#94a3b8', '#64748b', '#475569'];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#f4f4f5] font-sans" ref={reportRef}>
      <div className="relative h-64 overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=2000" 
          alt="Festival Crowd" 
          className="w-full h-full object-cover opacity-40 grayscale"
        />
        <div className="absolute bottom-8 left-8 z-20 flex justify-between items-end w-[calc(100%-64px)]">
          <div>
            <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">FUME <span className="text-orange-500">Trader ROI</span></h1>
            <p className="text-zinc-400 font-medium uppercase tracking-widest mt-1">Event Performance & Asset Value Command Center</p>
          </div>
          <button 
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="no-print bg-transparent border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-2.5 rounded-full font-bold uppercase tracking-wider text-xs transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? 'Generating...' : 'Download PDF Report'}
          </button>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 -mt-10 relative z-30">
        <aside className="lg:col-span-4 space-y-6 no-print">
          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm uppercase tracking-widest font-bold text-orange-500 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
              Event Setup
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-zinc-400">Total Visitors:</span>
                <span className="text-orange-500 font-bold font-mono">{config.totalVisitors.toLocaleString()}</span>
              </div>
              <input 
                type="range" min="30000" max="90000" step="5000"
                value={config.totalVisitors}
                onChange={(e) => setConfig({...config, totalVisitors: parseInt(e.target.value)})}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-600 font-bold uppercase">
                <span>30k</span>
                <span>60k</span>
                <span>90k</span>
              </div>
              
              <div className="mt-6">
                <InputField 
                  label="Revenue Commission (%)" 
                  value={config.commissionRate} 
                  onChange={(v) => setConfig({...config, commissionRate: v})} 
                  type="percent"
                  tooltip="The percentage of direct sales revenue taken as a pitch fee."
                />
                <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                  A £2000 deposit will be needed to confirm your place. This is credited at the end of the event.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm uppercase tracking-widest font-bold text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                Menu Forecast
              </h2>
              <button onClick={addMenuItem} className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-2 py-1 rounded hover:bg-emerald-500/20 transition-all font-bold uppercase">
                Add Item
              </button>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {config.menuItems.map((item) => (
                <div key={item.id} className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 relative group">
                  <button onClick={() => removeMenuItem(item.id)} className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                  <input 
                    className="w-full bg-transparent text-sm font-bold text-zinc-100 mb-2 border-b border-zinc-800 focus:border-emerald-500 outline-none pb-1"
                    value={item.name}
                    onChange={(e) => updateMenuItem(item.id, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="Price" value={item.price} onChange={(v) => updateMenuItem(item.id, 'price', v)} type="currency" />
                    <InputField label="Units Sold" value={item.unitsSold} onChange={(v) => updateMenuItem(item.id, 'unitsSold', v)} />
                    <div className="col-span-2">
                      <InputField label="Cost Per Portion" value={item.costPerPortion} onChange={(v) => updateMenuItem(item.id, 'costPerPortion', v)} type="currency" step={0.1} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm uppercase tracking-widest font-bold text-rose-500 flex items-center gap-2">
              <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
              Operations & Logistics
            </h2>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-bold mt-1 mb-6">
              Waste, Water and Camping Pitch Included in Fee
            </p>
            <div className="space-y-4">
              <InputField label="Staff Count" value={config.staffCount} onChange={(v) => setConfig({...config, staffCount: v})} />
              <InputField label="Staff Day Rate" value={config.staffDayRate} onChange={(v) => setConfig({...config, staffDayRate: v})} type="currency" />
              <InputField label="Cooking Fuel/Gas" value={config.fuelCost} onChange={(v) => setConfig({...config, fuelCost: v})} type="currency" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Mileage" value={config.mileage} onChange={(v) => setConfig({...config, mileage: v})} />
                <InputField label="Cost/Mile" value={config.costPerMile} onChange={(v) => setConfig({...config, costPerMile: v})} step={0.01} />
              </div>
              <InputField label="Van Rental" value={config.vanRental} onChange={(v) => setConfig({...config, vanRental: v})} type="currency" />
              
              <div className="mt-6 border-t border-zinc-800 pt-6">
                <label className="text-sm font-bold text-zinc-400 block mb-3 uppercase tracking-wider">Power Recharge Options</label>
                <div className="grid grid-cols-1 gap-2">
                  {POWER_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => togglePower(opt.id)}
                      className={`flex justify-between items-center p-3 rounded-xl border transition-all text-left group ${
                        config.selectedPowerIds.includes(opt.id)
                          ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold uppercase ${config.selectedPowerIds.includes(opt.id) ? 'text-orange-500' : 'text-zinc-400'}`}>
                          {opt.name}
                        </span>
                        <span className="text-[10px] mono">£{opt.price.toLocaleString()}</span>
                      </div>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        config.selectedPowerIds.includes(opt.id) ? 'bg-orange-500 border-orange-500' : 'border-zinc-700'
                      }`}>
                        {config.selectedPowerIds.includes(opt.id) && <span className="text-white text-[10px]">✓</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </aside>

        <main className="lg:col-span-8 space-y-8 print:col-span-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard label="Direct Revenue" value={`£${analysis.directRevenue.toLocaleString()}`} color="emerald" trend="up" />
            <SummaryCard label="Pitch Fee" value={`£${analysis.pitchFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="rose" />
            <SummaryCard label="Net Profit" value={`£${analysis.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} color="blue" />
            <SummaryCard label="Trader ROI" value={`${analysis.roiPercentage.toFixed(1)}%`} color="zinc" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-6">Revenue Mix</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analysis.revenueBreakdown}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                      paddingAngle={5} dataKey="value" labelLine={false}
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {analysis.revenueBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ReTooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => `£${val.toLocaleString()}`}
                    />
                    <Legend verticalAlign="bottom" height={36} formatter={(value) => <span style={{ color: '#ffffff', fontSize: '12px' }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-lg font-bold text-zinc-100 mb-6">Cost Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analysis.costBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#fff" fontSize={11} width={100} />
                    <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                    <ReTooltip 
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(val: number) => `£${val.toLocaleString()}`}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl no-print">
            <h2 className="text-lg font-bold text-zinc-100 mb-6 leading-tight">Post-Event Brand & Pipeline Value Forecast</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField label="Potential Restaurant Visitors" value={config.potentialLeads} onChange={(v) => setConfig({...config, potentialLeads: v})} tooltip="Visitors expected in the 3 months following FUME." />
              <InputField label="Visitor LTV" value={config.leadValue} onChange={(v) => setConfig({...config, leadValue: v})} type="currency" tooltip="Estimated average value per visitor." />
              <InputField label="Brand exposure value" value={config.brandMediaValue} onChange={(v) => setConfig({...config, brandMediaValue: v})} type="currency" tooltip="The value of influencer and festival marketing equity." />
            </div>
          </section>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
              <h3 className="text-sm uppercase tracking-widest font-bold text-zinc-400">Profit & Loss Summary</h3>
              <div className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                Penetration: {analysis.penetrationRate.toFixed(1)}% of {config.totalVisitors.toLocaleString()} Visitors
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800 text-zinc-300">
                <span>Gross Direct Sales Revenue</span>
                <span className="font-bold text-emerald-400">£{analysis.directRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800 text-zinc-400">
                <span>Pitch Fee ({config.commissionRate}% Commission)</span>
                <span className="text-rose-500">-£{analysis.pitchFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800 text-zinc-400">
                <span>Power Recharge Costs ({config.selectedPowerIds.length} Selected)</span>
                <span className="text-rose-500">-£{analysis.powerCosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800 text-zinc-400">
                <span>Other Operating Expenses (Staff, Logistics, Ingredients)</span>
                <span className="text-rose-500">-£{(analysis.totalOperatingCosts - analysis.pitchFee - analysis.powerCosts).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center py-4 text-2xl border-b border-zinc-800">
                <span className="font-bold text-zinc-100">Event Net Profit</span>
                <span className={`font-black ${analysis.netProfit >= 0 ? 'text-blue-500' : 'text-rose-600'}`}>
                  £{analysis.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="pt-4 pb-2 text-xs uppercase tracking-widest text-zinc-500 font-bold">Post-Event Asset Value</div>
              <div className="flex justify-between items-center py-2 text-zinc-400 text-sm italic border-b border-zinc-800/30">
                <span>Restaurant Pipeline Value (Leads × LTV)</span>
                <span>+£{analysis.totalPipelineValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-zinc-400 text-sm italic border-b border-zinc-800/30">
                <span>Brand & Media Equity Value</span>
                <span>+£{(config.brandMediaValue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-4 text-xl bg-zinc-950/30 px-4 -mx-4 rounded-xl mt-4">
                <span className="font-black text-orange-500">Total Asset Value Before Costs (Net Profit + Post-Event Value)</span>
                <span className="font-black text-orange-500">
                  £{analysis.totalAssetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="mt-20 border-t border-zinc-800 relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0b] to-transparent z-10" />
        <img 
          src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=2000" 
          alt="Grilled Meat" 
          className="w-full h-full object-cover opacity-30 grayscale"
        />
        <div className="absolute bottom-10 left-0 right-0 z-20 text-center text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-bold">
          FUME • STATE FAYRE 2026
        </div>
      </footer>
    </div>
  );
};

export default App;
