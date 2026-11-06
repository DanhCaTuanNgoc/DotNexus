import React, { useState } from 'react';
import { X, Trash2, Sliders, ShieldAlert, CheckCircle2, Download, FileCode2, Bell, Send, Loader2, AlertTriangle } from 'lucide-react';
import { CanvasNode, SafetyIssue } from './types';
import { CATEGORY_THEMES } from './constants';
import { isValidDiscordWebhookUrl, sendDiscordAlert } from '../../services/discordAlert';

interface NodeInspectorProps {
  node: CanvasNode | null;
  issues: SafetyIssue[];
  onClose: () => void;
  onUpdateConfig: (nodeId: string, newConfig: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onExportCLI?: () => void;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  node,
  issues,
  onClose,
  onUpdateConfig,
  onDeleteNode,
  onExportCLI,
}) => {
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  if (!node) return null;

  const theme = CATEGORY_THEMES[node.data.category] || CATEGORY_THEMES.INFRA;
  const nodeIssues = issues.filter((i) => i.nodeId === node.id);

  const isDiscordNode =
    node.data.kind === 'discord_alert' ||
    node.data.label.toLowerCase().includes('discord') ||
    node.data.label.toLowerCase().includes('ops alert');

  const webhookUrl = String(node.data.config?.webhookUrl || node.data.config?.webhook || '');
  const isWebhookValid = isValidDiscordWebhookUrl(webhookUrl);

  const handleFieldChange = (key: string, value: string) => {
    const originalVal = node.data.config?.[key];
    let parsedVal: any = value;

    if (typeof originalVal === 'number') {
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') {
        parsedVal = num;
      }
    } else if (typeof originalVal === 'boolean') {
      if (value.toLowerCase() === 'true') parsedVal = true;
      else if (value.toLowerCase() === 'false') parsedVal = false;
    }

    onUpdateConfig(node.id, {
      ...node.data.config,
      [key]: parsedVal,
    });
  };

  const handleTestDiscordPing = async () => {
    if (!isWebhookValid) return;
    setTestStatus({ loading: true });

    const res = await sendDiscordAlert({
      webhookUrl: webhookUrl.trim(),
      channel: node.data.config?.channel || '#ops-alerts',
      level: node.data.config?.level || 'P1_CRITICAL',
      mention: node.data.config?.mention || '',
      title: 'DotNexus Control Plane: Webhook Connectivity Verification',
      description: 'Test ping dispatched successfully from Visual Automation Canvas. Discord notification channel is armed and operational.',
      bestBlock: 265200,
      deltaBlocks: 0,
      activeNode: 'dotnexus-primary-validator-01',
    });

    if (res.success) {
      setTestStatus({
        loading: false,
        success: true,
        message: 'Test alert delivered successfully to Discord!',
      });
    } else {
      setTestStatus({
        loading: false,
        success: false,
        message: res.error || 'Failed to deliver alert to Discord.',
      });
    }
  };

  return (
    <div className="w-full sm:w-80 h-full max-h-full absolute right-0 top-0 bottom-0 z-30 lg:relative lg:z-auto border-l border-[#1C142E] bg-[#08050F] flex flex-col justify-between p-4 shadow-2xl overflow-y-auto shrink-0 font-mono">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1C142E]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#8B5CF6]" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Node Inspector
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-1 hover:bg-[#110C1E] border border-transparent hover:border-[#1C142E] transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node Meta */}
        <div className="my-4 space-y-3">
          <div>
            <span className={`text-[9px] uppercase font-mono px-2 py-0.5 border font-bold ${theme.badgeBg}`}>
              {node.data.category}
            </span>
            <h3 className="text-sm font-mono font-bold text-white mt-1.5">{node.data.label}</h3>
            <p className="text-[11px] text-zinc-400 font-mono mt-0.5 leading-relaxed">
              {node.data.description}
            </p>
          </div>

          {/* Safety Status for this node */}
          {nodeIssues.length > 0 ? (
            <div className="p-3 border border-rose-800/60 bg-rose-950/40 space-y-1">
              <div className="flex items-center gap-1.5 text-rose-400 font-mono text-xs font-bold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Configuration Required</span>
              </div>
              {nodeIssues.map((issue) => (
                <div key={issue.id} className="text-[10px] text-zinc-300 font-mono leading-normal">
                  {issue.message}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2 border border-[#00FF9D]/30 bg-[#00FF9D]/10 flex items-center gap-2 text-xs font-mono text-[#00FF9D]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Topology Guard Verified</span>
            </div>
          )}

          {/* Dedicated Discord Webhook Configuration */}
          {isDiscordNode ? (
            <div className="space-y-3 pt-2 border-t border-[#1C142E]">
              <div className="flex items-center gap-1.5 text-[#C084FC] text-xs font-bold uppercase">
                <Bell className="w-3.5 h-3.5 text-[#8B5CF6]" />
                <span>Discord Webhook Config</span>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono text-zinc-300 font-bold">
                    Webhook URL <span className="text-rose-400">*</span>
                  </label>
                  {isWebhookValid ? (
                    <span className="text-[9px] text-[#00FF9D] font-bold">VALID</span>
                  ) : webhookUrl.length > 0 ? (
                    <span className="text-[9px] text-rose-400 font-bold">INVALID FORMAT</span>
                  ) : (
                    <span className="text-[9px] text-amber-400 font-bold">REQUIRED</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder="https://discord.com/api/webhooks/..."
                  value={webhookUrl}
                  onChange={(e) => handleFieldChange('webhookUrl', e.target.value)}
                  className={`w-full bg-[#06040A] border text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none transition-colors ${
                    isWebhookValid
                      ? 'border-[#00FF9D]/60 focus:border-[#00FF9D]'
                      : webhookUrl.length > 0
                      ? 'border-rose-500/80 focus:border-rose-500'
                      : 'border-amber-500/60 focus:border-[#8B5CF6]'
                  }`}
                />
                <p className="text-[9px] text-zinc-500 leading-normal">
                  Paste the incoming webhook URL generated from your Discord Channel Settings.
                </p>
              </div>

              {/* Channel Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 block">
                  Channel Identifier (Optional)
                </label>
                <input
                  type="text"
                  placeholder="#ops-alerts"
                  value={String(node.data.config?.channel || '#ops-alerts')}
                  onChange={(e) => handleFieldChange('channel', e.target.value)}
                  className="w-full bg-[#06040A] border border-[#1C142E] text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Alert Level / Severity */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 block">
                  Severity Level
                </label>
                <select
                  value={String(node.data.config?.level || 'P1_CRITICAL')}
                  onChange={(e) => handleFieldChange('level', e.target.value)}
                  className="w-full bg-[#06040A] border border-[#1C142E] text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="P1_CRITICAL">P1_CRITICAL (Red Embed)</option>
                  <option value="P2_WARNING">P2_WARNING (Amber Embed)</option>
                  <option value="INFO">INFO (Emerald Embed)</option>
                </select>
              </div>

              {/* Mention Target */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 block">
                  Mention Target (Optional)
                </label>
                <input
                  type="text"
                  placeholder="@everyone, @here or <@User_ID>"
                  value={String(node.data.config?.mention || '')}
                  onChange={(e) => handleFieldChange('mention', e.target.value)}
                  className="w-full bg-[#06040A] border border-[#1C142E] text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* Test Discord Ping Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!isWebhookValid || testStatus?.loading}
                  onClick={handleTestDiscordPing}
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-mono font-bold transition-all border ${
                    !isWebhookValid
                      ? 'border-[#1C142E] bg-[#0E0A1A] text-zinc-600 cursor-not-allowed'
                      : testStatus?.loading
                      ? 'border-[#8B5CF6] bg-[#1E1035] text-white cursor-wait'
                      : 'border-[#8B5CF6] bg-[#8B5CF6]/20 hover:bg-[#8B5CF6] hover:text-white text-[#C084FC] cursor-pointer shadow-md shadow-[#8B5CF6]/20'
                  }`}
                >
                  {testStatus?.loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test Ping...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test Alert to Discord</span>
                    </>
                  )}
                </button>

                {testStatus?.message && (
                  <div
                    className={`mt-2 p-2 text-[10px] font-mono leading-normal border flex items-start gap-1.5 ${
                      testStatus.success
                        ? 'border-[#00FF9D]/40 bg-[#00FF9D]/10 text-[#00FF9D]'
                        : 'border-rose-800/60 bg-rose-950/40 text-rose-300'
                    }`}
                  >
                    {testStatus.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    )}
                    <span>{testStatus.message}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard Parameter Configuration Form for other nodes */
            <div className="space-y-2.5 pt-2">
              <span className="text-[11px] font-mono text-[#C084FC] uppercase font-bold block">
                Parameter Configuration
              </span>

              {Object.entries(node.data.config || {}).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 capitalize block">
                    {key}
                  </label>
                  <input
                    type="text"
                    value={String(val)}
                    onChange={(e) => handleFieldChange(key, e.target.value)}
                    className="w-full bg-[#06040A] border border-[#1C142E] text-xs font-mono text-zinc-200 px-2.5 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
                  />
                </div>
              ))}

              {Object.keys(node.data.config || {}).length === 0 && (
                <div className="text-zinc-600 text-xs font-mono italic">
                  No configurable runtime parameters for this node.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action for Export CLI Node */}
      {onExportCLI && (node.data.kind === 'export_cli' || node.data.label.toLowerCase().includes('export')) && (
        <div className="mt-4 p-3 border border-[#00FF9D]/40 bg-[#0A1F18] space-y-2">
          <div className="text-xs font-mono font-bold text-[#00FF9D] flex items-center gap-1.5">
            <FileCode2 className="w-4 h-4 text-[#00FF9D]" />
            <span>Executable Standalone CLI</span>
          </div>
          <p className="text-[10px] text-zinc-300 font-mono leading-normal">
            Compiles active visual DAG topology into a standalone Linux/Ubuntu Python runner script.
          </p>
          <button
            type="button"
            onClick={onExportCLI}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono font-bold text-black bg-[#00FF9D] hover:bg-[#34D399] transition-colors cursor-pointer shadow-lg"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export & Download .py Runner</span>
          </button>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-4 border-t border-[#1C142E]">
        <button
          onClick={() => onDeleteNode(node.id)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono text-rose-400 border border-rose-800/60 bg-[#14080D] hover:bg-[#EF4444] hover:text-white transition-colors cursor-pointer font-bold"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Node from DAG</span>
        </button>
      </div>
    </div>
  );
};
