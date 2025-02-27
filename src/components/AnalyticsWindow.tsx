import React, { useState, useMemo } from 'react';
import { BarChart2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { CumulativeTokenAnalytics } from '@/types/models/analytics';

interface AnalyticsWindowProps {
  analytics: CumulativeTokenAnalytics | null;
  visible: boolean;
}

export default function AnalyticsWindow({ analytics, visible }: AnalyticsWindowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const costEstimate = useMemo(() => {
    if (!analytics) return "0.0000";
    
    const rates: Record<string, number> = {
      'openai': 0.002,
      'anthropic': 0.0015,
      'google': 0.001,
      'deepseek': 0.0008,
      'grok': 0.002
    };
    
    const rate = rates[analytics.provider.toLowerCase()] || 0;
    return ((analytics.cumulativeTotalTokens / 1000) * rate).toFixed(4);
  }, [analytics]);

  if (!visible || !analytics) return null;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const tooltips = {
    promptTokens: "Number of tokens used in your input prompts, including system prompts and context (cumulative across all interactions).",
    responseTokens: "Number of tokens generated in AI responses, including code and explanations (cumulative across all interactions).",
    totalTokens: "Total tokens used across all interactions (cumulative prompt + response tokens).",
    capacity: "Current utilization of the model's maximum token capacity based on cumulative usage."
  };

  const renderTooltip = (text: string) => (
    <div className="absolute left-full top-0 z-50 ml-2 w-48 rounded-md bg-gray-900 p-2 text-sm text-white shadow-lg">
      {text}
    </div>
  );

  return (
    <div className="fixed left-[0px] top-[35px] z-50">
      {/* Collapsed Tab */}
      <div 
        className={`transform transition-all duration-300 ${ isExpanded ? 'invisible' : 'visible' }`}
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex h-24 cursor-pointer items-center rounded-r-lg border border-white/30 bg-white/10 shadow-lg backdrop-blur-[2px] hover:bg-white/25">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="h-10 w-6 relative">
              <span className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-90deg] whitespace-nowrap text-sm font-semibold tracking-wide">
                Tokens
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-white-100" />
          </div>
        </div>
      </div>

      {/* Expanded Panel */}
      <div
        className={`absolute left-0 w-96 transform rounded-r-lg border border-white/30 bg-white/10 p-4 shadow-lg backdrop-blur-[2px] transition-all duration-300 ${
          isExpanded 
            ? 'pointer-events-auto translate-x-0 opacity-100' 
            : 'pointer-events-none translate-x-[-100%] opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-white-800">Token Analytics</h3>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="rounded-full p-1 hover:bg-gray-200"
          >
            <ChevronLeft className="h-5 w-5 text-white-600" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Model Info */}
          <div className="rounded-lg bg-white/30 p-3">
            <p className="text-base font-semibold text-gray-200">
              {analytics.modelName}
              <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-sm font-medium text-orange-800">
                {analytics.provider}
              </span>
            </p>
          </div>

          {/* Token Breakdown */}
          <div className="space-y-3">
            {/* Prompt Tokens */}
            <div 
              className="group relative rounded-lg bg-white/30 p-3"
              onMouseEnter={() => setShowTooltip('promptTokens')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-200">Prompt Tokens</p>
                  <AlertCircle className="h-4 w-4 text-gray-70" />
                </div>
                <div className="text-right">
                  <p className="text-base font-medium text-gray-100">
                    {formatNumber(analytics.cumulativePromptTokens)}
                  </p>
                  <p className="text-sm text-gray-100">
                    (+{formatNumber(analytics.promptTokens)} last)
                  </p>
                </div>
              </div>
              {showTooltip === 'promptTokens' && renderTooltip(tooltips.promptTokens)}
            </div>

            {/* Response Tokens */}
            <div 
              className="group relative rounded-lg bg-white/30 p-3"
              onMouseEnter={() => setShowTooltip('responseTokens')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-200">Response Tokens</p>
                  <AlertCircle className="h-4 w-4 text-gray-70" />
                </div>
                <div className="text-right">
                  <p className="text-base font-medium text-gray-100">
                    {formatNumber(analytics.cumulativeResponseTokens)}
                  </p>
                  <p className="text-sm text-gray-100">
                    (+{formatNumber(analytics.responseTokens)} last)
                  </p>
                </div>
              </div>
              {showTooltip === 'responseTokens' && renderTooltip(tooltips.responseTokens)}
            </div>

            {/* Total Tokens */}
            <div 
              className="group relative rounded-lg bg-white/30 p-3"
              onMouseEnter={() => setShowTooltip('totalTokens')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-200">Total Tokens</p>
                  <AlertCircle className="h-4 w-4 text-gray-70" />
                </div>
                <div className="text-right">
                  <p className="text-base font-medium text-gray-100">
                    {formatNumber(analytics.cumulativeTotalTokens)}
                  </p>
                  <p className="text-sm text-gray-100">
                    (+{formatNumber(analytics.totalTokens)} last)
                  </p>
                </div>
              </div>
              {showTooltip === 'totalTokens' && renderTooltip(tooltips.totalTokens)}
              <p className="mt-1 text-sm text-gray-100">Estimated total cost: ${costEstimate}</p>
            </div>
          </div>

          {/* Capacity Visualization */}
          <div 
            className="relative rounded-lg bg-white/30 p-3"
            onMouseEnter={() => setShowTooltip('capacity')}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-semibold text-gray-200">Model Capacity</p>
              <AlertCircle className="h-4 w-4 text-gray-70" />
            </div>
            <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full transition-all duration-500 ${
                  parseFloat(analytics.utilizationPercentage) > 80 
                    ? 'bg-orange-500' 
                    : parseFloat(analytics.utilizationPercentage) > 60
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
                }`}
                style={{
                  width: `${Math.min(parseFloat(analytics.utilizationPercentage), 100)}%`,
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm text-gray-200">
              <span>{analytics.utilizationPercentage}% used</span>
              <span>{formatNumber(analytics.maxTokens)} max tokens</span>
            </div>
            {showTooltip === 'capacity' && renderTooltip(tooltips.capacity)}
          </div>
        </div>
      </div>
    </div>
  );
}