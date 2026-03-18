import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const HealthTrendChart = ({ history }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-orange-50 h-full flex flex-col" id="health-trend-card">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
          건강 지수 추이
          <span className="text-[10px] font-black tracking-widest text-white bg-slate-900 px-2 py-0.5 rounded-full uppercase">Monthly</span>
        </h2>
      </div>
      
      <div className="flex-1 w-full" style={{ height: '280px' }}>
        {history && history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={history}
              onClick={() => navigate('/report')}
              style={{ cursor: 'pointer' }}
              margin={{ top: 10, right: 90, left: 5, bottom: 10 }}
            >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: '#64748b', fontWeight: 800 }}
              dy={15}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800 }}
              domain={[40, 100]}
              ticks={[40, 50, 60, 70, 80, 90, 100]}
              dx={-15}
            />
            
            {/* 기준 선 - 라벨 가이드 보강 */}
            <ReferenceLine 
                y={80} 
                stroke="#0d9488" 
                strokeDasharray="4 4" 
                strokeOpacity={0.3}
                label={{ position: 'right', value: '우수 (High)', fill: '#0d9488', fontSize: 11, fontWeight: 900, offset: 15 }} 
            />
            <ReferenceLine 
                y={60} 
                stroke="#f59e0b" 
                strokeDasharray="4 4" 
                strokeOpacity={0.3}
                label={{ position: 'right', value: '보통 (Stable)', fill: '#f59e0b', fontSize: 11, fontWeight: 900, offset: 15 }} 
            />

            <Tooltip 
              contentStyle={{ 
                borderRadius: '20px', 
                border: 'none', 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                fontSize: '13px',
                padding: '12px 16px',
                fontWeight: 'bold'
              }}
              cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
              itemStyle={{ color: '#0d9488' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#0d9488" 
              strokeWidth={5} 
              dot={{ r: 6, fill: '#fff', strokeWidth: 3, stroke: '#0d9488' }}
              activeDot={{ r: 9, strokeWidth: 0, fill: '#0d9488' }}
              animationDuration={2000}
            />
          </LineChart>
        </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-300 font-bold bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
            데이터 수집 중...
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthTrendChart;
