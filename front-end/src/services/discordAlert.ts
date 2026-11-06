/**
 * DotNexus Autonomous Discord Alert Client
 * Dispatches rich incident telemetry alerts directly to Discord Webhooks with
 * Token Bucket rate-limiting, timeout safety, and rich embed diagnostics.
 */

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordAlertOptions {
  webhookUrl: string;
  channel?: string;
  mention?: string;
  level?: 'P1_CRITICAL' | 'P2_WARNING' | 'INFO';
  title?: string;
  description?: string;
  fields?: DiscordEmbedField[];
  bestBlock?: number;
  deltaBlocks?: number;
  activeNode?: string;
}

export interface DiscordAlertResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

// Client-side Token Bucket Rate Limiter (Max 5 requests per 60 seconds)
class ClientWebhookRateLimiter {
  private tokens: number = 5;
  private maxTokens: number = 5;
  private refillRate: number = 5 / 60; // tokens per second
  private lastRefill: number = Date.now();

  allow(): boolean {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= 1.0) {
      this.tokens -= 1.0;
      return true;
    }
    return false;
  }
}

const clientLimiter = new ClientWebhookRateLimiter();

/**
 * Validates whether the given string is a valid Discord incoming webhook URL.
 */
export function isValidDiscordWebhookUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Valid Discord webhook format: https://discord.com/api/webhooks/<id>/<token>
  // or https://discordapp.com/api/webhooks/<id>/<token>
  const discordRegex = /^https:\/\/(?:discord\.com|discordapp\.com)\/api\/webhooks\/\d+\/[\w-]+$/i;
  return discordRegex.test(trimmed);
}

/**
 * Dispatches a rich embed alert payload to the user's configured Discord Webhook.
 */
export async function sendDiscordAlert(options: DiscordAlertOptions): Promise<DiscordAlertResult> {
  const url = options.webhookUrl?.trim();
  if (!isValidDiscordWebhookUrl(url)) {
    return {
      success: false,
      error: 'Invalid Webhook URL. Format must be: https://discord.com/api/webhooks/<id>/<token>',
    };
  }

  // Rate Limiter Check (Avoid Discord HTTP 429)
  if (!clientLimiter.allow()) {
    return {
      success: false,
      rateLimited: true,
      error: 'Alert dropped by Rate Limiter: Maximum 5 webhook alerts allowed per minute.',
    };
  }

  const level = options.level || 'P1_CRITICAL';
  const colorMap: Record<string, number> = {
    P1_CRITICAL: 0xef4444, // Bright Red
    P2_WARNING: 0xf59e0b,  // Amber
    INFO: 0x10b981,        // Emerald
  };
  const embedColor = colorMap[level] || 0x8b5cf6;

  const mentionPrefix = options.mention?.trim() ? `${options.mention.trim()} ` : '';
  const channelDisplay = options.channel?.trim() ? ` [${options.channel.trim()}]` : '';

  const defaultFields: DiscordEmbedField[] = [
    {
      name: 'Target Network',
      value: 'Portaldot V3.0 (Substrate WASM + EVM)',
      inline: true,
    },
    {
      name: 'EVM Chain ID',
      value: '420420777',
      inline: true,
    },
    {
      name: 'SS58 Prefix',
      value: '42 (POT Decimals: 14)',
      inline: true,
    },
  ];

  if (options.bestBlock !== undefined) {
    defaultFields.push({
      name: 'Best Block',
      value: `#${options.bestBlock.toLocaleString()}`,
      inline: true,
    });
  }

  if (options.deltaBlocks !== undefined) {
    defaultFields.push({
      name: 'Dual-VM Lag',
      value: `${options.deltaBlocks} blocks`,
      inline: true,
    });
  }

  if (options.activeNode) {
    defaultFields.push({
      name: 'Active Node',
      value: `\`${options.activeNode}\``,
      inline: true,
    });
  }

  const payload = {
    content: `${mentionPrefix}🚨 **[DotNexus SecOps] ${level} Alert${channelDisplay}**`,
    embeds: [
      {
        title: options.title || `Operational SecOps Incident: ${level}`,
        description:
          options.description ||
          'Automated security control plane triggered an urgent operational dispatch.',
        color: embedColor,
        fields: options.fields || defaultFields,
        footer: {
          text: 'DotNexus Visual Control Plane • Portaldot Network V3.0',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok || res.status === 204) {
      return { success: true };
    }

    const errText = await res.text().catch(() => '');
    return {
      success: false,
      error: `Discord API returned HTTP ${res.status}: ${errText || res.statusText}`,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err?.name === 'AbortError') {
      return {
        success: false,
        error: 'Discord Webhook connection timed out after 6 seconds.',
      };
    }
    return {
      success: false,
      error: err?.message || 'Network error while contacting Discord Webhook API.',
    };
  }
}
